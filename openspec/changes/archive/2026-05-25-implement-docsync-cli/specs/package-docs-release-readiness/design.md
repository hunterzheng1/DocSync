# 局部技术实现方案 - package-docs-release-readiness

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
| 1 | npm script | package.scripts | object | ⚠️ 重命名 | npm 脚本落入 package.json |
| 2 | package name | package.name | string | ⚠️ 重命名 | npm manifest 字段 |
| 3 | package version | package.version | semver string | ⚠️ 重命名 | npm manifest 字段 |
| 4 | files | package.files | string[] | ⚠️ 重命名 | npm 发布白名单 |
| 5 | README 要求 | README.md sections | markdown | ⚠️ 重命名 | 文档章节实现 |
| 6 | AGENTS 要求 | AGENTS.md sections | markdown | ⚠️ 重命名 | agent 维护说明 |
| 7 | License 要求 | LICENSE | text | ✅ 保留 | MIT License 文本 |

### 1.2 完整性自检

- **用户输入字段总数**：7 个
- **设计输出字段总数**：7 个
- **差异说明**：需求字段映射到 package manifest 与仓库文档文件
- **完整性确认**：[x] 已确认所有字段都有对应处理

### 1.3 需求项覆盖表

| Spec 需求项 | 设计覆盖位置 | 覆盖状态 |
|------------|-------------|---------|
| npm 包发布元数据 | 2.2、4.2、9.1 | ✅ 已覆盖 |
| 项目文档完备 | 2.2、3.1、4.2 | ✅ 已覆盖 |
| 发布安全检查 | 4.2、6.3、8.1 | ✅ 已覆盖 |
| 测试与验收命令 | 4.1、4.2、7.4 | ✅ 已覆盖 |

---

## 2. 现有代码锚点

### 2.1 需修改的现有文件

| 文件路径 | 类/模块名 | 需修改的方法/函数 | 修改类型 | 说明 |
|---------|----------|----------------|---------|------|
| `.gitignore` | git ignore | N/A | 扩展逻辑 | 当前已有文件，需补齐发布安全忽略项 |
| `DESIGN.md` | design doc | N/A | 保留 | 作为需求来源，不在本 capability 中重写 |

### 2.2 需新建的文件

| 文件路径（建议） | 类/模块名 | 职责 | 继承/实现 | 说明 |
|------------|----------|------|---------|------|
| `package.json` | npm manifest | 发布元数据和 scripts | N/A | 必须配置 bin/files/engines |
| `.npmignore` | npm ignore | 防止敏感/测试文件进入包 | N/A | 与 files 白名单互补 |
| `README.md` | user docs | 安装、命令、安全、发布说明 | N/A | 面向用户 |
| `AGENTS.md` | agent docs | 开发规则和验证命令 | N/A | 面向 coding agent |
| `CHANGELOG.md` | changelog | 版本记录 | N/A | 初始 0.1.0 |
| `LICENSE` | license | MIT License | N/A | 2026 Hunter Zheng |
| `test/*.test.mjs` | tests | 基础行为验证 | node:test | 发布前质量保障 |

### 2.3 现有逻辑约束

| 约束项 | 当前现状 | 对本设计的影响 | 应对策略 |
|-------|---------|-------------|--------|
| 不自动发布 | proposal 明确非目标 | scripts 可提供 release，但不自动执行 | 遵循 |
| 不自动提交 | proposal 明确非目标 | 文档只写验证要求，不触发 git commit | 遵循 |
| scope 可能调整 | npm scope 需人工确认 | README/package 保留发布前检查提示 | 适配 |
| files 白名单 | 安全要求 | package.files 必须限制发布内容 | 遵循 |

---

## 3. 局部前端设计

无应用前端；README/AGENTS 是面向用户与 agent 的文档界面。

### 3.1 页面/组件结构

| 组件名 | 类型 | 职责 | 依赖组件 |
|-------|------|------|---------|
| README sections | 文档 | 安装、快速开始、命令、安全、License | package/scripts |
| AGENTS sections | 文档 | 开发规则、验证命令、安全约束 | package/scripts |

### 3.2 状态管理

| 状态名 | 数据类型 | 初始值 | 更新时机 |
|-------|---------|-------|---------|
| publishReadiness | string | `draft` | 验证命令通过且 pack 输出人工确认后 |

### 3.3 路由设计

| 路由路径 | 页面组件 | 权限要求 | 说明 |
|---------|---------|---------|------|
| 不适用 | N/A | N/A | 静态仓库文档 |

### 3.4 前后端交互

| 前端操作 | 调用接口 | 请求参数 | 响应处理 |
|---------|---------|---------|---------|
| 查看 README | N/A | N/A | 用户获得使用说明 |
| 查看 AGENTS | N/A | N/A | agent 获得执行规则 |

---

## 4. 局部后端接口设计

### 4.1 接口清单

| 接口名称 | 路径 | 方法 | 说明 |
|---------|------|------|------|
| Test script | `npm test` | npm script | 运行 Node test runner |
| Lint script | `npm run lint` | npm script | 运行 `node --check` |
| Pack dry-run | `npm run pack:dry` | npm script | 检查发布包内容 |

### 4.2 接口详细设计

#### 接口 1：Release readiness scripts

**基本信息**：

