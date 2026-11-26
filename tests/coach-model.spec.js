// The coach's knowledge model: what each exercise practises, and what each answer shows about the learner.
const { test, expect } = require('./course-loaded');
const fs = require('fs');
const path = require('path');

const fresh = async page => {
  await page.goto('./');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('linux-master-proto', JSON.stringify({ sound: false })); });
  await page.reload();
  await page.waitForFunction(() => window.courseReady && typeof Shell === 'function' && typeof coachExtras === 'function' && typeof RECORDED === 'object');
};
const everyExercise = () => COURSE.filter(u => u.lessons).flatMap(u => withFixture(u, [...u.lessons.flatMap(l => l.exercises), ...(u.boss?.exercises || [])]));

test('a command line is read into the concepts it practises', async ({ page }) => {
  await fresh(page);
  const lines = {
    'ls -la /etc': ['cmd:ls', 'opt:ls -l', 'opt:ls -a'],
    'head -n 3 logs/app.log': ['cmd:head', 'opt:head -n'],
    'head -5 x': ['cmd:head', 'opt:head -N'],
    'grep -E "ap+le" words.txt | sort -r > out.txt': ['cmd:grep', 'opt:grep -E', 'op:|', 'cmd:sort', 'opt:sort -r', 'op:>'],
    'find . -name "*.txt" -type f': ['cmd:find', 'opt:find -name', 'opt:find -type'],
    'sudo systemctl enable --now nginx': ['cmd:sudo', 'cmd:systemctl', 'cmd:systemctl enable', 'opt:systemctl enable --now'],
    '[ -f todo.txt ] && echo exists || echo missing': ['cmd:[', 'opt:[ -f', 'op:&&', 'cmd:echo', 'op:||'],
    'for f in *.txt; do wc -l $f; done': ['cmd:for', 'glob:*', 'op:;', 'cmd:wc', 'opt:wc -l', 'var'],
    'echo $(date) >> log': ['cmd:echo', 'sub', 'cmd:date', 'op:>>'],
    'cut -d, -f2 people.csv': ['cmd:cut', 'opt:cut -d', 'opt:cut -f'],
    'grep "-v" notes.txt': ['cmd:grep'],
    ':wq': ['key:wq'],
    '5dd': ['key:dd'],
    'UUID=1234-abcd /mnt/backup ext4 defaults 0 2': [],
    './backup.sh': ['cmd:./script'],
  };
  const read = await page.evaluate(lines => Object.fromEntries(Object.keys(lines).map(l => [l, coachConceptsOfLine(l)])), lines);
  for (const [line, want] of Object.entries(lines)) expect(read[line].sort(), line).toEqual([...want].sort());
});

test('every exercise in the course is tagged, nearly all with a concept more precise than its unit', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(everyExercise => {
    const all = eval(`(${everyExercise})`)();
    const tags = all.map(ex => coachConcepts(ex).all);
    const concepts = new Set(tags.flat());
    return {
      total: all.length, untagged: tags.filter(c => !c.length).length, precise: tags.filter(c => c.some(x => !x.startsWith('unit:'))).length,
      terminalVague: all.filter((ex, i) => ['terminal', 'scenario', 'tiles', 'match', 'teach', 'sentence'].includes(ex.type) && tags[i].every(x => x.startsWith('unit:'))).length,
      contrast: CONTRAST.map(card => { const [a, b] = contrastConcepts(card); return { card: `${card.a} / ${card.b}`, a, b, known: concepts.has(a) && concepts.has(b) }; }),
      fillFocus: coachConcepts({ type: 'fill', before: 'sed ', answer: '-i.bak', after: " 's/8080/9090/' config.ini" }).focus,
      sentence: coachConcepts({ type: 'sentence', text: { he: 'כדי לבדוק ב־[ ] ששני מספרים שווים כותבים ___.' }, answer: '-eq' }).focus,
      alias: coachConcepts({ type: 'terminal', solve: ['alias up="cd .."', 'cd docs', 'up'] }).all,
      own: coachConcepts({ type: 'choice', plain: true, options: [], concepts: ['path'] }).all,
    };
  }, everyExercise.toString());
  expect(r.untagged).toBe(0);
  expect(r.precise / r.total).toBeGreaterThan(0.97);
  expect(r.terminalVague, 'typed exercises and matches always name what they practise').toBeLessThanOrEqual(4);
  for (const c of r.contrast) { expect(c.known, `${c.card} names concepts the course uses`).toBe(true); expect(c.a).not.toBe(c.b); }
  expect(r.fillFocus, 'a fill-in practises the part the learner supplies').toEqual(['opt:sed -i']);
  expect(r.sentence).toEqual(['opt:[ -eq']);
  expect(r.alias).toEqual(expect.arrayContaining(['cmd:alias', 'cmd:cd']));
  expect(r.alias).not.toContain('cmd:up');
  expect(r.own).toEqual(['path']);
});

