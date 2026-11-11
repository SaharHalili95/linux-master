const { test, expect } = require('@playwright/test');

test('a player can choose an appearance which survives reload without changing progress', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.setItem('linux-master-proto', JSON.stringify({ xp: 300, done: ['L0'], sound: false })); });
  await page.reload();
  await page.locator('[data-tab="profile"]').click();
  await expect(page.locator('#avatarPicker input[value="auto"]')).toBeChecked();
  await page.locator('#avatarPicker input[value="cyan"]').check();
  await expect(page.locator('#profileMascot .character-hero')).toHaveAttribute('data-avatar', 'cyan');
  await page.reload();
  await page.locator('[data-tab="profile"]').click();
  await expect(page.locator('#avatarPicker input[value="cyan"]')).toBeChecked();
  expect(await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('linux-master-proto')); return [s.avatarStyle, s.xp, s.done]; })).toEqual(['cyan', 300, ['L0']]);
});

test('world progress and mock exam medals reflect unique saved achievements', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.setItem('linux-master-proto', JSON.stringify({ done: ['L0', 'L0', 'u78-exam'], sound: false })); });
  await page.reload();
  await page.waitForFunction(() => window.courseReady);
  await page.locator('[data-tab="profile"]').click();
  await expect(page.locator('#worldProgress [data-world="1"]')).toContainText('1');
  await expect(page.locator('#mockMedals [data-exam="78"]')).toHaveAttribute('data-passed', 'true');
  await expect(page.locator('#mockMedals [data-exam="79"]')).toHaveAttribute('data-passed', 'false');
  await expect(page.locator('#mockMedals')).toContainText('דמה');
});

test('current lesson offers a contextual story without changing lesson entry', async ({ page }) => {
  await page.goto('./prototype/');
  await page.locator('.node.current').first().click();
  await expect(page.locator('#pop .story-mission')).toBeVisible();
  await page.locator('#pop .btn.primary').click();
  await expect(page.locator('#lesson')).toBeVisible();
});

test('avatar settings survive backup state validation and synchronize deterministically', async ({ page }) => {
  await page.goto('./prototype/');
  const merged = await page.evaluate(() => {
    const a = { xp: 100, avatarStyle: 'cyan', avatarUpdatedAt: 20, avatarForm: 'scout', avatarFormUpdatedAt: 60 };
    const b = { xp: 300, avatarStyle: 'violet', avatarUpdatedAt: 40, avatarForm: 'guardian', avatarFormUpdatedAt: 30 };
    const invalid = { avatarStyle: 'unexpected', avatarUpdatedAt: -1 };
    return [mergeProgress(a, b), mergeProgress(b, a), loadState(JSON.stringify(a)), loadState(JSON.stringify(invalid))];
  });
  expect(merged[0]).toMatchObject({ avatarStyle: 'violet', avatarUpdatedAt: 40, avatarForm: 'scout', avatarFormUpdatedAt: 60, xp: 300 });
  expect(merged[1]).toMatchObject({ avatarStyle: 'violet', avatarUpdatedAt: 40, avatarForm: 'scout', avatarFormUpdatedAt: 60, xp: 300 });
  expect(merged[2]).toMatchObject({ avatarStyle: 'cyan', avatarUpdatedAt: 20, xp: 100 });
  expect(merged[3]).toMatchObject({ avatarStyle: 'auto', avatarUpdatedAt: 0 });
});

for (const module of ['avatar-options.js', 'game-progress.js', 'story-missions.js']) test(`missing ${module} never resets existing progress or blocks lessons`, async ({ page }) => {
  await page.route(`**/prototype/${module}*`, route => route.abort());
  await page.addInitScript(() => { if (!localStorage.getItem('linux-master-proto')) localStorage.setItem('linux-master-proto', JSON.stringify({ xp: 300, done: ['L0'], sound: false, avatarStyle: 'cyan' })); });
  await page.goto('./prototype/');
  await expect(page.locator('.node.current').first()).toBeVisible();
  expect(await page.evaluate(() => [S.xp, S.done, S.avatarStyle])).toEqual([300, ['L0'], 'cyan']);
  await page.locator('.node.current').first().click();
  await page.locator('#pop .btn.primary').click();
  await expect(page.locator('#lesson')).toBeVisible();
});

