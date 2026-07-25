#!/bin/bash
# recommend.sh - 菜品推荐脚本
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

const { getAllDishes } = require("./dishes.js");
const { recommendRotation, recommendRandom, recommendFiltered, recommendWeighted, formatRecommendation, formatStats, formatDishList } = require("./recommend.js");

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

// 执行命令
const args = process.argv.slice(2);
const opts = parseArgs(args);

// 处理子命令
if (opts.command === "list") {
  const dishes = getAllDishes();
  const sortBy = opts.sort || null;
  console.log(formatDishList(dishes, sortBy));
  process.exit(0);
}

if (opts.command === "stats") {
  const dishes = getAllDishes();
  console.log(formatStats(dishes));
  process.exit(0);
}

// 推荐策略
const strategy = opts.strategy || "rotation";
const dishes = getAllDishes();

let result;
switch (strategy) {
  case "random":
    result = recommendRandom(dishes);
    break;
  case "filter":
    result = recommendFiltered(dishes, opts);
    break;
  case "weighted":
    result = recommendWeighted(dishes, opts);
    break;
  default:
    result = recommendRotation(dishes);
}

console.log(formatRecommendation(result, strategy));
' "$@"
