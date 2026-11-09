// Exam coverage supplements: exercises added to existing lessons so every LPIC-1 v5.0 term is taught,
// and thin RHCSA/LFCS topics get more practice. Outputs come from prototype/recorded/coverage.js.
const CV_REC = T('מה הודפס?', 'What was printed?');
const cvAdd = (unit, lesson, ...exercises) => COURSE.find(u => u.unit === unit).lessons[lesson].exercises.push(...exercises);
const cvSudo = cmd => [cmd, `sudo ${cmd}`];

// 11: regex(7)
cvAdd(11, 1,
  { type: 'teach', cmd: 'man 7 regex', name: 'regex manual', text: T('את כל חוקי הביטויים הרגולריים אפשר לקרוא במדריך עצמו: ‎man 7 regex‎. פרק 7 מתאר מושגים ומוסכמות, לא פקודות, ולכן יש בו גם regex ‏(3) לפונקציות של מתכנתים.', 'You can read every regular-expression rule in the manual itself: man 7 regex. Section 7 describes concepts and conventions, not commands, which is why there is also regex (3) for programmers\' functions.') },
  { type: 'output', prompt: T('על שרת Ubuntu הריצו ‎whatis regex‎. מה הודפס?', 'whatis regex was run on an Ubuntu server. What was printed?'), rec: 'cov-man-regex', wrongText: ['regex (1)            - search with regular expressions', 'grep (1)             - print lines that match patterns'] },
  { type: 'sentence', prompt: READ, text: T('את המדריך על ביטויים רגולריים פותחים עם man ___ regex.', 'You open the manual about regular expressions with man ___ regex.'), options: ['7', '1', '5'], answer: '7' },
);

// 20: bzcat, xzcat, bunzip2, unxz
cvAdd(20, 2,
  { type: 'teach', cmd: 'bzcat xzcat', name: 'read and unpack', text: T('לכל כלי דחיסה יש זוג: מי שפותח ומי שמציג. ‏bunzip2 ו־unxz פותחים קבצי ‎.bz2‎ ו־‎.xz‎ (כמו gunzip), ו־bzcat ו־xzcat מציגים את התוכן בלי לפתוח (כמו zcat).', 'Every compressor comes with a pair: one that unpacks and one that shows. bunzip2 and unxz unpack .bz2 and .xz files (like gunzip), and bzcat and xzcat show the content without unpacking (like zcat).') },
  { type: 'output', prompt: T('ב־notes.txt.bz2 דחוסות השורות line one ו־line two. מה הדפיסה bzcat?', 'notes.txt.bz2 holds the lines line one and line two. What did bzcat print?'), rec: 'cov-bzcat', wrongRec: ['cov-xzcat'], wrongText: ['notes.txt.bz2'] },
  { type: 'sentence', prompt: READ, text: T('הפקודה ___ מציגה קובץ ‎.xz‎ בלי לפתוח אותו.', 'The ___ command shows a .xz file without unpacking it.'), options: ['xzcat', 'unxz', 'zcat'], answer: 'xzcat' },
  { type: 'output', prompt: T('בתיקייה היה רק n.txt.xz (המספרים 1 עד 3). מה הודפס?', 'The folder had only n.txt.xz (the numbers 1 to 3). What was printed?'), rec: 'cov-unxz', wrongText: ['n.txt.xz\n1\n2\n3', 'n.txt\nn.txt.xz'] },
  { type: 'match', prompt: T('התאימו כל פקודה לסוג הקובץ שהיא פותחת', 'Match each command to the file type it unpacks'), pairs: [['gunzip', '.gz'], ['bunzip2', '.bz2'], ['unxz', '.xz'], ['unzip', '.zip']] },
  { type: 'scenario', prompt: T('הציגו את התוכן של report.txt.bz2 בלי לפתוח אותו', 'Show the content of report.txt.bz2 without unpacking it'), hint: T('אחות של cat לקבצי bzip2: שמה נפתח בשתי האותיות הראשונות של bzip2. אחריה שם הקובץ.', 'A sister of cat for bzip2 files: its name opens with the first two letters of bzip2. Then the file name.'), accept: ['bzcat report.txt.bz2', 'bunzip2 -c report.txt.bz2', 'bzip2 -dc report.txt.bz2'] },
);

// 25: /media, /proc/sys
cvAdd(25, 2,
  { type: 'teach', cmd: '/media', name: 'removable media', text: T('‎/media‎ היא המקום שבו המערכת מחברת אוטומטית דיסקים נשלפים, כמו ‎/media/user/USB. ‏‎/mnt‎ שמורה לחיבורים זמניים שהמנהל עושה ביד.', '/media is where the system automatically mounts removable disks, like /media/user/USB. /mnt is kept for temporary mounts the admin makes by hand.') },
  { type: 'choice', prompt: T('חיברתם דיסק און קי למחשב עם ממשק גרפי. איפה הוא כנראה יופיע?', 'You plugged a USB stick into a desktop machine. Where will it most likely appear?'), options: ['/media/user/USB', '/mnt/usb', '/dev/usb', '/home/usb'], answer: '/media/user/USB',
    why: { '/mnt/usb': T('‎/mnt‎ לחיבורים ידניים של המנהל.', '/mnt is for the admin\'s manual mounts.'), '/dev/usb': T('ב־‎/dev‎ נמצא ההתקן, לא הקבצים שלו.', '/dev holds the device, not its files.'), '/home/usb': T('‎/home‎ לתיקיות של משתמשים.', '/home is for users\' folders.') } },
  { type: 'sentence', prompt: READ, text: T('דיסקים נשלפים מתחברים אוטומטית תחת ___.', 'Removable disks are mounted automatically under ___.'), options: ['/media', '/mnt', '/srv'], answer: '/media' },
);
cvAdd(25, 3,
  { type: 'output', prompt: T('על שרת Ubuntu קראו את ‎/proc/sys/vm/swappiness‎ והציגו את כרטיסי הרשת ב־‎/sys/class/net. מה הודפס?', 'On an Ubuntu server /proc/sys/vm/swappiness was read and the network cards in /sys/class/net listed. What was printed?'), rec: 'cov-proc-sys', wrongText: ['vm.swappiness = 60\neth0', '60\nsda'] },
);

