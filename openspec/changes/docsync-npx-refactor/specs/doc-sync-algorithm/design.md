# 局部技术实现方案 - doc-sync-algorithm

> **定位**：文档同步算法的技术实现方案
>
> **⚠️ 边界声明**：本设计仅服务于 doc-sync-algorithm 能力，严禁越权设计其他模块逻辑。

---

## 1. 字段完整性追溯表

| 序号 | 用户输入字段 | 设计输出字段 | 字段类型 | 状态 | 理由说明 |
|-----|-------------|-------------|---------|------|---------|
| 1 | rules/default.md | syncInput.defaultRules | string | ✅ 保留 | 默认规则内容 |
| 2 | rules/override.md | syncInput.overrideRules | string | ✅ 保留 | 覆盖规则内容 |
| 3 | repomix-output.xml | syncInput.repomixContext | string | ✅ 保留 | 项目上下文 |
| 4 | git-status.txt | syncInput.gitStatus | string | ✅ 保留 | git 状态 |
| 5 | target-docs | syncInput.targets | string[] | ✅ 保留 | 目标文档列表 |
| 6 | mode | syncInput.mode | enum | ✅ 保留 | full/fast |
| 7 | 同步报告 | SyncReport | object | ✅ 保留 | 结构化输出 |

### 1.2 完整性自检
- **用户输入字段总数**：7 个
- **设计输出字段总数**：7 个
- **差异说明**：无差异
- **完整性确认**：[x] 已确认所有字段都有对应处理

---

## 2. 现有代码锚点

### 2.1 需修改的现有文件

| 文件路径 | 类/模块名 | 需修改的方法/函数 | 修改类型 | 说明 |
|---------|----------|----------------|---------|------|
| `src/core/context.mjs` | 上下文模块 | generateContext() | 扩展逻辑 | 刷新上下文到 .docsync/context/ |

### 2.2 需新建的文件

| 文件路径（建议） | 类/模块名 | 职责 | 继承/实现 | 说明 |
|------------|----------|------|---------|------|
| `src/core/sync-plan.mjs` | syncPlan() | 同步计划生成 | 事实提取→编辑方案 | 核心算法 |
| `src/core/protected-content.mjs` | checkProtected() | protected content 校验 | 解析+比对 | 保护条款检查 |
| `src/core/transaction.mjs` | transaction() | 原子写入与回滚 | 临时文件→落盘 | 事务策略 |

### 2.3 现有逻辑约束

| 约束项 | 当前现状 | 对本设计的影响 | 应对策略 |
|-------|---------|-------------|--------|
| ESM 模块格式 | .mjs | 新文件必须使用 .mjs | 遵循 |
| node:test 测试 | test/ 目录 | 需编写对应测试 | TDD |

---

## 6. 模块内部逻辑

### 6.1 完整同步核心流程

```
syncFull(targets)
  ├─ 1. refreshContext()
  │     ├─ generateGitStatus() → .docsync/context/git-status.txt
  │     └─ generateRepomixOutput() → .docsync/context/repomix-output.xml
  ├─ 2. extractFacts()
  │     ├─ parsePackageJson() → { name, scripts, deps }
  │     ├─ scanDirectory() → 文件树
  │     └─ scanMarkdownDocs() → docs inventory
  ├─ 3. readRules()
  │     ├─ read default.md
  │     └─ read override.md (if exists)
  ├─ 4. generateSyncPlan(targets, facts, rules)
  │     ├─ for each target:
  │     │   ├─ read current content
  │     │   ├─ compute minimal edits
  │     │   └─ check protected content
  │     └─ return { updated: [], skipped: [] }
  ├─ 5. applyEdits(plan)
  │     ├─ write to temp files
  │     ├─ final protected content check
  │     └─ atomic write (transaction)
  ├─ 6. runMarkdownFix()
  │     └─ npx markdownlint-cli2 --fix
  └─ 7. outputReport(plan)
        └─ SyncReport { updated, skipped, factsUsed, mode, todoReview, verification }
```

### 6.2 快速同步核心流程

```
syncFast(targets)
  ├─ 1. readLightweightFacts()
  │     ├─ git log -1 --oneline
  │     ├─ git status --short
  │     ├─ git diff --name-only
  │     └─ git diff --stat
  ├─ 2. read last-sync.json (if exists)
  ├─ 3. inferImpact(commits, diff, targets)
  │     └─ if insufficient info → upgrade to syncFull() or stop
  ├─ 4. readRules() (same as full)
  ├─ 5. generateMinimalEditPlan()
  ├─ 6. checkProtectedContent()
  ├─ 7. applyEdits()
  ├─ 8. runLightMarkdownFix()
  └─ 9. outputReport(plan, mode: 'fast')
```

### 6.3 Protected Content 检查算法

```
checkProtectedContent(edits, protectedRules)
  for each edit in edits:
    for each rule in protectedRules:
      if rule.target === edit.file:
        if edit would delete or modify rule.text:
          if userExplicitlyRequestedModification(rule):
            continue (允许)
          else:
            throw ProtectedContentViolation(rule)
  return OK
```

### 6.4 事务写入策略

```
transaction(edits)
  1. calculate plan: { files: [...], tempDir: '.docsync/.tmp-sync' }
  2. for each file in plan.files:
       write to tempDir/file
  3. check protected content against temp files
  4. if check passes:
       for each file in plan.files:
         rename tempDir/file → actual path (atomic on most FS)
     else:
       cleanup tempDir
       throw violation
  5. cleanup tempDir
  6. update last-sync.json
```

---

## 7. 外部依赖与集成

### 7.1 内部跨模块依赖

| 依赖模块 | 调用接口/方法 | 输入 | 预期输出 | 当前状态 |
|---------|-------------|------|---------|--------|
| src/core/context.mjs | refreshContext() | { cwd } | { gitStatus, repomixOutput } | 待修改 |
| src/core/rules.mjs | readRules() | { cwd } | { default, override } | 待建 |
| src/utils/shell.mjs | execNpx() | { cmd, args } | { stdout, code } | 已有 |

---

## 8. 异常处理

### 8.1 异常分类

| 异常类型 | 触发条件 | 处理策略 | 用户感知 |
|---------|---------|---------|---------|
| ERR_PROTECTED_VIOLATION | 编辑会删除 protected content | 停止，报告冲突 | 展示冲突详情 |
| ERR_RULE_CONFLICT | override 与仓库事实冲突 | 停止，报告冲突 | 展示冲突内容 |
| ERR_REPOMIX_FAILED | Repomix 命令执行失败 | 停止 | 展示错误输出 |
| ERR_TARGET_NOT_FOUND | 目标文档不存在 | 创建新文档 | 提示已创建 |

---

## 9. 局部配置

### 9.1 业务配置

| 配置项 | 配置 Key | 默认值 | 说明 |
|-------|---------|-------|------|
| 核心文档列表 | sync.coreDocs | ['README.md','AGENTS.md','CLAUDE.md'] | 仅这三份 |
| 快速模式升级阈值 | fast.minCommits | 1 | 至少有 1 个提交 |

---

> **质量红线检查清单**
> - [x] **现有代码锚点已标注**
> - [x] **现有约束已识别**
> - [x] **字段完整性**：追溯表已完成
> - [x] **边界遵守**：无越权设计
> - [x] **外部依赖已明确**
> - [x] **环境权限已确认**
> - [x] 异常处理策略已定义
> - [x] 包含足够的局部细节支持任务拆解
