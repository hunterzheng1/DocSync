# DocSync Codex Rules

## 项目说明
DocSync 是一个文档同步 CLI，用于协调跨项目的文档同步工作流。

## 常用命令
- `docsync doctor` - 检查本地环境
- `docsync init` - 初始化项目配置
- `docsync prep` - 准备文档上下文
- `docsync ai` - 启动 AI 文档同步

## 开发规则
1. 所有命令必须基于仓库事实
2. 禁止编造不存在的命令或配置
3. 保持代码和文档一致

## 安全约束
- 不处理凭证或敏感文件
- 不执行破坏性操作（git force push、rm 等）
