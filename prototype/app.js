const $ = id => document.getElementById(id);
const STORE = 'linux-master-proto';
const dayKey = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const code = text => { const c = el('code', 'cmd', text); c.dir = 'ltr'; return c; };

const DEFAULTS = { xp: 0, gems: 0, done: [], streak: 0, lastDay: null, days: [], mistakes: [], sound: true, quests: {} };
// Saved state can be stale or hand-edited; keep only fields of the expected type.
function loadState(raw) {
  const S = { ...DEFAULTS, done: [], days: [], mistakes: [], quests: {} };
  let saved; try { saved = JSON.parse(raw || '{}'); } catch { return S; }
  if (!saved || typeof saved !== 'object') return S;
  for (const key of ['xp', 'gems', 'streak']) if (Number.isFinite(saved[key]) && saved[key] >= 0) S[key] = saved[key];
  for (const key of ['done', 'days', 'mistakes']) if (Array.isArray(saved[key])) S[key] = saved[key].filter(x => typeof x === 'string');
  if (typeof saved.lastDay === 'string') S.lastDay = saved.lastDay;
  if (typeof saved.sound === 'boolean') S.sound = saved.sound;
  const q = saved.quests;
  if (q && typeof q === 'object' && typeof q.day === 'string' && Array.isArray(q.claimed)) S.quests = { day: q.day, xp: +q.xp || 0, perfect: +q.perfect || 0, combo: +q.combo || 0, claimed: q.claimed.filter(x => typeof x === 'string') };
  return S;
}
let S;
try { S = loadState(localStorage.getItem(STORE)); } catch { S = loadState(null); }
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch { /* not persisted */ } };
const liveStreak = () => (S.lastDay === dayKey() || S.lastDay === dayKey(-1)) ? S.streak : 0;
const questDay = () => (S.quests.day === dayKey() ? S.quests : (S.quests = { day: dayKey(), xp: 0, perfect: 0, combo: 0, claimed: [] }));
const QUESTS = [
  { id: 'xp', icon: '⚡', text: 'qXp', goal: 30 },
  { id: 'perfect', icon: '🎯', text: 'qPerfect', goal: 1 },
  { id: 'combo', icon: '🔥', text: 'qCombo', goal: 5 },
];

// Sound: short synthesized tones, no audio files.
let audio;
function tone(notes) {
  if (!S.sound) return;
  try {
    audio = audio || new AudioContext(); let at = audio.currentTime;
    for (const [freq, dur, type = 'sine'] of notes) {
      const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.16, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g).connect(audio.destination); o.start(at); o.stop(at + dur + 0.02); at += dur * 0.75;
    }
  } catch { /* audio unavailable */ }
}
const SFX = { good: () => tone([[660, 0.09], [990, 0.16]]), bad: () => tone([[240, 0.16, 'triangle'], [190, 0.22, 'triangle']]), win: () => tone([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.32]]), tap: () => tone([[520, 0.04]]) };

function mascot(mood = 'idle') {
  const mouth = { idle: '<rect x="44" y="66" width="14" height="4" rx="2" class="cursor"/>', happy: '<path d="M38 64 Q50 76 62 64" />', sad: '<path d="M39 72 Q50 62 61 72" />', party: '<path d="M36 62 Q50 80 64 62 Z" class="open"/>' }[mood];
  return `<svg class="mascot ${mood}" viewBox="0 0 100 100" aria-hidden="true"><rect x="12" y="18" width="76" height="66" rx="18" class="body"/><rect x="12" y="18" width="76" height="16" rx="8" class="bar"/><circle cx="24" cy="26" r="2.6" class="dot"/><circle cx="32" cy="26" r="2.6" class="dot"/><circle cx="40" cy="26" r="2.6" class="dot"/><circle cx="37" cy="50" r="7" class="eye"/><circle cx="63" cy="50" r="7" class="eye"/><circle cx="38.5" cy="51" r="3.4" class="pupil"/><circle cx="64.5" cy="51" r="3.4" class="pupil"/><g class="mouth">${mouth}</g><rect x="20" y="84" width="14" height="8" rx="4" class="foot"/><rect x="66" y="84" width="14" height="8" rx="4" class="foot"/></svg>`;
}

