#!/bin/bash
# collect.sh - 菜品收集脚本

DIR="$(cd "$(dirname "$0")/lib" && pwd)"

node -e "
const { addDish, getPending, confirmPending, rejectPending, confirmAll, rejectAll, autoGenerate, formatPending } = require('$DIR/dishes.js');
const { generateVariantDishes } = require('$DIR/autoGenerate.js');

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
    console.log(result.message);
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
    console.log(result.message);
    break;
  }
  case 'reject': {
    const target = process.argv[3];
    const result = rejectPending(target);
    console.log(result.message);
    break;
  }
  case 'confirm-all': {
    const result = confirmAll();
    console.log(result.message);
    break;
  }
  case 'reject-all': {
    const result = rejectAll();
    console.log(result.message);
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
"
