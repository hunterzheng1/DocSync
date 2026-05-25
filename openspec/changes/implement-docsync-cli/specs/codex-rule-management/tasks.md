# 实施任务拆解 - codex-rule-management

> **定位**：单一 Capability 的 AI 编码引擎执行单元
>
> **边界声明**：本任务清单仅服务于 `codex-rule-management`，只覆盖 Codex 全局 AGENTS 规则片段的安装、更新和路径查询。
>
> **质量红线**：任务必须保护 marker block 外用户内容，且测试先行覆盖 marker 追加、替换、拒绝和 dry-run 行为。

---

## 1. 任务总览

### 1.1 关联文档

| 文档 | 路径 | 说明 |
|-----|------|------|
| 全局契约 | `openspec/specs/overview.md` | 全局约束基线 |
| 业务意图 | `openspec/changes/implement-docsync-cli/proposal.md` | 变更背景与测试策略 |
| 技术契约 | `openspec/changes/implement-docsync-cli/specs/codex-rule-management/spec.md` | 当前能力规格 |
| 技术方案 | `openspec/changes/implement-docsync-cli/specs/codex-rule-management/design.md` | 当前能力设计 |

### 1.2 实现范围

- 新增 `docsync codex install/update/path` 子命令。
- 管理目标文件 `~/.codex/AGENTS.md`。
- 使用 `<!-- docsync:start -->` 与 `<!-- docsync:end -->` marker block 管理 DocSync 规则片段。
- 目标缺失时创建文件，目标存在无 marker 时追加 block，已有一对 marker 时替换 block 内容。
- 多对 marker 时拒绝自动修改，避免破坏用户内容。
- 支持 `--backup`、`--dry-run`、`--verbose`。

### 1.3 技术栈

- 语言：Node.js ESM
- 测试：Node.js 内置 `node:test`
- 依赖：本地文件系统、path/os 工具、无 Codex API 调用

---

## 2. 任务执行拓扑图

### 2.0 测试策略

**当前测试策略**：`tdd`

marker 算法与 CLI 行为均先建立测试，再实现。

### 2.1 拓扑图

```text
层级 1:
  TASK-CODEX-01  marker upsert 测试骨架
  TASK-CODEX-03  Codex 模板测试骨架
  TASK-CODEX-05  codex 命令测试骨架

层级 2:
  TASK-CODEX-02  实现 upsertMarkedBlock
    depends on: TASK-CODEX-01
  TASK-CODEX-04  创建 Codex 规则模板
    depends on: TASK-CODEX-03

层级 3:
  TASK-CODEX-06  实现 codex 子命令并接入 CLI
    depends on: TASK-CODEX-02, TASK-CODEX-04, TASK-CODEX-05

层级 4:
  TASK-CODEX-07  验证 Codex 规则管理能力
    depends on: TASK-CODEX-02, TASK-CODEX-04, TASK-CODEX-06
```

### 2.2 层级汇总

| 层级 | 任务列表 | 可并行 | 前置依赖 |
|-----|---------|-------|--------|
| 层级 1 | TASK-CODEX-01, TASK-CODEX-03, TASK-CODEX-05 | 是 | 无 |
| 层级 2 | TASK-CODEX-02, TASK-CODEX-04 | 是 | 层级 1 |
| 层级 3 | TASK-CODEX-06 | 否 | TASK-CODEX-02, TASK-CODEX-04, TASK-CODEX-05 |
| 层级 4 | TASK-CODEX-07 | 否 | TASK-CODEX-02, TASK-CODEX-04, TASK-CODEX-06 |

---

## 3. 原子任务清单

### 3.0 任务类型说明

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| 测试-骨架 | 先建立失败测试与 fixture 结构 | TDD 前置任务 |
| 数据层 | marker block 字符串处理与文件写入 | `upsertMarkedBlock` |
| 接口层 | CLI 子命令分发与输出 | `docsync codex` |
| 配置 | 规则模板与 marker 常量 | AGENTS 片段模板 |
| 测试-验证 | 实现后运行并补齐断言 | 验收任务 |

---

### [TASK-CODEX-01] 编写 marker upsert 测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
为 `upsertMarkedBlock` 建立单元测试，确保 marker 外用户内容逐字保留。

