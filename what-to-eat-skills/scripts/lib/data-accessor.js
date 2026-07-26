/**
 * data-accessor.js — 统一数据访问层（共享库）
 * 职责：配置管理、数据路径解析（三级优先级）、自动初始化、文件读写
 *
 * 设计原则：
 * - 三级优先级：命令行参数 > config.json > 默认路径
 * - 单例模式：确保 config.json 只创建一次
 * - 跨平台：使用 os.homedir() + path.join()
 * - 自动初始化：首次运行时自动创建配置和数据文件
 * - config.json 位置：what-to-eat-skills/config.json
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class DataAccessor {
  constructor(overridePath = null) {
    // skill 目录（__dirname 是 scripts/lib/，所以需要上一级）
    this.skillDir = path.resolve(__dirname, '..');

    // config.json 路径：what-to-eat-skills/config.json
    this.skillConfigPath = path.join(this.skillDir, 'config.json');

    // 默认配置目录：~/.what-to-eat/
    this.configDir = path.join(os.homedir(), '.what-to-eat');
    this.configFile = path.join(this.configDir, 'config.json');
    this.dataDir = path.join(this.configDir, 'data');

    // 优先级 0：全局变量（由脚本设置，最高优先级）
    const globalPath = global.__WHAT_TO_EAT_OVERRIDE_PATH__;
    if (globalPath) {
      this.dataPath = this.resolvePath(globalPath);
      this.ensureInitialized();
      return;
    }

    // 优先级 1：显式参数
    if (overridePath) {
      this.dataPath = this.resolvePath(overridePath);
      this.ensureInitialized();
      return;
    }

    // 解析数据路径（按优先级）
    this.dataPath = this.resolveDataPath(null);

    // 确保数据目录存在
    this.ensureInitialized();
  }

  /**
   * 解析数据路径（三级优先级）
   * 1. overridePath（命令行参数，最高优先级）
   * 2. config.json（skill 目录或默认目录）
   * 3. 默认路径 ~/.what-to-eat/data/dishes.json
   */
  resolveDataPath(overridePath) {
    // 优先级 1：命令行参数
    if (overridePath) {
      return this.resolvePath(overridePath);
    }

    // 优先级 2：skill 目录中的 config.json
    if (fs.existsSync(this.skillConfigPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(this.skillConfigPath));
        if (config.dataPath) {
          return this.resolvePath(config.dataPath);
        }
      } catch (error) {
        console.error('⚠️  读取 skill config.json 失败:', error.message);
        // 继续尝试其他配置源
      }
    }

    // 优先级 2b：默认目录的 config.json
    if (fs.existsSync(this.configFile)) {
      try {
        const config = JSON.parse(fs.readFileSync(this.configFile));
        if (config.dataPath) {
          return this.resolvePath(config.dataPath);
        }
      } catch (error) {
        console.error('⚠️  读取默认 config.json 失败:', error.message);
        // 继续使用默认路径
      }
    }

    // 优先级 3：默认路径
    return path.join(this.dataDir, 'dishes.json');
  }

  /**
   * 解析路径（支持绝对路径、相对路径、文件名）
   */
  resolvePath(dataPath) {
    // 绝对路径 → 直接使用
    if (path.isAbsolute(dataPath)) {
      return dataPath;
    }

    // 相对路径 → 相对于 skill 目录
    if (dataPath.startsWith('./') || dataPath.startsWith('../')) {
      return path.resolve(this.skillDir, dataPath);
    }

    // 文件名 → 使用默认目录
    return path.join(this.dataDir, dataPath);
  }

  /**
   * 确保配置和数据目录存在（幂等操作）
   * 如果已存在，不修改任何文件
   */
  ensureInitialized() {
    // 确保数据目录存在
    const dataDirPath = path.dirname(this.dataPath);
    if (!fs.existsSync(dataDirPath)) {
      fs.mkdirSync(dataDirPath, { recursive: true });
    }

    // 如果数据文件不存在，创建初始文件
    if (!fs.existsSync(this.dataPath)) {
      const initialData = {
        dishes: [],
      };
      fs.writeFileSync(this.dataPath, JSON.stringify(initialData, null, 2));
    }

    // 如果 config.json 不存在，创建默认配置
    if (!fs.existsSync(this.configFile)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      const config = {
        dataPath: './data/dishes.json',
        createdAt: new Date().toISOString(),
        version: '2.0.0',
      };
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      console.log('✅ 已初始化数据目录: ' + this.configDir);
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
      const raw = fs.readFileSync(filePath);
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

      if (process.env.DEBUG === 'what-to-eat') {
        console.error('[debug] writeJSON:', { filePath, dataSize: json.length, dataPreview: json.substring(0, 100) });
      }

      const tempFile = filePath + '.tmp';
      fs.writeFileSync(tempFile, json);
      fs.renameSync(tempFile, filePath);

      if (process.env.DEBUG === 'what-to-eat') {
        const verify = fs.readFileSync(filePath);
        console.error('[debug] writeJSON verified:', { fileSize: verify.length });
      }
    } catch (error) {
      console.error('❌ 写入 JSON 文件失败:', filePath, error.message);
      process.exit(1);
    }
  }

  /**
   * 获取数据文件完整路径
   * @returns {string} 数据文件路径
   */
  getDataPath() {
    return this.dataPath;
  }

  /**
   * 获取 pending.json 完整路径
   * 基于数据文件名派生（data/dishes.json → data/pending.json）
   * @returns {string} pending.json 路径
   */
  getPendingPath() {
    const dataFileName = path.basename(this.dataPath);
    const ext = path.extname(dataFileName);
    const baseName = ext ? dataFileName.slice(0, -ext.length) : dataFileName;
    return path.join(path.dirname(this.dataPath), baseName + '-pending.json');
  }

  /**
   * 验证配置文件完整性
   * @returns {boolean} 配置是否有效
   */
  validateConfig() {
    try {
      if (!fs.existsSync(this.skillConfigPath) && !fs.existsSync(this.configFile)) {
        return false;
      }

      const configPath = fs.existsSync(this.skillConfigPath) ? this.skillConfigPath : this.configFile;
      const config = JSON.parse(fs.readFileSync(configPath));

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

  /**
   * 获取当前配置信息（用于调试）
   */
  getConfigInfo() {
    return {
      skillDir: this.skillDir,
      skillConfigPath: this.skillConfigPath,
      configDir: this.configDir,
      configFile: this.configFile,
      dataDir: path.dirname(this.dataPath),
      dataPath: this.dataPath,
    };
  }
}

// ── 导出 ──────────────────────────────────────

module.exports = {
  DataAccessor,
};
