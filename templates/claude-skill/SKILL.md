---
name: doc-sync
description: "Document synchronization for README.md, AGENTS.md, CLAUDE.md — context preparation, environment diagnostics, and AI-driven sync workflows"
argument-hint: "[sync|doctor|init|prep|skill-install|codex-install]"
license: MIT
metadata:
  author: hunterzheng
  version: "0.2.0"
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# DocSync - AI-Driven Document Sync Skill

## 1. 技能定位

| 维度 | 内容 |
|------|------|
| 核心问题 | 项目文档（README.md, AGENTS.md, CLAUDE.md）与代码事实不同步 |
| 关键输出 | 更新后的 3 个文档文件 |
| 前置依赖 | Repomix（生成项目上下文）、Node.js（运行环境） |
| 上游依赖 | 代码库事实 + repomix-output.xml |
| 不做什么 | 不修改业务代码、不处理密钥、不自动提交 git、不发布 npm |

## 2. Slash 命令总览

| Slash 命令 | 用途 | 预计耗时 |
|-----------|------|---------|
| `/docsync:sync` | 完整文档同步工作流 | 5-15 分钟 |
| `/docsync:doctor` | 环境诊断（工具/文件检查） | 1 分钟 |
| `/docsync:init` | 项目初始化（安装模板配置） | 1 分钟 |
| `/docsync:prep` | 上下文准备（生成 repomix 文件） | 3-10 分钟 |
| `/docsync:skill-install` | 安装 Claude Skill 到全局或项目 | 30 秒 |
| `/docsync:codex-install` | 安装 Codex 全局 AGENTS.md 规则 | 30 秒 |

---

## 3. `/docsync:sync` — 完整文档同步工作流

**触发条件**：用户要求同步/更新/创建项目文档（README.md, AGENTS.md, CLAUDE.md）

### Phase 1: 环境检查

1. **Bash** 运行 `docsync doctor` 或手动检查：
   - `node --version` — Node.js 是否可用
   - `which repomix` — Repomix 是否已安装
2. 如果 repomix 缺失，**Bash** 提示用户 `npm i -g repomix` 并暂停
3. 如果 repomix 可用，进入 Phase 2

### Phase 2: 上下文准备

1. **Bash** 运行 `docsync prep` 或手动执行：
   ```bash
   repomix -o repomix-output.xml
   ```
2. 如果已有 `repomix-output.xml` 且用户确认是最新的，可跳过此阶段
3. 确认 `repomix-output.xml` 存在且非空后，进入 Phase 3

### Phase 3: 读取项目上下文

1. **Read** 读取 `repomix-output.xml` 了解项目结构、代码、已有文档
2. **Bash** 运行 `git status --short` 查看当前变更
3. **Bash** 运行 `git diff --stat` 查看最近改动摘要
4. **Glob** 搜索 `**/*.md` 列出所有 Markdown 文件

### Phase 4: 读取目标文档

对以下存在的文件逐一 **Read**（不存在的跳过，将在 Phase 5 创建）：

| 文件 | 目标读者 | 职责 |
|------|---------|------|
| `README.md` | 用户 | 项目简介、安装、快速开始、命令参考、开发指南 |
| `AGENTS.md` | AI Agent | 项目说明、命令契约、开发规则、安全约束 |
| `CLAUDE.md` | Claude Code | Claude 使用指南、SDD 工作流、开发规范、目录结构 |

### Phase 5: 识别差异并执行编辑

基于 Phase 3 的代码事实和 Phase 4 的现有文档：

1. **对比分析**：识别文档中与代码事实不一致、遗漏或过时的内容
2. **最小变更**：使用 **Edit** 工具执行精准修改，不重写整篇文档
3. **新建文件**：如果目标文档不存在，使用 **Write** 创建完整内容
4. **标记不确定内容**：使用 `TODO(review)` 标注推测内容

**编辑规则：**
- 只更新需要改动的章节，不复制粘贴整个文件
- 所有命令、端口、环境变量必须来自 Phase 3 的代码事实
- 禁止编造不存在的配置、API 或部署步骤
- 保持文档简洁，避免重复

### Phase 6: 格式修复

1. **Bash** 运行 `markdownlint-cli2 --fix`（如果已安装）
2. 如果 markdownlint-cli2 未安装，跳过此阶段

### Phase 7: 报告

向用户输出结构化报告：

```
文档同步完成：

已更新的文件：
- README.md: [简述变更内容，如"更新命令参考部分"]
- AGENTS.md: [简述变更内容]
- CLAUDE.md: [简述变更内容]

新创建的文件：
- [文件名]: [简述内容]（如有）

使用的代码事实：
- [从上下文中引用的关键事实]

TODO(review) 项：
- [不确定的内容]（如有）
```

---

## 4. `/docsync:doctor` — 环境诊断

**触发条件**：用户询问环境状态、工具是否安装、Skill 是否配置

### 执行步骤

1. **Bash** 运行 `docsync doctor`（首选）

   如果 `docsync` 命令不可用，手动检查：

   **必需工具：**
   - **Bash** `node --version` — Node.js
   - **Bash** `npm --version` — npm

   **推荐工具：**
   - **Bash** `git --version` — Git
   - **Bash** `which repomix` — Repomix（生成上下文）
   - **Bash** `which markdownlint-cli2` — Markdown 格式修复

   **可选工具：**
   - **Bash** `which claude` — Claude Code
   - **Bash** `which codex` — Codex
   - **Bash** `which gh` — GitHub CLI

