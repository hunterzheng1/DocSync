# DocSync CLI 设计文档

> 项目目标：实现一个可通过 npm 发布和迭代的跨项目文档同步 CLI，用于一键维护 `README.md`、`AGENTS.md`、`CLAUDE.md` 等仓库说明文件。  
> 默认 GitHub 用户名：`hunterzheng1`  
> 默认 GitHub 仓库：`hunterzheng1/docsync`  
> 默认 npm 包名：`@hunterzheng/docsync`  
> 注意：如果 npm 账号或 scope 不是 `hunterzheng`，发布前将包名改为 `@<npm-username>/docsync` 或其他未被占用名称。

---

## 1. 背景与问题

当前希望维护的文档包括：

- `README.md`：面向人类开发者和使用者。
- `AGENTS.md`：面向 Codex、Claude Code、Cursor、Copilot、Gemini CLI 等 coding agent。
- `CLAUDE.md`：面向 Claude Code 的项目记忆与稳定偏好。
- 可选：`docs/**/*.md`、项目级规则、子模块说明。

现有手动方案的问题：

1. 每个项目都要手动安装 Repomix、markdownlint、创建配置文件。
2. 每个项目都要复制 prompt 或脚本，不利于迭代。
3. Claude Code Skill、Codex 全局规则、项目规则分散维护。
4. 后续规则更新时，每台机器、每个项目都可能不同步。
5. 文档容易过长、重复、漂移，甚至出现 AI 编造命令或模块的问题。

因此，需要做成一个可持续维护的 npm CLI 包：

```bash
docsync ai
```

或者无需安装：

```bash
npx -y @hunterzheng/docsync@latest ai
```

---

## 2. 产品定位

`docsync` 不是一个直接生成文档内容的黑盒工具，而是一个“文档同步工作流协调器”。

它负责：

1. 初始化项目级文档同步配置。
2. 调用 Repomix 生成当前仓库上下文。
3. 调用 markdownlint-cli2 进行 Markdown 格式修复。
4. 安装或更新 Claude Code 全局 `doc-sync` Skill。
5. 安装或更新 Codex 全局 `AGENTS.md` 指令片段。
6. 启动 Claude Code 或输出可复制 prompt，让 AI 基于真实仓库上下文更新文档。
7. 提供 doctor、init、prep、ai、auto 等命令，降低跨项目使用成本。

---

## 3. 一句话目标

让用户在任意项目根目录执行：

```bash
docsync ai
```

即可完成：

```text
检查环境
-> 自动补齐项目配置
-> 生成 repomix-output.xml
-> 运行 markdownlint-cli2 --fix
-> 启动 Claude Code 并带入 /doc-sync 指令
-> 让 AI 最小化更新 README.md / AGENTS.md / CLAUDE.md
```

---

## 4. 非目标

第一版不做以下事情：

1. 不内置 LLM API 调用。
2. 不自动提交 git commit。
3. 不自动发布项目文档。
4. 不自动修改业务代码。
5. 不保存用户 token。
6. 不将仓库源码上传到第三方服务。
7. 不强制每个项目采用固定文档结构。
8. 不替代 Repomix、Claude Code、Codex，而是组合它们。

---

## 5. 技术选型

### 5.1 运行环境

- Node.js：`>=18`
- 模块格式：ESM
- 包管理器：npm
- 跨平台目标：
  - macOS
  - Linux
  - WSL
  - Windows PowerShell

### 5.2 外部工具

第一版按“可选检测 + 引导安装”的方式处理外部工具。

必需：

- Node.js
- npm

建议安装：

- `repomix`
- `markdownlint-cli2`
- `claude`
- `codex`
- `git`
- `gh`

CLI 不要把 `repomix`、`markdownlint-cli2` 作为强依赖直接捆绑，第一版建议用外部命令检测，避免包过大，也便于用户控制版本。

---

## 6. 官方行为约束

实现时必须遵守这些约束：

1. npm CLI 命令通过 `package.json` 的 `bin` 字段暴露。
2. `bin` 指向的入口文件必须以 `#!/usr/bin/env node` 开头。
3. scoped public npm 包首次发布时使用：

   ```bash
   npm publish --access public
   ```

4. npm 上同一个 `name + version` 发布后不能再次复用，即使删除也不能复用。
5. 发布前必须运行：

   ```bash
   npm pack --dry-run
   ```

   检查实际会发布哪些文件。
6. `npx -y <package>@latest <args>` 可以临时运行远程 npm 包命令。
7. Codex 会读取全局和项目级 `AGENTS.md`，所以本项目必须提供 Codex 兼容说明。
8. Claude Code Skill 可以安装到：

   ```text
   ~/.claude/skills/<skill-name>/SKILL.md
   ```

   作为个人全局 Skill。

---

## 7. 命名设计

### 7.1 GitHub 仓库

默认：

```text
hunterzheng1/docsync
```

GitHub 地址：

```text
https://github.com/hunterzheng1/docsync
```

### 7.2 npm 包名

默认：

```text
@hunterzheng/docsync
```

如果 npm 不支持该 scope 或该 scope 不属于当前登录账号，则改为：