// 26: /etc/updatedb.conf
cvAdd(26, 2,
  { type: 'teach', cmd: '/etc/updatedb.conf', name: 'locate settings', text: T('updatedb קוראת את ‎/etc/updatedb.conf‎ כדי לדעת מה לא לסרוק: PRUNEPATHS תיקיות לדלג עליהן, ו־PRUNEFS סוגי מערכות קבצים (כמו NFS). לכן locate לא תמצא קבצים ב־‎/tmp.', 'updatedb reads /etc/updatedb.conf to know what not to scan: PRUNEPATHS folders to skip, and PRUNEFS filesystem types (like NFS). That is why locate finds nothing in /tmp.') },
  { type: 'output', prompt: T('על שרת Ubuntu הציגו את השורות PRUNE ב־‎/etc/updatedb.conf‎ (קוצרו ל־80 תווים). מה הודפס?', 'On an Ubuntu server the PRUNE lines of /etc/updatedb.conf were shown (cut to 80 characters). What was printed?'), rec: 'cov-updatedb-conf', wrongText: ['PRUNEPATHS=""', 'SCAN="/ /home /tmp"'] },
  { type: 'sentence', prompt: READ, text: T('ב־updatedb.conf, השורה ___ אומרת אילו תיקיות לא לסרוק.', 'In updatedb.conf, the ___ line says which folders not to scan.'), options: ['PRUNEPATHS', 'PRUNEFS', 'PATH'], answer: 'PRUNEPATHS' },
);

// 28: xfs_db, xfs_fsr
cvAdd(28, 2,
  { type: 'teach', cmd: 'xfs_db', name: 'XFS tools', text: T('ל־XFS יש כלים משלו: xfs_repair מתקן, ‏xfs_db מציג (ועם ‎-x‎ גם משנה) את המבנה הפנימי, למשל את גודל הבלוק והתווית, ו־xfs_fsr מסדר מחדש קבצים מפוצלים (defragment) כשהמערכת מחוברת. ‏xfs_admin משנה תווית ו־UUID.', 'XFS has its own tools: xfs_repair repairs, xfs_db shows (and with -x changes) the internal structure, like the block size and label, and xfs_fsr rearranges fragmented files (defragments) while mounted. xfs_admin changes the label and UUID.') },
  { type: 'output', prompt: T('על מחיצת XFS עם התווית data הריצו xfs_db לקריאה בלבד. מה הודפס?', 'xfs_db was run read-only on an XFS partition labelled data. What was printed?'), rec: 'cov-xfs-db', wrongText: ['Block size: 4096\nLabel: data', 'xfs_db: cannot open x.img'] },
  { type: 'sentence', prompt: READ, text: T('הכלי ___ מסדר מחדש קבצים מפוצלים ב־XFS.', 'The ___ tool rearranges fragmented files on XFS.'), options: ['xfs_fsr', 'xfs_db', 'xfs_repair'], answer: 'xfs_fsr' },
  { type: 'match', prompt: T('התאימו כל כלי של XFS', 'Match each XFS tool'), pairs: [['xfs_repair', T('מתקן', 'repairs')], ['xfs_db', T('מציג את המבנה הפנימי', 'shows the internals')], ['xfs_fsr', T('מסדר קבצים מפוצלים', 'defragments')], ['xfs_admin', T('משנה תווית ו־UUID', 'changes label and UUID')]] },
);

// 29: tmpfs
cvAdd(29, 3,
  { type: 'teach', cmd: 'tmpfs', name: 'memory filesystem', text: T('tmpfs היא מערכת קבצים שיושבת בזיכרון: מהירה מאוד ונמחקת באתחול. ‎mount -t tmpfs -o size=64M tmpfs /mnt/ram‎, וב־fstab: ‎tmpfs /mnt/ram tmpfs size=64M 0 0. גם ‎/run‎ ו־‎/dev/shm‎ הן tmpfs.', 'tmpfs is a filesystem that lives in memory: very fast and wiped at reboot. mount -t tmpfs -o size=64M tmpfs /mnt/ram, and in fstab: tmpfs /mnt/ram tmpfs size=64M 0 0. /run and /dev/shm are tmpfs too.') },
  { type: 'output', prompt: T('על שרת Ubuntu חיברו tmpfs של 64MB ל־‎/mnt/ram. מה הודפס?', 'On an Ubuntu server a 64 MB tmpfs was mounted at /mnt/ram. What was printed?'), rec: 'cov-tmpfs', wrongRec: ['mnt-mount'], wrongText: ['Filesystem Size Mounted\n/dev/sdb1 64M /mnt/ram\next4'] },
  { type: 'sentence', prompt: READ, text: T('מערכת הקבצים ___ שומרת קבצים בזיכרון ונמחקת באתחול.', 'The ___ filesystem keeps files in memory and is wiped at reboot.'), options: ['tmpfs', 'ext4', 'swap'], answer: 'tmpfs' },
  { type: 'scenario', prompt: T('כתבו שורת fstab שמחברת tmpfs של 256M ל־‎/mnt/cache', 'Write an fstab line mounting a 256M tmpfs at /mnt/cache'), hint: T('tmpfs, לאן, tmpfs, ‏size=256M, ‏0 0', 'tmpfs, where, tmpfs, size=256M, 0 0'), accept: ['tmpfs /mnt/cache tmpfs size=256M 0 0', 'tmpfs /mnt/cache tmpfs defaults,size=256M 0 0'] },
);

