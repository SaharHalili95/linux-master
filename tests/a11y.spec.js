const { test, expect } = require('@playwright/test');
const { default: AxeBuilder } = require('@axe-core/playwright');

// WCAG 2.1 A and AA on every screen, in both languages. Animations are turned off so
// colors are measured at their final values.
const screens = {
  home: async () => {},
  tutorials: page => page.evaluate(() => openTutorials()),
  bandit: page => page.evaluate(() => openBandit()),
  quizChoice: page => page.evaluate(() => { selectLevel('pipe'); startQuiz(); }),
  quizFeedback: page => page.evaluate(() => { selectLevel('pipe'); startQuiz(); document.querySelector('.answer').click(); clearTimeout(questionTimer); }),
  quizTyping: page => page.evaluate(() => { setAnswerMode('type'); selectLevel('workflow'); startQuiz(); }),
  result: page => page.evaluate(() => { selectLevel('pipe'); startQuiz(); while (!document.getElementById('result').classList.contains('active')) { const e = quizQuestions[quizIndex]; [...document.querySelectorAll('.answer')].find(b => b.dataset.answer === e.q.answer).click(); clearTimeout(questionTimer); nextQuestion(); } }),
};

for (const lang of ['he', 'en']) {
  for (const [name, open] of Object.entries(screens)) {
    test(`accessibility: ${name} (${lang})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('./');
      await page.evaluate(l => { localStorage.clear(); localStorage.setItem('lang', l); }, lang);
      await page.reload();
      await page.waitForFunction(() => typeof startQuiz === 'function');
      await open(page);
      await page.waitForTimeout(300);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const problems = results.violations.map(v => `${v.id} (${v.impact}): ${v.nodes.length}x ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(', ')}`);
      expect(problems).toEqual([]);
    });
  }
}
