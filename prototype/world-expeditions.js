(() => {
  const localized = (he, en) => Object.freeze({ he, en });
  const worlds = Object.freeze([
    { section: 1, title: localized('מסלול דרך השער', 'Chart the Gateway'), brief: localized('מצאו דרך בין התיקיות, קראו את הרמזים בקבצים וחברו פקודות כדי לפתוח את השער.', 'Navigate the directories, read the clues in files and connect commands to open the Gateway.'), gearName: localized('מצפן הטרמינל', 'Terminal Compass') },
    { section: 2, title: localized('עקבות בנהר הטקסט', 'Trace the River'), brief: localized('חלצו את המידע הדרוש מתוך זרם הטקסט בעזרת חיפוש, סינון ועיבוד.', 'Recover the information you need from the stream of text with searching, filtering and processing.'), gearName: localized('עדשת הטקסט', 'Text Lens') },
    { section: 3, title: localized('מפתחות לעיר הקבצים', 'Keys to the City'), brief: localized('עקבו אחר קבצים ובעליהם ובדקו את ההרשאות ששומרות על שערי העיר.', 'Track files and their owners, and check the permissions guarding the city gates.'), gearName: localized('מפתח ההרשאות', 'Permission Key') },
    { section: 4, title: localized('משמרת במצודה', 'Citadel Watch'), brief: localized('גלו מה רץ במערכת ועזרו לתהליכים ולשירותים במצודה לפעול בסדר הנכון.', 'Discover what is running and help the citadel processes and services work in the right order.'), gearName: localized('ליבת התהליכים', 'Process Core') },
    { section: 5, title: localized('משלוח לנמל', 'Harbor Delivery'), brief: localized('הכינו את משלוח התוכנה: מצאו חבילות ובדקו כיצד מתקינים ומנהלים אותן.', 'Prepare the software shipment: find packages and review how to install and manage them.'), gearName: localized('תיק החבילות', 'Package Satchel') },
    { section: 6, title: localized('להדליק את הרשת', 'Light the Grid'), brief: localized('עקבו אחר כתובות וחיבורים כדי למצוא איך המידע עובר בין אורות הרשת.', 'Follow addresses and connections to discover how information travels between the lights on the grid.'), gearName: localized('אנטנת הרשת', 'Network Antenna') },
    { section: 7, title: localized('להפעיל את המפעל', 'Start the Works'), brief: localized('הרכיבו משתנים, תנאים ולולאות לתהליך שאפשר להריץ שוב במפעל הסקריפטים.', 'Assemble variables, conditions and loops into a repeatable process at the Script Works.'), gearName: localized('זרוע האוטומציה', 'Automation Arm') },
    { section: 8, title: localized('משמר החומה', 'Guard the Firewall'), brief: localized('בדקו גישה והגנות כדי לעזור לשמור על המערכת שמאחורי החומה.', 'Check access and defenses to help protect the system behind the wall.'), gearName: localized('מגן האבטחה', 'Security Shield') },
    { section: 9, title: localized('משימה בארכיון', 'Archive Retrieval'), brief: localized('אתרו בארכיון את כלי הניהול והידע שיעזרו להשלים את משימת המערכת הבאה.', 'Find the administration tools and knowledge in the Archive that will help with your next system task.'), gearName: localized('מנסרת הארכיון', 'Archive Prism') },
    { section: 10, title: localized('לחקור גבולות חדשים', 'Explore New Frontiers'), brief: localized('נסו את הכלים והנושאים המתקדמים שכבר למדתם ובנו דרך אל האתגר הבא.', 'Put the advanced tools and topics you have learned into practice and chart a route to the next challenge.'), gearName: localized('משואת הסיור', 'Exploration Beacon') }
  ].map(Object.freeze));
  const gradedTypes = new Set(['choice', 'sentence', 'fill', 'output', 'tiles', 'scenario', 'terminal', 'match']);
  const validSection = section => Number.isInteger(section) && section >= 1 && section <= 10;
  const learningUnits = (course, section) => (Array.isArray(course) ? course : []).filter(unit => unit && unit.section === section && !unit.locked && !unit.exam && Array.isArray(unit.lessons));
  function lessonNodes(unit, unitNodes) {
    if (typeof unitNodes !== 'function') return [];
    const nodes = unitNodes(unit);
    return Array.isArray(nodes) ? nodes.filter(node => node && node.kind === 'lesson' && typeof node.key === 'string' && node.key && Number.isInteger(node.i) && Array.isArray(unit.lessons[node.i]?.exercises)) : [];
  }
  function pool(course, done, section, unitNodes, withFixture) {
    if (!validSection(section) || typeof unitNodes !== 'function' || typeof withFixture !== 'function') return [];
    const completed = new Set(Array.isArray(done) ? done : []), seen = new Set(), result = [];
    for (const unit of learningUnits(course, section)) {
      for (const node of lessonNodes(unit, unitNodes)) {
        if (!completed.has(node.key)) continue;
        unit.lessons[node.i].exercises.forEach((exercise, index) => {
          const uid = node.key + '.' + index;
          if (!exercise || !gradedTypes.has(exercise.type) || seen.has(uid)) return;
          const attached = withFixture(unit, [{ ...exercise }]);
          if (!Array.isArray(attached) || !attached[0] || typeof attached[0] !== 'object') return;
          result.push({ ...attached[0], uid });
          seen.add(uid);
        });
      }
    }
    return result;
  }
  function progress(course, done, section, ready, unitNodes) {
    if (ready !== true || !validSection(section) || typeof unitNodes !== 'function' || typeof window.GameProgress?.world !== 'function') return null;
    const units = (Array.isArray(course) ? course : []).filter(unit => unit && unit.section === section && !unit.locked && !unit.exam);
    if (!units.length) return null;
    const byUnit = new Map();
    for (const unit of units) {
      if (!Array.isArray(unit.lessons)) return null;
      const nodes = unitNodes(unit);
      if (!Array.isArray(nodes)) return null;
      const lessons = nodes.filter(node => node?.kind === 'lesson');
      if (!lessons.length || lessons.some(node => typeof node.key !== 'string' || !node.key || !Number.isInteger(node.i) || !Array.isArray(unit.lessons[node.i]?.exercises))) return null;
      byUnit.set(unit, lessons);
    }
    return window.GameProgress.world(units, done, section, true, unit => byUnit.get(unit));
  }
  function prepare(course, done, section, mode, ready, unitNodes, withFixture, random = Math.random) {
    const count = mode === 'explore' ? 3 : mode === 'streak' ? 5 : 0;
    if (!count || typeof random !== 'function') return null;
    const state = progress(course, done, section, ready, unitNodes);
    if (!state || state.kind !== 'lesson' || (mode === 'streak' && state.level < 2)) return null;
    const exercises = pool(course, done, section, unitNodes, withFixture);
    if (exercises.length < count) return null;
    for (let i = 0; i < count; i++) {
      const value = random();
      if (!Number.isFinite(value) || value < 0 || value >= 1) return null;
      const j = i + Math.floor(value * (exercises.length - i));
      [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
    }
    return { section, mode, count, exercises: exercises.slice(0, count) };
  }
  function unlockedGear(course, done, ready, unitNodes) {
    return worlds.filter(world => {
      const state = progress(course, done, world.section, ready, unitNodes);
      return state?.kind === 'lesson' && state.level >= 2;
    });
  }
  window.WorldExpeditions = Object.freeze({ worlds, pool, prepare, unlockedGear });
})();
