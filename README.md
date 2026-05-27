# @hunterzheng/docsync

可复用的 npm CLI，用于文档同步工作流：Repomix 上下文、markdownlint、Claude Skill、Codex 规则管理和 AI 文档同步。

## 安装与使用

### 方式一：npx 临时使用（推荐，快速上手）

```bash
npx @hunterzheng/docsync
```

npx 首次运行会自动下载并启动交互式引导，完成环境检查、`.docsync/` 工作区创建、AI 适配器安装和三份核心文档初始化。

### 方式二：全局安装

```bash
npm i -g @hunterzheng/docsync
```

安装后，在任意项目中打开 Claude Code，AI 会自动加载 DocSync Skill。输入 `/docsync:sync` 即可开始文档同步。

### 方式三：项目级安装

```bash
npm i -D @hunterzheng/docsync
```

### AI 驱动使用方式

安装完成后，在 Claude Code 中通过以下 slash 命令完成文档同步：

| Slash 命令 | 用途 |
|-----------|------|
| `/docsync:init` | 项目初始化（检查环境、创建模板文件） |
| `/docsync:sync` | 完整文档同步（环境检查 → 上下文准备 → 对比 → 编辑 → 格式修复 → 报告） |
| `/docsync:sync --fast` | 快速文档同步（使用 git 事实推断影响范围） |
| `/docsync:sync [file]` | 同步指定文件，如 `README.md` |
| `/docsync:rules` | 维护 override 规则（管理 `.docsync/rules/override.md`） |
| `/docsync:rules show` | 查看当前 override 规则完整内容 |
| `/docsync:doctor` | 环境诊断（工具/文件检查） |
| `/docsync:prep` | 上下文准备（生成 repomix 文件） |

全程无需在终端手动执行任何 CLI 命令。

## 命令详细说明

### docsync doctor

检查本地环境和工具安装状态，输出每个工具的已安装/未安装状态。

**检查项目：**

- 必需：Node.js、npm、git
- 推荐：repomix（生成项目上下文）、markdownlint-cli2（Markdown 格式修复）
- 可选：claude（Claude Code）、codex（Codex）、gh（GitHub CLI）
- 全局文件：Claude Code 全局 Skill 路径、Codex 全局 AGENTS.md 路径

**示例：**

```bash
docsync doctor              # 简洁输出
docsync doctor --verbose    # 详细输出（含版本号）
docsync doctor --quiet      # 只输出缺失项
```

---

### docsync sync

执行文档同步。支持完整模式和快速模式：

**完整模式（默认）：**

刷新项目上下文、提取仓库事实、读取规则、同步三份核心文档、运行格式修复、输出同步报告。

**快速模式（`--fast`）：**

使用轻量 git 事实（最近提交、status --short、diff --name-only）推断影响范围，快速更新相关文档。信息不足或检测到高风险内容时自动升级为完整同步。

**示例：**

```bash
docsync sync                           # 同步全部三份核心文档
docsync sync --fast                    # 快速同步
docsync sync README.md                 # 仅同步 README.md
docsync sync README.md AGENTS.md       # 同步指定文件
docsync sync --cwd /path/to/project    # 指定目标目录
```

---

### docsync init

在项目中安全安装模板文件。默认不覆盖已有文件，可通过 `--force` 强制覆盖。

**安装的模板文件：**

| 文件 | 用途 |
|------|------|
| `repomix.config.json` | Repomix 配置文件，定义代码上下文打包规则 |
| `.repomixignore` | Repomix 忽略规则，排除不需要打包的文件 |
| `.markdownlint-cli2.jsonc` | markdownlint 配置，定义 Markdown 格式规范 |
| `docs/doc-sync-rules.md` | 文档同步规则，定义各文档文件的职责和编写原则 |

**示例：**

```bash
docsync init                          # 默认模式：不覆盖已有文件
docsync init --force                  # 强制覆盖已有文件
docsync init --backup                 # 覆盖前生成 .bak.<timestamp> 备份
docsync init --dry-run                # 只打印计划动作，不实际写入
docsync init --cwd /path/to/project   # 指定目标目录
```

---

### docsync prep

