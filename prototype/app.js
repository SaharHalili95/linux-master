const $ = id => document.getElementById(id);
const STORE = 'linux-master-proto';
const dayKey = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
// Hebrew text with commands inside: each command run becomes a left-to-right island, so it stays in one
// piece and the punctuation around it (like a final ?) stays on the Hebrew side.
// A run may open with dots or a colon when a name follows (.deb, ../logs, :wq), and a vi command keeps its ! (:q!).
// A quote opens a run only when a command follows, so the closing quote of a Hebrew phrase never swallows what comes next.
const CODE_RUN = /:[A-Za-z0-9%/]+!?|(?:\.+(?=[A-Za-z0-9/~_-]))?(?:["'](?=\.?[A-Za-z0-9~/$_^*[(\\-])|[\^A-Za-z0-9~/$_<>|*={}[\]#%+&@\\-])(?:[\^A-Za-z0-9~/$_<>|*={}[\]"'#%+&@\\ .,:!?()-]*[A-Za-z0-9~/$_<>|*={}[\]"'#%+&@\\-])?/g;
// A run must not carry half a pair: "builtin), alias" is two commands around a bracket that belongs to the sentence.
function balancedPieces(run) {
  const cuts = new Set(), open = [], quotes = [...run.matchAll(/"/g)].map(q => q.index);
  for (let i = 0; i < run.length; i++) { if (run[i] === '(') open.push(i); else if (run[i] === ')') { if (open.length) open.pop(); else cuts.add(i); } }
  open.forEach(i => cuts.add(i));
  if (quotes.length % 2) cuts.add(run[0] === '"' ? 0 : quotes[quotes.length - 1]);
  const marks = [...cuts].sort((x, y) => x - y), pieces = [];
  let from = 0;
  for (const cut of [...marks, run.length]) {
    let start = from, end = cut;
    if (from > 0) while (start < end && /[\s,.:;]/.test(run[start])) start++;
    if (cut < run.length) while (end > start && /[\s,.:;]/.test(run[end - 1])) end--;
    if (end > start) pieces.push([start, end]);
    from = cut + 1;
  }
  return pieces;
}
function bidi(text) {
  const frag = document.createDocumentFragment(); text = String(text);
  if (!/[֐-׿]/.test(text)) { frag.append(text); return frag; }
  text = text.replace(/‎/g, ''); let last = 0;
  for (const m of text.matchAll(CODE_RUN)) {
    let run = m[0];
    // A closing bracket is left out of the match; it belongs to the run when the run opened it: $(date), %Cpu(s).
    if (text[m.index + run.length] === ')' && (run.match(/\(/g) || []).length > (run.match(/\)/g) || []).length) run += ')';
    for (const [from, to] of balancedPieces(run)) {
      const start = m.index + from, piece = text.slice(start, m.index + to);
      // A Hebrew prefix glued with a maqaf (מ־, ב־, ל־) stays on the same line as its command.
      const before = text.slice(last, start), glued = before.match(/[א-ת]{1,3}־$/);
      frag.append(glued ? before.slice(0, -glued[0].length) : before);
      const b = document.createElement('bdi'); b.dir = 'ltr'; b.className = piece.length <= 24 ? 'ltr-run keep' : 'ltr-run'; b.textContent = piece;
      last = start + piece.length;
      // Punctuation stays with the command before it, so it never wraps alone onto a new line.
      const punct = text.slice(last).match(/^[.,:;?!)]+/)?.[0] || '';
      last += punct.length;
      if (glued || punct) { const s = el('span', 'glued', glued?.[0] || ''); s.append(b, punct); frag.append(s); } else frag.append(b);
    }
  }
  frag.append(text.slice(last)); return frag;
}
const code = text => { const c = el('code', 'cmd', text); c.dir = 'ltr'; return c; };

// The sheet shows the full name; the tab bar the short one.
const TRACK_NAMES = { L: 'LPIC-1', R: 'RHCSA', F: 'LFCS', E: 'Linux Essentials', S: 'SUSE SCA', C: 'CompTIA Linux+' };
const TRACK_SHORT = { ...TRACK_NAMES, E: 'Essentials', C: 'Linux+' };
const MAX_LIVES = 5, LIFE_MS = 30 * 60 * 1000, LIFE_GEMS = 20;
const DEFAULTS = { xp: 0, gems: 0, done: [], streak: 0, lastDay: null, days: [], mistakes: [], sound: true, quests: {}, layout: {}, reports: [], track: '', lives: MAX_LIVES, livesAt: 0 };
// Saved state can be stale or hand-edited; keep only fields of the expected type.
function loadState(raw) {
  const S = { ...DEFAULTS, done: [], days: [], mistakes: [], quests: {}, layout: {}, reports: [], track: '', lives: MAX_LIVES, livesAt: 0 };
  let saved; try { saved = JSON.parse(raw || '{}'); } catch { return S; }
  if (!saved || typeof saved !== 'object') return S;
  for (const key of ['xp', 'gems', 'streak']) if (Number.isFinite(saved[key]) && saved[key] >= 0) S[key] = saved[key];
  for (const key of ['done', 'days', 'mistakes']) if (Array.isArray(saved[key])) S[key] = saved[key].filter(x => typeof x === 'string');
  if (typeof saved.lastDay === 'string') S.lastDay = saved.lastDay;
  if (typeof saved.sound === 'boolean') S.sound = saved.sound;
  if (saved.layout && typeof saved.layout === 'object') for (const [k, v] of Object.entries(saved.layout)) if (typeof v === 'string') S.layout[k] = v;
  if (Object.hasOwn(TRACK_NAMES, saved.track)) S.track = saved.track;
  if (Number.isInteger(saved.lives) && saved.lives >= 0 && saved.lives <= MAX_LIVES) S.lives = saved.lives;
  if (Number.isFinite(saved.livesAt) && saved.livesAt >= 0) S.livesAt = saved.livesAt;
  if (Array.isArray(saved.reports)) S.reports = saved.reports.filter(r => r && typeof r.uid === 'string' && typeof r.note === 'string');
  const q = saved.quests;
  if (q && typeof q === 'object' && typeof q.day === 'string' && Array.isArray(q.claimed)) S.quests = { day: q.day, xp: +q.xp || 0, perfect: +q.perfect || 0, combo: +q.combo || 0, claimed: q.claimed.filter(x => typeof x === 'string') };
  return S;
}
COURSE.sort((a, b) => a.section - b.section || a.unit - b.unit);
let S;
try { S = loadState(localStorage.getItem(STORE)); } catch { S = loadState(null); }
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch { /* not persisted */ } };
const liveStreak = () => (S.lastDay === dayKey() || S.lastDay === dayKey(-1)) ? S.streak : 0;
const questDay = () => (S.quests.day === dayKey() ? S.quests : (S.quests = { day: dayKey(), xp: 0, perfect: 0, combo: 0, claimed: [] }));
const QUESTS = [
  { id: 'xp', icon: 'bolt', text: 'qXp', goal: 30 },
  { id: 'perfect', icon: 'target', text: 'qPerfect', goal: 1 },
  { id: 'combo', icon: 'flame', text: 'qCombo', goal: 5 },
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

function mascot(mood = 'idle', level = rankOf(S.xp).level) {
  // The hero grows with its rank: every level adds something, and the frame changes color along the way.
  const frame = level >= 11 ? '#ffc53d' : level >= 9 ? '#ff6ec7' : level >= 7 ? '#b79cff' : level >= 5 ? '#38e1ff' : level >= 3 ? '#4fe0c0' : '#9be46d';
  const shell = level >= 11 ? '#3a2a10' : level >= 9 ? '#3a1a3c' : level >= 7 ? '#2a2352' : level >= 5 ? '#14384a' : '#2b3a33';
  const glow = level >= 12 ? '#ffc53d' : level >= 6 ? '#38e1ff' : '#1d2421';
  const back = (level >= 12 ? '<circle cx="50" cy="48" r="48" fill="none" stroke="#ffc53d" stroke-width="2" stroke-dasharray="3 7"/>' : '')
    + (level >= 11 ? '<path d="M12 46 L-16 24 L-8 50 L-20 58 L-6 66 L-12 80 L12 70Z M88 46 L116 24 L108 50 L120 58 L106 66 L112 80 L88 70Z" fill="#ffc53d" stroke="#8a6200" stroke-width="1.5"/>' : '')
    + (level >= 10 ? '<path d="M18 40 L2 98 H98 L82 40Z" fill="#b3201f"/><path d="M2 98 H98 L96 90 H4Z" fill="#ffc53d"/>' : '')
    + (level >= 9 ? '<path d="M14 58 L2 74 L14 80Z M86 58 L98 74 L86 80Z" fill="#ff6ec7"/>' : '');
  const front = (level >= 12 ? '<path d="M26 19 L21 1 L37 11 L50 -3 L63 11 L79 1 L74 19Z" fill="#ffc53d" stroke="#8a6200" stroke-width="1.5"/><circle cx="50" cy="12" r="3.4" fill="#ff5a6e"/><circle cx="35" cy="15" r="2.2" fill="#38e1ff"/><circle cx="65" cy="15" r="2.2" fill="#38e1ff"/>' : level >= 2 ? `<path d="M50 18V8" stroke="${frame}" stroke-width="3"/><circle cx="50" cy="6" r="4.5" fill="#ffc53d"/><circle cx="48.5" cy="4.5" r="1.4" fill="#fff"/>` : '')
    + (level >= 3 ? '<path d="M70 36 L80 36 L62 80 L52 80Z" fill="#fff" opacity=".08"/>' : '')
    + (level >= 4 ? `<path d="M12 42 Q10 12 50 11 Q90 12 88 42" fill="none" stroke="${frame}" stroke-width="3.5"/><rect x="4" y="36" width="11" height="24" rx="5" fill="${frame}"/><rect x="85" y="36" width="11" height="24" rx="5" fill="${frame}"/><path d="M9 60 Q10 78 28 76" fill="none" stroke="${frame}" stroke-width="2.5"/><circle cx="29" cy="76" r="3" fill="#fff"/>` : '')
    + (level >= 5 ? '<circle cx="9.5" cy="44" r="1.8" fill="#fff"/><circle cx="90.5" cy="44" r="1.8" fill="#fff"/><circle cx="9.5" cy="52" r="1.8" fill="#fff"/><circle cx="90.5" cy="52" r="1.8" fill="#fff"/>' : '')
    + (level >= 6 ? '<rect x="22" y="39" width="56" height="22" rx="11" fill="#38e1ff" opacity=".24" stroke="#38e1ff" stroke-width="1.5"/><path d="M28 47H72" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>' : '')
    + (level >= 7 ? `<path d="M12 62 H26 V84 H18 Q12 84 12 78Z M88 62 H74 V84 H82 Q88 84 88 78Z" fill="${frame}" opacity=".85"/>` : '')
    + (level >= 8 ? '<path d="M50 68 l11 6 v9 l-11 6 -11 -6 v-9z" fill="#10163a" stroke="#ffc53d" stroke-width="2"/><path d="M50 71.5 l2.2 4.6 5 .7 -3.6 3.5 .9 5 -4.5 -2.4 -4.5 2.4 .9 -5 -3.6 -3.5 5 -.7z" fill="#ffc53d"/>' : '');
  const mouth = { idle: '<rect x="44" y="66" width="14" height="4" rx="2" class="cursor"/>', happy: '<path d="M38 64 Q50 76 62 64" />', sad: '<path d="M39 72 Q50 62 61 72" />', party: '<path d="M36 62 Q50 80 64 62 Z" class="open"/>' }[mood];
  return `<svg class="mascot ${mood}" viewBox="0 0 100 100" aria-hidden="true" style="--frame:${frame};--shell:${shell};--pupil:${glow}">${back}<rect x="12" y="18" width="76" height="66" rx="18" class="body"/><rect x="12" y="18" width="76" height="16" rx="8" class="bar"/><circle cx="24" cy="26" r="2.6" class="dot"/><circle cx="32" cy="26" r="2.6" class="dot"/><circle cx="40" cy="26" r="2.6" class="dot"/><circle cx="37" cy="50" r="7" class="eye"/><circle cx="63" cy="50" r="7" class="eye"/><circle cx="38.5" cy="51" r="3.4" class="pupil"/><circle cx="64.5" cy="51" r="3.4" class="pupil"/><g class="mouth">${mouth}</g><rect x="20" y="84" width="14" height="8" rx="4" class="foot"/><rect x="66" y="84" width="14" height="8" rx="4" class="foot"/>${front}</svg>`;
}

function runIn(setup, cmd, fixture = unitFixture()) {
  const sh = new Shell(fixture); for (const c of setup || []) sh.run(c);
  const before = sh.cwd, r = sh.run(cmd);
  return { out: (r.out + r.err).replace(/\n$/, ''), cwd: before };
}
const promptFor = cwd => `user@linux:${cwd.startsWith('/home/user') ? '~' + cwd.slice(10) : cwd}$ `;

// ---------- Top bar and tabs ----------
function renderTop() { $('streakN').textContent = liveStreak(); $('gemsN').textContent = S.gems; $('xpN').textContent = S.xp; syncLives(); $('livesN').textContent = S.lives; $('streakChip').classList.toggle('lit', S.lastDay === dayKey()); }
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.id === name));
  dockBar(); syncStage(false);
  document.querySelectorAll('.tabbar button[data-tab]').forEach(b => b.setAttribute('aria-current', b.dataset.tab === name ? 'page' : 'false'));
  closePop(); ({ learn: renderPath, practice: renderPractice, quests: renderQuests, profile: renderProfile })[name]();
}

