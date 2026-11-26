/* global S, T, I18N, Shell, homeFixture, coachConcepts, coachConceptsOfLine, coachConfusion, coachContrast, CONTRAST, contrastConcepts, coachDay, shuffleWith */
// More exercises for the coach's review stages, so a stage is never left short where the course has few exercises on
// a concept. Three sources, every one checked in the simulator before a learner sees it:
// - "find the mistake": the learner's own wrong command, given back to fix;
// - a fill-in and a word-tiles exercise made from a typed exercise, with wrong choices the simulator proves wrong;
// - a bank written by hand for the commands learners meet first.

Object.assign(I18N.he, { fixTag: 'מצאו את הטעות', fixWas: 'כך כתבתם קודם:' });
Object.assign(I18N.en, { fixTag: 'Find the mistake', fixWas: 'Earlier you typed:' });

// ---------- The learner's own slips ----------
// The last wrong commands the learner typed, at most 30, one per exercise.
function coachSlip(ex, miss, concept) {
  if (!ex?.uid || ex.fix || !['scenario', 'terminal'].includes(ex.type) || !miss?.got || !concept) return;
  S.slips = [...S.slips.filter(s => s.uid !== ex.uid), { uid: ex.uid, got: String(miss.got).slice(0, 200), c: concept, day: coachDay() }].slice(-30);
}
// "Find the mistake": the same task, with the command the learner typed before shown beside it.
function coachFix(slip, pool) {
  const ex = pool.find(e => e.uid === slip.uid) || COACH_BANK.find(e => e.uid === slip.uid);
  if (!ex) return null;
  return { ...ex, uid: `fix:${ex.uid}`, fix: true, was: slip.got };
}

