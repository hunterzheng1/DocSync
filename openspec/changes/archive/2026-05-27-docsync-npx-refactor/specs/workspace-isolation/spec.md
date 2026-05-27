# spec.md - 能力规格定义

> **定位**：.docsync/ 工作区结构与资产隔离
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：.docsync/ 工作区目录结构

系统必须在 npx 引导阶段创建固定的 `.docsync/` 目录结构。

##### 场景：创建完整工作区

- **当**用户完成 AI 工具选择后进入阶段 4
- **预期**创建 `.docsync/` 及其所有子目录（config/、context/、rules/、adapters/、templates/、state/）

##### 场景：工作区已存在

- **当**`.docsync/` 已存在且结构完整
- **预期**跳过创建，验证结构完整性后继续

##### 场景：工作区结构损坏

- **当**`.docsync/` 存在但缺少必需子目录
- **预期**尝试自动修复缺失目录，无法修复则停止并提示

#### 需求项：config 目录

系统必须在 `.docsync/config/` 中管理第三方工具配置。

##### 场景：创建第三方工具配置

- **当**npx 引导安装 Repomix 和 markdownlint
- **预期**在 `.docsync/config/` 下创建 `repomix.config.json`、`markdownlint-cli2.jsonc`、`ignore.md`

#### 需求项：context 目录

系统必须在 `.docsync/context/` 中管理生成的上下文文件。

##### 场景：初始化 context 目录

- **当**npx 引导完成
- **预期**在 `.docsync/context/` 中创建 `.gitkeep`，运行时生成 `repomix-output.xml`、`git-status.txt`、`docs-inventory.json`

#### 需求项：rules 目录

系统必须在 `.docsync/rules/` 中管理文档同步规则。

##### 场景：创建默认规则

- **当**npx 引导完成
- **预期**创建 `.docsync/rules/default.md`（来自模板）和 `.docsync/rules/override.md`（空规则模板）

#### 需求项：adapters 目录

系统必须在 `.docsync/adapters/` 中管理 AI 工具适配器源模板。

##### 场景：安装 Claude 适配器

- **当**用户选择 Claude Code 或 All
- **预期**在 `.docsync/adapters/claude/` 中创建 `SKILL.md`

##### 场景：安装 Codex 适配器

- **当**用户选择 Codex 或 All
- **预期**在 `.docsync/adapters/codex/` 中创建 `AGENTS.docsync.md`

#### 需求项：根目录污染控制

系统必须确保除了三份核心文档和 `.docsync/` 目录外，不在项目根目录新增文件。

##### 场景：检查根目录新增文件

- **当**npx 引导和文档同步完成
- **预期**根目录只新增 `.docsync/`、README.md、AGENTS.md、CLAUDE.md 和 AI 工具官方要求的文件

---

## 2. 技术契约（SDD 扩展）

### 2.1 目录结构

```
.docsync/
  config/
    repomix.config.json
    markdownlint-cli2.jsonc
    ignore.md
  context/
    repomix-output.xml
    git-status.txt
    docs-inventory.json
    .gitkeep
  rules/
    default.md
    override.md
  adapters/
    claude/
      SKILL.md
    codex/
      AGENTS.docsync.md
  templates/
    README.template.md
    AGENTS.template.md
    CLAUDE.template.md
  state/
    install.json
```

---

## 3. 物理约束

### 3.1 性能约束

| 指标 | 约束值 | 说明 |
|------|-------|------|
| 工作区创建耗时 | < 500ms | 创建所有子目录和默认文件 |

### 3.2 资源约束

| 资源 | 限制 | 说明 |
|------|------|------|
| 工作区总大小 | < 5 MB | 默认模板和配置大小 |

---

## 4. 影响模块

### 4.1 内部依赖

- [ ] `src/core/workspace.mjs`：工作区创建与校验

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|--------|
| 文件系统 | fs/promises | Node.js built-in | 目录创建 | 失败则停止 |

---

## 5. 安全与合规

### 5.1 权限要求

- 仅需要项目目录写权限

### 5.2 数据安全

- .docsync/ 下的文件由 DocSync 管理

### 5.3 审计要求

- install.json 记录创建的文件清单

---

## 6. 兼容性

### 6.1 接口兼容性

- 是否向后兼容：是
- 版本控制策略：目录结构稳定，内容可演进

### 6.2 数据兼容性

- 数据迁移方案：无
- 回滚策略：删除 .docsync/ 目录

---

> **质量红线检查清单**
>
> - [x] 每个需求项至少有一个场景
> - [x] 使用「必须」强制要求，而非「应该」「可以」
> - [x] 所有接口参数已量化
> - [x] 物理约束已量化
> - [x] 错误码已定义
> - [x] **技术选型已包含版本信息**
> - [x] 若跳过 proposal.md，影响范围已在此补齐