// ---------- Path ----------
// Unit 1 keeps its original keys (L0, c1, boss) so progress saved before more units existed still counts.
const unitKey = (unit, id) => (unit.unit === 1 ? id : `u${unit.unit}-${id}`);
const NODE_PLAN = [['L0', 'lesson', 0], ['L1', 'lesson', 1], ['c1', 'chest'], ['L2', 'lesson', 2], ['L3', 'lesson', 3], ['boss', 'boss']];
const unitNodes = unit => unit.exam ? [{ key: unitKey(unit, 'exam'), kind: 'exam', unit }] : NODE_PLAN.map(([id, kind, i]) => ({ key: unitKey(unit, id), kind, i, unit }));
const withFixture = (unit, exercises) => exercises.map(ex => ({ ...ex, fx: unit.fixture || unitFixture }));
const OFFSETS = [0, 66, 66, 0, -66, -66];
const icon = name => { const i = el('span', `ic ic-${name}`); i.setAttribute('aria-hidden', 'true'); return i; };
const ICONS = { lesson: 'star', chest: 'gift', exam: 'note', done: 'check', lock: 'lock' };
// A certification track keeps only the units tagged for that exam, so a learner who already holds another
// certification skips the rest. Progress is shared, so switching tracks loses nothing.
const inTrack = (u, track = S.track) => !track || u.exams?.some(e => e.startsWith(track));

