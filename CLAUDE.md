# DocSync - CLAUDE.md

> 本文档为 DocSync 项目的 Claude Code 配置指南。

@AGENTS.md

## Claude Code workflow

- 使用 `/docsync:*` 命令完成文档同步（需 `.claude/commands/docsync/` wrapper）
- 使用 `docsync` Skill 处理 README.md、AGENTS.md、CLAUDE.md 同步
- 多文件或 SDD 变更时，先走 `/opsx:*` 流程再实现
- 编辑后先跑最小测试验证

## Claude specific rules

- 优先 `rg` 搜索
- 命令失败时，输出精确的命令和错误摘要再尝试替代
- 仓库证据与本文冲突时，提议更新文档而非猜测

## Skill usage

- 改 adapter 或 `templates/skills/docsync/` 时必须运行 `npm test`
- 长流程委托给 Skill，不塞进 CLAUDE.md
- 路径级规则放 `.claude/rules/`

## 开发规范

- ESM 模块（`"type": "module"`），文件扩展名 `.mjs`
- 路径处理用 `node:path`，跨平台兼容
- 测试框架：`node:test` + `node:assert/strict`，TDD 优先
- npm 发布使用 `files` 白名单，排除测试和敏感配置

## 发布版本号规则

- SemVer：`MAJOR.MINOR.PATCH`
- `0.x` 阶段破坏性变更至少增加 `MINOR`
- 发布前至少运行 `npm test`、`npm run lint`、`npm run pack:dry`
- 不自动执行 `npm version`、`git commit`、`git push` 或 `npm publish`

## Git 提交规范

```
<type>(<scope>): <subject>中文

<body>中文

<footer>
```