```text
@<npm-username>/docsync
```

或改为未被占用的非 scoped 包名，例如：

```text
docsync-ai
```

### 7.3 CLI 命令名

固定：

```text
docsync
```

原因：

- 简短。
- 语义明确。
- 适合全局命令。
- 与包名解耦，后续包名变化不影响用户命令。

---

## 8. 命令设计

### 8.1 总览

```bash
docsync init
docsync prep
docsync ai
docsync auto
docsync doctor
docsync skill install
docsync skill update
docsync codex install
docsync codex update
docsync version
docsync help
```

### 8.2 `docsync init`

作用：在当前项目中补齐文档同步所需配置。

创建文件：

```text
repomix.config.json
.repomixignore
.markdownlint-cli2.jsonc
docs/doc-sync-rules.md
```

规则：

- 如果文件已存在，默认不覆盖。
- 如果加 `--force`，允许覆盖。
- 如果加 `--backup`，覆盖前备份为 `.bak.<timestamp>`。
- 如果当前目录不是 git 仓库，也允许执行，但给出提示。

示例：

```bash
docsync init
docsync init --force --backup
```

### 8.3 `docsync prep`

作用：准备 AI 文档同步上下文。

步骤：

1. 自动执行 `docsync init`，补齐缺失配置。
2. 输出 `git status --short`。
3. 运行 `repomix`。
4. 如果存在 `markdownlint-cli2`，运行 `markdownlint-cli2 --fix`。
5. 输出下一步提示。

示例：

```bash
docsync prep
docsync prep --compress
docsync prep --no-lint
```

### 8.4 `docsync ai`

作用：推荐日常命令。准备上下文后，启动 Claude Code 交互会话，并带上 `/doc-sync` 指令。

步骤：

1. 执行 `docsync prep`。
2. 检测 `claude` 是否存在。
3. 如果存在，执行：

   ```bash
   claude "/doc-sync <prompt>"
   ```

4. 如果不存在，打印 prompt，用户可复制到 Claude Code、Codex、Cursor 或 ChatGPT。

示例：

```bash
docsync ai
docsync ai --docs readme,agents,claude
docsync ai --extra "重点检查 Maven 命令是否准确"
```

### 8.5 `docsync auto`

作用：非交互自动执行，适合小改动。

第一版作为实验命令，默认加醒目提示。

建议调用 Claude Code print mode：

```bash
claude -p "<prompt>" \
  --permission-mode acceptEdits \
  --allowedTools "Read" "Glob" "Grep" "Edit" "Bash(git status*)" "Bash(git diff*)" "Bash(markdownlint-cli2*)" "Bash(repomix*)"
```

安全规则：

- 默认不允许 `git add`。
- 默认不允许 `git commit`。
- 默认不允许网络命令。
- 默认不允许删除文件。
- 默认不允许修改业务代码。
- 如果需要更高权限，未来单独增加 `--dangerous`，但第一版不实现。

示例：

```bash
docsync auto
docsync auto --dry-run
```

### 8.6 `docsync doctor`

作用：检查本机环境。

检查项：

```text
node
npm
git
repomix
markdownlint-cli2
claude
codex
gh
~/.claude/skills/doc-sync/SKILL.md
~/.codex/AGENTS.md
```

输出示例：

```text
docsync doctor

Node.js:           ok  v22.x
npm:               ok  11.x
git:               ok
repomix:           ok
markdownlint-cli2: ok
claude:            ok
codex:             missing
gh:                ok
Claude Skill:      installed
Codex global file: installed
```

### 8.7 `docsync skill install`

作用：安装 Claude Code 全局 Skill。

目标路径：

```text
~/.claude/skills/doc-sync/SKILL.md
```

规则：

- 如果不存在，创建。
- 如果存在且内容不同，默认提示用户使用 `update`。
- `install --force` 可覆盖。
- Windows 使用 `USERPROFILE`，Unix 使用 `HOME`。

示例：

```bash
docsync skill install
```

### 8.8 `docsync skill update`

作用：覆盖更新 Claude Code 全局 Skill。

示例：

```bash
docsync skill update
```

### 8.9 `docsync codex install`

作用：安装 Codex 全局规则。

目标路径：

```text
~/.codex/AGENTS.md
```

策略：

- 如果不存在，创建完整文件。
- 如果存在，默认追加一个 `<!-- docsync:start -->` 到 `<!-- docsync:end -->` 的区块。
- 如果已存在该区块，更新该区块。
- 不破坏用户已有规则。

示例：

```bash
docsync codex install
docsync codex update
```

### 8.10 `docsync version`

输出当前版本。

```bash
docsync version
```

---

## 9. 参数设计

通用参数：

```text
--force             覆盖已存在文件
--backup            覆盖前备份
--dry-run           只打印将执行的动作，不实际写入
--verbose           输出详细日志
--quiet             减少输出
--cwd <path>        指定工作目录
```

`prep` / `ai` 参数：

```text
--compress          调用 repomix --compress
--no-lint           跳过 markdownlint-cli2 --fix
--no-init           不自动补齐配置
--docs <list>       指定文档范围，例如 readme,agents,claude
--extra <text>      追加用户自定义要求
```

