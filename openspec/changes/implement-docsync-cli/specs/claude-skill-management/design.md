# 局部技术实现方案 - claude-skill-management

> **定位**：单一 Capability 的业务维度技术实现方案
>
> **⚠️ 边界声明**：本设计仅服务于当前 Capability，严禁越权设计或覆盖其他模块逻辑。
>
> **【质量红线】专注"本业务如何落地"；严禁写入全局中间件或框架选型；必须为任务拆解提供足够局部细节

---

## 1. 字段完整性追溯表

### 1.1 字段映射表

| 序号 | 用户输入字段 | 设计输出字段 | 字段类型 | 状态 | 理由说明 |
|-----|-------------|-------------|---------|------|---------|
| 1 | subcommand | subcommand | string | ✅ 保留 | install/update/path |
| 2 | --global | options.global | boolean | ⚠️ 重命名 | 目标选择 |
| 3 | --project | options.project | boolean | ⚠️ 重命名 | 目标选择 |
| 4 | --force | options.force | boolean | ⚠️ 重命名 | install 覆盖许可 |
| 5 | --backup | options.backup | boolean | ⚠️ 重命名 | 覆盖前备份 |
| 6 | --cwd | options.cwd | string | ⚠️ 重命名 | 项目级目标目录 |

### 1.2 完整性自检

- **用户输入字段总数**：6 个
- **设计输出字段总数**：6 个
- **差异说明**：CLI flag 转换为内部 options 字段，无字段丢弃
- **完整性确认**：[x] 已确认所有字段都有对应处理

### 1.3 需求项覆盖表

| Spec 需求项 | 设计覆盖位置 | 覆盖状态 |
|------------|-------------|---------|
| Claude Skill 安装 | 2.2、4.2、6.1 | ✅ 已覆盖 |
| 安装保护 | 4.2、6.2、8.1 | ✅ 已覆盖 |
| Skill 更新与路径查询 | 4.1、4.2、6.1 | ✅ 已覆盖 |

---

## 2. 现有代码锚点

### 2.1 需修改的现有文件

| 文件路径 | 类/模块名 | 需修改的方法/函数 | 修改类型 | 说明 |
|---------|----------|----------------|---------|------|
| 无 | 无 | 无 | 纯新建 | 当前仓库无 skill 管理实现 |

### 2.2 需新建的文件

| 文件路径（建议） | 类/模块名 | 职责 | 继承/实现 | 说明 |
|------------|----------|------|---------|------|
| `src/commands/skill.mjs` | skill command | `runSkill(rest, options)` | N/A | 子命令分发和安装逻辑 |
| `templates/claude-skill/SKILL.md` | Skill template | doc-sync Skill 内容 | N/A | 安装源 |
| `src/utils/paths.mjs` | path utils | `resolveHomePath/resolveProjectPath` | N/A | 目标路径 |
| `src/utils/fs.mjs` | fs utils | 内容比较、备份、写入 | N/A | 安装保护 |

### 2.3 现有逻辑约束

| 约束项 | 当前现状 | 对本设计的影响 | 应对策略 |
|-------|---------|-------------|--------|
| 默认全局安装 | spec 要求 global 默认 | 未指定 project 时写入 home | 遵循 |
| 用户文件保护 | install 不默认覆盖不同内容 | 内容比较后保护性拒绝 | 遵循 |
| 不要求 Claude 已安装 | 只写文件 | 不检测 Claude 命令作为阻塞条件 | 适配 |

---

## 3. 局部前端设计

CLI 文本输出作为交互界面。

### 3.1 页面/组件结构

| 组件名 | 类型 | 职责 | 依赖组件 |
|-------|------|------|---------|
| Skill status output | CLI 输出 | 展示 installed/updated/already-installed/path | logger |

### 3.2 状态管理

| 状态名 | 数据类型 | 初始值 | 更新时机 |
|-------|---------|-------|---------|
| targetPath | string | "" | 解析目标模式后 |
| status | string | `pending` | 操作完成后 |
| backupPath | string | "" | 创建备份后 |

### 3.3 路由设计

| 路由路径 | 页面组件 | 权限要求 | 说明 |
|---------|---------|---------|------|
| 不适用 | N/A | N/A | CLI 子命令 `docsync skill <subcommand>` |

### 3.4 前后端交互

| 前端操作 | 调用接口 | 请求参数 | 响应处理 |
|---------|---------|---------|---------|
| install/update/path | `runSkill(rest, options)` | subcommand/options | 输出目标路径和状态 |

---

## 4. 局部后端接口设计

### 4.1 接口清单

| 接口名称 | 路径 | 方法 | 说明 |
|---------|------|------|------|
| Skill install | `docsync skill install` | 命令行调用 | 安装 doc-sync Skill |
| Skill update | `docsync skill update` | 命令行调用 | 覆盖更新 Skill |
| Skill path | `docsync skill path` | 命令行调用 | 输出目标路径 |

### 4.2 接口详细设计

#### 接口 1：Skill 子命令

**基本信息**：
- 路径：`docsync skill <install|update|path>`
- 方法：命令行调用
- 认证：不需要

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 | 约束 |
|-------|------|------|------|------|
| subcommand | string | 是 | 子命令 | install/update/path |
| options.project | boolean | 否 | 项目级目标 | 与 global 互斥 |
| options.global | boolean | 否 | 全局目标 | 默认 true |
| options.force | boolean | 否 | install 覆盖 | 默认 false |
| options.backup | boolean | 否 | 覆盖前备份 | 默认 false |

