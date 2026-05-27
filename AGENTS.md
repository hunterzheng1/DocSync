# DocSync - AGENTS.md

> 本文档为 AI Agent（Claude Code、Codex 等）提供本项目的事实性参考。

## 项目是什么

DocSync 是一个可通过 npm 发布的 CLI 工具（`@hunterzheng/docsync`），用于协调 Repomix、markdownlint、Claude Skill、Codex 规则和 AI 文档同步工作流。

## CLI 命令契约

| 命令 | 子命令 | 用途 |
|------|--------|------|
| `npx @hunterzheng/docsync` | - | npx 无参数引导入口（交互式引导 + 工作区创建） |
| `docsync sync` | `--fast` / `[file...]` | 文档同步（完整模式 / 快速模式 / 指定文件） |
| `docsync version` | - | 显示版本号 |
| `docsync help` | - | 显示帮助信息 |

## AI Slash 命令契约

安装 `.docsync/` 工作区后，AI 通过以下 slash 命令执行操作：

| 命令 | 用途 |
|------|------|
| `/docsync:init` | 项目初始化和首次同步 |
| `/docsync:sync` | 日常文档同步（完整模式） |
| `/docsync:sync --fast` | 快速同步（使用 git 事实） |
| `/docsync:sync [file]` | 同步指定文件 |
| `/docsync:rules` | 维护 override 规则 |
| `/docsync:rules show` | 查看当前规则 |

## 通用选项

- `--force` 允许覆盖已有文件
- `--backup` 覆盖前生成备份（`.bak.<timestamp>`）
- `--dry-run` 只打印计划动作，不执行
- `--verbose` 详细输出
- `--quiet` 精简输出
- `--cwd <path>` 指定目标项目目录

## 文档同步规则

1. 只更新 README.md、AGENTS.md、CLAUDE.md
2. **禁止编造命令、端口、环境变量、API 或部署步骤**
3. 基于仓库事实编写内容，不推测不存在的配置
4. 不确定的内容标记为 `TODO(review)`
5. 保持文档简洁，避免重复和过时信息

## 安全约束

- 不读取或输出 `.env`、token、密钥文件
- 不执行 `git commit`、`git push`、`npm publish`
- 不使用 `curl`/`wget` 下载外部资源
- 不修改凭证或认证文件

## 模块边界

- `src/core/adapters/*.mjs` — Claude / Codex Skill 安装器（从 `templates/skills/docsync/` 复制模板）
- `templates/skills/docsync/` — Skill 源模板（唯一发布源）
- `src/core/workspace.mjs` — `.docsync/` 工作区创建和验证
- `src/commands/init.mjs` — 引导入口（npx 无参数 → runBootstrap）
- `src/commands/sync.mjs` — 文档同步核心逻辑

## 验证要求

- 改 adapter 或 `templates/skills/docsync/` 模板时必须运行 `npm test`
- 新增模板文件后检查 `npm run pack:dry` 确认被打包

## 规则优先级

1. 当前对话中的用户明确指令
2. 安全约束
3. `.docsync/rules/override.md`
4. 仓库事实
5. `.docsync/rules/default.md`

## SDD 工作流

本项目使用 Specification-Driven Development，通过 `/opsx:` 系列命令驱动：

`/opsx:propose` → `/opsx:spec` → `/opsx:design` → `/opsx:task` → `/opsx:check` → `/opsx:apply` → `/opsx:test` → `/opsx:archive`

规格文档位于 `openspec/` 目录。执行变更前必须先读取对应规格的 `spec.md`。

## 开发与测试

```bash
npm test              # 运行全部测试
npm run lint          # ESM 语法检查
npm run pack:dry      # 发布包预检
npm link              # 本地全局 link（开发调试用）
```

## 技术栈

- **运行时**：Node.js >= 18
- **模块格式**：ESM (`"type": "module"`)
- **测试框架**：`node:test` + `node:assert/strict`
- **包管理器**：npm
- **SDD 工具**：OpenSpec + SkyWalk-SDD
