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
| `/docsync:doctor` | 环境诊断（检查工具/文件状态） |
| `/docsync:init` | 项目初始化（创建模板配置文件） |
| `/docsync:prep` | 上下文准备（生成 repomix 文件） |
| `/docsync:skill-install` | 安装 Skill 文件到全局或项目 |
| `/docsync:codex-install` | 安装 Codex 全局 AGENTS.md 规则 |

---

## `/docsync:sync` — 完整文档同步

### Phase 1: 环境检查

使用 **Bash** 逐一检查：

```
node --version
npm --version
git --version
which repomix
which markdownlint-cli2
```

如果 Node.js、npm、git 缺失，提示用户安装并暂停。如果 repomix 缺失，提示 `npm i -g repomix` 并暂停。markdownlint-cli2 为可选，缺失则跳过格式修复步骤。

### Phase 2: 项目初始化

确保下方「嵌入模板」中的 4 个文件存在于项目中。使用 **Glob** 检查是否存在，对缺失的文件使用 **Write** 创建（内容来自嵌入模板）。**不要覆盖已有文件**。

### Phase 3: 准备上下文

1. **Bash** 运行 `git status --short` 输出当前状态
2. **Bash** 运行 `repomix -o repomix-output.xml` 生成上下文
3. **Bash** 运行 `markdownlint-cli2 --fix` 修复格式（如已安装）

### Phase 4: 读取项目上下文

使用 **Read** 读取 `repomix-output.xml`，理解项目结构、代码和现有文档。
使用 **Glob** 搜索 `**/*.md` 列出所有 Markdown 文件。

### Phase 5: 对比与编辑

对比代码事实与现有文档，使用 **Edit** 或 **Write** 更新：

| 文档 | 面向 | 核心内容 |
|------|------|----------|
| README.md | 用户 | 简介、安装、快速开始、命令参考、开发指南、安全说明 |
| AGENTS.md | AI Agent | 项目说明、命令契约、开发规则、验证要求、安全约束 |
| CLAUDE.md | Claude Code | 项目概览、常用命令、开发规范、目录结构 |

**硬性规则：**

1. 最小化变更：只更新需要的内容，不重写整篇文档
2. 禁止编造：所有命令、端口、环境变量必须来自仓库事实
3. 标记不确定内容：使用 `TODO(review)` 标注
4. 禁止读取或输出密钥、token、凭证
5. 禁止执行 `git commit`、`git push`、`npm publish`

### Phase 6: 格式修复

**Bash** 运行 `markdownlint-cli2 --fix`（如已安装）。

### Phase 7: 报告

输出：更新的文件列表及变更摘要、使用的代码事实、TODO(review) 项。

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

使用 **Glob** 检查以下 4 个文件是否存在，对缺失的使用 **Write** 创建（内容来自下方「嵌入模板」章节）。**不覆盖已有文件**。完成后输出创建的文件列表。

| 文件 | 用途 |
|------|------|
| `repomix.config.json` | Repomix 配置 |
| `.repomixignore` | Repomix 忽略规则 |
| `.markdownlint-cli2.jsonc` | Markdown 格式配置 |
| `docs/doc-sync-rules.md` | 文档同步规则 |

---

## `/docsync:prep` — 上下文准备

1. **确保模板存在**：参考 `/docsync:init` 检查并创建缺失模板
2. **Git 状态**：**Bash** 运行 `git status --short`
3. **生成上下文**：**Bash** 运行 `repomix -o repomix-output.xml`
4. **格式修复**：**Bash** 运行 `markdownlint-cli2 --fix`（如已安装，可跳过）

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
