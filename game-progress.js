(() => {
  function world(course, done, section, ready, unitNodes) {
    if (!ready) return { ready: false, section, kind: null, completed: 0, total: 0, level: 1, complete: false };
    const units = (Array.isArray(course) ? course : []).filter(unit => unit.section === section && !unit.locked);
    const completedKeys = new Set(Array.isArray(done) ? done : []);
    const lessonKeys = new Set(), examKeys = new Set();
    for (const unit of units) for (const node of unitNodes(unit)) {
      if (typeof node.key !== 'string') continue;
      if (!unit.exam && node.kind === 'lesson') lessonKeys.add(node.key);
      else if (unit.exam && node.kind === 'exam') examKeys.add(node.key);
    }
    const kind = lessonKeys.size ? 'lesson' : examKeys.size ? 'exam' : null;
    const keys = kind === 'exam' ? examKeys : lessonKeys;
    const total = keys.size;
    const completed = [...keys].filter(key => completedKeys.has(key)).length;
    return { ready: true, section, kind, completed, total, level: total ? 1 + Math.floor(completed / total * 4) : 1, complete: total > 0 && completed === total };
  }
  function mission(unit, done, unitNodes) {
    if (!unit || unit.locked || unit.exam) return null;
    const keys = new Set(unitNodes(unit).filter(node => node.kind === 'lesson' && typeof node.key === 'string').map(node => node.key));
    const completedKeys = new Set(Array.isArray(done) ? done : []);
    const completed = [...keys].filter(key => completedKeys.has(key)).length;
    return { completed, total: keys.size, complete: keys.size > 0 && completed === keys.size };
  }
  function mockExams(course, done, ready, unitNodes) {
    if (!ready) return [];
    const completedKeys = new Set(Array.isArray(done) ? done : []);
    return (Array.isArray(course) ? course : []).filter(unit => unit.exam && !unit.locked).flatMap(unit => unitNodes(unit).filter(node => node.kind === 'exam' && typeof node.key === 'string').map(node => ({ unit: unit.unit, section: unit.section, key: node.key, tag: unit.exam.tag, passed: completedKeys.has(node.key) })));
  }
  window.GameProgress = Object.freeze({ world, mission, mockExams });
})();
