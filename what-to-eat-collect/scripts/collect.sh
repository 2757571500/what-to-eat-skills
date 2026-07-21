#!/bin/bash
# collect.sh.template - 菜品收集脚本（构建模板）
# 此模板由 build.js 处理，生成自包含的 collect.sh

DIR="$(cd "$(dirname "$0")" && pwd)"

# 将内联 JavaScript 写入临时文件并执行（避免 bash 变量替换问题）
TMP_SCRIPT=$(mktemp)
trap "rm -f $TMP_SCRIPT" EXIT

cat > "$TMP_SCRIPT" << 'JAVASCRIPT_EOF'
// ==== 内联 data-accessor.js ====
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * data-accessor.js — 统一数据访问层
 * 职责：全局配置管理、数据路径解析、自动初始化
 *
 * 设计原则：
 * - 单例模式：确保 config.json 只创建一次
 * - 跨平台：使用 os.homedir() + path.join()
 * - 自动初始化：首次运行时自动创建配置和数据文件
 */


class DataAccessor {
  constructor() {
    // 全局配置目录：~/.what-to-eat/
    this.configDir = path.join(os.homedir(), '.what-to-eat');

    // 配置文件：~/.what-to-eat/config.json
    this.configFile = path.join(this.configDir, 'config.json');

    // 数据目录：~/.what-to-eat/data/
    this.dataDir = path.join(this.configDir, 'data');

    // 执行初始化（Singleton 保证）
    this.ensureInitialized();
  }

  /**
   * 确保配置和数据目录存在（幂等操作）
   * 如果已存在，不修改任何文件
   */
  ensureInitialized() {
    // 如果配置已存在，跳过初始化
    if (fs.existsSync(this.configFile)) {
      return;
    }

    // 创建目录结构
    fs.mkdirSync(this.dataDir, { recursive: true });

    // 创建 config.json
    // dataPath 是相对于 dataDir 的路径，所以这里只需要文件名
    const config = {
      dataPath: 'dishes.json',
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    };
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), 'utf-8');

    // 创建初始数据文件
    const initialData = {
      dishes: [],
      pending: [],
    };
    fs.writeFileSync(
      path.join(this.dataDir, 'dishes.json'),
      JSON.stringify(initialData, null, 2),
      'utf-8'
    );

    // 输出初始化消息（仅在真正初始化时）
    console.log('✅ 已初始化数据目录: ' + this.configDir);
  }

  /**
   * 从 config.json 解析数据文件路径
   * @returns {string}  dishes.json 的完整路径
   */
  getDataPath() {
    try {
      const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));

      // 验证必需字段
      if (!config.dataPath) {
        throw new Error('config.json 缺少 dataPath 字段');
      }

      // 返回完整路径（支持相对路径和绝对路径）
      if (path.isAbsolute(config.dataPath)) {
        return config.dataPath;
      } else {
        return path.join(this.dataDir, config.dataPath);
      }
    } catch (error) {
      console.error('❌ 读取配置文件失败:', error.message);
      console.error('   配置文件位置:', this.configFile);
      console.error('   请检查 config.json 格式是否正确');
      process.exit(1);
    }
  }

  /**
   * 读取 JSON 文件
   * @param {string} filePath - 文件路径
   * @returns {Array|Object} 解析后的 JSON 数据，失败返回空数组
   */
  readJSON(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (error) {
      console.error('❌ 读取 JSON 文件失败:', filePath, error.message);
      return [];
    }
  }

  /**
   * 写入 JSON 文件（原子写操作）
   * @param {string} filePath - 文件路径
   * @param {Array|Object} data - 要写入的数据
   */
  writeJSON(filePath, data) {
    try {
      const json = JSON.stringify(data, null, 2);

      // 原子写：先写临时文件，然后重命名
      const tempFile = filePath + '.tmp';
      fs.writeFileSync(tempFile, json, 'utf-8');
      fs.renameSync(tempFile, filePath);
    } catch (error) {
      console.error('❌ 写入 JSON 文件失败:', filePath, error.message);
      process.exit(1);
    }
  }

  /**
   * 获取 pending.json 路径
   * @returns {string} pending.json 的完整路径
   */
  getPendingPath() {
    const dataPath = this.getDataPath();
    return path.join(path.dirname(dataPath), 'pending.json');
  }

  /**
   * 验证配置文件完整性
   * @returns {boolean} 配置是否有效
   */
  validateConfig() {
    try {
      if (!fs.existsSync(this.configFile)) {
        return false;
      }

      const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));

      // 检查必需字段
      if (!config.dataPath) {
        console.error('❌ 配置文件缺少 dataPath 字段');
        return false;
      }

      if (!config.version) {
        console.warn('⚠️  配置文件缺少 version 字段');
      }

      return true;
    } catch (error) {
      console.error('❌ 配置文件格式错误:', error.message);
      return false;
    }
  }
}

