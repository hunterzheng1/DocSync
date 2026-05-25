# @hunterzheng/docsync

可复用的 npm CLI，用于文档同步工作流：Repomix 上下文、markdownlint、Claude Skill、Codex 规则管理和 AI 文档同步。

## 安装

```bash
npm i -g @hunterzheng/docsync
```

或通过 `npx` 临时使用：

```bash
npx @hunterzheng/docsync help
```

## 快速开始

```bash
# 1. 检查环境
docsync doctor

# 2. 初始化项目模板
docsync init

# 3. 准备上下文
docsync prep

# 4. 启动文档同步
docsync ai
```

## 命令参考

| 命令 | 用途 |
|------|------|
| `docsync init` | 初始化项目模板（repomix、markdownlint、文档规则） |
| `docsync prep` | 准备项目上下文：git 状态 + Repomix 打包 + markdownlint 修复 |
| `docsync ai` | 启动交互式文档同步（Claude Code） |
| `docsync auto` | 非交互式文档同步（实验性） |
| `docsync doctor` | 检查本地工具安装状态 |
| `docsync skill install` | 安装 Claude Code Skill 到全局或项目 |
| `docsync skill update` | 更新 Skill 文件模板 |
| `docsync skill path` | 输出 Skill 目标路径 |
| `docsync codex install` | 安装 Codex 全局 AGENTS.md 规则 |
| `docsync codex update` | 更新 Codex 规则 |
| `docsync codex path` | 输出 Codex 规则目标路径 |
| `docsync version` | 显示版本号 |
| `docsync help` | 显示帮助信息 |

### 通用选项

- `--force` 覆盖已有文件
- `--backup` 覆盖前生成备份
- `--dry-run` 只打印计划动作
- `--verbose` 详细输出
- `--quiet` 精简输出
- `--cwd <path>` 指定目标目录

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

## SDD 工作流

本项目使用 Specification-Driven Development (SDD) 流程，通过 `/opsx:` 系列命令驱动变更：

`propose → spec → design → task → check → apply → test → archive`

规格文档位于 `openspec/` 目录。

## 安全约束

- 不内置 LLM API 调用
- 不保存 token 或密钥
- 不自动执行 `git commit` / `npm publish`
- 不上传仓库源码到第三方服务

## 环境要求

- Node.js >= 18
- npm
- 可选：repomix、markdownlint-cli2、claude、codex、gh

## 许可证

MIT
