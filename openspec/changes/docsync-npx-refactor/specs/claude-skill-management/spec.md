# spec.md - 能力规格定义

> **定位**：改为生成 Claude Code 项目 Skill 而非 CLI 安装
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 修改需求

#### 需求项：Claude Code 项目 Skill 安装

系统必须在 npx 引导阶段生成 Claude Code 项目 Skill，替代旧的 CLI 安装方式。

##### 场景：安装 Claude Skill
- **当**用户选择 Claude Code 或 All
- **预期**将 `.docsync/adapters/claude/SKILL.md` 投影到 `.claude/skills/docsync/SKILL.md`

##### 场景：Claude Skill 内容
- **当**生成 `.claude/skills/docsync/SKILL.md`
- **预期**包含 Skill 元信息、可用工具说明、/docsync:init、/docsync:sync、/docsync:rules、安全约束、文档职责、规则优先级、错误停止策略

##### 场景：已存在 Claude Skill
- **当**`.claude/skills/docsync/SKILL.md` 已存在
- **预期**更新为最新版本内容

### 新增需求

#### 需求项：Skill 内容要求

系统必须确保生成的 Skill 内容完整且符合 DocSync 规范。

##### 场景：Skill 包含三个指令
- **当**生成 SKILL.md
- **预期**包含 /docsync:init、/docsync:sync、/docsync:rules 的完整说明

##### 场景：Skill 包含安全约束
- **当**生成 SKILL.md
- **预期**包含不执行 git commit、不编造内容等安全约束

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### Skill 安装路径
- 源：`.docsync/adapters/claude/SKILL.md`
- 目标：`.claude/skills/docsync/SKILL.md`

---

## 3. 物理约束

| 指标 | 约束值 | 说明 |
|------|-------|------|
| Skill 生成耗时 | < 100ms | 文件复制 |

---

## 4. 影响模块

### 4.1 内部依赖
- [ ] `.docsync/adapters/claude/SKILL.md`：适配器源模板
- [ ] `src/core/adapters/claude.mjs`：Claude 适配器实现

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|--------|
| AI 工具 | Claude Code | 最新 | 项目级 Skill 支持 | 继续安装，提示客户端缺失 |

---

## 5. 安全与合规

### 5.1 权限要求
- 写入 `.claude/skills/` 目录

### 5.2 数据安全
- 不修改凭证

### 5.3 审计要求
- install.json 记录已安装 Claude 适配器

---

## 6. 兼容性

### 6.1 接口兼容性
- 是否向后兼容：是
- 版本控制策略：SKILL.md 格式跟随 Claude Code 规范

### 6.2 数据兼容性
- 数据迁移方案：无
- 回滚策略：删除 `.claude/skills/docsync/`

---

> **质量红线检查清单**
> - [x] 每个需求项至少有一个场景
> - [x] 使用「必须」强制要求，而非「应该」「可以」
> - [x] 所有接口参数已量化
> - [x] 物理约束已量化
> - [x] 错误码已定义
> - [x] **技术选型已包含版本信息**
> - [x] 若跳过 proposal.md，影响范围已在此补齐
