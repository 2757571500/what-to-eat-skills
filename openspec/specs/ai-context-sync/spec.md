# ai-context-sync

## Purpose

AI 上下文同步能力——约束 AI agent 在回答"当前状态"类问题时必须重新执行查询命令获取最新数据，不依赖对话上下文中缓存的查询结果，避免因 Web 界面或 CLI 外部操作导致数据过期而给出错误回答。

## Requirements

### Requirement: 状态查询前重新执行命令

AI agent 在回答关于"当前状态"类问题（如"有多少待确认菜品"、"正式库有哪些菜"、"推荐一道菜"等）时，MUST 重新执行对应的查询命令获取最新数据，不得依赖对话上下文中之前缓存的查询结果。此规范 MUST 写入根 SKILL.md 和各子 SKILL.md 的行为规范段落中。

#### Scenario: 用户询问待确认列表时重新查询

- **WHEN** 用户在对话中问"待确认还有几道"，而此前已有过 list-pending 的查询结果（可能因 Web 界面操作而过期）
- **THEN** AI 重新执行 `bash what-to-eat-collect/scripts/collect.sh list-pending` 获取最新数据，基于最新结果回答

#### Scenario: 用户询问正式库时重新查询

- **WHEN** 用户问"现在正式库有多少道菜"，而此前对话中已有过菜品列表信息
- **THEN** AI 重新执行查询命令获取最新菜品数据，不使用对话上下文中的缓存信息

#### Scenario: 推荐前重新查询

- **WHEN** 用户请求"推荐一道菜"
- **THEN** AI 在执行推荐命令前，不假设菜品库内容，直接执行推荐脚本获取基于最新数据的推荐结果

### Requirement: 不依赖对话上下文缓存

AI agent MUST 明确区分"会话上下文"和"实时数据状态"。对话上下文用于理解用户意图和对话历史，但任何涉及数据当前状态的回答 MUST 基于实时查询结果。此原则 MUST 在 SKILL.md 中以明确的指令语句表述，而非隐含期望。

#### Scenario: Web 界面操作后 AI 重新查询

- **WHEN** 用户在可视化 Web 界面确认/拒绝了菜品，随后在对话中询问菜品状态
- **THEN** AI 重新执行查询命令获取最新数据，不会回答过期的缓存信息（如不会说"待确认列表有 3 道"而实际已被 Web 界面确认为 0 道）

#### Scenario: CLI 操作后 AI 基于最新数据回答

- **WHEN** 用户通过 CLI 执行了 add/confirm/reject 操作，随后在同一对话中询问状态
- **THEN** AI 基于刚执行的 CLI 操作结果回答，若不确定则重新查询

### Requirement: SKILL.md 中写入数据新鲜度规范

根 SKILL.md 和 what-to-eat-collect/SKILL.md、what-to-eat-recommend/SKILL.md MUST 包含"数据新鲜度"行为规范段落，明确要求 AI agent 在回答状态类问题前重新执行查询命令。规范内容 MUST 使用祈使句（如"必须"、"不得"）而非建议性语言。

#### Scenario: 根 SKILL.md 包含数据新鲜度规范

- **WHEN** 检查根 SKILL.md 文件内容
- **THEN** 文件中包含"数据新鲜度"或等效标题的段落，内容明确要求 AI 在回答当前状态前重新执行查询命令

#### Scenario: 子 SKILL.md 包含数据新鲜度规范

- **WHEN** 检查 what-to-eat-collect/SKILL.md 和 what-to-eat-recommend/SKILL.md
- **THEN** 两个文件均包含数据新鲜度相关的行为规范，提醒 AI 不要依赖对话上下文中的缓存数据
