#!/bin/bash
# collect.sh - 菜品收集脚本
# 使用共享库：scripts/lib/

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 定位到共享库目录（what-to-eat-skills/scripts/lib/）
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

const { DataAccessor } = require("./data-accessor.js");
const { addDish, getPending, confirmPending, rejectPending, confirmAll, rejectAll, formatPending } = require("./dishes.js");
const { autoGenerate } = require("./auto-generate.js");

// 解析菜品数据
function parseDish(opts) {
  return {
    name: opts.name || "未命名菜品",
    category: opts.category || "其他",
    tags: opts.tags ? opts.tags.split(",") : [],
    ingredients: opts.ingredients ? opts.ingredients.split(",") : [],
    prepTime: opts.prepTime ? parseInt(opts.prepTime) : 30,
    difficulty: opts.difficulty || "简单",
  };
}

// 执行命令
const args = process.argv.slice(ARG_OFFSET);  // 兼容 node (Linux) 和 node.exe (Windows)
const command = args[0];

switch (command) {
  case "add": {
    const name = args[1];
    const opts = parseArgs(args.slice(2));
    opts.name = name;
    const dish = parseDish(opts);
    const result = addDish(dish);
    console.log(result.ok ? "✅ 已添加「" + result.dish.name + "」到待确认列表" : "❌ " + result.error);
    break;
  }
  case "list-pending": {
    const pending = getPending();
    console.log(formatPending(pending));
    break;
  }
  case "confirm": {
    const target = args[1];
    const result = confirmPending(target);
    if (result.ok) {
      const msg = result.message || "已确认「" + result.dish.name + "」→ 加入菜品库";
      console.log("✅ " + msg);
    } else {
      console.log("❌ " + result.error);
    }
    break;
  }
  case "reject": {
    const target = args[1];
    const result = rejectPending(target);
    if (result.ok) {
      const msg = result.message || "已拒绝「" + result.dish.name + "」";
      console.log("✅ " + msg);
    } else {
      console.log("❌ " + result.error);
    }
    break;
  }
  case "confirm-all": {
    const result = confirmAll();
    console.log(result.ok ? "✅ " + result.message : "❌ " + result.error);
    break;
  }
  case "reject-all": {
    const result = rejectAll();
    console.log(result.ok ? "✅ " + result.message : "❌ " + result.error);
    break;
  }
  case "config-show": {
    const { DataAccessor } = require("./data-accessor.js");
    const da = new DataAccessor();
    const info = da.getConfigInfo();
    console.log(JSON.stringify(info, null, 2));
    break;
  }
  case "config-set": {
    const key = args[1];
    const value = args[2];
    if (!key || !value) {
      console.log("Usage: collect.sh config-set <key> <value>");
      break;
    }
    const { DataAccessor } = require("./data-accessor.js");
    const da = new DataAccessor();
    const configFile = da.skillConfigPath;
    let config = {};
    try {
      if (fs.existsSync(configFile)) {
        config = JSON.parse(fs.readFileSync(configFile));
      }
    } catch (e) {
      console.error("⚠️  读取配置失败:", e.message);
    }
    config[key] = value;
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log("✅ 已设置 " + key + " = " + value);
    break;
  }
  case "config-validate": {
    const { DataAccessor } = require("./data-accessor.js");
    const da = new DataAccessor();
    const valid = da.validateConfig();
    console.log(valid ? "✅ 配置文件有效" : "❌ 配置文件无效");
    process.exit(valid ? 0 : 1);
    break;
  }
  case "auto-generate": {
    const count = parseInt(args[1]) || 3;
    const result = autoGenerate(count);
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  default:
    console.log("Usage: collect.sh {add|list-pending|confirm|reject|confirm-all|reject-all|auto-generate|config-show|config-set|config-validate}");
}
' "$@"
