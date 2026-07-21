---
name: what-to-eat-recommend
description: 菜品推荐能力 - 支持轮换优先、随机抽签、条件筛选、加权推荐、统计概览等多种推荐方式。帮助用户快速决定今天吃什么。
version: "1.0.0"
---

# what-to-eat-recommend

## 何时使用此 Skill

菜品推荐能力 - 支持轮换优先、随机抽签、条件筛选、加权推荐、统计概览等多种推荐方式。帮助用户快速决定今天吃什么。


## 何时使用此 Skill

当用户意图属于"菜品推荐"时，调用此 Skill。

**触发条件**:
- 用户请求推荐菜品（"今天吃什么"、"推荐个菜"）
- 用户要求随机推荐（"随便来个"、"随机抽一个"）
- 用户需要条件筛选（"推荐个川菜"、"15分钟能做完的"）
- 用户查询统计信息（"多少道菜"、"菜品库"）
- 用户浏览全部菜品


## 推荐策略

系统提供 4 种推荐策略，可根据用户需求选择：


## 1. 轮换优先（默认）

**算法**: 优先推荐距离上次食用最久的菜品，从未吃过的最高优先

**适用场景**:
- 日常推荐，确保菜品库均衡消耗
- 优先尝试新菜，避免遗忘

**CLI 命令**:
```bash
bash ../../scripts/recommend.sh recommend --strategy rotation
```

**示例对话**:
```
用户: "今天吃什么"
→ 执行: bash ../../scripts/recommend.sh recommend --strategy rotation
→ 回复:
  🍽️  推荐结果（轮换优先）

  🏆 首推：麻婆豆腐 | 川菜 | 20分钟 | 中等
     还没吃过，优先推荐！

  📋 备选：
     1. 番茄炒鸡蛋 | 家常菜 | 15分钟 | 简单
        距上次 7 天
     2. 糖醋排骨 | 家常菜 | 30分钟 | 中等
        距上次 3 天
```

---


## 2. 随机抽签

**算法**: 均匀随机选择一道菜品

**适用场景**:
- 完全随机的选择
- 不想考虑任何条件，纯随机

**CLI 命令**:
```bash
bash ../../scripts/recommend.sh recommend --strategy random
```

**示例对话**:
```
用户: "随机来个菜"
→ 执行: bash ../../scripts/recommend.sh recommend --strategy random
→ 回复:
  🎲 随机推荐

  🍽️  宫保鸡丁 | 川菜 | 25分钟 | 中等
```

---


## 3. 条件筛选

**算法**: 按条件过滤菜品，再按轮换优先排序

**可筛选条件**:
- `--category`: 分类
- `--tag`: 标签
- `--ingredient`: 食材
- `--max-time`: 最大制作时间（分钟）
- `--difficulty`: 难度

**CLI 命令**:
```bash
bash ../../scripts/recommend.sh recommend --strategy filter [--category 分类] [--tag 标签] [--ingredient 食材] [--max-time 分钟] [--difficulty 难度]
```

**示例对话**:

```
用户: "推荐个川菜"
→ 解析: category=川菜
→ 执行: bash ../../scripts/recommend.sh recommend --strategy filter --category 川菜
→ 回复:
  🔍 筛选推荐（川菜）

  🏆 首推：水煮鱼 | 川菜 | 25分钟 | 中等
     还没吃过，优先推荐！

  📋 备选：
     1. 麻婆豆腐 | 川菜 | 20分钟 | 中等
       距上次 5 天
     2. 宫保鸡丁 | 川菜 | 25分钟 | 中等
       距上次 10 天

用户: "15分钟能做完的菜"
→ 解析: max-time=15
→ 执行: bash ../../scripts/recommend.sh recommend --strategy filter --max-time 15
→ 回复:
  🔍 筛选推荐（≤15分钟）

  🏆 首推：蒜蓉西兰花 | 家常菜 | 10分钟 | 简单
     还没吃过！

  📋 备选：
     1. 番茄炒鸡蛋 | 家常菜 | 15分钟 | 简单
       距上次 3 天

用户: "推荐个简单的中式菜"
→ 解析: difficulty=简单, tag=中式
→ 执行: bash ../../scripts/recommend.sh recommend --strategy filter --difficulty 简单 --tag 中式
→ 回复: ...
```

---


## 4. 加权推荐

**算法**: 综合考虑距上次食用天数、食用次数、口味偏好打分

**可调参数**:
- `--flavor`: 口味偏好（麻辣/酸甜/清淡/咸香等）

**CLI 命令**:
```bash
bash ../../scripts/recommend.sh recommend --strategy weighted [--flavor 口味]
```

**示例对话**:
```
用户: "加权推荐，口味麻辣"
→ 执行: bash ../../scripts/recommend.sh recommend --strategy weighted --flavor 麻辣
→ 回复:
  ⚖️  加权推荐（口味：麻辣）

  🏆 首推：水煮鱼 | 川菜 | 25分钟 | 中等
     评分：9.2/10（麻辣度 9/10）

  📋 备选：
     1. 麻婆豆腐 | 川菜 | 20分钟 | 中等
       评分：8.5/10
     2. 辣子鸡 | 川菜 | 30分钟 | 中等
       评分：8.0/10
```

