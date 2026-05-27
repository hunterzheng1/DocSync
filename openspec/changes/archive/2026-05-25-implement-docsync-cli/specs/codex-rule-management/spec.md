# spec.md - 能力规格定义

> **定位**：单个能力（capability）的技术规格定义，用于 `specs/<capability>/spec.md`
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：Codex 全局规则安装

系统必须通过 `docsync codex install` 把 DocSync 规则片段安装到 `~/.codex/AGENTS.md`，并使用 `<!-- docsync:start -->` 与 `<!-- docsync:end -->` marker block 管理内容。

##### 场景：目标文件不存在

- **当** `~/.codex/AGENTS.md` 不存在且用户执行 `docsync codex install`
- **预期** 系统必须创建文件并写入完整 DocSync marker block

##### 场景：目标文件存在但无 marker

- **当** `~/.codex/AGENTS.md` 已存在但不包含 DocSync marker
- **预期** 系统必须保留原内容，并追加 DocSync marker block

##### 场景：目标文件已有 marker

- **当** 文件中已存在 DocSync marker block
- **预期** 系统必须更新 marker block 内内容，且不得改动 marker 外用户内容

#### 需求项：Codex 规则更新与路径查询

系统必须提供 `docsync codex update` 更新 marker block，并提供 `docsync codex path` 输出目标文件路径。

##### 场景：更新规则

- **当** 用户执行 `docsync codex update`
- **预期** 系统必须写入最新模板片段，并保留用户自定义内容

##### 场景：路径查询

- **当** 用户执行 `docsync codex path`
- **预期** 系统必须只输出 `~/.codex/AGENTS.md` 的解析路径

#### 需求项：用户内容保护

系统必须在任何 Codex 安装或更新操作中保护 marker block 外的用户已有规则。

##### 场景：用户规则在 marker 前后

- **当** AGENTS.md 中 marker 前后均有用户内容
- **预期** 系统必须只替换 marker 内文本，前后内容逐字保留

### 修改需求

无。

### 移除需求

无。

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### 接口基本信息

- **路径**：本地 CLI `docsync codex <subcommand>`
- **方法**：命令行调用
- **内容类型**：stdout/stderr 文本输出 + 本地文件写入

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 | 约束条件 |
|-------|------|------|------|--------|----------|
| subcommand | string | 是 | codex 子命令 | `install` | 允许值：`install/update/path` |
| --backup | boolean | 否 | 更新前备份 | `--backup` | 默认 false |
| --dry-run | boolean | 否 | 只输出计划动作 | `--dry-run` | 不得写文件 |
| --verbose | boolean | 否 | 输出详细路径 | `--verbose` | 默认 false |

#### 响应结构

**成功响应 (exit 0)**

```json
{
  "subcommand": "install",
  "target": "~/.codex/AGENTS.md",
  "status": "created|inserted|updated|path",
  "preservedUserContent": true
}
```

**错误响应**

```json
{
  "code": 1,
  "message": "Unable to update ~/.codex/AGENTS.md",
  "data": null
}
```

#### 错误码定义

| 错误码 | 含义 | 触发条件 |
|-------|------|----------|
| 0 | 成功 | install/update/path 完成 |
| 1 | 文件系统失败 | 目标目录不可创建、目标文件不可写、备份失败 |
| 2 | 参数错误 | 未知子命令 |

---

## 3. 物理约束

### 3.1 性能约束

| 指标 | 约束值 | 说明 |
|------|-------|------|
| 更新耗时 | < 1000 毫秒 (P95) | AGENTS.md 小于 1 MB |
| marker 查找数量 | 最多 1 对有效 marker | 多对 marker 必须报错或只处理首对，需在设计中明确 |
| 并发数 | 单进程 1 次更新 | 不支持同文件并发写 |

### 3.2 资源约束

| 资源 | 限制 | 说明 |
|------|------|------|
| 内存 | < 100 MB | AGENTS.md 按文本处理 |
| CPU | < 1 个核心 | 字符串更新为主 |
| 存储 | < 100 KB 新增 | 不含备份累积 |

