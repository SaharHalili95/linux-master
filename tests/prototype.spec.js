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
    for (const c of await page.evaluate(() => L.ex.solve)) { await page.fill('.term-input textarea', c); await page.press('.term-input textarea', 'Enter'); }
    if (await page.evaluate(() => !!L.ex.ask)) await page.locator(`[data-ask="${await page.evaluate(() => L.expected)}"]`).click();
  }
  if (ex.type === 'scenario') await page.fill('#scenarioCmd', await page.evaluate(() => L.ex.accept[0]));
  if (ex.type === 'boss') {
    for (const c of [`ls -a ${ex.boss.dir}`, `cat ${ex.boss.dir}/.code`]) { await page.fill('.term-input textarea', c); await page.press('.term-input textarea', 'Enter'); }
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
  // WebKit reports a first-visit offline fetch that a navigation cancelled; that fetch is retried on the next visit.
  page.on('pageerror', e => { if (!String(e).includes('Fetch API cannot load')) errors.push(String(e)); });
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

test('the app opens in Learn mode with no Trivia switch, and the old Trivia address still works', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/prototype\/$/);
  await expect(page.locator('.node.current')).toBeVisible();
  await expect(page.locator('.mode-switch')).toHaveCount(0);
  await page.goto('./?mode=trivia');
  await expect(page.locator('.level-card')).toHaveCount(8);
  await page.goto('./');
  await expect(page.locator('.level-card')).toHaveCount(8);
});

test('the old Trivia page links to Learn mode, with no beta card left', async ({ page }) => {
  await page.goto('./?mode=trivia');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.beta-card')).toHaveCount(0);
  await page.click('#langBtn');
  await expect(page.locator('.mode-switch .mode.on')).toHaveText('🎯 Trivia');
  await page.click('#modeLearn');
  await expect(page).toHaveURL(/\/prototype\/$/);
  await expect(page.locator('.node.current')).toBeVisible();
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
  const artCached = await page.evaluate(async () => Promise.all(window.worldCharacterCatalog.assetPaths().map(async path => (await fetch(path)).ok)));
  expect(artCached).toEqual(Array(6).fill(true));
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

test('the language button switches Learn mode and the choice is remembered', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.tabbar [data-tab="learn"]')).toContainText('לימוד');
  await page.click('#langBtn');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('.tabbar [data-tab="learn"]')).toContainText('Learn');
  await expect(page.locator('.unit-banner h2').first()).toHaveText('Where am I?');
  await page.reload();
  await expect(page.locator('#langBtn')).toHaveText('עב');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

for (const lang of ['he', 'en']) test(`the top bar fits a small phone, with streak and gems visible (${lang})`, async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(l => { localStorage.clear(); localStorage.setItem('lang', l); }, lang);
  await page.reload();
  const width = page.viewportSize().width;
  for (const sel of ['#livesChip', '#langBtn', '.chip.streak', '.chip.gems']) {
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
  test.setTimeout(360_000);
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
  await expect(page.locator('.rec-label')).toHaveCount(0);
  await expect(page.locator('.term')).toContainText('uname -m');
  await page.locator('.opt', { hasText: 'x86_64' }).click();
  await page.click('#checkBtn');
  await expect(page.locator('#foot')).toHaveClass(/good/);
});

test('a scenario accepts any listed command, however it is spaced, and rejects others', async ({ page }) => {
  await page.goto('./prototype/');
  const ex = { type: 'scenario', prompt: { he: 'בדקו את nginx', en: 'Check nginx' }, rec: 'ubuntu-uname', accept: ['systemctl status nginx', 'systemctl status nginx.service'] };
  await page.evaluate(ex => startLesson('scenario-test', [ex]), ex);
  await expect(page.locator('.rec-label')).toHaveCount(0);
  await expect(page.locator('.term #scenarioCmd')).toBeVisible();
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
  // WebKit reports a first-visit offline fetch that a navigation cancelled; that fetch is retried on the next visit.
  page.on('pageerror', e => { if (!String(e).includes('Fetch API cannot load')) errors.push(String(e)); });
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
  // The three newer maps are checked word for word: each listed command, file or term must really be in the course.
  for (const file of ['linux-essentials.json', 'suse-sca.json', 'linux-plus.json']) {
    const map = JSON.parse(fs.readFileSync(path.join(root, 'materials/objectives', file), 'utf8'));
    expect(map.flatMap(o => o.terms.filter(term => !text.includes(term.toLowerCase())).map(term => `${o.id}: ${term}`)), `${file} terms the course never mentions`).toEqual([]);
  }
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
  page.on('pageerror', e => { if (!String(e).includes('Fetch API cannot load')) errors.push(String(e)); });
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
  for (const [tag, file] of [['L', 'lpic1.json'], ['R', 'rhcsa.json'], ['F', 'lfcs.json'], ['E', 'linux-essentials.json'], ['S', 'suse-sca.json'], ['C', 'linux-plus.json']])
    for (const o of JSON.parse(fs.readFileSync(path.join(root, 'materials/objectives', file), 'utf8')))
      for (const u of o.units) {
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

test('the terminal completes names with Tab, brings commands back, and can start over', async ({ page, isMobile }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false })); });
  await page.reload();
  await page.evaluate(() => { startLesson('u6-boss', [{ ...UNIT_6.boss.exercises[1], fx: homeFixture }]); });
  const input = page.locator('.term-input textarea');
  const keys = page.locator('.term-key.kb');
  if (isMobile) await expect(keys).toHaveCount(3); else await expect(keys.first()).toBeHidden();
  await input.fill('cat lo');
  if (isMobile) await keys.nth(0).click(); else await input.press('Tab');
  await expect(input).toHaveValue('cat logs/');
  await input.press('Tab');
  await expect(input).toHaveValue('cat logs/app.log ');
  await input.fill('cat p');
  await input.press('Tab');
  await expect(input).toHaveValue('cat p');
  const restart = page.locator('.term-key.restart');
  await expect(restart).toBeHidden();
  await input.fill('cd logs');
  await input.press('Enter');
  await expect(input).toHaveValue('');
  await expect(page.locator('.term-input .ps1')).toContainText('logs');
  if (isMobile) await keys.nth(1).click(); else await input.press('ArrowUp');
  await expect(input).toHaveValue('cd logs');
  await expect(input).toBeFocused();
  await input.press('ArrowDown');
  await expect(input).toHaveValue('');
  await restart.click();
  await expect(page.locator('.term-input .ps1')).not.toContainText('logs');
  await expect(page.locator('.term-scroll')).toBeEmpty();
  await expect(restart).toBeHidden();
  await expect(page.locator('#checkBtn')).toBeDisabled();
});

