# 局部技术实现方案 - codex-rule-management

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
| 2 | --backup | options.backup | boolean | ⚠️ 重命名 | 覆盖前备份 |
| 3 | --dry-run | options.dryRun | boolean | ⚠️ 重命名 | 预演模式 |
| 4 | --verbose | options.verbose | boolean | ⚠️ 重命名 | 详细输出 |
| 5 | marker start/end | MARKERS | object | ✅ 保留 | 管理 DocSync block |

### 1.2 完整性自检

- **用户输入字段总数**：5 个
- **设计输出字段总数**：5 个
- **差异说明**：CLI flag 转为 options；marker 转为常量
- **完整性确认**：[x] 已确认所有字段都有对应处理

### 1.3 需求项覆盖表

| Spec 需求项 | 设计覆盖位置 | 覆盖状态 |
|------------|-------------|---------|
| Codex 全局规则安装 | 2.2、4.2、6.2 | ✅ 已覆盖 |
| Codex 规则更新与路径查询 | 4.1、4.2、6.1 | ✅ 已覆盖 |
| 用户内容保护 | 2.3、6.3、8.1 | ✅ 已覆盖 |

---

## 2. 现有代码锚点

### 2.1 需修改的现有文件

| 文件路径 | 类/模块名 | 需修改的方法/函数 | 修改类型 | 说明 |
|---------|----------|----------------|---------|------|
| 无 | 无 | 无 | 纯新建 | 当前仓库无 codex 规则管理实现 |

### 2.2 需新建的文件

| 文件路径（建议） | 类/模块名 | 职责 | 继承/实现 | 说明 |
|------------|----------|------|---------|------|
| `src/commands/codex.mjs` | codex command | `runCodex(rest, options)` | N/A | 子命令和 marker 更新 |
| `templates/codex/AGENTS.docsync.md` | rule template | DocSync AGENTS marker block | N/A | 写入源 |
| `src/utils/fs.mjs` | fs utils | `upsertMarkedBlock()` | N/A | 保留用户内容 |
| `src/utils/paths.mjs` | path utils | `resolveHomePath()` | N/A | 目标路径 |
| `test/fs.test.mjs` | tests | marker 插入和更新 | node:test | 防止破坏用户内容 |

### 2.3 现有逻辑约束

| 约束项 | 当前现状 | 对本设计的影响 | 应对策略 |
|-------|---------|-------------|--------|
| 用户内容保护 | marker 外内容不得改动 | 必须使用 block upsert | 遵循 |
| 目标固定 | `~/.codex/AGENTS.md` | 不支持项目级变体 | 遵循 |
| 多 marker 风险 | spec 要求明确处理 | 多对 marker 报参数/文件状态错误 | 适配 |

---

## 3. 局部前端设计

CLI 文本输出作为交互界面。

### 3.1 页面/组件结构

| 组件名 | 类型 | 职责 | 依赖组件 |
|-------|------|------|---------|
| Codex status output | CLI 输出 | 展示 created/inserted/updated/path | logger |

### 3.2 状态管理

| 状态名 | 数据类型 | 初始值 | 更新时机 |
|-------|---------|-------|---------|
| targetPath | string | `~/.codex/AGENTS.md` | home 解析后 |
| markerState | string | `unknown` | 读取文件后 |
| status | string | `pending` | 操作完成后 |

### 3.3 路由设计

| 路由路径 | 页面组件 | 权限要求 | 说明 |
|---------|---------|---------|------|
| 不适用 | N/A | N/A | CLI 子命令 `docsync codex <subcommand>` |

### 3.4 前后端交互

| 前端操作 | 调用接口 | 请求参数 | 响应处理 |
|---------|---------|---------|---------|
| install/update/path | `runCodex(rest, options)` | subcommand/options | 输出路径和状态 |

---

## 4. 局部后端接口设计

### 4.1 接口清单

| 接口名称 | 路径 | 方法 | 说明 |
|---------|------|------|------|
| Codex install | `docsync codex install` | 命令行调用 | 创建/插入/更新 marker block |
| Codex update | `docsync codex update` | 命令行调用 | 更新 marker block |
| Codex path | `docsync codex path` | 命令行调用 | 输出目标路径 |

### 4.2 接口详细设计

#### 接口 1：Codex 子命令

**基本信息**：
- 路径：`docsync codex <install|update|path>`
- 方法：命令行调用
- 认证：不需要

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 | 约束 |
|-------|------|------|------|------|
| subcommand | string | 是 | 子命令 | install/update/path |
| options.backup | boolean | 否 | 更新前备份 | 默认 false |
| options.dryRun | boolean | 否 | 预演 | 不写文件 |
| options.verbose | boolean | 否 | 详细输出 | 默认 false |

