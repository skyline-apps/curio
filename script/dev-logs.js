const { execSync } = require('child_process');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2).join(' ') || 'app';

try {
  execSync(`docker compose logs -f ${args}`, { cwd: REPO_ROOT, stdio: 'inherit' });
} catch {
  process.exit(1);
}
