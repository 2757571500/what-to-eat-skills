# 技术设计：整合 Skill 与共享库架构

## 背景

当前项目已重构为 5 个独立 Skill，但面临**代码重复严重**的问题：
- collect.sh/manage.sh/recommend.sh 各内联完整的 data-accessor.js 和 dishes.js
- 总计约 2400 行代码中，约 600 行是重复的

### 核心问题

1. **维护噩梦**：修复 data-accessor.js 的 bug 需要修改 3 个文件
2. **包体积过大**：单个脚本超过 600 行，可读性差
3. **扩展困难**：新增功能需要复制粘贴大量代码
4. **配置不灵活**：数据路径硬编码为 `~/.what-to-eat/`

### 约束条件

- **减少重复**：共享代码统一到 `scripts/lib/`
- **保持独立**：每个 skill 仍可独立安装运行
- **配置灵活**：支持三级优先级（命令行 > config.json > 默认）
- **向后兼容**：CLI 命令和数据结构完全兼容
- **最小依赖**：仅使用 bash + Node.js（不引入新工具）

---

## 目标 / 非目标

### 目标

1. **统一共享库**：创建 `scripts/lib/`，消除代码重复
2. **简化脚本**：每个脚本从 600+ 行减少到 100-200 行
3. **可配置路径**：支持自定义数据文件位置
4. **模块化文档**：SKILL.md 轻量化，功能文档按需加载
5. **向后兼容**：用户现有使用方式完全不变

### 非目标

1. **不拆分仓库**：5 个 skill 仍保持同一仓库
2. **不修改数据格式**：`dishes.json` 结构保持不变
3. **不改变推荐算法**：仅重构代码结构
4. **不实现复杂构建系统**：不使用 Webpack/Rollup，保持简单
5. **不做多数据支持**：不支持同时维护多套数据

---

## 关键决策

### 决策 1：共享库结构

**决策**：创建 `scripts/lib/` 目录，包含 5 个核心模块

**目录结构**（已重组）：
```
what-to-eat-skills/                  ← 所有 skill 集中在这里
├── SKILL.md                        ← 总控入口
├── config.json                     ← 默认配置（可选）
├── scripts/                        ← 脚本目录
│   ├── collect.sh
│   ├── manage.sh
│   ├── recommend.sh
│   ├── visualize.sh
│   └── lib/                        ← 统一共享库
│       ├── data-accessor.js        # 统一数据访问层
│       ├── dishes.js               # 数据结构定义
│       ├── recommend.js            # 推荐算法
│       ├── auto-generate.js        # AI 生成
│       └── seed.js                 # 种子数据
├── what-to-eat-collect/            ← 子 skill
│   └── SKILL.md
├── what-to-eat-manage/             ← 子 skill
│   └── SKILL.md
├── what-to-eat-recommend/          ← 子 skill
│   └── SKILL.md
├── what-to-eat-visualize/          ← 子 skill
│   └── SKILL.md
└── docs/                           ← 模块化文档（可选）
    ├── collect.md
    ├── manage.md
    ├── recommend.md
    └── visualize.md
```

**data-accessor.js 职责**：
- 配置管理（读取 config.json）
- 数据路径解析（优先级：命令行 > config.json > 默认）
- 文件读写（原子写操作）
- 自动初始化（首次运行创建配置）

**dishes.js 职责**：
- 菜品数据结构定义
- 基础操作（addDish, getDish, deleteDish, updateDish）

**recommend.js 职责**：
- 轮换优先算法
- 随机抽签算法
- 条件筛选算法
- 加权推荐算法

**auto-generate.js 职责**：
- AI 菜品生成逻辑
- 种子库采样

**seed.js 职责**：
- 种子数据（分类、标签、示例菜品）

---

### 决策 2：脚本引用方式

**决策**：使用 Node.js 的 `require()` 加载共享库（不降级）

**理由**：
- Node.js 已是运行环境（所有脚本都依赖 node）
- require() 是 Node.js 内置，无需额外依赖
- 直接且简单，易于理解和维护

**实现方式**：
```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 切换到脚本目录（确保 require 路径正确）
cd "$SCRIPT_DIR"

# 加载共享库
node -e "
const { DataAccessor } = require('./lib/data-accessor.js');
const { addDish, getPending, confirmDish } = require('./lib/dishes.js');
const { autoGenerate } = require('./lib/auto-generate.js');

// collect.sh 业务逻辑
const command = process.argv[2];
// ...
"
```

