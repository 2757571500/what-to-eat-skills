/**
 * seed.js — 种子数据（共享库）
 * 职责：提供分类、标签、难度等枚举值，以及示例菜品
 */

// ── 枚举值 ──────────────────────────────────

/**
 * 菜品分类
 */
const CATEGORIES = [
  '家常菜',
  '川菜',
  '凉菜',
  '汤',
  '主食',
  '粤菜',
  '甜品',
  '其他',
];

/**
 * 难度等级
 */
const DIFFICULTIES = ['简单', '中等', '困难'];

/**
 * 常见标签
 */
const ALL_TAGS = [
  '快手',
  '下饭',
  '清淡',
  '麻辣',
  '素食',
  '荤菜',
  '汤羹',
  '酸甜',
  '主食',
  '酸辣',
  '甜',
];

// ── 种子菜品库 ─────────────────────────────

/**
 * 初始待探索的 26 道菜
 * AI 生成菜品时从这里采样
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

// ── 导出 ──────────────────────────────────────

module.exports = {
  SEED_DISHES,
  DIFFICULTIES,
  CATEGORIES,
  ALL_TAGS,
};
