# 实施任务拆解 - project-initialization

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
| 技术契约 | `specs/project-initialization/spec.md` | 当前能力规格 |
| 技术方案 | `specs/project-initialization/design.md` | 当前能力设计 |

### 1.2 实现范围

实现 `docsync init`、模板文件、路径工具、文件安全写入、默认不覆盖、force/backup、dry-run 和初始化测试。

### 1.3 技术栈

- 语言：JavaScript ESM
- 框架：Node.js 内置 fs/path
- 依赖：无第三方运行时依赖

---

## 2. 任务执行拓扑图

### 2.0 测试策略

**当前测试策略**：`tdd`

### 2.1 拓扑图

```
层级 1: TASK-INIT-01, TASK-INIT-03, TASK-INIT-05
层级 2: TASK-INIT-02(依赖 01), TASK-INIT-04(依赖 03), TASK-INIT-06(依赖 05)
层级 3: TASK-INIT-07(依赖 02,04,06)
```

### 2.2 层级汇总

| 层级 | 任务列表 | 可并行 | 前置依赖 |
|-----|---------|-------|--------|
| 层级 1 | TASK-INIT-01, TASK-INIT-03, TASK-INIT-05 | ✅ 是 | 无 |
| 层级 2 | TASK-INIT-02, TASK-INIT-04, TASK-INIT-06 | ✅ 是 | 对应测试骨架 |
| 层级 3 | TASK-INIT-07 | 否 | TASK-INIT-02, TASK-INIT-04, TASK-INIT-06 |

---

## 3. 原子任务清单

### 3.0 任务类型说明

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| 配置 | 模板文件 | 初始化资源 |
| 接口层 | init 命令 | CLI 行为 |
| 测试-骨架 | 测试先行 | TDD 前置 |
| 测试-验证 | 验证执行 | 收尾 |

---

### [TASK-INIT-01] 编写 fs 安全写入测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
创建 `test/fs.test.mjs` 覆盖缺失写入、默认跳过、force 覆盖、backup 和 dry-run。

#### 输入
- `specs/project-initialization/spec.md`

#### 输出
- `test/fs.test.mjs`

#### 实现步骤
1. 创建临时目录测试辅助。
2. 添加 `writeIfMissing` 创建/跳过用例。
3. 添加 force/backup/dry-run 用例骨架。

#### 验收标准
- [x] 测试文件包含 4 类写入策略场景。
- [x] 每个测试使用独立临时目录。

#### 关联设计
- spec.md 章节：默认不覆盖、显式覆盖与备份、dry-run 初始化
- design.md 章节：6.2、6.3、8.1

---

### [TASK-INIT-02] 实现 fs 工具函数

- **类型**: 接口层
- **依赖**: TASK-INIT-01
- **状态**: [x] 已完成

#### 任务描述
实现 `src/utils/fs.mjs` 的存在检测、目录创建、读取、写入、备份和 `writeIfMissing`。

#### 输入
- `test/fs.test.mjs`

#### 输出
- `src/utils/fs.mjs`

#### 实现步骤
1. 实现 `exists/ensureDir/readText/writeText`。
2. 实现 `.bak.<timestamp>` 备份。
3. 实现 `writeIfMissing` 返回 action result。

#### 验收标准
- [x] 默认不覆盖已有文件。
- [x] force + backup 先备份再覆盖。
- [x] dry-run 不写入文件。

#### 关联设计
- spec.md 章节：默认不覆盖、显式覆盖与备份
- design.md 章节：2.2、6.3

---

### [TASK-INIT-03] 编写模板资产测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
为 4 个项目模板文件创建存在性和关键内容测试。

#### 输入
- `specs/project-initialization/design.md`

#### 输出
- `test/templates.test.mjs`

#### 实现步骤
1. 断言 `templates/project/repomix.config.json` 存在。
2. 断言 `.repomixignore` 包含 `.env` 和 key 文件模式。
3. 断言 doc-sync-rules 包含 README/AGENTS/CLAUDE 职责。

#### 验收标准
- [x] 覆盖全部 4 个模板路径。
- [x] 覆盖敏感文件排除规则。

#### 关联设计
- spec.md 章节：项目模板初始化
- design.md 章节：2.2、7.3

---

### [TASK-INIT-04] 创建项目模板文件

- **类型**: 配置
- **依赖**: TASK-INIT-03
- **状态**: [x] 已完成

#### 任务描述
创建 Repomix、repomixignore、markdownlint-cli2 和 doc-sync-rules 模板。

#### 输入
- `test/templates.test.mjs`

#### 输出
- `templates/project/repomix.config.json`
- `templates/project/.repomixignore`
- `templates/project/.markdownlint-cli2.jsonc`
- `templates/project/docs/doc-sync-rules.md`

#### 实现步骤
1. 创建模板目录树。
2. 写入 Repomix XML 输出配置。
3. 写入敏感文件 ignore 和文档同步规则。

#### 验收标准
- [x] 4 个模板文件存在。
- [x] ignore 模板排除 env/key/repomix-output。

#### 关联设计
- spec.md 章节：项目模板初始化
- design.md 章节：2.2、5.3

---

