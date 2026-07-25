---
name: shared-library-architecture
description: 统一共享库架构 - 消除代码重复，统一数据访问层、数据结构、推荐算法等共享模块
---

# 规格说明：统一共享库架构

## 背景

当前每个脚本（collect.sh, manage.sh, recommend.sh）都内联完整的 data-accessor.js 和 dishes.js，导致：
- 代码重复率 > 40%（约 600 行重复代码）
- 维护成本高（修改需同步 3 个文件）
- 包体积过大（单个脚本 > 600 行）

## 目标

创建一个统一的 `scripts/lib/` 目录，包含所有共享模块，供各个脚本通过 `require()` 加载。

---

## Scenarios

### Scenario 1：data-accessor.js 提供统一数据访问

**Given** 用户执行任何命令（如 `bash scripts/collect.sh add "菜"`）
**When** collect.sh 加载 `lib/data-accessor.js`
**Then** DataAccessor 类应该：
- ✅ 读取 `config.json`（优先从 skill 目录，否则默认路径）
- ✅ 解析 `dataPath` 字段
- ✅ 返回完整的数据文件路径
- ✅ 提供 `readJSON()` 和 `writeJSON()` 方法
- ✅ 首次运行时自动创建配置和数据文件

**示例**：
```javascript
const { DataAccessor } = require('./lib/data-accessor.js');
const accessor = new DataAccessor();
const dishesFile = accessor.getDataPath();
// → 返回解析后的完整路径
const dishes = accessor.readJSON(dishesFile);
// → 读取数据
accessor.writeJSON(dishesFile, updatedDishes);
// → 原子写操作
```

---

### Scenario 2：dishes.js 提供共享菜品操作

**Given** collect.sh/manage.sh/recommend.sh 都加载 `lib/dishes.js`
**When** 任意脚本调用 dishes.js 导出的函数
**Then** 应该：
- ✅ 提供 `addDish(dish)` - 添加菜品
- ✅ 提供 `getDish(name)` - 查询菜品
- ✅ 提供 `deleteDish(name)` - 删除菜品
- ✅ 提供 `updateDish(name, updates)` - 更新菜品
- ✅ 使用 DataAccessor 提供的数据路径
- ✅ 返回统一的结果格式 `{ ok: boolean, dish?: object, error?: string }`

**示例**：
```javascript
const { addDish, getDish, deleteDish } = require('./lib/dishes.js');

// 添加菜品
const result = addDish({ name: "麻婆豆腐", category: "川菜" });
// → { ok: true, dish: { name: "麻婆豆腐", ... } }

// 查询菜品
const dish = getDish("麻婆豆腐");
// → { name: "麻婆豆腐", category: "川菜", ... }

// 删除菜品
const result = deleteDish("麻婆豆腐");
// → { ok: true }
```

---

### Scenario 3：recommend.js 提供共享推荐算法

**Given** recommend.sh 和 collect.sh（AI 生成需要评分）加载 `lib/recommend.js`
**When** 调用推荐函数
**Then** 应该：
- ✅ 提供 `rotationStrategy(dishes)` - 轮换优先
- ✅ 提供 `randomStrategy(dishes)` - 随机抽签
- ✅ 提供 `filterStrategy(dishes, filters)` - 条件筛选
- ✅ 提供 `weightedStrategy(dishes, preferences)` - 加权推荐
- ✅ 使用统一的菜品数据结构

**示例**：
```javascript
const { rotationStrategy, randomStrategy } = require('./lib/recommend.js');
const dishes = accessor.readJSON(accessor.getDataPath());

// 轮换优先
const top = rotationStrategy(dishes);
// → { name: "麻婆豆腐", reason: "还没吃过" }

// 随机推荐
const random = randomStrategy(dishes);
// → { name: "宫保鸡丁" }
```

---

### Scenario 4：auto-generate.js 提供 AI 生成逻辑

**Given** collect.sh 的 `auto-generate` 命令加载 `lib/auto-generate.js`
**When** 用户执行 `bash scripts/collect.sh auto-generate --count 3`
**Then** 应该：
- ✅ 提供 `autoGenerate(count)` 函数
- ✅ 从种子库采样 + 变体组合生成新菜品
- ✅ 自动调用 `addDish()` 添加到待确认列表
- ✅ 返回生成的菜品列表和策略说明

