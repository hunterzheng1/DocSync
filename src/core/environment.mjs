import { execSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { logger } from '../utils/logger.mjs';

const MIN_NODE_VERSION = 18;

const DANGEROUS_DIRS = ['/', '/home', '/root', 'C:\\', 'C:/'];

function getNodeVersion() {
  const [major] = process.versions.node.split('.').map(Number);
  return major;
}

function checkNodeVersion() {
  const major = getNodeVersion();
  const ok = major >= MIN_NODE_VERSION;
  return {
    ok,
    name: `Node.js >= ${MIN_NODE_VERSION}`,
    detail: ok ? `v${process.versions.node}` : `v${process.versions.node} (need >= ${MIN_NODE_VERSION})`,
  };
}

function checkExecutable(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore', timeout: 5000 });
    return { ok: true, name: cmd, detail: 'available' };
  } catch {
    return { ok: false, name: cmd, detail: 'not found' };
  }
}

function checkDirWritable(dir) {
  try {
    accessSync(dir, constants.W_OK);
    return { ok: true, name: 'directory writable', detail: dir };
  } catch {
    return { ok: false, name: 'directory writable', detail: `${dir} is not writable` };
  }
}

function isDangerousDir(dir) {
  const normalized = dir.replace(/\\/g, '/').toLowerCase();
  return DANGEROUS_DIRS.some(d => normalized === d.replace(/\\/g, '/').toLowerCase() ||
    normalized === d.replace(/\\/g, '/').toLowerCase() + '/');
}

function checkGitRepo(dir) {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: dir, stdio: 'ignore', timeout: 5000 });
    return { ok: true, name: 'git repo', detail: 'is git repository' };
  } catch {
    return { ok: false, name: 'git repo', detail: 'not a git repository' };
  }
}

export async function checkAll(cwd = process.cwd()) {
  const results = {
    required: [],
    recommended: [],
    allOk: true,
  };

  // Required checks
  const requiredChecks = [
    checkNodeVersion(),
    checkExecutable('npm'),
    checkExecutable('git'),
    checkDirWritable(cwd),
  ];

  for (const r of requiredChecks) {
    results.required.push(r);
    if (!r.ok) results.allOk = false;
  }

  // Dangerous dir check
  if (isDangerousDir(cwd)) {
    results.required.push({
      ok: false,
      name: 'safe directory',
      detail: `${cwd} is a dangerous directory`,
    });
    results.allOk = false;
  } else {
    results.required.push({
      ok: true,
      name: 'safe directory',
      detail: cwd,
    });
  }

  // Recommended checks
  const recommendedChecks = [
    checkExecutable('npx'),
    checkExecutable('repomix'),
    checkExecutable('markdownlint-cli2'),
  ];

  for (const r of recommendedChecks) {
    results.recommended.push(r);
  }

  // Git repo status (informational)
  results.gitRepo = checkGitRepo(cwd);

  return results;
}

export function printCheckResults(results) {
  for (const r of results.required) {
    if (r.ok) {
      logger.ok(r.name, r.detail);
    } else {
      process.stderr.write(`  [FAIL] ${r.name}: ${r.detail}\n`);
    }
  }
  for (const r of results.recommended) {
    if (r.ok) {
      logger.ok(r.name, r.detail);
    } else {
      logger.missing(r.name, r.detail);
    }
  }
  if (results.gitRepo) {
    if (results.gitRepo.ok) {
      logger.ok('git repo', results.gitRepo.detail);
    } else {
      logger.missing('git repo', results.gitRepo.detail);
    }
  }
}
