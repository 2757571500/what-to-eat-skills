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
const { confirmPending, rejectPending } = require(path.join(SHARED_LIB_DIR, 'dishes.js'));

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
  if (url.startsWith('/data/')) return '__DATA_API__';  // 特殊标记，合并 dishes + pending
  return path.join(__dirname, 'web', url.slice(1));
}

function serveDataJson(res) {
  try {
    // 每次请求动态创建 DataAccessor 获取最新路径，配置变更后无需重启
    const da = new DataAccessor();
    const dishesFile = da.getDataPath();
    const pendingFile = da.getPendingPath();

    const dishesData = JSON.parse(fs.readFileSync(dishesFile, 'utf-8'));
    const dishes = Array.isArray(dishesData) ? dishesData : (dishesData.dishes || []);

    let pending = [];
    if (fs.existsSync(pendingFile)) {
      const pendingData = JSON.parse(fs.readFileSync(pendingFile, 'utf-8'));
      pending = Array.isArray(pendingData) ? pendingData : (pendingData.pending || []);
    }

    const merged = { dishes, pending };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(merged));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 数据读取失败');
  }
}

function handleApiRequest(req, res, url, server) {
  // POST /api/confirm?index=N — 确认第 N 个待确认菜品
  if (url.pathname === '/api/confirm' && req.method === 'POST') {
    const index = url.searchParams.get('index');
    if (index === null) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: '缺少 index 参数' }));
      return true;
    }
    const result = confirmPending(index);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result));
    return true;
  }

  // POST /api/reject?index=N — 拒绝第 N 个待确认菜品
  if (url.pathname === '/api/reject' && req.method === 'POST') {
    const index = url.searchParams.get('index');
    if (index === null) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: '缺少 index 参数' }));
      return true;
    }
    const result = rejectPending(index);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result));
    return true;
  }

  // POST /api/reload — 通知服务器重新读取配置（动态读取已生效，此端点供外部系统确认）
  if (url.pathname === '/api/reload' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, message: '配置已重新加载' }));
    return true;
  }

  // POST /api/shutdown — 优雅关闭服务器
  if (url.pathname === '/api/shutdown' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, message: '服务器正在关闭' }));
    server.close();
    return true;
  }

  return false;
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);

  // 先检查 API 请求（POST /api/confirm, POST /api/reject, POST /api/reload, POST /api/shutdown）
  if (handleApiRequest(req, res, parsedUrl, server)) return;

  const resolved = resolvePath(req.url);

  if (resolved === '__DATA_API__') {
    serveDataJson(res);
    return;
  }

  const ext = path.extname(resolved);

  fs.readFile(resolved, (err, data) => {
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
