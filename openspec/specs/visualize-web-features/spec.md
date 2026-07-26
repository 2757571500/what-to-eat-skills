# visualize-web-features

## Purpose

此能力规范源自变更 fix-visualize-features-and-data，涵盖：搜索功能、分类筛选、待确认菜品操作、距上次食用天数显示、确认和拒绝 API 端点。

## Requirements

### Requirement: 搜索功能

可视化页面 MUST 提供搜索框，支持按菜品名称或食材关键词实时过滤正式菜品列表。用户在搜索框输入文字时，菜品列表 MUST 实时更新，仅显示匹配的菜品。

#### Scenario: 按名称搜索

- **WHEN** 用户在搜索框输入"豆腐"
- **THEN** 菜品列表实时过滤，仅显示名称包含"豆腐"的菜品（如"麻婆豆腐"）

#### Scenario: 按食材搜索

- **WHEN** 用户在搜索框输入"鸡蛋"
- **THEN** 菜品列表实时过滤，仅显示食材列表包含"鸡蛋"的菜品（如"西红柿炒鸡蛋"）

#### Scenario: 清空搜索

- **WHEN** 用户清空搜索框
- **THEN** 菜品列表恢复显示所有正式菜品

### Requirement: 分类筛选

可视化页面 MUST 提供分类筛选控件，支持按菜品分类筛选正式菜品列表。筛选选项 MUST 包含当前数据中存在的所有分类。

#### Scenario: 按分类筛选

- **WHEN** 用户选择分类"川菜"
- **THEN** 菜品列表仅显示分类为"川菜"的菜品

#### Scenario: 清除筛选

- **WHEN** 用户选择"全部分类"选项
- **THEN** 菜品列表恢复显示所有正式菜品

#### Scenario: 搜索与筛选组合

- **WHEN** 用户在搜索框输入"豆腐"且选择分类"川菜"
- **THEN** 菜品列表显示同时满足名称包含"豆腐"且分类为"川菜"的菜品

### Requirement: 待确认菜品操作

可视化页面 MUST 在待确认菜品卡片上提供"确认"和"拒绝"按钮。点击确认按钮时，该菜品从待确认列表移入正式菜品库。点击拒绝按钮时，该菜品从待确认列表删除。操作完成后 MUST 刷新页面数据。

#### Scenario: 确认待确认菜品

- **WHEN** 用户点击待确认菜品卡片上的"确认"按钮
- **THEN** 前端发送 POST 请求到 `/api/confirm?index=N`，后端调用 `confirmPending(N)`，菜品移入正式库，页面刷新显示更新后的数据

#### Scenario: 拒绝待确认菜品

- **WHEN** 用户点击待确认菜品卡片上的"拒绝"按钮
- **THEN** 前端发送 POST 请求到 `/api/reject?index=N`，后端调用 `rejectPending(N)`，菜品从待确认列表删除，页面刷新显示更新后的数据

#### Scenario: 确认操作失败

- **WHEN** 用户点击确认按钮，但 index 超出范围
- **THEN** 后端返回 `{ ok: false, error: "..." }`，前端显示错误提示，不刷新数据

### Requirement: 距上次食用天数显示

可视化页面 MUST 在每道正式菜品卡片上显示"距上次食用天数"。若菜品从未被食用（`lastEaten` 为 null），MUST 显示"未食用过"。

#### Scenario: 已食用过的菜品

- **WHEN** 菜品的 `lastEaten` 为 "2026-07-25"，当前日期为 2026-07-26
- **THEN** 卡片显示"1 天前食用"

#### Scenario: 从未食用的菜品

- **WHEN** 菜品的 `lastEaten` 为 null
- **THEN** 卡片显示"未食用过"

### Requirement: 确认和拒绝 API 端点

`server.js` MUST 提供 POST `/api/confirm` 和 POST `/api/reject` 端点，接收 `index` 查询参数，调用共享库 `dishes.js` 的 `confirmPending()` 和 `rejectPending()` 函数，返回 JSON 格式的操作结果。

#### Scenario: 成功确认菜品

- **WHEN** 收到 POST `/api/confirm?index=0`，且待确认列表有至少 1 个菜品
- **THEN** 返回 `{ ok: true, dish: {...} }`，菜品已移入正式库

#### Scenario: 成功拒绝菜品

- **WHEN** 收到 POST `/api/reject?index=0`，且待确认列表有至少 1 个菜品
- **THEN** 返回 `{ ok: true, dish: {...} }`，菜品已从待确认列表删除

#### Scenario: 索引超出范围

- **WHEN** 收到 POST `/api/confirm?index=99`，但待确认列表只有 2 个菜品
- **THEN** 返回 `{ ok: false, error: "索引 99 超出范围..." }`，状态码 200

#### Scenario: 缺少 index 参数

- **WHEN** 收到 POST `/api/confirm`（无 index 参数）
- **THEN** 返回 `{ ok: false, error: "缺少 index 参数" }`，状态码 400
