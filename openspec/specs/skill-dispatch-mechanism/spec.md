# skill-dispatch-mechanism

## Purpose

此能力规范源自变更 fix-skill-dispatch-mechanism，涵盖：总控 Skill 必须正确描述分发机制。

## Requirements

# Spec: Skill 分发机制

### Requirement: 总控 Skill 必须正确描述分发机制

总控 Skill（`what-to-eat-skills/SKILL.md`）必须准确描述如何调用子模块，确保用户和 Claude Code 能够理解并正确执行。

#### Scenario: 文档准确描述脚本执行方式

- **WHEN** 用户阅读 `what-to-eat-skills/SKILL.md` 的"意图分发"章节
- **THEN** 文档应明确说明总控 Skill 通过 PowerShell 直接执行子模块脚本，而不是调用 Skill() 工具
- **AND** 文档应提供正确的 PowerShell 命令示例
- **AND** 文档应包含明确警告："不要使用 Skill() 工具调用子目录，它们不是独立的 Claude Code Skill"

#### Scenario: 用户尝试调用子 Skill 时获得正确指导

- **WHEN** 用户尝试使用 `Skill(skill="what-to-eat-recommend")` 或其他子模块名称
- **THEN** Claude Code 应返回错误：`Unknown skill: what-to-eat-recommend`
- **AND** 总控 Skill 的文档应提供正确的替代方案（使用 PowerShell 执行脚本）

#### Scenario: 总控 Skill 成功分发推荐请求

- **WHEN** 用户说"今天吃什么"
- **THEN** 总控 Skill 识别意图为"菜品推荐"
- **AND** 总控 Skill 执行：`PowerShell(bash what-to-eat-recommend/scripts/recommend.sh recommend)`
- **AND** 脚本返回推荐结果给用户

#### Scenario: 总控 Skill 成功分发添加请求

- **WHEN** 用户说"加个麻婆豆腐"
- **THEN** 总控 Skill 识别意图为"菜品收集"
- **AND** 总控 Skill 执行：`PowerShell(bash what-to-eat-collect/scripts/collect.sh add "麻婆豆腐")`
- **AND** 脚本返回添加成功确认

#### Scenario: 文档明确子模块的本质

- **WHEN** 用户查看项目架构描述
- **THEN** 文档应明确说明 `what-to-eat-collect`、`what-to-eat-manage`、`what-to-eat-recommend`、`what-to-eat-visualize` 是"文档和脚本的组织方式"，而非独立 Skill
- **AND** 文档应解释为什么它们不是独立 Skill（嵌套在 `what-to-eat-skills` 目录下，未在 `.claude/skills/` 注册）
