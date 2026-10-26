// Bootstraps a local dev session and starts watching docker changes:
// 1. node script/setup-env.js (fill .env placeholders/secrets).
// 2. node script/assign-ports.js (worktrees only: run on worktrees only; also syncs src/app/.env).
// 3. syncAppEnv (primary checkout only: copy .env to src/app/.env).
// 4. docker compose down (clean up).
// 5. docker compose up -d (start services), adding --build when src/app deps changed.
// 6. docker compose watch (watch and sync file changes in foreground).
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { syncAppEnv } = require('./lib/sync-app-env');
const { isLinkedWorktree } = require('./lib/git-dirs');
const { resolveBuild, recordDepsHash } = require('./lib/compose-build');

const REPO_ROOT = path.join(__dirname, '..');

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit' });
}

run('node script/setup-env.js');

if (isLinkedWorktree(REPO_ROOT)) {
  run('node script/assign-ports.js');
} else {
  syncAppEnv(REPO_ROOT, fs.readFileSync(path.join(REPO_ROOT, '.env'), 'utf8'));
  console.log("\nPrimary checkout — using default ports. Run 'npm run ports:assign <offset>' if you need alternate ports.");
}

const { build, reason, hash } = resolveBuild(REPO_ROOT, process.argv.slice(2));
if (reason) console.log(`\n${reason}`);
run('docker compose down');
run(`docker compose up -d${build ? ' --build' : ''}`);
if (build) recordDepsHash(REPO_ROOT, hash);

const envContent = fs.readFileSync(path.join(REPO_ROOT, 'src/app/.env'), 'utf8');
const readVal = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(?:"([^"]*)"|(\\S*))`, 'm'));
  if (!match) return '';
  return match[1] !== undefined ? match[1] : match[2];
};

console.log('\nCurio stack is up:');
console.log(`  - App URL:   ${readVal('VITE_CURIO_URL')}`);
console.log(`  - Supabase:  ${readVal('VITE_SUPABASE_URL')}`);
console.log(`  - Search:    ${readVal('SEARCH_EXTERNAL_ENDPOINT_URL')}`);
const email = readVal('TEST_USER_EMAIL');
if (email) {
  console.log(`  - Test User: ${email} / ${readVal('TEST_USER_PASSWORD')}`);
}

const rootEnvPath = path.join(REPO_ROOT, '.env');
const rootEnvContent = fs.existsSync(rootEnvPath) ? fs.readFileSync(rootEnvPath, 'utf8') : '';
const projectNameMatch = rootEnvContent.match(/^COMPOSE_PROJECT_NAME=(?:"([^"]*)"|(\S*))/m);
const projectName = projectNameMatch ? (projectNameMatch[1] !== undefined ? projectNameMatch[1] : projectNameMatch[2]) : 'curio';
const containerName = `${projectName}-app`;

console.log('\nPerforming initial sync to catch up with filesystem changes...');
try {
  execSync('sleep 2', { stdio: 'inherit' });
  run(`tar -cf - -C src/app --exclude='node_modules' --exclude='.vite' --exclude='.wrangler' --exclude='.env' --exclude='.dev.vars' --exclude='.env.staging' --exclude='.env.prod' . | docker exec -i ${containerName} tar -xf - -C /app`);
} catch (err) {
  console.warn('Warning: Initial sync to container failed. Make sure Docker is running.');
}

run('docker compose watch --no-up');