**响应结构**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "target": "~/.codex/AGENTS.md",
    "status": "updated",
    "preservedUserContent": true
  }
}
```

**业务逻辑**：
1. 校验 subcommand。
2. 解析 `~/.codex/AGENTS.md`。
3. `path` 只输出路径。
4. 读取模板 block。
5. 目标不存在时创建文件。
6. 目标存在无 marker 时追加 block。
7. 目标存在一对 marker 时替换 marker 内内容。
8. 目标存在多对 marker 时拒绝并提示人工清理。
9. `dryRun` 只输出计划动作。

---

## 5. 局部数据模型

### 5.1 数据表设计

无数据库表。

### 5.2 缓存设计

无缓存。

### 5.3 数据流转图

```
[AGENTS.docsync.md] --> [upsertMarkedBlock] --> [~/.codex/AGENTS.md with user content preserved]
```

---

## 6. 模块内部逻辑

### 6.1 核心流程

```
[parse subcommand]
  --> [resolve target]
  --> [path? print]
  --> [read existing]
  --> [detect marker count]
  --> [create/append/replace/reject]
```

### 6.2 状态机（如有）

```
[missing] --install/update--> [created]
[exists_no_marker] --install/update--> [inserted]
[exists_one_marker] --install/update--> [updated]
[exists_multi_marker] --install/update--> [rejected]
```

### 6.3 关键算法（如有）

- `upsertMarkedBlock(text, start, end, block)` 必须逐字保留 marker 外内容。
- 追加 block 时若原文件非空，先补一个换行再追加。
- 多 marker 使用正则计数，超过 1 对立即拒绝，避免误删用户内容。

---

## 7. 外部依赖与集成

### 7.1 外部服务依赖

| 依赖服务 | 用途 | 调用方式 | 超时设置 | 失败影响 | 降级方案 |
|---------|------|---------|---------|---------|--------|
| 无 | N/A | N/A | N/A | N/A | N/A |

### 7.2 第三方 API / SDK

| 名称 | 版本/文档链接 | 用途 | 鉴权方式 | 费用/限流 | 备注 |
|------|-------------|------|---------|----------|------|
| 无 | N/A | N/A | 无 | 无 | 不调用 Codex API |

### 7.3 中间件 & 基础设施

| 组件 | 用途 | 使用方式 | 关键配置 | 备注 |
|------|------|---------|---------|------|
| Codex | 消费 AGENTS.md | 文件约定 | `~/.codex/AGENTS.md` | 不要求安装 |

### 7.4 内部跨模块依赖

| 依赖模块 | 调用接口/方法 | 输入 | 预期输出 | 当前状态 |
|---------|-------------|------|---------|--------|
| fs utils | `upsertMarkedBlock()` | existing/block/markers | new content | 待建 |
| path utils | `resolveHomePath()` | `.codex/AGENTS.md` | absolute path | 待建 |

### 7.5 环境 & 权限要求

| 依赖项 | 说明 | 获取方式 |
|-------|------|--------|
| 环境变量 | HOME/USERPROFILE | 操作系统 |
| 密钥/证书 | 无 | N/A |
| 网络策略 | 无 | N/A |
| 权限/角色 | home 下 `.codex` 写权限 | 当前用户 |

---

## 8. 异常处理

### 8.1 异常分类

| 异常类型 | 触发条件 | 处理策略 | 用户感知 |
|---------|---------|---------|---------|
| 参数校验异常 | 未知 subcommand | exit 2 | 参数错误 |
| 业务逻辑异常 | 多对 marker | exit 1，提示人工清理 | 保护性拒绝 |
| 文件系统异常 | 目录不可创建、文件不可写 | exit 1 | 文件路径错误 |

### 8.2 重试与降级

- 重试次数：0
- 重试间隔：N/A
- 降级策略：多 marker 时不自动修复，避免破坏用户内容

---

## 9. 局部配置

### 9.1 业务配置

| 配置项 | 配置 Key | 默认值 | 说明 |
|-------|---------|-------|------|
| 起始 marker | `CODEX_BLOCK_START` | `<!-- docsync:start -->` | block 边界 |
| 结束 marker | `CODEX_BLOCK_END` | `<!-- docsync:end -->` | block 边界 |
| 目标路径 | `codexAgentsPath` | `~/.codex/AGENTS.md` | 全局规则文件 |

### 9.2 开关配置

| 开关 | 用途 | 默认状态 |
|-----|------|---------|
| `backup` | 更新前备份 | 关闭 |
| `dryRun` | 预演 | 关闭 |
| `verbose` | 详细输出 | 关闭 |

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
