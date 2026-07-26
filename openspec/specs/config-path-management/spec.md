# config-path-management

## Purpose

配置路径管理能力——跨平台路径规范化（Windows 反斜杠兼容）、目录/文件路径区分与自动补全、疑似 shell 剥离检测、数据迁移命令，确保 config-set 在 Windows 和 Linux 下均能正确处理路径。

## Requirements

### Requirement: 路径规范化

`config-set` 命令在写入 `dataPath` 配置前，MUST 对路径值进行规范化处理：先调用 `path.normalize()` 处理混合斜杠，再将所有反斜杠 `\` 替换为正斜杠 `/` 后存储。规范化后的路径在 Windows 和 Linux 上均可正常使用。

#### Scenario: Windows 反斜杠路径归一化

- **WHEN** 用户执行 `config-set dataPath "D:\eat\dishes.json"` 且反斜杠未被 shell 剥离（如使用单引号或 bash 保留）
- **THEN** config.json 中存储的值为 `D:/eat/dishes.json`（反斜杠转为正斜杠），后续数据读取正常

#### Scenario: 混合斜杠路径归一化

- **WHEN** 用户执行 `config-set dataPath "D:/eat\dishes.json"`（混合斜杠）
- **THEN** config.json 中存储的值为 `D:/eat/dishes.json`，`path.normalize()` 正确处理混合分隔符

#### Scenario: 正斜杠路径保持不变

- **WHEN** 用户执行 `config-set dataPath "D:/eat/dishes.json"`
- **THEN** config.json 中存储的值为 `D:/eat/dishes.json`，不做额外修改

#### Scenario: Linux 路径保持不变

- **WHEN** 用户在 Linux 上执行 `config-set dataPath "/home/user/dishes.json"`
- **THEN** config.json 中存储的值为 `/home/user/dishes.json`，路径不变

### Requirement: 疑似路径剥离检测与警告

`config-set` 在写入 `dataPath` 前，MUST 检测路径是否疑似被 shell 剥离了反斜杠。检测规则：路径匹配 `^[A-Za-z]:[^\\/].*` 模式（盘符后直接跟字母，无路径分隔符）。若检测到，MUST 输出警告提示用户使用正斜杠或单引号，但仍然写入（不阻断操作）。

#### Scenario: 检测到疑似被剥离的路径并警告

- **WHEN** 用户执行 `config-set dataPath "D:eatdishes.json"`（反斜杠已被 bash 剥离）
- **THEN** 输出警告信息 `⚠️ 检测到路径可能缺失分隔符，Windows 用户请使用正斜杠（如 D:/eat/dishes.json）或单引号包裹路径`，同时仍将该值写入 config.json

#### Scenario: 正常路径不触发警告

- **WHEN** 用户执行 `config-set dataPath "D:/eat/dishes.json"`
- **THEN** 不输出警告，直接写入 config.json

### Requirement: 目录路径自动补全

`DataAccessor.resolvePath` 方法在处理路径时，MUST 检测路径是否为目录（无文件扩展名）。若传入的路径没有扩展名，SHALL 自动补全文件名 `dishes.json`。

#### Scenario: 传入目录路径自动补全文件名

- **WHEN** 用户执行 `config-set dataPath "D:/eat"`（无文件扩展名）
- **THEN** 实际数据路径解析为 `D:/eat/dishes.json`，自动补全文件名

#### Scenario: 传入文件路径不补全

- **WHEN** 用户执行 `config-set dataPath "D:/eat/my-dishes.json"`（有 .json 扩展名）
- **THEN** 实际数据路径为 `D:/eat/my-dishes.json`，不自动补全

### Requirement: config-migrate 命令

系统 SHALL 新增 `config-migrate <新路径>` 命令，将当前 `dataPath` 的数据文件（`dishes.json` 和对应的 `-pending.json`）复制到新路径。迁移完成后 MUST 输出提示用户执行 `config-set dataPath <新路径>` 完成切换。

#### Scenario: 成功迁移数据文件

- **WHEN** 当前 dataPath 为 `scripts/data/dishes.json`，用户执行 `config-migrate "D:/eat/dishes.json"`
- **THEN** 将 `scripts/data/dishes.json` 复制到 `D:/eat/dishes.json`，将 `scripts/data/dishes-pending.json` 复制到 `D:/eat/dishes-pending.json`，输出 `✅ 已迁移数据到 D:/eat/dishes.json，请执行 config-set dataPath "D:/eat/dishes.json" 完成切换`

#### Scenario: 目标路径已有数据文件时提示

- **WHEN** 目标路径 `D:/eat/dishes.json` 已存在且非空，用户执行 `config-migrate "D:/eat/dishes.json"`
- **THEN** 输出 `⚠️ 目标路径已有数据文件，如需覆盖请使用 --force 参数`，不执行覆盖

#### Scenario: 旧路径数据文件不存在时报错

- **WHEN** 当前 dataPath 指向的 `dishes.json` 不存在，用户执行 `config-migrate "D:/eat/dishes.json"`
- **THEN** 输出 `❌ 当前数据路径无数据文件可迁移`，退出码 1

#### Scenario: 使用 --force 覆盖已有数据

- **WHEN** 目标路径已有数据文件，用户执行 `config-migrate "D:/eat/dishes.json" --force`
- **THEN** 覆盖目标路径的数据文件，输出迁移成功信息
