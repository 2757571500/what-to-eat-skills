# server-lifecycle

## Purpose

服务器生命周期管理能力——动态配置读取（每次请求读取最新路径，配置变更无需重启）、热重载端点、优雅关闭端点、跨平台进程停止方案，解决 PowerShell `$pid` 冲突和服务器缓存路径不感知配置变更的问题。

## Requirements

### Requirement: 服务器动态读取配置路径

`server.js` 的 `serveDataJson` 函数在每次处理数据请求时，MUST 动态创建 `new DataAccessor()` 获取最新的数据文件路径，不得使用启动时缓存的常量。这确保 `config-set` 修改配置路径后，服务器无需重启即可访问新路径的数据。

#### Scenario: 配置变更后下次请求使用新路径

- **WHEN** 服务器运行中，用户通过 CLI 执行 `config-set dataPath "D:/new/dishes.json"` 切换路径，随后在浏览器刷新可视化页面
- **THEN** 页面显示 `D:/new/dishes.json` 中的数据，服务器未重启

#### Scenario: 服务器启动时仍正常读取初始配置

- **WHEN** 服务器启动，config.json 中 dataPath 为 `scripts/data/dishes.json`
- **THEN** 首次请求返回 `scripts/data/dishes.json` 中的数据

### Requirement: POST /api/reload 端点

系统 SHALL 提供 `POST /api/reload` HTTP 端点，允许外部触发服务器重新读取配置。该端点 MUST 返回 JSON 格式的确认信息。由于服务器已采用动态读取，此端点主要用于通知前端或外部系统配置已变更。

#### Scenario: 成功触发重新加载

- **WHEN** 向 `http://localhost:3000/api/reload` 发送 POST 请求
- **THEN** 返回 `{ ok: true, message: '配置已重新加载' }`，状态码 200

### Requirement: POST /api/shutdown 端点

系统 SHALL 提供 `POST /api/shutdown` HTTP 端点，允许通过 HTTP 请求优雅关闭服务器。调用后服务器 MUST 停止接受新连接，等待现有请求完成后关闭进程。该端点 MUST 返回 JSON 格式确认信息后关闭。

#### Scenario: 成功关闭服务器

- **WHEN** 向 `http://localhost:3000/api/shutdown` 发送 POST 请求
- **THEN** 返回 `{ ok: true, message: '服务器正在关闭' }`，状态码 200，随后服务器进程退出

#### Scenario: 关闭后请求被拒绝

- **WHEN** 服务器已通过 `/api/shutdown` 关闭，再次向 `http://localhost:3000/api/confirm?index=0` 发送 POST 请求
- **THEN** 连接被拒绝（ECONNREFUSED）

### Requirement: 跨平台进程停止方案

文档 MUST 提供经过验证的跨平台停止服务器方案。Windows 使用 `POST /api/shutdown` 或 PowerShell 命令（过滤 PID 0）；Linux 使用 `kill` 命令或 `POST /api/shutdown`。

#### Scenario: PowerShell 停止命令不使用保留变量

- **WHEN** 用户在 Windows PowerShell 中需要停止端口 3000 的服务器
- **THEN** 文档提供的命令为 `Invoke-RestMethod -Uri 'http://localhost:3000/api/shutdown' -Method Post`（推荐），或备选 `Get-NetTCPConnection -LocalPort 3000 | Where-Object { $_.OwningProcess -ne 0 } | Select-Object -Unique OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }`（不使用 `$pid` 保留变量）

#### Scenario: Linux 停止命令

- **WHEN** 用户在 Linux 中需要停止端口 3000 的服务器
- **THEN** 文档提供的命令为 `curl -X POST http://localhost:3000/api/shutdown`（推荐），或备选 `kill $(lsof -t -i:3000)`