test('progress can be saved to a backup file and restored on a fresh device', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false, xp: 345, done: ['L0', 'L1'], streak: 3, lastDay: dayKey(), avatarStyle: 'violet', avatarUpdatedAt: 20, avatarForm: 'guardian', avatarFormUpdatedAt: 30 })); });
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
  await expect(page.locator('#avatarPicker input[value="violet"]')).toBeChecked();
  await expect(page.locator('#avatarForm input[value="guardian"]')).toBeChecked();

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
  expect(await runs('חלק מהמערכת (builtin), alias, או קובץ')).toEqual(['builtin', 'alias']);
  expect(await runs('הריצו $(date) עכשיו')).toEqual(['$(date)']);
  expect(await runs('ב־todo.txt (2 שורות) יש')).toEqual(['todo.txt', '2']);
  expect(await runs('כונן "D" אין')).toEqual(['"D"']);
  expect(await runs('לכן ap?le מוצאת')).toEqual(['ap?le']);
  expect(await runs('מה עושה grep -c? ומה עוד')).toEqual(['grep -c']);
  expect(await runs('התבנית "[0-9]" ו־"*.txt"')).toEqual(['"[0-9]"', '"*.txt"']);
});

test('a sentence blank stays on the line of the word before it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('./prototype/');
  await page.evaluate(() => startLesson('blank-test', [{ type: 'sentence', prompt: READ, text: T('קבצים ששמם מתחיל בנקודה מוסתרים. כדי לראות גם אותם כותבים ls ___.', 'x ls ___.'), options: ['-a', '-l'], answer: '-a' }]));
  const glued = await page.evaluate(() => { const g = document.querySelector('.sentence .glued'); return { text: g.textContent.replace(/\s+/g, ' ').trim(), lines: g.getClientRects().length }; });
  expect(glued.text).toMatch(/^ls .*\.$/);
  expect(glued.lines, 'the word, the blank and the period share one line').toBe(1);
});

test('merging two devices keeps everything the learner earned', async ({ page }) => {
  await page.goto('./prototype/');
  const mac = { xp: 300, gems: 10, done: ['L0', 'L1'], days: ['2026-11-01'], mistakes: ['a'], lastDay: '2026-11-01', streak: 4, track: 'R', quests: { day: '2026-11-01', xp: 5, perfect: 0, combo: 1, claimed: ['q1'] } };
  const phone = { xp: 120, gems: 40, done: ['L1', 'c1'], days: ['2026-11-02'], mistakes: ['b'], lastDay: '2026-11-02', streak: 1, track: 'C', quests: { day: '2026-11-02', xp: 9, perfect: 1, combo: 0, claimed: [] } };
  const merged = await page.evaluate(([a, b]) => [mergeProgress(a, b), mergeProgress(b, a), mergeProgress(a, { ...a, xp: 1, streak: 9, quests: { day: a.quests.day, xp: 7, perfect: 0, combo: 0, claimed: ['q2'] } }), mergeProgress({}, a), loadState(JSON.stringify(mergeProgress(a, b))).done.length], [mac, phone]);
  expect(merged[0]).toMatchObject({ xp: 300, gems: 40, lastDay: '2026-11-02', streak: 1, track: 'C', quests: phone.quests });
  expect(merged[0].done.sort()).toEqual(['L0', 'L1', 'c1']);
  expect(merged[0].days.sort()).toEqual(['2026-11-01', '2026-11-02']);
  expect(merged[0].mistakes.sort()).toEqual(['a', 'b']);
  expect({ ...merged[1], done: [...merged[1].done].sort(), days: [...merged[1].days].sort(), mistakes: [...merged[1].mistakes].sort() }, 'the order of the devices does not matter').toEqual({ ...merged[0], done: [...merged[0].done].sort(), days: [...merged[0].days].sort(), mistakes: [...merged[0].mistakes].sort() });
  expect(merged[2]).toMatchObject({ xp: 300, streak: 9, quests: { xp: 7, claimed: ['q1', 'q2'] } });
  expect(merged[3]).toMatchObject({ xp: 300, done: ['L0', 'L1'], streak: 4, track: 'R' });
  expect(merged[4]).toBe(3);
});

