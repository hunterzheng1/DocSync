# 实施任务拆解 - package-docs-release-readiness

> **定位**：单一 Capability 的 AI 编码引擎执行单元
>
> **边界声明**：本任务清单仅服务于 `package-docs-release-readiness`，不执行 npm publish、git commit、git push 等发布动作。
>
> **质量红线**：发布就绪只提供元数据、文档、脚本和人工检查流程，必须防止敏感文件进入 npm 包。

---

## 1. 任务总览

### 1.1 关联文档

| 文档 | 路径 | 说明 |
|-----|------|------|
| 全局契约 | `openspec/specs/overview.md` | 全局约束基线 |
| 业务意图 | `openspec/changes/implement-docsync-cli/proposal.md` | 变更背景与测试策略 |
| 技术契约 | `openspec/changes/implement-docsync-cli/specs/package-docs-release-readiness/spec.md` | 当前能力规格 |
| 技术方案 | `openspec/changes/implement-docsync-cli/specs/package-docs-release-readiness/design.md` | 当前能力设计 |

### 1.2 实现范围

- 提供 npm 可发布包的 `package.json` 元数据。
- 配置 `bin.docsync`、`type=module`、`engines.node>=18`、`files` 白名单和基础 scripts。
- 补齐 README、AGENTS、CHANGELOG、LICENSE。
- 补齐 `.gitignore` 与 `.npmignore` 的发布安全忽略项。
- 提供 `npm test`、`npm run lint`、`npm run pack:dry`、`node bin/docsync.mjs doctor` 验收路径。
- 保持发布与提交为人工动作，不自动执行。

### 1.3 技术栈

- 语言：Node.js ESM
- 测试：Node.js 内置 `node:test`
- 包管理：npm
- 文档：Markdown、MIT License

---

## 2. 任务执行拓扑图

### 2.0 测试策略

**当前测试策略**：`tdd`

配置与文档检查先建立测试或检查脚本，再补齐实际文件。

### 2.1 拓扑图

```text
层级 1:
  TASK-PKG-01  package 元数据测试骨架
  TASK-PKG-03  文档内容测试骨架
  TASK-PKG-05  发布安全测试骨架

层级 2:
  TASK-PKG-02  创建 package.json
    depends on: TASK-PKG-01
  TASK-PKG-04  创建 README/AGENTS/CHANGELOG/LICENSE
    depends on: TASK-PKG-03
  TASK-PKG-06  更新 ignore 与发布白名单安全配置
    depends on: TASK-PKG-05

层级 3:
  TASK-PKG-07  补齐验证脚本与 release 检查说明
    depends on: TASK-PKG-02, TASK-PKG-04, TASK-PKG-06

层级 4:
  TASK-PKG-08  验证发布就绪状态
    depends on: TASK-PKG-07
```

### 2.2 层级汇总

| 层级 | 任务列表 | 可并行 | 前置依赖 |
|-----|---------|-------|--------|
| 层级 1 | TASK-PKG-01, TASK-PKG-03, TASK-PKG-05 | 是 | 无 |
| 层级 2 | TASK-PKG-02, TASK-PKG-04, TASK-PKG-06 | 是 | 层级 1 |
| 层级 3 | TASK-PKG-07 | 否 | TASK-PKG-02, TASK-PKG-04, TASK-PKG-06 |
| 层级 4 | TASK-PKG-08 | 否 | TASK-PKG-07 |

---

## 3. 原子任务清单

### 3.0 任务类型说明

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| 测试-骨架 | 先建立失败测试或静态检查 | package/docs/safety |
| 配置 | package、ignore、scripts 配置 | 发布元数据 |
| 文档 | README、AGENTS、CHANGELOG、LICENSE | 项目说明 |
| 测试-验证 | 实现后运行命令并检查输出 | 发布前验收 |

---

### [TASK-PKG-01] 编写 package 元数据测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述

创建 package manifest 测试，约束 npm 包名、版本、ESM、bin、engines、files 和 scripts。

#### 输入

- `spec.md` 中 npm 包发布元数据要求
- `design.md` 中 package 默认配置

#### 输出

- `test/packageMetadata.test.mjs`

#### 实现步骤

1. 读取并解析 `package.json`。
2. 断言 `name="@hunterzheng1/docsync"`。
3. 断言 `version="0.1.0"` 且符合 semver 基础格式。
4. 断言 `type="module"`、`bin.docsync="bin/docsync.mjs"`、`engines.node=">=18"`。
5. 断言 scripts 包含 `test`、`lint`、`pack:dry`。
6. 断言 files 白名单包含允许的目录和文档。

