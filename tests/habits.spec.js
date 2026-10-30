const { test, expect } = require('@playwright/test');
const fs = require('fs');

async function fresh(page, setup = {}) {
  await page.goto('./?mode=trivia');
  await page.evaluate(values => { localStorage.clear(); for (const [k, v] of Object.entries(values)) localStorage.setItem(k, v); }, setup);
  await page.reload();
  await page.waitForFunction(() => typeof startQuiz === 'function');
}

test.describe('backup', () => {
  test('export, wipe and restore gives back exactly the same progress', async ({ page }) => {
    await fresh(page, { lang: 'he' });
    await page.evaluate(() => { selectLevel('pipe'); startQuiz(); for (let i = 0; i < 3; i++) { document.querySelector('.answer').click(); clearTimeout(questionTimer); nextQuestion(); } goHome(); });
    await page.evaluate(() => { openBandit(); document.querySelector('.bandit-row input').click(); });
    const before = await page.evaluate(() => Object.fromEntries(BACKUP_KEYS.map(k => [k, localStorage.getItem(k)]).filter(([, v]) => v !== null)));
    const code = await page.evaluate(() => encodeBackup());
    await page.evaluate(() => localStorage.clear());
    page.once('dialog', d => d.accept());
    const reloaded = page.waitForEvent('load');
    await page.evaluate(c => restoreBackup(c), code);
    await reloaded;
    const after = await page.evaluate(() => Object.fromEntries(BACKUP_KEYS.map(k => [k, localStorage.getItem(k)]).filter(([, v]) => v !== null)));
    expect(after).toEqual(before);
    expect(Object.keys(after)).toEqual(expect.arrayContaining(['quizStats', 'levelProgress', 'reviewState', 'banditDone']));
  });

  test('a broken or foreign code is refused and nothing changes', async ({ page }) => {
    await fresh(page, { quizStats: JSON.stringify({ correct: 5, answered: 9 }) });
    const messages = [];
    page.on('dialog', d => { messages.push(d.message()); d.dismiss(); });
    for (const bad of ['not base64 at all', btoa('{"app":"other","format":1,"data":{}}'), btoa('{"app":"linux-master","format":2,"data":{}}'), '']) {
      expect(await page.evaluate(c => restoreBackup(c), bad)).toBe(false);
    }
    expect(messages.every(m => m.includes('אינם גיבוי תקין'))).toBe(true);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('quizStats')).correct)).toBe(5);
  });

  test('restore ignores keys that are not part of the app', async ({ page }) => {
    await fresh(page);
    const data = await page.evaluate(() => decodeBackup(btoa(JSON.stringify({ app: 'linux-master', format: 1, data: { quizStats: '{}', evil: 'x', lang: 'en' } }))));
    expect(data).toEqual({ quizStats: '{}', lang: 'en' });
  });

  test('the backup file downloads and restores', async ({ page }, testInfo) => {
    await fresh(page, { quizStats: JSON.stringify({ correct: 7, answered: 10 }) });
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("הורדת קובץ גיבוי")')]);
    expect(download.suggestedFilename()).toMatch(/^linux-master-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const file = testInfo.outputPath('backup.json');
    await download.saveAs(file);
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
    await page.evaluate(() => localStorage.setItem('quizStats', JSON.stringify({ correct: 0, answered: 0 })));
    page.once('dialog', d => d.accept());
    const reloaded = page.waitForEvent('load');
    await page.setInputFiles('#restoreFile', { name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
    await reloaded;
    await expect(page.locator('#learnedCount')).toHaveText('7');
  });
});

test.describe('questions per round', () => {
  for (const size of [5, 10, 20]) {
    test(`a round has ${size} questions, reviews included`, async ({ page }) => {
      await fresh(page, { reviewState: JSON.stringify({ intro: { boxes: {}, review: [1, 3, 5, 7, 9, 11, 13] } }) });
      await page.click(`#sizeToggle [data-value="${size}"]`);
      const r = await page.evaluate(() => { selectLevel('intro'); startQuiz(); return { total: quizQuestions.length, reviews: quizQuestions.filter(e => e.review).length, counter: document.getElementById('quizCounter').textContent }; });
      expect(r.total).toBe(size);
      expect(r.reviews).toBeLessThanOrEqual(Math.ceil(size / 4));
      expect(r.reviews).toBeGreaterThan(0);
      expect(r.counter).toBe(`01 / ${size}`);
    });
  }

  test('the choice is saved, shown on the level and kept in backups', async ({ page }) => {
    await fresh(page);
    await expect(page.locator('#sizeToggle [data-value="20"]')).toHaveAttribute('aria-pressed', 'true');
    await page.click('#sizeToggle [data-value="5"]');
    await expect(page.locator('#quizModeMeta')).toContainText('סבבים של 5');
    await page.reload();
    await expect(page.locator('#sizeToggle [data-value="5"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => BACKUP_KEYS.includes('roundSize'))).toBe(true);
  });

  test('progress carries over between rounds of different sizes', async ({ page }) => {
    await fresh(page);
    await page.click('#sizeToggle [data-value="5"]');
    const r = await page.evaluate(() => {
      selectLevel('pipe'); startQuiz();
      const first = quizQuestions.map(e => e.id);
      while (!document.getElementById('result').classList.contains('active')) { document.querySelector('.answer').click(); clearTimeout(questionTimer); nextQuestion(); }
      setRoundSize(10); startQuiz();
      return { first, next: quizQuestions.filter(e => !e.review && !e.retry).map(e => e.id), pos: progress.pipe.pos };
    });
    expect(r.pos).toBe(5);
    expect(r.next.some(id => r.first.includes(id))).toBe(false);
  });
});

test('daily reminder is a valid repeating calendar event', async ({ page }) => {
  await fresh(page);
  await page.fill('#reminderTime', '07:30');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("הוספה ליומן")')]);
  expect(download.suggestedFilename()).toBe('linux-master-reminder.ics');
  const ics = fs.readFileSync(await download.path(), 'utf8');
  const lines = ics.split('\r\n');
  expect(lines[0]).toBe('BEGIN:VCALENDAR');
  expect(lines).toContain('RRULE:FREQ=DAILY');
  expect(lines.find(l => l.startsWith('DTSTART:'))).toMatch(/^DTSTART:\d{8}T073000$/);
  expect(lines).toContain('SUMMARY:תרגול Linux Master');
  expect(lines.filter(l => l.startsWith('BEGIN:')).length).toBe(lines.filter(l => l.startsWith('END:')).length);
});
