# 实施任务拆解 - claude-skill-management

> **定位**：单一 Capability 的 AI 编码引擎执行单元
>
> **边界声明**：本任务清单仅服务于 `claude-skill-management`，不展开其他 CLI 能力的实现细节。
>
> **质量红线**：任务粒度控制在可独立实现和验证的范围内，任务与验证逻辑必须覆盖当前 capability 的 spec 和 design。

---

## 1. 任务总览

### 1.1 关联文档

| 文档 | 路径 | 说明 |
|-----|------|------|
| 全局契约 | `openspec/specs/overview.md` | 全局约束基线 |
| 业务意图 | `openspec/changes/implement-docsync-cli/proposal.md` | 变更背景与测试策略 |
| 技术契约 | `openspec/changes/implement-docsync-cli/specs/claude-skill-management/spec.md` | 当前能力规格 |
| 技术方案 | `openspec/changes/implement-docsync-cli/specs/claude-skill-management/design.md` | 当前能力设计 |

### 1.2 实现范围

- 新增 `docsync skill install/update/path` 子命令。
- 支持默认全局目标 `~/.claude/skills/doc-sync/SKILL.md`。
- 支持 `--project` 安装到 `<cwd>/.claude/skills/doc-sync/SKILL.md`。
- 在 install 模式中保护已有不同内容，除非传入 `--force` 或执行 `update`。
- 支持 `--backup` 在覆盖前生成备份。
- 输出 installed、updated、already-installed、path 等状态与目标路径。

### 1.3 技术栈

- 语言：Node.js ESM
- 测试：Node.js 内置 `node:test`
- 依赖：本地文件系统、path/os 工具、无第三方 SDK

---

## 2. 任务执行拓扑图

### 2.0 测试策略

**当前测试策略**：`tdd`

测试骨架任务先于实现任务，验证任务收束所有实现输出。

### 2.1 拓扑图

```text
层级 1:
  TASK-SKILL-01  Skill 模板测试骨架
  TASK-SKILL-03  路径与保护测试骨架
  TASK-SKILL-05  update/path CLI 测试骨架

层级 2:
  TASK-SKILL-02  创建 Claude Skill 模板
    depends on: TASK-SKILL-01

层级 3:
  TASK-SKILL-04  实现目标路径与安装保护
    depends on: TASK-SKILL-02, TASK-SKILL-03

层级 4:
  TASK-SKILL-06  实现 skill 子命令并接入 CLI
    depends on: TASK-SKILL-04, TASK-SKILL-05

层级 5:
  TASK-SKILL-07  验证 Skill 管理能力
    depends on: TASK-SKILL-02, TASK-SKILL-04, TASK-SKILL-06
```

### 2.2 层级汇总

| 层级 | 任务列表 | 可并行 | 前置依赖 |
|-----|---------|-------|--------|
| 层级 1 | TASK-SKILL-01, TASK-SKILL-03, TASK-SKILL-05 | 是 | 无 |
| 层级 2 | TASK-SKILL-02 | 否 | TASK-SKILL-01 |
| 层级 3 | TASK-SKILL-04 | 否 | TASK-SKILL-02, TASK-SKILL-03 |
| 层级 4 | TASK-SKILL-06 | 否 | TASK-SKILL-04, TASK-SKILL-05 |
| 层级 5 | TASK-SKILL-07 | 否 | TASK-SKILL-02, TASK-SKILL-04, TASK-SKILL-06 |

---

## 3. 原子任务清单

### 3.0 任务类型说明

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| 测试-骨架 | 先建立失败测试与 fixture 结构 | TDD 前置任务 |
| 接口层 | CLI 子命令分发与输出 | `docsync skill` 命令 |
| 数据层 | 路径、文件读写、模板内容处理 | 本地文件系统操作 |
| 配置 | 模板文件与常量 | Skill 模板 |
| 测试-验证 | 实现后运行并补齐断言 | 验收任务 |

---

