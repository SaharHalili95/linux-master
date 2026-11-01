// Part 3: Files, permissions and disks, units 21-32. See materials/curriculum.md and materials/objectives/.
// filesFixture() is the home folder plus a script, a private file and a shared team folder.
function filesFixture() {
  const fx = homeFixture();
  fx.dirs.push('/home/user/team', '/var', '/var/log', '/usr', '/usr/bin', '/opt');
  fx.files.push(
    ['/home/user/backup.sh', { content: '#!/bin/bash\necho backing up\n' }],
    ['/home/user/secret.txt', { content: 'top secret\n', mode: 0o600 }],
    ['/home/user/team/plan.txt', { content: 'ship v2\n' }],
    ['/etc/hostname', { content: 'linux\n', owner: 'root' }],
    ['/etc/hosts', { content: '127.0.0.1 localhost\n', owner: 'root' }],
    ['/var/log/syslog', { content: 'system started\n', owner: 'root', mode: 0o640 }],
  );
  return fx;
}
const filesOut = (cmd, setup = []) => { const sh = new Shell(filesFixture()); for (const c of setup) sh.run(c); const r = sh.run(cmd); return r.out + r.err; };
const filesShown = (log, cmd, setup) => { const want = filesOut(cmd, setup).trim(); return !!want && log.some(l => l.out.trim() === want); };
const modeOf = (sh, p) => sh.meta(p)?.mode & 0o7777;

