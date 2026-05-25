# DocSync - CLAUDE.md

> 本文档为 DocSync 项目的 Claude Code 配置指南。

## 项目概述

DocSync 是一个可通过 npm 发布的 CLI 工具，用于协调 Repomix、markdownlint、Claude Skill、Codex 规则和 AI 文档同步工作流。用户可在任意项目中通过 `docsync` 命令完成环境检查、上下文准备、格式修复和文档同步。

- **包名**：`@hunterzheng/docsync`
- **运行环境**：Node.js >= 18，ESM 模块格式
- **CLI 入口**：`bin/docsync.mjs`
- **命令分发**：`src/cli.mjs`

## 常用命令

```bash
docsync help      # 查看所有命令
docsync doctor    # 检查环境状态
docsync init      # 初始化项目模板
docsync prep      # 准备文档同步上下文
docsync ai        # 启动交互式文档同步
docsync auto      # 非交互式文档同步（实验性）
docsync skill     # 管理 Claude Code Skill 文件
docsync codex     # 管理 Codex 全局规则文件
```

## SDD 工作流

本项目使用 Specification-Driven Development (SDD) 流程，通过 `/opsx:` 前缀命令驱动：

| 阶段 | 命令 | 用途 |
|------|------|------|
| propose | `/opsx:propose` | 创建变更提案 |
| spec | `/opsx:spec` | 定义技术规格 |
| design | `/opsx:design` | 设计实现方案 |
| task | `/opsx:task` | 拆解任务清单 |
| check | `/opsx:check` | 质量门禁检查 |
| apply | `/opsx:apply` | 实施代码变更 |
| test | `/opsx:test` | 执行单元测试 |
| archive | `/opsx:archive` | 归档变更并生成报告 |

### 变更命名规范

- 使用 kebab-case，如 `implement-docsync-cli`
- 规格文件位于 `openspec/changes/<name>/specs/<capability>/`
- 归档后移至 `openspec/changes/archive/<date>-<name>/`
- 正式规格同步至 `openspec/specs/<capability>/spec.md`

### 遥测系统

SkyWalk-SDD 遥测记录在 `skywalk-sdd/events/`（已 gitignore）。使用 `node skywalk-sdd/log.cjs` 记录事件。

## 开发规范

### 测试

```bash
npm test              # 运行全部测试
npm run lint          # ESM 语法检查
npm run pack:dry      # 发布包预检
```

- 测试框架：`node:test` + `node:assert/strict`
- 测试文件位于 `test/` 目录
- TDD 优先：先写测试，再实现，再重构

### 代码风格

- ESM 模块（`"type": "module"`）
- 不使用 CommonJS `require`
- 文件扩展名使用 `.mjs`
- 路径处理使用 `node:path`，避免硬编码分隔符
- 跨平台兼容 Windows PowerShell / macOS / Linux

### 安全约束

- 不读取或输出 `.env`、token、密钥文件
- 不执行 `git commit`、`git push`、`npm publish`
- 不使用 `curl`/`wget` 下载外部资源
- 不修改凭证或认证文件
- npm 发布使用 `files` 白名单，排除测试、生成文件和敏感配置

### Git 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

示例：
```
feat(init): 初始化 OpenSpec 项目

- 添加 OpenSpec + OpenCode 使用指南文档
- 安装并初始化 OpenSpec CLI (v1.2.0)

Closes #1
```

## 目录结构

```
DocSync/
├── bin/docsync.mjs          # CLI 入口
├── src/
│   ├── cli.mjs              # 命令分发核心
│   ├── commands/            # 各子命令实现
│   └── utils/               # 工具函数（fs, git, shell, paths, args, logger, prompt）
├── templates/               # 模板资产
│   ├── project/             # 项目配置模板
│   ├── claude-skill/        # Claude Skill 模板
│   └── codex/               # Codex AGENTS 模板
├── test/                    # 单元测试
├── openspec/                # SDD 规格文档
│   ├── specs/               # 正式规格（归档后同步至此）
│   └── changes/             # 变更中的文档（提案→归档）
└── skywalk-sdd/             # 遥测与度量（本地，不提交）
```
