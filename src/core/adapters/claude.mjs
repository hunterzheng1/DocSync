import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ensureDir, writeText } from '../../utils/fs.mjs';

const SKILL_CONTENT = `---
name: doc-sync
description: 文档同步工作流：环境检查、项目初始化、上下文准备、AI 驱动的文档同步、规则管理
---

# DocSync — AI 驱动文档同步

安装 \`@hunterzheng/docsync\` npm 包后，AI 通过以下 slash 命令完成文档同步，**无需在终端手动执行 CLI 命令**。

## Slash 命令总览

| 命令 | 用途 |
|------|------|
| \`/docsync:sync\` | 完整文档同步（环境检查 → 上下文准备 → 读取 → 对比 → 编辑 → 格式修复 → 报告） |
| \`/docsync:sync --fast\` | 快速文档同步（使用 git 事实推断影响范围） |
| \`/docsync:init\` | 项目初始化（创建模板配置文件） |
| \`/docsync:rules\` | 规则维护（管理 override.md） |
| \`/docsync:rules show\` | 查看当前 override 规则完整内容 |

---

## \`/docsync:sync\` — 完整文档同步

### 前置校验

1. 使用 **Glob** 检查 \`.docsync/state/install.json\` 是否存在。如不存在，输出错误：\`ERR_NO_INSTALL: 未完成引导安装。请先运行 npx @hunterzheng/docsync 初始化。\`
2. 使用 **Glob** 检查 \`.docsync/config/\`、\`.docsync/context/\`、\`.docsync/rules/\` 是否存在。如任一缺失，输出错误：\`ERR_WORKSPACE_INCOMPLETE: .docsync/ 缺少必需子目录。请重新运行 npx 引导或运行 /docsync:init 修复。\`

### 完整模式（默认）

调用 CLI 同步命令：

\`\`\`
npx @hunterzheng/docsync sync [--cwd <path>] [target1] [target2]
\`\`\`

支持的参数：
- 无参数：同步全部三份核心文档（README.md、AGENTS.md、CLAUDE.md）
- 指定文件：\`npx @hunterzheng/docsync sync README.md\` — 仅同步 README.md
- 多文件：\`npx @hunterzheng/docsync sync README.md AGENTS.md\` — 仅同步指定文件
- 带自然语言指令：在 CLI 同步后，根据用户的额外要求手动 **Edit** 补充文档内容

### 快速模式

调用 CLI 快速同步：

\`\`\`
npx @hunterzheng/docsync sync --fast [target1]
\`\`\`

快速模式使用轻量 git 事实（最近提交、status --short、diff --name-only）推断影响范围并快速更新。如信息不足或检测到高风险内容，CLI 会自动升级为完整同步。

### 同步报告

CLI 命令执行后会输出同步报告，包含：更新的文件、跳过的文件、使用的事实、同步模式、验证结果。将报告展示给用户。

### 硬性规则

1. 最小化变更：只更新需要的内容，不重写整篇文档
2. 禁止编造：所有命令、端口、环境变量必须来自仓库事实
3. 标记不确定内容：使用 \`TODO(review)\` 标注
4. 禁止读取或输出密钥、token、凭证
5. 禁止执行 \`git commit\`、\`git push\`、\`npm publish\`

---

## \`/docsync:init\` — 项目初始化

### 前置校验

1. 使用 **Glob** 检查 \`.docsync/state/install.json\` 是否存在。
2. 使用 **Glob** 检查 \`.docsync/\` 是否包含 \`config\`、\`context\`、\`rules\` 子目录。

### 初始化流程

1. **安装状态检查**：如 \`.docsync/state/install.json\` 不存在，提示：\`ERR_NO_INSTALL: 未完成引导安装。请先运行 npx @hunterzheng/docsync 初始化。\`
2. **工作区完整性检查**：如 \`.docsync/\` 缺少 rules、config、adapters 等子目录，提示：\`ERR_WORKSPACE_INCOMPLETE: .docsync/ 结构不完整。请重新运行 npx 引导或手动修复。\`
3. **读取规则**：使用 **Read** 读取 \`.docsync/rules/default.md\` 和 \`.docsync/rules/override.md\`（如存在）
4. **创建或更新三份核心文档**：对不存在的文档使用下方「嵌入模板」创建（README.md、AGENTS.md、CLAUDE.md）
5. **输出同步报告**：展示创建/更新的文件列表

### 嵌入文档模板

#### README.md 模板（如不存在时创建）

\`\`\`markdown
# Project

## Overview

TODO: Add project description

## Installation

TODO: Add installation instructions

## Usage

TODO: Add usage instructions
\`\`\`

#### AGENTS.md 模板（如不存在时创建）

\`\`\`markdown
# AGENTS.md

## Project Overview

TODO: Add project overview

## DocSync

See .docsync/ for document sync configuration.
\`\`\`

#### CLAUDE.md 模板（如不存在时创建）

\`\`\`markdown
# CLAUDE.md

## Project Context

TODO: Add project context
\`\`\`

---

## \`/docsync:rules\` — 规则维护

维护 \`.docsync/rules/override.md\` 文件，支持查看、添加文档级规则、添加 protected content。

### show 子命令

- 使用 **Read** 读取 \`.docsync/rules/override.md\`
- 展示完整内容给用户

### 无参数查看规则

- 如 override.md 不存在，展示：\`当前无 override 规则。你可以补充文档级规则或 ProtectedContent。\`
- 如 override.md 存在，展示规则摘要（文件标题、各章节标题），询问用户要补充什么

### 添加文档级规则

- 用户指定目标文件和规则内容时，将规则追加到 \`.docsync/rules/override.md\`
- 格式：在 \`## <targetDoc> Rules\` 章节下添加条目，如章节不存在则创建
- 示例：\`/docsync:rules README.md 必须使用英文\` → 在 override.md 中添加 \`## README.md Rules\` 章节

### 添加 ProtectedContent

- 用户指定 protected content 时，在 override.md 的 \`## ProtectedContent\` 章节下添加条目
- 格式：
  \`\`\`
  ### <slug>
  Target: <targetDoc>
  Text: <protected text>
  \`\`\`
- 如 \`## ProtectedContent\` 章节不存在则创建

### 通用规则

1. 修改前展示将要追加/修改的内容，等待用户确认
2. 不覆盖 override.md 中已有的规则内容，仅追加或替换同名章节
3. 修改后使用 **Read** 验证最终文件内容
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
