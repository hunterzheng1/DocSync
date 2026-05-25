# 局部技术实现方案 - project-initialization

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
| 1 | --cwd | options.cwd | string | ⚠️ 重命名 | CLI flag 转为内部 options |
| 2 | --force | options.force | boolean | ⚠️ 重命名 | 控制覆盖策略 |
| 3 | --backup | options.backup | boolean | ⚠️ 重命名 | 控制覆盖前备份 |
| 4 | --dry-run | options.dryRun | boolean | ⚠️ 重命名 | camelCase |
| 5 | --verbose | options.verbose | boolean | ⚠️ 重命名 | 日志开关 |
| 6 | --quiet | options.quiet | boolean | ⚠️ 重命名 | 日志开关 |
| 7 | 模板文件列表 | TEMPLATE_FILES | array | ✅ 保留 | 固定 4 个初始化目标 |

### 1.2 完整性自检

- **用户输入字段总数**：7 个
- **设计输出字段总数**：7 个
- **差异说明**：CLI flag 命名转为 JS 内部字段，无字段丢弃
- **完整性确认**：[x] 已确认所有字段都有对应处理

### 1.3 需求项覆盖表

| Spec 需求项 | 设计覆盖位置 | 覆盖状态 |
|------------|-------------|---------|
| 项目模板初始化 | 2.2、4.2、6.1 | ✅ 已覆盖 |
| 默认不覆盖 | 4.2、6.2、6.3 | ✅ 已覆盖 |
| 显式覆盖与备份 | 4.2、6.2、8.1 | ✅ 已覆盖 |
| dry-run 初始化 | 4.2、6.3、9.2 | ✅ 已覆盖 |

---

## 2. 现有代码锚点

### 2.1 需修改的现有文件

| 文件路径 | 类/模块名 | 需修改的方法/函数 | 修改类型 | 说明 |
|---------|----------|----------------|---------|------|
| 无 | 无 | 无 | 纯新建 | 当前仓库无初始化实现 |

### 2.2 需新建的文件

| 文件路径（建议） | 类/模块名 | 职责 | 继承/实现 | 说明 |
|------------|----------|------|---------|------|
| `src/commands/init.mjs` | init command | 实现 `runInit(options)` | N/A | 初始化编排 |
| `src/utils/fs.mjs` | fs utils | `exists/readText/writeText/writeIfMissing/backupFile` | N/A | 安全文件写入 |
| `src/utils/paths.mjs` | path utils | `getCwd/getTemplateRoot/resolveProjectPath` | N/A | 跨平台路径 |
| `templates/project/repomix.config.json` | template | Repomix 配置 | N/A | 写入项目根 |
| `templates/project/.repomixignore` | template | Repomix 忽略规则 | N/A | 排除敏感/生成文件 |
| `templates/project/.markdownlint-cli2.jsonc` | template | Markdownlint 配置 | N/A | 格式修复范围 |
| `templates/project/docs/doc-sync-rules.md` | template | 文档同步规则 | N/A | AI 使用规则 |
| `test/init.test.mjs` | tests | 初始化行为测试 | node:test | 覆盖创建/跳过/覆盖/dry-run |

### 2.3 现有逻辑约束

| 约束项 | 当前现状 | 对本设计的影响 | 应对策略 |
|-------|---------|-------------|--------|
| 默认保护用户文件 | proposal 明确默认不覆盖 | `writeIfMissing` 必须先判断存在 | 遵循 |
| 跨平台 | 需支持 Windows PowerShell | 路径使用 Node path API | 适配 |
| 非 git 仓库 | init 允许执行 | git 检测只提示不阻塞 | 遵循 |

---

## 3. 局部前端设计

无前端页面；CLI 输出作为用户界面。

### 3.1 页面/组件结构

| 组件名 | 类型 | 职责 | 依赖组件 |
|-------|------|------|---------|
| Init summary | CLI 输出 | 展示 created/skipped/overwritten/backups | logger |

### 3.2 状态管理

| 状态名 | 数据类型 | 初始值 | 更新时机 |
|-------|---------|-------|---------|
| result.created | string[] | [] | 文件创建成功后 |
| result.skipped | string[] | [] | 文件存在且未覆盖时 |
| result.overwritten | string[] | [] | force 覆盖成功后 |
| result.backups | string[] | [] | backup 成功后 |

### 3.3 路由设计

| 路由路径 | 页面组件 | 权限要求 | 说明 |
|---------|---------|---------|------|
| 不适用 | N/A | N/A | CLI 命令 `docsync init` |

### 3.4 前后端交互

| 前端操作 | 调用接口 | 请求参数 | 响应处理 |
|---------|---------|---------|---------|
| 执行 init | `runInit(options)` | 通用 options | 输出结果摘要 |

---

## 4. 局部后端接口设计

### 4.1 接口清单

| 接口名称 | 路径 | 方法 | 说明 |
|---------|------|------|------|
| Init | `docsync init` | 命令行调用 | 补齐项目模板 |

### 4.2 接口详细设计

#### 接口 1：Init

