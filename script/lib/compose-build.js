const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getGitDirs } = require('./git-dirs');

const DEP_FILES = [
  'src/app/package.json',
  'src/app/package-lock.json',
  'docker/curio-app/Dockerfile'
];

function computeDepsHash(repoRoot) {
  const hash = crypto.createHash('sha256');
  for (const relPath of DEP_FILES) {
    const filePath = path.join(repoRoot, relPath);
    hash.update(relPath + '\0');
    hash.update(fs.existsSync(filePath) ? fs.readFileSync(filePath) : Buffer.alloc(0));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function getRegistryPath(repoRoot) {
  const gitDirs = getGitDirs(repoRoot);
  return gitDirs ? path.join(gitDirs.gitCommonDir, 'curio-dev-image-hashes.json') : null;
}

function readRegistry(repoRoot) {
  const registryPath = getRegistryPath(repoRoot);
  if (!registryPath || !fs.existsSync(registryPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch {
    return {};
  }
}

function recordDepsHash(repoRoot, hash) {
  const registryPath = getRegistryPath(repoRoot);
  if (!registryPath) return;
  const registry = readRegistry(repoRoot);
  registry[repoRoot] = hash;
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');
}

function resolveBuild(repoRoot, argv = []) {
  const hash = computeDepsHash(repoRoot);
  if (argv.includes('--build')) {
    return { build: true, reason: 'Rebuilding images (--build).', hash };
  }
  const recorded = readRegistry(repoRoot)[repoRoot];
  if (!recorded) {
    return { build: true, reason: 'No record of a prior image build — building images now.', hash };
  }
  if (recorded !== hash) {
    return { build: true, reason: 'src/app dependencies changed since the last build — rebuilding images.', hash };
  }
  return { build: false, reason: '', hash };
}

module.exports = { computeDepsHash, resolveBuild, recordDepsHash };
