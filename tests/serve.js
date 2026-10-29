// Static server for Lighthouse that gzips like GitHub Pages does, so scores match production.
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2] || 8790);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(root, path.normalize(name).replace(/^(\.\.[/\\])+/, ''), name.endsWith('/') ? 'index.html' : '');
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  const type = types[path.extname(file)] || 'application/octet-stream';
  const body = fs.readFileSync(file);
  const gzip = /gzip/.test(req.headers['accept-encoding'] || '') && !type.startsWith('image/');
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'max-age=600', ...(gzip ? { 'Content-Encoding': 'gzip' } : {}) });
  res.end(gzip ? zlib.gzipSync(body) : body);
}).listen(port, () => console.log(`Serving HTTP on ${port}`));