`skill` 参数：

```text
--project           安装到当前项目 .claude/skills/doc-sync，而不是全局
--global            安装到 ~/.claude/skills/doc-sync，默认值
```

---

## 10. 仓库结构

最终仓库结构：

```text
docsync/
  package.json
  package-lock.json
  README.md
  LICENSE
  AGENTS.md
  DESIGN.md
  CHANGELOG.md
  .gitignore
  .npmignore

  bin/
    docsync.mjs

  src/
    cli.mjs
    commands/
      init.mjs
      prep.mjs
      ai.mjs
      auto.mjs
      doctor.mjs
      skill.mjs
      codex.mjs
      version.mjs
      help.mjs
    utils/
      paths.mjs
      fs.mjs
      shell.mjs
      logger.mjs
      template.mjs
      git.mjs
      prompt.mjs

  templates/
    project/
      repomix.config.json
      .repomixignore
      .markdownlint-cli2.jsonc
      docs/
        doc-sync-rules.md
    claude-skill/
      SKILL.md
    codex/
      AGENTS.docsync.md

  test/
    fs.test.mjs
    prompt.test.mjs
    init.test.mjs
    doctor.test.mjs
```

---

## 11. `package.json` 设计

文件：`package.json`

```json
{
  "name": "@hunterzheng/docsync",
  "version": "0.1.0",
  "description": "A lightweight CLI to sync README.md, AGENTS.md, and CLAUDE.md using Repomix and AI coding agents.",
  "type": "module",
  "bin": {
    "docsync": "bin/docsync.mjs"
  },
  "files": [
    "bin",
    "src",
    "templates",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "test": "node --test",
    "lint": "node --check bin/docsync.mjs && node --check src/cli.mjs",
    "pack:dry": "npm pack --dry-run",
    "release:patch": "npm version patch && npm publish --access public"
  },
  "keywords": [
    "docsync",
    "repomix",
    "claude-code",
    "codex",
    "agents-md",
    "readme",
    "documentation",
    "ai-coding-agent"
  ],
  "author": "Hunter Zheng",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hunterzheng1/docsync.git"
  },
  "bugs": {
    "url": "https://github.com/hunterzheng1/docsync/issues"
  },
  "homepage": "https://github.com/hunterzheng1/docsync#readme"
}
```

Codex 注意：

- 如果 npm scope 不是 `@hunterzheng`，实现前需要把 `name` 改成真实 npm scope。
- `bin/docsync.mjs` 必须有 shebang：

  ```js
  #!/usr/bin/env node
  ```

---

## 12. CLI 入口设计

文件：`bin/docsync.mjs`

```js
#!/usr/bin/env node

import { main } from "../src/cli.mjs";

main(process.argv.slice(2)).catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
```

---

## 13. CLI 主分发设计

文件：`src/cli.mjs`

职责：

1. 解析命令。
2. 解析通用参数。
3. 分发到具体 command。
4. 未知命令时输出 help。
5. 捕获错误并返回非 0 exit code。

伪代码：

```js
import { runInit } from "./commands/init.mjs";
import { runPrep } from "./commands/prep.mjs";
import { runAi } from "./commands/ai.mjs";
import { runAuto } from "./commands/auto.mjs";
import { runDoctor } from "./commands/doctor.mjs";
import { runSkill } from "./commands/skill.mjs";
import { runCodex } from "./commands/codex.mjs";
import { runVersion } from "./commands/version.mjs";
import { printHelp } from "./commands/help.mjs";
import { parseArgs } from "./utils/args.mjs";

export async function main(argv) {
  const command = argv[0] || "help";
  const rest = argv.slice(1);
  const options = parseArgs(rest);

  switch (command) {
    case "init":
      return runInit(options);
    case "prep":
      return runPrep(options);
    case "ai":
      return runAi(options);
    case "auto":
      return runAuto(options);
    case "doctor":
      return runDoctor(options);
    case "skill":
      return runSkill(rest, options);
    case "codex":
      return runCodex(rest, options);
    case "version":
    case "--version":
    case "-v":
      return runVersion();
    case "help":
    case "--help":
    case "-h":
      return printHelp();
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}
```

---

## 14. 工具函数设计

### 14.1 `src/utils/paths.mjs`

职责：

- 获取当前工作目录。
- 获取用户 home 目录。
- 获取模板目录。
- 获取 git root。
- 兼容 Windows / WSL / Unix。

函数：

```js
export function getCwd(options) {}
export function getHomeDir() {}
export function getTemplateRoot() {}
export function resolveProjectPath(...parts) {}
export function resolveHomePath(...parts) {}
export function findGitRoot(cwd) {}
```

### 14.2 `src/utils/fs.mjs`

职责：

- 安全写文件。
- 创建目录。
- 是否存在。
- 读取文本。
- 复制模板。
- 按区块更新文件。

函数：

```js
export function exists(path) {}
export function ensureDir(path) {}
export function readText(path) {}
export function writeText(path, content) {}
export function writeIfMissing(path, content, options) {}
export function backupFile(path) {}
export function upsertMarkedBlock(path, startMarker, endMarker, blockContent, options) {}
```

