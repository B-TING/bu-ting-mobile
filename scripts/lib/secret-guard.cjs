/**
 * Staged files / diff lines that must not be committed.
 * Used by scripts/git-hooks/pre-commit.cjs
 */
const { execSync } = require('child_process');
const path = require('path');

/** @param {string} file */
function normalizePath(file) {
  return file.replace(/\\/g, '/');
}

/**
 * Paths that must never be committed.
 * `.env.example` / `.env.*.example` are allowed.
 * @param {string} file
 */
function isBlockedPath(file) {
  const p = normalizePath(file);
  const base = path.posix.basename(p);

  if (base === '.env') {
    return true;
  }
  if (base.startsWith('.env.') && !base.endsWith('.example')) {
    return true;
  }
  if (base === 'local.properties' || base === 'gradle.properties') {
    return true;
  }
  if (base.endsWith('.keystore') && base !== 'debug.keystore') {
    return true;
  }
  if (/\.(pem|p12|jks|pfx)$/i.test(base)) {
    return true;
  }
  if (
    base === 'oauthConfig.ts' ||
    base === 'apiConfig.ts' ||
    base === 'apiBaseUrl.ts' ||
    (base === 'config.ts' && p.includes('kakaoMap/')) ||
    base === 'oauth_strings.xml' ||
    base === 'kakao_map_key.xml'
  ) {
    return true;
  }
  if (p === 'android/app/src/main/AndroidManifest.xml') {
    return true;
  }
  if (p === 'ios/BUTingMobile/Info.plist') {
    return true;
  }
  if (/^\.xcode\.env\.local$/i.test(base)) {
    return true;
  }

  return false;
}

/** @param {string} file @param {string} projectRoot */
function isGitIgnored(file, projectRoot) {
  try {
    execSync(`git check-ignore -q -- "${file.replace(/"/g, '\\"')}"`, {
      cwd: projectRoot,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Secret-like content in newly added staged lines.
 * @param {string} line
 */
function findSecretInLine(line) {
  const patterns = [
    {
      name: 'private key block',
      regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    },
    {
      name: 'AWS access key',
      regex: /AKIA[0-9A-Z]{16}/,
    },
    {
      name: 'Google API key',
      regex: /AIza[0-9A-Za-z\-_]{35}/,
    },
    {
      name: 'env secret assignment',
      regex:
        /^(?:export\s+)?[A-Z0-9_]*(?:SECRET|PASSWORD|PRIVATE_KEY|API_KEY)\s*=\s*["']?[^\s#"']{8,}/,
    },
    {
      name: 'Bearer token assignment',
      regex: /^(?:export\s+)?[A-Z0-9_]*(?:ACCESS_)?TOKEN\s*=\s*["']?[^\s#"']{16,}/,
    },
  ];

  for (const { name, regex } of patterns) {
    if (regex.test(line)) {
      return name;
    }
  }
  return null;
}

/** @param {string} projectRoot */
function getStagedFiles(projectRoot) {
  const out = execSync('git diff --cached --name-only --diff-filter=ACMR', {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  return out
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

/** @param {string} projectRoot */
function getStagedAddedLines(projectRoot) {
  const diff = execSync('git diff --cached -U0 --no-color', {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  const added = [];
  for (const line of diff.split(/\r?\n/)) {
    if (!line.startsWith('+') || line.startsWith('+++')) {
      continue;
    }
    added.push(line.slice(1));
  }
  return added;
}

/**
 * @param {string} projectRoot
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
function scanStagedChanges(projectRoot) {
  const errors = [];
  const staged = getStagedFiles(projectRoot);

  for (const file of staged) {
    if (isBlockedPath(file)) {
      errors.push(`민감 파일은 커밋할 수 없습니다: ${file}`);
      continue;
    }
    if (isGitIgnored(file, projectRoot)) {
      errors.push(`.gitignore 대상 파일이 스테이징되었습니다: ${file}`);
    }
  }

  const addedLines = getStagedAddedLines(projectRoot);
  for (let i = 0; i < addedLines.length; i += 1) {
    const secret = findSecretInLine(addedLines[i]);
    if (secret) {
      const preview = addedLines[i].trim().slice(0, 80);
      errors.push(
        `스테이징된 변경에 ${secret} 패턴이 감지되었습니다 (line ${i + 1}): ${preview}${addedLines[i].length > 80 ? '…' : ''}`,
      );
      break;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}

module.exports = {
  findSecretInLine,
  getStagedAddedLines,
  getStagedFiles,
  isBlockedPath,
  isGitIgnored,
  scanStagedChanges,
};