准备文档同步所需的项目上下文。按顺序执行以下步骤：

1. **init**：确保模板文件存在（可通过 `--no-init` 跳过）
2. **git status**：输出当前 git 状态摘要
3. **repomix**：生成 `repomix-output.xml` 文件，包含项目全部代码和文档的上下文
4. **markdownlint**：修复 Markdown 格式问题（可通过 `--no-lint` 跳过）

生成的 `repomix-output.xml` 是 AI 理解项目全貌的关键输入。

**示例：**

```bash
docsync prep                          # 完整执行
docsync prep --compress               # 压缩输出（减少文件大小）
docsync prep --no-init                # 跳过 init 步骤
docsync prep --no-lint                # 跳过 markdownlint 步骤
docsync prep --dry-run                # 只打印计划动作
```

---

### docsync ai（legacy）

启动交互式文档同步（旧版）。推荐使用 npx 引导后的 `/docsync:sync` 代替。

1. **运行 prep**：先生成项目上下文（repomix-output.xml）
2. **构建同步 prompt**：生成一段包含文档同步规则的 prompt，指导 AI 如何更新文档
3. **启动 Claude Code**：将 prompt 传递给 Claude Code，由其自动读取项目上下文并更新文档

**如果本地没有安装 Claude Code**，会输出可复制的 prompt 文本，你可以手动粘贴到 Claude 中使用。

**可更新的文档范围：** `README.md`、`AGENTS.md`、`CLAUDE.md`（默认全部更新）。

**示例：**

```bash
docsync ai                                    # 同步所有文档，启动 Claude Code
docsync ai --docs readme,agents               # 只同步 README.md 和 AGENTS.md
docsync ai --compress                         # 使用压缩模式生成上下文
docsync ai --no-lint                          # 跳过 markdownlint 格式修复
docsync ai --extra "特别注意：更新安装说明部分" # 附加额外要求到同步 prompt
```

**同步规则（AI 必须遵守）：**

1. 最小化变更：只更新需要的内容，不重写整篇文档
2. 禁止编造：所有命令、端口、环境变量必须来自仓库事实
3. 标记不确定内容：使用 `TODO(review)` 标注
4. 保持简洁：避免重复和过时信息
5. 禁止读取或输出密钥、token、凭证
6. 禁止执行 `git commit`、`git push`、`npm publish`

---

### docsync auto（legacy）

非交互式文档同步（实验性）。与 `docsync ai` 的区别：

- `docsync ai`：启动 Claude Code 交互式会话，用户可以随时干预
- `docsync auto`：非交互模式，适合自动化流程或 CI/CD 场景

**示例：**

```bash
docsync auto                              # 非交互式同步
docsync auto --extra "更新命令参考部分"    # 附加额外要求
```

---

### docsync skill

管理 Claude Code 的全局或项目级 Skill 文件（位于 `~/.claude/skills/doc-sync/SKILL.md` 或 `<项目>/.claude/skills/doc-sync/SKILL.md`）。

**子命令：**

| 子命令 | 用途 |
|--------|------|
| `install` | 安装 Skill 文件到目标位置 |
| `update` | 更新 Skill 文件模板内容 |
| `path` | 输出 Skill 文件的目标路径 |

**示例：**

```bash
docsync skill install                         # 安装到全局（默认）
docsync skill install --project               # 安装到当前项目
docsync skill install --cwd /path/to/project  # 安装到指定项目
docsync skill update                          # 更新 Skill 内容
docsync skill path --global                   # 输出全局路径
docsync skill path --project                  # 输出项目路径
```

---

### docsync codex

管理 Codex 的全局 AGENTS.md 规则片段。通过 **标记块（marker block）** 机制，在保留用户已有内容的前提下，插入/更新 DocSync 的规则片段。

标记块格式：

```markdown
<!-- DOCSYNC_START: doc-sync rules -->
... DocSync 规则内容 ...
<!-- DOCSYNC_END -->
```

**子命令：**

| 子命令 | 用途 |
|--------|------|
| `install` | 在 Codex 全局 AGENTS.md 中插入 DocSync 规则 |
| `update` | 更新标记块内的规则内容 |
| `path` | 输出 AGENTS.md 的目标路径 |

