// Captures the README screenshots on an iPhone-sized screen: `node screenshots.js` (site served on 8766).
const { chromium, devices } = require('@playwright/test');
const path = require('path');

const out = name => path.join(__dirname, '..', 'docs', 'screenshots', `${name}.jpg`);
const sampleProgress = {
  quizStats: JSON.stringify({ correct: 412, answered: 498, byLevel: { intro: { a: 180, c: 162 }, functions: { a: 140, c: 101 }, pipe: { a: 60, c: 52 }, workflow: { a: 40, c: 27 } }, byCommand: { find: { a: 30, c: 17 }, tar: { a: 12, c: 7 }, awk: { a: 14, c: 9 }, sort: { a: 40, c: 31 } } }),
  daily: JSON.stringify({ [new Date().toISOString().slice(0, 10)]: 14 }),
};

(async () => {
  const browser = await chromium.launch();
  for (const lang of ['en', 'he']) {
    const context = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('http://localhost:8766/');
    await page.evaluate(([l, p]) => { localStorage.clear(); localStorage.setItem('lang', l); for (const [k, v] of Object.entries(p)) localStorage.setItem(k, v); }, [lang, sampleProgress]);
    await page.reload();
    await page.waitForFunction(() => typeof startQuiz === 'function');
    const shot = async name => { await page.waitForTimeout(250); await page.screenshot({ path: out(`${name}-${lang}`), type: 'jpeg', quality: 82 }); };

    await shot('home');

    await page.evaluate(() => { setAnswerMode('type'); const id = pipeFlagScenarios.findIndex(s => s.answer === 'cat names1.txt names2.txt | sort -u'); selectLevel('pipeFunction'); quizQuestions = [makeEntry('pipeFunction', id, {})]; quizIndex = 0; showScreen('quiz'); renderQuestion(); document.getElementById('typeInput').value = 'sort -u names1.txt names2.txt'; document.querySelector('.type-actions .primary-btn').click(); clearTimeout(questionTimer); window.scrollTo(0, 0); });
    await shot('typing-alternative');

    await page.evaluate(() => { setAnswerMode('choice'); const id = workflowScenarios.findIndex(s => s.answer.startsWith('scp -i KEY -P 2220 report.txt')); selectLevel('workflow'); quizQuestions = [makeEntry('workflow', id, {})]; quizIndex = 0; showScreen('quiz'); renderQuestion(); [...document.querySelectorAll('.answer')].find(b => b.dataset.answer.includes('; rm')).click(); clearTimeout(questionTimer); document.getElementById('feedback').scrollIntoView({ block: 'center' }); });
    await shot('why-wrong');

    await page.evaluate(() => { openMission(6); runTerminal('ls inhere | head -n 3'); runTerminal('find inhere -type f -size 1033c ! -executable'); window.scrollTo(0, document.getElementById('missionGoal').offsetTop - 80); });
    await shot('mission-terminal');

    await page.evaluate(() => { openBandit(); });
    await shot('bandit-map');

    await page.evaluate(() => { goHome(); document.querySelector('.stats-panel').scrollIntoView({ block: 'start' }); window.scrollBy(0, -20); });
    await shot('stats');
    await context.close();
  }
  await browser.close();
})();
