## 1. 数据模型清理

- [x] 1.1 修改 `dishes.js` 的 `saveDishes()`：移除读取 existing.pending 并保留的逻辑，直接写入 `{ dishes }`
- [x] 1.2 修改 `data-accessor.js` 的 `ensureInitialized()`：初始数据改为 `{ dishes: [] }`，移除 `pending: []`
- [x] 1.3 清理现有 `scripts/data/dishes.json`：移除 `"pending": []` 字段
- [x] 1.4 验证：执行 `bash what-to-eat-recommend/scripts/recommend.sh list` 确认菜品列表正常读取

## 2. server.js 新增 API 端点

- [x] 2.1 在 `server.js` 中加载 `dishes.js` 共享库（confirmPending、rejectPending）
- [x] 2.2 新增 POST `/api/confirm` 端点：解析 index 参数，调用 `confirmPending(index)`，返回 JSON 结果
- [x] 2.3 新增 POST `/api/reject` 端点：解析 index 参数，调用 `rejectPending(index)`，返回 JSON 结果
- [x] 2.4 处理错误情况：缺少 index 参数返回 400，index 超出范围返回 `{ ok: false, error }` 

## 3. web/index.html 补全功能

- [x] 3.1 新增搜索框：在正式菜品区域上方添加搜索输入框，支持按名称或食材实时过滤
- [x] 3.2 新增分类筛选下拉框：从 dishes 数据中动态提取分类列表，添加"全部分类"默认选项
- [x] 3.3 实现搜索+筛选组合过滤逻辑：同时满足搜索关键词和分类筛选的菜品才显示
- [x] 3.4 新增"距上次食用天数"显示：在卡片上计算并显示距今天数，未食用过显示"未食用过"
- [x] 3.5 在待确认菜品卡片上添加"确认"和"拒绝"按钮
- [x] 3.6 实现 confirm/reject 前端逻辑：发送 POST 请求到 API，成功后刷新数据，失败显示错误提示

## 4. 端到端验证

- [x] 4.1 启动可视化服务器，确认页面正常加载、搜索和筛选功能正常工作
- [x] 4.2 添加测试待确认菜品，在页面上确认/拒绝操作正常，数据实时刷新
- [x] 4.3 验证 `dishes.json` 清理后 collect/manage/recommend 脚本仍正常工作
