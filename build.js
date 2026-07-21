#!/usr/bin/env node
/**
 * build.js - 构建脚本
 * 功能：将 scripts/lib/*.js 的代码内联到各个 skill 的脚本中，生成自包含版本
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = __dirname;
const LIB_DIR = path.join(PROJECT_ROOT, '.scripts', 'lib');
const SKILLS_DIR = PROJECT_ROOT;

const LIB_FILES = {
  'DATA_ACCESSOR': path.join(LIB_DIR, 'data-accessor.js'),
  'SEED': path.join(LIB_DIR, 'seed.js'),
  'DISHES': path.join(LIB_DIR, 'dishes.js'),
  'AUTOGENERATE': path.join(LIB_DIR, 'autoGenerate.js'),
  'RECOMMEND': path.join(LIB_DIR, 'recommend.js'),
};

const BUILD_TARGETS = [
  {
    name: 'what-to-eat-collect',
    template: path.join(PROJECT_ROOT, '.scripts', 'collect.sh.template'),
    output: path.join(SKILLS_DIR, 'what-to-eat-collect', 'scripts', 'collect.sh'),
    inline: ['DATA_ACCESSOR', 'SEED', 'DISHES', 'AUTOGENERATE'],
  },
  {
    name: 'what-to-eat-manage',
    template: path.join(PROJECT_ROOT, '.scripts', 'manage.sh.template'),
    output: path.join(SKILLS_DIR, 'what-to-eat-manage', 'scripts', 'manage.sh'),
    inline: ['DATA_ACCESSOR', 'SEED', 'DISHES'],
  },
  {
    name: 'what-to-eat-recommend',
    template: path.join(PROJECT_ROOT, '.scripts', 'recommend.sh.template'),
    output: path.join(SKILLS_DIR, 'what-to-eat-recommend', 'scripts', 'recommend.sh'),
    inline: ['DATA_ACCESSOR', 'SEED', 'DISHES', 'RECOMMEND'],
  },
  {
    name: 'what-to-eat-visualize',
    template: path.join(PROJECT_ROOT, '.scripts', 'visualize.sh.template'),
    output: path.join(SKILLS_DIR, 'what-to-eat-visualize', 'scripts', 'visualize.sh'),
    inline: ['DATA_ACCESSOR'],
    serverTemplate: path.join(PROJECT_ROOT, '.scripts', 'server.js.template'),
    serverOutput: path.join(SKILLS_DIR, 'what-to-eat-visualize', 'scripts', 'server.js'),
  },
];

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ 读取文件失败: ${filePath}`);
    console.error(`   ${error.message}`);
    return null;
  }
}

function writeFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`❌ 写入文件失败: ${filePath}`);
    console.error(`   ${error.message}`);
    return false;
  }
}

function extractAndDedupRequires(codeList) {
  const requires = new Map();
  const builtinModules = ['fs', 'path', 'os', 'http', 'crypto', 'events', 'stream', 'util', 'url', 'zlib'];

  const cleanedCodeList = codeList.map(code => {
    const lines = code.split('\n');
    const cleanedLines = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // 处理 require 语句
      if (trimmed.includes('require(')) {
        const moduleMatch = trimmed.match(/require\(['"]([^'"]+)['"]\)/);
        if (moduleMatch) {
          const moduleName = moduleMatch[1];

          if (builtinModules.includes(moduleName)) {
            if (!requires.has(moduleName)) {
              requires.set(moduleName, trimmed);
            }
            continue;
          }

          if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
            continue;
          }
        }
      }

      // 跳过 dishes.js 中的旧路径声明（由 DataAccessor 提供）
      if (/^const (ROOT|DISHES_FILE|PENDING_FILE)\s*=/.test(trimmed)) {
        continue;
      }

      // 跳过包含 DISHES_FILE 或 PENDING_FILE 的 module.exports 行
      if (/^(DISHES_FILE|PENDING_FILE)/.test(trimmed) && trimmed.endsWith(',')) {
        continue;
      }

      cleanedLines.push(line);
    }

    return cleanedLines.join('\n');
  });

  return {
    requires: Array.from(requires.values()).join(';\n') + ';',
    cleanedCode: cleanedCodeList.join('\n\n'),
  };
}

function generateSelfContained(templatePath, inlineKeys, libFiles) {
  let content = readFile(templatePath);

  if (!content) {
    return null;
  }

  const codeList = [];
  for (const key of inlineKeys) {
    if (!libFiles[key]) {
      console.error(`❌ 缺少库文件: ${key}`);
      return null;
    }
    codeList.push(libFiles[key]);
  }

  const { requires, cleanedCode } = extractAndDedupRequires(codeList);

  // 将旧路径变量替换为 DataAccessor 调用
  const fixedCode = cleanedCode
    .replace(/\bDISHES_FILE\b/g, 'dataAccessor.getDataPath()')
    .replace(/\bPENDING_FILE\b/g, 'dataAccessor.getPendingPath()');

  const finalRequires = requires.replace(/;;/g, ';');

  for (const key of inlineKeys) {
    const placeholder = `{{ ${key} }}`;
    if (content.includes(placeholder)) {
      content = content.replace(placeholder, '');
    }
  }

  const requireMarker = '// ==== 内联 data-accessor.js ====';
  const requireBlock = `${finalRequires}\n\n${fixedCode}`;

  content = content.replace(requireMarker, `${requireMarker}\n${requireBlock}`);

  return content;
}

function cleanGeneratedScripts() {
  console.log('🧹 清理生成的脚本...\n');

  let cleaned = 0;

  for (const target of BUILD_TARGETS) {
    if (fs.existsSync(target.output)) {
      fs.unlinkSync(target.output);
      console.log(`  删除: ${path.relative(PROJECT_ROOT, target.output)}`);
      cleaned++;
    }

    if (target.serverOutput && fs.existsSync(target.serverOutput)) {
      fs.unlinkSync(target.serverOutput);
      console.log(`  删除: ${path.relative(PROJECT_ROOT, target.serverOutput)}`);
      cleaned++;
    }
  }

  console.log(`\n✅ 已清理 ${cleaned} 个文件`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--clean')) {
    cleanGeneratedScripts();
    return;
  }

  const targetFilter = args.find(arg => !arg.startsWith('--'));

  console.log('🔨 构建自包含脚本\n');

  console.log('📖 读取源文件...');
  const libFiles = {};

  for (const [key, filePath] of Object.entries(LIB_FILES)) {
    const content = readFile(filePath);
    if (!content) {
      console.error(`\n❌ 构建失败: 缺少源文件 ${filePath}`);
      process.exit(1);
    }
    libFiles[key] = content;
    console.log(`  ✓ ${path.basename(filePath)} (${content.split('\n').length} 行)`);
  }

  console.log('');

  let built = 0;

  for (const target of BUILD_TARGETS) {
    if (targetFilter && target.name !== targetFilter) {
      continue;
    }

    console.log(`📦 构建 ${target.name}...`);

    const scriptContent = generateSelfContained(target.template, target.inline, libFiles);

    if (!scriptContent) {
      console.error(`  ❌ 构建失败\n`);
      continue;
    }

    const success = writeFile(target.output, scriptContent);

    if (success) {
      console.log(`  ✓ ${path.relative(PROJECT_ROOT, target.output)} (${scriptContent.split('\n').length} 行)`);
      built++;
    }

    if (target.serverTemplate && target.serverOutput) {
      const serverContent = generateSelfContained(target.serverTemplate, ['DATA_ACCESSOR'], libFiles);

      if (serverContent) {
        const serverSuccess = writeFile(target.serverOutput, serverContent);
        if (serverSuccess) {
          console.log(`  ✓ ${path.relative(PROJECT_ROOT, target.serverOutput)} (${serverContent.split('\n').length} 行)`);
          built++;
        }
      }
    }

    console.log('');
  }

  console.log('─'.repeat(50));
  console.log(`✅ 构建完成: ${built} 个文件已生成\n`);

  if (built === 0) {
    console.log('ℹ️  没有生成任何文件');
    if (targetFilter) {
      console.log(`   未找到 skill: ${targetFilter}`);
      console.log('   可用的 skill: what-to-eat-collect, what-to-eat-manage, what-to-eat-recommend, what-to-eat-visualize');
    }
  }
}

main();
