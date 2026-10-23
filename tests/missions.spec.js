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

test('every mission can be solved with its reference command, and passwords change every time', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => MISSIONS.map(m => {
    const a = missionPassword(), b = missionPassword();
    const out = new Shell(m.build(a)).run(m.solution);
    return { level: m.level, solved: out.out.includes(a), fresh: a !== b, err: out.err };
  }));
  expect(r.length).toBe(12);
  for (const m of r) expect(m, `level ${m.level}`).toEqual({ level: m.level, solved: true, fresh: true, err: '' });
});

test('the discovery commands point to exactly one answer, like in Bandit', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    const run = (level, cmd) => new Shell(MISSIONS.find(m => m.level === level).build(missionPassword())).run(cmd).out.trim().split('\n');
    return {
      hidden: run(4, 'ls -a inhere'),
      readable: run(5, 'file ./inhere/*').filter(l => l.includes('ASCII text')),
      sized: run(6, 'find inhere -type f -size 1033c ! -executable'),
      owned: run(7, 'find / -user bandit7 -group bandit6 -size 33c 2>/dev/null'),
    };
  });
  expect(r.hidden).toEqual(['.', '..', '...Hiding-From-You']);
  expect(r.readable).toEqual(['./inhere/-file07: ASCII text']);
  expect(r.sized).toEqual(['inhere/maybehere07/.file2']);
  expect(r.owned).toEqual(['/var/lib/dpkg/info/bandit7.password']);
});

test('playing a mission end to end with the keyboard', async ({ page }) => {
  const errors = await fresh(page);
  await page.click('button:has-text("משימות בטרמינל")');
  await expect(page.locator('.mission-card')).toHaveCount(12);
  await expect(page.locator('#missionsProgress')).toHaveText('פתרתם 0 מתוך 12');
  await page.locator('.mission-card').nth(1).click();
  await expect(page.locator('#missionTitle')).toHaveText('משימה 2');
  const term = page.locator('#termInput');
  await term.fill('ls'); await term.press('Enter');
  await expect(page.locator('#termOutput')).toContainText('bandit@bandit:~$ ls\n-\n');
  await term.fill('cat -'); await term.press('Enter');
  await expect(page.locator('#termOutput')).toContainText('waiting for keyboard input');
  await term.fill('cat ./-'); await term.press('Enter');
  const password = await page.evaluate(() => mission.password);
  await expect(page.locator('#termOutput')).toContainText(password);
  await term.press('ArrowUp');
  await expect(term).toHaveValue('cat ./-');
  await page.fill('#missionPassword', 'wrong-guess');
  await page.click('button:has-text("בדיקת סיסמה")');
  await expect(page.locator('#missionResult')).toHaveText('זו לא הסיסמה. המשיכו לחפש.');
  await page.fill('#missionPassword', `  ${password} `);
  await page.click('button:has-text("בדיקת סיסמה")');
  await expect(page.locator('#missionResult')).toHaveText('נכון! מצאתם את הסיסמה.');
  await expect(page.locator('#missionNextBtn')).toBeVisible();
  await page.click('#missionNextBtn');
  await expect(page.locator('#missionTitle')).toHaveText('משימה 3');
  await page.reload();
  await page.evaluate(() => openMissions());
  await expect(page.locator('.mission-card').nth(1)).toHaveClass(/done/);
  await expect(page.locator('#missionsProgress')).toHaveText('פתרתם 1 מתוך 12');
  expect(errors).toEqual([]);
});

test('terminal basics: cd changes the prompt, help, clear, and unknown commands', async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => openMission(4));
  const term = page.locator('#termInput');
  await term.fill('cd inhere'); await term.press('Enter');
  await expect(page.locator('#termPrompt')).toHaveText('bandit@bandit:~/inhere$ ');
  await term.fill('pwd'); await term.press('Enter');
  await expect(page.locator('#termOutput')).toContainText('/home/bandit/inhere');
  await term.fill('nmap localhost'); await term.press('Enter');
  await expect(page.locator('#termOutput')).toContainText('nmap: הפקודה הזו לא זמינה בטרמינל המדומה');
  await term.fill('help'); await term.press('Enter');
  await expect(page.locator('#termOutput')).toContainText('פקודות זמינות:');
  await term.fill('clear'); await term.press('Enter');
  await expect(page.locator('#termOutput')).toHaveText('');
  await page.click('button:has-text("רמז")');
  await expect(page.locator('#missionHintText')).toContainText('ls -a');
});

test('the Bandit map links levels 1-12 to their missions', async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => openBandit());
  await expect(page.locator('.bandit-row button:has-text("תרגול במשימה")')).toHaveCount(12);
  await page.locator('.bandit-row').nth(12).locator('button:has-text("תרגול במשימה")').click();
  await expect(page.locator('#missionTitle')).toHaveText('משימה 12');
});

test('missions in English have no Hebrew', async ({ page }) => {
  await fresh(page, { lang: 'en' });
  await page.evaluate(() => openMission(1));
  await page.fill('#termInput', 'cat readme'); await page.press('#termInput', 'Enter');
  await page.fill('#missionPassword', 'x'); await page.click('button:has-text("Check password")');
  const hebrew = await page.evaluate(() => [...document.querySelectorAll('#missions *')].filter(e => e.children.length === 0 && e.offsetParent !== null && /[֐-׿]/.test(e.textContent + (e.placeholder || ''))).map(e => e.textContent.slice(0, 40)));
  expect(hebrew).toEqual([]);
});
