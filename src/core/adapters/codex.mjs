import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyTemplateTree } from '../../utils/fs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = join(__dirname, '..', '..', '..', 'templates', 'skills', 'docsync');

export async function installCodexAdapter(cwd = process.cwd()) {
  const adapterDir = join(cwd, '.docsync', 'adapters', 'codex');
  const adapterSkillDir = join(adapterDir, 'skills', 'docsync');
  const skillDir = join(cwd, '.agents', 'skills', 'docsync');

  // Ensure directories
  mkdirSync(adapterDir, { recursive: true });
  mkdirSync(adapterSkillDir, { recursive: true });
  mkdirSync(skillDir, { recursive: true });

  const srcCodex = join(TEMPLATE_ROOT, 'codex');
  const srcShared = join(TEMPLATE_ROOT);

  // 1. Copy to .docsync/adapters/codex/skills/docsync/ (source projection)
  const { created: adapterFiles } = await copyTemplateTree(srcCodex, adapterSkillDir);

  // 2. Project to .agents/skills/docsync/ (runtime installation)
  const { created: skillFiles } = await copyTemplateTree(srcCodex, skillDir);

  // 3. Copy shared files (references, scripts, assets) to both adapter and skill dirs
  for (const subDir of ['references', 'scripts', 'assets']) {
    const src = join(srcShared, subDir);
    await copyTemplateTree(src, join(skillDir, subDir));
    await copyTemplateTree(src, join(adapterDir, subDir));
  }

  // 4. Copy agents/openai.yaml to both adapter and skill
  const srcAgents = join(srcCodex, 'agents');
  if (existsSync(srcAgents)) {
    await copyTemplateTree(srcAgents, join(skillDir, 'agents'));
    await copyTemplateTree(srcAgents, join(adapterDir, 'agents'));
  }

  // 5. Write AGENTS.docsync.md to .docsync/adapters/codex/ (source projection)
  const markerBlockPath = join(TEMPLATE_ROOT, 'assets', 'AGENTS.docsync.block.md');
  const agentsBlockDest = join(adapterDir, 'AGENTS.docsync.md');
  if (!existsSync(agentsBlockDest)) {
    const markerBlock = readFileSync(markerBlockPath, 'utf8');
    writeFileSync(agentsBlockDest, markerBlock, 'utf8');
    adapterFiles.push(agentsBlockDest);
  }

  // 6. Update or create AGENTS.md with marker block in project root
  const agentsPath = join(cwd, 'AGENTS.md');
  const markerBlock = readFileSync(markerBlockPath, 'utf8');
  let action = 'created';

  if (!existsSync(agentsPath)) {
    const content = `# AGENTS.md\n\n${markerBlock}\n`;
    writeFileSync(agentsPath, content, 'utf8');
  } else {
    const existing = readFileSync(agentsPath, 'utf8');
    if (existing.includes('<!-- docsync:start -->')) {
      const startIdx = existing.indexOf('<!-- docsync:start -->');
      const endIdx = existing.indexOf('<!-- docsync:end -->') + '<!-- docsync:end -->'.length;
      const newContent = existing.slice(0, startIdx) + markerBlock + existing.slice(endIdx);
      writeFileSync(agentsPath, newContent, 'utf8');
      action = 'updated';
    } else {
      const newContent = existing.trimEnd() + '\n\n' + markerBlock + '\n';
      writeFileSync(agentsPath, newContent, 'utf8');
      action = 'appended';
    }
  }

  return {
    ok: true,
    files: [...adapterFiles, ...skillFiles, agentsPath],
    action,
    installed: {
      skillPath: '.agents/skills/docsync/SKILL.md',
      adapterSkillPath: '.docsync/adapters/codex/skills/docsync/SKILL.md',
      agentsBlockPath: '.docsync/adapters/codex/AGENTS.docsync.md',
    },
  };
}