test('at phone width no exercise scrolls sideways and no command run carries half a pair @content', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('./prototype/');
  const found = await page.evaluate(async () => {
    const out = { wide: [], broken: [] };
    const half = t => t.length > 1 && ((t.match(/\(/g) || []).length !== (t.match(/\)/g) || []).length || (t.match(/"/g) || []).length % 2 === 1);
    for (const u of COURSE.filter(x => !x.exam && !x.locked)) for (const [id, ex] of [...u.lessons.flatMap((l, li) => l.exercises.map((e, i) => [`${u.unit}/L${li}.${i}`, e])), ...(u.boss.exercises || []).map((e, i) => [`${u.unit}/boss.${i}`, e])]) {
      for (const v of [ex.prompt, ex.text, ex.hint, ...(ex.options || [])]) { const t = tr(v); if (typeof t !== 'string') continue; const d = document.createElement('div'); d.append(bidi(t)); for (const b of d.querySelectorAll('bdi')) if (half(b.textContent)) out.broken.push(`${id}: ${b.textContent}`); }
      startLesson('scan', [{ ...ex, fx: u.fixture || unitFixture }]);
      await new Promise(r => setTimeout(r, 0));
      const m = document.getElementById('lessonMain');
      if (m.scrollWidth > m.clientWidth + 1) out.wide.push(`${id} +${m.scrollWidth - m.clientWidth}`);
    }
    return out;
  });
  expect(found.wide, 'exercises that scroll sideways').toEqual([]);
  expect(found.broken, 'command runs with half a pair').toEqual([]);
});

test('a long command wraps in the terminal, Enter runs it, and typing keeps the terminal above the keyboard', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => startLesson('u6-boss', [{ ...UNIT_6.boss.exercises[1], fx: homeFixture }]));
  const input = page.locator('.term-input textarea');
  await input.fill('grep -E "(full|timeout)$" logs/app.log | sort | uniq -c | head -n 20 | tail -n 5 | cat');
  await expect.poll(() => input.evaluate(e => e.offsetHeight)).toBeGreaterThan(24);
  expect(await input.evaluate(e => e.scrollWidth <= e.clientWidth && e.scrollHeight <= e.clientHeight)).toBe(true);
  await input.focus();
  await page.evaluate(() => { Object.defineProperty(window, 'visualViewport', { value: { height: 400, offsetTop: 0, scale: 1, addEventListener() {} }, configurable: true }); fitLesson(); });
  await expect(page.locator('#lesson')).toHaveClass(/typing/);
  const gap = await page.evaluate(() => 400 - document.querySelector('.term.live').getBoundingClientRect().bottom);
  expect(gap).toBeLessThan(40);
  await input.press('Enter');
  await expect(input).toHaveValue('');
  await expect(page.locator('.term-scroll .term-line')).toHaveCount(1);
  for (let i = 0; i < 6; i++) { await input.fill('cat logs/app.log'); await input.press('Enter'); }
  const seen = await page.evaluate(() => { const q = document.getElementById('exPrompt').getBoundingClientRect(), f = document.querySelector('.term-input').getBoundingClientRect(); return q.top >= 0 && f.bottom <= 400; });
  expect(seen).toBe(true);
  await input.fill('echo \u201chello\u201d'); await input.press('Enter');
  await expect(page.locator('.term-scroll .term-out').last()).toHaveText('hello');
});

test('a hint explains in words and never hands over the answer', async ({ page }) => {
  await page.goto('./prototype/');
  const bad = await page.evaluate(() => {
    const out = [], esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const u of COURSE) for (const l of [...(u.lessons || []), ...(u.boss ? [u.boss] : [])]) for (const ex of l.exercises || []) {
      if (!ex.hint) continue;
      const he = ex.hint.he ?? String(ex.hint), en = ex.hint.en ?? he;
      if (!/[\u0590-\u05ff]/.test(he)) out.push(`bare: ${he}`);
      for (const a of [...(ex.solve || []), ...(ex.accept || [])]) if (new RegExp(`(^|[^\\w-])${esc(a.trim())}($|[^\\w-])`).test(`${he} ${en}`)) out.push(`shows ${a}: ${he}`);
    }
    return out;
  });
  expect(bad).toEqual([]);
});

test('no exercise says its output was recorded on a real machine', async ({ page }) => {
  await page.goto('./prototype/');
  const said = await page.evaluate(() => COURSE.flatMap(u => [...(u.lessons || []), ...(u.boss ? [u.boss] : [])].flatMap(l => l.exercises || [])).filter(e => e?.prompt).map(e => `${e.prompt.he} ${e.prompt.en}`).filter(x => /הוקלט|recorded on|real (Linux|Ubuntu)|(Ubuntu|לינוקס) אמיתי/.test(x)));
  expect(said).toEqual([]);
});