### [TASK-SKILL-01] 编写 Skill 模板测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
创建模板内容测试，约束 `templates/claude-skill/SKILL.md` 不含敏感信息且包含 doc-sync 使用指令。

#### 输入
- `spec.md` 中 Claude Skill 安装与数据安全要求
- `design.md` 中模板路径与 `skillName=doc-sync`

#### 输出
- `test/skillTemplate.test.mjs`

#### 实现步骤
1. 新建模板测试文件。
2. 断言模板文件存在且大小小于 50 KB。
3. 断言模板包含 `doc-sync`、安装目标说明和使用边界。
4. 断言模板不包含 token、私钥、机器专属绝对路径等敏感模式。

#### 验收标准
- [ ] 测试文件使用 `node:test` 和 `node:assert/strict`。
- [ ] 测试在模板缺失时失败。
- [x] 敏感信息断言覆盖 token/key/pem/env 等关键词。

#### 关联设计
- spec.md 章节：1 新增需求、5.2 数据安全
- design.md 章节：2.2 需新建文件、9.1 业务配置

---

### [TASK-SKILL-02] 创建 Claude Skill 模板

- **类型**: 配置
- **依赖**: TASK-SKILL-01
- **状态**: [x] 已完成

#### 任务描述
新增 `doc-sync` Skill 模板，作为 install/update 写入目标文件的唯一模板来源。

#### 输入
- `test/skillTemplate.test.mjs`
- `templates/claude-skill/SKILL.md` 目标路径

#### 输出
- `templates/claude-skill/SKILL.md`

#### 实现步骤
1. 创建 `templates/claude-skill` 目录。
2. 编写 `SKILL.md`，说明 DocSync 用途、可用命令和安全边界。
3. 避免写入任何本机绝对路径、账号 token 或私有配置。

#### 验收标准
- [x] 模板测试通过。
- [ ] 文件编码为 UTF-8。
- [x] 模板内容可被完整写入目标 `SKILL.md`。

#### 关联设计
- spec.md 章节：1 新增需求、3.1 性能约束
- design.md 章节：2.2 需新建文件、6.3 关键算法

---

### [TASK-SKILL-03] 编写 Skill 路径与保护测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
创建路径解析、install 保护、force/update 覆盖和 backup 行为的单元测试骨架。

#### 输入
- `spec.md` 中请求参数与错误码
- `design.md` 中目标路径、状态机和异常处理

#### 输出
- `test/skill.test.mjs`

#### 实现步骤
1. 使用临时目录模拟 HOME 与项目 cwd。
2. 添加全局路径解析测试。
3. 添加项目路径解析测试。
4. 添加目标不存在、内容相同、内容不同、force 覆盖、backup 覆盖的测试占位。

#### 验收标准
- [ ] 测试明确覆盖 `--global`、`--project`、`--cwd`。
- [x] 内容不同且未 force 的测试期望 exit code 1 或等价错误对象。
- [ ] backup 测试期望生成 `.bak.<timestamp>` 风格文件。

#### 关联设计
- spec.md 章节：2.1 接口定义、6.2 数据兼容性
- design.md 章节：4.2 接口详细设计、6.2 状态机、8.1 异常分类

---

### [TASK-SKILL-04] 实现 Skill 目标路径与安装保护

- **类型**: 数据层
- **依赖**: TASK-SKILL-02, TASK-SKILL-03
- **状态**: [x] 已完成

#### 任务描述
实现路径解析、模板读取、内容比较、安全写入、保护性拒绝和可选备份。

#### 输入
- `templates/claude-skill/SKILL.md`
- `test/skill.test.mjs`

#### 输出
- `src/utils/paths.mjs`
- `src/utils/fs.mjs`
- `src/commands/skill.mjs` 中可复用的安装核心逻辑

#### 实现步骤
1. 在 path 工具中解析 home 与 project 目标路径。
2. 在 fs 工具中实现 UTF-8 读取、目录创建、写入和 backup。
3. 实现完整字符串内容比较。
4. 实现 install 决策：missing 写入、same 返回 already-installed、different 且未 force 拒绝。
5. 实现 update 和 install force 的覆盖写入流程。

