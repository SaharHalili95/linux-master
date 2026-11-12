const { test, expect } = require('@playwright/test');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function load(progress = true) {
  const context = { window: {} };
  if (progress) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../prototype/game-progress.js'), 'utf8'), context);
  const filename = path.join(__dirname, '../prototype/world-expeditions.js');
  if (fs.existsSync(filename)) vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context);
  return context.window.WorldExpeditions;
}
const fixture = () => ({ '/home/user': {} });
const exercises = [
  { type: 'teach', text: { en: 'Read files', he: 'קריאת קבצים' } },
  { type: 'choice', prompt: { en: 'Choose', he: 'בחרו' }, answer: 'cat', options: ['cat', 'cd'] },
  { type: 'terminal', solve: ['pwd'], goal: () => true },
  { type: 'match', pairs: [['cat', 'read'], ['ls', 'list']] },
  { type: 'fill', before: 'c', answer: 'd', after: '' },
  { type: 'scenario', accept: ['ls'] }
];
function makeCourse() {
  return [
    { unit: 1, section: 1, fixture, lessons: [{ exercises }, { exercises }, { exercises }, { exercises }] },
    { unit: 2, section: 1, fixture, lessons: [{ exercises }, { exercises }, { exercises }, { exercises }] },
    { unit: 3, section: 2, fixture, lessons: [{ exercises }] },
    { unit: 4, section: 1, locked: true, fixture, lessons: [{ exercises }] },
    { unit: 78, section: 11, exam: { tag: 'L' }, lessons: [{ exercises }] }
  ];
}
function nodes(unit) {
  if (unit.exam) return [{ kind: 'exam', key: 'u78-exam' }];
  const prefix = unit.unit === 1 ? '' : 'u' + unit.unit + '-';
  return [...unit.lessons.map((_, i) => ({ kind: 'lesson', key: prefix + 'L' + i, i })), { kind: 'boss', key: prefix + 'boss' }, { kind: 'chest', key: prefix + 'c1' }];
}
const withFixture = (unit, list) => list.map(ex => ({ ...ex, fx: unit.fixture }));

