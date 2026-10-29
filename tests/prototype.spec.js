const { test, expect } = require('@playwright/test');

const SHOTS = process.env.PROTO_SHOTS;
// The language button is labelled in the other language on purpose; everything else must match the UI language.
const hebrewOnScreen = () => document.body.innerText.replace(document.getElementById('langBtn').innerText, '').match(/[\u0590-\u05ff]+/g);

// Answers the current exercise correctly by reading the lesson state, the way a learner who knows the answer would.
async function solve(page, lang = 'he') {
  if (lang === 'en') expect(await page.evaluate(hebrewOnScreen), 'Hebrew in English UI').toBeNull();
  const ex = await page.evaluate(() => ({ type: L.ex.type, plain: L.ex.plain, answer: L.ex.answer, solution: L.ex.solution, before: L.ex.before, uid: L.ex.uid, boss: L.ex.boss && { word: L.ex.boss.word, dir: L.ex.boss.hideIn } }));
  if (ex.type === 'teach') { await page.click('#checkBtn'); return ex; }
  if (ex.type === 'choice') await (ex.plain ? page.locator('.opt[data-value="0"]') : page.locator(`.opt[data-value="${ex.answer}"]`)).click();
  if (ex.type === 'output') await page.evaluate(s => [...document.querySelectorAll('.opt')].find(b => b.dataset.value === s).click(), ex.solution);
  if (ex.type === 'fill') await page.locator('.chips .tile', { hasText: ex.answer }).click();
  if (ex.type === 'tiles') for (const word of ex.answer.split(' ')) await page.locator('.bank .tile', { hasText: word }).filter({ hasText: new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first().click();
  if (ex.type === 'match') {
    const pairs = await page.evaluate(() => L.ex.pairs.map(p => p[0]));
    for (const key of pairs) { await page.locator(`.pair.cmd[data-key="${key}"]`).click(); await page.locator(`.pair.mean[data-key="${key}"]`).click(); }
  }
  if (ex.type === 'terminal') {
    const cmds = ex.uid.startsWith('L1') ? ['cd photos', 'pwd'] : ['cd ../projects'];
    for (const c of cmds) { await page.fill('.term-input input', c); await page.press('.term-input input', 'Enter'); }
  }
  if (ex.type === 'boss') {
    for (const c of [`ls -a ${ex.boss.dir}`, `cat ${ex.boss.dir}/.code`]) { await page.fill('.term-input input', c); await page.press('.term-input input', 'Enter'); }
    await expect(page.locator('.goals li.done')).toHaveCount(2);
    await page.fill('#codeWord', ex.boss.word);
  }
  if (SHOTS && ex.type !== 'match') await page.screenshot({ path: `${SHOTS}/ex-${ex.uid}-${ex.type}.png` });
  if (ex.type !== 'match') await page.click('#checkBtn');
  await expect(page.locator('#foot')).toHaveClass(/good/);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/ex-${ex.uid}-${ex.type}-good.png` });
  await page.click('#checkBtn');
  return ex;
}

for (const lang of ['he', 'en']) test(`prototype: play the whole unit, chest and boss, with streak, XP and quests (${lang})`, async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./prototype/');
  await page.evaluate(l => { localStorage.clear(); localStorage.setItem('lang', l); }, lang);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/path-start-${lang}.png` });

  for (const node of ['L0', 'L1', 'c1', 'L2', 'L3', 'boss']) {
    await page.locator('.node.current').click();
    await page.locator('#pop .btn').click();
    if (node === 'c1') continue;
    while (await page.locator('#lesson').isVisible()) await solve(page, lang);
    await expect(page.locator('#end')).toBeVisible();
    if (SHOTS && node === 'L0') await page.screenshot({ path: `${SHOTS}/end-L0-${lang}.png` });
    await page.click('#endBtn');
    if (node === 'L0') { await expect(page.locator('#streakScreen')).toBeVisible(); if (SHOTS) await page.screenshot({ path: `${SHOTS}/streak.png` }); await page.click('#streakBtn'); }
  }
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('linux-master-proto')));
  expect(state.done).toEqual(['L0', 'L1', 'c1', 'L2', 'L3', 'boss']);
  expect(state.streak).toBe(1);
  expect(state.xp).toBe(4 * 15 + 25);
  expect(state.gems).toBe(15 + 30);
  await expect(page.locator('.node.boss.done')).toHaveCount(1);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/path-done.png`, fullPage: true });
  await page.click('[data-tab="quests"]');
  await expect(page.locator('.quest.done')).toHaveCount(3);
  if (lang === 'en') expect(await page.evaluate(hebrewOnScreen)).toBeNull();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/quests-${lang}.png` });
  expect(errors).toEqual([]);
});