function runIn(setup, cmd, fixture = unitFixture()) {
  const sh = new Shell(fixture); for (const c of setup || []) sh.run(c);
  const before = sh.cwd, r = sh.run(cmd);
  return { out: (r.out + r.err).replace(/\n$/, ''), cwd: before };
}
const promptFor = cwd => `user@linux:${cwd.startsWith('/home/user') ? '~' + cwd.slice(10) : cwd}$ `;

// ---------- Top bar and tabs ----------
function renderTop() { $('streakN').textContent = liveStreak(); $('gemsN').textContent = S.gems; $('xpN').textContent = S.xp; $('streakChip').classList.toggle('lit', S.lastDay === dayKey()); }
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.id === name));
  document.querySelectorAll('.tabbar button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === name ? 'page' : 'false'));
  closePop(); ({ learn: renderPath, practice: renderPractice, quests: renderQuests, profile: renderProfile })[name]();
}

// ---------- Path ----------
// Unit 1 keeps its original keys (L0, c1, boss) so progress saved before more units existed still counts.
const unitKey = (unit, id) => (unit.unit === 1 ? id : `u${unit.unit}-${id}`);
const NODE_PLAN = [['L0', 'lesson', 0], ['L1', 'lesson', 1], ['c1', 'chest'], ['L2', 'lesson', 2], ['L3', 'lesson', 3], ['boss', 'boss']];
const unitNodes = unit => NODE_PLAN.map(([id, kind, i]) => ({ key: unitKey(unit, id), kind, i, unit }));
const withFixture = (unit, exercises) => exercises.map(ex => ({ ...ex, fx: unit.fixture || unitFixture }));
const OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52];
const ICONS = { lesson: '★', chest: '🎁', boss: '$_', done: '✓', lock: '🔒' };
function renderPath() {
  const root = $('path'); root.innerHTML = '';
  const order = COURSE.filter(u => !u.locked).flatMap(unitNodes);
  const current = order.find(n => !S.done.includes(n.key))?.key;
  for (const unit of COURSE) {
    const banner = el('div', `unit-banner ${unit.color}${unit.locked ? ' locked' : ''}`);
    const txt = el('div'); txt.append(el('div', 'unit-kicker', t('kicker', unit.section, unit.unit)), el('h2', '', tr(unit.title)), el('div', 'unit-sub', tr(unit.subtitle)));
    banner.append(txt, el('div', 'unit-book', unit.locked ? '🔒' : '📘')); root.append(banner);
    const list = el('ol', 'nodes');
    const nodes = unit.locked ? NODE_PLAN.map(([id, kind]) => ({ key: unitKey(unit, id), kind: kind === 'boss' ? 'boss' : 'lesson', unit, lockedUnit: true })).filter(n => n.key !== unitKey(unit, 'c1')) : unitNodes(unit);
    nodes.forEach((n, i) => {
      const li = el('li', 'node-row'); li.style.setProperty('--x', `${OFFSETS[i % OFFSETS.length]}px`);
      const state = n.lockedUnit ? 'locked' : S.done.includes(n.key) ? 'done' : n.key === current ? 'current' : 'locked';
      const b = el('button', `node ${n.kind} ${state}`); b.type = 'button';
      b.textContent = state === 'done' && n.kind !== 'chest' ? ICONS.done : state === 'locked' && n.kind === 'lesson' ? ICONS.lock : ICONS[n.kind];
      if (n.kind === 'boss') b.dir = 'ltr';
      b.setAttribute('aria-label', n.lockedUnit ? t('locked') : n.kind === 'lesson' ? t('lessonN', n.i + 1, tr(unit.lessons[n.i].title)) : n.kind === 'chest' ? t('chest') : tr(unit.boss.title));
      b.onclick = () => openPop(b, n, state);
      if (state === 'current') { const tip = el('div', 'start-tip', n.kind === 'chest' ? t('open') : t('start')); li.append(tip); li.classList.add('tipped'); }
      li.append(b);
      if (i === 2 && !unit.locked) { const m = el('div', 'path-mascot'); m.innerHTML = mascot(S.done.includes(n.key) ? 'happy' : 'idle'); li.append(m); }
      list.append(li);
    });
    root.append(list);
  }
  renderTop();
}
function openPop(anchor, n, state) {
  closePop(); SFX.tap();
  const unit = n.unit, pop = el('div', `pop ${state}`); pop.id = 'pop'; pop.setAttribute('role', 'dialog');
  if (state === 'locked') { pop.append(el('h3', '', n.lockedUnit ? tr(unit.title) : t('notYet')), el('p', '', n.lockedUnit ? t('lockedUnitText') : t('notYetText'))); }
  else if (n.kind === 'chest') {
    pop.append(el('h3', '', state === 'done' ? t('chestOpened') : t('chest')), el('p', '', state === 'done' ? t('chestDone') : t('chestText')));
    if (state === 'current') { const go = el('button', 'btn primary', t('chestBtn')); go.onclick = () => openChest(n.key); pop.append(go); }
  } else {
    const title = tr(n.kind === 'boss' ? unit.boss.title : unit.lessons[n.i].title);
    pop.append(el('h3', '', title), el('p', '', n.kind === 'boss' ? tr(unit.boss.intro || unit.boss.text) : t('lessonOf', n.i + 1, unit.lessons.length)));
    const go = el('button', 'btn primary', state === 'done' ? t('again') : n.kind === 'boss' ? t('toBoss') : t('startXp'));
    go.onclick = () => { closePop(); n.kind === 'boss' ? startBoss(unit, n.key) : startLesson(n.key, withFixture(unit, unit.lessons[n.i].exercises), { title, replay: state === 'done' }); };
    pop.append(go);
  }
  anchor.parentElement.append(pop); anchor.parentElement.classList.add('open'); setTimeout(() => document.addEventListener('click', outside), 0);
}
function outside(e) { if (!e.target.closest('#pop') && !e.target.closest('.node')) closePop(); }
function closePop() { $('pop')?.parentElement.classList.remove('open'); $('pop')?.remove(); document.removeEventListener('click', outside); }
function openChest(key) {
  closePop(); S.gems += 15; S.done.push(key); save(); SFX.win(); confetti(); toast(t('gemsToast')); renderPath();
}

