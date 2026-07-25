# 技术设计：修正 Skill 分发机制文档

## Context

### 背景

在 `refactor-to-independent-skills` 重构过程中（已完成 42/44 任务），`what-to-eat-skills/SKILL.md`（总控入口）被重写为"纯分发逻辑"。当时的文档描述采用了"调用子 Skill"的表述，意图让总控通过 `Skill()` 工具调用 4 个子模块。

### 当前问题

**架构误解**：
```
.claude/skills/
├── what-to-eat-skills/          ← ✅ Claude Code Skill（总控入口）
│   └── what-to-eat-collect/     ← ❌ 不是 Skill（只是文档+脚本目录）
│   └── what-to-eat-manage/      ← ❌ 不是 Skill
│   └── what-to-eat-recommend/   ← ❌ 不是 Skill
│   └── what-to-eat-visualize/   ← ❌ 不是 Skill
```

**实际错误**：
```javascript
// ❌ 错误：尝试调用不存在的 Skill
Skill(skill="what-to-eat-recommend")
// Error: Unknown skill: what-to-eat-recommend

// ✅ 正确：直接执行脚本
PowerShell(bash what-to-eat-recommend/scripts/recommend.sh recommend)
```

**根本原因**：
Claude Code 的 Skill 注册机制只认 `.claude/skills/` 下的**直接子目录**。`what-to-eat-collect` 等目录是嵌套在 `what-to-eat-skills` 下的，因此不是独立的 Skill。

### 约束条件

- **不修改 `.claude/skills/` 注册结构**：保持现有 Skill 注册不变
- **不修改任何脚本代码**：仅修正文档描述
- **保持项目目录结构**：`what-to-eat-collect/` 等目录继续作为文档和脚本的组织方式
- **向后兼容**：确保用户使用方式完全不变

## Goals / Non-Goals

### Goals

1. **修正文档描述**：准确描述总控 Skill 的实际工作方式
2. **消除误解**：明确子目录的本质（不是 Skill，是脚本目录）
3. **提供正确示例**：展示实际的 PowerShell 命令执行方式
4. **保持功能不变**：不改变任何代码逻辑和用户交互

### Non-Goals

1. ❌ **不修改脚本代码**：`collect.sh`、`manage.sh`、`recommend.sh`、`visualize.sh` 保持不变
2. ❌ **不修改目录结构**：保持 `what-to-eat-collect/` 等嵌套目录
3. ❌ **不修改 `.claude/skills/` 注册**：不创建新的 Skill 条目
4. ❌ **不实现 Skill() 调用机制**：不尝试让子目录成为真正的 Claude Code Skill

## Decisions

### 决策 1：通过 PowerShell 直接执行脚本

**决策**：在 `SKILL.md` 中描述总控 Skill 通过 `PowerShell(bash ...)` 执行子模块脚本，而不是调用 `Skill()` 工具。

**理由**：
- ✅ **符合实际运行机制**：这是项目当前真实的工作方式
- ✅ **简单直接**：用户只需执行 bash 命令，无需理解 Skill 机制
- ✅ **错误已暴露**：尝试 `Skill(what-to-eat-recommend)` 会立即报错，证明此路不通
- ✅ **保持简单**：不需要修改任何代码，只需修正文档

**考虑过的替代方案**：

| 方案 | 描述 | 为什么不用 |
|------|------|-----------|
| A. 创建扁平化 Skill 注册 | 将 `what-to-eat-collect/` 等移动到 `.claude/skills/` 直接子目录 | ❌ 破坏现有项目结构<br>❌ 需要修改所有脚本路径<br>❌ 增加复杂度 |
| B. 实现 Skill 调用代理 | 创建中间层，让总控 Skill 可以"调用"子模块 | ❌ 过度工程<br>❌ 增加维护负担<br>❌ 不符合 Claude Code 设计理念 |
| C. 保持原文档不变 | 忽略错误，让用户自行摸索 | ❌ 误导用户<br>❌ 降低可用性<br>❌ 违反文档准确性原则 |

### 决策 2：仅修正文档，不修改代码

