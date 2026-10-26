const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { syncAppEnv } = require('./lib/sync-app-env');
const { getGitDirs } = require('./lib/git-dirs');

const REPO_ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(REPO_ROOT, '.env');
const TEMPLATE_PATH = path.join(REPO_ROOT, '.env.template');

const sanitizeOwnerPart = (value) => value.toLowerCase().replace(/[^a-z0-9_-]/g, '');

const GIT_DIRS = getGitDirs(REPO_ROOT);
const IS_LINKED_WORKTREE = !!GIT_DIRS && GIT_DIRS.gitDir !== GIT_DIRS.gitCommonDir;
const WORKTREE_NAME = sanitizeOwnerPart(path.basename(REPO_ROOT));

const COMPOSE_PROJECT_NAME = IS_LINKED_WORKTREE ? `curio-${WORKTREE_NAME}` : 'curio';
const DEV_OWNER = COMPOSE_PROJECT_NAME;

function getRegistryPath() {
  if (!GIT_DIRS) return null;
  return path.join(GIT_DIRS.gitCommonDir, 'curio-worktree-ports.json');
}

function readRegistry() {
  const registryPath = getRegistryPath();
  if (!registryPath || !fs.existsSync(registryPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch {
    return {};
  }
}

function writeRegistry(registry) {
  const registryPath = getRegistryPath();
  if (!registryPath) return;
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

const DEFAULT_PORTS = {
  APP: 3000,
  KONG_HTTP: 8000,
  KONG_HTTPS: 8443,
  POSTGRES: 5432,
  SEARCH: 7700,
  INBUCKET_WEB: 9000,
  INBUCKET_SMTP: 2500,
  INBUCKET_POP3: 1100,
  LOGFLARE: 4000
};

async function offsetPortsFree(offset) {
  for (const base of Object.values(DEFAULT_PORTS)) {
    if (!(await isPortFree(base + offset))) return false;
  }
  return true;
}

async function findFreeOffset(preferredOffset, claimedOffsets) {
  if (preferredOffset !== null && !claimedOffsets.has(preferredOffset) && (await offsetPortsFree(preferredOffset))) {
    return preferredOffset;
  }
  const FLOOR = 100;
  const STEP = 10;
  const MAX_TRIES = 200;
  for (let i = 0; i < MAX_TRIES; i++) {
    const candidate = FLOOR + i * STEP;
    if (claimedOffsets.has(candidate)) continue;
    if (await offsetPortsFree(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Could not find a free port offset after ${MAX_TRIES} attempts.`);
}

async function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.log('.env file not found, copying from .env.template...');
    fs.copyFileSync(TEMPLATE_PATH, ENV_PATH);
  }

  const args = process.argv.slice(2);
  let offset = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--offset' || args[i] === '-o') {
      if (args[i + 1]) {
        offset = parseInt(args[i + 1], 10);
        i++;
      }
    } else {
      const parsed = parseInt(args[i], 10);
      if (!isNaN(parsed)) {
        offset = parsed;
      }
    }
  }

  const registry = readRegistry();
  let autoAssigned = false;

  if (offset === null || isNaN(offset)) {
    if (!IS_LINKED_WORKTREE) {
      console.error('Error: Offset is a mandatory field.');
      console.error('Usage: node script/assign-ports.js <offset> or node script/assign-ports.js --offset <offset>');
      process.exit(1);
    }

    console.log(`No offset given inside linked worktree "${WORKTREE_NAME}" — auto-assigning a free port offset...`);
    const previouslyAssigned = registry[REPO_ROOT];
    const claimedOffsets = new Set(
      Object.entries(registry)
        .filter(([worktreePath]) => worktreePath !== REPO_ROOT)
        .map(([, claimedOffset]) => claimedOffset)
    );
    offset = await findFreeOffset(typeof previouslyAssigned === 'number' ? previouslyAssigned : null, claimedOffsets);
    autoAssigned = true;
  }

  if (IS_LINKED_WORKTREE) {
    registry[REPO_ROOT] = offset;
    writeRegistry(registry);
  }

  if (autoAssigned) {
    console.log(`Auto-assigned offset +${offset} for worktree "${WORKTREE_NAME}".`);
  } else if (offset === 0) {
    console.log('Resetting .env to default ports (offset +0).');
  } else {
    console.log(`Updating all default ports in .env by offset +${offset}.`);
  }

  let content = fs.readFileSync(ENV_PATH, 'utf8');

  let postgresUrl = `postgres://postgres:dev_password@localhost:${DEFAULT_PORTS.POSTGRES + offset}/postgres`;
  const dbUrlMatch = content.match(/^POSTGRES_URL="?postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^"\s]+)"?$/m);
  if (dbUrlMatch) {
    const user = dbUrlMatch[1];
    const pass = dbUrlMatch[2];
    const host = dbUrlMatch[3];
    const dbName = dbUrlMatch[5];
    postgresUrl = `postgres://${user}:${pass}@${host}:${DEFAULT_PORTS.POSTGRES + offset}/${dbName}`;
  }

  const replacements = {
    VITE_CURIO_URL: `VITE_CURIO_URL="http://localhost:${DEFAULT_PORTS.APP + offset}"`,
    SITE_URL: `SITE_URL=http://localhost:${DEFAULT_PORTS.APP + offset}`,
    ADDITIONAL_REDIRECT_URLS: `ADDITIONAL_REDIRECT_URLS=http://localhost:${DEFAULT_PORTS.APP + offset},http://localhost:${DEFAULT_PORTS.APP + offset}/*`,
    VITE_SUPABASE_URL: `VITE_SUPABASE_URL="http://localhost:${DEFAULT_PORTS.KONG_HTTP + offset}"`,
    SUPABASE_PUBLIC_URL: `SUPABASE_PUBLIC_URL=http://localhost:${DEFAULT_PORTS.KONG_HTTP + offset}`,
    GOOGLE_REDIRECT_URI: `GOOGLE_REDIRECT_URI="http://localhost:${DEFAULT_PORTS.KONG_HTTP + offset}/auth/v1/callback"`,
    POSTGRES_PORT: `POSTGRES_PORT=${DEFAULT_PORTS.POSTGRES + offset}`,
    POSTGRES_URL: `POSTGRES_URL="${postgresUrl}"`,
    KONG_HTTP_PORT: `KONG_HTTP_PORT=${DEFAULT_PORTS.KONG_HTTP + offset}`,
    KONG_HTTPS_PORT: `KONG_HTTPS_PORT=${DEFAULT_PORTS.KONG_HTTPS + offset}`,
    SEARCH_EXTERNAL_ENDPOINT_URL: `SEARCH_EXTERNAL_ENDPOINT_URL="http://localhost:${DEFAULT_PORTS.SEARCH + offset}"`,
    SEARCH_PORT: `SEARCH_PORT=${DEFAULT_PORTS.SEARCH + offset}`,
    SMTP_PORT: `SMTP_PORT=${DEFAULT_PORTS.INBUCKET_SMTP + offset}`,
    INBUCKET_SMTP_PORT: `INBUCKET_SMTP_PORT=${DEFAULT_PORTS.INBUCKET_SMTP + offset}`,
    INBUCKET_WEB_PORT: `INBUCKET_WEB_PORT=${DEFAULT_PORTS.INBUCKET_WEB + offset}`,
    INBUCKET_POP3_PORT: `INBUCKET_POP3_PORT=${DEFAULT_PORTS.INBUCKET_POP3 + offset}`,
    LOGFLARE_PORT: `LOGFLARE_PORT=${DEFAULT_PORTS.LOGFLARE + offset}`,
    DEV_OWNER: `DEV_OWNER=${DEV_OWNER}`,
    COMPOSE_PROJECT_NAME: `COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME}`
  };

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, value);
    } else {
      content += `\n${value}`;
    }
  }

  fs.writeFileSync(ENV_PATH, content, 'utf8');
  syncAppEnv(REPO_ROOT, content);
  console.log(`Updated .env with offset +${offset} ports:`);
  console.log(`  - App URL: http://localhost:${DEFAULT_PORTS.APP + offset}`);
  console.log(`  - Supabase URL: http://localhost:${DEFAULT_PORTS.KONG_HTTP + offset}`);
  console.log(`  - Postgres Port: ${DEFAULT_PORTS.POSTGRES + offset}`);
  console.log(`  - Search URL: http://localhost:${DEFAULT_PORTS.SEARCH + offset}`);
  console.log(`  - Dev Owner: ${DEV_OWNER}`);
  console.log(`  - Compose Project Name: ${COMPOSE_PROJECT_NAME}`);
}

main().catch((err) => {
  console.error('Error running port assignment:', err);
  process.exit(1);
});
