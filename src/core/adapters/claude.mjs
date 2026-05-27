import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ensureDir, writeText } from '../../utils/fs.mjs';

const SKILL_CONTENT = `---
name: doc-sync
description: Synchronize README.md, AGENTS.md, and CLAUDE.md with repository facts.
when_to_use: Use when project structure, commands, dependencies, tests, CI, APIs, or agent instructions have changed.
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash(git *) Bash(markdownlint-cli2 *) Edit Write
---

# doc-sync

Update project documentation with minimal factual edits.

## Slash 命令总览

安装 \`@hunterzheng/docsync\` 后，AI 通过以下 slash 命令完成文档同步：

| 命令 | 用途 |
|------|------|
| \`/docsync:sync\` | 完整文档同步 |
| \`/docsync:sync --fast\` | 快速文档同步（使用 git 事实） |
| \`/docsync:init\` | 项目初始化 |
| \`/docsync:rules\` | 规则维护 |
| \`/docsync:rules show\` | 查看当前规则 |

---

## \`/docsync:sync\` — 文档同步

### 前置校验

1. 检查 \`.docsync/state/install.json\` 是否存在。缺失则提示：\`ERR_NO_INSTALL: 未完成引导安装。请先运行 npx @hunterzheng/docsync 初始化。\`
2. 检查 \`.docsync/config/\`、\`.docsync/context/\`、\`.docsync/rules/\` 是否存在。缺失则提示：\`ERR_WORKSPACE_INCOMPLETE: .docsync/ 缺少必需子目录。请重新运行 npx 引导或 /docsync:init 修复。\`

### 完整模式（默认）

\`\`\`
npx @hunterzheng/docsync sync [--cwd <path>] [target1] [target2]
\`\`\`

- 无参数：同步全部三份核心文档
- 指定文件：仅同步指定文件
- 同步后可根据用户额外要求手动补充内容

### 快速模式

\`\`\`
npx @hunterzheng/docsync sync --fast [target1]
\`\`\`

使用轻量 git 事实推断影响范围。信息不足或高风险时自动升级为完整同步。

### 同步规则

1. 最小化变更：只更新需要的内容，不重写整篇文档
2. 禁止编造：所有命令、端口、环境变量必须来自仓库事实
3. 标记不确定内容：使用 \`TODO(review)\`
4. 保持 AGENTS.md 为跨 Agent 通用规则源
5. 保持 CLAUDE.md 为 Claude Code 轻量适配层
6. 禁止读取或输出密钥、token、凭证
7. 禁止执行 \`git commit\`、\`git push\`、\`npm publish\`

---

## \`/docsync:init\` — 项目初始化

1. 检查 \`.docsync/state/install.json\` 和工作区完整性
2. 读取 \`.docsync/rules/default.md\` 和 \`override.md\`（如存在）
3. 创建或更新三份核心文档（README.md、AGENTS.md、CLAUDE.md），不存在的按模板创建
4. 展示创建/更新报告

---

## \`/docsync:rules\` — 规则维护

维护 \`.docsync/rules/override.md\`：

- \`show\`：读取并展示完整规则
- 无参数：展示规则摘要，询问补充需求
- 添加文档级规则：追加到 \`## <targetDoc> Rules\` 章节
- 添加 ProtectedContent：在 \`## ProtectedContent\` 章节下添加条目

修改前展示内容等待确认，不覆盖已有规则，仅追加或替换。
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
