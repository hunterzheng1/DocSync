# 实施任务拆解 - doc-sync-algorithm

> **⚠️ 边界声明**：本任务清单仅服务于当前 Capability。

## 1. 任务总览

### 1.1 关联文档
| 文档 | 路径 | 说明 |
|-----|------|------|
| 业务意图 | `proposal.md` | 变更背景 |
| 技术契约 | `specs/doc-sync-algorithm/spec.md` | 规格定义 |
| 技术方案 | `specs/doc-sync-algorithm/design.md` | 技术实现方案 |

### 1.2 实现范围
- 完整同步事实提取流程
- 快速同步算法
- protected content 检查
- 事务写入策略
- 同步报告输出

### 1.3 技术栈
- 语言：JavaScript (ESM)
- 运行时：Node.js >= 18
- 外部工具：repomix (npx), markdownlint-cli2 (npx)

---

## 2. 任务执行拓扑图

### 2.0 测试策略
**当前测试策略**：`测试驱动 (TDD)`

### 2.1 拓扑图
```
层级 1 (无依赖): TASK-SYNC-01, TASK-SYNC-02
层级 2 (依赖 L1): TASK-SYNC-03, TASK-SYNC-04
层级 3 (依赖 L2): TASK-SYNC-05
层级 4 (依赖 L3): TASK-SYNC-06, TASK-SYNC-07
```

### 2.2 层级汇总
| 层级 | 任务列表 | 可并行 | 前置依赖 |
|-----|---------|-------|--------|
| 层级 1 | TASK-SYNC-01, TASK-SYNC-02 | ✅ 是 | 无 |
| 层级 2 | TASK-SYNC-03, TASK-SYNC-04 | ✅ 是 | 层级 1 |
| 层级 3 | TASK-SYNC-05 | - | 层级 2 |
| 层级 4 | TASK-SYNC-06, TASK-SYNC-07 | ✅ 是 | 层级 3 |

---

## 3. 原子任务清单

### [TASK-SYNC-01] 上下文刷新模块
- **类型**: 接口层
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
修改 `src/core/context.mjs`，实现 git 状态输出和 Repomix 上下文生成到 `.docsync/context/`。

#### 输入
无

#### 输出
- `.docsync/context/git-status.txt`
- `.docsync/context/repomix-output.xml`

#### 实现步骤
1. 修改 `src/core/context.mjs`
2. 实现 `generateGitStatus(outputPath)` 函数
3. 实现 `generateRepomixOutput(outputPath)` 函数
4. 实现 `scanMarkdownDocs()` 生成 docs-inventory.json

#### 验收标准
- [ ] git 状态正确输出到指定路径
- [ ] Repomix 输出文件已生成
- [ ] 文档清单已扫描并生成 JSON

---

### [TASK-SYNC-02] 规则读取模块
- **类型**: 配置
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
创建 `src/core/rules.mjs`，实现 default.md 和 override.md 的读取与解析。

#### 输入
无

#### 输出
`src/core/rules.mjs` 包含 `readRules(cwd)` 函数

#### 验收标准
- [ ] 默认规则正确加载
- [ ] override 规则（如果存在）正确加载
- [ ] 解析为结构化对象

---

### [TASK-SYNC-03] protected content 校验模块
- **类型**: 接口层
- **依赖**: TASK-SYNC-02
- **状态**: [ ] 未完成

#### 任务描述
创建 `src/core/protected-content.mjs`，实现 protected content 的解析与比对。

#### 输入
override.md 中的 ProtectedContent 区域

#### 输出
`src/core/protected-content.mjs` 包含 `checkProtected(edits, protectedRules)` 函数

#### 验收标准
- [ ] protected content 正确解析
- [ ] 编辑与 protected content 无冲突时返回 OK
- [ ] 编辑与 protected content 冲突时抛出 ProtectedContentViolation

---

### [TASK-SYNC-04] 同步计划生成模块
- **类型**: 接口层
- **依赖**: TASK-SYNC-01, TASK-SYNC-02
- **状态**: [ ] 未完成

#### 任务描述
创建 `src/core/sync-plan.mjs`，实现事实提取和同步计划生成。

#### 输入
项目事实、规则文件、目标文档列表

#### 输出
`src/core/sync-plan.mjs` 包含 `generateSyncPlan(targets, facts, rules, mode)` 函数

#### 验收标准
- [ ] 仓库事实正确提取
- [ ] 最小编辑方案正确生成
- [ ] 支持 full 和 fast 两种模式

---