// ---------- Lesson engine ----------
let L = null;
function startLesson(key, exercises, opts = {}) {
  const queue = exercises.map((ex, i) => ({ ...ex, uid: `${key}.${i}` }));
  L = { key, opts, queue, total: queue.filter(e => e.type !== 'teach').length, correct: 0, mistakes: 0, combo: 0, best: 0, start: Date.now(), ex: null, answered: false, value: null };
  $('lesson').hidden = false; document.body.classList.add('in-lesson'); next();
}
function startBoss(unit, key) {
  if (unit.boss.exercises) return startLesson(key, withFixture(unit, unit.boss.exercises), { boss: true });
  const boss = bossFixture();
  startLesson(key, [{ type: 'boss', prompt: unit.boss.text(boss.hideIn), boss }], { boss: true });
}
function next() {
  if (!L.queue.length) return finishLesson();
  L.ex = L.queue.shift(); L.answered = false; L.value = null;
  const ex = L.ex;
  $('bar').style.width = `${(L.correct / Math.max(1, L.total)) * 100}%`;
  $('exTag').textContent = ex.type === 'teach' ? t(ex.known ? 'knownCmd' : 'newCmd') : ex.retry ? t('retry') : '';
  $('exTag').className = `ex-tag${ex.type === 'teach' ? ' new' : ex.retry ? ' retry' : ''}`;
  $('exPrompt').textContent = ex.type === 'teach' ? '' : tr(ex.prompt);
  $('exPrompt').hidden = ex.type === 'teach';
  const body = $('exBody'); body.innerHTML = ''; body.className = `ex-body ${ex.type}`;
  setFoot('idle'); RENDER[ex.type](body, ex);
  $('lessonMain').scrollTop = 0;
}
function setCan(ok) { $('checkBtn').disabled = !ok; }
function setFoot(mode, title = '', { label = '', sol = '', note = '' } = {}) {
  const foot = $('foot'); foot.className = `lesson-foot ${mode}`;
  $('fbTitle').textContent = title; $('fbBox').hidden = mode === 'idle';
  const detail = $('fbDetail'); detail.innerHTML = '';
  if (sol) { const row = el('div', 'fb-sol', label); const c = el('pre', 'cmd', sol); c.dir = 'ltr'; row.append(c); detail.append(row); }
  if (note) detail.append(el('div', 'fb-note', note));
  $('checkBtn').textContent = mode === 'idle' ? (L.ex?.type === 'teach' ? t('gotIt') : t('check')) : t('continue');
  $('reportLink').hidden = mode === 'idle';
  if (mode !== 'idle') $('reportLink').href = reportUrl();
  if (mode === 'idle') setCan(L.ex?.type === 'teach');
}
function reportUrl() {
  const ex = L.ex, body = `**Prototype exercise:** \`${ex.uid}\` (${ex.type})\n\n> ${tr(ex.prompt) || ex.cmd}\n\n**Language:** ${LANG}\n\n**Learner answer:** \`${L.value ?? ''}\`\n\n**Details:**\n`;
  return `https://github.com/SaharHalili95/linux-master/issues/new?${new URLSearchParams({ title: `Prototype report: ${ex.uid}`, labels: 'question-report', body })}`;
}
function onFootButton() {
  if (L.answered || L.ex.type === 'teach') { L.answered = false; return next(); }
  const r = CHECK[L.ex.type](L.ex, L.value);
  answer(r.ok, r.solution, r.why);
}
function answer(ok, solution = '', why = '') {
  L.answered = true;
  if (ok) {
    L.correct++; L.combo++; L.best = Math.max(L.best, L.combo); SFX.good();
    const praise = t('praise');
    setFoot('good', L.combo >= 3 ? t('inARow', L.combo) : praise[Math.floor(Math.random() * praise.length)], { label: t('solution'), sol: ['match', 'terminal'].includes(L.ex.type) || L.ex.plain ? '' : solution, note: L.ex.type === 'terminal' ? solution : '' });
  } else {
    L.mistakes++; L.combo = 0; SFX.bad();
    L.queue.push({ ...L.ex, retry: true });
    if (!S.mistakes.includes(L.ex.uid) && !L.opts.boss) S.mistakes.push(L.ex.uid);
    setFoot('bad', t('correctAnswer'), L.ex.type === 'terminal' ? { note: solution } : L.ex.plain ? { note: why ? `${solution}\n${why}` : solution } : { sol: solution, note: why });
    $('lessonMain').classList.remove('shake'); void $('lessonMain').offsetWidth; $('lessonMain').classList.add('shake');
  }
  if (ok && L.ex.retry) S.mistakes = S.mistakes.filter(id => id !== L.ex.uid);
  $('bar').style.width = `${(L.correct / Math.max(1, L.total)) * 100}%`;
  $('comboTag').textContent = L.combo >= 2 ? `🔥 ${L.combo}` : '';
  setCan(true); $('checkBtn').focus({ preventScroll: true }); save();
}
function quitLesson() { if (L && (L.correct || L.mistakes) && !confirm(t('quitConfirm'))) return; closeOverlays(); }
function closeOverlays() { ['lesson', 'end', 'streakScreen'].forEach(id => { $(id).hidden = true; }); document.body.classList.remove('in-lesson'); L = null; showTab('learn'); }

