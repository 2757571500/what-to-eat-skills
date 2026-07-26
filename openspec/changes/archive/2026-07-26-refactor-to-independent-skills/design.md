# 技术设计：重构为独立 Skill 架构

## 背景

当前项目（what-to-eat-skills）是一个 Claude Code skill 集合，包含 5 个 skill（总控 + 4 个子 skill）。

### 当前问题

1. **路径引用 bug**：子 SKILL.md 使用 `../../scripts/xxx.sh`，但实际路径错误
2. **脚本不自包含**：所有脚本集中在根目录，子 skill 只有文档
3. **无法独立安装**：无法单独安装某个 skill
4. **共享库依赖**：所有 skill 共享 `scripts/lib/`，不满足自包含要求

### 约束条件

- **自包含**：每个 skill 的脚本必须内联所有依赖的 JS 代码
- **无跨 skill 依赖**：一个 skill 不能引用另一个 skill 的文件
- **单一 config.json**：全局只有一个 `~/.what-to-eat/config.json`
- **接受代码重复**：dishes.js 和 seed.js 可在多个脚本中重复

## 目标 / 非目标

### 目标

1. **5 个独立 Skill**：每个 skill 可独立安装、独立运行
2. **自包含脚本**：每个 skill 的 .sh 脚本包含所有必需的 JS 代码
3. **全局数据管理**：通过 `~/.what-to-eat/config.json` 统一管理数据路径
4. **自动初始化**：skill 首次运行时自动创建配置和数据文件
5. **简单构建流程**：提供简单的构建脚本，但保持手动可维护

### 非目标

1. **不支持多套数据**：不支持同时维护多套数据（工作/家庭）
2. **不实现动态插件加载**：不实现运行时动态加载 skill
3. **不做向后兼容**：不保留旧版路径和数据位置的兼容性
4. **不用复杂构建系统**：不使用 Webpack/Rollup 等复杂构建工具

## 关键决策

### 决策 1：脚本内联策略

**决策**：手动或通过简单脚本将 JS 代码内联到 .sh 文件中

**理由**：
- 保持简单，避免复杂构建流程
- 代码重复可接受（每份 ~150-200 行）
- 易于理解和维护

**实现方式**：
```bash
# collect.sh 结构
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"

node -e "
// ==== 内联 seed.js ====
const SEED_DISHES = [...];
const DIFFICULTIES = [...];
const CATEGORIES = [...];

// ==== 内联 dishes.js ====
const fs = require('fs');
const path = require('path');
// ... dishes.js 代码（移除 require('./seed.js')）

// ==== 内联 autoGenerate.js ====
// ... autoGenerate.js 代码（移除 require('./dishes.js')）

// ==== collect.sh 逻辑 ====
const { addDish, getPending, ... } = ...; // 直接使用上面定义的函数
const command = process.argv[2];
...
"
```

**考虑过的替代方案**：
- **A. 运行时从全局路径 require**：打破自包含约束，不推荐
- **B. 复杂构建系统 (Webpack)**：过度工程，增加维护负担
- **C. 运行时下载依赖**：需要网络，增加复杂度

---

### 决策 2：全局数据路径

**决策**：使用 `~/.what-to-eat/config.json` 作为唯一配置入口

**理由**：
- 符合 Unix 惯例（`~/.config/`）
- 用户容易理解和定位
- 确保全局唯一性