test('story dialog action remains visible above navigation on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('./prototype/');
  await page.locator('.node.current').first().click();
  const action = page.locator('#pop .btn.primary');
  await expect(action).toBeVisible();
  await expect.poll(async () => {
    const button = await action.boundingBox();
    const nav = await page.locator('.tabbar').boundingBox();
    return Math.ceil(button.y + button.height - nav.y);
  }).toBeLessThanOrEqual(0);
  await expect(page.locator('#pop')).toHaveAccessibleName(/.+/);
});

test('each mock exam can generate varied practice attempts from its tagged content', async ({ page }) => {
  await page.goto('./prototype/');
  await page.waitForFunction(() => window.courseReady);
  const exams = await page.evaluate(() => COURSE.filter(unit => unit.exam).map(unit => {
    const attempts = Array.from({ length: 4 }, () => buildExam(unit.exam.tag, unit.exam.count));
    const signatures = attempts.map(questions => questions.map(question => JSON.stringify([question.type, question.prompt, question.cmd, question.text])).sort().join('|'));
    return { unit: unit.unit, counts: attempts.map(questions => questions.length), requested: unit.exam.count, distinct: new Set(signatures).size, valid: attempts.every(questions => questions.every(question => question.objs.some(obj => obj.startsWith(unit.exam.tag)))) };
  }));
  expect(exams).toHaveLength(6);
  for (const exam of exams) {
    expect(exam.counts).toEqual(Array(4).fill(exam.requested));
    expect(exam.distinct).toBeGreaterThan(1);
    expect(exam.valid).toBe(true);
  }
});

test('player can choose a distinct character form without changing world characters or rank', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.setItem('linux-master-proto', JSON.stringify({ xp: 300, done: ['L0'], sound: false })); });
  await page.reload();
  const npc = await page.locator('.path-mascot img').first().getAttribute('src');
  await page.locator('[data-tab="profile"]').click();
  await expect(page.locator('#avatarForm input[value="core"]')).toBeChecked();
  await page.locator('#avatarForm input[value="scout"]').check();
  await expect(page.locator('#profileMascot .character-hero')).toHaveAttribute('data-form', 'scout');
  await expect(page.locator('#profileMascot .character-hero')).toHaveAttribute('data-rank', '3');
  await page.reload();
  await expect(page.locator('.path-mascot img').first()).toHaveAttribute('src', npc);
  await page.locator('[data-tab="profile"]').click();
  await expect(page.locator('#avatarForm input[value="scout"]')).toBeChecked();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('linux-master-proto')).avatarForm)).toBe('scout');
});


test('finishing the last unique lesson marks the unit mission once', async ({ page }) => {
  await page.goto('./prototype/');
  await page.waitForFunction(() => window.courseReady);
  await page.evaluate(() => {
    const unit = COURSE.find(u => u.unit === 1);
    S.done = ['L0', 'L1', 'L2']; S.sound = false;
    startLesson('L3', withFixture(unit, unit.lessons[3].exercises), {});
    finishLesson();
  });
  await expect(page.locator('#endQuests')).toContainText('משימת היחידה הושלמה');
  expect(await page.evaluate(() => S.done.filter(key => key === 'L3').length)).toBe(1);
  await page.evaluate(() => {
    const unit = COURSE.find(u => u.unit === 1);
    startLesson('L3', withFixture(unit, unit.lessons[3].exercises), { replay: true });
    finishLesson();
  });
  await expect(page.locator('#endQuests')).not.toContainText('משימת היחידה הושלמה');
});

test('corrupt appearance timestamps cannot replace a valid selection during merge or restore', async ({ page }) => {
  await page.goto('./prototype/');
  const results = await page.evaluate(() => {
    const valid = { avatarStyle: 'cyan', avatarUpdatedAt: 10, avatarForm: 'scout', avatarFormUpdatedAt: 10 };
    const corrupt = { avatarStyle: 'invalid', avatarUpdatedAt: 999, avatarForm: 'invalid', avatarFormUpdatedAt: 999 };
    return [mergeProgress(valid, corrupt), mergeProgress(corrupt, valid), loadState(JSON.stringify(corrupt))];
  });
  for (const result of results.slice(0, 2)) expect(result).toMatchObject({ avatarStyle: 'cyan', avatarUpdatedAt: 10, avatarForm: 'scout', avatarFormUpdatedAt: 10 });
  expect(results[2]).toMatchObject({ avatarStyle: 'auto', avatarUpdatedAt: 0, avatarForm: 'core', avatarFormUpdatedAt: 0 });
});
