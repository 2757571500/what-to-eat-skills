---
name: modular-documentation
description: 模块化文档架构 - SKILL.md 轻量化（意图识别 + 分发），功能文档按需加载，降低启动开销
---

# 规格说明：模块化文档架构

## 背景

当前 `SKILL.md` 包含所有功能的详细文档（1200+ 行），导致：
- 启动时加载过大（影响 Claude Code 上下文窗口）
- 文档难以维护（所有内容在一个文件）
- 用户体验差（必须滚动查找所需信息）

## 目标

采用"主入口 + 按需加载子文档"架构：
1. **SKILL.md**：轻量入口（~80 行），仅负责意图识别和分发
2. **docs/*.md**：模块化功能文档（按需加载）
3. **降低启动开销**：仅加载必要文档

---

## Scenarios

### Scenario 1：SKILL.md 作为轻量入口

**Given** 用户提出菜品相关请求
**When** Claude Code 加载 `what-to-eat-skills/SKILL.md`
**Then** 应该：
- ✅ 快速识别意图类型（菜品收集/日常管理/菜品推荐/可视化）
- ✅ 根据意图读取对应子文档（`docs/<意图>.md`）
- ✅ 提供 CLI 命令和示例格式
- ✅ **不包含**详细的操作步骤和示例对话

**SKILL.md 结构**（~80 行）：
```markdown
---
name: what-to-eat-skills
description: 统一菜品管理入口 - 自动识别意图并分发到收集、管理、推荐、可视化等子模块
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

## 数据路径配置

### 优先级（高 → 低）
1. **命令行参数**：`--data-path /custom/path/dishes.json`
2. **config.json**：`what-to-eat-skills/config.json`
3. **默认路径**：`~/.what-to-eat/data/dishes.json`

## 执行步骤

1. **解析用户输入** → 提取关键词，匹配意图类型
2. **按需加载文档** → 读取 `docs/<意图>.md`
3. **执行对应命令** → 根据文档中的 CLI 命令执行操作
4. **格式化输出** → 按照文档中的示例格式回复用户
```

---

### Scenario 2：按需加载子文档

**Given** 用户说"加个麻婆豆腐"
**When** Claude Code 识别意图为"菜品收集"
**Then** 应该：
- ✅ 读取 `docs/collect.md`（而非 SKILL.md 的全部内容）
- ✅ 根据 collect.md 中的说明执行 `collect.sh add "麻婆豆腐"`
- ✅ 按照 collect.md 中的示例格式回复用户

**加载流程**：
```
用户: "加个麻婆豆腐"
  ↓
识别意图: "加" → 菜品收集
  ↓
读取文档: docs/collect.md (仅 ~300 行)
  ↓
执行命令: bash scripts/collect.sh add "麻婆豆腐"
  ↓
返回结果: "已添加「麻婆豆腐」到待确认列表"
```

---

### Scenario 3：子文档包含完整信息

**Given** Claude Code 读取 `docs/collect.md`
**When** 执行菜品收集操作
**Then** `docs/collect.md` 应该：
- ✅ 说明何时使用此 Skill（触发条件）
- ✅ 提供所有 CLI 命令及其参数说明
- ✅ 包含完整的执行步骤
- ✅ 提供示例对话（用户输入 → 执行命令 → 回复格式）
- ✅ 列出常见错误场景和解决方案

**docs/collect.md 结构**：
```markdown
# 菜品收集模块

## 何时使用此 Skill

当用户意图属于"菜品收集"时...

## 1. 手动录入菜品

**用户意图**: 用户想添加一道新菜品

**CLI 命令**:
```bash
bash scripts/collect.sh add <菜名> [--category 分类] [--tags 标签]
```

**执行步骤**:
1. 解析用户输入，提取菜品名称
2. 识别可选参数
3. 执行 CLI 命令
4. 告知用户结果

**示例对话**:
```
用户: "加个麻婆豆腐"
→ 执行: bash scripts/collect.sh add "麻婆豆腐"
→ 回复: "已添加「麻婆豆腐」到待确认列表"
```

（继续 2-6 节...）
```

---

### Scenario 4：子 Skill 的 SKILL.md 指向模块化文档

**Given** Claude Code 加载 `what-to-eat-collect/SKILL.md`
**When** 识别到这是子 skill
**Then** 应该：
- ✅ 读取 `what-to-eat-collect/SKILL.md`（轻量入口）
- ✅ 按说明读取 `../docs/collect.md`（主 skill 中的文档）
- ✅ 执行对应脚本

**what-to-eat-collect/SKILL.md 内容**：
```markdown
---
name: what-to-eat-collect
description: 菜品收集能力 - 支持手动录入菜品、查看待确认列表、确认/拒绝菜品
---

# what-to-eat-collect

## 文档位置

本 Skill 的详细文档位于主 skill：
- **主入口**：`../SKILL.md`（意图识别）
- **功能文档**：`../docs/collect.md`（完整操作指南）

## 快速开始

请先阅读 `../SKILL.md` 了解整体架构，然后根据意图读取对应的功能文档。
```

---

### Scenario 5：文档一致性保证

**Given** `docs/collect.md` 更新（如添加新参数）
**When** 用户执行命令
**Then** 应该：
- ✅ 文档与实际脚本行为一致
- ✅ Claude Code 按照最新文档执行
- ✅ 避免"文档过时"问题

**验证机制**：
```bash
# 文档中提到 --new-param 参数
# 但 collect.sh 不支持此参数
# → Claude Code 应该：验证参数存在性后再建议用户使用
```

---

### Scenario 6：文档模块化降低启动开销

**Given** Claude Code 启动并加载 Skill
**When** 用户提出菜品相关请求
**Then** 应该：
- ✅ 仅加载 `SKILL.md`（~80 行）
- ✅ 识别意图后加载对应子文档（~300 行）
- ✅ **不加载**其他子文档（collect.md/manage.md/recommend.md/visualize.md）

**对比**：
```
整合前（单一 SKILL.md）：
  启动加载: 1200 行

整合后（模块化文档）：
  启动加载: 80 行（减少 93%）
  按需加载: +300 行（执行具体命令时）
```

---

### Scenario 7：跨 Skill 文档引用

**Given** `what-to-eat-manage/SKILL.md` 需要引用 collect 文档
**When** 管理 Skill 执行某个操作
**Then** 应该：
- ✅ 使用相对路径引用：`../docs/collect.md`
- ✅ Claude Code 能够正确找到并读取

**路径示例**：
```
what-to-eat-manage/SKILL.md
  → ../docs/collect.md
  → what-to-eat-skills/docs/collect.md ✓

what-to-eat-skills/SKILL.md
  → docs/collect.md
  → what-to-eat-skills/docs/collect.md ✓
```

---

### Scenario 8：文档版本与代码版本同步

**Given** `scripts/collect.sh` 更新（如添加新命令）
**When** 更新文档
**Then** 应该：
- ✅ 同步更新 `docs/collect.md`
- ✅ 在 PR 描述中注明文档更新
- ✅ CI 检查文档中提到的命令是否真实存在

**CI 检查脚本示例**：
```bash
#!/bin/bash
# scripts/check-docs.sh

# 从 docs/collect.md 提取所有 CLI 命令
grep -o '`bash scripts/collect.sh [^`]*`' docs/collect.md | \
  sed 's/`bash scripts\/collect.sh //' | sed 's/`//'

# 验证 collect.sh 支持这些命令
for cmd in $(提取的命令); do
  if ! bash scripts/collect.sh --help 2>&1 | grep -q "$cmd"; then
    echo "❌ 文档中提到命令 '$cmd'，但 collect.sh 不支持"
    exit 1
  fi
done
```

---

## 非功能性需求

### 性能

- **SKILL.md 加载时间**：< 50ms（80 行）
- **子文档加载时间**：< 100ms（~300 行）
- **总加载时间**：< 150ms（启动 + 按需加载）

### 可维护性

- **文档更新成本**：每次代码更新必须同步更新对应文档
- **文档结构一致性**：所有子文档使用相同的章节结构
- **链接有效性**：相对路径引用必须正确

### 用户体验

- **意图识别准确率**：> 95%（基于关键词匹配）
- **文档可读性**：清晰的标题、示例、错误场景
- **学习成本**：新用户 5 分钟内了解如何使用

---

## 边界情况

### 边界 1：意图模糊

**Given** 用户输入"今天吃什么"
**When** Claude Code 识别意图
**Then** 应该：
- ✅ 检测到模糊意图（"今天" + "吃什么"）
- ✅ 匹配到"菜品推荐"（默认推荐策略）
- ✅ 读取 `docs/recommend.md`

---

### 边界 2：文档文件缺失

**Given** `docs/collect.md` 被误删
**When** 用户请求"加个菜"
**Then** 应该：
- ✅ 检测到文档不存在
- ✅ 输出明确错误：`❌ 功能文档不存在：docs/collect.md`
- ✅ 提示：`请检查文档完整性或重新克隆仓库`

---

### 边界 3：多意图混合

**Given** 用户说"加个菜，然后推荐一个"
**When** Claude Code 识别意图
**Then** 应该：
- ✅ 识别为两个意图（"加个菜" → collect，"推荐一个" → recommend）
- ✅ 先执行 collect（添加菜品）
- ✅ 再执行 recommend（推荐菜品）
- ✅ 分别加载 `docs/collect.md` 和 `docs/recommend.md`

---

### 边界 4：文档格式错误

**Given** `docs/collect.md` 格式损坏（如 Markdown 语法错误）
**When** Claude Code 读取文档
**Then** 应该：
- ✅ 尝试继续解析（不因格式错误崩溃）
- ✅ 提取可用的信息（CLI 命令、示例等）
- ✅ 如果无法解析，输出警告并尝试 fallback

---

## 文档结构标准

### 统一的章节结构

每个子文档（`docs/*.md`）必须包含以下章节：

```markdown
# <功能名称>

## 何时使用此 Skill

（触发条件、关键词）

## 1. <功能点 1>

**用户意图**: （描述用户意图）

**CLI 命令**:
```bash
bash scripts/<命令>.sh <参数>
```

**执行步骤**:
1. （步骤 1）
2. （步骤 2）
...

**示例对话**:
```
用户: "示例输入"
→ 执行: bash scripts/xxx.sh ...
→ 回复: "示例输出"
```

（继续 2-N 节...）

## 常见错误场景

1. **错误场景 1**
   ```
   错误命令
   → 错误输出
   ```

## 注意事项

- （注意事项 1）
- （注意事项 2）
```

---

## 测试用例

### 测试 1：意图识别准确率

```bash
# 测试用例：用户输入 → 预期意图

"加个麻婆豆腐"         → 菜品收集 ✓
"我吃了红烧肉"         → 日常管理 ✓
"今天吃什么"           → 菜品推荐 ✓
"打开看看"             → 可视化 ✓
"推荐个川菜"           → 菜品推荐 ✓
"删除番茄炒鸡蛋"       → 日常管理 ✓
```

---

### 测试 2：文档加载顺序

```bash
# 1. 用户启动
用户: "今天吃什么"
→ Claude Code 加载: SKILL.md (80 行)
→ Claude Code 识别意图: 菜品推荐
→ Claude Code 加载: docs/recommend.md (300 行)
→ 执行: bash scripts/recommend.sh recommend

# 2. 验证未加载其他文档
→ docs/collect.md ✗ 未加载
→ docs/manage.md  ✗ 未加载
→ docs/visualize.md ✗ 未加载
```

---

### 测试 3：跨 Skill 文档引用

```bash
# what-to-eat-manage/SKILL.md 引用 collect 文档
cat what-to-eat-manage/SKILL.md
# → 包含: "请先阅读 ../docs/collect.md"

# 验证路径解析
ls what-to-eat-skills/docs/collect.md
# → ✓ 存在
```

---

## 监控与调试

### 文档加载日志

```bash
# 启用文档加载日志
DEBUG=docs bash scripts/recommend.sh recommend

# 输出示例
[debug] 加载主入口: SKILL.md
[debug] 识别意图: 菜品推荐
[debug] 加载子文档: docs/recommend.md
[debug] 文档大小: 8.2 KB (300 行)
```

### 文档大小监控

```bash
# 检查文档大小
wc -l what-to-eat-skills/SKILL.md      # → 80 行 ✓
wc -l what-to-eat-skills/docs/*.md      # → 各 250-350 行 ✓
```
