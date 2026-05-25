# DocSync - Claude Code Skill

## 概述
DocSync 是一个文档同步 CLI 工具，用于协调 Repomix、markdownlint 和 AI 文档同步工作流。

## 常用命令
```bash
docsync help      # 查看所有命令
docsync doctor    # 检查环境状态
docsync init      # 初始化项目模板
docsync prep      # 准备文档同步上下文
docsync ai        # 启动交互式文档同步
docsync auto      # 实验性：非交互式文档同步
```

## 文档同步规则
1. 只更新 README.md、AGENTS.md、CLAUDE.md
2. 禁止编造命令、端口、环境变量、API 或部署步骤
3. 基于仓库事实编写内容，不推测不存在的配置
4. 不确定的内容必须标记为 TODO(review)
5. 保持文档简洁，避免重复和过时信息

## 安全约束
- 不读取或输出 .env、token、密钥文件
- 不执行 git commit、git push、npm publish
- 不使用 curl/wget 下载外部资源
- 不修改凭证或认证文件