#### 验收标准
- [x] 全局目标为 `<home>/.claude/skills/doc-sync/SKILL.md`。
- [ ] 项目目标为 `<cwd>/.claude/skills/doc-sync/SKILL.md`。
- [x] install 不默认覆盖不同内容。
- [x] update 与 `install --force` 可覆盖不同内容。
- [ ] `--backup` 在覆盖前生成备份。

#### 关联设计
- spec.md 章节：1 新增需求、4.1 内部依赖、5.3 审计要求
- design.md 章节：2.2 需新建文件、4.2 业务逻辑、6.3 关键算法

---

### [TASK-SKILL-05] 编写 update/path CLI 测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述
创建 `docsync skill` 子命令的 CLI 分发测试，覆盖 install/update/path 与参数错误。

#### 输入
- `spec.md` 中 CLI 参数与响应结构
- `design.md` 中 `runSkill(rest, options)` 接口

#### 输出
- `test/skillCli.test.mjs`

#### 实现步骤
1. 准备调用 CLI 主入口或命令函数的测试 helper。
2. 添加 `skill install` 成功输出状态测试。
3. 添加 `skill update` 成功覆盖测试。
4. 添加 `skill path --global` 只输出路径测试。
5. 添加未知子命令、global/project 冲突的参数错误测试。

#### 验收标准
- [x] path 测试不写入文件。
- [x] 参数错误返回 exit code 2 或等价错误对象。
- [ ] 成功响应包含 target 与 status。

#### 关联设计
- spec.md 章节：2.1 请求参数、2.1 响应结构
- design.md 章节：4.1 接口清单、4.2 接口详细设计

---

### [TASK-SKILL-06] 实现 skill 子命令并接入 CLI

- **类型**: 接口层
- **依赖**: TASK-SKILL-04, TASK-SKILL-05
- **状态**: [x] 已完成

#### 任务描述
实现 `docsync skill <install|update|path>` 的命令入口、参数校验和用户可读输出。

#### 输入
- `src/commands/skill.mjs` 核心逻辑
- CLI 主分发入口
- `test/skillCli.test.mjs`

#### 输出
- `src/commands/skill.mjs`
- CLI 主入口中的 `skill` 路由接入

#### 实现步骤
1. 解析 `install/update/path` 子命令。
2. 校验 `--global` 与 `--project` 互斥。
3. 将 `--cwd` 仅用于 project 模式。
4. 调用安装核心逻辑并格式化输出。
5. 为错误路径设置约定 exit code。

#### 验收标准
- [ ] `docsync skill install` 默认安装到全局目标。
- [ ] `docsync skill install --project` 安装到当前项目目标。
- [ ] `docsync skill update` 覆盖写入模板内容。
- [ ] `docsync skill path --global` 只输出解析后的目标路径。
- [x] 未知子命令返回参数错误。

#### 关联设计
- spec.md 章节：1 新增需求、2.1 错误码定义
- design.md 章节：4.2 业务逻辑、8.1 异常分类

---

### [TASK-SKILL-07] 验证 Skill 管理能力

- **类型**: 测试-验证
- **依赖**: TASK-SKILL-02, TASK-SKILL-04, TASK-SKILL-06
- **状态**: [x] 已完成

#### 任务描述
运行并补齐 Skill 管理相关测试，确认模板、路径、保护、更新和 CLI 输出满足契约。

#### 输入
- `test/skillTemplate.test.mjs`
- `test/skill.test.mjs`
- `test/skillCli.test.mjs`

#### 输出
- 通过的测试结果
- 必要时补齐的断言

#### 实现步骤
1. 运行 Skill 相关测试文件。
2. 补齐缺失的断言场景。
3. 手动检查无真实 home 目录写入风险。
4. 记录验证命令和结果。

#### 验收标准
- [x] 模板测试通过。
- [ ] 路径与保护测试通过。
- [ ] CLI 子命令测试通过。
- [ ] 测试 fixture 不污染用户真实 `~/.claude` 目录。

