# spec.md - 能力规格定义

> **定位**：单个能力（capability）的技术规格定义，用于 `specs/<capability>/spec.md`
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：环境工具检测

系统必须通过 `docsync doctor` 检测必需工具 Node.js、npm，以及推荐工具 git、repomix、markdownlint-cli2、claude、codex、gh。

##### 场景：必需工具齐全

- **当** Node.js 和 npm 可用
- **预期** 系统必须输出二者 ok 状态和版本信息

##### 场景：推荐工具缺失

- **当** repomix 或 claude 缺失
- **预期** 系统必须输出 missing 状态，但不得因此返回失败退出码

##### 场景：必需工具缺失

- **当** npm 缺失
- **预期** 系统必须输出 missing 状态，并以退出码 1 结束

#### 需求项：全局规则安装状态检测

系统必须检测 Claude Skill 文件 `~/.claude/skills/doc-sync/SKILL.md` 和 Codex 全局文件 `~/.codex/AGENTS.md` 的存在状态。

##### 场景：全局文件存在

- **当** 目标文件存在
- **预期** 系统必须输出 installed 或 present 状态

##### 场景：全局文件缺失

- **当** 目标文件不存在
- **预期** 系统必须输出 missing 状态，并提示可用安装命令

#### 需求项：状态输出格式

系统必须以清晰、可读、稳定的文本格式输出每个检查项，不得因为缺少可选工具而中断后续检查。

##### 场景：混合状态输出

- **当** 部分工具 ok、部分工具 missing
- **预期** 系统必须完整输出所有检查项，并在末尾给出摘要

### 修改需求

无。

### 移除需求

无。

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### 接口基本信息

- **路径**：本地 CLI `docsync doctor`
- **方法**：命令行调用
- **内容类型**：stdout/stderr 文本输出

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 | 约束条件 |
|-------|------|------|------|--------|----------|
| --cwd | string | 否 | 用于上下文检测的目录 | `--cwd ./demo` | 默认当前目录 |
| --verbose | boolean | 否 | 输出命令路径或检测细节 | `--verbose` | 默认 false |
| --quiet | boolean | 否 | 仅输出摘要 | `--quiet` | 默认 false |

#### 响应结构

**成功响应 (exit 0)**

```json
{
  "required": {
    "node": "ok",
    "npm": "ok"
  },
  "recommended": {
    "git": "ok|missing",
    "repomix": "ok|missing"
  },
  "globalFiles": {
    "claudeSkill": "installed|missing",
    "codexAgents": "installed|missing"
  }
}
```

**错误响应**

```json
{
  "code": 1,
  "message": "required tool missing: npm",
  "data": null
}
```

#### 错误码定义

| 错误码 | 含义 | 触发条件 |
|-------|------|----------|
| 0 | 检测完成且必需工具可用 | 可选工具可能缺失 |
| 1 | 必需工具缺失 | node 或 npm 缺失 |
| 2 | 参数错误 | cwd 非法或不可访问 |

---

## 3. 物理约束

### 3.1 性能约束

| 指标 | 约束值 | 说明 |
|------|-------|------|
| 检测总耗时 | < 3000 毫秒 (P95) | 常规本机环境 |
| 单工具检测耗时 | < 500 毫秒 (P95) | 使用命令探测 |
| 并发数 | 单进程 1 次检测 | 可顺序检测 |

### 3.2 资源约束

| 资源 | 限制 | 说明 |
|------|------|------|
| 内存 | < 80 MB | 不读取大型文件 |
| CPU | < 1 个核心 | 命令探测为主 |
| 存储 | 0 MB 新增 | doctor 不写文件 |

### 3.3 超时配置

- 连接超时：0 毫秒（不使用网络）
- 读取超时：1000 毫秒（检测全局文件）
- 总超时：5000 毫秒

---

## 4. 影响模块

### 4.1 内部依赖

- [ ] `src/commands/doctor.mjs`：环境检测入口
- [ ] `src/utils/shell.mjs`：命令存在与版本检测
- [ ] `src/utils/paths.mjs`：home 路径解析
- [ ] `src/utils/logger.mjs`：格式化状态输出
- [ ] `test/doctor.test.mjs`：缺少可选工具时不崩溃

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|---------|
| 运行时 | Node.js | >=18 | 必需工具 | 缺失时无法运行 CLI |
| 包管理器 | npm | >=9 | 必需工具 | 缺失时 doctor 返回失败 |
| 外部命令 | git | 用户安装版本（doctor 输出实际版本） | 推荐工具检测 | missing 不失败 |
| 外部命令 | repomix | 用户安装版本（doctor 输出实际版本） | 推荐工具检测 | missing 不失败 |
| 外部命令 | markdownlint-cli2 | 用户安装版本（doctor 输出实际版本） | 推荐工具检测 | missing 不失败 |
| 外部命令 | claude | 用户安装版本（doctor 输出实际版本） | 推荐工具检测 | missing 不失败 |
| 外部命令 | codex | 用户安装版本（doctor 输出实际版本） | 推荐工具检测 | missing 不失败 |
| 外部命令 | gh | 用户安装版本（doctor 输出实际版本） | 推荐工具检测 | missing 不失败 |

### 4.3 数据存储

- [ ] 数据库（版本 N/A）：无数据库读写
- [ ] 缓存（版本 N/A）：无缓存读写
- [ ] 本地文件系统：只读检查全局 Skill 与 AGENTS 文件

---

## 5. 安全与合规

### 5.1 权限要求

- 认证方式：无
- 授权范围：读取当前用户 home 下指定路径的存在状态

### 5.2 数据安全

- 敏感字段：doctor 不得读取或输出 token、密钥、配置内容
- 加密要求：无网络传输

### 5.3 审计要求

- 日志记录：必须输出每项状态和总体结论
- 操作追踪：doctor 不得产生持久化审计文件

---

## 6. 兼容性

### 6.1 接口兼容性

- 是否向后兼容：是
- 版本控制策略：新增检测项不得改变必需/可选工具判定

### 6.2 数据兼容性

- 数据迁移方案：无持久数据
- 回滚策略：无

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

### Requirement: Environment diagnostics

The system MUST provide `docsync doctor` to check required and recommended local tools.

#### Scenario: Required tools are present

- **WHEN** Node.js and npm meet the required version constraints
- **THEN** the system reports them as installed with detected versions

#### Scenario: Required tool is missing

- **WHEN** a required tool is missing or below the supported version
- **THEN** the system reports the failure and exits with code 1

### Requirement: Recommended tool reporting

The system MUST report optional tool status without failing the doctor command solely because recommended tools are absent.

#### Scenario: Recommended tools are missing

- **WHEN** git, Repomix, markdownlint-cli2, Claude, Codex, or gh are missing and no required tool fails
- **THEN** the system prints install guidance and exits with code 0

### Requirement: Global rule status checks

The system MUST report whether DocSync Claude Skill and Codex AGENTS marker block are installed.

#### Scenario: Global rule files are present

- **WHEN** `~/.claude/skills/doc-sync/SKILL.md` and `~/.codex/AGENTS.md` contain the expected DocSync content
- **THEN** the system reports the corresponding global rule status as installed

#### Scenario: Global rule files are missing

- **WHEN** either global rule target is missing
- **THEN** the system reports the status as missing and suggests the matching `docsync skill install` or `docsync codex install` command
