const { test, expect } = require('@playwright/test');

async function fresh(page, setup = {}) {
  await page.goto('./');
  await page.evaluate(values => { localStorage.clear(); for (const [k, v] of Object.entries(values)) localStorage.setItem(k, v); }, setup);
  await page.reload();
  await page.waitForFunction(() => typeof startQuiz === 'function');
}

const SCENARIO_LEVELS = { pipe: 'pipeScenarios', pipeFunction: 'pipeFlagScenarios', pro: 'professionalScenarios', pipeTwoFlag: 'pipeTwoFlagScenarios', workflow: 'workflowScenarios', bandit: 'banditScenarios' };

for (const lang of ['he', 'en']) {
  test(`every wrong option shows its own explanation (${lang})`, async ({ page }) => {
    await fresh(page, { lang });
    const problems = await page.evaluate(levels => {
      const POOLS = { pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios, banditScenarios };
      const out = [];
      for (const [level, pool] of Object.entries(levels)) {
        selectLevel(level);
        POOLS[pool].forEach((scenario, id) => {
          if (!Array.isArray(scenario.why) || scenario.why.length !== scenario.wrong.length || scenario.why.some(w => !w)) { out.push(`${level}#${id} missing why`); return; }
          scenario.wrong.forEach((wrong, j) => {
            quizQuestions = [makeEntry(level, id, {})]; quizIndex = 0; showScreen('quiz'); renderQuestion();
            [...document.querySelectorAll('.answer')].find(b => b.dataset.answer === wrong).click(); clearTimeout(questionTimer);
            const text = document.getElementById('feedback').textContent;
            if (!text.startsWith(t('whyNot') + scenario.why[j])) out.push(`${level}#${id} wrong ${j}`);
            if (!text.includes(scenario.explanation)) out.push(`${level}#${id} explanation missing`);
          });
        });
      }
      return out;
    }, Object.fromEntries(Object.entries(SCENARIO_LEVELS).map(([k, v]) => [k, v])));
    expect(problems).toEqual([]);
  });
}

test('explanations are distinct within a question and never repeat the right answer\'s explanation', async ({ page }) => {
  await fresh(page);
  const problems = await page.evaluate(levels => { const POOLS = { pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios, banditScenarios }; return Object.values(levels).flatMap(pool => POOLS[pool].flatMap((s, i) => {
    const out = [];
    if (new Set(s.why).size !== s.why.length && !s.why.every(w => w.includes('הסדר הפוך'))) out.push(`${pool}#${i} duplicate`);
    if (s.why.includes(s.explanation)) out.push(`${pool}#${i} copies the explanation`);
    return out;
  })); }, SCENARIO_LEVELS);
  expect(problems).toEqual([]);
});

test('stage 01 and 02 explain what the chosen option really is', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    const pick = (level, id, choose) => {
      selectLevel(level); quizQuestions = [makeEntry(level, id, {})]; quizIndex = 0; showScreen('quiz'); renderQuestion();
      const q = quizQuestions[0].q, option = choose(q);
      [...document.querySelectorAll('.answer')].find(b => b.dataset.answer === option).click(); clearTimeout(questionTimer);
      return { option, text: document.getElementById('feedback').textContent };
    };
    const forward = pick('intro', 2 * commands.findIndex(c => c.name === 'cp'), q => q.options.find(o => o.key !== q.answer).key);
    const reverse = pick('intro', 2 * commands.findIndex(c => c.name === 'cp') + 1, q => q.options.find(o => o.key !== q.answer).key);
    const usage = pick('functions', guideUses.findIndex(u => u.command === 'gzip' && u.usage === '-d'), q => q.options.find(o => o.key !== q.answer).key);
    const forwardCmd = commands.find(c => c.name === forward.option);
    const reverseCmd = commands.find(c => c.meaning === reverse.option);
    const usageEntry = guideUses.find(u => u.meaning === usage.option && u.command === 'gzip');
    return {
      forward: forward.text.startsWith(`למה לא: ${fullName(forwardCmd.name)}: ${forwardCmd.meaning}`),
      reverse: reverse.text.startsWith(`למה לא: זה התיאור של ⁦${reverseCmd.name}⁩`),
      usage: usage.text.startsWith(`למה לא: זה התיאור של ⁦${guideSyntax(usageEntry)}⁩`),
    };
  });
  expect(r).toEqual({ forward: true, reverse: true, usage: true });
});

test('typing a known wrong option explains it, an unknown one does not invent a reason', async ({ page }) => {
  await fresh(page, { answerMode: 'type' });
  const r = await page.evaluate(() => {
    const id = workflowScenarios.findIndex(s => s.answer.startsWith('scp -i KEY -P 2220 report.txt'));
    const run = typed => {
      selectLevel('workflow'); quizQuestions = [makeEntry('workflow', id, {})]; quizIndex = 0; showScreen('quiz'); renderQuestion();
      document.getElementById('typeInput').value = typed; document.querySelector('.type-actions .primary-btn').click(); clearTimeout(questionTimer);
      return document.getElementById('feedback').textContent;
    };
    return { known: run('scp -i KEY -P 2220 report.txt admin@server:/tmp/ ; rm report.txt'), unknown: run('ls -la') };
  });
  expect(r.known.startsWith('למה לא: עם ; הקובץ נמחק גם אם ההעתקה נכשלה.')).toBe(true);
  expect(r.unknown.startsWith('התשובה:')).toBe(true);
});
