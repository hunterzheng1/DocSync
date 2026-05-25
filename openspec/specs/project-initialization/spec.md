# spec.md - 能力规格定义

> **定位**：单个能力（capability）的技术规格定义，用于 `specs/<capability>/spec.md`
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：项目模板初始化

系统必须通过 `docsync init` 在目标项目中补齐文档同步配置文件：`repomix.config.json`、`.repomixignore`、`.markdownlint-cli2.jsonc`、`docs/doc-sync-rules.md`。

##### 场景：空目录初始化
- **当** 用户在无上述配置文件的目录中执行 `docsync init`
- **预期** 系统必须创建 4 个目标文件，并输出创建文件列表

##### 场景：非 git 仓库初始化
- **当** 当前目录不是 git 仓库且用户执行 `docsync init`
- **预期** 系统必须允许初始化，并输出非 git 仓库提示

#### 需求项：默认不覆盖

系统必须默认保留用户已有文件，只有文件不存在时才写入模板。

##### 场景：重复初始化
- **当** 用户第二次执行 `docsync init`
- **预期** 系统必须跳过已存在文件，不得改变其内容，并输出跳过列表

##### 场景：部分文件缺失
- **当** 目标项目已有 `.repomixignore` 但缺少其他模板文件
- **预期** 系统必须只创建缺失文件，并跳过 `.repomixignore`

#### 需求项：显式覆盖与备份

系统必须在传入 `--force` 时允许覆盖已有文件，并在同时传入 `--backup` 时先创建 `.bak.<timestamp>` 备份。

##### 场景：强制覆盖
- **当** 用户执行 `docsync init --force`
- **预期** 系统必须用模板内容覆盖已有目标文件，并输出覆盖列表

##### 场景：覆盖前备份
- **当** 用户执行 `docsync init --force --backup`
- **预期** 系统必须先为每个被覆盖文件创建备份，再写入模板内容

#### 需求项：dry-run 初始化

系统必须在 `--dry-run` 模式下只输出将创建、跳过或覆盖的文件，不得写入或修改任何文件。

##### 场景：预演初始化
- **当** 用户执行 `docsync init --dry-run`
- **预期** 系统必须输出计划动作，且目标目录文件数量保持不变

### 修改需求

无。

### 移除需求

无。

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### 接口基本信息
- **路径**：本地 CLI `docsync init`
- **方法**：命令行调用
- **内容类型**：stdout/stderr 文本输出 + 本地文件写入

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 | 约束条件 |
|-------|------|------|------|--------|----------|
| --cwd | string | 否 | 初始化目标目录 | `--cwd ./demo` | 默认当前工作目录；必须可访问 |
| --force | boolean | 否 | 覆盖已有文件 | `--force` | 默认 false |
| --backup | boolean | 否 | 覆盖前备份 | `--backup` | 仅对实际覆盖文件生效 |
| --dry-run | boolean | 否 | 只输出计划动作 | `--dry-run` | 默认 false；启用后不得写文件 |
| --verbose | boolean | 否 | 输出详细路径 | `--verbose` | 默认 false |
| --quiet | boolean | 否 | 减少输出 | `--quiet` | 默认 false |

#### 响应结构

**成功响应 (exit 0)**
```json
{
  "created": ["repomix.config.json"],
  "skipped": [".repomixignore"],
  "overwritten": [],
  "backups": []
}
```

**错误响应**
```json
{
  "code": 1,
  "message": "无法写入目标目录",
  "data": null
}
```

#### 错误码定义
| 错误码 | 含义 | 触发条件 |
|-------|------|----------|
| 0 | 成功 | 初始化完成或 dry-run 完成 |
| 1 | 文件系统失败 | 目录不可访问、写入失败、备份失败 |
| 2 | 参数错误 | `--cwd` 缺值或路径非法 |

---

## 3. 物理约束

