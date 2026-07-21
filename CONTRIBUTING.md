# 贡献指南

## 开发环境

1. Clone 仓库
2. 确保 Node.js 已安装（v14+）
3. 无需其他依赖

## 修改源码

所有 skill 的脚本都是**生成**的，不要直接修改生成的文件。

### 源码位置

```
.scripts/
├── lib/                    ← JS 源码
│   ├── data-accessor.js    ← 数据访问层
│   ├── seed.js             ← 种子数据
│   ├── dishes.js           ← 数据 CRUD
│   ├── autoGenerate.js     ← AI 生成
│   └── recommend.js        ← 推荐算法
└── *.template              ← 脚本模板
```

### 构建流程

修改源码后，运行构建脚本生成自包含版本：

```bash
# 生成所有 skill 的脚本
node build.js

# 验证生成的文件
node build.js --collect   # 仅测试 collect
```

### 构建原理

`build.js` 会：
1. 读取 `.scripts/lib/*.js` 源码
2. 读取 `.scripts/*.template` 模板
3. 合并为自包含脚本（内联所有 JS 代码）
4. 写入各 skill 的 `scripts/` 目录

## 提交前检查

```bash
# 1. 构建
node build.js

# 2. 测试核心功能
bash what-to-eat-collect/scripts/collect.sh add "测试"
bash what-to-eat-manage/scripts/manage.sh stats
bash what-to-eat-recommend/scripts/recommend.sh recommend

# 3. 确认无跨 skill 依赖
grep -r "require('./" what-to-eat-*/scripts/
# 应该只输出 require('fs') 等内置模块
```

## 代码规范

- JS 代码使用 2 空格缩进
- 函数名使用 camelCase
- 添加新功能时同步更新对应的 SKILL.md
