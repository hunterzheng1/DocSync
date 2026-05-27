# spec.md - 能力规格定义

> **定位**：单个能力（capability）的技术规格定义，用于 `specs/<capability>/spec.md`
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：prep 工作流编排

系统必须通过 `docsync prep` 准备 AI 文档同步上下文，默认依次执行项目初始化、git 状态输出、Repomix 上下文生成和可选 Markdown 格式修复。

##### 场景：默认准备流程

- **当** 用户执行 `docsync prep`
- **预期** 系统必须先执行 init 补齐配置，再尝试输出 git status，再运行 Repomix，再按条件运行 markdownlint-cli2

##### 场景：跳过初始化

- **当** 用户执行 `docsync prep --no-init`
- **预期** 系统必须跳过 init 步骤，并继续后续上下文准备

#### 需求项：Repomix 上下文生成

系统必须检测 `repomix` 命令；存在时运行 Repomix 生成 `repomix-output.xml`，缺失时必须报错并提示安装命令 `npm i -g repomix`。

##### 场景：Repomix 可用

- **当** `repomix` 命令存在且用户执行 `docsync prep`
- **预期** 系统必须运行 `repomix` 并在成功后继续后续步骤

##### 场景：压缩上下文

- **当** 用户执行 `docsync prep --compress`
- **预期** 系统必须运行 `repomix --compress`

##### 场景：Repomix 缺失

- **当** `repomix` 命令不存在
- **预期** 系统必须输出安装提示，并以退出码 1 结束

#### 需求项：Markdown 格式修复

系统必须在未传入 `--no-lint` 且 `markdownlint-cli2` 可用时运行 `markdownlint-cli2 --fix`；若该工具缺失，系统必须提示但不得失败。

##### 场景：markdownlint 可用

- **当** `markdownlint-cli2` 命令存在且未传入 `--no-lint`
- **预期** 系统必须运行 `markdownlint-cli2 --fix`

##### 场景：跳过 lint

- **当** 用户执行 `docsync prep --no-lint`
- **预期** 系统必须不运行 markdownlint-cli2

##### 场景：markdownlint 缺失

- **当** `markdownlint-cli2` 命令不存在
- **预期** 系统必须输出可选工具缺失提示，并以退出码 0 继续或结束

#### 需求项：git 状态输出

系统必须在 git 可用且目标目录是 git 仓库时输出 `git status --short`，用于帮助 AI 判断当前变更范围。

##### 场景：git 仓库

- **当** 当前目录是 git 仓库且 `git` 命令存在
- **预期** 系统必须输出 `git status --short` 的结果

##### 场景：非 git 仓库或 git 缺失

- **当** 当前目录不是 git 仓库或 `git` 缺失
- **预期** 系统必须输出提示，且不得因此阻塞 prep

### 修改需求

无。

### 移除需求

无。

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### 接口基本信息

- **路径**：本地 CLI `docsync prep`
- **方法**：命令行调用
- **内容类型**：stdout/stderr 文本输出 + 本地文件生成

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 | 约束条件 |
|-------|------|------|------|--------|----------|
| --cwd | string | 否 | 准备上下文的项目目录 | `--cwd ./demo` | 默认当前目录 |
| --compress | boolean | 否 | 使用 Repomix 压缩模式 | `--compress` | 默认 false |
| --no-lint | boolean | 否 | 跳过 markdownlint-cli2 | `--no-lint` | 默认 false |
| --no-init | boolean | 否 | 跳过 init | `--no-init` | 默认 false |
| --dry-run | boolean | 否 | 输出计划动作 | `--dry-run` | 必须不得运行外部写入命令 |
| --verbose | boolean | 否 | 输出详细命令 | `--verbose` | 默认 false |

#### 响应结构

**成功响应 (exit 0)**

```json
{
  "init": "created|skipped|disabled",
  "gitStatus": "printed|skipped",
  "repomix": "completed",
  "markdownlint": "completed|skipped|missing"
}
```

**错误响应**

```json
{
  "code": 1,
  "message": "repomix is required. Install with: npm i -g repomix",
  "data": null
}
```

#### 错误码定义

| 错误码 | 含义 | 触发条件 |
|-------|------|----------|
| 0 | 成功 | 上下文准备完成；markdownlint 缺失不算失败 |
| 1 | 必需工具缺失或执行失败 | repomix 缺失、repomix 执行失败、init 写入失败 |
| 2 | 参数错误 | 非法 cwd 或参数缺值 |

---

## 3. 物理约束

### 3.1 性能约束

| 指标 | 约束值 | 说明 |
|------|-------|------|
| 编排开销 | < 1000 毫秒 (P95) | 不含 Repomix/markdownlint 外部命令时间 |
| 外部命令串行度 | 1 | 必须按流程顺序执行 |
| 并发数 | 单进程 1 个 prep | 不支持同目录并发生成 |

