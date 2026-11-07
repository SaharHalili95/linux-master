const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SHOTS = process.env.PROTO_SHOTS;
// The language button is labelled in the other language on purpose; everything else must match the UI language.
const hebrewOnScreen = () => document.body.innerText.replace(document.getElementById('langBtn').innerText, '').match(/[\u0590-\u05ff]+/g);

// Answers the current exercise correctly by reading the lesson state, the way a learner who knows the answer would.
async function solve(page, lang = 'he') {
  if (lang === 'en') expect(await page.evaluate(hebrewOnScreen), 'Hebrew in English UI').toBeNull();
  const ex = await page.evaluate(() => ({ type: L.ex.type, plain: L.ex.plain, answer: L.ex.answer, solution: L.ex.solution, before: L.ex.before, uid: L.ex.uid, boss: L.ex.boss && { word: L.ex.boss.word, dir: L.ex.boss.hideIn } }));
  if (ex.type === 'teach') { await page.click('#checkBtn'); return ex; }
  if (ex.type === 'choice' || ex.type === 'output') await page.evaluate(v => [...document.querySelectorAll('.opt')].find(b => b.dataset.value === v).click(), ex.type === 'output' ? ex.solution : ex.plain ? '0' : ex.answer);
  if (ex.type === 'sentence') await page.locator('.chips .tile').filter({ hasText: new RegExp(`^${ex.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).click();
  if (ex.type === 'fill') await page.locator('.chips .tile', { hasText: ex.answer }).click();
  if (ex.type === 'tiles') for (const word of ex.answer.split(' ')) await page.locator('.bank .tile', { hasText: word }).filter({ hasText: new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first().click();
  if (ex.type === 'match') {
    const pairs = await page.evaluate(() => L.ex.pairs.map(p => p[0]));
    for (const key of pairs) { await page.locator(`.pair.cmd[data-key="${key}"]`).click(); await page.locator(`.pair.mean[data-key="${key}"]`).click(); }
  }
  if (ex.type === 'terminal') {
    for (const c of await page.evaluate(() => L.ex.solve)) { await page.fill('.term-input input', c); await page.press('.term-input input', 'Enter'); }
    if (await page.evaluate(() => !!L.ex.ask)) await page.fill('#askAnswer', await page.evaluate(() => L.expected));
  }
  if (ex.type === 'scenario') await page.fill('#scenarioCmd', await page.evaluate(() => L.ex.accept[0]));
  if (ex.type === 'boss') {
    for (const c of [`ls -a ${ex.boss.dir}`, `cat ${ex.boss.dir}/.code`]) { await page.fill('.term-input input', c); await page.press('.term-input input', 'Enter'); }
    await expect(page.locator('.goals li.done')).toHaveCount(2);
    await expect(page.locator('.term')).toContainText(`The password is: ${ex.boss.word}`);
    await expect(page.locator('#exPrompt')).toContainText(`cat ${ex.boss.dir}/.code`);
    await page.fill('#codeWord', ex.boss.word);
  }
  if (SHOTS && ex.type !== 'match') await page.screenshot({ path: `${SHOTS}/ex-${ex.uid}-${ex.type}.png` });
  if (ex.type !== 'match') await page.click('#checkBtn');
  await expect(page.locator('#foot')).toHaveClass(/good|saved/);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/ex-${ex.uid}-${ex.type}-good.png` });
  await page.click('#checkBtn');
  return ex;
}

for (const lang of ['he', 'en']) test(`prototype: play the whole unit, chest and boss, with streak, XP and quests (${lang})`, async ({ page }) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./prototype/');
  await page.evaluate(l => { localStorage.clear(); localStorage.setItem('lang', l); }, lang);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/path-start-${lang}.png` });

  for (const node of ['L0', 'L1', 'c1', 'L2', 'L3', 'boss']) {
    await page.locator('.node.current').click();
    await page.locator('#pop .btn').click();
    if (node === 'c1') continue;
    while (await page.locator('#lesson').isVisible()) await solve(page, lang);
    await expect(page.locator('#end')).toBeVisible();
    if (SHOTS && node === 'L0') await page.screenshot({ path: `${SHOTS}/end-L0-${lang}.png` });
    await page.click('#endBtn');
    if (node === 'L0') { await expect(page.locator('#streakScreen')).toBeVisible(); if (SHOTS) await page.screenshot({ path: `${SHOTS}/streak.png` }); await page.click('#streakBtn'); }
  }
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('linux-master-proto')));
  expect(state.done).toEqual(['L0', 'L1', 'c1', 'L2', 'L3', 'boss']);
  expect(state.streak).toBe(1);
  expect(state.xp).toBe(4 * 15 + 25);
  expect(state.gems).toBe(15 + 30);
  await expect(page.locator('.node.boss.done')).toHaveCount(1);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/path-done.png`, fullPage: true });
  await page.click('[data-tab="quests"]');
  await expect(page.locator('.quest.done')).toHaveCount(3);
  if (lang === 'en') expect(await page.evaluate(hebrewOnScreen)).toBeNull();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/quests-${lang}.png` });
  expect(errors).toEqual([]);
});

test('prototype: a wrong answer turns the bar red, comes back at the end, and lands in practice', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./prototype/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.node.current').click();
  await page.locator('#pop .btn').click();
  await page.click('#checkBtn');
  await page.locator('.opt[data-value="ls"]').click();
  await page.click('#checkBtn');
  await expect(page.locator('#foot')).toHaveClass(/bad/);
  await expect(page.locator('#fbDetail')).toContainText('ls מציגה מה יש בתיקייה');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/wrong.png` });
  await page.click('#checkBtn');
  const tail = await page.evaluate(() => L.queue.at(-1));
  expect(tail).toMatchObject({ uid: 'L0.1', retry: true });
  expect(await page.evaluate(() => S.mistakes)).toEqual(['L0.1']);
});

