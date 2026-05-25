# 局部技术实现方案 - ai-workflow-orchestration

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
| 1 | command | command | string | ✅ 保留 | 区分 `ai` 和 `auto` |
| 2 | --docs | options.docs | string[] | ⚠️ 重命名 | 逗号分隔值解析为数组 |
| 3 | --extra | options.extra | string | ⚠️ 重命名 | 原样并入 prompt |
| 4 | --compress | options.compress | boolean | ⚠️ 重命名 | 透传 prep |
| 5 | --no-lint | options.noLint | boolean | ⚠️ 重命名 | 透传 prep |
| 6 | --no-init | options.noInit | boolean | ⚠️ 重命名 | 透传 prep |
| 7 | --dry-run | options.dryRun | boolean | ⚠️ 重命名 | auto 预演 |

### 1.2 完整性自检

- **用户输入字段总数**：7 个
- **设计输出字段总数**：7 个
- **差异说明**：`--docs` 从字符串拆分为数组，其余为命名转换
- **完整性确认**：[x] 已确认所有字段都有对应处理

### 1.3 需求项覆盖表

| Spec 需求项 | 设计覆盖位置 | 覆盖状态 |
|------------|-------------|---------|
| AI prompt 构建 | 2.2、4.2、6.3 | ✅ 已覆盖 |
| 交互 AI 工作流 | 4.2、6.1、8.2 | ✅ 已覆盖 |
| 自动 AI 工作流 | 4.2、6.1、8.1 | ✅ 已覆盖 |

---

## 2. 现有代码锚点

### 2.1 需修改的现有文件

| 文件路径 | 类/模块名 | 需修改的方法/函数 | 修改类型 | 说明 |
|---------|----------|----------------|---------|------|
| 无 | 无 | 无 | 纯新建 | 当前仓库无 AI 工作流实现 |

### 2.2 需新建的文件

| 文件路径（建议） | 类/模块名 | 职责 | 继承/实现 | 说明 |
|------------|----------|------|---------|------|
| `src/commands/ai.mjs` | ai command | `runAi(options)` | N/A | prep + Claude 交互或 prompt fallback |
| `src/commands/auto.mjs` | auto command | `runAuto(options)` | N/A | Claude print mode 编排 |
| `src/utils/prompt.mjs` | prompt builder | `buildDocSyncPrompt(options)` | N/A | 构建硬规则 prompt |
| `src/utils/shell.mjs` | shell utils | `hasCommand/run` | N/A | 检测/调用 Claude |
| `test/prompt.test.mjs` | tests | prompt 规则测试 | node:test | 覆盖 docs/extra/hard rules |

### 2.3 现有逻辑约束

| 约束项 | 当前现状 | 对本设计的影响 | 应对策略 |
|-------|---------|-------------|--------|
| 不内置 LLM API | 产品非目标 | 只调用外部 `claude` 或打印 prompt | 遵循 |
| prep 是前置 | spec 要求先准备上下文 | `runAi/runAuto` 必须调用 `runPrep` | 遵循 |
| 自动模式风险 | auto 实验性且权限受限 | allowedTools 白名单硬编码 | 适配 |

---

## 3. 局部前端设计

### 3.1 页面/组件结构

| 组件名 | 类型 | 职责 | 依赖组件 |
|-------|------|------|---------|
| Prompt output | CLI 输出 | Claude 缺失时展示可复制 prompt | logger |
| Auto warning | CLI 输出 | auto 模式风险提示 | logger |

### 3.2 状态管理

| 状态名 | 数据类型 | 初始值 | 更新时机 |
|-------|---------|-------|---------|
| prompt | string | "" | prompt 构建后 |
| claudeStatus | string | `unknown` | hasCommand 检测后 |
| prepStatus | string | `pending` | runPrep 完成后 |

### 3.3 路由设计

| 路由路径 | 页面组件 | 权限要求 | 说明 |
|---------|---------|---------|------|
| 不适用 | N/A | N/A | CLI 命令 `docsync ai/auto` |

### 3.4 前后端交互

| 前端操作 | 调用接口 | 请求参数 | 响应处理 |
|---------|---------|---------|---------|
| 执行 ai | `runAi(options)` | docs/extra/prep options | 启动 Claude 或打印 prompt |
| 执行 auto | `runAuto(options)` | docs/extra/prep/dryRun | 执行或打印 Claude print mode |

---

## 4. 局部后端接口设计

### 4.1 接口清单

| 接口名称 | 路径 | 方法 | 说明 |
|---------|------|------|------|
| AI | `docsync ai` | 命令行调用 | 推荐交互工作流 |
| Auto | `docsync auto` | 命令行调用 | 实验性非交互工作流 |

### 4.2 接口详细设计

#### 接口 1：AI / Auto

**基本信息**：
- 路径：`docsync ai` / `docsync auto`
- 方法：命令行调用
- 认证：不需要；Claude 自身认证由用户环境负责

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 | 约束 |
|-------|------|------|------|------|
| options.docs | string[] | 否 | 文档范围 | 允许 `readme/agents/claude/docs` |
| options.extra | string | 否 | 附加要求 | 原样追加 |
| options.dryRun | boolean | 否 | 预演 | auto 下不启动 Claude |