test('a grep task that needs an anchor rejects the same command without it', async ({ page }) => {
  await page.goto('./prototype/');
  const weak = await page.evaluate(() => {
    const out = [];
    const passes = (ex, cmds) => { const sh = new Shell((ex.fx || homeFixture)()); for (const c of ex.setup || []) sh.run(c); return ex.goal(sh, cmds.map(cmd => { const r = sh.run(cmd); return { cmd, out: (r.out + r.err).replace(/\n$/, '') }; })); };
    for (const u of COURSE) for (const l of [...(u.lessons || []), ...(u.boss ? [u.boss] : [])]) for (const ex of l.exercises || []) {
      if (ex.type !== 'terminal' || !ex.solve) continue;
      ex.solve.forEach((c, i) => { if (!/\bgrep\b/.test(c)) return; const m = c.replace(/\$(["')])/g, '$1').replace(/(["'(|])\^/g, '$1'); if (m !== c && passes(ex, ex.solve.map((x, j) => (j === i ? m : x)))) out.push(c); });
    }
    return out;
  });
  expect(weak).toEqual([]);
});

test('every region has its name, text and scene, and readable colors', async ({ page }) => {
  await page.goto('./prototype/');
  await expect(page.locator('.region')).toHaveCount(await page.evaluate(() => new Set(COURSE.map(u => u.section)).size));
  await expect(page.locator('#stage .region-scene')).toHaveCount(1);
  await expect.poll(() => page.locator('#pathField').evaluate(c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some(v => v > 0))).toBe(true);
  await expect(page.locator('#stage .topbar #livesChip')).toBeVisible();
  const last = await page.evaluate(() => +[...document.querySelectorAll('.region')].at(-1).dataset.part);
  await expect(async () => { // The path also scrolls itself to the current step while fonts load.
    await page.evaluate(() => [...document.querySelectorAll('.region')].at(-1).scrollIntoView());
    await expect(page.locator('#stage')).toHaveAttribute('data-part', String(last), { timeout: 500 });
  }).toPass();
  expect(await page.locator('#stage').evaluate(e => e.getBoundingClientRect().top)).toBe(0);
  await page.locator('.tabbar button[data-tab="profile"]').click();
  await expect(page.locator('.app > .topbar #livesChip')).toBeVisible();
  const pairs = await page.evaluate(() => Object.entries(REGIONS).flatMap(([p, r]) => [[`${p} text`, REGION_INK, r.ground, 4.5], [`${p} soft text`, REGION_MUTE, r.panel, 4.5], [`${p} on accent`, REGION_ON_ACCENT, r.accent, 4.5], [`${p} accent`, r.accent, r.ground, 3]]));
  const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  for (const [name, a, b, min] of pairs) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); expect((x + 0.05) / (y + 0.05), name).toBeGreaterThanOrEqual(min); }
});

test('the hero earns ranks, a lesson gives a power, and the win screen shows the moon', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false, xp: 995 })); });
  await page.reload();
  await expect(page.locator('.hero-rank')).toContainText('4');
  expect(await page.evaluate(() => [rankOf(0).level, rankOf(99).level, rankOf(100).level, rankOf(999999).level, rankOf(999999).to])).toEqual([1, 1, 2, 12, null]);
  await page.evaluate(() => { const u = COURSE.find(x => x.unit === 22); startLesson('u22-L0', [{ ...u.lessons[0].exercises.find(e => e.type === 'choice'), fx: u.fixture || homeFixture }]); L.correct = 1; finishLesson(); });
  await expect(page.locator('#endMoon svg')).toBeVisible();
  await expect(page.locator('#endRank')).toContainText(await page.evaluate(() => rankOf(S.xp).name));
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('end')).backgroundColor)).toBe('rgb(20, 26, 82)');
});

test('lives are lost on wrong answers, come back with time, and can be bought or earned', async ({ page }) => {
  await page.goto('./prototype/');
  const set = v => page.evaluate(x => { localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false, ...x })); }, v);
  await set({ gems: 25, lives: 1, livesAt: Date.now() });
  await page.reload();
  await expect(page.locator('#livesN')).toHaveText('1');
  await page.evaluate(() => { const ex = { type: 'choice', prompt: T('x', 'x'), options: ['a', 'b'], answer: 'a', fx: unitFixture }; startLesson('u2-L0', [ex, ex]); answer(false, 'a', ''); });
  expect(await page.evaluate(() => S.lives)).toBe(0);
  await page.evaluate(() => closeOverlays());
  await page.locator('.node.current').click();
  await page.locator('#pop .btn').click();
  await expect(page.locator('#livesSheet')).toBeVisible();
  await expect(page.locator('#lesson')).toBeHidden();
  await page.click('#buyLife');
  await expect(page.locator('#livesCount')).toHaveText('1 / 5');
  expect(await page.evaluate(() => S.gems)).toBe(5);
  await expect(page.locator('#buyLife')).toBeDisabled();
  await set({ lives: 2, livesAt: Date.now() - 65 * 60 * 1000 });
  await page.reload();
  await expect(page.locator('#livesN')).toHaveText('4');
  await page.evaluate(() => { startLesson('practice', [{ type: 'choice', prompt: T('x', 'x'), options: ['a', 'b'], answer: 'a', fx: unitFixture }], { practice: true }); answer(false, 'a', ''); });
  expect(await page.evaluate(() => S.lives), 'practice never costs a life').toBe(4);
});

