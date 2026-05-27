# spec.md - 能力规格定义

> **定位**：单个能力（capability）的技术规格定义，用于 `specs/<capability>/spec.md`
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：AI prompt 构建

系统必须基于仓库事实构建文档同步 prompt，要求 AI 最小化更新 README.md、AGENTS.md、CLAUDE.md，并禁止编造命令、端口、环境变量、API、模块或部署步骤。

##### 场景：默认 prompt

- **当** 用户执行 `docsync ai`
- **预期** 系统必须构建包含文档职责、事实来源、禁止编造、TODO(review)、markdownlint 修复和结果报告要求的 prompt

##### 场景：限定文档范围

- **当** 用户执行 `docsync ai --docs readme,agents`
- **预期** 系统必须在 prompt 中限定同步范围为 README.md 和 AGENTS.md

##### 场景：追加要求

- **当** 用户执行 `docsync ai --extra "重点检查 Maven 命令"`
- **预期** 系统必须把 extra 文本作为附加约束并保留原有硬规则

#### 需求项：交互 AI 工作流

系统必须通过 `docsync ai` 先执行 prep，再检测 `claude` 命令；若存在则启动 Claude Code 交互会话，若不存在则打印可复制 prompt 并以退出码 0 结束。

##### 场景：Claude Code 可用

- **当** `claude` 命令存在且 prep 成功
- **预期** 系统必须执行 `claude "<prompt>"` 或等效交互调用

##### 场景：Claude Code 缺失

- **当** `claude` 命令不存在且 prep 成功
- **预期** 系统必须打印完整 prompt，并以退出码 0 结束

##### 场景：prep 失败

- **当** prep 因 Repomix 缺失或执行失败而失败
- **预期** 系统必须停止 AI 工作流，并返回 prep 的失败退出码

#### 需求项：自动 AI 工作流

系统必须提供实验性的 `docsync auto`，用于非交互执行小范围文档更新，并默认限制可用工具和危险行为。

##### 场景：auto dry-run

- **当** 用户执行 `docsync auto --dry-run`
- **预期** 系统必须只打印将执行的 Claude Code print mode 命令，不实际启动 Claude

##### 场景：auto 工具限制

- **当** 用户执行 `docsync auto`
- **预期** 系统必须限制 allowedTools，不得允许 git commit、rm、curl/wget、npm publish 或 credential 文件修改

### 修改需求

无。

### 移除需求

无。

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### 接口基本信息

- **路径**：本地 CLI `docsync ai`、`docsync auto`
- **方法**：命令行调用
- **内容类型**：stdout/stderr 文本输出 + 外部 Claude 命令调用

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 | 约束条件 |
|-------|------|------|------|--------|----------|
| command | string | 是 | AI 工作流命令 | `ai` | 允许值：`ai`、`auto` |
| --docs | string | 否 | 文档范围列表 | `--docs readme,agents,claude` | 逗号分隔；未知值必须提示参数错误 |
| --extra | string | 否 | 附加用户要求 | `--extra "重点检查 Maven"` | 必须原样并入 prompt |
| --compress | boolean | 否 | 传递给 prep | `--compress` | 默认 false |
| --no-lint | boolean | 否 | 传递给 prep | `--no-lint` | 默认 false |
| --no-init | boolean | 否 | 传递给 prep | `--no-init` | 默认 false |
| --dry-run | boolean | 否 | auto 预演 | `--dry-run` | 对 `ai` 可仅打印流程计划 |

#### 响应结构

**成功响应 (exit 0)**

```json
{
  "prep": "completed",
  "claude": "launched|missing",
  "prompt": "printed|passed-to-claude"
}
```

**错误响应**

```json
{
  "code": 1,
  "message": "prep failed",
  "data": null
}
```

#### 错误码定义

| 错误码 | 含义 | 触发条件 |
|-------|------|----------|
| 0 | 成功 | Claude 启动成功，或 fallback prompt 打印成功 |
| 1 | 前置流程失败 | prep 失败、Claude 调用失败 |
| 2 | 参数错误 | `--docs` 包含未知范围、`--extra` 缺值 |

---

## 3. 物理约束

### 3.1 性能约束

| 指标 | 约束值 | 说明 |
|------|-------|------|
| prompt 构建耗时 | < 100 毫秒 (P95) | 不读取大型 repomix 输出内容 |
| prompt 大小 | < 16 KB | 避免 shell 参数过长；设计阶段可调整为临时文件策略 |
| 并发数 | 单进程 1 个 AI 工作流 | 同目录不并发 |

