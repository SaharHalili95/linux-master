// Terminal missions shaped like Bandit levels 1-12. Each run plants a fresh random password,
// so there is nothing to memorise and nothing taken from the real game.
function missionPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function missionBase(files, extra = {}) {
  return { cwd: '/home/bandit', env: { HOME: '/home/bandit', USER: 'bandit' }, dirs: ['/home/bandit', '/tmp', '/etc', ...(extra.dirs || [])], files: files.map(([p, f]) => [p.startsWith('/') ? p : `/home/bandit/${p}`, typeof f === 'string' ? { content: f } : f]), locked: extra.locked || [], history: [], processes: { short: [], full: [] }, who: [] };
}
const randomWord = () => missionPassword().slice(0, 8);
const binaryJunk = n => Array.from({ length: n }, (_, i) => String.fromCharCode(i % 7 === 0 ? 0 : 128 + ((i * 37) % 120))).join('');

const MISSIONS = [
  { level: 1, solution: 'cat readme',
    he: 'הסיסמה נמצאת בקובץ בשם readme בתיקיית הבית.', en: 'The password is in a file called readme in the home directory.',
    build: pw => missionBase([['readme', `Congratulations on your first steps into Linux.\nThe password you are looking for is: ${pw}\n`]]) },
  { level: 2, solution: 'cat ./-',
    he: 'הסיסמה נמצאת בקובץ ששמו הוא מקף: -', en: 'The password is in a file named with a single dash: -',
    build: pw => missionBase([['-', `${pw}\n`]]) },
  { level: 3, solution: 'cat -- "--spaces in this filename--"',
    he: 'הסיסמה נמצאת בקובץ בשם ‎--spaces in this filename--', en: 'The password is in a file called --spaces in this filename--',
    build: pw => missionBase([['--spaces in this filename--', `${pw}\n`]]) },
  { level: 4, solution: 'cat inhere/...Hiding-From-You',
    he: 'הסיסמה נמצאת בקובץ מוסתר בתוך התיקייה inhere.', en: 'The password is in a hidden file inside the inhere directory.',
    build: pw => missionBase([['inhere/...Hiding-From-You', `${pw}\n`]], { dirs: ['/home/bandit/inhere'] }) },
  { level: 5, solution: 'cat inhere/-file07',
    he: 'הסיסמה נמצאת בקובץ היחיד שהתוכן שלו קריא בתיקייה inhere.', en: 'The password is in the only human-readable file in the inhere directory.',
    build: pw => missionBase(Array.from({ length: 10 }, (_, i) => [`inhere/-file0${i}`, i === 7 ? `${pw}\n` : binaryJunk(33)]), { dirs: ['/home/bandit/inhere'] }) },
  { level: 6, solution: 'cat inhere/maybehere07/.file2',
    he: 'הסיסמה בקובץ איפשהו מתחת ל־inhere: קריא, בגודל 1033 בתים בדיוק, ולא ניתן להרצה.', en: 'The password is in a file somewhere under inhere: human-readable, exactly 1033 bytes, not executable.',
    build: pw => {
      const files = [], dirs = Array.from({ length: 12 }, (_, d) => `maybehere${String(d).padStart(2, '0')}`);
      dirs.forEach((dir, d) => {
        const target = d === 7;
        files.push([`inhere/${dir}/-file1`, { content: 'y'.repeat(1032) + '\n', mode: 0o755 }]);
        files.push([`inhere/${dir}/.file2`, target ? { content: pw + ' '.repeat(1033 - pw.length - 1) + '\n', mode: 0o644 } : { content: (d % 2 ? binaryJunk(1031) : 'x'.repeat(1031)) + '\n', mode: 0o644 }]);
        files.push([`inhere/${dir}/spaces file3`, { content: 'z'.repeat(999) + '\n', mode: 0o644 }]);
      });
      return missionBase(files, { dirs: ['/home/bandit/inhere', ...dirs.map(dir => `/home/bandit/inhere/${dir}`)] });
    } },
  { level: 7, solution: 'cat /var/lib/dpkg/info/bandit7.password',
    he: 'הסיסמה בקובץ איפשהו בשרת: בבעלות המשתמש bandit7 והקבוצה bandit6, בגודל 33 בתים.', en: 'The password is somewhere on the server: owned by user bandit7 and group bandit6, 33 bytes in size.',
    build: pw => missionBase([
      ['/var/lib/dpkg/info/bandit7.password', { content: pw + 'x'.repeat(32 - pw.length) + '\n', owner: 'bandit7', group: 'bandit6' }],
      ['/var/log/bandit7.log', { content: 'z'.repeat(32) + '\n', owner: 'bandit7', group: 'bandit7' }],
      ['/var/tmp/notes', { content: 'w'.repeat(32) + '\n', owner: 'bandit6', group: 'bandit6' }],
      ['/root/flag', { content: 'nope\n', owner: 'root', group: 'root' }],
    ], { dirs: ['/var', '/var/lib', '/var/lib/dpkg', '/var/lib/dpkg/info', '/var/log', '/var/tmp', '/root', '/etc/ssl', '/etc/ssl/private'], locked: ['/root', '/etc/ssl/private'] }) },
  { level: 8, solution: 'grep millionth data.txt',
    he: 'הסיסמה בקובץ data.txt, ליד המילה millionth.', en: 'The password is in data.txt, next to the word millionth.',
    build: pw => { const words = ['abandon', 'ballad', 'cactus', 'dolphin', 'ember', 'falcon', 'glacier', 'harbor', 'island', 'jungle']; const rows = Array.from({ length: 240 }, (_, i) => `${words[i % 10]}${i}\t${randomWord()}${randomWord()}`); rows.splice(173, 0, `millionth\t${pw}`); return missionBase([['data.txt', rows.join('\n') + '\n']]); } },
  { level: 9, solution: 'sort data.txt | uniq -u',
    he: 'הסיסמה בקובץ data.txt, והיא השורה היחידה שמופיעה רק פעם אחת.', en: 'The password is in data.txt and is the only line that appears exactly once.',
    build: pw => { const base = Array.from({ length: 30 }, () => missionPassword()); const rows = []; base.forEach((w, i) => { for (let k = 0; k < 2 + (i % 4); k++) rows.push(w); }); rows.push(pw); for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; } return missionBase([['data.txt', rows.join('\n') + '\n']]); } },
  { level: 10, solution: "strings data.txt | grep '=='",
    he: 'הסיסמה בקובץ data.txt, באחת המחרוזות הקריאות שמתחילות בכמה סימני =.', en: 'The password is in data.txt, in one of the few readable strings that start with several = signs.',
    build: pw => missionBase([['data.txt', `${binaryJunk(80)}\u0000========== the\u0000${binaryJunk(40)}\u0000==== xF@\u0000${binaryJunk(60)}\u0000========== password\u0000${binaryJunk(30)}\u0000========== is ${pw}\u0000${binaryJunk(50)}`]]) },
  { level: 11, solution: 'base64 -d data.txt',
    he: 'הסיסמה בקובץ data.txt, מקודדת ב־Base64.', en: 'The password is in data.txt, encoded as Base64.',
    build: pw => missionBase([['data.txt', btoa(`The password is ${pw}\n`) + '\n']]) },
  { level: 12, solution: "cat data.txt | tr 'A-Za-z' 'N-ZA-Mn-za-m'",
    he: 'הסיסמה בקובץ data.txt, וכל האותיות בו הוזזו ב־13 מקומות.', en: 'The password is in data.txt, where every letter has been rotated by 13 places.',
    build: pw => { const rot = s => s.replace(/[A-Za-z]/g, c => String.fromCharCode((c <= 'Z' ? 65 : 97) + (c.charCodeAt(0) - (c <= 'Z' ? 65 : 97) + 13) % 26)); return missionBase([['data.txt', rot(`The password is ${pw}`) + '\n']]); } },
];
