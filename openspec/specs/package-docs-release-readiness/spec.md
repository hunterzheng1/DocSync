# spec.md - 能力规格定义

> **定位**：单个能力（capability）的技术规格定义，用于 `specs/<capability>/spec.md`
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：npm 包发布元数据

系统必须提供可发布 npm 包所需的 `package.json` 元数据，包括包名、版本、描述、ESM 类型、bin、files 白名单、engines、scripts、repository、bugs、homepage、license。

##### 场景：包元数据完整
- **当** 用户检查 `package.json`
- **预期** 系统必须包含 `name="@hunterzheng/docsync"`、`version="0.1.0"`、`type="module"`、`bin.docsync="bin/docsync.mjs"`、`engines.node=">=18"`

##### 场景：发布文件白名单
- **当** 用户运行 `npm pack --dry-run`
- **预期** 发布包必须只包含 `bin`、`src`、`templates`、`README.md`、`LICENSE`、`CHANGELOG.md` 以及 npm 必需元数据

#### 需求项：项目文档完备

系统必须补齐 README.md、AGENTS.md、CHANGELOG.md、LICENSE，并使文档覆盖安装、快速开始、命令列表、安全说明、验证命令和 License。

##### 场景：README 可用
- **当** 用户阅读 README.md
- **预期** README 必须包含项目简介、安装方式、快速开始、命令列表、Skill 安装、Codex 规则安装、项目中使用、发布说明、安全说明、License

##### 场景：AGENTS 可用
- **当** coding agent 阅读 AGENTS.md
- **预期** AGENTS 必须包含项目说明、常用命令、规则、验证要求和安全编辑约束

##### 场景：License 可用
- **当** 用户检查 LICENSE
- **预期** LICENSE 必须使用 MIT License 文本，并包含 2026 Hunter Zheng

#### 需求项：发布安全检查

系统必须提供发布前检查流程，确保不自动发布、不自动提交，并要求人工检查 `npm pack --dry-run` 输出中不含敏感或生成文件。

##### 场景：pack dry-run
- **当** 用户执行 `npm run pack:dry`
- **预期** 系统必须运行 `npm pack --dry-run` 并输出将发布文件列表

##### 场景：禁止敏感文件发布
- **当** 发布包候选包含 `.env`、`.env.*`、`*.pem`、`*.key`、`*.p12`、`*.jks`、token、`repomix-output.xml` 或测试临时目录
- **预期** 系统必须通过配置或人工检查阻止发布

#### 需求项：测试与验收命令

系统必须提供基础验证命令 `npm test`、`npm run lint`、`npm run pack:dry`、`node bin/docsync.mjs doctor`，用于发布前验收。

##### 场景：测试脚本
- **当** 用户执行 `npm test`
- **预期** 系统必须使用 Node 内置 test runner 运行测试

##### 场景：lint 脚本
- **当** 用户执行 `npm run lint`
- **预期** 系统必须至少对 CLI 入口和主分发文件执行 `node --check`

### 修改需求

无。

### 移除需求

无。

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### 接口基本信息
- **路径**：npm scripts 与仓库文档文件
- **方法**：命令行调用 + 静态文件检查
- **内容类型**：stdout/stderr 文本输出 + Markdown/JSON 文档

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 | 约束条件 |
|-------|------|------|------|--------|----------|
| npm script | string | 是 | 发布前验证脚本 | `npm run pack:dry` | 允许值：`test/lint/pack:dry/release:patch` |
| package name | string | 是 | npm 包名 | `@hunterzheng/docsync` | 若 scope 不可用，发布前必须人工调整 |
| package version | semver | 是 | npm 版本 | `0.1.0` | 同一 name+version 不得重复发布 |
| files | string[] | 是 | npm files 白名单 | `["bin","src","templates"]` | 不得包含生成文件和敏感文件 |

#### 响应结构

**成功响应 (exit 0)**
```json
{
  "test": "passed",
  "lint": "passed",
  "packDryRun": "reviewed",
  "publishReady": true
}
```

**错误响应**
```json
{
  "code": 1,
  "message": "package contains forbidden file: repomix-output.xml",
  "data": null
}
```

#### 错误码定义
| 错误码 | 含义 | 触发条件 |
|-------|------|----------|
| 0 | 成功 | 文档、测试、lint、pack dry-run 符合要求 |
| 1 | 验证失败 | 测试失败、lint 失败、pack 内容不合规 |
| 2 | 配置错误 | package 元数据缺失、files 白名单缺失、版本格式非法 |

---

## 3. 物理约束

### 3.1 性能约束
| 指标 | 约束值 | 说明 |
|------|-------|------|
| lint 脚本耗时 | < 5000 毫秒 (P95) | 基础 `node --check` |
| pack dry-run 耗时 | < 10000 毫秒 (P95) | 小型 npm 包 |
| 测试套件耗时 | < 30000 毫秒 (P95) | 第一版基础测试 |

### 3.2 资源约束
| 资源 | 限制 | 说明 |
|------|------|------|
| 内存 | < 256 MB | 测试与 pack dry-run |
| CPU | < 2 个核心 | 本地验证 |
| 存储 | npm 包压缩前 < 5 MB | 第一版轻量包目标 |

