# skill-documentation-consistency

## Purpose

此能力规范源自变更 unify-path-style-in-skillmd，涵盖：CLAUDE.md 必须采用完整路径风格。

## Requirements

# Spec: Skill 文档路径风格统一

### Requirement: CLAUDE.md 必须采用完整路径风格

`CLAUDE.md`（项目根目录的开发者文档）必须采用"完整路径"风格，确保与 `SKILL.md` 和 `docs/*.md` 保持一致。

#### Scenario: CLAUDE.md 常用命令章节使用完整路径

- **WHEN** 用户查看 CLAUDE.md 的"常用命令"章节
- **THEN** 所有命令示例应使用完整路径格式：`bash what-to-eat-collect/scripts/collect.sh ...`
- **AND** 不应使用"cd + 相对路径"格式

#### Scenario: CLAUDE.md 调试模式章节使用完整路径

- **WHEN** 用户查看 CLAUDE.md 的"调试模式"章节
- **THEN** 调试命令应使用完整路径格式
- **AND** 如需 cd，应明确说明，但不与命令混写

#### Scenario: CLAUDE.md 开发流程章节使用完整路径

- **WHEN** 用户查看 CLAUDE.md 的"修改共享库"、"运行测试"等章节
- **THEN** 所有命令示例应使用完整路径格式
- **AND** 路径格式与 docs/*.md 保持一致

#### Scenario: 文档一致性验证

- **WHEN** 用户对比 CLAUDE.md、SKILL.md、docs/*.md 中的命令示例
- **THEN** 所有文档应采用相同的"完整路径"风格
- **AND** 用户可以复制任意文档中的命令直接使用