// ── 导出 ──────────────────────────────────────

// 创建全局单例（内联模式下直接使用）
const dataAccessor = new DataAccessor();

// 供其他模块使用的路径常量

module.exports = {
  DataAccessor,
  dataAccessor,
};


/**
 * 种子菜品库
 * 初始待探索的 26 道菜，AI 生成菜品时从这里采样
 */

const SEED_DISHES = [
  { name: '西红柿炒鸡蛋', category: '家常菜', tags: ['快手', '下饭'], ingredients: ['西红柿', '鸡蛋', '葱'], prepTime: 15, difficulty: '简单' },
  { name: '麻婆豆腐', category: '川菜', tags: ['麻辣', '下饭'], ingredients: ['豆腐', '牛肉末', '豆瓣酱', '花椒'], prepTime: 20, difficulty: '中等' },
  { name: '凉拌黄瓜', category: '凉菜', tags: ['快手', '清淡', '素食'], ingredients: ['黄瓜', '蒜', '醋'], prepTime: 10, difficulty: '简单' },
  { name: '红烧肉', category: '家常菜', tags: ['荤菜', '下饭'], ingredients: ['五花肉', '酱油', '冰糖', '八角'], prepTime: 90, difficulty: '中等' },
  { name: '蛋炒饭', category: '主食', tags: ['快手', '主食'], ingredients: ['米饭', '鸡蛋', '葱', '胡萝卜'], prepTime: 10, difficulty: '简单' },
  { name: '酸辣土豆丝', category: '家常菜', tags: ['快手', '酸辣', '素食'], ingredients: ['土豆', '辣椒', '醋'], prepTime: 15, difficulty: '简单' },
  { name: '宫保鸡丁', category: '川菜', tags: ['麻辣', '下饭'], ingredients: ['鸡胸肉', '花生', '干辣椒', '黄瓜'], prepTime: 25, difficulty: '中等' },
  { name: '冬瓜排骨汤', category: '汤', tags: ['汤羹', '清淡'], ingredients: ['排骨', '冬瓜', '姜'], prepTime: 60, difficulty: '中等' },
  { name: '清炒时蔬', category: '家常菜', tags: ['快手', '清淡', '素食'], ingredients: ['西兰花', '蒜', '盐'], prepTime: 10, difficulty: '简单' },
  { name: '鱼香肉丝', category: '川菜', tags: ['下饭', '酸甜'], ingredients: ['猪肉', '木耳', '胡萝卜', '青椒'], prepTime: 25, difficulty: '中等' },
  { name: '皮蛋豆腐', category: '凉菜', tags: ['快手', '清淡', '素食'], ingredients: ['皮蛋', '豆腐', '葱', '酱油'], prepTime: 5, difficulty: '简单' },
  { name: '番茄牛腩', category: '家常菜', tags: ['荤菜', '下饭'], ingredients: ['牛腩', '西红柿', '洋葱', '胡萝卜'], prepTime: 90, difficulty: '中等' },
  { name: '手撕包菜', category: '家常菜', tags: ['快手', '下饭', '素食'], ingredients: ['包菜', '干辣椒', '蒜'], prepTime: 15, difficulty: '简单' },
  { name: '葱油拌面', category: '主食', tags: ['快手', '主食', '清淡'], ingredients: ['面条', '葱', '酱油', '油'], prepTime: 15, difficulty: '简单' },
  { name: '蒜蓉粉丝蒸虾', category: '家常菜', tags: ['快手', '荤菜'], ingredients: ['虾', '粉丝', '蒜', '葱'], prepTime: 20, difficulty: '中等' },
  { name: '醋溜白菜', category: '家常菜', tags: ['快手', '酸辣', '素食'], ingredients: ['白菜', '醋', '辣椒'], prepTime: 10, difficulty: '简单' },
  { name: '可乐鸡翅', category: '家常菜', tags: ['荤菜', '甜', '快手'], ingredients: ['鸡翅', '可乐', '姜', '酱油'], prepTime: 30, difficulty: '简单' },
  { name: '紫菜蛋花汤', category: '汤', tags: ['快手', '汤羹', '清淡'], ingredients: ['紫菜', '鸡蛋', '葱'], prepTime: 10, difficulty: '简单' },
  { name: '回锅肉', category: '川菜', tags: ['下饭', '荤菜', '麻辣'], ingredients: ['五花肉', '蒜苗', '豆瓣酱', '青椒'], prepTime: 30, difficulty: '中等' },
  { name: '凉拌木耳', category: '凉菜', tags: ['快手', '清淡', '素食'], ingredients: ['木耳', '醋', '蒜', '香菜'], prepTime: 15, difficulty: '简单' },
  { name: '水煮鱼', category: '川菜', tags: ['麻辣', '荤菜'], ingredients: ['草鱼', '豆芽', '干辣椒', '花椒'], prepTime: 40, difficulty: '困难' },
  { name: '糖醋里脊', category: '家常菜', tags: ['酸甜', '荤菜', '下饭'], ingredients: ['猪里脊', '番茄酱', '醋', '糖'], prepTime: 30, difficulty: '中等' },
  { name: '地三鲜', category: '家常菜', tags: ['素食', '下饭'], ingredients: ['茄子', '土豆', '青椒'], prepTime: 25, difficulty: '中等' },
  { name: '番茄鸡蛋面', category: '主食', tags: ['快手', '主食', '清淡'], ingredients: ['面条', '西红柿', '鸡蛋', '葱'], prepTime: 20, difficulty: '简单' },
  { name: '青椒肉丝', category: '家常菜', tags: ['快手', '下饭', '荤菜'], ingredients: ['青椒', '猪肉', '蒜'], prepTime: 15, difficulty: '简单' },
];