**基本信息**：
- 路径：`docsync init`
- 方法：命令行调用
- 认证：不需要

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 | 约束 |
|-------|------|------|------|------|
| options.cwd | string | 否 | 目标目录 | 必须可解析 |
| options.force | boolean | 否 | 覆盖文件 | 默认 false |
| options.backup | boolean | 否 | 覆盖前备份 | 仅覆盖时生效 |
| options.dryRun | boolean | 否 | 预演 | 不得写入 |

**响应结构**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "created": [],
    "skipped": [],
    "overwritten": [],
    "backups": []
  }
}
```

**业务逻辑**：
1. 解析目标 cwd，确认目录可访问。
2. 检测 git 仓库状态；非 git 只记录提示。
3. 遍历 4 个模板映射。
4. 目标不存在时创建父目录并写入。
5. 目标存在且 `force=false` 时跳过。
6. 目标存在且 `force=true` 时按需备份再覆盖。
7. `dryRun=true` 时只计算动作，不执行写入。

---

## 5. 局部数据模型

### 5.1 数据表设计

无数据库表。

### 5.2 缓存设计

无缓存。

### 5.3 数据流转图

```
[templates/project] --> [template mapping] --> [writeIfMissing] --> [target cwd files]
```

---

## 6. 模块内部逻辑

### 6.1 核心流程

```
[resolve cwd]
  --> [detect git optional]
  --> [build template mapping]
  --> [plan file actions]
  --> [dry-run?]
  --> [write/skip/backup]
  --> [print summary]
```

### 6.2 状态机（如有）

```
[missing] --write--> [created]
[exists] --no force--> [skipped]
[exists] --force + backup--> [backed_up] --> [overwritten]
[exists] --force no backup--> [overwritten]
```

### 6.3 关键算法（如有）

- 备份文件名使用原文件名追加 `.bak.<timestamp>`，timestamp 使用本地安全格式 `YYYYMMDDHHmmss`。
- `writeIfMissing(path, content, options)` 返回 `{ action, path, backupPath? }`，由 `runInit()` 汇总输出。
- JSON/JSONC/Markdown 模板按 UTF-8 文本写入。

---

## 7. 外部依赖与集成

### 7.1 外部服务依赖

| 依赖服务 | 用途 | 调用方式 | 超时设置 | 失败影响 | 降级方案 |
|---------|------|---------|---------|---------|--------|
| 无 | N/A | N/A | N/A | N/A | N/A |

### 7.2 第三方 API / SDK

| 名称 | 版本/文档链接 | 用途 | 鉴权方式 | 费用/限流 | 备注 |
|------|-------------|------|---------|----------|------|
| 无 | N/A | N/A | 无 | 无 | N/A |

### 7.3 中间件 & 基础设施

| 组件 | 用途 | 使用方式 | 关键配置 | 备注 |
|------|------|---------|---------|------|
| Node.js | 文件系统操作 | `fs/promises` | `>=18` | 跨平台 |
| git | 仓库状态提示 | 外部命令检测 | 用户本机版本 | 缺失不阻塞 |

### 7.4 内部跨模块依赖

| 依赖模块 | 调用接口/方法 | 输入 | 预期输出 | 当前状态 |
|---------|-------------|------|---------|--------|
| path utils | `getCwd()`、`getTemplateRoot()` | options | 绝对路径 | 待建 |
| fs utils | `writeIfMissing()` | path/content/options | action result | 待建 |

### 7.5 环境 & 权限要求

| 依赖项 | 说明 | 获取方式 |
|-------|------|--------|
| 环境变量 | 无必需环境变量 | N/A |
| 密钥/证书 | 无 | N/A |
| 网络策略 | 无 | N/A |
| 权限/角色 | 目标目录写权限 | 操作系统 |

---

## 8. 异常处理

### 8.1 异常分类

| 异常类型 | 触发条件 | 处理策略 | 用户感知 |
|---------|---------|---------|---------|
| 参数校验异常 | cwd 缺值或不可访问 | 返回错误码 2 | 看到路径错误 |
| 文件系统异常 | 创建目录、写入、备份失败 | 返回错误码 1 并中止 | 看到具体文件路径 |
| 外部依赖异常 | git 缺失或非 git 仓库 | 降级为提示 | init 继续 |

### 8.2 重试与降级

- 重试次数：0
- 重试间隔：N/A
- 降级策略：git 检测失败不阻塞；dry-run 避免写入

---

## 9. 局部配置

### 9.1 业务配置

| 配置项 | 配置 Key | 默认值 | 说明 |
|-------|---------|-------|------|
| 模板根目录 | `templateRoot` | `templates/project` | 初始化源 |
| 备份时间格式 | `backupTimestampFormat` | `yyyyMMddHHmmss` | 跨平台文件名 |

### 9.2 开关配置

| 开关 | 用途 | 默认状态 |
|-----|------|---------|
| `force` | 覆盖已有文件 | 关闭 |
| `backup` | 覆盖前备份 | 关闭 |
| `dryRun` | 预演模式 | 关闭 |

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