**示例：**

```bash
docsync codex install                       # 安装 DocSync 规则到全局 AGENTS.md
docsync codex update                        # 更新已有标记块内容
docsync codex path                          # 输出全局 AGENTS.md 路径
```

---

### docsync version

显示当前安装的版本号：

```bash
docsync version
# 或
docsync -v
docsync --version
```

### docsync help

显示帮助信息和可用命令：

```bash
docsync help
docsync --help
docsync -h
```

## 通用选项

所有命令都支持以下通用选项：

| 选项 | 说明 |
|------|------|
| `--force` | 允许覆盖已有文件（默认不覆盖） |
| `--backup` | 覆盖前生成 `.bak.<timestamp>` 备份文件 |
| `--dry-run` | 只打印计划要执行的动作，不实际写入任何文件 |
| `--verbose` | 输出详细日志（含调试信息） |
| `--quiet` | 精简输出，只输出关键信息 |
| `--cwd <path>` | 指定目标项目目录（默认当前目录） |

## 文档职责与格式

DocSync 管理的三个核心文档文件各有明确的职责分工：

### README.md

**面向用户**（安装者和使用者）。

| 内容 | 说明 |
|------|------|
| 项目简介 | 一两句话说明项目做什么 |
| 安装方式 | 如何安装（npm / npx / git clone） |
| 快速开始 | 最简使用示例 |
| 命令参考 | 完整命令列表和参数说明 |
| 开发指南 | 如何本地开发、运行测试 |
| 安全说明 | 安全约束和不执行的操作 |
| 环境要求 | 依赖的运行时和工具 |
| License | 许可证信息 |

**格式：** Markdown，面向外部用户，保持简洁。

### AGENTS.md

**面向 AI Agent**（Claude Code、Codex 等）。

| 内容 | 说明 |
|------|------|
| 项目说明 | 这个项目是什么 |
| 命令契约 | 所有命令、子命令、参数的完整清单 |
| 开发规则 | AI 在项目中应遵守的规则 |
| 验证要求 | 如何验证 AI 生成的内容 |
| 安全约束 | 禁止执行的操作 |

**格式：** Markdown，面向 AI 读取，结构化、事实性、无推测。

### CLAUDE.md

**面向 Claude Code** 在本项目中的使用。

| 内容 | 说明 |
|------|------|
| 项目概览 | 包名、运行环境、入口位置 |
| 常用命令 | 用户常用的命令速查 |
| SDD 工作流 | 项目特有的 `/opsx:` 系列命令 |
| 开发规范 | 代码风格、测试要求、Git 提交规范 |
| 目录结构 | 关键文件和目录的作用说明 |

**格式：** Markdown，Claude Code 启动时自动读取的配置指南。

## 文档同步原则

1. **最小化更新**：只更新需要的文档和章节，不重写整篇
2. **禁止编造**：所有命令、端口、环境变量、API 必须来自仓库事实
3. **TODO(review)**：不确定的内容必须标记，不得猜测
4. **保持简洁**：避免重复和过时信息
5. **不读取密钥**：禁止读取或输出 `.env`、token、凭证文件
6. **不执行危险操作**：禁止 `git commit`、`git push`、`npm publish`

## 更新包

已全局安装的用户，通过以下命令更新到最新版本：

```bash
npm i -g @hunterzheng/docsync
```

查看是否有可用更新：

```bash
npm outdated -g @hunterzheng/docsync
```

## 开发

```bash
# 克隆仓库
git clone https://github.com/hunterzheng1/DocSync.git
cd DocSync

# 本地 link 开发
npm link

# 运行测试
npm test

# 语法检查
npm run lint

# 发布包预检
npm run pack:dry
```

## 环境要求

- Node.js >= 18
- npm

**可选依赖（按需安装）：**

| 工具 | 用途 |
|------|------|
| repomix | 生成项目上下文文件 |
| markdownlint-cli2 | Markdown 格式检查和修复 |
| claude (Claude Code) | AI 交互式文档同步 |
| codex | Codex 规则管理 |
| gh (GitHub CLI) | GitHub 操作集成 |

## 许可证

MIT
