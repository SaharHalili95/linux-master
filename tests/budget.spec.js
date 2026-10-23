const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');

test('page weight stays within budget', () => {
  const files = ['index.html', 'styles.css', 'shell.js', 'app.js', 'data/content.js', 'data/content.en.js', 'data/missions.js'];
  const gzipped = files.reduce((n, f) => n + zlib.gzipSync(fs.readFileSync(path.join(root, f))).length, 0);
  expect(gzipped, `the page is ${Math.round(gzipped / 1024)} KiB gzipped`).toBeLessThan(120 * 1024);
  for (const icon of ['icon-180.png', 'icon-192.png', 'icon-512.png']) expect(fs.statSync(path.join(root, icon)).size).toBeLessThan(40 * 1024);
});

test('the page only talks to itself and Google Fonts', async ({ page }) => {
  const hosts = new Set();
  page.on('request', r => hosts.add(new URL(r.url()).hostname));
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  const allowed = new Set(['localhost', 'fonts.googleapis.com', 'fonts.gstatic.com']);
  expect([...hosts].filter(h => !allowed.has(h))).toEqual([]);
});

test('every file the service worker precaches exists', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const files = JSON.parse(sw.match(/const FILES = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  for (const f of files) if (f !== './') expect(fs.existsSync(path.join(root, f.split('?')[0])), f).toBe(true);
});

test('the deploy workflow copies every file the site needs', () => {
  const pages = fs.readFileSync(path.join(root, '.github', 'workflows', 'pages.yml'), 'utf8');
  for (const f of ['index.html', 'styles.css', 'shell.js', 'app.js', 'cp -r data', 'sw.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png']) expect(pages, f).toContain(f);
});
