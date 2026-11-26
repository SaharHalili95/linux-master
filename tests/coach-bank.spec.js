// The coach's question bank: the learner's own mistakes to fix, exercises made from typed ones, and the hand-written bank.
const { test, expect } = require('./course-loaded');

const fresh = async page => {
  await page.goto('./');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false })); });
  await page.reload();
  await page.waitForFunction(() => window.courseReady && typeof Shell === 'function' && typeof coachExtras === 'function');
};

test('every hand-written bank exercise runs cleanly, names its file and practises a taught command', async ({ page }) => {
  await fresh(page);
  const bank = await page.evaluate(() => {
    const taught = new Set(COURSE.flatMap(u => (u.lessons || []).flatMap(l => l.exercises)).filter(e => e.type === 'teach').flatMap(e => coachConcepts(e).all));
    return COACH_BANK.map(ex => {
      const sh = new Shell(homeFixture()), r = sh.run(ex.accept[0]), files = ex.accept[0].split(' ').filter(w => /\.(txt|log|csv)$|\/$/.test(w));
      return { line: ex.accept[0], err: r.err, he: ex.prompt.he, en: ex.prompt.en, files, cmds: coachConcepts(ex).all.filter(c => c.startsWith('cmd:')), taught: coachConcepts(ex).all.filter(c => c.startsWith('cmd:')).every(c => taught.has(c)) };
    });
  });
  expect(bank.length).toBeGreaterThanOrEqual(20);
  for (const b of bank) {
    expect(b.err, b.line).toBe('');
    expect(b.cmds.length, b.line).toBeGreaterThan(0);
    expect(b.taught, `${b.line}: every command in it has a teach card`).toBe(true);
    for (const f of b.files) { expect(b.he, `${b.line} names ${f} in Hebrew`).toContain(f.replace(/\/$/, '')); expect(b.en).toContain(f.replace(/\/$/, '')); }
    expect(b.he).not.toMatch(/—/);
  }
});

test('a fill-in or tiles made from a typed exercise completes to its answer, and no wrong choice prints the same', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    const all = COURSE.filter(u => u.lessons).flatMap(u => u.lessons.flatMap((ls, li) => withFixture(u, ls.exercises).map((ex, i) => ({ ...ex, uid: `${unitKey(u, `L${li}`)}.${i}` }))));
    const made = [];
    for (const ex of [...all.filter(e => e.type === 'scenario'), ...COACH_BANK]) for (const c of coachConcepts(ex).focus) made.push(...coachVariants(ex, c, all).map(v => ({ v, ex })));
    const bad = [];
    for (const { v, ex } of made) {
      const fx = v.fx || homeFixture, run = line => { const s = new Shell(fx()).run(line); return `${s.out}\u0000${s.err}`; };
      if (v.type === 'fill') {
        if (`${v.before}${v.answer}${v.after}` !== ex.accept[0]) bad.push(`fill does not complete: ${ex.accept[0]}`);
        const right = run(ex.accept[0]);
        for (const o of v.options.filter(o => o !== v.answer)) { let out; try { out = run(`${v.before}${o}${v.after}`); } catch { out = 'threw'; } if (out === right) bad.push(`${o} prints the same as ${ex.accept[0]}`); }
        if (new Set(v.options).size !== v.options.length) bad.push(`repeated choice in ${ex.accept[0]}`);
      } else if (!ex.accept[0].split(' ').every(w => v.tiles.includes(w))) bad.push(`tiles miss a word of ${ex.accept[0]}`);
    }
    return { count: made.length, fills: made.filter(m => m.v.type === 'fill').length, bad: bad.slice(0, 10) };
  });
  expect(r.bad).toEqual([]);
  // Most typed exercises run admin commands the simulator cannot run, and nothing is made without its check.
  expect(r.fills, 'the generator still makes fill-ins wherever the simulator can prove the wrong choices wrong').toBeGreaterThanOrEqual(30);
});

