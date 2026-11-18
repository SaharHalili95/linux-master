const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = process.env.SITE_DIR || path.resolve(__dirname, '..');
const V = Number(fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8').match(/linux-master-v(\d+)/)[1]);
const SKIP = new Set(['.git', '.github', '.superpowers', 'tests', 'docs', 'node_modules']);
let dir, server;
const PORT = 8799;
const url = `http://localhost:${PORT}/`;

test.beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lm-update-'));
  fs.cpSync(SRC, dir, { recursive: true, filter: src => !SKIP.has(path.relative(SRC, src).split(path.sep)[0]) });
  // Like GitHub Pages: content-based ETags, so a change is seen however fast it happens.
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
  server = http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, url).pathname).replace(/\/$/, '/index.html');
    const file = path.join(dir, path.normalize(name).replace(/^(\.\.[/\\])+/, ''));
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const body = fs.readFileSync(file), etag = '"' + crypto.createHash('sha1').update(body).digest('hex') + '"';
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, { ETag: etag }); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', ETag: etag, 'Cache-Control': 'max-age=600' });
    res.end(body);
  });
  await new Promise(r => server.listen(PORT, r));
});
test.afterAll(() => server.close());

const bump = (file, from, to) => {
  const p = path.join(dir, file);
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(from, to));
};

test('installed app shows a new deploy on the next open, and still works offline', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit has no service workers');
  await page.goto(url);
  await page.waitForFunction(async () => (await navigator.serviceWorker.ready).active?.state === 'activated');
  await page.reload();
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  bump('index.html', '<head>', '<head><meta name="deploy" content="2">');
  await page.reload();
  await expect(page.locator('meta[name=deploy]')).toHaveAttribute('content', '2');

  bump('index.html', 'content="2"', 'content="3"');
  bump('sw.js', `linux-master-v${V}`, `linux-master-v${V + 1}`);
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
  await page.waitForFunction(async name => JSON.stringify(await caches.keys()) === JSON.stringify([name]), `linux-master-v${V + 1}`, { timeout: 15000 });
  await page.reload();
  await expect(page.locator('meta[name=deploy]')).toHaveAttribute('content', '3');
  await page.waitForFunction(() => window.learnKept, null, { timeout: 30000 });

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('meta[name=deploy]')).toHaveAttribute('content', '3');
  await expect(page.locator('.node.current')).toBeVisible();
  await context.setOffline(false);
});
