const { test, expect } = require('@playwright/test');

async function mount(page, board = {}, gear = {}) {
  await page.goto('/prototype/legal.html');
  await page.setContent('<main style="max-width:588px;margin:16px auto;padding:0 16px"><div id="board"></div><div id="gear"></div></main>');
  await page.addStyleTag({ url: '/prototype/styles.css' });
  await page.addStyleTag({ url: '/prototype/expedition-ui.css' }).catch(() => {});
  await page.addScriptTag({ url: '/prototype/expedition-ui.js' }).catch(() => {});
  expect(await page.evaluate(() => typeof window.ExpeditionUI)).toBe('object');
  await page.evaluate(({ board, gear }) => {
    const worlds = Array.from({ length: 10 }, (_, i) => ({ section: i + 1, title: { en: `World ${i + 1}`, he: `עולם ${i + 1}` }, brief: { en: 'Recover the navigation signal using familiar Linux commands.', he: 'מצאו את אות הניווט בעזרת פקודות לינוקס מוכרות.' }, gearName: { en: `Navigation tool ${i + 1}`, he: `כלי ניווט ${i + 1}` } }));
    window.uiEvents = [];
    window.boardState = { worlds, section: 1, mode: 'explore', progress: { completed: 1, total: 8, level: 1 }, poolSize: 3, bests: {}, lang: 'en', ready: true, ...board };
    window.gearState = { worlds, unlocked: [1], selected: 0, lang: 'en', ready: true, icon: () => '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>', ...gear };
    window.drawBoard = () => ExpeditionUI.renderBoard(document.getElementById('board'), boardState, {
      onChange: change => { uiEvents.push(change); Object.assign(boardState, change); drawBoard(); },
      onStart: () => uiEvents.push('start'), onLearn: () => uiEvents.push('learn')
    });
    window.drawGear = () => ExpeditionUI.renderGear(document.getElementById('gear'), gearState, value => { uiEvents.push(value); gearState.selected = value; drawGear(); });
    drawBoard(); drawGear();
  }, { board, gear });
}

test('board gates runs by exercise count and world level', async ({ page }) => {
  await mount(page);
  await expect(page.locator('#expeditionStart')).toBeEnabled();
  await expect(page.locator('#expeditionModeStreak')).toBeDisabled();
  await page.locator('#expeditionStart').click();
  expect(await page.evaluate(() => uiEvents)).toEqual(['start']);
  await page.evaluate(() => { boardState.poolSize = 2; drawBoard(); });
  await expect(page.locator('#expeditionStart')).toBeDisabled();
  await page.locator('#expeditionLearn').click();
  expect(await page.evaluate(() => uiEvents)).toEqual(['start', 'learn']);
  await page.evaluate(() => { boardState.progress.level = 2; boardState.poolSize = 4; drawBoard(); });
  await expect(page.locator('#expeditionModeStreak')).toBeDisabled();
  await page.evaluate(() => { boardState.poolSize = 5; drawBoard(); });
  await expect(page.locator('#expeditionModeStreak')).toBeEnabled();
});

test('world and mode keyboard changes retain focus through parent rerender', async ({ page }) => {
  await mount(page, { poolSize: 5, progress: { completed: 2, total: 8, level: 2 } });
  await page.locator('#expeditionWorld').focus();
  await page.locator('#expeditionWorld').selectOption('2');
  await expect(page.locator('#expeditionWorld')).toBeFocused();
  await expect(page.locator('#expeditionWorld')).toHaveValue('2');
  await page.locator('#expeditionModeExplore').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#expeditionModeStreak')).toBeFocused();
  await expect(page.locator('#expeditionModeStreak')).toBeChecked();
  await expect(page.locator('#expeditionStart')).toBeEnabled();
  expect(await page.evaluate(() => uiEvents)).toEqual([{ section: 2, mode: 'explore' }, { section: 2, mode: 'streak' }]);
});

test('zero-score completion is a record and absence remains no record', async ({ page }) => {
  await mount(page, { bests: { '1:explore': 0 } });
  await expect(page.locator('.expedition-record')).toContainText('0 / 3');
  await page.evaluate(() => { boardState.bests = {}; drawBoard(); });
  await expect(page.locator('.expedition-record')).toContainText('No completed run');
});

test('loading and unavailable data disable controls without implying unlocks', async ({ page }) => {
  await mount(page, { ready: false }, { ready: false, selected: 1 });
  await expect(page.locator('#expeditionWorld')).toBeDisabled();
  await expect(page.locator('#expeditionStart')).toBeDisabled();
  await expect(page.locator('#gear input[value="0"]')).toBeChecked();
  for (const input of await page.locator('#gear input').all()) await expect(input).toBeDisabled();
  await page.evaluate(() => { boardState.ready = true; boardState.error = true; gearState.ready = true; gearState.error = true; drawBoard(); drawGear(); });
  await expect(page.locator('#board')).toContainText('unavailable');
  await expect(page.locator('#expeditionModeExplore')).toBeDisabled();
  await expect(page.locator('#gear input[value="1"]')).toBeDisabled();
});

test('equipment refuses locked selection without mutating it and keyboard selection keeps focus', async ({ page }) => {
  await mount(page, {}, { selected: 2 });
  await expect(page.locator('#gear input')).toHaveCount(11);
  await expect(page.locator('#gear input[value="0"]')).toBeChecked();
  await expect(page.locator('#gear input[value="2"]')).toBeDisabled();
  expect(await page.evaluate(() => gearState.selected)).toBe(2);
  await page.locator('#gear input[value="0"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#gear input[value="1"]')).toBeChecked();
  await expect(page.locator('#gear input[value="1"]')).toBeFocused();
  expect(await page.evaluate(() => uiEvents)).toEqual([1]);
});

for (const lang of ['en', 'he']) test(`controls fit 320px and keep accessible targets in ${lang}`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(page, { lang, companionHTML: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>' }, { lang });
  for (const id of ['board', 'gear']) {
    await expect(page.locator(`#${id} > :first-child`)).toHaveAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
    expect(await page.locator(`#${id}`).evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  for (const label of await page.locator('.expedition-mode, .expedition-gear-choice').all()) expect((await label.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('level two with too few exercises does not claim Streak is playable', async ({ page }) => {
  await mount(page, { poolSize: 3, progress: { completed: 2, total: 8, level: 2 } });
  await expect(page.locator('#expeditionModeStreak')).toBeDisabled();
  await expect(page.locator('.expedition-unlock')).toContainText('5 exercises');
  await expect(page.locator('.expedition-unlock')).not.toContainText('Streak unlocked');
});