// 30: iostat
cvAdd(30, 2,
  { type: 'teach', cmd: 'iostat -x', name: 'disk statistics', text: T('‎iostat -dx 1‎ מציגה לכל דיסק בכל שנייה: r/s ו־w/s קריאות וכתיבות בשנייה, ‏rkB/s כמה נקרא, ‏r_await ו־w_await כמה זמן מחכים לכל פעולה, ו־%util כמה הדיסק עסוק. ‏%util קרוב ל־100 אומר שהדיסק הוא צוואר הבקבוק.', 'iostat -dx 1 shows, for each disk every second: r/s and w/s reads and writes per second, rkB/s how much is read, r_await and w_await how long each operation waits, and %util how busy the disk is. %util near 100 means the disk is the bottleneck.') },
  { type: 'output', prompt: T('על שרת Ubuntu הציגו את שורת הכותרת של ‎iostat -dx‎ (8 עמודות ראשונות). מה הודפס?', 'The header line of iostat -dx was shown on an Ubuntu server (first 8 columns). What was printed?'), rec: 'cov-iostat-hdr', wrongRec: ['health-vmstat'], wrongText: ['Device tps kB_read/s kB_wrtn/s'] },
  { type: 'match', prompt: T('התאימו כל עמודה של iostat -x', 'Match each iostat -x column'), pairs: [['r/s', T('קריאות בשנייה', 'reads per second')], ['w/s', T('כתיבות בשנייה', 'writes per second')], ['r_await', T('זמן המתנה לקריאה', 'read wait time')], ['%util', T('כמה הדיסק עסוק', 'how busy the disk is')]] },
  { type: 'scenario', prompt: T('הציגו סטטיסטיקה מורחבת של הדיסקים כל 2 שניות', 'Show extended disk statistics every 2 seconds'), hint: T('הכלי של סטטיסטיקת קלט ופלט, עם דגל שהוא האות השנייה של extended. בסוף כותבים את מספר השניות.', 'The input and output statistics tool, with a flag that is the second letter of extended. The number of seconds goes at the end.'), accept: ['iostat -dx 2', 'iostat -x 2', 'iostat -xd 2'] },
);

// 32: iSCSI and NBD
cvAdd(32, 3,
  { type: 'teach', cmd: 'iscsiadm', name: 'iSCSI', text: T('iSCSI מגיש דיסק שלם דרך הרשת. השרת נקרא target והלקוח initiator. ב־Linux הלקוח הוא iscsiadm: ‎-m discovery -t sendtargets -p IP‎ מגלה אילו דיסקים השרת מציע, ו־‎-m node --login‎ מתחבר, ואז מופיע דיסק חדש כמו sdb. ‏NBD עושה דבר דומה בצורה פשוטה יותר, עם ‎/dev/nbd0.', 'iSCSI serves a whole disk over the network. The server is the target and the client the initiator. On Linux the client is iscsiadm: -m discovery -t sendtargets -p IP finds which disks the server offers, and -m node --login connects, after which a new disk like sdb appears. NBD does something similar more simply, with /dev/nbd0.') },
  { type: 'output', prompt: T('על שרת Ubuntu ניסו לגלות דיסקי iSCSI בכתובת 127.0.0.1, שבה אין שרת. מה הודפס?', 'On an Ubuntu server an iSCSI discovery was tried at 127.0.0.1, where no server runs. What was printed?'), rec: 'cov-iscsi-discover', wrongText: ['127.0.0.1:3260,1 iqn.2026-11.com.example:disk1', ''] },
  { type: 'sentence', prompt: READ, text: T('ב־iSCSI, השרת שמגיש את הדיסק נקרא ___.', 'In iSCSI, the server that serves the disk is called the ___.'), options: ['target', 'initiator', 'client'], answer: 'target' },
  { type: 'output', prompt: T('על שרת Ubuntu טענו את המודול nbd, ובדקו את ההתקן הראשון ואת הגודל שלו (עוד לא מחובר לשרת). מה הודפס?', 'On an Ubuntu server the nbd module was loaded, then the first device and its size checked (not yet connected to a server). What was printed?'), rec: 'cov-nbd', wrongText: ['/dev/sdb\n0', 'modprobe: FATAL: Module nbd not found'] },
  { type: 'scenario', prompt: T('גלו אילו דיסקי iSCSI מציע השרת 10.0.0.5', 'Discover which iSCSI disks the server 10.0.0.5 offers'), hint: T('הכלי iscsiadm עם שלושה דגלים: מצב גילוי, סוג הגילוי שמבקש את רשימת ה־targets, וכתובת השרת.', 'The iscsiadm tool with three flags: discovery mode, the discovery type that asks for the list of targets, and the server address.'), accept: cvSudo('iscsiadm -m discovery -t sendtargets -p 10.0.0.5').concat(cvSudo('iscsiadm -m discovery -t st -p 10.0.0.5')) },
  { type: 'scenario', prompt: T('התחברו לכל הדיסקים שהתגלו', 'Log in to all the discovered disks'), hint: T('הכלי iscsiadm במצב שעובד על הצמתים שהתגלו, עם הדגל הארוך של כניסה למערכת.', 'The iscsiadm tool in the mode that works on the discovered nodes, with the long flag for logging in.'), accept: cvSudo('iscsiadm -m node --login').concat(cvSudo('iscsiadm -m node -l')) },
);

