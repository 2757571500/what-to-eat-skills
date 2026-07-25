# what-to-eat-skills

Claude Code 菜品管理 Skill 集合，包含 1 个总控入口 + 4 个子 skill，采用统一共享库架构。

## 架构

```
what-to-eat-skills/                  ← 所有 skill 集中在这里
├── SKILL.md                        ← 总控入口（意图识别 + 分发）
├── config.json                     ← 默认配置（可选）
├── docs/                           ← 模块化文档
│   ├── collect.md                  # 菜品收集详情
│   ├── manage.md                   # 日常管理详情
│   ├── recommend.md                # 菜品推荐详情
│   └── visualize.md                # 可视化详情
├── data/
│   └── example.json               ← 示例数据文件
├── scripts/                        ← 脚本目录
│   ├── collect.sh                 ← 菜品收集
│   ├── manage.sh                  ← 日常管理
│   ├── recommend.sh               ← 菜品推荐
│   ├── visualize.sh               ← 可视化
│   └── lib/                       ← 统一共享库 ✨
│       ├── data-accessor.js       # 数据访问层（配置 + 路径解析）
│       ├── dishes.js              # 数据 CRUD + 格式化输出
│       ├── recommend.js           # 推荐算法（4 种策略）
│       ├── auto-generate.js       # AI 菜品生成
│       └── seed.js                # 种子数据（分类、标签、示例）
├── what-to-eat-collect/            ← 菜品收集 skill
│   └── SKILL.md
├── what-to-eat-manage/             ← 日常管理 skill
│   └── SKILL.md
├── what-to-eat-recommend/          ← 菜品推荐 skill
│   └── SKILL.md
└── what-to-eat-visualize/          ← 可视化 skill
    └── SKILL.md
```

## 5 个 Skill

| Skill | 功能 | 脚本 |
|-------|------|------|
| **what-to-eat-skills** | 总控分发 | 无（纯分发逻辑） |
| **what-to-eat-collect** | 菜品收集（录入、待确认、AI 生成） | `scripts/collect.sh` |
| **what-to-eat-manage** | 日常管理（记录食用、删除、统计） | `scripts/manage.sh` |
| **what-to-eat-recommend** | 菜品推荐（轮换、随机、筛选） | `scripts/recommend.sh` |
| **what-to-eat-visualize** | 可视化（启动 Web 服务器） | `scripts/visualize.sh` + `scripts/server.js` |

## 核心特性

### 统一共享库

所有脚本共享 `scripts/lib/` 中的模块，消除代码重复：

- ✅ **消除重复**：从 2400+ 行减少到 1270 行（-47%）
- ✅ **统一维护**：修改一次，全部生效
- ✅ **配置灵活**：支持三级路径优先级（命令行 > config.json > 默认）

### 数据管理

所有 skill 共享同一个数据目录：

```
~/.what-to-eat/
├── config.json           ← 全局配置（dataPath 等）
└── data/
    └── dishes.json       ← 菜品数据文件
```

**配置优先级**（高 → 低）：
1. **命令行参数**：`--data-path /custom/path.json`
2. **config.json**：`what-to-eat-skills/config.json`
3. **默认路径**：`~/.what-to-eat/data/dishes.json`

首次运行任意 skill 时会自动初始化数据目录。

## 使用

### 作为总控使用

直接使用 `what-to-eat-skills` skill，它会自动识别意图并分发到对应的子 skill。

### 独立使用子 skill

每个子 skill 可以独立使用：

```bash
# 进入 skill 目录
cd what-to-eat-skills

# 菜品收集
bash what-to-eat-collect/scripts/collect.sh add "麻婆豆腐"
bash what-to-eat-collect/scripts/collect.sh list-pending
bash what-to-eat-collect/scripts/collect.sh confirm 0

# 日常管理
bash what-to-eat-manage/scripts/manage.sh eat "麻婆豆腐"
bash what-to-eat-manage/scripts/manage.sh stats

# 菜品推荐
bash what-to-eat-recommend/scripts/recommend.sh recommend
bash what-to-eat-recommend/scripts/recommend.sh recommend --strategy random

# 可视化
bash what-to-eat-visualize/scripts/visualize.sh 3000
```

## 开发

### 共享库修改

所有脚本通过 `require()` 加载共享库，修改后立即生效：

```bash
# 修改 scripts/lib/*.js
# 直接测试，无需构建
bash what-to-eat-collect/scripts/collect.sh add "测试"
```

### 添加新功能

1. 在 `scripts/lib/` 中添加共享模块
2. 在对应脚本中 `require()` 加载
3. 更新对应的 `SKILL.md` 文档

## 故障排查

### 数据文件未找到

**症状**：运行 skill 时报错 `ENOENT: no such file or directory`

**解决**：
```bash
# 首次运行会自动初始化，如果失败则手动创建
mkdir -p ~/.what-to-eat/data
echo '{"dishes":[],"pending":[]}' > ~/.what-to-eat/data/dishes.json
```

### 跨 skill 数据不一致

**症状**：在 collect 中添加的菜品，recommend 看不到

**解决**：确认所有 skill 使用同一个 `~/.what-to-eat/` 目录。检查 `~/.what-to-eat/config.json` 是否存在。

## 技术栈

- **Shell**: Bash
- **运行时**: Node.js 14+
- **架构**: 共享库 + 独立脚本
- **数据格式**: JSON
- **配置**: JSON（支持三级优先级）

## OpenSpec

本项目使用 OpenSpec 进行变更管理和任务跟踪：

```bash
# 查看当前变更
openspec status

# 列出所有变更
openspec list

# 查看变更详情
openspec show <change-name>
```

### 当前变更

**integrate-skills-with-shared-lib** - 整合 Skill 与共享库架构

- **进度**: 阶段 0-4 完成（约 85%）
- **剩余工作**: 文档完善与迁移脚本
- **详细任务**: `openspec/changes/integrate-skills-with-shared-lib/tasks.md`

## 剩余工作

详细的任务清单和优先级请查看：

- **OpenSpec Tasks**: `openspec/changes/integrate-skills-with-shared-lib/tasks.md`
- **剩余任务总结**: `REMAINING_TASKS.md`（项目根目录）

### 快速概览

| 优先级 | 任务 | 预计时间 | 状态 |
|--------|------|---------|------|
| 🔴 P0 | 脚本完整测试 | 2 小时 | ⏳ 待开始 |
| 🟡 P1 | 共享库单元测试 | 3-4 小时 | ⏳ 待开始 |
| 🟡 P1 | 集成测试 | 2 小时 | ⏳ 待开始 |
| 🟢 P2 | 模块化文档 | 3-4 小时 | ⏳ 待开始 |
| 🟢 P2 | 配置增强 | 2-3 小时 | ⏳ 待开始 |


## License

MIT
