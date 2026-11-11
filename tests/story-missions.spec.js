const { test, expect } = require('@playwright/test');
const path = require('path');

const script = path.join(__dirname, '../prototype/story-missions.js');

async function setup(page) {
  await page.setContent('<main><div id="story"></div></main>');
  await page.addScriptTag({ path: script });
}

test('every world provides a localized story for the current unit', async ({ page }) => {
  await setup(page);
  const result = await page.evaluate(() => Array.from({ length: 11 }, (_, i) => {
    const unit = { section: i + 1, title: { he: 'כותרת', en: 'Title' } };
    return ['he', 'en'].map(lang => window.StoryMissions.forUnit(unit, lang));
  }));
  expect(result).toHaveLength(11);
  for (const [he, en] of result) {
    expect(he.title).toBe('כותרת');
    expect(en.title).toBe('Title');
    expect(he.text.length).toBeGreaterThan(10);
    expect(en.text.length).toBeGreaterThan(10);
    expect(he.text).not.toBe(en.text);
  }
  expect(new Set(result.map(pair => pair[1].text)).size).toBe(11);
});

test('exam, locked, malformed and incomplete units have no story', async ({ page }) => {
  await setup(page);
  const result = await page.evaluate(() => [
    window.StoryMissions.forUnit(null, 'he'),
    window.StoryMissions.forUnit({}, 'he'),
    window.StoryMissions.forUnit({ section: 0, title: { he: 'x', en: 'x' } }, 'he'),
    window.StoryMissions.forUnit({ section: 12, title: { he: 'x', en: 'x' } }, 'he'),
    window.StoryMissions.forUnit({ section: '__proto__', title: { he: 'x', en: 'x' } }, 'he'),
    window.StoryMissions.forUnit({ section: 1, title: { he: 'x', en: 'x' }, exam: {} }, 'he'),
    window.StoryMissions.forUnit({ section: 1, title: { he: 'x', en: 'x' }, locked: true }, 'he'),
    window.StoryMissions.forUnit({ section: 1 }, 'en')
  ]);
  expect(result).toEqual(Array(8).fill(null));
});

test('render inserts accessible plain text without interpreting lesson text as markup', async ({ page }) => {
  await setup(page);
  const result = await page.evaluate(() => {
    const container = document.querySelector('#story');
    const unit = { section: 1, title: { he: '<img src=x onerror=alert(1)>', en: '<svg onload=alert(1)>' } };
    const node = window.StoryMissions.render(container, unit, 'he');
    return { html: container.innerHTML, text: container.textContent, tag: node.tagName, label: node.getAttribute('aria-label'), childCount: container.children.length };
  });
  expect(result.tag).toBe('ASIDE');
  expect(result.label).toBeTruthy();
  expect(result.text).toContain('<img src=x onerror=alert(1)>');
  expect(result.html).not.toContain('<img');
  expect(result.childCount).toBe(1);
});

test('render does not modify the container for exams, locked units or absent input', async ({ page }) => {
  await setup(page);
  const result = await page.evaluate(() => {
    const container = document.querySelector('#story');
    container.textContent = 'existing';
    const unit = { section: 2, title: { he: 'קובץ', en: 'File' } };
    return [window.StoryMissions.render(container, { ...unit, exam: {} }, 'he'), window.StoryMissions.render(container, { ...unit, locked: true }, 'he'), window.StoryMissions.render(container, null, 'he'), container.textContent];
  });
  expect(result).toEqual([null, null, null, 'existing']);
});

test('missing language defaults to Hebrew and a missing container is harmless', async ({ page }) => {
  await setup(page);
  const result = await page.evaluate(() => {
    const unit = { section: 1, title: { he: 'ניווט', en: 'Navigation' } };
    return [window.StoryMissions.forUnit(unit).title, window.StoryMissions.render(null, unit, 'he')];
  });
  expect(result).toEqual(['ניווט', null]);
});

test('the first six units have distinct story contexts grounded in their Linux topics', async ({ page }) => {
  await setup(page);
  const entries = await page.evaluate(() => Array.from({ length: 6 }, (_, index) => {
    const unit = { section: 1, unit: index + 1, title: { he: 'יחידה', en: 'Unit' } };
    return { he: window.StoryMissions.forUnit(unit, 'he').text, en: window.StoryMissions.forUnit(unit, 'en').text };
  }));
  expect(new Set(entries.map(entry => entry.he)).size).toBe(6);
  expect(new Set(entries.map(entry => entry.en)).size).toBe(6);
  expect(entries[0].en).toMatch(/pwd.*ls.*cd/);
  expect(entries[1].en).toMatch(/cat.*head.*tail/);
  expect(entries[2].en).toMatch(/files|folders/i);
  expect(entries[3].en).toMatch(/search|find/i);
  expect(entries[4].en).toMatch(/pipe/i);
  expect(entries[5].en).toMatch(/sort/i);
});
