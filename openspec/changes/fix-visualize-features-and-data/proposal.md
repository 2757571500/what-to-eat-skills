## Why

可视化页面 `web/index.html` 目前仅展示菜品数据，缺少 `docs/visualize.md` 文档中承诺的搜索、筛选、待确认操作功能。同时，数据存储存在冗余：`dishes.json` 中的 `pending` 字段永远为空（实际 pending 数据在 `dishes-pending.json` 中），`saveDishes()` 中保留 pending 的逻辑是无效代码。

## What Changes

### 问题 2：补全可视化页面功能

- 在 `web/index.html` 中新增搜索功能：按名称或食材关键词实时过滤
- 新增分类筛选：按分类（家常菜/川菜/凉菜/汤/主食/粤菜/甜品/其他）筛选
- 新增待确认菜品操作：在 Web 界面直接确认/拒绝待确认菜品
- 新增"距上次食用天数"显示

### 问题 3：清理冗余 pending 字段

- 从 `dishes.js` 的 `saveDishes()` 中移除"保留 pending"逻辑
- 从 `data-accessor.js` 的 `ensureInitialized()` 中移除初始 `pending: []` 字段
- 清理现有 `dishes.json` 中的 `pending: []` 字段
- `server.js` 的 `serveDataJson()` 已正确合并两个文件，无需修改

## Capabilities

### New Capabilities

- `visualize-web-features`: 可视化页面交互功能——搜索、筛选、待确认菜品操作、距上次食用天数显示
- `data-model-cleanup`: 数据模型清理——移除 `dishes.json` 中冗余的 `pending` 字段及相关逻辑

### Modified Capabilities

无。

## Impact

- **代码影响**：
  - `what-to-eat-visualize/scripts/web/index.html`（重写/扩展前端功能）
  - `what-to-eat-visualize/scripts/server.js`（新增 `/api/confirm` 和 `/api/reject` 接口）
  - `scripts/lib/dishes.js`（移除 saveDishes 中的 pending 保留逻辑）
  - `scripts/lib/data-accessor.js`（移除 ensureInitialized 中的 pending 字段）
  - `scripts/data/dishes.json`（清理冗余 pending 字段）
- **依赖变化**：无新依赖
- **用户影响**：可视化页面功能更完整；数据文件更简洁
- **向后兼容**：`getAllDishes()` 已支持 `{ dishes: [...] }` 和 `[...]` 两种格式，移除 pending 字段不影响读取