`writeIfMissing` 规则：

- 文件不存在：写入。
- 文件存在且未设置 `force`：跳过。
- 文件存在且设置 `force`：覆盖。
- 设置 `backup` 时先备份。

### 14.3 `src/utils/shell.mjs`

职责：

- 检测命令是否存在。
- 执行外部命令。
- 支持 Windows。

函数：

```js
export function hasCommand(command) {}
export function run(command, args, options) {}
export function capture(command, args, options) {}
```

Windows 注意：

```js
shell: process.platform === "win32"
```

### 14.4 `src/utils/prompt.mjs`

职责：

- 构建 Claude / Codex prompt。
- 根据 `--docs` 控制范围。
- 拼接 `--extra`。

函数：

```js
export function buildDocSyncPrompt(options) {}
```

默认 prompt：

```text
基于当前仓库、git diff、repomix-output.xml、README.md、AGENTS.md、CLAUDE.md，同步 README.md、AGENTS.md、CLAUDE.md。

要求：
1. 只做必要修改，不要整篇重写。
2. 不确定内容标 TODO(review)，不要编造。
3. 不要编造命令、端口、环境变量、API、模块或部署步骤。
4. README.md 面向人类开发者。
5. AGENTS.md 面向 Codex、Claude Code、Cursor、Copilot 等 coding agent。
6. CLAUDE.md 面向 Claude Code，只保留稳定项目记忆。
7. 删除已被仓库事实证明过时的内容。
8. 修改后运行 markdownlint-cli2 --fix。
9. 最后报告 changed files、changed sections、facts used、TODO(review)、commands run。
```

---

## 15. 模板文件设计

### 15.1 `templates/project/repomix.config.json`

```json
{
  "output": {
    "filePath": "repomix-output.xml",
    "style": "xml",
    "removeComments": false,
    "showLineNumbers": true,
    "topFilesLength": 20
  },
  "ignore": {
    "useGitignore": true,
    "useDefaultPatterns": true,
    "customPatterns": [
      "**/node_modules/**",
      "**/target/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      "**/.idea/**",
      "**/.vscode/**",
      "**/*.log",
      "**/*.lock",
      "**/repomix-output.xml"
    ]
  },
  "security": {
    "enableSecurityCheck": true
  }
}
```

### 15.2 `templates/project/.repomixignore`

```gitignore
repomix-output.xml
.env
.env.*
*.pem
*.key
*.p12
*.jks
target/
node_modules/
dist/
build/
```

### 15.3 `templates/project/.markdownlint-cli2.jsonc`

```jsonc
{
  "globs": [
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    "docs/**/*.md",
    "#node_modules",
    "#target",
    "#dist",
    "#build",
    "#repomix-output.xml"
  ],
  "config": {
    "line-length": false,
    "no-inline-html": false,
    "no-duplicate-heading": false,
    "no-bare-urls": false
  }
}
```

### 15.4 `templates/project/docs/doc-sync-rules.md`

```markdown
# Documentation sync rules

## README.md

Audience: human developers and maintainers.

Include only stable and useful information:

- Project purpose
- Quick start
- Common commands
- Configuration
- Architecture overview
- Troubleshooting if important

Avoid:

- Internal AI workflow details
- Long implementation history
- Unverified roadmap claims
- Generated output dumps

## AGENTS.md

Audience: AI coding agents.

Include:

- Repository structure
- Build/test/lint commands
- Coding conventions
- Module boundaries
- Verification expectations
- Safe-edit constraints
- Documentation update expectations

Avoid:

- Product marketing
- Long onboarding prose
- Temporary task notes
- Duplicating README.md

## CLAUDE.md

Audience: Claude Code.

Include only stable project memory and workflow preferences.

Avoid:

- Repeating README.md
- Repeating AGENTS.md
- Large architecture documents
- Temporary task notes
- Unverified assumptions

## General rules

- Prefer minimal factual edits.
- Do not invent commands, ports, env vars, APIs, modules, credentials, or deployment steps.
- Mark uncertainty as TODO(review).
- Remove stale content only when repository evidence proves it is stale.
```

### 15.5 `templates/claude-skill/SKILL.md`

