#!/bin/bash
# manage.sh - 日常管理脚本
# 使用共享库：scripts/lib/

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 定位到共享库目录
SHARED_LIB_DIR="$(cd "$SCRIPT_DIR/../../scripts/lib" && pwd)"

# 切换到共享库目录并执行
cd "$SHARED_LIB_DIR" || exit 1

# 加载共享库并执行
node -e '
// 解析命令行参数（包括 --data-path）
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
const cmdArgs = parseArgs(process.argv.slice(1));
const overridePath = cmdArgs["data-path"] || cmdArgs["dataPath"] || null;

// 设置全局数据路径（供 DataAccessor 使用）
global.__WHAT_TO_EAT_OVERRIDE_PATH__ = overridePath;

const { recordEat, deleteDish, getAllDishes, formatStats } = require("./dishes.js");

// 执行命令
const args = process.argv.slice(1);  // node -e 模式下，参数从索引 1 开始
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
