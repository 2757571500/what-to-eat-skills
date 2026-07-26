/**
 * dishes.js — 数据读写层（共享库）
 * 职责：JSON 文件 CRUD、菜品字段校验、数据迁移
 *
 * 依赖：
 * - 通过 require('./data-accessor.js') 获取 DataAccessor
 */

const fs = require('fs');
const { DataAccessor } = require('./data-accessor.js');

// 延迟初始化 DataAccessor（支持动态环境变量）
let dataAccessor = null;

function getDataAccessor() {
  if (!dataAccessor) {
    dataAccessor = new DataAccessor();
  }
  return dataAccessor;
}

// 支持重置 DataAccessor（用于测试或动态配置）
function resetDataAccessor() {
  dataAccessor = null;
}

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

// ── 防重复校验 ──────────────────────────────────

/**
 * 检查菜品名称是否已存在于正式库或待确认列表
 * 比较前对 name 做 trim() 归一化
 * @param {string} name - 菜品名称
 * @returns {boolean} 已存在返回 true
 */
function dishExists(name) {
  if (!name || typeof name !== 'string') return false;
  const target = name.trim();
  if (!target) return false;
  const inDishes = getAllDishes().some(d => d.name && d.name.trim() === target);
  if (inDishes) return true;
  return getPending().some(d => d.name && d.name.trim() === target);
}

// ── 数据访问 ──────────────────────────────────

function getAllDishes() {
  const data = readJSON(getDataAccessor().getDataPath());
  // 支持两种格式：{ dishes: [...] } 或 [...]
  return Array.isArray(data) ? data : (data.dishes || []);
}

function saveDishes(dishes) {
  const filePath = getDataAccessor().getDataPath();
  writeJSON(filePath, { dishes });
}

function getPending() {
  const data = readJSON(getDataAccessor().getPendingPath());
  // 支持两种格式：{ pending: [...] } 或 [...]
  return Array.isArray(data) ? data : (data.pending || []);
}

function savePending(pending) {
  const filePath = getDataAccessor().getPendingPath();
  // 保存为标准格式 { pending: [...] }
  const data = { pending };
  // 调试输出
  if (process.env.DEBUG === 'what-to-eat') {
    console.error('[debug] savePending:', { filePath, pendingCount: pending.length });
  }
  writeJSON(filePath, data);
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
  const entry = normalizeDish(dish);
  if (!entry) return { ok: false, error: '无效菜品数据' };
  // 防重复校验：检查正式库和待确认列表
  if (dishExists(entry.name)) {
    return { ok: false, error: '菜品「' + entry.name + '」已存在' };
  }
  const pending = getPending();
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
  let count = 0;
  while (getPending().length > 0) {
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
  // 数据访问
  getAllDishes, saveDishes, getPending, savePending,
  movePendingToDishes, removePending,
  // CRUD 操作
  addDish, recordEat, deleteDish,
  // 防重复校验
  dishExists,
  // 待确认队列操作
  confirmPending, rejectPending, confirmAll, rejectAll,
  // 格式化输出
  formatPending, formatStats,
  // 工具函数
  readJSON, writeJSON, today, pickRandom, randInt, daysSince, normalizeDish,
  // DataAccessor 管理
  getDataAccessor, resetDataAccessor,
};
