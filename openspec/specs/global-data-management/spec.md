# global-data-management

## Purpose

此能力规范源自变更 refactor-to-independent-skills，涵盖：。

## Requirements

## 新增需求

### 需求：单一全局配置文件
系统必须在所有 skill 中保持只有一个 `~/.what-to-eat/config.json` 文件。

#### 场景：首次执行 Skill
- **WHEN** 用户首次运行任意 skill
- **THEN** 如果文件不存在，该 skill 必须创建 `~/.what-to-eat/config.json`
- **AND** 如果文件已存在，不得覆盖

#### 场景：单例强制执行
- **WHEN** 用户顺序运行多个 skill
- **THEN** 所有 skill 必须从同一个 `~/.what-to-eat/config.json` 文件读取
- **AND** 该文件必须仅创建一次（首次运行时）

#### 场景：配置文件唯一性
- **WHEN** 用户检查 config.json 文件
- **THEN** `~/.what-to-eat/` 目录中必须恰好存在一个 config.json
- **AND** 没有任何 skill 可以创建额外的配置文件

### 需求：配置文件格式
`config.json` 文件必须包含数据访问所需的所有必要配置。

#### 场景：有效的配置结构
- **WHEN** 用户查看 `~/.what-to-eat/config.json`
- **THEN** 该文件必须至少包含以下内容：
  - `dataPath`：dishes.json 的相对路径（例如 "data/dishes.json"）
  - `version`：配置架构版本（例如 "1.0.0"）

#### 场景：配置验证
- **WHEN** 某个 skill 读取 `~/.what-to-eat/config.json`
- **THEN** 该 skill 必须验证 JSON 格式和必填字段
- **AND** 如果配置损坏或缺少必填字段，必须报告清晰的错误信息

### 需求：自动初始化
如果全局数据目录不存在，每个 skill 必须自动初始化。

#### 场景：首次初始化
- **WHEN** 用户运行某个 skill，且 `~/.what-to-eat/` 目录不存在
- **THEN** 该 skill 必须：
  - 创建 `~/.what-to-eat/` 目录
  - 使用默认设置创建 `~/.what-to-eat/config.json`
  - 创建 `~/.what-to-eat/data/` 目录
  - 创建 `~/.what-to-eat/data/dishes.json`（空数据结构）
  - 输出初始化成功消息

#### 场景：幂等初始化
- **WHEN** 用户运行某个 skill，且 `~/.what-to-eat/` 已存在
- **THEN** 该 skill 不得修改现有文件
- **AND** 继续正常执行

### 需求：数据文件路径解析
所有 skill 必须通过 `~/.what-to-eat/config.json` 解析 dishes.json 路径。

#### 场景：默认数据路径
- **WHEN** 用户使用默认配置运行 skill
- **THEN** dishes.json 必须位于 `~/.what-to-eat/data/dishes.json`

#### 场景：自定义数据路径
- **WHEN** 用户手动编辑 `~/.what-to-eat/config.json` 设置为 `"dataPath": "/custom/path/dishes.json"`
- **THEN** 所有 skill 必须从自定义路径读取和写入数据
- **AND** 如果目录不存在，必须创建

### 需求：数据一致性
所有 skill 必须操作同一个数据文件，确保跨操作的一致性。

#### 场景：跨 Skill 数据一致性
- **WHEN** 用户通过 collect skill 添加一道菜品
- **AND** 用户通过 recommend skill 查询菜品
- **THEN** recommend skill 必须立即看到新添加的菜品

#### 场景：并发访问安全
- **WHEN** 两个 skill 同时访问数据文件
- **THEN** 两者必须都能正确读写，不会损坏数据
- **AND** 必须使用原子写操作（写入临时文件，然后重命名）
