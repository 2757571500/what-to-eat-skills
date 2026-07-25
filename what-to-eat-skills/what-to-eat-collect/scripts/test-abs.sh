#!/bin/bash
cd "$(dirname "$0")"
SHARED_LIB_DIR="$(cd "$SCRIPT_DIR/../../scripts/lib" && pwd)"
cd "$SHARED_LIB_DIR"

# 使用绝对路径测试
node -e '
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
