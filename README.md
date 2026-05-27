# @hunterzheng/docsync

可复用的 npm CLI，用于文档同步工作流：Repomix 上下文、markdownlint、Claude Skill、Codex 规则管理和 AI 文档同步。

## 安装与使用

```bash
npx @hunterzheng/docsync
```

npx 首次运行会自动下载并启动交互式引导，完成环境检查、`.docsync/` 工作区创建、AI 适配器安装和三份核心文档初始化。

### AI 驱动使用方式

引导完成后，在 Claude Code 中通过以下 slash 命令完成文档同步：

| Slash 命令 | 用途 |
|-----------|------|
| `/docsync:init` | 项目初始化（检查环境、创建模板文件） |
| `/docsync:sync` | 完整文档同步（环境检查 → 上下文准备 → 对比 → 编辑 → 格式修复 → 报告） |
| `/docsync:sync --fast` | 快速文档同步（使用 git 事实推断影响范围） |
| `/docsync:sync [file]` | 同步指定文件，如 `README.md` |
| `/docsync:rules` | 维护 override 规则（管理 `.docsync/rules/override.md`） |
| `/docsync:rules show` | 查看当前 override 规则完整内容 |

全程无需在终端手动执行任何 CLI 命令。

## 命令详细说明

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
| 安装方式 | 如何通过 npx 引导安装 |
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
