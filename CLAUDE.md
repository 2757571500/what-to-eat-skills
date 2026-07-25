# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**what-to-eat-skills** 是一个 Claude Code Skill 集合，用于管理菜品数据（收集、推荐、管理、可视化）。采用"总控入口 + 4 个子 Skill"架构，所有 Skill 共享统一的 Node.js 库。

### 核心特性

- **统一共享库**：5 个 Node.js 模块（data-accessor, dishes, recommend, auto-generate, seed），代码从 2400+ 行精简到 1270 行（-47%）
- **三级配置优先级**：命令行参数 > config.json > 默认路径（`~/.what-to-eat/data/dishes.json`）
- **模块化文档**：主入口 SKILL.md（68 行）+ 4 个子文档（collect.md, manage.md, recommend.md, visualize.md）
- **OpenSpec 驱动**：使用 OpenSpec 进行变更管理和任务跟踪

### 沟通规范

- **使用中文沟通**：所有用户交互、文档、注释和用户可见输出均使用简体中文
- **技术术语保留英文**：代码、命令、变量名等保持英文原样
- **行动前确认事项**：重大修改或需要用户决策时，先确认再执行

## 目录结构

```
what-to-eat-skills/                    # 主工作目录
├── SKILL.md                          # 总控入口（意图识别 + 分发）
├── config.json                       # 默认配置
├── CHANGELOG.md                      # 版本历史
├── README.md                         # 项目说明
├── data/
│   └── example.json                  # 示例数据
├── docs/                             # 模块化文档
│   ├── collect.md                    # 菜品收集
│   ├── manage.md                     # 日常管理
│   ├── recommend.md                  # 菜品推荐
│   └── visualize.md                  # 可视化
├── scripts/                          # 统一脚本目录
│   ├── collect.sh                    # 菜品收集脚本
│   ├── manage.sh                     # 日常管理脚本
│   ├── recommend.sh                  # 菜品推荐脚本
│   ├── visualize.sh                  # 可视化启动脚本
│   ├── server.js                     # 静态文件服务器（Node.js）
│   ├── config.json                   # 测试配置
│   └── lib/                          # 共享库（5 个模块）
│       ├── data-accessor.js          # 数据访问层（配置、路径、文件读写）
│       ├── dishes.js                 # CRUD + 格式化输出
│       ├── recommend.js              # 推荐算法（4 种策略）
│       ├── auto-generate.js          # AI 菜品生成
│       └── seed.js                   # 种子数据
├── what-to-eat-collect/              # 菜品收集 Skill
│   └── SKILL.md
├── what-to-eat-manage/               # 日常管理 Skill
│   └── SKILL.md
├── what-to-eat-recommend/            # 菜品推荐 Skill
│   └── SKILL.md
├── what-to-eat-visualize/            # 可视化 Skill
│   ├── SKILL.md
│   └── scripts/
│       ├── visualize.sh
│       └── server.js
└── openspec/                         # OpenSpec 配置
    ├── config.yaml                   # 项目规范
    ├── specs/                        # 规范文档
    └── changes/                      # 变更提案
        ├── archive/                  # 已归档变更
        │   └── 2026-07-25-integrate-skills-with-shared-lib/
        └── refactor-to-independent-skills/
```

## 常用命令

### 数据收集（collect.sh）

```bash
# 进入脚本目录
cd what-to-eat-skills

# 添加菜品（支持可选参数）
bash what-to-eat-collect/scripts/collect.sh add "麻婆豆腐"
bash what-to-eat-collect/scripts/collect.sh add "番茄炒鸡蛋" --category 家常菜 --prepTime 15 --difficulty 简单

# 查看待确认列表
bash what-to-eat-collect/scripts/collect.sh list-pending

# 确认/拒绝菜品（按名称或索引）
bash what-to-eat-collect/scripts/collect.sh confirm "麻婆豆腐"
bash what-to-eat-collect/scripts/collect.sh confirm 0
bash what-to-eat-collect/scripts/collect.sh reject "番茄炒鸡蛋"
bash what-to-eat-collect/scripts/collect.sh reject 1

# 批量确认/拒绝
bash what-to-eat-collect/scripts/collect.sh confirm-all
bash what-to-eat-collect/scripts/collect.sh reject-all

# AI 生成菜品
bash what-to-eat-collect/scripts/collect.sh auto-generate "川菜"

# 配置管理
bash what-to-eat-collect/scripts/collect.sh config show
bash what-to-eat-collect/scripts/collect.sh config set dataPath ./custom-dishes.json
bash what-to-eat-collect/scripts/collect.sh config validate

# 使用自定义数据路径
bash what-to-eat-collect/scripts/collect.sh add "测试" --data-path /tmp/test-dishes.json
```

### 日常管理（manage.sh）

```bash
# 记录食用
bash what-to-eat-manage/scripts/manage.sh eat "麻婆豆腐"

# 删除菜品
bash what-to-eat-manage/scripts/manage.sh delete "糖醋排骨"

# 查看统计
bash what-to-eat-manage/scripts/manage.sh stats

# 列出所有菜品
bash what-to-eat-manage/scripts/manage.sh list

# 查看详情
bash what-to-eat-manage/scripts/manage.sh show "麻婆豆腐"
```

