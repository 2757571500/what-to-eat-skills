## Context

`refactor-to-independent-skills` 重构后，所有 `.sh` 脚本仍依赖共享库 `scripts/lib/*.js`，通过 `node -e '<inline JS>' "$@"` 模式执行。该模式在 Windows + WSL 环境下暴露了 3 类运行时 bug：

1. **`parseArgs` 重复声明**：`collect.sh` 和原版 `recommend.sh` 的内联 JS 中，`const parseArgs` 被声明两次，导致 `SyntaxError: Identifier 'parseArgs' has already been declared`
2. **`process.argv` 索引错误**：`node -e` 模式下 `argv[1]` 是 `[eval]` 标记，用户参数从 `argv[2]` 开始。`collect.sh` 和 `manage.sh` 使用 `slice(1)` 导致命令解析完全失效
3. **WSL 下 `node` 不可用**：Windows 安装的 Node.js 在 WSL 中注册为 `node.exe`，`bash` 执行 `node` 时报 `command not found`

### 当前状态

```
┌─────────────────────────────────────────────────────────┐
│  执行链路                                                │
│                                                         │
│  SKILL.md → PowerShell → bash *.sh → node -e '<JS>'   │
│                         ↑              ↑                │
│                      换行符 bug     argv/node bug        │
└─────────────────────────────────────────────────────────┘
```

### 约束

- 不内联 JS 代码（保持共享库架构，自包含属于后续变更）
- 不修改 `scripts/lib/*.js` 共享库
- 不修改 SKILL.md 文档
- 仅修改 `.sh` 脚本文件
- 跨平台兼容：macOS / Linux / Windows(WSL)

## Goals / Non-Goals

**Goals:**

1. 所有 5 个 `.sh` 脚本在 Windows + WSL 环境下可直接通过 `bash scripts/*.sh` 执行
2. `collect.sh` 和 `manage.sh` 的子命令能正确解析和执行
3. `node` 命令在 WSL 环境下自动回退到 `node.exe`
4. 所有 `.sh` 文件使用 LF 换行

**Non-Goals:**

1. 不实现 JS 代码内联（自包含架构属于后续独立变更）
2. 不重构脚本结构或添加新功能
3. 不修改共享库 `scripts/lib/*.js`
4. 不修改 `config.json` 或数据文件格式
5. 不修改 SKILL.md 或 docs/ 文档

## Decisions

### 决策 1：统一 node 检测逻辑

**决策**：在每个 `.sh` 脚本中添加 `NODE_CMD` 变量检测块

```bash
NODE_CMD="node"
if ! command -v node &>/dev/null; then
  if command -v node.exe &>/dev/null; then
    NODE_CMD="node.exe"
  else
    echo "Error: node not found" >&2
    exit 1
  fi
fi
```

**理由**：
- 在脚本内检测，无需依赖外部环境变量或 `.bashrc` 配置
- `command -v` 是 POSIX 兼容的检测方式
- 优先使用 `node`（Linux/macOS），回退到 `node.exe`（Windows WSL）

**替代方案**：
- A. 在 `.bashrc` 中添加 Windows PATH → 需要用户手动配置，不可控
- B. 统一用 `node.exe` → Linux/macOS 上不存在 `.exe` 后缀
- C. 用 `which` 检测 → 非所有系统可用，`command -v` 更通用

### 决策 2：`process.argv.slice(2)` 统一规范

**决策**：所有 `node -e` 内联脚本统一使用 `process.argv.slice(2)` 获取用户参数

**理由**：
```
node -e 'code' arg1 arg2

process.argv = [node路径, '[eval]', arg1, arg2]
                 [0]          [1]      [2]    [3]

slice(1) → ['[eval]', arg1, arg2]  ← 错误！包含 [eval]
slice(2) → [arg1, arg2]             ← 正确
```

**替代方案**：
- A. 使用 `node --eval` 并用 `process.argv.slice(1)` → 行为与 `-e` 相同，不解决问题
- B. 改用 `node script.js` 外部文件 → 需要创建临时文件，增加复杂度

### 决策 3：`parseArgs` 去重方式

**决策**：删除第二个重复声明，保留第一个（两个实现完全相同）

**理由**：
- 两处 `parseArgs` 实现完全一致，不是函数重载
- `const` 在同一作用域内不可重复声明，这是 JavaScript 语言规范
- 删除第二个不会丢失任何功能

### 决策 4：test-abs.sh 的 SCRIPT_DIR 修复

**决策**：在 `test-abs.sh` 第 2 行添加 `SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"`，与其他脚本保持一致

**理由**：
- 其他脚本（collect.sh、manage.sh、recommend.sh）都使用相同模式
- `test-abs.sh` 第 3 行引用了 `$SCRIPT_DIR` 但从未定义，是复制遗漏

## Risks / Trade-offs

| 风险 | 影响 | 缓解 |
|------|------|------|
| `node.exe` 在某些 WSL 配置中也不可用 | 脚本报错退出 | 检测失败时输出明确错误信息并 `exit 1` |
| 其他脚本模板（如 `.template` 文件）未同步修复 | 下次 build 重新生成会覆盖修复 | 在 tasks 中标注需检查模板文件 |
| macOS/Linux 下 `command -v node` 路径不一致 | 不影响——检测到即可使用 | 无需额外处理 |
| LF 换行在 Windows 编辑器中被意外改回 CRLF | 脚本再次报 `\r` 错误 | 在 spec 中明确要求 LF，建议配置 `.gitattributes` |