// ---------- Exercise renderers ----------
function optionButton(label, value, mono, onPick, index) {
  const b = el('button', 'opt'); b.type = 'button'; b.dataset.value = value;
  const k = el('span', 'key', String(index + 1)); const t = mono ? code(label) : el('span', '', label);
  b.append(k, t); b.onclick = () => { SFX.tap(); onPick(b); }; return b;
}
function pickOne(root) { return b => { if (L.answered) return; root.querySelectorAll('.opt').forEach(o => o.classList.toggle('sel', o === b)); L.value = b.dataset.value; setCan(true); }; }
function termBlock(lines) {
  const t = el('div', 'term'); t.dir = 'ltr';
  for (const [prompt, cmd, out] of lines) { const row = el('div', 'term-line'); row.append(el('span', 'ps1', prompt), el('span', 'typed', cmd)); t.append(row); if (out) t.append(el('pre', 'term-out', out)); }
  return t;
}
const RENDER = {
  teach(root, ex) {
    const card = el('div', 'teach-card');
    const head = el('div', 'teach-head'); const m = el('div', 'teach-mascot'); m.innerHTML = mascot('happy');
    const bubble = el('div', 'bubble'); bubble.append(code(ex.cmd), el('div', 'teach-name', ex.name), el('p', '', tr(ex.text)));
    head.append(m, bubble); card.append(head);
    if (ex.demo) {
      const [setup, cmd] = ex.demo, sh = new Shell(ex.fx()), lines = [];
      for (const c of setup) { lines.push([promptFor(sh.cwd), c, '']); sh.run(c); }
      const ps1 = promptFor(sh.cwd), r = sh.run(cmd); lines.push([ps1, cmd, (r.out + r.err).replace(/\n$/, '')]);
      card.append(el('div', 'demo-label', t('tryIt')), termBlock(lines));
    } else if (ex.sample) card.append(el('div', 'demo-label', t('sampleLine')), termBlock([['user@linux:~$ ', ex.cmd, ex.sample]]));
    root.append(card);
  },
  choice(root, ex) {
    const list = el('div', 'opts'); const pick = pickOne(list);
    const items = ex.options.map((o, i) => [ex.plain ? String(i) : o, tr(o)]);
    shuffle(items).forEach(([value, label], i) => list.append(optionButton(label, value, !ex.plain, pick, i))); root.append(list);
  },
  fill(root, ex) {
    const line = el('div', 'fill-line'); line.dir = 'ltr';
    const slot = el('span', 'slot', '   '); line.append(el('span', 'ps1', 'user@linux:~$ '), el('span', 'typed', ex.before), slot, el('span', 'typed', ex.after));
    const chips = el('div', 'chips');
    shuffle(ex.options).forEach(o => { const c = el('button', 'tile', o); c.type = 'button'; c.dir = 'ltr'; c.onclick = () => { if (L.answered) return; SFX.tap(); chips.querySelectorAll('.tile').forEach(t => t.classList.toggle('sel', t === c)); slot.textContent = o; slot.classList.add('filled'); L.value = o; setCan(true); }; chips.append(c); });
    root.append(line, chips);
  },
  output(root, ex) {
    const fx = ex.fx, real = runIn(ex.setup, ex.cmd, fx());
    // Show every starting file the commands read, so the answer never depends on content the learner has not seen.
    const lines = [], start = new Shell(fx()), peek = new Map(); let sh = new Shell(fx());
    for (const c of [...(ex.setup || []), ex.cmd]) {
      for (const word of c.split(/[\s|;&<>]+/)) { const p = word && sh.abs(word); if (p && start.files.has(p) && !peek.has(p)) peek.set(p, [word, start.files.get(p).content]); }
      if (c === ex.cmd) lines.push([promptFor(sh.cwd), c, '?']); else { lines.push([promptFor(sh.cwd), c, '']); sh.run(c); }
    }
    for (const [name, content] of peek.values()) { const card = el('div', 'file-peek'); card.append(el('div', 'file-peek-h', t('fileHas', name)), Object.assign(el('pre', '', content.replace(/\n$/, '')), { dir: 'ltr' })); root.append(card); }
    root.append(termBlock(lines));
    const wrong = [...(ex.wrongCmds || []).map(c => runIn(ex.setup, c, fx()).out), ...(ex.wrongText || [])].filter(w => w !== real.out);
    const options = shuffle([real.out, ...[...new Set(wrong)].slice(0, 3)]);
    ex.solution = real.out;
    const list = el('div', 'opts outputs'); const pick = pickOne(list);
    options.forEach((o, i) => { const b = optionButton('', o, false, pick, i); b.lastChild.replaceWith(Object.assign(el('pre', 'out-opt', o || t('noOutput')), { dir: 'ltr' })); list.append(b); });
    root.append(list);
  },
  tiles(root, ex) {
    const answerRow = el('div', 'answer-row'); answerRow.dir = 'ltr';
    const bank = el('div', 'bank'); bank.dir = 'ltr'; const chosen = [];
    const update = () => { L.value = chosen.map(c => c.textContent).join(' '); setCan(chosen.length > 0); };
    shuffle(ex.tiles).forEach(word => {
      const slot = el('span', 'tile-slot'); const t = el('button', 'tile', word); t.type = 'button';
      t.onclick = () => {
        if (L.answered) return; SFX.tap();
        if (t.parentElement === slot) { answerRow.append(t); chosen.push(t); } else { slot.append(t); chosen.splice(chosen.indexOf(t), 1); }
        update();
      };
      slot.append(t); bank.append(slot);
    });
    root.append(answerRow, bank);
  },
  match(root, ex) {
    const grid = el('div', 'match-grid'); const left = el('div', 'col'), right = el('div', 'col');
    let picked = null, matched = 0;
    const mk = (text, side, key) => { const b = el('button', `tile pair ${side}`); b.type = 'button'; b.dataset.key = key; if (side === 'cmd') b.append(code(text)); else b.textContent = text; return b; };
    const onTap = b => {
      if (b.classList.contains('ok')) return; SFX.tap();
      if (!picked || picked.classList.contains(b.classList.contains('cmd') ? 'cmd' : 'mean')) { grid.querySelectorAll('.pair').forEach(p => p.classList.remove('sel')); picked = b; b.classList.add('sel'); return; }
      const a = picked; picked = null; a.classList.remove('sel');
      if (a.dataset.key === b.dataset.key) {
        [a, b].forEach(x => { x.classList.add('ok'); x.disabled = true; }); matched++; SFX.good();
        if (matched === ex.pairs.length) { L.value = 'all'; answer(true); }
      } else { [a, b].forEach(x => { x.classList.add('no'); setTimeout(() => x.classList.remove('no'), 450); }); L.matchMiss = true; SFX.bad(); }
    };
    shuffle(ex.pairs).forEach(([c]) => left.append(mk(c, 'cmd', c)));
    shuffle(ex.pairs).forEach(([c, m]) => right.append(mk(tr(m), 'mean', c)));
    grid.append(left, right); grid.addEventListener('click', e => { const b = e.target.closest('.pair'); if (b) onTap(b); });
    root.append(grid); $('checkBtn').disabled = true;
  },
  terminal(root, ex) { mountTerminal(root, ex, new Shell(ex.fx())); },
  boss(root, ex) {
    const goals = el('ul', 'goals');
    const items = [['found', t('goalFound')], ['read', t('goalRead')], ['typed', t('goalTyped')]];
    for (const [id, text] of items) { const li = el('li', '', text); li.dataset.goal = id; goals.append(li); }
    const boss = ex.boss;
    const mark = (id, on) => goals.querySelector(`[data-goal="${id}"]`).classList.toggle('done', on);
    const head = el('div', 'boss-head'); const m = el('div', 'teach-mascot'); m.innerHTML = mascot('party'); head.append(m, goals);
    root.append(head);
    mountTerminal(root, ex, new Shell(boss.fx), log => {
      mark('found', log.some(l => /^ls\b.*-\w*a/.test(l.cmd) && l.out.split('\n').includes('.code')));
      mark('read', log.some(l => l.out.includes(boss.word)));
    });
    const row = el('div', 'code-row'); const lab = el('label', '', t('codeWord')); lab.htmlFor = 'codeWord';
    const input = el('input'); input.id = 'codeWord'; input.dir = 'ltr'; input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('autocapitalize', 'off');
    input.oninput = () => { L.value = input.value.trim(); mark('typed', !!L.value); setCan(!!L.value); };
    input.onkeydown = e => { if (e.key === 'Enter' && L.value) { e.preventDefault(); onFootButton(); } };
    row.append(lab, input); root.append(row);
  },
};
function mountTerminal(root, ex, sh, onRun = () => {}) {
  for (const c of ex.setup || []) sh.run(c);
  const log = []; L.term = { sh, log };
  const box = el('div', 'term live'); box.dir = 'ltr'; const out = el('div', 'term-scroll');
  const form = el('form', 'term-input'); const ps = el('span', 'ps1', promptFor(sh.cwd));
  const input = el('input'); input.setAttribute('aria-label', t('command')); input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('autocapitalize', 'off'); input.enterKeyHint = 'send'; input.placeholder = t('command');
  form.append(ps, input); box.append(out, form);
  form.onsubmit = e => {
    e.preventDefault(); const cmd = input.value.trim(); input.value = ''; if (!cmd || L.answered) return;
    const row = el('div', 'term-line'); row.append(el('span', 'ps1', promptFor(sh.cwd)), el('span', 'typed', cmd)); out.append(row);
    let text;
    try { const r = sh.run(cmd); text = (r.out + r.err).replace(/\n$/, ''); } catch (err) { text = err instanceof ShellUnsupported ? t('unsupported', cmd.split(/\s+/)[0]) : String(err.message); }
    if (text) out.append(el('pre', 'term-out', text));
    log.push({ cmd, out: text }); ps.textContent = promptFor(sh.cwd); box.scrollTop = box.scrollHeight;
    L.value = log.map(l => l.cmd).join(' ; '); if (ex.type === 'terminal') setCan(true); onRun(log);
  };
  if (ex.hint) { const h = el('button', 'hint-link', t('hint')); h.type = 'button'; h.onclick = () => { h.replaceWith(el('div', 'hint', tr(ex.hint))); }; root.append(box, h); } else root.append(box);
  // Never steal focus from a field the learner already moved to.
  setTimeout(() => { if (document.activeElement?.tagName !== 'INPUT') input.focus({ preventScroll: true }); }, 50);
}
const CHECK = {
  choice: (ex, v) => ex.plain ? { ok: v === '0', solution: tr(ex.options[0]), why: tr(ex.why?.[v]) || '' } : { ok: v === ex.answer, solution: ex.answer, why: tr(ex.why?.[v]) || '' },
  fill: (ex, v) => ({ ok: v === ex.answer, solution: `${ex.before}${ex.answer}${ex.after}` }),
  output: (ex, v) => ({ ok: v === ex.solution, solution: ex.solution || t('noOutput') }),
  tiles: (ex, v) => ({ ok: [ex.answer, ...(ex.accept || [])].includes(v), solution: ex.answer }),
  terminal: ex => ({ ok: ex.goal(L.term.sh, L.term.log), solution: tr(ex.hint) }),
  boss: (ex, v) => ({ ok: v === ex.boss.word, solution: t('bossSolution', ex.boss.word, ex.boss.hideIn), why: t('bossWhy', ex.boss.hideIn) }),
};

