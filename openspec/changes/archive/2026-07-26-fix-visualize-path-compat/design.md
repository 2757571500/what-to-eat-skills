## Context

`visualize.sh` 是唯一一个将文件路径作为字符串参数传递给 `node`/`node.exe` 的脚本。其他脚本（collect/manage/recommend）使用 `cd "$SHARED_LIB_DIR"` + `node -e 'require("./dishes.js")'` 模式，`require` 基于 CWD 解析，CWD 由 shell/interop 层自动转换为 Windows 路径，天然规避跨平台路径问题。

`visualize.sh` 当前使用 `sed` 将 WSL 路径 `/mnt/X/` 转换为 `X:/`，但：
- GitBash 路径格式是 `/d/`（不带 `/mnt/`），`sed` 匹配不到
- Linux/macOS 原生路径不需要转换，`sed` 是多余依赖
- `sed` 在某些精简环境中可能不可用

### 当前 visualize.sh 路径处理流程

```
$(pwd) → /mnt/d/.../scripts (WSL) 或 /d/.../scripts (GitBash)
    ↓
sed 转换 → D:/.../scripts (仅 WSL 生效，GitBash 不变)
    ↓
node.exe "$WIN_DIR/server.js" → WSL 可用，GitBash 失败
```

### 其他脚本的路径处理流程（无问题）

```
cd "$SHARED_LIB_DIR" → CWD 变更
    ↓
node.exe -e 'require("./dishes.js")'
    ↓
require 基于 CWD 解析 → interop 自动转换 → 所有平台可用
```

### 约束

- 必须兼容 Linux、macOS、WSL、GitBash 四种环境
- 不修改 `server.js`（`__dirname` 已正确工作）
- 不引入新的外部依赖
- 与其他脚本的路径处理模式保持一致

## Goals / Non-Goals

**Goals:**

1. `visualize.sh` 在 Linux、macOS、WSL、GitBash 四种环境下均能正确启动 `server.js`
2. 移除对 `sed` 命令的依赖
3. 与 collect/manage/recommend 的路径处理模式统一

**Non-Goals:**

1. 不修改 `server.js` 内部逻辑
2. 不修改共享库 `scripts/lib/*.js`
3. 不修改其他 `.sh` 脚本
4. 不处理 `web/` 目录缺失问题（已在测试问题待修复.md 中临时修复）
5. 不处理数据文件分离问题（dishes.json + dishes-pending.json，属于后续变更）

## Decisions

### 决策 1：用 `cd` 替代 `sed` 路径转换

**决策**：在调用 `node` 前执行 `cd "$DIR"`，然后使用相对路径 `server.js` 调用 node

```bash
# 修复前
WIN_DIR=$(echo "$DIR" | sed 's|^/mnt/\([a-zA-Z]\)/|\1:/|')
$NODE_CMD "$WIN_DIR/server.js" $PORT

# 修复后
cd "$DIR"
$NODE_CMD server.js $PORT
```

**理由**：
- `cd` 设置 CWD 后，shell/interop 层（WSL interop、MSYS2）自动将 CWD 转换为 Windows 可识别路径
- `server.js` 作为相对路径，由 node 基于 CWD 解析，与 `require("./xxx.js")` 机制相同
- 无需任何路径格式判断或转换逻辑
- 与 collect/manage/recommend 脚本完全一致

**替代方案**：
- A. `cygpath -w` 转换 → 仅 GitBash 有 `cygpath`，WSL 没有
- B. 多层 `sed` 覆盖 `/mnt/X/` 和 `/X/` → 逻辑复杂，正则易出错
- C. 在 node 端用 `path.resolve()` 处理 → 需修改 server.js，超出范围

### 决策 2：保留 `DIR` 变量定义

**决策**：保留 `DIR="$(cd "$(dirname "$0")" && pwd)"` 变量，用于 `cd "$DIR"` 和可能的调试输出

**理由**：
- `DIR` 变量在其他脚本中也存在，保持一致
- `cd "$DIR"` 需要明确的目标路径

## Risks / Trade-offs

| 风险 | 影响 | 缓解 |
|------|------|------|
| `cd "$DIR"` 后 CWD 改变影响后续命令 | 无——`node server.js` 是脚本最后一条命令 | 无需处理 |
| 某些环境下 `$(pwd)` 返回空字符串 | `cd ""` 会跳转到 HOME 目录 | `DIR` 通过 `$(dirname "$0")` 获取，不会为空 |
| `server.js` 内 `__dirname` 在 `cd` 模式下解析不正确 | server.js 找不到共享库或 web 目录 | `__dirname` 基于 CWD + 文件名解析，CWD 已正确转换，`__dirname` 自动正确 |
