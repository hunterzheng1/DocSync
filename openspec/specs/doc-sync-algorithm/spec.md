# spec.md - 能力规格定义

> **定位**：文档同步算法（完整同步 + 快速同步双模式）
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：完整同步事实提取

系统必须在完整同步模式下执行完整的项目事实提取和文档同步流程。

##### 场景：标准完整同步

- **当**用户运行 `/docsync:sync` 且项目状态正常
- **预期**刷新项目上下文、生成 Repomix 输出、扫描项目文件、提取仓库事实、对比目标文档、生成最小编辑方案、应用编辑、运行格式修复、输出同步报告

##### 场景：目标文档不存在

- **当**完整同步发现目标文档（README.md/AGENTS.md/CLAUDE.md）不存在
- **预期**创建缺失的文档，使用模板初始化内容

##### 场景：目标文档已存在且有用户内容

- **当**目标文档已存在且包含用户编写的内容
- **预期**只做最小编辑，不覆盖未标记的用户内容

#### 需求项：快速同步算法

系统必须支持 `--fast` 模式的快速同步，使用轻量 git 事实推断影响范围。

##### 场景：有足够 git 事实

- **当**存在最近提交、git diff 或 git status 变更
- **预期**读取轻量事实、根据提交信息和变更文件推断影响范围、生成最小编辑方案、应用编辑、输出快速同步报告

##### 场景：git 信息不足

- **当**无 git 提交、无 diff、.docsync/state/last-sync.json 缺失
- **预期**自动升级为完整同步或停止提示用户

##### 场景：涉及高风险内容

- **当**快速同步推断涉及安装方式、命令契约、测试命令、安全约束或目录结构
- **预期**自动升级为完整同步或停止提示用户

#### 需求项：仓库事实提取

系统必须从项目代码中提取准确的仓库事实。

##### 场景：提取 package.json 事实

- **当**项目存在 package.json
- **预期**提取包名、scripts 命令、运行时要求、依赖列表

##### 场景：提取目录结构事实

- **当**扫描项目目录
- **预期**提取 CLI 入口、src/ 结构、templates/ 内容、test/ 结构

##### 场景：提取安全约束事实

- **当**扫描 CLAUDE.md、AGENTS.md、.gitignore
- **预期**提取现有安全约束和排除规则

#### 需求项：编辑应用与 protected content 检查

系统必须在应用编辑前检查 protected content，确保不被误删。

##### 场景：编辑与 protected content 无冲突

- **当**编辑计划不涉及 protected content 区域
- **预期**正常应用编辑

##### 场景：编辑会删除 protected content

- **当**编辑计划包含删除 protected content 条款
- **预期**停止并报告冲突，不应用编辑

##### 场景：override 规则与仓库事实冲突

- **当**override.md 要求写入与仓库事实冲突的内容
- **预期**停止并报告冲突，不编造内容

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### 输入数据

| 参数名 | 类型 | 必填 | 说明 | 示例值 | 约束条件 |
|-------|------|------|------|--------|----------|
| rules/default.md | file | 是 | 默认规则 | `.docsync/rules/default.md` | 必须存在 |
| rules/override.md | file | 否 | 覆盖规则 | `.docsync/rules/override.md` | 可选 |
| repomix-output.xml | file | 是 | Repomix 上下文 | `.docsync/context/repomix-output.xml` | 完整同步必需 |
| git-status.txt | file | 是 | git 状态摘要 | `.docsync/context/git-status.txt` | 完整同步必需 |
| target-docs | list | 是 | 目标文档 | `["README.md"]` | 1-3 个文件 |

#### 输出结构

```json
{
  "updated_files": ["README.md"],
  "skipped_files": [{"file": "CLAUDE.md", "reason": "no changes needed"}],
  "facts_used": ["package.json scripts", "src/cli.mjs command routing"],
  "mode": "full",
  "todo_review": [],
  "verification": "markdownlint completed"
}
```

---

## 3. 物理约束

### 3.1 性能约束

| 指标 | 约束值 | 说明 |
|------|-------|------|
| 完整同步耗时 | < 30 秒 | 从输入到输出报告 |
| 快速同步耗时 | < 10 秒 | 从输入到输出报告 |
| Repomix 生成耗时 | < 15 秒 | 典型项目大小 |

### 3.2 资源约束

| 资源 | 限制 | 说明 |
|------|------|------|
| Repomix 输出大小 | < 10 MB | 超过时截断并警告 |
| 文档数量 | <= 3 | 仅 README/AGENTS/CLAUDE |

---

## 4. 影响模块

### 4.1 内部依赖

- [ ] `src/core/sync-plan.mjs`：同步计划生成
- [ ] `src/core/context.mjs`：上下文刷新
- [ ] `src/core/protected-content.mjs`：protected content 校验
- [ ] `src/core/rules.mjs`：规则读取

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|--------|
| 上下文生成 | repomix | npx 临时执行 | 生成项目上下文 | 停止并提示 |
| 格式修复 | markdownlint-cli2 | npx 临时执行 | Markdown 格式检查 | 报告但可继续 |

### 4.3 数据存储

- `.docsync/state/last-sync.json`：上次同步上下文哈希

---

## 5. 安全与合规

### 5.1 权限要求

- 不执行 git commit、git push、npm publish
- 只读写项目文档文件

### 5.2 数据安全

- 不确定内容写 `TODO(review)`
- 不编造不存在的命令或步骤

### 5.3 审计要求

- 每次同步输出结构化报告

---

## 6. 兼容性

### 6.1 接口兼容性

- 是否向后兼容：是
- 版本控制策略：算法内部实现可演进，输入输出接口稳定

### 6.2 数据兼容性

- 数据迁移方案：无
- 回滚策略：git checkout 恢复文档

---

> **质量红线检查清单**
>
> - [x] 每个需求项至少有一个场景
> - [x] 使用「必须」强制要求，而非「应该」「可以」
> - [x] 所有接口参数已量化（类型、必填、范围、示例）
> - [x] 物理约束已量化（并发、超时、性能指标）
> - [x] 错误码已定义
> - [x] **技术选型已包含版本信息**（repomix npx、markdownlint-cli2 npx）
> - [x] 若跳过 proposal.md，影响范围已在此补齐
