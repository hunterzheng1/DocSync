import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ensureDir, writeText } from '../../utils/fs.mjs';

const SKILL_CONTENT = `---
name: doc-sync
description: "DocSync - document synchronization for this project"
---

# DocSync Skill

## Commands

### /docsync:init
Project initialization and first-time sync.
1. Check .docsync/state/install.json
2. Check environment
3. Verify .docsync/ workspace
4. Read rules (default.md + override.md)
5. Generate context (git status, repomix, docs inventory)
6. Sync README.md, AGENTS.md, CLAUDE.md
7. Run markdown fix
8. Output sync report

### /docsync:sync
Daily document sync.
1. Check .docsync/ workspace and rules
2. Refresh git status
3. Scan project structure
4. Generate/refresh repomix context
5. Compare core docs
6. Sync all core docs by rules
7. Run markdown fix
8. Output sync report

Use \`/docsync:sync --fast\` for small changes (uses git facts only).
Use \`/docsync:sync README.md\` to sync a specific file.

### /docsync:rules
Maintain .docsync/rules/override.md.
- \`/docsync:rules\` - show current rules
- \`/docsync:rules README.md 必须使用英文\` - add rule
- \`/docsync:rules show\` - show full rules

## Safety Constraints
- Do NOT execute git commit, git push, npm publish
- Do NOT invent commands, ports, environment variables, APIs, or deployment steps
- Do NOT read or output .env, tokens, or secrets
- Mark uncertain content as TODO(review)

## Rule Priority
1. User explicit instruction in current conversation
2. Safety constraints
3. .docsync/rules/override.md
4. Repository facts
5. .docsync/rules/default.md
6. DocSync templates
`;

export async function installClaudeAdapter(cwd = process.cwd()) {
  const adapterDir = join(cwd, '.docsync', 'adapters', 'claude');
  const targetDir = join(cwd, '.claude', 'skills', 'docsync');

  // Ensure directories
  mkdirSync(adapterDir, { recursive: true });
  mkdirSync(targetDir, { recursive: true });

  // Write adapter source
  const adapterPath = join(adapterDir, 'SKILL.md');
  if (!existsSync(adapterPath)) {
    writeFileSync(adapterPath, SKILL_CONTENT, 'utf8');
  }

  // Copy to target
  const targetPath = join(targetDir, 'SKILL.md');
  await writeText(targetPath, SKILL_CONTENT);

  return { ok: true, files: [adapterPath, targetPath] };
}