// Lives come back with time. Practice never costs one, so there is always something to learn.
function syncLives() {
  if (S.lives >= MAX_LIVES) { S.livesAt = 0; return; }
  if (!S.livesAt) S.livesAt = Date.now();
  const gained = Math.floor((Date.now() - S.livesAt) / LIFE_MS);
  if (gained > 0) { S.lives = Math.min(MAX_LIVES, S.lives + gained); S.livesAt = S.lives >= MAX_LIVES ? 0 : S.livesAt + gained * LIFE_MS; save(); }
}
function addLife() { S.lives = Math.min(MAX_LIVES, S.lives + 1); syncLives(); save(); renderTop(); }
function loseLife() { if (S.lives === MAX_LIVES) S.livesAt = Date.now(); S.lives = Math.max(0, S.lives - 1); save(); renderTop(); }
const lifeWait = () => { const ms = Math.max(0, S.livesAt + LIFE_MS - Date.now()); return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`; };
function renderLives() {
  syncLives(); $('livesCount').textContent = `${S.lives} / ${MAX_LIVES}`;
  $('livesWait').textContent = S.lives < MAX_LIVES ? t('livesNext', lifeWait()) : t('livesFull');
  $('buyLife').disabled = S.gems < LIFE_GEMS || S.lives >= MAX_LIVES; $('earnLife').disabled = S.lives >= MAX_LIVES;
}
function openLives() { renderLives(); $('livesSheet').hidden = false; clearInterval(openLives.tick); openLives.tick = setInterval(() => { if ($('livesSheet').hidden) clearInterval(openLives.tick); else renderLives(); }, 1000); }
// The Trivia questions live on as light practice. They load on first use, so the app itself stays small.
let triviaReady;
function loadTrivia() {
  triviaReady ||= Promise.all(['content', 'content.en'].map(name => new Promise((ok, fail) => { const tag = document.createElement('script'); tag.src = `../data/${name}.js?v=30`; tag.onload = ok; tag.onerror = fail; document.head.append(tag); })));
  return triviaReady;
}
function triviaExercises(count) {
  /* global commands, pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios, CONTENT */
  const names = commands.map(c => c.name), en = CONTENT.en;
  const byName = commands.map(c => ({ type: 'choice', prompt: T(`איזו פקודה עושה את זה? ${c.meaning}`, `Which command does this? ${en.commands[c.name] || c.meaning}`), options: [c.name, ...shuffle(names.filter(n => n !== c.name)).slice(0, 3)], answer: c.name, fx: unitFixture }));
  const groups = { pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios };
  const tasks = Object.entries(groups).flatMap(([key, list]) => list.map((q, i) => ({ type: 'choice', prompt: T(q.prompt, en.scenarios[key]?.[i]?.prompt || q.prompt), options: [q.answer, ...q.wrong.slice(0, 3)], answer: q.answer, fx: unitFixture })));
  return shuffle([...byName, ...tasks]).slice(0, count);
}
async function startTrivia(earn) {
  try { await loadTrivia(); } catch { return toast(t('triviaFailed')); }
  $('livesSheet').hidden = true;
  L = null; startLesson('trivia', triviaExercises(earn ? 5 : 8), { practice: true, earnLife: earn });
}
function heroBar() {
  const r = rankOf(S.xp), box = el('div', 'hero-bar'), face = el('div', 'hero-face'), info = el('div', 'hero-info'), bar = el('div', 'hero-progress'), fill = el('div');
  face.innerHTML = mascot('happy');
  fill.style.width = `${r.to ? Math.round(((S.xp - r.from) / (r.to - r.from)) * 100) : 100}%`; bar.append(fill);
  info.append(el('div', 'hero-rank', t('rankLine', r.level, r.name)), bar, Object.assign(el('div', 'hero-xp', r.to ? `${S.xp} / ${r.to} XP` : `${S.xp} XP`), { dir: 'ltr' }));
  box.append(face, info); return box;
}
// The lesson and its end screen take the colors of the region they belong to.
function paintRegion(part) {
  const r = REGIONS[part] || REGIONS[3];
  for (const id of ['lesson', 'end']) for (const [k, v] of Object.entries({ '--r-ground': r.ground, '--r-panel': r.panel, '--r-accent': r.accent, '--accent': r.accent, '--on-accent': REGION_ON_ACCENT, '--bg': r.ground, '--surface': r.panel, '--soft': r.panel, '--muted': REGION_MUTE, '--ink': REGION_INK, '--line': '#ffffff33', '--line-strong': '#ffffff55' })) $(id).style.setProperty(k, v);
}
const unitOfKey = key => { const m = /^u(\d+)-/.exec(key); return COURSE.find(u => u.unit === (m ? +m[1] : /^(L\d|c1|boss)$/.test(key) ? 1 : -1)); };
// The command a lesson teaches first is the power it gives.
const powerOf = (unit, lesson) => { const cmd = unit?.lessons?.[lesson]?.exercises.find(e => e.type === 'teach')?.cmd; return cmd && cmd.length <= 12 ? cmd : ''; };
function regionBlock(part, first) {
  const r = REGIONS[part], box = el('section', 'region');
  for (const [k, v] of Object.entries({ ground: r.ground, panel: r.panel, accent: r.accent })) box.style.setProperty(`--r-${k}`, v);
  box.dataset.part = part;
  const h = el('h2', `part-header${first ? ' sr' : ''}`, tr(r.name)); h.dataset.part = part;
  box.append(h);
  return box;
}
// The region you are in stays on screen: moon, name and land above, your lives and rank on the same ground.
function worldStage() {
  const box = el('div', 'stage'), copy = el('div', 'stage-copy'), rows = el('div', 'stage-rows');
  box.id = 'stage';
  copy.append(Object.assign(el('div', 'stage-name'), { ariaHidden: 'true' }), el('p', 'stage-blurb'));
  rows.append(heroBar());
  box.append(el('div', 'stage-scenes'), copy, rows);
  return box;
}
function paintStage(part, fade) {
  const box = $('stage'); if (!box || +box.dataset.part === part) return;
  const r = REGIONS[part], scenes = box.querySelector('.stage-scenes'), copy = box.querySelector('.stage-copy'), layer = el('div', 'stage-layer'), name = copy.firstChild;
  box.dataset.part = part;
  box.style.setProperty('--r-ground', r.ground); box.style.setProperty('--accent', r.accent); FIELD.tint(r.accent);
  name.textContent = tr(r.name); name.classList.toggle('long', tr(r.name).length > 11); copy.lastChild.textContent = tr(r.blurb);
  layer.innerHTML = regionScene(part);
  while (scenes.children.length > (fade ? 1 : 0)) scenes.firstChild.remove();
  scenes.append(layer);
  if (!fade) return;
  const motion = { duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' };
  copy.animate({ opacity: [0, 1] }, motion);
  layer.animate({ opacity: [0, 1] }, motion).onfinish = () => { if (layer.isConnected) while (scenes.firstChild !== layer) scenes.firstChild.remove(); };
}
function syncStage(fade = true) {
  const box = $('stage'); if (!box?.offsetHeight) return;
  const line = box.getBoundingClientRect().bottom + 1; let part;
  for (const region of document.querySelectorAll('#path .region')) { if (!part || region.getBoundingClientRect().top <= line) part = +region.dataset.part; else break; }
  if (part) paintStage(part, fade);
}
const FIELD = startField($('pathField'));
let stageFrame = 0;
addEventListener('scroll', () => { stageFrame ||= requestAnimationFrame(() => { stageFrame = 0; syncStage(); }); }, { passive: true });
// The top row belongs to the scene on the path, and to the page on every other tab.
function dockBar() {
  const bar = document.querySelector('.topbar'), stage = $('stage');
  if (stage && $('learn').classList.contains('active')) stage.querySelector('.stage-rows').prepend(bar);
  else document.querySelector('.app').prepend(bar);
}
// Lines between the path's nodes, measured after layout so they follow any screen width.
function drawTraces() {
  for (const list of document.querySelectorAll('#path .nodes')) {
    list.querySelector('.traces')?.remove();
    const box = list.getBoundingClientRect(); if (!box.width) continue;
    const nodes = [...list.querySelectorAll('.node')].map(n => { const q = n.getBoundingClientRect(); return { x: q.left - box.left + q.width / 2, y: q.top - box.top + q.height / 2, done: n.classList.contains('done') }; });
    const svg = nodes.slice(1).map((n, i) => `<path class="${nodes[i].done ? 'lit' : ''}" d="M${nodes[i].x} ${nodes[i].y}L${n.x} ${n.y}"/>`).join('');
    list.insertAdjacentHTML('afterbegin', `<svg class="traces" width="${box.width}" height="${box.height}" aria-hidden="true">${svg}</svg>`);
  }
}
addEventListener('resize', () => drawTraces());
function renderPath() {
  document.querySelector('.app').prepend(document.querySelector('.topbar'));
  const root = $('path'); root.innerHTML = '';
  $('trackName').textContent = TRACK_SHORT[S.track] || t('trackAll');
  const units = COURSE.filter(u => inTrack(u));
  const order = units.filter(u => !u.locked).flatMap(unitNodes);
  const current = order.find(n => !S.done.includes(n.key))?.key;
  root.append(worldStage());
  let part, region;
  for (const unit of units) {
    if (unit.section !== part) { part = unit.section; region = regionBlock(part, !region); root.append(region); }
    const banner = el('div', `unit-banner ${unit.color}${unit.locked ? ' locked' : ''}`);
    const txt = el('div'); txt.append(el('div', 'unit-kicker', t('kicker', unit.section, unit.unit)), el('h2', '', tr(unit.title)), el('div', 'unit-sub', tr(unit.subtitle)));
    const exams = [['L', 'LPIC-1'], ['R', 'RHCSA'], ['F', 'LFCS']].filter(([k]) => unit.exams?.some(e => e.startsWith(k)));
    if (exams.length) { const chips = el('div', 'exam-chips'); for (const [, name] of exams) chips.append(el('span', 'exam-chip', name)); txt.append(chips); }
    const book = el('div', 'unit-book'); book.append(icon(unit.locked ? 'lock' : 'book')); banner.append(txt, book); region.append(banner);
    const list = el('ol', 'nodes');
    const nodes = unit.locked ? NODE_PLAN.map(([id, kind]) => ({ key: unitKey(unit, id), kind: kind === 'boss' ? 'boss' : 'lesson', unit, lockedUnit: true })).filter(n => n.key !== unitKey(unit, 'c1')) : unitNodes(unit);
    let lessonNo = 0;
    nodes.forEach((n, i) => {
      const li = el('li', 'node-row'); li.style.setProperty('--x', `${OFFSETS[i % OFFSETS.length]}px`);
      const state = n.lockedUnit ? 'locked' : S.done.includes(n.key) ? 'done' : n.key === current ? 'current' : 'locked';
      const b = el('button', `node ${n.kind} ${state}`); b.type = 'button';
      if (n.kind === 'boss' && state !== 'done') b.textContent = '$_'; else b.replaceChildren(icon(state === 'done' && n.kind !== 'chest' ? ICONS.done : state === 'locked' && n.kind === 'lesson' ? ICONS.lock : ICONS[n.kind]));
      if (n.kind === 'boss') b.dir = 'ltr';
      if (n.kind === 'lesson') b.append(el('span', 'node-num', String(++lessonNo)));
      b.setAttribute('aria-label', n.lockedUnit ? (n.kind === 'lesson' ? `${lessonNo} · ${t('locked')}` : t('locked')) : n.kind === 'lesson' ? t('lessonN', n.i + 1, tr(unit.lessons[n.i].title)) : n.kind === 'chest' ? t('chest') : n.kind === 'exam' ? tr(unit.title) : tr(unit.boss.title));
      b.onclick = () => openPop(b, n, state);
      if (state === 'current') { const tip = el('div', 'start-tip', n.kind === 'chest' ? t('open') : t('start')); li.append(tip); li.classList.add('tipped'); }
      li.append(b);
      if (n.kind === 'lesson' && (state === 'done' || state === 'current') && powerOf(unit, n.i)) li.append(Object.assign(el('span', 'node-power', powerOf(unit, n.i)), { dir: 'ltr' }));
      if (i === 2 && !unit.locked) { const m = el('div', 'path-mascot'); m.innerHTML = mascot(S.done.includes(n.key) ? 'happy' : 'idle'); li.append(m); }
      list.append(li);
    });
    region.append(list);
  }
  drawTraces();
  renderTop();
  paintStage(+root.querySelector('.region')?.dataset.part, false); dockBar(); syncStage(false);
}
function openPop(anchor, n, state) {
  closePop(); SFX.tap();
  const unit = n.unit, pop = el('div', `pop ${state}`); pop.id = 'pop'; pop.setAttribute('role', 'dialog');
  if (state === 'locked') { pop.append(el('h3', '', n.lockedUnit ? tr(unit.title) : t('notYet')), el('p', '', n.lockedUnit ? t('lockedUnitText') : t('notYetText'))); }
  else if (n.kind === 'chest') {
    pop.append(el('h3', '', state === 'done' ? t('chestOpened') : t('chest')), el('p', '', state === 'done' ? t('chestDone') : t('chestText')));
    if (state === 'current') { const go = el('button', 'btn primary', t('chestBtn')); go.onclick = () => openChest(n.key); pop.append(go); }
  } else if (n.kind === 'exam') {
    const x = unit.exam;
    pop.append(el('h3', '', tr(unit.title)), el('p', '', t('examInfo', x.count, x.minutes, Math.round(x.pass * 100))));
    const go = el('button', 'btn primary', state === 'done' ? t('examAgain') : t('startExam'));
    go.onclick = () => { closePop(); startExam(unit, n.key); };
    pop.append(go);
  } else {
    const title = tr(n.kind === 'boss' ? unit.boss.title : unit.lessons[n.i].title);
    pop.append(el('h3', '', title), el('p', '', n.kind === 'boss' ? tr(unit.boss.intro || unit.boss.text) : t('lessonOf', n.i + 1, unit.lessons.length)));
    const go = el('button', 'btn primary', state === 'done' ? t('again') : n.kind === 'boss' ? t('toBoss') : t('startXp'));
    go.onclick = () => { closePop(); syncLives(); if (S.lives === 0 && state !== 'done') return openLives(); n.kind === 'boss' ? startBoss(unit, n.key) : startLesson(n.key, withFixture(unit, unit.lessons[n.i].exercises), { title, replay: state === 'done' }); };
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
  paintRegion(unitOfKey(key)?.section);
  $('lesson').hidden = false; document.body.classList.add('in-lesson'); next();
}
function startBoss(unit, key) {
  if (unit.boss.exercises) return startLesson(key, withFixture(unit, unit.boss.exercises), { boss: true });
  const boss = bossFixture();
  startLesson(key, [{ type: 'boss', prompt: unit.boss.text(boss.hideIn), boss }], { boss: true });
}
// A mock exam draws questions from every unit tagged for the exam. It first takes one question per objective tag
// (L101.1, E013.2, C1.3 ...) so every objective is asked, then fills up at random. No teach cards and no live terminals.
function buildExam(tag, count) {
  const units = COURSE.filter(u => !u.locked && !u.exam && u.exams?.some(e => e.startsWith(tag)));
  const pool = units.flatMap(u => withFixture(u, [...u.lessons.flatMap(l => l.exercises), ...(u.boss.exercises || [])]).filter(ex => !['teach', 'terminal', 'boss'].includes(ex.type)).map(ex => ({ ...ex, topic: u.title, objs: u.exams.filter(e => e.startsWith(tag)) })));
  const picked = new Set();
  for (const obj of [...new Set(pool.flatMap(ex => ex.objs))]) { const options = shuffle(pool.filter(ex => ex.objs.includes(obj) && !picked.has(ex))); if (options.length) picked.add(options[0]); }
  for (const ex of shuffle(pool)) { if (picked.size >= count) break; picked.add(ex); }
  return shuffle([...picked]).slice(0, count);
}
function startExam(unit, key, count = unit.exam.count) {
  startLesson(key, buildExam(unit.exam.tag, count), { exam: unit.exam, results: [] });
  if (unit.exam.minutes) {
    const end = Date.now() + unit.exam.minutes * 60000;
    const tick = () => { if (!L?.opts.exam) return clearInterval(L?.timer); const left = Math.max(0, Math.round((end - Date.now()) / 1000)); $('comboTag').textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; if (!left) finishLesson(); };
    L.timer = setInterval(tick, 1000); tick();
  }
}
function next() {
  if (!L.queue.length) return finishLesson();
  L.ex = L.queue.shift(); L.answered = false; L.value = null;
  const ex = L.ex;
  $('bar').style.width = `${((L.opts.exam ? L.correct + L.mistakes : L.correct) / Math.max(1, L.total)) * 100}%`;
  $('exTag').textContent = L.opts.exam ? t('examQ', L.total - L.queue.length, L.total) : ex.type === 'teach' ? t(ex.known ? 'knownCmd' : 'newCmd') : ex.retry ? t('retry') : '';
  $('exTag').className = `ex-tag${ex.type === 'teach' ? ' new' : ex.retry ? ' retry' : ''}`;
  $('exPrompt').replaceChildren(ex.type === 'teach' ? '' : bidi(laidOut(ex, tr(ex.prompt))));
  $('exPrompt').hidden = ex.type === 'teach';
  const body = $('exBody'); body.innerHTML = ''; body.className = `ex-body ${ex.type}`;
  setFoot('idle'); RENDER[ex.type](body, ex);
  $('lessonMain').scrollTop = 0;
}
// The owner's layout fixes: only spaces and line breaks may differ from the text in the course, so a saved fix
// that no longer matches (the text was rewritten since) is ignored.
const bare = s => String(s).replace(/[\s\u200E]+/g, '');
const editKey = ex => `${ex.uid}:${ex.type === 'teach' ? 'text' : 'prompt'}`;
const editable = ex => tr(ex.type === 'teach' ? ex.text : ex.prompt);
function laidOut(ex, text) { const fix = S.layout[editKey(ex)]; return fix && bare(fix) === bare(text) ? fix : text; }
function openEditor() {
  if (!L?.ex) return;
  const ex = L.ex, original = editable(ex), box = $('edText'), note = $('edNote');
  let good = laidOut(ex, original);
  box.value = good; note.value = ''; $('edHint').hidden = true;
  const preview = () => $('edPreview').replaceChildren(bidi(box.value));
  box.oninput = () => { if (bare(box.value) === bare(original)) { good = box.value; $('edHint').hidden = true; } else { const at = box.selectionStart; box.value = good; box.selectionStart = box.selectionEnd = Math.min(at, good.length); $('edHint').hidden = false; } preview(); };
  preview();
  $('edCancel').onclick = () => { $('editor').hidden = true; };
  $('edSave').onclick = () => {
    const saved = laidOut(ex, original);
    if (good !== original) S.layout[editKey(ex)] = good; else delete S.layout[editKey(ex)];
    if (note.value.trim()) S.reports.push({ uid: ex.uid, type: ex.type, lang: LANG, text: good, note: note.value.trim() });
    save(); $('editor').hidden = true; showPrompt(ex);
    if (note.value.trim()) toast(t('edReported'));
    if (good === saved || good === original) return;
    const body = `<!-- layout-fix -->\n**Exercise:** \`${ex.uid}\` (${ex.type}), language ${LANG}\n\nOnly spaces and line breaks changed. Submitting this applies it to the course automatically.\n\n**Before:**\n\`\`\`\n${original}\n\`\`\`\n\n**After** (⏎ marks a line break):\n\`\`\`\n${good.replace(/\n/g, '⏎\n')}\n\`\`\`\n\n\`\`\`json\n${JSON.stringify({ uid: ex.uid, lang: LANG, original, layout: good })}\n\`\`\`\n`;
    window.open(`https://github.com/SaharHalili95/linux-master/issues/new?${new URLSearchParams({ title: `Layout fix: ${ex.uid}`, labels: 'question-report', body })}`, '_blank', 'noopener');
  };
  showReports();
  $('editor').hidden = false; box.focus({ preventScroll: true });
}
// Problem notes stay on this device until the owner shares them all at once, so reporting needs no account.
function showReports() {
  const n = S.reports.length;
  $('edReports').hidden = !n; $('edShare').textContent = t('edShare', n);
}
async function shareReports() {
  const text = `Linux Master question reports (${S.reports.length})\n\n${S.reports.map((r, i) => `${i + 1}. ${r.uid} (${r.type}, ${r.lang})\nText: ${r.text}\nNote: ${r.note}\n`).join('\n')}`;
  try {
    if (navigator.share) await navigator.share({ title: 'Linux Master question reports', text });
    else { await navigator.clipboard.writeText(text); toast(t('edCopied')); }
  } catch { /* the share sheet was closed */ }
}
function showPrompt(ex) {
  $('exPrompt').replaceChildren(ex.type === 'teach' ? '' : bidi(laidOut(ex, tr(ex.prompt))));
  const teachText = document.querySelector('.bubble p'); if (ex.type === 'teach' && teachText) teachText.replaceChildren(bidi(laidOut(ex, tr(ex.text))));
}
function setCan(ok) { $('checkBtn').disabled = !ok; }
function setFoot(mode, title = '', { label = '', sol = '', note = '' } = {}) {
  const foot = $('foot'); foot.className = `lesson-foot ${mode}`;
  $('fbTitle').textContent = title; $('fbBox').hidden = mode === 'idle';
  const detail = $('fbDetail'); detail.innerHTML = '';
  if (sol) { const row = el('div', 'fb-sol', label); const c = el('pre', 'cmd', sol); c.dir = 'ltr'; row.append(c); detail.append(row); }
  if (note) { const n = el('div', 'fb-note'); n.append(bidi(note)); detail.append(n); }
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
  // In an exam nothing is revealed until the end, and wrong answers do not come back or go to practice.
  if (L.opts.exam) {
    if (ok) L.correct++; else L.mistakes++;
    L.opts.results.push({ ok, topic: L.ex.topic });
    setFoot('saved', t('examSaved')); setCan(true); $('checkBtn').focus({ preventScroll: true });
    return;
  }
  if (ok) {
    L.correct++; L.combo++; L.best = Math.max(L.best, L.combo); SFX.good();
    const praise = t('praise');
    setFoot('good', L.combo >= 3 ? t('inARow', L.combo) : praise[Math.floor(Math.random() * praise.length)], { label: t('solution'), sol: L.ex.type === 'match' || L.ex.plain ? '' : solution });
  } else {
    L.mistakes++; L.combo = 0; SFX.bad(); if (!L.opts.practice && !L.opts.replay) loseLife();
    L.queue.push({ ...L.ex, retry: true });
    if (!S.mistakes.includes(L.ex.uid) && !L.opts.boss) S.mistakes.push(L.ex.uid);
    setFoot('bad', t('correctAnswer'), ['terminal', 'scenario'].includes(L.ex.type) ? { sol: solution } : L.ex.plain ? { note: why ? `${solution}\n${why}` : solution } : { sol: solution, note: why });
    $('lessonMain').classList.remove('shake'); void $('lessonMain').offsetWidth; $('lessonMain').classList.add('shake');
  }
  if (ok && L.ex.retry) S.mistakes = S.mistakes.filter(id => id !== L.ex.uid);
  $('bar').style.width = `${(L.correct / Math.max(1, L.total)) * 100}%`;
  $('comboTag').replaceChildren(...(L.combo >= 2 ? [icon('flame'), ` ${L.combo}`] : []));
  setCan(true); $('checkBtn').focus({ preventScroll: true }); save();
}
function quitLesson() { if (L && (L.correct || L.mistakes) && !confirm(t('quitConfirm'))) return; closeOverlays(); }
function closeOverlays() { clearInterval(L?.timer); ['lesson', 'end', 'streakScreen', 'editor'].forEach(id => { $(id).hidden = true; }); document.body.classList.remove('in-lesson'); $('comboTag').textContent = ''; L = null; showTab('learn'); }

