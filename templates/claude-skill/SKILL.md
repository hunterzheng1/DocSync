---
name: doc-sync
description: 文档同步工作流：环境检查、项目初始化、上下文准备、AI 驱动的文档同步、Skill 和 Codex 规则管理
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# DocSync — AI 驱动文档同步

安装 `@hunterzheng/docsync` npm 包后，AI 可通过以下 slash 命令完成全部文档同步工作，**无需在终端手动执行 CLI 命令**。

## Slash 命令总览

| 命令 | 用途 |
|------|------|
| `/docsync:sync` | 完整文档同步（环境检查 → 上下文准备 → 读取 → 对比 → 编辑 → 格式修复 → 报告） |
| `/docsync:sync --fast` | 快速文档同步（使用 git 事实推断影响范围） |
| `/docsync:doctor` | 环境诊断（检查工具/文件状态） |
| `/docsync:init` | 项目初始化（创建模板配置文件） |
| `/docsync:prep` | 上下文准备（生成 repomix 文件） |
| `/docsync:rules` | 规则维护（管理 override.md） |
| `/docsync:rules show` | 查看当前 override 规则完整内容 |
| `/docsync:skill-install` | 安装 Skill 文件到全局或项目 |
| `/docsync:codex-install` | 安装 Codex 全局 AGENTS.md 规则 |

---

## `/docsync:sync` — 完整文档同步

### 前置校验

1. 使用 **Glob** 检查 `.docsync/state/install.json` 是否存在。如不存在，输出错误：`ERR_NO_INSTALL: 未完成引导安装。请先运行 npx @hunterzheng/docsync 初始化。`
2. 使用 **Glob** 检查 `.docsync/config/`、`.docsync/context/`、`.docsync/rules/` 是否存在。如任一缺失，输出错误：`ERR_WORKSPACE_INCOMPLETE: .docsync/ 缺少必需子目录。请重新运行 npx 引导或运行 /docsync:init 修复。`

### 完整模式（默认）

直接调用 CLI 同步命令：

```
npx @hunterzheng/docsync sync [--cwd <path>] [target1] [target2]
```

支持的参数：
- 无参数：同步全部三份核心文档（README.md、AGENTS.md、CLAUDE.md）
- 指定文件：`npx @hunterzheng/docsync sync README.md` — 仅同步 README.md
- 多文件：`npx @hunterzheng/docsync sync README.md AGENTS.md` — 仅同步指定文件
- 带自然语言指令：在 CLI 同步后，根据用户的额外要求手动 **Edit** 补充文档内容

### 快速模式

调用 CLI 快速同步：

```
npx @hunterzheng/docsync sync --fast [target1]
```

快速模式使用轻量 git 事实（最近提交、status --short、diff --name-only）推断影响范围并快速更新。如信息不足或检测到高风险内容，CLI 会自动升级为完整同步。

### 同步报告

CLI 命令执行后会输出同步报告，包含：更新的文件、跳过的文件、使用的事实、同步模式、验证结果。将报告展示给用户。

### 硬性规则

1. 最小化变更：只更新需要的内容，不重写整篇文档
2. 禁止编造：所有命令、端口、环境变量必须来自仓库事实
3. 标记不确定内容：使用 `TODO(review)` 标注
4. 禁止读取或输出密钥、token、凭证
5. 禁止执行 `git commit`、`git push`、`npm publish`

---

## `/docsync:doctor` — 环境诊断

使用 **Bash** 检查工具，**Read** 检查文件：

**必需工具：**

- `node --version`
- `npm --version`
- `git --version`

**推荐工具：**

- `which repomix`
- `which markdownlint-cli2`

**可选工具：**

- `which claude`
- `which codex`
- `which gh`

**全局文件：**

- `~/.claude/skills/doc-sync/SKILL.md`
- `~/.codex/AGENTS.md`

输出每项状态：已安装/未安装、版本号、文件存在/缺失。

---

## `/docsync:init` — 项目初始化

### 前置校验

1. 使用 **Glob** 检查 `.docsync/state/install.json` 是否存在。
2. 使用 **Glob** 检查 `.docsync/` 是否包含 `config`、`context`、`rules` 子目录。

### 初始化流程

1. **安装状态检查**：如 `.docsync/state/install.json` 不存在，提示：`ERR_NO_INSTALL: 未完成引导安装。请先运行 npx @hunterzheng/docsync 初始化。`
2. **工作区完整性检查**：如 `.docsync/` 缺少 rules、config、adapters 等子目录，提示：`ERR_WORKSPACE_INCOMPLETE: .docsync/ 结构不完整。请重新运行 npx 引导或手动修复。`
3. **刷新上下文**：如工作区完整，调用 `npx @hunterzheng/docsync prep` 或手动运行 git status 和 repomix
4. **环境检查**：调用 `npx @hunterzheng/docsync doctor` 展示环境状态
5. **读取规则**：使用 **Read** 读取 `.docsync/rules/default.md` 和 `.docsync/rules/override.md`（如存在）
6. **创建或更新三份核心文档**：对不存在的文档使用下方「嵌入模板」创建（README.md、AGENTS.md、CLAUDE.md）
7. **输出同步报告**：展示创建/更新的文件列表

### 嵌入文档模板

#### README.md 模板（如不存在时创建）

```markdown
# Project

## Overview

TODO: Add project description

## Installation

TODO: Add installation instructions

## Usage

TODO: Add usage instructions
```

#### AGENTS.md 模板（如不存在时创建）

```markdown
# AGENTS.md

## Project Overview

TODO: Add project overview

## DocSync

See .docsync/ for document sync configuration.
```

#### CLAUDE.md 模板（如不存在时创建）

