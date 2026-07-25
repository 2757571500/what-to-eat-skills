---
name: what-to-eat-visualize
description: 可视化能力 - 启动本地服务器并在浏览器中打开菜品库页面，提供直观的卡片式浏览体验。
version: "1.0.0"
---

# what-to-eat-visualize

## 文档位置

完整功能文档位于：[docs/visualize.md](../../docs/visualize.md)

## 快速分发

当用户提出可视化相关请求时：
1. 识别意图：用户想打开网页查看菜品库
2. 读取文档：[docs/visualize.md](../../docs/visualize.md)
3. 执行命令：调用 `scripts/visualize.sh` 启动服务器
4. 打开浏览器：自动打开 http://localhost:3000

## 触发条件

- 用户请求打开菜品库网页（"打开看看"、"看看菜品库"）
- 用户提到"网页"、"浏览器"、"可视化"、"界面"