// ---------- Exercise renderers ----------
function optionButton(label, value, mono, onPick, index) {
  const b = el('button', 'opt'); b.type = 'button'; b.dataset.value = value;
  const k = el('span', 'key', String(index + 1)); const t = mono ? code(label) : el('span'); if (!mono) t.append(bidi(label));
  b.append(k, t); b.onclick = () => { SFX.tap(); onPick(b); }; return b;
}
function pickOne(root) { return b => { if (L.answered) return; root.querySelectorAll('.opt').forEach(o => o.classList.toggle('sel', o === b)); L.value = b.dataset.value; setCan(true); }; }
const sameCmd = c => c.trim().replace(/\s+/g, ' ');
// The starting files a list of commands reads, as cards: the "before" a learner needs to understand the output.
function filePeeks(fx, cmds) {
  const start = new Shell(fx()), sh = new Shell(fx()), peek = new Map();
  for (const c of cmds) {
    for (const word of c.split(/[\s|;&<>]+/)) { const p = word && sh.abs(word); if (p && start.files.has(p) && !peek.has(p) && start.files.get(p).link === undefined) peek.set(p, [word, start.files.get(p).content]); }
    try { sh.run(c); } catch { /* unsupported commands only change what is shown */ }
  }
  return [...peek.values()].map(([name, content]) => { const card = el('div', 'file-peek'); card.append(el('div', 'file-peek-h', t('fileHas', name)), Object.assign(el('pre', '', content.replace(/\n$/, '') || t('emptyFile')), { dir: 'ltr' })); return card; });
}
function outputOptions(root, right, wrong) {
  const options = shuffle([right, ...[...new Set(wrong.filter(w => w !== right))].slice(0, 3)]);
  const list = el('div', 'opts outputs'); const pick = pickOne(list);
  options.forEach((o, i) => { const b = optionButton('', o, false, pick, i); b.lastChild.replaceWith(Object.assign(el('pre', 'out-opt', o || t('noOutput')), { dir: 'ltr' })); list.append(b); });
  root.append(list);
}
function termBlock(lines) {
  const t = el('div', 'term'); t.dir = 'ltr';
  for (const [prompt, cmd, out] of lines) { const row = el('div', 'term-line'); row.append(el('span', 'ps1', prompt), el('span', 'typed', cmd)); t.append(row); if (out) t.append(el('pre', 'term-out', out)); }
  return t;
}
const RENDER = {
  teach(root, ex) {
    const card = el('div', 'teach-card');
    const head = el('div', 'teach-head'); const m = el('div', 'teach-mascot'); m.innerHTML = mascot('happy');
    const bubble = el('div', 'bubble'); const para = el('p'); para.append(bidi(laidOut(ex, tr(ex.text)))); const title = code(ex.cmd); title.classList.toggle('long', ex.cmd.length > 14); bubble.append(title, el('div', 'teach-name', ex.name), para);
    head.append(m, bubble); card.append(head);
    if (ex.demo) {
      const [setup, cmd] = ex.demo, sh = new Shell(ex.fx()), lines = [];
      for (const c of setup) { lines.push([promptFor(sh.cwd), c, '']); sh.run(c); }
      const ps1 = promptFor(sh.cwd), r = sh.run(cmd); lines.push([ps1, cmd, (r.out + r.err).replace(/\n$/, '')]);
      const before = filePeeks(ex.fx, [...setup, cmd]);
      if (before.length) card.append(el('div', 'demo-label', t('before')), ...before);
      card.append(el('div', 'demo-label', before.length ? t('after') : t('tryIt')), termBlock(lines));
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
  sentence(root, ex) {
    const [head, tail] = tr(ex.text).split('___');
    const line = el('p', 'sentence'); const slot = Object.assign(el('span', 'slot', '   '), { dir: 'ltr' });
    // The blank stays on one line with the word before it and the punctuation after it.
    const before = head.match(/\S+\s*$/)?.[0] || '', after = tail.match(/^[.,:;?!]+/)?.[0] || '', glue = el('span', 'glued');
    glue.append(bidi(before), slot, after);
    line.append(bidi(head.slice(0, head.length - before.length)), glue, bidi(tail.slice(after.length)));
    const chips = el('div', 'chips');
    shuffle(ex.options).forEach(o => { const c = el('button', 'tile', o); c.type = 'button'; c.dir = 'ltr'; c.onclick = () => { if (L.answered) return; SFX.tap(); chips.querySelectorAll('.tile').forEach(t => t.classList.toggle('sel', t === c)); slot.textContent = o; slot.classList.add('filled'); L.value = o; setCan(true); }; chips.append(c); });
    root.append(line, chips);
  },
  scenario(root, ex) {
    if (ex.rec) { const rec = RECORDED[ex.rec]; root.append(el('div', 'rec-label', t('recordedOn', rec.distro)), termBlock([[promptFor('/home/user'), rec.cmd, rec.out.replace(/\n$/, '')]])); }
    const row = el('div', 'code-row stack'); const lab = el('label', '', t('typeCmd')); lab.htmlFor = 'scenarioCmd';
    const input = el('input'); input.id = 'scenarioCmd'; input.dir = 'ltr'; input.autocomplete = 'off'; input.autocapitalize = 'off'; input.spellcheck = false;
    input.oninput = () => { L.value = input.value; setCan(!!input.value.trim()); };
    input.onkeydown = e => { if (e.key === 'Enter' && input.value.trim()) { e.preventDefault(); onFootButton(); } };
    row.append(lab, input); root.append(row);
  },
  output(root, ex) {
    if (ex.rec) {
      const rec = RECORDED[ex.rec];
      root.append(el('div', 'rec-label', t('recordedOn', rec.distro)), termBlock([[promptFor('/home/user'), rec.cmd, '?']]));
      ex.solution = rec.out;
      return outputOptions(root, rec.out, [...(ex.wrongRec || []).map(id => RECORDED[id].out), ...(ex.wrongText || [])]);
    }
    const fx = ex.fx, real = runIn(ex.setup, ex.cmd, fx());
    // Show every starting file the commands read, so the answer never depends on content the learner has not seen.
    const lines = [], sh = new Shell(fx());
    for (const c of [...(ex.setup || []), ex.cmd]) { if (c === ex.cmd) lines.push([promptFor(sh.cwd), c, '?']); else { lines.push([promptFor(sh.cwd), c, '']); sh.run(c); } }
    root.append(...filePeeks(fx, [...(ex.setup || []), ex.cmd]), termBlock(lines));
    ex.solution = real.out;
    outputOptions(root, real.out, [...(ex.wrongCmds || []).map(c => runIn(ex.setup, c, fx()).out), ...(ex.wrongText || [])]);
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
  terminal(root, ex) {
    if (ex.peek) root.append(...filePeeks(ex.fx, [...(ex.setup || []), ...ex.solve]));
    mountTerminal(root, ex, new Shell(ex.fx()));
    if (!ex.ask) return;
    // Counting tasks end with typing the number, so a learner has to read the result, not only run a command.
    const sh = new Shell(ex.fx()); for (const c of [...(ex.setup || []), ...ex.solve]) L.expected = sh.run(c).out;
    L.expected = L.expected.match(/\d+/)[0]; L.ask = '';
    const row = el('div', 'code-row'); const lab = el('label', '', tr(ex.ask)); lab.htmlFor = 'askAnswer';
    const input = el('input'); input.id = 'askAnswer'; input.dir = 'ltr'; input.inputMode = 'numeric'; input.autocomplete = 'off';
    input.oninput = () => { L.ask = input.value.trim(); setCan(!!L.ask); };
    input.onkeydown = e => { if (e.key === 'Enter' && L.ask) { e.preventDefault(); onFootButton(); } };
    row.append(lab, input); root.append(row);
  },
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
// Commands typed in any terminal this visit, so ↑ can bring back one from an earlier task too.
const TERM_HISTORY = [];
// Completes the last word as a file or folder name, like Tab in bash. Several matches are filled up to what they
// share, and listed.
function completeWord(sh, value) {
  const word = value.match(/[^\s|;&<>]*$/)[0], cut = word.lastIndexOf('/') + 1, base = word.slice(cut);
  const dir = sh.abs(word.slice(0, cut) || '.');
  if (!sh.dirs.has(dir)) return { value, list: [] };
  const names = [...sh.dirs, ...sh.files.keys()].filter(p => p !== dir && sh.parent(p) === dir).map(p => p.slice(p.lastIndexOf('/') + 1))
    .filter(n => n.startsWith(base) && (base.startsWith('.') || !n.startsWith('.'))).sort();
  if (!names.length) return { value, list: [] };
  const isDir = n => sh.dirs.has(dir === '/' ? `/${n}` : `${dir}/${n}`);
  let common = names[0];
  for (const n of names) while (!n.startsWith(common)) common = common.slice(0, -1);
  const done = names.length === 1 ? names[0] + (isDir(names[0]) ? '/' : ' ') : common;
  return { value: value.slice(0, value.length - base.length) + done, list: names.length > 1 ? names.map(n => n + (isDir(n) ? '/' : '')) : [] };
}
function mountTerminal(root, ex, sh, onRun = () => {}) {
  for (const c of ex.setup || []) sh.run(c);
  const log = []; L.term = { sh, log };
  const box = el('div', 'term live'); box.dir = 'ltr'; const out = el('div', 'term-scroll');
  const form = el('form', 'term-input'); const ps = el('span', 'ps1', promptFor(sh.cwd));
  const input = el('textarea'); input.rows = 1; input.setAttribute('aria-label', t('command')); input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('autocapitalize', 'off'); input.setAttribute('autocorrect', 'off'); input.enterKeyHint = 'send'; input.placeholder = t('command');
  form.append(ps, input); box.append(out, form);
  // The field is a textarea so a long command wraps instead of being cut; the first line starts after the prompt.
  const grow = () => { input.style.height = 'auto'; input.style.height = `${input.scrollHeight}px`; box.scrollTop = box.scrollHeight; };
  const fit = () => { input.style.textIndent = `${ps.offsetWidth + 8}px`; grow(); };
  const seen = new ResizeObserver(() => requestAnimationFrame(fit)); seen.observe(ps); seen.observe(box);
  let back = TERM_HISTORY.length;
  const recall = step => {
    back = Math.min(TERM_HISTORY.length, Math.max(0, back + step));
    input.value = TERM_HISTORY[back] ?? ''; input.setSelectionRange(input.value.length, input.value.length); grow();
  };
  const tab = () => {
    const { value, list } = completeWord(sh, input.value);
    input.value = value; input.setSelectionRange(value.length, value.length); grow();
    if (list.length > 1) { out.append(el('pre', 'term-out', list.join('  '))); box.scrollTop = box.scrollHeight; }
  };
  input.onkeydown = e => {
    const act = { Tab: tab, ArrowUp: () => recall(-1), ArrowDown: () => recall(1) }[e.key];
    if (act) { e.preventDefault(); act(); }
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); run(); }
  };
  // A phone keyboard may insert the new line without a usable key event, and a paste can carry several.
  input.oninput = () => {
    const v = input.value;
    if (v.includes('\n')) { input.value = v.replace(/\n+$/, '').replace(/\n/g, ' '); if (v.endsWith('\n')) { run(); return; } }
    grow();
  };
  // Phone keyboards have no Tab or arrow keys. pointerdown is cancelled so the keyboard stays open.
  const keys = el('div', 'term-keys');
  const key = (cls, label, act, name) => {
    const b = el('button', cls, label); b.type = 'button'; b.setAttribute('aria-label', t(name));
    b.onpointerdown = e => e.preventDefault(); b.onclick = () => { act(); input.focus({ preventScroll: true }); };
    return b;
  };
  // Back to how the task began: a wrong cd or rm can make even the right answer fail.
  const restart = key('term-key restart', t('termRestart'), () => {
    if (L.answered) return;
    sh = new Shell(ex.fx()); for (const c of ex.setup || []) sh.run(c);
    L.term.sh = sh; log.length = 0; out.replaceChildren(); input.value = ''; ps.textContent = promptFor(sh.cwd); grow();
    L.value = ''; restart.hidden = true; if (ex.type === 'terminal' && !ex.ask) setCan(false); onRun(log);
  }, 'termRestart');
  restart.hidden = true;
  keys.append(key('term-key kb', 'Tab', tab, 'keyTab'), restart, key('term-key kb', '↑', () => recall(-1), 'keyUp'), key('term-key kb', '↓', () => recall(1), 'keyDown'));
  box.append(keys);
  form.onsubmit = e => { e.preventDefault(); run(); };
  function run() {
    const cmd = input.value.replace(/[\u201c\u201d\u201e]/g, '"').replace(/[\u2018\u2019]/g, "'").trim(); input.value = ''; grow(); if (!cmd || L.answered) return;
    const row = el('div', 'term-line'); row.append(el('span', 'ps1', promptFor(sh.cwd)), el('span', 'typed', cmd)); out.append(row);
    let text;
    try { const r = sh.run(cmd); text = (r.out + r.err).replace(/\n$/, ''); } catch (err) { text = err instanceof ShellUnsupported ? t('unsupported', cmd.split(/\s+/)[0]) : String(err.message); }
    if (text) out.append(el('pre', 'term-out', text));
    log.push({ cmd, out: text }); if (TERM_HISTORY.at(-1) !== cmd) TERM_HISTORY.push(cmd); back = TERM_HISTORY.length;
    ps.textContent = promptFor(sh.cwd); box.scrollTop = box.scrollHeight;
    restart.hidden = !ex.fx;
    L.value = log.map(l => l.cmd).join(' ; '); if (ex.type === 'terminal' && !ex.ask) setCan(true); onRun(log);
  }
  if (ex.hint) { const h = el('button', 'hint-link', t('hint')); h.type = 'button'; h.onclick = () => { h.replaceWith(el('div', 'hint', tr(ex.hint))); }; root.append(box, h); } else root.append(box);
  // Never steal focus from a field the learner already moved to.
  setTimeout(() => { if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) input.focus({ preventScroll: true }); }, 50);
}
// iPhone keeps the page under the keyboard: while typing in the terminal the lesson takes only the visible part, so the terminal sits right above the keys.
function fitLesson() {
  const vv = window.visualViewport, box = $('lesson');
  const on = !!vv && !box.hidden && vv.scale < 1.05 && innerHeight - vv.height > 120 && !!document.activeElement?.closest('.term-input');
  box.classList.toggle('typing', on);
  box.style.height = on ? `${vv.height}px` : ''; box.style.top = on ? `${vv.offsetTop}px` : ''; box.style.bottom = on ? 'auto' : '';
  if (on) { const term = box.querySelector('.term.live'); term.scrollTop = term.scrollHeight; }
}
visualViewport?.addEventListener('resize', fitLesson); visualViewport?.addEventListener('scroll', fitLesson);
$('lesson').addEventListener('focusin', fitLesson); $('lesson').addEventListener('focusout', () => setTimeout(fitLesson));
const CHECK = {
  choice: (ex, v) => ex.plain ? { ok: v === '0', solution: tr(ex.options[0]), why: tr(ex.why?.[v]) || '' } : { ok: v === ex.answer, solution: ex.answer, why: tr(ex.why?.[v]) || '' },
  sentence: (ex, v) => ({ ok: v === ex.answer, solution: tr(ex.text).replace('___', ex.answer) }),
  fill: (ex, v) => ({ ok: v === ex.answer, solution: `${ex.before}${ex.answer}${ex.after}` }),
  output: (ex, v) => ({ ok: v === ex.solution, solution: ex.solution || t('noOutput') }),
  tiles: (ex, v) => ({ ok: [ex.answer, ...(ex.accept || [])].includes(v), solution: ex.answer }),
  scenario: (ex, v) => ({ ok: ex.accept.map(sameCmd).includes(sameCmd(v)), solution: ex.accept[0] }),
  terminal: ex => ({ ok: ex.goal(L.term.sh, L.term.log) && (!ex.ask || L.ask === L.expected), solution: ex.ask ? `${ex.solve.join('\n')}\n${tr(ex.ask)} ${L.expected}` : ex.solve.join('\n') }),
  boss: (ex, v) => ({ ok: v === ex.boss.word, solution: t('bossSolution', ex.boss.word, ex.boss.hideIn), why: t('bossWhy', ex.boss.hideIn) }),
};

// ---------- End of lesson ----------
function winMoment(part, rankBefore, power) {
  const moon = $('endMoon'), now = rankOf(S.xp), r = part || 3, up = now.level > rankBefore;
  moon.innerHTML = `<svg viewBox="0 0 390 250" aria-hidden="true">${moonSvg(r, 195, 118, 96, 'w')}</svg>`;
  $('endRank').textContent = up ? t('rankUp', now.name) : power ? t('newPower', power) : ''; $('endRank').dir = 'auto';
}
function finishExam() {
  clearInterval(L.timer);
  const rankBefore = rankOf(S.xp).level;
  const x = L.opts.exam, score = L.correct / Math.max(1, L.total), passed = score >= x.pass, secs = Math.round((Date.now() - L.start) / 1000);
  const misses = {}; for (const r of L.opts.results) if (!r.ok) misses[tr(r.topic)] = (misses[tr(r.topic)] || 0) + 1;
  const weakest = Object.entries(misses).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  if (passed) { S.xp += 50; if (!S.done.includes(L.key)) S.done.push(L.key); }
  save();
  $('lesson').hidden = true; $('end').hidden = false; $('comboTag').textContent = '';
  $('endMascot').innerHTML = mascot(passed ? 'party' : 'idle');
  winMoment(unitOfKey(L.key)?.section, rankBefore, '');
  $('endTitle').textContent = passed ? t('examPassed') : t('examFailed');
  $('endXp').textContent = passed ? 50 : 0; $('endAcc').textContent = `${Math.round(score * 100)}%`;
  $('endTime').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  $('endQuests').textContent = weakest.length ? t('examReview', weakest.join(', ')) : '';
  $('endBtn').onclick = closeOverlays;
  if (passed) { SFX.win(); confetti(); }
  $('endBtn').focus();
}
function finishLesson() {
  if (L.opts.exam) return finishExam();
  const rankBefore = rankOf(S.xp).level, wasDone = S.done.includes(L.key);
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
  winMoment(unitOfKey(L.key)?.section, rankBefore, wasDone || L.opts.practice ? '' : powerOf(unitOfKey(L.key), +(/L(\d)$/.exec(L.key)?.[1] ?? -1)));
  $('endTitle').textContent = L.opts.boss ? t('bossWon') : perfect ? t('perfect') : t('done');
  $('endXp').textContent = xp; $('endAcc').textContent = `${Math.round((L.correct / Math.max(1, L.correct + L.mistakes)) * 100)}%`;
  $('endTime').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const earned = L.opts.earnLife && L.correct >= 3; if (earned) addLife();
  $('endQuests').textContent = L.opts.earnLife ? t(earned ? 'lifeEarned' : 'lifeNotEarned') : newly.length ? t('questsDone', newly.length) : '';
  $('endBtn').onclick = () => firstToday ? showStreak() : closeOverlays();
  SFX.win(); confetti(); $('endBtn').focus();
}
function showStreak() {
  $('end').hidden = true; $('streakScreen').hidden = false; $('streakBig').textContent = S.streak;
  $('streakText').textContent = S.streak === 1 ? t('streakFirst') : t('streakMore', S.streak);
  const week = $('week'); week.innerHTML = '';
  const names = t('days');
  for (let i = -6; i <= 0; i++) { const d = new Date(); d.setDate(d.getDate() + i); const on = S.days.includes(dayKey(i)); const c = el('div', `day${on ? ' on' : ''}${i === 0 ? ' today' : ''}`); c.append(Object.assign(el('span', 'dot'), { className: `dot${on ? ' ic ic-check' : ''}` }), el('span', '', names[d.getDay()])); week.append(c); }
  SFX.win(); $('streakBtn').focus();
}

// ---------- Other tabs ----------
function allExercises() { return COURSE.filter(u => !u.locked && !u.exam).flatMap(u => u.lessons.flatMap((ls, li) => withFixture(u, ls.exercises).map((ex, i) => ({ ...ex, uid: `${unitKey(u, `L${li}`)}.${i}` })))).filter(e => e.type !== 'teach'); }
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
    const qi = el('div', 'qicon'); qi.append(icon(x.icon)); const reward = el('div', 'qreward'); reward.append(icon(val >= x.goal ? 'check' : 'gem'), val >= x.goal ? '' : '10'); li.append(qi, body, reward); list.append(li);
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
document.querySelectorAll('.tabbar button[data-tab]').forEach(b => { b.onclick = () => showTab(b.dataset.tab); });
$('checkBtn').onclick = onFootButton;
$('quitBtn').onclick = quitLesson;
$('editBtn').onclick = openEditor;
$('edShare').onclick = shareReports;
$('edClear').onclick = () => { if (confirm(t('edClearConfirm'))) { S.reports = []; save(); showReports(); } };
$('streakBtn').onclick = closeOverlays;
$('practiceMistakes').onclick = () => practice('mistakes');
$('practiceMix').onclick = () => practice('mix');
$('practiceLight').onclick = () => startTrivia(false);
$('livesChip').onclick = openLives;
$('livesClose').onclick = () => { $('livesSheet').hidden = true; };
$('buyLife').onclick = () => { if (S.gems < LIFE_GEMS || S.lives >= MAX_LIVES) return; S.gems -= LIFE_GEMS; addLife(); renderLives(); };
$('earnLife').onclick = () => startTrivia(true);
setInterval(renderTop, 30000);
$('soundToggle').onchange = e => { S.sound = e.target.checked; save(); };
// Progress lives only in this browser, so a backup file can carry it to another device or a reinstall.
async function saveBackup() {
  const name = `linux-master-learn-${dayKey()}.json`;
  const file = new File([JSON.stringify({ app: 'linux-master-learn', format: 1, state: S, lang: LANG })], name, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title: name });
  } catch (err) { if (err.name === 'AbortError') return; }
  const a = el('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function restoreBackup(file) {
  let backup; try { backup = JSON.parse(await file.text()); } catch { backup = null; }
  if (backup?.app !== 'linux-master-learn' || backup.format !== 1 || typeof backup.state !== 'object') return alert(t('backupBad'));
  if (!confirm(t('backupConfirm'))) return;
  S = loadState(JSON.stringify(backup.state)); save();
  if (backup.lang === 'he' || backup.lang === 'en') try { localStorage.setItem('lang', backup.lang); } catch { /* not persisted */ }
  location.reload();
}
const toHere = (behavior = 'smooth') => $('path').querySelector('.node.current')?.scrollIntoView({ block: 'center', behavior });
function openTracks() {
  for (const b of document.querySelectorAll('.track-pick button')) {
    const n = COURSE.filter(u => inTrack(u, b.dataset.track)).length;
    b.replaceChildren(el('b', '', TRACK_NAMES[b.dataset.track] || t('trackAll')), el('span', '', t('trackUnits', n)));
    b.setAttribute('aria-pressed', String(b.dataset.track === S.track));
  }
  $('trackSheet').hidden = false;
}
for (const b of document.querySelectorAll('.track-pick button')) b.onclick = () => { S.track = b.dataset.track; save(); $('trackSheet').hidden = true; showTab('learn'); toHere('auto'); };
$('trackBtn').onclick = openTracks;
$('trackClose').onclick = () => { $('trackSheet').hidden = true; };
$('toTopBtn').onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
$('toHereBtn').onclick = () => toHere();
$('backupBtn').onclick = saveBackup;
$('restoreBtn').onclick = () => $('restoreFile').click();
$('restoreFile').onchange = e => { const file = e.target.files[0]; e.target.value = ''; if (file) restoreBackup(file); };
$('resetBtn').onclick = () => { if (confirm(t('resetConfirm'))) { S = loadState(null); save(); renderTop(); renderProfile(); toast(t('resetDone')); } };
document.addEventListener('keydown', e => {
  if ($('lesson').hidden || !L) return;
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
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
history.scrollRestoration = 'manual';
let scrollMoved = false;
for (const type of ['touchstart', 'wheel', 'keydown']) addEventListener(type, () => { scrollMoved = true; }, { once: true, passive: true });
toHere('auto');
// Web fonts change heading heights after the first layout, which would leave the current lesson off screen.
document.fonts?.ready.then(() => { if (!scrollMoved) toHere('auto'); });
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('../sw.js').catch(() => {});
  // Loaded through the worker means every file is kept, so the main page may send learners here offline too.
  const kept = () => { try { localStorage.setItem('learnOffline', '1'); } catch { /* not kept */ } window.learnKept = true; };
  if (navigator.serviceWorker.controller) kept();
  // The first visit loads before the worker controls the page, so its files are fetched once more through the
  // worker to be kept for offline use.
  else navigator.serviceWorker.addEventListener('controllerchange', () => {
    const files = [location.href, ...performance.getEntriesByType('resource').map(e => e.name)].filter(u => new URL(u).pathname.includes('/prototype/'));
    Promise.all(files.map(u => fetch(u))).then(kept).catch(() => { /* not all kept: the next visit tries again */ });
  }, { once: true });
}