### [TASK-INIT-05] 编写 init 命令测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
创建 `test/init.test.mjs` 覆盖空目录、重复执行、部分缺失、force 和 dry-run。

#### 输入
- `specs/project-initialization/spec.md`

#### 输出
- `test/init.test.mjs`

#### 实现步骤
1. 准备临时项目目录。
2. 添加空目录初始化用例。
3. 添加重复初始化不覆盖用例。
4. 添加 dry-run 文件数量不变用例。

#### 验收标准
- [x] 覆盖创建 4 个目标文件。
- [x] 覆盖重复执行跳过。

#### 关联设计
- spec.md 章节：全部需求项
- design.md 章节：4.2、6.1

---

### [TASK-INIT-06] 实现 init 命令

- **类型**: 接口层
- **依赖**: TASK-INIT-05, TASK-INIT-02, TASK-INIT-04
- **状态**: [x] 已完成

#### 任务描述
实现 `src/commands/init.mjs` 的模板映射、动作规划、写入和摘要输出。

#### 输入
- `test/init.test.mjs`
- `src/utils/fs.mjs`
- `templates/project/**`

#### 输出
- `src/commands/init.mjs`
- `src/utils/paths.mjs` 中必要路径函数

#### 实现步骤
1. 定义 4 个模板到目标路径映射。
2. 解析 cwd 和模板根目录。
3. 调用 `writeIfMissing` 并汇总结果。
4. 输出 created/skipped/overwritten/backups。

#### 验收标准
- [x] `docsync init` 在空目录创建 4 个文件。
- [x] `--force --backup` 产生备份记录。
- [x] `--dry-run` 不写入。

#### 关联设计
- spec.md 章节：全部需求项
- design.md 章节：4.2、6.1、6.2

---

### [TASK-INIT-07] 验证初始化能力

- **类型**: 测试-验证
- **依赖**: TASK-INIT-02, TASK-INIT-04, TASK-INIT-06
- **状态**: [x] 已完成

#### 任务描述
运行初始化相关测试和一次临时目录手动验证。

#### 输入
- `test/fs.test.mjs`
- `test/templates.test.mjs`
- `test/init.test.mjs`

#### 输出
- 测试结果
- 手动验证记录

#### 实现步骤
1. 运行相关测试。
2. 在临时目录执行 `node bin/docsync.mjs init --cwd <tmp>`。
3. 检查 4 个目标文件存在。

#### 验收标准
- [x] 初始化相关测试通过。
- [x] 手动验证 4 个目标文件存在。

#### 关联设计
- spec.md 章节：全部需求项
- design.md 章节：8.1、9.2

---

## 4. 验证方式

### 4.1 单元测试要求

| 任务 ID | 测试类型 | 测试场景 | 断言内容 |
|--------|---------|---------|---------|
| TASK-INIT-01 | 单元测试 | 安全写入 | 创建/跳过/覆盖/备份/dry-run |
| TASK-INIT-03 | 单元测试 | 模板资产 | 文件存在和关键规则 |
| TASK-INIT-05 | 单元测试 | init 行为 | 创建/跳过/force/dry-run |

### 4.2 集成测试场景

| 场景 | 前置条件 | 操作步骤 | 预期结果 |
|-----|---------|---------|---------|
| 空目录初始化 | CLI 可执行 | `docsync init --cwd <tmp>` | 创建 4 个文件 |
| dry-run | 临时空目录 | `docsync init --dry-run --cwd <tmp>` | 不创建文件 |

### 4.3 手动验证清单

- [ ] `node bin/docsync.mjs init --cwd <tmp>`
- [ ] 重复执行不覆盖已有文件
- [ ] `node bin/docsync.mjs init --force --backup --cwd <tmp>`

---

## 5. 外部依赖

| 依赖项 | 类型 | 提供方 | 状态 | 备注 |
|-------|------|-------|------|------|
| Node.js >=18 | 运行时 | 用户环境 | ✅ 就绪 | fs/path |
| git | 第三方命令 | 用户环境 | ⏳ 可选 | 缺失不阻塞 init |

---

## 6. 代码规范

### 6.1 命名规范

- 类名：不使用类。
- 方法名：`runInit`、`writeIfMissing`、`backupFile`。
- 变量名：camelCase。

### 6.2 代码风格

- 缩进：2 spaces。
- 注释：仅在备份和 dry-run 分支添加说明。
- 异常处理：文件系统错误携带目标路径。

### 6.3 日志规范

- 日志级别：摘要走 stdout，错误走 stderr。
- 日志格式：created/skipped/overwritten/backups 分组。
- 敏感信息处理：不读取 env/key 文件内容。

---

## 7. 交付物

### 7.1 代码文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `src/utils/fs.mjs` | 文件安全写入 | TASK-INIT-02 |
| `src/utils/paths.mjs` | 路径解析 | TASK-INIT-06 |
| `src/commands/init.mjs` | init 命令 | TASK-INIT-06 |
| `templates/project/**` | 项目模板 | TASK-INIT-04 |

### 7.2 测试文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `test/fs.test.mjs` | fs 工具测试 | TASK-INIT-01 |
| `test/templates.test.mjs` | 模板测试 | TASK-INIT-03 |
| `test/init.test.mjs` | init 命令测试 | TASK-INIT-05 |

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