### 菜品推荐（recommend.sh）

```bash
# 推荐菜品（默认轮换优先策略）
bash what-to-eat-recommend/scripts/recommend.sh recommend

# 随机推荐
bash what-to-eat-recommend/scripts/recommend.sh recommend --strategy random

# 筛选推荐（按分类）
bash what-to-eat-recommend/scripts/recommend.sh recommend --strategy filter --category 川菜

# 加权推荐（基于食用频率）
bash what-to-eat-recommend/scripts/recommend.sh recommend --strategy weighted

# 列出所有菜品
bash what-to-eat-recommend/scripts/recommend.sh list

# 查看统计
bash what-to-eat-recommend/scripts/recommend.sh stats
```

### 可视化（visualize.sh + server.js）

```bash
# 启动可视化服务器（默认端口 3000）
bash what-to-eat-visualize/scripts/visualize.sh 3000

# 或直接运行 Node.js
node what-to-eat-visualize/scripts/server.js 3000

# 访问 http://localhost:3000
```

### 数据位置

数据默认存储在用户主目录：

```bash
# Linux/macOS
~/.what-to-eat/data/dishes.json
~/.what-to-eat/data/dishes-pending.json

# Windows
C:\Users\<用户名>\.what-to-eat\data\dishes.json
```

**配置优先级**（高 → 低）：
1. 命令行参数：`--data-path /custom/path.json`
2. config.json：`what-to-eat-skills/config.json`
3. 默认路径：`~/.what-to-eat/data/dishes.json`

## 架构设计

### 共享库架构

所有脚本通过 `node -e` 执行，动态加载 `scripts/lib/` 中的模块：

```javascript
// 1. 设置数据路径（优先级 0）
global.__WHAT_TO_EAT_OVERRIDE_PATH__ = cmdArgs["data-path"] || null;

// 2. 加载共享库
const { DataAccessor } = require("./data-accessor.js");
const { addDish, getPending, ... } = require("./dishes.js");
const { recommendRotation, ... } = require("./recommend.js");

// 3. 执行业务逻辑
```

**模块职责**：

| 模块 | 职责 | 关键 API |
|------|------|----------|
| **data-accessor.js** | 配置管理、路径解析、原子写入 | `DataAccessor`, `getDataPath()`, `ensureInitialized()` |
| **dishes.js** | 数据 CRUD、格式化输出 | `addDish()`, `recordEat()`, `deleteDish()`, `getAllDishes()` |
| **recommend.js** | 推荐算法（4 种策略） | `recommendRotation()`, `recommendRandom()`, `recommendFiltered()`, `recommendWeighted()` |
| **auto-generate.js** | AI 菜品生成 | `autoGenerate(prompt)` |
| **seed.js** | 种子数据 | `CATEGORIES`, `TAGS`, `DIFFICULTIES` |

### 意图分发（总控入口）

`what-to-eat-skills/SKILL.md` 实现意图识别和分发：

| 意图类型 | 触发关键词 | 分发目标 |
|---------|-----------|---------|
| **菜品收集** | 加、录入、添加、生成、待确认 | `what-to-eat-collect` |
| **菜品推荐** | 推荐、随机、筛选、吃什么 | `what-to-eat-recommend` |
| **日常管理** | 吃了、记录、删除、移除 | `what-to-eat-manage` |
| **可视化** | 打开、看看、网页、界面 | `what-to-eat-visualize` |
| **模糊请求** | 今天、怎么办、今天吃 | `what-to-eat-recommend`（默认推荐） |

## 开发流程

### 首次运行

1. **安装依赖**：确保 Node.js 14+ 已安装
2. **初始化数据**：首次运行任意 Skill 会自动初始化 `~/.what-to-eat/data/`

### 调试模式

设置环境变量启用调试输出：

```bash
# Bash
DEBUG=what-to-eat bash what-to-eat-collect/scripts/collect.sh add "测试"

# PowerShell
$env:DEBUG="what-to-eat"; bash what-to-eat-collect/scripts/collect.sh add "测试"
```

调试输出包括：
- 数据文件路径解析过程
- 配置加载优先级
- 库模块加载路径

### 修改共享库

共享库使用 CommonJS 模块系统，修改后立即生效（无需构建）：

```bash
# 1. 修改 scripts/lib/*.js
vim what-to-eat-skills/scripts/lib/dishes.js

# 2. 测试
bash what-to-eat-skills/what-to-eat-manage/scripts/manage.sh stats
```

### 添加新功能

1. **在 `scripts/lib/` 中添加共享模块**
2. **在对应脚本中 `require()` 加载**
3. **更新 SKILL.md 文档**

示例：添加新推荐策略

```javascript
// scripts/lib/recommend.js
function recommendNewStrategy(dishes, options) {
  // 实现逻辑
  return result;
}

module.exports = {
  // ... 其他导出
  recommendNewStrategy,
};
```

