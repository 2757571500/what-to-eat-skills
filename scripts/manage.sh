#!/bin/bash
# manage.sh - 日常管理脚本

DIR="$(cd "$(dirname "$0")/lib" && pwd)"

node -e "
const { recordEat, deleteDish, formatStats, getAllDishes } = require('$DIR/dishes.js');

const command = process.argv[2];
const target = process.argv[3];

switch (command) {
  case 'eat': {
    const result = recordEat(target);
    console.log(result.message);
    break;
  }
  case 'delete': {
    const result = deleteDish(target);
    console.log(result.message);
    break;
  }
  case 'stats': {
    const dishes = getAllDishes();
    console.log(formatStats(dishes));
    break;
  }
  case 'list': {
    const dishes = getAllDishes();
    console.log(JSON.stringify(dishes, null, 2));
    break;
  }
  default:
    console.log('Usage: manage.sh {eat|delete|stats|list} [name]');
}
"
