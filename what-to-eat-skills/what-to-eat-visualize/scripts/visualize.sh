#!/bin/bash
# visualize.sh - 可视化脚本
# 启动本地服务器展示菜品库

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=${1:-3000}

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

# 使用 cd + 相对路径模式（与其他脚本统一，兼容 Linux/macOS/WSL/GitBash）
cd "$DIR"

echo "Starting visualization server on port $PORT..."
$NODE_CMD server.js $PORT
