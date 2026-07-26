## Why

`refactor-to-independent-skills` 重构后，4 个子 skill 的 `.sh` 脚本存在 3 类运行时 bug，导致 `collect.sh` 和 `manage.sh` **完全无法工作**，`recommend.sh` 依赖手动修复才能运行。这些 bug 在重构测试阶段（tasks 7.1-7.7 均标记为完成）未被捕获，需要立即修复以恢复基本可用性。

## What Changes

- 修复 `collect.sh` 中 `parseArgs` 函数重复声明（`const` 在同一作用域内声明两次 → SyntaxError）
- 修复 `collect.sh` 和 `manage.sh` 中 `process.argv.slice(1)` 应为 `slice(2)`（`node -e` 模式下 argv[1] 是 `[eval]` 标记，用户参数从 argv[2] 开始）
- 为所有 5 个 `.sh` 脚本添加 `node` / `node.exe` 自动检测（WSL 环境下 `node` 不在 PATH 中，需回退到 `node.exe`）
- 修复 `test-abs.sh` 中 `SCRIPT_DIR` 变量未定义（第 3 行引用但从未赋值）
- 确保所有 `.sh` 文件使用 LF 换行（已有文件已在探索阶段修复，需作为规范固化）

## Capabilities

### New Capabilities

- `shell-script-execution`: Shell 脚本执行可靠性规范——覆盖 argv 参数解析、Node.js 运行时检测、换行符兼容性三项运行时基础保障

### Modified Capabilities

无（不涉及已有 spec 的需求变更，仅修复实现层 bug）。

## Impact

- **代码影响**：5 个 `.sh` 脚本文件
  - `what-to-eat-collect/scripts/collect.sh`（parseArgs 去重 + argv 修正 + node 检测）
  - `what-to-eat-collect/scripts/test-abs.sh`（SCRIPT_DIR 修复 + node 检测）
  - `what-to-eat-manage/scripts/manage.sh`（argv 修正 + node 检测）
  - `what-to-eat-recommend/scripts/recommend.sh`（已完成修复，需验证一致性）
  - `what-to-eat-visualize/scripts/visualize.sh`（node 检测）
- **用户影响**：恢复 collect/manage 功能可用性，recommend 在 Windows+WSL 环境下无需手动修复
- **向后兼容**：完全兼容，仅修复 bug 不改变接口
- **不涉及**：不内联 JS 代码（自包含架构属于后续独立变更）、不修改共享库 `scripts/lib/*.js`、不修改 SKILL.md 文档
