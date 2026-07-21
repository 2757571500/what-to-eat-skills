#!/bin/bash
# migrate.sh - 数据迁移脚本
# 将旧版 data/dishes.json 迁移到 ~/.what-to-eat/data/dishes.json

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OLD_DATA_DIR="$PROJECT_ROOT/data"
NEW_CONFIG_DIR="$HOME/.what-to-eat"
NEW_DATA_DIR="$NEW_CONFIG_DIR/data"

echo "🔄 迁移数据到全局目录..."
echo ""

# 1. 检测旧数据
if [ ! -f "$OLD_DATA_DIR/dishes.json" ]; then
  echo "ℹ️  未找到旧数据文件 ($OLD_DATA_DIR/dishes.json)，无需迁移"
  exit 0
fi

# 2. 备份旧数据
BACKUP_DIR="$OLD_DATA_DIR/backup.$(date +%Y%m%d_%H%M%S)"
echo "📦 备份旧数据到: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp "$OLD_DATA_DIR/dishes.json" "$BACKUP_DIR/dishes.json"
if [ -f "$OLD_DATA_DIR/pending.json" ]; then
  cp "$OLD_DATA_DIR/pending.json" "$BACKUP_DIR/pending.json"
fi
echo "  ✅ 备份完成"
echo ""

# 3. 创建新目录
echo "📁 创建新数据目录..."
mkdir -p "$NEW_DATA_DIR"
echo "  ✅ $NEW_DATA_DIR"
echo ""

# 4. 复制数据
echo "📋 复制数据文件..."
cp "$OLD_DATA_DIR/dishes.json" "$NEW_DATA_DIR/dishes.json"
echo "  ✅ dishes.json"

if [ -f "$OLD_DATA_DIR/pending.json" ]; then
  cp "$OLD_DATA_DIR/pending.json" "$NEW_DATA_DIR/pending.json"
  echo "  ✅ pending.json"
else
  echo '{"pending":[]}' > "$NEW_DATA_DIR/pending.json"
  echo "  ✅ pending.json (新建)"
fi
echo ""

# 5. 创建 config.json
echo "⚙️  创建配置文件..."
cat > "$NEW_CONFIG_DIR/config.json" << 'EOF'
{
  "dataPath": "dishes.json",
  "migratedFrom": "data/dishes.json",
  "migratedAt": "__DATE__",
  "version": "1.0.0"
}
EOF

# 替换日期占位符
if command -v sed &> /dev/null; then
  sed -i "s/__DATE__/$(date -Iseconds)/" "$NEW_CONFIG_DIR/config.json" 2>/dev/null || true
fi

echo "  ✅ config.json"
echo ""

# 6. 完成
echo "─".repeat(50)
echo "✅ 迁移完成!"
echo ""
echo "数据位置:"
echo "  dishes.json: $NEW_DATA_DIR/dishes.json"
echo "  config.json: $NEW_CONFIG_DIR/config.json"
echo ""
echo "备份位置: $BACKUP_DIR"
echo ""
echo "⚠️  旧数据文件已保留在 $OLD_DATA_DIR/"
echo "   确认迁移成功后可手动删除"
