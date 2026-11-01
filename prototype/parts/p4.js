// Part 4: Users, processes, services and boot, units 33-44. See materials/curriculum.md and materials/objectives/.
// sysFixture() adds the account files from /etc, so learners can read them with grep, cut and awk.
function sysFixture() {
  const fx = homeFixture();
  fx.files.push(
    ['/etc/passwd', { owner: 'root', content: 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nsshd:x:110:65534::/run/sshd:/usr/sbin/nologin\nuser:x:1000:1000:User:/home/user:/bin/bash\ndana:x:1001:1001:Dana Levi:/home/dana:/bin/bash\nomer:x:1002:1002::/home/omer:/bin/zsh\n' }],
    ['/etc/group', { owner: 'root', content: 'root:x:0:\nsudo:x:27:user,dana\nwww-data:x:33:\nuser:x:1000:\ndana:x:1001:\nomer:x:1002:\ndevelopers:x:1003:dana,omer\n' }],
    ['/etc/shadow', { owner: 'root', group: 'shadow', mode: 0o640, content: 'root:*:20758:0:99999:7:::\nuser:$y$j9T$abc$def:20758:0:99999:7:::\ndana:$y$j9T$ghi$jkl:20758:0:90:7:::\nomer:!$y$j9T$mno$pqr:20758:0:99999:7:::\n' }],
  );
  return fx;
}
const sysOut = cmd => { const sh = new Shell(sysFixture()); const r = sh.run(cmd); return r.out + r.err; };
const sysShown = (log, cmd) => { const want = sysOut(cmd).trim(); return !!want && log.some(l => l.out.trim() === want); };
const ON_SERVER = T('הפלט הוקלט על שרת Ubuntu אמיתי. מה הודפס?', 'This was recorded on a real Ubuntu server. What was printed?');
const svc = (cmd, extra = []) => [cmd, `sudo ${cmd}`, ...extra];

const UNIT_33 = {
  section: 4, unit: 33, exams: ['L107.1', 'R', 'F'], title: T('משתמשים וקבוצות', 'Users and groups'), subtitle: T('‎/etc/passwd, ‏/etc/group, ‏id ו־groups', '/etc/passwd, /etc/group, id and groups'), color: 'green', fixture: sysFixture,
  lessons: [
    { title: T('‎/etc/passwd', '/etc/passwd'), exercises: [
      { type: 'teach', cmd: '/etc/passwd', name: 'accounts', text: T('כל משתמש הוא שורה ב־‎/etc/passwd, עם 7 שדות מופרדים ב־: שם, x (הסיסמה נמצאת במקום אחר), UID, ‏GID, תיאור, תיקיית בית ו־shell. ל־root תמיד UID 0. משתמשי מערכת (כמו www-data) מקבלים UID נמוך ו־shell בשם nologin.', 'Every user is a line in /etc/passwd, with 7 fields split by ":": name, x (the password lives elsewhere), UID, GID, description, home folder and shell. root always has UID 0. System users (like www-data) get a low UID and a shell called nologin.'), demo: [[], 'grep dana /etc/passwd'] },
      { type: 'output', prompt: WHAT, cmd: 'grep omer /etc/passwd', wrongCmds: ['grep dana /etc/passwd', 'grep root /etc/passwd'] },
      { type: 'sentence', prompt: READ, text: T('ל־root יש תמיד UID ___.', 'root always has UID ___.'), options: ['0', '1', '1000'], answer: '0' },
      { type: 'match', prompt: T('התאימו כל שדה בשורה ‎dana:x:1001:1001:Dana Levi:/home/dana:/bin/bash', 'Match each field of dana:x:1001:1001:Dana Levi:/home/dana:/bin/bash'), pairs: [['dana', T('שם המשתמש', 'user name')], ['1001', T('UID ו־GID', 'UID and GID')], ['/home/dana', T('תיקיית בית', 'home folder')], ['/bin/bash', T('ה־shell', 'the shell')]] },
      { type: 'output', prompt: WHAT, cmd: 'cut -d : -f 1,7 /etc/passwd', wrongCmds: ['cut -d : -f 1 /etc/passwd', 'cut -d : -f 6 /etc/passwd'] },
      { type: 'terminal', prompt: T('הדפיסו את השמות של כל המשתמשים שה־shell שלהם הוא bash', 'Print the names of every user whose shell is bash'), hint: T('grep "bash$" /etc/passwd | cut -d : -f 1', 'grep "bash$" /etc/passwd | cut -d : -f 1'), goal: (sh, log) => sysShown(log, 'grep "bash$" /etc/passwd | cut -d : -f 1'), solve: ['grep "bash$" /etc/passwd | cut -d : -f 1'] },
    ] },
    { title: T('‎/etc/shadow', '/etc/shadow'), exercises: [
      { type: 'teach', cmd: '/etc/shadow', name: 'passwords', text: T('הסיסמאות שמורות ב־‎/etc/shadow, מוצפנות (hash), ורק root יכול לקרוא אותו. השדות: שם, hash, יום השינוי האחרון (ימים מ־1970), מינימום ימים בין שינויים, מקסימום ימים עד שחייבים להחליף, ימי אזהרה. ‎!‎ או * בתחילת ה־hash אומרים שהחשבון נעול.', 'Passwords are stored in /etc/shadow, hashed, and only root can read it. The fields: name, hash, day of last change (days since 1970), minimum days between changes, maximum days until a change is required, warning days. A ! or * at the start of the hash means the account is locked.') },
      { type: 'output', prompt: WHAT, cmd: 'cat /etc/shadow', wrongCmds: ['cat /etc/passwd'], wrongText: [''] },
      { type: 'sentence', prompt: READ, text: T('את ‎/etc/shadow‎ יכול לקרוא רק ___.', 'Only ___ can read /etc/shadow.'), options: ['root', 'user', 'www-data'], answer: 'root' },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הוסיפו את dana והגדירו לה סיסמה. מה הודפס מהשורה שלה ב־shadow (בלי ה־hash)?', 'On a real Ubuntu server dana was added and given a password. What did her shadow line print (without the hash)?'), rec: 'user-shadow-line', wrongRec: ['user-passwd-line'], wrongText: ['dana:x:1003:1003:::'] },
      { type: 'choice', prompt: T('ב־shadow, ל־omer יש hash שמתחיל ב־‎!‎. מה זה אומר?', 'In shadow, omer\'s hash starts with !. What does that mean?'), plain: true,
        options: [T('החשבון נעול: אי אפשר להיכנס איתו עם סיסמה', 'The account is locked: no password login'), T('לסיסמה יש סימן קריאה', 'The password contains an exclamation mark'), T('הוא מנהל', 'He is an admin'), T('הסיסמה פגה', 'The password expired')],
        why: [null, T('ה־! נוסף לפני ה־hash, לא בתוך הסיסמה.', 'The ! is added before the hash, not inside the password.'), T('הרשאות ניהול באות מ־sudo.', 'Admin rights come from sudo.'), T('תפוגה נקבעת בשדות של הימים.', 'Expiry is set in the day fields.')] },
      { type: 'terminal', prompt: T('הציגו את ‎/etc/shadow‎ (צריך הרשאות root)', 'Show /etc/shadow (root rights needed)'), hint: T('sudo cat /etc/shadow', 'sudo cat /etc/shadow'), goal: (sh, log) => log.some(l => l.out.startsWith('root:*:')), solve: ['sudo cat /etc/shadow'] },
    ] },
    { title: T('קבוצות', 'Groups'), exercises: [
      { type: 'teach', cmd: '/etc/group', name: 'groups', text: T('‎/etc/group‎ מכיל שורה לכל קבוצה: שם, x, ‏GID ורשימת חברים. לכל משתמש יש קבוצה ראשית (ה־GID ב־passwd) וקבוצות נוספות. ‏id מציגה את כולן, ו־groups רק את השמות.', '/etc/group has a line per group: name, x, GID and a member list. Each user has a primary group (the GID in passwd) and extra groups. id shows them all, and groups shows just the names.'), demo: [[], 'grep developers /etc/group'] },
      { type: 'output', prompt: ON_SERVER, rec: 'user-id', wrongRec: ['user-groups', 'user-usermod-G'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ מציגה UID, ‏GID וכל הקבוצות של משתמש.', 'The ___ command shows a user\'s UID, GID and all their groups.'), options: ['id', 'who', 'whoami'], answer: 'id' },
      { type: 'output', prompt: WHAT, cmd: 'grep sudo /etc/group', wrongCmds: ['grep developers /etc/group'], wrongText: ['sudo'] },
      { type: 'match', prompt: T('התאימו כל פקודה למה שהיא מציגה', 'Match each command to what it shows'), pairs: [['whoami', T('רק השם שלי', 'just my name')], ['id', T('UID, ‏GID וקבוצות', 'UID, GID and groups')], ['groups', T('שמות הקבוצות', 'group names')], ['getent passwd', T('כל המשתמשים', 'all users')]] },
      { type: 'terminal', prompt: T('הדפיסו את רשימת החברים בקבוצה developers', 'Print the member list of the developers group'), hint: T('grep developers /etc/group | cut -d : -f 4', 'grep developers /etc/group | cut -d : -f 4'), goal: (sh, log) => log.some(l => l.out.trim() === 'dana,omer'), solve: ['grep developers /etc/group | cut -d : -f 4'] },
    ] },
    { title: T('חזרה', 'Review'), exercises: [
      { type: 'output', prompt: ON_SERVER, rec: 'user-groups', wrongRec: ['user-id'], wrongText: ['dana'] },
      { type: 'sentence', prompt: READ, text: T('השדה השביעי ב־‎/etc/passwd‎ הוא ה־___ של המשתמש.', 'The seventh field of /etc/passwd is the user\'s ___.'), options: ['shell', 'home', 'UID'], answer: 'shell' },
      { type: 'choice', prompt: T('ל־www-data יש shell בשם ‎/usr/sbin/nologin. למה?', 'www-data has the shell /usr/sbin/nologin. Why?'), plain: true,
        options: [T('זה משתמש של שירות, ואף אחד לא צריך להיכנס איתו', 'It is a service user, and nobody should log in as it'), T('הוא נמחק', 'It was deleted'), T('הוא מנהל', 'It is an admin'), T('אין לו תיקיית בית', 'It has no home folder')],
        why: [null, T('הוא קיים, רק בלי כניסה.', 'It exists, just without login.'), T('זה ההפך: הרשאות מינימליות.', 'The opposite: minimal rights.'), T('יש לו: ‎/var/www.', 'It has one: /var/www.')] },
      { type: 'tiles', prompt: T('הדפיסו את תיקיות הבית (השדה השישי) של כל המשתמשים', 'Print the home folders (field 6) of every user'), answer: 'cut -d : -f 6 /etc/passwd', tiles: ['cut', '-d', ':', '-f', '6', '/etc/passwd', '7', '/etc/group'] },
      { type: 'terminal', ask: T('כמה משתמשים?', 'How many users?'), prompt: T('כמה שורות (משתמשים) יש ב־‎/etc/passwd?', 'How many lines (users) are in /etc/passwd?'), hint: T('wc -l /etc/passwd', 'wc -l /etc/passwd'), goal: (sh, log) => sysShown(log, 'wc -l /etc/passwd'), solve: ['wc -l /etc/passwd'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('ביקורת חשבונות.', 'An account audit.'), exercises: [
    { type: 'terminal', prompt: T('מצאו את כל המשתמשים עם UID ‏0 (צריך להיות רק root)', 'Find every user with UID 0 (should be only root)'), hint: T("awk -F : '$3 == 0 {print $1}' /etc/passwd", "awk -F : '$3 == 0 {print $1}' /etc/passwd"), goal: (sh, log) => log.some(l => l.out.trim() === 'root'), solve: ["awk -F : '$3 == 0 {print $1}' /etc/passwd"] },
    { type: 'terminal', prompt: T('הדפיסו את שמות המשתמשים הרגילים: UID ‏1000 ומעלה', 'Print the names of regular users: UID 1000 and up'), hint: T("awk -F : '$3 >= 1000 {print $1}' /etc/passwd", "awk -F : '$3 >= 1000 {print $1}' /etc/passwd"), goal: (sh, log) => sysShown(log, "awk -F : '$3 >= 1000 {print $1}' /etc/passwd"), solve: ["awk -F : '$3 >= 1000 {print $1}' /etc/passwd"] },
    { type: 'terminal', prompt: T('מי בקבוצה sudo? הדפיסו את רשימת החברים', 'Who is in the sudo group? Print the member list'), hint: T('grep "^sudo:" /etc/group | cut -d : -f 4', 'grep "^sudo:" /etc/group | cut -d : -f 4'), goal: (sh, log) => log.some(l => l.out.trim() === 'user,dana'), solve: ['grep "^sudo:" /etc/group | cut -d : -f 4'] },
  ] },
};

const UNIT_34 = {
  section: 4, unit: 34, exams: ['L107.1', 'R', 'F'], title: T('ניהול משתמשים', 'Managing users'), subtitle: T('useradd, ‏usermod, ‏userdel, ‏passwd ו־chage', 'useradd, usermod, userdel, passwd and chage'), color: 'purple', fixture: sysFixture,
  lessons: [
    { title: T('useradd', 'useradd'), exercises: [
      { type: 'teach', cmd: 'useradd', name: 'add user', text: T('‎useradd -m -s /bin/bash omer‎ יוצרת משתמש: ‎-m‎ יוצרת תיקיית בית (עם קבצים מ־‎/etc/skel), ‎-s‎ קובעת shell, ‎-c‎ תיאור, ‎-G‎ קבוצות נוספות, ‎-u‎ UID. אחר כך ‎passwd omer‎ נותנת לו סיסמה. ‏groupadd יוצרת קבוצה.', 'useradd -m -s /bin/bash omer creates a user: -m makes a home folder (with files from /etc/skel), -s sets the shell, -c a description, -G extra groups, -u the UID. Then passwd omer gives a password. groupadd creates a group.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הריצו ‎useradd -m -s /bin/bash omer‎. מה הודפס (תיקיית הבית והשורה ב־passwd)?', 'On a real Ubuntu server useradd -m -s /bin/bash omer ran. What was printed (the home folder and the passwd line)?'), rec: 'user-useradd', wrongRec: ['user-passwd-line'], wrongText: ['omer:x:1004:1006::/home/omer:/bin/sh'] },
      { type: 'sentence', prompt: READ, text: T('בלי ___, ‏useradd לא יוצרת תיקיית בית.', 'Without ___, useradd does not create a home folder.'), options: ['-m', '-s', '-G'], answer: '-m' },
      { type: 'match', prompt: T('התאימו כל אפשרות של useradd', 'Match each useradd option'), pairs: [['-m', T('תיקיית בית', 'home folder')], ['-s', T('shell', 'shell')], ['-G', T('קבוצות נוספות', 'extra groups')], ['-c', T('תיאור', 'description')]] },
      { type: 'scenario', prompt: T('צרו משתמש בשם noa עם תיקיית בית ו־bash', 'Create a user named noa with a home folder and bash'), hint: T('useradd -m -s /bin/bash noa', 'useradd -m -s /bin/bash noa'), accept: svc('useradd -m -s /bin/bash noa', ['useradd -s /bin/bash -m noa', 'sudo useradd -s /bin/bash -m noa']) },
      { type: 'scenario', prompt: T('צרו קבוצה בשם testers', 'Create a group named testers'), hint: T('groupadd', 'groupadd'), accept: svc('groupadd testers') },
    ] },
    { title: T('usermod', 'usermod'), exercises: [
      { type: 'teach', cmd: 'usermod -aG', name: 'modify user', text: T('usermod משנה משתמש קיים. החשובה: ‎usermod -aG docker dana‎ מוסיפה את dana לקבוצה. בלי ‎-a‎, ה־‎-G‎ מחליפה את כל הקבוצות הנוספות שלה! ‏‎-s‎ משנה shell, ‎-L‎ נועלת ו־‎-U‎ פותחת. השינוי בקבוצות נכנס לתוקף בכניסה הבאה.', 'usermod changes an existing user. The key one: usermod -aG docker dana adds dana to a group. Without -a, -G replaces all her extra groups! -s changes the shell, -L locks and -U unlocks. Group changes apply at the next login.') },
      { type: 'output', prompt: T('dana הייתה בקבוצה ops. הריצו ‎usermod -G web dana‎ (בלי ‎-a). מה הדפיסה id על Ubuntu אמיתי?', 'dana was in the ops group. usermod -G web dana ran (no -a). What did id print on real Ubuntu?'), rec: 'user-usermod-G', wrongRec: ['user-id'], wrongText: ['uid=1003(dana) gid=1003(dana) groups=1003(dana),1007(ops),1008(web)'] },
      { type: 'sentence', prompt: READ, text: T('כדי להוסיף קבוצה בלי למחוק את הקיימות כותבים usermod ___.', 'To add a group without removing the existing ones, write usermod ___.'), options: ['-aG', '-G', '-g'], answer: '-aG' },
      { type: 'choice', prompt: T('איך נותנים ל־omer הרשאות sudo באובונטו?', 'How do you give omer sudo rights on Ubuntu?'), options: ['usermod -aG sudo omer', 'usermod -G sudo omer', 'chmod +s omer', 'useradd sudo omer'], answer: 'usermod -aG sudo omer',
        why: { 'usermod -G sudo omer': T('בלי ‎-a‎ הוא יאבד את שאר הקבוצות שלו.', 'Without -a he loses his other groups.'), 'chmod +s omer': T('chmod פועלת על קבצים.', 'chmod works on files.'), 'useradd sudo omer': T('useradd יוצרת משתמש חדש.', 'useradd creates a new user.') } },
      { type: 'output', prompt: T('נעלו את dana עם ‎usermod -L. מה הדפיסה ‎passwd -S dana‎ (שתי עמודות) על Ubuntu אמיתי?', 'dana was locked with usermod -L. What did passwd -S dana print (two columns) on real Ubuntu?'), rec: 'user-lock', wrongRec: ['user-passwd-S'], wrongText: ['dana NP'] },
      { type: 'scenario', prompt: T('הוסיפו את noa לקבוצה developers, בלי להוציא אותה מקבוצות אחרות', 'Add noa to the developers group without removing her from others'), hint: T('usermod -aG', 'usermod -aG'), accept: svc('usermod -aG developers noa', ['usermod -a -G developers noa', 'sudo usermod -a -G developers noa', 'gpasswd -a noa developers', 'sudo gpasswd -a noa developers']) },
    ] },
    { title: T('passwd ו־chage', 'passwd and chage'), exercises: [
      { type: 'teach', cmd: 'chage', name: 'change age', text: T('passwd משנה סיסמה (שלכם, או של כל אחד בתור root). ‎passwd -S‎ מציגה מצב: P יש סיסמה, L נעול, NP בלי סיסמה. ‏chage קובעת תוקף: ‎-M 90‎ החלפה כל 90 יום, ‎-W 7‎ אזהרה שבוע לפני, ‎-E‎ תאריך שבו החשבון נסגר, ו־‎-l‎ מציגה הכול.', 'passwd changes a password (yours, or anyone\'s as root). passwd -S shows the state: P has a password, L locked, NP no password. chage sets ageing: -M 90 change every 90 days, -W 7 warn a week before, -E a date the account closes, and -l shows it all.') },
      { type: 'output', prompt: T('ל־dana הגדירו ‎chage -M 90 -W 7. מה הדפיסה ‎chage -l dana‎ על Ubuntu אמיתי?', 'dana was given chage -M 90 -W 7. What did chage -l dana print on real Ubuntu?'), rec: 'user-chage-l', wrongText: ['Maximum number of days between password change\t\t: 99999', 'Password expires\t\t\t\t\t: never'] },
      { type: 'sentence', prompt: READ, text: T('chage ___ 90 מחייבת להחליף סיסמה כל 90 יום.', 'chage ___ 90 forces a password change every 90 days.'), options: ['-M', '-W', '-E'], answer: '-M' },
      { type: 'match', prompt: T('התאימו כל אפשרות של chage', 'Match each chage option'), pairs: [['-M', T('מקסימום ימים עד החלפה', 'max days until a change')], ['-m', T('מינימום ימים בין החלפות', 'min days between changes')], ['-W', T('ימי אזהרה', 'warning days')], ['-l', T('הצגת המצב', 'show the settings')]] },
      { type: 'scenario', prompt: T('חייבו את noa להחליף סיסמה בכניסה הבאה', 'Force noa to change her password at the next login'), hint: T('chage -d 0, או passwd -e', 'chage -d 0, or passwd -e'), accept: svc('chage -d 0 noa', ['passwd -e noa', 'sudo passwd -e noa', 'passwd --expire noa', 'sudo passwd --expire noa']) },
      { type: 'scenario', prompt: T('תנו ל־noa סיסמה', 'Give noa a password'), hint: T('passwd', 'passwd'), accept: svc('passwd noa') },
    ] },
    { title: T('userdel ו־LDAP', 'userdel and LDAP'), exercises: [
      { type: 'teach', cmd: 'userdel -r', name: 'delete user', text: T('‎userdel -r omer‎ מוחקת משתמש ואת תיקיית הבית שלו (בלי ‎-r‎ התיקייה נשארת). ‏groupdel מוחקת קבוצה. בארגונים גדולים המשתמשים לא נמצאים ב־passwd אלא בשרת LDAP או Active Directory, והשירות sssd מחבר אותם; ‏getent passwd מציגה גם אותם.', 'userdel -r omer deletes a user and their home folder (without -r the folder stays). groupdel deletes a group. In big organisations users live not in passwd but on an LDAP or Active Directory server, and the sssd service connects them; getent passwd shows them too.') },
      { type: 'match', prompt: T('התאימו כל פקודה', 'Match each command'), pairs: [['userdel -r', T('מוחקת משתמש ותיקיית בית', 'deletes user and home')], ['groupdel', T('מוחקת קבוצה', 'deletes a group')], ['getent passwd', T('משתמשים מכל המקורות', 'users from every source')], ['sssd', T('מחבר משתמשים מ־LDAP', 'connects LDAP users')]] },
      { type: 'sentence', prompt: READ, text: T('userdel ___ מוחקת גם את תיקיית הבית.', 'userdel ___ also deletes the home folder.'), options: ['-r', '-f', '-h'], answer: '-r' },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי יצרו משתמש שירות עם nologin וניסו להריץ פקודה בתורו. מה הודפס?', 'On a real Ubuntu server a service user was made with nologin, and a command was tried as it. What was printed?'), rec: 'user-nologin', wrongText: ['svc', 'svc:x:999:987::/home/svc:/bin/bash\nsvc'] },
      { type: 'choice', prompt: T('עובד עזב. מה עדיף כשצריך לשמור את הקבצים שלו לבדיקה?', 'An employee left. What is better when you must keep their files for review?'), plain: true,
        options: [T('לנעול את החשבון (usermod -L) ולא למחוק עדיין', 'Lock the account (usermod -L) and do not delete yet'), T('userdel -r מיד', 'userdel -r right away'), T('לשנות לו את השם', 'Rename him'), T('לתת לו UID ‏0', 'Give him UID 0')],
        why: [null, T('‎-r‎ מוחקת את הקבצים שצריך לבדוק.', '-r deletes the files you need to review.'), T('שינוי שם לא חוסם כניסה.', 'Renaming does not block login.'), T('UID ‏0 הוא root. זו הטעות הכי מסוכנת.', 'UID 0 is root. That is the most dangerous mistake.')] },
      { type: 'scenario', prompt: T('מחקו את המשתמש tmpuser יחד עם תיקיית הבית שלו', 'Delete the user tmpuser along with their home folder'), hint: T('userdel -r', 'userdel -r'), accept: svc('userdel -r tmpuser') },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('עובדת חדשה מצטרפת לצוות.', 'A new employee joins the team.'), exercises: [
    { type: 'scenario', prompt: T('צרו את המשתמשת maya עם תיקיית בית, bash ותיאור "Maya Cohen"', 'Create the user maya with a home folder, bash and the description "Maya Cohen"'), hint: T('useradd -m -s /bin/bash -c "Maya Cohen" maya', 'useradd -m -s /bin/bash -c "Maya Cohen" maya'), accept: svc('useradd -m -s /bin/bash -c "Maya Cohen" maya', ['useradd -m -c "Maya Cohen" -s /bin/bash maya', 'sudo useradd -m -c "Maya Cohen" -s /bin/bash maya']) },
    { type: 'scenario', prompt: T('הוסיפו אותה לקבוצה developers', 'Add her to the developers group'), hint: T('usermod -aG', 'usermod -aG'), accept: svc('usermod -aG developers maya', ['usermod -a -G developers maya', 'sudo usermod -a -G developers maya', 'gpasswd -a maya developers', 'sudo gpasswd -a maya developers']) },
    { type: 'scenario', prompt: T('קבעו שתצטרך להחליף סיסמה כל 60 יום', 'Require her to change her password every 60 days'), hint: T('chage -M 60', 'chage -M 60'), accept: svc('chage -M 60 maya') },
  ] },
};

const UNIT_35 = {
  section: 4, unit: 35, exams: ['L110.1', 'R', 'F'], title: T('sudo ו־su', 'sudo and su'), subtitle: T('הרשאות ניהול בצורה בטוחה', 'Admin rights, safely'), color: 'blue', fixture: sysFixture,
  lessons: [
    { title: T('su', 'su'), exercises: [
      { type: 'teach', cmd: 'su -', name: 'switch user', text: T('su מחליפה משתמש: ‎su - dana‎ נכנסת בתור dana עם הסביבה שלה (המקף חשוב: תיקיית הבית וה־PATH שלה). su בלי שם עוברת ל־root ודורשת את הסיסמה של root. ‏exit חוזרת.', 'su switches user: su - dana logs in as dana with her environment (the dash matters: her home folder and PATH). su with no name switches to root and needs root\'s password. exit goes back.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי, root הריץ ‎su - dana -c \'whoami; pwd\'. מה הודפס?', 'On a real Ubuntu server, root ran su - dana -c \'whoami; pwd\'. What was printed?'), rec: 'su-whoami', wrongText: ['root\n/root', 'dana\n/root'] },
      { type: 'sentence', prompt: READ, text: T('אחרי ‎su - dana‎, הפקודה pwd תדפיס ___.', 'After su - dana, the pwd command prints ___.'), options: ['/home/dana', '/root', '/tmp'], answer: '/home/dana' },
      { type: 'match', prompt: T('התאימו כל פקודה', 'Match each command'), pairs: [['su -', T('root, עם הסיסמה של root', 'root, with root\'s password')], ['su - dana', T('כניסה בתור dana', 'log in as dana')], ['sudo cmd', T('פקודה אחת בתור root, עם הסיסמה שלכם', 'one command as root, with your password')], ['sudo -i', T('shell של root, עם הסיסמה שלכם', 'a root shell, with your password')]] },
      { type: 'choice', prompt: T('למה באובונטו משתמשים ב־sudo ולא ב־su?', 'Why does Ubuntu use sudo rather than su?'), plain: true,
        options: [T('לא צריך לשתף את הסיסמה של root, וכל פקודה נרשמת בלוג', 'Nobody shares root\'s password, and every command is logged'), T('sudo מהירה יותר', 'sudo is faster'), T('su לא קיימת באובונטו', 'su does not exist on Ubuntu'), T('sudo לא דורשת סיסמה', 'sudo needs no password')],
        why: [null, T('המהירות לא העניין.', 'Speed is not the point.'), T('su קיימת.', 'su exists.'), T('היא דורשת את הסיסמה שלכם.', 'It asks for your password.')] },
      { type: 'scenario', prompt: T('היכנסו בתור omer, עם הסביבה המלאה שלו', 'Log in as omer, with his full environment'), hint: T('su - omer', 'su - omer'), accept: ['su - omer', 'su -l omer', 'sudo su - omer', 'sudo -iu omer', 'sudo -i -u omer'] },
    ] },
    { title: T('sudo', 'sudo'), exercises: [
      { type: 'teach', cmd: 'sudo -l', name: 'sudo', text: T('sudo מריצה פקודה בתור root אם ‎/etc/sudoers‎ מרשה. באובונטו חברי הקבוצה sudo מורשים לכל דבר, וב־Red Hat הקבוצה נקראת wheel. ‎sudo -l‎ מראה מה מותר לכם, ‎sudo -i‎ פותחת shell של root, ו־‎sudo -u dana cmd‎ מריצה בתור משתמש אחר.', 'sudo runs a command as root if /etc/sudoers allows it. On Ubuntu, members of the sudo group may do anything, and on Red Hat the group is called wheel. sudo -l shows what you may do, sudo -i opens a root shell, and sudo -u dana cmd runs as another user.') },
      { type: 'output', prompt: T('dana בקבוצה sudo. מה הדפיסה ‎sudo -l -U dana‎ על Ubuntu אמיתי?', 'dana is in the sudo group. What did sudo -l -U dana print on real Ubuntu?'), rec: 'sudo-l', wrongText: ['User dana is not allowed to run sudo on runnervm48cm3.', 'dana : dana sudo'] },
      { type: 'sentence', prompt: READ, text: T('ב־Red Hat, הקבוצה שמקבלת sudo נקראת ___.', 'On Red Hat, the group that gets sudo is called ___.'), options: ['wheel', 'sudo', 'admin'], answer: 'wheel' },
      { type: 'output', prompt: ON_SERVER, rec: 'sudo-group', wrongText: ['%wheel ALL=(ALL) ALL', 'root ALL=(ALL:ALL) ALL'] },
      { type: 'match', prompt: T('התאימו כל צורה של sudo', 'Match each form of sudo'), pairs: [['sudo -l', T('מה מותר לי', 'what I am allowed')], ['sudo -i', T('shell של root', 'a root shell')], ['sudo -u dana', T('בתור dana', 'as dana')], ['sudo !!', T('הפקודה הקודמת, עם sudo', 'the last command, with sudo')]] },
      { type: 'scenario', prompt: T('בדקו אילו פקודות מותר לכם להריץ עם sudo', 'Check which commands you may run with sudo'), hint: T('sudo -l', 'sudo -l'), accept: ['sudo -l'] },
    ] },
    { title: T('‎/etc/sudoers', '/etc/sudoers'), exercises: [
      { type: 'teach', cmd: 'visudo', name: 'edit sudoers', text: T('את sudoers עורכים רק עם visudo, שבודקת את התחביר לפני שמירה: טעות שם יכולה לנעול את כולם מחוץ ל־root. שורה נראית כך: ‎dana ALL=(ALL) /usr/bin/systemctl restart nginx‎ (מי, באיזה מחשב, בתור מי, איזו פקודה). ‏‎%‎ לפני שם זו קבוצה. עדיף קובץ נפרד ב־‎/etc/sudoers.d.', 'Edit sudoers only with visudo, which checks the syntax before saving: a mistake there can lock everyone out of root. A line looks like: dana ALL=(ALL) /usr/bin/systemctl restart nginx (who, on which host, as whom, which command). A % before a name means a group. A separate file in /etc/sudoers.d is better.') },
      { type: 'output', prompt: T('יצרו את ‎/etc/sudoers.d/dana‎ עם הרשאה ל־systemctl restart nginx ובדקו אותו. מה הודפס על Ubuntu אמיתי?', '/etc/sudoers.d/dana was made allowing systemctl restart nginx, then checked. What was printed on real Ubuntu?'), rec: 'sudo-dropin', wrongText: ['visudo: >>> /etc/sudoers.d/dana: syntax error near line 1 <<<', ''] },
      { type: 'sentence', prompt: READ, text: T('את sudoers עורכים רק עם ___, כדי לא לשבור אותו.', 'Edit sudoers only with ___, so you do not break it.'), options: ['visudo', 'vi', 'nano'], answer: 'visudo' },
      { type: 'match', prompt: T('התאימו כל חלק בשורה ‎%ops ALL=(ALL) /usr/bin/systemctl', 'Match each part of %ops ALL=(ALL) /usr/bin/systemctl'), pairs: [['%ops', T('הקבוצה ops', 'the group ops')], ['ALL=', T('בכל מחשב', 'on any host')], ['(ALL)', T('בתור כל משתמש', 'as any user')], ['/usr/bin/systemctl', T('רק הפקודה הזו', 'only this command')]] },
      { type: 'choice', prompt: T('למה עדיף לכתוב ב־‎/etc/sudoers.d/‎ ולא ב־‎/etc/sudoers?', 'Why write in /etc/sudoers.d/ rather than /etc/sudoers?'), plain: true,
        options: [T('עדכון של החבילה לא ידרוס את השינוי, וקל להסיר קובץ אחד', 'A package update will not overwrite it, and one file is easy to remove'), T('רק שם visudo עובדת', 'visudo only works there'), T('זה מהיר יותר', 'It is faster'), T('ב־sudoers אסור לכתוב', 'sudoers may not be edited')],
        why: [null, T('visudo עובדת על שניהם (‎-f‎).', 'visudo works on both (-f).'), T('אין הבדל מהירות.', 'There is no speed difference.'), T('מותר, דרך visudo.', 'It may, through visudo.')] },
      { type: 'scenario', prompt: T('ערכו את sudoers בצורה הבטוחה', 'Edit sudoers the safe way'), hint: T('visudo', 'visudo'), accept: ['visudo', 'sudo visudo', 'sudo visudo -f /etc/sudoers'] },
    ] },
    { title: T('חזרה', 'Review'), exercises: [
      { type: 'sentence', prompt: READ, text: T('הסימן ___ לפני שם ב־sudoers אומר שזו קבוצה.', 'The ___ sign before a name in sudoers means it is a group.'), options: ['%', '@', '#'], answer: '%' },
      { type: 'choice', prompt: T('איזו שורה נותנת לקבוצה ops להריץ רק systemctl בתור root?', 'Which line lets the ops group run only systemctl as root?'), options: ['%ops ALL=(root) /usr/bin/systemctl', 'ops ALL=(ALL) ALL', '%ops ALL=(ALL) ALL', '@ops /usr/bin/systemctl'], answer: '%ops ALL=(root) /usr/bin/systemctl',
        why: { 'ops ALL=(ALL) ALL': T('בלי % זה משתמש בשם ops, וגם הכול מותר.', 'Without % this is a user named ops, and everything is allowed.'), '%ops ALL=(ALL) ALL': T('זה מרשה כל פקודה.', 'That allows every command.'), '@ops /usr/bin/systemctl': T('@ לא מסמן קבוצה ב־sudoers.', '@ does not mark a group in sudoers.') } },
      { type: 'match', prompt: T('התאימו כל קובץ', 'Match each file'), pairs: [['/etc/sudoers', T('ההגדרות של sudo', 'sudo\'s settings')], ['/etc/sudoers.d/', T('קבצים נוספים', 'extra files')], ['/var/log/auth.log', T('הלוג של sudo באובונטו', 'sudo\'s log on Ubuntu')], ['/etc/shadow', T('הסיסמאות', 'the passwords')]] },
      { type: 'terminal', prompt: T('הריצו whoami בתור root, ואז בתור עצמכם', 'Run whoami as root, then as yourself'), hint: T('sudo whoami, ואז whoami', 'sudo whoami, then whoami'), goal: (sh, log) => log.some(l => l.out === 'root') && log.some(l => l.out === 'user'), solve: ['sudo whoami', 'whoami'] },
      { type: 'scenario', prompt: T('פתחו shell של root בעזרת הסיסמה שלכם', 'Open a root shell using your own password'), hint: T('sudo -i', 'sudo -i'), accept: ['sudo -i', 'sudo su -', 'sudo -s'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('נותנים לצוות בדיוק את מה שצריך.', 'Giving the team exactly what it needs.'), exercises: [
    { type: 'scenario', prompt: T('תנו ל־maya הרשאות sudo מלאות באובונטו', 'Give maya full sudo rights on Ubuntu'), hint: T('usermod -aG sudo', 'usermod -aG sudo'), accept: svc('usermod -aG sudo maya', ['usermod -a -G sudo maya', 'sudo usermod -a -G sudo maya', 'gpasswd -a maya sudo', 'sudo gpasswd -a maya sudo']) },
    { type: 'scenario', prompt: T('כתבו שורת sudoers שמרשה לקבוצה web להריץ רק ‎/usr/bin/systemctl reload nginx‎ בתור root', 'Write a sudoers line letting the group web run only /usr/bin/systemctl reload nginx as root'), hint: T('%web ALL=(root) …', '%web ALL=(root) …'), accept: ['%web ALL=(root) /usr/bin/systemctl reload nginx', '%web ALL=(ALL) /usr/bin/systemctl reload nginx', '%web ALL=(root) NOPASSWD: /usr/bin/systemctl reload nginx'] },
    { type: 'scenario', prompt: T('בדקו שהקובץ ‎/etc/sudoers.d/web‎ תקין', 'Check that /etc/sudoers.d/web is valid'), hint: T('visudo -cf', 'visudo -cf'), accept: ['visudo -cf /etc/sudoers.d/web', 'sudo visudo -cf /etc/sudoers.d/web', 'visudo -c -f /etc/sudoers.d/web', 'sudo visudo -c -f /etc/sudoers.d/web'] },
  ] },
};

const UNIT_36 = {
  section: 4, unit: 36, exams: ['L103.5', 'R', 'F'], title: T('תהליכים', 'Processes'), subtitle: T('ps, ‏top, ‏pgrep, ‏kill ואותות', 'ps, top, pgrep, kill and signals'), color: 'green', fixture: sysFixture,
  lessons: [
    { title: T('ps', 'ps'), exercises: [
      { type: 'teach', cmd: 'ps aux', name: 'process status', text: T('כל תוכנה שרצה היא תהליך עם מספר, PID. ‏ps מציגה תהליכים: ‎ps aux‎ את כולם, עם המשתמש, ‏%CPU, ‏%MEM וה־STAT (R רץ, S ישן, Z זומבי). ‎ps -ef‎ מראה גם את ה־PPID, התהליך שהפעיל אותו.', 'Every running program is a process with a number, the PID. ps lists processes: ps aux shows them all, with the user, %CPU, %MEM and STAT (R running, S sleeping, Z zombie). ps -ef also shows the PPID, the process that started it.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הריצו ‎ps aux | head -n 1‎. מה הודפס?', 'ps aux | head -n 1 was run on a real Ubuntu server. What was printed?'), rec: 'proc-ps-aux-head', wrongText: ['  PID TTY          TIME CMD', 'UID          PID    PPID  C STIME TTY          TIME CMD'] },
      { type: 'sentence', prompt: READ, text: T('המספר הייחודי של כל תהליך נקרא ___.', 'Each process\'s unique number is called its ___.'), options: ['PID', 'UID', 'GID'], answer: 'PID' },
      { type: 'match', prompt: T('התאימו כל אות ב־STAT', 'Match each STAT letter'), pairs: [['R', T('רץ', 'running')], ['S', T('ישן, מחכה', 'sleeping, waiting')], ['Z', T('זומבי: הסתיים, ההורה לא אסף', 'zombie: ended, parent did not reap')], ['T', T('עצור', 'stopped')]] },
      { type: 'choice', prompt: T('איך מוצאים את התהליכים שמשתמשים בהכי הרבה זיכרון?', 'How do you find the processes using the most memory?'), options: ['ps aux --sort=-%mem | head', 'ps -l', 'top -mem', 'free -p'], answer: 'ps aux --sort=-%mem | head',
        why: { 'ps -l': T('זה מציג רק את התהליכים של הטרמינל שלכם.', 'That shows only your terminal\'s processes.'), 'top -mem': T('אין ל־top אפשרות כזו. בתוך top לוחצים M.', 'top has no such option. Inside top, press M.'), 'free -p': T('free מראה זיכרון כולל, לא תהליכים.', 'free shows total memory, not processes.') } },
      { type: 'scenario', prompt: T('הציגו את כל התהליכים במערכת, עם המשתמש של כל אחד', 'List every process on the system, with each one\'s user'), hint: T('ps aux', 'ps aux'), accept: ['ps aux', 'ps -ef', 'ps -aux', 'ps axu'] },
    ] },
    { title: T('top', 'top'), exercises: [
      { type: 'teach', cmd: 'top', name: 'table of processes', text: T('top מציגה תהליכים בזמן אמת, מהכבד לקל. למעלה: זמן פעילות, עומס, תהליכים, מעבד וזיכרון. בתוכה: P מיון לפי מעבד, M לפי זיכרון, k להרוג תהליך, q ליציאה. htop היא גרסה צבעונית ונוחה יותר.', 'top shows processes live, heaviest first. At the top: uptime, load, tasks, CPU and memory. Inside: P sorts by CPU, M by memory, k kills a process, q quits. htop is a friendlier, colourful version.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הריצו ‎top -bn1 | head -n 5‎. מה הודפס?', 'top -bn1 | head -n 5 was run on a real Ubuntu server. What was printed?'), rec: 'proc-top', wrongRec: ['health-vmstat'], wrongText: ['  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND'] },
      { type: 'sentence', prompt: READ, text: T('בתוך top, המקש ___ ממיין לפי זיכרון.', 'Inside top, the ___ key sorts by memory.'), options: ['M', 'P', 'k'], answer: 'M' },
      { type: 'match', prompt: T('התאימו כל מקש בתוך top', 'Match each key inside top'), pairs: [['P', T('מיון לפי מעבד', 'sort by CPU')], ['M', T('מיון לפי זיכרון', 'sort by memory')], ['k', T('הריגת תהליך', 'kill a process')], ['q', T('יציאה', 'quit')]] },
      { type: 'choice', prompt: T('בשורת ה־‎%Cpu(s)‎ של top, מה זה id?', 'In top\'s %Cpu(s) line, what is id?'), plain: true,
        options: [T('האחוז שבו המעבד לא עושה כלום', 'The percent of time the CPU is idle'), T('המזהה של המעבד', 'The CPU\'s ID'), T('תהליכים של root', 'root\'s processes'), T('זמן המתנה לדיסק', 'Waiting on disk')],
        why: [null, T('id קיצור של idle.', 'id is short for idle.'), T('זה לא קשור למשתמשים.', 'It is not about users.'), T('המתנה לדיסק היא wa.', 'Waiting on disk is wa.')] },
      { type: 'scenario', prompt: T('פתחו את המסך שמציג תהליכים בזמן אמת', 'Open the live process view'), hint: T('top', 'top'), accept: ['top', 'htop'] },
    ] },
    { title: T('אותות ו־kill', 'Signals and kill'), exercises: [
      { type: 'teach', cmd: 'kill', name: 'send a signal', text: T('kill שולחת אות לתהליך. ברירת המחדל היא 15, ‏SIGTERM: "בבקשה תסיים", והתוכנה יכולה לנקות לפני שהיא יוצאת. ‏9, ‏SIGKILL, הורג מיד ואי אפשר להתעלם ממנו, אז משתמשים בו רק כשאין ברירה. ‏1, ‏SIGHUP, אומר להרבה שירותים לקרוא מחדש את ההגדרות.', 'kill sends a signal to a process. The default is 15, SIGTERM: "please finish", and the program can clean up before it exits. 9, SIGKILL, kills at once and cannot be ignored, so use it only when nothing else works. 1, SIGHUP, tells many services to reread their settings.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הריצו ‎kill -l | head -n 4‎. מה הודפס?', 'kill -l | head -n 4 was run on a real Ubuntu server. What was printed?'), rec: 'proc-kill-l', wrongText: ['SIGTERM SIGKILL SIGHUP', '15) SIGTERM'] },
      { type: 'sentence', prompt: READ, text: T('האות ___ הורג תהליך מיד, ואי אפשר להתעלם ממנו.', 'Signal ___ kills a process at once and cannot be ignored.'), options: ['9', '15', '1'], answer: '9' },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הפעילו sleep, שלחו לו kill רגיל, וביקשו את קוד היציאה. מה הודפס?', 'On a real Ubuntu server a sleep was started, sent a plain kill, and its exit status printed. What was printed?'), rec: 'proc-kill', wrongText: ['exit status: 0', 'exit status: 137'] },
      { type: 'match', prompt: T('התאימו כל אות', 'Match each signal'), pairs: [['1 SIGHUP', T('קריאה מחדש של הגדרות', 'reread settings')], ['2 SIGINT', T('Ctrl+C', 'Ctrl+C')], ['9 SIGKILL', T('הריגה מיידית', 'kill now')], ['15 SIGTERM', T('בקשה לסיים', 'ask to finish')]] },
      { type: 'scenario', prompt: T('בקשו בנימוס מתהליך 4242 לסיים', 'Politely ask process 4242 to finish'), hint: T('kill בלי מספר אות', 'kill with no signal number'), accept: ['kill 4242', 'kill -15 4242', 'kill -TERM 4242', 'kill -SIGTERM 4242', 'sudo kill 4242'] },
    ] },
    { title: T('pgrep ו־pkill', 'pgrep and pkill'), exercises: [
      { type: 'teach', cmd: 'pgrep', name: 'process grep', text: T('pgrep מוצאת PIDs לפי שם (‎-a‎ מציגה גם את הפקודה, ‎-u‎ לפי משתמש). pkill שולחת אות לכל התהליכים בשם הזה, ו־killall עושה אותו דבר לפי שם מדויק. זהירות: pkill עלולה לתפוס יותר ממה שחשבתם.', 'pgrep finds PIDs by name (-a also shows the command, -u by user). pkill sends a signal to every process with that name, and killall does the same by exact name. Careful: pkill may catch more than you expect.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי רצו ‎sleep 301‎ ו־‎sleep 302‎. מה הדפיסה pgrep -a sleep (בלי ה־PID)?', 'On a real Ubuntu server sleep 301 and sleep 302 were running. What did pgrep -a sleep print (without the PIDs)?'), rec: 'proc-pgrep', wrongText: ['sleep', '301\n302'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ שולחת אות לכל התהליכים לפי שם.', 'The ___ command sends a signal to all processes by name.'), options: ['pkill', 'pgrep', 'ps'], answer: 'pkill' },
      { type: 'match', prompt: T('התאימו כל פקודה', 'Match each command'), pairs: [['pgrep', T('מוצאת PIDs', 'finds PIDs')], ['pkill', T('אות לפי שם', 'signal by name')], ['kill', T('אות לפי PID', 'signal by PID')], ['killall', T('אות לפי שם מדויק', 'signal by exact name')]] },
      { type: 'choice', prompt: T('איך מוצאים את כל התהליכים של המשתמש dana?', 'How do you find all of dana\'s processes?'), options: ['pgrep -u dana', 'pgrep dana', 'ps dana', 'kill -l dana'], answer: 'pgrep -u dana',
        why: { 'pgrep dana': T('זה מחפש תהליכים ששמם dana.', 'That looks for processes named dana.'), 'ps dana': T('ps לא מקבלת שם משתמש כך.', 'ps does not take a user name like that.'), 'kill -l dana': T('‎kill -l‎ מציגה רשימת אותות.', 'kill -l lists signals.') } },
      { type: 'scenario', prompt: T('הרגו מיד את כל התהליכים בשם firefox', 'Kill every process named firefox right away'), hint: T('pkill -9', 'pkill -9'), accept: ['pkill -9 firefox', 'killall -9 firefox', 'pkill -KILL firefox', 'killall -KILL firefox'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('תהליך תקוע תופס את השרת.', 'A stuck process is hogging the server.'), exercises: [
    { type: 'scenario', prompt: T('מצאו את ה־PID של התהליך בשם backup.sh', 'Find the PID of the process named backup.sh'), hint: T('pgrep', 'pgrep'), accept: ['pgrep backup.sh', 'pgrep -f backup.sh', 'pgrep -a backup.sh', 'pidof backup.sh'] },
    { type: 'scenario', prompt: T('בקשו ממנו (PID 3141) לסיים', 'Ask it (PID 3141) to finish'), hint: T('kill', 'kill'), accept: ['kill 3141', 'kill -15 3141', 'kill -TERM 3141', 'sudo kill 3141'] },
    { type: 'scenario', prompt: T('הוא לא הגיב. הרגו אותו בכוח', 'It did not respond. Kill it by force'), hint: T('kill -9', 'kill -9'), accept: ['kill -9 3141', 'kill -KILL 3141', 'kill -SIGKILL 3141', 'sudo kill -9 3141'] },
  ] },
};

const UNIT_37 = {
  section: 4, unit: 37, exams: ['L103.5', 'L103.6', 'R'], title: T('עבודות ועדיפות', 'Jobs and priority'), subtitle: T('&, ‏bg, ‏fg, ‏nohup, ‏nice ו־tmux', '&, bg, fg, nohup, nice and tmux'), color: 'purple', fixture: sysFixture,
  lessons: [
    { title: T('רקע וחזית', 'Background and foreground'), exercises: [
      { type: 'teach', cmd: '&', name: 'jobs', text: T('‎&‎ בסוף פקודה מריצה אותה ברקע, והטרמינל פנוי מיד. ‏Ctrl+Z עוצרת את מה שרץ בחזית. jobs מציגה את העבודות, ‎bg %1‎ ממשיכה את עבודה 1 ברקע, ו־‎fg %1‎ מחזירה אותה לחזית.', '& at the end of a command runs it in the background, freeing the terminal at once. Ctrl+Z pauses what runs in the foreground. jobs lists the jobs, bg %1 resumes job 1 in the background, and fg %1 brings it back to the front.') },
      { type: 'match', prompt: T('התאימו כל פעולה', 'Match each action'), pairs: [['cmd &', T('מריצה ברקע', 'runs in the background')], ['Ctrl+Z', T('עוצרת את החזית', 'pauses the foreground')], ['bg', T('ממשיכה ברקע', 'resumes in the background')], ['fg', T('מחזירה לחזית', 'brings to the front')]] },
      { type: 'sentence', prompt: READ, text: T('הסימן ___ בסוף פקודה מריץ אותה ברקע.', 'The ___ sign at the end of a command runs it in the background.'), options: ['&', '|', ';'], answer: '&' },
      { type: 'choice', prompt: T('התחלתם העתקה ארוכה בחזית ושכחתם &. מה עושים כדי לפנות את הטרמינל בלי לעצור אותה?', 'You started a long copy in the foreground and forgot &. How do you free the terminal without stopping it?'), plain: true,
        options: [T('Ctrl+Z ואז bg', 'Ctrl+Z, then bg'), T('Ctrl+C ואז &', 'Ctrl+C, then &'), T('לסגור את הטרמינל', 'Close the terminal'), T('fg', 'fg')],
        why: [null, T('Ctrl+C מבטלת את ההעתקה.', 'Ctrl+C cancels the copy.'), T('סגירה תהרוג אותה.', 'Closing kills it.'), T('fg מחזירה לחזית, היא כבר שם.', 'fg brings to the front; it is already there.')] },
      { type: 'scenario', prompt: T('החזירו לחזית את עבודה מספר 2', 'Bring job number 2 back to the front'), hint: T('fg %2', 'fg %2'), accept: ['fg %2', 'fg 2'] },
      { type: 'scenario', prompt: T('הציגו את העבודות שרצות ברקע בטרמינל הזה', 'List the jobs running in this terminal'), hint: T('jobs', 'jobs'), accept: ['jobs', 'jobs -l'] },
    ] },
    { title: T('nohup ו־tmux', 'nohup and tmux'), exercises: [
      { type: 'teach', cmd: 'nohup', name: 'no hangup', text: T('כשסוגרים טרמינל, התהליכים שלו מקבלים SIGHUP ומתים. ‎nohup cmd &‎ מתעלמת מזה, והפלט הולך ל־nohup.out אם לא הפניתם אותו. ‏tmux ו־screen פותחים מושב שנשאר חי גם כשמתנתקים: ‏Ctrl+B ואז d מנתקת, ו־‎tmux attach‎ מתחברת חזרה.', 'When a terminal closes, its processes get SIGHUP and die. nohup cmd & ignores it, and output goes to nohup.out unless you redirected it. tmux and screen open a session that stays alive when you disconnect: Ctrl+B then d detaches, and tmux attach reconnects.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הריצו nohup עם פלט שהופנה ל־‎/dev/null. מה הודפס?', 'On a real Ubuntu server nohup ran with its output sent to /dev/null. What was printed?'), rec: 'proc-nohup', wrongText: ['started\nnohup.out', 'nohup: ignoring input and appending output to \'nohup.out\''] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ שומרת תהליך חי גם אחרי שסוגרים את הטרמינל.', 'The ___ command keeps a process alive after the terminal closes.'), options: ['nohup', 'bg', 'jobs'], answer: 'nohup' },
      { type: 'match', prompt: T('התאימו כל פקודה', 'Match each command'), pairs: [['nohup', T('מתעלמת מ־SIGHUP', 'ignores SIGHUP')], ['tmux', T('מושב שנשאר חי', 'a session that stays alive')], ['tmux attach', T('התחברות חזרה', 'reconnect')], ['Ctrl+B d', T('ניתוק מ־tmux', 'detach from tmux')]] },
      { type: 'choice', prompt: T('אתם מתחברים ב־SSH מרכבת ומריצים עדכון ארוך. מה הכי בטוח?', 'You SSH in from a train and run a long upgrade. What is safest?'), plain: true,
        options: [T('להריץ אותו בתוך tmux', 'Run it inside tmux'), T('להריץ רגיל ולקוות', 'Run it normally and hope'), T('להריץ עם sudo', 'Run it with sudo'), T('להריץ עם &', 'Run it with &')],
        why: [null, T('אם החיבור נופל, העדכון נקטע באמצע.', 'If the connection drops, the upgrade stops halfway.'), T('sudo לא שומרת עליו בניתוק.', 'sudo does not protect it from a disconnect.'), T('& לבד עדיין מת עם הטרמינל.', '& alone still dies with the terminal.')] },
      { type: 'scenario', prompt: T('הריצו את ‎./long-job.sh‎ ברקע כך שימשיך לרוץ אחרי שתתנתקו', 'Run ./long-job.sh in the background so it keeps running after you log out'), hint: T('nohup … &', 'nohup … &'), accept: ['nohup ./long-job.sh &', 'nohup ./long-job.sh > /dev/null 2>&1 &', 'nohup ./long-job.sh > out.log 2>&1 &'] },
    ] },
    { title: T('nice ו־renice', 'nice and renice'), exercises: [
      { type: 'teach', cmd: 'nice', name: 'priority', text: T('לכל תהליך יש ערך nice מ־‎-20‎ (הכי חשוב) עד 19 (הכי מנומס). ברירת המחדל 0. ‎nice -n 10 cmd‎ מתחילה עם עדיפות נמוכה, ו־‎renice -n 5 -p PID‎ משנה תהליך שכבר רץ. רק root יכול להוריד nice מתחת ל־0.', 'Every process has a nice value from -20 (most important) to 19 (most polite). The default is 0. nice -n 10 cmd starts with low priority, and renice -n 5 -p PID changes a running process. Only root can lower nice below 0.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי שינו ל־5 את ה־nice של תהליך sleep. מה הודפס?', 'On a real Ubuntu server a sleep process\'s nice was changed to 5. What was printed?'), rec: 'proc-renice', wrongText: ['PID (process ID) old priority 5, new priority 0', 'renice: failed to set priority for PID: Permission denied'] },
      { type: 'sentence', prompt: READ, text: T('ערך nice של ___ הוא העדיפות הגבוהה ביותר.', 'A nice value of ___ is the highest priority.'), options: ['-20', '19', '0'], answer: '-20' },
      { type: 'match', prompt: T('התאימו כל ערך nice', 'Match each nice value'), pairs: [['-20', T('הכי חשוב', 'most important')], ['0', T('ברירת מחדל', 'default')], ['19', T('הכי מנומס', 'most polite')], ['10', T('עבודת רקע', 'background work')]] },
      { type: 'choice', prompt: T('גיבוי לילי מאט את האתר. מה עושים?', 'A nightly backup slows the website. What do you do?'), options: ['nice -n 19 ./backup.sh', 'nice -n -20 ./backup.sh', 'kill -9 backup', 'renice 0 backup'], answer: 'nice -n 19 ./backup.sh',
        why: { 'nice -n -20 ./backup.sh': T('זה נותן לגיבוי עדיפות עליונה ומאט את האתר עוד יותר.', 'That gives the backup top priority and slows the site even more.'), 'kill -9 backup': T('זה עוצר את הגיבוי לגמרי.', 'That stops the backup entirely.'), 'renice 0 backup': T('0 היא ברירת המחדל, ו־renice צריכה PID.', '0 is the default, and renice needs a PID.') } },
      { type: 'scenario', prompt: T('הריצו את ‎./report.sh‎ עם nice של 15', 'Run ./report.sh with a nice value of 15'), hint: T('nice -n 15', 'nice -n 15'), accept: ['nice -n 15 ./report.sh', 'nice -15 ./report.sh'] },
    ] },
    { title: T('חזרה', 'Review'), exercises: [
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ משנה את העדיפות של תהליך שכבר רץ.', 'The ___ command changes the priority of a running process.'), options: ['renice', 'nice', 'bg'], answer: 'renice' },
      { type: 'match', prompt: T('התאימו כל מצב לפקודה', 'Match each situation to a command'), pairs: [['nohup', T('להמשיך אחרי ניתוק', 'keep going after logout')], ['bg', T('עבודה עצורה, להמשיך ברקע', 'paused job, resume in background')], ['fg', T('להחזיר לחזית', 'bring to front')], ['renice', T('להוריד עדיפות', 'lower priority')]] },
      { type: 'choice', prompt: T('מה ההבדל בין ‎cmd &‎ לבין ‎nohup cmd &‎ כשסוגרים את הטרמינל?', 'What is the difference between cmd & and nohup cmd & when the terminal closes?'), plain: true,
        options: [T('רק עם nohup התהליך שורד', 'Only with nohup does the process survive'), T('אין הבדל', 'There is none'), T('רק עם & הוא שורד', 'Only with & does it survive'), T('שניהם מתים מיד', 'Both die at once')],
        why: [null, T('בלי nohup מגיע SIGHUP.', 'Without nohup, SIGHUP arrives.'), T('ההפך.', 'The opposite.'), T('nohup שורד.', 'nohup survives.')] },
      { type: 'scenario', prompt: T('תנו לתהליך 777 עדיפות נמוכה יותר: nice של 10', 'Give process 777 a lower priority: nice 10'), hint: T('renice -n 10 -p 777', 'renice -n 10 -p 777'), accept: ['renice -n 10 -p 777', 'renice 10 -p 777', 'renice -n 10 777', 'sudo renice -n 10 -p 777'] },
      { type: 'scenario', prompt: T('התחברו חזרה למושב tmux שהשארתם פתוח', 'Reconnect to the tmux session you left open'), hint: T('tmux attach', 'tmux attach'), accept: ['tmux attach', 'tmux a', 'tmux attach-session', 'tmux attach -t 0'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('עבודה כבדה שלא מפריעה לאף אחד.', 'Heavy work that bothers nobody.'), exercises: [
    { type: 'scenario', prompt: T('הריצו את ‎./reindex.sh‎ ברקע, בעדיפות 19, כך שישרוד ניתוק', 'Run ./reindex.sh in the background at priority 19 so it survives logout'), hint: T('nohup nice -n 19 … &', 'nohup nice -n 19 … &'), accept: ['nohup nice -n 19 ./reindex.sh &', 'nice -n 19 nohup ./reindex.sh &', 'nohup nice -n 19 ./reindex.sh > /dev/null 2>&1 &', 'nohup nice -19 ./reindex.sh &'] },
    { type: 'scenario', prompt: T('הציגו את העבודות שרצות ברקע', 'List the background jobs'), hint: T('jobs', 'jobs'), accept: ['jobs', 'jobs -l'] },
    { type: 'scenario', prompt: T('הורידו עוד את העדיפות של תהליך 5150 ל־15', 'Lower process 5150\'s priority to 15'), hint: T('renice', 'renice'), accept: ['renice -n 15 -p 5150', 'renice 15 -p 5150', 'renice -n 15 5150', 'sudo renice -n 15 -p 5150'] },
  ] },
};

const UNIT_38 = {
  section: 4, unit: 38, exams: ['L101.3', 'R', 'F'], title: T('שירותי systemd', 'systemd services'), subtitle: T('systemctl start, ‏stop, ‏enable ו־status', 'systemctl start, stop, enable and status'), color: 'blue', fixture: sysFixture,
  lessons: [
    { title: T('status', 'status'), exercises: [
      { type: 'teach', cmd: 'systemctl status', name: 'service status', text: T('systemd הוא התהליך הראשון (PID 1), והוא מנהל את כל השירותים. ‎systemctl status nginx‎ מראה אם השירות רץ (active), אם הוא יעלה באתחול (enabled), ואת השורות האחרונות בלוג שלו.', 'systemd is the first process (PID 1), and it manages every service. systemctl status nginx shows whether the service is running (active), whether it starts at boot (enabled), and its latest log lines.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי, nginx מותקן אבל עצור ולא מופעל באתחול. מה הדפיסה ‎systemctl status nginx‎ (שלוש שורות)?', 'On a real Ubuntu server nginx is installed but stopped and not enabled. What did systemctl status nginx print (three lines)?'), rec: 'svc-status', wrongText: ['● nginx.service - A high performance web server and a reverse proxy server\n     Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: enabled)\n     Active: active (running) since ...', 'Unit nginx.service could not be found.'] },
      { type: 'sentence', prompt: READ, text: T('התהליך הראשון בלינוקס, עם PID ‏1, הוא ___.', 'The first process on Linux, PID 1, is ___.'), options: ['systemd', 'bash', 'init.d'], answer: 'systemd' },
      { type: 'match', prompt: T('התאימו כל מילה בפלט של status', 'Match each word in status output'), pairs: [['active', T('רץ עכשיו', 'running now')], ['inactive', T('לא רץ', 'not running')], ['enabled', T('יעלה באתחול', 'starts at boot')], ['disabled', T('לא יעלה באתחול', 'does not start at boot')]] },
      { type: 'output', prompt: T('nginx עצור ולא מופעל. מה הדפיסו ‎systemctl is-active‎ ו־‎is-enabled‎ על Ubuntu אמיתי?', 'nginx is stopped and not enabled. What did systemctl is-active and is-enabled print on real Ubuntu?'), rec: 'svc-is-active', wrongText: ['active\nenabled', 'inactive\nenabled'] },
      { type: 'scenario', prompt: T('בדקו את המצב של השירות sshd', 'Check the state of the sshd service'), hint: T('systemctl status', 'systemctl status'), accept: ['systemctl status sshd', 'systemctl status ssh', 'sudo systemctl status sshd', 'sudo systemctl status ssh', 'systemctl status sshd.service'] },
    ] },
    { title: T('start, ‏stop ו־restart', 'start, stop and restart'), exercises: [
      { type: 'teach', cmd: 'systemctl start', name: 'start and stop', text: T('‎systemctl start nginx‎ מפעילה, stop עוצרת, restart עוצרת ומפעילה, ו־reload טוענת מחדש הגדרות בלי לנתק משתמשים (אם השירות תומך). השינויים האלה הם רק עד האתחול הבא.', 'systemctl start nginx starts it, stop stops it, restart stops and starts it, and reload rereads settings without dropping users (if the service supports it). These changes only last until the next boot.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי עצרו את nginx ובדקו. מה הודפס?', 'On a real Ubuntu server nginx was stopped, then checked. What was printed?'), rec: 'svc-stop', wrongText: ['active', 'failed'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה systemctl ___ קוראת מחדש הגדרות בלי לנתק משתמשים.', 'systemctl ___ rereads settings without dropping users.'), options: ['reload', 'restart', 'start'], answer: 'reload' },
      { type: 'match', prompt: T('התאימו כל פעולה', 'Match each action'), pairs: [['start', T('מפעילה', 'starts')], ['stop', T('עוצרת', 'stops')], ['restart', T('עוצרת ומפעילה', 'stops and starts')], ['reload', T('קוראת הגדרות מחדש', 'rereads settings')]] },
      { type: 'choice', prompt: T('שיניתם את ההגדרות של nginx. מה הכי עדין לאתר שעובד?', 'You changed nginx\'s settings. What is gentlest on a live website?'), options: ['systemctl reload nginx', 'systemctl restart nginx', 'systemctl stop nginx', 'reboot'], answer: 'systemctl reload nginx',
        why: { 'systemctl restart nginx': T('restart עובד, אבל מנתק לרגע את כל החיבורים.', 'restart works, but drops every connection for a moment.'), 'systemctl stop nginx': T('זה מכבה את האתר.', 'That takes the site down.'), reboot: T('זה מכבה את כל השרת.', 'That takes the whole server down.') } },
      { type: 'scenario', prompt: T('הפעילו מחדש את השירות apache2', 'Restart the apache2 service'), hint: T('systemctl restart', 'systemctl restart'), accept: svc('systemctl restart apache2', ['systemctl restart apache2.service', 'sudo systemctl restart apache2.service']) },
    ] },
    { title: T('enable ו־disable', 'enable and disable'), exercises: [
      { type: 'teach', cmd: 'systemctl enable', name: 'start at boot', text: T('‎systemctl enable nginx‎ קובעת שהשירות יעלה בכל אתחול (היא יוצרת קישור בתיקיית ה־target), ו־disable מבטלת. ‎enable --now‎ גם מפעילה עכשיו. במבחנים המעשיים בודקים בדיוק את זה: כל הגדרה חייבת לשרוד אתחול.', 'systemctl enable nginx makes the service start at every boot (it creates a link in the target folder), and disable undoes it. enable --now also starts it right away. Hands-on exams check exactly this: every setting must survive a reboot.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי, nginx היה כבוי. הריצו ‎systemctl enable --now nginx‎ ובדקו. מה הודפס?', 'On a real Ubuntu server nginx was off. systemctl enable --now nginx ran, then a check. What was printed?'), rec: 'svc-enable-now', wrongRec: ['svc-disable'], wrongText: ['active'] },
      { type: 'sentence', prompt: READ, text: T('‎systemctl enable ___‎ גם מפעילה את השירות מיד.', 'systemctl enable ___ also starts the service right away.'), options: ['--now', '--all', '-f'], answer: '--now' },
      { type: 'output', prompt: ON_SERVER, rec: 'svc-disable', wrongRec: ['svc-enable-now'], wrongText: ['enabled'] },
      { type: 'choice', prompt: T('הפעלתם שירות עם start, ואחרי אתחול הוא לא רץ. למה?', 'You started a service with start, and after a reboot it is not running. Why?'), plain: true,
        options: [T('start לא שורדת אתחול. צריך גם enable', 'start does not survive a reboot. You also need enable'), T('השירות התקלקל', 'The service broke'), T('צריך sudo', 'You need sudo'), T('האתחול מוחק שירותים', 'Booting deletes services')],
        why: [null, T('הוא עדיין מותקן ותקין.', 'It is still installed and fine.'), T('בלי sudo, start בכלל לא הייתה עובדת.', 'Without sudo, start would not have worked at all.'), T('שירותים לא נמחקים.', 'Services are not deleted.')] },
      { type: 'scenario', prompt: T('הפעילו את chronyd עכשיו וגם בכל אתחול, בפקודה אחת', 'Start chronyd now and at every boot, in one command'), hint: T('enable --now', 'enable --now'), accept: svc('systemctl enable --now chronyd', ['systemctl enable --now chrony', 'sudo systemctl enable --now chrony']) },
    ] },
    { title: T('חזרה', 'Review'), exercises: [
      { type: 'match', prompt: T('התאימו כל פקודה', 'Match each command'), pairs: [['enable', T('באתחול: כן', 'at boot: yes')], ['disable', T('באתחול: לא', 'at boot: no')], ['is-active', T('רץ עכשיו?', 'running now?')], ['is-enabled', T('יעלה באתחול?', 'starts at boot?')]] },
      { type: 'sentence', prompt: READ, text: T('השינוי של systemctl ___ נשאר גם אחרי אתחול.', 'The change from systemctl ___ stays after a reboot.'), options: ['enable', 'start', 'restart'], answer: 'enable' },
      { type: 'choice', prompt: T('איזו פקודה עוצרת את bluetooth וגם מונעת ממנו לעלות באתחול?', 'Which command stops bluetooth and also keeps it from starting at boot?'), options: ['systemctl disable --now bluetooth', 'systemctl stop bluetooth', 'systemctl disable bluetooth', 'kill bluetooth'], answer: 'systemctl disable --now bluetooth',
        why: { 'systemctl stop bluetooth': T('זה רק עד האתחול הבא.', 'That only lasts until the next boot.'), 'systemctl disable bluetooth': T('זה משאיר אותו רץ עכשיו.', 'That leaves it running now.'), 'kill bluetooth': T('kill צריכה PID, ו־systemd עלול להפעיל אותו שוב.', 'kill needs a PID, and systemd may start it again.') } },
      { type: 'scenario', prompt: T('בדקו אם השירות cron יעלה באתחול', 'Check whether cron will start at boot'), hint: T('is-enabled', 'is-enabled'), accept: ['systemctl is-enabled cron', 'systemctl is-enabled crond', 'systemctl is-enabled cron.service'] },
      { type: 'scenario', prompt: T('עצרו את cups', 'Stop cups'), hint: T('systemctl stop', 'systemctl stop'), accept: svc('systemctl stop cups', ['systemctl stop cups.service', 'sudo systemctl stop cups.service']) },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('מעלים שרת אינטרנט שישרוד אתחול.', 'Bringing up a web server that survives a reboot.'), exercises: [
    { type: 'scenario', prompt: T('הפעילו את nginx עכשיו וגם בכל אתחול', 'Start nginx now and at every boot'), hint: T('enable --now', 'enable --now'), accept: svc('systemctl enable --now nginx', ['systemctl enable nginx --now', 'sudo systemctl enable nginx --now']) },
    { type: 'scenario', prompt: T('אחרי שינוי בהגדרות, טענו אותן מחדש בלי לנתק משתמשים', 'After a settings change, reload them without dropping users'), hint: T('reload', 'reload'), accept: svc('systemctl reload nginx') },
    { type: 'scenario', prompt: T('ודאו שהוא רץ עכשיו', 'Make sure it is running now'), hint: T('is-active או status', 'is-active or status'), accept: ['systemctl is-active nginx', 'systemctl status nginx', 'sudo systemctl status nginx'] },
  ] },
};

const UNIT_39 = {
  section: 4, unit: 39, exams: ['L101.3', 'R', 'F'], title: T('systemd לעומק', 'systemd deeper'), subtitle: T('קבצי unit, ‏targets ו־mask', 'Unit files, targets and mask'), color: 'green', fixture: sysFixture,
  lessons: [
    { title: T('קבצי unit', 'Unit files'), exercises: [
      { type: 'teach', cmd: '.service', name: 'unit files', text: T('כל שירות מוגדר בקובץ unit עם שלושה חלקים: ‎[Unit]‎ (תיאור ותלויות כמו After=), ‏‎[Service]‎ (ExecStart= הפקודה שמריצים, Restart= מתי להפעיל מחדש), ו־‎[Install]‎ (WantedBy= לאיזה target הוא שייך). קבצים של חבילות נמצאים ב־‎/usr/lib/systemd/system, ושלכם ב־‎/etc/systemd/system.', 'Each service is defined in a unit file with three sections: [Unit] (a description and ordering like After=), [Service] (ExecStart= the command to run, Restart= when to restart), and [Install] (WantedBy= which target it belongs to). Package files live in /usr/lib/systemd/system, and yours in /etc/systemd/system.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הריצו ‎systemctl cat nginx‎ וסיננו את השורות החשובות. מה הודפס?', 'systemctl cat nginx was run on a real Ubuntu server and the key lines kept. What was printed?'), rec: 'svc-unit-cat', wrongText: ['[Service]\nExecStart=/usr/sbin/nginx\n[Install]\nWantedBy=graphical.target', 'nginx.service'] },
      { type: 'sentence', prompt: READ, text: T('השורה ___ בקובץ unit אומרת איזו פקודה להריץ.', 'The ___ line in a unit file says which command to run.'), options: ['ExecStart=', 'WantedBy=', 'After='], answer: 'ExecStart=' },
      { type: 'match', prompt: T('התאימו כל שורה בקובץ unit', 'Match each unit file line'), pairs: [['ExecStart=', T('הפקודה שרצה', 'the command that runs')], ['After=', T('אחרי מה לעלות', 'what to start after')], ['WantedBy=', T('לאיזה target', 'which target')], ['Restart=', T('מתי להפעיל מחדש', 'when to restart')]] },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי כתבו שירות קטן שמדפיס "hello from demo", הפעילו אותו וקראו את הלוג שלו. מה הודפס?', 'On a real Ubuntu server a small service that prints "hello from demo" was written, started, and its log read. What was printed?'), rec: 'svc-custom', wrongText: ['hello from demo', 'Failed to start hello.service: Unit hello.service not found.'] },
      { type: 'scenario', prompt: T('יצרתם קובץ unit חדש ב־‎/etc/systemd/system. מה מריצים כדי ש־systemd יראה אותו?', 'You created a new unit file in /etc/systemd/system. What do you run so systemd sees it?'), hint: T('daemon-reload', 'daemon-reload'), accept: svc('systemctl daemon-reload') },
    ] },
    { title: T('targets', 'Targets'), exercises: [
      { type: 'teach', cmd: 'target', name: 'targets', text: T('target הוא קבוצת שירותים שמגדירה "מצב" של המערכת, כמו runlevel של פעם: multi-user.target הוא שרת בלי ממשק גרפי, graphical.target עם ממשק, rescue.target מצב תיקון למשתמש אחד, ו־emergency.target הכי מינימלי. ‏get-default מראה עם מה עולים, set-default משנה, ו־isolate עוברת עכשיו.', 'A target is a set of services that defines a system "state", like the old runlevels: multi-user.target is a server without a GUI, graphical.target with one, rescue.target a single-user repair mode, and emergency.target the barest. get-default shows what you boot into, set-default changes it, and isolate switches now.') },
      { type: 'output', prompt: ON_SERVER, rec: 'svc-get-default', wrongText: ['multi-user.target', 'runlevel 5'] },
      { type: 'sentence', prompt: READ, text: T('שרת בלי ממשק גרפי עולה ל־___.', 'A server without a GUI boots into ___.'), options: ['multi-user.target', 'graphical.target', 'rescue.target'], answer: 'multi-user.target' },
      { type: 'match', prompt: T('התאימו כל target ל־runlevel הישן', 'Match each target to its old runlevel'), pairs: [['poweroff.target', '0'], ['rescue.target', '1'], ['multi-user.target', '3'], ['graphical.target', '5']] },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הציגו את ה־targets העיקריים. מה הודפס?', 'The main targets were listed on a real Ubuntu server. What was printed?'), rec: 'svc-list-units', wrongText: ['multi-user.target loaded inactive dead', 'graphical.target'] },
      { type: 'scenario', prompt: T('קבעו שהשרת יעלה תמיד בלי ממשק גרפי', 'Make the server always boot without a GUI'), hint: T('set-default', 'set-default'), accept: svc('systemctl set-default multi-user.target') },
    ] },
    { title: T('mask ושירות שנכשל', 'mask and failed services'), exercises: [
      { type: 'teach', cmd: 'systemctl mask', name: 'mask', text: T('disable רק מונעת עלייה באתחול, ועדיין אפשר להפעיל ידנית או שירות אחר יגרור אותו. mask חוסמת לגמרי: היא מקשרת את השירות ל־‎/dev/null. ‏unmask מבטלת. ‎systemctl --failed‎ מציגה שירותים שנכשלו.', 'disable only stops it starting at boot; you can still start it by hand, or another service may pull it in. mask blocks it completely: it links the service to /dev/null. unmask undoes it. systemctl --failed lists services that failed.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי עשו mask ל־nginx וניסו להפעיל אותו. מה הודפס?', 'On a real Ubuntu server nginx was masked, then a start was tried. What was printed?'), rec: 'svc-mask', wrongText: ['Removed /etc/systemd/system/multi-user.target.wants/nginx.service.', ''] },
      { type: 'sentence', prompt: READ, text: T('הפקודה systemctl ___ חוסמת שירות כך שאי אפשר להפעיל אותו בכלל.', 'systemctl ___ blocks a service so it cannot start at all.'), options: ['mask', 'disable', 'stop'], answer: 'mask' },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי כתבו שירות שמריץ ‎/bin/false, הפעילו אותו ובדקו. מה הודפס?', 'On a real Ubuntu server a service running /bin/false was written, started, and checked. What was printed?'), rec: 'svc-failed', wrongText: ['active', 'inactive'] },
      { type: 'match', prompt: T('התאימו כל פקודה', 'Match each command'), pairs: [['disable', T('לא באתחול, אבל אפשר ידנית', 'not at boot, but by hand')], ['mask', T('חסום לגמרי', 'fully blocked')], ['unmask', T('מבטלת חסימה', 'lifts the block')], ['--failed', T('מה נכשל', 'what failed')]] },
      { type: 'scenario', prompt: T('הציגו את כל השירותים שנכשלו', 'List every service that failed'), hint: T('systemctl --failed', 'systemctl --failed'), accept: ['systemctl --failed', 'systemctl list-units --failed', 'systemctl list-units --state=failed'] },
    ] },
    { title: T('חזרה', 'Review'), exercises: [
      { type: 'sentence', prompt: READ, text: T('קבצי unit שאתם כותבים בעצמכם נשמרים ב־___.', 'Unit files you write yourself go in ___.'), options: ['/etc/systemd/system', '/usr/lib/systemd/system', '/var/systemd'], answer: '/etc/systemd/system' },
      { type: 'choice', prompt: T('ערכתם קובץ unit של שירות קיים. מה הסדר הנכון?', 'You edited an existing service\'s unit file. What is the right order?'), options: ['daemon-reload, then restart', 'restart, then daemon-reload', 'reboot only', 'enable, then mask'], answer: 'daemon-reload, then restart',
        why: { 'restart, then daemon-reload': T('בלי daemon-reload קודם, ה־restart משתמש בקובץ הישן.', 'Without daemon-reload first, the restart uses the old file.'), 'reboot only': T('זה עובד, אבל מוגזם.', 'It works, but it is overkill.'), 'enable, then mask': T('mask חוסמת את השירות.', 'mask blocks the service.') } },
      { type: 'match', prompt: T('התאימו כל פקודה', 'Match each command'), pairs: [['get-default', T('לאן עולים', 'what we boot into')], ['set-default', T('שינוי ברירת המחדל', 'change the default')], ['isolate', T('מעבר עכשיו', 'switch now')], ['daemon-reload', T('קריאת קבצי unit מחדש', 'reread unit files')]] },
      { type: 'scenario', prompt: T('עברו עכשיו למצב rescue (בלי לאתחל)', 'Switch to rescue mode now (without rebooting)'), hint: T('isolate', 'isolate'), accept: svc('systemctl isolate rescue.target', ['systemctl rescue', 'sudo systemctl rescue']) },
      { type: 'scenario', prompt: T('חסמו לגמרי את השירות telnet', 'Fully block the telnet service'), hint: T('mask', 'mask'), accept: svc('systemctl mask telnet', ['systemctl mask telnet.socket', 'sudo systemctl mask telnet.socket']) },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('שירות משלכם, מאפס.', 'Your own service, from scratch.'), exercises: [
    { type: 'scenario', prompt: T('כתבתם ‎/etc/systemd/system/myapp.service. גרמו ל־systemd לקרוא אותו', 'You wrote /etc/systemd/system/myapp.service. Make systemd read it'), hint: T('daemon-reload', 'daemon-reload'), accept: svc('systemctl daemon-reload') },
    { type: 'scenario', prompt: T('הפעילו את myapp עכשיו ובכל אתחול', 'Start myapp now and at every boot'), hint: T('enable --now', 'enable --now'), accept: svc('systemctl enable --now myapp', ['systemctl enable --now myapp.service', 'sudo systemctl enable --now myapp.service']) },
    { type: 'scenario', prompt: T('ודאו שהשרת יעלה בלי ממשק גרפי', 'Make sure the server boots without a GUI'), hint: T('set-default multi-user.target', 'set-default multi-user.target'), accept: svc('systemctl set-default multi-user.target') },
  ] },
};

const UNIT_40 = {
  section: 4, unit: 40, exams: ['L108.2', 'R', 'F'], title: T('לוגים', 'Logs'), subtitle: T('journalctl, ‏‎/var/log, ‏logger ו־logrotate', 'journalctl, /var/log, logger and logrotate'), color: 'purple', fixture: sysFixture,
  lessons: [
    { title: T('journalctl', 'journalctl'), exercises: [
      { type: 'teach', cmd: 'journalctl', name: 'the journal', text: T('systemd אוסף את כל הלוגים ל־journal. ‏journalctl מציגה אותו: ‎-u nginx‎ רק שירות אחד, ‎-b‎ רק מהאתחול הנוכחי, ‎-p err‎ רק שגיאות ומעלה, ‎-f‎ ממשיכה להציג שורות חדשות, ו־‎--since "1 hour ago"‎ לפי זמן.', 'systemd collects all logs into the journal. journalctl shows it: -u nginx just one service, -b only since this boot, -p err only errors and worse, -f keeps showing new lines, and --since "1 hour ago" by time.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הפעילו מחדש את nginx והציגו את שתי השורות האחרונות שלו. מה הודפס?', 'On a real Ubuntu server nginx was restarted and its last two log lines shown. What was printed?'), rec: 'journal-u', wrongRec: ['svc-custom'], wrongText: ['nginx: [emerg] bind() to 0.0.0.0:80 failed'] },
      { type: 'sentence', prompt: READ, text: T('journalctl ___ nginx מציגה רק את הלוג של nginx.', 'journalctl ___ nginx shows only nginx\'s log.'), options: ['-u', '-p', '-b'], answer: '-u' },
      { type: 'match', prompt: T('התאימו כל אפשרות של journalctl', 'Match each journalctl option'), pairs: [['-u', T('שירות אחד', 'one service')], ['-b', T('מהאתחול הנוכחי', 'since this boot')], ['-p err', T('רק שגיאות', 'only errors')], ['-f', T('לעקוב אחרי שורות חדשות', 'follow new lines')]] },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי נרשמה שגיאה, והציגו את כל השגיאות מ־5 הדקות האחרונות. מה הודפס?', 'On a real Ubuntu server an error was logged, then all errors from the last 5 minutes shown. What was printed?'), rec: 'journal-p', wrongRec: ['journal-logger'], wrongText: ['-- No entries --'] },
      { type: 'scenario', prompt: T('עקבו בזמן אמת אחרי הלוג של sshd', 'Follow the sshd log live'), hint: T('journalctl -u … -f', 'journalctl -u … -f'), accept: ['journalctl -u sshd -f', 'journalctl -fu sshd', 'journalctl -f -u sshd', 'journalctl -u ssh -f', 'journalctl -fu ssh', 'journalctl -f -u ssh', 'sudo journalctl -u sshd -f', 'sudo journalctl -u ssh -f'] },
    ] },
    { title: T('‎/var/log ו־rsyslog', '/var/log and rsyslog'), exercises: [
      { type: 'teach', cmd: '/var/log', name: 'log files', text: T('לצד ה־journal, rsyslog כותב קבצי טקסט ב־‎/var/log: באובונטו syslog (הכללי) ו־auth.log (כניסות ו־sudo), וב־Red Hat ‏messages ו־secure. ‏kern.log לקרנל. ‏logger כותבת הודעה משלכם ללוג, טוב לסקריפטים.', 'Next to the journal, rsyslog writes text files in /var/log: on Ubuntu syslog (general) and auth.log (logins and sudo), and on Red Hat messages and secure. kern.log is for the kernel. logger writes your own message to the log, good for scripts.') },
      { type: 'output', prompt: ON_SERVER, rec: 'log-varlog', wrongText: ['messages\nsecure', 'app.log'] },
      { type: 'sentence', prompt: READ, text: T('באובונטו, כניסות למערכת ופקודות sudo נרשמות ב־___.', 'On Ubuntu, logins and sudo commands are logged in ___.'), options: ['auth.log', 'syslog', 'kern.log'], answer: 'auth.log' },
      { type: 'match', prompt: T('התאימו כל קובץ לוג', 'Match each log file'), pairs: [['/var/log/syslog', T('כללי, באובונטו', 'general, on Ubuntu')], ['/var/log/messages', T('כללי, ב־Red Hat', 'general, on Red Hat')], ['/var/log/auth.log', T('כניסות ו־sudo, באובונטו', 'logins and sudo, on Ubuntu')], ['/var/log/secure', T('כניסות ו־sudo, ב־Red Hat', 'logins and sudo, on Red Hat')]] },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי סקריפט רשם "backup finished" עם התג backup, ואז קראו את הלוג לפי התג. מה הודפס?', 'On a real Ubuntu server a script logged "backup finished" with the tag backup, then the log was read by that tag. What was printed?'), rec: 'journal-logger', wrongRec: ['journal-p'], wrongText: ['backup: backup finished'] },
      { type: 'scenario', prompt: T('כתבו ללוג את ההודעה "deploy done" עם התג deploy', 'Write the message "deploy done" to the log with the tag deploy'), hint: T('logger -t', 'logger -t'), accept: ['logger -t deploy "deploy done"', "logger -t deploy 'deploy done'", 'logger -t deploy deploy done'] },
    ] },
    { title: T('logrotate', 'logrotate'), exercises: [
      { type: 'teach', cmd: 'logrotate', name: 'rotate logs', text: T('בלי טיפול, לוגים גדלים עד שהדיסק מתמלא. logrotate רצה כל יום ומסובבת אותם: שומרת את הישן בשם עם מספר, דוחסת ומוחקת עתיקים. ההגדרות ב־‎/etc/logrotate.conf‎ וב־‎/etc/logrotate.d/: ‏daily או weekly, ‏rotate 4 (כמה לשמור), compress.', 'Left alone, logs grow until the disk fills. logrotate runs daily and rotates them: it renames the old one with a number, compresses and deletes ancient ones. Settings live in /etc/logrotate.conf and /etc/logrotate.d/: daily or weekly, rotate 4 (how many to keep), compress.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הציגו את תחילת ‎/etc/logrotate.d/rsyslog. מה הודפס?', 'The start of /etc/logrotate.d/rsyslog was shown on a real Ubuntu server. What was printed?'), rec: 'log-logrotate', wrongText: ['/var/log/syslog {\n\tdaily\n\trotate 30\n}', 'logrotate: ALERT exited abnormally'] },
      { type: 'sentence', prompt: READ, text: T('ב־logrotate, השורה rotate ___ שומרת 4 גרסאות ישנות.', 'In logrotate, the line rotate ___ keeps 4 old versions.'), options: ['4', 'weekly', 'compress'], answer: '4' },
      { type: 'match', prompt: T('התאימו כל הוראה', 'Match each directive'), pairs: [['weekly', T('סיבוב פעם בשבוע', 'rotate once a week')], ['rotate 4', T('לשמור 4 ישנים', 'keep 4 old ones')], ['compress', T('לדחוס ישנים', 'compress old ones')], ['missingok', T('לא לצעוק אם אין קובץ', 'no error if missing')]] },
      { type: 'choice', prompt: T('מה שם הקובץ הישן של syslog אחרי סיבוב אחד עם compress (כשהשני כבר נדחס)?', 'What is the old syslog called after rotation with compress (once the second is compressed)?'), options: ['syslog.2.gz', 'syslog.old', 'syslog-backup', 'syslog.zip'], answer: 'syslog.2.gz',
        why: { 'syslog.old': T('logrotate מוסיפה מספר, לא old.', 'logrotate adds a number, not old.'), 'syslog-backup': T('לא זו המוסכמה.', 'That is not the convention.'), 'syslog.zip': T('הדחיסה היא gzip.', 'The compression is gzip.') } },
      { type: 'scenario', prompt: T('הריצו את logrotate עכשיו בכוח, על הקובץ הראשי', 'Force logrotate to run now, on the main config'), hint: T('logrotate -f', 'logrotate -f'), accept: svc('logrotate -f /etc/logrotate.conf') },
    ] },
    { title: T('journal שנשמר', 'A persistent journal'), exercises: [
      { type: 'teach', cmd: '/var/log/journal', name: 'persistent journal', text: T('בהרבה מערכות ה־journal נשמר רק בזיכרון ונמחק באתחול. כדי לשמור אותו: ‎Storage=persistent‎ ב־‎/etc/systemd/journald.conf‎ (או פשוט ליצור את ‎/var/log/journal), ואז ‎systemctl restart systemd-journald. ‏‎journalctl -b -1‎ מציגה את האתחול הקודם, ו־‎--disk-usage‎ כמה מקום הוא תופס.', 'On many systems the journal lives only in memory and is lost at reboot. To keep it: Storage=persistent in /etc/systemd/journald.conf (or just create /var/log/journal), then systemctl restart systemd-journald. journalctl -b -1 shows the previous boot, and --disk-usage how much space it takes.') },
      { type: 'output', prompt: ON_SERVER, rec: 'journal-disk', wrongText: ['Journal is volatile', 'No journal files were found.'] },
      { type: 'sentence', prompt: READ, text: T('journalctl -b ___ מציגה את הלוג של האתחול הקודם.', 'journalctl -b ___ shows the log of the previous boot.'), options: ['-1', '0', '+1'], answer: '-1' },
      { type: 'match', prompt: T('התאימו כל דבר', 'Match each item'), pairs: [['Storage=persistent', T('לשמור את ה־journal בדיסק', 'keep the journal on disk')], ['/var/log/journal', T('התיקייה שבה הוא נשמר', 'where it is kept')], ['-b -1', T('האתחול הקודם', 'the previous boot')], ['--vacuum-size', T('לצמצם', 'shrink it')]] },
      { type: 'choice', prompt: T('השרת נפל והתאתחל, ו־‎journalctl -b -1‎ ריקה. מה חסר?', 'The server crashed and rebooted, and journalctl -b -1 is empty. What is missing?'), plain: true,
        options: [T('journal שנשמר בדיסק (persistent)', 'A journal kept on disk (persistent)'), T('rsyslog', 'rsyslog'), T('logrotate', 'logrotate'), T('הרשאות sudo', 'sudo rights')],
        why: [null, T('rsyslog כותב קבצים, אבל השאלה על ה־journal.', 'rsyslog writes files, but this is about the journal.'), T('logrotate לא קשורה.', 'logrotate is unrelated.'), T('בלי הרשאה הייתה הודעה אחרת.', 'Without rights you would see a different message.')] },
      { type: 'scenario', prompt: T('הציגו רק את השגיאות מהאתחול הנוכחי', 'Show only the errors from the current boot'), hint: T('journalctl -b -p err', 'journalctl -b -p err'), accept: ['journalctl -b -p err', 'journalctl -p err -b', 'sudo journalctl -b -p err', 'sudo journalctl -p err -b', 'journalctl -b -p 3', 'journalctl -p 3 -b'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('חוקרים למה השרת נפל אתמול.', 'Investigating why the server went down yesterday.'), exercises: [
    { type: 'scenario', prompt: T('הציגו את הלוג של האתחול הקודם', 'Show the log of the previous boot'), hint: T('journalctl -b -1', 'journalctl -b -1'), accept: ['journalctl -b -1', 'sudo journalctl -b -1'] },
    { type: 'scenario', prompt: T('הציגו את השגיאות של השירות mysql מהשעה האחרונה', 'Show the mysql service\'s errors from the last hour'), hint: T('journalctl -u … -p err --since', 'journalctl -u … -p err --since'), accept: ['journalctl -u mysql -p err --since "1 hour ago"', 'journalctl -u mysql --since "1 hour ago" -p err', 'sudo journalctl -u mysql -p err --since "1 hour ago"', "journalctl -u mysql -p err --since '1 hour ago'"] },
    { type: 'scenario', prompt: T('חפשו "Out of memory" בלוג הכללי של אובונטו', 'Search the general Ubuntu log for "Out of memory"'), hint: T('grep ב־‎/var/log/syslog', 'grep in /var/log/syslog'), accept: ['grep "Out of memory" /var/log/syslog', "grep 'Out of memory' /var/log/syslog", 'sudo grep "Out of memory" /var/log/syslog', 'grep -i "out of memory" /var/log/syslog'] },
  ] },
};

const UNIT_41 = {
  section: 4, unit: 41, exams: ['L101.2', 'L102.2', 'R'], title: T('אתחול', 'Boot'), subtitle: T('UEFI, ‏GRUB, ‏initramfs ושחזור סיסמה', 'UEFI, GRUB, initramfs and password recovery'), color: 'blue', fixture: sysFixture,
  lessons: [
    { title: T('סדר האתחול', 'The boot sequence'), exercises: [
      { type: 'teach', cmd: 'boot', name: 'boot sequence', text: T('הסדר: הקושחה (BIOS או UEFI) בודקת חומרה ומוצאת את מנהל האתחול; ‏GRUB2 מציג תפריט וטוען את הקרנל ואת ה־initramfs; ה־initramfs (מערכת קבצים זמנית בזיכרון) מכינה דרייברים כדי למצוא את /; הקרנל מפעיל את systemd (PID 1); ו־systemd מעלה את ה־default target.', 'The order: firmware (BIOS or UEFI) checks hardware and finds the boot loader; GRUB2 shows a menu and loads the kernel and the initramfs; the initramfs (a temporary filesystem in memory) prepares drivers to find /; the kernel starts systemd (PID 1); and systemd brings up the default target.') },
      { type: 'match', prompt: T('התאימו כל שלב לסדר', 'Match each stage to its order'), pairs: [['1', 'BIOS/UEFI'], ['2', 'GRUB2'], ['3', T('קרנל ו־initramfs', 'kernel and initramfs')], ['4', 'systemd']] },
      { type: 'sentence', prompt: READ, text: T('מנהל האתחול שמציג תפריט ומעלה את הקרנל הוא ___.', 'The boot loader that shows a menu and loads the kernel is ___.'), options: ['GRUB2', 'systemd', 'BIOS'], answer: 'GRUB2' },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הציגו את הקבצים העיקריים ב־‎/boot. מה הודפס?', 'The main files in /boot were listed on a real Ubuntu server. What was printed?'), rec: 'boot-ls', wrongText: ['bzImage\nkernel.efi', 'boot.ini\nntldr'] },
      { type: 'choice', prompt: T('מה תפקיד ה־initramfs?', 'What does the initramfs do?'), plain: true,
        options: [T('מערכת קבצים זמנית בזיכרון עם הדרייברים שצריך כדי למצוא את /', 'A temporary in-memory filesystem with the drivers needed to find /'), T('גיבוי של הקרנל', 'A backup of the kernel'), T('התפריט של GRUB', 'GRUB\'s menu'), T('קובץ הסיסמאות', 'The password file')],
        why: [null, T('זה לא גיבוי.', 'It is not a backup.'), T('התפריט שייך ל־GRUB עצמו.', 'The menu belongs to GRUB itself.'), T('לא קשור לסיסמאות.', 'Nothing to do with passwords.')] },
      { type: 'scenario', prompt: T('הציגו הודעות של הקרנל מתחילת האתחול', 'Show kernel messages from the start of boot'), hint: T('dmesg או journalctl -k', 'dmesg or journalctl -k'), accept: ['dmesg', 'sudo dmesg', 'journalctl -k', 'journalctl -b -k', 'dmesg | less'] },
    ] },
    { title: T('GRUB', 'GRUB'), exercises: [
      { type: 'teach', cmd: 'grub', name: 'GRUB2', text: T('את GRUB מגדירים ב־‎/etc/default/grub: ‏GRUB_TIMEOUT (כמה שניות התפריט), ‏GRUB_DEFAULT (איזו שורה), ‏GRUB_CMDLINE_LINUX (אפשרויות לקרנל). אחרי שינוי מייצרים את הקובץ האמיתי: באובונטו update-grub, וב־Red Hat ‏‎grub2-mkconfig -o /boot/grub2/grub.cfg‎. ב־RHEL יש גם grubby לשינוי מהיר.', 'GRUB is configured in /etc/default/grub: GRUB_TIMEOUT (menu seconds), GRUB_DEFAULT (which entry), GRUB_CMDLINE_LINUX (kernel options). After a change you generate the real file: on Ubuntu update-grub, and on Red Hat grub2-mkconfig -o /boot/grub2/grub.cfg. RHEL also has grubby for quick changes.') },
      { type: 'output', prompt: ON_SERVER, rec: 'boot-grub-default', wrongText: ['GRUB_DEFAULT=saved\nGRUB_TIMEOUT=5', 'timeout=5\ndefault=0'] },
      { type: 'sentence', prompt: READ, text: T('את ההגדרות של GRUB עורכים ב־___.', 'GRUB settings are edited in ___.'), options: ['/etc/default/grub', '/boot/grub/grub.cfg', '/etc/grub.conf'], answer: '/etc/default/grub' },
      { type: 'choice', prompt: T('שיניתם את GRUB_TIMEOUT באובונטו. מה עכשיו?', 'You changed GRUB_TIMEOUT on Ubuntu. Now what?'), options: ['update-grub', 'systemctl restart grub', 'grub-install', 'reboot only'], answer: 'update-grub',
        why: { 'systemctl restart grub': T('GRUB הוא לא שירות.', 'GRUB is not a service.'), 'grub-install': T('זה מתקין את GRUB על דיסק, לא מעדכן הגדרות.', 'That installs GRUB on a disk, it does not update settings.'), 'reboot only': T('בלי update-grub השינוי לא ייכנס.', 'Without update-grub the change does not apply.') } },
      { type: 'match', prompt: T('התאימו כל פקודה להפצה', 'Match each command to its distro'), pairs: [['update-grub', 'Ubuntu'], ['grub2-mkconfig', 'Red Hat'], ['grubby', T('שינוי מהיר ב־RHEL', 'quick changes on RHEL')], ['grub-install', T('התקנה על דיסק', 'install onto a disk')]] },
      { type: 'scenario', prompt: T('ב־Red Hat, צרו מחדש את קובץ ההגדרות של GRUB', 'On Red Hat, regenerate the GRUB config file'), hint: T('grub2-mkconfig -o', 'grub2-mkconfig -o'), accept: svc('grub2-mkconfig -o /boot/grub2/grub.cfg') },
    ] },
    { title: T('אפשרויות לקרנל', 'Kernel options'), exercises: [
      { type: 'teach', cmd: '/proc/cmdline', name: 'kernel command line', text: T('אפשר לתת לקרנל אפשרויות באתחול: ‎root=‎ איפה /, ‏ro, ‏quiet. ב־GRUB לוחצים e, מוסיפים לשורה שמתחילה ב־linux, ו־Ctrl+X מאתחלת פעם אחת. ‏systemd.unit=rescue.target עולה למצב תיקון, ו־rd.break עוצרת בתוך ה־initramfs. ‏‎/proc/cmdline‎ מראה עם מה עלינו.', 'You can pass the kernel options at boot: root= where / is, ro, quiet. In GRUB press e, add to the line starting with linux, and Ctrl+X boots once. systemd.unit=rescue.target boots into repair mode, and rd.break stops inside the initramfs. /proc/cmdline shows what we booted with.') },
      { type: 'output', prompt: ON_SERVER, rec: 'boot-cmdline', wrongText: ['quiet splash', 'BOOT_IMAGE=/vmlinuz-...\nroot=/dev/sda1\nrw'] },
      { type: 'sentence', prompt: READ, text: T('בתפריט של GRUB, המקש ___ פותח את הפקודה לעריכה.', 'In the GRUB menu, the ___ key opens the entry for editing.'), options: ['e', 'c', 'r'], answer: 'e' },
      { type: 'match', prompt: T('התאימו כל אפשרות לקרנל', 'Match each kernel option'), pairs: [['systemd.unit=rescue.target', T('מצב תיקון', 'repair mode')], ['systemd.unit=emergency.target', T('מצב חירום מינימלי', 'minimal emergency mode')], ['rd.break', T('עצירה ב־initramfs', 'stop in the initramfs')], ['ro', T('/ לקריאה בלבד בהתחלה', '/ read-only at first')]] },
      { type: 'choice', prompt: T('אחרי שינוי שגוי ב־fstab השרת לא עולה. מה עושים בתפריט GRUB?', 'After a bad fstab change the server will not boot. What do you do at the GRUB menu?'), plain: true,
        options: [T('e, ולהוסיף systemd.unit=emergency.target, ואז Ctrl+X', 'e, add systemd.unit=emergency.target, then Ctrl+X'), T('להתקין מחדש את המערכת', 'Reinstall the system'), T('למחוק את GRUB', 'Delete GRUB'), T('לחכות', 'Wait')],
        why: [null, T('אין צורך, מספיק לתקן את fstab.', 'No need; fixing fstab is enough.'), T('בלי GRUB אין אתחול בכלל.', 'Without GRUB there is no boot at all.'), T('זה לא יסתדר לבד.', 'It will not fix itself.')] },
      { type: 'scenario', prompt: T('הציגו עם אילו אפשרויות הקרנל עלה', 'Show which options the kernel booted with'), hint: T('cat /proc/cmdline', 'cat /proc/cmdline'), accept: ['cat /proc/cmdline'] },
    ] },
    { title: T('שחזור סיסמת root', 'Resetting the root password'), exercises: [
      { type: 'teach', cmd: 'rd.break', name: 'root password reset', text: T('שכחתם את הסיסמה של root ב־RHEL? בתפריט GRUB: e, מוסיפים rd.break בסוף שורת linux, ‏Ctrl+X. ואז: ‎mount -o remount,rw /sysroot, ‏chroot /sysroot, ‏passwd, ‏touch /.autorelabel‎ (כדי ש־SELinux יתקן תוויות), ‏exit פעמיים. זו משימה קלאסית במבחן RHCSA.', 'Forgot root\'s password on RHEL? At the GRUB menu: e, add rd.break at the end of the linux line, Ctrl+X. Then: mount -o remount,rw /sysroot, chroot /sysroot, passwd, touch /.autorelabel (so SELinux fixes labels), exit twice. This is a classic RHCSA exam task.') },
      { type: 'match', prompt: T('התאימו כל שלב לסדר שלו', 'Match each step to its order'), pairs: [['1', 'rd.break'], ['2', 'mount -o remount,rw /sysroot'], ['3', 'chroot /sysroot'], ['4', 'passwd']] },
      { type: 'sentence', prompt: READ, text: T('אחרי איפוס הסיסמה ב־RHEL יוצרים את הקובץ ___ כדי ש־SELinux יתקן תוויות.', 'After resetting the password on RHEL you create the file ___ so SELinux fixes labels.'), options: ['/.autorelabel', '/etc/selinux', '/.relabel'], answer: '/.autorelabel' },
      { type: 'choice', prompt: T('למה צריך ‎remount,rw‎ אחרי rd.break?', 'Why is remount,rw needed after rd.break?'), plain: true,
        options: [T('המערכת האמיתית ב־‎/sysroot‎ מחוברת לקריאה בלבד, ו־passwd צריכה לכתוב', 'The real system at /sysroot is mounted read-only, and passwd must write'), T('כדי להפעיל רשת', 'To start the network'), T('כדי למחוק את GRUB', 'To delete GRUB'), T('זה לא נחוץ', 'It is not needed')],
        why: [null, T('אין צורך ברשת.', 'No network is needed.'), T('לא נוגעים ב־GRUB.', 'GRUB is not touched.'), T('בלי זה passwd נכשלת.', 'Without it passwd fails.')] },
      { type: 'scenario', prompt: T('אחרי rd.break, חברו מחדש את ‎/sysroot‎ לכתיבה', 'After rd.break, remount /sysroot read-write'), hint: T('mount -o remount,rw', 'mount -o remount,rw'), accept: ['mount -o remount,rw /sysroot', 'mount -o rw,remount /sysroot'] },
      { type: 'scenario', prompt: T('עברו לתוך המערכת האמיתית', 'Switch into the real system'), hint: T('chroot', 'chroot'), accept: ['chroot /sysroot'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('שוכחים סיסמה, לא נבהלים.', 'Forgot the password, no panic.'), exercises: [
    { type: 'scenario', prompt: T('בתפריט GRUB אחרי e: מה מוסיפים בסוף שורת linux כדי לעצור ב־initramfs?', 'In the GRUB menu after e: what do you add at the end of the linux line to stop in the initramfs?'), hint: T('rd.break', 'rd.break'), accept: ['rd.break'] },
    { type: 'scenario', prompt: T('אחרי remount ו־chroot, שנו את הסיסמה של root', 'After remount and chroot, change root\'s password'), hint: T('passwd', 'passwd'), accept: ['passwd', 'passwd root'] },
    { type: 'scenario', prompt: T('ודאו ש־SELinux יתקן את התוויות באתחול הבא', 'Make sure SELinux fixes labels at the next boot'), hint: T('touch /.autorelabel', 'touch /.autorelabel'), accept: ['touch /.autorelabel'] },
  ] },
};

const UNIT_42 = {
  section: 4, unit: 42, exams: ['L101.1', 'R', 'F'], title: T('קרנל וחומרה', 'Kernel and hardware'), subtitle: T('uname, ‏modprobe, ‏lspci, ‏/proc ו־sysctl', 'uname, modprobe, lspci, /proc and sysctl'), color: 'green', fixture: sysFixture,
  lessons: [
    { title: T('uname', 'uname'), exercises: [
      { type: 'teach', cmd: 'uname', name: 'unix name', text: T('הקרנל הוא הלב של לינוקס: הוא מנהל זיכרון, תהליכים וחומרה. ‎uname -r‎ מראה את גרסת הקרנל, ‎uname -m‎ את הארכיטקטורה (x86_64, ‏aarch64), ו־‎uname -a‎ הכול.', 'The kernel is the heart of Linux: it manages memory, processes and hardware. uname -r shows the kernel version, uname -m the architecture (x86_64, aarch64), and uname -a everything.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הריצו ‎uname -r; uname -m; uname -s‎. מה הודפס?', 'uname -r; uname -m; uname -s was run on a real Ubuntu server. What was printed?'), rec: 'kern-uname', wrongText: ['Linux\nx86_64\n7.0.0-1017-azure', 'Ubuntu 24.04\nx86_64\nLinux'] },
      { type: 'sentence', prompt: READ, text: T('uname ___ מדפיסה את גרסת הקרנל.', 'uname ___ prints the kernel version.'), options: ['-r', '-m', '-n'], answer: '-r' },
      { type: 'match', prompt: T('התאימו כל אפשרות של uname', 'Match each uname option'), pairs: [['-r', T('גרסת קרנל', 'kernel version')], ['-m', T('ארכיטקטורה', 'architecture')], ['-n', T('שם המחשב', 'host name')], ['-a', T('הכול', 'everything')]] },
      { type: 'choice', prompt: T('איך יודעים איזו הפצה ובאיזו גרסה מותקנת (לא הקרנל)?', 'How do you tell which distribution and version is installed (not the kernel)?'), options: ['cat /etc/os-release', 'uname -r', 'lsmod', 'cat /proc/version'], answer: 'cat /etc/os-release',
        why: { 'uname -r': T('זו גרסת הקרנל, לא ההפצה.', 'That is the kernel version, not the distro.'), lsmod: T('lsmod מציגה מודולים.', 'lsmod lists modules.'), 'cat /proc/version': T('זה שוב הקרנל.', 'That is the kernel again.') } },
      { type: 'scenario', prompt: T('הציגו את גרסת הקרנל שרץ', 'Show the running kernel version'), hint: T('uname -r', 'uname -r'), accept: ['uname -r', 'uname -a', 'cat /proc/version'] },
    ] },
    { title: T('מודולים', 'Modules'), exercises: [
      { type: 'teach', cmd: 'modprobe', name: 'kernel modules', text: T('דרייברים נטענים לקרנל כמודולים. ‏lsmod מציגה מה טעון, ‏modinfo מתארת מודול, ‏‎modprobe name‎ טוענת (עם התלויות), ו־‎modprobe -r‎ מסירה. כדי לטעון באתחול: קובץ ב־‎/etc/modules-load.d/, וכדי לחסום: ‎blacklist name‎ ב־‎/etc/modprobe.d/.', 'Drivers load into the kernel as modules. lsmod lists what is loaded, modinfo describes a module, modprobe name loads one (with its dependencies), and modprobe -r removes it. To load at boot: a file in /etc/modules-load.d/, and to block one: blacklist name in /etc/modprobe.d/.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי טענו את המודול dummy ובדקו, ואז הסירו וספרו. מה הודפס?', 'On a real Ubuntu server the dummy module was loaded and checked, then removed and counted. What was printed?'), rec: 'kern-modprobe', wrongText: ['dummy\n1', 'modprobe: FATAL: Module dummy not found'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ טוענת מודול יחד עם כל מה שהוא צריך.', 'The ___ command loads a module along with everything it needs.'), options: ['modprobe', 'insmod', 'lsmod'], answer: 'modprobe' },
      { type: 'output', prompt: ON_SERVER, rec: 'kern-modinfo', wrongText: ['filename: /lib/modules/loop.ko\nlicense: Proprietary', 'loop: module not found'] },
      { type: 'match', prompt: T('התאימו כל פקודה', 'Match each command'), pairs: [['lsmod', T('מה טעון', 'what is loaded')], ['modinfo', T('פרטים על מודול', 'module details')], ['modprobe', T('טעינה', 'load')], ['modprobe -r', T('הסרה', 'remove')]] },
      { type: 'scenario', prompt: T('טענו את המודול br_netfilter', 'Load the br_netfilter module'), hint: T('modprobe', 'modprobe'), accept: svc('modprobe br_netfilter') },
    ] },
    { title: T('חומרה ו־‎/sys', 'Hardware and /sys'), exercises: [
      { type: 'teach', cmd: 'lspci', name: 'hardware', text: T('lspci מציגה כרטיסים על לוח האם (רשת, גרפיקה, דיסקים), ו־lsusb התקני USB. ‏lscpu והקובץ ‎/proc/cpuinfo‎ מתארים את המעבד. ‏‎/sys‎ מציגה את החומרה כעץ, ו־udev יוצר את הקבצים ב־‎/dev‎ כשמחברים התקן. ‏dmesg מראה מה הקרנל זיהה.', 'lspci lists cards on the motherboard (network, graphics, disks), and lsusb USB devices. lscpu and /proc/cpuinfo describe the CPU. /sys shows hardware as a tree, and udev creates the files in /dev when a device is plugged in. dmesg shows what the kernel detected.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי בענן הריצו ‎lspci | head -n 3‎ (קוצר ל־60 תווים). מה הודפס?', 'On a real Ubuntu cloud server, lspci | head -n 3 was run (cut to 60 characters). What was printed?'), rec: 'kern-lspci', wrongText: ['Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub', 'Architecture: x86_64'] },
      { type: 'sentence', prompt: READ, text: T('השירות ___ יוצר קבצים ב־‎/dev‎ כשמחברים התקן.', 'The ___ service creates files in /dev when a device is plugged in.'), options: ['udev', 'cron', 'sshd'], answer: 'udev' },
      { type: 'match', prompt: T('התאימו כל פקודה לחומרה', 'Match each command to its hardware'), pairs: [['lspci', T('כרטיסים בלוח האם', 'motherboard cards')], ['lsusb', T('התקני USB', 'USB devices')], ['lscpu', T('המעבד', 'the CPU')], ['lsblk', T('דיסקים', 'disks')]] },
      { type: 'choice', prompt: T('חיברתם דיסק און קי. איך רואים מה הקרנל זיהה?', 'You plugged in a USB stick. How do you see what the kernel detected?'), options: ['dmesg | tail', 'lsmod', 'uname -a', 'cat /etc/fstab'], answer: 'dmesg | tail',
        why: { lsmod: T('lsmod מראה מודולים, לא אירועים.', 'lsmod shows modules, not events.'), 'uname -a': T('uname מראה את הקרנל.', 'uname shows the kernel.'), 'cat /etc/fstab': T('fstab היא הגדרות חיבור, לא מה שזוהה.', 'fstab is mount settings, not detection.') } },
      { type: 'scenario', prompt: T('הציגו את כל התקני ה־USB', 'List all USB devices'), hint: T('lsusb', 'lsusb'), accept: ['lsusb', 'lsusb -t'] },
    ] },
    { title: T('sysctl', 'sysctl'), exercises: [
      { type: 'teach', cmd: 'sysctl', name: 'kernel parameters', text: T('sysctl קוראת ומשנה הגדרות של הקרנל בזמן ריצה (הן גם קבצים תחת ‎/proc/sys). ‎sysctl -w net.ipv4.ip_forward=1‎ משנה עד האתחול. כדי שישרוד: שורה בקובץ ב־‎/etc/sysctl.d/‎ ואז ‎sysctl -p‎ או ‎sysctl --system.', 'sysctl reads and changes kernel settings at runtime (they are also files under /proc/sys). sysctl -w net.ipv4.ip_forward=1 changes it until reboot. To make it last: a line in a file under /etc/sysctl.d/, then sysctl -p or sysctl --system.') },
      { type: 'output', prompt: ON_SERVER, rec: 'kern-sysctl', wrongText: ['net.ipv4.ip_forward = 0\nvm.swappiness = 10', 'ip_forward=1\nswappiness=60'] },
      { type: 'sentence', prompt: READ, text: T('כדי ששינוי של sysctl ישרוד אתחול, כותבים אותו בקובץ תחת ___.', 'To make a sysctl change survive a reboot, write it in a file under ___.'), options: ['/etc/sysctl.d/', '/proc/sys/', '/tmp/'], answer: '/etc/sysctl.d/' },
      { type: 'match', prompt: T('התאימו כל דבר', 'Match each item'), pairs: [['sysctl -w', T('שינוי עד האתחול', 'change until reboot')], ['/etc/sysctl.d/', T('שינוי קבוע', 'a lasting change')], ['sysctl --system', T('לטעון את כל הקבצים', 'load all the files')], ['/proc/sys/', T('ההגדרות כקבצים', 'the settings as files')]] },
      { type: 'choice', prompt: T('המפתח net.ipv4.ip_forward מתאים לאיזה קובץ?', 'The key net.ipv4.ip_forward matches which file?'), options: ['/proc/sys/net/ipv4/ip_forward', '/etc/net/ipv4', '/sys/ip_forward', '/proc/net.ipv4.ip_forward'], answer: '/proc/sys/net/ipv4/ip_forward',
        why: { '/etc/net/ipv4': T('הגדרות קרנל חיות תחת ‎/proc/sys.', 'Kernel settings live under /proc/sys.'), '/sys/ip_forward': T('‎/sys‎ היא לחומרה.', '/sys is for hardware.'), '/proc/net.ipv4.ip_forward': T('הנקודות הופכות ללוכסנים.', 'The dots become slashes.') } },
      { type: 'scenario', prompt: T('הפעילו העברת חבילות (ip_forward) עכשיו', 'Turn on packet forwarding (ip_forward) now'), hint: T('sysctl -w', 'sysctl -w'), accept: svc('sysctl -w net.ipv4.ip_forward=1', ['echo 1 > /proc/sys/net/ipv4/ip_forward']) },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('מכינים שרת להיות נתב.', 'Turning a server into a router.'), exercises: [
    { type: 'scenario', prompt: T('בדקו את הערך הנוכחי של net.ipv4.ip_forward', 'Check the current value of net.ipv4.ip_forward'), hint: T('sysctl', 'sysctl'), accept: ['sysctl net.ipv4.ip_forward', 'cat /proc/sys/net/ipv4/ip_forward'] },
    { type: 'scenario', prompt: T('כתבו את השורה שתשמור את ip_forward על 1 גם אחרי אתחול (לקובץ ב־‎/etc/sysctl.d/)', 'Write the line that keeps ip_forward at 1 after reboot (for a file in /etc/sysctl.d/)'), hint: T('key = value', 'key = value'), accept: ['net.ipv4.ip_forward = 1', 'net.ipv4.ip_forward=1'] },
    { type: 'scenario', prompt: T('טענו את כל קבצי sysctl עכשיו', 'Load all sysctl files now'), hint: T('sysctl --system', 'sysctl --system'), accept: svc('sysctl --system', ['sysctl -p', 'sudo sysctl -p']) },
  ] },
};

const UNIT_43 = {
  section: 4, unit: 43, exams: ['L108.1', 'R', 'F'], title: T('זמן', 'Time'), subtitle: T('date, ‏timedatectl, ‏chrony ו־hwclock', 'date, timedatectl, chrony and hwclock'), color: 'purple', fixture: sysFixture,
  lessons: [
    { title: T('date', 'date'), exercises: [
      { type: 'teach', cmd: 'date', name: 'date', text: T('date מציגה את התאריך והשעה, ו־‎+FORMAT‎ קובע איך: ‎%Y-%m-%d‎ תאריך, ‎%H:%M‎ שעה, ‎%Z‎ אזור זמן. ‎TZ=Asia/Jerusalem date‎ מציגה לפי אזור אחר, ו־‎-d‎ מחשבת תאריך אחר ("tomorrow", ‏"2026-11-01 10:30 UTC").', 'date shows the date and time, and +FORMAT sets how: %Y-%m-%d date, %H:%M time, %Z time zone. TZ=Asia/Jerusalem date shows another zone, and -d computes another date ("tomorrow", "2026-11-01 10:30 UTC").') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הריצו ‎TZ=Asia/Jerusalem date -d \'2026-11-01 10:30:00 UTC\' \'+%Y-%m-%d %H:%M %Z\'‎. מה הודפס?', 'TZ=Asia/Jerusalem date -d \'2026-11-01 10:30:00 UTC\' \'+%Y-%m-%d %H:%M %Z\' was run on a real Ubuntu server. What was printed?'), rec: 'time-date', wrongText: ['2026-11-01 10:30 UTC', '2026-11-01 13:30 IDT'] },
      { type: 'sentence', prompt: READ, text: T('ב־date, הסימן ___ מדפיס את השנה בארבע ספרות.', 'In date, ___ prints the year with four digits.'), options: ['%Y', '%y', '%d'], answer: '%Y' },
      { type: 'match', prompt: T('התאימו כל תבנית של date', 'Match each date format'), pairs: [['%Y', T('שנה', 'year')], ['%m', T('חודש', 'month')], ['%d', T('יום', 'day')], ['%H', T('שעה', 'hour')]] },
      { type: 'choice', prompt: T('למה שרתים בדרך כלל מכוונים ל־UTC?', 'Why are servers usually set to UTC?'), plain: true,
        options: [T('אין שעון קיץ, ולוגים משרתים במדינות שונות מתאימים זה לזה', 'No daylight saving, and logs from servers in different countries line up'), T('זה מהיר יותר', 'It is faster'), T('לינוקס לא תומכת באזורים אחרים', 'Linux does not support other zones'), T('זה חוסך מקום', 'It saves space')],
        why: [null, T('אין הבדל במהירות.', 'No speed difference.'), T('יש מאות אזורי זמן.', 'There are hundreds of time zones.'), T('לא קשור למקום.', 'Not about space.')] },
      { type: 'scenario', prompt: T('הדפיסו את התאריך של היום בצורה 2026-11-01', 'Print today\'s date as 2026-11-01'), hint: T('date +%Y-%m-%d', 'date +%Y-%m-%d'), accept: ['date +%Y-%m-%d', "date '+%Y-%m-%d'", 'date "+%Y-%m-%d"', 'date +%F'] },
    ] },
    { title: T('timedatectl', 'timedatectl'), exercises: [
      { type: 'teach', cmd: 'timedatectl', name: 'time settings', text: T('timedatectl מציגה את השעה, אזור הזמן ואם השעון מסונכרן. ‎set-timezone Asia/Jerusalem‎ מחליפה אזור, ‎list-timezones‎ מציגה את כולם, ו־‎set-ntp true‎ מפעילה סנכרון אוטומטי.', 'timedatectl shows the time, the time zone and whether the clock is synced. set-timezone Asia/Jerusalem changes the zone, list-timezones lists them all, and set-ntp true turns on automatic sync.') },
      { type: 'output', prompt: ON_SERVER, rec: 'time-timedatectl', wrongText: [' Time zone: Asia/Jerusalem (IST, +0200)\nSystem clock synchronized: no\n NTP service: inactive', 'Local time: Sun 2026-11-01'] },
      { type: 'sentence', prompt: READ, text: T('timedatectl ___ מחליפה את אזור הזמן.', 'timedatectl ___ changes the time zone.'), options: ['set-timezone', 'set-time', 'set-ntp'], answer: 'set-timezone' },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי החליפו אזור ל־Asia/Jerusalem ובדקו. מה הודפס?', 'On a real Ubuntu server the zone was changed to Asia/Jerusalem and checked. What was printed?'), rec: 'time-set-tz', wrongText: [' Time zone: Etc/UTC', ' Time zone: Israel'] },
      { type: 'match', prompt: T('התאימו כל פקודה', 'Match each command'), pairs: [['timedatectl', T('מצב השעון', 'the clock\'s state')], ['set-timezone', T('החלפת אזור', 'change the zone')], ['list-timezones', T('כל האזורים', 'all zones')], ['set-ntp true', T('סנכרון אוטומטי', 'automatic sync')]] },
      { type: 'scenario', prompt: T('קבעו את אזור הזמן ל־Europe/London', 'Set the time zone to Europe/London'), hint: T('timedatectl set-timezone', 'timedatectl set-timezone'), accept: svc('timedatectl set-timezone Europe/London') },
    ] },
    { title: T('NTP ו־chrony', 'NTP and chrony'), exercises: [
      { type: 'teach', cmd: 'chrony', name: 'time sync', text: T('NTP מסנכרן את השעון מול שרתי זמן ברשת. ב־RHEL ובשרתים רבים השירות הוא chronyd, עם הגדרות ב־‎/etc/chrony.conf‎ (שורות server או pool). ‎chronyc sources‎ מראה מול מי מסתנכרנים, ו־‎chronyc tracking‎ כמה השעון סוטה. שעון לא מסונכרן שובר התחברות, תעודות ולוגים.', 'NTP syncs the clock with time servers over the network. On RHEL and many servers the service is chronyd, configured in /etc/chrony.conf (server or pool lines). chronyc sources shows who you sync with, and chronyc tracking how far the clock drifts. An unsynced clock breaks logins, certificates and logs.') },
      { type: 'match', prompt: T('התאימו כל דבר', 'Match each item'), pairs: [['chronyd', T('השירות שמסנכרן', 'the syncing service')], ['/etc/chrony.conf', T('ההגדרות', 'its settings')], ['chronyc sources', T('מול אילו שרתים', 'which servers')], ['pool', T('שורה שמוסיפה שרתי זמן', 'a line that adds time servers')]] },
      { type: 'sentence', prompt: READ, text: T('הפקודה chronyc ___ מראה מול אילו שרתים השעון מסתנכרן.', 'chronyc ___ shows which servers the clock syncs with.'), options: ['sources', 'status', 'servers'], answer: 'sources' },
      { type: 'choice', prompt: T('איזו שורה ב־chrony.conf מוסיפה את השרת time.example.com?', 'Which chrony.conf line adds the server time.example.com?'), options: ['server time.example.com iburst', 'ntp=time.example.com', 'sync time.example.com', 'time time.example.com'], answer: 'server time.example.com iburst',
        why: { 'ntp=time.example.com': T('זה לא התחביר של chrony.', 'That is not chrony syntax.'), 'sync time.example.com': T('אין הוראה כזו.', 'There is no such directive.'), 'time time.example.com': T('אין הוראה כזו.', 'There is no such directive.') } },
      { type: 'scenario', prompt: T('הפעילו את chronyd עכשיו ובכל אתחול', 'Start chronyd now and at every boot'), hint: T('systemctl enable --now', 'systemctl enable --now'), accept: svc('systemctl enable --now chronyd', ['systemctl enable --now chrony', 'sudo systemctl enable --now chrony']) },
      { type: 'scenario', prompt: T('בדקו מול אילו שרתים chrony מסתנכרן', 'Check which servers chrony syncs with'), hint: T('chronyc sources', 'chronyc sources'), accept: ['chronyc sources', 'chronyc sources -v'] },
    ] },
    { title: T('hwclock', 'hwclock'), exercises: [
      { type: 'teach', cmd: 'hwclock', name: 'hardware clock', text: T('יש שני שעונים: שעון המערכת (בתוך הקרנל, מה ש־date מראה) ושעון החומרה (RTC, על לוח האם, עובד גם כשהמחשב כבוי). ‏hwclock מציגה את שעון החומרה, ‎hwclock --systohc‎ מעתיקה מהמערכת אליו, ו־‎--hctosys‎ להפך.', 'There are two clocks: the system clock (in the kernel, what date shows) and the hardware clock (RTC, on the motherboard, running even when the machine is off). hwclock shows the hardware clock, hwclock --systohc copies the system time to it, and --hctosys the other way.') },
      { type: 'match', prompt: T('התאימו כל דבר', 'Match each item'), pairs: [['date', T('שעון המערכת', 'the system clock')], ['hwclock', T('שעון החומרה', 'the hardware clock')], ['--systohc', T('מהמערכת לחומרה', 'system to hardware')], ['--hctosys', T('מהחומרה למערכת', 'hardware to system')]] },
      { type: 'sentence', prompt: READ, text: T('השעון שעובד גם כשהמחשב כבוי נקרא שעון ___.', 'The clock that runs even when the machine is off is the ___ clock.'), options: ['hardware', 'system', 'NTP'], answer: 'hardware' },
      { type: 'choice', prompt: T('תיקנתם את השעה, ואחרי אתחול היא שוב שגויה. מה כנראה חסר?', 'You fixed the time, and after a reboot it is wrong again. What is probably missing?'), plain: true,
        options: [T('לשמור לשעון החומרה (hwclock --systohc) או להפעיל NTP', 'Save it to the hardware clock (hwclock --systohc) or turn on NTP'), T('להריץ date פעמיים', 'Run date twice'), T('למחוק את ‎/etc/localtime', 'Delete /etc/localtime'), T('להפעיל מחדש את cron', 'Restart cron')],
        why: [null, T('date רק מציגה.', 'date only shows.'), T('זה ישבור את אזור הזמן.', 'That breaks the time zone.'), T('cron לא קשור.', 'cron is unrelated.')] },
      { type: 'match', prompt: T('התאימו כל קובץ', 'Match each file'), pairs: [['/etc/localtime', T('אזור הזמן של המערכת', 'the system time zone')], ['/usr/share/zoneinfo', T('כל אזורי הזמן', 'all time zones')], ['/etc/chrony.conf', T('הגדרות NTP', 'NTP settings')], ['/etc/timezone', T('שם האזור, בדביאן', 'zone name, on Debian')]] },
      { type: 'scenario', prompt: T('העתיקו את שעון המערכת לשעון החומרה', 'Copy the system clock to the hardware clock'), hint: T('hwclock --systohc', 'hwclock --systohc'), accept: svc('hwclock --systohc', ['hwclock -w', 'sudo hwclock -w']) },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('שעון מדויק לשרת בישראל.', 'An accurate clock for a server in Israel.'), exercises: [
    { type: 'scenario', prompt: T('קבעו את אזור הזמן ל־Asia/Jerusalem', 'Set the time zone to Asia/Jerusalem'), hint: T('timedatectl set-timezone', 'timedatectl set-timezone'), accept: svc('timedatectl set-timezone Asia/Jerusalem') },
    { type: 'scenario', prompt: T('הפעילו סנכרון זמן אוטומטי', 'Turn on automatic time sync'), hint: T('timedatectl set-ntp', 'timedatectl set-ntp'), accept: svc('timedatectl set-ntp true', ['timedatectl set-ntp yes', 'sudo timedatectl set-ntp yes', 'timedatectl set-ntp 1', 'sudo timedatectl set-ntp 1']) },
    { type: 'scenario', prompt: T('ודאו שהשעון מסונכרן', 'Check that the clock is synced'), hint: T('timedatectl', 'timedatectl'), accept: ['timedatectl', 'timedatectl status', 'chronyc tracking'] },
  ] },
};

const UNIT_44 = {
  section: 4, unit: 44, exams: ['R', 'F'], title: T('בריאות וכיוונון', 'Health and tuning'), subtitle: T('uptime, ‏free, ‏vmstat ו־tuned', 'uptime, free, vmstat and tuned'), color: 'blue', fixture: sysFixture,
  lessons: [
    { title: T('עומס', 'Load'), exercises: [
      { type: 'teach', cmd: 'uptime', name: 'load average', text: T('uptime מציגה כמה זמן השרת למעלה, כמה משתמשים מחוברים, ושלושה מספרי עומס: ממוצע של דקה, 5 דקות ו־15 דקות. עומס הוא בערך כמה תהליכים רוצים מעבד. משווים למספר הליבות (nproc): עומס 4 על 4 ליבות זה מלא, על 16 ליבות זה רגוע.', 'uptime shows how long the server has been up, how many users are logged in, and three load numbers: averages over 1, 5 and 15 minutes. Load is roughly how many processes want the CPU. Compare to the core count (nproc): a load of 4 on 4 cores is full, on 16 cores it is calm.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הריצו ‎uptime‎ (השעות והמספרים הוחלפו בתבנית). מה הודפס?', 'uptime was run on a real Ubuntu server (times and numbers replaced by placeholders). What was printed?'), rec: 'health-uptime', wrongText: ['up 3 days, load: 0%', 'load average: x.xx'] },
      { type: 'sentence', prompt: READ, text: T('את העומס משווים למספר ה___ של המעבד.', 'Compare the load with the CPU\'s number of ___.'), options: ['cores', 'disks', 'users'], answer: 'cores' },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי: כמה שדות יש ב־‎/proc/loadavg, וכמה ליבות לפי nproc?', 'On a real Ubuntu server: how many fields are in /proc/loadavg, and how many cores per nproc?'), rec: 'health-loadavg', wrongText: ['3 fields\n4', '5 fields\n1'] },
      { type: 'choice', prompt: T('בשרת עם 8 ליבות, load average הוא ‎7.9, 8.1, 8.0. מה המצב?', 'On an 8-core server the load average is 7.9, 8.1, 8.0. How are things?'), plain: true,
        options: [T('המעבד עמוס לגמרי, כבר רבע שעה', 'The CPU has been fully busy for a quarter of an hour'), T('השרת כמעט ריק', 'The server is almost idle'), T('הזיכרון מלא', 'Memory is full'), T('הדיסק מלא', 'The disk is full')],
        why: [null, T('8 על 8 ליבות זה מלא.', '8 on 8 cores is full.'), T('העומס לא מודד זיכרון.', 'Load does not measure memory.'), T('העומס לא מודד מקום בדיסק.', 'Load does not measure disk space.')] },
      { type: 'scenario', prompt: T('בדקו כמה ליבות יש במעבד', 'Check how many CPU cores there are'), hint: T('nproc', 'nproc'), accept: ['nproc', 'lscpu', 'grep -c processor /proc/cpuinfo'] },
    ] },
    { title: T('זיכרון', 'Memory'), exercises: [
      { type: 'teach', cmd: 'free -h', name: 'memory', text: T('‎free -h‎ מציגה זיכרון ו־swap: total, ‏used, ‏free, ‏buff/cache (זיכרון שהקרנל משתמש בו למטמון ומשחרר כשצריך) ו־available, המספר החשוב: כמה זיכרון באמת פנוי לתוכנות חדשות. ‏‎/proc/meminfo‎ מכיל את כל הפרטים.', 'free -h shows memory and swap: total, used, free, buff/cache (memory the kernel uses for caching and frees when needed) and available, the number that matters: how much memory new programs can really get. /proc/meminfo has every detail.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הריצו ‎free -h | head -n 1‎. מה הודפס?', 'free -h | head -n 1 was run on a real Ubuntu server. What was printed?'), rec: 'health-free', wrongText: ['MemTotal MemFree', 'Mem: 16G 1.4G 10G'] },
      { type: 'sentence', prompt: READ, text: T('בפלט של free, העמודה ___ אומרת כמה זיכרון תוכנות חדשות באמת יכולות לקבל.', 'In free\'s output, the ___ column says how much memory new programs can really get.'), options: ['available', 'free', 'shared'], answer: 'available' },
      { type: 'output', prompt: ON_SERVER, rec: 'health-meminfo', wrongText: ['MemTotal: <number> MB\nMemFree: <number> MB', 'Memory: 16 GB'] },
      { type: 'choice', prompt: T('free מראה free נמוך מאוד אבל available גבוה. יש בעיה?', 'free shows very low free but high available. Is there a problem?'), plain: true,
        options: [T('לא: הקרנל משתמש בזיכרון פנוי למטמון ומשחרר אותו כשצריך', 'No: the kernel uses spare memory for cache and frees it when needed'), T('כן, צריך להוסיף זיכרון מיד', 'Yes, add memory now'), T('כן, יש דליפה', 'Yes, there is a leak'), T('כן, ה־swap מלא', 'Yes, swap is full')],
        why: [null, T('available גבוה אומר שיש מספיק.', 'High available means there is enough.'), T('זו התנהגות רגילה.', 'This is normal behaviour.'), T('הנתונים לא אומרים כלום על swap.', 'The numbers say nothing about swap.')] },
      { type: 'scenario', prompt: T('הציגו את הזיכרון וה־swap ביחידות קריאות', 'Show memory and swap in readable units'), hint: T('free -h', 'free -h'), accept: ['free -h', 'free -m', 'free -g'] },
    ] },
    { title: T('vmstat ואילוצים', 'vmstat and limits'), exercises: [
      { type: 'teach', cmd: 'vmstat', name: 'virtual memory stats', text: T('‎vmstat 1 5‎ מדפיסה שורה בכל שנייה, 5 פעמים: r תהליכים שמחכים למעבד, si/so החלפה ל־swap, us/sy/id/wa שימוש במעבד. wa גבוה אומר שמחכים לדיסק. שירותים יכולים להיות מוגבלים גם בהגדרות systemd, כמו MemoryMax= ו־CPUQuota=.', 'vmstat 1 5 prints a line every second, 5 times: r processes waiting for CPU, si/so swapping, us/sy/id/wa CPU use. A high wa means waiting on disk. Services can also be limited in systemd settings, like MemoryMax= and CPUQuota=.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי הריצו ‎vmstat 1 2 | head -n 2‎. מה הודפס?', 'vmstat 1 2 | head -n 2 was run on a real Ubuntu server. What was printed?'), rec: 'health-vmstat', wrongRec: ['health-free'], wrongText: ['CPU MEM DISK'] },
      { type: 'sentence', prompt: READ, text: T('ב־vmstat, ערך ___ גבוה אומר שהמעבד מחכה לדיסק.', 'In vmstat, a high ___ value means the CPU waits on disk.'), options: ['wa', 'us', 'id'], answer: 'wa' },
      { type: 'match', prompt: T('התאימו כל עמודה של vmstat', 'Match each vmstat column'), pairs: [['r', T('מחכים למעבד', 'waiting for CPU')], ['si/so', T('החלפה ל־swap', 'swapping')], ['us', T('זמן של תוכנות', 'user programs\' time')], ['wa', T('מחכים לדיסק', 'waiting on disk')]] },
      { type: 'match', prompt: T('התאימו כל הגדרה בקובץ שירות', 'Match each service file setting'), pairs: [['MemoryMax=', T('תקרת זיכרון', 'memory cap')], ['CPUQuota=', T('תקרת מעבד', 'CPU cap')], ['LimitNOFILE=', T('כמה קבצים פתוחים', 'how many open files')], ['Nice=', T('עדיפות', 'priority')]] },
      { type: 'scenario', prompt: T('הציגו סטטיסטיקות מערכת כל 2 שניות, 5 פעמים', 'Show system stats every 2 seconds, 5 times'), hint: T('vmstat 2 5', 'vmstat 2 5'), accept: ['vmstat 2 5'] },
    ] },
    { title: T('tuned', 'tuned'), exercises: [
      { type: 'teach', cmd: 'tuned-adm', name: 'tuning profiles', text: T('tuned מכוונן את המערכת לפי פרופיל: throughput-performance לביצועים, virtual-guest למכונה וירטואלית, powersave לחיסכון, balanced לאיזון. ‎tuned-adm list‎ מציגה פרופילים, ‎active‎ את הנוכחי, ‎recommend‎ מה מומלץ, ו־‎profile NAME‎ מחליפה. זה חלק ממבחן RHCSA.', 'tuned tunes the system by profile: throughput-performance for speed, virtual-guest for a VM, powersave to save power, balanced in between. tuned-adm list shows profiles, active the current one, recommend the suggested one, and profile NAME switches. This is part of the RHCSA exam.') },
      { type: 'output', prompt: T('על שרת Ubuntu אמיתי (מכונה וירטואלית) התקינו tuned. מה הודפס מ־list (חלק) ומ־active?', 'On a real Ubuntu server (a VM) tuned was installed. What did list (in part) and active print?'), rec: 'health-tuned', wrongText: ['balanced\nCurrent active profile: balanced', 'No current active profile.'] },
      { type: 'sentence', prompt: READ, text: T('tuned-adm ___ מראה איזה פרופיל מומלץ למחשב הזה.', 'tuned-adm ___ shows which profile suits this machine.'), options: ['recommend', 'list', 'active'], answer: 'recommend' },
      { type: 'match', prompt: T('התאימו כל פרופיל', 'Match each profile'), pairs: [['throughput-performance', T('ביצועים מקסימליים', 'maximum performance')], ['virtual-guest', T('מכונה וירטואלית', 'a virtual machine')], ['powersave', T('חיסכון בחשמל', 'saving power')], ['balanced', T('איזון', 'a balance')]] },
      { type: 'scenario', prompt: T('הציגו איזה פרופיל tuned פעיל עכשיו', 'Show which tuned profile is active now'), hint: T('tuned-adm active', 'tuned-adm active'), accept: ['tuned-adm active'] },
      { type: 'scenario', prompt: T('החליפו לפרופיל throughput-performance', 'Switch to the throughput-performance profile'), hint: T('tuned-adm profile', 'tuned-adm profile'), accept: svc('tuned-adm profile throughput-performance') },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('השרת איטי. למה?', 'The server is slow. Why?'), exercises: [
    { type: 'scenario', prompt: T('בדקו את העומס הממוצע', 'Check the load average'), hint: T('uptime', 'uptime'), accept: ['uptime', 'cat /proc/loadavg', 'w'] },
    { type: 'scenario', prompt: T('בדקו כמה זיכרון באמת פנוי', 'Check how much memory is really available'), hint: T('free -h', 'free -h'), accept: ['free -h', 'free -m', 'free'] },
    { type: 'scenario', prompt: T('הפעילו את הפרופיל של tuned שמומלץ למכונה וירטואלית', 'Turn on the tuned profile recommended for a virtual machine'), hint: T('tuned-adm profile virtual-guest', 'tuned-adm profile virtual-guest'), accept: svc('tuned-adm profile virtual-guest') },
  ] },
};

COURSE.push(UNIT_33, UNIT_34, UNIT_35, UNIT_36, UNIT_37, UNIT_38, UNIT_39, UNIT_40, UNIT_41, UNIT_42, UNIT_43, UNIT_44);
