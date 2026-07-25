---
name: what-to-eat-recommend
description: 菜品推荐能力 - 支持轮换优先、随机抽签、条件筛选、加权推荐、统计概览等多种推荐方式。帮助用户快速决定今天吃什么。
version: "1.0.0"
---

# what-to-eat-recommend

## 文档位置

完整功能文档位于：[docs/recommend.md](../../docs/recommend.md)

## 快速分发

当用户提出菜品推荐相关请求时：
1. 识别意图：用户想推荐/随机/筛选/统计菜品
2. 读取文档：[docs/recommend.md](../../docs/recommend.md)
3. 执行命令：调用 `scripts/recommend.sh` 对应子命令
4. 格式化输出：返回结果给用户

## 触发条件

- 用户请求推荐菜品（"今天吃什么"、"推荐个菜"）
- 用户要求随机推荐（"随便来个"、"随机抽一个"）
- 用户需要条件筛选（"推荐个川菜"、"15分钟能做完的"）
- 用户查询统计信息（"多少道菜"、"菜品库"）
