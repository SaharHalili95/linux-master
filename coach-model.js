/* global S, L, LANG, t, tr, $, el, icon, bidi, toast, SFX, I18N, closePop, showPop, startLesson, availableCourse, inTrack, unitNodes, unitKey, withFixture, explainMiss, typedMiss, isCommand, save */
// The coach's knowledge model. Every exercise is tagged with the concepts it practises (a command, an option of a
// command, an operator, a glob), and every answer updates what the learner showed about those concepts. Plain rules
// written and tested by hand: no AI and no server.
//
// Concept names: cmd:grep, opt:grep -E, op:|, op:>>, glob:*, var, sub, unit:12 (only when nothing else is found),
// and the root causes path, perm, quote and args, which come from the errors a learner meets in the terminal.

const COACH_OPS = ['2>&1', '&>', '&&', '||', '2>>', '2>', '>>', '|', ';', '>', '<'];
const COACH_JOIN = new Set(['|', '||', '&&', ';']);
const COACH_SKIP = new Set(['then', 'else', 'do', 'time', '!', '{', '}', '(', ')', 'fi', 'done', 'esac']);
const COACH_KEYWORDS = new Set(['if', 'for', 'while', 'until', 'case', 'elif']);
// Commands whose options are whole words after one dash: find -name, [ -eq ], test -f.
const COACH_WORD_OPTS = new Set(['find', '[', '[[', 'test', 'iptables', 'ip6tables', 'java']);
// Commands whose first plain word picks what they do: systemctl start, git commit, apt install.
const COACH_SUBCMDS = new Set(['systemctl', 'git', 'apt', 'apt-get', 'dnf', 'yum', 'zypper', 'ip', 'docker', 'podman', 'nmcli', 'virsh', 'timedatectl', 'hostnamectl', 'localectl', 'loginctl', 'flatpak', 'snap', 'kubectl', 'firewall-cmd', 'subscription-manager', 'semanage', 'journalctl', 'resolvectl', 'networkctl', 'update-alternatives', 'debconf-set-selections']);
// An error the terminal printed names the real gap, which may sit under the command the learner typed.
const COACH_ROOTS = { coachNoFile: 'path', coachIsDir: 'path', coachNotDir: 'path', coachPerm: 'perm', coachSyntax: 'quote', coachOperand: 'args' };

