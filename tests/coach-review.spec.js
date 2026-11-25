// The coach's review stage: simulated learners, each with one habit, and what the coach makes of them.
const { test, expect } = require('./course-loaded');

const fresh = async page => {
  await page.goto('./');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false })); });
  await page.reload();
  await page.waitForFunction(() => window.courseReady && typeof Shell === 'function');
};
// Answers a typed exercise in the app, the way a learner would.
const typed = () => { window.typedAnswer = (accept, value) => { startLesson('x', [{ type: 'scenario', prompt: 'x', accept: [accept], rec: true, fx: homeFixture, unitNo: 2 }]); L.value = value; onFootButton(); }; };

test('simulated learners: the coach finds each habit, and leaves a careful learner alone', async ({ page }) => {
  await fresh(page);
  await page.evaluate(typed);
  const learners = await page.evaluate(() => {
    const run = answers => { S.skill = {}; S.confuse = {}; S.review = null; for (const [a, v] of answers) typedAnswer(a, v); return { weak: coachWeak(), focus: coachFocus(), why: coachFocus().map(coachReason) }; };
    return {
      careful: run([['head -n 3 notes.txt', 'head -n 3 notes.txt'], ['ls -a', 'ls -a'], ['wc -l notes.txt', 'wc -l notes.txt'], ['cp notes.txt b', 'cp notes.txt b']]),
      oneSlip: run([['head -n 3 notes.txt', 'cat notes.txt'], ['ls -a', 'ls -a']]),
      typist: run([['head -n 3 notes.txt', 'hed -n 3 notes.txt'], ['grep -i x notes.txt', 'gerp -i x notes.txt'], ['sort notes.txt', 'srot notes.txt']]),
      mixer: run([['head -n 3 notes.txt', 'cat notes.txt'], ['head -n 2 notes.txt', 'cat notes.txt']]),
      optionForgetter: run([['head -n 3 notes.txt', 'head notes.txt'], ['head -n 5 notes.txt', 'head notes.txt']]),
    };
  });
  expect(learners.careful.weak, 'all right first time: nothing to review').toEqual([]);
  expect(learners.oneSlip.weak, 'one mistake is not a pattern').toEqual([]);
  expect(learners.typist.weak, 'typos are slips, not gaps').toEqual([]);
  expect(learners.mixer.focus).toEqual(['cmd:head']);
  expect(learners.mixer.why).toEqual([{ kind: 'mix', a: 'cat', b: 'head' }]);
  expect(learners.optionForgetter.focus).toEqual(['opt:head -n']);
  expect(learners.optionForgetter.why).toEqual([{ kind: 'wrong', c: 'opt:head -n' }]);
});

test('a learner whose commands fail on paths gets one stage on paths, not one per command', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    S.skill = {}; S.confuse = {};
    const run = cmd => { const i = document.querySelector('.term.live textarea'); i.value = cmd; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); };
    const task = (solve, goal, tries) => { startLesson('x', [{ type: 'terminal', prompt: 'x', solve: [solve], goal, fx: homeFixture, unitNo: 2 }]); for (const c of tries) run(c); onFootButton(); };
    const has = p => sh => sh.files.has(`/home/user/${p}`);
    task('cp notes.txt backup.txt', has('backup.txt'), ['cp docs/notes.txt backup.txt', 'cp ../notes.txt backup.txt', 'cp notes.txt backup.txt']);
    task('cat notes.txt', (sh, log) => log.some(l => l.cmd === 'cat notes.txt'), ['cat /notes.txt', 'cat notes.txt']);
    task('mv notes.txt n.txt', has('n.txt'), ['mv docs/x.txt n.txt']);
    return { weak: coachWeak(), focus: coachFocus(), why: coachReason(coachFocus()[0]) };
  });
  expect(r.weak).toContain('path');
  expect(r.focus[0], 'the root cause leads').toBe('path');
  expect(r.focus.filter(c => c.startsWith('cmd:')).length, 'and the commands it explains are not reviewed one by one').toBeLessThanOrEqual(1);
  expect(r.why).toEqual({ kind: 'path' });
});

test('a review stage appears on the path before the next stage, never blocks it, and comes at most once a day', async ({ page }) => {
  await fresh(page);
  await page.evaluate(typed);
  const r = await page.evaluate(() => {
    S.done = ['L0', 'L1', 'c1', 'L2', 'L3', 'boss', 'u2-L0']; S.skill = {}; S.confuse = {}; S.review = null; S.reviewLog = [];
    typedAnswer('head -n 3 notes.txt', 'cat notes.txt'); typedAnswer('head -n 3 notes.txt', 'cat notes.txt');
    closeOverlays();
    const first = planReview(), again = planReview();
    renderPath();
    const row = document.querySelector('.review-row'), next = row?.nextElementSibling?.querySelector('.node');
    const today = coachDay(); S.review.done = true; const sameDay = planReview();
    S.review.day = today - 1; const nextDay = planReview();
    return { first: first && { concepts: first.concepts, at: first.at }, again, sameDay, nextDay: nextDay?.concepts, current: next?.className, review: row?.querySelector('.node')?.className };
  });
  expect(r.first).toEqual({ concepts: ['cmd:head'], at: 'u2-L1' });
  expect(r.again, 'one open stage at a time').toBeNull();
  expect(r.review).toContain('review');
  expect(r.current, 'the next stage stays open: the review is a detour, not a gate').toContain('current');
  expect(r.sameDay, 'at most one a day').toBeNull();
  expect(r.nextDay).toEqual(['cmd:head']);
});

