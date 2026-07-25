---
name: what-to-eat-manage
description: 日常管理能力 - 支持记录食用菜品、删除菜品等日常维护操作。帮助用户管理菜品库的日常使用记录。
version: "1.0.0"
---

# what-to-eat-manage

## 文档位置

完整功能文档位于：[docs/manage.md](../../docs/manage.md)

## 快速分发

当用户提出日常管理相关请求时：
1. 识别意图：用户想记录食用或删除菜品
2. 读取文档：[docs/manage.md](../../docs/manage.md)
3. 执行命令：调用 `scripts/manage.sh` 对应子命令
4. 格式化输出：返回结果给用户

## 触发条件

- 用户记录食用某道菜品（"我吃了红烧肉"、"记录一下吃了麻婆豆腐"）
- 用户删除菜品（"删除番茄炒鸡蛋"、"去掉宫保鸡丁"）