test('each answer tells the model what was forgotten, what was wrong, what was a typo and which commands were mixed up', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    const scen = { type: 'scenario', prompt: 'x', accept: ['head -n 3 notes.txt'], rec: true, fx: homeFixture, unitNo: 3 };
    const typed = v => { startLesson('x', [scen]); L.value = v; onFootButton(); };
    S.skill = {}; S.confuse = {};
    typed('cat notes.txt'); const afterOther = structuredClone(S.skill);
    typed('head notes.txt'); const afterParts = structuredClone(S.skill);
    typed('hed -n 3 notes.txt'); const afterTypo = structuredClone(S.skill);
    typed('head -n 3 notes.txt'); typed('head -n 3 notes.txt'); const afterRight = structuredClone(S.skill);
    startLesson('x', [{ type: 'sentence', prompt: 'x', text: 'בודקים מקום פנוי עם ___.', answer: 'df', options: ['df', 'du'], unitNo: 5 }]); L.value = 'du'; onFootButton();
    startLesson('x', [{ type: 'choice', prompt: 'x', answer: 'tail -n 5 log', options: ['tail -n 5 log', 'head -n 5 log'], unitNo: 5 }]); L.value = 'head -n 5 log'; onFootButton();
    return { afterOther, afterParts, afterTypo, afterRight, skill: S.skill, confuse: S.confuse, saved: JSON.parse(localStorage.getItem('linux-master-proto')).skill };
  });
  const [seen, right, forgot, wrong, typo, , , box] = [0, 1, 2, 3, 4, 5, 6, 7];
  expect(r.afterOther['cmd:head'][forgot], 'cat where head was needed: head was forgotten').toBe(1);
  expect(r.afterOther['opt:head -n'][forgot], 'the option is not blamed for the wrong command').toBe(0);
  expect(r.afterParts['opt:head -n'][wrong], 'head without -n 3: the option was missed').toBe(1);
  expect(r.afterParts['cmd:head'][wrong]).toBe(0);
  expect(r.afterTypo['cmd:head'][typo]).toBe(1);
  expect(r.afterTypo['opt:head -n'][typo]).toBe(0);
  expect(r.afterRight['cmd:head'][right]).toBe(2);
  expect(r.afterRight['cmd:head'][box], 'typing it right without help twice climbs two boxes').toBe(2);
  expect(r.afterRight['cmd:head'][seen]).toBe(5);
  expect(r.confuse).toEqual({ 'cat>head': 1, 'du>df': 1, 'head>tail': 1 });
  expect(r.skill['cmd:df'][forgot]).toBe(1);
  expect(r.skill['cmd:tail'][forgot]).toBe(1);
  expect(r.saved, 'the model is saved with the rest of the progress').toEqual(r.skill);
});

test('a hint or a struggle in the terminal counts as help, and terminal errors point at the root cause', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(async () => {
    S.skill = {}; S.confuse = {};
    const ex = withFixture(UNIT_3, UNIT_3.boss.exercises).find(e => e.solve?.[0] === 'rm photos/*.jpg');
    const run = cmd => { const i = document.querySelector('.term.live textarea'); i.value = cmd; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); };
    startLesson('x', [ex]); document.querySelector('.hint-link').click(); run('rm photos/*.jpg'); onFootButton();
    const hinted = structuredClone(S.skill);
    S.skill = {};
    startLesson('x', [ex]); run('rm pics/*.jpg'); run('rm *.jpg'); run('rm photos/*.jpg'); onFootButton();
    return { hinted, struggled: S.skill };
  });
  expect(r.hinted['cmd:rm'][5], 'a hint marks the answer as helped').toBe(1);
  expect(r.hinted['cmd:rm'][7], 'a helped answer does not climb a box').toBe(0);
  expect(r.struggled['cmd:rm'][5], 'two errors before the right command count as help').toBe(1);
  expect(r.struggled.path[0], 'No such file points at paths, the real gap').toBe(1);
  expect(r.struggled.path[3]).toBe(1);
});

