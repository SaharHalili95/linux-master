const { test, expect } = require('@playwright/test');
const LEVELS = ['intro', 'functions', 'pipe', 'pipeFunction', 'pro', 'pipeTwoFlag', 'workflow', 'bandit'];
const visibleHebrew = page => page.evaluate(() => [...document.querySelectorAll('body *')]
  .filter(e => e.children.length === 0 && e.offsetParent !== null && e.id !== 'langBtn' && /[֐-׿]/.test(e.textContent))
  .map(e => e.textContent.slice(0, 50)));

async function english(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('./?mode=trivia');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lang', 'en'); });
  await page.reload();
  await page.waitForFunction(() => typeof startQuiz === 'function');
  return errors;
}

test('switch button toggles language and direction', async ({ page }) => {
  await page.goto('./?mode=trivia');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dir)).toBe('rtl');
  await page.click('#langBtn');
  await page.waitForFunction(() => document.documentElement.dir === 'ltr');
  await expect(page.locator('#langBtn')).toHaveText('עב');
  await expect(page.locator('h1').first()).toContainText('Your path');
  await page.click('#langBtn');
  await page.waitForFunction(() => document.documentElement.dir === 'rtl');
  await expect(page.locator('#langBtn')).toHaveText('EN');
});

test('english: content is fully translated', async ({ page }) => {
  await english(page);
  const bad = await page.evaluate(() => {
    const heb = x => /[֐-׿]/.test(x);
    const all = [...commands.map(c => c.meaning), ...guideUses.map(u => u.meaning),
      ...[pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios, banditScenarios].flat().flatMap(s => [s.prompt, s.explanation])];
    return all.filter(heb);
  });
  expect(bad).toEqual([]);
});

test('english: no visible Hebrew on home and tutorials', async ({ page }) => {
  const errors = await english(page);
  expect(await visibleHebrew(page)).toEqual([]);
  await page.click('button:has-text("Open tutorials")');
  for (let i = 0; i < 8; i++) {
    await page.locator('.tutorial-tab').nth(i).click();
    expect(await visibleHebrew(page), `tutorial ${i}`).toEqual([]);
  }
  expect(errors).toEqual([]);
});

for (const level of LEVELS) {
  test(`english: full round without Hebrew: ${level}`, async ({ page }) => {
    const errors = await english(page);
    await page.evaluate(l => selectLevel(l), level);
    await page.click('button:has-text("Start practicing")');
    for (let i = 0; !(await page.locator('#result').evaluate(e => e.classList.contains('active'))); i++) {
      expect(i).toBeLessThan(60);
      await page.waitForFunction(k => quizIndex === k && !quizLocked, i);
      expect(await visibleHebrew(page), `question ${i}`).toEqual([]);
      await page.locator('.answer').first().click();
      expect(await visibleHebrew(page), `feedback ${i}`).toEqual([]);
      await page.evaluate(() => nextQuestion());
    }
    await expect(page.locator('#result')).toHaveClass(/active/);
    await expect(page.locator('#resultScore')).toContainText('correct');
    expect(await visibleHebrew(page)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('english: progress is shared with Hebrew', async ({ page }) => {
  await english(page);
  await page.click('button:has-text("Start practicing")');
  for (let i = 0; i < 3; i++) { await page.locator('.answer').first().click(); await page.evaluate(() => nextQuestion()); }
  await page.evaluate(() => localStorage.setItem('lang', 'he'));
  await page.reload();
  await expect(page.locator('#quizModeMeta')).toContainText('3/92');
});

test('english: no horizontal scroll', async ({ page }) => {
  await english(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
