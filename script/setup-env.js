const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { isLinkedWorktree, getPrimaryCheckoutRoot } = require('./lib/git-dirs');

const REPO_ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(REPO_ROOT, '.env');
const TEMPLATE_PATH = path.join(REPO_ROOT, '.env.template');

const isPlaceholder = (value) => !value || /^X+$/.test(value);

function base64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function signJwt(payload, secret) {
  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const body = base64url(payload);
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function randomSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function readValue(content, key) {
  const match = content.match(new RegExp(`^${key}=(?:"([^"]*)"|(\\S*))`, 'm'));
  if (!match) return null;
  return match[1] !== undefined ? match[1] : match[2];
}

function setValue(content, key, value) {
  const line = `${key}="${value}"`;
  const regex = new RegExp(`^${key}=.*$`, 'm');
  return regex.test(content) ? content.replace(regex, line) : `${content}\n${line}`;
}

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.log('.env not found, copying from .env.template...');
    fs.copyFileSync(TEMPLATE_PATH, ENV_PATH);
  }

  for (const name of ['.env.staging', '.env.prod']) {
    const envFilePath = path.join(REPO_ROOT, name);
    if (!fs.existsSync(envFilePath)) {
      fs.writeFileSync(envFilePath, '');
      console.log(`Created empty ${name}`);
    }
  }

  let content = fs.readFileSync(ENV_PATH, 'utf8');

  const isLinked = isLinkedWorktree(REPO_ROOT);
  const worktreeName = isLinked ? path.basename(REPO_ROOT).toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
  const composeProject = isLinked ? `curio-${worktreeName}` : 'curio';
  content = setValue(content, 'DEV_OWNER', composeProject);
  content = setValue(content, 'COMPOSE_PROJECT_NAME', composeProject);

  const randomSecretKeys = [
    'JWT_SECRET',
    'DASHBOARD_PASSWORD',
    'POSTGRES_PASSWORD',
    'SEARCH_MASTER_API_KEY',
    'CURIO_APP_SECRET'
  ];
  for (const key of randomSecretKeys) {
    const current = readValue(content, key);
    if (isPlaceholder(current)) {
      content = setValue(content, key, randomSecret());
      console.log(`Generated ${key}`);
    }
  }

  // Ensure test credentials exist for automated QA and Playwright
  if (!readValue(content, 'TEST_USER_EMAIL')) {
    content = setValue(content, 'TEST_USER_EMAIL', 'testuser@curi.ooo');
  }
  if (!readValue(content, 'TEST_USER_PASSWORD')) {
    content = setValue(content, 'TEST_USER_PASSWORD', 'testpassword123');
  }

  // Ensure Postgres URL matches password
  const postgresPassword = readValue(content, 'POSTGRES_PASSWORD');
  const dbUrlMatch = content.match(/^POSTGRES_URL="?postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^"\s]+)"?/m);
  if (dbUrlMatch && postgresPassword && dbUrlMatch[2] !== postgresPassword) {
    const [, user, , host, port, dbName] = dbUrlMatch;
    content = setValue(content, 'POSTGRES_URL', `postgres://${user}:${postgresPassword}@${host}:${port}/${dbName}`);
    console.log("Synced POSTGRES_URL password to match POSTGRES_PASSWORD");
  }

  const jwtSecret = readValue(content, 'JWT_SECRET');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24 * 365 * 10;

  const derivedKeys = {
    VITE_SUPABASE_ANON_KEY: () => signJwt({ role: 'anon', iss: 'supabase', iat: now, exp }, jwtSecret),
    SUPABASE_SERVICE_ROLE_KEY: () => signJwt({ role: 'service_role', iss: 'supabase', iat: now, exp }, jwtSecret)
  };
  for (const [key, generate] of Object.entries(derivedKeys)) {
    const current = readValue(content, key);
    if (isPlaceholder(current)) {
      content = setValue(content, key, generate());
      console.log(`Generated ${key} (signed with JWT_SECRET)`);
    }
  }

  if (isLinkedWorktree(REPO_ROOT)) {
    const primaryRoot = getPrimaryCheckoutRoot(REPO_ROOT);
    const primaryEnvPath = primaryRoot && path.join(primaryRoot, '.env');
    if (primaryEnvPath && primaryEnvPath !== ENV_PATH && fs.existsSync(primaryEnvPath)) {
      const primaryContent = fs.readFileSync(primaryEnvPath, 'utf8');
      const inherited = [];
      for (const key of content.matchAll(/^([A-Z0-9_]+)=/gm)) {
        const name = key[1];
        if (!isPlaceholder(readValue(content, name))) continue;
        const primaryValue = readValue(primaryContent, name);
        if (primaryValue && !isPlaceholder(primaryValue)) {
          content = setValue(content, name, primaryValue);
          inherited.push(name);
        }
      }
      if (inherited.length > 0) {
        console.log(`Inherited secrets from primary checkout (${primaryRoot}): ${inherited.join(', ')}`);
      }
    }
  }

  fs.writeFileSync(ENV_PATH, content, 'utf8');
  console.log('.env secrets are up to date.');
}

main();
