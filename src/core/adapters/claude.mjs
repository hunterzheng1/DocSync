import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyTemplateTree } from '../../utils/fs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = join(__dirname, '..', '..', '..', 'templates', 'skills', 'docsync');

export async function installClaudeAdapter(cwd = process.cwd()) {
  const adapterDir = join(cwd, '.docsync', 'adapters', 'claude');
  const adapterSkillDir = join(adapterDir, 'skills', 'docsync');
  const skillDir = join(cwd, '.claude', 'skills', 'docsync');
  const commandDir = join(cwd, '.claude', 'commands', 'docsync');

  // Ensure directories
  mkdirSync(adapterDir, { recursive: true });
  mkdirSync(adapterSkillDir, { recursive: true });
  mkdirSync(skillDir, { recursive: true });

  const srcClaude = join(TEMPLATE_ROOT, 'claude');
  const srcShared = join(TEMPLATE_ROOT);

  // 1. Copy to .docsync/adapters/claude/skills/docsync/ (source projection)
  const { created: adapterFiles } = await copyTemplateTree(srcClaude, adapterSkillDir);

  // 2. Project to .claude/skills/docsync/ (runtime installation)
  const { created: skillFiles } = await copyTemplateTree(srcClaude, skillDir);

  // 3. Copy shared files (references, scripts, assets) to both adapter and skill dirs
  for (const subDir of ['references', 'scripts', 'assets']) {
    const src = join(srcShared, subDir);
    await copyTemplateTree(src, join(skillDir, subDir));
    await copyTemplateTree(src, join(adapterDir, subDir));
  }

  // 4. Copy command wrappers
  const srcCommands = join(srcClaude, 'commands');
  if (existsSync(srcCommands)) {
    mkdirSync(commandDir, { recursive: true });
    await copyTemplateTree(srcCommands, commandDir);
  }

  const allCreated = [...adapterFiles, ...skillFiles];
  return {
    ok: true,
    files: allCreated,
    installed: {
      skillPath: '.claude/skills/docsync/SKILL.md',
      adapterSkillPath: '.docsync/adapters/claude/skills/docsync/SKILL.md',
      commands: [
        '.claude/commands/docsync/init.md',
        '.claude/commands/docsync/sync.md',
        '.claude/commands/docsync/rules.md',
      ],
    },
  };
}