const DIFFICULTIES = ['简单', '中等', '困难'];
const CATEGORIES = ['家常菜', '川菜', '凉菜', '汤', '主食', '粤菜', '甜品', '其他'];
const ALL_TAGS = ['快手', '下饭', '清淡', '麻辣', '素食', '荤菜', '汤羹', '酸甜', '主食', '酸辣', '甜'];

module.exports = { SEED_DISHES, DIFFICULTIES, CATEGORIES, ALL_TAGS };


/**
 * dishes.js — 数据读写层
 * 职责：JSON 文件 CRUD、菜品字段校验、数据迁移
 */


// 项目根目录是 src/ 的上一级（即 WhaToEat/）

// ── 数据模型默认值 ─────────────────────────────

const DEFAULT_DISH = {
  category: '其他',
  tags: [],
  ingredients: [],
  prepTime: 30,
  difficulty: '简单',
  addedDate: null,
  lastEaten: null,
  eatCount: 0,
};

// ── 工具函数 ──────────────────────────────────

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const d1 = new Date(dateStr);
  const d2 = new Date();
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

function normalizeDish(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.name || !raw.name.trim()) return null;
  return { ...DEFAULT_DISH, ...raw, name: raw.name.trim() };
}

// ── 数据访问 ──────────────────────────────────

function getAllDishes() {
  return readJSON(dataAccessor.getDataPath());
}

function saveDishes(dishes) {
  writeJSON(dataAccessor.getDataPath(), dishes);
}

function getPending() {
  return readJSON(dataAccessor.getPendingPath());
}

function savePending(pending) {
  writeJSON(dataAccessor.getPendingPath(), pending);
}

function movePendingToDishes(index) {
  const pending = getPending();
  if (index < 0 || index >= pending.length) {
    return { ok: false, error: `索引 ${index} 超出范围，当前有 ${pending.length} 个待确认菜品` };
  }
  const [dish] = pending.splice(index, 1);
  savePending(pending);
  const dishes = getAllDishes();
  dishes.push(dish);
  saveDishes(dishes);
  return { ok: true, dish };
}

function removePending(index) {
  const pending = getPending();
  if (index < 0 || index >= pending.length) {
    return { ok: false, error: `索引 ${index} 超出范围` };
  }
  const [dish] = pending.splice(index, 1);
  savePending(pending);
  return { ok: true, dish };
}

function addDish(dish) {
  const pending = getPending();
  const entry = normalizeDish(dish);
  if (!entry) return { ok: false, error: '无效菜品数据' };
  entry.addedDate = today();
  pending.push(entry);
  savePending(pending);
  return { ok: true, dish: entry };
}

function recordEat(name) {
  const dishes = getAllDishes();
  const dish = dishes.find(d => d.name === name);
  if (!dish) return { ok: false, error: `未找到菜品「${name}」` };
  dish.lastEaten = today();
  dish.eatCount += 1;
  saveDishes(dishes);
  return { ok: true, dish };
}

