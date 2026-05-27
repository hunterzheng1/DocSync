# spec.md - 能力规格定义

> **定位**：单个能力（capability）的技术规格定义，用于 `specs/<capability>/spec.md`
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：npm CLI 包入口

系统必须以 npm 包形式暴露固定命令 `docsync`，并通过 Node.js ESM 入口把命令行参数传递给主分发模块。

##### 场景：通过 bin 入口启动

- **当** 用户执行 `node bin/docsync.mjs help`
- **预期** 系统必须调用主分发模块并输出帮助信息，退出码为 0

##### 场景：入口异常处理

- **当** 主分发模块抛出异常
- **预期** 系统必须向 stderr 输出错误消息，并以非 0 退出码结束

#### 需求项：命令路由

系统必须识别 `init`、`prep`、`ai`、`auto`、`doctor`、`skill`、`codex`、`version`、`help`、`--version`、`-v`、`--help`、`-h`，并把命令分发到对应处理器。

##### 场景：已知命令分发

- **当** 用户执行 `docsync doctor`
- **预期** 系统必须调用 doctor 处理器，且不得调用其他命令处理器

##### 场景：默认帮助

- **当** 用户不传入任何命令
- **预期** 系统必须等价执行 `help` 并以退出码 0 结束

##### 场景：未知命令

- **当** 用户执行 `docsync unknown`
- **预期** 系统必须输出未知命令提示和帮助信息，并以退出码 1 结束

#### 需求项：通用参数解析

系统必须解析通用参数 `--force`、`--backup`、`--dry-run`、`--verbose`、`--quiet`、`--cwd <path>`，并把结果作为结构化 options 传递给命令处理器。

##### 场景：布尔参数解析

- **当** 用户执行 `docsync init --force --backup`
- **预期** 系统必须传递 `force=true` 与 `backup=true`

##### 场景：带值参数解析

- **当** 用户执行 `docsync init --cwd ./demo`
- **预期** 系统必须传递 `cwd="./demo"`

### 修改需求

无。

### 移除需求

无。

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### 接口基本信息

- **路径**：本地 CLI `docsync`
- **方法**：命令行调用
- **内容类型**：stdout/stderr 文本输出

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 | 约束条件 |
|-------|------|------|------|--------|----------|
| command | string | 否 | 一级命令；缺省时使用 `help` | `doctor` | 允许值：`init/prep/ai/auto/doctor/skill/codex/version/help/--version/-v/--help/-h` |
| rest | string[] | 否 | 子命令或命令专属参数 | `["install"]` | 保持顺序传递给命令处理器 |
| --force | boolean | 否 | 允许覆盖已有文件 | `--force` | 默认 false |
| --backup | boolean | 否 | 覆盖前备份 | `--backup` | 默认 false |
| --dry-run | boolean | 否 | 只打印计划动作 | `--dry-run` | 默认 false |
| --verbose | boolean | 否 | 输出详细日志 | `--verbose` | 默认 false；与 quiet 同时出现时命令设计阶段必须定义优先级 |
| --quiet | boolean | 否 | 减少输出 | `--quiet` | 默认 false |
| --cwd | string | 否 | 指定工作目录 | `--cwd ./demo` | 必须可解析为本地路径 |

#### 响应结构

**成功响应 (exit 0)**

```json
{
  "exitCode": 0,
  "stdout": "命令输出",
  "stderr": ""
}
```

**错误响应**

```json
{
  "exitCode": 1,
  "stdout": "可选帮助信息",
  "stderr": "错误描述"
}
```

#### 错误码定义

| 错误码 | 含义 | 触发条件 |
|-------|------|----------|
| 0 | 成功 | 命令完成且无阻塞错误 |
| 1 | 通用失败 | 未知命令、命令执行异常、必需依赖缺失 |
| 2 | 参数错误 | 参数缺值、非法参数组合或非法子命令 |

---

## 3. 物理约束

### 3.1 性能约束