test('light practice uses the old Trivia questions and can earn a life', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false, lives: 2, livesAt: Date.now() })); });
  await page.reload();
  await page.click('#livesChip');
  await page.click('#earnLife');
  await expect(page.locator('#lesson')).toBeVisible();
  const n = await page.evaluate(() => { const all = triviaExercises(500); return [all.length, L.total, all.every(q => q.options.includes(q.answer) && q.options.length >= 2 && new Set(q.options).size === q.options.length)]; });
  expect(n[0]).toBe(121); expect(n[1]).toBe(5); expect(n[2]).toBe(true);
  await page.evaluate(() => { L.correct = 3; finishLesson(); });
  await expect(page.locator('#endQuests')).not.toBeEmpty();
  expect(await page.evaluate(() => S.lives)).toBe(3);
});

test('the character gains upgrades as its rank rises', async ({ page }) => {
  await page.goto('./prototype/');
  const parts = await page.evaluate(() => [1, 2, 4, 6, 8, 10, 12].map(l => { const d = document.createElement('div'); d.innerHTML = mascot('happy', l); return d.querySelectorAll('svg > *').length; }));
  for (let i = 1; i < 6; i++) expect(parts[i], `tier ${i}`).toBeGreaterThan(parts[i - 1]);
  expect(parts[6]).toBeGreaterThan(parts[0]);
});

test('Pages deploys every file Learn mode loads', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'prototype/index.html'), 'utf8');
  const local = [...html.matchAll(/(?:src|href)="([^"#:]+?)(?:\?[^"]*)?"/g)].map(m => m[1]).filter(f => !f.startsWith('..') && f !== './');
  const deploy = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8').match(/cp (?:-r )?(prototype\/.*) _site\/prototype\//)[1].split(/\s+/);
  expect(local.length).toBeGreaterThan(3);
  for (const file of local) expect(deploy, file).toContain(/^(parts|recorded|fonts)\//.test(file) ? `prototype/${file.split('/')[0]}` : `prototype/${file}`);
});

test('character: the new hero keeps rank upgrades and reacts to feedback without revealing exam answers', async ({ page }) => {
  await page.goto('./prototype/');
  await expect(page.locator('.hero-face .character-hero')).toBeVisible();
  const tiers = await page.evaluate(() => [1, 4, 8, 12].map(level => {
    const node = document.createElement('div'); node.innerHTML = mascot('happy', level);
    return { rank: node.querySelector('svg').dataset.rank, equipment: node.querySelectorAll('[data-equipment]').length };
  }));
  expect(tiers.map(x => x.rank)).toEqual(['1', '4', '8', '12']);
  for (let i = 1; i < tiers.length; i++) expect(tiers[i].equipment).toBeGreaterThan(tiers[i - 1].equipment);
  await page.locator('.node.current').click(); await page.locator('#pop .btn').click();
  await page.click('#checkBtn');
  await page.locator('.opt[data-value="ls"]').click(); await page.click('#checkBtn');
  await expect(page.locator('#fbBox .character-hero')).toHaveAttribute('data-mood', 'sad');
  await page.evaluate(() => setFoot('good', 'Correct'));
  await expect(page.locator('#fbBox .character-hero')).toHaveAttribute('data-mood', 'happy');
  await page.evaluate(() => setFoot('saved', 'Answer saved'));
  await expect(page.locator('#fbBox .character-hero')).toHaveAttribute('data-mood', 'idle');
});

test('character: original moon and animated backgrounds stay intact on iPhone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('./prototype/');
  await expect(page.locator('#pathField')).toBeAttached();
  await expect(page.locator('#pathBolts')).toBeAttached();
  await expect(page.locator('.stage-moon')).toBeVisible();
  await expect(page.locator('.hero-face .character-hero')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  const before = await page.locator('.stage').boundingBox();
  await page.evaluate(() => { document.querySelectorAll('.character-hero').forEach(e => e.style.visibility = 'hidden'); });
  expect(await page.locator('.stage').boundingBox()).toEqual(before);
});

for (const pixelRatio of [1.25, 3]) test(`retina background clears its full surface after a canvas state reset (${pixelRatio}x)`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, deviceScaleFactor: pixelRatio, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  try {
    await page.goto('./prototype/');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(dpr => ['pathField', 'pathBolts'].every(id => { const c = document.getElementById(id); return c.width >= Math.floor(390 * dpr) && c.height >= Math.floor(844 * dpr); }), pixelRatio);
    for (const id of ['pathField', 'pathBolts']) {
      await page.evaluate(id => {
        const c = document.getElementById(id), ctx = c.getContext('2d');
        ctx.resetTransform(); ctx.fillStyle = '#ff00ff'; ctx.fillRect(c.width - 10, c.height - 10, 10, 10);
        FIELD.tint('#ffb347');
      }, id);
      await expect.poll(() => page.evaluate(id => {
        const c = document.getElementById(id);
        return [...c.getContext('2d').getImageData(c.width - 5, c.height - 5, 1, 1).data];
      }, id), { timeout: 1500 }).not.toEqual([255, 0, 255, 255]);
      await expect.poll(() => page.evaluate(id => {
        const c = document.getElementById(id), m = c.getContext('2d').getTransform(), box = c.getBoundingClientRect();
        return Math.abs(m.a - c.width / box.width) < 0.000001 && Math.abs(m.d - c.height / box.height) < 0.000001;
      }, id)).toBe(true);
    }
  } finally { await context.close(); }
});

