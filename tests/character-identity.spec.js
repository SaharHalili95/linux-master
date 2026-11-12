const { test, expect } = require('@playwright/test');

async function fixture(page) {
  await page.goto('/prototype/');
  await page.evaluate(() => {
    S.avatarForm = 'core'; S.avatarStyle = 'mint'; S.worldGear = 0;
    const art = document.createElement('main'); art.id = 'art'; document.body.append(art);
  });
}

test('explicit form previews have different silhouettes without mutating player selection', async ({ page }) => {
  await fixture(page);
  const results = await page.evaluate(() => {
    const output = ['core', 'scout', 'guardian'].map(form => {
      const slot = document.createElement('div'); slot.innerHTML = mascot('happy', 1, form);
      document.getElementById('art').append(slot);
      return { form: slot.firstChild.dataset.form, head: slot.querySelector('.hero-head > path').getAttribute('d'), body: slot.querySelector('.hero-torso > path').getAttribute('d') };
    });
    return { output, saved: S.avatarForm };
  });
  expect(results.output.map(item => item.form)).toEqual(['core', 'scout', 'guardian']);
  expect(new Set(results.output.map(item => item.head)).size).toBe(3);
  expect(new Set(results.output.map(item => item.body)).size).toBe(3);
  expect(results.saved).toBe('core');
  expect(await page.evaluate(() => mascot('happy', 1, 'invalid').includes('data-form="core"'))).toBe(true);
});

test('every form keeps cumulative rank equipment and all palettes', async ({ page }) => {
  await fixture(page);
  const layers = ['antenna', 'power-pack', 'headset', 'gauntlets', 'visor-hud', 'shoulder-plates', 'core-badge', 'signal-fins', 'cape', 'orbit', 'crown'];
  for (const form of ['core', 'scout', 'guardian']) for (const palette of ['auto', 'mint', 'cyan', 'violet']) {
    const result = await page.evaluate(({ form, palette }) => {
      S.avatarStyle = palette;
      const slot = document.getElementById('art'); slot.innerHTML = mascot('happy', 12, form);
      return { form: slot.firstChild.dataset.form, palette: slot.firstChild.dataset.avatar, gear: [...slot.querySelectorAll('[data-equipment]')].map(node => node.dataset.equipment) };
    }, { form, palette });
    expect(result.form).toBe(form); expect(result.palette).toBe(palette);
    expect(result.gear.sort()).toEqual([...layers].sort());
  }
});

test('world gear icons are distinct decorative art with safe invalid input', async ({ page }) => {
  await fixture(page);
  expect(await page.evaluate(() => typeof window.worldGearIcon)).toBe('function');
  const result = await page.evaluate(() => {
    const icons = Array.from({ length: 10 }, (_, index) => worldGearIcon(index + 1));
    document.getElementById('art').innerHTML = icons.join('');
    return { icons, invalid: [0, 11, -1, 1.5, '1', null].map(worldGearIcon) };
  });
  expect(new Set(result.icons).size).toBe(10);
  expect(result.invalid).toEqual(['', '', '', '', '', '']);
  await expect(page.locator('#art > svg[aria-hidden="true"][focusable="false"]')).toHaveCount(10);
});

test('reduced motion disables hero animations', async ({ page }) => {
  await fixture(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { document.getElementById('art').innerHTML = mascot('happy', 12, 'scout'); });
  expect(await page.locator('#art .hero-head').evaluate(node => getComputedStyle(node).animationName)).toBe('none');
});


test('equipment appears only for a genuinely earned world and disappears during loading or module failure', async ({ page }) => {
  await fixture(page);
  await page.waitForFunction(() => window.courseReady);
  await page.addScriptTag({ url: '/prototype/world-expeditions.js' });
  const result = await page.evaluate(() => {
    const slot = document.getElementById('art');
    const visible = value => {
      S.worldGear = value; slot.innerHTML = mascot('happy', 12, 'guardian');
      return slot.querySelector('.hero-world-gear')?.dataset.worldGear || null;
    };
    S.done = [];
    const locked = visible(1);
    S.done = COURSE.filter(unit => unit.section === 1 && !unit.locked && !unit.exam).flatMap(unit => unitNodes(unit).filter(node => node.kind === 'lesson').map(node => node.key));
    const before = JSON.stringify({ done: S.done, xp: S.xp, gems: S.gems });
    const earned = visible(1), otherWorld = visible(2);
    const invalid = [0, -1, 11, 1.5, '1', null].map(visible);
    window.courseReady = false;
    const loading = visible(1);
    window.courseReady = true;
    const model = window.WorldExpeditions;
    delete window.WorldExpeditions;
    const missing = visible(1);
    window.WorldExpeditions = model;
    const restored = visible(1);
    return { locked, earned, otherWorld, invalid, loading, missing, restored, unchanged: before === JSON.stringify({ done: S.done, xp: S.xp, gems: S.gems }) };
  });
  expect(result).toEqual({ locked: null, earned: '1', otherWorld: null, invalid: [null, null, null, null, null, null], loading: null, missing: null, restored: '1', unchanged: true });
});
