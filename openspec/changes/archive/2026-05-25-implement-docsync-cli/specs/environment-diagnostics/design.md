# 局部技术实现方案 - environment-diagnostics

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
| 1 | --cwd | options.cwd | string | ⚠️ 重命名 | 用于上下文路径检测 |
| 2 | --verbose | options.verbose | boolean | ⚠️ 重命名 | 显示命令路径/版本细节 |
| 3 | --quiet | options.quiet | boolean | ⚠️ 重命名 | 只输出摘要 |
| 4 | required tools | REQUIRED_TOOLS | array | ✅ 保留 | node/npm |
| 5 | recommended tools | RECOMMENDED_TOOLS | array | ✅ 保留 | git/repomix/markdownlint/claude/codex/gh |
| 6 | global files | GLOBAL_FILES | array | ✅ 保留 | Claude Skill、Codex AGENTS |

### 1.2 完整性自检

- **用户输入字段总数**：6 个
- **设计输出字段总数**：6 个
- **差异说明**：CLI 参数转换为 options；检查清单转换为常量数组
- **完整性确认**：[x] 已确认所有字段都有对应处理

### 1.3 需求项覆盖表

| Spec 需求项 | 设计覆盖位置 | 覆盖状态 |
|------------|-------------|---------|
| 环境工具检测 | 2.2、4.2、6.1 | ✅ 已覆盖 |
| 全局规则安装状态检测 | 2.2、4.2、6.1 | ✅ 已覆盖 |
| 状态输出格式 | 3.1、4.2、6.3 | ✅ 已覆盖 |

---

## 2. 现有代码锚点

### 2.1 需修改的现有文件

| 文件路径 | 类/模块名 | 需修改的方法/函数 | 修改类型 | 说明 |
|---------|----------|----------------|---------|------|
| 无 | 无 | 无 | 纯新建 | 当前仓库无 doctor 实现 |

### 2.2 需新建的文件

| 文件路径（建议） | 类/模块名 | 职责 | 继承/实现 | 说明 |
|------------|----------|------|---------|------|
| `src/commands/doctor.mjs` | doctor command | `runDoctor(options)` | N/A | 汇总环境检查 |
| `src/utils/shell.mjs` | shell utils | `hasCommand/getCommandVersion` | N/A | 工具检测 |
| `src/utils/paths.mjs` | path utils | `resolveHomePath` | N/A | 全局文件路径 |
| `src/utils/logger.mjs` | logger | 表格/摘要输出 | N/A | 稳定格式 |
| `test/doctor.test.mjs` | tests | doctor 行为测试 | node:test | 可选工具缺失不失败 |

### 2.3 现有逻辑约束

| 约束项 | 当前现状 | 对本设计的影响 | 应对策略 |
|-------|---------|-------------|--------|
| 必需工具 | node/npm | 缺失必须失败 | 遵循 |
| 推荐工具 | 允许缺失 | 缺失只影响状态 | 适配 |
| 数据安全 | 不得输出 token | 只检测存在状态和版本 | 遵循 |

---

## 3. 局部前端设计

CLI 文本表格作为用户界面。

### 3.1 页面/组件结构

| 组件名 | 类型 | 职责 | 依赖组件 |
|-------|------|------|---------|
| Doctor table | CLI 输出 | 展示工具状态 | logger |
| Doctor summary | CLI 输出 | 展示 required/recommended/globalFiles 结论 | logger |

### 3.2 状态管理

| 状态名 | 数据类型 | 初始值 | 更新时机 |
|-------|---------|-------|---------|
| checks.required | object[] | [] | 必需工具检测后 |
| checks.recommended | object[] | [] | 推荐工具检测后 |
| checks.globalFiles | object[] | [] | 文件存在性检测后 |
| exitCode | number | 0 | 发现必需工具缺失时设为 1 |

### 3.3 路由设计

| 路由路径 | 页面组件 | 权限要求 | 说明 |
|---------|---------|---------|------|
| 不适用 | N/A | N/A | CLI 命令 `docsync doctor` |

### 3.4 前后端交互

| 前端操作 | 调用接口 | 请求参数 | 响应处理 |
|---------|---------|---------|---------|
| 执行 doctor | `runDoctor(options)` | cwd/verbose/quiet | 输出完整检查结果 |

---

## 4. 局部后端接口设计

### 4.1 接口清单

| 接口名称 | 路径 | 方法 | 说明 |
|---------|------|------|------|
| Doctor | `docsync doctor` | 命令行调用 | 检查本机环境 |

