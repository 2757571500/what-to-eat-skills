# 重构提案：独立的 Skill 架构

## 为什么需要重构

当前项目存在**架构缺陷**导致无法正常使用：

1. **路径引用 bug**：子 SKILL.md 使用 `../../scripts/xxx.sh`，但实际路径错误（应该是 `../scripts/xxx.sh`）
2. **脚本位置不合理**：所有脚本集中在根目录 `scripts/`，与子 skill 目录分离
3. **依赖不清晰**：子 skill 目录只有文档，没有实际可执行脚本
4. **无法独立安装**：不能单独安装某个 skill，只能全量使用

重构目标：将项目从"总控+集中脚本"改为 **"5 个独立平级 skill"** 架构，每个 skill 可独立安装、独立运行。

## 变更内容

### 架构重组

- **拆分根目录**：从当前扁平结构改为嵌套的独立 skill 结构
- **脚本内联**：将共享 JS 库内联到各个 skill 的脚本中，消除跨 skill 依赖
- **数据统一**：通过 `~/.what-to-eat/config.json` 全局配置数据路径

### 5 个独立 Skill

1. **what-to-eat-skills**（总控）：纯分发逻辑，不执行脚本
2. **what-to-eat-collect**：菜品收集（内联 dishes.js + autoGenerate.js + seed.js）
3. **what-to-eat-manage**：日常管理（内联 dishes.js + seed.js）
4. **what-to-eat-recommend**：菜品推荐（内联 recommend.js + dishes.js + seed.js）
5. **what-to-eat-visualize**：可视化（内联 server.js + config.json 读取逻辑）

### 全局数据管理

- **config.json**：`~/.what-to-eat/config.json`（唯一配置）
- **dishes.json**：`~/.what-to-eat/data/dishes.json`（唯一数据文件）
- **初始化机制**：skill 运行时自动检测并创建配置

### 破坏性变更

- **脚本路径变更**：从 `../../scripts/xxx.sh` 改为 `scripts/xxx.sh`
- **数据文件迁移**：从 `data/dishes.json`（项目本地）迁移到 `~/.what-to-eat/data/dishes.json`（全局）
- **总控逻辑简化**：what-to-eat-skills/ 不再执行任何脚本，只负责意图识别和分发

## 能力范围

### 新增能力

- **独立 skill 架构**：每个 skill 可独立安装、独立运行，不依赖其他 skill 的脚本
- **全局数据管理**：通过全局 `~/.what-to-eat/config.json` 统一管理数据路径
- **自包含脚本**：每个 skill 的脚本内联所有依赖的 JS 代码

### 修改能力

- **skill 分发**：总控 skill 从"执行+分发"改为纯分发逻辑
- **数据持久化**：数据从项目本地文件迁移到全局目录

## 影响范围

### 文件结构变更

```
重构前：
what-to-eat-skills/
├── scripts/              ← 集中式脚本
│   └── lib/              ← 共享 JS 库
├── what-to-eat-collect/  ← 只有 SKILL.md
├── what-to-eat-manage/   ← 只有 SKILL.md
├── what-to-eat-recommend/
├── what-to-eat-visualize/

重构后：
what-to-eat-skills/
├── what-to-eat-skills/          ← 总控（纯分发）
│   └── scripts/lib/             ← 开发源码（不随 skill 分发）
├── what-to-eat-collect/         ← 自包含 skill
│   └── scripts/collect.sh       ← 内联所有 JS
├── what-to-eat-manage/          ← 自包含 skill
├── what-to-eat-recommend/       ← 自包含 skill
├── what-to-eat-visualize/       ← 自包含 skill
└── data/example.json            ← 初始数据模板
```

### 代码重复

- **dishes.js** 将被内联到 3 个脚本（collect、manage、recommend）
- **seed.js** 将被内联到 3 个脚本
- **可接受**：代码重复以确保自包含

### 数据迁移

- 用户需要从 `data/dishes.json` 迁移到 `~/.what-to-eat/data/dishes.json`
- 需要提供迁移脚本或文档

### 构建流程

- 需要创建 **构建脚本**（build.js）自动生成内联脚本
- 开发阶段修改 `scripts/lib/*.js`，构建后更新各个 skill 的脚本
