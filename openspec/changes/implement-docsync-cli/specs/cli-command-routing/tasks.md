# 实施任务拆解 - cli-command-routing

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
| 技术契约 | `specs/cli-command-routing/spec.md` | 当前能力规格 |
| 技术方案 | `specs/cli-command-routing/design.md` | 当前能力设计 |

### 1.2 实现范围

实现 npm CLI 基础入口、通用参数解析、一级命令路由、help/version 输出和顶层异常处理。

### 1.3 技术栈

- 语言：JavaScript ESM
- 框架：Node.js 内置能力
- 依赖：无第三方运行时依赖

---

## 2. 任务执行拓扑图

### 2.0 测试策略

**当前测试策略**：`tdd`

| 策略 | 说明 | 拓扑结构 |
|--------|------|------------|
| 测试驱动 | 测试先行 | 测试骨架 → 实现代码 → 测试验证 |

### 2.1 拓扑图

```
层级 1: TASK-CLI-01, TASK-CLI-03, TASK-CLI-05
层级 2: TASK-CLI-02(依赖 01), TASK-CLI-04(依赖 03), TASK-CLI-06(依赖 05)
层级 3: TASK-CLI-07(依赖 02,04,06)
```

### 2.2 层级汇总

| 层级 | 任务列表 | 可并行 | 前置依赖 |
|-----|---------|-------|--------|
| 层级 1 | TASK-CLI-01, TASK-CLI-03, TASK-CLI-05 | ✅ 是 | 无 |
| 层级 2 | TASK-CLI-02, TASK-CLI-04, TASK-CLI-06 | ✅ 是 | 对应测试骨架 |
| 层级 3 | TASK-CLI-07 | 否 | TASK-CLI-02, TASK-CLI-04, TASK-CLI-06 |

---

## 3. 原子任务清单

### 3.0 任务类型说明

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| 配置 | npm manifest、入口文件 | CLI 包入口 |
| 接口层 | 命令路由、参数解析 | CLI 接口 |
| 测试-骨架 | 测试文件和断言骨架 | TDD 前置 |
| 测试-验证 | 运行测试和手动命令 | 收尾验证 |

---

### [TASK-CLI-01] 编写参数解析测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
为通用参数解析创建 `test/args.test.mjs` 的测试骨架。

#### 输入
- `specs/cli-command-routing/spec.md`
- `specs/cli-command-routing/design.md`

#### 输出
- `test/args.test.mjs`

#### 实现步骤
1. 引入 `node:test` 和 `node:assert/strict`。
2. 添加布尔参数解析用例。
3. 添加 `--cwd <path>` 带值参数解析用例。

#### 验收标准
- [x] 测试文件存在。
- [x] 覆盖 `--force --backup` 和 `--cwd ./demo`。

#### 关联设计
- spec.md 章节：需求项：通用参数解析
- design.md 章节：1.1、6.3

---

### [TASK-CLI-02] 实现通用参数解析模块

- **类型**: 接口层
- **依赖**: TASK-CLI-01
- **状态**: [x] 已完成

#### 任务描述
实现 `src/utils/args.mjs`，输出结构化 options 和 rest。

#### 输入
- `test/args.test.mjs`

#### 输出
- `src/utils/args.mjs`

#### 实现步骤
1. 实现逐 token 扫描。
2. 将 kebab flag 转为 camelCase。
3. 对缺值参数抛出带 exitCode 2 的错误。

#### 验收标准
- [x] `parseArgs(["--force","--backup"])` 返回 true 布尔值。
- [x] `parseArgs(["--cwd","./demo"])` 返回 cwd。

#### 关联设计
- spec.md 章节：需求项：通用参数解析
- design.md 章节：6.3、8.1

---

### [TASK-CLI-03] 编写路由分发测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
为 `src/cli.mjs` 的默认 help、已知命令和未知命令创建测试骨架。

#### 输入
- `specs/cli-command-routing/spec.md`

#### 输出
- `test/cli.test.mjs`

#### 实现步骤
1. 准备捕获 stdout/stderr 的测试辅助。
2. 添加空 argv 默认 help 用例。
3. 添加未知命令 exit 1 用例。

#### 验收标准
- [x] 覆盖默认帮助场景。
- [x] 覆盖未知命令场景。

#### 关联设计
- spec.md 章节：需求项：命令路由
- design.md 章节：4.2、6.1

---

### [TASK-CLI-04] 实现 CLI 主分发

- **类型**: 接口层
- **依赖**: TASK-CLI-03
- **状态**: [x] 已完成

#### 任务描述
实现 `src/cli.mjs` 的 command 识别、options 解析和 handler 分发。

#### 输入
- `test/cli.test.mjs`
- `src/utils/args.mjs`

#### 输出
- `src/cli.mjs`

#### 实现步骤
1. 定义 command 到 handler 的映射。
2. 将空 command 归一为 `help`。
3. 对未知 command 输出错误和 help。

#### 验收标准
- [x] `main([])` 等价 help。
- [x] `main(["unknown"])` 返回或设置失败状态。

#### 关联设计
- spec.md 章节：需求项：命令路由
- design.md 章节：4.2、6.1

---

### [TASK-CLI-05] 编写入口和 help/version 测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
为 bin 入口、help 输出和 version 输出创建测试或可执行断言骨架。