const UNIT_21 = {
  section: 3, unit: 21, exams: ['L104.6', 'R'], title: T('קישורים ו־inode', 'Links and inodes'), subtitle: T('קישור קשיח, קישור סימבולי ו־ls -i', 'Hard links, symbolic links and ls -i'), color: 'green', fixture: filesFixture,
  lessons: [
    { title: T('קישור סימבולי', 'Symbolic links'), exercises: [
      { type: 'teach', cmd: 'ln -s', name: 'symbolic link', text: T('קישור סימבולי הוא "קיצור דרך": קובץ קטן שמצביע על נתיב של קובץ אחר. ‎ln -s target link‎: קודם היעד, אחר כך שם הקישור. ב־ls -l הוא מתחיל ב־l ומראה ‎->‎ לאן הוא מצביע.', 'A symbolic link is a "shortcut": a small file that points to another file\'s path. ln -s target link: the target first, then the link name. In ls -l it starts with l and shows -> where it points.'), demo: [['ln -s notes.txt todo'], 'ls -l todo'] },
      { type: 'output', prompt: T('מה תדפיס cat shortcut אחרי הפקודה? (ב־notes.txt כתובות 3 שורות)', 'What will cat shortcut print after this? (notes.txt has 3 lines)'), setup: ['ln -s notes.txt shortcut'], cmd: 'cat shortcut', wrongCmds: ['readlink shortcut'], wrongText: ['shortcut -> notes.txt'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ln ___ יוצרת קישור סימבולי.', 'The command ln ___ creates a symbolic link.'), options: ['-s', '-l', '-h'], answer: '-s' },
      { type: 'output', prompt: T('מה תדפיס ls -l config אחרי הפקודה?', 'What will ls -l config print after this command?'), setup: ['ln -s /etc/hosts config'], cmd: 'ls -l config', wrongText: ['-rw-r--r-- 1 user user 20 Nov  1 10:00 config', 'config -> /etc/hosts', 'lrwxrwxrwx 1 user user 10 Nov  1 10:00 /etc/hosts -> config'] },
      { type: 'choice', prompt: T('איזו פקודה יוצרת קישור בשם log שמצביע על logs/app.log?', 'Which command creates a link named log that points to logs/app.log?'), options: ['ln -s logs/app.log log', 'ln -s log logs/app.log', 'ln logs/app.log -s log', 'cp -s log logs/app.log'], answer: 'ln -s logs/app.log log',
        why: { 'ln -s log logs/app.log': T('הסדר הפוך: קודם היעד הקיים, אחר כך שם הקישור.', 'Wrong order: the existing target first, then the link name.'), 'ln logs/app.log -s log': T('האפשרות ‎-s‎ באה לפני הנתיבים.', 'The -s option comes before the paths.'), 'cp -s log logs/app.log': T('הסדר הפוך, ו־ln היא הפקודה הרגילה לקישורים.', 'The order is reversed, and ln is the usual command for links.') } },
      { type: 'teach', cmd: 'readlink', name: 'read link', text: T('readlink מדפיסה לאן קישור מצביע. ‎readlink -f‎ הולכת עד הסוף ומדפיסה את הנתיב המלא של הקובץ האמיתי.', 'readlink prints where a link points. readlink -f follows it all the way and prints the full path of the real file.'), demo: [['ln -s notes.txt n'], 'readlink -f n'] },
      { type: 'terminal', prompt: T('צרו בתיקיית הבית קישור סימבולי בשם hosts שמצביע על ‎/etc/hosts, והציגו אותו עם cat', 'Create a symbolic link named hosts in your home folder that points to /etc/hosts, and show it with cat'), hint: T('ln -s /etc/hosts hosts ואז cat hosts', 'ln -s /etc/hosts hosts, then cat hosts'), goal: (sh, log) => sh.files.get('/home/user/hosts')?.link === '/etc/hosts' && log.some(l => l.out === '127.0.0.1 localhost'), solve: ['ln -s /etc/hosts hosts', 'cat hosts'] },
    ] },
    { title: T('קישור קשיח', 'Hard links'), exercises: [
      { type: 'teach', cmd: 'ln', name: 'hard link', text: T('בלי ‎-s‎, ln יוצרת קישור קשיח: עוד שם לאותו תוכן בדיוק בדיסק. אין "מקור" ו"העתק", שני השמות שווים. המספר השני ב־ls -l הוא כמה שמות יש לתוכן.', 'Without -s, ln makes a hard link: another name for the exact same content on disk. There is no "original" and "copy", both names are equal. The second number in ls -l is how many names the content has.'), demo: [['ln notes.txt same.txt'], 'ls -l notes.txt same.txt'] },
      { type: 'output', prompt: T('מה תדפיס cat b.txt אחרי שלוש הפקודות?', 'What will cat b.txt print after the three commands?'), setup: ['echo one > a.txt', 'ln a.txt b.txt', 'echo two >> a.txt'], cmd: 'cat b.txt', wrongText: ['one', 'two', 'cat: b.txt: No such file or directory'] },
      { type: 'sentence', prompt: READ, text: T('קישור ___ הוא שם נוסף לאותו תוכן, והוא עובד גם אחרי שמוחקים את השם הראשון.', 'A ___ link is another name for the same content, and it keeps working after the first name is deleted.'), options: ['hard', 'soft', 'dead'], answer: 'hard' },
      { type: 'output', prompt: T('מה תדפיס cat hard.txt, אחרי שמחקו את a.txt?', 'What will cat hard.txt print, after a.txt was deleted?'), setup: ['echo hello > a.txt', 'ln a.txt hard.txt', 'rm a.txt'], cmd: 'cat hard.txt', wrongText: ['cat: hard.txt: No such file or directory', ''] },
      { type: 'output', prompt: T('על לינוקס אמיתי: יצרו קישור סימבולי link.txt אל a.txt, ואז מחקו את a.txt. מה הודפס?', 'On real Linux: link.txt was made as a symbolic link to a.txt, then a.txt was deleted. What was printed?'), rec: 'ubuntu-ln-dangling', wrongText: ['hi', 'link.txt -> a.txt'] },
      { type: 'match', prompt: T('התאימו כל משפט לסוג הקישור', 'Match each statement to the kind of link'), pairs: [['ln -s', T('מצביע על נתיב, יכול להישבר', 'points to a path, can break')], ['ln', T('עוד שם לאותו תוכן', 'another name for the same content')], ['l...', T('הסימן של קישור סימבולי ב־ls -l', 'how a symlink starts in ls -l')], ['ls -l', T('מראה כמה שמות יש לתוכן', 'shows how many names the content has')]] },
      { type: 'choice', prompt: T('מה אי אפשר לעשות עם קישור קשיח, אבל אפשר עם סימבולי?', 'What can a hard link not do that a symbolic link can?'), plain: true,
        options: [T('להצביע על תיקייה', 'Point to a folder'), T('להציג את התוכן עם cat', 'Show the content with cat'), T('להיות ברשימה של ls', 'Appear in ls'), T('להישאר אחרי מחיקת המקור', 'Survive deleting the original')],
        why: [null, T('cat עובדת על שניהם.', 'cat works on both.'), T('ls מציגה את שניהם.', 'ls shows both.'), T('דווקא הקשיח שורד, והסימבולי נשבר.', 'The hard one survives; the symbolic one breaks.')] },
    ] },
    { title: T('inode', 'inodes'), exercises: [
      { type: 'teach', cmd: 'ls -i', name: 'inode', text: T('לכל תוכן בדיסק יש מספר, inode, שבו שמורים הגודל, ההרשאות והמיקום. שם של קובץ הוא רק מצביע ל־inode. ‎ls -i‎ מציגה את המספר: לקישורים קשיחים יש אותו מספר, ולסימבולי מספר משלו.', 'Every piece of content on disk has a number, an inode, holding its size, permissions and location. A file name just points to an inode. ls -i shows the number: hard links share it, and a symbolic link has its own.') },
      { type: 'output', prompt: T('על לינוקס אמיתי: hard.txt הוא קישור קשיח ל־a.txt, ו־soft.txt קישור סימבולי. מה הודפס?', 'On real Linux: hard.txt is a hard link to a.txt, and soft.txt a symbolic link. What was printed?'), rec: 'ubuntu-ls-i', wrongText: ['2646474 a.txt\n2646475 hard.txt\n2646476 soft.txt', '2646474 a.txt\n2646474 hard.txt\n2646474 soft.txt'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ls ___ מציגה את מספר ה־inode של כל קובץ.', 'The command ls ___ shows the inode number of each file.'), options: ['-i', '-n', '-l'], answer: '-i' },
      { type: 'teach', cmd: 'stat', name: 'status', text: T('stat מציגה את כל מה שה־inode יודע על קובץ: גודל, הרשאות, בעלים, מספר קישורים ותאריכים. ‎stat -c‎ מדפיסה רק את מה שמבקשים.', 'stat shows everything the inode knows about a file: size, permissions, owner, link count and dates. stat -c prints just what you ask for.') },
      { type: 'output', prompt: T('על לינוקס אמיתי, notes.txt מכיל hello והרשאות 640. מה הודפס?', 'On real Linux, notes.txt holds hello and has mode 640. What was printed?'), rec: 'ubuntu-stat', wrongText: ['notes.txt 6 bytes, mode 644 (-rw-r--r--), owner user, 1 link(s)', 'notes.txt 5 bytes, mode 640 (-rw-r-----), owner root, 2 link(s)'] },
      { type: 'match', prompt: T('התאימו כל פקודה למה שהיא מראה', 'Match each command to what it shows'), pairs: [['ls -i', T('מספר inode', 'the inode number')], ['stat', T('כל פרטי הקובץ', 'all the file details')], ['readlink', T('לאן קישור מצביע', 'where a link points')], ['ls -l', T('הרשאות, בעלים וגודל', 'permissions, owner and size')]] },
    ] },
    { title: T('חזרה', 'Review'), exercises: [
      { type: 'output', prompt: WHAT, setup: ['ln -s secret.txt s', 'ln notes.txt n'], cmd: 'ls -l s n', wrongText: ['lrwxrwxrwx 1 user user 10 Nov  1 10:00 n -> notes.txt\n-rw------- 2 user user 11 Nov  1 10:00 s', 'n\ns'] },
      { type: 'sentence', prompt: READ, text: T('קישור סימבולי שהיעד שלו נמחק נקרא קישור ___.', 'A symbolic link whose target was deleted is called a ___ link.'), options: ['broken', 'hard', 'empty'], answer: 'broken' },
      { type: 'choice', prompt: T('ב־ls -l כתוב ‎-rw-r--r-- 3 user user ... data.txt‎. מה אומר ה־3?', 'ls -l shows -rw-r--r-- 3 user user ... data.txt. What does the 3 mean?'), plain: true,
        options: [T('לתוכן יש 3 שמות (קישורים קשיחים)', 'The content has 3 names (hard links)'), T('הקובץ בגודל 3 בייטים', 'The file is 3 bytes'), T('יש 3 קישורים סימבוליים אליו', 'There are 3 symbolic links to it'), T('3 משתמשים פתחו אותו', '3 users have it open')],
        why: [null, T('הגודל מופיע אחרי הקבוצה.', 'The size comes after the group.'), T('קישורים סימבוליים לא נספרים כאן.', 'Symbolic links are not counted here.'), T('ls לא יודעת מי פתח קבצים.', 'ls does not know who has files open.')] },
      { type: 'tiles', prompt: T('צרו קישור סימבולי בשם latest שמצביע על logs/app.log', 'Create a symbolic link named latest that points to logs/app.log'), answer: 'ln -s logs/app.log latest', tiles: ['ln', '-s', 'logs/app.log', 'latest', 'cp', '-h'] },
      { type: 'terminal', prompt: T('צרו קישור קשיח בשם plan.bak לקובץ team/plan.txt, והציגו את שניהם עם ls -l', 'Make a hard link named plan.bak to team/plan.txt, and show both with ls -l'), hint: T('ln team/plan.txt plan.bak ואז ls -l team/plan.txt plan.bak', 'ln team/plan.txt plan.bak, then ls -l team/plan.txt plan.bak'), goal: sh => sh.files.get('/home/user/plan.bak') === sh.files.get('/home/user/team/plan.txt'), solve: ['ln team/plan.txt plan.bak', 'ls -l team/plan.txt plan.bak'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('מסדרים קיצורי דרך לקבצים חשובים.', 'Setting up shortcuts to important files.'), exercises: [
    { type: 'terminal', prompt: T('צרו קישור סימבולי בשם syslog בתיקיית הבית שמצביע על ‎/var/log/syslog', 'Create a symbolic link named syslog in your home folder pointing to /var/log/syslog'), hint: T('ln -s /var/log/syslog syslog', 'ln -s /var/log/syslog syslog'), goal: sh => sh.files.get('/home/user/syslog')?.link === '/var/log/syslog', solve: ['ln -s /var/log/syslog syslog'] },
    { type: 'terminal', prompt: T('צרו קישור קשיח בשם people.keep ל־people.csv, ואז מחקו את people.csv. ודאו עם cat שהתוכן עדיין שם', 'Make a hard link named people.keep to people.csv, then delete people.csv. Check with cat that the content is still there'), hint: T('ln people.csv people.keep, ‏rm people.csv, ‏cat people.keep', 'ln people.csv people.keep, rm people.csv, cat people.keep'), goal: (sh, log) => !sh.files.has('/home/user/people.csv') && sh.files.has('/home/user/people.keep') && log.some(l => l.out.startsWith('name,city,age')), solve: ['ln people.csv people.keep', 'rm people.csv', 'cat people.keep'] },
    { type: 'terminal', prompt: T('בדקו לאן מצביע הקישור current (הוא כבר קיים)', 'Check where the link current points (it already exists)'), setup: ['ln -s projects/app.py current'], hint: T('readlink current', 'readlink current'), goal: (sh, log) => log.some(l => l.out === 'projects/app.py'), solve: ['readlink current'] },
  ] },
};

const UNIT_22 = {
  section: 3, unit: 22, exams: ['L104.5', 'R', 'F'], title: T('הרשאות', 'Permissions'), subtitle: T('rwx, ‏ls -l ו־chmod', 'rwx, ls -l and chmod'), color: 'purple', fixture: filesFixture,
  lessons: [
    { title: T('לקרוא את ls -l', 'Reading ls -l'), exercises: [
      { type: 'teach', cmd: 'ls -l', name: 'long listing', text: T('ls -l מציגה שורה לכל קובץ: הרשאות, מספר קישורים, בעלים, קבוצה, גודל, תאריך ושם. התו הראשון הוא הסוג: - קובץ, d תיקייה, l קישור.', 'ls -l shows one line per file: permissions, link count, owner, group, size, date and name. The first character is the type: - file, d folder, l link.'), demo: [[], 'ls -l'] },
      { type: 'output', prompt: T('secret.txt הוא קובץ פרטי של user: רק הבעלים יכול לקרוא ולכתוב בו. מה תדפיס הפקודה?', 'secret.txt is user\'s private file: only the owner can read and write it. What will this print?'), cmd: 'ls -l secret.txt', wrongText: ['-rw-r--r-- 1 user user 11 Nov  1 10:00 secret.txt', '-rw------- 1 root root 11 Nov  1 10:00 secret.txt', 'drw------- 2 user user 4096 Nov  1 10:00 secret.txt'] },
      { type: 'sentence', prompt: READ, text: T('ב־ls -l, שורה שמתחילה ב־___ היא תיקייה.', 'In ls -l, a line starting with ___ is a folder.'), options: ['d', 'l', '-'], answer: 'd' },
      { type: 'match', prompt: T('התאימו כל חלק בשורה ‎-rw-r--r-- 1 user user 18 ... readme.txt‎', 'Match each part of -rw-r--r-- 1 user user 18 ... readme.txt'), pairs: [['-rw-r--r--', T('סוג והרשאות', 'type and permissions')], ['1', T('מספר קישורים', 'link count')], ['user', T('הבעלים', 'the owner')], ['18', T('גודל בבייטים', 'size in bytes')]] },
      { type: 'choice', prompt: T('בשורה ‎drwxr-xr-x 2 user user 4096 ... docs‎, מה זה docs?', 'In the line drwxr-xr-x 2 user user 4096 ... docs, what is docs?'), plain: true,
        options: [T('תיקייה', 'A folder'), T('קובץ בגודל 4096', 'A file of 4096 bytes'), T('קישור', 'A link'), T('קובץ מוסתר', 'A hidden file')],
        why: [null, T('ה־d בהתחלה אומר תיקייה. 4096 הוא הגודל של רשומת התיקייה.', 'The leading d means folder. 4096 is the folder entry\'s size.'), T('קישור מתחיל ב־l.', 'A link starts with l.'), T('מוסתר מתחיל בנקודה בשם.', 'A hidden name starts with a dot.')] },
      { type: 'terminal', prompt: T('הציגו את הפרטים המלאים (ls -l) של backup.sh ושל secret.txt', 'Show the full details (ls -l) of backup.sh and secret.txt'), hint: T('ls -l backup.sh secret.txt', 'ls -l backup.sh secret.txt'), goal: (sh, log) => filesShown(log, 'ls -l backup.sh secret.txt'), solve: ['ls -l backup.sh secret.txt'] },
    ] },
    { title: T('r, w ו־x', 'r, w and x'), exercises: [
      { type: 'teach', cmd: 'rwx', name: 'read write execute', text: T('אחרי סוג הקובץ באות שלוש שלישיות: לבעלים (u), לקבוצה (g) ולכל השאר (o). r קריאה, w כתיבה, x הרצה. בתיקייה, x אומר שמותר להיכנס אליה, ו־w שמותר ליצור ולמחוק בה.', 'After the type come three triplets: for the owner (u), the group (g) and everyone else (o). r read, w write, x execute. On a folder, x means you may enter it, and w that you may create and delete in it.') },
      { type: 'match', prompt: T('התאימו כל שלישייה ב־‎-rwxr-x---‎ למי שהיא שייכת ולמה שמותר לו', 'Match each triplet in -rwxr-x--- to whom it belongs and what they may do'), pairs: [['rwx', T('הבעלים: הכול', 'owner: everything')], ['r-x', T('הקבוצה: לקרוא ולהריץ', 'group: read and run')], ['---', T('השאר: כלום', 'others: nothing')], ['-', T('קובץ רגיל', 'a regular file')]] },
      { type: 'sentence', prompt: READ, text: T('ההרשאה ___ מאפשרת להריץ קובץ כתוכנה.', 'The ___ permission lets you run a file as a program.'), options: ['x', 'r', 'w'], answer: 'x' },
      { type: 'choice', prompt: T('ל־secret.txt יש ‎-rw-------‎ והבעלים הוא user. מי יכול לקרוא אותו?', 'secret.txt is -rw------- and owned by user. Who can read it?'), plain: true,
        options: [T('רק user (וגם root, שמותר לו הכול)', 'Only user (and root, who may do anything)'), T('כל מי שבקבוצה user', 'Everyone in the group user'), T('כולם', 'Everyone'), T('אף אחד', 'No one')],
        why: [null, T('לקבוצה יש ---.', 'The group has ---.'), T('לשאר יש ---.', 'Others have ---.'), T('לבעלים יש rw.', 'The owner has rw.')] },
      { type: 'choice', prompt: T('לתיקייה יש ‎drw-r--r--‎ (בלי x לבעלים). מה יקרה כש־user ינסה cd אליה?', 'A folder is drw-r--r-- (no x for the owner). What happens when user tries to cd into it?'), plain: true,
        options: [T('Permission denied: בלי x אי אפשר להיכנס לתיקייה', 'Permission denied: without x you cannot enter a folder'), T('זה יעבוד, כי יש r', 'It works, because there is r'), T('התיקייה תימחק', 'The folder is deleted'), T('cd תיצור אותה מחדש', 'cd recreates it')],
        why: [null, T('r בתיקייה רק נותן לראות את השמות.', 'r on a folder only lets you see the names.'), T('cd לא מוחקת.', 'cd does not delete.'), T('cd לא יוצרת תיקיות.', 'cd does not create folders.')] },
      { type: 'output', prompt: T('מה תדפיס הפקודה אחרי ש־notes.txt נהיה של root בלבד?', 'What will this print after notes.txt becomes root\'s only?'), setup: ['sudo chown root notes.txt', 'sudo chmod 600 notes.txt'], cmd: 'ls -l notes.txt', wrongText: ['-rw------- 1 user user 29 Nov  1 10:00 notes.txt', '-rw-r--r-- 1 root root 29 Nov  1 10:00 notes.txt'] },
    ] },
    { title: T('מספרים: 755, 644, 600', 'Numbers: 755, 644, 600'), exercises: [
      { type: 'teach', cmd: 'chmod 755', name: 'octal', text: T('כל שלישייה היא סכום: r=4, ‏w=2, ‏x=1. ‏rwx=7, ‏r-x=5, ‏rw-=6, ‏r--=4. לכן ‎chmod 755‎ זה rwxr-xr-x (סקריפטים ותיקיות), 644 זה rw-r--r-- (קבצים רגילים), ו־600 זה rw------- (סודות).', 'Each triplet is a sum: r=4, w=2, x=1. rwx=7, r-x=5, rw-=6, r--=4. So chmod 755 is rwxr-xr-x (scripts and folders), 644 is rw-r--r-- (regular files), and 600 is rw------- (secrets).'), demo: [['chmod 755 backup.sh'], 'ls -l backup.sh'] },
      { type: 'output', prompt: WHAT, setup: ['chmod 640 notes.txt'], cmd: 'ls -l notes.txt', wrongText: ['-rw-r--r-- 1 user user 29 Nov  1 10:00 notes.txt', '-rw-rw---- 1 user user 29 Nov  1 10:00 notes.txt'] },
      { type: 'sentence', prompt: READ, text: T('ההרשאה rwx שווה למספר ___.', 'The permission rwx equals the number ___.'), options: ['7', '5', '3'], answer: '7' },
      { type: 'match', prompt: T('התאימו כל מספר להרשאות', 'Match each number to its permissions'), pairs: [['755', 'rwxr-xr-x'], ['644', 'rw-r--r--'], ['600', 'rw-------'], ['700', 'rwx------']] },
      { type: 'choice', prompt: T('איזה מספר נותן לבעלים לקרוא ולכתוב, לקבוצה רק לקרוא, ולאחרים כלום?', 'Which number gives the owner read and write, the group read only, and others nothing?'), options: ['640', '644', '660', '604'], answer: '640',
        why: { 644: T('4 בסוף נותן לכולם לקרוא.', 'The final 4 lets everyone read.'), 660: T('6 לקבוצה נותן לה גם לכתוב.', '6 for the group lets it write too.'), 604: T('זה נותן לאחרים לקרוא ולקבוצה כלום.', 'That lets others read and the group nothing.') } },
      { type: 'fill', prompt: T('השלימו כדי ש־secret.txt יהיה קריא וכתיב רק לבעלים', 'Fill in so secret.txt is readable and writable by its owner only'), before: 'chmod ', after: ' secret.txt', options: ['600', '644', '777', '400'], answer: '600' },
      { type: 'terminal', prompt: T('תנו ל־backup.sh את ההרשאות 755', 'Give backup.sh the permissions 755'), hint: T('chmod 755 backup.sh', 'chmod 755 backup.sh'), goal: sh => modeOf(sh, '/home/user/backup.sh') === 0o755, solve: ['chmod 755 backup.sh'] },
    ] },
    { title: T('אותיות: u+x ו־go-w', 'Letters: u+x and go-w'), exercises: [
      { type: 'teach', cmd: 'chmod u+x', name: 'symbolic', text: T('אפשר לשנות רק חלק: u, ‏g, ‏o או a (כולם), ואז + להוסיף, - להוריד, או = לקבוע. ‎chmod u+x‎ מוסיפה הרצה לבעלים, ‎chmod go-w‎ מורידה כתיבה מהקבוצה ומהשאר, ו־‎chmod +x‎ מוסיפה הרצה לכולם.', 'You can change just part: u, g, o or a (all), then + to add, - to remove, or = to set. chmod u+x adds execute for the owner, chmod go-w removes write from group and others, and chmod +x adds execute for everyone.'), demo: [['chmod u+x backup.sh'], 'ls -l backup.sh'] },
      { type: 'output', prompt: WHAT, setup: ['chmod go-r readme.txt'], cmd: 'ls -l readme.txt', wrongText: ['-rw-r--r-- 1 user user 18 Nov  1 10:00 readme.txt', '-------r-- 1 user user 18 Nov  1 10:00 readme.txt'] },
      { type: 'sentence', prompt: READ, text: T('בפקודה chmod, האות ___ מייצגת את הבעלים.', 'In chmod, the letter ___ stands for the owner.'), options: ['u', 'o', 'w'], answer: 'u' },
      { type: 'match', prompt: T('התאימו כל פקודה למה שהיא משנה', 'Match each command to what it changes'), pairs: [['chmod u+x', T('הבעלים יכול להריץ', 'the owner can run it')], ['chmod go-w', T('רק הבעלים יכול לכתוב', 'only the owner can write')], ['chmod a+r', T('כולם יכולים לקרוא', 'everyone can read')], ['chmod o=', T('לשאר אין כלום', 'others get nothing')]] },
      { type: 'tiles', prompt: T('הפכו את backup.sh לקובץ שאפשר להריץ', 'Make backup.sh a file that can be run'), answer: 'chmod +x backup.sh', tiles: ['chmod', '+x', 'backup.sh', '-x', 'chown', '777'] },
      { type: 'choice', prompt: T('למה לא כדאי לפתור בעיית הרשאות עם chmod 777?', 'Why not fix a permission problem with chmod 777?'), plain: true,
        options: [T('כי אז כל משתמש במערכת יכול לשנות ולהריץ את הקובץ', 'Because then any user on the system can change and run the file'), T('כי 777 לא חוקי', 'Because 777 is not valid'), T('כי זה מוחק את הקובץ', 'Because it deletes the file'), T('כי רק root יכול להריץ קבצים כאלה', 'Because only root can run such files')],
        why: [null, T('777 חוקי, הוא פשוט פתוח מדי.', '777 is valid, just far too open.'), T('chmod לא מוחקת.', 'chmod does not delete.'), T('ההפך: כולם יכולים.', 'The opposite: everyone can.')] },
      { type: 'terminal', prompt: T('הורידו מהקבוצה ומהשאר את הרשאת הקריאה של people.csv', 'Remove read permission on people.csv from the group and others'), hint: T('chmod go-r people.csv', 'chmod go-r people.csv'), goal: sh => modeOf(sh, '/home/user/people.csv') === 0o600, solve: ['chmod go-r people.csv'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('מסדרים הרשאות לפני שמשתפים את המחשב.', 'Fixing permissions before sharing the computer.'), exercises: [
    { type: 'terminal', prompt: T('תנו לבעלים של backup.sh הרשאת הרצה, בלי לשנות את השאר', 'Give the owner of backup.sh execute permission, without changing anything else'), hint: T('chmod u+x backup.sh', 'chmod u+x backup.sh'), goal: sh => modeOf(sh, '/home/user/backup.sh') === 0o744, solve: ['chmod u+x backup.sh'] },
    { type: 'terminal', prompt: T('ודאו שרק אתם יכולים להיכנס לתיקייה team ולראות מה יש בה (700)', 'Make sure only you can enter the team folder and see inside it (700)'), hint: T('chmod 700 team', 'chmod 700 team'), goal: sh => modeOf(sh, '/home/user/team') === 0o700, solve: ['chmod 700 team'] },
    { type: 'terminal', prompt: T('הציגו את הפרטים של התיקייה team עצמה (לא את מה שבתוכה)', 'Show the details of the team folder itself (not what is inside it)'), setup: ['chmod 700 team'], hint: T('ls -ld team', 'ls -ld team'), goal: (sh, log) => log.some(l => l.out.startsWith('drwx------') && l.out.endsWith(' team')), solve: ['ls -ld team'] },
  ] },
};

const UNIT_23 = {
  section: 3, unit: 23, exams: ['L104.5', 'R'], title: T('בעלים ו־umask', 'Owners and umask'), subtitle: T('sudo, chown, chgrp וברירות מחדל', 'sudo, chown, chgrp and defaults'), color: 'blue', fixture: filesFixture,
  lessons: [
    { title: T('sudo', 'sudo'), exercises: [
      { type: 'teach', cmd: 'sudo', name: 'superuser do', text: T('root הוא המשתמש שמותר לו הכול. sudo מריצה פקודה אחת בתור root, אחרי שהיא שואלת את הסיסמה שלכם. רק משתמשים שהמנהל הרשה להם יכולים להשתמש בה.', 'root is the user who may do anything. sudo runs one command as root, after asking for your password. Only users the admin allowed can use it.'), demo: [[], 'sudo whoami'] },
      { type: 'output', prompt: WHAT, cmd: 'whoami', wrongCmds: ['sudo whoami'], wrongText: ['sudo'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ מריצה פקודה אחת בתור root.', 'The ___ command runs one command as root.'), options: ['sudo', 'su', 'root'], answer: 'sudo' },
      { type: 'output', prompt: T('ב־‎/etc יש את hostname ואת hosts, של root. מה תדפיס הפקודה?', '/etc has hostname and hosts, owned by root. What will this print?'), cmd: 'ls -l /etc', wrongText: ['-rw-r--r-- 1 user user  6 Nov  1 10:00 hostname\n-rw-r--r-- 1 user user 20 Nov  1 10:00 hosts', 'hostname\nhosts'] },
      { type: 'choice', prompt: T('למה לא לעבוד כל הזמן בתור root?', 'Why not work as root all the time?'), plain: true,
        options: [T('כי טעות אחת, כמו rm במקום הלא נכון, יכולה להרוס את כל המערכת', 'Because one mistake, like rm in the wrong place, can wreck the whole system'), T('כי root איטי יותר', 'Because root is slower'), T('כי ל־root אין תיקיית בית', 'Because root has no home folder'), T('כי root לא יכול להריץ ls', 'Because root cannot run ls')],
        why: [null, T('המהירות זהה.', 'The speed is the same.'), T('יש: ‎/root.', 'It does: /root.'), T('root יכול להריץ הכול.', 'root can run everything.')] },
      { type: 'terminal', prompt: T('בדקו בתור מי רצה פקודה עם sudo', 'Check who a command runs as with sudo'), hint: T('sudo whoami', 'sudo whoami'), goal: (sh, log) => log.some(l => l.out === 'root'), solve: ['sudo whoami'] },
    ] },
    { title: T('chown', 'chown'), exercises: [
      { type: 'teach', cmd: 'chown', name: 'change owner', text: T('משנה בעלים: ‎chown dana file‎, או בעלים וקבוצה: ‎chown dana:dev file‎. רק root יכול להעביר קובץ למשתמש אחר, לכן משתמשים ב־sudo. ‎-R‎ משנה גם את כל מה שבתוך תיקייה.', 'Changes the owner: chown dana file, or owner and group: chown dana:dev file. Only root can give a file to another user, so you use sudo. -R also changes everything inside a folder.'), demo: [['sudo chown root:root readme.txt'], 'ls -l readme.txt'] },
      { type: 'output', prompt: WHAT, cmd: 'chown root notes.txt', wrongCmds: ['ls notes.txt'], wrongText: [''] },
      { type: 'sentence', prompt: READ, text: T('ב־chown, התו ___ מפריד בין הבעלים לקבוצה, כמו ב־dana:dev.', 'In chown, the ___ character separates owner from group, as in dana:dev.'), options: [':', ',', '/'], answer: ':' },
      { type: 'output', prompt: WHAT, setup: ['sudo chown -R root:root team'], cmd: 'ls -l team', wrongText: ['total 4\n-rw-r--r-- 1 user user 8 Nov  1 10:00 plan.txt', 'plan.txt'] },
      { type: 'choice', prompt: T('איזו פקודה הופכת את root לבעלים של התיקייה team ושל כל מה שבתוכה?', 'Which command makes root the owner of team and everything inside it?'), options: ['sudo chown -R root team', 'sudo chown root team', 'chown -R root team', 'sudo chmod -R root team'], answer: 'sudo chown -R root team',
        why: { 'sudo chown root team': T('בלי ‎-R‎ רק התיקייה עצמה משתנה.', 'Without -R only the folder itself changes.'), 'chown -R root team': T('בלי sudo אין הרשאה להעביר בעלות.', 'Without sudo you are not allowed to give files away.'), 'sudo chmod -R root team': T('chmod משנה הרשאות, לא בעלים.', 'chmod changes permissions, not owners.') } },
      { type: 'terminal', prompt: T('הפכו את root לבעלים של backup.sh (וגם לקבוצה root)', 'Make root the owner of backup.sh (and root the group too)'), hint: T('sudo chown root:root backup.sh', 'sudo chown root:root backup.sh'), goal: sh => sh.meta('/home/user/backup.sh').owner === 'root' && sh.meta('/home/user/backup.sh').group === 'root', solve: ['sudo chown root:root backup.sh'] },
    ] },
    { title: T('chgrp וקבוצות', 'chgrp and groups'), exercises: [
      { type: 'teach', cmd: 'chgrp', name: 'change group', text: T('chgrp משנה רק את הקבוצה של קובץ. קבוצה מאפשרת לכמה משתמשים לחלוק קבצים: נותנים לקבוצה הרשאות ומכניסים אליה אנשים. groups מציגה לאילו קבוצות אתם שייכים.', 'chgrp changes only a file\'s group. A group lets several users share files: give the group permissions and add people to it. groups shows which groups you belong to.'), demo: [['sudo chgrp root team/plan.txt'], 'ls -l team/plan.txt'] },
      { type: 'output', prompt: WHAT, setup: ['sudo chgrp root notes.txt'], cmd: 'ls -l notes.txt', wrongText: ['-rw-r--r-- 1 root user 29 Nov  1 10:00 notes.txt', '-rw-r--r-- 1 root root 29 Nov  1 10:00 notes.txt'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ משנה רק את הקבוצה של קובץ.', 'The ___ command changes only the group of a file.'), options: ['chgrp', 'chown', 'chmod'], answer: 'chgrp' },
      { type: 'match', prompt: T('התאימו כל פקודה למה שהיא משנה', 'Match each command to what it changes'), pairs: [['chmod', T('הרשאות', 'permissions')], ['chown', T('בעלים (וקבוצה)', 'owner (and group)')], ['chgrp', T('רק קבוצה', 'group only')], ['umask', T('הרשאות של קבצים חדשים', 'permissions of new files')]] },
      { type: 'choice', prompt: T('צוות dev צריך לערוך את report.txt. מה הדרך הנכונה?', 'The dev team needs to edit report.txt. What is the right way?'), plain: true,
        options: [T('להעביר את הקובץ לקבוצה dev ולתת לקבוצה w', 'Put the file in the dev group and give the group w'), T('chmod 777 report.txt', 'chmod 777 report.txt'), T('לשלוח לכל אחד עותק', 'Send each person a copy'), T('להעביר את הבעלות לכל אחד בתורו', 'Hand ownership to each person in turn')],
        why: [null, T('זה פותח את הקובץ לכל המשתמשים במערכת.', 'That opens the file to every user on the system.'), T('אז יש כמה גרסאות שונות.', 'Then there are several different versions.'), T('לקובץ יש בעלים אחד בכל רגע.', 'A file has one owner at a time.')] },
      { type: 'terminal', prompt: T('העבירו את התיקייה team ואת כל מה שבה לקבוצה root', 'Move the team folder and everything in it to the group root'), hint: T('sudo chgrp -R root team', 'sudo chgrp -R root team'), goal: sh => sh.meta('/home/user/team').group === 'root' && sh.meta('/home/user/team/plan.txt').group === 'root', solve: ['sudo chgrp -R root team'] },
    ] },
    { title: T('umask', 'umask'), exercises: [
      { type: 'teach', cmd: 'umask', name: 'user mask', text: T('umask קובעת אילו הרשאות לא יקבלו קבצים חדשים. מתחילים מ־666 לקבצים ו־777 לתיקיות ומורידים את ה־umask. עם 022: קובץ חדש 644 ותיקייה 755. עם 077: ‏600 ו־700, רק לכם.', 'umask says which permissions new files will not get. Start from 666 for files and 777 for folders and take away the umask. With 022: a new file is 644 and a folder 755. With 077: 600 and 700, just for you.'), demo: [['umask 077', 'touch private.txt'], 'ls -l private.txt'] },
      { type: 'output', prompt: WHAT, cmd: 'umask', wrongText: ['022', '0644', '0755'] },
      { type: 'sentence', prompt: READ, text: T('עם umask ‏027, קובץ חדש מקבל את ההרשאות ___.', 'With umask 027, a new file gets the permissions ___.'), options: ['640', '750', '644'], answer: '640' },
      { type: 'output', prompt: T('על לינוקס אמיתי עם umask 027 יצרו קובץ f.txt ותיקייה d. מה הודפס?', 'On real Linux with umask 027, a file f.txt and a folder d were created. What was printed?'), rec: 'check-umask', wrongText: ['drwxr-xr-x 2 user user 4096 Nov  1 10:00 d\n-rw-r--r-- 1 user user    0 Nov  1 10:00 f.txt', 'drwxrwx--- 2 user user 4096 Nov  1 10:00 d\n-rw-rw---- 1 user user    0 Nov  1 10:00 f.txt'] },
      { type: 'match', prompt: T('התאימו כל umask להרשאות של קובץ חדש', 'Match each umask to a new file\'s permissions'), pairs: [['022', '644'], ['077', '600'], ['027', '640'], ['002', '664']] },
      { type: 'terminal', prompt: T('קבעו umask שבו קבצים חדשים יהיו רק שלכם (077), וצרו קובץ בשם diary.txt', 'Set a umask where new files are just yours (077), and create a file named diary.txt'), hint: T('umask 077 ואז touch diary.txt', 'umask 077, then touch diary.txt'), goal: sh => modeOf(sh, '/home/user/diary.txt') === 0o600, solve: ['umask 077', 'touch diary.txt'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('מכינים תיקייה משותפת לצוות.', 'Preparing a shared folder for the team.'), exercises: [
    { type: 'terminal', prompt: T('צרו את התיקייה ‎/opt/shared‎ (צריך root)', 'Create the folder /opt/shared (needs root)'), hint: T('sudo mkdir /opt/shared', 'sudo mkdir /opt/shared'), goal: sh => sh.dirs.has('/opt/shared'), solve: ['sudo mkdir /opt/shared'] },
    { type: 'terminal', prompt: T('העבירו את ‎/opt/shared‎ לבעלות user ולקבוצה user', 'Give /opt/shared to the owner user and the group user'), setup: ['sudo mkdir /opt/shared'], hint: T('sudo chown user:user /opt/shared', 'sudo chown user:user /opt/shared'), goal: sh => sh.meta('/opt/shared').owner === 'user' && sh.meta('/opt/shared').group === 'user', solve: ['sudo chown user:user /opt/shared'] },
    { type: 'terminal', prompt: T('תנו ל־‎/opt/shared‎ הרשאות 770: הכול לבעלים ולקבוצה, כלום לשאר', 'Give /opt/shared mode 770: everything for owner and group, nothing for others'), setup: ['sudo mkdir /opt/shared', 'sudo chown user:user /opt/shared'], hint: T('chmod 770 /opt/shared', 'chmod 770 /opt/shared'), goal: sh => modeOf(sh, '/opt/shared') === 0o770, solve: ['chmod 770 /opt/shared'] },
  ] },
};

const UNIT_24 = {
  section: 3, unit: 24, exams: ['L104.5', 'R', 'F'], title: T('ביטים מיוחדים ו־ACL', 'Special bits and ACLs'), subtitle: T('SUID, ‏SGID, ‏sticky ו־setfacl', 'SUID, SGID, sticky and setfacl'), color: 'green', fixture: filesFixture,
  lessons: [
    { title: T('SUID', 'SUID'), exercises: [
      { type: 'teach', cmd: 'chmod u+s', name: 'set user ID', text: T('קובץ עם SUID רץ בהרשאות של הבעלים שלו, לא של מי שהריץ. ככה passwd, של root, יכולה לשנות את ‎/etc/shadow בשבילכם. ב־ls -l רואים s במקום x של הבעלים. במספרים: 4 לפני השלישיות, למשל 4755.', 'A file with SUID runs with its owner\'s rights, not the caller\'s. That is how passwd, owned by root, can change /etc/shadow for you. In ls -l you see s instead of the owner\'s x. In numbers: 4 before the triplets, like 4755.') },
      { type: 'output', prompt: T('על לינוקס אמיתי הודפסו ההרשאות, הבעלים והשם של ‎/usr/bin/passwd‎. מה הודפס?', 'On real Linux, the permissions, owner and name of /usr/bin/passwd were printed. What was printed?'), rec: 'ubuntu-passwd-perm', wrongRec: ['ubuntu-tmp-perm'], wrongText: ['-rwxr-xr-x root /usr/bin/passwd'] },
      { type: 'sentence', prompt: READ, text: T('ב־ls -l, האות ___ במקום ה־x של הבעלים מסמנת SUID.', 'In ls -l, the letter ___ in place of the owner\'s x marks SUID.'), options: ['s', 't', 'u'], answer: 's' },
      { type: 'output', prompt: WHAT, setup: ['chmod 4755 backup.sh'], cmd: 'ls -l backup.sh', wrongText: ['-rwxr-xr-x 1 user user 29 Nov  1 10:00 backup.sh', '-rwxr-xr-t 1 user user 29 Nov  1 10:00 backup.sh'] },
      { type: 'output', prompt: T('על לינוקס אמיתי חיפשו ב־‎/usr/bin את כל הקבצים עם SUID. מה הודפס?', 'On real Linux, /usr/bin was searched for every SUID file. What was printed?'), rec: 'ubuntu-find-suid', wrongText: ['/usr/bin/passwd', '/usr/bin/ls\n/usr/bin/cat'] },
      { type: 'choice', prompt: T('למה מנהלי מערכת בודקים מדי פעם אילו קבצים הם SUID של root?', 'Why do admins check now and then which files are SUID root?'), plain: true,
        options: [T('תוכנה כזו עם באג נותנת לכל משתמש כוח של root', 'Such a program with a bug gives any user root power'), T('הם תופסים הרבה מקום', 'They take up a lot of space'), T('הם מאטים את המערכת', 'They slow the system down'), T('הם נמחקים אחרי עדכון', 'They are deleted after updates')],
        why: [null, T('הגודל רגיל.', 'Their size is normal.'), T('אין קשר למהירות.', 'It has nothing to do with speed.'), T('עדכונים שומרים עליהם.', 'Updates keep them.')] },
    ] },
    { title: T('SGID ו־sticky', 'SGID and sticky'), exercises: [
      { type: 'teach', cmd: 'chmod g+s', name: 'set group ID', text: T('SGID על תיקייה גורם לכל קובץ חדש בה לקבל את הקבוצה של התיקייה, וזה מושלם לתיקיות צוות. במספרים 2, למשל 2775. ה־sticky bit (מספר 1, למשל 1777) על תיקייה אומר שרק הבעלים של קובץ יכול למחוק אותו. ככה עובדת ‎/tmp.', 'SGID on a folder makes every new file in it take the folder\'s group, perfect for team folders. In numbers 2, like 2775. The sticky bit (number 1, like 1777) on a folder means only a file\'s owner may delete it. That is how /tmp works.'), demo: [['chmod 2775 team'], 'ls -ld team'] },
      { type: 'output', prompt: T('על לינוקס אמיתי הודפסו ההרשאות, הבעלים והשם של ‎/tmp‎. מה הודפס?', 'On real Linux, the permissions, owner and name of /tmp were printed. What was printed?'), rec: 'ubuntu-tmp-perm', wrongRec: ['ubuntu-passwd-perm'], wrongText: ['drwxr-xr-x root /tmp'] },
      { type: 'sentence', prompt: READ, text: T('בסוף ההרשאות של ‎/tmp‎ יש את האות ___, שהיא ה־sticky bit.', '/tmp\'s permissions end with the letter ___, which is the sticky bit.'), options: ['t', 's', 'x'], answer: 't' },
      { type: 'match', prompt: T('התאימו כל ביט מיוחד למה שהוא עושה', 'Match each special bit to what it does'), pairs: [['4000', T('SUID: רץ בתור הבעלים', 'SUID: runs as the owner')], ['2000', T('SGID: קבצים חדשים מקבלים את הקבוצה', 'SGID: new files get the group')], ['1000', T('sticky: רק הבעלים מוחק', 'sticky: only the owner deletes')], ['0755', T('בלי ביטים מיוחדים', 'no special bits')]] },
      { type: 'output', prompt: WHAT, setup: ['mkdir drop', 'chmod 1777 drop'], cmd: 'ls -ld drop', wrongText: ['drwxrwxrwx 2 user user 4096 Nov  1 10:00 drop', 'drwsrwxrwx 2 user user 4096 Nov  1 10:00 drop'] },
      { type: 'terminal', prompt: T('תנו לתיקייה team את SGID, כך שקבצים חדשים בה יקבלו את הקבוצה שלה (2775)', 'Give the team folder SGID, so new files in it take its group (2775)'), hint: T('chmod 2775 team', 'chmod 2775 team'), goal: sh => modeOf(sh, '/home/user/team') === 0o2775, solve: ['chmod 2775 team'] },
    ] },
    { title: T('ACL', 'ACLs'), exercises: [
      { type: 'teach', cmd: 'setfacl', name: 'access control list', text: T('לפעמים צריך לתת הרשאה למשתמש אחד נוסף בלי לשנות קבוצות. ACL מוסיפה כללים כאלה: ‎setfacl -m u:dana:r file‎ נותנת ל־dana לקרוא. getfacl מציגה את הכללים, ו־ls -l מראה + בסוף ההרשאות.', 'Sometimes you need to give one more user access without changing groups. An ACL adds such rules: setfacl -m u:dana:r file lets dana read. getfacl shows the rules, and ls -l shows a + after the permissions.') },
      { type: 'output', prompt: T('על לינוקס אמיתי, report.txt בהרשאות 640 של user. מה הודפס מ־getfacl?', 'On real Linux, report.txt is mode 640 owned by user. What did getfacl print?'), rec: 'ubuntu-getfacl', wrongRec: ['ubuntu-setfacl'], wrongText: ['-rw-r----- 1 user user 3 report.txt'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ מוסיפה כלל ACL לקובץ.', 'The ___ command adds an ACL rule to a file.'), options: ['setfacl', 'getfacl', 'chacl'], answer: 'setfacl' },
      { type: 'output', prompt: T('אחרי ‎setfacl -m u:dana:r report.txt‎ על לינוקס אמיתי. מה הודפס מ־getfacl?', 'After setfacl -m u:dana:r report.txt on real Linux. What did getfacl print?'), rec: 'ubuntu-setfacl', wrongRec: ['ubuntu-getfacl'], wrongText: ['user:dana:r--'] },
      { type: 'output', prompt: T('ואיך נראות ההרשאות ב־ls -l אחרי ה־ACL הזה? (הוקלט על לינוקס אמיתי)', 'And how do the permissions look in ls -l after that ACL? (Recorded on real Linux)'), rec: 'ubuntu-acl-plus', wrongText: ['-rw-r----- report.txt', '-rw-r--r-- report.txt'] },
      { type: 'scenario', prompt: T('תנו למשתמש omer הרשאת קריאה וכתיבה לקובץ budget.xlsx בעזרת ACL', 'Give the user omer read and write access to budget.xlsx with an ACL'), hint: T('setfacl -m u:omer:rw', 'setfacl -m u:omer:rw'), accept: ['setfacl -m u:omer:rw budget.xlsx', 'setfacl -m user:omer:rw budget.xlsx', 'setfacl -m u:omer:rw- budget.xlsx'] },
    ] },
    { title: T('חזרה', 'Review'), exercises: [
      { type: 'match', prompt: T('התאימו כל שורת ls -l למה שמיוחד בה', 'Match each ls -l string to what is special about it'), pairs: [['-rwsr-xr-x', 'SUID'], ['drwxrwsr-x', 'SGID'], ['drwxrwxrwt', 'sticky'], ['-rw-r-----+', 'ACL']] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ‎chmod ___ dir‎ נותנת sticky bit ופתוחה לכולם, כמו ‎/tmp.', 'The command chmod ___ dir gives the sticky bit and opens it to all, like /tmp.'), options: ['1777', '4777', '0777'], answer: '1777' },
      { type: 'choice', prompt: T('איזו פקודה מוצאת את כל קבצי ה־SUID במערכת?', 'Which command finds every SUID file on the system?'), options: ['find / -perm -4000', 'find / -perm 777', 'ls -s /', 'find / -name suid'], answer: 'find / -perm -4000',
        why: { 'find / -perm 777': T('זה מוצא קבצים פתוחים לכולם, לא SUID.', 'That finds world-open files, not SUID.'), 'ls -s /': T('‎ls -s‎ מציגה גדלים.', 'ls -s shows sizes.'), 'find / -name suid': T('זה מחפש קבצים ששמם suid.', 'That looks for files named suid.') } },
      { type: 'output', prompt: WHAT, setup: ['chmod 2770 team'], cmd: 'ls -ld team', wrongText: ['drwxrwx--- 2 user user 4096 Nov  1 10:00 team', 'drwxrws--T 2 user user 4096 Nov  1 10:00 team'] },
      { type: 'scenario', prompt: T('הציגו את כללי ה־ACL של התיקייה ‎/srv/share', 'Show the ACL rules of the folder /srv/share'), hint: T('getfacl', 'getfacl'), accept: ['getfacl /srv/share'] },
      { type: 'terminal', prompt: T('צרו תיקייה public שכל אחד יכול לכתוב בה, אבל רק הבעלים של קובץ יכול למחוק אותו', 'Create a public folder anyone can write to, but where only a file\'s owner can delete it'), hint: T('mkdir public ואז chmod 1777 public', 'mkdir public, then chmod 1777 public'), goal: sh => modeOf(sh, '/home/user/public') === 0o1777, solve: ['mkdir public', 'chmod 1777 public'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('ביקורת אבטחה קטנה.', 'A small security audit.'), exercises: [
    { type: 'scenario', prompt: T('מצאו את כל קבצי ה־SUID תחת ‎/usr/bin‎', 'Find every SUID file under /usr/bin'), rec: 'ubuntu-passwd-perm', hint: T('find עם ‎-perm -4000', 'find with -perm -4000'), accept: ['find /usr/bin -perm -4000', 'find /usr/bin -perm -u+s', 'find /usr/bin -perm /4000'] },
    { type: 'scenario', prompt: T('תנו לקבוצה auditors הרשאת קריאה לקובץ ‎/var/log/syslog‎ בעזרת ACL', 'Give the group auditors read access to /var/log/syslog with an ACL'), hint: T('setfacl -m g:auditors:r', 'setfacl -m g:auditors:r'), accept: ['setfacl -m g:auditors:r /var/log/syslog', 'sudo setfacl -m g:auditors:r /var/log/syslog', 'setfacl -m group:auditors:r /var/log/syslog', 'sudo setfacl -m group:auditors:r /var/log/syslog'] },
    { type: 'terminal', prompt: T('הורידו את ה־SUID מ־backup.sh (הוא כבר 4755) והשאירו אותו 755', 'Remove SUID from backup.sh (it is already 4755) and leave it 755'), setup: ['chmod 4755 backup.sh'], hint: T('chmod u-s backup.sh, או chmod 755', 'chmod u-s backup.sh, or chmod 755'), goal: sh => modeOf(sh, '/home/user/backup.sh') === 0o755, solve: ['chmod u-s backup.sh'] },
  ] },
};

const UNIT_25 = {
  section: 3, unit: 25, exams: ['L104.7'], title: T('עץ התיקיות', 'The filesystem tree'), subtitle: T('מה יש ב־‎/etc, ‏/var, ‏/usr ועוד', 'What lives in /etc, /var, /usr and more'), color: 'purple', fixture: filesFixture,
  lessons: [
    { title: T('השורש', 'The root'), exercises: [
      { type: 'teach', cmd: '/', name: 'FHS', text: T('בלינוקס יש עץ אחד שמתחיל ב־/. החלוקה שלו קבועה בתקן שנקרא FHS, אז בכל הפצה תמצאו הגדרות ב־‎/etc, לוגים ב־‎/var/log ותוכנות ב־‎/usr/bin.', 'Linux has one tree that starts at /. Its layout is fixed by a standard called the FHS, so on any distribution you find settings in /etc, logs in /var/log and programs in /usr/bin.') },
      { type: 'output', prompt: T('על לינוקס אמיתי (Ubuntu 24.04) הריצו ls /. מה הודפס?', 'On real Linux (Ubuntu 24.04), ls / was run. What was printed?'), rec: 'ubuntu-ls-root', wrongText: ['Desktop\nDocuments\nDownloads\nMusic', 'C:\nProgram Files\nUsers\nWindows'] },
      { type: 'sentence', prompt: READ, text: T('קבצי ההגדרות של המערכת נמצאים בתיקייה ___.', 'System settings files live in the ___ folder.'), options: ['/etc', '/bin', '/home'], answer: '/etc' },
      { type: 'match', prompt: T('התאימו כל תיקייה למה שיש בה', 'Match each folder to what it holds'), pairs: [['/etc', T('הגדרות', 'settings')], ['/home', T('הקבצים של המשתמשים', 'users\' files')], ['/var/log', T('לוגים', 'logs')], ['/tmp', T('קבצים זמניים', 'temporary files')]] },
      { type: 'choice', prompt: T('איפה נמצאת תיקיית הבית של root?', 'Where is root\'s home folder?'), options: ['/root', '/home/root', '/', '/etc/root'], answer: '/root',
        why: { '/home/root': T('‎/home‎ למשתמשים רגילים.', '/home is for regular users.'), '/': T('/ הוא שורש העץ, לא תיקיית בית.', '/ is the root of the tree, not a home folder.'), '/etc/root': T('‎/etc‎ היא להגדרות.', '/etc is for settings.') } },
      { type: 'terminal', prompt: T('היכנסו ל־‎/etc והציגו מה יש בה', 'Go into /etc and list what is there'), hint: T('cd /etc ואז ls', 'cd /etc, then ls'), goal: (sh, log) => sh.cwd === '/etc' && log.some(l => l.out.includes('hostname')), solve: ['cd /etc', 'ls'] },
    ] },
    { title: T('תוכנות וספריות', 'Programs and libraries'), exercises: [
      { type: 'teach', cmd: '/usr', name: 'unix system resources', text: T('‎/usr/bin‎ מכילה את רוב הפקודות, ‎/usr/sbin‎ פקודות ניהול, ‎/usr/lib‎ ספריות, ו־‎/usr/share‎ קבצים משותפים כמו תיעוד. ‎/opt‎ לתוכנות חיצוניות גדולות, ‎/usr/local‎ למה שהתקנתם בעצמכם. ‎/bin‎ ו־‎/sbin‎ הם היום קישורים ל־‎/usr.', '/usr/bin holds most commands, /usr/sbin admin commands, /usr/lib libraries, and /usr/share shared files like docs. /opt is for big third-party software, /usr/local for what you installed yourself. /bin and /sbin are links into /usr today.') },
      { type: 'match', prompt: T('התאימו כל תיקייה למה שיש בה', 'Match each folder to what it holds'), pairs: [['/usr/bin', T('פקודות למשתמשים', 'user commands')], ['/usr/sbin', T('פקודות ניהול', 'admin commands')], ['/usr/lib', T('ספריות', 'libraries')], ['/opt', T('תוכנות חיצוניות', 'third-party software')]] },
      { type: 'sentence', prompt: READ, text: T('רוב הפקודות הרגילות, כמו ls ו־grep, נמצאות ב־___.', 'Most regular commands, like ls and grep, live in ___.'), options: ['/usr/bin', '/etc', '/var'], answer: '/usr/bin' },
      { type: 'output', prompt: WHAT, cmd: 'which ls grep', wrongText: ['/bin/ls\n/bin/grep', '/etc/ls\n/etc/grep'] },
      { type: 'choice', prompt: T('חברה נותנת לכם תוכנה גדולה בתיקייה אחת משלה. איפה מקובל להתקין אותה?', 'A vendor ships a big program in its own folder. Where is it customary to install it?'), options: ['/opt', '/etc', '/tmp', '/proc'], answer: '/opt',
        why: { '/etc': T('‎/etc‎ להגדרות בלבד.', '/etc is for settings only.'), '/tmp': T('‎/tmp‎ מתנקה, הקבצים בה זמניים.', '/tmp gets cleaned; its files are temporary.'), '/proc': T('‎/proc‎ לא אמיתית, הקרנל מייצר אותה.', '/proc is not real; the kernel makes it up.') } },
      { type: 'scenario', prompt: T('הציגו את כל הפקודות שיש ב־‎/usr/sbin‎', 'List all the commands in /usr/sbin'), hint: T('ls', 'ls'), accept: ['ls /usr/sbin'] },
    ] },
    { title: T('‎/var, ‏/tmp ו־‎/boot', '/var, /tmp and /boot'), exercises: [
      { type: 'teach', cmd: '/var', name: 'variable', text: T('‎/var‎ שומרת נתונים שמשתנים: ‎/var/log‎ לוגים, ‎/var/cache‎ מטמון, ‎/var/spool‎ תורים כמו הדפסות ומיילים, ‎/var/lib‎ מידע של תוכנות. ‎/tmp‎ לקבצים זמניים ומתנקה. ‎/boot‎ מכילה את הקרנל ואת GRUB.', '/var holds changing data: /var/log logs, /var/cache caches, /var/spool queues like printing and mail, /var/lib program data. /tmp is for temporary files and gets cleaned. /boot holds the kernel and GRUB.') },
      { type: 'output', prompt: WHAT, cmd: 'ls /var/log', wrongCmds: ['ls /var'], wrongText: ['app.log'] },
      { type: 'sentence', prompt: READ, text: T('הקרנל וקבצי האתחול נמצאים ב־___.', 'The kernel and boot files live in ___.'), options: ['/boot', '/var', '/srv'], answer: '/boot' },
      { type: 'match', prompt: T('התאימו כל תיקייה למה שיש בה', 'Match each folder to what it holds'), pairs: [['/var/log', T('לוגים', 'logs')], ['/var/spool', T('תורים של הדפסות ומיילים', 'print and mail queues')], ['/boot', T('קרנל ו־GRUB', 'kernel and GRUB')], ['/srv', T('נתונים שהשרת מגיש', 'data the server serves')]] },
      { type: 'choice', prompt: T('הדיסק התמלא. באיזו תיקייה הכי סביר שלוגים גדלו בלי סוף?', 'The disk filled up. Which folder most likely has logs that grew without end?'), options: ['/var/log', '/etc', '/usr/bin', '/boot'], answer: '/var/log',
        why: { '/etc': T('‎/etc‎ קבצים קטנים של הגדרות.', '/etc is small settings files.'), '/usr/bin': T('תוכנות לא גדלות מעצמן.', 'Programs do not grow on their own.'), '/boot': T('‎/boot‎ משתנה רק בעדכון קרנל.', '/boot changes only on kernel updates.') } },
      { type: 'terminal', prompt: T('הציגו את התוכן של לוג המערכת ‎/var/log/syslog‎ (הוא של root, אז צריך sudo)', 'Show the system log /var/log/syslog (it belongs to root, so you need sudo)'), hint: T('sudo cat /var/log/syslog', 'sudo cat /var/log/syslog'), goal: (sh, log) => log.some(l => l.out === 'system started'), solve: ['sudo cat /var/log/syslog'] },
    ] },
    { title: T('‎/proc, ‏/sys ו־‎/dev', '/proc, /sys and /dev'), exercises: [
      { type: 'teach', cmd: '/proc', name: 'virtual filesystems', text: T('‎/proc‎ ו־‎/sys‎ לא נמצאות בדיסק: הקרנל מייצר אותן ברגע שקוראים אותן. ‎/proc/cpuinfo‎ מתארת את המעבד, ‎/proc/meminfo‎ את הזיכרון, ולכל תהליך יש ‎/proc/<PID>. ‏‎/dev‎ מכילה קבצים שמייצגים חומרה, כמו ‎/dev/sda‎ לדיסק ו־‎/dev/null‎ "חור שחור".', '/proc and /sys are not on disk: the kernel makes them up the moment you read them. /proc/cpuinfo describes the CPU, /proc/meminfo the memory, and every process has /proc/<PID>. /dev holds files that stand for hardware, like /dev/sda for a disk and /dev/null, a "black hole".') },
      { type: 'match', prompt: T('התאימו כל נתיב למה שהוא מייצג', 'Match each path to what it stands for'), pairs: [['/proc/cpuinfo', T('המעבד', 'the CPU')], ['/proc/meminfo', T('הזיכרון', 'memory')], ['/dev/sda', T('דיסק', 'a disk')], ['/dev/null', T('זורק כל מה שכותבים אליו', 'discards whatever is written to it')]] },
      { type: 'sentence', prompt: READ, text: T('הקבצים ב־___ מייצגים התקני חומרה.', 'The files in ___ stand for hardware devices.'), options: ['/dev', '/etc', '/opt'], answer: '/dev' },
      { type: 'choice', prompt: T('מה גודל הקבצים ב־‎/proc‎ על הדיסק?', 'How much disk space do the files in /proc take?'), plain: true,
        options: [T('אפס: הם לא בדיסק, הקרנל מייצר אותם', 'Zero: they are not on disk; the kernel makes them'), T('הרבה, כי יש בהם לוגים', 'A lot, since they hold logs'), T('בדיוק 4096 כל אחד', 'Exactly 4096 each'), T('תלוי במשתמש', 'It depends on the user')],
        why: [null, T('לוגים נמצאים ב־‎/var/log.', 'Logs are in /var/log.'), T('4096 הוא גודל של רשומת תיקייה בדיסק.', '4096 is the size of a folder entry on disk.'), T('זה לא תלוי במשתמש.', 'It does not depend on the user.')] },
      { type: 'scenario', prompt: T('הציגו מידע על המעבד', 'Show information about the CPU'), hint: T('cat על קובץ ב־‎/proc', 'cat a file in /proc'), accept: ['cat /proc/cpuinfo', 'less /proc/cpuinfo', 'lscpu'] },
      { type: 'match', prompt: T('התאימו כל קובץ ב־‎/etc‎ למה שהוא מגדיר', 'Match each /etc file to what it sets'), pairs: [['/etc/hostname', T('שם המחשב', 'the computer name')], ['/etc/hosts', T('שמות וכתובות IP', 'names and IP addresses')], ['/etc/fstab', T('אילו דיסקים לחבר', 'which disks to mount')], ['/etc/passwd', T('המשתמשים', 'the users')]] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('מוצאים דברים במערכת לפי ההיגיון של העץ.', 'Finding things by the logic of the tree.'), exercises: [
    { type: 'terminal', prompt: T('הציגו את שם המחשב מתוך הקובץ שלו ב־‎/etc', 'Show the computer name from its file in /etc'), hint: T('cat /etc/hostname', 'cat /etc/hostname'), goal: (sh, log) => log.some(l => l.out === 'linux'), solve: ['cat /etc/hostname'] },
    { type: 'terminal', prompt: T('צרו קובץ זמני בשם scratch.txt בתיקייה של הקבצים הזמניים', 'Create a temporary file named scratch.txt in the folder for temporary files'), hint: T('touch /tmp/scratch.txt', 'touch /tmp/scratch.txt'), goal: sh => sh.files.has('/tmp/scratch.txt'), solve: ['touch /tmp/scratch.txt'] },
    { type: 'scenario', prompt: T('הציגו כמה זיכרון יש במחשב מתוך הקובץ שהקרנל מייצר', 'Show how much memory the computer has, from the file the kernel makes'), hint: T('‎/proc/meminfo', '/proc/meminfo'), accept: ['cat /proc/meminfo', 'less /proc/meminfo', 'head /proc/meminfo', 'grep MemTotal /proc/meminfo'] },
  ] },
};

const UNIT_26 = {
  section: 3, unit: 26, exams: ['L104.7', 'R'], title: T('למצוא כל דבר', 'Finding anything'), subtitle: T('find לפי הרשאות, בעלים וגודל, ו־locate', 'find by permissions, owner and size, and locate'), color: 'blue', fixture: filesFixture,
  lessons: [
    { title: T('find לפי מאפיינים', 'find by attributes'), exercises: [
      { type: 'teach', cmd: 'find -user', name: 'find tests', text: T('find יודעת לחפש לפי הרבה דברים: ‎-user root‎ לפי בעלים, ‎-perm 600‎ לפי הרשאות, ‎-size +1M‎ לפי גודל, ‎-type l‎ קישורים, ‎-empty‎ קבצים ריקים. אפשר לשלב כמה תנאים, וכולם צריכים להתקיים.', 'find can search by many things: -user root by owner, -perm 600 by permissions, -size +1M by size, -type l links, -empty empty files. You can combine conditions, and all must hold.'), demo: [[], 'find . -perm 600'] },
      { type: 'output', prompt: WHAT, cmd: 'find /etc -user root', wrongCmds: ['find /etc -user user'], wrongText: ['/etc/hostname\n/etc/hosts'] },
      { type: 'sentence', prompt: READ, text: T('find ___ 600 מוצאת קבצים שההרשאות שלהם הן בדיוק 600.', 'find ___ 600 finds files whose permissions are exactly 600.'), options: ['-perm', '-mode', '-size'], answer: '-perm' },
      { type: 'match', prompt: T('התאימו כל תנאי של find למה שהוא מוצא', 'Match each find test to what it finds'), pairs: [['-user root', T('קבצים של root', 'files owned by root')], ['-size +1M', T('גדולים ממגה', 'bigger than a megabyte')], ['-type l', T('קישורים סימבוליים', 'symbolic links')], ['-empty', T('קבצים ותיקיות ריקים', 'empty files and folders')]] },
      { type: 'choice', prompt: T('איזו פקודה מוצאת קבצים גדולים מ־100 מגה בכל המערכת?', 'Which command finds files bigger than 100 MB across the system?'), options: ['find / -size +100M', 'find / -size 100M', 'find / -size -100M', 'du / -size +100M'], answer: 'find / -size +100M',
        why: { 'find / -size 100M': T('בלי + זה בדיוק 100 מגה.', 'Without + it is exactly 100 MB.'), 'find / -size -100M': T('- הוא קטן מ־100.', '- is smaller than 100.'), 'du / -size +100M': T('ל־du אין ‎-size.', 'du has no -size.') } },
      { type: 'terminal', prompt: T('מצאו את כל הקבצים הריקים בתיקיית הבית (יש אחד, צרו אותו קודם: touch empty.log)', 'Find every empty file in your home folder (there is one; create it first: touch empty.log)'), hint: T('touch empty.log ואז find . -empty', 'touch empty.log, then find . -empty'), goal: (sh, log) => log.some(l => /^find\b/.test(l.cmd) && l.out.includes('./empty.log')), solve: ['touch empty.log', 'find . -empty'] },
    ] },
    { title: T('find עם ‎-exec', 'find with -exec'), exercises: [
      { type: 'teach', cmd: 'find -exec', name: 'execute', text: T('‎-exec‎ מריצה פקודה על כל מה שנמצא: {} הוא המקום של שם הקובץ, ו־‎\\;‎ מסיים את הפקודה. עם ‎+‎ במקום ‎\\;‎ כל השמות עוברים לפקודה אחת. ‎-delete‎ מוחקת את מה שנמצא.', '-exec runs a command on each result: {} is where the file name goes, and \\; ends the command. With + instead of \\; all names go to one command. -delete deletes what was found.'), demo: [[], 'find photos -name "*.jpg" -exec ls -l {} \\;'] },
      { type: 'output', prompt: WHAT, cmd: 'find docs -name "*.txt" -exec wc -l {} \\;', wrongCmds: ['find docs -name "*.txt"'], wrongText: ['2'] },
      { type: 'sentence', prompt: READ, text: T('בתוך ‎-exec‎, הסימן ___ מוחלף בשם הקובץ שנמצא.', 'Inside -exec, the ___ sign is replaced with the name of the found file.'), options: ['{}', '[]', '$1'], answer: '{}' },
      { type: 'output', prompt: T('מה תדפיס ls photos אחרי הפקודה? (היו בה cat.jpg ו־dog.jpg)', 'What will ls photos print after this command? (It had cat.jpg and dog.jpg)'), setup: ['find photos -name "c*" -delete'], cmd: 'ls photos', wrongText: ['cat.jpg\ndog.jpg', 'cat.jpg'] },
      { type: 'choice', prompt: T('מה ההבדל בין ‎-exec rm {} \\;‎ לבין ‎-exec rm {} +‎?', 'What is the difference between -exec rm {} \\; and -exec rm {} +?'), plain: true,
        options: [T('עם ; ‏rm רצה פעם לכל קובץ, עם + פעם אחת על כולם', 'With ; rm runs once per file, with + once for all of them'), T('+ לא מוחקת', '+ does not delete'), T('; מוחקת גם תיקיות', '; deletes folders too'), T('אין הבדל בתוצאה ולא במהירות', 'No difference in result or speed')],
        why: [null, T('שתיהן מוחקות.', 'Both delete.'), T('rm בלי ‎-r לא מוחקת תיקיות בשתיהן.', 'rm without -r deletes no folders in either.'), T('+ מהירה יותר כשיש הרבה קבצים.', '+ is faster with many files.')] },
      { type: 'terminal', prompt: T('תנו לכל קבצי ה־.sh בתיקיית הבית הרשאת הרצה, בפקודת find אחת', 'Give every .sh file in your home folder execute permission, with one find command'), hint: T('find . -name "*.sh" -exec chmod +x {} \\;', 'find . -name "*.sh" -exec chmod +x {} \\;'), goal: sh => (modeOf(sh, '/home/user/backup.sh') & 0o111) === 0o111, solve: ['find . -name "*.sh" -exec chmod +x {} \\;'] },
    ] },
    { title: T('locate ו־whereis', 'locate and whereis'), exercises: [
      { type: 'teach', cmd: 'locate', name: 'locate', text: T('locate מחפשת שמות במאגר מוכן מראש, ולכן היא מהירה מאוד. החיסרון: המאגר מתעדכן רק כש־updatedb רצה (בדרך כלל פעם ביום), אז קבצים חדשים או מחוקים לא תמיד נכונים.', 'locate searches names in a prebuilt database, so it is very fast. The catch: the database only updates when updatedb runs (usually once a day), so new or deleted files may be wrong.') },
      { type: 'output', prompt: T('על לינוקס אמיתי: יצרו את report-2026.txt, הריצו updatedb, ואז מחקו את הקובץ. מה הודפס?', 'On real Linux: report-2026.txt was created, updatedb ran, then the file was deleted. What was printed?'), rec: 'ubuntu-locate-stale', wrongRec: ['ubuntu-locate'], wrongText: ['--- after updatedb:\nexit 1'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ מעדכנת את המאגר ש־locate מחפשת בו.', 'The ___ command updates the database locate searches.'), options: ['updatedb', 'locate -u', 'find'], answer: 'updatedb' },
      { type: 'teach', cmd: 'whereis', name: 'whereis', text: T('whereis מוצאת את התוכנה, דף ה־man ולפעמים קבצי הגדרות של פקודה. ‎-b‎ מציגה רק את התוכנה. which מראה רק את מה שירוץ, ו־type אומרת גם אם זה alias או builtin.', 'whereis finds a command\'s program, man page and sometimes config files. -b shows only the program. which shows only what will run, and type also tells you if it is an alias or a builtin.') },
      { type: 'output', prompt: T('על לינוקס אמיתי הריצו ‎whereis -b ls passwd‎. מה הודפס?', 'On real Linux, whereis -b ls passwd was run. What was printed?'), rec: 'ubuntu-whereis', wrongText: ['/usr/bin/ls\n/usr/bin/passwd', 'ls: /usr/bin/ls\npasswd: /usr/bin/passwd'] },
      { type: 'match', prompt: T('התאימו כל פקודה למתי משתמשים בה', 'Match each command to when to use it'), pairs: [['find', T('חיפוש עכשווי לפי כל תנאי', 'a live search on any condition')], ['locate', T('חיפוש מהיר לפי שם', 'a fast search by name')], ['which', T('איזו תוכנה תרוץ', 'which program will run')], ['whereis', T('תוכנה, man והגדרות', 'program, man page and config')]] },
    ] },
    { title: T('חזרה', 'Review'), exercises: [
      { type: 'output', prompt: WHAT, setup: ['ln -s notes.txt n1', 'ln -s readme.txt n2'], cmd: 'find . -type l', wrongCmds: ['find . -name "n*"'], wrongText: ['./notes.txt\n./readme.txt'] },
      { type: 'sentence', prompt: READ, text: T('אחרי שיצרתם קובץ חדש, locate לא תמצא אותו עד שתריצו ___.', 'After you create a new file, locate will not find it until you run ___.'), options: ['updatedb', 'sync', 'ls'], answer: 'updatedb' },
      { type: 'choice', prompt: T('איזו פקודה מוצאת קבצים של root בתיקיית הבית שלכם?', 'Which command finds files owned by root in your home folder?'), options: ['find ~ -user root', 'find ~ -name root', 'locate root ~', 'ls -l ~ root'], answer: 'find ~ -user root',
        why: { 'find ~ -name root': T('זה מחפש קבצים ששמם root.', 'That looks for files named root.'), 'locate root ~': T('locate מחפשת שמות בכל המאגר, לא לפי בעלים.', 'locate searches names in its database, not owners.'), 'ls -l ~ root': T('זה מציג את הבית ומחפש קובץ בשם root.', 'That lists home and looks for a file named root.') } },
      { type: 'fill', prompt: T('השלימו כדי למצוא קבצים שההרשאות שלהם 777', 'Fill in to find files with mode 777'), before: 'find / -type f ', after: ' 777', options: ['-perm', '-mode', '-chmod', '-size'], answer: '-perm' },
      { type: 'terminal', prompt: T('מצאו בתיקיית הבית את כל הקבצים שההרשאות שלהם 600', 'Find every file in your home folder with mode 600'), hint: T('find . -perm 600', 'find . -perm 600'), goal: (sh, log) => filesShown(log, 'find . -perm 600'), solve: ['find . -perm 600'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('מנקים ומאבטחים את תיקיית הבית.', 'Cleaning up and securing your home folder.'), exercises: [
    { type: 'terminal', prompt: T('מצאו את כל קבצי ה־.txt בתיקיית הבית שההרשאות שלהם 644', 'Find every .txt file in your home folder with mode 644'), hint: T('find . -name "*.txt" -perm 644', 'find . -name "*.txt" -perm 644'), goal: (sh, log) => filesShown(log, 'find . -name "*.txt" -perm 644'), solve: ['find . -name "*.txt" -perm 644'] },
    { type: 'terminal', prompt: T('הגבילו את כל קבצי ה־.csv ל־600 בפקודת find אחת', 'Restrict every .csv file to 600 with one find command'), hint: T('find . -name "*.csv" -exec chmod 600 {} \\;', 'find . -name "*.csv" -exec chmod 600 {} \\;'), goal: sh => modeOf(sh, '/home/user/people.csv') === 0o600, solve: ['find . -name "*.csv" -exec chmod 600 {} \\;'] },
    { type: 'scenario', prompt: T('מצאו מהר בעזרת המאגר כל קובץ שבשמו יש nginx.conf', 'Quickly find, using the database, every file with nginx.conf in its name'), hint: T('locate', 'locate'), accept: ['locate nginx.conf'] },
  ] },
};

COURSE.push(UNIT_21, UNIT_22, UNIT_23, UNIT_24, UNIT_25, UNIT_26);