#### 验收标准

- [x] package 缺失时测试失败。
- [x] 元数据字段逐项严格断言。
- [x] files 白名单不包含 test、coverage、env、repomix 输出。

#### 关联设计

- spec.md 章节：1 npm 包发布元数据
- design.md 章节：2.2 需新建文件、9.1 业务配置

---

### [TASK-PKG-02] 创建 package.json

- **类型**: 配置
- **依赖**: TASK-PKG-01
- **状态**: [x] 已完成

#### 任务描述

新增 npm package manifest，提供可发布包的元数据、bin、files、engines 和验证脚本。

#### 输入

- `test/packageMetadata.test.mjs`
- `bin/docsync.mjs` 约定入口

#### 输出

- `package.json`

#### 实现步骤

1. 创建 `package.json`，设置 name、version、description、license。
2. 设置 `type=module` 和 `bin.docsync`。
3. 设置 `engines.node` 为 `>=18`。
4. 设置 `files` 白名单。
5. 设置 `scripts.test`、`scripts.lint`、`scripts.pack:dry`。
6. 补齐 repository、bugs、homepage 元数据。

#### 验收标准

- [x] package 元数据测试通过。
- [x] `files` 只包含 `bin`、`src`、`templates`、README、LICENSE、CHANGELOG 等允许项。
- [x] package 中不包含自动 publish 或 git commit 脚本。

#### 关联设计

- spec.md 章节：1 npm 包发布元数据、1 测试与验收命令
- design.md 章节：4.2 Release readiness scripts、6.3 关键算法

---

### [TASK-PKG-03] 编写文档内容测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述

创建 README、AGENTS、CHANGELOG、LICENSE 内容检查，确保文档章节满足契约。

#### 输入

- `spec.md` 中项目文档完备要求
- `design.md` 中 README/AGENTS sections 设计

#### 输出

- `test/docsContent.test.mjs`

#### 实现步骤

1. 添加 README 必需章节检查。
2. 添加 AGENTS 必需章节检查。
3. 添加 CHANGELOG 初始版本检查。
4. 添加 LICENSE 为 MIT 且包含 `2026 Hunter Zheng` 的检查。

#### 验收标准

- [x] README 缺少安装、快速开始、命令列表、安全说明或 License 时测试失败。
- [x] AGENTS 缺少常用命令、规则、验证要求或安全编辑约束时测试失败。
- [x] LICENSE 缺少 MIT 或版权年份时测试失败。

#### 关联设计

- spec.md 章节：1 项目文档完备
- design.md 章节：3.1 页面/组件结构、2.2 需新建文件

---

### [TASK-PKG-04] 创建 README/AGENTS/CHANGELOG/LICENSE

- **类型**: 文档
- **依赖**: TASK-PKG-03
- **状态**: [x] 已完成

#### 任务描述

补齐用户文档、agent 维护说明、变更记录和 MIT License。

#### 输入

- `test/docsContent.test.mjs`
- package scripts 和 CLI 命令清单

#### 输出

- `README.md`
- `AGENTS.md`
- `CHANGELOG.md`
- `LICENSE`

#### 实现步骤

1. README 写入简介、安装、快速开始、命令列表、Skill 安装、Codex 规则安装、项目使用、发布说明、安全说明、License。
2. AGENTS 写入项目说明、常用命令、开发规则、验证要求、安全编辑约束。
3. CHANGELOG 写入 `0.1.0` 初始条目。
4. LICENSE 写入 MIT License 文本与 `2026 Hunter Zheng`。

#### 验收标准

- [x] 文档内容测试通过。
- [x] README 明确首次 scoped public 发布需人工执行 `npm publish --access public`。
- [x] AGENTS 明确不得自动发布、提交或推送。
- [x] LICENSE 使用 MIT 文本。

#### 关联设计

- spec.md 章节：1 项目文档完备、5.3 审计要求
- design.md 章节：3.1 文档结构、4.2 业务逻辑

---

### [TASK-PKG-05] 编写发布安全测试骨架

- **类型**: 测试-骨架
- **依赖**: 无
- **状态**: [x] 已完成

#### 任务描述

创建发布安全检查，防止敏感文件、生成产物和测试临时目录进入发布包候选。

#### 输入

- `spec.md` 中发布安全检查与 forbidden patterns
- `design.md` 中 files 白名单和人工 pack 检查要求

#### 输出