### 4.2 接口详细设计

#### 接口 1：Doctor

**基本信息**：

- 路径：`docsync doctor`
- 方法：命令行调用
- 认证：不需要

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 约束 |
|-------|------|------|------|------|
| options.cwd | string | 否 | 当前项目目录 | 必须可访问 |
| options.verbose | boolean | 否 | 输出详细信息 | 默认 false |
| options.quiet | boolean | 否 | 输出摘要 | 默认 false |

**响应结构**：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "required": {"node": "ok", "npm": "ok"},
    "recommended": {"repomix": "missing"},
    "globalFiles": {"claudeSkill": "missing"}
  }
}
```

**业务逻辑**：

1. 检查 cwd 可访问。
2. 对 required tools 逐项执行命令存在和版本检测。
3. 对 recommended tools 逐项检测，任何缺失只记录状态。
4. 解析 home 路径并检查 Claude Skill、Codex AGENTS 文件存在性。
5. 输出稳定表格；required 缺失时返回 exit 1。

---

## 5. 局部数据模型

### 5.1 数据表设计

无数据库表。

### 5.2 缓存设计

无缓存。

### 5.3 数据流转图

```
[tool lists] --> [shell detection] --> [file existence checks] --> [doctor report] --> [exit code]
```

---

## 6. 模块内部逻辑

### 6.1 核心流程

```
[load check definitions]
  --> [check required tools]
  --> [check recommended tools]
  --> [check global files]
  --> [format report]
  --> [compute exit code]
```

### 6.2 状态机（如有）

```
[unchecked] --> [ok|missing|error]
```

### 6.3 关键算法（如有）

- `checkCommand(name)` 返回 `{ name, status, version?, required }`，不能抛出导致整体验证中断。
- 版本获取优先执行 `<cmd> --version`；失败时仍可标记 `ok`，version 为 `unknown`。
- `quiet` 只输出汇总，`verbose` 输出命令解析路径；二者冲突时使用路由层最终值。

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
| node | 必需工具检测 | 外部命令 | `--version` | 当前 CLI 运行时 |
| npm | 必需工具检测 | 外部命令 | `--version` | 发布/安装 |
| git/repomix/markdownlint-cli2/claude/codex/gh | 推荐工具检测 | 外部命令 | `--version` | 缺失不失败 |

### 7.4 内部跨模块依赖

| 依赖模块 | 调用接口/方法 | 输入 | 预期输出 | 当前状态 |
|---------|-------------|------|---------|--------|
| path utils | `resolveHomePath()` | path segments | absolute path | 待建 |
| shell utils | `hasCommand()` | command name | boolean/status | 待建 |

### 7.5 环境 & 权限要求

| 依赖项 | 说明 | 获取方式 |
|-------|------|--------|
| 环境变量 | HOME/USERPROFILE 用于 home 推断 | 操作系统 |
| 密钥/证书 | 不读取 | N/A |
| 网络策略 | 无 | N/A |
| 权限/角色 | 读取 home 下目标路径存在性 | 当前用户 |

---

## 8. 异常处理

### 8.1 异常分类

| 异常类型 | 触发条件 | 处理策略 | 用户感知 |
|---------|---------|---------|---------|
| 参数校验异常 | cwd 不可访问 | exit 2 | 路径错误 |
| 业务逻辑异常 | node/npm 缺失 | exit 1 | 必需工具缺失 |
| 外部依赖异常 | 推荐工具检测失败 | 标记 missing/error，继续 | 完整报告 |
| 文件权限异常 | home 目标不可读 | 标记 unknown，继续 | 状态提示 |

### 8.2 重试与降级

- 重试次数：0
- 重试间隔：N/A
- 降级策略：推荐工具和全局文件检测失败不阻塞 doctor

---

## 9. 局部配置

### 9.1 业务配置

| 配置项 | 配置 Key | 默认值 | 说明 |
|-------|---------|-------|------|
| 必需工具 | `REQUIRED_TOOLS` | `node,npm` | 缺失失败 |
| 推荐工具 | `RECOMMENDED_TOOLS` | `git,repomix,markdownlint-cli2,claude,codex,gh` | 缺失不失败 |

### 9.2 开关配置

| 开关 | 用途 | 默认状态 |
|-----|------|---------|
| `verbose` | 详细输出 | 关闭 |
| `quiet` | 摘要输出 | 关闭 |

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
