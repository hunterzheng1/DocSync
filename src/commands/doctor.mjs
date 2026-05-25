import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { logger } from '../utils/logger.mjs';
import { getGlobalClaudeSkillPath, getGlobalCodexAgentsPath } from '../utils/paths.mjs';

function checkTool(name, required = false) {
  try {
    const version = execSync(`${name} --version`, { encoding: 'utf8' }).trim().split('\n')[0];
    logger.ok(name, version);
    return { name, status: 'ok', version };
  } catch {
    if (required) {
      logger.missing(name, 'REQUIRED');
    } else {
      logger.missing(name, `optional: install with npm i -g ${name}`);
    }
    return { name, status: 'missing' };
  }
}

function checkFile(label, filePath) {
  if (existsSync(filePath)) {
    logger.installed(label, filePath);
  } else {
    logger.missing(label, filePath);
  }
}

export async function runDoctor(options = {}) {
  const results = {
    required: {},
    recommended: {},
    globalFiles: {},
  };

  process.stdout.write('Environment diagnostics:\n\n');

  // Required tools
  const nodeVersion = process.version;
  logger.ok('node', nodeVersion);
  results.required.node = 'ok';

  let npmOk = false;
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logger.ok('npm', npmVersion);
    results.required.npm = 'ok';
    npmOk = true;
  } catch {
    logger.missing('npm', 'REQUIRED');
    results.required.npm = 'missing';
  }

  process.stdout.write('\n');

  // Recommended tools
  const recommended = ['git', 'repomix', 'markdownlint-cli2', 'claude', 'codex', 'gh'];
  for (const tool of recommended) {
    const result = checkTool(tool, false);
    results.recommended[tool] = result.status;
  }

  process.stdout.write('\n');

  // Global file checks
  const skillPath = getGlobalClaudeSkillPath();
  const codexPath = getGlobalCodexAgentsPath();

  checkFile('claude-skill', skillPath);
  checkFile('codex-agents', codexPath);

  results.globalFiles.claudeSkill = existsSync(skillPath) ? 'installed' : 'missing';
  results.globalFiles.codexAgents = existsSync(codexPath) ? 'installed' : 'missing';

  process.stdout.write('\n');

  if (!npmOk) {
    process.exitCode = 1;
  }

  return results;
}