// ---------- End of lesson ----------
function finishLesson() {
  const perfect = L.mistakes === 0 && !L.matchMiss, secs = Math.round((Date.now() - L.start) / 1000);
  const xp = L.opts.boss ? 25 : L.opts.replay || L.opts.practice ? 5 : 10 + (perfect ? 5 : 0);
  const firstToday = S.lastDay !== dayKey();
  if (firstToday) { S.streak = S.lastDay === dayKey(-1) ? S.streak + 1 : 1; S.lastDay = dayKey(); }
  if (!S.days.includes(dayKey())) S.days = [...S.days, dayKey()].slice(-30);
  S.xp += xp; if (!L.opts.practice && !S.done.includes(L.key)) S.done.push(L.key);
  const q = questDay(); q.xp += xp; if (perfect) q.perfect++; q.combo = Math.max(q.combo, L.best);
  const newly = QUESTS.filter(x => !q.claimed.includes(x.id) && q[x.id] >= x.goal); newly.forEach(x => { q.claimed.push(x.id); S.gems += 10; });
  save();
  $('lesson').hidden = true; $('end').hidden = false;
  $('endMascot').innerHTML = mascot('party');
  $('endTitle').textContent = L.opts.boss ? t('bossWon') : perfect ? t('perfect') : t('done');
  $('endXp').textContent = xp; $('endAcc').textContent = `${Math.round((L.correct / Math.max(1, L.correct + L.mistakes)) * 100)}%`;
  $('endTime').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  $('endQuests').textContent = newly.length ? t('questsDone', newly.length) : '';
  $('endBtn').onclick = () => firstToday ? showStreak() : closeOverlays();
  SFX.win(); confetti(); $('endBtn').focus();
}
function showStreak() {
  $('end').hidden = true; $('streakScreen').hidden = false; $('streakBig').textContent = S.streak;
  $('streakText').textContent = S.streak === 1 ? t('streakFirst') : t('streakMore', S.streak);
  const week = $('week'); week.innerHTML = '';
  const names = t('days');
  for (let i = -6; i <= 0; i++) { const d = new Date(); d.setDate(d.getDate() + i); const on = S.days.includes(dayKey(i)); const c = el('div', `day${on ? ' on' : ''}${i === 0 ? ' today' : ''}`); c.append(el('span', 'dot', on ? '✓' : ''), el('span', '', names[d.getDay()])); week.append(c); }
  SFX.win(); $('streakBtn').focus();
}

