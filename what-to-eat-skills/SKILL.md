---
name: what-to-eat-skills
description: 总控入口 - 处理所有菜品相关请求，自动识别意图并分发到对应子 skill。用户只需使用这一个 Skill 即可完成菜品收集、推荐、管理和可视化等所有操作。
version: "1.0.0"
---

# what-to-eat-skills

## 何时使用此 Skill

总控入口 - 处理所有菜品相关请求，自动识别意图并分发到对应子 skill。用户只需使用这一个 Skill 即可完成菜品收集、推荐、管理和可视化等所有操作。


## 执行流程

当用户提出请求后：

1. **解析用户输入**
   - 提取关键词
   - 判断意图类型

2. **分发到子模块**
   - 根据意图类型确定目标 Skill
   - 使用 `cd` 切换到对应 Skill 目录
   - 在 Skill 目录内执行相对路径脚本 `scripts/*.sh`

3. **处理返回结果**
   - 脚本执行完成后，返回结果给用户
   - 如果需要进一步操作，继续流转

4. **按需加载文档**（如需要详细操作步骤）
   - 读取 `docs/<意图>.md` 获取完整 CLI 命令和示例

## 1. 意图识别

分析用户输入，根据关键词和语义判断意图类型：

| 意图类型 | 触发关键词 | 分发目标 |
|---------|-----------|---------|
| **菜品收集** | 加、录入、添加、生成、创建、待确认、确认、拒绝 | `what-to-eat-collect` ([docs/collect.md](docs/collect.md)) |
| **菜品推荐** | 推荐、随机、筛选、吃什么、随便、来一个、统计 | `what-to-eat-recommend` ([docs/recommend.md](docs/recommend.md)) |
| **日常管理** | 吃了、记录、吃过、删除、去掉、移除 | `what-to-eat-manage` ([docs/manage.md](docs/manage.md)) |
| **可视化** | 打开、看看、网页、浏览器、可视化、展示、界面 | `what-to-eat-visualize` ([docs/visualize.md](docs/visualize.md)) |
| **模糊请求** | 今天、怎么办、今天吃、晚餐、午餐、早餐 | `what-to-eat-recommend` (默认推荐) |

## 2. 意图分发

根据识别结果，切换到对应 Skill 目录并执行相对路径脚本：

```powershell
# 菜品收集
PowerShell(cd what-to-eat-collect; bash scripts/collect.sh <子命令> [参数])

# 菜品推荐
PowerShell(cd what-to-eat-recommend; bash scripts/recommend.sh <子命令> [参数])

# 日常管理
PowerShell(cd what-to-eat-manage; bash scripts/manage.sh <子命令> [参数])

# 可视化
PowerShell(cd what-to-eat-visualize; bash scripts/visualize.sh [端口])
```

**注意**：
- 所有路径均相对于 `what-to-eat-skills/` 集合根目录
- 先 `cd` 到目标 Skill 目录，再使用相对路径 `scripts/*.sh` 执行脚本
- 不要使用 `Skill()` 工具调用子目录，它们不是独立的 Claude Code Skill

## 示例

### 示例 1：明确意图 - 推荐菜品
```
用户: "今天吃什么"
→ 意图: 模糊请求 → 菜品推荐
→ 执行: PowerShell(cd what-to-eat-recommend; bash scripts/recommend.sh recommend)
→ 返回: 轮换优先推荐结果
```

### 示例 2：明确意图 - 添加菜品
```
用户: "加个麻婆豆腐"
→ 意图: 菜品收集
→ 执行: PowerShell(cd what-to-eat-collect; bash scripts/collect.sh add "麻婆豆腐")
→ 返回: 添加成功确认
```

## 注意事项

- **使用相对路径**：在对应 Skill 目录内执行脚本，使用 `scripts/*.sh` 相对路径
- **先 cd 到 Skill 目录**：使用 `cd <skill-name>` 切换到目标 Skill
- **保持上下文**：如果用户连续多次输入，保持上下文连贯性
- **友好引导**：当意图不明确时，提供清晰的选择而不是让用户困惑
- **子目录不是 Skill**：what-to-eat-collect 等目录只是文档和脚本的组织方式