**决策**：只修改 `what-to-eat-skills/SKILL.md` 的描述，不修改任何 `.sh` 或 `.js` 文件。

**理由**：
- ✅ **最小改动**：降低风险，避免引入新 bug
- ✅ **功能已验证**：脚本执行方式已经过测试，工作正常
- ✅ **问题根源清晰**：错误在于文档描述，而非实现
- ✅ **快速修复**：用户可以立即获得正确的使用说明

### 决策 3：保留"子 Skill"术语但澄清含义

**决策**：在文档中继续使用"子 Skill"、"子模块"等术语，但明确它们的本质是"文档和脚本的组织方式"。

**理由**：
- ✅ **保持连续性**：不颠覆用户的已有认知
- ✅ **清晰边界**：通过"不是独立 Skill"的明确警告避免混淆
- ✅ **渐进式理解**：用户可以逐步理解架构的真实含义

## Risks / Trade-offs

### 风险 1：文档与实际代码的同步问题

**风险**：未来如果脚本结构改变，文档可能再次过时。

**缓解措施**：
- 在文档中添加"版本最后验证"字段
- 在 CI/CD 中添加文档准确性检查（如验证所有 PowerShell 命令可执行）
- 在 PR 模板中要求 reviewers 检查文档准确性

### 风险 2：用户对"子 Skill"概念的困惑

**风险**：用户可能仍然期望 `Skill(what-to-eat-recommend)` 能工作。

**缓解措施**：
- 在文档中用醒目方式标注"注意：不要使用 Skill() 工具调用"
- 提供清晰的错误排查章节（如果看到 `Unknown skill` 错误，说明...）
- 在 FAQ 中解答常见问题

### 权衡 1：简单性 vs 完整性

**权衡**：本修正保持了极简的实现（只改文档），但这意味着 Claude Code 的 Skill 机制没有被充分利用。

**为什么选择简单性**：
- 当前架构已经工作良好，功能完整
- "直接执行脚本"的方式简单、可靠、易于理解
- 不需要为了"正确使用 Skill 机制"而重构整个系统

### 权衡 2：术语一致性 vs 准确性

**权衡**：文档中同时使用"子 Skill"和"子模块"两个术语。

**为什么这样可行**：
- "子 Skill"用于目录命名和习惯性称呼
- "子模块"用于强调它们不是独立 Skill 的本质
- 通过上下文和明确警告消除歧义

## Migration Plan

### 部署步骤

由于本次变更**仅涉及文档**，无需部署步骤：

1. ✅ **已修改**：`what-to-eat-skills/SKILL.md`
2. ✅ **无需代码变更**：所有脚本保持不变
3. ✅ **无需数据迁移**：不影响数据格式或存储
4. ✅ **用户无感知**：功能完全不变，只是文档更准确

### 回滚策略

如果需要回滚（极不可能），只需恢复 `SKILL.md` 到上一个版本即可：

```bash
git checkout HEAD~1 what-to-eat-skills/SKILL.md
```

### 验证清单

- [x] 文档已更新：`what-to-eat-skills/SKILL.md`
- [x] 示例命令已验证：`PowerShell(bash what-to-eat-recommend/scripts/recommend.sh recommend)` 可执行
- [x] 无代码变更：所有 `.sh`、`.js` 文件未修改
- [x] 无目录结构变更：项目结构保持原样

## Open Questions

### 问题 1：未来是否需要真正的 Skill 注册？

**当前状态**：子模块通过脚本方式工作，不利用 Claude Code 的 Skill 调用机制。

**可能的未来方向**：
- 如果 Claude Code 支持嵌套 Skill 注册，可以重新考虑
- 如果用户需要独立调用某个子模块，可以考虑扁平化注册
- 当前方案已经足够满足需求，不需要立即行动

**决策**：暂不处理，保持当前简单方案。

### 问题 2：如何确保文档长期保持准确？

**当前状态**：依赖人工维护文档准确性。

**可能的改进方向**：
- 在 CI 中添加文档验证脚本
- 在 PR 模板中加入文档准确性检查清单
- 定期（如每季度）审查文档与实际代码的一致性

**决策**：在后续迭代中考虑添加自动化文档检查。
