# self-contained-scripts

## Purpose

此能力规范源自变更 refactor-to-independent-skills，涵盖：。

## Requirements

## 新增需求

### 需求：内联 JavaScript 依赖
每个 shell 脚本必须包含所有必要的 JavaScript 代码内联，消除外部文件依赖。

#### 场景：Collect 脚本自包含
- **WHEN** 用户查看 `what-to-eat-collect/scripts/collect.sh`
- **THEN** 该脚本必须包含以下内联代码：
  - `data-accessor.js`（数据路径解析）
  - `seed.js`（SEED_DISHES 常量）
  - `dishes.js`（数据 CRUD 操作）
  - `autoGenerate.js`（AI 生成逻辑）
- **AND** 不得包含引用外部文件的 `require()` 语句

#### 场景：Manage 脚本自包含
- **WHEN** 用户查看 `what-to-eat-manage/scripts/manage.sh`
- **THEN** 该脚本必须包含以下内联代码：
  - `data-accessor.js`
  - `seed.js`
  - `dishes.js`
- **AND** 不得需要 `autoGenerate.js` 或 `recommend.js`

#### 场景：Recommend 脚本自包含
- **WHEN** 用户查看 `what-to-eat-recommend/scripts/recommend.sh`
- **THEN** 该脚本必须包含以下内联代码：
  - `data-accessor.js`
  - `seed.js`
  - `dishes.js`
  - `recommend.js`
- **AND** 不得需要 `autoGenerate.js`

### 需求：无共享库引用
脚本不得引用 `scripts/lib/` 或任何其他共享目录。

#### 场景：无外部库路径
- **WHEN** 用户在任意 skill 的脚本中搜索 `require(` 或 `scripts/lib`
- **THEN** 不得找到任何匹配项
- **OR** 如果找到，它们必须只引用 Node.js 内置模块（fs、path、os 等）

### 需求：重复代码一致性
虽然允许代码重复，但重复的代码在多个 skill 中必须保持功能一致。

#### 场景：dishes.js 一致性
- **WHEN** 在源代码中修改了 dishes.js 逻辑
- **THEN** 所有包含内联版本的 skill 必须通过构建流程更新
- **AND** collect、manage 和 recommend skill 中的行为必须完全一致

### 需求：构建流程可重现
必须提供构建脚本，从源文件生成自包含脚本。

#### 场景：构建脚本执行
- **WHEN** 开发者运行 `node build.js`
- **THEN** 该脚本必须：
  - 从 `scripts/lib/` 读取源文件
  - 从 `scripts/*.template` 读取模板文件
  - 在每个 skill 的 `scripts/` 目录中生成自包含脚本
  - 输出生成文件的摘要

#### 场景：构建可重现性
- **WHEN** 两个开发者从同一源代码运行 `node build.js`
- **THEN** 生成的脚本必须完全相同（逐字节）
- **AND** 不得包含任何构建时间戳或机器特定路径

### 需求：代码大小限制
内联脚本尽管有代码重复，也必须保持可维护性。

#### 场景：脚本大小检查
- **WHEN** 生成 collect.sh
- **THEN** 文件大小必须合理（不超过 500 行）
- **AND** 必须具有清晰的章节注释，分隔内联模块

#### 场景：注释标记
- **WHEN** 开发者读取内联脚本
- **THEN** 每个内联模块必须用清晰的注释标记：
  ```
  // ==== 内联 data-accessor.js ====
  // ==== 内联 seed.js ====
  // ==== 内联 dishes.js ====
  // ==== 内联 autoGenerate.js ====
  // ==== collect.sh 逻辑 ====
  ```
