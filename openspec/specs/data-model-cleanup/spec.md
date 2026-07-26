# data-model-cleanup

## Purpose

此能力规范源自变更 fix-visualize-features-and-data，涵盖：dishes.json 不含 pending 字段。

## Requirements

### Requirement: dishes.json 不含 pending 字段

`dishes.json` MUST NOT 包含 `pending` 字段。正式菜品数据存储为 `{ dishes: [...] }` 格式。待确认菜品数据存储在独立的 `dishes-pending.json` 中，格式为 `{ pending: [...] }`。

#### Scenario: 新建数据文件不含 pending

- **WHEN** `DataAccessor.ensureInitialized()` 创建新的 `dishes.json`
- **THEN** 文件内容为 `{ "dishes": [] }`，不包含 `pending` 字段

#### Scenario: saveDishes 不写入 pending

- **WHEN** 调用 `saveDishes(dishes)` 保存正式菜品
- **THEN** 写入 `dishes.json` 的内容为 `{ "dishes": [...] }`，不包含 `pending` 字段，不读取或保留旧文件中的 pending

#### Scenario: 现有 dishes.json 清理 pending

- **WHEN** 执行数据清理后检查现有 `dishes.json`
- **THEN** 文件内容为 `{ "dishes": [...] }`，不包含 `pending` 字段

#### Scenario: getAllDishes 兼容无 pending 的文件

- **WHEN** `dishes.json` 格式为 `{ "dishes": [...] }`（无 pending 字段）
- **THEN** `getAllDishes()` 正常返回 dishes 数组，不报错