2. **Read** 检查全局文件：
   - Claude Skill: `~/.claude/skills/doc-sync/SKILL.md`（Windows: `%USERPROFILE%\.claude\skills\doc-sync\SKILL.md`）
   - Codex Rules: `~/.codex/AGENTS.md`

3. 向用户报告：
   - 已安装的工具及版本
   - 缺失的工具及安装命令
   - Skill/Rule 文件是否已安装

---

## 5. `/docsync:init` — 项目初始化

**触发条件**：用户要在项目中安装 DocSync 模板配置

### 执行步骤

1. **Bash** 运行 `docsync init`（首选）

   如果 `docsync` 不可用，手动创建缺失文件：

   | 文件 | 内容来源 | 模板位置 |
   |------|---------|---------|
   | `repomix.config.json` | Repomix 配置 | DocSync 包的 `templates/project/` |
   | `.repomixignore` | Repomix 忽略规则 | DocSync 包的 `templates/project/` |
   | `.markdownlint-cli2.jsonc` | Markdown 配置 | DocSync 包的 `templates/project/` |
   | `docs/doc-sync-rules.md` | 文档同步规则 | DocSync 包的 `templates/project/` |

2. **Write** 创建不存在的文件（默认不覆盖已有文件）
3. 向用户报告创建/跳过的文件列表

---

## 6. `/docsync:prep` — 上下文准备

**触发条件**：用户要生成项目上下文供 AI 读取

### 执行步骤

1. **Bash** 运行 `docsync prep`（首选）

   如果 `docsync` 不可用，手动执行：

   - **Bash** `docsync init` 或确保模板文件存在
   - **Bash** `git status` 输出当前状态
   - **Bash** `repomix -o repomix-output.xml` 生成上下文
   - **Bash** `markdownlint-cli2 --fix` 修复格式问题（可选）

2. 确认 `repomix-output.xml` 已生成且非空
3. 向用户报告各步骤完成情况

---

## 7. `/docsync:skill-install` — 安装 Claude Skill

**触发条件**：用户要求安装 DocSync Skill

### 执行步骤

1. 询问用户安装目标：
   - **全局**：`~/.claude/skills/doc-sync/SKILL.md`（所有项目可用）
   - **项目**：`<项目根>/.claude/skills/doc-sync/SKILL.md`（仅当前项目可用）

2. **Bash** 运行对应安装命令：
   ```bash
   docsync skill install          # 全局安装
   docsync skill install --project  # 项目安装
   docsync skill install --cwd /path/to/project  # 指定项目安装
   ```

3. 如果 `docsync` 命令不可用，告知用户先 `npm i -g @hunterzheng/docsync`

---

## 8. `/docsync:codex-install` — 安装 Codex 规则

**触发条件**：用户要求安装 DocSync 的 Codex 全局规则

### 执行步骤

1. **Bash** 运行 `docsync codex install`

2. 如果 `docsync` 不可用，告知用户先 `npm i -g @hunterzheng/docsync`

3. 说明安装效果：
   - 在 `~/.codex/AGENTS.md` 中插入 DocSync 规则片段
   - 使用 `<!-- DOCSYNC_START: doc-sync rules -->` 和 `<!-- DOCSYNC_END -->` 标记块
   - 保留用户已有内容

---

## 9. 文档职责分工

| 文档 | 目标读者 | 必须包含 | 避免包含 |
|------|---------|---------|---------|
| **README.md** | 项目使用者 | 简介、安装、快速开始、命令参考、License | 内部架构细节、开发规范 |
| **AGENTS.md** | AI Agent | 命令契约、开发规则、安全约束、验证要求 | 面向用户的营销内容 |
| **CLAUDE.md** | Claude Code | 常用命令、SDD 工作流、代码风格、目录结构 | 其他 AI 工具的规则 |

## 10. 硬性规则

1. **禁止编造**：所有命令、端口、环境变量、API、模块必须来自仓库事实
2. **最小变更**：只更新需要的部分，不重写整篇文档
3. **TODO(review)**：不确定的内容必须标记
4. **不处理密钥**：禁止读取或输出 `.env`、token、凭证文件
5. **不执行危险操作**：禁止 `git commit`、`git push`、`npm publish`
6. **不下载外部资源**：禁止 `curl`/`wget` 下载
7. **保持简洁**：避免重复和过时信息

## 11. 跨平台执行规则

- Windows 路径使用正斜杠或双引号包裹
- 路径变量：Windows 用 `%USERPROFILE%`，macOS/Linux 用 `$HOME`
- Shell 兼容性：优先使用 `Bash` 工具，避免 PowerShell 特有语法
- npm 全局路径：`npm config get prefix` 获取准确路径

## 12. 何时使用 / 何时不使用

### 适合使用 DocSync 的场景
- 代码结构、依赖、命令、测试发生重大变化后
- 新增/删除模块、API、Agent 规则后
- CI/CD 流程变更后
- 项目文档明显落后于代码事实

### 不适合使用 DocSync 的场景
- 没有实质性的代码或配置变更
- 只修改了无关紧要的文件
- 正在活跃调试中（等稳定状态后再同步）