test("a learner's own wrong command comes back to fix, first among the typing, never next to the same task", async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    S.done = ['L0', 'L1', 'c1', 'L2', 'L3', 'boss', 'u2-L0', 'u2-L1']; S.skill = {}; S.confuse = {}; S.review = null; S.mistakes = []; S.slips = [];
    const where = reviewPool(), real = where.pool.find(e => e.type === 'terminal' && coachConcepts(e).focus.includes('cmd:head'));
    const run = cmd => { const i = document.querySelector('.term.live textarea'); i.value = cmd; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); };
    for (let i = 0; i < 2; i++) { startLesson('x', [real]); L.ex.uid = real.uid; run('cat logs/app.log'); onFootButton(); }
    const bankUid = COACH_BANK[0].uid; startLesson('x', [COACH_BANK[0]]); L.ex.uid = bankUid; L.value = 'cat notes.txt'; onFootButton();
    closeOverlays();
    const plan = planReview(), extras = coachExtras(plan.concepts, where);
    const items = coachBuild(plan.concepts, { ...where, failed: new Set(S.mistakes), variant: 0, extras, rand: () => 0.4 });
    const typed = items.filter(e => ['scenario', 'terminal', 'tiles'].includes(e.type)).filter(e => e.type !== 'tiles');
    startLesson('review-x', [items.find(e => e.fix)], { review: true, practice: true });
    return {
      slips: S.slips.map(s => [s.uid, s.got, s.c]), concepts: plan.concepts, size: items.filter(e => e.type !== 'teach').length,
      fixes: items.filter(e => e.fix).map(e => e.was), firstTyped: typed[0]?.fix, original: items.some(e => e.uid === real.uid),
      tag: document.querySelector('#exTag').textContent, was: document.querySelector('.fix-was code')?.textContent,
      reloaded: loadState(localStorage.getItem('linux-master-proto')).slips.length,
    };
  });
  expect(r.slips).toEqual(expect.arrayContaining([[expect.stringMatching(/^u2-L1\./), 'cat logs/app.log', 'cmd:head'], ['bank:0', 'cat notes.txt', 'cmd:head']]));
  expect(r.slips.length, 'one slip per exercise').toBe(2);
  expect(r.concepts).toEqual(['cmd:head']);
  expect(r.fixes.sort()).toEqual(['cat logs/app.log', 'cat notes.txt']);
  expect(r.firstTyped, 'fixing comes first among the typing').toBe(true);
  expect(r.original, 'the task is not asked twice in one stage').toBe(false);
  expect(r.size, 'the bank and the made exercises fill an early stage').toBeGreaterThanOrEqual(8);
  expect(r.tag).toBe('מצאו את הטעות');
  expect(['cat logs/app.log', 'cat notes.txt']).toContain(r.was);
  expect(r.reloaded).toBe(2);
});

test('a task and the exercises made from it count once toward mastery, and slips survive a sync and a corrupt save', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    S.skill = { 'cmd:head': [4, 0, 2, 0, 0, 0, coachDay(), 0] }; S.confuse = {}; S.slips = [];
    S.review = { key: 'review-1', day: coachDay(), concepts: ['cmd:head'], at: 'L1', variant: 0, done: false, mastered: [] };
    const bank = COACH_BANK[2], made = coachVariants(bank, 'cmd:head', []).find(v => v.type === 'tiles'), fix = { ...bank, uid: `fix:${bank.uid}`, fix: true, was: 'cat logs/app.log' };
    startLesson(S.review.key, [bank, made, fix], { review: true, practice: true });
    L.value = bank.accept[0]; onFootButton(); onFootButton();
    L.value = bank.accept[0]; onFootButton(); onFootButton();
    L.value = bank.accept[0]; onFootButton(); onFootButton();
    const once = { done: S.review.done, mastered: S.review.mastered };
    const a = { slips: [{ uid: 'u1-L0.1', got: 'cat x', c: 'cmd:head', day: 5 }] }, b = { slips: [{ uid: 'u1-L0.1', got: 'tac x', c: 'cmd:head', day: 9 }, { uid: 'u2-L0.3', got: 'ls', c: 'cmd:cp', day: 7 }] };
    return { once, ab: mergeProgress(a, b).slips, ba: mergeProgress(b, a).slips, bad: loadState(JSON.stringify({ slips: [{ uid: 1 }, { uid: 'x', got: 'y', c: 'cmd:z', day: 3 }] })).slips };
  });
  expect(r.once.done).toBe(true);
  expect(r.once.mastered, 'one task typed three ways is still one exercise').toEqual([]);
  expect(r.ab).toEqual([{ uid: 'u2-L0.3', got: 'ls', c: 'cmd:cp', day: 7 }, { uid: 'u1-L0.1', got: 'tac x', c: 'cmd:head', day: 9 }]);
  expect(r.ba).toEqual(r.ab);
  expect(r.bad).toEqual([{ uid: 'x', got: 'y', c: 'cmd:z', day: 3 }]);
});
