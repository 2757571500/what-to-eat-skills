#!/bin/bash
# visualize.sh.template - 可视化脚本（构建模板）
# 此模板由 build.js 处理，生成自包含的 visualize.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=${1:-3000}

echo "Starting visualization server on port $PORT..."
node "$DIR/server.js" $PORT