```bash
# scripts/recommend.sh 中加载
const { recommendNewStrategy } = require("./recommend.js");

# 在 switch-case 中添加命令
case "new-strategy": {
  const result = recommendNewStrategy(dishes, opts);
  console.log(formatRecommendation(result));
  break;
}
```

### 运行测试

```bash
# 功能测试
bash what-to-eat-skills/what-to-eat-collect/scripts/collect.sh list-pending
bash what-to-eat-skills/what-to-eat-manage/scripts/manage.sh stats
bash what-to-eat-skills/what-to-eat-recommend/scripts/recommend.sh recommend

# 集成测试：collect → recommend
bash what-to-eat-collect/scripts/collect.sh add "测试菜品"
bash what-to-eat-recommend/scripts/recommend.sh recommend

# 并发测试（多个终端同时运行）
bash what-to-eat-collect/scripts/collect.sh add "菜品1" &
bash what-to-eat-collect/scripts/collect.sh add "菜品2" &
wait
```

## OpenSpec 工作流

本项目使用 OpenSpec 进行变更管理：

```bash
# 查看当前状态
openspec status

# 列出所有变更
openspec list

# 查看变更详情
openspec show <change-name>

# 创建新变更
openspec propose <change-name>

# 查看任务清单
openspec changes/<change-name>/tasks.md
```

### 当前主要变更

**refactor-to-independent-skills** - 重构为独立 Skill 架构
- 进度：阶段 0-4 完成（约 85%）
- 详细任务：`openspec/changes/refactor-to-independent-skills/tasks.md`

## 技术栈

- **Shell**: Bash（跨平台兼容）
- **运行时**: Node.js 14+
- **模块系统**: CommonJS（`require()` / `module.exports`）
- **数据格式**: JSON（原子写入保证数据安全）
- **配置**: JSON（三级优先级）
- **任务管理**: OpenSpec（spec-driven 架构）

## 故障排查

### 数据文件未找到

**症状**：`Error: 数据文件不存在: ~/.what-to-eat/data/dishes.json`

**解决**：
```bash
# 手动初始化
mkdir -p ~/.what-to-eat/data
echo '{"dishes":[],"pending":[]}' > ~/.what-to-eat/data/dishes.json
```

### 跨 Skill 数据不一致

**症状**：在 collect 中添加的菜品，recommend 看不到

**解决**：
```bash
# 检查 config.json 是否存在
cat ~/.what-to-eat/config.json

# 确认所有 Skill 使用同一个数据路径
bash what-to-eat-collect/scripts/collect.sh config show
```

### 共享库加载失败

**症状**：`Error: Cannot find module './data-accessor.js'`

**解决**：
```bash
# 检查共享库是否存在
ls -la what-to-eat-skills/scripts/lib/

# 确认脚本中的相对路径正确
# collect.sh 行 8: SHARED_LIB_DIR="$(cd "$SCRIPT_DIR/../../scripts/lib" && pwd)"
```

### Windows 路径问题

**症状**：`Cannot find module`（Windows 环境）

**解决**：
- 使用 Git Bash 或 WSL
- 确保 `bash` 命令可用（安装 Git for Windows）

## 代码质量

### 性能指标

- 脚本启动时间：< 300ms
- 数据读取时间：< 50ms
- 内存占用：< 20MB
- 并发访问：原子写入保证数据安全

### 代码行数

| 脚本 | 重构前 | 重构后 | 减少 |
|------|--------|--------|------|
| collect.sh | 659 行 | ~130 行 | -80% |
| manage.sh | 580 行 | ~80 行 | -86% |
| recommend.sh | 720 行 | ~110 行 | -85% |
| visualize.sh | 450 行 | ~180 行 | -60% |
| **总计** | **2409 行** | **~500 行** | **-79%** |

（加上共享库 1270 行，总代码量减少 47%）

## 关键文件速查

| 文件 | 用途 | 关键内容 |
|------|------|----------|
| `what-to-eat-skills/SKILL.md` | 总控入口 | 意图识别关键词、分发逻辑 |
| `scripts/lib/data-accessor.js` | 配置管理 | 三级路径优先级、原子写入 |
| `scripts/lib/dishes.js` | 数据操作 | CRUD、格式化、统计 |
| `scripts/lib/recommend.js` | 推荐算法 | 轮换、随机、筛选、加权 |
| `what-to-eat-collect/scripts/collect.sh` | 收集脚本 | add、confirm、reject、auto-generate |
| `what-to-eat-manage/scripts/manage.sh` | 管理脚本 | eat、delete、stats |
| `what-to-eat-recommend/scripts/recommend.sh` | 推荐脚本 | recommend、list、stats |
| `what-to-eat-visualize/scripts/server.js` | Web 服务器 | 静态文件服务、数据接口 |

## 注意事项

- **不执行 CLI 命令**：总控 Skill 只负责意图识别和分发
- **跨平台兼容**：优先使用 path 处理，避免硬编码分隔符
- **中文输出**：所有用户可见内容使用简体中文
- **数据安全**：原子写入（写临时文件 → 重命名）避免数据损坏
- **相对路径**：脚本通过 `../../scripts/lib` 定位共享库，移动目录需同步调整
