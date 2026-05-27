# spec.md - 能力规格定义

> **定位**：三个精简 AI 指令（/docsync:init、/docsync:sync、/docsync:rules）
>
> **【质量红线】严禁描述模糊；约束必须量化；缺失必要参数时 opsx-check 必须报错拦截
>
>> **【格式要求】** 需求项使用 `####`（4个#），场景必须使用 `#####`（5个#）

---

## 1. 需求规格（官方格式）

### 新增需求

#### 需求项：/docsync:init 项目初始化指令

系统必须提供 `/docsync:init` AI 指令，用于项目级初始化和首次同步。

##### 场景：首次初始化
- **当**用户运行 `/docsync:init` 且 `.docsync/state/install.json` 存在
- **预期**刷新上下文、检查环境、读取规则、创建或更新三份核心文档、输出同步报告

##### 场景：缺少 install.json
- **当**`.docsync/state/install.json` 不存在
- **预期**停止并提示用户先运行 npx 引导安装

##### 场景：.docsync/ 结构不完整
- **当**`.docsync/` 缺少 rules、config、adapters 等子目录
- **预期**停止并提示用户重新运行 npx 引导或手动修复

#### 需求项：/docsync:sync 文档同步指令

系统必须提供 `/docsync:sync` AI 指令用于日常文档同步，支持完整模式和快速模式。

##### 场景：完整同步（默认）
- **当**用户运行 `/docsync:sync`
- **预期**刷新完整项目事实、扫描项目文件、同步三份核心文档、运行格式修复、输出同步报告

##### 场景：指定单个文件
- **当**用户运行 `/docsync:sync README.md`
- **预期**只同步 README.md

##### 场景：指定多个文件
- **当**用户运行 `/docsync:sync README.md AGENTS.md`
- **预期**只同步指定的两份文档

##### 场景：快速模式
- **当**用户运行 `/docsync:sync --fast`
- **预期**使用轻量 git 事实（最近提交、status --short、diff --name-only）推断影响范围，快速更新相关文档

##### 场景：快速模式信息不足
- **当**`/docsync:sync --fast` 发现 git 信息不足以证明文档变更
- **预期**自动升级为完整 `/docsync:sync` 或停止提示用户

##### 场景：带自然语言要求
- **当**用户运行 `/docsync:sync README.md 更新安装方式，强调 npx 使用`
- **预期**将自然语言作为本次用户指令，应用于文档同步

#### 需求项：/docsync:rules 规则维护指令

系统必须提供 `/docsync:rules` AI 指令用于维护 `.docsync/rules/override.md`。

##### 场景：无参数查看规则
- **当**用户运行 `/docsync:rules`
- **预期**展示当前 override 规则摘要，询问用户要补充什么

##### 场景：添加文档级规则
- **当**用户运行 `/docsync:rules README.md 必须使用英文`
- **预期**更新 `.docsync/rules/override.md`，添加 README 语言规则

##### 场景：添加 protected content
- **当**用户运行 `/docsync:rules CLAUDE.md 必须保留 commit 前必须向用户确认`
- **预期**更新 override.md 的 ProtectedContent 区域

##### 场景：show 子命令
- **当**用户运行 `/docsync:rules show`
- **预期**展示当前 override 规则完整内容

---

## 2. 技术契约（SDD 扩展）

### 2.1 接口定义

#### 接口基本信息
- **路径**：Claude Code Skill 或 AGENTS.md 标记块
- **方法**：Slash command 风格 `/docsync:*`
- **内容类型**：Markdown 规则文件或 Skill 定义

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 | 约束条件 |
|-------|------|------|------|--------|----------|
| target | string | 否 | 目标文档名 | `README.md` | 仅限 README.md/AGENTS.md/CLAUDE.md |
| --fast | flag | 否 | 快速同步模式 | `--fast` | 仅适用于 /docsync:sync |
| instruction | string | 否 | 自然语言补充要求 | `更新安装方式` | 作为用户指令处理 |

#### 错误码定义

| 错误码 | 含义 | 触发条件 |
|-------|------|----------|
| ERR_NO_INSTALL | 未完成引导安装 | `.docsync/state/install.json` 不存在 |
| ERR_WORKSPACE_INCOMPLETE | 工作区不完整 | `.docsync/` 缺少必需子目录 |
| ERR_INVALID_TARGET | 无效目标文档 | 目标不在三份核心文档列表中 |
| ERR_PROTECTED_CONTENT_VIOLATION | protected content 冲突 | 编辑会删除 protected content |

---

## 3. 物理约束

### 3.1 性能约束
| 指标 | 约束值 | 说明 |
|------|-------|------|
| 完整同步耗时 | < 30 秒 | 从刷新上下文到输出报告 |
| 快速同步耗时 | < 10 秒 | 从读取 git 事实到输出报告 |

### 3.2 资源约束
| 资源 | 限制 | 说明 |
|------|------|------|
| Repomix 输出大小 | < 10 MB | 上下文文件大小上限 |

### 3.3 超时配置
- 不适用（本地 CLI 工具）

---

## 4. 影响模块

### 4.1 内部依赖
- [ ] Claude Code Skill（.claude/skills/docsync/SKILL.md）
- [ ] AGENTS.md（Codex 适配器标记块）
- [ ] `.docsync/rules/` 目录

### 4.2 外部依赖

| 组件类型 | 组件名称 | 版本 | 用途 | 降级策略 |
|---------|---------|------|------|--------|
| AI 工具 | Claude Code | 最新 | 执行 /docsync:* 指令 | 使用 Codex AGENTS.md |
| AI 工具 | Codex | 最新 | 执行 /docsync:* 指令 | 使用 Claude Code Skill |

### 4.3 数据存储
- `.docsync/state/install.json`：安装状态
- `.docsync/state/last-sync.json`：上次同步状态（可选）

---

## 5. 安全与合规

### 5.1 权限要求
- 不执行 git commit、git push、npm publish
- 不读取或输出 .env、token、密钥文件

### 5.2 数据安全
- Protected content 不得被误删
- 不编造不存在的命令、端口、环境变量、API 或部署步骤

### 5.3 审计要求
- 每次同步输出同步报告
- 记录更新的文件、跳过的文件、使用的事实、同步模式

---

## 6. 兼容性

### 6.1 接口兼容性
- 是否向后兼容：是
- 版本控制策略：slash command 格式稳定

### 6.2 数据兼容性
- 数据迁移方案：无
- 回滚策略：git checkout 恢复文档

---

> **质量红线检查清单**
> - [x] 每个需求项至少有一个场景
> - [x] 使用「必须」强制要求，而非「应该」「可以」
> - [x] 所有接口参数已量化（类型、必填、范围、示例）
> - [x] 物理约束已量化（并发、超时、性能指标）
> - [x] 错误码已定义
> - [x] **技术选型已包含版本信息**（Claude Code 最新、Codex 最新）
> - [x] 若跳过 proposal.md，影响范围已在此补齐
