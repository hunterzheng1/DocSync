---
# 【用户选择配置 - 由 /opsx:propose 引导填写】
mode: "full"           # full=每个能力域独立文档(specs/<capability>/*), simple=单一文档(spec.md/design.md/tasks.md)
test-strategy: "tdd" # tdd=测试先行, impl-first=实现优先, none=无测试
---

## Why

DocSync needs a reusable npm CLI so projects do not repeatedly hand-maintain Repomix, markdownlint, Claude Skill, Codex rule, and AI document-sync workflows. The current manual process causes duplicated setup, drifting documentation rules, invented commands, and inconsistent cross-machine behavior.

## What Changes

- Add a lightweight `docsync` CLI with command routing for `init`, `prep`, `ai`, `auto`, `doctor`, `skill`, `codex`, `version`, and `help`.
- Add safe project initialization templates for Repomix, markdownlint, and document-sync rules.
- Add context preparation, AI workflow orchestration, environment diagnostics, Claude Skill management, and Codex AGENTS marker-block management.
- Add npm package metadata, documentation, release safety checks, and dry-run packaging workflow.
- Keep the first release conservative: no built-in LLM API calls, no token storage, no automatic git commit/push, no automatic npm publish, and no source upload to third-party services.

## Capabilities

### New Capabilities

- `cli-command-routing`: CLI entrypoint, shared argument parsing, command dispatch, help, version, and exit-code behavior.
- `project-initialization`: Safe project template installation with no-overwrite default, `--force`, `--backup`, and `--dry-run`.
- `context-preparation`: Init orchestration, git status reporting, Repomix context generation, and markdownlint formatting.
- `ai-workflow-orchestration`: Document-sync prompt construction plus `docsync ai` and `docsync auto` execution/fallback behavior.
- `environment-diagnostics`: Local tool and global rule status checks for Node.js, npm, git, Repomix, markdownlint-cli2, Claude, Codex, and gh.
- `claude-skill-management`: Install, update, and path lookup for global or project-level Claude Code `doc-sync` Skill.
- `codex-rule-management`: Install, update, and path lookup for Codex global `AGENTS.md` DocSync marker block while preserving user content.
- `package-docs-release-readiness`: Package metadata, docs, npm files whitelist, ignore rules, and release-readiness commands.

### Modified Capabilities

- None. This change introduces a new DocSync CLI capability set.

## Impact

- Affects npm package metadata, CLI entrypoints, command modules, filesystem utilities, templates, documentation, tests, and release safety configuration.
- Uses Node.js `>=18`, npm, local filesystem access, and optional external tools already installed by the user.
- Does not introduce service APIs, databases, token persistence, automatic publishing, or automatic git operations.

# proposal.md - 业务意图与上下文总览

> **定位**：变更的业务意图（Why）与上下文总览
>
> **可选性**：【可跳过，直入spec】若跳过，必须将"影响范围"在 specs 中补齐

---

## 1. 需求背景

DocSync 需要把跨项目文档同步流程沉淀为一个可通过 npm 发布和迭代的 CLI，避免每个仓库重复维护 Repomix、markdownlint、Claude Skill、Codex 规则和 AI 文档同步 prompt。当前手动方案容易造成规则分散、文档漂移、命令编造和跨机器配置不一致。

### 1.1 现状问题

- 每个项目都要手动安装或配置 Repomix、markdownlint、文档同步 prompt 和规则文件，重复成本高。
- Claude Code Skill、Codex 全局规则、项目级规则分散维护，后续规则升级难以同步。
- README.md、AGENTS.md、CLAUDE.md 等文档容易过长、重复、过时，甚至出现 AI 编造命令、模块或部署步骤。
- 使用者缺少一个统一入口来完成环境检查、上下文准备、格式修复和 AI 会话启动。

### 1.2 业务诉求

