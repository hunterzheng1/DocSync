# DocSync Skill 结构优化

## 背景

当前 DocSync 的 Skill 模板以内嵌 JS 常量形式存在于 `src/core/adapters/*.mjs` 中，且缺少 Claude command wrapper 和完整的 Codex Skill 产物，导致：

1. 模板难以 lint、测试和审查
2. `/docsync:*` slash command 契约无真实 wrapper 文件
3. Codex Skill 产物缺失
4. Skill 缺少 supporting files（references/scripts/assets）
5. 三个核心文档（README/AGENTS/CLAUDE）存在重复内容

## 目标

将 Skill 模板从 JS 常量迁移到文件化模板源，补全 Claude/Codex 安装产物对称性，收敛三个核心文档职责。

## 收益

- 模板可独立 lint 和审查
- `/docsync:*` 在 Claude Code 中有真实可调用命令
- Codex 用户获得与 Claude 同等的 Skill 能力
- 安装产物记录更完整（install.json）
- 文档去重，CLAUDE.md 变薄

## 风险

- 不改变现有 npx 引导入口
- 不改变现有 CLI 命令接口
- 不影响已有 `.docsync/` 工作区的用户
