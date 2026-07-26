## ADDED Requirements

### Requirement: addDish 防重复校验

`addDish` 函数在将菜品写入待确认列表前，MUST 检查菜品名称是否已存在于正式库或待确认列表中。若已存在，MUST 返回 `{ ok: false, error: '菜品「<名称>」已存在' }` 且不写入数据。

#### Scenario: 正式库已有同名菜品时拒绝添加

- **WHEN** 正式库中已有名为「冬瓜排骨汤」的菜品，用户执行 `addDish({ name: '冬瓜排骨汤' })`
- **THEN** 返回 `{ ok: false, error: '菜品「冬瓜排骨汤」已存在' }`，正式库和待确认列表均不发生变化

#### Scenario: 待确认列表已有同名菜品时拒绝添加

- **WHEN** 待确认列表中已有名为「红烧肉」的菜品，用户执行 `addDish({ name: '红烧肉' })`
- **THEN** 返回 `{ ok: false, error: '菜品「红烧肉」已存在' }`，待确认列表不新增重复条目

#### Scenario: 新菜品成功添加到待确认列表

- **WHEN** 正式库和待确认列表中均不存在名为「酸菜鱼」的菜品，用户执行 `addDish({ name: '酸菜鱼', category: '川菜' })`
- **THEN** 返回 `{ ok: true, dish: { name: '酸菜鱼', category: '川菜', ... } }`，待确认列表新增一条记录

### Requirement: dishExists 公共函数

系统 SHALL 提供公共函数 `dishExists(name)`，检查指定名称的菜品是否已存在于正式库或待确认列表。比较前 MUST 对名称做 `trim()` 归一化处理。该函数 MUST 导出供 `addDish` 和 `auto-generate` 共用。

#### Scenario: 检查正式库和待确认列表

- **WHEN** 正式库有「番茄炒蛋」，待确认列表有「水煮鱼」，调用 `dishExists('番茄炒蛋')`
- **THEN** 返回 `true`

#### Scenario: 名称归一化比较

- **WHEN** 正式库有「番茄炒蛋」，调用 `dishExists('  番茄炒蛋  ')`（含前后空格）
- **THEN** 返回 `true`（trim 后匹配）

#### Scenario: 不存在的菜品

- **WHEN** 正式库和待确认列表均无「不存在的菜」，调用 `dishExists('不存在的菜')`
- **THEN** 返回 `false`

### Requirement: auto-generate 复用 dishExists

`auto-generate.js` 的 `generateVariantDishes` 函数 SHALL 使用 `dishExists` 公共函数替代内部 `used` 集合逻辑，确保防重复判断标准一致。

#### Scenario: 生成菜品时使用 dishExists 过滤

- **WHEN** 正式库已有「红烧豆腐」，执行 `autoGenerate(3)`
- **THEN** 生成的候选菜品中不包含「红烧豆腐」，且 `dishExists` 被调用来判断每个候选是否重复
