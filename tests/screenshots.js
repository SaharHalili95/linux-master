// Captures the README screenshots on an iPhone-sized screen: `node screenshots.js` (site served on 8766).
// The README shows them combined into one image per section, and the GIFs are recorded separately.
const { chromium, devices } = require('@playwright/test');
const path = require('path');

const out = name => path.join(__dirname, '..', 'docs', 'screenshots', `${name}.jpg`);

(async () => {
  const browser = await chromium.launch();
  for (const lang of ['en', 'he']) {
    const context = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('http://localhost:8766/');
    await page.evaluate(l => { localStorage.clear(); localStorage.setItem('lang', l); }, lang);
    await page.reload();
    await page.waitForFunction(() => window.courseReady);
    // A learner who finished parts 1-7 and is midway through part 8.
    await page.evaluate(() => {
      const done = COURSE.filter(u => !u.exam && u.unit <= 68).flatMap(u => unitNodes(u).map(n => n.key));
      localStorage.setItem(STORE, JSON.stringify({ xp: 5240, gems: 310, streak: 23, lastDay: dayKey(), days: [dayKey()], done }));
    });
    await page.reload();
    await page.waitForFunction(() => window.courseReady);
    const shot = async name => { await page.waitForTimeout(400); await page.screenshot({ path: out(`${name}-${lang}`), type: 'jpeg', quality: 82 }); };
    const toUnit = unit => page.evaluate(u => { document.querySelector(`.unit-banner[data-unit="${u}"]`).scrollIntoView({ block: 'center' }); scrollBy(0, 120); }, unit);

    await toUnit(69);
    await shot('learn-home');

    await page.evaluate(() => { const unit = COURSE.find(u => u.unit === 7); const ex = unit.lessons[0].exercises; startLesson('u7-L0', withFixture(unit, ex.slice(ex.findIndex(e => e.type === 'terminal')))); });
    const input = page.locator('#lesson textarea').first();
    await input.fill('grep "started$" logs/app.log');
    await input.press('Enter');
    await page.evaluate(() => document.activeElement.blur());
    await shot('learn-terminal');
    await page.evaluate(() => closeOverlays());
    if (lang !== 'en') { await context.close(); continue; }

    await page.evaluate(() => openTracks());
    await shot('learn-tracks');
    await page.evaluate(() => { document.getElementById('trackSheet').hidden = true; });

    await page.evaluate(() => { const unit = COURSE.find(u => u.unit === 4); const ex = unit.lessons[0].exercises; startLesson('u4-L0', withFixture(unit, ex.slice(ex.findIndex(e => e.type === 'choice' && e.why)))); });
    await page.locator('#exBody .opt').filter({ hasText: 'grep notes.txt milk' }).click();
    await page.locator('#checkBtn').click();
    await shot('learn-why');

    for (const unit of [78, 79]) {
      await page.evaluate(u => { closeOverlays(); startExam(COURSE.find(c => c.unit === u), `u${u}-exam`); }, unit);
      await shot(`learn-exam${unit}`);
    }
    await context.close();
  }
  await browser.close();
})();