**实现方式**：
```bash
# 每个脚本开头的初始化逻辑
CONFIG_DIR="$HOME/.what-to-eat"
CONFIG_FILE="$CONFIG_DIR/config.json"
DATA_DIR="$CONFIG_DIR/data"
DATA_FILE="$DATA_DIR/dishes.json"

# 确保配置存在（单例保证）
ensure_config() {
  if [ ! -f "$CONFIG_FILE" ]; then
    mkdir -p "$DATA_DIR"
    cat > "$CONFIG_FILE" << 'EOF'
{
  "dataPath": "data/dishes.json",
  "createdAt": "__DATE__",
  "version": "1.0.0"
}
EOF
    # 创建初始数据文件
    cat > "$DATA_FILE" << 'EOF'
{
  "dishes": [],
  "pending": []
}
EOF
    echo "✅ 已初始化数据目录: $CONFIG_DIR"
  fi
}

# 读取配置（使用 Node.js 的 jq 替代方案或纯 bash）
read_config() {
  node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf-8'));
    console.log(JSON.stringify(config));
  "
}
```

**考虑过的替代方案**：
- **A. 项目本地配置**：不满足"全局唯一"要求
- **B. 环境变量**：用户配置复杂，不符合直觉
- **C. 多配置集**：超出需求范围，增加复杂度

---

### 决策 3：数据访问层

**决策**：在每个脚本中内联一个 `DataAccessor` 类

**理由**：
- 统一数据访问逻辑
- 隐藏路径细节
- 确保单例模式（config.json 只创建一次）

**实现方式**：
```javascript
// ==== 内联 data-accessor.js ====
const fs = require('fs');
const path = require('path');
const os = require('os');

class DataAccessor {
  constructor() {
    this.configDir = path.join(os.homedir(), '.what-to-eat');
    this.configFile = path.join(this.configDir, 'config.json');
    this.dataDir = path.join(this.configDir, 'data');
    this.ensureInitialized();
  }

  ensureInitialized() {
    if (!fs.existsSync(this.configFile)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      fs.writeFileSync(this.configFile, JSON.stringify({
        dataPath: 'data/dishes.json',
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      }, null, 2));
      fs.writeFileSync(path.join(this.dataDir, 'dishes.json'),
        JSON.stringify({ dishes: [], pending: [] }, null, 2));
      console.log('✅ 已初始化数据目录: ' + this.configDir);
    }
  }

  getDataPath() {
    const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
    return path.join(this.dataDir, config.dataPath);
  }

  readJSON(filePath) {
    try {
      if (!fs.existsSync(filePath)) return [];
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return [];
    }
  }

  writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

// 全局单例
const dataAccessor = new DataAccessor();
const DISHES_FILE = dataAccessor.getDataPath();
const PENDING_FILE = path.join(path.dirname(DISHES_FILE), 'pending.json');
```

**在 dishes.js 中使用**：
```javascript
// 替换原来的：
// const ROOT = path.resolve(__dirname, '..', '..');
// const DISHES_FILE = path.join(ROOT, 'data', 'dishes.json');

// 改为直接使用：
// DISHES_FILE（已由 data-accessor 定义）
```

---

### 决策 4：visualize.js 特殊处理

**决策**：server.js 也内联 data-accessor 逻辑，通过 HTTP 提供 JSON 数据

**理由**：
- visualize 是唯一需要 HTTP 服务的 skill
- 需要访问全局数据文件，不能使用相对路径
- 保持自包含

**实现方式**：
```javascript
// ==== 内联 server.js ====
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 内联 DataAccessor
class DataAccessor { ... }
const dataAccessor = new DataAccessor();
const DISHES_FILE = dataAccessor.getDataPath();

const MIME = { ... };

const server = http.createServer((req, res) => {
  let filePath;
  if (req.url === '/') {
    filePath = path.join(__dirname, 'web', 'index.html');
  } else if (req.url.startsWith('/data/')) {
    filePath = DISHES_FILE;  // 直接使用全局数据文件
  } else {
    filePath = path.join(__dirname, 'web', req.url.slice(1));
  }
  // ... 返回文件内容
});
```

---

### 决策 5：构建流程

**决策**：提供简单的 `build.js` 脚本，但保持手动可维护

**理由**：
- 自动化合并过程，避免手动复制粘贴错误
- 保持透明，生成的结果可以手动审查和修改
- 不强制使用构建步骤

