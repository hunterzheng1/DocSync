# 实施任务拆解 - environment-diagnostics

> **定位**：单一 Capability 的 AI 编码引擎执行单元
>
> **⚠️ 边界声明**：本任务清单仅服务于当前 Capability，严禁跨模块任务。
>
> **【质量红线】颗粒度必须达到"AI能在5分钟内实现"；且拆解的任务和验证逻辑必须 100% 覆盖 spec 和 design

---

## 1. 任务总览

### 1.1 关联文档

| 文档 | 路径 | 说明 |
|-----|------|------|
| 全局契约 | `openspec/specs/overview.md` | 全局约束基线 |
| 业务意图 | `proposal.md` | 变更背景 |
| 技术契约 | `specs/environment-diagnostics/spec.md` | 当前能力规格 |
| 技术方案 | `specs/environment-diagnostics/design.md` | 当前能力设计 |

### 1.2 实现范围

实现 `docsync doctor` 的必需/推荐工具检测、全局文件检测、稳定状态输出和退出码判定。

### 1.3 技术栈

- 语言：JavaScript ESM
- 框架：Node.js 内置 child_process/fs/path
- 依赖：本机命令和本地文件系统

---

## 2. 任务执行拓扑图

### 2.0 测试策略

**当前测试策略**：`tdd`

### 2.1 拓扑图

```
层级 1: TASK-DOC-01, TASK-DOC-03, TASK-DOC-05
层级 2: TASK-DOC-02(依赖 01), TASK-DOC-04(依赖 03), TASK-DOC-06(依赖 05)
层级 3: TASK-DOC-07(依赖 02,04,06)
```

### 2.2 层级汇总

| 层级 | 任务列表 | 可并行 | 前置依赖 |
|-----|---------|-------|--------|
| 层级 1 | TASK-DOC-01, TASK-DOC-03, TASK-DOC-05 | ✅ 是 | 无 |
| 层级 2 | TASK-DOC-02, TASK-DOC-04, TASK-DOC-06 | ✅ 是 | 对应测试骨架 |
| 层级 3 | TASK-DOC-07 | 否 | TASK-DOC-02, TASK-DOC-04, TASK-DOC-06 |

---

## 3. 原子任务清单

### 3.0 任务类型说明

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| 接口层 | doctor 命令 | 环境检测 |
| 配置 | 检查常量和输出格式 | 工具清单 |
| 测试-骨架 | 测试先行 | TDD 前置 |
| 测试-验证 | 验证执行 | 收尾 |

---

### [TASK-DOC-01] 编写命令检测测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
创建命令存在性、版本读取和检测失败不中断的测试。

#### 输入
- `specs/environment-diagnostics/spec.md`

#### 输出
- `test/doctorTools.test.mjs`

#### 实现步骤
1. mock 命令存在和缺失。
2. 添加 version unknown 仍可 ok 的测试。
3. 添加推荐工具 missing 不失败的测试。

#### 验收标准
- [ ] 覆盖 required/recommended 工具状态。
- [ ] 覆盖版本读取失败。

#### 关联设计
- spec.md 章节：环境工具检测
- design.md 章节：6.3、8.1

---

### [TASK-DOC-02] 实现 doctor 检查常量和工具检测

- **类型**: 接口层
- **依赖**: TASK-DOC-01
- **状态**: [ ] 未完成

#### 任务描述
实现 `REQUIRED_TOOLS`、`RECOMMENDED_TOOLS` 和安全的工具检测函数。

#### 输入
- `test/doctorTools.test.mjs`

#### 输出
- `src/commands/doctor.mjs` 中检查定义
- 必要的 `src/utils/shell.mjs` 扩展

#### 实现步骤
1. 定义 required/recommended 清单。
2. 实现 `checkCommand(name, required)`。
3. 版本获取失败时返回 `version: "unknown"`。

#### 验收标准
- [ ] node/npm 标记 required。
- [ ] 推荐工具缺失不会抛出。

#### 关联设计
- spec.md 章节：环境工具检测
- design.md 章节：4.2、6.3

---

### [TASK-DOC-03] 编写全局文件检测测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
测试 Claude Skill 和 Codex AGENTS 目标路径存在/缺失状态。

#### 输入
- `specs/environment-diagnostics/design.md`

#### 输出
- `test/doctorFiles.test.mjs`

#### 实现步骤
1. 使用临时 HOME/USERPROFILE。
2. 断言目标文件存在时为 installed。
3. 断言目标文件缺失时为 missing。

#### 验收标准
- [ ] 覆盖两个全局文件路径。
- [ ] 不读取文件内容。

#### 关联设计
- spec.md 章节：全局规则安装状态检测
- design.md 章节：2.2、7.5

---

### [TASK-DOC-04] 实现全局文件检测

- **类型**: 接口层
- **依赖**: TASK-DOC-03
- **状态**: [ ] 未完成

#### 任务描述
实现 home 路径解析和全局文件存在状态检查。

#### 输入
- `test/doctorFiles.test.mjs`

#### 输出
- `src/utils/paths.mjs` 扩展
- `src/commands/doctor.mjs` 文件检测逻辑

#### 实现步骤
1. 实现 `getHomeDir/resolveHomePath`。
2. 定义 Claude Skill 和 Codex AGENTS 路径。
3. 检查 exists，只输出状态。

#### 验收标准
- [ ] 文件存在时输出 installed。
- [ ] 文件缺失时输出 missing 和安装提示。

#### 关联设计
- spec.md 章节：全局规则安装状态检测
- design.md 章节：4.2、6.1

---

### [TASK-DOC-05] 编写 doctor 输出和退出码测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
测试 doctor 表格输出、quiet/verbose 和 required 缺失退出码。

#### 输入
- `specs/environment-diagnostics/spec.md`