test('loading: the first lesson works before later course files finish and stays open afterward', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/parts/p1.js?*', async route => { await gate; await route.continue(); });
  const navigation = page.goto('./prototype/');
  try {
    await expect(page.locator('.stage-moon')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.node.current')).toBeVisible();
    expect(await page.evaluate(() => COURSE.length)).toBe(6);
    await page.locator('.node.current').click(); await page.locator('#pop .btn').click();
    await expect(page.locator('#lesson')).toBeVisible();
    await expect(page.locator('#exBody')).toContainText('pwd');
  } finally { release(); await navigation; }
  await expect(page.locator('#lesson')).toBeVisible();
  await expect(page.locator('#exBody')).toContainText('pwd');
  expect(await page.evaluate(() => COURSE.length)).toBeGreaterThanOrEqual(83);
  await page.evaluate(() => closeOverlays());
  await expect(page.locator('.unit-banner')).toHaveCount(await page.evaluate(() => COURSE.length));
});

test('loading: saved progress beyond the first six units resumes without changing it', async ({ page }) => {
  await page.addInitScript(() => {
    const done = Array.from({ length: 6 }, (_, i) => ['L0', 'L1', 'c1', 'L2', 'L3', 'boss'].map(k => i ? `u${i + 1}-${k}` : k)).flat();
    localStorage.setItem('linux-master-proto', JSON.stringify({ done, xp: 300, gems: 80 }));
  });
  await page.goto('./prototype/');
  await expect(page.locator('.node.current')).toHaveAttribute('aria-label', await page.evaluate(() => t('lessonN', 1, tr(COURSE.find(u => u.unit === 7).lessons[0].title))));
  expect(await page.evaluate(() => ({ xp: S.xp, gems: S.gems, completed: S.done.length }))).toEqual({ xp: 300, gems: 80, completed: 36 });
});

test('loading: partially downloaded later units stay unavailable in the path and practice', async ({ page }) => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/parts/p11.js?*', async route => { await gate; await route.continue(); });
  const navigation = page.goto('./prototype/');
  try {
    await page.waitForFunction(() => typeof COURSE !== 'undefined' && COURSE.some(u => u.unit === 11));
    await page.click('[data-tab="profile"]'); await page.click('[data-tab="learn"]');
    await expect(page.locator('.unit-banner')).toHaveCount(6);
    expect(await page.evaluate(() => allExercises().some(ex => /^u(?:[7-9]|\d{2,})-/.test(ex.uid)))).toBe(false);
  } finally { release(); await navigation; }
  await expect(page.locator('.unit-banner')).toHaveCount(await page.evaluate(() => COURSE.length));
});

test('loading: finishing the download preserves the visible first world', async ({ page }) => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/parts/p1.js?*', async route => { await gate; await route.continue(); });
  const navigation = page.goto('./prototype/');
  try {
    await expect(page.locator('.stage-moon')).toBeVisible();
    await page.evaluate(() => { window.firstStage = document.getElementById('stage'); });
  } finally { release(); await navigation; }
  expect(await page.evaluate(() => window.firstStage === document.getElementById('stage'))).toBe(true);
});

for (const file of ['parts/p1.js', 'course-ready.js']) test(`loading: a failed ${file} keeps the starter playable and never claims offline readiness`, async ({ page }) => {
  await page.route(`**/${file}?*`, route => route.abort());
  await page.goto('./prototype/');
  await expect(page.locator('#toast')).toContainText(await page.evaluate(() => t('triviaFailed')));
  await expect(page.locator('.node.current')).toBeVisible();
  expect(await page.evaluate(() => window.courseReady)).toBe(false);
  expect(await page.evaluate(() => !!window.learnKept)).toBe(false);
  await page.locator('.node.current').click(); await page.locator('#pop .btn').click();
  await expect(page.locator('#lesson')).toBeVisible();
});

test('world characters match the first six learning topics without replacing the learner', async ({ page }) => {
  await page.goto('/prototype/');
  await expect(page.locator('.hero-face .character-hero')).toBeVisible();
  const characters = await page.locator('.path-mascot img').evaluateAll(nodes => nodes.slice(0, 6).map(node => node.getAttribute('src')));
  expect(characters).toHaveLength(6);
  expect(new Set(characters).size).toBe(6);
});

test('character catalog covers the course independently of lesson text', async ({ page }) => {
  await page.goto('/prototype/');
  await page.waitForFunction(() => window.courseReady);
  const result = await page.evaluate(() => {
    const catalog = window.worldCharacterCatalog;
    const units = COURSE.map(unit => ({
      unit: unit.unit,
      role: catalog.roleFor(unit),
      renamedRole: catalog.roleFor({ ...unit, title: { en: 'Different wording' }, subtitle: { en: 'Different wording' } })
    }));
    return { units, roles: Object.keys(catalog.characters), assets: catalog.assetPaths(), unknown: catalog.roleFor({ unit: 10000, section: 1 }) };
  });
  expect(result.units).toHaveLength(99);
  for (const unit of result.units) {
    expect(result.roles).toContain(unit.role);
    expect(unit.role).toBe(unit.renamedRole);
  }
  expect(result.assets).toHaveLength(result.roles.length);
  expect(new Set(result.assets).size).toBe(result.roles.length);
  expect(result.roles).toContain(result.unknown);
  expect(Object.fromEntries(result.units.filter(unit => [1, 2, 3, 4, 5, 6, 22, 35, 50, 51, 62, 69, 78].includes(unit.unit)).map(unit => [unit.unit, unit.role]))).toEqual({ 1: 'explorer', 2: 'reader', 3: 'courier', 4: 'scout', 5: 'engineer', 6: 'analyst', 22: 'scout', 35: 'scout', 50: 'engineer', 51: 'scout', 62: 'engineer', 69: 'scout', 78: 'reader' });
});

