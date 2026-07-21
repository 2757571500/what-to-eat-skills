# 迁移指南

从旧版架构迁移到新版独立 skill 架构。

## 迁移前

旧版结构：
```
what-to-eat-skills/
├── scripts/              ← 集中式脚本（所有 skill 共用）
│   └── lib/
├── what-to-eat-collect/  ← 只有 SKILL.md
├── data/
│   └── dishes.json       ← 项目本地数据
```

## 迁移步骤

### 1. 备份数据

```bash
# 手动备份旧数据（重要！）
cp -r data data.backup.$(date +%Y%m%d)
```

### 2. 运行迁移脚本

```bash
bash scripts/migrate.sh
```

迁移脚本会：
- 备份 `data/dishes.json` 到 `data/backup.<timestamp>/`
- 创建 `~/.what-to-eat/data/dishes.json`
- 创建 `~/.what-to-eat/config.json`

### 3. 验证迁移

```bash
# 检查新数据目录
ls -la ~/.what-to-eat/

# 测试 skill
bash what-to-eat-collect/scripts/collect.sh list-pending
bash what-to-eat-recommend/scripts/recommend.sh recommend
```

### 4. 清理旧文件（可选）

确认迁移成功后，可以删除旧数据：
```bash
rm -rf data/
```

## 数据结构对比

### 旧版数据文件

`data/dishes.json`：
```json
{
  "dishes": [...],
  "pending": [...]
}
```

### 新版数据文件

`~/.what-to-eat/data/dishes.json`：
```json
{
  "dishes": [...],
  "pending": [...]
}
```

数据结构完全兼容，无需修改。

## 常见问题

### Q: 迁移失败怎么办？

A: 检查备份目录 `data/backup.<timestamp>/`，确认原始数据完整，然后重试迁移。

### Q: 可以同时保留新旧两套数据吗？

A: 不建议。新版 skill 只读取 `~/.what-to-eat/` 目录的数据。

### Q: config.json 可以手动编辑吗？

A: 可以。但请确保 JSON 格式正确。最小配置：
```json
{
  "dataPath": "dishes.json"
}
```
