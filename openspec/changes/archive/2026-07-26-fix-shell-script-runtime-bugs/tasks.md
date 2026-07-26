## 1. collect.sh 修复

- [x] 1.1 删除重复的 `parseArgs` 函数声明（第 40-50 行），保留第一个声明（第 16-26 行）
- [x] 1.2 将 `process.argv.slice(1)` 改为 `process.argv.slice(ARG_OFFSET)`（动态检测 node/node.exe 偏移量）
- [x] 1.3 在 `node -e` 之前添加 `NODE_CMD` 检测块（node / node.exe 回退）
- [x] 1.4 将内联 JS 中的 `node -e` 改为 `$NODE_CMD -e`
- [x] 1.5 验证：执行 `bash scripts/collect.sh add "测试菜"` 确认无 SyntaxError 且菜品进入待确认列表
- [x] 1.6 验证：执行 `bash scripts/collect.sh list-pending` 确认子命令正确解析

## 2. manage.sh 修复

- [x] 2.1 将 `process.argv.slice(1)` 改为 `process.argv.slice(ARG_OFFSET)`（动态检测 node/node.exe 偏移量）
- [x] 2.2 在 `node -e` 之前添加 `NODE_CMD` 检测块
- [x] 2.3 将内联 JS 中的 `node -e` 改为 `$NODE_CMD -e`
- [x] 2.4 验证：执行 `bash scripts/manage.sh stats` 确认子命令正确解析
- [x] 2.5 验证：执行 `bash scripts/manage.sh list` 确认数据正常返回

## 3. recommend.sh 一致性验证

- [x] 3.1 确认已修复的 parseArgs 去重、argv ARG_OFFSET、NODE_CMD 检测均已就位（同步更新为 ARG_OFFSET 方案）
- [x] 3.2 验证：执行 `bash scripts/recommend.sh recommend --strategy rotation` 确认正常输出推荐结果
- [x] 3.3 验证：执行 `bash scripts/recommend.sh recommend --strategy random` 确认随机策略正常

## 4. visualize.sh 修复

- [x] 4.1 在 `node` 命令前添加 `NODE_CMD` 检测块
- [x] 4.2 将 `node "$DIR/server.js"` 改为 `$NODE_CMD "$DIR/server.js"`
- [x] 4.3 验证：执行 `bash scripts/visualize.sh 3000` 确认服务器能启动（已验证启动成功）

## 5. test-abs.sh 修复

- [x] 5.1 在第 2 行添加 `SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"` 变量定义
- [x] 5.2 在 `node` 命令前添加 `NODE_CMD` 检测块
- [x] 5.3 将 `node -e` 改为 `$NODE_CMD -e`
- [x] 5.4 验证：执行 `bash scripts/test-abs.sh` 确认不再报 `$SCRIPT_DIR` 未定义错误

## 6. 换行符固化

- [x] 6.1 检查所有 5 个 `.sh` 文件确认使用 LF 换行（无 `\r` 字符）
- [x] 6.2 在项目根目录创建或更新 `.gitattributes`，添加 `*.sh text eol=lf` 规则
- [x] 6.3 检查是否存在 `.template` 模板文件，如有则同步修复并确认 LF 换行（项目中无 .template 文件）

## 7. 端到端验证

- [x] 7.1 测试 collect → confirm → recommend 流程：添加菜品 → 确认入库 → 推荐该菜品
- [x] 7.2 测试 manage eat 子命令：记录食用 → 验证 eatCount 增加
- [x] 7.3 测试 manage delete 子命令：删除菜品 → 验证菜品库减少
- [x] 7.4 测试 recommend list 子命令：浏览菜品库列表
- [x] 7.5 测试 recommend stats 子命令：查看统计信息