// 34: groupmod, LDAP with sssd
cvAdd(34, 0,
  { type: 'teach', cmd: 'groupmod', name: 'modify group', text: T('groupmod משנה קבוצה קיימת: ‎-n new old‎ משנה את השם, ו־‎-g 2500‎ את ה־GID. ‏groupadd יוצרת, groupdel מוחקת, ו־gpasswd מוסיפה ומוציאה חברים.', 'groupmod changes an existing group: -n new old renames it, and -g 2500 changes the GID. groupadd creates, groupdel deletes, and gpasswd adds and removes members.') },
  { type: 'output', prompt: T('על שרת Ubuntu שינו את שם הקבוצה tester ל־qa. מה הודפס מ־‎/etc/group‎ (שם ו־GID)?', 'On an Ubuntu server the group tester was renamed qa. What did /etc/group show (name and GID)?'), rec: 'cov-groupmod', wrongRec: ['cov-groupmod-g'], wrongText: ['tester:1003\nqa:1003'] },
  { type: 'sentence', prompt: READ, text: T('groupmod ___ משנה את ה־GID של קבוצה.', 'groupmod ___ changes a group\'s GID.'), options: ['-g', '-n', '-G'], answer: '-g' },
  { type: 'scenario', prompt: T('שנו את השם של הקבוצה devs ל־developers', 'Rename the group devs to developers'), hint: T('הכלי groupmod עם הדגל של שם חדש. שימו לב לסדר: קודם השם החדש ואחריו השם הישן.', 'The groupmod tool with the flag for a new name. Mind the order: the new name first, then the old one.'), accept: cvSudo('groupmod -n developers devs') },
);
cvAdd(34, 3,
  { type: 'teach', cmd: 'sssd', name: 'network accounts', text: T('בארגון, המשתמשים נמצאים בשרת LDAP או Active Directory. ‏sssd מתחבר אליו ומציג את המשתמשים כאילו הם מקומיים. ההגדרות ב־‎/etc/sssd/sssd.conf‎ (הרשאות 600), וב־‎/etc/nsswitch.conf‎ המילה sss בשורות passwd ו־group אומרת לחפש גם שם. ב־RHEL מפעילים עם ‎authselect select sssd. ‏getent passwd מראה משתמשים מכל המקורות.', 'In an organisation, users live on an LDAP or Active Directory server. sssd connects to it and shows those users as if they were local. Settings live in /etc/sssd/sssd.conf (mode 600), and in /etc/nsswitch.conf the word sss in the passwd and group lines says to look there too. On RHEL you turn it on with authselect select sssd. getent passwd shows users from every source.') },
  { type: 'output', prompt: T('על שרת Ubuntu עם sssd מותקן, הציגו את ‎/etc/sssd‎ ואת השורות passwd ו־group ב־nsswitch.conf. מה הודפס?', 'On an Ubuntu server with sssd installed, /etc/sssd and the passwd and group lines of nsswitch.conf were shown. What was printed?'), rec: 'cov-sssd-conf', wrongText: ['sssd.conf\npasswd:         files\ngroup:          files', 'passwd:         ldap\ngroup:          ldap'] },
  { type: 'sentence', prompt: READ, text: T('ב־nsswitch.conf, המילה ___ אומרת לחפש משתמשים גם דרך sssd.', 'In nsswitch.conf, the word ___ says to look up users through sssd too.'), options: ['sss', 'ldap', 'files'], answer: 'sss' },
  { type: 'output', prompt: CV_REC, rec: 'cov-getent-passwd', wrongText: ['ldapdemo', 'getent: ldapdemo: not found'] },
  { type: 'match', prompt: T('התאימו כל דבר', 'Match each item'), pairs: [['sssd', T('מחבר משתמשים מהרשת', 'connects network users')], ['/etc/sssd/sssd.conf', T('ההגדרות שלו', 'its settings')], ['authselect', T('מפעיל אותו ב־RHEL', 'turns it on in RHEL')], ['getent passwd', T('משתמשים מכל המקורות', 'users from every source')]] },
  { type: 'scenario', prompt: T('ב־RHEL, הגדירו שהכניסה למערכת תעבור דרך sssd', 'On RHEL, make logins go through sssd'), hint: T('הכלי authselect, עם הפעולה שבוחרת פרופיל, ואחריה שם הפרופיל שהשאלה מזכירה.', 'The authselect tool, with the action that chooses a profile, then the profile the question mentions.'), accept: cvSudo('authselect select sssd').concat(cvSudo('authselect select sssd --force'), cvSudo('authselect select sssd with-mkhomedir')) },
);