test('the review lesson recaps, contrasts, then works from recognising to typing, avoiding the exercises already failed', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    S.done = ['L0', 'L1', 'c1', 'L2', 'L3', 'boss', 'u2-L0', 'u2-L1']; S.confuse = { 'cat>head': 2 };
    const { pool, teach } = reviewPool(), mine = pool.filter(e => coachConcepts(e).focus.includes('cmd:head'));
    const failed = new Set(mine.filter(e => ['scenario', 'terminal'].includes(e.type)).slice(0, 1).map(e => e.uid));
    const items = coachBuild(['cmd:head'], { pool, teach, failed, variant: 0, rand: () => 0.5 });
    const typedOnes = items.filter(e => ['scenario', 'terminal'].includes(e.type));
    const order = items.map(e => e.type === 'teach' ? 0 : ['choice', 'sentence', 'match', 'output'].includes(e.type) ? 1 : ['fill', 'tiles'].includes(e.type) ? 2 : 3);
    const later = coachBuild(['cmd:head'], { pool, teach, failed, variant: 2, rand: () => 0.5 });
    return { first: items[0].cmd, contrast: items[1].contrast, units: [...new Set(items.filter(e => e.unitNo).map(e => e.unitNo))], order, failedFirst: typedOnes.findIndex(e => failed.has(e.uid)), typedCount: typedOnes.length, typedLater: later.filter(e => ['scenario', 'terminal'].includes(e.type)).length, size: items.filter(e => e.type !== 'teach').length };
  });
  expect(r.first).toBe('head');
  expect(r.contrast, 'the hand-written card for the mix-up').toBe(true);
  expect(r.units.every(u => u <= 2), 'only units the learner reached').toBe(true);
  expect(r.order).toEqual([...r.order].sort((a, b) => a - b));
  expect(r.failedFirst === -1 || r.failedFirst === r.typedCount - 1, 'an exercise already failed comes last, if at all').toBe(true);
  expect(r.typedLater, 'a concept that came back gets more typing').toBeGreaterThanOrEqual(r.typedCount);
  expect(r.size).toBeGreaterThanOrEqual(4);
  expect(r.size).toBeLessThanOrEqual(12);
});

test('a concept typed right without help in two different exercises is mastered, costs no hearts, and the stage remembers it', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    S.skill = { 'cmd:head': [4, 0, 2, 0, 0, 0, coachDay(), 0], 'opt:head -n': [4, 0, 0, 2, 0, 0, coachDay(), 0] }; S.confuse = { 'cat>head': 2 }; S.lives = 3;
    S.review = { key: 'review-1', day: coachDay(), concepts: ['cmd:head', 'opt:head -n'], at: 'L1', variant: 0, done: false, mastered: [] };
    const a = { type: 'scenario', prompt: 'x', accept: ['head -n 3 notes.txt'], rec: true, fx: homeFixture, unitNo: 2 }, b = { ...a, accept: ['head -n 2 notes.txt'] };
    startLesson(S.review.key, [a, b, { ...a, accept: ['cat notes.txt'] }], { review: true, practice: true });
    L.value = 'head -n 3 notes.txt'; onFootButton(); onFootButton();
    L.value = 'head -n 2 notes.txt'; onFootButton(); onFootButton();
    L.value = 'tac notes.txt'; onFootButton(); const lives = S.lives; onFootButton();
    for (let i = 0; i < 10 && L && $('end').hidden; i++) { L.value = L.ex.accept?.[0] || ''; onFootButton(); onFootButton(); }
    return { lives, review: S.review, log: S.reviewLog, skill: S.skill['cmd:head'], confuse: S.confuse, end: document.querySelector('#endQuests').textContent, reloaded: loadState(localStorage.getItem('linux-master-proto')).review };
  });
  expect(r.lives, 'a wrong answer in a review costs no heart').toBe(3);
  expect(r.review.done).toBe(true);
  expect(r.review.mastered.sort()).toEqual(['cmd:head', 'opt:head -n']);
  expect(r.skill.slice(2, 6), 'its misses are cleared, so the coach starts again from what the learner can do now').toEqual([0, 0, 0, 0]);
  expect(r.confuse).toEqual({});
  expect(r.end).toContain('חיזקתם');
  expect(r.log.at(-1).mastered.sort()).toEqual(['cmd:head', 'opt:head -n']);
  expect(r.reloaded).toEqual(r.review);
});

test('a review stage and its history survive a sync and a corrupt save', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    const a = { review: { key: 'review-10', day: 10, concepts: ['cmd:ls'], at: 'L1', variant: 0, done: true, mastered: ['cmd:ls'] }, reviewLog: [{ key: 'review-10', day: 10, concepts: ['cmd:ls'], done: true, mastered: ['cmd:ls'] }] };
    const b = { review: { key: 'review-12', day: 12, concepts: ['cmd:cp'], at: 'L2', variant: 1, done: false, mastered: [] }, reviewLog: [] };
    return { ab: mergeProgress(a, b), ba: mergeProgress(b, a), bad: loadState(JSON.stringify({ review: { key: 1 }, reviewLog: [{ nope: true }] })) };
  });
  expect(r.ab.review.key).toBe('review-12');
  expect(r.ab.reviewLog.map(x => x.key)).toEqual(['review-10']);
  expect(r.ba).toEqual(r.ab);
  expect(r.bad.review).toBeNull();
  expect(r.bad.reviewLog).toEqual([]);
});
