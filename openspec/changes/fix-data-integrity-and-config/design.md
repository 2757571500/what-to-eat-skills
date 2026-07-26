## Context

当前 what-to-eat-skills 项目由 CLI 层（collect.sh / manage.sh / recommend.sh）和 Web 层（server.js）共享同一组 JSON 数据文件。测试中发现 6 个问题：

1. Web 界面操作后 AI 对话上下文不感知数据变化
2. `addDish` 缺少防重复校验，与 `auto-generate` 行为不一致
3. `config-set` 在 Windows 下反斜杠路径被 bash/PowerShell 处理掉
4. 切换 `dataPath` 后无数据迁移，用户数据"丢失"
5. `server.js` 启动时缓存路径，配置变更后不感知
6. PowerShell 中 `$pid` 是只读变量，停止服务器报错

这些问题跨越数据层、配置层、服务层和文档层，需要统一设计修复方案，同时保证 Windows 和 Linux 双平台兼容。

## Goals / Non-Goals

**Goals:**

- `addDish` 在写入前检查正式库 + 待确认列表，与 `auto-generate` 行为一致
- `config-set` 能正确处理 Windows 反斜杠路径（在反斜杠未被 shell 剥离时归一化，被剥离时提示用户）
- 新增 `config-migrate` 命令支持数据文件迁移
- `server.js` 每次请求动态读取配置路径，配置变更后无需重启
- 提供 `/api/shutdown` 端点解决 PowerShell 进程停止问题
- AI agent 行为规范写入 SKILL.md，确保回答状态类问题前重新查询

**Non-Goals:**

- 不实现 WebSocket 实时推送（当前架构不需要，成本过高）
- 不实现 `fs.watch` 文件监听（Windows 下有已知兼容性问题）
- 不重构数据存储格式（仍使用 JSON 文件）
- 不实现用户认证或权限管理

## Decisions

### 决策 1：防重复校验下沉到 `addDish` 底层

**选择**：在 `dishes.js` 的 `addDish` 函数中增加重复检查，抽取 `dishExists(name)` 公共函数。

**理由**：`auto-generate.js` 的 `generateVariantDishes` 已有防重复逻辑（通过 `used` 集合），但逻辑没有下沉到 `addDish`。将校验放在底层函数可保证所有调用路径一致，且 `auto-generate` 可复用 `dishExists` 简化代码。

**替代方案**：在 `collect.sh` 的 `add` case 中做校验——但这样无法覆盖 `server.js` 通过 API 调用 `addDish` 的路径（虽然当前 Web 界面没有 add 功能，但底层一致性更重要）。

### 决策 2：路径规范化使用 `path.normalize()` + 正斜杠转换

**选择**：在 `config-set` 的 node 代码中，对收到的值先做 `path.normalize()`，再将反斜杠替换为正斜杠后存储。

**理由**：Node.js 在 Windows 上完全兼容正斜杠路径。`path.normalize()` 能处理混合斜杠（如 `D:/eat\dishes.json`）。存储统一为正斜杠可避免后续 JSON 解析、跨平台传递时的转义问题。

**局限**：如果 bash/PowerShell 在参数传递时已经将反斜杠剥离（`\e` → `e`），node 端无法恢复。因此需要配合文档提示用户使用正斜杠或单引号。

**替代方案**：仅在文档中提示用户使用正斜杠——但不够健壮，用户仍可能犯错。

### 决策 3：`config-migrate` 作为独立命令

**选择**：新增 `config-migrate <新路径>` 命令，而非给 `config-set` 加 `--migrate` 标志。

**理由**：职责分离。`config-set` 只负责写入配置，`config-migrate` 负责数据迁移。用户可以先 `config-migrate` 再 `config-set`，也可以未来给 `config-set` 增加 `--migrate` 选项调用 `config-migrate` 的逻辑。独立命令更灵活，且不改变 `config-set` 的现有行为。

**迁移逻辑**：
1. 读取当前 `dataPath`（旧路径）
2. 将旧路径的 `dishes.json` 和 `dishes-pending.json` 复制到新路径
3. 如果新路径已有数据文件，提示用户是否覆盖
4. 迁移完成后提示用户执行 `config-set dataPath <新路径>`

### 决策 4：目录路径自动补全

**选择**：在 `data-accessor.js` 的 `resolvePath` 方法中，检测路径是否为目录（无文件扩展名），若是则自动补全 `dishes.json`。

**理由**：用户常说"改到 D:\eat"，意图是目录而非具体文件。自动补全减少用户心智负担。

### 决策 5：服务器每次请求动态读取配置

**选择**：在 `server.js` 的 `serveDataJson` 中每次创建 `new DataAccessor()` 获取最新路径。

**理由**：
- `DataAccessor` 构造函数只读一次 `config.json`（小文件），性能开销可忽略
- 比 `fs.watch` 更可靠（`fs.watch` 在 Windows 上有兼容性问题）
- 不需要手动触发 reload，配置变更后下次请求自动生效

**替代方案**：
- `fs.watch` 监听 `config.json`——Windows 兼容性差，可能重复触发
- `POST /api/reload`——需要手动触发，用户可能忘记

**补充**：仍提供 `POST /api/reload` 端点作为备用方案，方便外部系统主动触发。

### 决策 6：`/api/shutdown` 端点优雅关闭

**选择**：在 `server.js` 新增 `POST /api/shutdown` 端点，调用 `server.close()` 优雅关闭。

**理由**：PowerShell 的 `$pid` 是只读变量，`Get-NetTCPConnection` 返回 PID 0 导致权限错误。通过 HTTP 端点关闭服务器是最跨平台的方案，不依赖特定 shell 命令。

**安全考虑**：仅监听 localhost，不接受外部请求。不做认证（本地开发环境）。

### 决策 7：AI 上下文同步通过 SKILL.md 行为规范实现

**选择**：在根 SKILL.md 和各子 SKILL.md 中增加"数据新鲜度"行为规范段落。

**理由**：问题 1 的本质是 AI agent 依赖对话上下文缓存而非实时查询。这不是代码 bug，而是 agent 行为缺失。通过 SKILL.md 指令约束 AI 在回答状态类问题前必须重新执行查询命令。

## Risks / Trade-offs

- **[反斜杠已剥离无法恢复]** → 通过文档明确提示 Windows 用户使用正斜杠或单引号；在 `config-set` 中检测疑似被剥离的路径（如 `D:` 后直接跟字母无分隔符）并给出警告
- **[每次请求创建 DataAccessor 的性能]** → `config.json` 是小文件（< 1KB），`JSON.parse` 开销 < 1ms，对本地开发服务器可忽略
- **[`/api/shutdown` 安全风险]** → 服务器仅监听 localhost，且为本地开发工具，不做认证可接受；若未来部署到公网需增加认证
- **[`config-migrate` 覆盖已有数据]** → 迁移前检查目标路径是否已有数据文件，有则提示用户确认
- **[`addDish` 防重复改变现有行为]** → 之前可以添加重名菜品，现在会拒绝。这是预期行为变更（与 auto-generate 一致），但需在文档中说明