```markdown
---
name: doc-sync
description: Synchronize README.md, AGENTS.md, and CLAUDE.md with the current repository. Use after project structure, dependencies, commands, tests, CI, APIs, modules, or agent rules changed.
disable-model-invocation: true
---

# doc-sync

Update README.md, AGENTS.md, and CLAUDE.md with minimal factual edits.

## Inputs to inspect

- git status
- git diff --stat
- git diff
- repomix-output.xml
- README.md
- AGENTS.md
- CLAUDE.md
- docs/doc-sync-rules.md
- package.json
- pom.xml
- build.gradle
- pyproject.toml
- go.mod
- Dockerfile
- docker-compose.yml
- Makefile
- .github/workflows/**
- docs/**/*.md

## Document responsibilities

README.md is for human developers and maintainers.

AGENTS.md is for AI coding agents such as Codex, Claude Code, Cursor, Copilot, and Gemini CLI.

CLAUDE.md is for Claude Code only.

## Hard rules

- Do not invent commands, ports, environment variables, modules, APIs, credentials, or deployment steps.
- Do not rewrite whole documents unless they are clearly stale or broken.
- Prefer small patches.
- Keep README.md concise.
- Keep AGENTS.md actionable and agent-oriented.
- Keep CLAUDE.md short and non-duplicative.
- If uncertain, write TODO(review): instead of guessing.
- Remove stale instructions when repository evidence proves they are outdated.
- Do not include secrets or private tokens.
- Do not add marketing language.
- Do not create new process frameworks unless requested.

## Procedure

1. Identify repository facts from files and current git changes.
2. Compare facts with README.md, AGENTS.md, and CLAUDE.md.
3. List documentation drift:
   - missing
   - outdated
   - duplicated
   - too verbose
   - unsafe or unverifiable
4. Apply minimal edits.
5. Run markdownlint-cli2 --fix if available.
6. Report:
   - changed files
   - changed sections
   - facts used
   - TODO(review) items
   - commands run
```

### 15.6 `templates/codex/AGENTS.docsync.md`

```markdown
<!-- docsync:start -->

## DocSync documentation workflow

When asked to update README.md, AGENTS.md, CLAUDE.md, or other project documentation:

- Prefer minimal factual edits.
- Inspect `repomix-output.xml` if present.
- Inspect current git changes before editing.
- Do not invent commands, ports, environment variables, APIs, modules, credentials, or deployment steps.
- Keep `README.md` for human developers and maintainers.
- Keep `AGENTS.md` for AI coding agents.
- Keep `CLAUDE.md` for Claude Code only.
- Mark uncertainty as `TODO(review): ...`.
- Remove stale content only when repository evidence proves it is stale.
- Run `markdownlint-cli2 --fix` if available.
- Report changed files, changed sections, facts used, TODO(review) items, and commands run.

<!-- docsync:end -->
```

---

## 16. Command 实现要求

### 16.1 `runInit`

输入：

```js
runInit(options)
```

行为：

1. 定位 cwd。
2. 从 `templates/project` 复制模板到 cwd。
3. 缺失才写入。
4. 尊重 `--force`、`--backup`、`--dry-run`。
5. 输出创建、跳过、覆盖的文件列表。

验收：

```bash
docsync init
```

在空目录中创建：

```text
repomix.config.json
.repomixignore
.markdownlint-cli2.jsonc
docs/doc-sync-rules.md
```

第二次运行不覆盖已有文件。

### 16.2 `runPrep`

行为：

1. 如果没有 `--no-init`，先执行 `runInit`。
2. 检查 `git`。
3. 如果是 git 仓库，输出 `git status --short`。
4. 检查 `repomix`，不存在则报错并提示安装：

   ```bash
   npm i -g repomix
   ```

5. 执行：

   ```bash
   repomix
   ```

   如果 `--compress`，执行：

   ```bash
   repomix --compress
   ```

6. 如果未设置 `--no-lint` 且存在 `markdownlint-cli2`，执行：

   ```bash
   markdownlint-cli2 --fix
   ```

7. 如果 markdownlint 不存在，不报错，只提示安装。

验收：

```bash
docsync prep
```

成功生成：

```text
repomix-output.xml
```

### 16.3 `runAi`

行为：

1. 执行 `runPrep`。
2. 构建 prompt。
3. 检查 `claude`。
4. 存在则执行：

   ```bash
   claude "<prompt>"
   ```

5. 不存在则打印 prompt，且 exit code 为 0。

验收：

```bash
docsync ai
```

能进入 Claude Code 交互模式，或输出可复制 prompt。

### 16.4 `runAuto`

行为：

1. 执行 `runPrep`。
2. 构建 prompt。
3. 检查 `claude`。
4. 执行 Claude Code print mode。
5. 限制 allowedTools。
6. 不允许 git commit。

验收：

```bash
docsync auto --dry-run
```

只打印将执行的 Claude 命令，不实际执行。

### 16.5 `runDoctor`

行为：

1. 检查各命令是否存在。
2. 检查 Skill 文件是否存在。
3. 检查 Codex 文件是否存在。
4. 输出清晰状态。
5. 不因为缺少可选工具而失败。
6. 如果缺少必需工具，exit code 为 1。

必需工具：

```text
node
npm
```

建议工具：

```text
git
repomix
markdownlint-cli2
claude
codex
gh
```

### 16.6 `runSkill`

子命令：

```bash
docsync skill install
docsync skill update
docsync skill path
```

行为：

- `install`：不存在才安装。
- `update`：覆盖更新。
- `path`：打印目标路径。
- 支持 `--project` 安装到项目级 `.claude/skills/doc-sync/SKILL.md`。
- 默认安装到全局 `~/.claude/skills/doc-sync/SKILL.md`。

### 16.7 `runCodex`

子命令：

```bash
docsync codex install
docsync codex update
docsync codex path
```

行为：

- 目标文件：`~/.codex/AGENTS.md`
- 使用 marker block 更新。
- 不破坏用户已有内容。

---

## 17. README.md 要求

