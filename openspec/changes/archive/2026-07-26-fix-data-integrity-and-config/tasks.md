## 1. 数据层 - 菜品防重复校验（问题 2）

- [x] 1.1 在 `dishes.js` 中新增 `dishExists(name)` 公共函数：检查正式库（`getAllDishes`）和待确认列表（`getPending`）中是否已有同名菜品，比较前对 name 做 `trim()` 归一化
- [x] 1.2 在 `dishes.js` 的 `module.exports` 中导出 `dishExists`
- [x] 1.3 修改 `dishes.js` 的 `addDish` 函数：在 `normalizeDish` 校验通过后、写入前，调用 `dishExists(entry.name)` 检查重复，若存在则返回 `{ ok: false, error: '菜品「<名称>」已存在' }`
- [x] 1.4 重构 `auto-generate.js` 的 `generateVariantDishes`：移除内部 `used` 集合，改用 `dishExists(name)` 判断候选菜品是否重复
- [x] 1.5 验证：手动添加已存在于正式库的菜品，确认返回错误而非写入待确认列表
- [x] 1.6 验证：手动添加已存在于待确认列表的菜品，确认返回错误
- [x] 1.7 验证：`auto-generate` 仍能正常生成不重复的候选菜品

## 2. 配置层 - 路径规范化与校验（问题 3）

- [x] 2.1 在 `collect.sh` 的 `config-set` case 中，对 `dataPath` 值增加路径规范化：调用 `path.normalize()` 处理混合斜杠，再将反斜杠 `\` 替换为正斜杠 `/` 后存储
- [x] 2.2 在 `config-set` 中增加疑似路径剥离检测：路径匹配 `^[A-Za-z]:[^\\/].*` 时输出警告 `⚠️ 检测到路径可能缺失分隔符，Windows 用户请使用正斜杠（如 D:/eat/dishes.json）或单引号包裹路径`，但仍写入
- [x] 2.3 在 `data-accessor.js` 的 `resolvePath` 方法中增加目录路径检测：若路径无文件扩展名（`path.extname` 返回空字符串），自动补全 `dishes.json`
- [x] 2.4 验证：使用正斜杠路径 `D:/eat/dishes.json` 执行 config-set，config.json 中存储值正确
- [x] 2.5 验证：使用混合斜杠路径 `D:/eat\dishes.json` 执行 config-set，归一化后存储值正确
- [x] 2.6 验证：传入目录路径 `D:/eat` 时自动补全为 `D:/eat/dishes.json`
- [x] 2.7 验证：Linux 路径 `/home/user/dishes.json` 不受影响

## 3. 配置层 - 数据迁移命令（问题 4）

- [x] 3.1 在 `collect.sh` 中新增 `config-migrate` case，解析参数 `<新路径>` 和可选 `--force` 标志
- [x] 3.2 实现迁移逻辑：读取当前 `dataPath`（旧路径），将旧路径的 `dishes.json` 复制到新路径对应位置
- [x] 3.3 实现待确认文件迁移：将旧路径的 `dishes-pending.json`（通过 `getPendingPath` 派生）复制到新路径对应位置
- [x] 3.4 实现目标路径已有数据检测：新路径已存在非空数据文件时，无 `--force` 则提示 `⚠️ 目标路径已有数据文件，如需覆盖请使用 --force 参数` 并退出
- [x] 3.5 实现 `--force` 覆盖逻辑
- [x] 3.6 实现旧路径不存在时的错误处理：输出 `❌ 当前数据路径无数据文件可迁移`，退出码 1
- [x] 3.7 迁移成功后输出提示：`✅ 已迁移数据到 <新路径>，请执行 config-set dataPath "<新路径>" 完成切换`
- [x] 3.8 更新 `collect.sh` 的 usage 信息，增加 `config-migrate` 命令说明
- [x] 3.9 验证：执行 config-migrate 后新路径有完整数据文件

## 4. 服务层 - 服务器动态配置与生命周期（问题 5、6）

- [x] 4.1 重构 `server.js`：移除启动时缓存的 `DISHES_FILE` 和 `PENDING_FILE` 常量
- [x] 4.2 修改 `serveDataJson` 函数：每次请求时创建 `new DataAccessor()` 获取最新 `getDataPath()` 和 `getPendingPath()`
- [x] 4.3 新增 `POST /api/reload` 端点：返回 `{ ok: true, message: '配置已重新加载' }`，状态码 200
- [x] 4.4 新增 `POST /api/shutdown` 端点：返回 `{ ok: true, message: '服务器正在关闭' }` 后调用 `server.close()` 优雅关闭
- [x] 4.5 在 `handleApiRequest` 中注册 `/api/reload` 和 `/api/shutdown` 路由
- [x] 4.6 验证：服务器运行中执行 `config-set dataPath` 切换路径，刷新页面显示新路径数据（无需重启）
- [x] 4.7 验证：向 `/api/shutdown` 发送 POST 请求，服务器成功关闭
- [x] 4.8 验证：向 `/api/reload` 发送 POST 请求，返回成功确认

## 5. 文档层 - AI 上下文同步规范（问题 1）

- [x] 5.1 在根 `SKILL.md` 中新增"数据新鲜度"行为规范段落：要求 AI 回答状态类问题前必须重新执行查询命令，不依赖对话上下文缓存
- [x] 5.2 在 `what-to-eat-collect/SKILL.md` 中增加数据新鲜度规范：提醒 list-pending 等查询必须实时执行
- [x] 5.3 在 `what-to-eat-recommend/SKILL.md` 中增加数据新鲜度规范：推荐前必须重新查询菜品库
- [x] 5.4 验证：三个 SKILL.md 文件均包含数据新鲜度规范段落，使用祈使句（"必须"、"不得"）

## 6. 文档层 - 跨平台使用说明（问题 3、6）

- [x] 6.1 在 `docs/collect.md` 中补充 Windows 路径使用正斜杠的说明段落
- [x] 6.2 在 `docs/collect.md` 中补充 `config-migrate` 命令的使用说明和示例
- [x] 6.3 在 `docs/visualize.md` 中补充 `/api/shutdown` 端点用法
- [x] 6.4 在 `docs/visualize.md` 中补充 PowerShell 停止服务器的正确命令（不使用 `$pid` 保留变量）
- [x] 6.5 在 `docs/visualize.md` 中补充 Linux 停止服务器的命令
- [x] 6.6 在 `docs/visualize.md` 中说明 config-set 后无需重启服务器（动态读取配置）
- [x] 6.7 在 `docs/visualize.md` 的常见错误场景中增加"端口被占用时使用 /api/shutdown 关闭旧服务器"

## 7. 跨平台验证

- [x] 7.1 Windows（PowerShell）验证：config-set 正斜杠路径、config-migrate、/api/shutdown、addDish 防重复
- [x] 7.2 Windows（Git Bash）验证：同上
- [x] 7.3 Linux 验证：config-set 路径、config-migrate、/api/shutdown、addDish 防重复
- [x] 7.4 验证 `collect.sh` 的 usage 信息包含所有新命令（config-migrate）
