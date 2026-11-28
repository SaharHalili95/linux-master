// The coach checks a mastered concept again after 1, 3 and 7 days, and the profile shows what it knows.
const { test, expect } = require('./course-loaded');

const fresh = async page => {
  await page.goto('./');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false })); });
  await page.reload();
  await page.waitForFunction(() => window.courseReady && typeof Shell === 'function' && typeof coachRecheckItems === 'function');
};

test('a concept mastered in a review comes back after 1, 3 and 7 days, then is done, and the review learns it held', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    const d = coachDay(), lesson = (key = 'u2-L1') => { const u = availableCourse().find(x => x.unit === 2); startLesson(key, withFixture(u, u.lessons[1].exercises)); };
    S.done = ['L0', 'L1', 'c1', 'L2', 'L3', 'boss', 'u2-L0']; S.skill = { 'cmd:head': [4, 0, 2, 0, 0, 0, d, 0] }; S.confuse = {}; S.slips = []; S.mistakes = []; S.recheck = {};
    S.review = { key: 'review-1', day: d, concepts: ['cmd:head'], at: 'u2-L1', variant: 0, done: false, mastered: [] }; S.reviewLog = [];
    L = { mastery: { 'cmd:head': new Set(['a', 'b']) }, opts: {} }; finishReview(); L = null;
    const scheduled = { ...S.recheck['cmd:head'] };
    lesson(); const notYet = L.queue.filter(e => e.recheck).length; closeOverlays();
    const steps = [];
    for (let i = 0; i < 3; i++) {
      S.recheck['cmd:head'].due = d; lesson();
      const item = L.queue.find(e => e.recheck);
      L.queue = [item]; next(); L.value = item.accept?.[0]; if (item.type === 'terminal') { const box = document.querySelector('.term.live textarea'); box.value = item.solve[0]; box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }
      const tag = document.querySelector('#exTag').textContent; onFootButton();
      steps.push({ tag, uid: L.ex.uid, kept: item.uid, next: S.recheck['cmd:head'] && { ...S.recheck['cmd:head'] } });
      closeOverlays();
    }
    return { scheduled, d, notYet, steps, held: S.reviewLog.at(-1).held };
  });
  expect(r.scheduled).toEqual({ due: r.d + 1, step: 0 });
  expect(r.notYet, 'not before it is due').toBe(0);
  expect(r.steps[0].tag).toBe('בדיקה חוזרת');
  expect(r.steps[0].uid, 'the exercise keeps its own uid').toBe(r.steps[0].kept);
  expect(r.steps[0].next).toEqual({ due: r.d + 3, step: 1 });
  expect(r.steps[1].next).toEqual({ due: r.d + 7, step: 2 });
  expect(r.steps[2].next, 'after the third check it is done').toBeUndefined();
  expect(r.held).toEqual({ 'cmd:head': true });
});

test('a re-check answered wrong ends the checks, costs no heart, goes into the model, and only regular lessons carry them', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    const d = coachDay(), u = availableCourse().find(x => x.unit === 2);
    S.done = ['L0', 'L1', 'c1', 'L2', 'L3', 'boss', 'u2-L0']; S.skill = { 'cmd:head': [4, 4, 0, 0, 0, 0, d, 2] }; S.mistakes = []; S.lives = 4;
    S.recheck = { 'cmd:head': { due: d, step: 1 }, 'cmd:cat': { due: d - 2, step: 0 }, 'cmd:ls': { due: d, step: 0 } };
    S.reviewLog = [{ key: 'review-1', day: d - 3, concepts: ['cmd:head'], done: true, mastered: ['cmd:head'] }];
    startLesson('u2-L1', withFixture(u, u.lessons[1].exercises));
    const carried = L.queue.filter(e => e.recheck).map(e => e.recheck);
    const head = L.queue.find(e => e.recheck === 'cmd:head');
    closeOverlays();
    S.recheck = { 'cmd:head': { due: d, step: 1 } };
    startLesson('u2-L1', withFixture(u, u.lessons[1].exercises));
    const item = L.queue.find(e => e.recheck); L.queue = [item]; next();
    if (item.type === 'terminal') { const box = document.querySelector('.term.live textarea'); box.value = 'cat logs/app.log'; box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); } else L.value = 'cat notes.txt';
    onFootButton();
    const after = { lives: S.lives, recheck: S.recheck, held: S.reviewLog[0].held, forgot: S.skill['cmd:head'][2] };
    closeOverlays(); S.recheck = { 'cmd:head': { due: d, step: 0 } };
    const elsewhere = [];
    startLesson('practice', allExercises().slice(0, 2), { practice: true }); elsewhere.push(L.queue.some(e => e.recheck)); closeOverlays();
    startSkip(2); elsewhere.push(L.queue.some(e => e.recheck)); closeOverlays();
    return { carried, typed: ['scenario', 'terminal'].includes(head?.type), after, elsewhere };
  });
  expect(r.carried.length, 'at most two a lesson, the most overdue first').toBe(2);
  expect(r.carried[0]).toBe('cmd:cat');
  expect(r.typed, 'a re-check is typed, not picked').toBe(true);
  expect(r.after.lives).toBe(4);
  expect(r.after.recheck).toEqual({});
  expect(r.after.held).toEqual({ 'cmd:head': false });
  expect(r.after.forgot).toBeGreaterThan(0);
  expect(r.elsewhere, 'no re-checks in practice or tests').toEqual([false, false]);
});