项目 README 至少包括：

1. 项目简介。
2. 安装方式。
3. 快速开始。
4. 命令列表。
5. Claude Code Skill 安装。
6. Codex 全局规则安装。
7. 在项目中使用。
8. 发布说明。
9. 安全说明。
10. License。

README 示例结构：

```markdown
# docsync

A lightweight CLI to sync README.md, AGENTS.md, and CLAUDE.md using Repomix and AI coding agents.

## Install

```bash
npm i -g @hunterzheng/docsync
```

## Quick start

```bash
docsync skill install
docsync codex install
cd your-project
docsync ai
```

## Commands

...
```

---

## 18. AGENTS.md 要求

本仓库的 `AGENTS.md` 是给 Codex 执行开发用的，必须包含：

```markdown
# AGENTS.md

## Project

This repository implements `docsync`, an npm CLI for syncing README.md, AGENTS.md, and CLAUDE.md.

## Commands

- `npm test`
- `npm run lint`
- `npm run pack:dry`
- `node bin/docsync.mjs doctor`

## Rules

- Use ESM.
- Require Node.js >= 18.
- Keep runtime dependencies minimal.
- Do not add network calls.
- Do not store tokens.
- Do not auto-commit changes.
- Preserve user files unless `--force` is passed.
- Use marker blocks when updating existing global Codex AGENTS.md.

## Verification

Before completion, run:

```bash
npm test
npm run lint
npm run pack:dry
node bin/docsync.mjs doctor
```
```

---

## 19. 测试设计

第一版使用 Node 内置 test runner：

```bash
node --test
```

### 19.1 单元测试

测试文件：

```text
test/fs.test.mjs
test/prompt.test.mjs
test/init.test.mjs
test/doctor.test.mjs
```

覆盖：

1. `writeIfMissing` 不覆盖已有文件。
2. `writeIfMissing --force` 覆盖已有文件。
3. `upsertMarkedBlock` 可插入 marker block。
4. `upsertMarkedBlock` 可更新已有 marker block。
5. `buildDocSyncPrompt` 包含关键规则。
6. `init` 可创建所有模板文件。
7. `doctor` 在缺少可选工具时不崩溃。

### 19.2 手动测试

本地链接：

```bash
npm link
docsync doctor
```

创建临时项目：

```bash
mkdir /tmp/docsync-demo
cd /tmp/docsync-demo
git init
echo "# Demo" > README.md
docsync init
docsync prep
docsync ai
```

Windows PowerShell 测试：

```powershell
mkdir $env:TEMP\docsync-demo
cd $env:TEMP\docsync-demo
git init
"# Demo" | Out-File README.md
docsync init
docsync doctor
```

---

## 20. 安全设计

### 20.1 文件安全

默认行为：

- 不覆盖已有配置。
- 不删除文件。
- 不修改业务代码。
- 不提交 git。
- 不发布 npm。
- 不上传仓库到网络。
- 不保存 token。

### 20.2 发布安全

发布前必须执行：

```bash
npm pack --dry-run
```

检查不能包含：

```text
.env
.env.*
*.pem
*.key
*.p12
*.jks
npm token
GitHub token
repomix-output.xml
测试临时目录
```

### 20.3 npm 包内容限制

`package.json` 使用 `files` 白名单，只发布：

```text
bin
src
templates
README.md
LICENSE
CHANGELOG.md
```

### 20.4 AI 自动执行安全

`docsync auto` 第一版限制：

- allowedTools 只允许读文件、grep、edit、git diff、markdownlint、repomix。
- 不允许 git commit。
- 不允许 rm。
- 不允许 curl/wget。
- 不允许 npm publish。
- 不允许修改 credential 文件。

---

## 21. 开发阶段计划

### Phase 0：初始化仓库

目标：创建 GitHub 仓库和 npm 包骨架。

步骤：

```bash
mkdir docsync
cd docsync
git init
npm init -y
```

修改 `package.json` 为设计版本。

创建目录：

```bash
mkdir -p bin src/commands src/utils templates/project/docs templates/claude-skill templates/codex test
```

创建基础文件：

```bash
touch README.md AGENTS.md DESIGN.md CHANGELOG.md LICENSE .gitignore .npmignore
touch bin/docsync.mjs
touch src/cli.mjs
```

验收：

```bash
node bin/docsync.mjs help
```

可以输出 help。

### Phase 1：实现模板初始化

实现：

```text
src/commands/init.mjs
src/utils/fs.mjs
src/utils/paths.mjs
```

验收：

```bash
node bin/docsync.mjs init
```

能创建项目模板。

### Phase 2：实现环境检测

实现：

```text
src/commands/doctor.mjs
src/utils/shell.mjs
```

验收：

```bash
node bin/docsync.mjs doctor
```

能输出工具状态。

### Phase 3：实现 prep

实现：

```text
src/commands/prep.mjs
```

验收：

```bash
node bin/docsync.mjs prep
```

能调用 Repomix 和 markdownlint。

### Phase 4：实现 AI 调用

实现：

```text
src/commands/ai.mjs
src/utils/prompt.mjs
```

验收：

