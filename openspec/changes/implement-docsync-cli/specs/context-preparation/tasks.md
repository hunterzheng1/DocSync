# 实施任务拆解 - context-preparation

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
| 技术契约 | `specs/context-preparation/spec.md` | 当前能力规格 |
| 技术方案 | `specs/context-preparation/design.md` | 当前能力设计 |

### 1.2 实现范围

实现 `docsync prep` 的 init/git/repomix/markdownlint 串行编排、dry-run、外部命令检测和状态输出。

### 1.3 技术栈

- 语言：JavaScript ESM
- 框架：Node.js 内置 child_process
- 依赖：git/repomix/markdownlint-cli2 外部命令

---

## 2. 任务执行拓扑图

### 2.0 测试策略

**当前测试策略**：`tdd`

### 2.1 拓扑图

```
层级 1: TASK-PREP-01, TASK-PREP-03, TASK-PREP-05
层级 2: TASK-PREP-02(依赖 01), TASK-PREP-04(依赖 03), TASK-PREP-06(依赖 05)
层级 3: TASK-PREP-07(依赖 02,04,06)
```

### 2.2 层级汇总

| 层级 | 任务列表 | 可并行 | 前置依赖 |
|-----|---------|-------|--------|
| 层级 1 | TASK-PREP-01, TASK-PREP-03, TASK-PREP-05 | ✅ 是 | 无 |
| 层级 2 | TASK-PREP-02, TASK-PREP-04, TASK-PREP-06 | ✅ 是 | 对应测试骨架 |
| 层级 3 | TASK-PREP-07 | 否 | TASK-PREP-02, TASK-PREP-04, TASK-PREP-06 |

---

## 3. 原子任务清单

### 3.0 任务类型说明

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| 接口层 | 命令编排 | prep 流程 |
| 配置 | 工具辅助 | shell/git/logger |
| 测试-骨架 | 测试先行 | TDD 前置 |
| 测试-验证 | 验证执行 | 收尾 |

---

### [TASK-PREP-01] 编写 shell/git 工具测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
创建外部命令检测、执行和 git 状态辅助的测试骨架。

#### 输入
- `specs/context-preparation/spec.md`

#### 输出
- `test/shell.test.mjs`
- `test/git.test.mjs`

#### 实现步骤
1. 为 `hasCommand` 添加存在/缺失测试。
2. 为 `run/capture` 添加成功和失败测试骨架。
3. 为 git 仓库检测添加非 git 目录测试。

#### 验收标准
- [ ] 覆盖命令缺失不抛出进程崩溃。
- [ ] 覆盖非 git 仓库降级。

#### 关联设计
- spec.md 章节：Repomix 上下文生成、git 状态输出
- design.md 章节：2.2、7.3、8.1

---

### [TASK-PREP-02] 实现 shell/git/logger 工具

- **类型**: 配置
- **依赖**: TASK-PREP-01
- **状态**: [ ] 未完成

#### 任务描述
实现命令检测执行、git 状态辅助和步骤日志输出。

#### 输入
- `test/shell.test.mjs`
- `test/git.test.mjs`

#### 输出
- `src/utils/shell.mjs`
- `src/utils/git.mjs`
- `src/utils/logger.mjs`

#### 实现步骤
1. 实现 `hasCommand/run/capture`。
2. 实现 `isGitRepo/getStatusShort`。
3. 实现步骤状态输出辅助。

#### 验收标准
- [ ] `hasCommand` 对缺失命令返回 false。
- [ ] 非 git 仓库返回 skipped 状态。

#### 关联设计
- spec.md 章节：git 状态输出、Markdown 格式修复
- design.md 章节：6.3、7.4

---

### [TASK-PREP-03] 编写 prep 编排测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
创建 `test/prep.test.mjs`，覆盖默认流程、`--no-init`、`--compress` 和 `--dry-run`。

#### 输入
- `specs/context-preparation/spec.md`

#### 输出
- `test/prep.test.mjs`

#### 实现步骤
1. 设计可注入 shell runner 的测试结构。
2. 添加默认流程顺序断言。
3. 添加 no-init/compress/dry-run 断言。

#### 验收标准
- [ ] 默认流程顺序为 init → git → repomix → lint。
- [ ] compress 触发 `repomix --compress`。

#### 关联设计
- spec.md 章节：prep 工作流编排
- design.md 章节：4.2、6.1

---

### [TASK-PREP-04] 实现 prep 命令编排

- **类型**: 接口层
- **依赖**: TASK-PREP-03, TASK-PREP-02
- **状态**: [ ] 未完成

#### 任务描述
实现 `src/commands/prep.mjs` 的流程编排和状态汇总。

#### 输入
- `test/prep.test.mjs`
- `src/commands/init.mjs`
- `src/utils/shell.mjs`
- `src/utils/git.mjs`

#### 输出
- `src/commands/prep.mjs`

#### 实现步骤
1. 解析 cwd 和 prep options。
2. 按 noInit 决定是否调用 init。
3. 检测 git 并输出 status。
4. 检测并运行 Repomix。
5. 按 noLint 检测并运行 markdownlint。

#### 验收标准
- [ ] Repomix 缺失时 exit 1 并提示安装。
- [ ] markdownlint 缺失时不失败。
- [ ] dry-run 不执行写入命令。

#### 关联设计
- spec.md 章节：全部需求项
- design.md 章节：4.2、6.1、8.1

---

