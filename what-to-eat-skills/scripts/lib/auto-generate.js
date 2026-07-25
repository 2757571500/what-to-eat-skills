/**
 * auto-generate.js — AI 菜品生成器（共享库）
 * 职责：从种子库或组合变体中生成新菜品写入待确认队列
 *
 * 依赖：
 * - require('./dishes.js') - 菜品数据操作
 * - require('./seed.js') - 种子数据
 */

const { addDish, getAllDishes, getPending, pickRandom, randInt } = require('./dishes.js');
const { SEED_DISHES, DIFFICULTIES, CATEGORIES } = require('./seed.js');

// ── 菜品变体生成器 ─────────────────────────────

const VARIANT_PREFIXES = ['香煎', '蒜蓉', '清炒', '红烧', '干锅', '酱爆', '葱姜', '豉汁', '爆炒', '糖醋'];
const VARIANT_INGREDIENTS = ['豆腐', '鸡腿', '虾仁', '牛肉', '茄子', '蘑菇', '西兰花', '豆角', '鲈鱼', '猪排', '鱿鱼', '丝瓜'];

const RANDOM_TAGS = [['快手', '下饭'], ['清淡', '家常'], ['荤菜', '下饭'], ['素食', '快手'], ['酸甜', '家常']];

/**
 * 生成变体菜品
 * @param {number} count - 要生成的数量
 * @returns {Array} 变体菜品列表
 */
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

// ── 导出 ──────────────────────────────────────

module.exports = {
  autoGenerate,
  generateVariantDishes,
};