```bash
node bin/docsync.mjs ai
```

如果有 Claude Code，则启动 Claude；否则打印 prompt。

### Phase 5：实现 Skill / Codex 安装

实现：

```text
src/commands/skill.mjs
src/commands/codex.mjs
```

验收：

```bash
node bin/docsync.mjs skill install
node bin/docsync.mjs codex install
```

创建：

```text
~/.claude/skills/doc-sync/SKILL.md
~/.codex/AGENTS.md
```

### Phase 6：测试与发布

执行：

```bash
npm test
npm run lint
npm run pack:dry
```

本地安装测试：

```bash
npm install -g .
docsync doctor
```

---

## 22. GitHub 创建与维护

### 22.1 使用 GitHub CLI 创建仓库

如果已安装 `gh`：

```bash
gh auth login
gh repo create hunterzheng1/docsync --public --source . --remote origin --push
```

如果不使用 `gh`，则手动在 GitHub 创建 `hunterzheng1/docsync`，然后：

```bash
git remote add origin git@github.com:hunterzheng1/docsync.git
git branch -M main
git push -u origin main
```

### 22.2 首次提交

```bash
git add .
git commit -m "feat: initialize docsync cli"
git push -u origin main
```

### 22.3 后续维护分支

```bash
git checkout -b feat/init-command
git add .
git commit -m "feat: add init command"
git push -u origin feat/init-command
```

---

## 23. npm 发布流程

### 23.1 登录 npm

```bash
npm login
npm whoami
```

### 23.2 确认包名

检查：

```bash
npm view @hunterzheng/docsync
```

如果不存在，会返回 404 类信息，说明可用。

如果 scope 不属于当前 npm 账号，修改 `package.json`：

```json
{
  "name": "@<npm-username>/docsync"
}
```

### 23.3 发布前检查

```bash
npm test
npm run lint
npm run pack:dry
```

必须人工检查 `npm pack --dry-run` 输出，确认只包含应发布文件。

### 23.4 首次发布

```bash
npm publish --access public
```

### 23.5 安装验证

```bash
npm i -g @hunterzheng/docsync
docsync version
docsync doctor
```

如果使用 npx：

```bash
npx -y @hunterzheng/docsync@latest version
npx -y @hunterzheng/docsync@latest doctor
```

### 23.6 后续发版

patch：

```bash
npm version patch
npm publish --access public
git push --follow-tags
```

minor：

```bash
npm version minor
npm publish --access public
git push --follow-tags
```

major：

```bash
npm version major
npm publish --access public
git push --follow-tags
```

---

## 24. 项目中使用流程

### 24.1 机器首次配置

全局安装：

```bash
npm i -g repomix markdownlint-cli2 @hunterzheng/docsync
```

安装 Claude Skill：

```bash
docsync skill install
```

安装 Codex 全局规则：

```bash
docsync codex install
```

检查：

```bash
docsync doctor
```

### 24.2 单个项目日常使用

进入项目根目录：

```bash
cd your-project
docsync ai
```

如果只想准备上下文：

```bash
docsync prep
```

如果想自动执行小改动：

```bash
docsync auto
```

### 24.3 不全局安装

```bash
npx -y @hunterzheng/docsync@latest ai
```

### 24.4 项目内推荐提交内容

首次执行 `docsync init` 后，建议提交：

```text
repomix.config.json
.repomixignore
.markdownlint-cli2.jsonc
docs/doc-sync-rules.md
```

不建议提交：

```text
repomix-output.xml
```

---

## 25. 示例用户流程

### 25.1 第一次在新机器上

```bash
npm i -g repomix markdownlint-cli2 @hunterzheng/docsync
docsync skill install
docsync codex install
docsync doctor
```

### 25.2 在 Java 后端项目中

```bash
cd my-spring-project
docsync ai --extra "重点检查 pom.xml、Maven 命令、Spring Boot 配置说明是否准确"
```

### 25.3 在 React 项目中

```bash
cd my-react-project
docsync ai --extra "重点检查 package.json scripts、Vite/Next.js 启动命令、环境变量说明"
```

### 25.4 在 monorepo 中

```bash
cd my-monorepo
docsync ai --compress --extra "注意分别描述 packages、apps、services 的边界，不要写太长"
```

---

## 26. Codex 执行要求

当 Codex 根据本文档实现时，必须按阶段执行。

### 26.1 执行顺序

1. 创建仓库骨架。
2. 创建 `package.json`。
3. 实现 CLI 入口。
4. 实现工具函数。
5. 实现 `init`。
6. 实现 `doctor`。
7. 实现 `prep`。
8. 实现 `ai`。
9. 实现 `skill`。
10. 实现 `codex`。
11. 补 README。
12. 补 AGENTS。
13. 补测试。
14. 本地验证。
15. 准备发布。

### 26.2 每阶段必须做

每个阶段完成后，Codex 必须输出：

```text
完成了哪些文件
运行了哪些命令
是否通过
还有哪些 TODO
下一阶段建议
```

### 26.3 禁止事项

Codex 不得：