// 39: SysVinit, telinit, runlevel
cvAdd(39, 1,
  { type: 'teach', cmd: 'telinit', name: 'SysVinit', text: T('לפני systemd היה SysVinit: ‏‎/etc/inittab‎ קבע את ה־runlevel, וסקריפטים ב־‎/etc/init.d‎ הפעילו שירותים. ‏runlevel מדפיס את הקודם והנוכחי, ו־‎telinit 3‎ (או ‎init 3‎) עובר ל־runlevel אחר. ב־systemd הפקודות האלה עדיין קיימות ומתורגמות ל־targets.', 'Before systemd there was SysVinit: /etc/inittab set the runlevel, and scripts in /etc/init.d started services. runlevel prints the previous and current one, and telinit 3 (or init 3) switches to another runlevel. Under systemd these commands still exist and are translated to targets.') },
  { type: 'output', prompt: T('על שרת Ubuntu הריצו runlevel ואחריו ‎systemctl get-default‎. מה הודפס?', 'runlevel then systemctl get-default ran on an Ubuntu server. What was printed?'), rec: 'cov-runlevel', wrongText: ['3\nmulti-user.target', 'N 3\ngraphical.target'] },
  { type: 'sentence', prompt: READ, text: T('הפקודה ___ 1 מעבירה את המערכת ל־runlevel 1.', 'The command ___ 1 switches the system to runlevel 1.'), options: ['telinit', 'runlevel', 'inittab'], answer: 'telinit' },
  { type: 'output', prompt: T('על שרת Ubuntu בדקו לאן מצביע ‎/usr/sbin/telinit. מה הודפס?', 'On an Ubuntu server, where /usr/sbin/telinit points was checked. What was printed?'), rec: 'cov-telinit', wrongText: ['/usr/sbin/telinit', '/usr/sbin/telinit -> /etc/inittab'] },
  { type: 'match', prompt: T('התאימו כל מונח של SysVinit למה שהוא', 'Match each SysVinit term'), pairs: [['/etc/inittab', T('קובע את ה־runlevel', 'sets the runlevel')], ['/etc/init.d/', T('סקריפטים של שירותים', 'service scripts')], ['telinit', T('מעבר runlevel', 'switch runlevel')], ['runlevel', T('הקודם והנוכחי', 'previous and current')]] },
);

// 40: rsyslog.conf, systemd-cat
cvAdd(40, 1,
  { type: 'teach', cmd: 'rsyslog.conf', name: 'syslog rules', text: T('rsyslog מחליט איזו הודעה הולכת לאיזה קובץ לפי ‎/etc/rsyslog.conf‎ והקבצים ב־‎/etc/rsyslog.d/. כל כלל הוא facility.priority ואז יעד: ‎auth,authpriv.*‎ לכל הודעות הכניסה, ‎kern.*‎ לקרנל. ‏‎-‎ לפני הקובץ אומר לא לסנכרן לדיסק אחרי כל שורה. ‏systemd-cat שולחת פלט של פקודה ל־journal.', 'rsyslog decides which message goes to which file from /etc/rsyslog.conf and the files in /etc/rsyslog.d/. Each rule is facility.priority then a target: auth,authpriv.* for every login message, kern.* for the kernel. A - before the file means do not sync to disk after every line. systemd-cat sends a command\'s output to the journal.') },
  { type: 'output', prompt: T('על שרת Ubuntu הציגו את הכללים הראשונים ב־‎/etc/rsyslog.d/50-default.conf. מה הודפס?', 'On an Ubuntu server the first rules of /etc/rsyslog.d/50-default.conf were shown. What was printed?'), rec: 'cov-rsyslog-conf', wrongText: ['*.* /var/log/messages', 'authpriv.* /var/log/secure'] },
  { type: 'sentence', prompt: READ, text: T('כלל של rsyslog בנוי מ־facility, נקודה ו־___.', 'An rsyslog rule is a facility, a dot and a ___.'), options: ['priority', 'file', 'user'], answer: 'priority' },
  { type: 'output', prompt: T('על שרת Ubuntu שלחו "nightly sync done" ל־journal עם systemd-cat וקראו אותו לפי התג. מה הודפס?', 'On an Ubuntu server "nightly sync done" was sent to the journal with systemd-cat, then read by its tag. What was printed?'), rec: 'cov-systemd-cat', wrongRec: ['journal-logger'], wrongText: ['sync: nightly sync done'] },
  { type: 'scenario', prompt: T('הריצו את ‎./backup.sh‎ כך שכל הפלט שלו יישמר ב־journal עם התג backup', 'Run ./backup.sh so all its output is saved in the journal with the tag backup'), hint: T('הכלי systemd-cat, עם הדגל שנותן תג. אחר כך התג והסקריפט להרצה.', 'The systemd-cat tool, with the flag that sets a tag. Then the tag and the script to run.'), accept: ['systemd-cat -t backup ./backup.sh', './backup.sh | systemd-cat -t backup', './backup.sh 2>&1 | systemd-cat -t backup'] },
);