#### 输入
- `spec.md` 中用户内容保护和 marker 约束
- `design.md` 中关键算法与状态机

#### 输出
- `test/fsMarkedBlock.test.mjs` 或合并到 `test/fs.test.mjs`

#### 实现步骤
1. 创建 marker 常量 fixture。
2. 添加空文本生成完整 block 的测试。
3. 添加无 marker 时追加 block 的测试。
4. 添加一对 marker 时替换 block 内容的测试。
5. 添加多对 marker 时拒绝处理的测试。
6. 添加 marker 前后用户内容逐字保留的测试。

#### 验收标准
- [ ] 测试覆盖 missing、no marker、one marker、multi marker。
- [ ] 保留内容断言使用严格字符串比较。
- [ ] 多 marker 场景期望抛错或返回保护性错误。

#### 关联设计
- spec.md 章节：1 新增需求、3.1 性能约束
- design.md 章节：6.2 状态机、6.3 关键算法

---

### [TASK-CODEX-02] 实现 upsertMarkedBlock

- **类型**: 数据层
- **依赖**: TASK-CODEX-01
- **状态**: [ ] 未完成

#### 任务描述
实现 marker block 插入、替换和多 marker 拒绝逻辑。

#### 输入
- `test/fsMarkedBlock.test.mjs`
- marker 常量 `<!-- docsync:start -->`、`<!-- docsync:end -->`

#### 输出
- `src/utils/fs.mjs` 中 `upsertMarkedBlock()`

#### 实现步骤
1. 统计 start/end marker 出现次数。
2. 对 0 对 marker 执行追加，并在非空原文后补换行。
3. 对 1 对 marker 执行仅 block 内替换。
4. 对多对 marker 或 marker 不匹配执行保护性拒绝。
5. 返回新内容和状态 `created|inserted|updated`。

#### 验收标准
- [ ] marker 外内容逐字保留。
- [ ] 非空文件追加 block 前有清晰换行边界。
- [ ] 多 marker 不自动修复。
- [ ] 返回状态可供 CLI 输出使用。

#### 关联设计
- spec.md 章节：1 用户内容保护、2.1 错误码定义
- design.md 章节：2.2 需新建文件、6.3 关键算法、8.1 异常分类

---

### [TASK-CODEX-03] 编写 Codex 规则模板测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
创建模板测试，约束 `templates/codex/AGENTS.docsync.md` 可安全嵌入 marker block。

#### 输入
- `spec.md` 中 Codex 全局规则安装要求
- `design.md` 中模板路径与 marker 配置

#### 输出
- `test/codexTemplate.test.mjs`

#### 实现步骤
1. 断言模板文件存在。
2. 断言模板包含 DocSync 使用规则。
3. 断言模板不包含外层 start/end marker，避免重复嵌套。
4. 断言模板不包含 token、私钥或用户本机路径。

#### 验收标准
- [ ] 模板缺失时测试失败。
- [ ] 模板内容可作为 marker block 内部文本。
- [ ] 敏感信息关键词被覆盖。

#### 关联设计
- spec.md 章节：1 新增需求、5.2 数据安全
- design.md 章节：2.2 需新建文件、9.1 业务配置

---

### [TASK-CODEX-04] 创建 Codex 规则模板

- **类型**: 配置
- **依赖**: TASK-CODEX-03
- **状态**: [ ] 未完成

#### 任务描述
新增 DocSync Codex 规则模板，供 install/update 包装成 marker block 写入 AGENTS.md。

#### 输入
- `test/codexTemplate.test.mjs`
- `templates/codex/AGENTS.docsync.md` 目标路径

#### 输出
- `templates/codex/AGENTS.docsync.md`

#### 实现步骤
1. 创建 `templates/codex` 目录。
2. 编写面向 Codex 的 DocSync 使用规则。
3. 避免在模板中包含外层 marker。
4. 避免写入敏感信息或本机路径。

#### 验收标准
- [ ] 模板测试通过。
- [ ] 模板可被 `upsertMarkedBlock` 包装。
- [ ] 模板不读取或泄露用户 AGENTS 内容。

