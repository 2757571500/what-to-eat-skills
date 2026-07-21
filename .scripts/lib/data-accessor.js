/**
 * data-accessor.js — 统一数据访问层
 * 职责：全局配置管理、数据路径解析、自动初始化
 *
 * 设计原则：
 * - 单例模式：确保 config.json 只创建一次
 * - 跨平台：使用 os.homedir() + path.join()
 * - 自动初始化：首次运行时自动创建配置和数据文件
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class DataAccessor {
  constructor() {
    // 全局配置目录：~/.what-to-eat/
    this.configDir = path.join(os.homedir(), '.what-to-eat');

    // 配置文件：~/.what-to-eat/config.json
    this.configFile = path.join(this.configDir, 'config.json');

    // 数据目录：~/.what-to-eat/data/
    this.dataDir = path.join(this.configDir, 'data');

    // 执行初始化（Singleton 保证）
    this.ensureInitialized();
  }

  /**
   * 确保配置和数据目录存在（幂等操作）
   * 如果已存在，不修改任何文件
   */
  ensureInitialized() {
    // 如果配置已存在，跳过初始化
    if (fs.existsSync(this.configFile)) {
      return;
    }

    // 创建目录结构
    fs.mkdirSync(this.dataDir, { recursive: true });

    // 创建 config.json
    // dataPath 是相对于 dataDir 的路径，所以这里只需要文件名
    const config = {
      dataPath: 'dishes.json',
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    };
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), 'utf-8');

    // 创建初始数据文件
    const initialData = {
      dishes: [],
      pending: [],
    };
    fs.writeFileSync(
      path.join(this.dataDir, 'dishes.json'),
      JSON.stringify(initialData, null, 2),
      'utf-8'
    );

    // 输出初始化消息（仅在真正初始化时）
    console.log('✅ 已初始化数据目录: ' + this.configDir);
  }

  /**
   * 从 config.json 解析数据文件路径
   * @returns {string}  dishes.json 的完整路径
   */
  getDataPath() {
    try {
      const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));

      // 验证必需字段
      if (!config.dataPath) {
        throw new Error('config.json 缺少 dataPath 字段');
      }

      // 返回完整路径（支持相对路径和绝对路径）
      if (path.isAbsolute(config.dataPath)) {
        return config.dataPath;
      } else {
        return path.join(this.dataDir, config.dataPath);
      }
    } catch (error) {
      console.error('❌ 读取配置文件失败:', error.message);
      console.error('   配置文件位置:', this.configFile);
      console.error('   请检查 config.json 格式是否正确');
      process.exit(1);
    }
  }

  /**
   * 读取 JSON 文件
   * @param {string} filePath - 文件路径
   * @returns {Array|Object} 解析后的 JSON 数据，失败返回空数组
   */
  readJSON(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (error) {
      console.error('❌ 读取 JSON 文件失败:', filePath, error.message);
      return [];
    }
  }

  /**
   * 写入 JSON 文件（原子写操作）
   * @param {string} filePath - 文件路径
   * @param {Array|Object} data - 要写入的数据
   */
  writeJSON(filePath, data) {
    try {
      const json = JSON.stringify(data, null, 2);

      // 原子写：先写临时文件，然后重命名
      const tempFile = filePath + '.tmp';
      fs.writeFileSync(tempFile, json, 'utf-8');
      fs.renameSync(tempFile, filePath);
    } catch (error) {
      console.error('❌ 写入 JSON 文件失败:', filePath, error.message);
      process.exit(1);
    }
  }

  /**
   * 获取 pending.json 路径
   * @returns {string} pending.json 的完整路径
   */
  getPendingPath() {
    const dataPath = this.getDataPath();
    return path.join(path.dirname(dataPath), 'pending.json');
  }

  /**
   * 验证配置文件完整性
   * @returns {boolean} 配置是否有效
   */
  validateConfig() {
    try {
      if (!fs.existsSync(this.configFile)) {
        return false;
      }

      const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));

      // 检查必需字段
      if (!config.dataPath) {
        console.error('❌ 配置文件缺少 dataPath 字段');
        return false;
      }

      if (!config.version) {
        console.warn('⚠️  配置文件缺少 version 字段');
      }

      return true;
    } catch (error) {
      console.error('❌ 配置文件格式错误:', error.message);
      return false;
    }
  }
}

// ── 导出 ──────────────────────────────────────

// 创建全局单例（内联模式下直接使用）
const dataAccessor = new DataAccessor();

// 供其他模块使用的路径常量
const DISHES_FILE = dataAccessor.getDataPath();
const PENDING_FILE = dataAccessor.getPendingPath();

module.exports = {
  DataAccessor,
  dataAccessor,
  DISHES_FILE,
  PENDING_FILE,
};