// 41: grub-mkconfig, grubby
cvAdd(41, 1,
  { type: 'output', prompt: T('על שרת Ubuntu הציגו את update-grub ואת grub-mkconfig, ואת שתי השורות האחרונות של update-grub. מה הודפס?', 'On an Ubuntu server update-grub and grub-mkconfig were listed, plus the last two lines of update-grub. What was printed?'), rec: 'cov-grub-mkconfig', wrongText: ['update-grub: command not found', '-rwxr-xr-x /usr/sbin/update-grub\nexec grub2-mkconfig -o /boot/grub2/grub.cfg'] },
  { type: 'teach', cmd: 'grubby', name: 'grubby', text: T('ב־Debian ‏update-grub מריצה בסך הכול ‎grub-mkconfig -o /boot/grub/grub.cfg. ב־RHEL השם הוא grub2-mkconfig, ויש גם grubby שמשנה ישר את ההגדרות של כל קרנל: ‎grubby --info=ALL‎ מציגה, ‎--update-kernel=ALL --args="quiet"‎ מוסיפה אפשרות, ו־‎--set-default‎ בוחרת קרנל.', 'On Debian, update-grub just runs grub-mkconfig -o /boot/grub/grub.cfg. On RHEL the name is grub2-mkconfig, and there is also grubby, which edits each kernel\'s settings directly: grubby --info=ALL shows them, --update-kernel=ALL --args="quiet" adds an option, and --set-default picks a kernel.') },
  { type: 'match', prompt: T('התאימו כל פקודה', 'Match each command'), pairs: [['grub-mkconfig', T('בונה את grub.cfg ב־Debian', 'builds grub.cfg on Debian')], ['grub2-mkconfig', T('אותו דבר ב־RHEL', 'the same on RHEL')], ['grubby --info=ALL', T('מציג את הקרנלים', 'lists the kernels')], ['grubby --update-kernel=ALL', T('משנה את כולם', 'changes them all')]] },
  { type: 'scenario', prompt: T('ב־RHEL, הוסיפו לכל הקרנלים את האפשרות console=ttyS0', 'On RHEL, add the option console=ttyS0 to every kernel'), hint: T('הכלי grubby: דגל אחד מעדכן את כל הקרנלים, ודגל שני מקבל את האפשרות להוספה.', 'The grubby tool: one flag updates all the kernels, and a second flag takes the option to add.'), accept: cvSudo('grubby --update-kernel=ALL --args="console=ttyS0"').concat(cvSudo('grubby --update-kernel=ALL --args=console=ttyS0')) },
  { type: 'scenario', prompt: T('ב־RHEL, הציגו את ההגדרות של כל הקרנלים', 'On RHEL, show the settings of every kernel'), hint: T('הכלי grubby, עם הדגל שמציג מידע, ובו הערך שפירושו "כל הקרנלים".', 'The grubby tool, with the flag that shows information, set to the value that means every kernel.'), accept: cvSudo('grubby --info=ALL') },
);

// 43: ntpd, ntpdate, ntp.conf, pool.ntp.org
cvAdd(43, 2,
  { type: 'teach', cmd: 'ntpd', name: 'classic NTP', text: T('לפני chrony השתמשו ב־ntpd, עם הגדרות ב־‎/etc/ntp.conf‎ (שורות server או pool). ‏‎pool.ntp.org‎ הוא מאגר ציבורי של שרתי זמן. ‏ntpdate מכוונת את השעון פעם אחת ומיד, ו־ntpq -p מציגה מול מי ntpd מסתנכרן. היום ntpd נקרא ntpsec בהרבה הפצות.', 'Before chrony there was ntpd, configured in /etc/ntp.conf (server or pool lines). pool.ntp.org is a public pool of time servers. ntpdate sets the clock once, right away, and ntpq -p shows who ntpd syncs with. Today ntpd is called ntpsec on many distros.') },
  { type: 'match', prompt: T('התאימו כל דבר', 'Match each item'), pairs: [['ntpd', T('שירות NTP הקלאסי', 'the classic NTP service')], ['/etc/ntp.conf', T('ההגדרות שלו', 'its settings')], ['ntpdate', T('כיוון חד־פעמי', 'one-time set')], ['pool.ntp.org', T('מאגר שרתים ציבורי', 'a public server pool')]] },
  { type: 'sentence', prompt: READ, text: T('הפקודה ___ מכוונת את השעון פעם אחת מול שרת זמן.', 'The ___ command sets the clock once against a time server.'), options: ['ntpdate', 'ntpd', 'hwclock'], answer: 'ntpdate' },
  { type: 'choice', prompt: T('איזו שורה ב־‎/etc/ntp.conf‎ משתמשת במאגר הציבורי?', 'Which /etc/ntp.conf line uses the public pool?'), options: ['pool pool.ntp.org iburst', 'ntp=pool.ntp.org', 'sync pool.ntp.org', 'server=pool'], answer: 'pool pool.ntp.org iburst',
    why: { 'ntp=pool.ntp.org': T('זה לא התחביר של ntp.conf.', 'That is not ntp.conf syntax.'), 'sync pool.ntp.org': T('אין הוראה כזו.', 'There is no such directive.'), 'server=pool': T('server מקבלת שם שרת, בלי =.', 'server takes a host name, with no =.') } },
  { type: 'scenario', prompt: T('כוונו את השעון מיד מול ‎pool.ntp.org‎ עם הכלי הקלאסי', 'Set the clock right now against pool.ntp.org with the classic tool'), hint: T('הכלי הישן ששמו מחבר את הקיצור של פרוטוקול השעון עם המילה האנגלית ל"תאריך". אחריו שם השרת.', 'The old tool whose name joins the short name of the clock protocol with the English word for a calendar day. Then the server name.'), accept: cvSudo('ntpdate pool.ntp.org') },
);

