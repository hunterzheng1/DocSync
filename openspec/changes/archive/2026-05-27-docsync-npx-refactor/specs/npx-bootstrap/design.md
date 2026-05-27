# 局部技术实现方案 - npx-bootstrap

> **定位**：npx 无参数引导入口的技术实现方案
>
> **⚠️ 边界声明**：本设计仅服务于 npx-bootstrap 能力，严禁越权设计其他模块逻辑。

---

## 1. 字段完整性追溯表

### 1.1 字段映射表

| 序号 | 用户输入字段 | 设计输出字段 | 字段类型 | 状态 | 理由说明 |
|-----|-------------|-------------|---------|------|---------|
| 1 | Node.js 版本要求 | env.nodeVersion | string | ✅ 保留 | 用于环境检查 |
| 2 | 目录可写性 | workspace.writable | boolean | ✅ 保留 | 用于安全检查 |
| 3 | git 仓库状态 | workspace.isGitRepo | boolean | ✅ 保留 | 用于仓库检测 |
| 4 | AI 工具选择 | install.aiTool | enum | ✅ 保留 | claude/codex/all |
| 5 | install.json 结构 | install.* | object | ✅ 保留 | 记录安装状态 |

### 1.2 完整性自检

- **用户输入字段总数**：5 个
- **设计输出字段总数**：5 个
- **差异说明**：无差异
- **完整性确认**：[x] 已确认所有字段都有对应处理

---

## 2. 现有代码锚点

### 2.1 需修改的现有文件

| 文件路径 | 类/模块名 | 需修改的方法/函数 | 修改类型 | 说明 |
|---------|----------|----------------|---------|------|
| `bin/docsync.mjs` | 入口 | 启动逻辑 | 扩展逻辑 | 无参数时进入 bootstrap |
| `src/cli.mjs` | 路由 | parseArgs() | 扩展逻辑 | 识别无参数入口 |

### 2.2 需新建的文件

| 文件路径（建议） | 类/模块名 | 职责 | 继承/实现 | 说明 |
|------------|----------|------|---------|------|
| `src/commands/init.mjs` | bootstrap() | npx 引导主入口 | 6 阶段流程 | 核心新增文件 |
| `src/core/environment.mjs` | checkAll() | 环境检查 | 逐项检查 | Node.js/npm/git/目录 |
| `src/core/workspace.mjs` | createWorkspace() | 工作区创建 | 创建 .docsync/ | 目录结构和默认文件 |

### 2.3 现有逻辑约束

| 约束项 | 当前现状 | 对本设计的影响 | 应对策略 |
|-------|---------|-------------|--------|
| ESM 模块格式 | 项目使用 .mjs | 新文件必须使用 .mjs | 遵循 |
| 命令分发 | src/cli.mjs 已有 | 需集成到现有路由 | 添加无参数分支 |

---

## 6. 模块内部逻辑

### 6.1 核心流程 - 6 阶段引导

```
[bin/docsync.mjs]
  ├─ 无参数? → 是 → [src/commands/init.mjs:bootstrap()]
  │                  ├─ 阶段1: locateProjectDir() → 检查 cwd/可写/危险/git
  │                  ├─ 阶段2: checkEnvironment() → Node.js>=18/npm/git/可写
  │                  ├─ 阶段3: promptAITool() → 交互式选择 claude/codex/all
  │                  ├─ 阶段4: createWorkspace() → 创建 .docsync/ 完整结构
  │                  ├─ 阶段5: installAdapters() → 根据 aiTool 安装适配器
  │                  └─ 阶段6: initCoreDocs() → 检查/创建 README/AGENTS/CLAUDE
  └─ 有参数? → 否 → [现有命令分发]
```

### 6.2 状态机

```
[开始] → [阶段1:定位目录]
  ├─ 通过 → [阶段2:环境检查]
  │         ├─ 通过 → [阶段3:AI选择]
  │         │         ├─ 完成 → [阶段4:工作区]
  │         │         │         ├─ 完成 → [阶段5:适配器]
  │         │         │         │         ├─ 完成 → [阶段6:文档初始化]
  │         │         │         │         │         └─ 完成 → [成功,写入install.json]
  │         │         │         │         └─ 失败 → [停止,报告失败阶段]
  │         │         │         └─ 失败 → [停止,报告失败阶段]
  │         │         └─ 取消 → [停止]
  │         └─ 失败 → [停止,报告失败阶段]
  └─ 失败 → [停止,报告失败阶段]
```

### 6.3 install.json 写入策略

```javascript
// 先计算计划写入清单
const plan = computeInstallPlan(aiTool);
// 写入临时 diff
const tempResults = await executePlan(plan);
// 检查 protected content（不适用，首次安装）
// 一次性落盘
await writeInstallJson({
  version: 1,
  installedAt: new Date().toISOString(),
  docsyncVersion: pkg.version,
  aiTool,
  filesCreated: tempResults.files,
  templateVersion: '1.0.0'
});
```

---

## 7. 外部依赖与集成

### 7.1 内部跨模块依赖

| 依赖模块 | 调用接口/方法 | 输入 | 预期输出 | 当前状态 |
|---------|-------------|------|---------|--------|
| src/core/environment.mjs | checkAll() | 无 | { ok: boolean, details: object } | 待建 |
| src/core/workspace.mjs | createWorkspace() | { cwd, aiTool } | { files: string[] } | 待建 |
| src/utils/prompt.mjs | select() | { options } | selected value | 已有 |

---

## 8. 异常处理

### 8.1 异常分类

| 异常类型 | 触发条件 | 处理策略 | 用户感知 |
|---------|---------|---------|---------|
| ERR_NODE_VERSION | Node.js < 18 | 立即停止 | 错误消息含当前版本 |
| ERR_DIR_UNWRITABLE | 目录无写权限 | 立即停止 | 提示更换目录 |
| ERR_DANGEROUS_DIR | 位于 home/磁盘根目录 | 立即停止 | 提示选择项目目录 |

### 8.2 重试与降级

- 无重试（fail-fast 策略）
- 降级：不适用

---

## 9. 局部配置

### 9.1 业务配置

| 配置项 | 配置 Key | 默认值 | 说明 |
|-------|---------|-------|------|
| 必需 Node 版本 | env.minNodeVersion | 18 | 语义化版本检查 |
| 危险目录列表 | config.dangerousDirs | ['/', '/home', 'C:\\'] | 可扩展 |

---

> **质量红线检查清单**
>
> - [x] **现有代码锚点已标注**
> - [x] **现有约束已识别**
> - [x] **字段完整性**：追溯表已完成
> - [x] **边界遵守**：无越权设计
> - [x] **外部依赖已明确**
> - [x] **环境权限已确认**
> - [x] 异常处理策略已定义
> - [x] 包含足够的局部细节支持任务拆解