const AxeBuilder = require('@axe-core/playwright').default;
for (const scheme of ['light', 'dark']) {
  test(`prototype: accessibility of path, lesson, feedback and end screens (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: scheme });
    await page.goto('./prototype/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const axe = async name => {
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      return r.violations.map(v => `${name}: ${v.id} ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(', ')}`);
    };
    const problems = [...await axe('path')];
    await page.locator('.node.current').click();
    problems.push(...await axe('popover'));
    await page.locator('#pop .btn').click();
    problems.push(...await axe('teach'));
    await page.click('#checkBtn');
    problems.push(...await axe('choice'));
    await page.locator('.opt[data-value="ls"]').click();
    await page.click('#checkBtn');
    problems.push(...await axe('wrong'));
    for (const tab of ['practice', 'quests', 'profile']) { await page.evaluate(() => closeOverlays()); await page.click(`[data-tab="${tab}"]`); problems.push(...await axe(tab)); }
    expect(problems).toEqual([]);
  });
}

test('the app opens in Learn mode, and Trivia stays put once chosen', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/prototype\/$/);
  await expect(page.locator('.node.current')).toBeVisible();
  await page.click('.mode-switch a.mode');
  await expect(page.locator('.level-card')).toHaveCount(8);
  await page.goto('./');
  await expect(page.locator('.level-card')).toHaveCount(8);
});

test('the Trivia | Learn switch moves between the two modes, with no beta card left', async ({ page }) => {
  await page.goto('./?mode=trivia');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.beta-card')).toHaveCount(0);
  await page.click('#langBtn');
  await expect(page.locator('.mode-switch .mode.on')).toHaveText('🎯 Trivia');
  await page.click('#modeLearn');
  await expect(page).toHaveURL(/\/prototype\/$/);
  await expect(page.locator('.node.current')).toBeVisible();
  await expect(page.locator('.mode-switch .mode.on')).toHaveText('🎓 Learn');
  await page.click('.mode-switch a.mode');
  await expect(page.locator('.level-card')).toHaveCount(8);
});

test('visiting the beta does not replace the main page in the offline cache', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit does not support service workers');
  await page.goto('./?mode=trivia');
  await page.waitForFunction(async () => (await navigator.serviceWorker.ready).active?.state === 'activated');
  await page.reload();
  await page.goto('./prototype/');
  await expect(page.locator('.node.current')).toBeVisible();
  await context.setOffline(true);
  await page.goto('./');
  await expect(page.locator('.level-card')).toHaveCount(8);
  await context.setOffline(false);
});

test('Learn mode works offline after a first visit, fonts and every unit included', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit does not support service workers');
  await page.goto('./prototype/');
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await page.waitForFunction(() => window.learnKept);
  expect(await page.evaluate(() => localStorage.getItem('learnOffline')), 'one visit is enough').toBe('1');
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.node.current')).toBeVisible();
  expect(await page.evaluate(() => COURSE.length)).toBeGreaterThanOrEqual(83);
  const faces = await page.evaluate(async () => [...await document.fonts.load('700 16px Rubik', 'שלום'), ...await document.fonts.load('16px "JetBrains Mono"', 'ls')].map(f => `${f.family} ${f.status}`));
  expect(faces).toEqual(expect.arrayContaining(['Rubik loaded', 'JetBrains Mono loaded']));
  await page.goto('./');
  await expect(page).toHaveURL(/\/prototype\/$/);
  await page.click('.node.current'); await page.locator('#pop .btn').click();
  await expect(page.locator('#lesson')).toBeVisible();
  await expect(page.locator('#exBody')).not.toBeEmpty();
  await context.setOffline(false);
});

test('the path never scrolls sideways, even with a popover open on the outermost node', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ done: ['L0', 'L1'] })); });
  await page.reload();
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.locator('.node.current').click();
  await expect(page.locator('#pop')).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);
  const box = await page.locator('#pop').boundingBox(), width = page.viewportSize().width;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width);
});

test('the language button switches Learn mode and the choice carries over to Trivia mode', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.tabbar [data-tab="learn"]')).toContainText('לימוד');
  await page.click('#langBtn');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('.tabbar [data-tab="learn"]')).toContainText('Learn');
  await expect(page.locator('.unit-banner h2').first()).toHaveText('Where am I?');
  await page.click('.mode-switch a.mode');
  await expect(page.locator('#langBtn')).toHaveText('עב');
  await expect(page.locator('.mode-switch .mode.on')).toHaveText('🎯 Trivia');
});

for (const lang of ['he', 'en']) test(`the top bar fits a small phone, with streak and gems visible (${lang})`, async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(l => { localStorage.clear(); localStorage.setItem('lang', l); }, lang);
  await page.reload();
  const width = page.viewportSize().width;
  for (const sel of ['.mode-switch', '#langBtn', '.chip.streak', '.chip.gems']) {
    const box = await page.locator(sel).boundingBox();
    expect(box.x, sel).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, sel).toBeLessThanOrEqual(width);
  }
});

for (const lang of ['he', 'en']) test(`match tiles form an even grid on a phone (${lang})`, async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(l => { localStorage.clear(); localStorage.setItem('lang', l); }, lang);
  await page.reload();
  const boxes = await page.evaluate(() => COURSE[0].lessons.flatMap(l => l.exercises).filter(e => e.type === 'match').map(ex => {
    startLesson('layout', [ex]);
    return [...document.querySelectorAll('.pair')].map(b => { const r = b.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
  }));
  const width = page.viewportSize().width;
  for (const tiles of boxes) {
    expect(new Set(tiles.map(t => `${t.w}x${t.h}`)).size).toBe(1);
    expect(new Set(tiles.map(t => t.x)).size).toBe(2);
    expect(new Set(tiles.map(t => t.y)).size).toBe(tiles.length / 2);
    for (const t of tiles) expect(t.x + t.w).toBeLessThanOrEqual(width);
  }
});

test('"what will it print?" shows the files the command reads, and nothing for made-up files', async ({ page }) => {
  await page.goto('./prototype/');
  const seen = await page.evaluate(() => COURSE.filter(u => !u.locked && !u.exam).flatMap(unit => withFixture(unit, unit.lessons.flatMap(l => l.exercises))).filter(ex => ex.type === 'output').map(ex => {
    startLesson('peek', [ex]);
    return { cmd: ex.cmd, files: [...document.querySelectorAll('.file-peek-h')].map(h => h.textContent) };
  }));
  const of = cmd => seen.find(s => s.cmd === cmd).files;
  expect(of('cat todo.txt')).toEqual([expect.stringContaining('todo.txt')]);
  expect(of('cat readme.txt')).toEqual([expect.stringContaining('readme.txt')]);
  expect(of('grep ERROR logs/app.log | wc -l')).toEqual([expect.stringContaining('logs/app.log')]);
  expect(of('cat nothing.txt')).toEqual([]);
  expect(of('cat x.txt')).toEqual([]);
});

test('every exercise fits the screen width, with no sideways scrolling', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const wide = await page.evaluate(() => COURSE.filter(u => !u.locked && !u.exam).flatMap(unit => withFixture(unit, [...unit.lessons.flatMap(l => l.exercises), ...(unit.boss.exercises || [])])).flatMap(ex => {
    startLesson('layout', [ex]);
    if (ex.type === 'teach') $('checkBtn').click();
    const main = $('lessonMain');
    return main.scrollWidth > main.clientWidth || document.documentElement.scrollWidth > innerWidth ? [tr(ex.prompt) || ex.cmd] : [];
  }));
  expect(wide).toEqual([]);
});

test('the start bubble never covers the finished lesson above it', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ done: ['L0'] })); });
  await page.reload();
  const tip = await page.locator('.start-tip').boundingBox();
  const above = await page.locator('.node-row:has(.start-tip)').locator('xpath=preceding-sibling::*[1]').locator('.node').boundingBox();
  expect(tip.y).toBeGreaterThanOrEqual(above.y + above.height);
});

test('saved progress survives new units, and the path opens scrolled to the current lesson', async ({ page }) => {
  await page.goto('./prototype/');
  const keys = await page.evaluate(() => { const open = COURSE.filter(u => !u.locked); return open.slice(0, -1).flatMap(unitNodes).map(n => n.key); });
  await page.evaluate(done => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ done })); }, keys);
  await page.reload();
  await expect(page.locator('.node.current')).toBeInViewport();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('linux-master-proto')));
  expect(state.done).toEqual(keys);
});

test('every part gets one header, in order, and units show their exams', async ({ page }) => {
  await page.goto('./prototype/');
  const parts = await page.evaluate(() => [...new Set(COURSE.map(u => u.section))]);
  await expect(page.locator('.part-header')).toHaveCount(parts.length);
  const order = await page.evaluate(() => COURSE.map(u => [u.section, u.unit]));
  expect(order, 'units read in order inside each part').toEqual([...order].sort((a, b) => a[0] - b[0] || a[1] - b[1]));
  expect(await page.locator('.part-header').evaluateAll(els => els.map(e => Number(e.dataset.part)))).toEqual(parts);
  await expect(page.locator('.unit-banner').first().locator('.exam-chip', { hasText: 'LPIC' })).toHaveCount(1);
});

test('a recorded output card shows the command, where it was recorded, and the real output as the answer', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => startLesson('rec-test', [{ type: 'output', prompt: WHAT, rec: 'ubuntu-uname-m', wrongText: ['arm64', 'i386'] }]));
  await expect(page.locator('.rec-label')).toContainText('Ubuntu 24.04');
  await expect(page.locator('.term')).toContainText('uname -m');
  await page.locator('.opt', { hasText: 'x86_64' }).click();
  await page.click('#checkBtn');
  await expect(page.locator('#foot')).toHaveClass(/good/);
});

test('a scenario accepts any listed command, however it is spaced, and rejects others', async ({ page }) => {
  await page.goto('./prototype/');
  const ex = { type: 'scenario', prompt: { he: 'בדקו את nginx', en: 'Check nginx' }, rec: 'ubuntu-uname', accept: ['systemctl status nginx', 'systemctl status nginx.service'] };
  await page.evaluate(ex => startLesson('scenario-test', [ex]), ex);
  await expect(page.locator('.rec-label')).toBeVisible();
  await page.fill('#scenarioCmd', '  systemctl   status nginx.service ');
  await page.press('#scenarioCmd', 'Enter');
  await expect(page.locator('#foot')).toHaveClass(/good/);
  await page.evaluate(ex => startLesson('scenario-test', [ex]), ex);
  await page.fill('#scenarioCmd', 'systemctl start nginx');
  await page.click('#checkBtn');
  await expect(page.locator('#foot')).toHaveClass(/bad/);
  await expect(page.locator('#fbDetail')).toContainText('systemctl status nginx');
});

// One test per part, each starting where the earlier parts end, so CI can play the parts side by side.
for (let part = 1; part <= 11; part++) test(`part ${part} can be played to the end, unit after unit @content @part${part}`, async ({ page }) => {
  test.setTimeout(600_000);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./prototype/');
  const [before, nodes] = await page.evaluate(p => { const open = COURSE.filter(u => !u.locked); return [open.filter(u => u.section < p).flatMap(unitNodes).map(n => n.key), open.filter(u => u.section === p).flatMap(unitNodes).length]; }, part);
  test.skip(!nodes, `part ${part} has no units yet`);
  await page.evaluate(done => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false, done })); }, before);
  await page.reload();
  for (let n = 0; n < nodes; n++) {
    await page.locator('.node.current').click();
    await page.locator('#pop .btn').click();
    if (!(await page.locator('#lesson').isVisible())) continue;
    while (await page.locator('#lesson').isVisible()) await solve(page);
    await page.click('#endBtn');
    if (await page.locator('#streakScreen').isVisible()) await page.click('#streakBtn');
  }
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('linux-master-proto')));
  expect(state.done).toHaveLength(before.length + nodes);
  expect(state.mistakes).toEqual([]);
  expect(errors).toEqual([]);
});

// Checks every exercise against the simulator itself, so a typo in a lesson fails here instead of on a learner's phone.
test('every exercise in every unit is answerable and fully translated @content', () => {
  const vm = require('vm');
  const root = path.join(__dirname, '..');
  const parts = fs.readdirSync(path.join(root, 'prototype/parts')).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1))).map(f => `prototype/parts/${f}`);
  const recs = fs.readdirSync(path.join(root, 'prototype/recorded')).sort().map(f => `prototype/recorded/${f}`);
  const src = ['shell.js', 'prototype/i18n.js', 'prototype/units.js', 'prototype/lessons.js', 'prototype/recorded.js', ...recs, ...parts].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  const ctx = vm.createContext({ localStorage: { getItem: () => null } });
  vm.runInContext(`${src}\nthis.out = { COURSE, Shell, RECORDED };`, ctx);
  const { COURSE, Shell, RECORDED } = ctx.out;
  for (const [id, r] of Object.entries(RECORDED)) expect(r.out.trim(), `recording ${id} is empty`).toBeTruthy();
  const run = (fx, setup, cmd) => { const sh = new Shell(fx()); for (const c of setup || []) sh.run(c); const r = sh.run(cmd); return (r.out + r.err).replace(/\n$/, ''); };
  const texts = [];
  const walk = v => { if (v && typeof v === 'object') { if ('he' in v && 'en' in v) texts.push(v); else Object.values(v).forEach(walk); } };
  let count = 0;
  const nums = COURSE.map(u => u.unit);
  expect(new Set(nums).size, 'unit numbers are unique').toBe(nums.length);
  expect(nums.filter(n => n <= 80), 'units 1-80 in order').toEqual(Array.from({ length: 80 }, (_, i) => i + 1));
  const taught = new Set(COURSE.flatMap(u => u.exams || []));
  const lpic = JSON.parse(fs.readFileSync(path.join(root, 'materials/objectives/lpic1.json'), 'utf8'));
  expect(lpic.filter(o => !taught.has(`L${o.id}`)).map(o => o.id), 'LPIC-1 objectives no unit teaches').toEqual([]);
  // Every file, term and utility LPI lists must appear somewhere in the course (an exercise, or a recording it shows).
  // A few terms are taught under another spelling; the alias says what to look for.
  const corpus = [];
  const collect = v => { if (typeof v === 'string') { corpus.push(v); if (RECORDED[v]) corpus.push(RECORDED[v].cmd, RECORDED[v].out); } else if (v && typeof v === 'object') Object.values(v).forEach(collect); };
  COURSE.forEach(u => { collect(u.lessons || []); collect(u.boss || {}); });
  const text = corpus.join('\n').toLowerCase();
  const ALIAS = { 'Quoting': 'quotes', 'bootloader': 'boot loader', 'regex(7)': 'man 7 regex', '/, ?': '/search', 'h,j,k,l': 'h j k l', 'i, o, a': 'i a o', '.': 'source', 'X': 'x11', 'Subnetting': 'cidr', '/usr/bin/locale': 'locale', 'Sticky/Repeat keys.': 'sticky', 'Slow/Bounce/Toggle keys.': 'bounce', 'Gestures.': 'gesture', 'SysVinit': 'sysvinit', 'systemd.socket': '.socket', '&': ' &' };
  const missing = lpic.flatMap(o => o.terms.filter(term => {
    const want = (ALIAS[term] || term).toLowerCase().replace(/\(.*?\)/g, '').split(/,| and /).map(s => s.trim().replace(/\*/g, '').replace(/\/$/, '')).filter(s => s.length > 0);
    return !want.some(w => text.includes(w.split(' ')[0]) || text.includes(w));
  }).map(term => `${o.id}: ${term}`));
  expect(missing, 'LPIC-1 terms the course never mentions').toEqual([]);
  for (const unit of COURSE.filter(u => u.exam)) {
    expect(['L', 'R', 'F', 'E', 'S', 'C'], `unit ${unit.unit}`).toContain(unit.exam.tag);
    expect(COURSE.filter(u => !u.locked && !u.exam && u.exams?.some(e => e.startsWith(unit.exam.tag))).length, `unit ${unit.unit} has units to draw from`).toBeGreaterThan(0);
    walk(unit);
  }
  const unnamed = [];
  for (const unit of COURSE.filter(u => !u.locked && !u.exam)) {
    const fx = unit.fixture || ctx.unitFixture || (() => vm.runInContext('unitFixture()', ctx));
    const exercises = [...unit.lessons.flatMap((l, li) => l.exercises.map((ex, i) => [`${unit.unit}/L${li}.${i}`, ex])), ...(unit.boss.exercises || []).map((ex, i) => [`${unit.unit}/boss.${i}`, ex])];
    expect(unit.lessons, `unit ${unit.unit}`).toHaveLength(4);
    walk(unit);
    for (const [id, ex] of exercises) {
      count++;
      if (ex.demo) run(fx, ex.demo[0], ex.demo[1]);
      if (ex.type === 'scenario') {
        expect(ex.accept?.length, `${id} needs accepted commands`).toBeGreaterThan(0);
        if (ex.rec) { expect(RECORDED[ex.rec], `${id}: recording ${ex.rec}`).toBeTruthy(); expect(ex.accept, `${id} shows its own answer`).not.toContain(RECORDED[ex.rec].cmd); }
      }
      if (ex.type === 'output' && ex.rec) {
        for (const r of [ex.rec, ...(ex.wrongRec || [])]) expect(RECORDED[r], `${id}: recording ${r}`).toBeTruthy();
        const real = RECORDED[ex.rec].out;
        expect(new Set([...(ex.wrongRec || []).map(r => RECORDED[r].out), ...(ex.wrongText || [])].filter(w => w !== real)).size, `${id} needs wrong options`).toBeGreaterThanOrEqual(2);
      } else if (ex.type === 'output') {
        const real = run(fx, ex.setup, ex.cmd);
        const wrong = new Set([...(ex.wrongCmds || []).map(c => run(fx, ex.setup, c)), ...(ex.wrongText || [])].filter(w => w !== real));
        expect(wrong.size, `${id} needs wrong options`).toBeGreaterThanOrEqual(2);
      }
      if (ex.type === 'choice' && !ex.plain) { expect(ex.options, id).toContain(ex.answer); for (const k of Object.keys(ex.why || {})) expect(ex.options, id).toContain(k); }
      if (ex.type === 'choice' && ex.plain) expect(ex.why, id).toHaveLength(ex.options.length);
      if (ex.type === 'fill') expect(ex.options, id).toContain(ex.answer);
      if (ex.type === 'sentence') { expect(ex.options, id).toContain(ex.answer); for (const l of ['he', 'en']) expect(ex.text[l].split('___'), id).toHaveLength(2); }
      if (ex.type === 'tiles') { const bank = [...ex.tiles]; for (const w of ex.answer.split(' ')) { expect(bank, `${id}: ${w}`).toContain(w); bank.splice(bank.indexOf(w), 1); } }
      if (ex.type === 'match') { expect(new Set(ex.pairs.map(p => p[0])).size, id).toBe(ex.pairs.length); for (const [k] of ex.pairs) expect(k, `${id}: match keys go in a CSS selector`).not.toMatch(/[\\"\n]/); }
      // The owner's rule: a task names the data file its answer reads, so the learner never has to guess it.
      if (['terminal', 'tiles', 'fill'].includes(ex.type)) {
        const answer = ex.type === 'terminal' ? (ex.solve || []).join(' ') : ex.type === 'tiles' ? ex.answer : ex.before + ex.answer + ex.after;
        const data = answer.split(/[\s|;&<>()"']+/).filter(w => /\.(txt|log|csv|ini)$/.test(w) || /^\/etc\/[\w.-]+$/.test(w)).filter(w => !w.startsWith('./') && !w.startsWith('/home/') && !/[*?{]/.test(w));
        for (const f of data) if (!(ex.prompt?.he || '').includes(f.split('/').pop())) unnamed.push(`${id}: ${f} | ${ex.prompt?.he}`);
      }
      if (ex.type === 'terminal') {
        const sh = new Shell(fx()); for (const c of ex.setup || []) sh.run(c);
        expect(ex.goal(sh, []), `${id} is solved before typing anything`).toBe(false);
        const log = ex.solve.map(cmd => { const r = sh.run(cmd); return { cmd, out: (r.out + r.err).replace(/\n$/, '') }; });
        expect(ex.goal(sh, log), `${id} solve does not reach the goal`).toBe(true);
      }
    }
  }
  expect(count).toBeGreaterThan(100);
  expect(unnamed, 'tasks that do not say which file to use').toEqual([]);
  for (const v of texts) { expect(v.he, JSON.stringify(v)).toBeTruthy(); expect(v.en, JSON.stringify(v)).toBeTruthy(); expect(v.en, v.en).not.toMatch(/[\u0590-\u05ff]/); }
});

test('corrupted saved progress does not break Learn mode', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  for (const bad of ['{not json', 'null', '"text"', JSON.stringify({ done: 'L0', days: 5, mistakes: [1, null], quests: null, xp: 'lots', gems: -3, streak: {} })]) {
    await page.goto('./prototype/');
    await page.evaluate(v => { localStorage.clear(); localStorage.setItem('linux-master-proto', v); }, bad);
    await page.reload();
    await expect(page.locator('.node.current')).toBeVisible();
    await page.click('[data-tab="quests"]');
    await expect(page.locator('.quest')).toHaveCount(3);
    await page.click('[data-tab="profile"]');
    await expect(page.locator('#pXp')).toHaveText('0');
  }
  expect(errors).toEqual([]);
});

test('every official exam objective maps to a real unit, and every unit teaches some objective', () => {
  const root = path.join(__dirname, '..');
  const load = f => JSON.parse(fs.readFileSync(path.join(root, 'materials/objectives', f), 'utf8'));
  const [lpic, rhcsa, lfcs, essentials, suse, linuxPlus] = ['lpic1.json', 'rhcsa.json', 'lfcs.json', 'linux-essentials.json', 'suse-sca.json', 'linux-plus.json'].map(load);
  expect(essentials).toHaveLength(19);
  expect(essentials.reduce((s, o) => s + o.weight, 0), 'Linux Essentials weights are its 40 questions').toBe(40);
  expect(linuxPlus).toHaveLength(29);
  expect(suse).toHaveLength(18);
  const units = [...fs.readFileSync(path.join(root, 'materials/curriculum.md'), 'utf8').matchAll(/^\| (\d+) \|/gm)].map(m => Number(m[1]));
  expect([...units].sort((a, b) => a - b)).toEqual(Array.from({ length: 99 }, (_, i) => i + 1));
  expect(lpic).toHaveLength(42);
  for (const exam of ['101-500', '102-500']) expect(lpic.filter(o => o.exam === exam).reduce((s, o) => s + o.weight, 0), exam).toBe(60);
  const mapped = new Set();
  for (const o of [...lpic, ...rhcsa, ...lfcs, ...essentials, ...suse, ...linuxPlus]) { expect(o.units.length, o.id).toBeGreaterThan(0); for (const u of o.units) { expect(units, o.id).toContain(u); mapped.add(u); } }
  for (const u of units.filter(n => n <= 77 || (n >= 81 && n <= 96))) expect(mapped.has(u), `unit ${u} teaches no objective`).toBe(true);
});

test('each certification track keeps exactly the units its official objectives map to, plus its mock exam', async ({ page }) => {
  const root = path.join(__dirname, '..');
  await page.goto('./prototype/');
  const tags = await page.evaluate(() => Object.fromEntries(COURSE.map(u => [u.unit, u.exams || []])));
  // Units 81-96 are written in later steps of docs/superpowers/specs/2026-11-05-more-certs-design.md; remove each
  // from this list as it lands.
  const NOT_WRITTEN_YET = new Set([92, 93, 94, 95, 96]);
  for (const [tag, file] of [['L', 'lpic1.json'], ['R', 'rhcsa.json'], ['F', 'lfcs.json'], ['E', 'linux-essentials.json'], ['S', 'suse-sca.json'], ['C', 'linux-plus.json']])
    for (const o of JSON.parse(fs.readFileSync(path.join(root, 'materials/objectives', file), 'utf8')))
      for (const u of o.units) {
        if (NOT_WRITTEN_YET.has(u)) { expect(tags[u], `unit ${u} exists, take it off NOT_WRITTEN_YET`).toBeUndefined(); continue; }
        const want = tag === 'E' || tag === 'C' ? `${tag}${o.id}` : tag === 'S' ? o.id : tag;
        expect(tags[u].some(e => e.startsWith(want)), `unit ${u} teaches ${o.id} but is not tagged ${want}`).toBe(true);
      }
});

test('choosing a certification track hides the other units and keeps progress', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false, done: ['L0', 'L1', 'c1', 'L2', 'L3', 'boss'] })); });
  await page.reload();
  const kickers = () => page.locator('.unit-kicker').allInnerTexts().then(k => k.map(x => Number(x.match(/\d+$/)[0])));
  expect(await kickers()).toHaveLength(await page.evaluate(() => COURSE.length));
  await page.click('#trackBtn');
  await expect(page.locator('.track-pick [data-track="R"]')).toContainText('56');
  await page.click('.track-pick [data-track="R"]');
  await expect(page.locator('#trackSheet')).toBeHidden();
  await expect(page.locator('#trackName')).toHaveText('RHCSA');
  const rhcsa = await kickers();
  expect(rhcsa).toContain(79);
  for (const u of [2, 6, 78, 80]) expect(rhcsa).not.toContain(u);
  await expect(page.locator('.node.current').first()).toHaveAttribute('aria-label', /.+/);
  expect(await page.evaluate(() => document.querySelector('.node.current').closest('ol').previousElementSibling.querySelector('.unit-kicker').textContent)).toMatch(/ 3$/);
  await page.reload();
  expect(await kickers()).toEqual(rhcsa);
  await page.click('#trackBtn');
  await expect(page.locator('.track-pick [data-track="R"]')).toHaveAttribute('aria-pressed', 'true');
  await page.click('.track-pick [data-track=""]');
  expect(await kickers()).toHaveLength(await page.evaluate(() => COURSE.length));
  await page.evaluate(() => scrollTo(0, 0));
  await page.click('#toHereBtn');
  await expect(page.locator('.node.current')).toBeInViewport();
  await page.click('#toTopBtn');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('linux-master-proto')).done)).toContain('boss');
});

test('a mock exam draws its questions only from tagged units, with no teach cards or live terminals', async ({ page }) => {
  await page.goto('./prototype/');
  const r = await page.evaluate(() => { const qs = buildExam('L', 60); const tagged = new Set(COURSE.filter(u => u.exams?.some(e => e.startsWith('L'))).map(u => tr(u.title))); return { n: qs.length, types: [...new Set(qs.map(q => q.type))], foreign: qs.filter(q => !tagged.has(tr(q.topic))).length }; });
  expect(r.n).toBe(60);
  expect(r.types).not.toContain('teach');
  expect(r.types).not.toContain('terminal');
  expect(r.foreign).toBe(0);
});

test('quitting a mock exam halfway leaves progress and mistakes untouched', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false })); });
  await page.reload();
  await page.evaluate(() => startExam(COURSE.find(u => u.unit === 79), 'u79-exam', 5));
  await expect(page.locator('#exTag')).toContainText('1');
  page.on('dialog', d => d.accept());
  await page.click('#quitBtn');
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('linux-master-proto')));
  expect(state.done || []).not.toContain('u79-exam');
  expect(state.mistakes || []).toEqual([]);
});

test('a mock exam reveals nothing until the end, then shows the score and what to review', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false })); });
  await page.reload();
  // Matching exercises check themselves as you pair them, so this test uses questions with a check button.
  await page.evaluate(() => { const u = COURSE.find(x => x.unit === 80); startLesson('u80-exam', buildExam('F', 20).filter(q => q.type !== 'match').slice(0, 3), { exam: u.exam, results: [] }); });
  // Answer the first question wrongly on purpose (an empty scenario or the first option), the rest right.
  for (let i = 0; i < 3; i++) {
    if (i === 0) await page.evaluate(() => { L.value = '__wrong__'; L.ex.solution = L.ex.solution ?? '__right__'; onFootButton(); });
    else await solve(page);
    if (i === 0) { await expect(page.locator('#foot')).toHaveClass(/saved/); await expect(page.locator('#fbDetail')).toBeEmpty(); await page.click('#checkBtn'); }
  }
  await expect(page.locator('#end')).toBeVisible();
  await expect(page.locator('#endAcc')).toHaveText('67%');
  await expect(page.locator('#endQuests')).not.toBeEmpty();
});

test('the owner can fix a question\'s spacing only, see it at once, send it to be applied, and keep notes as reports', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false })); });
  await page.reload();
  await page.evaluate(() => { window.open = u => { window.opened = u; }; const ex = UNIT_5.lessons[0].exercises.find(e => e.type === 'choice'); startLesson('u5-L0', [{ ...ex, fx: homeFixture }]); });
  await page.click('#editBtn');
  const original = await page.inputValue('#edText');
  await page.fill('#edText', original.replace(' ', '\n'));
  await expect(page.locator('#edHint')).toBeHidden();
  await page.fill('#edText', original.slice(1));
  await expect(page.locator('#edHint')).toBeVisible();
  expect(await page.inputValue('#edText')).toBe(original.replace(' ', '\n'));
  await page.fill('#edNote', 'line breaks look wrong');
  await page.click('#edSave');
  await expect(page.locator('#editor')).toBeHidden();
  expect(await page.locator('#exPrompt').innerText()).toContain('\n');
  const url = await page.evaluate(() => window.opened);
  expect(url).toContain('labels=question-report');
  const body = new URL(url).searchParams.get('body');
  expect(body).toContain('<!-- layout-fix -->');
  expect(body).not.toContain('line breaks look wrong');
  expect(JSON.parse(body.match(/```json\n([\s\S]*?)\n```/)[1])).toMatchObject({ original, layout: original.replace(' ', '\n') });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('linux-master-proto')));
  expect(Object.values(saved.layout)[0]).toBe(original.replace(' ', '\n'));
  expect(saved.reports).toEqual([expect.objectContaining({ note: 'line breaks look wrong' })]);
  await page.evaluate(() => { window.opened = null; });
  await page.click('#editBtn');
  await expect(page.locator('#edShare')).toContainText('(1)');
  await page.click('#edSave');
  expect(await page.evaluate(() => window.opened)).toBeNull();
});

test('the terminal completes names with Tab and brings commands back with the arrow keys', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false })); });
  await page.reload();
  await page.evaluate(() => { startLesson('u6-boss', [{ ...UNIT_6.boss.exercises[1], fx: homeFixture }]); });
  const input = page.locator('.term-input input');
  await input.fill('cat lo');
  await page.click('.term-key >> nth=0');
  await expect(input).toHaveValue('cat logs/');
  await input.press('Tab');
  await expect(input).toHaveValue('cat logs/app.log ');
  await input.fill('cat p');
  await input.press('Tab');
  await expect(input).toHaveValue('cat p');
  await input.fill('cut -d" " -f 2 logs/app.log');
  await input.press('Enter');
  await expect(input).toHaveValue('');
  await page.click('.term-key >> nth=1');
  await expect(input).toHaveValue('cut -d" " -f 2 logs/app.log');
  await expect(input).toBeFocused();
  await input.press('ArrowDown');
  await expect(input).toHaveValue('');
});

test('progress can be saved to a backup file and restored on a fresh device', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false, xp: 345, done: ['L0', 'L1'], streak: 3, lastDay: dayKey() })); });
  await page.reload();
  await page.click('[data-tab="profile"]');
  await page.evaluate(() => { navigator.canShare = () => true; navigator.share = async ({ files }) => { window.shared = { name: files[0].name, text: await files[0].text() }; }; });
  await page.click('#backupBtn');
  const shared = await page.waitForFunction(() => window.shared).then(h => h.jsonValue());
  expect(shared.name).toMatch(/^linux-master-learn-\d{4}-\d\d-\d\d\.json$/);
  const file = { name: shared.name, mimeType: 'application/json', buffer: Buffer.from(shared.text) };
  expect(JSON.parse(shared.text)).toMatchObject({ app: 'linux-master-learn', format: 1, state: { xp: 345, done: ['L0', 'L1'] } });

  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false })); });
  await page.reload();
  await page.click('[data-tab="profile"]');
  await expect(page.locator('#pXp')).toHaveText('0');
  page.once('dialog', d => d.accept());
  await Promise.all([page.waitForEvent('load'), page.setInputFiles('#restoreFile', file)]);
  await page.click('[data-tab="profile"]');
  await expect(page.locator('#pXp')).toHaveText('345');

  const [refused] = await Promise.all([page.waitForEvent('dialog'), page.setInputFiles('#restoreFile', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"other"}') })]);
  expect(refused.message()).toContain('Linux Master');
  await refused.accept();
  await expect(page.locator('#pXp')).toHaveText('345');
});

test('Hebrew text keeps a leading dot or colon inside its command, and sentence punctuation outside', async ({ page }) => {
  await page.goto('./prototype/');
  const runs = text => page.evaluate(t => { const d = document.createElement('div'); d.append(bidi(t)); return [...d.querySelectorAll('bdi')].map(b => b.textContent); }, text);
  expect(await runs('חבילה בסיומת .deb מותקנת כך')).toEqual(['.deb']);
  expect(await runs('שומרים ויוצאים עם :wq או בלי לשמור עם :q!')).toEqual([':wq', ':q!']);
  expect(await runs('עברו אל ../logs ואז הריצו ./run.sh.')).toEqual(['../logs', './run.sh']);
  expect(await runs('הפקודה: ls -l.')).toEqual(['ls -l']);
  expect(await runs('השעה 10:30 בדיוק')).toEqual(['10:30']);
  expect(await runs('הסימן + אומר "פעם אחת". ap+le מוצאת')).toEqual(['+', 'ap+le']);
  expect(await runs('התבנית "ERROR|WARN" מוצאת')).toEqual(['"ERROR|WARN"']);
  expect(await runs('הריצו grep -E "^a|b$" a.txt עכשיו')).toEqual(['grep -E "^a|b$" a.txt']);
  expect(await runs('התבנית ^08:1 מוצאת')).toEqual(['^08:1']);
  expect(await runs('לכן ap?le מוצאת')).toEqual(['ap?le']);
  expect(await runs('מה עושה grep -c? ומה עוד')).toEqual(['grep -c']);
  expect(await runs('התבנית "[0-9]" ו־"*.txt"')).toEqual(['"[0-9]"', '"*.txt"']);
});

test('Pages deploys every file Learn mode loads', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'prototype/index.html'), 'utf8');
  const local = [...html.matchAll(/(?:src|href)="([^"#:]+?)(?:\?[^"]*)?"/g)].map(m => m[1]).filter(f => !f.startsWith('..') && f !== './');
  const deploy = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8').match(/cp (?:-r )?(prototype\/.*) _site\/prototype\//)[1].split(/\s+/);
  expect(local.length).toBeGreaterThan(3);
  for (const file of local) expect(deploy, file).toContain(/^(parts|recorded)\//.test(file) ? `prototype/${file.split('/')[0]}` : `prototype/${file}`);
});
