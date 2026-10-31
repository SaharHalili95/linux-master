const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = process.env.SITE_DIR || path.resolve(__dirname, '..');
const V = SRC ? Number(fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8').match(/linux-master-v(\d+)/)[1]) : 0;
let dir, server;
const PORT = 8799;
const url = `http://localhost:${PORT}/?mode=trivia`;

test.beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lm-update-'));
  for (const f of ['index.html', 'styles.css', 'shell.js', 'app.js', 'sw.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'data']) fs.cpSync(path.join(SRC, f), path.join(dir, f), { recursive: true });
  // Like GitHub Pages: content-based ETags, so a change is seen however fast it happens.
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  server = http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, url).pathname).replace(/^\/$/, '/index.html');
    const file = path.join(dir, path.normalize(name).replace(/^(\.\.[/\\])+/, ''));
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
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
  await expect(page.locator('.version')).toHaveText(`v${V}`);
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  bump('index.html', `>v${V}<`, `>v${V + 1}<`);
  await page.reload();
  await expect(page.locator('.version')).toHaveText(`v${V + 1}`);

  bump('index.html', `>v${V + 1}<`, `>v${V + 2}<`);
  bump('sw.js', `linux-master-v${V}`, `linux-master-v${V + 2}`);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForFunction(async name => (await caches.keys()).includes(name), `linux-master-v${V + 2}`, { timeout: 15000 });
  await expect(page.locator('.version')).toHaveText(`v${V + 2}`, { timeout: 15000 });

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.version')).toHaveText(`v${V + 2}`);
  await expect(page.locator('.level-card')).toHaveCount(8);
  await context.setOffline(false);
});