### [TASK-SYNC-05] 事务写入模块
- **类型**: 接口层
- **依赖**: TASK-SYNC-03, TASK-SYNC-04
- **状态**: [ ] 未完成

#### 任务描述
创建 `src/core/transaction.mjs`，实现原子写入与回滚策略。

#### 输入
同步计划

#### 输出
`src/core/transaction.mjs` 包含 `transaction(edits)` 函数

#### 验收标准
- [ ] 临时文件正确写入
- [ ] protected content 检查通过后原子落盘
- [ ] 检查失败时回滚并清理临时文件

---

### [TASK-SYNC-06] 完整同步入口
- **类型**: 接口层
- **依赖**: TASK-SYNC-01, TASK-SYNC-02, TASK-SYNC-03, TASK-SYNC-04, TASK-SYNC-05
- **状态**: [ ] 未完成

#### 任务描述
实现 `syncFull(targets)` 主流程，串联所有步骤。

#### 验收标准
- [ ] 完整同步流程正确执行
- [ ] 同步报告正确输出

---

### [TASK-SYNC-07] 快速同步入口
- **类型**: 接口层
- **依赖**: TASK-SYNC-01, TASK-SYNC-02, TASK-SYNC-03, TASK-SYNC-04, TASK-SYNC-05
- **状态**: [ ] 未完成

#### 任务描述
实现 `syncFast(targets)` 主流程。

#### 验收标准
- [ ] 快速同步流程正确执行
- [ ] 信息不足时正确升级为完整同步

---

## 4. 验证方式

### 4.1 单元测试要求
| 任务 ID | 测试类型 | 测试场景 | 断言内容 |
|--------|---------|---------|--------|
| TASK-SYNC-01 | 单元测试 | git 状态生成 | 输出文件存在且非空 |
| TASK-SYNC-01 | 单元测试 | 非 git 仓库 | 生成标注文件 |
| TASK-SYNC-03 | 单元测试 | protected content 冲突 | 抛出 ProtectedContentViolation |
| TASK-SYNC-04 | 单元测试 | 事实提取 | package.json 事实正确提取 |
| TASK-SYNC-05 | 单元测试 | 事务写入成功 | 文件正确落盘 |
| TASK-SYNC-05 | 单元测试 | 事务写入失败 | 临时文件已清理 |

### 4.2 集成测试场景
| 场景 | 前置条件 | 操作步骤 | 预期结果 |
|-----|---------|---------|--------|
| 完整同步 | 三份文档存在 | 执行 syncFull | 文档已更新，报告正确输出 |
| 快速同步 | 有最近提交 | 执行 syncFast | 文档已更新 |
| Protected content 冲突 | override 有 protected | 编辑会删除 | 停止，报告冲突 |

### 4.3 手动验证清单
- [ ] 执行 /docsync:sync 能正确同步文档
- [ ] 执行 /docsync:sync --fast 能快速更新
- [ ] Protected content 不被误删

---

## 5. 外部依赖
| 依赖项 | 类型 | 提供方 | 状态 | 备注 |
|-------|------|-------|------|------|
| repomix | 第三方 | npx | ✅ 就绪 | 上下文生成 |
| markdownlint-cli2 | 第三方 | npx | ✅ 就绪 | 格式修复 |

---

## 7. 交付物
### 7.1 代码文件
| 文件路径 | 说明 | 对应任务 |
|---------|------|--------|
| src/core/sync-plan.mjs | 同步计划生成 | TASK-SYNC-04 |
| src/core/protected-content.mjs | protected content 校验 | TASK-SYNC-03 |
| src/core/transaction.mjs | 原子写入与回滚 | TASK-SYNC-05 |
| src/core/rules.mjs | 规则读取 | TASK-SYNC-02 |

### 7.2 测试文件
| 文件路径 | 说明 | 对应任务 |
|---------|------|--------|
| test/sync-plan.test.mjs | 同步计划测试 | TASK-SYNC-04 |
| test/protected-content.test.mjs | protected content 测试 | TASK-SYNC-03 |
| test/transaction.test.mjs | 事务写入测试 | TASK-SYNC-05 |

---

> **质量红线检查清单**
> - [x] 每个任务颗粒度符合"5分钟可实现"标准
> - [x] 任务清单 100% 覆盖 spec.md 定义
> - [x] 任务清单 100% 覆盖 design.md 定义
> - [x] 每个任务都有明确的验收标准
> - [x] 每个任务都有对应的单元测试要求
> - [x] **依赖拓扑已明确**
> - [x] **任务执行拓扑图已绘制**
> - [x] 无循环依赖
