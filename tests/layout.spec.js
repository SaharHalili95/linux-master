const { test, expect } = require('@playwright/test');

// Renders every question of every level, in both answer modes and both languages, and
// checks that nothing makes the page scroll sideways. Runs on the narrowest phones.
for (const lang of ['he', 'en']) {
  test(`every question fits the screen (${lang})`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('./?mode=trivia');
    await page.evaluate(l => { localStorage.clear(); localStorage.setItem('lang', l); }, lang);
    await page.reload();
    await page.waitForFunction(() => typeof startQuiz === 'function');
    const overflow = await page.evaluate(() => {
      const bad = [];
      const width = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;
      for (const mode of ['choice', 'type']) {
        setAnswerMode(mode);
        for (const level of Object.keys(levelQuiz)) {
          selectLevel(level);
          for (const id of levelQuiz[level].ids()) {
            quizQuestions = [makeEntry(level, id, {})]; quizIndex = 0; showScreen('quiz'); renderQuestion();
            if (width() > 0) bad.push(`${mode} ${level} #${id} +${width()}px`);
            const first = document.querySelector('.answer');
            if (first) { first.click(); clearTimeout(questionTimer); if (width() > 0) bad.push(`${mode} ${level} #${id} feedback +${width()}px`); }
          }
        }
      }
      return bad;
    });
    expect(overflow).toEqual([]);
    expect(errors).toEqual([]);
  });
}
