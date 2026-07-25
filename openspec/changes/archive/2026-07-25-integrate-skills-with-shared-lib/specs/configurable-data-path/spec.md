---
name: configurable-data-path
description: 可配置数据路径 - 支持三级优先级（命令行参数 > config.json > 默认路径），灵活管理数据文件位置
---

# 规格说明：可配置数据路径

## 背景

当前数据路径硬编码为 `~/.what-to-eat/data/dishes.json`，用户无法：
- 使用不同的数据文件测试新功能
- 在多台设备间共享数据文件
- 将数据存储在非标准位置

## 目标

实现三级优先级的数据路径配置，满足不同使用场景：
1. **命令行参数**：临时使用不同数据文件（测试场景）
2. **config.json**：永久配置自定义路径（个人偏好）
3. **默认路径**：开箱即用（无需配置）

---

## Scenarios

### Scenario 1：默认路径（无需配置）

**Given** 用户首次使用 skill
**When** 执行任何命令（如 `bash scripts/recommend.sh stats`）
**Then** 应该：
- ✅ 检测到 `config.json` 不存在
- ✅ 自动创建 `~/.what-to-eat/config.json`
- ✅ 自动创建 `~/.what-to-eat/data/dishes.json`
- ✅ 使用默认路径读取数据
- ✅ 输出初始化提示：`✅ 已初始化数据目录: /Users/xxx/.what-to-eat`

**config.json 内容**：
```json
{
  "dataPath": "data/dishes.json",
  "createdAt": "2026-07-25T10:30:00.000Z",
  "version": "2.0.0"
}
```

---

### Scenario 2：config.json 自定义路径

**Given** 用户在 `what-to-eat-skills/config.json` 中配置自定义路径
**When** 执行任意命令
**Then** 应该：
- ✅ 读取 skill 目录中的 `config.json`
- ✅ 解析 `dataPath` 字段
- ✅ 使用自定义路径

**config.json 示例**：
```json
{
  "dataPath": "./data/my-recipes.json",
  "description": "我的自定义菜谱文件"
}
```

**路径解析**：
- `"./data/my-recipes.json"` → `/Users/xxx/what-to-eat-skills/data/my-recipes.json`
- `"/Users/xxx/dishes.json"` → `/Users/xxx/dishes.json`
- `"my-recipes.json"` → `/Users/xxx/.what-to-eat/data/my-recipes.json`

---

### Scenario 3：命令行参数覆盖 config.json

**Given** config.json 中配置 `dataPath: "./data/dishes.json"`
**When** 用户执行 `bash scripts/collect.sh add "菜" --data-path /tmp/test.json`
**Then** 应该：
- ✅ 优先使用命令行参数 `/tmp/test.json`
- ✅ 忽略 config.json 中的配置
- ✅ 仅本次命令使用临时路径

**优先级验证**：
```
命令行参数：/tmp/test.json ← 使用这个
config.json：./data/dishes.json
默认路径：~/.what-to-eat/data/dishes.json
```

---

### Scenario 4：config.json 路径解析规则

**Given** config.json 中的 `dataPath` 有三种格式
**When** DataAccessor 解析路径
**Then** 应该：
- ✅ **绝对路径**：`"/Users/xxx/dishes.json"` → 直接使用
- ✅ **相对路径**：`"./data/dishes.json"` → 相对于 skill 目录解析
- ✅ **文件名**：`"dishes.json"` → 使用 `~/.what-to-eat/data/`

**解析逻辑**：
```javascript
resolvePath(dataPath) {
  // 绝对路径 → 直接使用
  if (path.isAbsolute(dataPath)) {
    return dataPath;
  }

  // 相对路径 → 相对于 skill 目录（__dirname）
  if (dataPath.startsWith('./') || dataPath.startsWith('../')) {
    return path.resolve(__dirname, '..', dataPath);
  }

  // 文件名 → 使用默认目录
  return path.join(os.homedir(), '.what-to-eat', 'data', dataPath);
}
```

---

### Scenario 5：配置文件损坏时的容错

**Given** `config.json` 格式错误或损坏
**When** DataAccessor 读取配置
**Then** 应该：
- ✅ 捕获 JSON.parse 错误
- ✅ 输出明确错误信息：`❌ 读取配置文件失败: /path/to/config.json`
- ✅ 提示用户修复：`请检查 config.json 格式是否正确`
- ✅ 退回到默认路径（不崩溃）

**错误处理示例**：
```json
// 损坏的 config.json
{
  "dataPath": "./data/dishes.json"
  // ← 缺少逗号
}
```

**输出**：
```
❌ 读取配置文件失败: /Users/xxx/what-to-eat-skills/config.json
   Unexpected token } in JSON at position 42
   配置文件位置: /Users/xxx/what-to-eat-skills/config.json
   请检查 config.json 格式是否正确
```

---

### Scenario 6：数据文件不存在时的初始化

**Given** 用户指定了自定义路径，但数据文件不存在
**When** 执行第一个命令（如 `add`）
**Then** 应该：
- ✅ 检测到数据文件不存在
- ✅ 自动创建目录结构（`mkdir -p`）
- ✅ 创建初始数据文件：`{ "dishes": [], "pending": [] }`
- ✅ 不报错，继续执行

---

### Scenario 7：跨平台路径兼容性

