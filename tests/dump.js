// Exports the Hebrew scenario data from a running site for the Ubuntu sandbox check.
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(new URL('?mode=trivia', process.env.BASE_URL || 'http://localhost:8766/').href);
  await page.evaluate(() => localStorage.setItem('lang', 'he'));
  await page.reload();
  const data = await page.evaluate(() => ({ pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios, banditScenarios }));
  require('fs').writeFileSync('data.json', JSON.stringify(data, null, 1));
  await browser.close();
})();