---


## 推荐菜品

1. **识别推荐策略**
   - 轮换优先（默认）
   - 随机抽签
   - 条件筛选
   - 加权推荐

2. **提取筛选条件**
   - 分类、标签、食材、用时、难度、口味等

3. **执行推荐命令**
   - 根据策略和条件组装 CLI 命令

4. **格式化输出**
   - 首推菜品突出显示
   - 备选列表提供 2-5 个选项
   - 标注距上次食用天数或推荐理由

5. **交互式引导**
   - 询问用户是否满意推荐
   - 提供调整选项（换策略、加条件）


## 查看统计

**CLI 命令**:
```bash
bash ../../scripts/recommend.sh stats
```

**示例对话**:
```
用户: "库里有多少菜"
→ 执行: bash ../../scripts/recommend.sh stats
→ 回复:
  📊 菜品统计
  ━━━━━━━━━━━━━━━━━
  菜品库: 26 道
  待确认: 3 道
  累计食用: 45 次
  还没吃过: 12 道
  平均用时: 28 分钟
  ━━━━━━━━━━━━━━━━━
```


## 浏览菜品库

**CLI 命令**:
```bash
bash ../../scripts/recommend.sh list [--sort rotation]
```

**示例对话**:
```
用户: "看看全部菜品"
→ 执行: bash ../../scripts/recommend.sh list
→ 回复:
  🗂️  菜品库 (26 道):

    1. 麻婆豆腐
       川菜 | 20分钟 | 中等 | 距上次 5 天 | 已吃 3 次

    2. 番茄炒鸡蛋
       家常菜 | 15分钟 | 简单 | 距上次 3 天 | 已吃 5 次

    ...
```


## 示例 1：日常推荐流程

```
用户: "今天吃什么"
→ 执行: bash ../../scripts/recommend.sh recommend --strategy rotation
→ 回复: （轮换优先推荐结果）
→ 询问: "这个推荐满意吗？还是想换个策略？"

用户: "太麻烦了，随机来个"
→ 执行: bash ../../scripts/recommend.sh recommend --strategy random
→ 回复: （随机推荐结果）

用户: "好，就这个了"
→ 建议: "要不要记录一下你决定吃什么？"
```


## 示例 2：条件筛选流程

```
用户: "推荐个川菜，不要太辣"
→ 解析: category=川菜, tag=不辣/微辣
→ 执行: bash ../../scripts/recommend.sh recommend --strategy filter --category 川菜 --tag 不辣
→ 回复: （筛选结果）

用户: "15 分钟能做完的"
→ 解析: max-time=15
→ 执行: bash ../../scripts/recommend.sh recommend --strategy filter --category 川菜 --tag 不辣 --max-time 15
→ 回复: （更新筛选条件后的结果）
```


## 示例 3：统计查询流程

```
用户: "库里有多少菜"
→ 执行: bash ../../scripts/recommend.sh stats
→ 回复: （统计信息）

用户: "哪些还没吃过"
→ 执行: bash ../../scripts/recommend.sh list --sort rotation
→ 回复: （列出所有菜品，标注"还没吃过"的优先显示）

用户: "推荐个没吃过的"
→ 执行: bash ../../scripts/recommend.sh recommend --strategy rotation
→ 回复: （自动推荐未吃过的菜品）
```


## 常见错误场景

1. **菜品库为空**
   ```
   用户: "今天吃什么"
   → 执行: bash ../../scripts/recommend.sh recommend
   → 回复: "😅 菜品库为空，先用 `bash ../../scripts/recommend.sh add <菜名>` 添加一些吧"
   ```

2. **筛选结果为空**
   ```
   用户: "推荐个 5 分钟能做完的川菜"
   → 执行: bash ../../scripts/recommend.sh recommend --strategy filter --category 川菜 --max-time 5
   → 回复: "😅 没有符合条件的菜品（分类：川菜，≤5分钟）\n   要不要放宽条件？"
   ```

3. **无效参数**
   ```
   用户: "推荐个 abc 菜系"
   → 执行: bash ../../scripts/recommend.sh recommend --strategy filter --category abc
   → 回复: "❌ 无效的分类：abc\n   支持的分类：家常菜/川菜/凉菜/汤/主食/粤菜/甜品/其他"
   ```


## 注意事项

- **默认策略是轮换优先**：用户只说"推荐"或"吃什么"时，使用轮换优先
- **策略可叠加条件**：可以在指定策略的同时附加筛选条件
- **推荐结果要友好**：突出显示首推菜品，备选列表提供 2-5 个选项
- **引导用户决策**：推荐后询问是否满意，提供换策略/调整条件的选项


## 注意事项

- **自包含部署包**：本 Skill 已包含完整的运行时脚本
- **路径引用**：使用相对路径引用脚本（`../../scripts/`）
- **数据文件**：首次使用需要复制 `data/example.json` 到 `data/dishes.json`