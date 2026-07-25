---
name: what-to-eat-collect
description: 菜品收集能力 - 支持手动录入菜品、查看待确认列表、确认/拒绝菜品、AI 自动生成新菜品。所有菜品先进入待确认队列，经人工确认后正式入库。
version: "1.0.0"
---

# what-to-eat-collect

## 文档位置

完整功能文档位于：[docs/collect.md](../../docs/collect.md)

## 快速分发

当用户提出菜品收集相关请求时：
1. 识别意图：用户想添加/查看/确认/拒绝菜品，或生成新菜品
2. 读取文档：[docs/collect.md](../../docs/collect.md)
3. 执行命令：调用 `scripts/collect.sh` 对应子命令
4. 格式化输出：返回结果给用户

## 触发条件

- 用户添加/录入新菜品
- 用户查看待确认列表
- 用户确认或拒绝菜品
- 用户请求 AI 生成新菜品
