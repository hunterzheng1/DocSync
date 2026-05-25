import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { getGlobalClaudeSkillPath } from '../utils/paths.mjs';
import { readText, writeText, backupFile, writeIfMissing } from '../utils/fs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, '..', '..', 'templates', 'claude-skill', 'SKILL.md');

export async function runSkillInstall(options = {}) {
  const targetPath = options.project
    ? resolve(options.cwd || process.cwd(), '.claude', 'skills', 'doc-sync', 'SKILL.md')
    : getGlobalClaudeSkillPath();

  const content = await readText(TEMPLATE_PATH);
  const outcome = await writeIfMissing(targetPath, content, { force: options.force, backup: options.backup });

  process.stdout.write(`Target: ${targetPath}\n`);
  if (outcome.action === 'skipped') {
    process.stdout.write('Status: already-installed\n');
  } else if (outcome.action === 'created') {
    process.stdout.write('Status: installed\n');
  } else if (outcome.action === 'overwritten') {
    process.stdout.write(`Status: updated${outcome.backupPath ? `, backup: ${outcome.backupPath}` : ''}\n`);
  }
}

export async function runSkillUpdate(options = {}) {
  const targetPath = getGlobalClaudeSkillPath();
  const content = await readText(TEMPLATE_PATH);
  await writeText(targetPath, content);
  process.stdout.write(`Updated: ${targetPath}\n`);
}

export async function runSkillPath(options = {}) {
  const path = getGlobalClaudeSkillPath();
  process.stdout.write(path + '\n');
}

export async function runSkill(subcommand, options = {}) {
  switch (subcommand) {
    case 'install':
      await runSkillInstall(options);
      break;
    case 'update':
      await runSkillUpdate(options);
      break;
    case 'path':
      await runSkillPath(options);
      break;
    default:
      process.stderr.write(`Unknown skill subcommand: ${subcommand}\n`);
      process.exitCode = 2;
  }
}
