# spec.md - 能力规格定义

> **定位**：改为更新 AGENTS.md 标记块而非 CLI 安装
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 修改需求

#### 需求项：Codex AGENTS.md 规则块安装

系统必须在 npx 引导阶段更新项目 AGENTS.md 的 DocSync 标记块，替代旧的 CLI 安装方式。

##### 场景：无 AGENTS.md 时创建
- **当**项目没有 `AGENTS.md` 且用户选择 Codex 或 All
- **预期**创建符合默认规则的完整 AGENTS.md 文件

##### 场景：已有 AGENTS.md 时更新
- **当**项目已有 `AGENTS.md` 且用户选择 Codex 或 All
- **预期**插入或更新 DocSync 标记块（`<!-- docsync:start -->` ... `<!-- docsync:end -->`）

##### 场景：标记块内容
- **当**生成 DocSync 标记块
- **预期**只描述 DocSync 的三个命令、文档职责、规则优先级和安全约束

### 新增需求

#### 需求项：AGENTS.docsync.md 模板

系统必须在 `.docsync/adapters/codex/AGENTS.docsync.md` 保存 DocSync 规则块模板。

##### 场景：创建模板
- **当**npx 引导选择 Codex 或 All
- **预期**在 `.docsync/adapters/codex/` 中创建 `AGENTS.docsync.md`

#### 需求项：标记块管理

系统必须正确管理 AGENTS.md 中的 DocSync 标记块。

##### 场景：更新标记块
- **当**用户重新运行 npx 引导或 `/docsync:init`
- **预期**更新标记块内容，不重复插入

##### 场景：标记块不存在
- **当**AGENTS.md 存在但无 DocSync 标记块
- **预期**插入新的标记块

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### 标记块格式

```markdown
<!-- docsync:start -->
## DocSync

/docsync:init - 项目初始化与首次同步
/docsync:sync - 日常文档同步
/docsync:rules - 维护项目级文档同步规则

详细规则见 `.docsync/rules/default.md`
用户覆盖规则见 `.docsync/rules/override.md`

安全约束：
- 不执行 git commit、git push、npm publish
- 不编造不存在的命令或部署步骤
<!-- docsync:end -->
```

#### 模板安装路径
- 源：DocSync 内置模板
- 目标：`.docsync/adapters/codex/AGENTS.docsync.md`

---

## 3. 物理约束

| 指标 | 约束值 | 说明 |
|------|-------|------|
| 标记块插入耗时 | < 100ms | 文件读写 |

---

## 4. 影响模块

### 4.1 内部依赖
- [ ] `.docsync/adapters/codex/AGENTS.docsync.md`：Codex 适配器模板
- [ ] `src/core/adapters/codex.mjs`：Codex 适配器实现

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|--------|
| AI 工具 | Codex | 最新 | AGENTS.md 规则支持 | 继续安装，提示客户端缺失 |

---

## 5. 安全与合规

### 5.1 权限要求
- 读写 AGENTS.md

### 5.2 数据安全
- 保留 AGENTS.md 中非 DocSync 内容

### 5.3 审计要求
- install.json 记录已安装 Codex 适配器

---

## 6. 兼容性

### 6.1 接口兼容性
- 是否向后兼容：是
- 版本控制策略：标记块格式稳定

### 6.2 数据兼容性
- 数据迁移方案：无
- 回滚策略：删除 DocSync 标记块

---

> **质量红线检查清单**
> - [x] 每个需求项至少有一个场景
> - [x] 使用「必须」强制要求，而非「应该」「可以」
> - [x] 所有接口参数已量化
> - [x] 物理约束已量化
> - [x] 错误码已定义
> - [x] **技术选型已包含版本信息**
> - [x] 若跳过 proposal.md，影响范围已在此补齐
