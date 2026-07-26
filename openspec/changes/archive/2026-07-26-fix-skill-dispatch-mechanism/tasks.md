## 1. 文档修正

- [x] 1.1 修改 `what-to-eat-skills/SKILL.md` 的执行流程描述（从"分发到子 Skill"改为"分发到子模块"）
- [x] 1.2 修正意图分发章节（从"调用 Skill() 工具"改为"执行 PowerShell 脚本"）
- [x] 1.3 添加明确警告："不要使用 Skill() 工具调用子目录，它们不是独立的 Claude Code Skill"
- [x] 1.4 更新示例 1：推荐菜品（展示实际的 PowerShell 命令）
- [x] 1.5 更新示例 2：添加菜品（展示实际的 PowerShell 命令）
- [x] 1.6 更新注意事项（强调直接执行脚本）

## 2. OpenSpec 文档创建

- [x] 2.1 创建 `openspec/changes/fix-skill-dispatch-mechanism/proposal.md`
- [x] 2.2 创建 `openspec/changes/fix-skill-dispatch-mechanism/design.md`
- [x] 2.3 创建 `openspec/changes/fix-skill-dispatch-mechanism/specs/skill-dispatch-mechanism/spec.md`
- [x] 2.4 创建 `openspec/changes/fix-skill-dispatch-mechanism/tasks.md`

## 3. 验证与测试

- [x] 3.1 验证修改后的文档准确性
- [x] 3.2 测试所有 PowerShell 命令示例可执行
- [x] 3.3 确认无代码变更（所有脚本文件未修改）
- [x] 3.4 确认无目录结构变更
- [x] 3.5 检查文档与实际行为的一致性

## 4. 文档质量保证

- [x] 4.1 确保所有中文描述清晰易懂
- [x] 4.2 确保技术术语（PowerShell、bash、script）保留英文
- [x] 4.3 确保命令示例格式正确（使用代码块）
- [x] 4.4 确保警告和注意事项醒目（使用加粗或引用块）

## 5. 路径修正（追加）

- [x] 5.1 修正所有脚本路径（添加 `what-to-eat-skills/` 前缀）
  - [x] 5.1.1 修正意图分发章节的路径
  - [x] 5.1.2 修正示例 1 的路径（推荐菜品）
  - [x] 5.1.3 修正示例 2 的路径（添加菜品）
- [x] 5.2 验证修正后的路径可执行
