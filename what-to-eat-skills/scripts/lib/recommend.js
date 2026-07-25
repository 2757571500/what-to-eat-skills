/**
 * recommend.js — 推荐策略层（共享库）
 * 职责：4 种推荐算法的实现
 *
 * 依赖：
 * - 通过 require('./data-accessor.js') 和 require('./dishes.js') 获取数据
 */

const { dataAccessor } = require('./data-accessor.js');
const { getAllDishes, daysSince, pickRandom } = require('./dishes.js');

// ── 推荐策略 ──────────────────────────────────

/**
 * 轮换优先：按 lastEaten 升序，null（没吃过）最优先
 */
function recommendRotation(dishes) {
  if (dishes.length === 0) return null;
  const sorted = [...dishes].sort((a, b) => {
    if (!a.lastEaten && !b.lastEaten) return 0;
    if (!a.lastEaten) return -1;
    if (!b.lastEaten) return 1;
    return new Date(a.lastEaten) - new Date(b.lastEaten);
  });
  return sorted[0];
}

/**
 * 随机抽签：均匀随机选择
 */
function recommendRandom(dishes) {
  if (dishes.length === 0) return null;
  return dishes[Math.floor(Math.random() * dishes.length)];
}

/**
 * 条件筛选：预过滤后轮换优先
 */
function recommendFiltered(dishes, filters = {}) {
  let filtered = [...dishes];
  if (filters.category) {
    filtered = filtered.filter(d => d.category === filters.category);
  }
  if (filters.tag) {
    filtered = filtered.filter(d => d.tags.includes(filters.tag));
  }
  if (filters.ingredient) {
    filtered = filtered.filter(d =>
      d.ingredients.some(i => i.includes(filters.ingredient))
    );
  }
  if (filters.maxTime) {
    filtered = filtered.filter(d => d.prepTime <= parseInt(filters.maxTime));
  }
  if (filters.difficulty) {
    filtered = filtered.filter(d => d.difficulty === filters.difficulty);
  }
  if (filtered.length === 0) return null;
  return recommendRotation(filtered);
}

/**
 * 加权推荐：综合距上次食用天数、食用次数、口味偏好打分
 */
function recommendWeighted(dishes, weights = {}) {
  if (dishes.length === 0) return null;
  const scored = dishes.map(d => {
    let score = 0;
    const days = daysSince(d.lastEaten);
    score += Math.min(days / 7, 10);           // 距上次食用越久分越高（上限10）
    if (!d.lastEaten) score += 5;               // 没吃过加分
    score += Math.max(0, 10 - d.eatCount);      // 吃得越少分越高
    if (weights.flavor && d.tags.some(t => t === weights.flavor)) {
      score += 5;                               // 口味匹配加分
    }
    return { dish: d, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].dish;
}

// ── 格式化输出 ────────────────────────────────

function formatRecommendation(dish, strategy) {
  if (!dish) return '当前没有符合条件的菜品，先用 bash skills/scripts/collect.sh add <名称> 添加一些吧！';
  const days = daysSince(dish.lastEaten);
  const lastEatenStr = dish.lastEaten
    ? `上次食用: ${dish.lastEaten} (距今 ${days} 天)`
    : '还没吃过！';
  return [
    `🍽️  推荐菜品: **${dish.name}**`,
    `━━━━━━━━━━━━━━━━━`,
    `分类: ${dish.category}`,
    `用时: ${dish.prepTime} 分钟`,
    `难度: ${dish.difficulty}`,
    `食材: ${dish.ingredients.join('、')}`,
    `标签: ${dish.tags.join('、')}`,
    `食用历史: ${lastEatenStr} | 已吃 ${dish.eatCount} 次`,
    `━━━━━━━━━━━━━━━━━`,
    `策略: ${strategy}`,
  ].join('\n');
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

function formatDishList(dishes, sortBy = null) {
  if (!dishes || dishes.length === 0) {
    return '🗂️  菜品库 (0 道):\n  暂无菜品';
  }

  let sorted = [...dishes];
  if (sortBy === 'rotation') {
    sorted.sort((a, b) => {
      if (!a.lastEaten && !b.lastEaten) return 0;
      if (!a.lastEaten) return -1;
      if (!b.lastEaten) return 1;
      return new Date(b.lastEaten) - new Date(a.lastEaten);
    });
  } else if (sortBy === 'random') {
    sorted = sorted.sort(() => Math.random() - 0.5);
  }

  const lines = [`🗂️  菜品库 (${sorted.length} 道):\n`];

  sorted.forEach((dish, index) => {
    const days = dish.lastEaten ? daysSince(dish.lastEaten) : null;
    const daysStr = days !== null ? `${days}天前` : '未食用';
    lines.push(`  ${index + 1}. ${dish.name}`);
    lines.push(`     ${dish.category} | ${dish.prepTime}分钟 | ${dish.difficulty} | ${daysStr} | 已吃${dish.eatCount}次`);
  });

  return lines.join('\n');
}

// ── 导出 ──────────────────────────────────────

module.exports = {
  // 推荐策略
  recommendRotation,
  recommendRandom,
  recommendFiltered,
  recommendWeighted,
  // 格式化输出
  formatRecommendation,
  formatStats,
  formatDishList,
};
