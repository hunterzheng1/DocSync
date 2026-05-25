# 实施任务拆解 - ai-workflow-orchestration

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
| 技术契约 | `specs/ai-workflow-orchestration/spec.md` | 当前能力规格 |
| 技术方案 | `specs/ai-workflow-orchestration/design.md` | 当前能力设计 |

### 1.2 实现范围

实现 prompt 构建、`docsync ai` 交互工作流、`docsync auto` 实验工作流、Claude fallback、dry-run 和安全工具限制。

### 1.3 技术栈

- 语言：JavaScript ESM
- 框架：Node.js 内置 child_process
- 依赖：Claude Code CLI（可选）、prep 能力

---

## 2. 任务执行拓扑图

### 2.0 测试策略

**当前测试策略**：`tdd`

### 2.1 拓扑图

```
层级 1: TASK-AI-01, TASK-AI-03, TASK-AI-05
层级 2: TASK-AI-02(依赖 01), TASK-AI-04(依赖 03), TASK-AI-06(依赖 05)
层级 3: TASK-AI-07(依赖 02,04,06)
```

### 2.2 层级汇总

| 层级 | 任务列表 | 可并行 | 前置依赖 |
|-----|---------|-------|--------|
| 层级 1 | TASK-AI-01, TASK-AI-03, TASK-AI-05 | ✅ 是 | 无 |
| 层级 2 | TASK-AI-02, TASK-AI-04, TASK-AI-06 | ✅ 是 | 对应测试骨架 |
| 层级 3 | TASK-AI-07 | 否 | TASK-AI-02, TASK-AI-04, TASK-AI-06 |

---

## 3. 原子任务清单

### 3.0 任务类型说明

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| 接口层 | CLI 工作流 | ai/auto |
| 测试-骨架 | 测试先行 | TDD 前置 |
| 测试-验证 | 验证执行 | 收尾 |

---

### [TASK-AI-01] 编写 prompt 构建测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
创建 `test/prompt.test.mjs` 覆盖默认 prompt、docs 范围和 extra 追加。

#### 输入
- `specs/ai-workflow-orchestration/spec.md`

#### 输出
- `test/prompt.test.mjs`

#### 实现步骤
1. 断言默认 prompt 包含 README/AGENTS/CLAUDE 职责。
2. 断言 prompt 包含禁止编造和 TODO(review)。
3. 断言 docs/extra 参数影响输出。

#### 验收标准
- [x] 覆盖默认 prompt 硬规则。
- [x] 覆盖 `--docs` 和 `--extra`。

#### 关联设计
- spec.md 章节：AI prompt 构建
- design.md 章节：6.3

---

### [TASK-AI-02] 实现 prompt 构建模块

- **类型**: 接口层
- **依赖**: TASK-AI-01
- **状态**: [x] 已完成

#### 任务描述
实现 `src/utils/prompt.mjs`，构建安全、事实导向的文档同步 prompt。

#### 输入
- `test/prompt.test.mjs`

#### 输出
- `src/utils/prompt.mjs`

#### 实现步骤
1. 定义默认文档范围和硬规则数组。
2. 实现 docs 范围解析和未知值错误。
3. 将 extra 原样追加到 prompt 末尾。

#### 验收标准
- [x] 硬规则不可被 extra 覆盖。
- [x] prompt 长度超过上限时提示。

#### 关联设计
- spec.md 章节：AI prompt 构建
- design.md 章节：4.2、6.3、9.1

---

### [TASK-AI-03] 编写 ai 命令测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
创建 `test/ai.test.mjs` 覆盖 prep 前置、Claude 存在和缺失 fallback。

#### 输入
- `specs/ai-workflow-orchestration/spec.md`

#### 输出
- `test/ai.test.mjs`

#### 实现步骤
1. mock `runPrep` 成功/失败。
2. mock `hasCommand('claude')` true/false。
3. 断言 Claude 缺失时打印 prompt 且 exit 0。

#### 验收标准
- [x] prep 失败时不调用 Claude。
- [x] Claude 缺失时 fallback 打印 prompt。

#### 关联设计
- spec.md 章节：交互 AI 工作流
- design.md 章节：4.2、8.2

---

### [TASK-AI-04] 实现 ai 命令

- **类型**: 接口层
- **依赖**: TASK-AI-03, TASK-AI-02
- **状态**: [x] 已完成

#### 任务描述
实现 `src/commands/ai.mjs`，编排 prep、prompt 和 Claude 启动/fallback。

#### 输入
- `test/ai.test.mjs`
- `src/utils/prompt.mjs`
- `src/commands/prep.mjs`

#### 输出
- `src/commands/ai.mjs`

#### 实现步骤
1. 校验 docs/extra 参数。
2. 调用 `runPrep(options)`。
3. 构建 prompt。
4. Claude 可用时调用 `claude <prompt>`，缺失时打印 prompt。

#### 验收标准
- [x] prep 失败会中止。
- [x] Claude 缺失时 exit 0。

#### 关联设计
- spec.md 章节：交互 AI 工作流
- design.md 章节：6.1、8.2

---

