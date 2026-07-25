#!/usr/bin/env node
/**
 * server.js - 静态文件服务器
 * 解决 file:// 协议下 Fetch API 无法加载本地 JSON 的问题
 *
 * 使用共享库：scripts/lib/data-accessor.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2]) || 3000;

// Node.js v22+ 自动提供 __filename 和 __dirname
// 如果需要兼容旧版本，取消下面注释：
// const __filename = path.resolve(process.argv[1]);
// const __dirname = path.dirname(__filename);

// 定位到共享库目录
// 当前脚本在 what-to-eat-visualize/scripts/server.js
// 共享库在 what-to-eat-skills/scripts/lib/
const SHARED_LIB_DIR = path.resolve(__dirname, '../../scripts/lib');

// 加载共享库
const { DataAccessor } = require(path.join(SHARED_LIB_DIR, 'data-accessor.js'));

// 使用 DataAccessor 获取数据文件路径
const dataAccessor = new DataAccessor();
const DISHES_FILE = dataAccessor.getDataPath();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
};

function resolvePath(url) {
  if (url === '/') return path.join(__dirname, 'web', 'index.html');
  if (url.startsWith('/data/')) return DISHES_FILE;  // 直接使用全局数据文件
  return path.join(__dirname, 'web', url.slice(1));
}

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 未找到');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('🍳 菜品可视化页面已启动');
  console.log('   打开 http://localhost:' + PORT);
  console.log('   按 Ctrl+C 停止');
});
