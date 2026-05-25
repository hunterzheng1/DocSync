import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { homedir } from 'node:os';
import { getGlobalCodexAgentsPath } from '../utils/paths.mjs';
import { readText, writeText, backupFile, exists } from '../utils/fs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, '..', '..', 'templates', 'codex', 'AGENTS.docsync.md');

const DOCSYNC_START = '<!-- docsync:start -->';
const DOCSYNC_END = '<!-- docsync:end -->';

function insertMarkerBlock(content, newBlock) {
  const startIdx = content.indexOf(DOCSYNC_START);
  const endIdx = content.indexOf(DOCSYNC_END);

  if (startIdx === -1 && endIdx === -1) {
    // No marker found - append
    return content + '\n\n' + DOCSYNC_START + '\n' + newBlock + '\n' + DOCSYNC_END + '\n';
  }

  if (startIdx !== -1 && endIdx !== -1) {
    // Check for multiple markers
    const startCount = content.split(DOCSYNC_START).length - 1;
    const endCount = content.split(DOCSYNC_END).length - 1;
    if (startCount > 1 || endCount > 1) {
      throw new Error('Multiple DocSync marker blocks found. Please clean up the file manually.');
    }

    // Replace existing marker block
    const before = content.slice(0, startIdx);
    const after = content.slice(endIdx + DOCSYNC_END.length + 1);
    return before + DOCSYNC_START + '\n' + newBlock + '\n' + DOCSYNC_END + after;
  }

  throw new Error('Incomplete DocSync marker block found. Please fix manually.');
}

export async function runCodexInstall(options = {}) {
  const targetPath = getGlobalCodexAgentsPath();
  const templateContent = await readText(TEMPLATE_PATH);

  if (!exists(targetPath)) {
    await writeText(targetPath, DOCSYNC_START + '\n' + templateContent + '\n' + DOCSYNC_END + '\n');
    process.stdout.write(`Created: ${targetPath}\n`);
    process.stdout.write('Status: created\n');
    return;
  }

  const existing = await readText(targetPath);
  const updated = insertMarkerBlock(existing, templateContent);
  await writeText(targetPath, updated);
  process.stdout.write(`Updated: ${targetPath}\n`);
  process.stdout.write('Status: updated\n');
}

export async function runCodexUpdate(options = {}) {
  await runCodexInstall(options);
}

export async function runCodexPath() {
  process.stdout.write(getGlobalCodexAgentsPath() + '\n');
}

export async function runCodex(subcommand, options = {}) {
  switch (subcommand) {
    case 'install':
      await runCodexInstall(options);
      break;
    case 'update':
      await runCodexUpdate(options);
      break;
    case 'path':
      await runCodexPath();
      break;
    default:
      process.stderr.write(`Unknown codex subcommand: ${subcommand}\n`);
      process.exitCode = 2;
  }
}
