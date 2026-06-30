#!/usr/bin/env node
/**
 * Copies project git hooks into .git/hooks (no git config changes).
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const gitDir = path.join(projectRoot, '.git');
const hooksDir = path.join(gitDir, 'hooks');

const HOOKS = [
  {
    name: 'pre-commit',
    runner: 'scripts/git-hooks/pre-commit.cjs',
  },
];

function main() {
  if (!fs.existsSync(gitDir)) {
    console.warn('[Bu-Ting] hooks:install skipped — not a git repository');
    return;
  }

  fs.mkdirSync(hooksDir, { recursive: true });

  for (const hook of HOOKS) {
    const target = path.join(hooksDir, hook.name);
    const body = `#!/bin/sh
set -e
cd "$(git rev-parse --show-toplevel)" && node ${hook.runner}
`;
    fs.writeFileSync(target, body, { mode: 0o755 });
    console.log(`[Bu-Ting] installed git hook: ${hook.name}`);
  }
}

main();
