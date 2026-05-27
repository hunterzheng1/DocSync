# 实施任务拆解 - npx-bootstrap

> **⚠️ 边界声明**：本任务清单仅服务于当前 Capability。

## 1. 任务总览

### 1.1 关联文档
| 文档 | 路径 | 说明 |
|-----|------|------|
| 业务意图 | `proposal.md` | 变更背景 |
| 技术契约 | `specs/npx-bootstrap/spec.md` | 规格定义 |
| 技术方案 | `specs/npx-bootstrap/design.md` | 技术实现方案 |

### 1.2 实现范围
- npx 无参数引导入口
- 6 阶段引导流程（定位目录 → 环境检查 → AI 选择 → 工作区 → 适配器 → 文档初始化）
- fail-fast 停止策略
- install.json 写入

### 1.3 技术栈
- 语言：JavaScript (ESM)
- 运行时：Node.js >= 18
- 依赖：fs/promises, path, readline (Node.js builtins)

---

## 2. 任务执行拓扑图

### 2.0 测试策略
**当前测试策略**：`测试驱动 (TDD)`

### 2.1 拓扑图
```
层级 1 (无依赖): TASK-BOOT-01, TASK-BOOT-02, TASK-BOOT-03
层级 2 (依赖 L1): TASK-BOOT-04, TASK-BOOT-05
层级 3 (依赖 L2): TASK-BOOT-06
层级 4 (依赖 L3): TASK-BOOT-07, TASK-BOOT-08
```

### 2.2 层级汇总
| 层级 | 任务列表 | 可并行 | 前置依赖 |
|-----|---------|-------|--------|
| 层级 1 | TASK-BOOT-01, TASK-BOOT-02, TASK-BOOT-03 | ✅ 是 | 无 |
| 层级 2 | TASK-BOOT-04, TASK-BOOT-05 | ✅ 是 | 层级 1 |
| 层级 3 | TASK-BOOT-06 | - | 层级 2 |
| 层级 4 | TASK-BOOT-07, TASK-BOOT-08 | ✅ 是 | 层级 3 |

---

## 3. 原子任务清单

### [TASK-BOOT-01] 环境检查模块
- **类型**: 接口层
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
创建 `src/core/environment.mjs`，实现 Node.js 版本检查、npm/npx 可执行性检查、git 可执行性检查、目录可写性检查。

#### 输入
无

#### 输出
`src/core/environment.mjs` 包含 `checkAll()` 函数，返回 `{ ok: boolean, details: object }`

#### 实现步骤
1. 创建 `src/core/environment.mjs`
2. 实现 `checkNodeVersion(minVersion)` 函数
3. 实现 `checkExecutable(cmd)` 函数
4. 实现 `checkDirWritable(dir)` 函数
5. 实现 `checkGitRepo(dir)` 函数
6. 组合 `checkAll()` 函数
7. 编写对应测试

#### 验收标准
- [ ] Node.js < 18 | checkAll() 返回 ok: false |
| TASK-BOOT-01 | 单元测试 | 全部检查通过 | checkAll() 返回 ok: true |
| TASK-BOOT-02 | 单元测试 | 新建工作区 | 目录结构完整 |
| TASK-BOOT-02 | 单元测试 | 已存在工作区 | 不重复创建 |
| TASK-BOOT-05 | 单元测试 | 无参数入口 | 进入引导流程 |
| TASK-BOOT-06 | 单元测试 | 安装 Claude | SKILL.md 已创建 |
| TASK-BOOT-08 | 单元测试 | 文档不存在 | 创建新文档 |

### 4.2 集成测试场景
| 场景 | 前置条件 | 操作步骤 | 预期结果 |
|-----|---------|---------|--------|
| 完整引导 | 空项目目录 | 执行 npx @hunterzheng/docsync | 6 阶段全部完成 |
| 环境检查失败 | Node.js < 18 | 执行引导 | 阶段 2 失败后停止 |

### 4.3 手动验证清单
- [ ] 在空目录运行 npx 命令能进入引导
- [ ] .docsync/ 目录结构完整
- [ ] install.json 记录正确

---

## 5. 外部依赖
| 依赖项 | 类型 | 提供方 | 状态 | 备注 |
|-------|------|-------|------|------|
| Node.js readline | 第三方 | Node.js | ✅ 就绪 | 内置模块 |
| fs/promises | 第三方 | Node.js | ✅ 就绪 | 内置模块 |

---

## 7. 交付物
### 7.1 代码文件
| 文件路径 | 说明 | 对应任务 |
|---------|------|--------|
| src/commands/init.mjs | npx 引导主入口 | TASK-BOOT-03 |
| src/core/environment.mjs | 环境检查 | TASK-BOOT-01 |
| src/core/workspace.mjs | 工作区创建 | TASK-BOOT-02 |
| src/core/adapters/claude.mjs | Claude 适配器 | TASK-BOOT-06 |
| src/core/adapters/codex.mjs | Codex 适配器 | TASK-BOOT-06 |

### 7.2 测试文件
| 文件路径 | 说明 | 对应任务 |
|---------|------|--------|
| test/environment.test.mjs | 环境检查测试 | TASK-BOOT-01 |
| test/workspace.test.mjs | 工作区创建测试 | TASK-BOOT-02 |

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
