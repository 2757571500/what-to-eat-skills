## Why

`visualize.sh` 使用 `sed` 将 WSL 路径（`/mnt/d/`）转换为 Windows 路径（`D:/`），但该方案无法覆盖 GitBash 路径格式（`/d/`），也不兼容纯 Linux/macOS 环境。其他脚本（collect/manage/recommend）通过 `cd` + `require()` 模式天然规避了此问题，visualize.sh 需要统一到相同模式。

## What Changes

- 移除 `visualize.sh` 中的 `sed` 路径转换逻辑（`WIN_DIR=$(echo "$DIR" | sed ...)`）
- 改用 `cd "$DIR"` + `$NODE_CMD server.js` 模式，与其他脚本统一
- 确保 `server.js` 内部 `__dirname` 在所有平台（Linux、macOS、WSL、GitBash）上正确解析共享库和 web 目录路径

## Capabilities

### New Capabilities

- `visualize-path-resolution`: 可视化脚本跨平台路径解析——确保 `visualize.sh` 在传递文件路径给 Node.js 时，路径格式在 Linux、macOS、WSL、GitBash 环境下均能正确识别

### Modified Capabilities

无。

## Impact

- **代码影响**：仅 `what-to-eat-visualize/scripts/visualize.sh`（移除 sed，改用 cd 模式）
- **依赖变化**：移除对 `sed` 命令的依赖
- **用户影响**：visualize 在 GitBash 环境下不再报 `MODULE_NOT_FOUND` 错误
- **向后兼容**：完全兼容，行为不变，仅修复路径传递方式
- **不涉及**：不修改 `server.js`、不修改共享库、不修改其他 `.sh` 脚本
