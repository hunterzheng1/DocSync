# 局部技术实现方案 - context-preparation

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
| 1 | --cwd | options.cwd | string | ⚠️ 重命名 | 内部 options 字段 |
| 2 | --compress | options.compress | boolean | ⚠️ 重命名 | 控制 Repomix 参数 |
| 3 | --no-lint | options.noLint | boolean | ⚠️ 重命名 | camelCase |
| 4 | --no-init | options.noInit | boolean | ⚠️ 重命名 | camelCase |
| 5 | --dry-run | options.dryRun | boolean | ⚠️ 重命名 | 预演流程 |
| 6 | --verbose | options.verbose | boolean | ⚠️ 重命名 | 详细日志 |

### 1.2 完整性自检

- **用户输入字段总数**：6 个
- **设计输出字段总数**：6 个
- **差异说明**：仅进行 CLI flag 到内部字段的命名转换
- **完整性确认**：[x] 已确认所有字段都有对应处理

### 1.3 需求项覆盖表

| Spec 需求项 | 设计覆盖位置 | 覆盖状态 |
|------------|-------------|---------|
| prep 工作流编排 | 4.2、6.1、6.2 | ✅ 已覆盖 |
| Repomix 上下文生成 | 4.2、7.3、8.1 | ✅ 已覆盖 |
| Markdown 格式修复 | 4.2、7.3、8.1 | ✅ 已覆盖 |
| git 状态输出 | 4.2、7.3、8.1 | ✅ 已覆盖 |

---

## 2. 现有代码锚点

### 2.1 需修改的现有文件

| 文件路径 | 类/模块名 | 需修改的方法/函数 | 修改类型 | 说明 |
|---------|----------|----------------|---------|------|
| 无 | 无 | 无 | 纯新建 | 当前仓库无 prep 实现 |

### 2.2 需新建的文件

| 文件路径（建议） | 类/模块名 | 职责 | 继承/实现 | 说明 |
|------------|----------|------|---------|------|
| `src/commands/prep.mjs` | prep command | 实现 `runPrep(options)` | N/A | 串行编排 init/git/repomix/lint |
| `src/utils/shell.mjs` | shell utils | `hasCommand/run/capture` | N/A | 外部命令检测和执行 |
| `src/utils/git.mjs` | git utils | `isGitRepo/getStatusShort` | N/A | git 状态辅助 |
| `src/utils/logger.mjs` | logger | 步骤状态输出 | N/A | 支持 quiet/verbose |

### 2.3 现有逻辑约束

| 约束项 | 当前现状 | 对本设计的影响 | 应对策略 |
|-------|---------|-------------|--------|
| init 为前置 | prep 默认先补齐配置 | `runPrep` 需调用 `runInit` | 遵循 |
| Repomix 必需 | 缺失即失败 | `hasCommand('repomix')` 为硬检查 | 遵循 |
| markdownlint 可选 | 缺失不失败 | 降级为提示 | 适配 |
| 不读大型输出 | 不把 repomix-output 全量读内存 | 只执行命令，不解析输出文件 | 遵循 |

---

## 3. 局部前端设计

CLI 文本输出即交互界面。

### 3.1 页面/组件结构

| 组件名 | 类型 | 职责 | 依赖组件 |
|-------|------|------|---------|
| Prep progress | CLI 输出 | 展示 init/git/repomix/lint 步骤状态 | logger |

### 3.2 状态管理

| 状态名 | 数据类型 | 初始值 | 更新时机 |
|-------|---------|-------|---------|
| status.init | string | `pending` | init 完成/跳过后 |
| status.gitStatus | string | `pending` | git 检测后 |
| status.repomix | string | `pending` | Repomix 执行后 |
| status.markdownlint | string | `pending` | lint 执行/跳过后 |

### 3.3 路由设计

| 路由路径 | 页面组件 | 权限要求 | 说明 |
|---------|---------|---------|------|
| 不适用 | N/A | N/A | CLI 命令 `docsync prep` |

### 3.4 前后端交互

| 前端操作 | 调用接口 | 请求参数 | 响应处理 |
|---------|---------|---------|---------|
| 执行 prep | `runPrep(options)` | prep options | 输出步骤状态和错误 |

---

## 4. 局部后端接口设计

### 4.1 接口清单

| 接口名称 | 路径 | 方法 | 说明 |
|---------|------|------|------|
| Prep | `docsync prep` | 命令行调用 | 准备 AI 文档同步上下文 |

### 4.2 接口详细设计

#### 接口 1：Prep

**基本信息**：

- 路径：`docsync prep`
- 方法：命令行调用
- 认证：不需要

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 约束 |
|-------|------|------|------|------|
| options.cwd | string | 否 | 目标项目目录 | 默认 cwd |
| options.compress | boolean | 否 | 使用 `repomix --compress` | 默认 false |
| options.noLint | boolean | 否 | 跳过 lint | 默认 false |
| options.noInit | boolean | 否 | 跳过 init | 默认 false |
| options.dryRun | boolean | 否 | 预演 | 不执行写入命令 |

