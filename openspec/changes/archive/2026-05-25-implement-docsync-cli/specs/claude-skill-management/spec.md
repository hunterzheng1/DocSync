# spec.md - 能力规格定义

> **定位**：单个能力（capability）的技术规格定义，用于 `specs/<capability>/spec.md`
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：Claude Skill 安装

系统必须通过 `docsync skill install` 安装 `doc-sync` Skill，默认目标为 `~/.claude/skills/doc-sync/SKILL.md`，并支持 `--project` 安装到当前项目 `.claude/skills/doc-sync/SKILL.md`。

##### 场景：全局安装

- **当** 用户执行 `docsync skill install`
- **预期** 系统必须在全局目标路径创建 Skill 文件，且输出安装路径

##### 场景：项目级安装

- **当** 用户执行 `docsync skill install --project`
- **预期** 系统必须在当前项目 `.claude/skills/doc-sync/SKILL.md` 创建 Skill 文件

#### 需求项：安装保护

系统必须在 install 模式下保护已有不同内容的 Skill 文件，除非用户显式传入覆盖参数。

##### 场景：目标已存在且内容相同

- **当** Skill 文件已存在且内容相同
- **预期** 系统必须输出 already installed，并不得重写文件

##### 场景：目标已存在且内容不同

- **当** Skill 文件已存在且内容不同
- **预期** 系统必须提示使用 `docsync skill update` 或 `--force`，并不得默认覆盖

#### 需求项：Skill 更新与路径查询

系统必须提供 `docsync skill update` 覆盖更新 Skill 文件，并提供 `docsync skill path` 输出目标路径。

##### 场景：覆盖更新

- **当** 用户执行 `docsync skill update`
- **预期** 系统必须用模板内容覆盖目标 Skill 文件

##### 场景：路径查询

- **当** 用户执行 `docsync skill path --global`
- **预期** 系统必须只输出全局 Skill 目标路径

### 修改需求

无。

### 移除需求

无。

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### 接口基本信息

- **路径**：本地 CLI `docsync skill <subcommand>`
- **方法**：命令行调用
- **内容类型**：stdout/stderr 文本输出 + 本地文件写入

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 | 约束条件 |
|-------|------|------|------|--------|----------|
| subcommand | string | 是 | skill 子命令 | `install` | 允许值：`install/update/path` |
| --global | boolean | 否 | 使用全局目标 | `--global` | 默认 true |
| --project | boolean | 否 | 使用项目级目标 | `--project` | 与 `--global` 同时出现时必须报参数错误或定义优先级 |
| --force | boolean | 否 | install 时允许覆盖 | `--force` | 默认 false |
| --backup | boolean | 否 | 覆盖前备份 | `--backup` | 默认 false |
| --cwd | string | 否 | 项目级安装目录 | `--cwd ./demo` | 仅 project 模式使用 |

#### 响应结构

**成功响应 (exit 0)**

```json
{
  "subcommand": "install",
  "target": "~/.claude/skills/doc-sync/SKILL.md",
  "status": "installed|updated|already-installed|path"
}
```

**错误响应**

```json
{
  "code": 1,
  "message": "Skill already exists with different content. Use update or --force.",
  "data": null
}
```

#### 错误码定义

| 错误码 | 含义 | 触发条件 |
|-------|------|----------|
| 0 | 成功 | install/update/path 完成 |
| 1 | 文件系统失败或保护性拒绝 | 目标不同且未 force、写入失败 |
| 2 | 参数错误 | 未知子命令、global/project 冲突、cwd 非法 |

---

## 3. 物理约束

### 3.1 性能约束

| 指标 | 约束值 | 说明 |
|------|-------|------|
| 安装耗时 | < 1000 毫秒 (P95) | 单个 Skill 文件 |
| 文件大小 | < 50 KB | Skill 模板文本 |
| 并发数 | 单进程 1 次安装 | 不支持同目标并发写 |

### 3.2 资源约束

| 资源 | 限制 | 说明 |
|------|------|------|
| 内存 | < 80 MB | 模板读取轻量 |
| CPU | < 1 个核心 | 文件写入为主 |
| 存储 | < 100 KB | 不含备份累积 |

### 3.3 超时配置

- 连接超时：0 毫秒（不使用网络）
- 读取超时：1000 毫秒（读取模板和目标文件）
- 总超时：3000 毫秒

---

## 4. 影响模块

### 4.1 内部依赖

- [ ] `src/commands/skill.mjs`：skill 子命令入口
- [ ] `src/utils/paths.mjs`：home 与项目路径解析
- [ ] `src/utils/fs.mjs`：安全写入、备份、内容比较
- [ ] `templates/claude-skill/SKILL.md`：Skill 模板
- [ ] `src/commands/doctor.mjs`：安装状态检测复用目标路径

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|---------|
| 运行时 | Node.js | >=18 | 文件写入与路径解析 | 不支持低版本 |
| 外部工具 | Claude Code | 用户安装版本（doctor 输出实际版本） | 消费 Skill | CLI 不要求安装即可写入文件 |
| 第三方 SDK | 无 | N/A | 不调用 Claude API | N/A |

### 4.3 数据存储

- [ ] 数据库（版本 N/A）：无数据库读写
- [ ] 缓存（版本 N/A）：无缓存读写
- [ ] 本地文件系统：写入 `SKILL.md`，可选写入备份文件

---

## 5. 安全与合规

### 5.1 权限要求

- 认证方式：无
- 授权范围：当前用户 home 或项目目录写权限

### 5.2 数据安全

- 敏感字段：Skill 模板不得包含 token、私有凭据或机器专属路径
- 加密要求：无敏感数据存储

### 5.3 审计要求

- 日志记录：必须输出目标路径和 installed/updated/skipped 状态
- 操作追踪：覆盖更新必须支持 backup 或可被 git 恢复

---

## 6. 兼容性

### 6.1 接口兼容性

- 是否向后兼容：是
- 版本控制策略：`doc-sync` Skill 名称保持稳定

### 6.2 数据兼容性

- 数据迁移方案：更新时覆盖 marker 无关的完整 Skill 文件
- 回滚策略：通过备份文件或重新安装旧版本 npm 包恢复

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

### Requirement: Claude Skill installation

The system MUST install the DocSync Claude Code Skill from a package template.

#### Scenario: Global Skill install

- **WHEN** the user runs `docsync skill install`
- **THEN** the system writes the Skill file to `~/.claude/skills/doc-sync/SKILL.md` and prints the resolved target path

#### Scenario: Project Skill install

- **WHEN** the user runs `docsync skill install --project`
- **THEN** the system writes the Skill file to `<cwd>/.claude/skills/doc-sync/SKILL.md`

### Requirement: Skill install protection

The system MUST protect existing Skill files during install unless overwrite is explicitly requested.

#### Scenario: Existing identical Skill

- **WHEN** the target Skill file already exists with identical template content
- **THEN** the system reports `already-installed` and does not rewrite the file

#### Scenario: Existing different Skill

- **WHEN** the target Skill file already exists with different content and the user did not pass `--force`
- **THEN** the system refuses to overwrite it and suggests `docsync skill update` or `--force`

### Requirement: Skill update and path lookup

The system MUST support updating the Skill file and printing target paths.

#### Scenario: Skill update overwrites template

- **WHEN** the user runs `docsync skill update`
- **THEN** the system overwrites the target Skill file with the latest package template

#### Scenario: Global path lookup

- **WHEN** the user runs `docsync skill path --global`
- **THEN** the system prints only the resolved global Skill target path
