# Skill 结构规格

## 能力 1：模板文件化

### 目标

将 `src/core/adapters/claude.mjs` 和 `src/core/adapters/codex.mjs` 中的大段 SKILL_CONTENT 常量迁移到 `templates/skills/docsync/` 目录下的独立文件。

### 约束

- `templates/skills/docsync/` 为唯一发布源
- `src/core/adapters/*.mjs` 改为复制模板文件，不再内嵌 Markdown
- 模板文件必须可独立 lint

### 验收

- `runInit({ aiTool: 'all' })` 从模板目录复制文件，不从 JS 常量读取
- 模板文件包含 `name`、`description`、`disable-model-invocation`、`allowed-tools`
- `templates/skills/` 包含在 package `files` 白名单

---

## 能力 2：Claude Command Wrapper

### 目标

为 `/docsync:init`、`/docsync:sync`、`/docsync:rules` 提供真实的 Claude command wrapper 文件。

### 约束

- 每个 wrapper 只做转发到 Skill 对应流程
- 路径：`.claude/commands/docsync/init.md`、`sync.md`、`rules.md`
- 模板源：`templates/skills/docsync/claude/commands/`

### 验收

- 选择 Claude 或 All 时安装 `.claude/commands/docsync/` 下三个 wrapper
- wrapper 内容引用 `.claude/skills/docsync/SKILL.md`

---

## 能力 3：Codex Skill 补全

### 目标

选择 Codex 或 All 时生成完整的 Codex Skill 和 `agents/openai.yaml`。

### 约束

- `.agents/skills/docsync/SKILL.md` 包含 `name` 和 `description`
- `.agents/skills/docsync/agents/openai.yaml` 声明 `allow_implicit_invocation: false`
- `.docsync/adapters/codex/SKILL.md` 保存源投影
- `.docsync/adapters/codex/AGENTS.docsync.md` 为 AGENTS marker block 源

### 验收

- 选择 Codex 时生成 `.agents/skills/docsync/SKILL.md` 和 `agents/openai.yaml`
- 选择 Claude 时不创建 `.agents/` 下文件
- AGENTS marker block 插入幂等（重复运行不重复插入）

---

## 能力 4：Supporting Files

### 目标

为 Skill 添加 `references/`、`scripts/`、`assets/` 目录。

### 约束

- `references/`：workflow.md、doc-standards.md、safety.md
- `scripts/`：validate-workspace.mjs、collect-context.mjs
- `assets/`：README.template.md、AGENTS.template.md、CLAUDE.template.md、AGENTS.docsync.block.md
- Claude 和 Codex 共享 `references/`、`scripts/`、`assets/`

### 验收

- `runInit({ aiTool: 'all' })` 复制 shared supporting files 到两边
- Skill 中引用 `references/` 长规则

---

## 能力 5：Install.json 增强

### 目标

`.docsync/state/install.json` 记录完整安装清单。

### 约束

- 新增 `installed.claude.skillPath`、`installed.claude.adapterSkillPath`、`installed.claude.commands`
- 新增 `installed.codex.skillPath`、`installed.codex.adapterSkillPath`、`installed.codex.agentsBlockPath`
- 新增 `templateVersion`

### 验收

- `aiTool: 'claude'` 时记录 claude 路径
- `aiTool: 'codex'` 时记录 codex 路径
- `aiTool: 'all'` 时两边都记录

---

## 能力 6：文档去重

### 目标

README / AGENTS / CLAUDE 三个核心文档职责清晰、无重复。

### 约束

- CLAUDE.md 使用 `@AGENTS.md` 导入，控制在 120 行以内
- AGENTS.md 增加模块边界和模板验证要求
- README 增加 Claude 与 Codex 安装产物说明
- 移除 `templates/project/` 中根目录 Repomix/markdownlint 配置（legacy）

### 验收

- CLAUDE.md <= 120 行
- README 有安装产物说明
- AGENTS.md 有模块边界
