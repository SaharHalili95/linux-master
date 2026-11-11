const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/prototype/');
  await page.addScriptTag({ url: '/prototype/avatar-options.js' });
  await page.addStyleTag({ url: '/prototype/avatar-options.css' });
  await page.evaluate(() => {
    const slot = document.createElement('div');
    slot.id = 'avatarOptionsTest';
    slot.dir = 'ltr';
    document.body.append(slot);
    window.selectionLog = [];
    window.AvatarOptions.render(slot, 'auto', 'en', value => window.selectionLog.push(value));
  });
});

test('avatar options validate defaults and expose four accessible choices', async ({ page }) => {
  const options = page.locator('#avatarOptionsTest');
  await expect(options.getByRole('group', { name: 'Character color' })).toBeVisible();
  await expect(options.getByRole('radio')).toHaveCount(4);
  for (const label of await options.locator('label').all()) expect((await label.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await expect(options.getByRole('radio', { name: 'By rank' })).toBeChecked();
  expect(await page.evaluate(() => [AvatarOptions.normalize('invalid'), AvatarOptions.normalize('violet'), AvatarOptions.colors.length])).toEqual(['auto', 'violet', 4]);
  await page.evaluate(() => AvatarOptions.render(document.getElementById('avatarOptionsTest'), 'violet', 'he', () => {}));
  await expect(options.getByRole('group', { name: 'צבע הדמות' })).toBeVisible();
  await expect(options.getByRole('radio', { name: 'סגול' })).toBeChecked();
});

test('avatar options preserve focus and notify on keyboard selection', async ({ page }) => {
  const radio = page.locator('#avatarOptionsTest').getByRole('radio');
  await radio.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(radio.nth(1)).toBeFocused();
  await expect(radio.nth(1)).toBeChecked();
  expect(await page.evaluate(() => selectionLog)).toEqual(['mint']);
  expect(await page.locator('.path-mascot .world-character-art').count()).toBeGreaterThan(0);
});

test('player form picker offers three distinct accessible forms with a safe default', async ({ page }) => {
  await page.evaluate(() => {
    const slot = document.getElementById('avatarOptionsTest');
    window.AvatarOptions.renderForms(slot, 'bad-input', 'en', value => window.selectionLog.push(value));
  });
  const slot = page.locator('#avatarOptionsTest');
  await expect(slot.getByRole('group', { name: 'Character form' })).toBeVisible();
  await expect(slot.getByRole('radio')).toHaveCount(3);
  await expect(slot.getByRole('radio', { name: 'Core' })).toBeChecked();
  expect(await page.evaluate(() => [AvatarOptions.normalizeForm('invalid'), AvatarOptions.normalizeForm('guardian'), AvatarOptions.forms.length])).toEqual(['core', 'guardian', 3]);
  await page.evaluate(() => AvatarOptions.renderForms(document.getElementById('avatarOptionsTest'), 'scout', 'he', () => {}));
  await expect(slot.getByRole('group', { name: 'דמות' })).toBeVisible();
  await expect(slot.getByRole('radio', { name: 'סייר' })).toBeChecked();
});

test('keyboard form selection preserves focus and does not write state', async ({ page }) => {
  await page.evaluate(() => {
    window.beforeFormsStorage = localStorage.getItem('linux-master-proto');
    AvatarOptions.renderForms(document.getElementById('avatarOptionsTest'), 'core', 'en', value => window.selectionLog.push(value));
  });
  const choices = page.locator('#avatarOptionsTest').getByRole('radio');
  await choices.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(choices.nth(1)).toBeChecked();
  await expect(choices.nth(1)).toBeFocused();
  expect(await page.evaluate(() => selectionLog)).toEqual(['scout']);
  expect(await page.evaluate(() => localStorage.getItem('linux-master-proto'))).toEqual(await page.evaluate(() => beforeFormsStorage));
});
