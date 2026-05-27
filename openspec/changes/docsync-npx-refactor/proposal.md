---
mode: "full"
test-strategy: "tdd"
---

# proposal.md - 业务意图与上下文总览

> **定位**：变更的业务意图（Why）与上下文总览
>
> **可选性**：【可跳过，直入spec】若跳过，必须将"影响范围"在 specs 中补齐

---

## 1. 需求背景

### 1.1 现状问题
- 当前 DocSync 产品形态偏向"安装 npm CLI 后再使用多组命令"，使用路径偏长
- 命令拆分过细（init、prep、ai、auto、skill install、codex install、doctor），用户心智负担高
- 项目根目录散落多个配置文件（repomix.config.json、.markdownlint-cli2.jsonc、repomix-output.xml 等），污染项目结构
- 全局 npm 安装带来版本管理和多项目隔离问题

### 1.2 业务诉求
- 把 DocSync 改造成"每个项目通过 npx 快速引导，之后在 AI 工具内用少量指令完成文档同步"的工具
- 收敛为三个高价值 AI 指令：`/docsync:init`、`/docsync:sync`、`/docsync:rules`
- 所有 DocSync 相关资产收纳到 `.docsync/` 单一目录，避免污染项目根目录

---

## 2. 业务目标

| 目标维度 | 具体描述 | 验收标准 |
|---------|---------|----------|
| 功能目标 | npx 无参数引导入口，交互式 AI 工具选择，`.docsync/` 工作区创建，AI 适配器安装，三份核心文档初始化 | 空测试项目运行 npx 能完成交互式安装；三个 AI 指令正常工作 |
| 性能目标 | 引导流程任一步失败立即停止 | 失败时明确告知用户失败阶段，不静默继续 |
| 体验目标 | 用户心智负担降低，项目根目录保持干净 | 根目录只保留 README.md、AGENTS.md、CLAUDE.md 和 .docsync/ |

---

## 3. 能力分解

### 3.1 新增能力
- `npx-bootstrap`: npx 无参数引导入口，包含环境检查、AI 工具选择、工作区创建、适配器安装
- `ai-commands`: 三个精简 AI 指令（/docsync:init、/docsync:sync、/docsync:rules）
- `doc-sync-algorithm`: 文档同步算法（完整同步 + 快速同步双模式）
- `rules-management`: 规则优先级系统与 override/protected content 管理
- `workspace-isolation`: `.docsync/` 工作区结构与资产隔离

### 3.2 修改能力
- `cli-command-routing`: 改造现有 CLI 路由，新增 npx 入口，旧命令兼容为 legacy
- `project-initialization`: 重构 init 命令为 npx 引导流程
- `context-preparation`: 将 prep 能力内嵌到 init/sync 流程中
- `ai-workflow-orchestration`: 将 ai/auto 能力折叠到新的 AI 指令中
- `claude-skill-management`: 改为生成 Claude Code 项目 Skill 而非 CLI 安装
- `codex-rule-management`: 改为更新 AGENTS.md 标记块而非 CLI 安装

---

## 4. 影响范围

### 4.1 涉及模块
- [ ] CLI 入口（bin/docsync.mjs）：改为 npx 默认入口行为
- [ ] 命令路由（src/cli.mjs）：新增 npx bootstrap 路由，旧命令标记 legacy
- [ ] 核心模块（src/core/）：新增 environment、workspace、adapters、rules、context、sync-plan、protected-content、transaction 模块
- [ ] 模板系统（templates/）：新增 .docsync 工作区模板和 AI 适配器模板
- [ ] Claude Skill（.claude/skills/）：更新为新的三指令 Skill
- [ ] OPSX 规格（openspec/specs/）：更新现有规格以反映新能力

### 4.2 依赖关系
```
现有 DocSync CLI 代码 --> [npx 引导改造] --> 新的 AI 指令系统
                              |
                       .docsync/ 工作区
                              |
                   三份核心文档同步
```

### 4.3 数据影响
- 数据库表变更：无
- 接口变更：CLI 命令入口改变，旧命令标记为 legacy
- 配置变更：新增 .docsync/ 目录结构，新增 .docsync/state/install.json

---

## 5. 约束与假设

### 5.1 业务约束
- 保持 Node.js >= 18 运行环境要求
- 保持 ESM 模块格式
- 不读取或输出 .env、token、密钥文件
- 不执行 git commit、git push、npm publish

### 5.2 技术约束
- npx 引导流程必须 fail-fast，任一步骤失败立即停止
- 写入采用事务策略：先计算计划，再临时写入，检查 protected content，最后一次性落盘
- 规则优先级：用户指令 > 安全约束 > override.md > 仓库事实 > default.md > 模板

### 5.3 前置依赖
- [x] 现有 DocSync CLI 基础架构已存在
- [x] 项目已初始化 openspec 规格系统
- [ ] 需要定义 .docsync/ 工作区的完整目录结构

---

## 6. 风险评估

| 风险项 | 概率 | 影响 | 应对策略 |
|-------|------|------|---------|
| npx 首次执行速度慢 | 中 | 低 | 文档说明预期等待时间，增加进度提示 |
| 第三方工具配置路径兼容 | 中 | 中 | 优先使用命令行参数指定 .docsync/config/ 下的配置 |
| 旧命令迁移导致历史用户不兼容 | 低 | 中 | 分三阶段兼容过渡，保留旧命令作为 legacy alias |
| 规则系统与 override 冲突处理复杂 | 中 | 中 | 明确冲突检测与 fail-fast 策略 |

---

## 7. 相关文档

- 需求文档：`requirements/docsync-npx-refactor.md`
- 格式规则参考：`requirements/格式.md`
- 现有规格：`openspec/specs/` 下各能力规格

---

> **质量红线检查清单**
> - [x] 逻辑链路已闭环
> - [x] 受影响模块已明确
> - [x] 依赖关系已梳理
> - [x] 能力分解章节已明确列出所有能力（5 新增 + 6 修改）
