# 统一 Skill 文档路径风格

## Why

在 `fix-skill-dispatch-mechanism` 修正过程中，`what-to-eat-skills/SKILL.md` 统一采用"完整路径"风格（`bash what-to-eat-collect/scripts/collect.sh`），但 `CLAUDE.md`（项目根目录）仍保留"cd + 相对路径"风格。文档风格不统一会增加用户理解成本，降低 Skill 的易用性。

本次修改将 `CLAUDE.md` 中的所有命令示例统一为"完整路径"风格，确保整个项目文档的一致性。

## What Changes

- ✅ 统一 `CLAUDE.md` 中的路径风格
  - 将"cd + 相对路径"改为"完整路径"
  - 涵盖：常用命令、调试模式、开发流程、运行测试等章节
- ✅ 保持 `docs/*.md` 不变（已统一为完整路径）
- ✅ 保持 `SKILL.md` 不变（已统一为完整路径）

**影响范围**：
- 📝 仅修改 `CLAUDE.md` 的命令示例
- 🔧 无代码变更
- 🏗️ 无结构变更

## Capabilities

### Modified Capabilities

- `skill-documentation-consistency`: 统一 Skill 文档中的路径风格，确保文档一致性和易用性

## Impact

- **文档影响**: `E:\Code\what-to-eat-skills\CLAUDE.md`
- **代码影响**: 无（纯文档调整）
- **用户影响**: 文档更易理解，复制粘贴即可使用
- **向后兼容**: 完全兼容，无破坏性变更
