## 1. 修改 visualize.sh 路径处理

- [x] 1.1 删除 `WIN_DIR=$(echo "$DIR" | sed 's|^/mnt/\([a-zA-Z]\)/|\1:/|')` 行及上方注释
- [x] 1.2 将 `$NODE_CMD "$WIN_DIR/server.js" $PORT` 替换为 `cd "$DIR"` + `$NODE_CMD server.js $PORT`
- [x] 1.3 更新脚本注释，说明使用 `cd` + 相对路径模式（与其他脚本统一）

## 2. 验证修复

- [x] 2.1 在 WSL/GitBash 环境下执行 `bash visualize.sh 3000`，确认服务器启动无 MODULE_NOT_FOUND 错误
- [x] 2.2 访问 `http://localhost:3000`，确认页面正常加载（返回 200，展示菜品卡片）
- [x] 2.3 访问 `http://localhost:3000/data/`，确认 `/data/` 接口返回 `{ dishes, pending }` JSON 数据
- [x] 2.4 检查 `visualize.sh` 源码，确认不存在 `sed`、`cygpath`、`wslpath` 等路径转换命令