### [TASK-AI-05] 编写 auto 命令测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
创建 `test/auto.test.mjs` 覆盖 dry-run、allowedTools 和危险命令限制。

#### 输入
- `specs/ai-workflow-orchestration/spec.md`

#### 输出
- `test/auto.test.mjs`

#### 实现步骤
1. 断言 `--dry-run` 不调用 Claude。
2. 断言 allowedTools 不包含 git commit、rm、curl、wget、npm publish。
3. 断言 auto 输出实验性提示。

#### 验收标准
- [x] dry-run 只打印命令计划。
- [x] 危险工具不在白名单中。

#### 关联设计
- spec.md 章节：自动 AI 工作流
- design.md 章节：8.1、9.2

---

### [TASK-AI-06] 实现 auto 命令并接入路由

- **类型**: 接口层
- **依赖**: TASK-AI-05, TASK-AI-02
- **状态**: [x] 已完成

#### 任务描述
实现 `src/commands/auto.mjs` 并在 CLI 路由中接入 `ai` 和 `auto`。

#### 输入
- `test/auto.test.mjs`
- `src/utils/prompt.mjs`

#### 输出
- `src/commands/auto.mjs`
- 更新后的 `src/cli.mjs`

#### 实现步骤
1. 构造 Claude print mode 参数。
2. 硬编码安全 allowedTools 白名单。
3. dry-run 打印命令，不执行。
4. 在 CLI 路由中接入 `ai` 和 `auto`。

#### 验收标准
- [x] auto 命令可 dry-run。
- [x] CLI 路由识别 ai/auto。

#### 关联设计
- spec.md 章节：自动 AI 工作流
- design.md 章节：4.2、6.1

---

### [TASK-AI-07] 验证 AI 工作流能力

- **类型**: 测试-验证
- **依赖**: TASK-AI-02, TASK-AI-04, TASK-AI-06
- **状态**: [x] 已完成

#### 任务描述
运行 prompt、ai、auto 测试和 dry-run 手动验证。

#### 输入
- `test/prompt.test.mjs`
- `test/ai.test.mjs`
- `test/auto.test.mjs`

#### 输出
- 测试结果

#### 实现步骤
1. 运行 AI 工作流相关测试。
2. 执行 `node bin/docsync.mjs auto --dry-run`。
3. 检查输出包含 allowedTools 和实验性提示。

#### 验收标准
- [x] 相关测试通过。
- [x] auto dry-run 不启动 Claude。

#### 关联设计
- spec.md 章节：全部需求项
- design.md 章节：8.1、8.2

---

## 4. 验证方式

### 4.1 单元测试要求

| 任务 ID | 测试类型 | 测试场景 | 断言内容 |
|--------|---------|---------|---------|
| TASK-AI-01 | 单元测试 | prompt 构建 | 硬规则、docs、extra |
| TASK-AI-03 | 单元测试 | ai 工作流 | prep、Claude fallback |
| TASK-AI-05 | 单元测试 | auto 工作流 | dry-run、allowedTools |

### 4.2 集成测试场景

| 场景 | 前置条件 | 操作步骤 | 预期结果 |
|-----|---------|---------|---------|
| auto dry-run | CLI 可执行 | `docsync auto --dry-run` | 打印 Claude print mode 命令 |
| claude 缺失 | mock 缺失 | `docsync ai` | 打印 prompt，exit 0 |

### 4.3 手动验证清单

- [x] `node bin/docsync.mjs auto --dry-run`
- [x] `node bin/docsync.mjs ai --docs readme,agents --extra "check commands"`

---

## 5. 外部依赖

| 依赖项 | 类型 | 提供方 | 状态 | 备注 |
|-------|------|-------|------|------|
| Claude Code CLI | 第三方命令 | 用户环境 | ⏳ 可选 | 缺失时 fallback |
| context-preparation | 其他能力 | 本变更 | ⏳ 等待 | ai/auto 前置 |

---

## 6. 代码规范

### 6.1 命名规范

- 类名：不使用类。
- 方法名：`buildDocSyncPrompt`、`runAi`、`runAuto`。
- 变量名：camelCase。

### 6.2 代码风格

- 缩进：2 spaces。
- 注释：安全白名单处保留简短注释。
- 异常处理：prep 失败直接透传。

### 6.3 日志规范

- 日志级别：fallback prompt 走 stdout，错误走 stderr。
- 日志格式：auto 明确显示实验性和 dry-run。
- 敏感信息处理：prompt 不包含 token 或密钥。

---

## 7. 交付物

### 7.1 代码文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `src/utils/prompt.mjs` | prompt 构建 | TASK-AI-02 |
| `src/commands/ai.mjs` | ai 命令 | TASK-AI-04 |
| `src/commands/auto.mjs` | auto 命令 | TASK-AI-06 |
| `src/cli.mjs` | 路由接入 | TASK-AI-06 |

### 7.2 测试文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `test/prompt.test.mjs` | prompt 测试 | TASK-AI-01 |
| `test/ai.test.mjs` | ai 工作流测试 | TASK-AI-03 |
| `test/auto.test.mjs` | auto 工作流测试 | TASK-AI-05 |

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
