import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { getCwd, getTemplateRoot } from '../utils/paths.mjs';
import { writeIfMissing, readText } from '../utils/fs.mjs';

const TEMPLATE_FILES = [
  'repomix.config.json',
  '.repomixignore',
  '.markdownlint-cli2.jsonc',
  'docs/doc-sync-rules.md',
];

export async function runInit(options = {}) {
  const cwd = getCwd(options);
  const templateRoot = getTemplateRoot();
  const result = {
    created: [],
    skipped: [],
    overwritten: [],
    backups: [],
  };

  for (const tpl of TEMPLATE_FILES) {
    const tplPath = join(templateRoot, tpl);
    const targetPath = resolve(cwd, tpl);

    if (!existsSync(tplPath)) {
      process.stderr.write(`Warning: template not found: ${tpl}\n`);
      continue;
    }

    const content = await readText(tplPath);
    const outcome = await writeIfMissing(targetPath, content, options);

    switch (outcome.action) {
      case 'created':
        result.created.push(tpl);
        break;
      case 'skipped':
        result.skipped.push(tpl);
        break;
      case 'overwritten':
        result.overwritten.push(tpl);
        if (outcome.backupPath) result.backups.push(outcome.backupPath);
        break;
      case 'create-planned':
        result.created.push(`[dry-run] ${tpl}`);
        break;
      case 'overwrite-planned':
        result.overwritten.push(`[dry-run] ${tpl}`);
        break;
    }
  }

  if (!options.dryRun) {
    printInitSummary(result);
  }

  return result;
}

function printInitSummary(result) {
  process.stdout.write('\nDocSync init complete.\n');
  if (result.created.length) {
    process.stdout.write(`  Created: ${result.created.join(', ')}\n`);
  }
  if (result.skipped.length) {
    process.stdout.write(`  Skipped: ${result.skipped.join(', ')}\n`);
  }
  if (result.overwritten.length) {
    process.stdout.write(`  Overwritten: ${result.overwritten.join(', ')}\n`);
  }
  if (result.backups.length) {
    process.stdout.write(`  Backups: ${result.backups.join(', ')}\n`);
  }
  process.stdout.write('\n');
}