// 44: service limits and ulimit
cvAdd(44, 2,
  { type: 'teach', cmd: 'MemoryMax=', name: 'service limits', text: T('systemd יכול להגביל שירות: ‎MemoryMax=200M‎ תקרת זיכרון, ‎CPUQuota=50%‎ חצי ליבה. כותבים בקובץ ה־unit, או משנים מיד עם ‎systemctl set-property NAME MemoryMax=100M‎ (וזה גם נשמר). ‏systemctl show -p מציגה את הערך.', 'systemd can limit a service: MemoryMax=200M caps memory, CPUQuota=50% half a core. Write them in the unit file, or change them at once with systemctl set-property NAME MemoryMax=100M (which also persists). systemctl show -p displays the value.') },
  { type: 'output', prompt: T('על שרת Ubuntu שירות הוגדר עם ‎MemoryMax=200M‎ ו־‎CPUQuota=50%. מה הדפיסה ‎systemctl show‎?', 'On an Ubuntu server a service was set with MemoryMax=200M and CPUQuota=50%. What did systemctl show print?'), rec: 'cov-memorymax', wrongRec: ['cov-set-property'], wrongText: ['MemoryMax=200M\nCPUQuota=50%'] },
  { type: 'sentence', prompt: READ, text: T('systemctl ___ משנה מגבלה של שירות מיד וגם שומרת אותה.', 'systemctl ___ changes a service limit at once and saves it.'), options: ['set-property', 'edit', 'show'], answer: 'set-property' },
  { type: 'output', prompt: T('על שרת Ubuntu הריצו ‎ulimit -n‎, הורידו ל־512, ובדקו שוב. מה הודפס?', 'On an Ubuntu server ulimit -n ran, was lowered to 512, then checked again. What was printed?'), rec: 'cov-ulimit', wrongText: ['512\n1024', 'unlimited\n512'] },
  { type: 'teach', cmd: 'limits.conf', name: 'user limits', text: T('גבולות למשתמשים קבועים ב־‎/etc/security/limits.conf‎ (או קובץ ב־limits.d): שורה של domain, ‏type ‏(soft או hard), ‏item (למשל nofile או nproc) ו־value. למשל ‎@students hard nproc 50‎. ‏ulimit -a מציגה את הגבולות של ה־shell.', 'Lasting user limits go in /etc/security/limits.conf (or a file in limits.d): a line of domain, type (soft or hard), item (like nofile or nproc) and value. For example @students hard nproc 50. ulimit -a shows the shell\'s limits.') },
  { type: 'output', prompt: T('על שרת Ubuntu הציגו את שורות התבנית ב־‎/etc/security/limits.conf. מה הודפס?', 'On an Ubuntu server the template lines of /etc/security/limits.conf were shown. What was printed?'), rec: 'cov-limits-conf', wrongText: ['* hard nofile unlimited', 'MemoryMax=infinity'] },
  { type: 'scenario', prompt: T('כתבו שורת limits.conf שמגבילה את הקבוצה students ל־50 תהליכים, כגבול קשיח', 'Write a limits.conf line limiting the students group to 50 processes, as a hard limit'), hint: T('קודם הקבוצה עם שטרודל לפניה, אחר כך סוג הגבול, שם הפריט שסופר תהליכים, והמספר.', 'First the group with an at sign before it, then the kind of limit, the item that counts processes, and the number.'), accept: ['@students hard nproc 50'] },
  { type: 'scenario', prompt: T('הגבילו מיד את השירות nginx ל־512M זיכרון', 'Limit the nginx service to 512M of memory now'), hint: T('ב־systemctl: הפעולה שקובעת תכונה של שירות בזמן ריצה. אחריה nginx, ואז מגבלת הזיכרון בצורת שם, סימן שוויון וערך.', 'In systemctl: the action that sets a property of a service at run time. Then nginx, and then the memory limit as a name, an equals sign and a value.'), accept: cvSudo('systemctl set-property nginx MemoryMax=512M').concat(cvSudo('systemctl set-property nginx.service MemoryMax=512M')) },
);

// 53: ifup and ifdown
cvAdd(53, 1,
  { type: 'teach', cmd: 'ifup', name: 'legacy interfaces', text: T('לפני NetworkManager ו־netplan, ב־Debian כתבו את הגדרות הרשת ב־‎/etc/network/interfaces, והפעילו כרטיס עם ‎ifup eth0‎ וכיבו עם ‎ifdown eth0. ב־RHEL הישן ההגדרות היו ב־‎/etc/sysconfig/network-scripts/ifcfg-eth0. היום מקבילים להם ‎nmcli con up‎ ו־‎nmcli con down.', 'Before NetworkManager and netplan, Debian kept network settings in /etc/network/interfaces, and you brought a card up with ifup eth0 and down with ifdown eth0. Old RHEL kept them in /etc/sysconfig/network-scripts/ifcfg-eth0. Today the equivalents are nmcli con up and nmcli con down.') },
  { type: 'match', prompt: T('התאימו את הישן לחדש', 'Match the old to the new'), pairs: [['ifup eth0', 'nmcli con up eth0'], ['ifdown eth0', 'nmcli con down eth0'], ['/etc/network/interfaces', T('netplan או NetworkManager', 'netplan or NetworkManager')], ['ifconfig', 'ip addr']] },
  { type: 'sentence', prompt: READ, text: T('בשיטה הישנה של Debian, הפקודה ___ eth0 מכבה את הכרטיס.', 'In the old Debian way, the command ___ eth0 brings the card down.'), options: ['ifdown', 'ifup', 'ifconfig'], answer: 'ifdown' },
  { type: 'scenario', prompt: T('על שרת ישן עם ‎/etc/network/interfaces, הפעילו מחדש את eth0 אחרי שינוי: כבו אותו', 'On an old server with /etc/network/interfaces, restart eth0 after a change: first bring it down'), hint: T('הכלי הישן ששמו מחבר את הקיצור של interface עם המילה האנגלית ל"למטה". אחריו שם הממשק.', 'The old tool whose name joins the short form of interface with the English word that is the opposite of up. Then the interface name.'), accept: cvSudo('ifdown eth0') },
);

