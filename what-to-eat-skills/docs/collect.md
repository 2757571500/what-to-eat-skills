# 菜品收集

## 前提条件

本文档假设你当前位于 **what-to-eat-skills** Skill 集合的根目录。

```bash
# 进入 Skill 集合根目录
cd what-to-eat-skills
```

**标准目录结构**：
```
what-to-eat-skills/                  ← 当前工作目录
├── SKILL.md                         ← 总控入口
├── docs/                            ← 本文档
├── scripts/                         ← 共享库
├── what-to-eat-collect/             ← 目标 Skill
│   └── scripts/
│       └── collect.sh              ← 目标脚本
├── what-to-eat-manage/
├── what-to-eat-recommend/
└── what-to-eat-visualize/
```

所有命令均使用相对于 `what-to-eat-skills/` 目录的路径。

---

## 1. 手动录入菜品

**CLI 命令**:
```bash
bash what-to-eat-collect/scripts/collect.sh add <菜名> [--category 分类] [--tags 标签1,标签2] [--ingredients 食材1,食材2] [--prepTime 分钟] [--difficulty 难度]
```

**参数说明**:

| 参数 | 说明 | 示例 |
|------|------|------|
| `--category` | 分类（家常菜/川菜/凉菜/汤/主食/粤菜/甜品/其他） | `--category 川菜` |
| `--tags` | 标签，逗号分隔 | `--tags 麻辣,下饭菜` |
| `--ingredients` | 主要食材，逗号分隔 | `--ingredients 豆腐,肉末` |
| `--prepTime` | 制作时间（分钟） | `--prepTime 15` |
| `--difficulty` | 难度（简单/中等/困难） | `--difficulty 简单` |

**示例对话**:

```
用户: "加个麻婆豆腐"
→ 执行: bash what-to-eat-collect/scripts/collect.sh add "麻婆豆腐"
→ 回复: "已添加「麻婆豆腐」到待确认列表"

用户: "加个番茄炒鸡蛋，分类是家常菜，15分钟，简单"
→ 执行: bash what-to-eat-collect/scripts/collect.sh add "番茄炒鸡蛋" --category 家常菜 --prepTime 15 --difficulty 简单
→ 回复: "已添加「番茄炒鸡蛋」到待确认列表"
```

---

## 2. 查看待确认列表

**CLI 命令**:
```bash
bash what-to-eat-collect/scripts/collect.sh list-pending
```

**示例对话**:

```
用户: "看看有哪些待确认的"
→ 执行: bash what-to-eat-collect/scripts/collect.sh list-pending
→ 回复:
  📋 待确认菜品 (2 道):

    0. 水煮鱼 | 川菜 | 25分钟 | 中等
      标签: 麻辣,下饭菜
      食材: 鱼肉,豆芽

    1. 糖醋排骨 | 家常菜 | 30分钟 | 中等
      标签: 酸甜,下饭菜
      食材: 排骨
```

---

## 3. 确认菜品

**CLI 命令**:
```bash
bash what-to-eat-collect/scripts/collect.sh confirm <名称|索引>
```

**示例对话**:

```
用户: "确认第 2 个"
→ 解析索引: 1 (0-based)
→ 执行: bash what-to-eat-collect/scripts/collect.sh confirm 1
→ 回复: "已确认「糖醋排骨」→ 加入菜品库"

用户: "确认水煮鱼"
→ 执行: bash what-to-eat-collect/scripts/collect.sh confirm "水煮鱼"
→ 回复: "已确认「水煮鱼」→ 加入菜品库"
```

**注意事项**:
- 索引从 0 开始（与 list-pending 显示一致）

---

## 4. 拒绝菜品

**CLI 命令**:
```bash
bash what-to-eat-collect/scripts/collect.sh reject <名称|索引>
```

**示例对话**:

```
用户: "拒绝第 1 个"
→ 执行: bash what-to-eat-collect/scripts/collect.sh reject 0
→ 回复: "已拒绝「水煮鱼」"

用户: "不要番茄炒鸡蛋了"
→ 执行: bash what-to-eat-collect/scripts/collect.sh reject "番茄炒鸡蛋"
→ 回复: "已拒绝「番茄炒鸡蛋」"
```

---

## 5. 确认全部/拒绝全部

**确认全部**:
```bash
bash what-to-eat-collect/scripts/collect.sh confirm-all
```

**拒绝全部**:
```bash
bash what-to-eat-collect/scripts/collect.sh reject-all
```

---

## 6. AI 自动生成菜品

**CLI 命令**:
```bash
bash what-to-eat-collect/scripts/collect.sh auto-generate [--count N]
```

**参数**:
- `--count N`: 生成数量，默认 3 道

**示例对话**:

```
用户: "生成 3 道新菜"
→ 执行: bash what-to-eat-collect/scripts/collect.sh auto-generate --count 3
→ 回复: "🤖 AI 生成策略: 种子库采样 + 变体组合\n  1. 鱼香肉丝 | 川菜 | 20分钟 | 中等\n  2. ...\n  3. ..."
```

---

## 7. 配置管理

### 修改数据路径

```bash
bash what-to-eat-collect/scripts/collect.sh config-set dataPath <路径>
```

**Windows 路径注意事项**：

Windows 用户在使用 `config-set` 设置 `dataPath` 时，**必须使用正斜杠 `/`** 或用单引号包裹路径，避免反斜杠被 shell 剥离：

```bash
# ✅ 推荐：使用正斜杠
bash what-to-eat-collect/scripts/collect.sh config-set dataPath "D:/eat/dishes.json"

# ✅ 推荐：单引号包裹（保留反斜杠，会被自动归一化为正斜杠）
bash what-to-eat-collect/scripts/collect.sh config-set dataPath 'D:\eat\dishes.json'

# ❌ 避免：双引号 + 反斜杠（bash/PowerShell 会剥离反斜杠，导致路径损坏）
bash what-to-eat-collect/scripts/collect.sh config-set dataPath "D:\eat\dishes.json"

# ✅ 目录路径会自动补全 dishes.json
bash what-to-eat-collect/scripts/collect.sh config-set dataPath "D:/eat"
# 实际数据路径解析为 D:/eat/dishes.json
```

若检测到路径疑似缺失分隔符（盘符后直接跟字母），系统会输出警告但仍写入配置。

### 迁移数据文件

切换 `dataPath` 时，可使用 `config-migrate` 命令将旧路径的数据文件复制到新路径，避免数据"丢失"：

```bash
bash what-to-eat-collect/scripts/collect.sh config-migrate <新路径> [--force]
```

**示例**：

```bash
# 将当前数据迁移到新路径
bash what-to-eat-collect/scripts/collect.sh config-migrate "D:/eat/dishes.json"
# 输出: ✅ 已迁移数据到 D:/eat/dishes.json，请执行 config-set dataPath "D:/eat/dishes.json" 完成切换

# 目标路径已有数据文件时，使用 --force 覆盖
bash what-to-eat-collect/scripts/collect.sh config-migrate "D:/eat/dishes.json" --force
```

迁移会复制 `dishes.json` 和 `dishes-pending.json` 两个文件。迁移完成后需手动执行 `config-set dataPath <新路径>` 完成切换。

---

## 常见错误场景

1. **菜品已存在**: 添加已存在的菜品会返回错误
2. **索引越界**: 确认/拒绝时索引超出范围
3. **参数格式错误**: 分类、难度等参数不符合预设值

## 注意事项

- **所有菜品先入库，后确认**: 这是系统的核心工作流
- **索引从 0 开始**: 与 list-pending 显示一致
- **确认后不可撤回**: 菜品一旦确认到正式库，需通过 delete 命令删除
- **参数可选**: 手动录入时，用户只需提供菜品名称
