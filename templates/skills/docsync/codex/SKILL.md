---
name: docsync
description: Synchronize README.md, AGENTS.md, and CLAUDE.md with current repository facts. Use for DocSync init, sync, rules, or documentation drift checks.
---

# DocSync

## Goal

Synchronize README.md, AGENTS.md, and CLAUDE.md with minimal factual edits.

## Command Router

- `init`: verify workspace, create missing core docs, refresh context, report.
- `sync`: full sync by default.
- `sync --fast`: use git facts first; upgrade to full sync when facts are insufficient or high-risk.
- `sync <file...>`: only target README.md, AGENTS.md, or CLAUDE.md.
- `rules`: maintain `.docsync/rules/override.md`.
- `rules show`: print current override rules.

## Steps

1. Inspect current git changes.
2. Read README.md, AGENTS.md, CLAUDE.md.
3. Inspect build/test/lint commands from project files.
4. Apply minimal documentation patches.
5. Run markdownlint if available.
6. Return changed sections and validation evidence.

## Rules

- All DocSync config files are in `.docsync/config/` — do not create root-level config.
- Do not invent commands, ports, env vars, APIs, modules, credentials, or deployment steps.
- Prefer small patches over rewrites.
- Keep AGENTS.md as cross-agent source of truth.
- Keep CLAUDE.md as a thin adapter.
- Mark uncertain facts as `TODO(review)`.
- Do not execute git commit, git push, npm publish.
- Do not read or output .env, tokens, or secrets.
