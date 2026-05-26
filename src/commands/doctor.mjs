import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { logger } from '../utils/logger.mjs';
import { hasCommand, getCommandVersion } from '../utils/shell.mjs';
import { getGlobalClaudeSkillPath, getGlobalCodexAgentsPath } from '../utils/paths.mjs';

// Tools where --version doesn't work or returns non-zero
const VERSION_FALLBACKS = {
  'markdownlint-cli2': () => {
    // --version is treated as a glob pattern; try --help
    try {
      const out = execSync('markdownlint-cli2 --help', { encoding: 'utf8', shell: true }).trim();
      return out.split('\n')[0];
    } catch {
      return 'installed';
    }
  },
};

function checkTool(name, required = false) {
  const exists = hasCommand(name);
  if (!exists) {
    if (required) {
      logger.missing(name, 'REQUIRED');
    } else {
      logger.missing(name, `optional: install with npm i -g ${name}`);
    }
    return { name, status: 'missing' };
  }

  // Try to get version
  let version = null;
  const fallback = VERSION_FALLBACKS[name];
  if (fallback) {
    version = fallback();
  } else {
    version = getCommandVersion(name);
  }

  if (version) {
    logger.ok(name, version.split('\n')[0]);
  } else {
    logger.ok(name, 'installed');
  }
  return { name, status: 'ok', version };
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

  // Show install guidance for missing global files
  if (results.globalFiles.claudeSkill === 'missing' || results.globalFiles.codexAgents === 'missing') {
    process.stdout.write('\n');
    if (results.globalFiles.claudeSkill === 'missing') {
      process.stdout.write('  → Install Claude Skill: docsync skill install\n');
    }
    if (results.globalFiles.codexAgents === 'missing') {
      process.stdout.write('  → Install Codex rules: docsync codex install\n');
    }
  }

  process.stdout.write('\n');

  if (!npmOk) {
    process.exitCode = 1;
  }

  return results;
}
