## 1. 构建系统搭建

- [x] 1.1 创建 `scripts/lib/data-accessor.js`（统一数据访问层）
- [x] 1.2 为每个 skill 创建模板文件（`scripts/*.template`）
- [x] 1.3 创建 `build.js` 脚本生成自包含脚本
- [x] 1.4 测试构建流程：运行 `node build.js` 并验证生成的脚本
- [ ] 1.5 将构建脚本添加到 package.json（如适用）

## 2. 创建自包含脚本

- [x] 2.1 生成 `what-to-eat-collect/scripts/collect.sh`（内联：data-accessor + seed + dishes + autoGenerate）
- [x] 2.2 生成 `what-to-eat-manage/scripts/manage.sh`（内联：data-accessor + seed + dishes）
- [x] 2.3 生成 `what-to-eat-recommend/scripts/recommend.sh`（内联：data-accessor + seed + dishes + recommend）
- [x] 2.4 生成 `what-to-eat-visualize/scripts/visualize.sh`（内联：data-accessor + server）
- [ ] 2.5 复制 `what-to-eat-visualize/scripts/web/` 文件（如前端存在）

## 3. 数据访问器实现

- [x] 3.1 实现 `DataAccessor` 类（单例模式）
- [x] 3.2 实现自动初始化逻辑（创建 config.json + data/dishes.json）
- [x] 3.3 实现配置验证和错误处理
- [x] 3.4 实现数据路径解析（支持自定义路径）
- [x] 3.5 测试全新环境的初始化（无已有配置）

## 4. 更新 Skill SKILL.md

- [x] 4.1 更新 `what-to-eat-collect/SKILL.md`（修复路径：`../../scripts/` → `scripts/`）
- [x] 4.2 更新 `what-to-eat-manage/SKILL.md`（修复路径）
- [x] 4.3 更新 `what-to-eat-recommend/SKILL.md`（修复路径）
- [x] 4.4 更新 `what-to-eat-visualize/SKILL.md`（修复路径 + 数据访问说明）
- [x] 4.5 更新 `what-to-eat-skills/SKILL.md`（纯分发逻辑，不执行脚本）

## 5. 总控 Skill 重写

- [x] 5.1 将 `what-to-eat-skills/SKILL.md` 重写为纯分发器
  - 移除所有脚本执行代码
  - 保留意图识别逻辑
  - 更新子 skill 调用格式
- [x] 5.2 删除旧文件：
  - 删除根目录的 `scripts/` 目录（保留 templates 和 lib）
  - 删除 `what-to-eat.md`
- [x] 5.3 使用新架构更新 `README.md`

## 6. 迁移工具

- [x] 6.1 创建 `scripts/migrate.sh`（数据迁移脚本）
- [x] 6.2 实现备份逻辑（复制旧数据到备份目录）
- [x] 6.3 实现数据复制逻辑（data/dishes.json → ~/.what-to-eat/data/dishes.json）
- [x] 6.4 实现 config.json 创建（包含迁移元数据）
- [x] 6.5 使用示例数据测试迁移

## 7. 测试

- [x] 7.1 测试 collect skill：add、list-pending、confirm、reject、auto-generate
- [x] 7.2 测试 manage skill：eat、delete、stats、list
- [x] 7.3 测试 recommend skill：rotation、random、filter、weighted
- [x] 7.4 测试 visualize skill：启动服务器、在浏览器中加载数据（无 web 前端，跳过）
- [x] 7.5 测试跨 skill 数据一致性（通过 collect 添加，通过 recommend 查看）
- [x] 7.6 测试首次运行初始化（干净环境）
- [x] 7.7 测试从旧数据格式迁移

## 8. 文档

- [x] 8.1 使用新架构图更新 `README.md`
- [x] 8.2 创建 `MIGRATION.md`（分步迁移指南）
- [x] 8.3 在 CONTRIBUTING.md 中记录构建流程
- [x] 8.4 添加故障排查章节（config.json 问题、数据丢失恢复）

## 9. 验证

- [x] 9.1 验证所有 5 个 skill 可独立安装
- [x] 9.2 验证不存在跨 skill 依赖（在脚本中搜索 `require('./`）
- [x] 9.3 验证 config.json 单例（运行多个 skill，检查文件创建）
- [x] 9.4 验证跨 skill 数据一致性
- [x] 9.5 运行端到端测试：add → recommend → eat → visualize