#### 输入
- `specs/cli-command-routing/spec.md`

#### 输出
- `test/bin.test.mjs`

#### 实现步骤
1. 使用 `node:child_process` 准备执行入口的辅助函数。
2. 添加 `node bin/docsync.mjs help` 退出码 0 用例。
3. 添加 version alias 用例。

#### 验收标准
- [x] 测试覆盖 bin 入口。
- [x] 测试覆盖 `version/-v/--version`。

#### 关联设计
- spec.md 章节：需求项：npm CLI 包入口
- design.md 章节：2.2、4.2

---

### [TASK-CLI-06] 实现 package/bin/help/version 文件

- **类型**: 配置
- **依赖**: TASK-CLI-05
- **状态**: [x] 已完成

#### 任务描述
创建 npm manifest、bin 入口、help 和 version 命令模块。

#### 输入
- `test/bin.test.mjs`

#### 输出
- `package.json`
- `bin/docsync.mjs`
- `src/commands/help.mjs`
- `src/commands/version.mjs`

#### 实现步骤
1. 创建 `package.json` 的 `type`、`bin`、`engines` 基础字段。
2. 创建带 shebang 的 `bin/docsync.mjs`。
3. 实现 help/version 输出。

#### 验收标准
- [x] bin 文件以 `#!/usr/bin/env node` 开头。
- [x] help 输出包含全部一级命令。

#### 关联设计
- spec.md 章节：需求项：npm CLI 包入口
- design.md 章节：2.2、4.2

---

### [TASK-CLI-07] 验证 CLI 路由能力

- **类型**: 测试-验证
- **依赖**: TASK-CLI-02, TASK-CLI-04, TASK-CLI-06
- **状态**: [x] 已完成

#### 任务描述
运行路由相关测试和基本手动命令。

#### 输入
- `test/args.test.mjs`
- `test/cli.test.mjs`
- `test/bin.test.mjs`

#### 输出
- 测试结果

#### 实现步骤
1. 运行 `npm test -- --run test/args.test.mjs test/cli.test.mjs test/bin.test.mjs`。
2. 运行 `node bin/docsync.mjs help`。
3. 运行 `node bin/docsync.mjs version`。

#### 验收标准
- [x] 相关测试通过。
- [x] help/version 手动命令退出码为 0。

#### 关联设计
- spec.md 章节：全部需求项
- design.md 章节：8.1、9.2

---

## 4. 验证方式

### 4.1 单元测试要求

| 任务 ID | 测试类型 | 测试场景 | 断言内容 |
|--------|---------|---------|---------|
| TASK-CLI-01 | 单元测试 | 参数解析 | 布尔和带值参数 |
| TASK-CLI-03 | 单元测试 | 路由 | 默认 help、未知命令 |
| TASK-CLI-05 | 集成式单元测试 | bin 入口 | help/version 退出码 |

### 4.2 集成测试场景

| 场景 | 前置条件 | 操作步骤 | 预期结果 |
|-----|---------|---------|---------|
| CLI 帮助 | package/bin 已实现 | `node bin/docsync.mjs help` | exit 0 |
| 未知命令 | cli 已实现 | `node bin/docsync.mjs nope` | exit 1 |

### 4.3 手动验证清单

- [x] `node bin/docsync.mjs help`
- [x] `node bin/docsync.mjs version`
- [x] `node bin/docsync.mjs unknown`

---

## 5. 外部依赖

| 依赖项 | 类型 | 提供方 | 状态 | 备注 |
|-------|------|-------|------|------|
| Node.js >=18 | 运行时 | 用户环境 | ✅ 就绪 | ESM CLI |
| npm >=9 | 包管理器 | 用户环境 | ✅ 就绪 | package/bin |

---

## 6. 代码规范

### 6.1 命名规范

- 类名：不使用类。
- 方法名：`main`、`parseArgs`、`printHelp`、`runVersion`。
- 变量名：camelCase。

### 6.2 代码风格

- 缩进：2 spaces。
- 注释：仅复杂分支添加简短说明。
- 异常处理：抛出带 `exitCode` 的 Error 或统一 CliError。

### 6.3 日志规范

- 日志级别：普通输出走 stdout，错误走 stderr。
- 日志格式：人类可读文本。
- 敏感信息处理：路由层不输出环境变量或凭据。

---

## 7. 交付物

### 7.1 代码文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `package.json` | npm manifest | TASK-CLI-06 |
| `bin/docsync.mjs` | CLI bin 入口 | TASK-CLI-06 |
| `src/cli.mjs` | 主分发 | TASK-CLI-04 |
| `src/utils/args.mjs` | 参数解析 | TASK-CLI-02 |
| `src/commands/help.mjs` | 帮助输出 | TASK-CLI-06 |
| `src/commands/version.mjs` | 版本输出 | TASK-CLI-06 |

### 7.2 测试文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `test/args.test.mjs` | 参数解析测试 | TASK-CLI-01 |
| `test/cli.test.mjs` | 路由测试 | TASK-CLI-03 |
| `test/bin.test.mjs` | bin 入口测试 | TASK-CLI-05 |

### 7.3 文档更新

- [x] 本 capability 不直接更新 README。
- [x] 本 capability 不直接更新接口文档。
- [x] 本 capability 不直接更新变更日志。

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