function deleteDish(name) {
  const dishes = getAllDishes();
  const idx = dishes.findIndex(d => d.name === name);
  if (idx === -1) return { ok: false, error: `未找到菜品「${name}」` };
  dishes.splice(idx, 1);
  saveDishes(dishes);
  return { ok: true };
}

// ── 待确认队列操作 ─────────────────────────────

function confirmPending(target) {
  const pending = getPending();

  // 尝试作为索引
  const index = parseInt(target, 10);
  if (!isNaN(index)) {
    return movePendingToDishes(index);
  }

  // 尝试作为名称
  const dishIndex = pending.findIndex(d => d.name === target);
  if (dishIndex === -1) {
    return { ok: false, error: `未找到待确认菜品「${target}」` };
  }
  return movePendingToDishes(dishIndex);
}

function rejectPending(target) {
  const pending = getPending();

  // 尝试作为索引
  const index = parseInt(target, 10);
  if (!isNaN(index)) {
    const result = removePending(index);
    if (result.ok) {
      return { ok: true, message: `已拒绝「${result.dish.name}」`, dish: result.dish };
    }
    return result;
  }

  // 尝试作为名称
  const dishIndex = pending.findIndex(d => d.name === target);
  if (dishIndex === -1) {
    return { ok: false, error: `未找到待确认菜品「${target}」` };
  }
  const result = removePending(dishIndex);
  if (result.ok) {
    return { ok: true, message: `已拒绝「${result.dish.name}」`, dish: result.dish };
  }
  return result;
}

function confirmAll() {
  const pending = getPending();
  if (pending.length === 0) {
    return { ok: false, error: '没有待确认的菜品' };
  }

  let count = 0;
  while (pending.length > 0) {
    movePendingToDishes(0);
    count++;
  }

  return { ok: true, message: `已确认 ${count} 道菜品` };
}

function rejectAll() {
  const pending = getPending();
  if (pending.length === 0) {
    return { ok: false, error: '没有待确认的菜品' };
  }

  const count = pending.length;
  savePending([]);

  return { ok: true, message: `已拒绝 ${count} 道菜品` };
}

// ── 格式化输出 ────────────────────────────────

function formatPending(pending) {
  if (!pending || pending.length === 0) {
    return '📋 待确认菜品 (0 道):\n  暂无待确认菜品';
  }

  const lines = [`📋 待确认菜品 (${pending.length} 道):\n`];

  pending.forEach((dish, index) => {
    lines.push(`  ${index}. ${dish.name} | ${dish.category} | ${dish.prepTime}分钟 | ${dish.difficulty}`);
    if (dish.tags && dish.tags.length > 0) {
      lines.push(`    标签: ${dish.tags.join(',')}`);
    }
    if (dish.ingredients && dish.ingredients.length > 0) {
      lines.push(`    食材: ${dish.ingredients.join(',')}`);
    }
  });

  return lines.join('\n');
}

function formatStats(dishes) {
  if (!dishes || dishes.length === 0) {
    return '📊 菜品库统计:\n  暂无菜品';
  }

  const total = dishes.length;
  const categories = {};
  const difficulties = {};

  dishes.forEach(dish => {
    categories[dish.category] = (categories[dish.category] || 0) + 1;
    difficulties[dish.difficulty] = (difficulties[dish.difficulty] || 0) + 1;
  });

  const lines = ['📊 菜品库统计:', `  总计: ${total} 道菜品`, ''];

  lines.push('分类统计:');
  Object.entries(categories).forEach(([cat, count]) => {
    lines.push(`  ${cat}: ${count} 道`);
  });

  lines.push('');
  lines.push('难度统计:');
  Object.entries(difficulties).forEach(([diff, count]) => {
    lines.push(`  ${diff}: ${count} 道`);
  });

  return lines.join('\n');
}

// ── 导出 ──────────────────────────────────────

module.exports = {
  readJSON, writeJSON,
  today, pickRandom, randInt, daysSince, normalizeDish,
  getAllDishes, saveDishes, getPending, savePending,
  movePendingToDishes, removePending, addDish, recordEat, deleteDish,
  confirmPending, rejectPending, confirmAll, rejectAll,
  formatPending, formatStats,
  SEED_DISHES, DIFFICULTIES, CATEGORIES, ALL_TAGS,
};


/**
 * autoGenerate.js — AI 菜品生成器
 * 职责：从种子库或组合变体中生成新菜品写入待确认队列
 */


// ── 菜品变体生成器 ─────────────────────────────

