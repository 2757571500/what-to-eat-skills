/**
 * dishes.js — 数据读写层
 * 职责：JSON 文件 CRUD、菜品字段校验、数据迁移
 */

const fs = require('fs');
const path = require('path');
const { SEED_DISHES, DIFFICULTIES, CATEGORIES, ALL_TAGS } = require('./seed');

// 项目根目录是 src/ 的上一级（即 WhaToEat/）
const ROOT = path.resolve(__dirname, '..', '..');
const DISHES_FILE = path.join(ROOT, 'data', 'dishes.json');
const PENDING_FILE = path.join(ROOT, 'data', 'pending.json');

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
  return readJSON(DISHES_FILE);
}

function saveDishes(dishes) {
  writeJSON(DISHES_FILE, dishes);
}

function getPending() {
  return readJSON(PENDING_FILE);
}

function savePending(pending) {
  writeJSON(PENDING_FILE, pending);
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

// ── 导出 ──────────────────────────────────────

module.exports = {
  DISHES_FILE, PENDING_FILE,
  readJSON, writeJSON,
  today, pickRandom, randInt, daysSince, normalizeDish,
  getAllDishes, saveDishes, getPending, savePending,
  movePendingToDishes, removePending, addDish, recordEat, deleteDish,
  SEED_DISHES, DIFFICULTIES, CATEGORIES, ALL_TAGS,
};
