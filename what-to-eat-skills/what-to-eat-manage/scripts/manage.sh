#!/bin/bash
# manage.sh - 日常管理脚本
# 使用共享库：scripts/lib/

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 定位到共享库目录
SHARED_LIB_DIR="$(cd "$SCRIPT_DIR/../../scripts/lib" && pwd)"

# 切换到共享库目录并执行
cd "$SHARED_LIB_DIR" || exit 1

# 检测 node 命令（WSL 下可能需要使用 node.exe）
NODE_CMD="node"
if ! command -v node &>/dev/null; then
  if command -v node.exe &>/dev/null; then
    NODE_CMD="node.exe"
  else
    echo "Error: node not found" >&2
    exit 1
  fi
fi

# 加载共享库并执行
$NODE_CMD -e '
// 检测 argv 偏移量（node -e 在 Linux 下 argv[1] 是 [eval]，Windows node.exe 下无此标记）
const ARG_OFFSET = process.argv[1] === "[eval]" ? 2 : 1;

// 解析命令行参数
function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      result[key] = args[i + 1] !== undefined ? args[i + 1] : true;
      if (args[i + 1] !== undefined) i++;
    }
  }
  return result;
}

// 优先级 0：命令行参数（最高优先级）
const cmdArgs = parseArgs(process.argv.slice(ARG_OFFSET));
const overridePath = cmdArgs["data-path"] || cmdArgs["dataPath"] || null;

// 设置全局数据路径（供 DataAccessor 使用）
global.__WHAT_TO_EAT_OVERRIDE_PATH__ = overridePath;

const { recordEat, deleteDish, getAllDishes, formatStats } = require("./dishes.js");

// 执行命令
const args = process.argv.slice(ARG_OFFSET);  // 兼容 node (Linux) 和 node.exe (Windows)
const command = args[0];
const target = args[1];

switch (command) {
  case "eat": {
    const result = recordEat(target);
    console.log(result.ok ? "✅ " + result.dish.name + " 已记录（第 " + result.dish.eatCount + " 次食用）" : "❌ " + result.error);
    break;
  }
  case "delete": {
    const result = deleteDish(target);
    console.log(result.ok ? "✅ 已删除「" + target + "」" : "❌ " + result.error);
    break;
  }
  case "stats": {
    const dishes = getAllDishes();
    console.log(formatStats(dishes));
    break;
  }
  case "list": {
    const dishes = getAllDishes();
    console.log(JSON.stringify(dishes, null, 2));
    break;
  }
  default:
    console.log("Usage: manage.sh {eat|delete|stats|list} [name]");
}
' "$@"
