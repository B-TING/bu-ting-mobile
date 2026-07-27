/**
 * .env → .env.local 순으로 로드 (.env.local이 우선).
 * Node 스크립트·Metro 시작 전 process.env에 주입합니다.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function applyEnv(vars) {
  for (const [key, value] of Object.entries(vars)) {
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

/** .env.local 값으로 덮어씀 */
function applyEnvOverride(vars) {
  for (const [key, value] of Object.entries(vars)) {
    if (value !== '') {
      process.env[key] = value;
    }
  }
}

function loadProjectEnv(options = {}) {
  const root = options.root ?? projectRoot;
  applyEnv(parseEnvFile(path.join(root, '.env')));
  applyEnvOverride(parseEnvFile(path.join(root, '.env.local')));
}

function requireEnv(key) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(
      `${key} is not set. Copy .env.example to .env and add your key.`,
    );
  }
  return value;
}

function optionalEnvInt(key, fallback) {
  const raw = process.env[key]?.trim();
  if (!raw) {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
  projectRoot,
  loadProjectEnv,
  requireEnv,
  optionalEnvInt,
  parseEnvFile,
};