// Keys pressed inside vi or the terminal are their own concepts, never commands.
const COACH_VI = new Set(['i', 'a', 'o', 'O', 'A', 'I', 'x', 'u', 'p', 'P', 'G', 'gg', 'h', 'j', 'k', 'l', 'w', 'b', 'n', 'N', 'v', 'V', 'dd', 'yy', 'dw', 'cw', 'ZZ', 'Esc']);
function coachKey(line) {
  const t = String(line || '').trim();
  if (/^:/.test(t)) return `key:${t.match(/^:(%s|s|set|q!|wq!?|w|q|x|\d+|!)/)?.[1]?.replace(/^\d+$/, 'N') || t.split(/\s/)[0]}`;
  if (/^\/\S+$/.test(t)) return 'key:/';
  if (/^\d+[a-zA-Z]+$/.test(t)) return `key:${t.replace(/^\d+/, '')}`;
  if (COACH_VI.has(t) || /^Ctrl\+|^Tab$|^[↑↓]$/.test(t)) return `key:${t}`;
  return '';
}
function coachWords(text) {
  const out = []; let word = '', quoted = false, q = '';
  const push = () => { if (word || quoted) out.push({ t: word, quoted }); word = ''; quoted = false; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === q) q = ''; else word += c; continue; }
    if (c === '"' || c === "'") { q = c; quoted = true; continue; }
    if (c === '\\' && i + 1 < text.length) { word += text[++i]; continue; }
    if (/\s/.test(c)) { push(); continue; }
    if (c === '$' && text[i + 1] === '(') { let depth = 0, j = i + 1; for (; j < text.length; j++) { if (text[j] === '(') depth++; else if (text[j] === ')' && --depth === 0) break; } word += text.slice(i, j + 1); i = j; continue; }
    const op = !word || /[<>&|;]/.test(c) ? COACH_OPS.find(o => text.startsWith(o, i) && (o !== '2>' && o !== '2>>' && o !== '2>&1' || !word)) : null;
    if (op) { push(); out.push({ t: op, op: true }); i += op.length - 1; continue; }
    word += c;
  }
  push();
  return out;
}
// The concepts one typed command line practises.
function coachConceptsOfLine(line) {
  const key = coachKey(line); if (key) return [key];
  const found = new Set(), words = coachWords(String(line || '').trim());
  let cmd = '', expectCmd = true, skipNext = false, sub = false, loopVar = false;
  for (const w of words) {
    if (w.op) { found.add(`op:${w.t}`); if (COACH_JOIN.has(w.t)) { expectCmd = true; cmd = ''; } else skipNext = true; continue; }
    if (skipNext) { skipNext = false; continue; }
    const t = w.t;
    if (!w.quoted && t.startsWith('$(')) { found.add('sub'); for (const c of coachConceptsOfLine(t.slice(2, -1))) found.add(c); continue; }
    if (expectCmd) {
      if (COACH_SKIP.has(t) || /^[A-Za-z_]\w*=/.test(t)) continue;
      if (t === 'sudo') { found.add('cmd:sudo'); cmd = 'sudo'; continue; }
      if (cmd === 'sudo' && /^-\w/.test(t)) { found.add(`opt:sudo ${t}`); continue; }
      // for NAME in LIST: the name is a variable and the list is arguments, until ; or do.
      if (t === 'for' || t === 'select') { found.add(`cmd:${t}`); cmd = t; expectCmd = false; loopVar = true; continue; }
      if (COACH_KEYWORDS.has(t)) { found.add(`cmd:${t}`); continue; }
      if (t === 'in' || !t) continue;
      // A line from a config file (fstab, sudoers) has no command to name.
      if (!/^([A-Za-z][\w.+-]*|\[\[?|\.\/[\w.-]+)$/.test(t)) { expectCmd = false; cmd = ''; continue; }
      if (t.startsWith('./')) { found.add('cmd:./script'); expectCmd = false; cmd = './script'; continue; }
      cmd = t; expectCmd = false; sub = COACH_SUBCMDS.has(t); found.add(`cmd:${cmd}`); continue;
    }
    if (COACH_SKIP.has(t) && ['then', 'do', 'else'].includes(t)) { expectCmd = true; cmd = ''; continue; }
    if (!w.quoted && (/^-[^-\d]/.test(t) || /^-\d+$/.test(t) || /^--[\w-]/.test(t))) {
      if (/^-\d+$/.test(t)) found.add(`opt:${cmd} -N`);
      else if (t.startsWith('--')) found.add(`opt:${cmd} ${t.split('=')[0]}`);
      else if (COACH_WORD_OPTS.has(cmd)) found.add(`opt:${cmd} ${t}`);
      else for (const ch of t.slice(1)) { if (/[\d.=]/.test(ch)) break; if (/[A-Za-z]/.test(ch)) found.add(`opt:${cmd} -${ch}`); }
      continue;
    }
    if (loopVar) { loopVar = false; continue; }
    if (cmd === 'for' && t === 'in') continue;
    if (sub && !w.quoted && /^[a-z][\w-]*$/.test(t)) { cmd = `${cmd} ${t}`; found.add(`cmd:${cmd}`); sub = false; continue; }
    sub = false;
    if (!w.quoted) {
      if (/[*?]/.test(t)) found.add(/\*/.test(t) ? 'glob:*' : 'glob:?');
      if (/\[[^\]]+\]/.test(t)) found.add('glob:[]');
      if (/\{[^}]*,[^}]*\}|\{\d+\.\.\d+\}/.test(t)) found.add('glob:{}');
    }
    if (/\$[A-Za-z_{]/.test(t) && !(w.quoted && /^'/.test(t))) found.add('var');
  }
  return [...found];
}
let COACH_TAUGHT = null;
// Every command name a teach card introduces, so a name mentioned in a question can be recognised.
function coachTaught() {
  if (COACH_TAUGHT && COACH_TAUGHT.course === COURSE.length) return COACH_TAUGHT.names;
  const names = new Set();
  for (const u of COURSE) for (const ls of u.lessons || []) for (const ex of ls.exercises) if (ex.type === 'teach') {
    const first = String(ex.cmd || '').trim().split(/\s+/)[0]; if (/^[a-z][\w.+-]+$/.test(first)) names.add(first);
  }
  COACH_TAUGHT = { course: COURSE.length, names };
  return names;
}
// Commands named in a sentence: the left-to-right runs first, then any taught command name.
function coachMentions(text) {
  const s = String(text || ''), found = new Set(), taught = coachTaught();
  for (const m of s.matchAll(/‎([^‎]+)‎/g)) if (/^[\x20-\x7e]+$/.test(m[1]) && taught.has(m[1].trim().split(/\s+/)[0])) for (const c of coachConceptsOfLine(m[1])) found.add(c);
  for (const m of s.matchAll(/(?<![\w./-])([a-z][\w.+-]+)(?![\w/])/g)) if (taught.has(m[1])) found.add(`cmd:${m[1]}`);
  return [...found];
}
const coachHe = v => (v && typeof v === 'object' ? v.he : v) || '';
// What an exercise practises. `focus` is the part the learner had to supply, when the exercise gives the rest.
function coachExercise(ex) {
  // An exercise whose automatic tags are weak names its concepts itself.
  if (Array.isArray(ex.concepts) && ex.concepts.length) return { all: [...ex.concepts], focus: [...ex.concepts] };
  const lines = [], focusLines = [];
  let mention = coachHe(ex.prompt);
  switch (ex.type) {
    case 'terminal': {
      // A name the task defines with alias is the learner's own word, so its uses count as alias.
      const own = new Set((ex.solve || []).flatMap(l => [...String(l).matchAll(/\balias\s+([\w.-]+)=/g)].map(m => m[1])));
      const found = (ex.solve || []).flatMap(coachConceptsOfLine).filter(c => !own.has(c.slice(4)) || !c.startsWith('cmd:'));
      return { all: [...new Set(found)], focus: [...new Set(found)] };
    }
    case 'scenario': lines.push(ex.accept?.[0]); break;
    case 'tiles': lines.push(ex.answer); break;
    case 'teach': lines.push(ex.cmd); break;
    case 'fill': lines.push(`${ex.before}${ex.answer}${ex.after}`); focusLines.push(`${ex.before}${ex.after}`); break;
    case 'output': lines.push(ex.cmd || (ex.rec && typeof RECORDED === 'object' && RECORDED[ex.rec]?.cmd)); break;
    case 'match': {
      // Each thing to match is a concept: a command, an operator, or a small item such as * or $HOME.
      const found = (ex.pairs || []).flatMap(([k]) => {
        const key = String(k).trim(), words = coachWords(key);
        if (words.length && words.every(w => w.op)) return words.map(w => `op:${w.t}`);
        if (coachKey(key)) return [coachKey(key)];
        return coachTaught().has(key.split(/\s+/)[0]) ? coachConceptsOfLine(key) : [`item:${key.slice(0, 24)}`];
      });
      return { all: [...new Set(found)], focus: [...new Set(found)] };
    }
    case 'choice': if (!ex.plain && typeof ex.answer === 'string') lines.push(ex.answer); else mention += ` ${(ex.options || []).map(coachHe).join(' ')}`; break;
    case 'sentence': {
      const text = coachHe(ex.text), a = String(ex.answer || '');
      if (a.startsWith('-')) { const cmd = coachMentions(text).find(c => c.startsWith('cmd:'))?.slice(4) || (/\[\s*\]/.test(text) ? '[' : ''); if (cmd) return { all: [`cmd:${cmd}`, `opt:${cmd} ${a}`], focus: [`opt:${cmd} ${a}`] }; }
      lines.push(a); mention += ` ${text}`; break;
    }
    default: break;
  }
  // A symbol taught on its own (*, ^, [0-9], ~) is the same item a match exercise pairs it with.
  const item = l => { const found = coachConceptsOfLine(l); return found.length || String(l).length > 24 ? found : [`item:${String(l).trim()}`]; };
  let all = [...new Set(lines.filter(Boolean).flatMap(['teach', 'sentence', 'fill'].includes(ex.type) ? item : coachConceptsOfLine))];
  if (!all.length) all = coachMentions(mention);
  if (!all.length && ex.unitNo) all = [`unit:${ex.unitNo}`];
  const given = new Set(focusLines.flatMap(coachConceptsOfLine));
  const focus = all.filter(c => !given.has(c));
  return { all, focus: focus.length ? focus : all };
}
const COACH_CACHE = new Map();
function coachConcepts(ex) {
  const key = `${ex.type}|${ex.unitNo || ''}|${coachHe(ex.prompt)}|${JSON.stringify(ex.solve || ex.accept || ex.answer || ex.cmd || ex.rec || ex.pairs?.map(p => p[0]) || '')}|${coachHe(ex.text)}`;
  if (!COACH_CACHE.has(key)) COACH_CACHE.set(key, coachExercise(ex));
  return COACH_CACHE.get(key);
}

// ---------- What the learner showed ----------
// S.skill[concept] = [seen, right, forgot, wrong, typo, helped, day, box]. The box climbs by one only after a typed
// answer without help, so knowing a concept means producing it, not recognising it.
const SKILL = { seen: 0, right: 1, forgot: 2, wrong: 3, typo: 4, helped: 5, day: 6, box: 7 };
const PRODUCE = new Set(['terminal', 'scenario', 'tiles']);
const coachDay = (now = Date.now()) => Math.floor(now / 86400000);
function coachEntry(c) { return (S.skill[c] ||= [0, 0, 0, 0, 0, 0, 0, 0]); }
// result: { ok, kind: 'forgot' | 'wrong' | 'typo', blame: [concepts], helped, roots: [concepts], confuse: [got, want] }
function coachRecord(ex, result) {
  if (!ex || ex.type === 'teach' || ex.type === 'boss') return;
  const { focus } = coachConcepts(ex), today = coachDay();
  if (result.ok) {
    for (const c of focus) {
      const e = coachEntry(c); e[SKILL.seen]++; e[SKILL.right]++; e[SKILL.day] = today;
      if (result.helped) e[SKILL.helped]++; else if (PRODUCE.has(ex.type)) e[SKILL.box] = Math.min(4, e[SKILL.box] + 1);
    }
  } else {
    const blame = result.blame?.length ? result.blame : focus, kind = SKILL[result.kind] ? result.kind : 'wrong';
    for (const c of new Set([...focus, ...blame])) { const e = coachEntry(c); e[SKILL.seen]++; e[SKILL.day] = today; }
    for (const c of blame) { const e = coachEntry(c); e[SKILL[kind]]++; e[SKILL.box] = kind === 'typo' ? e[SKILL.box] : kind === 'forgot' ? 0 : Math.max(0, e[SKILL.box] - 1); }
  }
  for (const c of result.roots || []) { const e = coachEntry(c); e[SKILL.seen]++; e[SKILL.wrong]++; e[SKILL.day] = today; e[SKILL.box] = Math.max(0, e[SKILL.box] - 1); }
  if (result.confuse && result.confuse[0] !== result.confuse[1]) { const k = `${result.confuse[0]}>${result.confuse[1]}`; S.confuse[k] = (S.confuse[k] || 0) + 1; }
}
// Which concepts a wrong typed answer missed, from the explanation the learner was shown.
function coachBlame(miss, typedLine, wantLine) {
  if (!miss) return { kind: 'wrong' };
  if (miss.kind === 'typo') {
    const want = coachConceptsOfLine(wantLine), w = miss.want || '';
    const hit = want.filter(c => c === `cmd:${w}` || c.endsWith(` ${w}`) || (c.startsWith('opt:') && w.startsWith('-') && w.includes(c.split(' ').pop().slice(1))));
    return { kind: 'typo', blame: hit.length ? hit : want.filter(c => c.startsWith('cmd:')) };
  }
  const gotCmd = coachConceptsOfLine(typedLine).find(c => c.startsWith('cmd:')), wantCmd = coachConceptsOfLine(wantLine).find(c => c.startsWith('cmd:'));
  if (miss.kind === 'noCmd') return { kind: 'forgot', blame: wantCmd ? [wantCmd] : [] };
  if (miss.kind === 'otherCmd') return { kind: 'forgot', blame: wantCmd ? [wantCmd] : [], confuse: gotCmd && wantCmd ? [gotCmd.slice(4), wantCmd.slice(4)] : null };
  const had = new Set(coachConceptsOfLine(typedLine)), lacking = coachConceptsOfLine(wantLine).filter(c => !had.has(c));
  return { kind: 'wrong', blame: lacking.length ? lacking : coachConceptsOfLine(wantLine).filter(c => !c.startsWith('cmd:')) };
}

// ---------- Commands learners mix up ----------
// Written by hand for the pairs that confuse learners most. A review stage shows the card when the learner typed
// one where the other was needed.
const CONTRAST = [
  { a: 'cat', b: 'head', text: T('cat מדפיסה את כל הקובץ. head מדפיסה רק את ההתחלה שלו: 10 שורות, או כמה ש־‎-n‎ קובע.', 'cat prints the whole file. head prints only its start: 10 lines, or as many as -n sets.') },
  { a: 'head', b: 'tail', text: T('head מציגה את השורות הראשונות של קובץ, ו־tail את האחרונות. ‎tail -f‎ ממשיכה להציג שורות חדשות שנוספות.', 'head shows the first lines of a file and tail the last ones. tail -f keeps showing new lines as they are added.') },
  { a: 'cp', b: 'mv', text: T('cp מעתיקה, והקובץ המקורי נשאר. mv מעבירה או משנה שם, והמקור כבר לא נמצא במקום הישן.', 'cp copies and the original stays. mv moves or renames, and the original is no longer in its old place.') },
  { a: 'rm', b: 'rmdir', text: T('rmdir מוחקת רק תיקייה ריקה. rm מוחקת קבצים, ועם ‎-r‎ גם תיקייה עם כל מה שבתוכה.', 'rmdir removes only an empty folder. rm removes files, and with -r a folder with everything in it.') },
  { a: 'grep', b: 'find', text: T('grep מחפשת טקסט בתוך התוכן של קבצים. find מחפשת קבצים לפי שם, סוג או גודל, בלי לקרוא את התוכן.', 'grep searches for text inside files. find searches for files by name, type or size, without reading them.') },
  { a: '>', b: '>>', op: true, text: T('‎>‎ כותב לקובץ ומוחק את מה שהיה בו. ‎>>‎ מוסיף לסוף הקובץ ושומר את מה שהיה.', '> writes to the file and erases what was in it. >> adds to the end and keeps what was there.') },
  { a: '|', b: '>', op: true, text: T('‎|‎ שולח את הפלט לפקודה נוספת. ‎>‎ שולח את הפלט לקובץ.', '| sends the output to another command. > sends the output to a file.') },
  { a: '&&', b: ';', op: true, text: T('‎&&‎ מריץ את הפקודה הבאה רק אם הקודמת הצליחה. ‎;‎ מריץ אותה בכל מקרה.', '&& runs the next command only if the previous one worked. ; runs it either way.') },
  { a: 'chmod', b: 'chown', text: T('chmod משנה הרשאות: מי רשאי לקרוא, לכתוב ולהריץ. chown משנה למי הקובץ שייך.', 'chmod changes permissions: who may read, write and run. chown changes who owns the file.') },
  { a: 'du', b: 'df', text: T('du מראה כמה מקום קבצים ותיקיות תופסים. df מראה כמה מקום פנוי נשאר בכל מחיצה.', 'du shows how much space files and folders take. df shows how much free space each partition has left.') },
  { a: 'ps', b: 'top', text: T('ps מציגה את התהליכים פעם אחת, כמו צילום. top מציגה אותם חי ומתעדכנת כל כמה שניות.', 'ps lists processes once, like a snapshot. top shows them live and updates every few seconds.') },
  { a: 'kill', b: 'killall', text: T('kill עוצרת תהליך לפי המספר שלו (PID). killall עוצרת את כל התהליכים לפי השם.', 'kill stops a process by its number (PID). killall stops every process with a given name.') },
  { a: 'sort', b: 'uniq', text: T('uniq מסירה רק כפילויות שעומדות אחת אחרי השנייה, ולכן קודם ממיינים עם sort.', 'uniq removes only duplicates that sit next to each other, so sort comes first.') },
  { a: 'wc -l', b: 'wc -c', text: T('‎wc -l‎ סופרת שורות, ‎wc -c‎ סופרת בתים, ו־‎wc -w‎ סופרת מילים.', 'wc -l counts lines, wc -c counts bytes and wc -w counts words.') },
  { a: 'ls -a', b: 'ls -l', text: T('‎ls -a‎ מציגה גם קבצים נסתרים, אלה שמתחילים בנקודה. ‎ls -l‎ מציגה פרטים: הרשאות, בעלים, גודל ותאריך.', 'ls -a also shows hidden files, the ones starting with a dot. ls -l shows details: permissions, owner, size and date.') },
  { a: 'grep -i', b: 'grep -v', text: T('‎grep -i‎ מתעלמת מאותיות גדולות וקטנות. ‎grep -v‎ הופכת את החיפוש ומציגה את השורות שלא מתאימות.', 'grep -i ignores upper and lower case. grep -v inverts the search and shows the lines that do not match.') },
  { a: 'tar -c', b: 'tar -x', text: T('‎tar -c‎ יוצרת ארכיון חדש. ‎tar -x‎ פורסת ארכיון קיים. ‎-f‎ אומרת לשתיהן באיזה קובץ מדובר.', 'tar -c creates a new archive. tar -x extracts an existing one. -f tells both which file it is.') },
  { a: 'gzip', b: 'tar', text: T('gzip דוחסת קובץ אחד. tar אורזת הרבה קבצים לארכיון אחד, ועם ‎-z‎ גם דוחסת אותו.', 'gzip compresses one file. tar packs many files into one archive, and with -z also compresses it.') },
  { a: 'su', b: 'sudo', text: T('sudo מריצה פקודה אחת כ־root. su מחליפה משתמש ופותחת shell חדש כמשתמש האחר.', 'sudo runs one command as root. su switches user and opens a new shell as that user.') },
  { a: 'useradd', b: 'usermod', text: T('useradd יוצרת משתמש חדש. usermod משנה משתמש שכבר קיים, למשל מוסיפה אותו לקבוצה עם ‎-aG‎.', 'useradd creates a new user. usermod changes an existing one, for example adds it to a group with -aG.') },
  { a: 'ln', b: 'ln -s', text: T('ln בלי ‎-s‎ יוצרת קישור קשיח: עוד שם לאותו תוכן. ‎ln -s‎ יוצרת קישור סמלי שמצביע על נתיב, ונשבר אם המקור נמחק.', 'ln without -s makes a hard link: another name for the same content. ln -s makes a symbolic link that points to a path and breaks if the target is removed.') },
  { a: 'sed', b: 'awk', text: T('sed עורכת שורות: מחליפה, מוחקת ומדפיסה לפי תבנית. awk עובדת על עמודות ומחשבת איתן.', 'sed edits lines: replaces, deletes and prints by pattern. awk works on columns and computes with them.') },
  { a: 'systemctl start', b: 'systemctl enable', text: T('‎systemctl start‎ מפעילה שירות עכשיו. ‎systemctl enable‎ קובעת שהוא יופעל בכל אתחול. ‎--now‎ עושה את שניהם.', 'systemctl start runs a service now. systemctl enable makes it start on every boot. --now does both.') },
  { a: 'which', b: 'type', text: T('which מראה איפה נמצאת התוכנית שתרוץ. type אומרת גם אם השם הוא alias או פקודה מובנית של bash.', 'which shows where the program that will run lives. type also tells whether the name is an alias or a bash builtin.') },
];
// The concepts a contrast card is about, in the same names the exercises use.
const contrastConcepts = card => [card.a, card.b].map(x => {
  if (card.op) return `op:${x}`;
  const found = coachConceptsOfLine(x);
  return found.find(c => c.startsWith('opt:')) || found.filter(c => c.startsWith('cmd:')).sort((p, q) => q.length - p.length)[0];
});
function coachContrast(a, b) { return CONTRAST.find(card => { const [x, y] = contrastConcepts(card); return (x === a && y === b) || (x === b && y === a); }) || null; }

// ---------- When to build a review stage ----------
// A forgotten or wrong concept weighs 2, an answer that needed help 2, a typo 1, and every box climbed takes 3 off.
// 4 or more is weak: two real mistakes, or one mistake and one answer that needed help. Typos alone rarely add up,
// and anything not met for three weeks counts half.
const COACH_WEAK = 4;
const COACH_ROOT_NAMES = new Set(['path', 'perm', 'quote', 'args']);
function coachScore(e, today = coachDay()) {
  if (!e) return 0;
  const raw = 2 * (e[SKILL.forgot] + e[SKILL.wrong]) + 2 * e[SKILL.helped] + e[SKILL.typo] - 3 * e[SKILL.box];
  return today - e[SKILL.day] > 21 ? raw / 2 : raw;
}
function coachWeak(skill = S.skill, today = coachDay()) {
  return Object.keys(skill).filter(c => !c.startsWith('unit:') && coachScore(skill[c], today) >= COACH_WEAK)
    .sort((a, b) => coachScore(skill[b], today) - coachScore(skill[a], today) || a.localeCompare(b));
}
// The concepts a review stage works on, at most three. A root cause comes first and replaces the commands it explains:
// when paths are weak, rm, cp and cat failing for the same reason make one lesson on paths, not three.
function coachFocus(skill = S.skill, today = coachDay()) {
  const weak = coachWeak(skill, today), roots = weak.filter(c => COACH_ROOT_NAMES.has(c));
  if (roots.length) return [...roots.slice(0, 1), ...weak.filter(c => !COACH_ROOT_NAMES.has(c) && (skill[c][SKILL.forgot] > 0 || skill[c][SKILL.typo] > 0)).slice(0, 1)];
  return weak.slice(0, 3);
}
// The mix-up behind a concept, if the learner typed or picked another command in its place.
function coachConfusion(c, confuse = S.confuse) {
  if (!c.startsWith('cmd:')) return null;
  const name = c.slice(4), hit = Object.entries(confuse).filter(([k]) => k.split('>').includes(name)).sort((a, b) => b[1] - a[1])[0];
  return hit ? hit[0].split('>') : null;
}
// What the learner reads on the review stage: why it is here, in their own mistakes.
function coachReason(c, skill = S.skill) {
  if (COACH_ROOT_NAMES.has(c)) return { kind: c };
  const mix = coachConfusion(c); if (mix) return { kind: 'mix', a: mix[0], b: mix[1] };
  const e = skill[c] || [];
  return { kind: e[SKILL.forgot] >= e[SKILL.wrong] ? 'forgot' : 'wrong', c };
}
const coachName = c => ({ path: T('נתיבים', 'paths'), perm: T('הרשאות', 'permissions'), quote: T('מרכאות וסוגריים', 'quotes and brackets'), args: T('ארגומנטים', 'arguments') }[c]
  || c.replace(/^(cmd|opt|op|item|glob):/, '').replace(/^key:/, ':').replace(/^:(?=[a-zA-Z]{2}$)/, ''));

// ---------- What a review stage holds ----------
// Teach cards first, then graded work: recognise, recall, produce. A concept that came back after an earlier review
// gets another mix, with more typing, because the first one did not hold.
const COACH_STEPS = { recognise: ['choice', 'sentence', 'match', 'output'], recall: ['fill', 'tiles'], produce: ['scenario', 'terminal'] };
const COACH_MIX = [{ recognise: 2, recall: 1, produce: 2 }, { recognise: 1, recall: 1, produce: 3 }, { recognise: 0, recall: 1, produce: 4 }];
function coachBuild(concepts, { pool, teach, failed = new Set(), variant = 0, rand = Math.random }) {
  const mix = COACH_MIX[Math.min(variant, COACH_MIX.length - 1)], cards = [], work = { recognise: [], recall: [], produce: [] }, used = new Set();
  const pick = (list, n) => { const out = []; const fresh = list.filter(e => !failed.has(e.uid)), again = list.filter(e => failed.has(e.uid)); for (const e of [...shuffleWith(fresh, rand), ...shuffleWith(again, rand)]) { if (out.length >= n) break; if (!used.has(e.uid)) { used.add(e.uid); out.push(e); } } return out; };
  for (const c of concepts) {
    const card = teach.find(e => coachConcepts(e).all.includes(c) && String(e.cmd).trim() === coachName(c)) || teach.find(e => coachConcepts(e).all.includes(c));
    if (card) cards.push({ ...card, known: true });
    const mixUp = coachConfusion(c), contrast = mixUp && coachContrast(`cmd:${mixUp[0]}`, `cmd:${mixUp[1]}`);
    if (contrast) cards.push({ type: 'teach', known: true, cmd: `${contrast.a} / ${contrast.b}`, name: '', text: contrast.text, contrast: true });
    const mine = pool.filter(e => coachConcepts(e).focus.includes(c));
    for (const [step, types] of Object.entries(COACH_STEPS)) work[step].push(...pick(mine.filter(e => types.includes(e.type)), mix[step]));
  }
  // Short of eight exercises, more typing on the same concepts fills the stage.
  // Short of eight, any other exercise that uses the same concepts fills the stage, typing first.
  const size = () => work.recognise.length + work.recall.length + work.produce.length, more = pool.filter(e => concepts.some(c => coachConcepts(e).all.includes(c)));
  if (size() < 8) work.produce.push(...pick(more.filter(e => COACH_STEPS.produce.includes(e.type)), 8 - size()));
  if (size() < 8) work.recall.push(...pick(more.filter(e => COACH_STEPS.recall.includes(e.type)), 8 - size()));
  if (size() < 8) work.recognise.push(...pick(more.filter(e => COACH_STEPS.recognise.includes(e.type)), 8 - size()));
  // Over twelve, recognising goes first: typing is what the stage is for.
  while (work.recognise.length + work.recall.length + work.produce.length > 12) (work.recognise.length ? work.recognise : work.recall.length ? work.recall : work.produce).shift();
  return [...cards, ...work.recognise, ...work.recall, ...work.produce];
}
function shuffleWith(list, rand) { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- The review stage in the app ----------
// Loaded after the first screen with the simulator, so none of this weighs on the first paint.
Object.assign(I18N.he, {
  reviewTitle: 'שלב חיזוק אישי', reviewDoneTitle: 'שלב החיזוק הושלם', reviewTip: 'חיזוק', reviewGo: 'בואו נחזק', reviewEmpty: 'אין עדיין תרגילים לחזק כאן.',
  whyMix: (a, b) => `ראיתי שהתבלבלתם בין ‎${a}‎ ל־‎${b}‎.`, whyForgot: c => `ראיתי ש־‎${c}‎ עוד לא יושבת טוב.`, whyWrong: c => `ראיתי שב־‎${c}‎ חסר לכם עוד חלק קטן.`,
  why_path: 'ראיתי שכמה פקודות לא מצאו את הקובץ, כי הנתיב לא היה נכון.', why_perm: 'ראיתי שכמה פקודות נעצרו בגלל הרשאות.', why_quote: 'ראיתי שכמה פקודות נשברו בגלל מרכאה או סוגר שלא נסגרו.', why_args: 'ראיתי שכמה פקודות קיבלו פחות ממה שהן צריכות.',
  reviewLead: 'בנינו לכם שלב קצר על זה בדיוק. הוא לא חוסם את המסלול ולא עולה לבבות.', reviewAgain: 'חזרנו לזה, אז הפעם ננסה דרך אחרת: יותר הקלדה בטרמינל.',
  reviewReady: names => `המאמן הכין לכם שלב חיזוק: ${names}`, reviewMastered: names => `חיזקתם: ${names}`, reviewNotYet: 'עוד קצת תרגול. נחזור לזה בשלב חיזוק אחר.',
});
Object.assign(I18N.en, {
  reviewTitle: 'Your review stage', reviewDoneTitle: 'Review stage done', reviewTip: 'Review', reviewGo: "Let's practise", reviewEmpty: 'There is nothing to review here yet.',
  whyMix: (a, b) => `I saw you mix up ${a} and ${b}.`, whyForgot: c => `I saw that ${c} hasn't stuck yet.`, whyWrong: c => `I saw that ${c} is still missing a small part.`,
  why_path: "I saw a few commands miss their file because the path wasn't right.", why_perm: 'I saw a few commands stop on permissions.', why_quote: 'I saw a few commands break on a quote or bracket left open.', why_args: 'I saw a few commands get less than they need.',
  reviewLead: "We built a short stage on exactly this. It doesn't block the path and costs no hearts.", reviewAgain: "This came back, so this time we'll try another way: more typing in the terminal.",
  reviewReady: names => `Your coach made you a review stage: ${names}`, reviewMastered: names => `You strengthened: ${names}`, reviewNotYet: "A little more practice. We'll come back to this in another review stage.",
});
const conceptName = c => tr(coachName(c));
function reviewWhy(c) {
  const r = coachReason(c);
  if (r.kind === 'mix') return t('whyMix', r.a, r.b);
  if (COACH_ROOT_NAMES.has(r.kind)) return t(`why_${r.kind}`);
  return t(r.kind === 'forgot' ? 'whyForgot' : 'whyWrong', conceptName(c));
}
function reviewPop(anchor) {
  closePop(); SFX.tap();
  const r = S.review, pop = el('div', `pop ${r.done ? 'done' : 'current'}`); pop.id = 'pop'; pop.setAttribute('role', 'dialog');
  pop.append(el('h3', '', r.done ? t('reviewDoneTitle') : t('reviewTitle')));
  const lead = el('div', 'review-why');
  if (r.done) lead.append(el('p', '', r.mastered.length ? t('reviewMastered', r.mastered.map(conceptName).join(', ')) : t('reviewNotYet')));
  else { for (const c of r.concepts) { const p = el('p'); p.append(bidi(reviewWhy(c))); lead.append(p); } lead.append(el('p', 'pop-lead', r.variant ? t('reviewAgain') : t('reviewLead'))); }
  pop.append(lead);
  const go = el('button', 'btn primary', r.done ? t('again') : t('reviewGo'));
  go.onclick = () => { closePop(); startReview(); };
  pop.append(go);
  showPop(anchor, pop);
}
// Every exercise of the units the learner has reached, with the uid its mistakes are kept under. A review never
// brings in a unit the learner has not started.
function reviewPool() {
  const open = availableCourse().filter(u => !u.locked && !u.exam && inTrack(u)), next = open.flatMap(unitNodes).find(n => !S.done.includes(n.key))?.unit;
  const units = open.filter(u => u === next || unitNodes(u).some(n => S.done.includes(n.key)));
  const pool = units.flatMap(u => u.lessons.flatMap((ls, li) => withFixture(u, ls.exercises).map((ex, i) => ({ ...ex, uid: `${unitKey(u, `L${li}`)}.${i}` }))));
  return { pool: pool.filter(e => e.type !== 'teach'), teach: pool.filter(e => e.type === 'teach') };
}
function startReview() {
  const r = S.review; if (!r) return;
  const items = coachBuild(r.concepts, { ...reviewPool(), failed: new Set(S.mistakes), variant: r.variant });
  if (!items.some(e => e.type !== 'teach')) return toast(t('reviewEmpty'));
  startLesson(r.key, items, { review: true, practice: true, title: t('reviewTitle') });
}
// After a lesson or a test: a review stage when something is weak, at most one a day and one open at a time.
// A concept met again in a review within two weeks gets the next mix of exercises.
function planReview() {
  const today = coachDay();
  if (S.review && (!S.review.done || S.review.day === today)) return null;
  const concepts = coachFocus(); if (!concepts.length) return null;
  const order = availableCourse().filter(u => inTrack(u) && !u.locked).flatMap(unitNodes);
  const at = order.find(n => !S.done.includes(n.key) && n.kind !== 'exam')?.key || '';
  const variant = Math.max(0, ...concepts.map(c => S.reviewLog.filter(x => today - x.day <= 14 && x.concepts.includes(c)).length));
  S.review = { key: `review-${today}`, day: today, concepts, at, variant: Math.min(2, variant), done: false, mastered: [] };
  save();
  return S.review;
}
// A concept is mastered in a review when it was typed right without help in two different exercises. Its misses are
// cleared so the model starts again from what the learner can do now; the others stay for the next review.
function finishReview() {
  const r = S.review, mastered = r.concepts.filter(c => (L.mastery?.[c]?.size || 0) >= 2);
  for (const c of mastered) {
    const e = S.skill[c]; if (e) { e[SKILL.forgot] = 0; e[SKILL.wrong] = 0; e[SKILL.helped] = 0; e[SKILL.typo] = 0; }
    if (c.startsWith('cmd:')) for (const k of Object.keys(S.confuse)) if (k.split('>').includes(c.slice(4))) delete S.confuse[k];
  }
  r.done = true; r.mastered = mastered;
  S.reviewLog = [...S.reviewLog, { key: r.key, day: r.day, concepts: r.concepts, at: '', variant: r.variant, done: true, mastered }].slice(-40);
  return mastered;
}
// Tells the coach's knowledge model what this answer showed. Picking an option is not typing, so a pick that is close
// to the right one counts as the wrong option, not as a typo.
function learnFrom(ok) {
  const ex = L.ex, r = { ok, helped: !!L.helped || (L.termErrs || 0) >= 2, roots: [...(L.roots || [])] };
  if (!ok) {
    const picked = { choice: !ex.plain && [L.value, ex.answer], sentence: [L.value, ex.answer], tiles: [L.value, ex.answer], fill: [`${ex.before}${L.value}${ex.after}`, `${ex.before}${ex.answer}${ex.after}`] }[ex.type];
    const miss = picked ? (picked[0] != null && explainMiss([String(picked[0])], [String(picked[1])])) : typedMiss(ex);
    Object.assign(r, coachBlame(miss || null, miss?.got, miss?.want));
    if (picked && r.kind === 'typo') r.kind = 'wrong';
    // Picking one command where another was right is a mix-up between the two.
    const one = v => /^[a-z][\w.+-]*$/.test(String(v ?? '')) && isCommand(String(v));
    if (picked && one(L.value) && one(ex.answer) && L.value !== ex.answer) Object.assign(r, { kind: 'forgot', blame: [`cmd:${ex.answer}`], confuse: [L.value, ex.answer] });
  }
  try { coachRecord(ex, r); } catch { /* the model never stops a lesson */ }
  if (L.opts.review && ok && !r.helped && PRODUCE.has(ex.type)) for (const c of coachConcepts(ex).focus) if (S.review?.concepts.includes(c)) ((L.mastery ||= {})[c] ||= new Set()).add(ex.uid);
  L.helped = false; L.termErrs = 0; L.roots = null;
}