### 3.2 资源约束

| 资源 | 限制 | 说明 |
|------|------|------|
| 内存 | < 120 MB | prompt 构建轻量 |
| CPU | < 1 个核心 | 编排外部命令为主 |
| 存储 | < 1 MB | AI 编排自身不写持久文件 |

### 3.3 超时配置

- 连接超时：0 毫秒（CLI 不直接访问网络）
- 读取超时：2000 毫秒（读取配置或 package 元数据）
- 总超时：0 毫秒（Claude 交互由用户控制）

---

## 4. 影响模块

### 4.1 内部依赖

- [ ] `src/commands/ai.mjs`：交互工作流
- [ ] `src/commands/auto.mjs`：非交互工作流
- [ ] `src/commands/prep.mjs`：上下文准备前置
- [ ] `src/utils/prompt.mjs`：prompt 构建
- [ ] `src/utils/shell.mjs`：Claude 命令检测与调用
- [ ] `test/prompt.test.mjs`：prompt 规则测试

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|---------|
| 运行时 | Node.js | >=18 | 执行 CLI | 不支持低版本 |
| 外部命令 | claude | 用户安装版本（doctor 输出实际版本） | 启动 Claude Code | 缺失时打印 prompt |
| 外部命令 | repomix | 用户安装版本（doctor 输出实际版本） | prep 前置 | 缺失时工作流失败 |
| 外部命令 | markdownlint-cli2 | 用户安装版本（doctor 输出实际版本） | prep 可选格式修复 | 缺失时提示但不失败 |
| 第三方 SDK | 无 | N/A | 不内置 LLM API | N/A |

### 4.3 数据存储

- [ ] 数据库（版本 N/A）：无数据库读写
- [ ] 缓存（版本 N/A）：无缓存读写
- [ ] 本地文件系统：AI 编排自身不写持久文件，prep 可能生成 `repomix-output.xml`

---

## 5. 安全与合规

### 5.1 权限要求

- 认证方式：不由 DocSync 管理；Claude Code 自身认证由用户环境负责
- 授权范围：当前用户本地命令执行权限

### 5.2 数据安全

- 敏感字段：prompt 必须包含“不包含 secrets/token、不编造凭据”的硬规则
- 加密要求：DocSync 不上传源码；不管理网络传输加密

### 5.3 审计要求

- 日志记录：必须报告 changed files、changed sections、facts used、TODO(review)、commands run 的要求
- 操作追踪：auto 模式必须打印醒目实验性提示和工具限制

---

## 6. 兼容性

### 6.1 接口兼容性

- 是否向后兼容：是
- 版本控制策略：`docsync ai` 作为推荐日常命令保持稳定

### 6.2 数据兼容性

- 数据迁移方案：无持久数据
- 回滚策略：AI 修改文档后通过 git diff 和版本控制回滚

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

### Requirement: Document sync prompt construction

The system MUST construct a conservative document synchronization prompt from prepared project context and user options.

#### Scenario: Prompt includes hard safety rules

- **WHEN** the system builds the default document sync prompt
- **THEN** the prompt includes rules that prohibit invented commands, hidden token handling, automatic git commit, automatic publish, and destructive operations

#### Scenario: User docs and extra instructions are included

- **WHEN** the user passes `--docs readme,agents --extra "check commands"`
- **THEN** the system includes those document targets and additional instructions without removing the hard safety rules

### Requirement: AI command orchestration

The system MUST provide `docsync ai` to prepare context and launch Claude Code when available.

#### Scenario: Claude Code is available

- **WHEN** prep succeeds and Claude Code is available
- **THEN** the system launches Claude Code with the generated prompt or writes the prompt to the configured handoff channel

#### Scenario: Claude Code is missing

- **WHEN** prep succeeds but Claude Code is not available
- **THEN** the system prints a copyable prompt fallback and exits successfully

### Requirement: Auto workflow guardrails

The system MUST provide a guarded `docsync auto` workflow for experimental automation.

#### Scenario: Auto dry run

- **WHEN** the user runs `docsync auto --dry-run`
- **THEN** the system prints the planned Claude invocation and tool restrictions without starting Claude Code

#### Scenario: Dangerous tools are excluded

- **WHEN** the system builds the auto workflow configuration
- **THEN** destructive tools and commands such as git commit, git push, npm publish, rm, curl, and wget are not included in the allowed automation set
