# DocSync - AGENTS.md

> 本文档为 AI Agent（Claude Code、Codex 等）提供本项目的事实性参考。

## 项目是什么

DocSync 是一个可通过 npm 发布的 CLI 工具（`@hunterzheng/docsync`），用于协调 Repomix、markdownlint、Claude Skill、Codex 规则和 AI 文档同步工作流。

## CLI 命令契约

| 命令 | 子命令 | 用途 |
|------|--------|------|
| `docsync init` | - | 在项目中安全初始化模板文件 |
| `docsync prep` | - | 准备项目上下文（init → git 状态 → repomix → markdownlint） |
| `docsync ai` | - | 启动交互式文档同步（Claude Code） |
| `docsync auto` | - | 非交互式文档同步（实验性，保守权限） |
| `docsync doctor` | - | 检查本地环境和工具安装状态 |
| `docsync skill` | install / update / path | 管理 Claude Code Skill 文件 |
| `docsync codex` | install / update / path | 管理 Codex 全局 AGENTS.md 规则 |
| `docsync version` | - | 显示版本号 |
| `docsync help` | - | 显示帮助信息 |

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

## SDD 工作流

本项目使用 Specification-Driven Development，通过 `/opsx:` 系列命令驱动：

`/opsx:propose` → `/opsx:spec` → `/opsx:design` → `/opsx:task` → `/opsx:check` → `/opsx:apply` → `/opsx:test` → `/opsx:archive`

规格文档位于 `openspec/` 目录。执行变更前必须先读取对应规格的 `spec.md`。

## 开发与测试

```bash
# 运行全部测试
npm test

# 语法检查
npm run lint

# 发布包预检
npm run pack:dry

# 本地全局 link（开发调试用）
npm link
```

## 技术栈

- **运行时**：Node.js >= 18
- **模块格式**：ESM (`"type": "module"`)
- **测试框架**：`node:test` + `node:assert/strict`
- **包管理器**：npm
- **SDD 工具**：OpenSpec + SkyWalk-SDD