```markdown
# CLAUDE.md

## Project Context

TODO: Add project context
```

---

## `/docsync:rules` — 规则维护

维护 `.docsync/rules/override.md` 文件，支持查看、添加文档级规则、添加 protected content。

### show 子命令

- 使用 **Read** 读取 `.docsync/rules/override.md`
- 展示完整内容给用户

### 无参数查看规则

- 如 override.md 不存在，展示：`当前无 override 规则。你可以补充文档级规则或 ProtectedContent。`
- 如 override.md 存在，展示规则摘要（文件标题、各章节标题），询问用户要补充什么

### 添加文档级规则

- 用户指定目标文件和规则内容时，将规则追加到 `.docsync/rules/override.md`
- 格式：在 `## <targetDoc> Rules` 章节下添加条目，如章节不存在则创建
- 示例：`/docsync:rules README.md 必须使用英文` → 在 override.md 中添加 `## README.md Rules` 章节

### 添加 ProtectedContent

- 用户指定 protected content 时，在 override.md 的 `## ProtectedContent` 章节下添加条目
- 格式：
  ```
  ### <slug>
  Target: <targetDoc>
  Text: <protected text>
  ```
- 如 `## ProtectedContent` 章节不存在则创建

### 通用规则

1. 修改前展示将要追加/修改的内容，等待用户确认
2. 不覆盖 override.md 中已有的规则内容，仅追加或替换同名章节
3. 修改后使用 **Read** 验证最终文件内容

---

## `/docsync:prep` — 上下文准备

### Phase 1: 确保模板存在

参考 `/docsync:init` 检查并创建缺失模板。

### Phase 2: 生成上下文

1. **Git 状态**：**Bash** 运行 `git status --short`
2. **生成上下文**：**Bash** 运行 `repomix -o repomix-output.xml`
3. **格式修复**：**Bash** 运行 `markdownlint-cli2 --fix`（如已安装，可跳过）

---

## `/docsync:skill-install` — 安装 Skill 文件

1. 询问用户目标：
   - **全局**（推荐）：`~/.claude/skills/doc-sync/SKILL.md`
   - **项目**：`.claude/skills/doc-sync/SKILL.md`
2. 使用 **Read** 读取当前 Skill 内容（即本文件内容）
3. 使用 **Write** 写入目标路径
4. 如目标已存在，询问是否覆盖

---

## `/docsync:codex-install` — 安装 Codex 全局规则

1. **Read** 读取 `~/.codex/AGENTS.md`
2. 查找 `<!-- DOCSYNC_START: doc-sync rules -->` 和 `<!-- DOCSYNC_END -->` 标记
3. 如标记不存在，在文件末尾追加；如已存在，替换块内内容
4. **Write** 写入更新后的文件

规则内容：

```markdown
<!-- DOCSYNC_START: doc-sync rules -->
## DocSync 文档同步规则

### 文档职责
- README.md（面向用户）：项目简介、安装、快速开始、命令参考、安全说明
- AGENTS.md（面向 AI Agent）：项目说明、命令契约、开发规则、安全约束
- CLAUDE.md（面向 Claude Code）：项目概览、常用命令、开发规范

### 工作流
1. 使用 Repomix 生成项目上下文（repomix-output.xml）
2. 读取上下文理解代码事实
3. 对比现有文档与代码事实
4. 最小化更新文档（不重写整篇）
5. 运行 markdownlint-cli2 --fix 修复格式

### 安全约束
- 不读取或输出 .env、token、密钥文件
- 不执行 git commit、git push、npm publish
- 不编造命令、端口、环境变量、API
- 不确定内容标记 TODO(review)
<!-- DOCSYNC_END -->
```

---

## 嵌入模板

以下内容为 `/docsync:init` 创建文件时使用的模板。

### repomix.config.json

```json
{
  "output": {
    "filePath": "repomix-output.xml",
    "style": "xml",
    "removeComments": false,
    "removeEmptyLines": true,
    "topFilesLength": 20
  },
  "include": [],
  "ignore": {
    "useGitignore": true,
    "useGlobalPatterns": true,
    "customPatterns": [
      "repomix-output.xml",
      ".env",
      ".env.*",
      "*.pem",
      "*.key",
      "*.p12",
      "*.jks",
      "node_modules/**",
      "dist/**",
      "build/**"
    ]
  }
}
```

### .repomixignore

```
# Repomix ignore patterns
# Exclude sensitive and generated files

.env
.env.*
*.pem
*.key
*.p12
*.jks
*.log

node_modules/
dist/
build/
coverage/
tmp/
temp/

repomix-output.xml
repomix-output.txt

.DS_Store
Thumbs.db
.vscode/
.idea/
```

### .markdownlint-cli2.jsonc

```jsonc
{
  "globs": ["**/*.md"],
  "ignores": ["node_modules/", "dist/", "build/", "repomix-output.xml"],
  "fix": true,
  "markdownlintConfig": {
    "default": true,
    "MD013": false,
    "MD041": false
  }
}
```

### docs/doc-sync-rules.md

```markdown
# DocSync 文档同步规则

## README.md 职责
- 项目简介、安装方式、快速开始、命令列表
- Skill 安装、Codex 规则安装、项目中使用说明
- 发布说明、安全说明、License

## AGENTS.md 职责
- 项目说明、常用命令、开发规则
- 验证要求和安全编辑约束

## CLAUDE.md 职责
- Claude Code 在本项目中的使用指南
- 禁止编造命令、端口、环境变量、API、模块或部署步骤

## 文档同步原则
1. 最小化更新：只同步需要的文档
2. 禁止编造：所有命令、端口、配置必须来自仓库事实
3. TODO(review)：不确定内容必须标记
4. 保持简洁：避免重复和过时信息
```