**示例**：
```javascript
const { autoGenerate } = require('./lib/auto-generate.js');
const { addDish } = require('./lib/dishes.js');

const result = autoGenerate(3);
// → { generated: [...], strategy: "从种子库采样..." }
```

---

### Scenario 5：seed.js 提供种子数据

**Given** auto-generate.js 和推荐算法需要种子数据
**When** 加载 `lib/seed.js`
**Then** 应该：
- ✅ 导出 `SEED_DISHES` - 示例菜品数组
- ✅ 导出 `CATEGORIES` - 分类列表
- ✅ 导出 `DIFFICULTIES` - 难度列表
- ✅ 导出 `COMMON_TAGS` - 常见标签
- ✅ 导出 `generateVariantDishes(count)` - 生成变体菜品

**示例**：
```javascript
const { SEED_DISHES, CATEGORIES, generateVariantDishes } = require('./lib/seed.js');

console.log(CATEGORIES);
// → ["家常菜", "川菜", "凉菜", "汤", "主食", "粤菜", "甜品", "其他"]

const variants = generateVariantDishes(3);
// → [{ name: "鱼香肉丝", ... }, ...]
```

---

### Scenario 6：脚本正确引用共享库

**Given** 用户执行 `bash scripts/collect.sh add "菜"`
**When** collect.sh 启动
**Then** 应该：
- ✅ 切换到脚本目录（`cd "$SCRIPT_DIR"`）
- ✅ 加载 `lib/data-accessor.js`
- ✅ 加载 `lib/dishes.js`
- ✅ 加载 `lib/auto-generate.js`（如果需要）
- ✅ 执行失败时输出明确错误信息

**示例**：
```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

node -e "
const { DataAccessor } = require('./lib/data-accessor.js');
const { addDish } = require('./lib/dishes.js');
// ... 业务逻辑
"
```

---

### Scenario 7：共享库版本一致性

**Given** 共享库更新（如修复 data-accessor.js 的 bug）
**When** 用户拉取最新代码
**Then** 应该：
- ✅ 所有脚本自动使用最新版本的共享库
- ✅ 无需修改任何脚本
- ✅ 保持向后兼容（API 不变）

---

## 非功能性需求

### 性能

- **模块加载时间**：< 100ms（利用 Node.js 缓存）
- **数据访问时间**：< 50ms（JSON 文件 < 1MB）
- **内存占用**：< 20MB（Node.js 进程）

### 可靠性

- **数据完整性**：writeJSON() 使用原子写操作（.tmp → rename）
- **错误处理**：所有函数返回 `{ ok, error? }` 格式
- **优雅降级**：配置文件损坏时提示用户修复

### 兼容性

- **Node.js 版本**：>= 14.0.0（ES6+ 语法）
- **操作系统**：Windows / macOS / Linux
- **Shell**：Bash（Git Bash on Windows）

---

## 边界情况

### 边界 1：共享库文件缺失

**Given** 用户误删 `scripts/lib/data-accessor.js`
**When** 执行 `bash scripts/collect.sh add "菜"`
**Then** 应该：
- ✅ 检测到文件缺失
- ✅ 输出明确错误信息：`❌ 共享库不存在：lib/data-accessor.js`
- ✅ 退出码非 0

---

### 边界 2：共享库语法错误

**Given** `lib/data-accessor.js` 有语法错误
**When** collect.sh 尝试加载
**Then** 应该：
- ✅ Node.js 抛出 SyntaxError
- ✅ collect.sh 捕获错误并输出：`❌ 加载共享库失败：lib/data-accessor.js`
- ✅ 显示错误详情（行号、错误信息）

---

### 边界 3：多进程并发写入

**Given** 两个终端同时执行 `collect.sh add`
**When** 两个进程同时调用 `writeJSON()`
**Then** 应该：
- ✅ 原子写操作（.tmp → rename）避免数据损坏
- ✅ 最后写入者覆盖前者（可接受）
- ✅ 不抛出异常

---

## 监控与调试

### 调试模式

```bash
# 启用调试输出
DEBUG=what-to-eat bash scripts/collect.sh add "菜"

# 输出示例：
# [debug] 数据路径: /Users/xxx/.what-to-eat/data/dishes.json
# [debug] 读取配置: { dataPath: "data/dishes.json" }
# [debug] 添加菜品: { name: "菜", category: "其他" }
```

### 日志建议

- data-accessor.js：记录配置读取、路径解析
- dishes.js：记录数据变更（add/delete/update）
- recommend.js：记录推荐策略选择
