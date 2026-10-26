// Syncs root `.env` content to `src/app/.env` and `src/app/.dev.vars`.
// Written as plain files rather than symlinks so host-side tooling reads
// the current worktree's environment without resolving symlinks back to the primary checkout.
const fs = require('fs');
const path = require('path');

function syncAppEnv(repoRoot, content) {
  const appDir = path.join(repoRoot, 'src/app');
  if (fs.existsSync(appDir)) {
    fs.writeFileSync(path.join(appDir, '.env'), content, 'utf8');
    fs.writeFileSync(path.join(appDir, '.dev.vars'), content, 'utf8');
  }
}

module.exports = { syncAppEnv };
