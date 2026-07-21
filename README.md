# what-to-eat-skills

Claude Code 菜品管理 Skill 集合，包含 5 个独立平级 skill。

## 架构

```
what-to-eat-skills/
├── what-to-eat-skills/          ← 总控 skill（纯分发）
│   └── SKILL.md
├── what-to-eat-collect/         ← 菜品收集 skill
│   ├── SKILL.md
│   └── scripts/collect.sh       ← 自包含脚本
├── what-to-eat-manage/          ← 日常管理 skill
│   ├── SKILL.md
│   └── scripts/manage.sh        ← 自包含脚本
├── what-to-eat-recommend/       ← 菜品推荐 skill
│   ├── SKILL.md
│   └── scripts/recommend.sh     ← 自包含脚本
├── what-to-eat-visualize/       ← 可视化 skill
│   ├── SKILL.md
│   └── scripts/
│       ├── visualize.sh
│       └── server.js
├── .scripts/                 ← 开发源码（构建用，隐藏目录）
│   ├── lib/
│   │   ├── data-accessor.js
│   │   ├── seed.js
│   │   ├── dishes.js
│   │   ├── autoGenerate.js
│   │   └── recommend.js
│   └── *.template            ← 构建模板
├── data/
│   └── example.json             ← 初始数据模板
├── build.js                     ← 构建脚本
└── README.md
```

## 5 个 Skill

| Skill | 功能 | 脚本 |
|-------|------|------|
| **what-to-eat-skills** | 总控分发 | 无（纯分发逻辑） |
| **what-to-eat-collect** | 菜品收集（录入、待确认、AI 生成） | `scripts/collect.sh` |
| **what-to-eat-manage** | 日常管理（记录食用、删除、统计） | `scripts/manage.sh` |
| **what-to-eat-recommend** | 菜品推荐（轮换、随机、筛选） | `scripts/recommend.sh` |
| **what-to-eat-visualize** | 可视化（启动 Web 服务器） | `scripts/visualize.sh` + `scripts/server.js` |

## 数据管理

所有 skill 共享同一个数据目录：

```
~/.what-to-eat/
├── config.json           ← 全局配置（dataPath 等）
└── data/
    └── dishes.json       ← 菜品数据文件
```

首次运行任意 skill 时会自动初始化数据目录。

## 构建

```bash
# 生成所有 skill 的自包含脚本
node build.js

# 清理生成的脚本
node build.js --clean

# 仅生成指定 skill 的脚本
node build.js --collect
```

## 使用

### 作为总控使用

直接使用 `what-to-eat-skills` skill，它会自动识别意图并分发到对应的子 skill。

### 独立使用子 skill

每个子 skill 可以独立安装和使用：

```bash
# 菜品收集
bash scripts/collect.sh add "麻婆豆腐"
bash scripts/collect.sh list-pending
bash scripts/collect.sh confirm 0

# 日常管理
bash scripts/manage.sh eat "麻婆豆腐"
bash scripts/manage.sh stats

# 菜品推荐
bash scripts/recommend.sh recommend
bash scripts/recommend.sh recommend --strategy random

# 可视化
bash scripts/visualize.sh 3000
```

## 特点

- **自包含**：每个 skill 的脚本内联所有依赖，无需外部文件
- **独立安装**：5 个 skill 可独立使用
- **数据统一**：通过 `~/.what-to-eat/config.json` 全局管理
- **自动初始化**：首次运行自动创建配置和数据文件

## 故障排查

### config.json 未创建

**症状**：运行 skill 时报错 `ENOENT: no such file or directory, open '.../.what-to-eat/config.json'`

**解决**：
```bash
# 手动创建目录
mkdir -p ~/.what-to-eat/data

# 手动创建配置文件
echo '{"dataPath":"dishes.json","version":"1.0.0"}' > ~/.what-to-eat/config.json
```

### 跨 skill 数据不一致

**症状**：在 collect 中添加的菜品，recommend 看不到

**解决**：确认所有 skill 使用同一个 `~/.what-to-eat/` 目录。检查 `~/.what-to-eat/config.json` 是否存在。

### 迁移数据丢失

**症状**：迁移后数据为空

**解决**：从备份目录恢复：
```bash
cp data/backup.<timestamp>/dishes.json ~/.what-to-eat/data/dishes.json
```