// 57: key types and host keys
cvAdd(57, 0,
  { type: 'teach', cmd: 'ssh-keygen -t', name: 'key types', text: T('‎-t‎ בוחר את סוג המפתח: ed25519 (המומלץ היום), ‏ecdsa, ‏rsa, ו־dsa הישן שכבר לא נחשב בטוח. כל סוג נשמר בשם משלו: ‎~/.ssh/id_ed25519‎, ‏id_ecdsa, ‏id_rsa, ‏id_dsa, עם ‎.pub‎ לציבורי. גם לשרת יש מפתחות כאלה, ב־‎/etc/ssh/ssh_host_*_key.', '-t picks the key type: ed25519 (recommended today), ecdsa, rsa, and the old dsa that is no longer considered safe. Each type has its own file name: ~/.ssh/id_ed25519, id_ecdsa, id_rsa, id_dsa, with .pub for the public one. The server has such keys too, in /etc/ssh/ssh_host_*_key.') },
  { type: 'output', prompt: T('על שרת Ubuntu יצרו מפתח ecdsa בלי סיסמה. מה הודפס (הקבצים ותחילת המפתח הציבורי)?', 'On an Ubuntu server an ecdsa key was made with no passphrase. What was printed (the files and the start of the public key)?'), rec: 'cov-keygen-ecdsa', wrongRec: ['cov-keygen-ed25519'], wrongText: ['id_rsa\nid_rsa.pub\nssh-rsa'] },
  { type: 'sentence', prompt: READ, text: T('סוג המפתח שמומלץ היום ל־SSH הוא ___.', 'The SSH key type recommended today is ___.'), options: ['ed25519', 'dsa', 'rsa1'], answer: 'ed25519' },
  { type: 'output', prompt: T('על שרת Ubuntu הציגו את מפתחות השרת ב־‎/etc/ssh. מה הודפס?', 'On an Ubuntu server the host keys in /etc/ssh were listed. What was printed?'), rec: 'cov-host-keys', wrongText: ['id_rsa\nid_rsa.pub\nauthorized_keys', 'ssh_host_dsa_key\nssh_host_dsa_key.pub'] },
  { type: 'match', prompt: T('התאימו כל קובץ', 'Match each file'), pairs: [['~/.ssh/id_ed25519', T('המפתח הפרטי שלכם', 'your private key')], ['~/.ssh/id_ed25519.pub', T('הציבורי, לשרתים', 'the public one, for servers')], ['/etc/ssh/ssh_host_ed25519_key', T('המפתח של השרת', 'the server\'s key')], ['~/.ssh/id_dsa', T('מפתח DSA ישן ולא בטוח', 'an old, unsafe DSA key')]] },
);

// 19: the whole checksum family
cvAdd(19, 3,
  { type: 'match', prompt: T('התאימו כל פקודה לאלגוריתם שלה', 'Match each command to its algorithm'), pairs: [['md5sum', 'MD5'], ['sha1sum', 'SHA-1'], ['sha256sum', 'SHA-256'], ['sha512sum', 'SHA-512']] },
  { type: 'choice', prompt: T('איזו פקודה נותנת את טביעת האצבע הארוכה והחזקה ביותר מבין אלה?', 'Which command gives the longest, strongest fingerprint of these?'), options: ['sha512sum', 'sha256sum', 'sha1sum', 'md5sum'], answer: 'sha512sum',
    why: { sha256sum: T('256 ביט, חזקה, אבל קצרה מ־512.', '256 bits, strong, but shorter than 512.'), sha1sum: T('SHA-1 נחשבת שבורה.', 'SHA-1 is considered broken.'), md5sum: T('MD5 שבורה ולא בטוחה.', 'MD5 is broken and unsafe.') } },
);

// 71: xinetd's files
cvAdd(71, 2,
  { type: 'match', prompt: T('התאימו כל קובץ של inetd ו־xinetd', 'Match each inetd and xinetd file'), pairs: [['/etc/inetd.conf', T('ההגדרות של inetd הישן', 'the old inetd\'s settings')], ['/etc/xinetd.conf', T('ההגדרות הכלליות של xinetd', 'xinetd\'s general settings')], ['/etc/xinetd.d/', T('קובץ לכל שירות', 'one file per service')], ['.socket', T('המקבילה ב־systemd', 'the systemd equivalent')]] },
  { type: 'choice', prompt: T('כדי לכבות את telnet ב־xinetd, מה משנים בקובץ ‎/etc/xinetd.d/telnet?', 'To turn off telnet in xinetd, what do you change in /etc/xinetd.d/telnet?'), options: ['disable = yes', 'enable = no', 'telnet = off', 'start = false'], answer: 'disable = yes',
    why: { 'enable = no': T('ל־xinetd אין שדה enable.', 'xinetd has no enable field.'), 'telnet = off': T('זה לא שם של שדה.', 'That is not a field name.'), 'start = false': T('אין שדה כזה.', 'There is no such field.') } },
);