**为什么不用 bash source**：
- ❌ bash source 只能加载 bash 函数，不能加载 Node.js 模块
- ✅ require() 直接加载 JS 模块，统一运行环境
- ✅ 路径解析更简单（相对脚本目录）

---

### 决策 3：数据路径配置

**决策**：三级优先级（命令行 > config.json > 默认）

**config.json 位置**：`what-to-eat-skills/config.json`

**优先级实现**：
```javascript
// data-accessor.js
class DataAccessor {
  constructor(overridePath = null) {
    // 1. 命令行参数（最高优先级）
    if (overridePath) {
      this.dataPath = this.resolvePath(overridePath);
      return;
    }

    // 2. config.json
    const skillConfigPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(skillConfigPath)) {
      const config = JSON.parse(fs.readFileSync(skillConfigPath, 'utf-8'));
      if (config.dataPath) {
        this.dataPath = this.resolvePath(config.dataPath);
        return;
      }
    }

    // 3. 默认路径
    this.dataPath = path.join(os.homedir(), '.what-to-eat', 'data', 'dishes.json');
  }

  resolvePath(dataPath) {
    // 绝对路径 → 直接使用
    if (path.isAbsolute(dataPath)) return dataPath;
    // 相对路径 → 相对于 skill 目录
    return path.resolve(__dirname, '..', dataPath);
  }
}
```

**config.json 示例**：
```json
{
  "dataPath": "./data/dishes.json",
  "description": "数据文件路径",
  "version": "2.0.0"
}
```

**支持三种配置方式**：
```bash
# 1. 命令行参数（临时）
bash collect.sh add "菜" --data-path /tmp/test.json

# 2. config.json（永久）
# 编辑 what-to-eat-skills/config.json
{
  "dataPath": "/Users/xxx/my-recipes.json"
}

# 3. 默认路径（无需配置）
# ~/.what-to-eat/data/dishes.json
```

---

### 决策 4：SKILL.md 文档架构

**决策**：主入口 + 按需加载子文档

**SKILL.md（主入口，~80 行）**：
```markdown
---
name: what-to-eat-skills
description: 统一菜品管理入口
---

# what-to-eat-skills

## 快速分发

当用户提出菜品相关请求时：
1. **识别意图** → 根据关键词判断类型
2. **读取文档** → 读取 `docs/<意图>.md`
3. **执行命令** → 调用 `scripts/<命令>.sh`
4. **格式化输出** → 返回结果

## 意图识别表

| 意图类型 | 触发关键词 | 对应文档 |
|---------|-----------|---------|
| 菜品收集 | 加、录入、添加、生成 | `docs/collect.md` |
| 日常管理 | 吃了、记录、删除 | `docs/manage.md` |
| 菜品推荐 | 推荐、随机、筛选 | `docs/recommend.md` |
| 可视化 | 打开、看看、网页 | `docs/visualize.md` |

## 执行步骤

1. **解析用户输入** → 提取关键词，匹配意图类型
2. **按需加载文档** → 读取 `docs/<意图>.md`
3. **执行对应命令** → 根据文档中的 CLI 命令执行操作
4. **格式化输出** → 按照文档中的示例格式回复
```

**子文档（docs/collect.md）**：
```markdown
# 菜品收集模块

## 何时使用此 Skill

当用户意图属于"菜品收集"时...

## 1. 手动录入菜品

**CLI 命令**:
```bash
bash scripts/collect.sh add <菜名> [--category 分类]
```

（完整文档保持现有内容）
```

**好处**：
- ✅ SKILL.md 轻量化（80 行 vs 1200+ 行）
- ✅ 按需加载，不一次性读取所有内容
- ✅ 文档模块化，易于维护

---

### 决策 5：目录结构重组

**决策**：将所有 skill 移动到 `what-to-eat-skills/` 子目录下

**重组过程**：
```
重组前：
E:\Code\what-to-eat-skills\
├── scripts/              ← 移动到 what-to-eat-skills/scripts/
├── what-to-eat-collect/  ← 移动到 what-to-eat-skills/what-to-eat-collect/
├── what-to-eat-manage/   ← 移动到 what-to-eat-skills/what-to-eat-manage/
└── ...

重组后：
E:\Code\what-to-eat-skills\
└── what-to-eat-skills\   ← 所有 skill 集中在这里
    ├── scripts/
    ├── what-to-eat-collect/
    ├── what-to-eat-manage/
    └── ...
```

**关键优势**：
- ✅ **相对路径不变**：层级关系相同（都是 `../../scripts/lib/`）
- ✅ **零代码修改**：所有脚本直接工作
- ✅ **结构清晰**：便于打包、分发、备份
- ✅ **Claude Code 友好**：唯一入口 `what-to-eat-skills/SKILL.md`