#### 关联设计
- spec.md 章节：1 Codex 全局规则安装
- design.md 章节：2.2 需新建文件、7.3 中间件与基础设施

---

### [TASK-CODEX-05] 编写 codex 命令测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [ ] 未完成

#### 任务描述
创建 `docsync codex` CLI 测试，覆盖 install、update、path、dry-run、backup 与参数错误。

#### 输入
- `spec.md` 中请求参数和响应结构
- `design.md` 中 `runCodex(rest, options)` 业务逻辑

#### 输出
- `test/codexCli.test.mjs`

#### 实现步骤
1. 使用临时 HOME 模拟 `~/.codex/AGENTS.md`。
2. 添加目标缺失时 install 创建文件测试。
3. 添加目标存在无 marker 时 install 追加测试。
4. 添加目标已有 marker 时 update 替换测试。
5. 添加 path 只输出目标路径测试。
6. 添加 dry-run 不写文件测试。
7. 添加 unknown subcommand 参数错误测试。

#### 验收标准
- [ ] 所有文件写入均发生在临时 HOME。
- [ ] dry-run 不修改目标文件。
- [ ] backup 场景期望生成备份文件。
- [ ] 成功输出包含 target、status、preservedUserContent。

#### 关联设计
- spec.md 章节：2.1 请求参数、2.1 响应结构
- design.md 章节：4.1 接口清单、4.2 接口详细设计

---

### [TASK-CODEX-06] 实现 codex 子命令并接入 CLI

- **类型**: 接口层
- **依赖**: TASK-CODEX-02, TASK-CODEX-04, TASK-CODEX-05
- **状态**: [ ] 未完成

#### 任务描述
实现 `docsync codex <install|update|path>`，并将 marker upsert、模板读取和目标路径解析串联。

#### 输入
- `src/utils/fs.mjs` 中 `upsertMarkedBlock()`
- `templates/codex/AGENTS.docsync.md`
- CLI 主分发入口

#### 输出
- `src/commands/codex.mjs`
- CLI 主入口中的 `codex` 路由接入

#### 实现步骤
1. 解析并校验 codex 子命令。
2. 解析目标路径 `~/.codex/AGENTS.md`。
3. `path` 模式只输出路径。
4. `install/update` 读取模板并构造 marker block。
5. 调用 `upsertMarkedBlock` 生成新内容。
6. 处理 `--dry-run`、`--backup`、`--verbose`。
7. 统一输出状态与错误码。

#### 验收标准
- [ ] 目标缺失时创建 AGENTS.md。
- [ ] 目标存在无 marker 时保留原文并追加 block。
- [ ] 已有一对 marker 时只替换 block 内容。
- [ ] 多 marker 时拒绝并提示人工清理。
- [ ] `docsync codex path` 只输出解析路径。
- [ ] `--dry-run` 不写文件。

#### 关联设计
- spec.md 章节：1 新增需求、2.1 错误码定义
- design.md 章节：4.2 业务逻辑、6.1 核心流程、8.1 异常分类

---

### [TASK-CODEX-07] 验证 Codex 规则管理能力

- **类型**: 测试-验证
- **依赖**: TASK-CODEX-02, TASK-CODEX-04, TASK-CODEX-06
- **状态**: [ ] 未完成

#### 任务描述
运行并补齐 Codex 相关测试，确认 marker 管理不会破坏用户内容。

#### 输入
- `test/fsMarkedBlock.test.mjs`
- `test/codexTemplate.test.mjs`
- `test/codexCli.test.mjs`

#### 输出
- 通过的测试结果
- 必要时补齐的断言

#### 实现步骤
1. 运行 marker、模板和 CLI 测试。
2. 补齐用户内容保护断言。
3. 手动检查测试不读写真实 `~/.codex/AGENTS.md`。
4. 记录验证命令和结果。

#### 验收标准
- [ ] marker 算法测试通过。
- [ ] 模板测试通过。
- [ ] codex CLI 测试通过。
- [ ] 无真实 home 目录污染。

#### 关联设计
- spec.md 章节：全部新增需求
- design.md 章节：6 核心流程、8 异常处理、9 配置

---

## 4. 验证方式

### 4.1 单元测试要求

