const { test, expect } = require('@playwright/test');

async function fresh(page, setup = {}) {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('./');
  await page.evaluate(values => { localStorage.clear(); for (const [k, v] of Object.entries(values)) localStorage.setItem(k, v); }, setup);
  await page.reload();
  await page.waitForFunction(() => typeof startQuiz === 'function');
  return errors;
}
const ask = (page, level, id) => page.evaluate(([l, i]) => { selectLevel(l); quizQuestions = [makeEntry(l, i, {})]; quizIndex = 0; quizLocked = false; showScreen('quiz'); renderQuestion(); }, [level, id]);

test('level 1 hint teaches the name and a masked example, and removes two wrong answers', async ({ page }) => {
  const errors = await fresh(page);
  const cat = await page.evaluate(() => commands.findIndex(c => c.name === 'cat'));
  await ask(page, 'intro', cat * 2);
  await expect(page.locator('#hintText')).toBeHidden();
  await page.click('#hintBtn');
  await expect(page.locator('#hintText')).toContainText('conCATenate');
  await expect(page.locator('#hintText code').nth(1)).toHaveText('___ -n FILE');
  await expect(page.locator('#hintBtn')).toBeDisabled();
  await expect(page.locator('.answer.eliminated')).toHaveCount(2);
  await expect(page.locator('.answer.eliminated[data-answer="cat"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('every question in every level has a hint that never shows the answer to a "which command" question', async ({ page }) => {
  await fresh(page);
  const problems = await page.evaluate(() => {
    const bad = [];
    for (const level of Object.keys(levelQuiz)) for (const id of levelQuiz[level].ids()) {
      const entry = makeEntry(level, id, {});
      const text = hintLines(entry).map(l => `${l.label || ''}${l.code || ''}${l.text || ''}`).join('\n');
      if (!text && level !== 'functions') bad.push(`${level}#${id}: empty`);
      if (level === 'intro' && !entry.item.reverse && new RegExp(`(^|\\s)${entry.q.answer}(\\s|$)`).test(hintLines(entry).filter(l => l.label === t('hintExample')).map(l => l.code).join())) bad.push(`${level}#${id}: shows ${entry.q.answer}`);
    }
    return bad;
  });
  expect(problems).toEqual([]);
});

test('scenario hints list the commands in the answer with what they do', async ({ page }) => {
  await fresh(page, { lang: 'en' });
  await ask(page, 'pipe', 0);
  await page.click('#hintBtn');
  const answer = await page.evaluate(() => quizQuestions[0].q.answer);
  for (const name of await page.evaluate(a => commandsIn(a), answer)) await expect(page.locator('#hintText code', { hasText: name }).first()).toBeVisible();
  await expect(page.locator('#hintText')).toContainText('Commands in the answer:');
  await expect(page.locator('#hintText')).not.toContainText(/[֐-׿]/);
});

test('a correct answer after a hint scores but stays in review instead of moving up a box', async ({ page }) => {
  await fresh(page);
  await ask(page, 'intro', 0);
  await page.click('#hintBtn');
  await page.evaluate(() => [...document.querySelectorAll('.answer')].find(b => b.dataset.answer === quizQuestions[0].q.answer).click());
  await expect(page.locator('#feedback')).toContainText('עניתם עם רמז');
  const state = await page.evaluate(() => ({ points: quizPoints, box: reviewState.intro.boxes['0'] || 0, review: reviewState.intro.review }));
  expect(state).toEqual({ points: 1, box: 0, review: [0] });
  await expect(page.locator('#hintBtn')).toBeDisabled();
});

test('the hint resets on the next question and works in typing mode', async ({ page }) => {
  await fresh(page, { answerMode: 'type' });
  await ask(page, 'workflow', 0);
  await page.click('#hintBtn');
  await expect(page.locator('#hintText')).toBeVisible();
  await expect(page.locator('#hintText')).not.toContainText('הורדנו');
  await ask(page, 'workflow', 1);
  await expect(page.locator('#hintText')).toBeHidden();
  await expect(page.locator('#hintBtn')).toBeEnabled();
});
