## DocSync 文档同步协议

> 本段落由 `docsync codex install` 自动安装到 `AGENTS.md` 中。
> 请勿手动编辑 `<!-- DOCSYNC_START -->` 和 `<!-- DOCSYNC_END -->` 之间的内容。

<!-- DOCSYNC_START: doc-sync rules -->

### DocSync 是什么

DocSync (`@hunterzheng/docsync`) 是一个可通过 npm 发布的 CLI 工具，用于协调 Repomix、markdownlint、Claude Skill、Codex 规则和 AI 文档同步工作流。它管理 3 个核心文档：`README.md`、`AGENTS.md`、`CLAUDE.md`。

### DocSync 做什么
- 安装项目模板配置（repomix、markdownlint、文档规则）
- 生成项目上下文文件（repomix-output.xml）供 AI 读取
- 诊断本地环境和工具安装状态
- 协调 AI 驱动的文档同步工作流
- 安装/更新 Claude Code Skill 和 Codex 全局规则

### DocSync 不做什么
- 不调用 LLM API
- 不修改业务代码
- 不自动执行 `git commit` / `git push` / `npm publish`
- 不存储或处理 token、密钥、凭证
- 不上传源码到第三方服务

### 何时使用 DocSync
- 代码结构、依赖、命令、测试发生重大变化后
- 新增/删除模块、API、Agent 规则后
- CI/CD 流程变更后
- 项目文档明显落后于代码事实

### 何时不应使用 DocSync
- 没有实质性的代码或配置变更
- 只修改了无关紧要的文件
- 正在活跃调试中（等稳定状态后再同步）

### 文档同步工作流

当需要更新项目文档时，按以下步骤执行：

1. **确认上下文**：检查 `repomix-output.xml` 是否存在且是最新的
   - 如不存在或过时，先执行 `docsync prep` 或 `repomix -o repomix-output.xml`
2. **读取上下文**：Read `repomix-output.xml` 了解项目全貌
3. **读取变更摘要**：Bash `git status --short` 和 `git diff --stat`
4. **读取目标文档**：逐一 Read 存在的 `README.md`、`AGENTS.md`、`CLAUDE.md`
5. **识别差异**：对比代码事实与现有文档，找出不一致、遗漏或过时的内容
6. **执行编辑**：
   - 已有文件：使用 Edit 执行最小变更，只更新需要的部分
   - 不存在的文件：使用 Write 创建完整内容
   - 所有内容必须基于代码事实，禁止编造
7. **格式修复**：Bash `markdownlint-cli2 --fix`（如已安装）
8. **报告**：向用户说明变更了哪些文件和章节

### 文档职责分工

| 文档 | 目标读者 | 职责 |
|------|---------|------|
| README.md | 项目使用者 | 简介、安装、快速开始、命令参考、License |
| AGENTS.md | AI Agent | 命令契约、开发规则、安全约束、验证要求 |
| CLAUDE.md | Claude Code | 常用命令、工作流、代码风格、目录结构 |

### 安全约束

- 禁止读取或输出 `.env`、token、密钥、凭证文件
- 禁止执行 `git commit`、`git push`、`npm publish`
- 禁止使用 `curl`/`wget` 下载外部资源
- 禁止修改认证或认证相关文件
- 不确定内容标记为 `TODO(review)`

### 快速命令参考

```bash
docsync doctor              # 检查环境
docsync init                # 初始化项目模板
docsync prep                # 生成项目上下文
docsync ai                  # 交互式文档同步
docsync skill install       # 安装 Claude Skill
docsync codex install       # 安装 Codex 规则
npm i -g @hunterzheng/docsync  # 安装/更新 DocSync
```

<!-- DOCSYNC_END -->
