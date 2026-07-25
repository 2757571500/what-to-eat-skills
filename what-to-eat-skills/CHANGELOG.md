# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-07-25

### Added

- 统一共享库架构 (`scripts/lib/`)
  - `data-accessor.js` - 统一数据访问层（配置管理、路径解析、文件读写）
  - `dishes.js` - 数据 CRUD 操作 + 格式化输出
  - `recommend.js` - 推荐算法（轮换优先、随机、筛选、加权）
  - `auto-generate.js` - AI 菜品生成
  - `seed.js` - 种子数据
- 模块化文档 (`docs/`)
  - `collect.md` - 菜品收集文档
  - `manage.md` - 日常管理文档
  - `recommend.md` - 菜品推荐文档
  - `visualize.md` - 可视化文档
- 配置管理系统
  - 三级优先级路径（命令行 > config.json > 默认）
  - `config-show`、`config-set`、`config-validate` 命令

### Changed

- 脚本大幅简化
  - `collect.sh`: 659 行 → ~130 行
  - `manage.sh`: 580 行 → ~80 行
  - `recommend.sh`: 720 行 → ~110 行
  - `visualize.sh`: 450 行 → ~180 行
- `SKILL.md` 轻量化：1200+ 行 → 68 行主入口
- 子 skill SKILL.md 简化为指向文档的指针
- 数据路径可配置（默认仍为 `~/.what-to-eat/data/dishes.json`）

### Fixed

- Bug #1: `--data-path` 参数现在正确生效
- Bug #2: `server.js` 在 Node.js v22+ 下正常启动

### Migration

- 数据格式完全兼容，无需迁移
- CLI 命令和参数完全向后兼容
- 首次运行自动初始化数据目录