### 3.3 超时配置

- 连接超时：0 毫秒（不使用网络）
- 读取超时：1000 毫秒（读取 AGENTS.md 和模板）
- 总超时：3000 毫秒

---

## 4. 影响模块

### 4.1 内部依赖

- [ ] `src/commands/codex.mjs`：codex 子命令入口
- [ ] `src/utils/paths.mjs`：home 路径解析
- [ ] `src/utils/fs.mjs`：marker block upsert、安全写入、备份
- [ ] `templates/codex/AGENTS.docsync.md`：Codex 规则模板
- [ ] `test/fs.test.mjs`：marker block 插入与更新测试
- [ ] `src/commands/doctor.mjs`：Codex 文件状态检测

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|---------|
| 运行时 | Node.js | >=18 | 文件系统与路径处理 | 不支持低版本 |
| 外部工具 | Codex | 用户安装版本（doctor 输出实际版本） | 消费 AGENTS.md 规则 | CLI 不要求安装即可写入文件 |
| 第三方 SDK | 无 | N/A | 不调用 Codex API | N/A |

### 4.3 数据存储

- [ ] 数据库（版本 N/A）：无数据库读写
- [ ] 缓存（版本 N/A）：无缓存读写
- [ ] 本地文件系统：写入或更新 `~/.codex/AGENTS.md`

---

## 5. 安全与合规

### 5.1 权限要求

- 认证方式：无
- 授权范围：当前用户 home 下 `.codex` 目录写权限

### 5.2 数据安全

- 敏感字段：不得读取或输出 AGENTS.md 中可能存在的私密内容，只报告路径与状态
- 加密要求：无敏感数据写入

### 5.3 审计要求

- 日志记录：必须输出 created/inserted/updated/path 状态
- 操作追踪：更新 marker block 时必须能通过 git 或备份恢复

---

## 6. 兼容性

### 6.1 接口兼容性

- 是否向后兼容：是
- 版本控制策略：marker 名称 `docsync:start/end` 保持稳定

### 6.2 数据兼容性

- 数据迁移方案：旧 marker block 直接替换为新模板内容
- 回滚策略：使用备份文件或手动删除 marker block

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

### Requirement: Codex global rule installation

The system MUST install the DocSync Codex rules into `~/.codex/AGENTS.md` using a managed marker block.

#### Scenario: Target file does not exist

- **WHEN** `~/.codex/AGENTS.md` does not exist and the user runs `docsync codex install`
- **THEN** the system creates the file and writes a complete DocSync marker block

#### Scenario: Target file exists without marker

- **WHEN** `~/.codex/AGENTS.md` exists without a DocSync marker block
- **THEN** the system preserves the existing content and appends the DocSync marker block

#### Scenario: Target file already has marker

- **WHEN** `~/.codex/AGENTS.md` contains exactly one DocSync marker block
- **THEN** the system updates only the content inside the marker block

### Requirement: Codex rule update and path lookup

The system MUST support updating the managed Codex rule block and printing the target path.

#### Scenario: Codex rule update

- **WHEN** the user runs `docsync codex update`
- **THEN** the system writes the latest template content inside the DocSync marker block while preserving user content outside the block

#### Scenario: Codex path lookup

- **WHEN** the user runs `docsync codex path`
- **THEN** the system prints only the resolved `~/.codex/AGENTS.md` path

### Requirement: Codex user content protection

The system MUST protect user-authored AGENTS content outside the DocSync marker block.

#### Scenario: User content surrounds marker

- **WHEN** AGENTS.md contains user rules before and after the DocSync marker block
- **THEN** the system preserves the surrounding user content byte-for-byte while replacing only the marker block content

#### Scenario: Multiple marker blocks are present

- **WHEN** AGENTS.md contains more than one DocSync marker block
- **THEN** the system refuses automatic modification and tells the user to clean up the file manually