test('tests feed the model too, and a saved or synced model stays valid', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    S.skill = {};
    startSkip(2);
    answer(false, '');
    const fromExam = Object.keys(S.skill).length;
    const loaded = loadState(JSON.stringify({ skill: { 'cmd:ls': [3, 2, 1, 0, 0, 0, 20000, 9], bad: [1, 2], 'cmd:x': [-1, 0, 0, 0, 0, 0, 0, 0] }, confuse: { 'cat>head': 2, nope: 3, 'a>b': -1 } }));
    const a = { skill: { 'cmd:ls': [5, 4, 1, 0, 0, 0, 20000, 2], 'cmd:cp': [1, 1, 0, 0, 0, 0, 20001, 1] }, confuse: { 'cat>head': 1 } };
    const b = { skill: { 'cmd:ls': [3, 3, 0, 0, 0, 0, 20009, 3], 'cmd:mv': [2, 0, 2, 0, 0, 0, 20002, 0] }, confuse: { 'cat>head': 4, 'cp>mv': 1 } };
    return { fromExam, loaded: { skill: loaded.skill, confuse: loaded.confuse }, ab: mergeProgress(a, b), ba: mergeProgress(b, a) };
  });
  expect(r.fromExam, 'a wrong answer in a jump test is recorded').toBeGreaterThan(0);
  expect(r.loaded.skill).toEqual({ 'cmd:ls': [3, 2, 1, 0, 0, 0, 20000, 4] });
  expect(r.loaded.confuse).toEqual({ 'cat>head': 2 });
  expect(r.ab.skill).toEqual({ 'cmd:ls': [5, 4, 1, 0, 0, 0, 20000, 2], 'cmd:cp': [1, 1, 0, 0, 0, 0, 20001, 1], 'cmd:mv': [2, 0, 2, 0, 0, 0, 20002, 0] });
  expect(r.ab.confuse).toEqual({ 'cat>head': 4, 'cp>mv': 1 });
  expect(r.ba).toEqual(r.ab);
});

// Writes materials/coach-concepts.md: what the model tags, and where it still falls back to the unit.
test('the concept coverage report is up to date', async ({ page }) => {
  await fresh(page);
  const report = await page.evaluate(everyExercise => {
    const all = eval(`(${everyExercise})`)();
    const tags = all.map(ex => ({ ex, c: coachConcepts(ex).all }));
    const count = {}; for (const { c } of tags) for (const x of c) count[x] = (count[x] || 0) + 1;
    const teach = new Set(all.filter(e => e.type === 'teach').flatMap(e => coachConcepts(e).all).map(c => c.startsWith('cmd:') ? c.split(' ')[0] : c));
    const typedCmds = [...new Set(all.filter(e => ['terminal', 'scenario', 'tiles'].includes(e.type)).flatMap(e => coachConcepts(e).all).filter(c => c.startsWith('cmd:')).map(c => c.split(' ')[0]))].sort();
    const vague = tags.filter(({ c }) => c.every(x => x.startsWith('unit:')));
    const kinds = {}; for (const k of Object.keys(count)) { const kind = k.split(/[: ]/)[0]; kinds[kind] = (kinds[kind] || 0) + 1; }
    const text = s => String(tr(s) || '').replace(/[‎‏]/g, '').replace(/\|/g, '\\|').slice(0, 90);
    return [
      '# Coach concepts', '', 'Generated by `tests/coach-model.spec.js`. Do not edit by hand.', '',
      `- Exercises: ${all.length}`, `- Tagged more precisely than their unit: ${all.length - vague.length} (${(100 - vague.length / all.length * 100).toFixed(1)}%)`,
      `- Concepts: ${Object.keys(count).length} (${Object.entries(kinds).sort().map(([k, n]) => `${k} ${n}`).join(', ')})`, '',
      '## Typed commands with no teach card', '', 'The learner has to type these, but no teach card introduces them.', '',
      ...typedCmds.filter(c => !teach.has(c)).map(c => `- \`${c.slice(4)}\``), '',
      '## Exercises tagged only by their unit', '', 'Add `concepts: [...]` to one of these to tag it by hand.', '',
      '| Unit | Type | Prompt |', '| --- | --- | --- |',
      ...vague.map(({ ex }) => `| ${ex.unitNo} | ${ex.type} | ${text(ex.prompt) || text(ex.text)} |`), '',
    ].join('\n');
  }, everyExercise.toString());
  const file = path.join(__dirname, '..', 'materials', 'coach-concepts.md');
  if (process.env.UPDATE_REPORT) fs.writeFileSync(file, report);
  expect(fs.readFileSync(file, 'utf8'), 'run with UPDATE_REPORT=1 to refresh materials/coach-concepts.md').toBe(report);
});
