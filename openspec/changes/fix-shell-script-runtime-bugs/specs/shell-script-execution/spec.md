## ADDED Requirements

### Requirement: Node.js 运行时自动检测

所有 `.sh` 脚本在执行 `node` 命令前 MUST 自动检测可用的 Node.js 运行时。脚本 SHALL 优先使用 `node` 命令，当 `node` 不可用时 SHALL 回退到 `node.exe`（Windows WSL 环境）。当两者都不可用时，脚本 MUST 输出明确错误信息并以非零退出码退出。

#### Scenario: Linux/macOS 环境下 node 可用

- **WHEN** 在 Linux 或 macOS 环境下执行 `bash scripts/*.sh`
- **THEN** 脚本检测到 `node` 命令可用，使用 `node` 执行内联 JS 代码

#### Scenario: Windows WSL 环境下 node 不可用但 node.exe 可用

- **WHEN** 在 WSL 环境下执行 `bash scripts/*.sh`，且 `node` 不在 PATH 中但 `node.exe` 可用
- **THEN** 脚本检测到 `node` 不可用，自动回退到 `node.exe`，继续执行不报错

#### Scenario: Node.js 完全不可用

- **WHEN** 在任何环境下执行 `bash scripts/*.sh`，且 `node` 和 `node.exe` 均不可用
- **THEN** 脚本输出错误信息 `Error: node not found` 到 stderr，并以退出码 1 退出

### Requirement: process.argv 参数索引正确性

所有使用 `node -e '<inline JS>' "$@"` 模式的脚本，在内联 JS 代码中 MUST 使用 `process.argv.slice(2)` 获取用户参数。`process.argv[0]` 是 node 可执行文件路径，`process.argv[1]` 是 `[eval]` 标记，用户参数从 `process.argv[2]` 开始。

#### Scenario: collect.sh add 子命令正确解析

- **WHEN** 执行 `bash scripts/collect.sh add "麻婆豆腐" --category 川菜`
- **THEN** 内联 JS 中 `process.argv.slice(2)` 返回 `["add", "麻婆豆腐", "--category", "川菜"]`，`command` 变量正确解析为 `"add"`

#### Scenario: manage.sh eat 子命令正确解析

- **WHEN** 执行 `bash scripts/manage.sh eat "麻婆豆腐"`
- **THEN** 内联 JS 中 `process.argv.slice(2)` 返回 `["eat", "麻婆豆腐"]`，`command` 变量正确解析为 `"eat"`，`target` 变量正确解析为 `"麻婆豆腐"`

#### Scenario: recommend.sh --strategy 参数正确解析

- **WHEN** 执行 `bash scripts/recommend.sh recommend --strategy rotation`
- **THEN** 内联 JS 中 `process.argv.slice(2)` 返回 `["recommend", "--strategy", "rotation"]`，`opts.strategy` 正确解析为 `"rotation"`

### Requirement: 内联 JS 函数声明唯一性

`node -e` 内联 JS 代码中，同一作用域内的函数 MUST 只用 `const` 声明一次。重复声明同一 `const` 变量会导致 `SyntaxError`，使脚本完全无法执行。

#### Scenario: collect.sh parseArgs 不重复声明

- **WHEN** 执行 `bash scripts/collect.sh list-pending`
- **THEN** 内联 JS 中 `parseArgs` 函数只声明一次，脚本正常执行不报 `SyntaxError`

#### Scenario: recommend.sh parseArgs 不重复声明

- **WHEN** 执行 `bash scripts/recommend.sh recommend`
- **THEN** 内联 JS 中 `parseArgs` 函数只声明一次，脚本正常执行不报 `SyntaxError`

### Requirement: 脚本变量完整性

所有 `.sh` 脚本中引用的变量 MUST 在引用前已定义。未定义的变量在 Bash 中展开为空字符串，可能导致路径错误或命令失败。

#### Scenario: test-abs.sh 的 SCRIPT_DIR 已定义

- **WHEN** 执行 `bash scripts/test-abs.sh`
- **THEN** 脚本中 `SCRIPT_DIR` 变量在第 2 行已赋值为 `"$(cd "$(dirname "$0")" && pwd)"`，第 3 行 `SHARED_LIB_DIR` 能正确解析共享库目录路径

### Requirement: Shell 脚本换行符兼容性

所有 `.sh` 文件 MUST 使用 LF（Unix）换行符。CRLF（Windows）换行符会导致 Bash 将 `\r` 视为命令的一部分，产生 `$'\r': command not found` 错误。

#### Scenario: 所有 .sh 文件使用 LF 换行

- **WHEN** 检查项目中所有 `.sh` 文件的换行符
- **THEN** 每个 `.sh` 文件仅包含 LF（`\n`）换行符，不包含 CR（`\r`）字符

#### Scenario: Windows 编辑器编辑后换行符不变

- **WHEN** 在 Windows 环境下使用文本编辑器修改 `.sh` 文件
- **THEN** 文件换行符保持 LF 格式（建议通过 `.gitattributes` 中 `*.sh text eol=lf` 强制保障）