- 自动发布 npm。
- 自动创建 GitHub 远程仓库，除非用户明确要求。
- 自动提交 git，除非用户明确要求。
- 写入真实 token。
- 删除用户已有配置。
- 引入不必要依赖。
- 使用不兼容 Windows 的路径逻辑。
- 将 `repomix-output.xml` 加入 npm 包或 git commit。

---

## 27. 验收标准

### 27.1 功能验收

必须全部通过：

```bash
node bin/docsync.mjs help
node bin/docsync.mjs version
node bin/docsync.mjs doctor
node bin/docsync.mjs init
node bin/docsync.mjs skill install
node bin/docsync.mjs codex install
npm test
npm run lint
npm run pack:dry
```

### 27.2 npm 安装验收

```bash
npm install -g .
docsync version
docsync doctor
```

### 27.3 npx 验收

发布后：

```bash
npx -y @hunterzheng/docsync@latest version
npx -y @hunterzheng/docsync@latest doctor
```

### 27.4 项目使用验收

在一个临时 git 项目中：

```bash
mkdir docsync-fixture
cd docsync-fixture
git init
echo "# Fixture" > README.md
docsync init
docsync prep
```

应生成：

```text
repomix.config.json
.repomixignore
.markdownlint-cli2.jsonc
docs/doc-sync-rules.md
repomix-output.xml
```

---

## 28. `.gitignore` 建议

```gitignore
node_modules/
coverage/
dist/
*.log
.DS_Store
.env
.env.*
repomix-output.xml
```

---

## 29. `.npmignore` 建议

如果 `package.json` 已使用 `files` 白名单，`.npmignore` 可以很简洁：

```gitignore
test/
coverage/
.env
.env.*
repomix-output.xml
*.log
.DS_Store
```

---

## 30. LICENSE

建议使用 MIT。

文件：`LICENSE`

```text
MIT License

Copyright (c) 2026 Hunter Zheng

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
```

Codex 可补完整 MIT License 文本。

---

## 31. CHANGELOG 规范

文件：`CHANGELOG.md`

```markdown
# Changelog

## 0.1.0

- Initial release.
- Add `docsync init`.
- Add `docsync prep`.
- Add `docsync ai`.
- Add `docsync doctor`.
- Add Claude Skill installer.
- Add Codex global AGENTS.md installer.
```

---

## 32. 后续路线图

### v0.1.0

- 基础 CLI。
- init / prep / ai / doctor。
- Claude Skill 安装。
- Codex 全局规则安装。
- npm 发布。

### v0.2.0

- 增加 `--tool codex`。
- 增加 `docsync run codex`。
- 支持项目级 `.claude/skills` 安装。
- 支持 workspace/monorepo 检测。

### v0.3.0

- 增加文档漂移检测报告。
- 增加 `docsync report`。
- 增加可配置 size limit。
- 支持多模板 profile：
  - java-spring
  - react-node
  - go
  - python
  - monorepo

### v1.0.0

- 稳定 CLI API。
- 完整测试覆盖。
- GitHub Actions 自动测试。
- 可选 npm trusted publishing。
- 完整中英文 README。

---

## 33. 给 Codex 的首条执行提示词

将下面这段作为 Codex 的初始任务：

```text
请根据 DESIGN.md 实现 docsync npm CLI。

重要约束：
1. GitHub 用户名是 hunterzheng1，默认仓库是 hunterzheng1/docsync。
2. 默认 npm 包名先使用 @hunterzheng/docsync；如果实际 npm scope 不可用，保留 TODO 提醒用户修改。
3. 使用 Node.js >= 18，ESM。
4. CLI 命令名必须是 docsync。
5. 第一版不要引入不必要依赖。
6. 不要自动发布 npm，不要自动提交 git。
7. 不要写入真实 token。
8. 不要覆盖用户已有文件，除非传入 --force。
9. 实现 init、prep、ai、doctor、skill install/update/path、codex install/update/path、version、help。
10. 补充 README.md、AGENTS.md、CHANGELOG.md、LICENSE。
11. 添加基础测试。
12. 完成后运行 npm test、npm run lint、npm run pack:dry，并报告结果。

请按 Phase 0 到 Phase 6 分阶段完成，每阶段结束报告：
- 修改了哪些文件
- 运行了哪些命令
- 是否通过
- 剩余 TODO
```

---

## 34. 最终目标命令

发布完成后，用户最终只需要记住：

```bash
docsync ai
```

新机器初始化：

```bash
npm i -g repomix markdownlint-cli2 @hunterzheng/docsync
docsync skill install
docsync codex install
docsync doctor
```

不想全局安装：

```bash
npx -y @hunterzheng/docsync@latest ai
```

---

## 35. 成功定义

该项目成功的标准：

1. 任意项目中一条 `docsync ai` 可完成文档同步准备和 AI 调用。
2. 不需要每个项目复制脚本。
3. 规则可通过 npm 包持续迭代。
4. Claude Code 通过全局 Skill 使用同一套文档同步规范。
5. Codex 通过全局 `AGENTS.md` 使用同一套文档同步规范。
6. 项目内只保留少量可覆盖配置。
7. README / AGENTS / CLAUDE 保持准确、简洁、低漂移。
