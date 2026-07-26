## Context

当前 `web/index.html` 是一个只读卡片展示页面（227 行），通过 `/data/` 接口获取 `{ dishes, pending }` JSON 数据。`docs/visualize.md` 文档承诺了搜索、筛选、待确认操作等功能，但均未实现。

数据存储方面，`dishes.json` 格式为 `{ dishes: [...], pending: [] }`，其中 `pending` 字段永远为空。实际 pending 数据存储在 `dishes-pending.json` 中。`dishes.js` 的 `saveDishes()` 有一段保留 pending 的逻辑，但由于 pending 操作从不写入 `dishes.json`，这段逻辑是无效代码。

### 当前 server.js API 端点

```
GET /              → web/index.html（静态文件）
GET /data/         → { dishes, pending }（合并两个 JSON 文件）
GET /<其他文件>     → web/ 目录下的静态文件
```

### 需要新增的 API 端点

待确认菜品操作需要后端 API 支持：

```
POST /api/confirm?index=0   → 确认第 N 个待确认菜品（移入正式库）
POST /api/reject?index=0    → 拒绝第 N 个待确认菜品（删除）
```

## Goals / Non-Goals

**Goals:**

1. `web/index.html` 实现搜索、分类筛选、待确认操作功能
2. `server.js` 新增 confirm/reject API 端点
3. 清理 `dishes.json`、`dishes.js`、`data-accessor.js` 中的冗余 pending 逻辑

**Non-Goals:**

1. 不修改 collect/manage/recommend 脚本
2. 不修改 `dishes-pending.json` 的存储格式
3. 不添加用户认证/权限
4. 不重构前端为框架（保持纯 HTML+JS，无构建步骤）

## Decisions

### 决策 1：前端保持纯 HTML + Vanilla JS

**决策**：`web/index.html` 继续使用纯 HTML + 内联 JavaScript，不引入 React/Vue 等框架

**理由**：
- 可视化页面功能简单，纯 JS 足够
- 无需构建步骤，`server.js` 直接提供静态文件
- 保持与其他脚本的一致性（无 package.json 依赖）

### 决策 2：新增 POST API 用于待确认操作

**决策**：在 `server.js` 中新增 `/api/confirm` 和 `/api/reject` 两个 POST 端点

```javascript
// POST /api/confirm?index=0  → 调用 dishes.js 的 confirmPending(index)
// POST /api/reject?index=0   → 调用 dishes.js 的 rejectPending(index)
```

**理由**：
- 前端无法直接操作文件系统，需要后端 API
- 复用 `dishes.js` 已有的 `confirmPending()` 和 `rejectPending()` 函数
- 操作后返回更新后的 `{ dishes, pending }`，前端刷新数据

**替代方案**：
- A. 前端直接调用 `collect.sh`/`manage.sh` → 需要中间层，架构复杂
- B. 用 WebSocket 实时推送 → 过度设计

### 决策 3：搜索和筛选在前端实现

**决策**：搜索和分类筛选完全在前端 JS 中实现，不需要后端 API

**理由**：
- 数据量小（通常几十道菜），前端过滤即可
- `/data/` 接口已返回全量数据，前端缓存后实时过滤
- 减少网络请求，响应更快

### 决策 4：清理 dishes.json 的 pending 字段

**决策**：
1. `saveDishes()` 中移除保留 pending 的逻辑
2. `ensureInitialized()` 中初始数据改为 `{ dishes: [] }`
3. 现有 `dishes.json` 移除 `pending: []` 字段

**理由**：
- pending 数据由 `savePending()` 写入 `dishes-pending.json`，与 `dishes.json` 无关
- `getAllDishes()` 已支持 `{ dishes: [...] }` 格式，移除 pending 不影响读取
- 消除"两个地方存 pending"的误解

## Risks / Trade-offs

| 风险 | 影响 | 缓解 |
|------|------|------|
| 前端 JS 代码量增加 | `index.html` 文件变大 | 保持内联，合理组织代码结构 |
| POST API 无认证 | 任意请求可确认/拒绝菜品 | 本地开发服务器，不暴露公网，风险可接受 |
| 清理 pending 后旧数据兼容 | 已有 `dishes.json` 包含 `pending: []` | `getAllDishes()` 读取时忽略该字段，迁移时清理 |