| 指标 | 约束值 | 说明 |
|------|-------|------|
| 启动响应时间 | < 500 毫秒 (P95) | 不包含外部命令执行时间 |
| 命令路由耗时 | < 50 毫秒 (P95) | 仅参数解析与分发 |
| 并发数 | 单进程 1 个命令 | CLI 每次调用独立进程 |

### 3.2 资源约束

| 资源 | 限制 | 说明 |
|------|------|------|
| 内存 | < 80 MB | help/version/路由类命令 |
| CPU | < 1 个核心 | 不做常驻服务 |
| 存储 | < 1 MB | 路由能力自身不生成持久文件 |

### 3.3 超时配置

- 连接超时：0 毫秒（不使用网络连接）
- 读取超时：0 毫秒（不读取外部流式输入）
- 总超时：5000 毫秒（路由层自检上限，不包含子命令）

---

## 4. 影响模块

### 4.1 内部依赖

- [ ] `package.json`：提供 `bin`、`type`、`engines`、scripts 元数据
- [ ] `bin/docsync.mjs`：CLI 入口
- [ ] `src/cli.mjs`：主分发逻辑
- [ ] `src/utils/args.mjs`：通用参数解析
- [ ] `src/commands/help.mjs`：帮助输出
- [ ] `src/commands/version.mjs`：版本输出

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|---------|
| 运行时 | Node.js | >=18 | 执行 ESM CLI | 低于版本时提示升级并退出 |
| 包管理器 | npm | >=9 | 安装、link、pack、发布 | 缺失时 doctor 报必需工具失败 |
| 模块系统 | ECMAScript Modules | Node.js >=18 内置 | 使用 `import/export` | 不提供 CommonJS 降级 |
| 第三方 SDK | 无 | N/A | 保持轻量 | N/A |

### 4.3 数据存储

- [ ] 数据库（版本 N/A）：无数据库读写
- [ ] 缓存（版本 N/A）：无缓存读写

---

## 5. 安全与合规

### 5.1 权限要求

- 认证方式：无
- 授权范围：仅当前用户本地 CLI 执行权限

### 5.2 数据安全

- 敏感字段：无
- 加密要求：无网络传输，无加密存储需求

### 5.3 审计要求

- 日志记录：命令失败必须输出错误消息；verbose 模式必须输出分发路径
- 操作追踪：路由层不得写入持久审计文件

---

## 6. 兼容性

### 6.1 接口兼容性

- 是否向后兼容：是
- 版本控制策略：`docsync` 命令名保持稳定；新增命令不得改变既有命令语义

### 6.2 数据兼容性

- 数据迁移方案：无持久数据
- 回滚策略：回滚 npm 包版本或使用本地 git 版本

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

### Requirement: CLI command routing

The system MUST provide a Node.js ESM `docsync` CLI entrypoint that routes supported commands and returns predictable exit codes.

#### Scenario: Help command is displayed

- **WHEN** the user runs `docsync help` or runs `docsync` without a command
- **THEN** the system displays help text that lists all supported top-level commands and exits with code 0

#### Scenario: Unknown command is rejected

- **WHEN** the user runs `docsync unknown`
- **THEN** the system prints an error message, suggests `docsync help`, and exits with code 2

### Requirement: Shared argument parsing

The system MUST parse shared boolean and value flags consistently across command modules.

#### Scenario: Boolean flags are parsed

- **WHEN** the user passes `--force --backup --dry-run --verbose`
- **THEN** the parser returns true boolean values for those flags without treating them as positional arguments

#### Scenario: Value flags are parsed

- **WHEN** the user passes `--cwd ./demo --docs readme,agents --extra "check commands"`
- **THEN** the parser returns the provided values exactly once under their normalized option names

### Requirement: Version and bin behavior

The system MUST expose a package bin entrypoint and version command for npm usage.

#### Scenario: Version command succeeds

- **WHEN** the user runs `docsync version`, `docsync --version`, or `docsync -v`
- **THEN** the system prints the package version and exits with code 0
