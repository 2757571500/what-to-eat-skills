# 整合提案：统一 Skill 架构与共享库

## 为什么需要整合

当前项目已经重构为 5 个独立 Skill，但存在**代码重复严重**的问题：

### 当前问题

1. **代码重复率高**：每个脚本内联完整的 data-accessor.js + dishes.js，collect.sh（659行）中约 400 行是重复代码
2. **维护成本高**：修复 bug 或添加功能需要修改 3-4 个脚本
3. **包体积膨胀**：collect.sh/manage.sh/recommend.sh 各有 ~650 行
4. **扩展性差**：新增功能需要复制粘贴大量代码

### 数据支持

```
collect.sh:   659 行（内联 data-accessor.js ~200行 + dishes.js ~100行）
manage.sh:    580 行（内联 data-accessor.js ~200行 + dishes.js ~100行）
recommend.sh: 720 行（内联 data-accessor.js ~200行 + recommend.js ~150行 + dishes.js ~100行）
```

**重复代码统计**：
- data-accessor.js：重复 3 次（collect, manage, recommend）
- dishes.js：重复 3 次
- seed.js：重复 2 次

**整合后可减少约 600+ 行重复代码**

---

## 变更内容

### 1. 统一共享库架构

**创建 `scripts/lib/` 统一共享层**：

```
what-to-eat-skills/                  ← 所有 skill 集中在这里
├── SKILL.md                        ← 总控入口
├── scripts/
│   ├── collect.sh           ← 简化：仅业务逻辑 (~150行)
│   ├── manage.sh            ← 简化：仅业务逻辑 (~120行)
│   ├── recommend.sh         ← 简化：仅业务逻辑 (~200行)
│   ├── visualize.sh         ← 简化：引用共享库
│   └── lib/                 ← 统一共享层（消除重复）
│       ├── data-accessor.js  # 统一数据访问（单例配置）
│       ├── dishes.js         # 共享数据结构
│       ├── recommend.js      # 推荐算法
│       ├── auto-generate.js  # AI 生成逻辑
│       └── seed.js           # 种子数据
├── what-to-eat-collect/            ← 子 skill
├── what-to-eat-manage/             ← 子 skill
├── what-to-eat-recommend/          ← 子 skill
└── what-to-eat-visualize/          ← 子 skill
```

### 2. 目录结构重组

**重组过程**（已完成）：

```
重组前：
E:\Code\what-to-eat-skills\
├── scripts/              ← 分散在根目录
├── what-to-eat-collect/
├── what-to-eat-manage/
└── ...

重组后：
E:\Code\what-to-eat-skills\
└── what-to-eat-skills\   ← 统一集中在这里
    ├── scripts/
    ├── what-to-eat-collect/
    ├── what-to-eat-manage/
    └── ...
```

**关键优势**：
- ✅ **零代码修改**：相对路径 `../../scripts/lib/` 前后一致
- ✅ **结构清晰**：便于打包、分发、备份
- ✅ **Claude Code 友好**：单一入口 `what-to-eat-skills/SKILL.md`

**路径验证**：
```
what-to-eat-collect/scripts/collect.sh
  └─> ../../scripts/lib/data-accessor.js  (3 层上溯)

what-to-eat-skills/what-to-eat-collect/scripts/collect.sh
  └─> ../../scripts/lib/data-accessor.js  (3 层上溯，相同！)
```

### 2. 脚本简化示例

**整合前（collect.sh）**：
```bash
#!/bin/bash
# 659 行，包含完整的 data-accessor.js + dishes.js + autoGenerate.js
```

**整合后（collect.sh）**：
```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 加载共享库
source "$SCRIPT_DIR/lib/data-accessor.js"
source "$SCRIPT_DIR/lib/dishes.js"
source "$SCRIPT_DIR/lib/auto-generate.js"

# 业务逻辑（仅 ~150 行）
function addDish() {
  local name="$1"
  # ... 使用上面加载的共享函数
}
```

### 3. 配置路径支持

**config.json 位置**：`what-to-eat-skills/config.json`

**配置优先级**：
```
1. 命令行参数（最高）──> --data-path /custom/path/dishes.json
2. config.json（默认）──> what-to-eat-skills/config.json
3. 默认路径（最低）──> ~/.what-to-eat/data/dishes.json
```

**config.json 示例**：
```json
{
  "dataPath": "./data/dishes.json",
  "description": "数据文件路径（支持绝对路径、相对路径或文件名）",
  "version": "2.0.0"
}
```

