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
const ask = (page, level, id) => page.evaluate(([l, i]) => { selectLevel(l); quizQuestions = [makeEntry(l, i, {}), makeEntry(l, i + 1, {})]; quizIndex = 0; quizLocked = false; showScreen('quiz'); renderQuestion(); }, [level, id]);
const issue = async page => { const url = new URL(await page.locator('#reportSend').getAttribute('href')); return { url, title: url.searchParams.get('title'), body: url.searchParams.get('body'), labels: url.searchParams.get('labels') }; };

test('the report link opens a prefilled GitHub issue with the question, options and answer', async ({ page }) => {
  const errors = await fresh(page, { lang: 'en' });
  await ask(page, 'pipe', 3);
  await expect(page.locator('#reportPanel')).toBeHidden();
  await page.click('#reportBtn');
  await expect(page.locator('#reportPanel')).toBeVisible();
  await expect(page.locator('#reportBtn')).toHaveAttribute('aria-expanded', 'true');
  await page.selectOption('#reportReason', 'alsoRight');
  await page.fill('#reportNote', 'ls | wc -l also works');
  const { url, title, body, labels } = await issue(page);
  const q = await page.evaluate(() => quizQuestions[0].q);
  expect(url.origin + url.pathname).toBe('https://github.com/SaharHalili95/linux-master/issues/new');
  expect(labels).toBe('question-report');
  expect(title).toBe('Question report: pipe#3 - Another answer is also right');
  expect(body).toContain('ls | wc -l also works');
  expect(body).toContain(`**Correct answer:** \`${q.answer}\``);
  for (const opt of q.options) expect(body).toContain(opt.label);
  expect(body).toContain('Not answered yet');
  expect(body).toContain('Language: en');
  expect(errors).toEqual([]);
});

test('after answering, the report says what the learner chose and the round waits', async ({ page }) => {
  await fresh(page);
  await ask(page, 'intro', 0);
  const wrong = await page.evaluate(() => [...document.querySelectorAll('.answer')].find(b => b.dataset.answer !== quizQuestions[0].q.answer).dataset.answer);
  await page.click(`.answer[data-answer="${wrong}"]`);
  await page.click('#reportBtn');
  expect((await issue(page)).body).toContain(`**Learner answered:** \`${wrong}\` → counted wrong`);
  await page.waitForTimeout(2500);
  await expect(page.locator('#reportPanel')).toBeVisible();
  expect(await page.evaluate(() => quizIndex)).toBe(0);
  await page.click('#nextQuestion');
  await expect(page.locator('#reportPanel')).toBeHidden();
  await expect(page.locator('#reportNote')).toHaveValue('');
});

test('opening the report before answering keeps the auto-advance off after the answer', async ({ page }) => {
  await fresh(page);
  await ask(page, 'intro', 0);
  await page.click('#reportBtn');
  await page.evaluate(() => [...document.querySelectorAll('.answer')].find(b => b.dataset.answer === quizQuestions[0].q.answer).click());
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => quizIndex)).toBe(0);
  await expect(page.locator('#nextQuestion')).not.toHaveClass(/counting/);
});

test('cancel closes the panel, and every question in every level builds a report', async ({ page }) => {
  await fresh(page);
  await ask(page, 'workflow', 0);
  await page.click('#reportBtn');
  await page.getByRole('button', { name: 'ביטול' }).click();
  await expect(page.locator('#reportPanel')).toBeHidden();
  await expect(page.locator('#reportBtn')).toHaveAttribute('aria-expanded', 'false');
  const bad = await page.evaluate(() => {
    const out = [];
    for (const level of Object.keys(levelQuiz)) for (const id of levelQuiz[level].ids()) {
      const url = new URL(reportUrl(makeEntry(level, id, {})));
      if (url.href.length > 8000 || !url.searchParams.get('body').includes(`\`${level}\` · id \`${id}\``)) out.push(`${level}#${id}`);
    }
    return out;
  });
  expect(bad).toEqual([]);
});