- `test/packageSafety.test.mjs`

#### 实现步骤

1. 读取 `package.json` 的 `files` 白名单。
2. 读取 `.gitignore` 与 `.npmignore`。
3. 断言 forbidden patterns 被忽略或未进入 files。
4. 断言 `.env`、`.env.*`、`*.pem`、`*.key`、`*.p12`、`*.jks`、`repomix-output.xml` 不在发布白名单。

#### 验收标准

- [x] 忽略配置缺失敏感模式时测试失败。
- [x] files 白名单包含敏感或生成文件时测试失败。
- [x] 测试不需要访问网络或 npm registry。

#### 关联设计

- spec.md 章节：1 发布安全检查、5.2 数据安全
- design.md 章节：6.3 关键算法、8.1 异常分类

---

### [TASK-PKG-06] 更新 ignore 与发布白名单安全配置

- **类型**: 配置
- **依赖**: TASK-PKG-05
- **状态**: [x] 已完成

#### 任务描述

补齐 `.gitignore` 和 `.npmignore`，与 `package.files` 共同阻止敏感和生成文件进入仓库或 npm 包。

#### 输入

- `test/packageSafety.test.mjs`
- `package.json` 的 `files` 白名单

#### 输出

- `.gitignore`
- `.npmignore`
- 必要时调整的 `package.json` `files`

#### 实现步骤

1. 在 `.gitignore` 中覆盖 node_modules、coverage、dist、日志、env、repomix 输出。
2. 在 `.npmignore` 中覆盖 test、coverage、env、密钥、证书、repomix 输出。
3. 确认 `package.files` 仍采用白名单策略。
4. 保留既有 ignore 内容，不删除用户已有规则。

#### 验收标准

- [x] 发布安全测试通过。
- [x] `.npmignore` 与 `package.files` 不冲突。
- [x] 忽略规则覆盖 spec 中所有 forbidden patterns。

#### 关联设计

- spec.md 章节：1 发布文件白名单、1 发布安全检查
- design.md 章节：2.1 需修改文件、4.2 业务逻辑

---

### [TASK-PKG-07] 补齐验证脚本与 release 检查说明

- **类型**: 配置
- **依赖**: TASK-PKG-02, TASK-PKG-04, TASK-PKG-06
- **状态**: [x] 已完成

#### 任务描述

确保 package scripts 与文档中的发布前验证流程一致，并强调 pack dry-run 需要人工审查。

#### 输入

- `package.json`
- `README.md`
- `AGENTS.md`

#### 输出

- 对齐后的 `scripts.test`、`scripts.lint`、`scripts.pack:dry`
- README/AGENTS 中的 release readiness 检查说明

#### 实现步骤

1. 确认 `npm test` 使用 Node 内置 test runner。
2. 确认 `npm run lint` 至少对 `bin/docsync.mjs` 与 `src/cli.mjs` 执行 `node --check`。
3. 确认 `npm run pack:dry` 执行 `npm pack --dry-run`。
4. 在 README/AGENTS 中列出 `npm test`、`npm run lint`、`npm run pack:dry`、`node bin/docsync.mjs doctor`。
5. 明确 pack 输出需要人工检查且不得自动 publish。

#### 验收标准

- [x] package scripts 与文档命令一致。
- [x] 文档明确不自动发布、不自动提交。
- [x] pack dry-run 说明包含 forbidden patterns 人工检查。

#### 关联设计

- spec.md 章节：1 测试与验收命令、5.3 审计要求
- design.md 章节：4.1 接口清单、4.2 业务逻辑

---

### [TASK-PKG-08] 验证发布就绪状态

- **类型**: 测试-验证
- **依赖**: TASK-PKG-07
- **状态**: [x] 已完成

#### 任务描述

运行发布就绪相关测试和本地验证命令，人工检查 pack dry-run 输出。

#### 输入

- `package.json`
- README/AGENTS/CHANGELOG/LICENSE
- `.gitignore`、`.npmignore`
- `test/*.test.mjs`

#### 输出

- 通过的本地验证结果
- pack dry-run 文件列表人工检查记录

#### 实现步骤

1. 运行 `npm test`。
2. 运行 `npm run lint`。
3. 运行 `node bin/docsync.mjs doctor`。
4. 运行 `npm run pack:dry`。
5. 人工检查 pack 输出不包含敏感文件、生成文件或测试临时目录。

#### 验收标准