// ---------- Other tabs ----------
function allExercises() { return COURSE.filter(u => !u.locked).flatMap(u => u.lessons.flatMap((ls, li) => withFixture(u, ls.exercises).map((ex, i) => ({ ...ex, uid: `${unitKey(u, `L${li}`)}.${i}` })))).filter(e => e.type !== 'teach'); }
function renderPractice() {
  const n = S.mistakes.length; $('mistakesCount').textContent = n ? t('mistakesN', n) : t('noMistakes');
  $('practiceMistakes').disabled = !n;
}
function practice(kind) {
  const pool = allExercises(); const items = kind === 'mistakes' ? pool.filter(e => S.mistakes.includes(e.uid)) : shuffle(pool.filter(e => S.done.includes(e.uid.split('.')[0]))).slice(0, 8);
  if (!items.length) return toast(kind === 'mistakes' ? t('noMistakesToast') : t('finishFirst'));
  L = null; startLesson('practice', items.map(e => ({ ...e })), { practice: true });
  L.queue.forEach((e, i) => { e.uid = items[i].uid; });
}
function renderQuests() {
  const q = questDay(), list = $('questList'); list.innerHTML = '';
  for (const x of QUESTS) {
    const val = Math.min(x.goal, q[x.id] || 0), li = el('li', `quest${val >= x.goal ? ' done' : ''}`);
    const bar = el('div', 'qbar'); const fill = el('div', 'qfill'); fill.style.width = `${(val / x.goal) * 100}%`; bar.append(fill, el('span', 'qnum', `${val} / ${x.goal}`));
    const body = el('div', 'qbody'); body.append(el('div', 'qtext', t(x.text)), bar);
    li.append(el('div', 'qicon', x.icon), body, el('div', 'qreward', val >= x.goal ? '✓' : '💎10')); list.append(li);
  }
}
function renderProfile() {
  $('pXp').textContent = S.xp; $('pStreak').textContent = liveStreak(); $('pLessons').textContent = S.done.filter(k => /(^|-)L\d$/.test(k)).length; $('pGems').textContent = S.gems;
  $('soundToggle').checked = S.sound; $('profileMascot').innerHTML = mascot('happy');
}

