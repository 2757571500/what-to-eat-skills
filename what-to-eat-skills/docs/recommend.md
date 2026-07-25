# 菜品推荐

## 推荐策略

系统提供 4 种推荐策略，可根据用户需求选择：

### 1. 轮换优先（默认）

**算法**: 优先推荐距离上次食用最久的菜品，从未吃过的最高优先

**CLI 命令**:
```bash
bash scripts/recommend.sh recommend --strategy rotation
```

### 2. 随机抽签

**算法**: 均匀随机选择一道菜品

**CLI 命令**:
```bash
bash scripts/recommend.sh recommend --strategy random
```

### 3. 条件筛选

**算法**: 按条件过滤菜品，再按轮换优先排序

**可筛选条件**:
- `--category`: 分类
- `--tag`: 标签
- `--ingredient`: 食材
- `--max-time`: 最大制作时间（分钟）
- `--difficulty`: 难度

**CLI 命令**:
```bash
bash scripts/recommend.sh recommend --strategy filter [--category 分类] [--tag 标签] [--max-time 分钟] [--difficulty 难度]
```

### 4. 加权推荐

**算法**: 综合考虑距上次食用天数、食用次数、口味偏好打分

**可调参数**:
- `--flavor`: 口味偏好（麻辣/酸甜/清淡/咸香等）

**CLI 命令**:
```bash
bash scripts/recommend.sh recommend --strategy weighted [--flavor 口味]
```

---

## 查看统计

**CLI 命令**:
```bash
bash scripts/recommend.sh stats
```

---

## 浏览菜品库

**CLI 命令**:
```bash
bash scripts/recommend.sh list [--sort rotation]
```

---

## 常见错误场景

1. **菜品库为空**: 提示用户先添加菜品
2. **筛选结果为空**: 提示用户放宽条件
3. **无效参数**: 提示正确的参数值

## 注意事项

- **默认策略是轮换优先**: 用户只说"推荐"或"吃什么"时，使用轮换优先
- **策略可叠加条件**: 可以在指定策略的同时附加筛选条件
- **推荐结果要友好**: 突出显示首推菜品，备选列表提供 2-5 个选项
