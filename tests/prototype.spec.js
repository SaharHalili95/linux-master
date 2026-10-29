const { test, expect } = require('@playwright/test');

const SHOTS = process.env.PROTO_SHOTS;

// Answers the current exercise correctly by reading the lesson state, the way a learner who knows the answer would.
async function solve(page) {
  const ex = await page.evaluate(() => ({ type: L.ex.type, answer: L.ex.answer, solution: L.ex.solution, before: L.ex.before, uid: L.ex.uid, boss: L.ex.boss && { word: L.ex.boss.word, dir: L.ex.boss.hideIn } }));
  if (ex.type === 'teach') { await page.click('#checkBtn'); return ex; }
  if (ex.type === 'choice') await page.locator('.opt').filter({ hasText: ex.answer }).first().click();
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

test('prototype: play the whole unit, chest and boss, with streak, XP and quests', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./prototype/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/path-start.png` });

  for (const node of ['L0', 'L1', 'c1', 'L2', 'L3', 'boss']) {
    await page.locator('.node.current').click();
    await page.locator('#pop .btn').click();
    if (node === 'c1') continue;
    while (await page.locator('#lesson').isVisible()) await solve(page);
    await expect(page.locator('#end')).toBeVisible();
    if (SHOTS && node === 'L0') await page.screenshot({ path: `${SHOTS}/end-L0.png` });
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
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/quests.png` });
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