**构建脚本结构**：
```javascript
// build.js
const fs = require('fs');
const path = require('path');

// 1. 读取源文件
const libFiles = {
  'seed.js': fs.readFileSync('scripts/lib/seed.js', 'utf-8'),
  'dishes.js': fs.readFileSync('scripts/lib/dishes.js', 'utf-8'),
  'autoGenerate.js': fs.readFileSync('scripts/lib/autoGenerate.js', 'utf-8'),
  'recommend.js': fs.readFileSync('scripts/lib/recommend.js', 'utf-8'),
  'data-accessor.js': fs.readFileSync('scripts/lib/data-accessor.js', 'utf-8'),
};

// 2. 生成自包含脚本
function generateSelfContained(templatePath, inlineFiles) {
  let template = fs.readFileSync(templatePath, 'utf-8');

  // 替换占位符
  inlineFiles.forEach(({ name, content }) => {
    // 移除 require 语句
    const cleaned = removeRequires(content);
    template = template.replace(`{{ ${name} }}`, cleaned);
  });

  return template;
}

// 3. 写入各个 skill
fs.writeFileSync('what-to-eat-collect/scripts/collect.sh',
  generateSelfContained('scripts/collect.sh.template', [
    { name: 'DATA_ACCESSOR', content: libFiles['data-accessor.js'] },
    { name: 'SEED', content: libFiles['seed.js'] },
    { name: 'DISHES', content: libFiles['dishes.js'] },
    { name: 'AUTOGENERATE', content: libFiles['autoGenerate.js'] },
  ])
);

// ... 其他 skill
```

**构建模板**：每个 .sh 文件需要一个对应的 .template 文件：
```
scripts/
├── collect.sh.template      ← 包含 {{ SEED }}、{{ DISHES }} 等占位符
├── manage.sh.template
├── recommend.sh.template
├── visualize.sh.template
└── lib/
    ├── data-accessor.js     ← 新建：统一数据访问层
    ├── seed.js
    ├── dishes.js
    ├── autoGenerate.js
    └── recommend.js
```

---

### 决策 6：迁移策略

**决策**：提供自动迁移脚本，但保持数据完整性

**理由**：
- 用户数据是最宝贵的资产
- 迁移过程需要透明和可逆

**迁移脚本**：
```bash
#!/bin/bash
# scripts/migrate.sh

echo "🔄 迁移数据到全局目录..."

# 1. 检测旧数据
if [ ! -f "data/dishes.json" ]; then
  echo "❌ 未找到 data/dishes.json，无需迁移"
  exit 0
fi

# 2. 创建全局目录
mkdir -p ~/.what-to-eat/data

# 3. 复制数据
cp data/dishes.json ~/.what-to-eat/data/dishes.json
cp data/pending.json ~/.what-to-eat/data/pending.json 2>/dev/null || echo '{"pending":[]}' > ~/.what-to-eat/data/pending.json

# 4. 创建 config.json
cat > ~/.what-to-eat/config.json << 'EOF'
{
  "dataPath": "data/dishes.json",
  "migratedFrom": "data/dishes.json",
  "migratedAt": "__DATE__",
  "version": "1.0.0"
}
EOF

echo "✅ 数据已迁移到 ~/.what-to-eat/"
echo "    dishes.json: ~/.what-to-eat/data/dishes.json"
echo "    config.json: ~/.what-to-eat/config.json"
echo ""
echo "⚠️  旧数据文件已保留在 data/，确认迁移成功后可手动删除"
```

## 风险与权衡

### 风险 1：代码重复维护

**风险**：修改 dishes.js 后需要更新 3 个脚本（collect、manage、recommend）

**缓解措施**：
- 提供 `build.js` 脚本自动生成
- 在 CI/CD 中运行构建脚本
- 添加 lint 检查确保内联代码一致性

**权衡**：接受代码重复，但通过构建脚本降低维护成本

---

