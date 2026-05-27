import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, writeText } from '../../utils/fs.mjs';

const SKILL_CONTENT = `---
name: doc-sync
description: Synchronize README.md, AGENTS.md, and CLAUDE.md with repository facts. Use when project docs are stale after code, command, CI, API, dependency, or architecture changes.
---

# doc-sync

Update project documentation with minimal factual edits.

## Slash 命令总览

安装 \`@hunterzheng/docsync\` 后，AI 通过以下 slash 命令完成文档同步：

| 命令 | 用途 |
|------|------|
| \`/docsync:sync\` | 完整文档同步 |
| \`/docsync:sync --fast\` | 快速文档同步（使用 git 事实） |
| \`/docsync:init\` | 项目初始化 |
| \`/docsync:rules\` | 规则维护 |

## Steps

1. Inspect current git changes (\`git status --short\`, \`git diff --stat\`).
2. Read README.md, AGENTS.md, CLAUDE.md.
3. Generate context: \`repomix --config .docsync/config/repomix.config.json --ignore-file .docsync/config/repomixignore\`
4. Inspect build/test/lint commands from project files.
5. Apply minimal documentation patches.
6. Run markdownlint: \`markdownlint-cli2 --config .docsync/config/markdownlint-cli2.jsonc\`
7. Return changed sections and validation evidence.

## Rules

- All DocSync config files are in \`.docsync/config/\` — do not create root-level config.
- Do not invent commands, ports, env vars, APIs, modules, credentials, or deployment steps.
- Prefer small patches over rewrites.
- Keep AGENTS.md as cross-agent source of truth.
- Keep CLAUDE.md as a thin adapter.
- Mark uncertain facts as \`TODO(review)\`.
- Do not execute git commit, git push, npm publish.
- Do not read or output .env, tokens, or secrets.
`;

const DOCSYNC_BLOCK = `<!-- docsync:start -->
## DocSync

DocSync manages document synchronization for this project. Use slash commands instead of manual CLI.

### Commands
- \`/docsync:init\` - Project initialization
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
  const skillDir = join(cwd, '.agents', 'skills', 'docsync');

  // Ensure directories
  mkdirSync(adapterDir, { recursive: true });
  mkdirSync(skillDir, { recursive: true });

  // Write adapter source
  const adapterPath = join(adapterDir, 'SKILL.md');
  if (!existsSync(adapterPath)) {
    writeFileSync(adapterPath, SKILL_CONTENT, 'utf8');
  }

  // Copy SKILL.md to .agents/skills/doc-sync/
  const skillPath = join(skillDir, 'SKILL.md');
  await writeText(skillPath, SKILL_CONTENT);

  // Update or create AGENTS.md with marker block
  const agentsPath = join(cwd, 'AGENTS.md');

  if (!existsSync(agentsPath)) {
    // Create new AGENTS.md with DocSync block
    const content = `# AGENTS.md\n\n${DOCSYNC_BLOCK}\n`;
    await writeText(agentsPath, content);
    return { ok: true, files: [adapterPath, skillPath, agentsPath], action: 'created' };
  }

  // Update existing AGENTS.md
  const existing = readFileSync(agentsPath, 'utf8');

  if (existing.includes('<!-- docsync:start -->')) {
    // Replace existing block
    const startIdx = existing.indexOf('<!-- docsync:start -->');
    const endIdx = existing.indexOf('<!-- docsync:end -->') + '<!-- docsync:end -->'.length;
    const newContent = existing.slice(0, startIdx) + DOCSYNC_BLOCK + existing.slice(endIdx);
    await writeText(agentsPath, newContent);
    return { ok: true, files: [adapterPath, skillPath, agentsPath], action: 'updated' };
  }

  // Append new block
  const newContent = existing.trimEnd() + '\n\n' + DOCSYNC_BLOCK + '\n';
  await writeText(agentsPath, newContent);
  return { ok: true, files: [adapterPath, skillPath, agentsPath], action: 'appended' };
}