#### 输出
- `test/doctor.test.mjs`

#### 实现步骤
1. mock required 全 ok。
2. mock npm missing。
3. 添加 quiet/verbose 输出断言。

#### 验收标准
- [ ] required 缺失 exit 1。
- [ ] 推荐工具缺失 exit 0。

#### 关联设计
- spec.md 章节：状态输出格式
- design.md 章节：3.1、8.1

---

### [TASK-DOC-06] 实现 doctor 命令和路由接入

- **类型**: 接口层
- **依赖**: TASK-DOC-05, TASK-DOC-02, TASK-DOC-04
- **状态**: [ ] 未完成

#### 任务描述
实现 `runDoctor(options)` 的完整报告输出和 CLI 路由接入。

#### 输入
- `test/doctor.test.mjs`
- 工具检测和文件检测函数

#### 输出
- `src/commands/doctor.mjs`
- 更新后的 `src/cli.mjs`

#### 实现步骤
1. 汇总 required、recommended、globalFiles。
2. 根据 quiet/verbose 格式化输出。
3. required 缺失时设置 exit 1。
4. 接入 `doctor` 命令路由。

#### 验收标准
- [ ] 输出所有检查项。
- [ ] optional missing 不失败。
- [ ] required missing 失败。

#### 关联设计
- spec.md 章节：全部需求项
- design.md 章节：4.2、6.1、6.3

---

### [TASK-DOC-07] 验证环境诊断能力

- **类型**: 测试-验证
- **依赖**: TASK-DOC-02, TASK-DOC-04, TASK-DOC-06
- **状态**: [ ] 未完成

#### 任务描述
运行 doctor 相关测试和一次手动 doctor 命令。

#### 输入
- doctor 相关测试文件

#### 输出
- 测试结果

#### 实现步骤
1. 运行 doctor 测试。
2. 执行 `node bin/docsync.mjs doctor`。
3. 检查输出包含 node/npm/git/repomix/Claude Skill/Codex 文件。

#### 验收标准
- [ ] doctor 测试通过。
- [ ] 手动 doctor 输出完整状态。

#### 关联设计
- spec.md 章节：全部需求项
- design.md 章节：8.2、9.2

---

## 4. 验证方式

### 4.1 单元测试要求

| 任务 ID | 测试类型 | 测试场景 | 断言内容 |
|--------|---------|---------|---------|
| TASK-DOC-01 | 单元测试 | 工具检测 | ok/missing/version unknown |
| TASK-DOC-03 | 单元测试 | 全局文件 | installed/missing |
| TASK-DOC-05 | 单元测试 | 输出和退出码 | required/recommended 规则 |

### 4.2 集成测试场景

| 场景 | 前置条件 | 操作步骤 | 预期结果 |
|-----|---------|---------|---------|
| doctor 正常输出 | CLI 可执行 | `docsync doctor` | 输出所有检查项 |
| quiet 输出 | CLI 可执行 | `docsync doctor --quiet` | 输出摘要 |

### 4.3 手动验证清单

- [ ] `node bin/docsync.mjs doctor`
- [ ] `node bin/docsync.mjs doctor --verbose`
- [ ] `node bin/docsync.mjs doctor --quiet`

---

## 5. 外部依赖

| 依赖项 | 类型 | 提供方 | 状态 | 备注 |
|-------|------|-------|------|------|
| Node.js >=18 | 运行时 | 用户环境 | ✅ 就绪 | 必需 |
| npm >=9 | 包管理器 | 用户环境 | ✅ 就绪 | 必需 |
| git/repomix/markdownlint-cli2/claude/codex/gh | 第三方命令 | 用户环境 | ⏳ 可选 | 缺失不失败 |

---

## 6. 代码规范

### 6.1 命名规范

- 类名：不使用类。
- 方法名：`runDoctor`、`checkCommand`、`checkGlobalFiles`。
- 变量名：camelCase；常量为 UPPER_SNAKE_CASE。

### 6.2 代码风格

- 缩进：2 spaces。
- 注释：检测降级策略处添加简短说明。
- 异常处理：单项检测失败不得中断整体。

### 6.3 日志规范

- 日志级别：状态走 stdout，参数错误走 stderr。
- 日志格式：稳定列名和摘要。
- 敏感信息处理：不输出文件内容和 token。

---

## 7. 交付物

### 7.1 代码文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `src/commands/doctor.mjs` | doctor 命令 | TASK-DOC-02, TASK-DOC-04, TASK-DOC-06 |
| `src/utils/paths.mjs` | home 路径 | TASK-DOC-04 |
| `src/utils/shell.mjs` | 命令检测 | TASK-DOC-02 |
| `src/cli.mjs` | 路由接入 | TASK-DOC-06 |

### 7.2 测试文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `test/doctorTools.test.mjs` | 工具检测测试 | TASK-DOC-01 |
| `test/doctorFiles.test.mjs` | 全局文件测试 | TASK-DOC-03 |
| `test/doctor.test.mjs` | doctor 输出测试 | TASK-DOC-05 |

### 7.3 文档更新

- [ ] 本 capability 不直接更新 README。
- [ ] 本 capability 不直接更新接口文档。
- [ ] 本 capability 不直接更新变更日志。

---

> **质量红线检查清单**
> - [x] 每个任务颗粒度符合"5分钟可实现"标准
> - [x] 任务清单 100% 覆盖 spec.md 定义
> - [x] 任务清单 100% 覆盖 design.md 定义
> - [x] 每个任务都有明确的验收标准
> - [x] 每个任务都有对应的单元测试要求
> - [x] **依赖拓扑已明确**（依赖字段已填写）
> - [x] **任务执行拓扑图已绘制**（层级关系清晰）
> - [x] 无循环依赖
