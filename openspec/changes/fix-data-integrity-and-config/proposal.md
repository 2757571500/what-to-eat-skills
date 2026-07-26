## Why

测试中发现 6 个问题涉及数据完整性缺失、跨平台路径兼容性不足、配置变更后服务不感知、以及 AI 对话上下文与外部数据源不同步。这些问题在 Windows 和 Linux 环境下均可能触发，影响数据一致性和用户体验，需要统一修复。

## What Changes

- **addDish 增加防重复校验**：在 `dishes.js` 的 `addDish` 函数中增加对正式库和待确认列表的重复检查，抽取公共函数 `dishExists(name)` 供 `addDish` 和 `auto-generate` 共用
- **config-set 路径规范化**：在 `collect.sh` 的 `config-set` 处理中增加 `path.normalize()` 和正斜杠转换，兼容 Windows 反斜杠路径；增加路径合法性校验
- **新增 config-migrate 命令**：切换 `dataPath` 时支持将旧路径数据文件迁移到新路径，避免数据"丢失"
- **目录路径自动补全**：用户传入目录路径时自动补全文件名 `dishes.json`
- **服务器动态读取配置**：`server.js` 每次请求时动态创建 `DataAccessor` 获取最新路径，不再启动时缓存
- **新增 POST /api/reload 端点**：允许通过 HTTP 请求触发服务器重新读取配置
- **新增 POST /api/shutdown 端点**：允许通过 HTTP 请求优雅关闭服务器，解决 PowerShell `$pid` 冲突问题
- **AI 上下文同步规范**：在 SKILL.md 中增加行为规范，要求 AI 在回答"当前状态"类问题时始终重新执行查询命令，不依赖对话上下文缓存
- **文档更新**：`docs/collect.md` 补充 Windows 路径使用正斜杠说明；`docs/visualize.md` 补充正确的 PowerShell 停止命令和 `/api/shutdown` 用法

## Capabilities

### New Capabilities

- `dish-deduplication`: 菜品防重复校验——在 addDish 底层函数中检查正式库和待确认列表，名称归一化后比较，抽取公共 `dishExists()` 函数
- `config-path-management`: 配置路径管理——跨平台路径规范化、目录/文件路径区分、路径合法性校验、数据迁移命令
- `server-lifecycle`: 服务器生命周期管理——动态配置读取、热重载端点、优雅关闭端点、跨平台进程停止方案
- `ai-context-sync`: AI 上下文同步——AI agent 行为规范，回答状态类问题前必须重新查询，不依赖会话缓存

### Modified Capabilities

（无——`openspec/specs/` 目录当前为空，全部为新增能力）

## Impact

- **dishes.js**：修改 `addDish` 函数，新增 `dishExists` 公共函数并导出
- **auto-generate.js**：重构 `generateVariantDishes` 中的 `used` 集合逻辑，改用 `dishExists` 公共函数
- **collect.sh**：修改 `config-set` case 增加路径规范化；新增 `config-migrate` case
- **data-accessor.js**：新增路径校验方法和目录路径补全逻辑
- **server.js**：重构 `serveDataJson` 为动态读取路径；新增 `/api/reload` 和 `/api/shutdown` 端点
- **SKILL.md**（collect、visualize、根 SKILL.md）：增加 AI 上下文同步行为规范
- **docs/collect.md**：补充 Windows 路径格式说明
- **docs/visualize.md**：补充 PowerShell 停止命令、`/api/shutdown` 用法
- **跨平台兼容**：所有修改需同时验证 Windows（PowerShell + Git Bash）和 Linux 环境