### 3.2 资源约束

| 资源 | 限制 | 说明 |
|------|------|------|
| 内存 | < 120 MB | 不把 repomix-output 全量读入内存 |
| CPU | < 1 个核心 | 编排层轻量 |
| 存储 | 由 Repomix 输出决定，默认目标 `repomix-output.xml` | CLI 不额外复制该文件 |

### 3.3 超时配置

- 连接超时：0 毫秒（不使用网络）
- 读取超时：2000 毫秒（读取配置和模板）
- 总超时：0 毫秒（外部命令不在第一版强制超时，由用户中断）

---

## 4. 影响模块

### 4.1 内部依赖

- [ ] `src/commands/prep.mjs`：prep 编排入口
- [ ] `src/commands/init.mjs`：初始化复用
- [ ] `src/utils/shell.mjs`：外部命令检测与执行
- [ ] `src/utils/git.mjs`：git 仓库状态辅助
- [ ] `src/utils/logger.mjs`：状态输出
- [ ] `templates/project/repomix.config.json`：Repomix 默认配置

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|---------|
| 运行时 | Node.js | >=18 | 执行 CLI | 不支持低版本 |
| 包管理器 | npm | >=9 | 安装外部工具提示 | 缺失时 doctor 处理 |
| 外部命令 | repomix | 用户安装版本（doctor 输出实际版本） | 生成仓库上下文 | 缺失时 prep 失败并提示安装 |
| 外部命令 | markdownlint-cli2 | 用户安装版本（doctor 输出实际版本） | Markdown 自动修复 | 缺失时提示但不失败 |
| 外部命令 | git | 用户安装版本 | 输出 status | 缺失时提示但不失败 |

### 4.3 数据存储

- [ ] 数据库（版本 N/A）：无数据库读写
- [ ] 缓存（版本 N/A）：无缓存读写
- [ ] 本地文件系统：生成或更新 `repomix-output.xml`，可能更新 Markdown 格式

---

## 5. 安全与合规

### 5.1 权限要求

- 认证方式：无
- 授权范围：当前用户对项目目录的读写权限

### 5.2 数据安全

- 敏感字段：`.env`、密钥、证书、token 文件必须由 Repomix ignore 模板排除
- 加密要求：无网络传输；不加密本地生成文件

### 5.3 审计要求

- 日志记录：必须输出每个步骤的执行、跳过或失败状态
- 操作追踪：必须提示 `repomix-output.xml` 是生成文件，不得提交

---

## 6. 兼容性

### 6.1 接口兼容性

- 是否向后兼容：是
- 版本控制策略：新增 prep 参数不得改变默认步骤顺序

### 6.2 数据兼容性

- 数据迁移方案：无数据库迁移
- 回滚策略：通过 git 恢复被 markdownlint 修复的 Markdown 文件

---

> **质量红线检查清单**
>
> - [x] 每个需求项至少有一个场景
> - [x] 使用「必须」强制要求，而非「应该」「可以」
> - [x] 所有接口参数已量化（类型、必填、范围、示例）
> - [x] 物理约束已量化（并发、超时、性能指标）
> - [x] 错误码已定义
> - [x] **技术选型已包含版本信息**（框架、数据库、缓存、中间件等）
> - [x] 若跳过 proposal.md，影响范围已在此补齐

---

## ADDED Requirements

### Requirement: Context preparation orchestration

The system MUST provide `docsync prep` to prepare project context for document synchronization.

#### Scenario: Prep runs initialization first

- **WHEN** the user runs `docsync prep` without `--no-init`
- **THEN** the system runs the project initialization workflow before context generation

#### Scenario: Prep can skip initialization

- **WHEN** the user runs `docsync prep --no-init`
- **THEN** the system skips project initialization and continues with the remaining prep steps

### Requirement: Repomix context generation

The system MUST invoke or guide Repomix context generation without bundling Repomix as a runtime dependency.

#### Scenario: Repomix is available

- **WHEN** the Repomix command is available and the user runs `docsync prep`
- **THEN** the system generates the configured context output and reports its path

#### Scenario: Repomix is missing

- **WHEN** the Repomix command is missing and the user runs `docsync prep`
- **THEN** the system prints an install or npx fallback hint and exits with a clear failure status for required context generation

### Requirement: Markdown formatting integration

The system MUST support optional markdownlint-cli2 formatting during prep.

#### Scenario: Markdown fix is enabled

- **WHEN** markdownlint-cli2 is available and lint fixing is enabled
- **THEN** the system runs the configured markdown formatting step and reports the result

#### Scenario: Dry run performs no writes

- **WHEN** the user runs `docsync prep --dry-run`
- **THEN** the system reports planned init, Repomix, and markdownlint actions without creating `repomix-output.xml` or modifying Markdown files
