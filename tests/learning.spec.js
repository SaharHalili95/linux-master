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

const answer = (page, right) => page.evaluate(ok => {
  const e = quizQuestions[quizIndex];
  [...document.querySelectorAll('.answer')].find(b => (b.dataset.answer === e.q.answer) === ok).click();
  clearTimeout(questionTimer);
}, right);
const next = page => page.evaluate(() => nextQuestion());

test.describe('mistake review', () => {
  test('a wrong answer comes back 4 questions later in the same round, marked as review', async ({ page }) => {
    const errors = await fresh(page);
    await page.evaluate(() => { selectLevel('pipe'); startQuiz(); });
    const id = await page.evaluate(() => quizQuestions[0].id);
    const before = await page.evaluate(() => quizQuestions.length);
    await answer(page, false);
    expect(await page.evaluate(() => quizQuestions.length)).toBe(before + 1);
    expect(await page.evaluate(() => quizQuestions[5])).toMatchObject({ id, retry: true });
    await expect(page.locator('#quizCounter')).toHaveText(`01 / ${before + 1}`);
    for (let i = 0; i < 5; i++) { await next(page); if (i < 4) await answer(page, true); }
    await expect(page.locator('#questionTag .review')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a wrong answer is offered again next round until it is answered correctly', async ({ page }) => {
    await fresh(page, { levelProgress: JSON.stringify({ pipe: { order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], pos: 0, poolSize: 15, cycle: 1 } }) });
    await page.evaluate(() => { selectLevel('pipe'); startQuiz(); });
    await answer(page, false);
    const id = await page.evaluate(() => quizQuestions[0].id);
    while (!(await page.locator('#result').evaluate(e => e.classList.contains('active')))) { await next(page); if (await page.locator('#quiz.active').count()) await answer(page, true); }
    expect(await page.evaluate(() => reviewState.pipe.review)).toEqual([id]);
    await page.evaluate(() => goHome());
    await expect(page.locator('#quizModeMeta')).toContainText('1 לחזרה');
    await page.evaluate(() => startQuiz());
    const reviewEntry = await page.evaluate(i => quizQuestions.findIndex(e => e.id === i), id);
    expect(reviewEntry).toBeGreaterThanOrEqual(0);
    await page.evaluate(i => { quizIndex = i; renderQuestion(); }, reviewEntry);
    await answer(page, true);
    expect(await page.evaluate(() => reviewState.pipe.review)).toEqual([]);
  });

  test('well-known questions show up less often in later cycles', async ({ page }) => {
    await fresh(page);
    const order = await page.evaluate(() => {
      const state = leitner('pipe');
      for (let id = 0; id < 15; id++) state.boxes[id] = id < 5 ? 0 : id < 10 ? 2 : 3;
      return [1, 2, 3, 4].map(cycle => startCycle('pipe', { cycle }).order.slice().sort((a, b) => a - b));
    });
    expect(order[0]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(order[1]).toEqual([0, 1, 2, 3, 4]);
    expect(order[2]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    expect(order[3]).toEqual([0, 1, 2, 3, 4]);
  });

  test('progress saved before this version still counts', async ({ page }) => {
    const order = Array.from({ length: 92 }, (_, i) => 91 - i);
    await fresh(page, { levelProgress: JSON.stringify({ intro: { order, pos: 24 } }), quizStats: JSON.stringify({ correct: 30, answered: 40 }) });
    await expect(page.locator('#quizModeMeta')).toContainText('24/92');
    await expect(page.locator('#learnedCount')).toHaveText('30');
    await expect(page.locator('#bestScore')).toHaveText('75%');
    await page.evaluate(() => startQuiz());
    expect(await page.evaluate(() => quizQuestions.map(e => e.id))).toEqual(expect.arrayContaining(order.slice(24, 44)));
  });
});

test.describe('stats', () => {
  test('per level and per command, with the weakest commands listed', async ({ page }) => {
    await fresh(page);
    await expect(page.locator('#levelStats')).toContainText('עוד אין נתונים');
    await page.evaluate(() => { selectLevel('pipe'); startQuiz(); });
    for (let i = 0; i < 4; i++) { await answer(page, i === 0); await next(page); }
    const s = await page.evaluate(() => stats);
    expect(s.byLevel.pipe).toEqual({ a: 4, c: 1 });
    const total = Object.values(s.byCommand).reduce((n, v) => n + v.a, 0);
    expect(total).toBeGreaterThanOrEqual(4);
    await page.evaluate(() => goHome());
    await expect(page.locator('.level-stat')).toHaveCount(1);
    await expect(page.locator('.level-stat b')).toHaveText('25%');
  });
});

test.describe('stage 02 scope', () => {
  test('core has its own progress and leaves the full progress alone', async ({ page }) => {
    await fresh(page, { levelProgress: JSON.stringify({ functions: { order: Array.from({ length: 450 }, (_, i) => i), pos: 7 } }) });
    await page.evaluate(() => selectLevel('functions'));
    await expect(page.locator('#scopeToggle')).toBeVisible();
    await expect(page.locator('#quizModeMeta')).toContainText('7/450');
    await page.click('#scopeToggle [data-value=core]');
    await expect(page.locator('#quizModeMeta')).toContainText('0/167');
    await page.evaluate(() => startQuiz());
    expect(await page.evaluate(() => quizQuestions.every(e => CORE_GUIDE_IDS.includes(e.id)))).toBe(true);
    expect(await page.evaluate(() => quizQuestions.every(e => e.q.options.every(o => CORE_GUIDE_IDS.map(i => guideUses[i].meaning).includes(o.key))))).toBe(true);
    await page.evaluate(() => goHome());
    await page.click('#scopeToggle [data-value=all]');
    await expect(page.locator('#quizModeMeta')).toContainText('7/450');
    await page.evaluate(() => selectLevel('pipe'));
    await expect(page.locator('#scopeToggle')).toBeHidden();
  });
});

test.describe('typing mode', () => {
  test('lenient matching accepts equivalent commands and rejects wrong ones', async ({ page }) => {
    await fresh(page);
    const result = await page.evaluate(() => {
      const same = (a, b) => canonicalCommand(a) === canonicalCommand(b);
      return {
        accepted: [['ls -la', 'ls -l -a'], ['ps -ef', 'ps -e -f'], ['du -sh logs', 'du -h -s logs/'], ['ls|grep log', 'ls | grep log'],
          ["find . -name '*.conf'", 'find . -name "*.conf"'], ['sort -rn x', 'sort -n -r x'], ['tar -czf b.tgz c', 'tar -c -z -f b.tgz c']].map(([a, b]) => same(a, b)),
        rejected: [['ls -l', 'ls -l -a'], ['grep log | ls', 'ls | grep log'], ['ssh -P 2220 h', 'ssh -p 2220 h'], ['cmd1 ; rm x', 'cmd1 && rm x'], ['find . -maxdepth 2', 'find . -m -a -x -d -e -p -t -h 2']].map(([a, b]) => same(a, b)),
      };
    });
    expect(result.accepted.every(Boolean)).toBe(true);
    expect(result.rejected.some(Boolean)).toBe(false);
  });

  test('typing flow: correct, wrong and "I don\'t know"', async ({ page }) => {
    const errors = await fresh(page, { answerMode: 'type' });
    await expect(page.locator('#modeToggle [data-value=type]')).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => { selectLevel('workflow'); startQuiz(); });
    const right = await page.evaluate(() => quizQuestions[0].q.answer);
    await page.fill('#typeInput', right.replace(/ -([a-z]) -([a-z])/, ' -$1$2'));
    await page.press('#typeInput', 'Enter');
    await expect(page.locator('#typeInput')).toHaveClass(/correct/);
    await expect(page.locator('#feedback')).toContainText('נכון!');
    await next(page);
    await page.fill('#typeInput', 'ls');
    await page.click('.type-actions .primary-btn');
    await expect(page.locator('#typeInput')).toHaveClass(/wrong/);
    await expect(page.locator('#feedback')).toContainText('התשובה:');
    await next(page);
    await page.click('.type-actions .secondary-btn');
    await expect(page.locator('#feedback')).toContainText('התשובה:');
    expect(await page.evaluate(() => [stats.answered, stats.correct, reviewState.workflow.review.length])).toEqual([3, 1, 2]);
    expect(errors).toEqual([]);
  });

  test('description answers stay multiple choice, with a note', async ({ page }) => {
    await fresh(page, { answerMode: 'type' });
    await page.evaluate(() => selectLevel('functions'));
    await expect(page.locator('#typeNote')).toBeVisible();
    await page.evaluate(() => startQuiz());
    await expect(page.locator('.answer')).toHaveCount(4);
    await page.evaluate(() => { goHome(); selectLevel('intro'); });
    await expect(page.locator('#typeNote')).toBeHidden();
    const kinds = await page.evaluate(() => { startQuiz(); return quizQuestions.map(e => [e.q.typed === true, e.id % 2 === 0]); });
    for (const [typed, forward] of kinds) expect(typed).toBe(forward);
  });

  test('the empty input is not submitted', async ({ page }) => {
    await fresh(page, { answerMode: 'type' });
    await page.evaluate(() => { selectLevel('pipe'); startQuiz(); });
    await page.press('#typeInput', 'Enter');
    expect(await page.evaluate(() => [quizLocked, stats.answered])).toEqual([false, 0]);
  });

  test('English typing flow has no Hebrew', async ({ page }) => {
    await fresh(page, { answerMode: 'type', lang: 'en' });
    await page.evaluate(() => { selectLevel('pipe'); startQuiz(); });
    await page.fill('#typeInput', 'nope');
    await page.click('.type-actions .primary-btn');
    await expect(page.locator('#feedback')).toContainText('Answer:');
    const hebrew = await page.evaluate(() => [...document.querySelectorAll('#quiz *')].filter(e => e.children.length === 0 && e.offsetParent !== null && /[֐-׿]/.test(e.textContent + (e.placeholder || ''))).length);
    expect(hebrew).toBe(0);
  });
});
