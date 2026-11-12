(() => {
  const COPY = {
    en: {
      title: 'World expeditions', world: 'Choose a world', mode: 'Choose a run', explore: 'Explore', streak: 'Streak',
      goal: count => `${count} exercises · First attempts count`,
      level: (level, completed, total) => `World level ${level} · ${completed} / ${total} lessons completed`,
      locked: 'Reach world level 2 to unlock Streak and this world’s equipment.',
      unlocked: 'World equipment and Streak unlocked.', gearOnly: 'World equipment unlocked. Streak needs 5 exercises from completed lessons.',
      needed: count => `Complete lessons in this world to collect at least ${count} exercises.`,
      tasks: count => `${count} exercises`, streakNeed: 'Level 2 · 5 exercises',
      start: 'Start expedition', learn: 'Continue learning',
      record: 'Personal best:', noRecord: 'No completed run yet',
      protection: 'No timer. No lost lives. Revisit familiar lessons and build your personal best.',
      loading: 'Loading the full course…', error: 'Expeditions are unavailable. Refresh the page to try again.',
      gear: 'World equipment', gearHelp: 'Reach level 2 in a world to earn its equipment. Wear one item alongside your rank equipment.',
      none: 'None', noneHelp: 'Keep your rank equipment', earned: 'Earned',
      gearLocked: title => `Reach level 2 in ${title}`, gearLoading: 'Loading equipment…',
      gearError: 'Equipment is unavailable. Your saved choice is kept.'
    },
    he: {
      title: 'מסעות בעולמות', world: 'בחירת עולם', mode: 'בחירת מסע', explore: 'גילוי', streak: 'רצף',
      goal: count => `${count} תרגילים · הניסיון הראשון קובע`,
      level: (level, completed, total) => `רמת עולם ${level} · ${completed} מתוך ${total} שיעורים הושלמו`,
      locked: 'הגיעו לרמה 2 בעולם כדי לפתוח מסע רצף ואת הציוד של העולם.',
      unlocked: 'ציוד העולם ומסע הרצף נפתחו.', gearOnly: 'ציוד העולם נפתח. מסע רצף דורש 5 תרגילים משיעורים שהושלמו.',
      needed: count => `השלימו שיעורים בעולם הזה כדי לצבור לפחות ${count} תרגילים.`,
      tasks: count => `${count} תרגילים`, streakNeed: 'רמה 2 · 5 תרגילים',
      start: 'יציאה למסע', learn: 'המשך למידה',
      record: 'שיא אישי:', noRecord: 'עדיין לא הושלם מסע',
      protection: 'בלי שעון ובלי אובדן חיים. חזרו לשיעורים מוכרים ושפרו את השיא האישי.',
      loading: 'טוענים את הקורס המלא…', error: 'המסעות אינם זמינים. רעננו את הדף כדי לנסות שוב.',
      gear: 'ציוד העולמות', gearHelp: 'הגיעו לרמה 2 בעולם כדי לזכות בציוד שלו. אפשר ללבוש פריט אחד לצד ציוד הדרגה.',
      none: 'ללא', noneHelp: 'ציוד הדרגה בלבד', earned: 'נפתח',
      gearLocked: title => `נדרשת רמה 2 ב${title}`, gearLoading: 'טוענים את הציוד…',
      gearError: 'הציוד אינו זמין. הבחירה השמורה נשמרת.'
    }
  };
  let instance = 0;
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function language(lang) {
    const code = lang === 'he' ? 'he' : 'en';
    return { code, text: (key, ...args) => typeof COPY[code][key] === 'function' ? COPY[code][key](...args) : COPY[code][key], local: value => typeof value === 'string' ? value : value?.[code] || value?.en || '' };
  }
  function replace(container, content) {
    const active = container.contains(document.activeElement) ? document.activeElement.id : '';
    container.replaceChildren(content);
    if (active) [...container.querySelectorAll('[id]')].find(element => element.id === active && !element.disabled)?.focus({ preventScroll: true });
  }
  function decoration(html, className) {
    const wrapper = node('span', className);
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.innerHTML = html;
    return wrapper;
  }
  function renderBoard(container, state, actions) {
    const { code, text, local } = language(state.lang);
    const worlds = state.worlds || [], world = worlds.find(item => item.section === state.section) || worlds[0];
    const section = world?.section, mode = state.mode === 'streak' ? 'streak' : 'explore';
    const count = mode === 'streak' ? 5 : 3, progress = state.progress || { completed: 0, total: 0, level: 1 };
    const available = !!state.ready && !state.error && !!world;
    const enough = state.poolSize >= count, levelOK = mode === 'explore' || progress.level >= 2;
    const board = node('section', 'expedition-board'); board.dir = code === 'he' ? 'rtl' : 'ltr';
    if (state.accent) board.style.setProperty('--expedition-accent', state.accent);
    board.setAttribute('aria-labelledby', 'expeditionTitle');
    const title = node('h2', '', text('title')); title.id = 'expeditionTitle';
    board.append(title);
    const label = node('label', 'expedition-world-label', text('world')); label.htmlFor = 'expeditionWorld';
    const select = node('select', 'expedition-world-select'); select.id = 'expeditionWorld'; select.disabled = !available;
    for (const item of worlds) {
      const option = node('option', '', local(item.worldName || item.title)); option.value = item.section; option.selected = item.section === section; select.append(option);
    }
    select.onchange = () => actions.onChange({ section: Number(select.value), mode });
    board.append(label, select);
    const story = node('div', 'expedition-story');
    if (state.companionHTML) story.append(decoration(state.companionHTML, 'expedition-companion'));
    const brief = node('div', 'expedition-brief'); brief.append(node('h3', '', local(world?.title)), node('p', '', local(world?.brief))); story.append(brief); board.append(story);
    const status = node('div', 'expedition-status'); status.setAttribute('role', 'status');
    if (!available) status.append(node('p', '', text(state.error || !world ? 'error' : 'loading')));
    else {
      status.append(node('p', 'expedition-progress', text('level', progress.level, progress.completed, progress.total)));
      const meter = node('progress'); meter.max = Math.max(1, progress.total); meter.value = progress.completed;
      meter.setAttribute('aria-label', text('level', progress.level, progress.completed, progress.total)); status.append(meter);
      status.append(node('p', 'expedition-unlock', text(progress.level < 2 ? 'locked' : state.poolSize >= 5 ? 'unlocked' : 'gearOnly')));
    }
    board.append(status);
    const modes = node('fieldset', 'expedition-modes'); modes.append(node('legend', '', text('mode')));
    for (const value of ['explore', 'streak']) {
      const choice = node('label', 'expedition-mode');
      const input = node('input'); input.type = 'radio'; input.name = 'expedition-mode'; input.value = value;
      input.id = value === 'explore' ? 'expeditionModeExplore' : 'expeditionModeStreak'; input.checked = value === mode;
      input.disabled = !available || state.poolSize < (value === 'explore' ? 3 : 5) || (value === 'streak' && progress.level < 2);
      input.onchange = () => { if (input.checked) actions.onChange({ section, mode: value }); };
      const detail = node('span'); detail.append(node('strong', '', text(value)), node('small', '', value === 'explore' ? text('tasks', 3) : text('streakNeed')));
      choice.append(input, detail); modes.append(choice);
    }
    board.append(modes);
    const goal = node('p', 'expedition-goal', text('goal', count));
    const best = state.bests?.[`${section}:${mode}`];
    const record = node('p', 'expedition-record');
    if (Number.isInteger(best) && best >= 0 && best <= count) {
      const score = node('bdi', '', `${best} / ${count}`); score.dir = 'ltr';
      record.append(document.createTextNode(text('record') + ' '), score);
    } else record.textContent = text('noRecord');
    board.append(goal, record, node('p', 'expedition-help', text('protection')));
    if (available && !enough) board.append(node('p', 'expedition-requirement', text('needed', count)));
    const buttons = node('div', 'expedition-actions');
    const start = node('button', 'btn primary', text('start')); start.type = 'button'; start.id = 'expeditionStart'; start.disabled = !available || !enough || !levelOK;
    start.onclick = () => actions.onStart(); buttons.append(start);
    if (available && (!enough || !levelOK)) {
      const learn = node('button', 'btn ghost', text('learn')); learn.type = 'button'; learn.id = 'expeditionLearn'; learn.onclick = () => actions.onLearn(); buttons.append(learn);
    }
    board.append(buttons); replace(container, board);
  }
  function renderGear(container, state, onSelect) {
    const { code, text, local } = language(state.lang), available = !!state.ready && !state.error;
    const earned = new Set(available ? state.unlocked : []);
    const selected = earned.has(state.selected) ? state.selected : 0;
    const group = node('fieldset', 'expedition-gear'); group.dir = code === 'he' ? 'rtl' : 'ltr';
    group.append(node('legend', '', text('gear')), node('p', 'expedition-help', text('gearHelp')));
    if (!available) {
      const status = node('p', 'expedition-status', text(state.error ? 'gearError' : 'gearLoading')); status.setAttribute('role', 'status'); group.append(status);
    }
    const list = node('div', 'expedition-gear-list'), name = `world-gear-${++instance}`;
    for (const item of [{ section: 0 }, ...(state.worlds || [])]) {
      const isNone = item.section === 0, unlocked = isNone || earned.has(item.section);
      const label = node('label', 'expedition-gear-choice'); label.dataset.locked = String(!unlocked);
      const input = node('input'); input.type = 'radio'; input.name = name; input.value = item.section; input.id = `expeditionGear${item.section}`;
      input.checked = item.section === selected; input.disabled = !available || !unlocked;
      input.onchange = () => { if (input.checked) onSelect(item.section); };
      const detail = node('span', 'expedition-gear-detail');
      detail.append(node('strong', '', isNone ? text('none') : local(item.gearName)));
      detail.append(node('small', '', isNone ? text('noneHelp') : unlocked ? text('earned') : text('gearLocked', local(item.worldName || item.title))));
      label.append(input);
      if (!isNone && state.icon) label.append(decoration(state.icon(item.section), 'expedition-gear-icon'));
      label.append(detail); list.append(label);
    }
    group.append(list); replace(container, group);
  }
  window.ExpeditionUI = Object.freeze({ renderBoard, renderGear });
})();
