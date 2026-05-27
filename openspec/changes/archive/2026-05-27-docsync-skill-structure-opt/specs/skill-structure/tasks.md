# Task 拆解

## T1：创建模板目录结构和源文件（~5min）

- [x] 创建 `templates/skills/docsync/` 目录树
- [x] 编写 `claude/SKILL.md`（含完整 frontmatter）
- [x] 编写 `codex/SKILL.md`（含 name + description）
- [x] 编写 `codex/agents/openai.yaml`
- [x] 编写 `claude/commands/{init,sync,rules}.md`
- [x] 编写 `references/{workflow,doc-standards,safety}.md`
- [x] 编写 `assets/{README,AGENTS,CLAUDE}.template.md`
- [x] 编写 `assets/AGENTS.docsync.block.md`
- [x] 编写 `scripts/validate-workspace.mjs`
- [x] 编写 `scripts/collect-context.mjs`

## T2：重构 adapter 安装器（~5min）

- [x] 重写 `src/core/adapters/claude.mjs`：从模板目录复制 + `.docsync/adapters/claude/` 源投影
- [x] 重写 `src/core/adapters/codex.mjs`：从模板目录复制 + `.docsync/adapters/codex/` 源投影 + `AGENTS.docsync.md` 写入
- [x] 新增 `copyTemplateTree()` 工具函数：返回 `{ created, skipped, updated }`，支持 force/backup/dry-run/quiet
- [x] 更新 `install.json` 结构（installed.claude/codex + adapterSkillPath 字段）
- [x] 确保 AGENTS marker block 插入幂等
- [x] `runInit` 增加 `--dry-run` 早期跳过逻辑（零写入保证）

## T3：package.json 更新（~1min）

- [x] `files` 数组新增 `"templates/skills/"`

## T4：文档去重（~5min）

- [x] CLAUDE.md 变薄：@AGENTS.md + Claude 专属规则，<= 120 行
- [x] README.md 增加安装产物说明
- [x] AGENTS.md 增加模块边界和验证要求

## T5：测试覆盖（~5min）

- [x] 模板结构测试：验证 name/description/frontmatter 存在
- [x] claude adapter install 测试：源投影 + 目标投影 + commands + installed 对象
- [x] codex adapter install 测试：源投影 + AGENTS.docsync.md + 目标投影
- [x] AGENTS marker block 幂等测试
- [x] --dry-run 零写入测试
- [x] copyTemplateTree contract 测试：{ created, skipped, updated } 返回值、dry-run 零写入

## T6：验证（~3min）

- [x] `npm test` 全部通过（57/57）
- [x] `npm run lint` 通过
- [x] `npm run pack:dry` 通过（43 个文件）
- [x] 临时目录烟测：`runInit({ aiTool: 'all' })` 生成所有目标文件