### 3.1 性能约束
| 指标 | 约束值 | 说明 |
|------|-------|------|
| 初始化耗时 | < 1000 毫秒 (P95) | 目标文件 4 个、普通本地磁盘 |
| 单文件写入大小 | < 100 KB | 模板文件均为小文本 |
| 并发数 | 单进程 1 个初始化操作 | 不保证多个进程同时写同一目录 |

### 3.2 资源约束
| 资源 | 限制 | 说明 |
|------|------|------|
| 内存 | < 100 MB | 含模板读取 |
| CPU | < 1 个核心 | 文件复制为主 |
| 存储 | < 1 MB | 不含用户备份数量累积 |

### 3.3 超时配置
- 连接超时：0 毫秒（不使用网络）
- 读取超时：2000 毫秒（读取模板文件）
- 总超时：5000 毫秒

---

## 4. 影响模块

### 4.1 内部依赖
- [ ] `src/commands/init.mjs`：初始化命令入口
- [ ] `src/utils/paths.mjs`：解析 cwd、模板目录、路径拼接
- [ ] `src/utils/fs.mjs`：安全写入、备份、目录创建
- [ ] `templates/project/**`：初始化模板源
- [ ] `test/init.test.mjs`：初始化行为测试
- [ ] `test/fs.test.mjs`：安全写入行为测试

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|---------|
| 运行时 | Node.js | >=18 | 文件系统 API 与 ESM | 低版本不支持 |
| 包管理器 | npm | >=9 | 安装 CLI 后运行 | 初始化能力不直接调用 npm |
| 外部命令 | git | 用户本机版本 | 检测是否为 git 仓库 | 缺失时仅提示，不阻塞 init |
| 第三方 SDK | 无 | N/A | 保持轻量 | N/A |

### 4.3 数据存储
- [ ] 数据库（版本 N/A）：无数据库读写
- [ ] 缓存（版本 N/A）：无缓存读写
- [ ] 本地文件系统：写入 4 个模板文件，可选写入备份文件

---

## 5. 安全与合规

### 5.1 权限要求
- 认证方式：无
- 授权范围：当前用户对目标目录的读写权限

### 5.2 数据安全
- 敏感字段：`.env`、密钥文件路径仅写入 ignore 模板，不读取内容
- 加密要求：无敏感内容写入，无加密要求

### 5.3 审计要求
- 日志记录：必须输出 created/skipped/overwritten/backups 的摘要
- 操作追踪：dry-run 必须明确标记未写入

---

## 6. 兼容性

### 6.1 接口兼容性
- 是否向后兼容：是
- 版本控制策略：新增模板文件不得改变默认不覆盖行为

### 6.2 数据兼容性
- 数据迁移方案：已有用户配置默认保留
- 回滚策略：使用 `.bak.<timestamp>` 备份或版本控制恢复

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

### Requirement: Project template initialization
The system MUST install DocSync project templates into a target project directory.

#### Scenario: Empty project is initialized
- **WHEN** the user runs `docsync init --cwd <project>` in a directory without DocSync files
- **THEN** the system creates the configured Repomix, markdownlint, CLAUDE, and project AGENTS template files and reports them as created

#### Scenario: Custom cwd is honored
- **WHEN** the user passes `--cwd ./demo`
- **THEN** the system resolves all project template targets under `./demo` instead of the process working directory

### Requirement: Existing file protection
The system MUST protect existing project files from accidental overwrite.

#### Scenario: Existing files are skipped by default
- **WHEN** a target file already exists and the user runs `docsync init`
- **THEN** the system leaves the file unchanged and reports the file as skipped

#### Scenario: Force with backup overwrites safely
- **WHEN** a target file exists and the user runs `docsync init --force --backup`
- **THEN** the system writes a backup before replacing the target with the template content

### Requirement: Initialization dry run
The system MUST support a dry-run mode that reports planned initialization work without writing files.

#### Scenario: Dry run writes no files
- **WHEN** the user runs `docsync init --dry-run`
- **THEN** the system prints the planned create, skip, or overwrite actions and does not create or modify target files