### 风险 2：单例配置损坏

**风险**：如果 `~/.what-to-eat/config.json` 被手动修改或损坏，所有 skill 都会失败

**缓解措施**：
- 每个脚本在读取前验证 JSON 格式
- 提供修复命令：`bash scripts/repair-config.sh`
- 重要操作前备份 config.json

**权衡**：简单性优先，不实现复杂的配置管理

---

### 风险 3：迁移数据丢失

**风险**：迁移过程中数据丢失或损坏

**缓解措施**：
- 迁移前自动备份到 `data/backup/`
- 验证迁移后的数据完整性
- 提供回滚脚本

**实现方式**：
```bash
# migrate.sh 中的备份逻辑
cp -r data data.backup.$(date +%Y%m%d)
```

---

### 风险 4：Windows 兼容性

**风险**：`~/.what-to-eat/` 路径在 Windows 上不标准

**缓解措施**：
- 使用 Node.js 的 `os.homedir()` 和 `path.join()` 确保跨平台
- 在 Windows 上实际路径是 `C:\Users\<username>\.what-to-eat\`

**实现方式**：
```javascript
// DataAccessor 中使用：
this.configDir = path.join(os.homedir(), '.what-to-eat');
// Windows 上自动转换为 C:\Users\xxx\.what-to-eat
```

---

## 迁移计划

### 阶段 1：构建系统（第 1 周）

1. 创建 `scripts/lib/data-accessor.js`（统一数据访问层）
2. 创建 `scripts/*.template` 文件（内联模板）
3. 创建 `build.js`（构建脚本）
4. 测试生成自包含脚本

### 阶段 2：Skill 重构（第 2 周）

1. 重构 `what-to-eat-collect`：
   - 内联 data-accessor.js + seed.js + dishes.js + autoGenerate.js
   - 更新 SKILL.md 路径引用
   - 测试所有命令

2. 重构 `what-to-eat-manage`：
   - 内联 data-accessor.js + seed.js + dishes.js
   - 更新 SKILL.md 路径引用
   - 测试所有命令

3. 重构 `what-to-eat-recommend`：
   - 内联 data-accessor.js + seed.js + dishes.js + recommend.js
   - 更新 SKILL.md 路径引用
   - 测试所有命令

4. 重构 `what-to-eat-visualize`：
   - 内联 data-accessor.js + server.js
   - 更新 SKILL.md 路径引用
   - 测试 HTTP 服务

### 阶段 3：总控 Skill 重写（第 2 周）

1. 重写 `what-to-eat-skills/SKILL.md`：
   - 移除脚本执行代码
   - 纯分发逻辑（意图识别 + Skill 调用）
   - 更新路径引用

2. 删除旧文件：
   - 删除根目录的 `scripts/`、`what-to-eat.md`
   - 保留 `README.md` 和 `VERSION`

### 阶段 4：文档和迁移（第 3 周）

1. 创建 `scripts/migrate.sh`（数据迁移脚本）
2. 更新 `README.md`（新架构说明）
3. 创建 `MIGRATION.md`（迁移指南）
4. 编写测试用例

## 待解决问题

1. **迁移时机**：是否在首次运行时自动迁移，还是要求用户手动运行 migrate.sh？
   - **建议**：自动迁移（更用户友好）

2. **配置备份**：是否自动备份旧的 config.json？
   - **建议**：是，备份到 `~/.what-to-eat/backups/`

3. **Skill 分发方式**：5 个 skill 如何分发？
   - **选项 A**：作为单一仓库，用户克隆整个 repo
   - **选项 B**：每个 skill 独立仓库
   - **建议**：先保持单一仓库，未来可拆分

4. **前端文件处理**：visualize skill 的前端文件（HTML/CSS/JS）如何处理？
   - **选项 A**：内联到 server.js（Base64）
   - **选项 B**：保持为独立文件
   - **建议**：保持为独立文件（更易维护）
