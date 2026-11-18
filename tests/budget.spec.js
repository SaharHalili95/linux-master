const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const firstLoad = () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*\bdefer\b)[^>]*\bsrc="([^"?]+)/g)].map(m => m[1]);
  const styles = [...html.matchAll(/<link rel="stylesheet" href="([^"?]+)/g)].map(m => m[1]);
  return ['index.html', ...styles, ...scripts];
};

test('page weight stays within budget', () => {
  const files = firstLoad();
  expect(files).toEqual(expect.arrayContaining(['index.html', 'styles.css', 'app.js']));
  expect(files, 'the simulator loads after the first screen').not.toContain('shell.js');
  const gzipped = files.reduce((n, f) => n + zlib.gzipSync(fs.readFileSync(path.join(root, f))).length, 0);
  expect(gzipped, `the page is ${Math.round(gzipped / 1024)} KiB gzipped`).toBeLessThan(125 * 1024);
  for (const icon of ['icon-180.png', 'icon-192.png', 'icon-512.png']) expect(fs.statSync(path.join(root, icon)).size).toBeLessThan(40 * 1024);
});

for (const url of ['./', './?mode=trivia']) test(`the page only talks to itself and Google Fonts (${url})`, async ({ page }) => {
  const hosts = new Set();
  page.on('request', r => hosts.add(new URL(r.url()).hostname));
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const allowed = new Set(['localhost', 'fonts.googleapis.com', 'fonts.gstatic.com']);
  expect([...hosts].filter(h => !allowed.has(h))).toEqual([]);
});

test('every file the service worker precaches exists', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const files = JSON.parse(sw.match(/const FILES = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  for (const f of files) if (f !== './') expect(fs.existsSync(path.join(root, f.split('?')[0])), f).toBe(true);
});

test('the service worker precaches the first load at the versions the page asks for', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const files = JSON.parse(sw.match(/const FILES = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  const asked = [...html.matchAll(/<(?:script(?![^>]*\bdefer\b)[^>]*\bsrc|link rel="(?:stylesheet|apple-touch-icon)" href)="([^"]+)"/g)].map(m => './' + m[1]);
  expect(asked.length).toBeGreaterThan(15);
  for (const f of asked) expect(files, f).toContain(f);
});

test('the deploy workflow copies every file the site needs', () => {
  const pages = fs.readFileSync(path.join(root, '.github', 'workflows', 'pages.yml'), 'utf8');
  for (const f of [...firstLoad(), 'legal.html', 'cp -r data', 'classic', 'prototype', 'sw.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png']) expect(pages, f).toContain(f);
});