// ---------- Effects ----------
function toast(text) { const t = $('toast'); t.textContent = text; t.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 2200); }
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('confetti'), ctx = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight; c.hidden = false;
  const colors = ['#58c43b', '#2f9bf0', '#f7c531', '#ff6b6b', '#b06bf3'];
  const parts = Array.from({ length: 110 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.4, r: 4 + Math.random() * 5, vy: 2 + Math.random() * 3.5, vx: -1.5 + Math.random() * 3, a: Math.random() * 6, color: colors[Math.floor(Math.random() * colors.length)] }));
  const end = Date.now() + 1800;
  (function frame() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of parts) { p.x += p.vx; p.y += p.vy; p.a += 0.1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.color; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); }
    if (Date.now() < end) requestAnimationFrame(frame); else { ctx.clearRect(0, 0, c.width, c.height); c.hidden = true; }
  })();
}

// ---------- Wiring ----------
document.querySelectorAll('.tabbar button').forEach(b => { b.onclick = () => showTab(b.dataset.tab); });
$('checkBtn').onclick = onFootButton;
$('quitBtn').onclick = quitLesson;
$('streakBtn').onclick = closeOverlays;
$('practiceMistakes').onclick = () => practice('mistakes');
$('practiceMix').onclick = () => practice('mix');
$('soundToggle').onchange = e => { S.sound = e.target.checked; save(); };
$('resetBtn').onclick = () => { if (confirm(t('resetConfirm'))) { S = loadState(null); save(); renderTop(); renderProfile(); toast(t('resetDone')); } };
document.addEventListener('keydown', e => {
  if ($('lesson').hidden || !L) return;
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'Enter' && !$('checkBtn').disabled) { e.preventDefault(); onFootButton(); return; }
  const n = Number(e.key); if (!L.answered && n >= 1 && n <= 9) $('exBody').querySelectorAll('.opt')[n - 1]?.click();
});
function applyLanguage() {
  document.documentElement.lang = LANG; document.documentElement.dir = LANG === 'he' ? 'rtl' : 'ltr'; document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.i18nAria)); });
  $('langBtn').title = t('langLabel'); $('langBtn').lang = LANG === 'he' ? 'en' : 'he';
}
$('langBtn').onclick = () => {
  LANG = LANG === 'he' ? 'en' : 'he'; try { localStorage.setItem('lang', LANG); } catch { /* not persisted */ }
  applyLanguage(); showTab(document.querySelector('.tab.active').id);
};
applyLanguage();
showTab('learn');
