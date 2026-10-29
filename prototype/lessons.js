// Unit 1 of the Duolingo-style course. Correct outputs are never written by hand:
// "output" exercises run the command in the simulated shell (../shell.js) on unitFixture().
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
  fx.files.push([`/home/user/${hideIn}/.code`, { content: `${word}\n` }]);
  for (const d of dirs) if (d !== hideIn) fx.files.push([`/home/user/${d}/note.txt`, { content: 'Not here. Keep looking.\n' }]);
  return { fx, word, hideIn };
}

const COURSE = [
  {
    section: 1, unit: 1, title: 'איפה אני?', subtitle: 'מיקום, רשימת קבצים ומעבר בין תיקיות', color: 'green',
    lessons: [
      { title: 'pwd ו־ls', exercises: [
        { type: 'teach', cmd: 'pwd', name: 'print working directory', text: 'מדפיסה את התיקייה שבה אתם נמצאים עכשיו.', demo: [[], 'pwd'] },
        { type: 'choice', prompt: 'איזו פקודה מראה באיזו תיקייה אתם נמצאים?', options: ['pwd', 'ls', 'cd', 'cat'], answer: 'pwd',
          why: { ls: 'ls מציגה מה יש בתיקייה, לא איפה היא.', cd: 'cd עוברת לתיקייה אחרת.', cat: 'cat מציגה תוכן של קובץ.' } },
        { type: 'teach', cmd: 'ls', name: 'list', text: 'מציגה את הקבצים והתיקיות שבתיקייה הנוכחית.', demo: [[], 'ls'] },
        { type: 'output', prompt: 'מה תדפיס הפקודה?', cmd: 'ls', wrongCmds: ['ls projects', 'ls docs'], wrongText: ['/home/user'] },
        { type: 'match', prompt: 'התאימו כל פקודה למה שהיא עושה', pairs: [['pwd', 'מראה איפה אני'], ['ls', 'מציגה מה יש כאן'], ['ls docs', 'מציגה מה יש ב־docs'], ['cat readme.txt', 'מציגה תוכן של קובץ']] },
        { type: 'tiles', prompt: 'הציגו מה יש בתיקייה projects', answer: 'ls projects', tiles: ['ls', 'projects', 'pwd', 'docs', 'cd'] },
        { type: 'output', prompt: 'מה תדפיס הפקודה?', cmd: 'pwd', wrongText: ['/home', 'home/user', '/user'] },
      ] },
      { title: 'לזוז עם cd', exercises: [
        { type: 'teach', cmd: 'cd', name: 'change directory', text: 'עוברת לתיקייה אחרת. אחרי cd אין פלט, אבל המיקום שלכם משתנה.', demo: [['cd docs'], 'pwd'] },
        { type: 'choice', prompt: 'אתם בתיקיית הבית. איזו פקודה תכניס אתכם לתיקייה docs?', options: ['cd docs', 'ls docs', 'pwd docs', 'cat docs'], answer: 'cd docs',
          why: { 'ls docs': 'ls docs מציגה מה יש ב־docs, אבל אתם נשארים במקום.', 'pwd docs': 'pwd רק מדפיסה איפה אתם. היא לא מקבלת תיקייה.', 'cat docs': 'cat קוראת קבצים, ו־docs היא תיקייה.' } },
        { type: 'output', prompt: 'מה תדפיס pwd אחרי הפקודות האלה?', setup: ['cd projects'], cmd: 'pwd', wrongText: ['/home/user', '/projects', 'projects'] },
        { type: 'teach', cmd: 'cd ..', name: 'parent directory', text: 'עולה תיקייה אחת למעלה. שתי הנקודות הן התיקייה שמעל.', demo: [['cd projects', 'cd ..'], 'pwd'] },
        { type: 'tiles', prompt: 'עלו תיקייה אחת למעלה', answer: 'cd ..', tiles: ['cd', '..', '.', '~', 'ls'] },
        { type: 'terminal', prompt: 'היכנסו לתיקייה photos, ואז הדפיסו איפה אתם', hint: 'קודם cd, אחר כך pwd',
          goal: (sh, log) => sh.cwd === '/home/user/photos' && log.some(l => l.cmd === 'pwd' && l.out.trim() === '/home/user/photos') },
        { type: 'output', prompt: 'מה תדפיס pwd עכשיו?', setup: ['cd projects', 'cd ..'], cmd: 'pwd', wrongText: ['/home', '/home/user/projects', '/'] },
      ] },
      { title: 'קבצים מוסתרים', exercises: [
        { type: 'teach', cmd: 'ls -a', name: 'all', text: 'מציגה גם קבצים מוסתרים. קובץ ששמו מתחיל בנקודה לא מופיע ב־ls רגיל.', demo: [['cd projects'], 'ls -a'] },
        { type: 'output', prompt: 'מה תדפיס הפקודה?', setup: ['cd projects'], cmd: 'ls -a', wrongCmds: ['ls'], wrongText: ['.env'] },
        { type: 'fill', prompt: 'השלימו כדי לראות גם קבצים מוסתרים', before: 'ls ', after: '', options: ['-a', '-h', '..', '~'], answer: '-a' },
        { type: 'choice', prompt: 'מה הן . ו־.. שמופיעות בפלט של ls -a?', options: ['התיקייה הנוכחית והתיקייה שמעליה', 'שני קבצים מוסתרים ריקים', 'סימן שיש שגיאה', 'קיצורי דרך לתיקיית הבית'], answer: 'התיקייה הנוכחית והתיקייה שמעליה', plain: true,
          why: { 'שני קבצים מוסתרים ריקים': 'הן לא קבצים. אלה שמות מיוחדים לתיקיות.', 'סימן שיש שגיאה': 'זה פלט רגיל לגמרי.', 'קיצורי דרך לתיקיית הבית': 'הקיצור לתיקיית הבית הוא ~.' } },
        { type: 'teach', cmd: 'ls -l', name: 'long', text: 'רשימה מפורטת: הרשאות, בעלים, גודל ותאריך של כל קובץ. נלמד לקרוא אותה ביחידת ההרשאות.', sample: '-rw-r--r-- 1 user user 18 Oct 29 10:00 readme.txt' },
        { type: 'match', prompt: 'התאימו כל פקודה למה שהיא מציגה', pairs: [['ls', 'רשימה רגילה'], ['ls -a', 'כולל קבצים מוסתרים'], ['ls -l', 'רשימה מפורטת'], ['ls -la', 'מפורטת וכולל מוסתרים']] },
        { type: 'tiles', prompt: 'הציגו את כל הקבצים, כולל המוסתרים, בתיקייה projects', answer: 'ls -a projects', accept: ['ls projects -a'], tiles: ['ls', '-a', 'projects', '-l', 'cd', 'docs'] },
      ] },
      { title: 'נתיבים: / ו־~', exercises: [
        { type: 'teach', cmd: 'cd /', name: 'root', text: '/ היא תיקיית השורש, ההתחלה של כל המערכת. ~ היא תיקיית הבית שלכם.', demo: [['cd /'], 'pwd'] },
        { type: 'choice', prompt: 'איזו פקודה תחזיר אתכם הביתה מכל מקום?', options: ['cd ~', 'cd /', 'cd ..', 'ls ~'], answer: 'cd ~',
          why: { 'cd /': 'cd / לוקחת אתכם לשורש, לא הביתה.', 'cd ..': 'cd .. עולה רק תיקייה אחת.', 'ls ~': 'ls ~ מציגה מה יש בבית, אבל לא מעבירה אתכם לשם.' } },
        { type: 'output', prompt: 'מה תדפיס הפקודה?', setup: ['cd /'], cmd: 'ls', wrongCmds: ['ls ~'], wrongText: ['/'] },
        { type: 'choice', prompt: 'מה ההבדל בין ‎/home/user/docs לבין docs?', options: ['הראשון נתיב מלא מהשורש, השני יחסי למקום שבו אתם', 'אין הבדל', 'הראשון תיקייה, השני קובץ', 'השני תמיד מתחיל מהשורש'], answer: 'הראשון נתיב מלא מהשורש, השני יחסי למקום שבו אתם', plain: true,
          why: { 'אין הבדל': 'docs לבד עובד רק כשאתם בתיקייה שמכילה אותה.', 'הראשון תיקייה, השני קובץ': 'שניהם יכולים להצביע על אותה תיקייה.', 'השני תמיד מתחיל מהשורש': 'נתיב שלא מתחיל ב־/ מתחיל מהמקום שבו אתם.' } },
        { type: 'tiles', prompt: 'עברו לתיקייה docs בעזרת נתיב מלא', answer: 'cd /home/user/docs', accept: ['cd ~/docs'], tiles: ['cd', '/home/user/docs', 'docs/home', 'ls', '..'] },
        { type: 'terminal', prompt: 'אתם ב־docs. עברו ל־projects בפקודת cd אחת', setup: ['cd docs'], hint: 'עלו למעלה ואז היכנסו: ‎../projects',
          goal: (sh, log) => sh.cwd === '/home/user/projects' && log.filter(l => /^cd\b/.test(l.cmd)).length === 1 },
        { type: 'output', prompt: 'מה תדפיס הפקודה?', setup: ['cd docs'], cmd: 'cd ../photos && pwd', wrongText: ['/home/user/docs/photos', '/photos', '/home/user/docs'] },
      ] },
    ],
    boss: { title: 'אתגר היחידה', text: 'בבית יש מילת קוד בקובץ מוסתר, באחת מהתיקיות. מצאו אותה.' },
  },
  { section: 1, unit: 2, title: 'קריאת קבצים', subtitle: 'קוראים קבצים מההתחלה ומהסוף', color: 'purple', locked: true },
];