**响应结构**：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "init": "completed",
    "gitStatus": "printed",
    "repomix": "completed",
    "markdownlint": "completed"
  }
}
```

**业务逻辑**：

1. 解析 cwd。
2. `noInit=false` 时调用 `runInit(options)`。
3. git 可用且 cwd 为 git 仓库时输出 `git status --short`。
4. 检测 Repomix；缺失时抛出 exit 1。
5. 根据 `compress` 运行 `repomix` 或 `repomix --compress`。
6. `noLint=false` 且 markdownlint 可用时运行 `markdownlint-cli2 --fix`。
7. 输出下一步提示。

---

## 5. 局部数据模型

### 5.1 数据表设计

无数据库表。

### 5.2 缓存设计

无缓存。

### 5.3 数据流转图

```
[cwd]
  --> [init templates]
  --> [git status]
  --> [repomix-output.xml]
  --> [markdownlint --fix]
  --> [AI-ready context]
```

---

## 6. 模块内部逻辑

### 6.1 核心流程

```
[resolve cwd]
  --> [maybe runInit]
  --> [maybe print git status]
  --> [require repomix]
  --> [run repomix]
  --> [maybe run markdownlint]
  --> [print summary]
```

### 6.2 状态机（如有）

```
[pending] --> [init_done|init_disabled]
  --> [git_printed|git_skipped]
  --> [repomix_completed|failed]
  --> [lint_completed|lint_skipped|lint_missing]
```

### 6.3 关键算法（如有）

- 外部命令统一通过 `run(command, args, { cwd })` 执行，避免字符串拼接。
- Windows 下 shell 执行由 `shell.mjs` 封装，调用方只传 command 与 args 数组。
- `dryRun` 模式下打印将执行的命令序列，并跳过 `runInit` 写入和外部写入命令。

---

## 7. 外部依赖与集成

### 7.1 外部服务依赖

| 依赖服务 | 用途 | 调用方式 | 超时设置 | 失败影响 | 降级方案 |
|---------|------|---------|---------|---------|--------|
| 无 | N/A | N/A | N/A | N/A | N/A |

### 7.2 第三方 API / SDK

| 名称 | 版本/文档链接 | 用途 | 鉴权方式 | 费用/限流 | 备注 |
|------|-------------|------|---------|----------|------|
| 无 | N/A | N/A | 无 | 无 | 不内置 SDK |

### 7.3 中间件 & 基础设施

| 组件 | 用途 | 使用方式 | 关键配置 | 备注 |
|------|------|---------|---------|------|
| Repomix | 生成仓库上下文 | 外部命令 | `repomix.config.json` | 必需 |
| markdownlint-cli2 | 修复 Markdown | 外部命令 | `.markdownlint-cli2.jsonc` | 可选 |
| git | 输出变更状态 | 外部命令 | cwd git 仓库 | 可选 |

### 7.4 内部跨模块依赖

| 依赖模块 | 调用接口/方法 | 输入 | 预期输出 | 当前状态 |
|---------|-------------|------|---------|--------|
| project-initialization | `runInit(options)` | cwd/force/dryRun | init result | 待建 |
| shell utils | `hasCommand/run/capture` | command/args | status/output | 待建 |

### 7.5 环境 & 权限要求

| 依赖项 | 说明 | 获取方式 |
|-------|------|--------|
| 环境变量 | 无必需环境变量 | N/A |
| 密钥/证书 | 无 | N/A |
| 网络策略 | 无 | N/A |
| 权限/角色 | 项目目录写权限；外部命令执行权限 | 操作系统 |

---

## 8. 异常处理

### 8.1 异常分类

| 异常类型 | 触发条件 | 处理策略 | 用户感知 |
|---------|---------|---------|---------|
| 参数校验异常 | cwd 不可访问 | exit 2 | 路径错误 |
| 业务逻辑异常 | Repomix 缺失 | exit 1 + 安装提示 | 明确安装命令 |
| 外部依赖异常 | markdownlint 缺失、git 缺失 | 提示并降级 | prep 可继续 |
| 外部命令失败 | repomix 返回非 0 | exit 1 | 显示命令失败 |

### 8.2 重试与降级

- 重试次数：0
- 重试间隔：N/A
- 降级策略：git/markdownlint 缺失降级为提示；Repomix 缺失不降级

---

## 9. 局部配置

### 9.1 业务配置

| 配置项 | 配置 Key | 默认值 | 说明 |
|-------|---------|-------|------|
| Repomix 输出文件 | `repomixOutput` | `repomix-output.xml` | 由模板配置控制 |
| lint 命令 | `markdownlintCommand` | `markdownlint-cli2 --fix` | 可选执行 |

### 9.2 开关配置

| 开关 | 用途 | 默认状态 |
|-----|------|---------|
| `compress` | 压缩 Repomix 输出 | 关闭 |
| `noLint` | 跳过 lint | 关闭 |
| `noInit` | 跳过 init | 关闭 |

---

> **质量红线检查清单**
>
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