**路径验证**：
```
what-to-eat-collect/scripts/collect.sh
  └─> ../../scripts/lib/data-accessor.js  (3 层上溯)

what-to-eat-skills/what-to-eat-collect/scripts/collect.sh
  └─> ../../scripts/lib/data-accessor.js  (3 层上溯，相同！)
```

---

### 决策 6：向后兼容策略

**决策**：CLI 命令和数据结构完全兼容

**兼容性保证**：
1. **命令不变**：`collect.sh add "菜"` 仍可工作
2. **参数不变**：`--category`, `--tags`` 等参数保持
3. **输出格式不变**：`✅ 已添加「菜」到待确认列表`
4. **数据格式不变**：`dishes.json` 结构完全兼容
5. **路径兼容**：默认仍使用 `~/.what-to-eat/data/dishes.json`

**迁移脚本**（可选）：
```bash
#!/bin/bash
# scripts/migrate.sh

echo "🔄 检查数据兼容性..."

# 检查旧数据
if [ -f "../data/dishes.json" ]; then
  echo "⚠️  检测到旧版数据文件"
  echo "   位置: ../data/dishes.json"
  echo "   新位置: ~/.what-to-eat/data/dishes.json"
  echo ""
  read -p "是否迁移数据？(y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 复制数据
    mkdir -p ~/.what-to-eat/data
    cp ../data/dishes.json ~/.what-to-eat/data/dishes.json
    echo "✅ 数据已迁移"
  fi
