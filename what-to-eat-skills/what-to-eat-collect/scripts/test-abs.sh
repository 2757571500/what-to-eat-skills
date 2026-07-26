#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SHARED_LIB_DIR="$(cd "$SCRIPT_DIR/../../scripts/lib" && pwd)"
cd "$SHARED_LIB_DIR"

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

# 使用绝对路径测试
$NODE_CMD -e '
const { DataAccessor } = require("./data-accessor.js");
const { getPending, addDish } = require("./dishes.js");

const da = new DataAccessor();
console.log("Pending path:", da.getPendingPath());

console.log("Initial:", getPending().length, "items");

addDish({ name: "abs-test-1", category: "测试" });
console.log("After add:", getPending().length, "items");

// 直接读取文件
const fs = require("fs");
try {
  const raw = fs.readFileSync(da.getPendingPath(), "utf-8");
  const data = JSON.parse(raw);
  console.log("File content:", JSON.stringify(data, null, 2));
} catch (e) {
  console.log("File read error:", e.message);
}
' 2>&1