// ---------- Exercises made from typed ones ----------
const COACH_FLAGS = ['-a', '-c', '-f', '-i', '-l', '-n', '-r', '-s', '-v'];
// What the simulator prints for a line, or null when it cannot run it.
function coachRun(fx, line) {
  // Shell.run answers every error a real shell would print itself; anything it throws means it cannot run this here.
  try { const r = new Shell(fx()).run(line); return `${r.out}\u0000${r.err}`; } catch { return null; }
}
// Wrong choices for one word of a command: other options of the same command the course uses, the commands the
// learner mixed this one up with, and its contrast partner. Each is kept only when the simulator prints something
// else with it, so a "wrong" choice can never be right.
function coachDistractors(words, i, concept, pool, fx) {
  const right = coachRun(fx, words.join(' '));
  if (right === null) return [];
  const word = words[i], options = new Set();
  if (concept.startsWith('opt:')) {
    const cmd = concept.slice(4).split(' ').slice(0, -1).join(' ');
    for (const e of pool) for (const c of coachConcepts(e).all) if (c.startsWith(`opt:${cmd} `)) options.add(c.split(' ').pop());
    for (const f of COACH_FLAGS) options.add(f);
  } else {
    const name = concept.slice(4), mix = coachConfusion(concept);
    if (mix) options.add(mix[0] === name ? mix[1] : mix[0]);
    for (const card of CONTRAST) { const [a, b] = contrastConcepts(card); if (a === concept && b.startsWith('cmd:')) options.add(b.slice(4)); if (b === concept && a.startsWith('cmd:')) options.add(a.slice(4)); }
    for (const c of ['cat', 'head', 'tail', 'less', 'sort', 'wc', 'ls', 'grep']) options.add(c);
  }
  options.delete(word);
  const out = [];
  for (const o of options) {
    if (out.length >= 3) break;
    if (/^-\d+$/.test(o) || o.includes(' ')) continue;
    const other = coachRun(fx, [...words.slice(0, i), o, ...words.slice(i + 1)].join(' '));
    if (other !== null && other !== right) out.push(o);
  }
  return out;
}
// A fill-in with the concept's word as the blank, and word tiles for the whole command, from one typed exercise.
function coachVariants(ex, concept, pool) {
  if (ex.type !== 'scenario' || ex.fix) return [];
  const line = String(ex.accept?.[0] || ''), words = line.split(' ');
  if (!line || /["'][^"']*\s/.test(line) || words.some(w => !w) || words.length < 2 || words.length > 7) return [];
  const target = concept.startsWith('opt:') ? concept.split(' ').pop() : concept.startsWith('cmd:') ? concept.slice(4) : null;
  const i = target ? words.indexOf(target) : -1;
  if (i < 0) return [];
  const fx = ex.fx || homeFixture, wrong = coachDistractors(words, i, concept, pool, fx);
  if (wrong.length < 2) return [];
  const base = { prompt: ex.prompt, fx: ex.fx, unitNo: ex.unitNo, concepts: [concept], made: ex.uid };
  return [
    { ...base, type: 'fill', uid: `fill:${ex.uid}:${concept}`, before: words.slice(0, i).join(' ') + (i ? ' ' : ''), answer: target, after: i < words.length - 1 ? ` ${words.slice(i + 1).join(' ')}` : '', options: [target, ...wrong] },
    { ...base, type: 'tiles', uid: `tiles:${ex.uid}`, answer: line, tiles: [...words, ...wrong.slice(0, 2)] },
  ];
}

// ---------- Written by hand ----------
// For the commands learners meet first, where the course itself has the fewest exercises per concept. Every task names
// its file and says what is in it, on the files of the home folder.
const COACH_BANK = [
  { accept: ['head -n 2 notes.txt'], prompt: T('ב־notes.txt יש שלוש משימות, אחת בכל שורה. הציגו רק את שתי הראשונות.', 'notes.txt holds three tasks, one per line. Show only the first two.') },
  { accept: ['tail -n 1 notes.txt'], prompt: T('ב־notes.txt יש שלוש משימות, אחת בכל שורה. הציגו רק את האחרונה.', 'notes.txt holds three tasks, one per line. Show only the last one.') },
  { accept: ['head -n 3 logs/app.log'], prompt: T('ב־logs/app.log יש 12 שורות יומן, כל אחת מתחילה בשעה. הציגו את שלוש הראשונות.', 'logs/app.log holds 12 log lines, each starting with a time. Show the first three.') },
  { accept: ['tail -n 2 logs/app.log'], prompt: T('ב־logs/app.log יש 12 שורות יומן, כל אחת מתחילה בשעה. הציגו את שתי האחרונות.', 'logs/app.log holds 12 log lines, each starting with a time. Show the last two.') },
  { accept: ['cat readme.txt'], prompt: T('ב־readme.txt יש שורת ברוכים הבאים אחת. הציגו את כל הקובץ.', 'readme.txt holds one welcome line. Show the whole file.') },
  { accept: ['cat -n notes.txt'], prompt: T('ב־notes.txt יש שלוש משימות. הציגו את כולן, עם מספר לפני כל שורה.', 'notes.txt holds three tasks. Show them all, with a number before each line.') },
  { accept: ['ls -a projects'], prompt: T('בתיקייה projects יש את app.py ואת הקובץ הנסתר ‎.env‎. הציגו את כל הקבצים שבה, גם את הנסתר.', 'The projects folder holds app.py and the hidden file .env. List every file in it, the hidden one too.') },
  { accept: ['ls -l docs'], prompt: T('בתיקייה docs יש את todo.txt ואת cv.pdf. הציגו אותם עם פרטים: הרשאות, בעלים, גודל ותאריך.', 'The docs folder holds todo.txt and cv.pdf. List them with details: permissions, owner, size and date.') },
  { accept: ['wc -l fruits.txt'], prompt: T('ב־fruits.txt יש שם של פרי בכל שורה. ספרו כמה שורות יש בו.', 'fruits.txt holds a fruit name on each line. Count its lines.') },
  { accept: ['sort fruits.txt'], prompt: T('ב־fruits.txt יש שם של פרי בכל שורה, לא לפי הסדר. הציגו אותם לפי סדר האלף־בית.', 'fruits.txt holds a fruit name on each line, in no order. Show them in alphabetical order.') },
  { accept: ['sort fruits.txt | uniq', 'sort -u fruits.txt'], prompt: T('ב־fruits.txt חלק מהפירות מופיעים כמה פעמים. הציגו כל פרי פעם אחת, ממוין.', 'In fruits.txt some fruits appear more than once. Show each fruit once, sorted.') },
  { accept: ['grep ERROR logs/app.log'], prompt: T('ב־logs/app.log יש שורות INFO, WARN ו־ERROR. הציגו רק את שורות ה־ERROR.', 'logs/app.log holds INFO, WARN and ERROR lines. Show only the ERROR lines.') },
  { accept: ['grep -i error logs/app.log'], prompt: T('ב־logs/app.log המילה ERROR כתובה באותיות גדולות. מצאו את השורות שלה כשאתם מחפשים error באותיות קטנות.', 'In logs/app.log the word ERROR is in capitals. Find its lines while searching for error in lower case.') },
  { accept: ['grep -v INFO logs/app.log'], prompt: T('ב־logs/app.log יש שורות INFO, WARN ו־ERROR. הציגו את כל השורות שאין בהן INFO.', 'logs/app.log holds INFO, WARN and ERROR lines. Show every line without INFO.') },
  { accept: ['grep -c ERROR logs/app.log'], prompt: T('ב־logs/app.log יש שורות INFO, WARN ו־ERROR. הדפיסו רק כמה שורות ERROR יש.', 'logs/app.log holds INFO, WARN and ERROR lines. Print only how many ERROR lines there are.') },
  { accept: ['cut -d, -f1 people.csv'], prompt: T('ב־people.csv כל שורה היא שם, עיר וגיל, מופרדים בפסיקים. הציגו רק את עמודת השמות.', 'people.csv holds a name, a city and an age on each line, separated by commas. Show only the names column.') },
  { accept: ['cp notes.txt docs/'], prompt: T('העתיקו את notes.txt לתוך התיקייה docs, כך שהמקור יישאר במקומו.', 'Copy notes.txt into the docs folder, so the original stays where it is.') },
  { accept: ['mv readme.txt docs/'], prompt: T('העבירו את readme.txt לתוך התיקייה docs, כך שלא יישאר בתיקיית הבית.', 'Move readme.txt into the docs folder, so it no longer stays in the home folder.') },
  { accept: ['echo "buy bread" >> notes.txt'], prompt: T('ב־notes.txt יש שלוש משימות. הוסיפו בסופו את השורה buy bread, בלי למחוק את מה שיש בו.', 'notes.txt holds three tasks. Add the line buy bread at its end, without erasing what is in it.') },
  { accept: ['echo hello > greet.txt'], prompt: T('צרו קובץ חדש בשם greet.txt שכתוב בו hello.', 'Create a new file named greet.txt that says hello.') },
  { accept: ['mkdir -p projects/web/css'], prompt: T('בתוך projects צרו את התיקייה web, ובתוכה את התיקייה css, בפקודה אחת.', 'Inside projects create the folder web, and inside it the folder css, in one command.') },
].map((x, i) => ({ ...x, type: 'scenario', uid: `bank:${i}`, fx: homeFixture, bank: true }));

// ---------- For a review stage ----------
// Extra exercises for the stage's concepts, by step. A bank exercise comes only when every command in it was already
// taught in a unit the learner reached.
function coachExtras(concepts, { pool, teach }) {
  const taught = new Set(teach.flatMap(e => coachConcepts(e).all).filter(c => c.startsWith('cmd:')));
  const extras = { recall: [], produce: [] };
  for (const slip of S.slips) if (concepts.includes(slip.c)) { const fix = coachFix(slip, pool); if (fix) extras.produce.unshift(fix); }
  for (const c of concepts) {
    for (const ex of pool) if (coachConcepts(ex).focus.includes(c)) extras.recall.push(...coachVariants(ex, c, pool));
    for (const ex of COACH_BANK) {
      const has = coachConcepts(ex).all;
      if (has.includes(c) && has.filter(x => x.startsWith('cmd:')).every(x => taught.has(x))) { extras.produce.push(ex); extras.recall.push(...coachVariants(ex, c, pool)); }
    }
  }
  return extras;
}
