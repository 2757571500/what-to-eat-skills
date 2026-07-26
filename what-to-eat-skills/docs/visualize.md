# 可视化

## 前提条件

本文档假设你当前位于 **what-to-eat-skills** Skill 集合的根目录。

```bash
# 进入 Skill 集合根目录
cd what-to-eat-skills
```

**标准目录结构**：
```
what-to-eat-skills/                  ← 当前工作目录
├── SKILL.md                         ← 总控入口
├── docs/                            ← 本文档
├── scripts/                         ← 共享库
├── what-to-eat-collect/
├── what-to-eat-manage/
├── what-to-eat-recommend/
└── what-to-eat-visualize/           ← 目标 Skill
    └── scripts/
        ├── visualize.sh            ← 目标脚本
        └── server.js
```

所有命令均使用相对于 `what-to-eat-skills/` 目录的路径。

---

## 启动可视化服务器

**CLI 命令**:
```bash
bash what-to-eat-visualize/scripts/visualize.sh [端口]
```

**默认端口**: 3000

**示例对话**:

```
用户: "打开看看"
→ 执行: bash what-to-eat-visualize/scripts/visualize.sh 3000
→ 打开浏览器: http://localhost:3000
→ 回复: "🍳 菜品可视化页面已启动\n   浏览器已打开 http://localhost:3000\n   按 Ctrl+C 停止服务器"
```

---

## 停止可视化服务器

### 推荐方式：HTTP 端点关闭（跨平台）

向服务器发送 `POST /api/shutdown` 请求，服务器会优雅关闭：

```bash
# Windows PowerShell（推荐）
Invoke-RestMethod -Uri 'http://localhost:3000/api/shutdown' -Method Post

# Linux / macOS（推荐）
curl -X POST http://localhost:3000/api/shutdown
```

### 备选方式：按端口查杀进程

若 HTTP 端点不可用（服务器已无响应），可按端口查杀进程：

```powershell
# Windows PowerShell（注意：不要使用 $pid 保留变量，需过滤 PID 0）
Get-NetTCPConnection -LocalPort 3000 | Where-Object { $_.OwningProcess -ne 0 } | Select-Object -Unique OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

```bash
# Linux / macOS
kill $(lsof -t -i:3000)
```

### 重载配置（无需重启）

服务器每次请求都会动态读取配置文件，`config-set` 修改 `dataPath` 后**无需重启服务器**，下次刷新页面即可看到新路径数据。也可通过 `POST /api/reload` 端点主动通知外部系统配置已变更：

```bash
curl -X POST http://localhost:3000/api/reload
```

---

## 浏览器自动化

**根据操作系统选择合适的打开方式**:

```bash
# Windows
start http://localhost:3000

# macOS
open http://localhost:3000

# Linux
xdg-open http://localhost:3000
```

---

## 可视化功能说明

启动服务器后，用户可以在浏览器中使用以下功能：

- **卡片视图**: 每道菜品以卡片形式展示，显示名称、分类、用时、难度、距上次食用天数
- **搜索功能**: 按名称或食材关键词搜索，实时过滤
- **分类筛选**: 按分类筛选（家常菜/川菜/凉菜/汤/主食/粤菜/甜品/其他）
- **待确认菜品**: 查看待确认队列，直接在 Web 界面确认/拒绝菜品

---

## 常见错误场景

1. **端口被占用**: 旧服务器可能仍在运行。先尝试 `Invoke-RestMethod -Uri 'http://localhost:3000/api/shutdown' -Method Post`（PowerShell）或 `curl -X POST http://localhost:3000/api/shutdown`（Linux）关闭旧服务器；若仍被占用再使用其他端口
2. **服务器启动失败**: 检查端口和 Node.js 环境
3. **数据文件缺失**: 确保 data/dishes.json 存在

## 注意事项

- **服务器持续运行**: 启动后保持运行，直到用户按 Ctrl+C 或关闭终端
- **端口默认 3000**: 如果被占用，建议用户选择其他端口
- **浏览器自动打开**: 尝试自动打开，失败时提供手动访问地址
- **数据实时加载**: Web 页面通过 Fetch API 加载 JSON，每次刷新显示最新数据