test('world metadata is immutable and covers learning worlds with both languages', () => {
  const model = load();
  expect(model).toBeDefined();
  expect(model.worlds.map(world => world.section)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect(Object.isFrozen(model.worlds)).toBe(true);
  for (const world of model.worlds) {
    expect(Object.isFrozen(world)).toBe(true);
    for (const field of ['title', 'brief', 'gearName']) {
      expect(world[field]).toEqual({ he: expect.any(String), en: expect.any(String) });
      expect(Object.isFrozen(world[field])).toBe(true);
    }
  }
});

test('pool only uses completed lessons in the selected unlocked learning world', () => {
  const model = load();
  expect(model).toBeDefined();
  const course = makeCourse();
  const pool = model.pool(course, ['L0', 'u3-L0', 'u4-L0', 'u78-exam', 'boss', 'c1'], 1, nodes, withFixture);
  expect(pool.map(ex => ex.uid)).toEqual(['L0.1', 'L0.2', 'L0.3', 'L0.4', 'L0.5']);
  expect(model.pool(course, ['u78-exam'], 11, nodes, withFixture)).toEqual([]);
  expect(model.pool(course, [], 1, nodes, withFixture)).toEqual([]);
});

test('pool preserves canonical indexes, fixture functions and exercise content without changing course data', () => {
  const model = load();
  expect(model).toBeDefined();
  const course = makeCourse(), before = JSON.stringify(course);
  const pool = model.pool(course, ['u2-L1'], 1, nodes, withFixture);
  expect(pool.map(ex => ex.uid)).toEqual(['u2-L1.1', 'u2-L1.2', 'u2-L1.3', 'u2-L1.4', 'u2-L1.5']);
  expect(pool[0]).toEqual({ ...exercises[1], fx: fixture, uid: 'u2-L1.1' });
  expect(pool[0]).not.toBe(exercises[1]);
  expect(pool[1].goal).toBe(exercises[2].goal);
  expect(pool[1].fx).toBe(fixture);
  expect(JSON.stringify(course)).toBe(before);
});

test('duplicate units, lesson nodes and completion keys cannot repeat a canonical exercise', () => {
  const model = load();
  expect(model).toBeDefined();
  const course = makeCourse();
  expect(model.pool([course[0], course[0]], ['L0', 'L0'], 1, unit => [...nodes(unit), ...nodes(unit)], withFixture).map(ex => ex.uid))
    .toEqual(['L0.1', 'L0.2', 'L0.3', 'L0.4', 'L0.5']);
});

test('partial course readiness blocks both modes and equipment', () => {
  const model = load();
  expect(model).toBeDefined();
  const course = [makeCourse()[0]], done = ['L0', 'L1', 'L2', 'L3'];
  for (const ready of [false, undefined, null, 'true']) {
    expect(model.prepare(course, done, 1, 'explore', ready, nodes, withFixture)).toBeNull();
    expect(model.prepare(course, done, 1, 'streak', ready, nodes, withFixture)).toBeNull();
    expect(model.unlockedGear(course, done, ready, nodes)).toEqual([]);
  }
});

test('explore draws three distinct completed exercises and leaves the source untouched', () => {
  const model = load();
  expect(model).toBeDefined();
  const course = makeCourse(), done = ['L0'], before = JSON.stringify(course);
  const run = model.prepare(course, done, 1, 'explore', true, nodes, withFixture, () => 0);
  expect(run).toMatchObject({ section: 1, mode: 'explore', count: 3 });
  expect(run.exercises).toHaveLength(3);
  expect(new Set(run.exercises.map(ex => ex.uid)).size).toBe(3);
  expect(run.exercises.every(ex => /^L0\.[1-5]$/.test(ex.uid))).toBe(true);
  expect(JSON.stringify(course)).toBe(before);
  expect(done).toEqual(['L0']);
});

test('streak and equipment unlock at world level two, not from unrelated completion keys', () => {
  const model = load();
  expect(model).toBeDefined();
  const course = makeCourse();
  expect(model.prepare(course, ['L0', 'u3-L0', 'boss'], 1, 'streak', true, nodes, withFixture)).toBeNull();
  expect(model.unlockedGear(course, ['L0', 'u4-L0', 'boss'], true, nodes)).toEqual([]);
  const done = ['L0', 'L1'];
  const run = model.prepare(course, done, 1, 'streak', true, nodes, withFixture, () => 0.99);
  expect(run).toMatchObject({ section: 1, mode: 'streak', count: 5 });
  expect(new Set(run.exercises.map(ex => ex.uid)).size).toBe(5);
  expect(model.unlockedGear(course, done, true, nodes).map(world => world.section)).toEqual([1]);
});

test('insufficient pools and invalid modes or world identifiers do not start runs', () => {
  const model = load();
  expect(model).toBeDefined();
  const course = [{ unit: 1, section: 1, fixture, lessons: [{ exercises: exercises.slice(0, 3) }] }];
  expect(model.prepare(course, ['L0'], 1, 'explore', true, nodes, withFixture)).toBeNull();
  course[0].lessons[0].exercises = exercises.slice(0, 5);
  expect(model.prepare(course, ['L0'], 1, 'streak', true, nodes, withFixture)).toBeNull();
  for (const mode of ['unknown', 'toString', '', undefined]) {
    expect(model.prepare(makeCourse(), ['L0', 'L1'], 1, mode, true, nodes, withFixture)).toBeNull();
  }
  for (const section of [0, 11, '1', 1.5, null]) {
    expect(model.prepare(makeCourse(), ['L0', 'L1'], section, 'explore', true, nodes, withFixture)).toBeNull();
  }
});

test('malformed inputs and unavailable optional progression remain safe and grant nothing', () => {
  const model = load();
  expect(model).toBeDefined();
  expect(model.pool(null, null, 1, nodes, withFixture)).toEqual([]);
  expect(model.pool([null, {}, { section: 1, unit: 1, lessons: null }], ['L0'], 1, nodes, withFixture)).toEqual([]);
  expect(model.pool(makeCourse(), ['L0'], 1, null, withFixture)).toEqual([]);
  expect(model.pool(makeCourse(), ['L0'], 1, nodes, null)).toEqual([]);
  expect(model.pool(makeCourse(), ['L0'], 1, () => null, withFixture)).toEqual([]);
  expect(model.unlockedGear(null, ['L0'], true, nodes)).toEqual([]);
  expect(model.unlockedGear([null, {}], ['L0'], true, nodes)).toEqual([]);
  expect(model.unlockedGear(makeCourse(), ['L0', 'L1'], true, null)).toEqual([]);
  const optional = load(false);
  expect(optional.prepare(makeCourse(), ['L0'], 1, 'explore', true, nodes, withFixture)).toBeNull();
  expect(optional.unlockedGear(makeCourse(), ['L0', 'L1'], true, nodes)).toEqual([]);
});

test('invalid exercise entries are ignored without shifting canonical indexes', () => {
  const model = load();
  expect(model).toBeDefined();
  const course = [{ unit: 1, section: 1, fixture, lessons: [{ exercises: [null, {}, { type: 'unknown' }, exercises[1]] }] }];
  expect(model.pool(course, ['L0'], 1, nodes, withFixture).map(ex => ex.uid)).toEqual(['L0.3']);
});

test('damaged course lessons cannot shrink the level denominator or award equipment', () => {
  const model = load();
  const course = makeCourse();
  course[0].lessons[1] = null;
  const fixedNodes = unit => unit.exam ? [] : [
    { kind: 'lesson', key: unit.unit === 1 ? 'L0' : 'u' + unit.unit + '-L0', i: 0 },
    { kind: 'lesson', key: unit.unit === 1 ? 'L1' : 'u' + unit.unit + '-L1', i: 1 }
  ];
  expect(model.unlockedGear(course, ['L0'], true, fixedNodes)).toEqual([]);
  expect(model.prepare(course, ['L0'], 1, 'explore', true, fixedNodes, withFixture)).toBeNull();
  course[0].lessons[1] = { exercises };
  course[1].lessons = null;
  expect(model.unlockedGear(course, ['L0', 'L1'], true, fixedNodes)).toEqual([]);
});