fi
```

---

### 决策 6：构建与部署

**决策**：不引入复杂构建系统，直接使用共享库

**开发流程**：
```
1. 修改 scripts/lib/*.js（共享库）
2. 直接测试 scripts/*.sh（自动加载最新共享库）
3. 无需构建步骤（Node.js require() 自动处理）
```

**部署流程**：
```bash
# 1. 克隆仓库
git clone <repo>
cd what-to-eat-skills

# 2. 首次使用（自动初始化）
bash scripts/recommend.sh stats
# → 自动创建 ~/.what-to-eat/config.json + data/dishes.json

# 3. 开始使用
bash scripts/collect.sh add "麻婆豆腐"
```

**为什么不用构建系统**：
- ❌ 增加复杂度（Webpack/Rollup 配置）
- ❌ 降低透明度（生成的文件难以调试）
- ❌ 增加维护成本（构建脚本需要维护）
- ✅ Node.js require() 已是完美的模块系统

---

## 架构图

### 整合后架构

```
┌─────────────────────────────────────────────────────────────┐
│                    what-to-eat-skills/                       │
│                                                             │
│  ┌──────────────┐                                          │
│  │  SKILL.md    │  ← 轻量入口（意图识别 + 分发）           │
│  └──────┬───────┘                                          │
│         │                                                   │
│         ├──> docs/collect.md                               │
│         ├──> docs/manage.md                                │
│         ├──> docs/recommend.md                             │
│         └──> docs/visualize.md                             │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │  scripts/                                        │        │
│  │  ├── collect.sh    (~150行，业务逻辑)           │        │
│  │  ├── manage.sh     (~120行)                      │        │
│  │  ├── recommend.sh  (~200行)                      │        │
│  │  ├── visualize.sh  (~150行)                      │        │
│  │  └── lib/          (统一共享库)                  │        │
│  │      ├── data-accessor.js  (数据访问层)         │        │
│  │      ├── dishes.js         (数据结构)            │        │
│  │      ├── recommend.js      (推荐算法)            │        │
│  │      ├── auto-generate.js  (AI 生成)             │        │
│  │      └── seed.js           (种子数据)            │        │
│  └────────────────────────────────────────────────┘        │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │  config.json                                     │        │
│  │  {                                               │        │
│  │    "dataPath": "./data/dishes.json"              │        │
│  │  }                                               │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 优先级
                            ▼
                ┌───────────────────────┐
                │ 1. 命令行参数           │
                │    --data-path /path   │
                ├───────────────────────┤
                │ 2. config.json          │
                │    ./data/dishes.json  │
                ├───────────────────────┤
                │ 3. 默认路径             │
                │    ~/.what-to-eat/data/ │
                └───────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  dishes.json           │
                │  { dishes: [], ... }   │
                └───────────────────────┘
```

### 数据流

```
用户输入
   │
   ▼
┌──────────────────────┐
│ SKILL.md（轻量）      │
│ 1. 意图识别          │
│ 2. 读取 docs/*.md    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ docs/<意图>.md        │
│ 1. 执行步骤          │
│ 2. CLI 命令          │
│ 3. 示例对话          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ scripts/<命令>.sh     │
│ └─> lib/*.js          │
│     └─> DataAccessor  │
│         └─> 读取配置   │
│             ├─ 命令行参数
│             ├─ config.json
│             └─ 默认路径
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ dishes.json          │
└──────────────────────┘
```

---

## 风险与缓解

### 风险 1：脚本加载失败

**风险**：Node.js require() 找不到 lib/ 模块

**缓解措施**：
```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# 检查共享库是否存在
if [ ! -f "lib/data-accessor.js" ]; then
  echo "❌ 共享库不存在，请确保 scripts/lib/ 目录完整"
  exit 1
fi

node -e "require('./lib/data-accessor.js')" || exit 1
```

---

### 风险 2：config.json 路径解析错误

**风险**：相对路径解析不符合用户预期

**缓解措施**：
- 明确文档说明路径解析规则
- config.json 中使用绝对路径或 `./` 前缀避免歧义
- 启动时输出当前使用的数据路径（调试信息）

**实现**：
```javascript
resolvePath(dataPath) {
  const resolved = path.isAbsolute(dataPath)
    ? dataPath
    : path.resolve(__dirname, '..', dataPath);

  // 调试输出
  console.error(`[debug] 数据路径: ${resolved}`);
  return resolved;
}
```

---

### 风险 3：Windows 路径兼容性

**风险**：相对路径在 Windows 上表现不同

**缓解措施**：
- 使用 Node.js 的 `path.join()` 和 `path.resolve()`
- 避免硬编码 `/` 或 `\`
- 在 Windows 上测试相对路径

**测试用例**：
```javascript
// Windows: C:\Users\xxx\what-to-eat-skills
// dataPath: "./data/dishes.json"
// 解析为: C:\Users\xxx\what-to-eat-skills\data\dishes.json ✓
```

---

## 迁移策略

### 向后兼容性

1. **命令兼容**：`bash scripts/collect.sh add "菜"` 仍可工作
2. **参数兼容**：`--category`, `--tags` 等参数保持不变
3. **输出兼容**：格式和内容完全一致
4. **数据兼容**：`dishes.json` 结构不变

### 首次运行初始化

```bash
# 用户克隆仓库后首次使用
bash scripts/recommend.sh stats

# DataAccessor 自动检测并创建：
# 1. ~/.what-to-eat/config.json（如果不存在）
# 2. ~/.what-to-eat/data/dishes.json（如果不存在）
```

### 可选：从旧版迁移

如果用户之前使用旧版（`data/dishes.json` 在项目本地）：

```bash
# 运行迁移脚本
bash scripts/migrate.sh

# 或手动复制
cp data/dishes.json ~/.what-to-eat/data/dishes.json
```

---

## 性能考虑

### 脚本启动时间

**优化前**：每个脚本 ~650 行，Node.js 启动 + 执行 ~300ms

**优化后**：
```bash
# collect.sh: ~150 行 + require() 加载模块
# require() 有缓存，第二次加载 < 50ms
# 首次加载 ~200ms（可接受）
```

**无需担心**：
- Node.js 模块缓存机制
- 共享库只加载一次
- 实际使用中感知不到差异

### 内存占用

**优化前**：每个脚本 ~20MB（Node.js 进程）

**优化后**：
- 共享库通过 require() 加载，内存复用
- 实际占用 ~15MB（减少 ~5MB）

**结论**：优化效果不明显，但代码可维护性大幅提升

---

## 测试策略

### 单元测试

```bash
# 测试 data-accessor.js
npm test -- data-accessor.test.js

# 测试 recommend.js
npm test -- recommend.test.js
```

### 集成测试

```bash
# 测试完整流程
bash scripts/collect.sh add "测试菜"
bash scripts/recommend.sh stats
bash scripts/manage.sh eat "测试菜"
```

### 兼容性测试

```bash
# 1. 数据兼容性
# 使用旧版 data/dishes.json → 在新版中正常读取

# 2. 命令兼容性
# 运行所有旧命令 → 输出格式完全一致

# 3. 跨平台测试
# Windows / macOS / Linux
```

---

## 待解决问题

1. **可视化前端文件**：visualize.sh 的 HTML/CSS/JS 是否保持为独立文件？
   - **建议**：是，保持为 `visualize/web/` 目录

2. **是否需要 build.js**：
   - **建议**：不需要（Node.js require() 已足够）

3. **是否需要版本锁定**：
   - **建议**：不需要（共享库随 skill 一起更新）