test('prototype: a wrong answer turns the bar red, comes back at the end, and lands in practice', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./prototype/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.node.current').click();
  await page.locator('#pop .btn').click();
  await page.click('#checkBtn');
  await page.locator('.opt[data-value="ls"]').click();
  await page.click('#checkBtn');
  await expect(page.locator('#foot')).toHaveClass(/bad/);
  await expect(page.locator('#fbDetail')).toContainText('ls מציגה מה יש בתיקייה');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/wrong.png` });
  await page.click('#checkBtn');
  const tail = await page.evaluate(() => L.queue.at(-1));
  expect(tail).toMatchObject({ uid: 'L0.1', retry: true });
  expect(await page.evaluate(() => S.mistakes)).toEqual(['L0.1']);
});

const AxeBuilder = require('@axe-core/playwright').default;
for (const scheme of ['light', 'dark']) {
  test(`prototype: accessibility of path, lesson, feedback and end screens (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: scheme });
    await page.goto('./prototype/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const axe = async name => {
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      return r.violations.map(v => `${name}: ${v.id} ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(', ')}`);
    };
    const problems = [...await axe('path')];
    await page.locator('.node.current').click();
    problems.push(...await axe('popover'));
    await page.locator('#pop .btn').click();
    problems.push(...await axe('teach'));
    await page.click('#checkBtn');
    problems.push(...await axe('choice'));
    await page.locator('.opt[data-value="ls"]').click();
    await page.click('#checkBtn');
    problems.push(...await axe('wrong'));
    for (const tab of ['practice', 'quests', 'profile']) { await page.evaluate(() => closeOverlays()); await page.click(`[data-tab="${tab}"]`); problems.push(...await axe(tab)); }
    expect(problems).toEqual([]);
  });
}

test('the Trivia | Learn switch and the home card move between the two modes', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#betaLink')).toHaveText('לנסות ←');
  await page.click('#langBtn');
  await expect(page.locator('#betaLink')).toHaveText('Try it →');
  await expect(page.locator('.mode-switch .mode.on')).toHaveText('🎯 Trivia');
  await page.click('#modeLearn');
  await expect(page).toHaveURL(/\/prototype\/$/);
  await expect(page.locator('.node.current')).toBeVisible();
  await expect(page.locator('.mode-switch .mode.on')).toHaveText('🎓 Learn');
  await page.click('.mode-switch a.mode');
  await expect(page.locator('.level-card')).toHaveCount(8);
  await page.click('#betaLink');
  await expect(page).toHaveURL(/\/prototype\/$/);
  await page.goBack();
  await expect(page.locator('.level-card')).toHaveCount(8);
});

test('visiting the beta does not replace the main page in the offline cache', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit does not support service workers');
  await page.goto('./');
  await page.waitForFunction(async () => (await navigator.serviceWorker.ready).active?.state === 'activated');
  await page.reload();
  await page.goto('./prototype/');
  await expect(page.locator('.node.current')).toBeVisible();
  await context.setOffline(true);
  await page.goto('./');
  await expect(page.locator('.level-card')).toHaveCount(8);
  await context.setOffline(false);
});

test('the path never scrolls sideways, even with a popover open on the outermost node', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ done: ['L0', 'L1'] })); });
  await page.reload();
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.locator('.node.current').click();
  await expect(page.locator('#pop')).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);
  const box = await page.locator('#pop').boundingBox(), width = page.viewportSize().width;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width);
});

test('the language button switches Learn mode and the choice carries over to Trivia mode', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.tabbar [data-tab="learn"]')).toContainText('לימוד');
  await page.click('#langBtn');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('.tabbar [data-tab="learn"]')).toContainText('Learn');
  await expect(page.locator('.unit-banner h2').first()).toHaveText('Where am I?');
  await page.click('.mode-switch a.mode');
  await expect(page.locator('#langBtn')).toHaveText('עב');
  await expect(page.locator('.mode-switch .mode.on')).toHaveText('🎯 Trivia');
});

for (const lang of ['he', 'en']) test(`the top bar fits a small phone, with streak and gems visible (${lang})`, async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(l => { localStorage.clear(); localStorage.setItem('lang', l); }, lang);
  await page.reload();
  const width = page.viewportSize().width;
  for (const sel of ['.mode-switch', '#langBtn', '.chip.streak', '.chip.gems']) {
    const box = await page.locator(sel).boundingBox();
    expect(box.x, sel).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, sel).toBeLessThanOrEqual(width);
  }
});
