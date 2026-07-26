# independent-skill-architecture

## Purpose

此能力规范源自变更 refactor-to-independent-skills，涵盖：。

## Requirements

## 新增需求

### 需求：独立 Skill 安装
每个 skill 必须能够独立安装，且不依赖其他 skill 的文件或脚本。

#### 场景：仅安装 collect skill
- **WHEN** 用户仅安装 `what-to-eat-collect` skill
- **THEN** 该 skill 必须正常运行，且不引用 `what-to-eat-manage`、`what-to-eat-recommend` 或 `what-to-eat-visualize` 中的任何文件

#### 场景：Skill 自包含
- **WHEN** 用户查看 `what-to-eat-collect/scripts/collect.sh`
- **THEN** 该脚本必须包含所有必要的 JavaScript 代码内联，且不得包含引用外部 skill 文件的 `require()` 语句

### 需求：无跨 Skill 依赖
一个 skill 在运行时不得依赖另一个 skill 的脚本、库或数据文件。

#### 场景：Collect skill 执行
- **WHEN** 用户运行 `bash scripts/collect.sh add "麻婆豆腐"`
- **THEN** 该脚本必须仅使用 `what-to-eat-collect/` 目录树内的文件执行

#### 场景：并行 Skill 执行
- **WHEN** 用户同时运行两个不同的 skill（例如 collect 和 recommend）
- **THEN** 两者必须独立执行，不会出现文件锁定冲突或依赖错误

### 需求：Skill 目录结构
每个 skill 目录必须包含完整、自包含的实现。

#### 场景：Collect skill 结构
- **WHEN** 用户列出 `what-to-eat-collect/` 中的文件
- **THEN** 该目录必须包含 `SKILL.md` 和 `scripts/collect.sh`（visualize 可选包含 `scripts/web/`）

#### 场景：总控 skill 结构
- **WHEN** 用户列出 `what-to-eat-skills/` 中的文件
- **THEN** 该目录必须仅包含 `SKILL.md`（纯分发逻辑，无可执行脚本）

### 需求：Skill 版本管理
每个 skill 必须维护自己的版本号，且与其他 skill 独立版本管理。

#### 场景：版本不匹配处理
- **WHEN** 用户安装了不同版本的 collect（1.2.0）和 recommend（1.1.0）skill
- **THEN** 两者必须使用各自的版本正常运行，不会出现兼容性问题