- 提供固定 CLI 命令 `docsync`，让用户可通过全局安装或 `npx` 在任意项目中运行文档同步工作流。
- 将项目初始化、上下文准备、AI 调用、环境诊断、Claude Skill 管理、Codex 规则管理封装为清晰命令。
- 第一版保持轻量、安全、可审计：不内置 LLM API、不保存 token、不自动提交 git、不自动发布 npm、不上传仓库源码。
- 支持 Windows PowerShell、macOS、Linux、WSL，降低跨平台使用阻力。

---

## 2. 业务目标

| 目标维度 | 具体描述 | 验收标准 |
|---------|---------|---------|
| 功能目标 | 实现可发布的 `docsync` npm CLI，覆盖 init、prep、ai、auto、doctor、skill、codex、version、help 等命令 | 用户可执行 `node bin/docsync.mjs help`、`node bin/docsync.mjs doctor`、`node bin/docsync.mjs init` 等命令获得预期行为 |
| 性能目标 | CLI 保持轻量，第一版不捆绑 Repomix、markdownlint-cli2、LLM SDK 等重依赖 | `package.json` 使用 files 白名单；外部工具通过检测和引导安装处理 |
| 体验目标 | 用户在任意项目中执行 `docsync ai` 即可完成文档同步准备并启动 Claude Code 或获得可复制 prompt | 能按流程自动补齐配置、生成上下文、可选修复 Markdown，并清晰提示下一步 |

---

## 3. 能力分解

### 3.1 新增能力

- `cli-command-routing`: 定义 npm CLI 包、bin 入口、命令分发、通用参数解析和 help/version 行为。
- `project-initialization`: 在项目中安全补齐 Repomix、markdownlint 和文档同步规则模板，遵守不覆盖默认策略。
- `context-preparation`: 编排 init、git 状态输出、Repomix 上下文生成和 markdownlint-cli2 格式修复。
- `ai-workflow-orchestration`: 构建文档同步 prompt，执行 `docsync ai` 与 `docsync auto` 的 Claude Code 启动或 fallback 输出。
- `environment-diagnostics`: 检查 node、npm、git、repomix、markdownlint-cli2、claude、codex、gh 以及全局规则安装状态。
- `claude-skill-management`: 安装、更新、查询 Claude Code 全局或项目级 `doc-sync` Skill。
- `codex-rule-management`: 安装、更新、查询 Codex 全局 AGENTS.md 规则片段，并通过 marker block 保留用户既有内容。
- `package-docs-release-readiness`: 补齐 README、AGENTS、CHANGELOG、LICENSE、npm files 白名单和发布前安全检查约束。

### 3.2 修改能力

- 无。当前 `openspec/specs/` 尚无与 DocSync CLI 相关的既有能力规格，本次为新增能力集合。

---

## 4. 影响范围

### 4.1 涉及模块

- [ ] npm 包元数据：定义包名、版本、bin、files、engines、scripts、仓库信息和发布约束。
- [ ] CLI 入口与命令分发：提供 `docsync` 命令入口、主分发逻辑、错误处理和帮助输出。
- [ ] 命令模块：覆盖 init、prep、ai、auto、doctor、skill、codex、version、help。
- [ ] 工具函数：覆盖路径解析、文件安全写入、模板复制、shell 命令检测与执行、prompt 构建。
- [ ] 模板资产：提供项目配置模板、Claude Skill 模板、Codex AGENTS 片段模板。
- [ ] 项目文档：补齐 README.md、AGENTS.md、CHANGELOG.md、LICENSE 等使用和维护说明。
- [ ] 测试资产：为文件写入、marker block、prompt、init、doctor 等核心行为提供基础测试。
- [ ] 发布安全：通过 npm files 白名单、`.gitignore`、`.npmignore` 和 `npm pack --dry-run` 避免敏感或生成文件进入发布包。

### 4.2 依赖关系