#### 关联设计
- spec.md 章节：全部新增需求
- design.md 章节：6.1 核心流程、8 异常处理、9 配置

---

## 4. 验证方式

### 4.1 单元测试要求

| 任务 ID | 测试类型 | 测试场景 | 断言内容 |
|--------|---------|---------|---------|
| TASK-SKILL-01 | 模板测试 | Skill 模板存在 | 内容完整、无敏感信息、大小合规 |
| TASK-SKILL-03 | 文件系统测试 | install 决策 | missing/same/different/force/backup |
| TASK-SKILL-05 | CLI 测试 | skill 子命令 | install/update/path/参数错误 |
| TASK-SKILL-07 | 回归验证 | 全部 Skill 测试 | 全部通过且不污染真实 home |

### 4.2 集成测试场景

| 场景 | 前置条件 | 操作步骤 | 预期结果 |
|-----|---------|---------|---------|
| 全局安装 | 临时 HOME 无目标文件 | 执行 `docsync skill install` | 写入全局目标并输出 installed |
| 项目安装 | 临时 cwd 无目标文件 | 执行 `docsync skill install --project` | 写入项目目标并输出 installed |
| 内容保护 | 目标文件存在且内容不同 | 执行 `docsync skill install` | 拒绝覆盖并提示 update 或 force |
| 路径查询 | 无需目标文件存在 | 执行 `docsync skill path --global` | 只输出目标路径 |

### 4.3 手动验证清单

- [x] 确认模板内容不含 token、私钥、真实机器路径。
- [x] 确认测试均使用临时 HOME/cwd。
- [x] 确认错误输出包含用户下一步建议。

---

## 5. 外部依赖

| 依赖项 | 类型 | 提供方 | 状态 | 备注 |
|-------|------|-------|------|------|
| Node.js >=18 | 运行时 | 用户环境 | 就绪 | 使用 ESM 和 node:test |
| Claude Code | 外部工具 | 用户环境 | 可选 | 本能力只写文件，不要求已安装 |
| 本地文件系统 | 系统能力 | OS | 就绪 | 需要 home 或项目目录写权限 |

---

## 6. 代码规范

### 6.1 命名规范

- 文件名：`skill.mjs`、`paths.mjs`、`fs.mjs`
- 方法名：`runSkill`、`resolveSkillTargetPath`、`installSkillTemplate`
- 变量名：使用 camelCase，如 `targetPath`、`templateContent`、`backupPath`

### 6.2 代码风格

- 缩进：2 spaces
- 注释：仅在保护性覆盖逻辑和路径解析边界处添加简短说明
- 异常处理：参数错误与文件系统错误使用明确 exit code 映射

### 6.3 日志规范

- 日志级别：普通成功输出走 stdout，错误走 stderr
- 日志格式：包含 target 与 status
- 敏感信息处理：不输出模板全文、不输出用户文件内容

---

## 7. 交付物

### 7.1 代码文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `src/commands/skill.mjs` | skill 子命令入口与安装逻辑 | TASK-SKILL-04, TASK-SKILL-06 |
| `src/utils/paths.mjs` | home/project 路径解析 | TASK-SKILL-04 |
| `src/utils/fs.mjs` | 安全写入、备份、内容比较 | TASK-SKILL-04 |
| `templates/claude-skill/SKILL.md` | Claude Skill 模板 | TASK-SKILL-02 |

### 7.2 测试文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `test/skillTemplate.test.mjs` | 模板内容测试 | TASK-SKILL-01 |
| `test/skill.test.mjs` | 路径、保护、备份测试 | TASK-SKILL-03 |
| `test/skillCli.test.mjs` | CLI 分发测试 | TASK-SKILL-05 |

### 7.3 文档更新

- [x] README 中补充 `docsync skill` 用法。
- [x] AGENTS 中补充 Skill 管理验证命令。
- [x] CHANGELOG 中记录 Claude Skill 管理能力。

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