- [x] `npm test` 通过。
- [x] `npm run lint` 通过。
- [x] `node bin/docsync.mjs doctor` 输出可用于环境诊断。
- [x] `npm run pack:dry` 可运行且输出文件列表。
- [x] pack 输出经人工确认不含 forbidden patterns。

#### 关联设计

- spec.md 章节：全部新增需求
- design.md 章节：6.1 核心流程、8.1 异常分类

---

## 4. 验证方式

### 4.1 单元测试要求

| 任务 ID | 测试类型 | 测试场景 | 断言内容 |
|--------|---------|---------|---------|
| TASK-PKG-01 | manifest 测试 | package 元数据 | name/version/type/bin/engines/files/scripts |
| TASK-PKG-03 | 文档测试 | README/AGENTS/CHANGELOG/LICENSE | 必需章节与 MIT License |
| TASK-PKG-05 | 安全测试 | files 与 ignore | forbidden patterns 不进入发布候选 |
| TASK-PKG-08 | 回归验证 | 发布前命令 | test/lint/doctor/pack dry-run |

### 4.2 集成测试场景

| 场景 | 前置条件 | 操作步骤 | 预期结果 |
|-----|---------|---------|---------|
| package 元数据检查 | package.json 存在 | 运行 package metadata 测试 | 字段满足 npm 发布契约 |
| 文档可用性检查 | 文档文件存在 | 运行 docs content 测试 | 必需章节齐全 |
| 发布安全检查 | ignore 与 files 存在 | 运行 package safety 测试 | 敏感和生成文件被阻止 |
| pack dry-run | npm 可用 | 执行 `npm run pack:dry` | 输出候选文件列表供人工检查 |

### 4.3 手动验证清单

- [x] 检查 package scope 与包名在发布前可用。
- [x] 检查 pack dry-run 输出不含 `.env`、密钥、证书、token、`repomix-output.xml`。
- [x] 确认没有自动执行 npm publish、git commit、git push。

---

## 5. 外部依赖

| 依赖项 | 类型 | 提供方 | 状态 | 备注 |
|-------|------|-------|------|------|
| Node.js >=18 | 运行时 | 用户环境 | 就绪 | CLI、test、lint |
| npm >=9 | 包管理器 | 用户环境 | 等待用户环境 | pack/publish/scripts |
| npm registry | 外部服务 | npm | 手动使用 | 仅用户主动 publish 时访问 |
| MIT License | 许可证 | 开源许可文本 | 就绪 | `2026 Hunter Zheng` |

---

## 6. 代码规范

### 6.1 命名规范

- package scripts：`test`、`lint`、`pack:dry`
- 测试文件：`packageMetadata.test.mjs`、`docsContent.test.mjs`、`packageSafety.test.mjs`
- 文档文件：`README.md`、`AGENTS.md`、`CHANGELOG.md`、`LICENSE`

### 6.2 代码风格

- JSON 缩进：2 spaces
- Markdown：标题层级清晰，命令使用代码块或行内代码
- ignore 文件：保留既有规则，在末尾补充分组注释

### 6.3 日志规范

- pack dry-run：保留 npm 输出供人工检查
- 发布说明：不得记录或要求保存 npm token
- 敏感信息处理：不在文档示例中写入真实 token 或私钥

---

## 7. 交付物

### 7.1 代码文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `package.json` | npm manifest、bin、files、scripts | TASK-PKG-02, TASK-PKG-07 |
| `.gitignore` | 仓库忽略规则 | TASK-PKG-06 |
| `.npmignore` | npm 包忽略规则 | TASK-PKG-06 |

### 7.2 测试文件

| 文件路径 | 说明 | 对应任务 |
|---------|------|---------|
| `test/packageMetadata.test.mjs` | package 元数据测试 | TASK-PKG-01 |
| `test/docsContent.test.mjs` | 文档内容测试 | TASK-PKG-03 |
| `test/packageSafety.test.mjs` | 发布安全测试 | TASK-PKG-05 |

### 7.3 文档更新

- [x] `README.md`
- [x] `AGENTS.md`
- [x] `CHANGELOG.md`
- [x] `LICENSE`

---

> **质量红线检查清单**
>
> - [x] 每个任务粒度符合可独立实现标准
> - [x] 任务清单 100% 覆盖 spec.md 定义
> - [x] 任务清单 100% 覆盖 design.md 定义
> - [x] 每个任务都有明确验收标准
> - [x] 每个实现任务都有对应测试要求
> - [x] 依赖拓扑已明确
> - [x] 任务执行拓扑图已绘制
> - [x] 无循环依赖