const VARIANT_PREFIXES = ['香煎', '蒜蓉', '清炒', '红烧', '干锅', '酱爆', '葱姜', '豉汁', '爆炒', '糖醋'];
const VARIANT_INGREDIENTS = ['豆腐', '鸡腿', '虾仁', '牛肉', '茄子', '蘑菇', '西兰花', '豆角', '鲈鱼', '猪排', '鱿鱼', '丝瓜'];

const RANDOM_TAGS = [['快手', '下饭'], ['清淡', '家常'], ['荤菜', '下饭'], ['素食', '快手'], ['酸甜', '家常']];

function generateVariantDishes(count) {
  const used = new Set([...getAllDishes().map(d => d.name), ...getPending().map(d => d.name)]);
  const candidates = [];

  // 优先从种子库挑还没入库的
  const fromSeed = SEED_DISHES.filter(d => !used.has(d.name));
  candidates.push(...fromSeed);

  // 种子库不够就生成变体
  for (const base of VARIANT_PREFIXES) {
    for (const ing of VARIANT_INGREDIENTS) {
      const name = `${base}${ing}`;
      if (!used.has(name) && !candidates.find(c => c.name === name)) {
        candidates.push({
          name,
          category: pickRandom(CATEGORIES.filter(c => c !== '主食' && c !== '甜品')),
          tags: pickRandom(RANDOM_TAGS),
          ingredients: [ing, pickRandom(['蒜', '姜', '葱', '辣椒', '生抽', '蚝油'])],
          prepTime: randInt(10, 45),
          difficulty: pickRandom(DIFFICULTIES),
        });
      }
    }
  }

  return candidates.slice(0, count);
}

/**
 * 生成 N 道菜品到待确认队列
 * @param {number} count - 要生成的数量（默认 3）
 * @returns {{ generated: Array, strategy: string }} 生成结果
 */
function autoGenerate(count = 3) {
  const candidates = generateVariantDishes(count);
  const generated = [];

  for (const dish of candidates) {
    const result = addDish(dish);
    if (result.ok) generated.push(result.dish);
  }

  const strategy = generated.length > 0
    ? `从 ${candidates.length} 个候选中选了 ${generated.length} 道`
    : '种子库已全部生成，本轮跳过';

  return { generated, strategy };
}

module.exports = { autoGenerate };



// ==== 内联 seed.js ====


// ==== 内联 dishes.js ====


// ==== 内联 autoGenerate.js ====


// ==== collect.sh 逻辑 ====
const command = process.argv[2];

switch (command) {
  case 'add': {
    const name = process.argv[3];
    const opts = parseArgs(process.argv.slice(4));
    const dish = {
      name: name || '未命名菜品',
      category: opts.category || '其他',
      tags: opts.tags ? opts.tags.split(',') : [],
      ingredients: opts.ingredients ? opts.ingredients.split(',') : [],
      prepTime: opts.prepTime ? parseInt(opts.prepTime) : 30,
      difficulty: opts.difficulty || '简单',
    };
    const result = addDish(dish);
    console.log(result.ok ? `✅ 已添加「${result.dish.name}」到待确认列表` : `❌ ${result.error}`);
    break;
  }
  case 'list-pending': {
    const pending = getPending();
    console.log(formatPending(pending));
    break;
  }
  case 'confirm': {
    const target = process.argv[3];
    const result = confirmPending(target);
    if (result.ok) {
      const msg = result.message || `已确认「${result.dish.name}」→ 加入菜品库`;
      console.log(`✅ ${msg}`);
    } else {
      console.log(`❌ ${result.error}`);
    }
    break;
  }
  case 'reject': {
    const target = process.argv[3];
    const result = rejectPending(target);
    if (result.ok) {
      const msg = result.message || `已拒绝「${result.dish.name}」`;
      console.log(`✅ ${msg}`);
    } else {
      console.log(`❌ ${result.error}`);
    }
    break;
  }
  case 'confirm-all': {
    const result = confirmAll();
    console.log(result.ok ? `✅ ${result.message}` : `❌ ${result.error}`);
    break;
  }
  case 'reject-all': {
    const result = rejectAll();
    console.log(result.ok ? `✅ ${result.message}` : `❌ ${result.error}`);
    break;
  }
  case 'auto-generate': {
    const count = parseInt(process.argv[3]) || 3;
    const result = autoGenerate(count);
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  default:
    console.log('Usage: collect.sh {add|list-pending|confirm|reject|confirm-all|reject-all|auto-generate}');
}

function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      result[key] = args[i + 1] !== undefined ? args[i + 1] : true;
      if (args[i + 1] !== undefined) i++;
    }
  }
  return result;
}
JAVASCRIPT_EOF

node "$TMP_SCRIPT" "$@"
