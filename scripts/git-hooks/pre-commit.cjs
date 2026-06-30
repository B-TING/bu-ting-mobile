#!/usr/bin/env node
/**
 * Blocks commits when staged files look like secrets or local-only config.
 * Installed via: npm run hooks:install (also runs on postinstall)
 */
const path = require('path');
const { scanStagedChanges } = require('../lib/secret-guard.cjs');

const projectRoot = path.resolve(__dirname, '..', '..');
const result = scanStagedChanges(projectRoot);

if (result.ok) {
  process.exit(0);
}

console.error('\n[Bu-Ting] pre-commit: 보안 검사 실패 — 커밋이 중단되었습니다.\n');
for (const message of result.errors) {
  console.error(`  • ${message}`);
}
console.error('\n해결 방법:');
console.error('  git restore --staged <file>   # 스테이징 해제');
console.error('  .env 등은 .env.example 만 커밋하고, 생성 파일은 npm run *:sync 로 로컬에서 만드세요.\n');
process.exit(1);
