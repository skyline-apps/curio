// Git utility functions to detect linked worktrees and locate the primary checkout root.
const { execSync } = require('child_process');
const path = require('path');

function getGitDirs(repoRoot) {
  try {
    const gitDir = execSync('git rev-parse --git-dir', { cwd: repoRoot, encoding: 'utf8' }).trim();
    const gitCommonDir = execSync('git rev-parse --git-common-dir', { cwd: repoRoot, encoding: 'utf8' }).trim();
    return {
      gitDir: path.resolve(repoRoot, gitDir),
      gitCommonDir: path.resolve(repoRoot, gitCommonDir)
    };
  } catch {
    return null;
  }
}

function isLinkedWorktree(repoRoot) {
  const dirs = getGitDirs(repoRoot);
  return !!dirs && dirs.gitDir !== dirs.gitCommonDir;
}

// Resolves primary checkout root using the parent directory of gitCommonDir.
function getPrimaryCheckoutRoot(repoRoot) {
  const dirs = getGitDirs(repoRoot);
  return dirs ? path.dirname(dirs.gitCommonDir) : null;
}

module.exports = { getGitDirs, isLinkedWorktree, getPrimaryCheckoutRoot };
