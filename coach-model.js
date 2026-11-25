/* global S */
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
