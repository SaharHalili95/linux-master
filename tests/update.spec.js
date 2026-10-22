const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = process.env.SITE_DIR || path.resolve(__dirname, '..');
const V = SRC ? Number(fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8').match(/linux-master-v(\d+)/)[1]) : 0;
let dir, server;
const PORT = 8799;
const url = `http://localhost:${PORT}/`;

test.beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lm-update-'));
  for (const f of fs.readdirSync(SRC)) if (fs.statSync(path.join(SRC, f)).isFile()) fs.copyFileSync(path.join(SRC, f), path.join(dir, f));
  server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', dir], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
});
test.afterAll(() => server.kill());

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

  // python http.server compares Last-Modified in whole seconds
  await page.waitForTimeout(1100);
  bump('index.html', `>v${V}<`, `>v${V + 1}<`);
  await page.reload();
  await expect(page.locator('.version')).toHaveText(`v${V + 1}`);

  // python http.server compares Last-Modified in whole seconds
  await page.waitForTimeout(1100);
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