- 路径：`npm test` / `npm run lint` / `npm run pack:dry`
- 方法：命令行调用
- 认证：不需要；npm publish 需用户自行认证

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 约束 |
|-------|------|------|------|------|
| script | string | 是 | npm script 名称 | `test/lint/pack:dry` |
| package.files | string[] | 是 | 发布白名单 | 只包含允许目录/文件 |

**响应结构**：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "test": "passed",
    "lint": "passed",
    "packDryRun": "review-required"
  }
}
```

**业务逻辑**：

1. `package.json` 定义元数据、bin、files、engines、scripts。
2. README/AGENTS/CHANGELOG/LICENSE 补齐对应章节。
3. `.gitignore` 和 `.npmignore` 排除敏感与生成文件。
4. `npm run pack:dry` 只检查，不发布。
5. README 中声明首次 scoped public 发布需 `npm publish --access public`，但不自动执行。

---

## 5. 局部数据模型

### 5.1 数据表设计

无数据库表。

### 5.2 缓存设计

无缓存。

### 5.3 数据流转图

```
[package.json + docs + ignore files]
  --> [npm test / lint / pack:dry]
  --> [manual review]
  --> [publish-ready decision]
```

---

## 6. 模块内部逻辑

### 6.1 核心流程

```
[create package metadata]
  --> [create docs]
  --> [create ignore rules]
  --> [add tests]
  --> [run verification scripts]
  --> [manual pack review]
```

### 6.2 状态机（如有）

```
[draft] --> [metadata_ready] --> [docs_ready] --> [tests_ready] --> [pack_reviewed] --> [publish_ready]
```

### 6.3 关键算法（如有）

- `package.files` 使用白名单策略，优先于依赖 `.npmignore`。
- `npm pack --dry-run` 输出必须人工检查 forbidden patterns：`.env`、密钥、token、`repomix-output.xml`、测试临时目录。
- `lint` 第一版至少覆盖 `bin/docsync.mjs` 与 `src/cli.mjs`，后续可扩展所有 `.mjs`。

---

## 7. 外部依赖与集成

### 7.1 外部服务依赖

| 依赖服务 | 用途 | 调用方式 | 超时设置 | 失败影响 | 降级方案 |
|---------|------|---------|---------|---------|--------|
| npm registry | 手动发布包 | `npm publish` | 用户命令控制 | 发布失败 | 调整 scope/version 后重试 |

### 7.2 第三方 API / SDK

| 名称 | 版本/文档链接 | 用途 | 鉴权方式 | 费用/限流 | 备注 |
|------|-------------|------|---------|----------|------|
| node:test | Node.js >=18 内置 | 单元测试 | 无 | 无 | 不引入第三方测试框架 |

### 7.3 中间件 & 基础设施

| 组件 | 用途 | 使用方式 | 关键配置 | 备注 |
|------|------|---------|---------|------|
| Node.js | CLI/test/lint | 本地运行 | `>=18` | 必需 |
| npm | pack/publish/scripts | 本地运行 | `>=9` | 必需 |

### 7.4 内部跨模块依赖

| 依赖模块 | 调用接口/方法 | 输入 | 预期输出 | 当前状态 |
|---------|-------------|------|---------|--------|
| cli-command-routing | `bin.docsync` | bin path | 可执行 CLI | 待建 |
| project-initialization | tests | fixture cwd | template output | 待建 |
| environment-diagnostics | `doctor` verification | local env | status report | 待建 |

### 7.5 环境 & 权限要求

| 依赖项 | 说明 | 获取方式 |
|-------|------|--------|
| 环境变量 | 无必需；npm publish 使用用户 npm 环境 | 用户环境 |
| 密钥/证书 | 不写入仓库 | N/A |
| 网络策略 | pack/test/lint 不需要网络；publish 需要用户主动联网 | 用户控制 |
| 权限/角色 | 仓库写权限；npm 发布权限由用户账号决定 | 用户环境 |

---

## 8. 异常处理

### 8.1 异常分类

| 异常类型 | 触发条件 | 处理策略 | 用户感知 |
|---------|---------|---------|---------|
| 配置异常 | package 字段缺失、semver 非法 | 阻止 publish-ready | 配置错误 |
| 验证异常 | test/lint 失败 | 修复后重跑 | 验证失败 |
| 发布安全异常 | pack 包含 forbidden 文件 | 调整 files/ignore 后重跑 | 安全阻断 |
| 外部依赖异常 | npm 缺失或未登录 | doctor/publish 提示 | 用户处理环境 |

### 8.2 重试与降级

- 重试次数：0
- 重试间隔：N/A
- 降级策略：包名 scope 不可用时人工改为真实 scope 或未占用包名

---

## 9. 局部配置

### 9.1 业务配置

| 配置项 | 配置 Key | 默认值 | 说明 |
|-------|---------|-------|------|
| 包名 | `package.name` | `@hunterzheng1/docsync` | 发布前人工确认 |
| 版本 | `package.version` | `0.1.0` | 初始版本 |
| Node 版本 | `package.engines.node` | `>=18` | 运行约束 |
| 发布白名单 | `package.files` | `bin,src,templates,README.md,LICENSE,CHANGELOG.md` | 安全边界 |

### 9.2 开关配置

| 开关 | 用途 | 默认状态 |
|-----|------|---------|
| release script | patch 发布便利脚本 | 存在但不自动执行 |
| pack dry-run | 发布前检查 | 手动执行 |

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
