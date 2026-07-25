# 日常管理

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
├── what-to-eat-collect/
├── what-to-eat-manage/              ← 目标 Skill
│   └── scripts/
│       └── manage.sh               ← 目标脚本
├── what-to-eat-recommend/
└── what-to-eat-visualize/
```

所有命令均使用相对于 `what-to-eat-skills/` 目录的路径。

---

## 1. 记录食用菜品

**CLI 命令**:
```bash
bash what-to-eat-manage/scripts/manage.sh eat <菜名>
```

**示例对话**:

```
用户: "我吃了红烧肉"
→ 解析: 菜名="红烧肉"
→ 执行: bash what-to-eat-manage/scripts/manage.sh eat "红烧肉"
→ 回复: "✅ 已记录「红烧肉」，今天第 3 次食用"

用户: "记录吃了麻婆豆腐"
→ 执行: bash what-to-eat-manage/scripts/manage.sh eat "麻婆豆腐"
→ 回复: "✅ 已记录「麻婆豆腐」，今天第 1 次食用"
```

**功能说明**:
- 更新 `lastEaten` 为今天的日期
- 增加 `eatCount` 计数
- 影响推荐算法的轮换优先级（优先推荐未吃或很久没吃的菜）

---

## 2. 删除菜品

**CLI 命令**:
```bash
bash what-to-eat-manage/scripts/manage.sh delete <菜名>
```

**示例对话**:

```
用户: "删除番茄炒鸡蛋"
→ 执行: bash what-to-eat-manage/scripts/manage.sh delete "番茄炒鸡蛋"
→ 回复: "✅ 已删除「番茄炒鸡蛋」"

用户: "去掉宫保鸡丁"
→ 执行: bash what-to-eat-manage/scripts/manage.sh delete "宫保鸡丁"
→ 回复: "✅ 已删除「宫保鸡丁」"
```

**注意事项**:
- 删除操作不可恢复
- 删除后不会出现在推荐结果中

---

## 常见错误场景

1. **菜品不存在**: 记录/删除不存在的菜品会返回错误
2. **菜品名不匹配**: 需要提供准确的菜品名称

## 注意事项

- **记录食用不影响推荐结果**: 只是更新 `lastEaten` 和 `eatCount`
- **删除操作需谨慎**: 删除后无法恢复，需手动重新添加
- **名称精确匹配**: 需要用户提供准确的菜品名称