```
[DESIGN.md]
    --> [proposal: implement-docsync-cli]
    --> [specs: CLI / init / prep / ai / doctor / skill / codex / release]
    --> [design.md + tasks.md]
    --> [implementation + tests + package dry-run]
```

### 4.3 数据影响

- 数据库表变更：无。
- 接口变更：无对外服务 API；新增本地 CLI 命令契约和命令行参数契约。
- 配置变更：新增项目模板配置、Claude Skill 文件目标、Codex 全局 AGENTS.md marker block、npm 发布白名单配置。

---

## 5. 约束与假设

### 5.1 业务约束

- 第一版不内置 LLM API 调用，不替代 Repomix、Claude Code、Codex，只做工作流协调。
- 不自动提交 git、不自动发布 npm、不保存 token、不上传仓库源码到第三方服务。
- 默认 GitHub 用户名为 `hunterzheng1`，默认仓库为 `hunterzheng1/docsync`，默认 npm 包名为 `@hunterzheng1/docsync`；若实际 npm scope 不可用，发布前保留调整空间。
- `docsync` 作为 CLI 命令名保持稳定，即使 npm 包名后续变化也不影响用户使用。

### 5.2 技术约束

- Node.js 版本要求为 `>=18`，模块格式为 ESM，包管理器为 npm。
- CLI bin 入口必须以 `#!/usr/bin/env node` 开头，并通过 `package.json` 的 `bin` 字段暴露。
- 第一版避免引入不必要运行时依赖，Repomix 和 markdownlint-cli2 通过外部命令检测与提示处理。
- 必须兼容 Windows PowerShell、macOS、Linux、WSL，路径和 shell 调用不得绑定单一平台。
- 默认不覆盖用户既有文件；只有显式传入 `--force` 时才允许覆盖，传入 `--backup` 时覆盖前需备份。

### 5.3 前置依赖

- [ ] Node.js 与 npm 可用：实现、测试和本地 CLI 验证的基础。
- [ ] DESIGN.md 已作为需求来源：本 proposal 的业务目标和能力域来自该文档。
- [ ] openspec change 已创建：`openspec/changes/implement-docsync-cli/`。
- [ ] npm 发布账号和 scope 可用性待发布前人工确认：不阻塞第一版实现，但影响最终包名。

---

## 6. 风险评估

| 风险项 | 概率 | 影响 | 应对策略 |
|-------|------|------|---------|
| 外部工具版本差异导致 prep/ai 行为不一致 | 中 | 中 | doctor 中清晰展示工具状态；prep 对缺失工具给出安装提示；第一版不强绑版本 |
| 文件写入逻辑误覆盖用户配置 | 中 | 高 | 默认不覆盖；`--force` 才覆盖；支持 `--backup`；对 marker block 做专项测试 |
| Windows 与 Unix shell 行为差异 | 中 | 高 | 路径解析和命令执行独立封装；在验收中覆盖 Windows PowerShell 场景 |
| AI 自动流程修改范围过大 | 中 | 中 | `docsync auto` 第一版保持实验性和保守权限，不允许 git commit、rm、curl/wget、npm publish |
| npm 包发布包含敏感文件或生成文件 | 低 | 高 | 使用 files 白名单、`.npmignore`，发布前必须运行并人工检查 `npm pack --dry-run` |
| 包名 scope 与实际 npm 账号不匹配 | 中 | 中 | 在 README 和发布流程中标注发布前确认；必要时调整为真实 scope 或未占用包名 |

---

## 7. 相关文档

- 需求文档：`DESIGN.md`
- 原型链接：无
- 参考文档：`openspec-templates/proposal.md`、`openspec/specs/overview.md`

---

> **质量红线检查清单**
>
> - [x] 逻辑链路已闭环
> - [x] 受影响模块已明确
> - [x] 依赖关系已梳理
> - [ ] 若跳过本文档，影响范围已在 specs 中补齐
> - [x] 能力分解章节已明确列出所有能力
