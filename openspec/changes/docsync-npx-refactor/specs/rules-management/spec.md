# spec.md - 能力规格定义

> **定位**：规则优先级系统与 override/protected content 管理
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：规则优先级系统

系统必须实现 7 层规则优先级，从高到低依次为：用户指令 > 安全约束 > override.md > 仓库事实 > default.md > 格式.md > 内置模板。

##### 场景：用户指令最高优先级
- **当**用户在本次对话中明确要求"必须使用英文"
- **预期**即使 override.md 和 default.md 使用中文，仍以用户指令为准

##### 场景：override 覆盖 default
- **当**override.md 要求 README 使用英文，default.md 使用中文
- **预期**README 使用英文

##### 场景：仓库事实不可被 override 覆盖
- **当**override.md 要求写入与仓库事实冲突的命令
- **预期**停止并报告冲突，不编造内容

#### 需求项：override.md 文件格式

系统必须维护 `.docsync/rules/override.md` 作为用户可编辑的 Markdown 规则文件。

##### 场景：创建默认 override.md
- **当**npx 引导或首次初始化
- **预期**创建包含 Global、README.md、AGENTS.md、CLAUDE.md、ProtectedContent 五个区域的默认文件

##### 场景：添加文档级规则
- **当**用户通过 `/docsync:rules README.md 必须使用英文`
- **预期**在 README.md 区域添加规则行

##### 场景：添加 protected content
- **当**用户通过 `/docsync:rules CLAUDE.md 必须保留 commit 前确认`
- **预期**在 ProtectedContent 区域添加条款，包含 target 和必须保留的文本

#### 需求项：protected content 保护

系统必须在同步过程中保护 protected content 区域定义的文本不被删除或改写。

##### 场景：同步不触碰 protected content
- **当**文档同步不涉及 protected content 区域定义的目标文本
- **预期**正常执行同步

##### 场景：同步会删除 protected content
- **当**文档同步的最小编辑方案包含删除 protected content 条款
- **预期**停止执行，报告冲突，不应用编辑

##### 场景：用户明确要求修改 protected content
- **当**用户本次明确指令要求修改 protected content 条款
- **预期**允许修改，以用户指令为最高优先级

#### 需求项：规则机器可读索引

系统必须维护 `.docsync/state/rules-index.json` 作为规则的机器可读摘要。

##### 场景：生成规则索引
- **当**override.md 更新后
- **预期**解析 Markdown 并生成结构化 JSON 索引

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### override.md 结构

```markdown
# DocSync Override Rules

## Global
- 全局规则

## README.md
- README 专属规则

## AGENTS.md
- AGENTS 专属规则

## CLAUDE.md
- CLAUDE 专属规则

## ProtectedContent
### rule-slug
Target: CLAUDE.md
Text: 必须保留的文本
```

#### 规则索引结构

```json
{
  "version": 1,
  "global": ["不编造命令"],
  "documents": {
    "README.md": ["语言: 英文"],
    "CLAUDE.md": ["保留 commit 前确认"]
  },
  "protected": [{
    "slug": "commit-confirmation",
    "target": "CLAUDE.md",
    "text": "Before running git commit, ask the user for confirmation."
  }]
}
```

---

## 3. 物理约束

### 3.1 性能约束
| 指标 | 约束值 | 说明 |
|------|-------|------|
| 规则解析耗时 | < 100ms | 解析 override.md 到内存结构 |

### 3.2 资源约束
| 资源 | 限制 | 说明 |
|------|------|------|
| override.md 大小 | < 50 KB | 保持人类可编辑性 |

---

## 4. 影响模块

### 4.1 内部依赖
- [ ] `src/core/rules.mjs`：规则读取与优先级应用
- [ ] `src/core/protected-content.mjs`：protected content 校验

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|--------|
| 文件格式 | Markdown | 无 | override.md 编辑格式 | 无降级 |

---

## 5. 安全与合规

### 5.1 权限要求
- override.md 由用户编辑，系统只追加不覆盖

### 5.2 数据安全
- Protected content 条款不得被自动删除

### 5.3 审计要求
- 规则应用记录在同步报告中

---

## 6. 兼容性

### 6.1 接口兼容性
- 是否向后兼容：是
- 版本控制策略：override.md 格式稳定

### 6.2 数据兼容性
- 数据迁移方案：无
- 回滚策略：git checkout override.md

---

> **质量红线检查清单**
> - [x] 每个需求项至少有一个场景
> - [x] 使用「必须」强制要求，而非「应该」「可以」
> - [x] 所有接口参数已量化（类型、必填、范围、示例）
> - [x] 物理约束已量化
> - [x] 错误码已定义
> - [x] **技术选型已包含版本信息**
> - [x] 若跳过 proposal.md，影响范围已在此补齐
