const { test, expect } = require('@playwright/test');

async function fresh(page, setup = {}) {
  await page.goto('./');
  await page.evaluate(values => { localStorage.clear(); for (const [k, v] of Object.entries(values)) localStorage.setItem(k, v); }, setup);
  await page.reload();
  await page.waitForFunction(() => typeof startQuiz === 'function');
}

test('the Bandit map lists all 34 levels with official links, and remembers passed levels', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await fresh(page);
  await page.click('button:has-text("פתיחת המסלול")');
  await expect(page.locator('.bandit-row')).toHaveCount(34);
  await expect(page.locator('.bandit-row').first().locator('a')).toHaveAttribute('href', 'https://overthewire.org/wargames/bandit/bandit0.html');
  await expect(page.locator('.bandit-row').nth(13).locator('strong')).toHaveText('משלב 12 לשלב 13');
  await expect(page.locator('#banditProgress')).toHaveText('עברת 0 מתוך 34 שלבים');
  await page.locator('.bandit-row').nth(3).locator('input').check();
  await expect(page.locator('#banditProgress')).toHaveText('עברת 1 מתוך 34 שלבים');
  await page.reload();
  await page.evaluate(() => openBandit());
  await expect(page.locator('.bandit-row').nth(3)).toHaveClass(/done/);
  expect(errors).toEqual([]);
});

test('the Bandit map in English', async ({ page }) => {
  await fresh(page, { lang: 'en' });
  await page.click('button:has-text("Open the path")');
  await expect(page.locator('.bandit-row').nth(13).locator('strong')).toHaveText('Level 12 → 13');
  const hebrew = await page.evaluate(() => [...document.querySelectorAll('#bandit *')].filter(e => e.children.length === 0 && e.offsetParent !== null && /[֐-׿]/.test(e.textContent)).length);
  expect(hebrew).toBe(0);
});

test('practice button starts level 08', async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => openBandit());
  await page.click('button:has-text("תרגול שלב 08")');
  await expect(page.locator('#questionTag')).toContainText('שלב 08');
});

test('typing accepts listed alternatives and does not leak the answer in hints', async ({ page }) => {
  await fresh(page, { answerMode: 'type' });
  const result = await page.evaluate(async () => {
    selectLevel('bandit');
    const find = answer => banditScenarios.findIndex(s => s.answer === answer);
    const run = async (id, typed) => {
      quizQuestions = [makeEntry('bandit', id, {})]; quizIndex = 0; quizPoints = 0; quizAnswered = 0; showScreen('quiz'); renderQuestion();
      const hint = document.querySelector('.type-hint')?.textContent || '';
      document.getElementById('typeInput').value = typed; document.querySelector('.type-actions .primary-btn').click(); clearTimeout(questionTimer);
      return { ok: document.getElementById('typeInput').classList.contains('correct'), hint };
    };
    return {
      dashAlt: await run(find('cat ./-'), 'cat < -'),
      dash: await run(find('cat ./-'), 'cat -'),
      spaces: await run(find('cat -- "--spaces in this filename--"'), 'cat ./"--spaces in this filename--"'),
      nc: await run(find('nc localhost 30000 < pass.txt'), 'cat pass.txt | nc localhost 30000'),
      clone: await run(find('git clone ssh://user@host:2220/home/repo'), 'git clone ssh://user@host:2220/home/repo'),
    };
  });
  expect(result.dashAlt.ok).toBe(true);
  expect(result.dash.ok).toBe(false);
  expect(result.dash.hint).not.toContain('./-');
  expect(result.spaces.ok).toBe(true);
  expect(result.nc.ok).toBe(true);
  expect(result.clone.ok).toBe(true);
  expect(result.clone.hint).not.toContain('ssh://');
});
