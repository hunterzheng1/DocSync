import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, writeText } from '../../utils/fs.mjs';

const DOCSYNC_BLOCK = `<!-- docsync:start -->
## DocSync

DocSync manages document synchronization for this project.

### Commands
- \`/docsync:init\` - Project initialization and first-time sync
- \`/docsync:sync\` - Daily document sync
- \`/docsync:sync --fast\` - Quick sync using git facts
- \`/docsync:sync [file]\` - Sync specific file(s)
- \`/docsync:rules\` - Maintain override rules

### Rules
- Detailed rules: \`.docsync/rules/default.md\`
- Override rules: \`.docsync/rules/override.md\`

### Safety Constraints
- Do NOT execute git commit, git push, npm publish
- Do NOT invent commands, ports, environment variables, APIs, or deployment steps
- Do NOT read or output .env, tokens, or secrets
- Mark uncertain content as TODO(review)

### Rule Priority
1. User explicit instruction in current conversation
2. Safety constraints
3. .docsync/rules/override.md
4. Repository facts
5. .docsync/rules/default.md
<!-- docsync:end -->`;

export async function installCodexAdapter(cwd = process.cwd()) {
  const adapterDir = join(cwd, '.docsync', 'adapters', 'codex');
  mkdirSync(adapterDir, { recursive: true });

  // Write adapter source
  const adapterPath = join(adapterDir, 'AGENTS.docsync.md');
  if (!existsSync(adapterPath)) {
    writeFileSync(adapterPath, DOCSYNC_BLOCK, 'utf8');
  }

  // Update or create AGENTS.md
  const agentsPath = join(cwd, 'AGENTS.md');

  if (!existsSync(agentsPath)) {
    // Create new AGENTS.md with DocSync block
    const content = `# AGENTS.md\n\n${DOCSYNC_BLOCK}\n`;
    await writeText(agentsPath, content);
    return { ok: true, files: [adapterPath, agentsPath], action: 'created' };
  }

  // Update existing AGENTS.md
  const existing = readFileSync(agentsPath, 'utf8');

  if (existing.includes('<!-- docsync:start -->')) {
    // Replace existing block
    const startIdx = existing.indexOf('<!-- docsync:start -->');
    const endIdx = existing.indexOf('<!-- docsync:end -->') + '<!-- docsync:end -->'.length;
    const newContent = existing.slice(0, startIdx) + DOCSYNC_BLOCK + existing.slice(endIdx);
    await writeText(agentsPath, newContent);
    return { ok: true, files: [adapterPath, agentsPath], action: 'updated' };
  }

  // Append new block
  const newContent = existing.trimEnd() + '\n\n' + DOCSYNC_BLOCK + '\n';
  await writeText(agentsPath, newContent);
  return { ok: true, files: [adapterPath, agentsPath], action: 'appended' };
}