test('a missing character asset never marks a first visit offline-ready', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit does not support service workers');
  await page.addInitScript(() => {
    const originalFetch = window.fetch;
    window.fetch = (input, ...options) => {
      if (String(input).includes('/character-art/analyst.webp')) {
        window.missingCharacterAsset = true;
        return Promise.resolve(new Response('', { status: 404 }));
      }
      return originalFetch(input, ...options);
    };
  });
  await page.goto('./prototype/');
  await page.waitForFunction(() => window.missingCharacterAsset);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => [!!window.learnKept, localStorage.getItem('learnOffline')])).toEqual([false, null]);
});

test('a teach card with an example lets the learner go on typing in the same terminal', async ({ page }) => {
  await page.goto('./prototype/');
  await page.evaluate(() => { const ex = UNIT_9.lessons[1].exercises.find(e => e.cmd === 'img{1..3}'); startLesson('u9-L1', [{ ...ex, fx: homeFixture }]); });
  const term = page.locator('.teach-card .term.live'), input = term.locator('textarea');
  await expect(term).toContainText('year2025');
  expect(await page.evaluate(() => document.activeElement.tagName), 'a teach card must not open the keyboard by itself').not.toBe('TEXTAREA');
  await expect(page.locator('#checkBtn')).toBeEnabled();
  await input.fill('echo a{1..3}.txt'); await input.press('Enter');
  await expect(term).toContainText('a1.txt a2.txt a3.txt');
  await input.fill('mkdir -v demo'); await input.press('Enter');
  await expect(term).toContainText('-v');
  await expect(term).not.toContainText('הפקודה לא זמינה');
  await term.locator('.restart').click();
  await expect(term).toContainText('year2025');
  await expect(term).not.toContainText('a1.txt');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a pattern that opens with question marks stays one left-to-right run, and unit 9 teaches text next to braces before asking for it', async ({ page }) => {
  await page.goto('./prototype/');
  const runs = await page.evaluate(() => [...bidi('התבנית ?????.txt מתאימה').querySelectorAll('bdi')].map(b => b.textContent));
  expect(runs).toEqual(['?????.txt']);
  expect(await page.evaluate(() => [...bidi('מה ידפיס ls?').querySelectorAll('bdi')].map(b => b.textContent))).toEqual(['ls']);
  const order = await page.evaluate(() => { const list = UNIT_9.lessons[1].exercises; return [list.findIndex(e => e.type === 'teach' && /^\w+\{/.test(e.cmd)), list.findIndex(e => e.type === 'terminal' && e.solve[0] === 'mkdir projects/v{1..3}')]; });
  expect(order[0]).toBeGreaterThan(-1);
  expect(order[0]).toBeLessThan(order[1]);
});

const freshCourse = async page => {
  await page.goto('./prototype/');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false })); });
  await page.reload();
  await page.waitForFunction(() => window.courseReady);
};

test('a jump test at the start of a later part marks the earlier stages as skipped, and they stay open to learn', async ({ page }) => {
  test.setTimeout(180000);
  await freshCourse(page);
  await expect(page.locator('.region').first().locator('.skip-btn')).toHaveCount(0);
  const target = await page.evaluate(() => { const x = skipTarget(3); return { units: x.units.length, keys: x.keys.length, count: x.count, parts: x.parts }; });
  expect(target.count).toBe(12);
  await page.locator('.region[data-part="3"] .skip-btn').click();
  await expect(page.locator('#pop')).toContainText(String(target.count));
  await page.locator('#pop .btn.primary').click();
  await expect(page.locator('#comboTag')).toBeEmpty();
  for (let i = 0; i < target.count; i++) {
    await expect(page.locator('.hint-link')).toHaveCount(0);
    await solve(page);
  }
  await expect(page.locator('#end')).toBeVisible();
  await expect(page.locator('#endTitle')).toContainText(String(target.keys));
  await expect(page.locator('#endXp')).toHaveText(String(30 * target.parts));
  await expect(page.locator('#endAlt')).toBeHidden();
  await page.click('#endBtn');
  const state = await page.evaluate(() => ({ ...JSON.parse(localStorage.getItem('linux-master-proto')), part: document.querySelector('.node.current').closest('.region').dataset.part }));
  expect(state.skipped.length).toBe(target.keys);
  expect(state.done.length).toBe(target.keys);
  expect(state.lives ?? 5).toBe(5);
  expect(state.part).toBe('3');
  await expect(page.locator('.region[data-part="3"] .skip-btn')).toHaveCount(0);
  await expect(page.locator('.node.skipped')).toHaveCount(target.keys);
  // A skipped lesson is still a full lesson: learning it removes the mark.
  await page.locator('.node.lesson.skipped').first().click();
  await expect(page.locator('#pop')).toContainText('דילגתם');
  await page.locator('#pop .btn.primary').click();
  while (await page.locator('#lesson').isVisible()) await solve(page);
  expect(await page.evaluate(() => S.skipped.includes('L0'))).toBe(false);
  expect(await page.evaluate(() => S.done.includes('L0'))).toBe(true);
});