test('the profile shows what the coach knows, in words a learner reads, and says so when it knows nothing yet', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(async () => {
    showTab('profile'); await new Promise(x => setTimeout(x, 200));
    const empty = { text: $('coachKnows').innerText, hidden: $('coachKnows').hidden };
    const d = coachDay();
    S.skill = { 'cmd:ls': [6, 6, 0, 0, 0, 0, d, 3], 'cmd:cat': [5, 5, 0, 0, 0, 0, d, 2], 'cmd:head': [4, 0, 2, 0, 0, 0, d, 0], path: [3, 0, 0, 2, 0, 0, d, 0] };
    S.confuse = { 'cat>head': 2 }; S.recheck = { 'cmd:tail': { due: d + 1, step: 0 } };
    S.review = { key: 'review-x', day: d, concepts: ['cmd:head'], at: 'u2-L1', variant: 0, done: false, mastered: [] };
    renderProfile();
    const lists = Object.fromEntries([...$('coachKnows').querySelectorAll('ul')].map(u => [u.className.split(' ').pop(), [...u.querySelectorAll('li')].map(li => li.textContent)]));
    return { empty, lists, text: $('coachKnows').innerText, word: $('coachKnows').querySelector('.knows-word')?.textContent, label: $('coachKnows').getAttribute('aria-labelledby') };
  });
  expect(r.empty.hidden).toBe(false);
  expect(r.empty.text).toContain('המאמן עוד לומד אתכם');
  expect(r.lists.weak).toEqual(['head', 'נתיבים']);
  expect(r.lists.strong).toEqual(['ls', 'cat']);
  expect(r.lists.mix).toEqual(['cat/head']);
  expect(r.lists.checks).toEqual(['tailמחר']);
  expect(r.text).toContain('שלב חיזוק מחכה לכם במסלול');
  expect(r.word, 'a topic is a word, not code').toBe('נתיבים');
  expect(r.label).toBe('coachKnowsTitle');
});

test('re-checks survive a sync and a corrupt save', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    const a = { recheck: { 'cmd:ls': { due: 10, step: 0 }, 'cmd:cp': { due: 12, step: 2 } } }, b = { recheck: { 'cmd:ls': { due: 14, step: 1 } } };
    return { ab: mergeProgress(a, b).recheck, ba: mergeProgress(b, a).recheck, bad: loadState(JSON.stringify({ recheck: { 'cmd:ls': { due: 3, step: 7 }, 'cmd:cp': { due: 'x', step: 0 }, 'cmd:mv': { due: 5, step: 1 } } })).recheck };
  });
  expect(r.ab).toEqual({ 'cmd:ls': { due: 14, step: 1 }, 'cmd:cp': { due: 12, step: 2 } });
  expect(r.ba).toEqual(r.ab);
  expect(r.bad).toEqual({ 'cmd:mv': { due: 5, step: 1 } });
});