**路径解析规则**：
- **绝对路径**：`"/Users/xxx/dishes.json"` → 直接使用
- **相对路径**：`"./data/dishes.json"` → 相对于 skill 目录
- **文件名**：`"dishes.json"` → 使用 `~/.what-to-eat/data/`

### 4. 文档模块化

**按需加载文档**：
```
what-to-eat-skills/
├── SKILL.md              # 总入口（意图识别 + 快速分发，~80行）
├── config.json
├── docs/                 # 按需加载的功能文档
│   ├── collect.md       # 菜品收集详情
│   ├── manage.md        # 日常管理详情
│   ├── recommend.md     # 菜品推荐详情
│   └── visualize.md     # 可视化详情
└── scripts/lib/         # 统一共享库
```

**SKILL.md 轻量化**：
```markdown
## 意图识别表

| 意图类型 | 触发关键词 | 对应文档 |
|---------|-----------|---------|
| 菜品收集 | 加、录入、添加、生成 | `docs/collect.md` |
| 日常管理 | 吃了、记录、删除 | `docs/manage.md` |
| 菜品推荐 | 推荐、随机、筛选 | `docs/recommend.md` |
| 可视化 | 打开、看看、网页 | `docs/visualize.md` |
```

---

## 能力范围

### 新增能力

1. **统一共享库**：消除代码重复，统一数据访问层
2. **可配置数据路径**：支持三级优先级（命令行 > config.json > 默认）
3. **模块化文档**：SKILL.md 轻量化，功能文档按需加载
4. **简化维护**：修改共享库只需改一处

### 修改能力

1. **脚本结构**：从"完全内联"改为"引用共享库"
2. **配置管理**：从"全局 ~/.what-to-eat/"改为"skill 本地 + 可配置"
3. **文档组织**：从"单一 SKILL.md"改为"主入口 + 子模块"

### 保持能力

1. **向后兼容**：CLI 命令不变（`collect.sh add` 等）
2. **独立运行**：每个 skill 可独立安装
3. **自包含性**：通过共享 lib/ 确保功能完整

---

## 影响范围

### 文件变更

**新增文件**：
```
scripts/lib/
├── data-accessor.js    # 统一数据访问层（新建）
├── dishes.js           # 从现有脚本提取（合并重复）
├── recommend.js        # 从 recommend.sh 提取
├── auto-generate.js    # 从 collect.sh 提取
└── seed.js             # 从现有脚本提取（合并重复）

docs/
├── collect.md          # 从现有 SKILL.md 拆分
├── manage.md           # 从现有 SKILL.md 拆分
├── recommend.md        # 从现有 SKILL.md 拆分
└── visualize.md        # 从现有 SKILL.md 拆分
```

**简化脚本**：
```
scripts/
├── collect.sh          # 从 659 行简化到 ~150 行
├── manage.sh           # 从 580 行简化到 ~120 行
├── recommend.sh        # 从 720 行简化到 ~200 行
├── visualize.sh        # 保持独立，引用共享库
└── lib/                # 新增共享库目录
```

**文档拆分**：
```
what-to-eat-skills/SKILL.md           # 从 1200+ 行拆分为 80 行主入口
what-to-eat-collect/SKILL.md          # 简化为指向 docs/collect.md
what-to-eat-manage/SKILL.md           # 简化为指向 docs/manage.md
what-to-eat-recommend/SKILL.md        # 简化为指向 docs/recommend.md
what-to-eat-visualize/SKILL.md        # 简化为指向 docs/visualize.md
```

### 代码行数变化

| 文件 | 整合前 | 整合后 | 减少 |
|------|--------|--------|------|
| collect.sh | 659 行 | ~150 行 | -509 行 |
| manage.sh | 580 行 | ~120 行 | -460 行 |
| recommend.sh | 720 行 | ~200 行 | -520 行 |
| visualize.sh | 450 行 | ~150 行 | -300 行 |
| **新增共享库** | 0 行 | ~650 行 | +650 行 |
| **净减少** | **2409 行** | **1270 行** | **-1139 行** |

### 数据兼容性

- ✅ **数据格式不变**：`dishes.json` 结构完全兼容
- ✅ **CLI 命令不变**：用户现有脚本继续工作
- ✅ **配置格式兼容**：新增 dataPath 字段，旧 config.json 仍可用

---

## 不包含的变更

1. **不重构数据格式**：保持现有 `dishes.json` 和 `pending.json` 结构
2. **不修改推荐算法**：仅重构代码结构，算法逻辑不变
3. **不改变 CLI 接口**：命令和参数完全兼容
4. **不拆分仓库**：仍保持单一仓库，5 个 skill 同库
