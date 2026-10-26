// Bootstraps a local dev session:
// 1. node script/setup-env.js (fill .env placeholders/secrets).
// 2. node script/assign-ports.js (worktrees only: run on worktrees only; also syncs src/app/.env).
// 3. syncAppEnv (primary checkout only: copy .env to src/app/.env).
// 4. docker compose up -d (start services), adding --build when src/app deps changed.
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