| 任务 ID | 测试类型 | 测试场景 | 断言内容 |
|--------|---------|---------|---------|
| TASK-CODEX-01 | marker 算法 | create/append/replace/reject | marker 外内容逐字保留 |
| TASK-CODEX-03 | 模板测试 | 模板可嵌入 | 无外层 marker、无敏感信息 |
| TASK-CODEX-05 | CLI 测试 | codex 子命令 | install/update/path/dry-run/backup |
| TASK-CODEX-07 | 回归验证 | 全部 Codex 测试 | 全部通过且不污染真实 home |

### 4.2 集成测试场景

| 场景 | 前置条件 | 操作步骤 | 预期结果 |
|-----|---------|---------|---------|
| 创建 AGENTS | 临时 HOME 无 `AGENTS.md` | 执行 `docsync codex install` | 创建文件并写入完整 marker block |
| 追加 block | 文件存在但无 marker | 执行 `docsync codex install` | 原内容保留并追加 block |
| 更新 block | 文件已有一对 marker | 执行 `docsync codex update` | 只替换 marker 内文本 |
| 拒绝多 marker | 文件有多对 marker | 执行 `docsync codex update` | 返回错误并不写文件 |

### 4.3 手动验证清单

- [ ] 确认 marker 常量完全匹配 spec。
- [ ] 确认命令不输出 AGENTS.md 原文。
- [ ] 确认 dry-run 输出动作计划但不写文件。

---

## 5. 外部依赖

| 依赖项 | 类型 | 提供方 | 状态 | 备注 |
|-------|------|-------|------|------|
| Node.js >=18 | 运行时 | 用户环境 | 就绪 | 使用 ESM 和 node:test |
| Codex | 外部工具 | 用户环境 | 可选 | 本能力只写 AGENTS.md，不调用 API |
| 本地文件系统 | 系统能力 | OS | 就绪 | 需要 home 下 `.codex` 写权限 |

---

## 6. 代码规范

### 6.1 命名规范

- 文件名：`codex.mjs`、`fs.mjs`、`paths.mjs`
- 方法名：`runCodex`、`upsertMarkedBlock`、`resolveCodexAgentsPath`
- 常量名：`CODEX_BLOCK_START`、`CODEX_BLOCK_END`

### 6.2 代码风格

- 缩进：2 spaces
- 注释：仅在 marker 计数和拒绝多 marker 处说明保护意图
- 异常处理：参数错误 exit 2，文件系统和保护性拒绝 exit 1

### 6.3 日志规范

- 日志级别：成功输出走 stdout，错误走 stderr
- 日志格式：包含 target、status、preservedUserContent
- 敏感信息处理：不输出用户 AGENTS 原文

---

## 7. 交付物

### 7.1 代码文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `src/utils/fs.mjs` | marker block upsert、安全写入、备份 | TASK-CODEX-02 |
| `templates/codex/AGENTS.docsync.md` | Codex 规则模板 | TASK-CODEX-04 |
| `src/commands/codex.mjs` | codex 子命令入口 | TASK-CODEX-06 |
| `src/utils/paths.mjs` | Codex 目标路径解析 | TASK-CODEX-06 |

### 7.2 测试文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `test/fsMarkedBlock.test.mjs` | marker upsert 单元测试 | TASK-CODEX-01 |
| `test/codexTemplate.test.mjs` | Codex 模板测试 | TASK-CODEX-03 |
| `test/codexCli.test.mjs` | codex CLI 测试 | TASK-CODEX-05 |

### 7.3 文档更新

- [ ] README 中补充 `docsync codex` 用法。
- [ ] AGENTS 中补充 marker block 保护约束。
- [ ] CHANGELOG 中记录 Codex 规则管理能力。

---

> **质量红线检查清单**
> - [x] 每个任务粒度符合可独立实现标准
> - [x] 任务清单 100% 覆盖 spec.md 定义
> - [x] 任务清单 100% 覆盖 design.md 定义
> - [x] 每个任务都有明确验收标准
> - [x] 每个实现任务都有对应测试要求
> - [x] 依赖拓扑已明确
> - [x] 任务执行拓扑图已绘制
> - [x] 无循环依赖
