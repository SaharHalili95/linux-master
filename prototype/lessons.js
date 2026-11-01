// The Duolingo-style course. Correct outputs are never written by hand:
// "output" exercises run the command in the simulated shell (../shell.js) on the unit's fixture.
// Every terminal exercise lists a `solve` the tests type in, so each goal is known to be reachable.
function unitFixture() {
  return {
    cwd: '/home/user', env: { HOME: '/home/user', USER: 'user' },
    dirs: ['/home/user', '/home/user/docs', '/home/user/projects', '/home/user/photos', '/tmp', '/etc'],
    files: [
      ['/home/user/readme.txt', { content: 'Welcome to Linux!\n' }],
      ['/home/user/.bashrc', { content: 'alias ll="ls -l"\n' }],
      ['/home/user/projects/app.py', { content: 'print("hi")\n' }],
      ['/home/user/projects/.env', { content: 'MODE=dev\n' }],
      ['/home/user/docs/cv.pdf', { content: 'pdf\n' }],
      ['/home/user/docs/todo.txt', { content: 'learn cd\n' }],
      ['/home/user/photos/cat.jpg', { content: 'jpg\n' }],
    ],
    history: [],
  };
}

const CODE_WORDS = ['penguin', 'kernel', 'shell42', 'rootkey', 'tuxmode', 'bashful', 'pipedream', 'sudoku'];
function bossFixture() {
  const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  const dirs = ['docs', 'projects', 'photos'], hideIn = dirs[Math.floor(Math.random() * dirs.length)];
  const fx = unitFixture();
  fx.files.push([`/home/user/${hideIn}/.code`, { content: `The password is: ${word}\n` }]);
  for (const d of dirs) if (d !== hideIn) fx.files.push([`/home/user/${d}/note.txt`, { content: 'Not here. Keep looking.\n' }]);
  return { fx, word, hideIn };
}

// Part titles follow materials/curriculum.md; a unit's section is its part.
const PARTS = {
  1: T('יסודות', 'Foundations'), 2: T('כוח הטקסט', 'Text power'), 3: T('קבצים, הרשאות ודיסקים', 'Files, permissions and disks'),
  4: T('משתמשים, תהליכים, שירותים ואתחול', 'Users, processes, services and boot'), 5: T('התקנת תוכנה', 'Installing software'), 6: T('רשת ו־SSH', 'Networking and SSH'),
  7: T('סקריפטים ותזמון', 'Scripting and scheduling'), 8: T('אבטחה', 'Security'), 9: T('עוד נושאי מבחן', 'More exam topics'), 10: T('מבחני דמה', 'Mock exams'),
};

