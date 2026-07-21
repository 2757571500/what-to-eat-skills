#!/bin/bash
# visualize.sh - 可视化脚本

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=\${1:-3000}

echo "Starting visualization server on port \$PORT..."
node "\$DIR/server.js" \$PORT