### [TASK-PREP-05] 编写 prep CLI 集成测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
创建通过 bin 调用 `docsync prep` 的集成式测试骨架。

#### 输入
- `specs/context-preparation/design.md`

#### 输出
- `test/prepCli.test.mjs`

#### 实现步骤
1. 准备临时项目目录。
2. 通过环境或 runner mock 模拟 repomix/markdownlint。
3. 添加缺失 repomix 失败用例。

#### 验收标准
- [ ] CLI 层能接收 no-init/no-lint/compress。
- [ ] 缺失 repomix 的错误信息可断言。

#### 关联设计
- spec.md 章节：接口定义、错误码定义
- design.md 章节：8.1

---

### [TASK-PREP-06] 接入 prep 到 CLI 路由

- **类型**: 接口层
- **依赖**: TASK-PREP-05, TASK-PREP-04
- **状态**: [ ] 未完成

#### 任务描述
将 `runPrep` 接入 `src/cli.mjs` 的 `prep` 命令，并确认参数透传。

#### 输入
- `src/commands/prep.mjs`
- `src/cli.mjs`
- `test/prepCli.test.mjs`

#### 输出
- 更新后的 `src/cli.mjs`

#### 实现步骤
1. 导入 `runPrep`。
2. 在 command map/switch 中加入 `prep`。
3. 保证 compress/no-lint/no-init/dry-run 选项传递。

#### 验收标准
- [ ] `docsync prep --compress` 调用 prep handler。
- [ ] `docsync prep --no-init --no-lint` 选项可传入。

#### 关联设计
- spec.md 章节：prep 工作流编排
- design.md 章节：4.2

---

### [TASK-PREP-07] 验证上下文准备能力

- **类型**: 测试-验证
- **依赖**: TASK-PREP-02, TASK-PREP-04, TASK-PREP-06
- **状态**: [ ] 未完成

#### 任务描述
运行 prep 相关测试和 dry-run 手动验证。

#### 输入
- prep 相关测试文件

#### 输出
- 测试结果

#### 实现步骤
1. 运行 prep/shell/git 测试。
2. 执行 `node bin/docsync.mjs prep --dry-run`。
3. 检查输出包含 init/git/repomix/lint 计划。

#### 验收标准
- [ ] 所有 prep 相关测试通过。
- [ ] dry-run 不生成 `repomix-output.xml`。

#### 关联设计
- spec.md 章节：全部需求项
- design.md 章节：9.2

---

## 4. 验证方式

### 4.1 单元测试要求

| 任务 ID | 测试类型 | 测试场景 | 断言内容 |
|--------|---------|---------|---------|
| TASK-PREP-01 | 单元测试 | shell/git 工具 | 命令检测、非 git 降级 |
| TASK-PREP-03 | 单元测试 | prep 编排 | 执行顺序和参数 |
| TASK-PREP-05 | 集成测试 | CLI prep | dry-run 和错误信息 |

### 4.2 集成测试场景

| 场景 | 前置条件 | 操作步骤 | 预期结果 |
|-----|---------|---------|---------|
| dry-run | CLI 可执行 | `docsync prep --dry-run` | 打印计划、不写入 |
| repomix 缺失 | mock 命令缺失 | `docsync prep` | exit 1 + 安装提示 |

### 4.3 手动验证清单

- [ ] `node bin/docsync.mjs prep --dry-run`
- [ ] `node bin/docsync.mjs prep --compress --dry-run`
- [ ] `node bin/docsync.mjs prep --no-init --no-lint --dry-run`

---

## 5. 外部依赖

| 依赖项 | 类型 | 提供方 | 状态 | 备注 |
|-------|------|-------|------|------|
| Repomix | 第三方命令 | 用户环境 | ⏳ 等待 | prep 必需 |
| markdownlint-cli2 | 第三方命令 | 用户环境 | ⏳ 可选 | 缺失不失败 |
| git | 第三方命令 | 用户环境 | ⏳ 可选 | 缺失不失败 |

---

## 6. 代码规范

### 6.1 命名规范

- 类名：不使用类。
- 方法名：`runPrep`、`hasCommand`、`capture`、`isGitRepo`。
- 变量名：camelCase。

### 6.2 代码风格

- 缩进：2 spaces。
- 注释：只在 dry-run 和降级分支补充说明。
- 异常处理：必需工具缺失抛出明确错误。

### 6.3 日志规范

- 日志级别：步骤状态走 stdout，失败走 stderr。
- 日志格式：每步显示 completed/skipped/missing。
- 敏感信息处理：不输出 env/token 内容。

---

## 7. 交付物

### 7.1 代码文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `src/utils/shell.mjs` | 外部命令工具 | TASK-PREP-02 |
| `src/utils/git.mjs` | git 状态辅助 | TASK-PREP-02 |
| `src/utils/logger.mjs` | 状态输出 | TASK-PREP-02 |
| `src/commands/prep.mjs` | prep 命令 | TASK-PREP-04 |
| `src/cli.mjs` | 路由接入 | TASK-PREP-06 |

### 7.2 测试文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `test/shell.test.mjs` | shell 工具测试 | TASK-PREP-01 |
| `test/git.test.mjs` | git 工具测试 | TASK-PREP-01 |
| `test/prep.test.mjs` | prep 编排测试 | TASK-PREP-03 |
| `test/prepCli.test.mjs` | prep CLI 测试 | TASK-PREP-05 |

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