const COURSE = [
  {
    section: 1, unit: 1, exams: ['L103.1', 'F'], title: T('איפה אני?', 'Where am I?'), subtitle: T('מיקום, רשימת קבצים ומעבר בין תיקיות', 'Location, listing files and moving between folders'), color: 'green',
    lessons: [
      { title: T('pwd ו־ls', 'pwd and ls'), exercises: [
        { type: 'teach', cmd: 'pwd', name: 'print working directory', text: T('מדפיסה את התיקייה שבה אתם נמצאים עכשיו.', 'Prints the folder you are in right now.'), demo: [[], 'pwd'] },
        { type: 'choice', prompt: T('איזו פקודה מראה באיזו תיקייה אתם נמצאים?', 'Which command shows which folder you are in?'), options: ['pwd', 'ls', 'cd', 'cat'], answer: 'pwd',
          why: { ls: T('ls מציגה מה יש בתיקייה, לא איפה היא.', 'ls shows what is in the folder, not where it is.'), cd: T('cd עוברת לתיקייה אחרת.', 'cd moves you to another folder.'), cat: T('cat מציגה תוכן של קובץ.', 'cat shows the contents of a file.') } },
        { type: 'sentence', prompt: READ, text: T('הפקודה ___ מראה באיזו תיקייה אתם נמצאים.', 'The ___ command shows which folder you are in.'), options: ['pwd', 'ls', 'cd'], answer: 'pwd' },
        { type: 'teach', cmd: 'ls', name: 'list', text: T('מציגה את הקבצים והתיקיות שבתיקייה הנוכחית.', 'Shows the files and folders in the current folder.'), demo: [[], 'ls'] },
        { type: 'output', prompt: T('מה תדפיס הפקודה?', 'What will this print?'), cmd: 'ls', wrongCmds: ['ls projects', 'ls docs'], wrongText: ['/home/user'] },
        { type: 'match', prompt: T('התאימו כל פקודה למה שהיא עושה', 'Match each command to what it does'), pairs: [['pwd', T('מראה איפה אני', 'shows where I am')], ['ls', T('מציגה מה יש כאן', 'shows what is here')], ['ls docs', T('מציגה מה יש ב־docs', 'shows what is in docs')], ['cat readme.txt', T('מציגה תוכן של קובץ', 'shows a file')]] },
        { type: 'tiles', prompt: T('הציגו מה יש בתיקייה projects', 'Show what is in the projects folder'), answer: 'ls projects', tiles: ['ls', 'projects', 'pwd', 'docs', 'cd'] },
        { type: 'output', prompt: T('מה תדפיס הפקודה?', 'What will this print?'), cmd: 'pwd', wrongText: ['/home', 'home/user', '/user'] },
      ] },
      { title: T('לזוז עם cd', 'Moving with cd'), exercises: [
        { type: 'teach', cmd: 'cd', name: 'change directory', text: T('עוברת לתיקייה אחרת. אחרי cd אין פלט, אבל המיקום שלכם משתנה.', 'Moves you to another folder. cd prints nothing, but your location changes.'), demo: [['cd docs'], 'pwd'] },
        { type: 'choice', prompt: T('אתם בתיקיית הבית. איזו פקודה תכניס אתכם לתיקייה docs?', 'You are in your home folder. Which command takes you into docs?'), options: ['cd docs', 'ls docs', 'pwd docs', 'cat docs'], answer: 'cd docs',
          why: { 'ls docs': T('ls docs מציגה מה יש ב־docs, אבל אתם נשארים במקום.', 'ls docs shows what is in docs, but you stay where you are.'), 'pwd docs': T('pwd רק מדפיסה איפה אתם. היא לא מקבלת תיקייה.', 'pwd only prints where you are. It takes no folder.'), 'cat docs': T('cat קוראת קבצים, ו־docs היא תיקייה.', 'cat reads files, and docs is a folder.') } },
        { type: 'sentence', prompt: READ, text: T('כדי לעבור לתיקייה אחרת כותבים ___ ואחריו את שם התיקייה.', 'To go into another folder, type ___ and then the folder name.'), options: ['cd', 'ls', 'pwd'], answer: 'cd' },
        { type: 'output', prompt: T('מה תדפיס pwd אחרי הפקודות האלה?', 'What will pwd print after these commands?'), setup: ['cd projects'], cmd: 'pwd', wrongText: ['/home/user', '/projects', 'projects'] },
        { type: 'teach', cmd: 'cd ..', name: 'parent directory', text: T('עולה תיקייה אחת למעלה. שתי הנקודות הן התיקייה שמעל.', 'Goes up one folder. The two dots mean the folder above.'), demo: [['cd projects', 'cd ..'], 'pwd'] },
        { type: 'tiles', prompt: T('עלו תיקייה אחת למעלה', 'Go up one folder'), answer: 'cd ..', tiles: ['cd', '..', '.', '~', 'ls'] },
        { type: 'terminal', prompt: T('היכנסו לתיקייה photos, ואז הדפיסו איפה אתם', 'Go into photos, then print where you are'), hint: T('קודם cd, אחר כך pwd', 'First cd, then pwd'),
          goal: (sh, log) => sh.cwd === '/home/user/photos' && log.some(l => l.cmd === 'pwd' && l.out.trim() === '/home/user/photos'), solve: ['cd photos', 'pwd'] },
        { type: 'output', prompt: T('מה תדפיס pwd עכשיו?', 'What will pwd print now?'), setup: ['cd projects', 'cd ..'], cmd: 'pwd', wrongText: ['/home', '/home/user/projects', '/'] },
      ] },
      { title: T('קבצים מוסתרים', 'Hidden files'), exercises: [
        { type: 'teach', cmd: 'ls -a', name: 'all', text: T('מציגה גם קבצים מוסתרים. קובץ ששמו מתחיל בנקודה לא מופיע ב־ls רגיל.', 'Also shows hidden files. A file whose name starts with a dot does not show up in plain ls.'), demo: [['cd projects'], 'ls -a'] },
        { type: 'output', prompt: T('בתיקייה projects יש את app.py ואת הקובץ המוסתר ‎.env. מה תדפיס הפקודה?', 'The projects folder has app.py and the hidden file .env. What will this print?'), setup: ['cd projects'], cmd: 'ls -a', wrongCmds: ['ls'], wrongText: ['.env'] },
        { type: 'sentence', prompt: READ, text: T('קבצים ששמם מתחיל בנקודה מוסתרים. כדי לראות גם אותם כותבים ls ___.', 'Files whose name starts with a dot are hidden. To see them too, type ls ___.'), options: ['-a', '-l', '-n'], answer: '-a' },
        { type: 'fill', prompt: T('השלימו כדי לראות גם קבצים מוסתרים', 'Fill in the blank to see hidden files too'), before: 'ls ', after: '', options: ['-a', '-h', '..', '~'], answer: '-a' },
        { type: 'choice', prompt: T('מה הן . ו־.. שמופיעות בפלט של ls -a?', 'What are . and .. in the output of ls -a?'), plain: true,
          options: [T('התיקייה הנוכחית והתיקייה שמעליה', 'The current folder and the folder above it'), T('שני קבצים מוסתרים ריקים', 'Two empty hidden files'), T('סימן שיש שגיאה', 'A sign of an error'), T('קיצורי דרך לתיקיית הבית', 'Shortcuts to the home folder')],
          why: [null, T('הן לא קבצים. אלה שמות מיוחדים לתיקיות.', 'They are not files. They are special names for folders.'), T('זה פלט רגיל לגמרי.', 'This is completely normal output.'), T('הקיצור לתיקיית הבית הוא ~.', 'The shortcut to the home folder is ~.')] },
        { type: 'teach', cmd: 'ls -l', name: 'long', text: T('רשימה מפורטת: הרשאות, בעלים, גודל ותאריך של כל קובץ. נלמד לקרוא אותה ביחידת ההרשאות.', 'A detailed list: permissions, owner, size and date of each file. You will learn to read it in the permissions unit.'), sample: '-rw-r--r-- 1 user user 18 Oct 29 10:00 readme.txt' },
        { type: 'match', prompt: T('התאימו כל פקודה למה שהיא מציגה', 'Match each command to what it shows'), pairs: [['ls', T('רשימה רגילה', 'a plain list')], ['ls -a', T('כולל קבצים מוסתרים', 'including hidden files')], ['ls -l', T('רשימה מפורטת', 'a detailed list')], ['ls -la', T('מפורטת וכולל מוסתרים', 'detailed, with hidden files')]] },
        { type: 'tiles', prompt: T('הציגו את כל הקבצים, כולל המוסתרים, בתיקייה projects', 'Show all files, hidden ones too, in the projects folder'), answer: 'ls -a projects', accept: ['ls projects -a'], tiles: ['ls', '-a', 'projects', '-l', 'cd', 'docs'] },
      ] },
      { title: T('נתיבים: / ו־~', 'Paths: / and ~'), exercises: [
        { type: 'teach', cmd: 'cd /', name: 'root', text: T('/ היא תיקיית השורש, ההתחלה של כל המערכת. ~ היא תיקיית הבית שלכם.', '/ is the root folder, where the whole system starts. ~ is your home folder.'), demo: [['cd /'], 'pwd'] },
        { type: 'choice', prompt: T('איזו פקודה תחזיר אתכם הביתה מכל מקום?', 'Which command takes you home from anywhere?'), options: ['cd ~', 'cd /', 'cd ..', 'ls ~'], answer: 'cd ~',
          why: { 'cd /': T('cd / לוקחת אתכם לשורש, לא הביתה.', 'cd / takes you to the root, not home.'), 'cd ..': T('cd .. עולה רק תיקייה אחת.', 'cd .. only goes up one folder.'), 'ls ~': T('ls ~ מציגה מה יש בבית, אבל לא מעבירה אתכם לשם.', 'ls ~ shows what is at home, but does not take you there.') } },
        { type: 'sentence', prompt: READ, text: T('הסימן ___ מייצג את תיקיית הבית שלכם.', 'The ___ sign stands for your home folder.'), options: ['~', '/', '..'], answer: '~' },
        { type: 'output', prompt: T('בשורש יש שלוש תיקיות: etc, home ו־tmp. מה תדפיס הפקודה?', 'The root has three folders: etc, home and tmp. What will this print?'), setup: ['cd /'], cmd: 'ls', wrongCmds: ['ls ~'], wrongText: ['/'] },
        { type: 'choice', prompt: T('מה ההבדל בין ‎/home/user/docs לבין docs?', 'What is the difference between /home/user/docs and docs?'), plain: true,
          options: [T('הראשון נתיב מלא מהשורש, השני יחסי למקום שבו אתם', 'The first is a full path from the root, the second is relative to where you are'), T('אין הבדל', 'There is no difference'), T('הראשון תיקייה, השני קובץ', 'The first is a folder, the second a file'), T('השני תמיד מתחיל מהשורש', 'The second always starts at the root')],
          why: [null, T('docs לבד עובד רק כשאתם בתיקייה שמכילה אותה.', 'docs alone only works when you are in the folder that contains it.'), T('שניהם יכולים להצביע על אותה תיקייה.', 'Both can point to the same folder.'), T('נתיב שלא מתחיל ב־/ מתחיל מהמקום שבו אתם.', 'A path that does not start with / starts from where you are.')] },
        { type: 'tiles', prompt: T('עברו לתיקייה docs בעזרת נתיב מלא', 'Go to docs using a full path'), answer: 'cd /home/user/docs', accept: ['cd ~/docs'], tiles: ['cd', '/home/user/docs', 'docs/home', 'ls', '..'] },
        { type: 'terminal', prompt: T('אתם ב־docs. עברו ל־projects בפקודת cd אחת', 'You are in docs. Get to projects with a single cd'), setup: ['cd docs'], hint: T('עלו למעלה ואז היכנסו: ‎../projects', 'Go up, then in: ../projects'),
          goal: (sh, log) => sh.cwd === '/home/user/projects' && log.filter(l => /^cd\b/.test(l.cmd)).length === 1, solve: ['cd ../projects'] },
        { type: 'output', prompt: T('מה תדפיס הפקודה?', 'What will this print?'), setup: ['cd docs'], cmd: 'cd ../photos && pwd', wrongText: ['/home/user/docs/photos', '/photos', '/home/user/docs'] },
      ] },
    ],
    boss: { title: T('אתגר היחידה', 'Unit challenge'), intro: T('מצאו סיסמה בקובץ מוסתר.', 'Find a password in a hidden file.'), text: d => T(`בתיקייה ${d} יש קובץ מוסתר בשם ‎.code, ובתוכו סיסמה. הציגו אותו עם ls -a ${d}, קראו אותו עם cat ${d}/.code והקלידו את הסיסמה למטה.`, `The ${d} folder has a hidden file called .code with a password inside. Show it with ls -a ${d}, read it with cat ${d}/.code and type the password below.`) },
  },
  UNIT_2,
  UNIT_3,
  UNIT_4,
  UNIT_5,
  UNIT_6,
];