test('a failed jump test changes nothing, names what to review, and the retry asks other questions', async ({ page }) => {
  await freshCourse(page);
  await page.evaluate(() => startSkip(2));
  const asked = async () => page.evaluate(() => [L.ex, ...L.queue].map(ex => tr(ex.prompt)));
  const first = await asked();
  expect(first.length).toBe(12);
  for (let i = 0; i < 12; i++) { await page.evaluate(() => answer(false)); await expect(page.locator('#fbDetail')).toBeEmpty(); await page.click('#checkBtn'); }
  await expect(page.locator('#end')).toBeVisible();
  await expect(page.locator('#endXp')).toHaveText('0');
  await expect(page.locator('#endQuests')).not.toBeEmpty();
  await expect(page.locator('#endAlt')).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('linux-master-proto')));
  expect(state.done || []).toEqual([]);
  expect(state.skipped || []).toEqual([]);
  expect(state.mistakes || []).toEqual([]);
  expect(state.lives ?? 5).toBe(5);
  await page.click('#endBtn');
  await expect(page.locator('#lesson')).toBeVisible();
  const second = await asked();
  expect(second.filter(q => first.includes(q))).toEqual([]);
  page.on('dialog', d => d.accept());
  await page.click('#quitBtn');
  await expect(page.locator('#endAlt')).toBeHidden();
});

test('any closed stage offers a jump: the test asks only about the stages before it, and passing opens that stage', async ({ page }) => {
  await freshCourse(page);
  // The stage right after the current one skips a single lesson, so the test is short and asks only about that lesson.
  const near = await page.evaluate(() => { const x = skipTarget('L1'), own = COURSE[0].lessons[0].exercises.map(ex => tr(ex.prompt)); const qs = buildSkip(x.units, x.count, x.keys); return { keys: x.keys, count: x.count, n: qs.length, foreign: qs.filter(q => !own.includes(tr(q.prompt))).length }; });
  expect(near.keys).toEqual(['L0']);
  expect(near.count).toBe(4);
  expect(near.n).toBeGreaterThan(0);
  expect(near.foreign).toBe(0);
  // A lesson in the middle of the second unit: everything before it is skipped, the rest of the unit is not.
  const key = await page.evaluate(() => unitNodes(COURSE.filter(u => inTrack(u) && !u.locked)[1])[3].key);
  const target = await page.evaluate(k => { const x = skipTarget(k); return { keys: x.keys, count: x.count }; }, key);
  expect(target.keys.length).toBe(9);
  const node = page.locator('.node.locked').nth(8);
  await node.click();
  await expect(page.locator('#pop.jump')).toContainText(String(target.count));
  await expect(page.locator('#pop .pop-lead')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#pop .btn.primary').click();
  while (await page.locator('#lesson').isVisible()) await solve(page);
  await expect(page.locator('#end')).toBeVisible();
  await expect(page.locator('#endTitle')).toContainText('9');
  await page.click('#endBtn');
  const state = await page.evaluate(() => ({ done: S.done, skipped: S.skipped, current: unitNodes(COURSE.filter(u => inTrack(u) && !u.locked)[1])[3].key, xp: S.xp }));
  expect([...state.done].sort()).toEqual([...target.keys].sort());
  expect(state.skipped.length).toBe(9);
  expect(state.xp).toBe(30);
  await expect(page.locator('.node.current')).toHaveAttribute('aria-label', await page.evaluate(k => { const u = unitOfKey(k); return t('lessonN', 3, tr(u.lessons[2].title)); }, key));
  await expect(page.locator('.node.current')).toBeInViewport();
});

test('a jump test covers every skipped unit of the chosen track, with live terminals, and its mark survives a sync', async ({ page }) => {
  await freshCourse(page);
  const r = await page.evaluate(() => {
    const far = skipTarget(10), qs = buildSkip(far.units, far.count);
    S.track = 'R'; const track = skipTarget(10);
    const merged = mergeProgress({ done: ['L0'], skipped: ['L0'] }, { done: ['L1'], skipped: ['L1'] });
    return { count: far.count, n: qs.length, types: [...new Set(buildSkip(far.units, 99999).map(q => q.type))], topics: new Set(qs.map(q => tr(q.topic))).size,
      foreign: track.units.filter(u => !u.exams?.some(e => e.startsWith('R'))).length, fewer: track.units.length < far.units.length,
      merged: merged.skipped, loaded: loadState(JSON.stringify({ skipped: ['L0', 7] })).skipped };
  });
  expect(r.count).toBeLessThanOrEqual(40);
  expect(r.n).toBe(r.count);
  expect(r.topics).toBe(r.count);
  expect(r.types).toContain('terminal');
  expect(r.types).not.toContain('teach');
  expect(r.types).not.toContain('boss');
  expect(r.foreign).toBe(0);
  expect(r.fewer).toBe(true);
  expect(r.merged.sort()).toEqual(['L0', 'L1']);
  expect(r.loaded).toEqual(['L0']);
});
