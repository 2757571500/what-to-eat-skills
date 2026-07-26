# 修正总控 Skill 分发机制文档

## Why

在 `refactor-to-independent-skills` 重构过程中，`what-to-eat-skills/SKILL.md` 被设计为"纯分发逻辑"，但文档中错误地描述为"使用 Skill() 工具调用子 skill"。实际上，`what-to-eat-collect`、`what-to-eat-manage`、`what-to-eat-recommend`、`what-to-eat-visualize` 这些目录**并非独立的 Claude Code Skill**，而是文档和脚本的组织结构。这导致在实际使用时出现 `Error: Unknown skill` 的错误。

本次修改修正了分发机制的描述，明确总控 Skill 应该通过 PowerShell 直接执行脚本，而不是调用不存在的子 Skill。

## What Changes

- ✅ 修正 `what-to-eat-skills/SKILL.md` 中的意图分发逻辑描述
  - 从"调用 Skill() 工具"改为"执行 PowerShell 脚本"
  - 添加明确说明：子目录不是独立 Skill
  - 更新示例代码，展示实际的 PowerShell 命令
- ✅ 更新执行流程描述（从"分发到子 Skill"改为"分发到子模块"）
- ✅ 更新注意事项，强调直接执行脚本而非 Skill 调用

**不涉及**：
- ❌ 不修改任何脚本文件（`.sh`、`.js`）
- ❌ 不改变项目目录结构
- ❌ 不影响任何功能代码

## Capabilities

### Modified Capabilities

- `skill-dispatch-mechanism`: 修正总控 Skill 的分发机制文档，明确使用 PowerShell 直接执行子模块脚本而非调用 Skill() 工具

## Impact

- **文档影响**: `what-to-eat-skills/SKILL.md`
- **代码影响**: 无（纯文档修正）
- **用户影响**: 无（功能不变，只是文档更准确地描述了实际工作方式）
- **向后兼容**: 完全兼容，无破坏性变更
