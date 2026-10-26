const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const envPath = path.join(REPO_ROOT, '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const projectNameMatch = envContent.match(/^COMPOSE_PROJECT_NAME=(?:"([^"]*)"|(\S*))/m);
const projectName = projectNameMatch ? (projectNameMatch[1] !== undefined ? projectNameMatch[1] : projectNameMatch[2]) : 'curio';
const containerName = `${projectName}-app`;

const cmd = process.argv.slice(2).join(' ') || 'bash';
console.log(`Executing in container ${containerName}: ${cmd}`);
try {
  execSync(`docker exec -it ${containerName} ${cmd}`, { stdio: 'inherit' });
} catch {
  process.exit(1);
}
