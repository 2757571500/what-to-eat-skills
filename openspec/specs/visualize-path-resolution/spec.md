# visualize-path-resolution

## Purpose

此能力规范源自变更 fix-visualize-path-compat，涵盖：跨平台文件路径传递、无 sed 依赖。

## Requirements

### Requirement: 跨平台文件路径传递

`visualize.sh` 在调用 Node.js 执行 `server.js` 时 MUST 使用 `cd` + 相对路径模式，而非将绝对路径作为字符串参数传递。Shell/interop 层（WSL interop、MSYS2）会自动将 CWD 转换为目标平台可识别的路径格式，无需手动转换。

#### Scenario: WSL 环境下启动可视化服务器

- **WHEN** 在 WSL 环境下执行 `bash scripts/visualize.sh 3000`，`pwd` 返回 `/mnt/d/.../scripts`
- **THEN** 脚本执行 `cd "$DIR"` 设置 CWD，WSL interop 自动将 CWD 转换为 Windows 路径，`node.exe server.js` 通过 CWD 找到 `server.js` 并成功启动

#### Scenario: GitBash 环境下启动可视化服务器

- **WHEN** 在 GitBash 环境下执行 `bash scripts/visualize.sh 3000`，`pwd` 返回 `/d/.../scripts`
- **THEN** 脚本执行 `cd "$DIR"` 设置 CWD，MSYS2 自动将 CWD 转换为 Windows 路径，`node.exe server.js` 通过 CWD 找到 `server.js` 并成功启动

#### Scenario: Linux 环境下启动可视化服务器

- **WHEN** 在 Linux 环境下执行 `bash scripts/visualize.sh 3000`，`pwd` 返回 `/home/user/.../scripts`
- **THEN** 脚本执行 `cd "$DIR"` 设置 CWD，`node server.js` 通过 CWD 找到 `server.js` 并成功启动

#### Scenario: macOS 环境下启动可视化服务器

- **WHEN** 在 macOS 环境下执行 `bash scripts/visualize.sh 3000`，`pwd` 返回 `/Users/user/.../scripts`
- **THEN** 脚本执行 `cd "$DIR"` 设置 CWD，`node server.js` 通过 CWD 找到 `server.js` 并成功启动

#### Scenario: 服务器启动后 __dirname 正确解析共享库

- **WHEN** `server.js` 通过 `cd` 模式启动，`__dirname` 基于 CWD 解析
- **THEN** `path.resolve(__dirname, '../../scripts/lib')` 正确定位到共享库目录，`require(path.join(SHARED_LIB_DIR, 'data-accessor.js'))` 成功加载

#### Scenario: 服务器启动后 __dirname 正确解析 web 目录

- **WHEN** `server.js` 通过 `cd` 模式启动，`__dirname` 基于 CWD 解析
- **THEN** `path.join(__dirname, 'web', 'index.html')` 正确定位到前端页面文件，访问 `http://localhost:PORT` 返回 200

### Requirement: 无 sed 依赖

`visualize.sh` MUST NOT 依赖 `sed` 命令进行路径转换。路径转换由 shell/interop 层的 CWD 机制自动处理，脚本中不应包含任何路径格式判断或转换逻辑。

#### Scenario: 脚本中不存在 sed 调用

- **WHEN** 检查 `visualize.sh` 源码
- **THEN** 不存在 `sed`、`cygpath`、`wslpath` 等路径转换命令的调用

#### Scenario: 不依赖 sed 仍能正常工作

- **WHEN** 在未安装 `sed` 的精简环境中执行 `bash scripts/visualize.sh 3000`
- **THEN** 脚本不因缺少 `sed` 而失败，通过 `cd` + CWD 机制正常启动服务器
