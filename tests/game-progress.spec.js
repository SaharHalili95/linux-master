const { test, expect } = require('@playwright/test');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function load() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../prototype/game-progress.js'), 'utf8'), context);
  return context.window.GameProgress;
}
const course = [
  { unit: 1, section: 1 }, { unit: 2, section: 1 }, { unit: 3, section: 2 },
  { unit: 4, section: 1, locked: true },
  { unit: 78, section: 11, exam: { tag: 'L' } }, { unit: 79, section: 11, exam: { tag: 'R' } }
];
function nodes(unit) {
  if (unit.exam) return [{ kind: 'exam', key: `u${unit.unit}-exam` }];
  const prefix = unit.unit === 1 ? '' : `u${unit.unit}-`;
  return ['L0', 'L1', 'c1', 'L2', 'L3', 'boss'].map(id => ({ kind: id.startsWith('L') ? 'lesson' : id === 'c1' ? 'chest' : 'boss', key: prefix + id }));
}

test('progress is unavailable until the complete course has loaded', () => {
  const progress = load();
  expect(progress.world(course, ['L0'], 1, false, nodes)).toMatchObject({ ready: false, completed: 0, total: 0, level: 1, complete: false });
  expect(progress.mockExams(course, ['u78-exam'], false, nodes)).toHaveLength(0);
});

test('world levels count unique completed lessons, not chests or bosses', () => {
  const progress = load();
  const completed = ['L0', 'L0', 'L1', 'c1', 'boss', 'u2-L0', 'u2-L1', 'u3-L0', 'u4-L0'];
  expect(progress.world(course, completed, 1, true, nodes)).toMatchObject({ ready: true, section: 1, kind: 'lesson', completed: 4, total: 8, level: 3, complete: false });
  expect(progress.world(course, [...completed, 'L2', 'L3', 'u2-L2', 'u2-L3'], 1, true, nodes)).toMatchObject({ completed: 8, total: 8, level: 5, complete: true });
  expect(completed).toEqual(['L0', 'L0', 'L1', 'c1', 'boss', 'u2-L0', 'u2-L1', 'u3-L0', 'u4-L0']);
});

test('worlds without learning units do not award completion', () => {
  const progress = load();
  expect(progress.world(course, [], 99, true, nodes)).toMatchObject({ ready: true, completed: 0, total: 0, level: 1, complete: false });
  expect(progress.world(course, ['u78-exam'], 11, true, nodes)).toMatchObject({ ready: true, kind: 'exam', completed: 1, total: 2, level: 3, complete: false });
  expect(progress.world(course, ['u78-exam', 'u79-exam'], 11, true, nodes)).toMatchObject({ ready: true, kind: 'exam', completed: 2, total: 2, level: 5, complete: true });
});

test('mock exam badges represent only saved practice exam passes', () => {
  const progress = load();
  const exams = progress.mockExams(course, ['u78-exam', 'u78-exam', 'u99-exam'], true, nodes);
  expect(exams).toHaveLength(2);
  expect(exams).toEqual(expect.arrayContaining([
    expect.objectContaining({ unit: 78, section: 11, tag: 'L', key: 'u78-exam', passed: true }),
    expect.objectContaining({ unit: 79, section: 11, tag: 'R', key: 'u79-exam', passed: false })
  ]));
});

test('exam keys come from unitNodes rather than an assumed naming format', () => {
  const progress = load();
  const customNodes = unit => unit.exam ? [{ kind: 'exam', key: `custom-${unit.unit}` }] : nodes(unit);
  expect(progress.mockExams(course, ['custom-78'], true, customNodes)).toEqual(expect.arrayContaining([expect.objectContaining({ unit: 78, key: 'custom-78', passed: true })]));
  expect(progress.world(course, ['custom-78'], 11, true, customNodes)).toMatchObject({ kind: 'exam', completed: 1, total: 2 });
});

test('mission completion counts unique lesson nodes only and excludes exams', () => {
  const progress = load();
  expect(progress.mission(course[0], ['L0', 'L0', 'c1', 'boss'], nodes)).toMatchObject({ completed: 1, total: 4, complete: false });
  expect(progress.mission(course[0], ['L0', 'L1', 'L2', 'L3'], nodes)).toMatchObject({ completed: 4, total: 4, complete: true });
  expect(progress.mission(course[4], ['u78-exam'], nodes)).toBeNull();
  expect(progress.mission(course[3], [], nodes)).toBeNull();
});