### 3.3 超时配置
- 连接超时：0 毫秒（验证命令不依赖网络）
- 读取超时：2000 毫秒（读取 package/docs）
- 总超时：60000 毫秒（完整本地验证参考上限）

---

## 4. 影响模块

### 4.1 内部依赖
- [ ] `package.json`：发布元数据、scripts、files、engines
- [ ] `.gitignore`：排除 node_modules、coverage、dist、日志、env、repomix 输出
- [ ] `.npmignore`：补充排除 test、coverage、env、repomix 输出
- [ ] `README.md`：面向用户的使用说明
- [ ] `AGENTS.md`：面向 coding agent 的维护说明
- [ ] `CHANGELOG.md`：版本变更记录
- [ ] `LICENSE`：MIT License
- [ ] `test/*.test.mjs`：基础测试

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|---------|
| 运行时 | Node.js | >=18 | 测试、lint、CLI 执行 | 不支持低版本 |
| 包管理器 | npm | >=9 | pack、publish、scripts | 缺失时无法发布 |
| 测试框架 | node:test | Node.js >=18 内置 | 单元测试 | 不引入第三方测试框架 |
| 许可证 | MIT License | 2026 文本 | 开源许可 | 不使用其他许可证 |

### 4.3 数据存储
- [ ] 数据库（版本 N/A）：无数据库读写
- [ ] 缓存（版本 N/A）：无缓存读写
- [ ] npm registry：仅用户手动发布时写入；DocSync 不自动发布

---

## 5. 安全与合规

### 5.1 权限要求
- 认证方式：npm 发布认证由用户本机 npm 管理，DocSync 不保存 token
- 授权范围：本地仓库读写权限；发布需用户显式执行 npm publish

### 5.2 数据安全
- 敏感字段：`.env`、密钥、证书、npm token、GitHub token、repomix 输出
- 加密要求：不保存敏感数据，不处理网络上传

### 5.3 审计要求
- 日志记录：发布前必须保留 pack dry-run 输出供人工检查
- 操作追踪：不得自动执行 git commit、git push、npm publish

---

## 6. 兼容性

### 6.1 接口兼容性
- 是否向后兼容：是
- 版本控制策略：遵守 semver；同一 name+version 不得复用

### 6.2 数据兼容性
- 数据迁移方案：无持久业务数据
- 回滚策略：使用 npm 版本回退或 git tag 回退

---

> **质量红线检查清单**
> - [x] 每个需求项至少有一个场景
> - [x] 使用「必须」强制要求，而非「应该」「可以」
> - [x] 所有接口参数已量化（类型、必填、范围、示例）
> - [x] 物理约束已量化（并发、超时、性能指标）
> - [x] 错误码已定义
> - [x] **技术选型已包含版本信息**（框架、数据库、缓存、中间件等）
> - [x] 若跳过 proposal.md，影响范围已在此补齐

---

## ADDED Requirements

### Requirement: npm package metadata
The system MUST provide npm package metadata required to publish the DocSync CLI.

#### Scenario: Package metadata is complete
- **WHEN** the user inspects `package.json`
- **THEN** it includes `name="@hunterzheng/docsync"`, `version="0.1.0"`, `type="module"`, `bin.docsync="bin/docsync.mjs"`, `engines.node=">=18"`, repository, bugs, homepage, and license metadata

#### Scenario: Published file whitelist is constrained
- **WHEN** the user runs `npm pack --dry-run`
- **THEN** the package candidate is limited to the allowed bin, src, templates, README, LICENSE, CHANGELOG, and npm-required metadata files

### Requirement: Project documentation
The system MUST include user and agent documentation for installing, using, validating, and maintaining DocSync.

#### Scenario: README is usable
- **WHEN** the user reads README.md
- **THEN** it documents project purpose, installation, quick start, command list, Skill install, Codex rule install, project usage, release notes, safety notes, and license

#### Scenario: AGENTS is usable
- **WHEN** a coding agent reads AGENTS.md
- **THEN** it documents project context, common commands, development rules, verification requirements, and safe editing constraints

### Requirement: Release safety checks
The system MUST provide a release safety workflow that avoids automatic publishing and blocks sensitive files from package candidates.

#### Scenario: Pack dry run
- **WHEN** the user runs `npm run pack:dry`
- **THEN** the system runs `npm pack --dry-run` and prints the package candidate file list for manual review

#### Scenario: Sensitive files are excluded
- **WHEN** a package candidate would include `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`, `*.jks`, token files, `repomix-output.xml`, or test temporary directories
- **THEN** the release safety configuration or manual review blocks publishing until the candidate is corrected

### Requirement: Verification commands
The system MUST provide local verification commands for release readiness.

#### Scenario: Test script
- **WHEN** the user runs `npm test`
- **THEN** the system uses the Node.js built-in test runner to execute the test suite

#### Scenario: Lint script
- **WHEN** the user runs `npm run lint`
- **THEN** the system performs syntax checks for the CLI entry and main dispatch files using `node --check`