**响应结构**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "prep": "completed",
    "claude": "launched",
    "prompt": "passed-to-claude"
  }
}
```

**业务逻辑**：
1. 校验 docs 范围。
2. 调用 `runPrep(options)`。
3. 调用 `buildDocSyncPrompt(options)`。
4. `ai`：检测 `claude`，存在则 `run('claude', [prompt])`，缺失则打印 prompt。
5. `auto`：构建 `claude -p` 参数和 allowedTools；`dryRun` 时只打印。
6. 任何 prep 失败直接返回失败，不继续 Claude。

---

## 5. 局部数据模型

### 5.1 数据表设计

无数据库表。

### 5.2 缓存设计

无缓存。

### 5.3 数据流转图

```
[options] --> [runPrep] --> [buildDocSyncPrompt] --> [claude available?] --> [launch Claude | print prompt]
```

---

## 6. 模块内部逻辑

### 6.1 核心流程

```
[validate docs]
  --> [prep]
  --> [build prompt]
  --> [ai? launch/fallback]
  --> [auto? dry-run/print-mode]
```

### 6.2 状态机（如有）

```
[pending] --> [prep_failed]
[pending] --> [prep_done] --> [prompt_ready] --> [claude_launched|prompt_printed|auto_dry_run]
```

### 6.3 关键算法（如有）

- prompt 使用固定硬规则数组拼接，`extra` 只追加在末尾，不能覆盖硬规则。
- prompt 中包含事实来源：git diff、repomix-output.xml、README.md、AGENTS.md、CLAUDE.md、docs/doc-sync-rules.md。
- 若 prompt 长度超过 16 KB，设计任务需改为临时 prompt 文件策略；第一版先检测并提示。

---

## 7. 外部依赖与集成

### 7.1 外部服务依赖

| 依赖服务 | 用途 | 调用方式 | 超时设置 | 失败影响 | 降级方案 |
|---------|------|---------|---------|---------|--------|
| Claude Code CLI | AI 文档同步 | 本地命令 | 由用户交互控制 | `ai` fallback 打印 prompt；`auto` 失败 | 打印 prompt 或错误 |

### 7.2 第三方 API / SDK

| 名称 | 版本/文档链接 | 用途 | 鉴权方式 | 费用/限流 | 备注 |
|------|-------------|------|---------|----------|------|
| 无 | N/A | 不内置 LLM API | 无 | 无 | 只调用本地 CLI |

### 7.3 中间件 & 基础设施

| 组件 | 用途 | 使用方式 | 关键配置 | 备注 |
|------|------|---------|---------|------|
| claude | 交互或 print mode | 外部命令 | 用户环境 | 可缺失 |
| repomix | prep 前置 | 外部命令 | repomix.config.json | 必需 |
| markdownlint-cli2 | prep 可选 | 外部命令 | .markdownlint-cli2.jsonc | 可选 |

### 7.4 内部跨模块依赖

| 依赖模块 | 调用接口/方法 | 输入 | 预期输出 | 当前状态 |
|---------|-------------|------|---------|--------|
| context-preparation | `runPrep(options)` | prep options | prepared context | 待建 |
| shell utils | `hasCommand/run` | command/args | command result | 待建 |

### 7.5 环境 & 权限要求

| 依赖项 | 说明 | 获取方式 |
|-------|------|--------|
| 环境变量 | 无 DocSync 必需变量 | N/A |
| 密钥/证书 | Claude 认证不由 DocSync 管理 | 用户 Claude 环境 |
| 网络策略 | DocSync 不直接联网 | N/A |
| 权限/角色 | 本地命令执行权限 | 操作系统 |

---

## 8. 异常处理

### 8.1 异常分类

| 异常类型 | 触发条件 | 处理策略 | 用户感知 |
|---------|---------|---------|---------|
| 参数校验异常 | docs 未知值、extra 缺值 | exit 2 | 参数错误 |
| 业务逻辑异常 | prep 失败 | 透传 prep exit code | 看到 prep 失败原因 |
| 外部依赖异常 | claude 缺失 | ai 打印 prompt；auto 报错或 dry-run | 明确 fallback |
| 安全异常 | auto 工具超出白名单 | 阻止命令构建 | 看到安全拒绝 |

### 8.2 重试与降级

- 重试次数：0
- 重试间隔：N/A
- 降级策略：`ai` 中 Claude 缺失时打印 prompt；`auto --dry-run` 不执行外部命令

---

## 9. 局部配置

### 9.1 业务配置

| 配置项 | 配置 Key | 默认值 | 说明 |
|-------|---------|-------|------|
| 默认文档范围 | `defaultDocs` | `readme,agents,claude` | prompt 目标 |
| prompt 长度上限 | `promptMaxLength` | `16384` | shell 安全边界 |

### 9.2 开关配置

| 开关 | 用途 | 默认状态 |
|-----|------|---------|
| `dryRun` | auto 预演 | 关闭 |
| `noLint` | prep 透传 | 关闭 |
| `noInit` | prep 透传 | 关闭 |

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
