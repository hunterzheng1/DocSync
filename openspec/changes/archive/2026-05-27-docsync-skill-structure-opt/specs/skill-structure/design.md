# Skill 结构优化 — 设计文档

## 1. 模板目录结构

```
templates/skills/docsync/
├── claude/
│   ├── SKILL.md                 # Claude 专属 frontmatter
│   └── commands/
│       ├── init.md              # /docsync:init wrapper
│       ├── sync.md              # /docsync:sync wrapper
│       └── rules.md             # /docsync:rules wrapper
├── codex/
│   ├── SKILL.md                 # Codex 专属 frontmatter
│   └── agents/
│       └── openai.yaml          # Codex 展示和策略
├── references/
│   ├── workflow.md              # 同步流程详细说明
│   ├── doc-standards.md         # 文档职责与标准
│   └── safety.md                # 安全约束详细说明
├── scripts/
│   ├── validate-workspace.mjs   # 工作区验证脚本
│   └── collect-context.mjs      # 上下文收集脚本
└── assets/
    ├── README.template.md       # README 模板
    ├── AGENTS.template.md       # AGENTS 模板
    ├── CLAUDE.template.md       # CLAUDE 模板
    └── AGENTS.docsync.block.md  # AGENTS marker block 源
```

## 2. Adapter 安装器重构

### 当前模型

```
src/core/adapters/claude.mjs → SKILL_CONTENT (内嵌字符串) → 写入目标
src/core/adapters/codex.mjs  → SKILL_CONTENT + DOCSYNC_BLOCK → 写入目标
```

### 目标模型

```
src/core/adapters/claude.mjs
  → copyTemplateTree(templates/skills/docsync/claude/, .docsync/adapters/claude/)
  → copySharedTo(templates/skills/docsync/{references,scripts,assets}/, .docsync/adapters/claude/)
  → 投影到 .claude/skills/docsync/
  → 安装 commands 到 .claude/commands/docsync/

src/core/adapters/codex.mjs
  → copyTemplateTree(templates/skills/docsync/codex/, .docsync/adapters/codex/)
  → copySharedTo(templates/skills/docsync/{references,scripts,assets}/, .docsync/adapters/codex/)
  → 投影到 .agents/skills/docsync/
  → AGENTS.md marker block 插入
```

### 核心函数

新增 `copyTemplateTree(src, dest, options)`：
- 递归复制，返回 `{ created, skipped, updated }`
- 支持 `--force`、`--backup`、`--dry-run`
- 支持 `--quiet`
- **dry-run 时不创建任何目录**，仅追踪 would-be-created 文件列表
- `backup: true` 时在覆盖前调用 `backupFile()`

## 3. install.json 增强

```json
{
  "version": 1,
  "installedAt": "...",
  "docsyncVersion": "...",
  "aiTool": "claude|codex|all",
  "templateVersion": "2.0.0",
  "installed": {
    "claude": {
      "skillPath": ".claude/skills/docsync/SKILL.md",
      "adapterSkillPath": ".docsync/adapters/claude/skills/docsync/SKILL.md",
      "commands": [".claude/commands/docsync/init.md", ...]
    },
    "codex": {
      "skillPath": ".agents/skills/docsync/SKILL.md",
      "adapterSkillPath": ".docsync/adapters/codex/skills/docsync/SKILL.md",
      "agentsBlockPath": ".docsync/adapters/codex/AGENTS.docsync.md"
    }
  },
  "filesCreated": [],
  "filesUpdated": [],
  "filesSkipped": []
}
```

## 4. --dry-run 零写入保证

### 设计

`runInit()` 在环境检查之后、workspace 创建之前增加 dry-run 早期返回：

```
if (dryRun) {
  // 打印 planned actions，跳过所有 write
  return { created: [], skipped: [], overwritten: [] };
}
```

`copyTemplateTree()` 中 walk 函数使用 `if (!dryRun && !existsSync(dest)) mkdirSync(...)` 跳过目录创建。

## 5. 文档去重方案

### CLAUDE.md

- 使用 `@AGENTS.md` 导入通用规则
- 只保留 Claude 专属工作流和代码风格
- 删除重复的项目概览、命令列表、目录树

### README.md

- 增加"安装产物"小节，列出 .claude/、.agents/、.docsync/ 下生成的文件
- 修正 slash command 说明：Claude 有 wrapper，Codex 直接请求 Skill

### AGENTS.md

- 增加模块边界（src/core/adapters/*, templates/skills/docsync/*, src/core/workspace.mjs）
- 增加验证要求（改 adapter 或模板时运行测试）
- 增加规则优先级

## 6. package.json files 更新

在 `files` 数组中新增 `"templates/skills/"`。

## 7. 测试覆盖

新增 `test/skill-structure.test.mjs` 覆盖关键验收点：

| 测试组 | 覆盖内容 |
|--------|---------|
| skill template structure | 模板文件存在性：SKILL.md frontmatter、agents/openai.yaml、commands、references/scripts/assets |
| claude adapter install | `.docsync/adapters/claude/skills/docsync/SKILL.md` 源投影、`.claude/skills/docsync/` 目标投影、command wrappers、installed 对象 |
| codex adapter install | `.docsync/adapters/codex/` 源投影、`.docsync/adapters/codex/AGENTS.docsync.md`、`.agents/skills/docsync/` 目标投影 |
| AGENTS.md marker block idempotency | 不存在时创建、重复运行不重复、已有内容时追加 |
| dry-run zero-write guarantee | `runInit({ dryRun: true })` 不创建任何目录、`dryRun: false` 正常创建 |
| copyTemplateTree contract | `{ created, skipped, updated }` 返回值、dry-run 零写入、force/backup 行为 |