**Given** 用户在 Windows 上使用相对路径
**When** DataAccessor 解析路径
**Then** 应该：
- ✅ 使用 `path.join()` 和 `path.resolve()`（不硬编码 `/` 或 `\`）
- ✅ 自动适配 Windows 路径分隔符（`\`）
- ✅ 在 macOS/Linux 上使用 `/`

**Windows 示例**：
```javascript
// config.json: "./data/dishes.json"
// Windows 解析为: C:\Users\xxx\what-to-eat-skills\data\dishes.json ✓
// macOS 解析为: /Users/xxx/what-to-eat-skills/data/dishes.json ✓
```

---

### Scenario 8：路径变更后的数据迁移

**Given** 用户从默认路径切换到自定义路径
**When** 修改 `config.json` 中的 `dataPath`
**Then** 应该：
- ✅ 提示用户数据文件尚未创建
- ✅ 询问是否从旧路径复制数据
- ✅ 提供自动迁移命令

**交互示例**：
```
用户: 修改 config.json → dataPath: "./data/my-recipes.json"
执行: bash scripts/recommend.sh stats
输出:
⚠️  检测到新数据文件尚未创建
   是否从旧路径 (~/.what-to-eat/data/dishes.json) 复制数据？(y/n)
```

---

## 非功能性需求

### 性能

- **路径解析时间**：< 1ms（单次字符串操作）
- **配置文件读取**：< 10ms（仅首次启动）
- **缓存机制**：DataAccessor 单例，配置只读取一次

### 可靠性

- **原子写操作**：`.tmp` → `rename()` 避免数据损坏
- **路径存在检查**：`fs.existsSync()` 验证后再读取
- **错误恢复**：配置损坏时退回到默认路径

### 兼容性

- **Node.js 版本**：>= 14.0.0（`path.isAbsolute()` 和 `path.resolve()` 兼容）
- **操作系统**：Windows / macOS / Linux（`os.homedir()` 跨平台）
- **Shell**：Bash（`dirname "$0"` POSIX 兼容）

---

## 边界情况

### 边界 1：config.json 不存在

**Given** 用户删除或从未创建 `config.json`
**When** DataAccessor 初始化
**Then** 应该：
- ✅ 检查 `config.json` 是否存在
- ✅ 如果不存在，创建默认配置（`dataPath: "data/dishes.json"`）
- ✅ 创建 `~/.what-to-eat/data/dishes.json`
- ✅ 输出初始化提示

---

### 边界 2：dataPath 为空字符串

**Given** `config.json` 中 `dataPath: ""`
**When** DataAccessor 解析
**Then** 应该：
- ✅ 视为无效配置
- ✅ 退回到默认路径
- ✅ 输出警告：`⚠️  dataPath 为空，使用默认路径`

---

### 边界 3：dataPath 为目录而非文件

**Given** `dataPath: "./data/"`（指向目录）
**When** DataAccessor 解析并尝试读取
**Then** 应该：
- ✅ 检测到是目录而非文件
- ✅ 输出错误：`❌ 数据路径是目录，应为文件：./data/`
- ✅ 建议：`请指定完整文件名，如 ./data/dishes.json`

---

### 边界 4：符号链接路径

**Given** `dataPath` 指向符号链接
**When** DataAccessor 解析
**Then** 应该：
- ✅ `path.resolve()` 自动解析符号链接
- ✅ 指向实际文件位置
- ✅ 正常工作

---

## 测试用例

### 测试 1：默认路径初始化

```bash
# 删除现有配置
rm -rf ~/.what-to-eat

# 执行命令
bash scripts/recommend.sh stats

# 验证
ls ~/.what-to-eat/config.json     # ✓ 存在
ls ~/.what-to-eat/data/dishes.json # ✓ 存在
cat ~/.what-to-eat/config.json     # ✓ dataPath: "data/dishes.json"
```

---

### 测试 2：自定义相对路径

```bash
# 配置相对路径
echo '{"dataPath": "./data/my-recipes.json"}' > what-to-eat-skills/config.json

# 执行命令
bash scripts/collect.sh add "测试菜"

# 验证
ls what-to-eat-skills/data/my-recipes.json # ✓ 存在
cat what-to-eat-skills/data/my-recipes.json | jq .dishes # ✓ 包含"测试菜"
```

---

### 测试 3：命令行参数覆盖

```bash
# config.json 使用默认路径
echo '{"dataPath": "data/dishes.json"}' > what-to-eat-skills/config.json

# 使用命令行参数
bash scripts/collect.sh add "临时菜" --data-path /tmp/tmp-dishes.json

# 验证默认路径未被修改
cat ~/.what-to-eat/data/dishes.json | jq .dishes # ✓ 不包含"临时菜"
cat /tmp/tmp-dishes.json | jq .dishes # ✓ 包含"临时菜"
```

---

### 测试 4：跨平台路径（Windows）

```powershell
# Windows PowerShell
cd what-to-eat-skills
bash scripts/recommend.sh stats

# 验证（通过 Node.js 输出实际路径）
node -e "console.log(require('./scripts/lib/data-accessor.js').DataAccessor.prototype.resolvePath('./data/dishes.json'))"
# → C:\Users\xxx\what-to-eat-skills\data\dishes.json ✓
```

---

## 监控与调试

### 调试输出

```bash
# 启用调试模式
DEBUG=what-to-eat bash scripts/collect.sh add "菜"

# 输出示例
[debug] DataAccessor 初始化
[debug] config.json 存在: /Users/xxx/what-to-eat-skills/config.json
[debug] 读取配置: { dataPath: './data/dishes.json' }
[debug] 解析路径: /Users/xxx/what-to-eat-skills/data/dishes.json
[debug] 添加菜品: { name: '菜', category: '其他' }
```

### 配置验证命令

```bash
# 查看当前配置
bash scripts/collect.sh config show

# 输出示例
📊 当前配置
━━━━━━━━━━━━━━
配置文件: /Users/xxx/what-to-eat-skills/config.json
数据路径: /Users/xxx/what-to-eat-skills/data/dishes.json
数据文件: ✓ 存在 (2.3 KB)
━━━━━━━━━━━━━━
```
