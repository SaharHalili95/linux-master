const { test, expect } = require('@playwright/test');

test('old Learn address opens the app at the root', async ({ page }) => {
  await page.goto('./prototype/?x=1#y');
  await expect(page).toHaveURL(/:\d+\/\?x=1#y$/);
  await expect(page.locator('#learn')).toBeVisible();
});

test('a redirect page falls back to a plain refresh only when scripts are off, so the query and hash are kept', () => {
  const fs = require('fs'), path = require('path');
  for (const page of ['index.html', 'legal.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', 'prototype', page), 'utf8');
    expect(html, page).toMatch(/<noscript><meta http-equiv="refresh"[^>]*><\/noscript>/);
    expect(html.match(/http-equiv="refresh"/g), page).toHaveLength(1);
  }
});

test('old legal page redirects', async ({ page }) => {
  await page.goto('./prototype/legal.html');
  await expect(page).toHaveURL(/:\d+\/legal\.html$/);
});

test('?mode=trivia opens classic Trivia', async ({ page }) => {
  await page.goto('./?mode=trivia');
  await expect(page).toHaveURL(/:\d+\/classic\/$/);
  await expect(page.locator('#home')).toBeVisible();
});

test('old caches are removed and the app opens offline after update', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit has no service workers');
  await page.goto('./legal.html');
  await page.evaluate(async () => {
    await (await caches.open('linux-master-v30')).put('./index.html', new Response('old trivia'));
    await (await caches.open('linux-master-learn')).put('./prototype/index.html', new Response('old learn'));
  });
  await page.goto('./');
  await page.waitForFunction(async () => (await navigator.serviceWorker.ready).active?.state === 'activated');
  await page.waitForFunction(() => window.learnKept, null, { timeout: 30000 });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#learn')).toBeVisible();
  await expect(page.locator('.node.current')).toBeVisible();
  expect(await page.evaluate(() => caches.keys())).toEqual(['linux-master-v31']);
  await context.setOffline(false);
});

test('progress of both modes survives the move', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('linux-master-proto', JSON.stringify({ xp: 120 }));
    localStorage.setItem('quizStats', JSON.stringify({ correct: 7, answered: 9 }));
  });
  await page.goto('./');
  await expect(page.locator('#learn')).toBeVisible();
  expect(await page.evaluate(() => S.xp)).toBe(120);
  await page.goto('./classic/');
  await expect(page.locator('#learnedCount')).toHaveText('7');
});
