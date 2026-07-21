#!/usr/bin/env node
/**
 * server.js — 静态文件服务器
 * 解决 file:// 协议下 Fetch API 无法加载本地 JSON 的问题
 *
 * 用法: bash skills/scripts/visualize.sh [端口]
 * 默认端口: 3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2]) || 3000;
const ROOT = path.resolve(__dirname, '..');

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
  if (url === '/') return path.join(ROOT, 'web', 'index.html');
  if (url.startsWith('/data/')) return path.join(ROOT, url.slice(1));
  return path.join(ROOT, 'web', url.slice(1));
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
  console.log(`🍳 菜品可视化页面已启动`);
  console.log(`   打开 http://localhost:${PORT}`);
  console.log(`   按 Ctrl+C 停止`);
});
