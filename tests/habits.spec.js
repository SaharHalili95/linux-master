const { test, expect } = require('@playwright/test');
const fs = require('fs');

async function fresh(page, setup = {}) {
  await page.goto('./');
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
    expect(Object.keys(after)).toEqual(expect.arrayContaining(['quizStats', 'levelProgress', 'reviewState', 'banditDone', 'daily']));
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

test.describe('daily goal and streak', () => {
  test('answers count toward today, retries do not', async ({ page }) => {
    await fresh(page);
    await page.evaluate(() => { selectLevel('pipe'); startQuiz(); const e = quizQuestions[0]; [...document.querySelectorAll('.answer')].find(b => b.dataset.answer !== e.q.answer).click(); clearTimeout(questionTimer); });
    await page.evaluate(() => { quizIndex = quizQuestions.findIndex((e, i) => i > 0 && e.retry); renderQuestion(); document.querySelector('.answer').click(); clearTimeout(questionTimer); goHome(); });
    await expect(page.locator('#dailyProgress')).toHaveText('היום 1/20');
    expect(await page.evaluate(() => [document.getElementById('dailyBar').value, document.getElementById('dailyBar').max])).toEqual([1, 20]);
  });

  test('streak counts consecutive days that met the goal', async ({ page }) => {
    await fresh(page);
    const r = await page.evaluate(() => {
      const now = new Date(2026, 9, 23, 12);
      const key = offset => dayKey(new Date(2026, 9, 23 + offset));
      return {
        none: streakDays({}, 20, now),
        todayMet: streakDays({ [key(0)]: 20, [key(-1)]: 25, [key(-2)]: 20, [key(-3)]: 5 }, 20, now),
        todayPending: streakDays({ [key(0)]: 3, [key(-1)]: 20, [key(-2)]: 20 }, 20, now),
        gap: streakDays({ [key(0)]: 20, [key(-2)]: 20 }, 20, now),
        monthEdge: streakDays({ [dayKey(new Date(2026, 10, 1))]: 10, [dayKey(new Date(2026, 9, 31))]: 10 }, 10, new Date(2026, 10, 1, 9)),
      };
    });
    expect(r).toEqual({ none: 0, todayMet: 3, todayPending: 2, gap: 1, monthEdge: 2 });
  });

  test('changing the goal is saved and updates the streak', async ({ page }) => {
    await fresh(page);
    await page.evaluate(() => { daily[dayKey(new Date())] = 12; save('daily', daily); renderDaily(); });
    await expect(page.locator('#streak')).toHaveText('');
    await page.click('#goalToggle [data-value="10"]');
    await expect(page.locator('#streak')).toHaveText('🔥 יום אחד ברצף');
    await page.reload();
    await expect(page.locator('#goalToggle [data-value="10"]')).toHaveAttribute('aria-pressed', 'true');
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
