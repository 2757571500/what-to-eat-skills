#!/bin/bash
# recommend.sh - 菜品推荐脚本

DIR="$(cd "$(dirname "$0")/lib" && pwd)"

node -e "
const { recommendRotation, recommendRandom, recommendFiltered, recommendWeighted, formatRecommendation, getAllDishes } = require('$DIR/recommend.js');
const { parseArgs } = require('$DIR/dishes.js');

const args = process.argv.slice(2);
const opts = parseArgs(args);
const strategy = opts.strategy || 'rotation';
const dishes = getAllDishes();

let result;
switch (strategy) {
  case 'random':
    result = recommendRandom(dishes);
    break;
  case 'filter':
    result = recommendFiltered(dishes, opts);
    break;
  case 'weighted':
    result = recommendWeighted(dishes, opts);
    break;
  default:
    result = recommendRotation(dishes);
}

console.log(formatRecommendation(result, dishes, strategy));
"