**响应结构**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "target": "~/.claude/skills/doc-sync/SKILL.md",
    "status": "installed"
  }
}
```

**业务逻辑**：
1. 校验 subcommand 和 global/project 互斥。
2. 解析目标路径。
3. `path` 只输出路径。
4. 读取模板内容。
5. `install`：不存在则写入；相同则 already-installed；不同且未 force 则拒绝。
6. `update` 或 `install --force`：按需备份后覆盖写入。

---

## 5. 局部数据模型

### 5.1 数据表设计

无数据库表。

### 5.2 缓存设计

无缓存。

### 5.3 数据流转图

```
[templates/claude-skill/SKILL.md] --> [target resolver] --> [compare existing] --> [install/update/path result]
```

---

## 6. 模块内部逻辑

### 6.1 核心流程

```
[parse subcommand]
  --> [resolve target]
  --> [path? print]
  --> [read template]
  --> [install/update decision]
  --> [write or reject]
```

### 6.2 状态机（如有）

```
[missing] --install--> [installed]
[same] --install--> [already-installed]
[different] --install no force--> [rejected]
[different] --update/force--> [updated]
```

### 6.3 关键算法（如有）

- 内容比较使用完整字符串比较，读取和写入统一 UTF-8。
- 全局路径：`<home>/.claude/skills/doc-sync/SKILL.md`。
- 项目路径：`<cwd>/.claude/skills/doc-sync/SKILL.md`。
- `--backup` 复用 fs utils 的 `.bak.<timestamp>` 策略。

---

## 7. 外部依赖与集成

### 7.1 外部服务依赖

| 依赖服务 | 用途 | 调用方式 | 超时设置 | 失败影响 | 降级方案 |
|---------|------|---------|---------|---------|--------|
| 无 | N/A | N/A | N/A | N/A | N/A |

### 7.2 第三方 API / SDK

| 名称 | 版本/文档链接 | 用途 | 鉴权方式 | 费用/限流 | 备注 |
|------|-------------|------|---------|----------|------|
| 无 | N/A | N/A | 无 | 无 | 不调用 Claude API |

### 7.3 中间件 & 基础设施

| 组件 | 用途 | 使用方式 | 关键配置 | 备注 |
|------|------|---------|---------|------|
| Claude Code | 消费 Skill | 文件约定 | `~/.claude/skills/doc-sync/SKILL.md` | 不要求安装 |

### 7.4 内部跨模块依赖

| 依赖模块 | 调用接口/方法 | 输入 | 预期输出 | 当前状态 |
|---------|-------------|------|---------|--------|
| path utils | `resolveHomePath/resolveProjectPath` | mode/cwd | target path | 待建 |
| fs utils | `writeText/backupFile` | path/content/options | write result | 待建 |

### 7.5 环境 & 权限要求

| 依赖项 | 说明 | 获取方式 |
|-------|------|--------|
| 环境变量 | HOME/USERPROFILE | 操作系统 |
| 密钥/证书 | 无 | N/A |
| 网络策略 | 无 | N/A |
| 权限/角色 | home 或项目目录写权限 | 当前用户 |

---

## 8. 异常处理

### 8.1 异常分类

| 异常类型 | 触发条件 | 处理策略 | 用户感知 |
|---------|---------|---------|---------|
| 参数校验异常 | 未知子命令、global/project 冲突 | exit 2 | 参数错误 |
| 业务逻辑异常 | install 遇到不同内容且未 force | exit 1 + update/force 提示 | 保护性拒绝 |
| 文件系统异常 | 目标不可写、备份失败 | exit 1 | 文件路径错误 |

### 8.2 重试与降级

- 重试次数：0
- 重试间隔：N/A
- 降级策略：不同内容时拒绝覆盖并提示 update/force

---

## 9. 局部配置

### 9.1 业务配置

| 配置项 | 配置 Key | 默认值 | 说明 |
|-------|---------|-------|------|
| Skill 名称 | `skillName` | `doc-sync` | 目标目录名 |
| 模板路径 | `skillTemplatePath` | `templates/claude-skill/SKILL.md` | 安装源 |

### 9.2 开关配置

| 开关 | 用途 | 默认状态 |
|-----|------|---------|
| `project` | 项目级安装 | 关闭 |
| `global` | 全局安装 | 开启 |
| `force` | 覆盖安装 | 关闭 |
| `backup` | 覆盖前备份 | 关闭 |

---

> **质量红线检查清单**
> - [x] **现有代码锚点已标注**：需修改的文件、类、方法已明确（或确认为纯新建）
> - [x] **现有约束已识别**：影响设计的现有系统约束已列出并有应对策略
> - [x] **字段完整性**：字段追溯表已完成，无无故丢弃字段
> - [x] **边界遵守**：无越权设计其他 Capability 的逻辑
> - [x] **全局遵守**：遵循 overview.md 的数据字典和接口规范
> - [x] 前端设计已完成（组件、状态、路由、交互）
> - [x] 后端接口已完成（路径、参数、响应、逻辑）
> - [x] 数据模型已完成（表结构、索引、缓存）
> - [x] **外部依赖已明确**：所有外部服务、第三方 API、中间件、跨模块依赖已列出
> - [x] **环境权限已确认**：所需环境变量、密钥、网络策略已说明
> - [x] 异常处理策略已定义（含外部依赖失败的降级方案）
> - [x] 包含足够的局部细节支持任务拆解
