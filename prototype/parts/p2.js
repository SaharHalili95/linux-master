// Part 2: Text power, units 11-20. See materials/curriculum.md and materials/objectives/.
// textFixture() is the home folder plus data files for sed and awk.
function textFixture() {
  const fx = homeFixture();
  fx.files.push(
    ['/home/user/sales.csv', { content: 'date,item,qty,price\n2026-10-01,coffee,3,12\n2026-10-01,tea,1,9\n2026-10-02,coffee,2,12\n2026-10-02,cake,1,25\n2026-10-03,tea,4,9\n2026-10-03,coffee,1,12\n' }],
    ['/home/user/access.log', { content: '10.0.0.1 GET /index.html 200\n10.0.0.2 GET /about.html 200\n10.0.0.1 GET /missing.html 404\n10.0.0.3 POST /login 302\n10.0.0.2 GET /index.html 200\n10.0.0.1 GET /admin 403\n' }],
    ['/home/user/config.ini', { content: '# server settings\nport = 8080\nhost = localhost\n# debug mode\ndebug = true\n' }],
    ['/home/user/contacts.txt', { content: 'dana: 050-1234567\nomer: 052-7654321\nnoa: none\nyossi: 054-1112223\n' }],
  );
  return fx;
}
const textOut = (cmd, setup = []) => { const sh = new Shell(textFixture()); for (const c of setup) sh.run(c); const r = sh.run(cmd); return r.out + r.err; };
const shows = (log, cmd) => { const want = textOut(cmd).trim(); return !!want && log.some(l => l.out.trim() === want); };

const UNIT_11 = {
  section: 2, unit: 11, exams: ['L103.7', 'R'], title: T('תבניות מורחבות', 'Extended patterns'), subtitle: T('+, ?, {n}, קבוצות, grep -o ו־grep -r', '+, ?, {n}, groups, grep -o and grep -r'), color: 'purple', fixture: textFixture,
  lessons: [
    { title: T('כמה פעמים: + ? {n}', 'How many: + ? {n}'), exercises: [
      { type: 'teach', cmd: '+', name: 'one or more', known: true, text: T('ב־grep -E: הסימן + הוא "פעם אחת או יותר", ? הוא "אפס או פעם אחת", ו־{3} הוא "בדיוק 3 פעמים". ‎[0-9]{3}‎ היא שלוש ספרות ברצף.', 'In grep -E: + is "one or more", ? is "zero or one", and {3} is "exactly 3 times". [0-9]{3} is three digits in a row.'), demo: [[], 'grep -E "[0-9]{3}-[0-9]{7}" contacts.txt'] },
      { type: 'output', prompt: T('ב־contacts.txt יש ארבעה אנשי קשר, ולאחד מהם (noa) אין מספר. מה תדפיס הפקודה?', 'contacts.txt has four contacts, and one of them (noa) has no number. What will this print?'), cmd: 'grep -E "[0-9]{3}-[0-9]+" contacts.txt', wrongCmds: ['cat contacts.txt', 'grep noa contacts.txt'] },
      { type: 'sentence', prompt: READ, text: T('ב־grep -E, התבנית ‎a{2}‎ מוצאת ___ a ברצף.', 'In grep -E, the pattern a{2} finds ___ a\'s in a row.'), options: ['2', '1', '20'], answer: '2' },
      { type: 'choice', prompt: T('איזו תבנית מתאימה גם ל־color וגם ל־colour?', 'Which pattern matches both color and colour?'), options: ['colou?r', 'colou+r', 'colou{2}r', 'col.r'], answer: 'colou?r',
        why: { 'colou+r': T('+ דורש לפחות u אחת, אז color לא מתאימה.', '+ needs at least one u, so color does not match.'), 'colou{2}r': T('זה בדיוק שתי u: colouur.', 'That is exactly two u\'s: colouur.'), 'col.r': T('נקודה היא תו אחד, וחסרה האות o.', 'A dot is one character, and the o is missing.') } },
      { type: 'match', prompt: T('התאימו כל סימן למה שהוא אומר ב־grep -E', 'Match each sign to what it means in grep -E'), pairs: [['+', T('פעם אחת או יותר', 'one or more')], ['?', T('אפס או פעם אחת', 'zero or one')], ['*', T('אפס או יותר', 'zero or more')], ['{3}', T('בדיוק 3', 'exactly 3')]] },
      { type: 'fill', prompt: T('השלימו כדי למצוא ב־access.log שורות עם קוד של 3 ספרות שמתחיל ב־4', 'Fill in to find lines in access.log with a 3-digit code starting with 4'), before: 'grep -E " 4[0-9]', after: '$" access.log', options: ['{2}', '{3}', '+?', '{4}'], answer: '{2}' },
      { type: 'terminal', prompt: T('הציגו מ־contacts.txt רק את אנשי הקשר שיש להם מספר טלפון (ספרות, מקף, ספרות)', 'Show only the contacts in contacts.txt that have a phone number (digits, dash, digits)'), hint: T('grep -E "[0-9]+-[0-9]+" contacts.txt', 'grep -E "[0-9]+-[0-9]+" contacts.txt'), goal: (sh, log) => shows(log, 'grep -E "[0-9]+-[0-9]+" contacts.txt'), solve: ['grep -E "[0-9]+-[0-9]+" contacts.txt'] },
    ] },
    { title: T('קבוצות ו־|', 'Groups and |'), exercises: [
      { type: 'teach', cmd: '( | )', name: 'groups', text: T('סוגריים מקבצים חלק מהתבנית. ‎(GET|POST) /‎ מוצאת GET או POST, ואחריהם רווח ו־/. אפשר לשים + או ? אחרי קבוצה שלמה.', 'Parentheses group part of a pattern. (GET|POST) / finds GET or POST, then a space and /. You can put + or ? after a whole group.'), demo: [[], 'grep -E "(404|403)$" access.log'] },
      { type: 'output', prompt: WHAT, cmd: 'grep -E "^10\\.0\\.0\\.(2|3) " access.log', wrongCmds: ['grep -E "^10\\.0\\.0\\.1 " access.log', 'grep POST access.log'] },
      { type: 'sentence', prompt: READ, text: T('כדי לחפש נקודה אמיתית, ולא "כל תו", כותבים ___.', 'To look for a real dot, not "any character", write ___.'), options: ['\\.', '..', '[.*]'], answer: '\\.' },
      { type: 'choice', prompt: T('מה ההבדל בין ‎grep -E "ab+"‎ לבין ‎grep -E "(ab)+"‎?', 'What is the difference between grep -E "ab+" and grep -E "(ab)+"?'), plain: true,
        options: [T('הראשונה חוזרת על b, השנייה על הצמד ab', 'The first repeats b, the second repeats the pair ab'), T('אין הבדל', 'There is no difference'), T('השנייה מחפשת סוגריים בטקסט', 'The second looks for parentheses in the text'), T('הראשונה לא חוקית', 'The first is not valid')],
        why: [null, T('ab+ מתאימה ל־abbb, ו־(ab)+ ל־ababab.', 'ab+ matches abbb, and (ab)+ matches ababab.'), T('ב־grep -E סוגריים הם קבוצה, לא תווים.', 'In grep -E, parentheses are a group, not characters.'), T('שתיהן חוקיות.', 'Both are valid.')] },
      { type: 'tiles', prompt: T('מצאו ב־access.log את הבקשות שנכשלו: קוד 403 או 404 בסוף השורה', 'Find the failed requests in access.log: code 403 or 404 at the end of the line'), answer: 'grep -E "(403|404)$" access.log', tiles: ['grep', '-E', '"(403|404)$"', 'access.log', '"403|404$"', '-v'] },
      { type: 'output', prompt: WHAT, cmd: 'grep -cE "(coffee|tea)" sales.csv', wrongCmds: ['grep -c coffee sales.csv', 'grep -c tea sales.csv'] },
      { type: 'terminal', prompt: T('הציגו מ־access.log רק את בקשות ה־GET לדפים שנגמרים ב־.html', 'Show only the GET requests in access.log for pages ending in .html'), hint: T('grep -E "GET /[a-z]+\\.html" access.log', 'grep -E "GET /[a-z]+\\.html" access.log'), goal: (sh, log) => shows(log, 'grep -E "GET /[a-z]+\\.html" access.log'), solve: ['grep -E "GET /[a-z]+\\.html" access.log'] },
    ] },
    { title: T('grep -o ו־grep -w', 'grep -o and grep -w'), exercises: [
      { type: 'teach', cmd: 'grep -o', name: 'only matching', text: T('במקום כל השורה, מדפיסה רק את החלק שהתאים לתבנית, כל התאמה בשורה משלה.', 'Instead of the whole line, prints only the part that matched, each match on its own line.'), demo: [[], 'grep -oE "[0-9]{3}-[0-9]{7}" contacts.txt'] },
      { type: 'output', prompt: WHAT, cmd: 'grep -oE "^[0-9.]+" access.log', wrongCmds: ['grep -E "^[0-9.]+" access.log'], wrongText: ['10.0.0.1\n10.0.0.2\n10.0.0.3'] },
      { type: 'sentence', prompt: READ, text: T('grep ___ מדפיסה רק את החלק שהתאים, לא את כל השורה.', 'grep ___ prints only the matching part, not the whole line.'), options: ['-o', '-v', '-w'], answer: '-o' },
      { type: 'teach', cmd: 'grep -w', name: 'word', text: T('מוצאת רק מילה שלמה. grep -w tea לא תמצא את המילה team או steam.', 'Finds only a whole word. grep -w tea will not match team or steam.'), demo: [[], 'grep -w tea sales.csv'] },
      { type: 'choice', prompt: T('בקובץ יש את השורות cat, category ו־my cat. מה ידפיס grep -w cat?', 'A file has the lines cat, category and my cat. What will grep -w cat print?'), plain: true,
        options: [T('את cat ואת my cat', 'cat and my cat'), T('את שלוש השורות', 'All three lines'), T('רק את cat', 'Only cat'), T('רק את category', 'Only category')],
        why: [null, T('ב־category המילה cat היא רק חלק ממילה.', 'In category, cat is only part of a word.'), T('גם ב־my cat יש את המילה השלמה cat.', 'my cat also has the whole word cat.'), T('category לא מתאימה ל־‎-w.', 'category does not match with -w.')] },
      { type: 'fill', prompt: T('השלימו כדי לקבל רק את כתובות ה־IP מ־access.log', 'Fill in to get only the IP addresses from access.log'), before: 'grep ', after: ' "^[0-9.]+" access.log', options: ['-oE', '-vE', '-cE', '-wE'], answer: '-oE' },
      { type: 'terminal', prompt: T('הדפיסו מ־contacts.txt רק את מספרי הטלפון עצמם, בלי השמות', 'Print only the phone numbers from contacts.txt, without the names'), hint: T('grep -oE "[0-9]+-[0-9]+" contacts.txt', 'grep -oE "[0-9]+-[0-9]+" contacts.txt'), goal: (sh, log) => shows(log, 'grep -oE "[0-9]+-[0-9]+" contacts.txt'), solve: ['grep -oE "[0-9]+-[0-9]+" contacts.txt'] },
    ] },
    { title: T('grep -r', 'grep -r'), exercises: [
      { type: 'teach', cmd: 'grep -r', name: 'recursive', text: T('מחפשת בכל הקבצים שבתיקייה ובכל תת־התיקיות, ומדפיסה לפני כל שורה את שם הקובץ. עם ‎-l מקבלים רק את שמות הקבצים.', 'Searches every file in a folder and all its subfolders, and prints the file name before each line. With -l you get only the file names.'), demo: [[], 'grep -r learn docs'] },
      { type: 'output', prompt: T('בתיקייה docs יש todo.txt (עם השורות learn cd ו־learn grep) ו־cv.pdf. מה תדפיס הפקודה?', 'docs has todo.txt (with the lines learn cd and learn grep) and cv.pdf. What will this print?'), cmd: 'grep -r grep docs', wrongText: ['learn grep', 'todo.txt', 'docs/todo.txt'] },
      { type: 'sentence', prompt: READ, text: T('grep ___ מחפשת גם בתוך כל תת־התיקיות.', 'grep ___ also searches inside every subfolder.'), options: ['-r', '-o', '-c'], answer: '-r' },
      { type: 'output', prompt: WHAT, cmd: 'grep -rl learn .', wrongCmds: ['grep -r learn .'], wrongText: ['notes.txt'] },
      { type: 'match', prompt: T('התאימו כל אפשרות של grep למה שהיא עושה', 'Match each grep option to what it does'), pairs: [['-r', T('גם בתת־תיקיות', 'into subfolders too')], ['-l', T('רק שמות קבצים', 'file names only')], ['-o', T('רק החלק שהתאים', 'only the matching part')], ['-w', T('מילה שלמה', 'a whole word')]] },
      { type: 'tiles', prompt: T('מצאו באילו קבצים מתחת ל־projects מופיעה המילה MODE', 'Find which files under projects mention MODE'), answer: 'grep -rl MODE projects', tiles: ['grep', '-rl', 'MODE', 'projects', 'find', '-name'] },
      { type: 'terminal', prompt: T('חפשו את המילה ERROR בכל הקבצים שבתיקייה logs', 'Search for the word ERROR in every file under logs'), hint: T('grep -r ERROR logs', 'grep -r ERROR logs'), goal: (sh, log) => shows(log, 'grep -r ERROR logs'), solve: ['grep -r ERROR logs'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('חוקרים את יומן הגישה של האתר.', 'Investigating the website access log.'), exercises: [
    { type: 'terminal', ask: T('כמה בקשות כאלה יש?', 'How many such requests?'), prompt: T('כמה בקשות ב־access.log הגיעו מ־10.0.0.1? ספרו עם grep -c, ושימו לב שנקודה בתבנית היא "כל תו"', 'How many requests in access.log came from 10.0.0.1? Count with grep -c, and remember a dot in a pattern means "any character"'), hint: T('grep -c "^10\\.0\\.0\\.1 " access.log', 'grep -c "^10\\.0\\.0\\.1 " access.log'), goal: (sh, log) => shows(log, 'grep -c "^10\\.0\\.0\\.1 " access.log'), solve: ['grep -c "^10\\.0\\.0\\.1 " access.log'] },
    { type: 'terminal', prompt: T('הדפיסו רק את הנתיבים (כמו ‎/admin) של הבקשות שקיבלו 403 או 404', 'Print only the paths (like /admin) of the requests that got 403 or 404'), hint: T('grep -E "(403|404)$" access.log | grep -oE "/[a-z.]+"', 'grep -E "(403|404)$" access.log | grep -oE "/[a-z.]+"'), goal: (sh, log) => shows(log, 'grep -E "(403|404)$" access.log | grep -oE "/[a-z.]+"'), solve: ['grep -E "(403|404)$" access.log | grep -oE "/[a-z.]+"'] },
    { type: 'terminal', prompt: T('מצאו את כל הקבצים מתחת לתיקייה הנוכחית שיש בהם את המילה coffee', 'Find every file under the current folder that contains the word coffee'), hint: T('grep -rl coffee .', 'grep -rl coffee .'), goal: (sh, log) => shows(log, 'grep -rl coffee .'), solve: ['grep -rl coffee .'] },
  ] },
};

const UNIT_12 = {
  section: 2, unit: 12, exams: ['L103.2', 'F'], title: T('sed: היסודות', 'sed basics'), subtitle: T('מחליפים, מדפיסים ומוחקים שורות', 'Replacing, printing and deleting lines'), color: 'blue', fixture: textFixture,
  lessons: [
    { title: T('s: החלפה', 's: replace'), exercises: [
      { type: 'teach', cmd: 'sed s', name: 'stream editor', text: T('sed עוברת על הקובץ שורה אחרי שורה ומשנה אותו בדרך. ‎s/old/new/‎ מחליפה את ההופעה הראשונה של old בכל שורה. הקובץ עצמו לא משתנה: התוצאה מודפסת.', 'sed goes through a file line by line and changes it on the way. s/old/new/ replaces the first old on each line. The file itself does not change: the result is printed.'), demo: [[], "sed 's/milk/bread/' notes.txt"] },
      { type: 'output', prompt: WHAT, cmd: "sed 's/call/text/' notes.txt", wrongCmds: ['cat notes.txt', "sed 's/mom/dad/' notes.txt"] },
      { type: 'sentence', prompt: READ, text: T('בפקודה ‎s/old/new/‎, האות s היא קיצור של ___.', 'In s/old/new/, the letter s stands for ___.'), options: ['substitute', 'search', 'save'], answer: 'substitute' },
      { type: 'choice', prompt: T('אחרי ‎sed \'s/milk/bread/\' notes.txt‎, מה כתוב בקובץ notes.txt עצמו?', 'After sed \'s/milk/bread/\' notes.txt, what does notes.txt itself say?'), plain: true,
        options: [T('buy milk, כמו קודם: sed רק הדפיסה את התוצאה', 'buy milk, like before: sed only printed the result'), T('buy bread', 'buy bread'), T('הקובץ נמחק', 'The file was deleted'), T('הקובץ ריק', 'The file is empty')],
        why: [null, T('בלי ‎-i, sed לא נוגעת בקובץ.', 'Without -i, sed does not touch the file.'), T('sed לא מוחקת קבצים.', 'sed does not delete files.'), T('הקובץ לא השתנה בכלל.', 'The file did not change at all.')] },
      { type: 'fill', prompt: T('השלימו כדי להחליף את tea ב־juice ב־sales.csv', 'Fill in to replace tea with juice in sales.csv'), before: "sed '", after: "/tea/juice/' sales.csv", options: ['s', 'd', 'p', 'y'], answer: 's' },
      { type: 'output', prompt: WHAT, cmd: "sed 's/,/ | /' people.csv", wrongCmds: ["sed 's/,/ | /g' people.csv"], wrongText: ['name | city | age'] },
      { type: 'terminal', prompt: T('הדפיסו את config.ini כשבמקום localhost כתוב 127.0.0.1', 'Print config.ini with 127.0.0.1 instead of localhost'), hint: T("sed 's/localhost/127.0.0.1/' config.ini", "sed 's/localhost/127.0.0.1/' config.ini"), goal: (sh, log) => shows(log, "sed 's/localhost/127.0.0.1/' config.ini"), solve: ["sed 's/localhost/127.0.0.1/' config.ini"] },
    ] },
    { title: T('g ומספר', 'g and a number'), exercises: [
      { type: 'teach', cmd: 's///g', name: 'global', text: T('בלי כלום בסוף, s מחליפה רק את ההופעה הראשונה בכל שורה. עם g בסוף היא מחליפה את כולן, ועם מספר, למשל 2, רק את ההופעה השנייה.', 'With nothing at the end, s replaces only the first match on each line. With g at the end it replaces them all, and with a number, like 2, only the second one.'), demo: [[], "sed 's/a/A/g' fruits.txt"] },
      { type: 'output', prompt: WHAT, cmd: "sed 's/,/;/g' people.csv", wrongCmds: ["sed 's/,/;/' people.csv", 'cat people.csv'] },
      { type: 'sentence', prompt: READ, text: T('האות ___ בסוף ‎s/a/b/‎ מחליפה כל הופעה בשורה, לא רק את הראשונה.', 'The letter ___ at the end of s/a/b/ replaces every match on the line, not just the first.'), options: ['g', 'p', 'd'], answer: 'g' },
      { type: 'output', prompt: WHAT, cmd: "sed 's/,/ /2' people.csv", wrongCmds: ["sed 's/,/ /' people.csv", "sed 's/,/ /g' people.csv"] },
      { type: 'match', prompt: T('התאימו כל פקודה למה שהיא מחליפה בכל שורה', 'Match each command to what it replaces on each line'), pairs: [['s/a/b/', T('את ההופעה הראשונה', 'the first match')], ['s/a/b/g', T('את כל ההופעות', 'every match')], ['s/a/b/2', T('את ההופעה השנייה', 'the second match')], ['s/a//g', T('מוחקת את כל ה־a', 'deletes every a')]] },
      { type: 'choice', prompt: T('מה ידפיס ‎echo banana | sed \'s/a//g\'‎?', 'What will echo banana | sed \'s/a//g\' print?'), options: ['bnn', 'bnana', 'banana', 'aaa'], answer: 'bnn',
        why: { bnana: T('זה בלי g: רק ה־a הראשונה.', 'That is without g: only the first a.'), banana: T('s עם החלפה ריקה מוחקת את מה שמצאה.', 's with an empty replacement deletes what it found.'), aaa: T('sed מחקה את ה־a, לא השאירה רק אותן.', 'sed deleted the a\'s, it did not keep only them.') } },
      { type: 'terminal', prompt: T('הדפיסו את sales.csv כשבמקום כל פסיק בשורה יש רווח', 'Print sales.csv with every comma on each line replaced by a space'), hint: T("sed 's/,/ /g' sales.csv", "sed 's/,/ /g' sales.csv"), goal: (sh, log) => shows(log, "sed 's/,/ /g' sales.csv"), solve: ["sed 's/,/ /g' sales.csv"] },
    ] },
    { title: T('‎-n ו־p', '-n and p'), exercises: [
      { type: 'teach', cmd: 'sed -n p', name: 'print', text: T('‎-n אומרת ל־sed לא להדפיס כלום מעצמה, ו־p מדפיסה. ביחד: ‎sed -n \'2,4p\'‎ מדפיסה רק את שורות 2 עד 4, ו־‎\'$p\'‎ רק את האחרונה.', '-n tells sed not to print anything on its own, and p prints. Together: sed -n \'2,4p\' prints only lines 2 to 4, and \'$p\' only the last one.'), demo: [[], "sed -n '2,3p' fruits.txt"] },
      { type: 'output', prompt: WHAT, cmd: "sed -n '2p' notes.txt", wrongCmds: ["sed -n '1p' notes.txt", "sed '2p' notes.txt"] },
      { type: 'sentence', prompt: READ, text: T('בלי ___, הפקודה ‎sed \'2p\'‎ מדפיסה את שורה 2 פעמיים.', 'Without ___, the command sed \'2p\' prints line 2 twice.'), options: ['-n', '-i', '-e'], answer: '-n' },
      { type: 'output', prompt: WHAT, cmd: "sed -n '/coffee/p' sales.csv", wrongCmds: ["sed -n '/tea/p' sales.csv", "sed '/coffee/d' sales.csv"] },
      { type: 'choice', prompt: T('איזו פקודה מדפיסה רק את השורה האחרונה של notes.txt?', 'Which command prints only the last line of notes.txt?'), options: ["sed -n '$p' notes.txt", "sed '$p' notes.txt", "sed -n '1p' notes.txt", "sed '$d' notes.txt"], answer: "sed -n '$p' notes.txt",
        why: { "sed '$p' notes.txt": T('בלי ‎-n מקבלים את כל הקובץ, והשורה האחרונה פעמיים.', 'Without -n you get the whole file, with the last line twice.'), "sed -n '1p' notes.txt": T('זו השורה הראשונה.', 'That is the first line.'), "sed '$d' notes.txt": T('זה מוחק את האחרונה ומדפיס את השאר.', 'That deletes the last line and prints the rest.') } },
      { type: 'fill', prompt: T('השלימו כדי להדפיס רק את שורות 2 עד 4 של sales.csv', 'Fill in to print only lines 2 to 4 of sales.csv'), before: "sed -n '", after: "p' sales.csv", options: ['2,4', '2-4', '2..4', '2;4'], answer: '2,4' },
      { type: 'terminal', prompt: T('הדפיסו רק את שורות 3 עד 5 של logs/app.log', 'Print only lines 3 to 5 of logs/app.log'), hint: T("sed -n '3,5p' logs/app.log", "sed -n '3,5p' logs/app.log"), goal: (sh, log) => shows(log, "sed -n '3,5p' logs/app.log"), solve: ["sed -n '3,5p' logs/app.log"] },
    ] },
    { title: T('d: מחיקת שורות', 'd: deleting lines'), exercises: [
      { type: 'teach', cmd: 'sed d', name: 'delete', text: T('d מוחקת שורות מהפלט. ‎\'1d\'‎ מוחקת את השורה הראשונה, ו־‎\'/^#/d\'‎ מוחקת כל שורה שמתחילה ב־#, כמו הערות.', 'd deletes lines from the output. \'1d\' deletes the first line, and \'/^#/d\' deletes every line starting with #, like comments.'), demo: [[], "sed '/^#/d' config.ini"] },
      { type: 'output', prompt: WHAT, cmd: "sed '1d' people.csv", wrongCmds: ["sed -n '1p' people.csv", 'cat people.csv'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ‎sed \'/^#/___\'‎ מסירה את כל שורות ההערה.', 'The command sed \'/^#/___\' removes every comment line.'), options: ['d', 'p', 's'], answer: 'd' },
      { type: 'output', prompt: WHAT, cmd: "sed '/tea/d' sales.csv", wrongCmds: ["sed -n '/tea/p' sales.csv", "sed '/coffee/d' sales.csv"] },
      { type: 'choice', prompt: T('איך מורידים את שורת הכותרת מ־sales.csv?', 'How do you drop the header line from sales.csv?'), options: ["sed '1d' sales.csv", "sed 'd1' sales.csv", "sed -n '1p' sales.csv", "sed '$d' sales.csv"], answer: "sed '1d' sales.csv",
        why: { "sed 'd1' sales.csv": T('הכתובת באה לפני הפקודה: קודם 1, אחר כך d.', 'The address comes before the command: 1 first, then d.'), "sed -n '1p' sales.csv": T('זה מדפיס רק את הכותרת.', 'That prints only the header.'), "sed '$d' sales.csv": T('$ היא השורה האחרונה.', '$ is the last line.') } },
      { type: 'tiles', prompt: T('הציגו את config.ini בלי שורות ההערה', 'Show config.ini without its comment lines'), answer: "sed '/^#/d' config.ini", tiles: ['sed', "'/^#/d'", 'config.ini', "'/#/p'", 'grep'] },
      { type: 'terminal', prompt: T('הציגו את logs/app.log בלי שורות ה־INFO', 'Show logs/app.log without the INFO lines'), hint: T("sed '/INFO/d' logs/app.log", "sed '/INFO/d' logs/app.log"), goal: (sh, log) => shows(log, "sed '/INFO/d' logs/app.log"), solve: ["sed '/INFO/d' logs/app.log"] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('מנקים קובץ הגדרות עם sed.', 'Cleaning up a config file with sed.'), exercises: [
    { type: 'terminal', prompt: T('הציגו את config.ini בלי הערות', 'Show config.ini without comments'), hint: T("sed '/^#/d' config.ini", "sed '/^#/d' config.ini"), goal: (sh, log) => shows(log, "sed '/^#/d' config.ini"), solve: ["sed '/^#/d' config.ini"] },
    { type: 'terminal', prompt: T('הציגו את config.ini כש־debug = true הופך ל־debug = false', 'Show config.ini with debug = true turned into debug = false'), hint: T("sed 's/debug = true/debug = false/' config.ini", "sed 's/debug = true/debug = false/' config.ini"), goal: (sh, log) => shows(log, "sed 's/debug = true/debug = false/' config.ini"), solve: ["sed 's/debug = true/debug = false/' config.ini"] },
    { type: 'terminal', prompt: T('הדפיסו רק את השורה של port מ־config.ini, עם sed', 'Print only the port line from config.ini, with sed'), hint: T("sed -n '/^port/p' config.ini", "sed -n '/^port/p' config.ini"), goal: (sh, log) => shows(log, "sed -n '/^port/p' config.ini") && log.some(l => /^sed\b/.test(l.cmd)), solve: ["sed -n '/^port/p' config.ini"] },
  ] },
};

const UNIT_13 = {
  section: 2, unit: 13, exams: ['L103.2', 'F'], title: T('sed בשטח', 'sed in practice'), subtitle: T('עריכה בתוך הקובץ, טווחים וקבוצות', 'Editing in place, ranges and groups'), color: 'green', fixture: textFixture,
  lessons: [
    { title: T('‎-i: לשנות את הקובץ', '-i: change the file'), exercises: [
      { type: 'teach', cmd: 'sed -i', name: 'in place', text: T('עם ‎-i, sed כותבת את התוצאה לתוך הקובץ במקום להדפיס אותה. ‎-i.bak‎ שומרת קודם עותק של המקור בשם עם ‎.bak.', 'With -i, sed writes the result into the file instead of printing it. -i.bak first saves a copy of the original with .bak added.'), demo: [["sed -i 's/milk/bread/' notes.txt"], 'cat notes.txt'] },
      { type: 'output', prompt: T('מה תדפיס cat notes.txt אחרי הפקודה?', 'What will cat notes.txt print after this command?'), setup: ["sed -i 's/mom/dad/' notes.txt"], cmd: 'cat notes.txt', wrongCmds: ['cat readme.txt'], wrongText: ['buy milk\ncall mom\nlearn grep', ''] },
      { type: 'sentence', prompt: READ, text: T('עם ‎sed ___‎ השינוי נכתב לתוך הקובץ עצמו.', 'With sed ___ the change is written into the file itself.'), options: ['-i', '-n', '-e'], answer: '-i' },
      { type: 'output', prompt: T('מה תדפיס ls אחרי הפקודה?', 'What will ls print after this command?'), setup: ["sed -i.bak '1d' fruits.txt"], cmd: 'ls', wrongCmds: ['ls docs'], wrongText: ['fruits.txt.bak'] },
      { type: 'choice', prompt: T('למה כדאי ‎-i.bak‎ ולא רק ‎-i‎?', 'Why use -i.bak rather than just -i?'), plain: true,
        options: [T('אם ה־sed שגויה, נשאר עותק של הקובץ המקורי', 'If the sed is wrong, a copy of the original is left'), T('זה מהיר יותר', 'It is faster'), T('בלי זה sed לא תשנה את הקובץ', 'Without it sed will not change the file'), T('זה מוחק את הקובץ הישן', 'It deletes the old file')],
        why: [null, T('זה אפילו כותב קובץ נוסף.', 'It even writes one more file.'), T('גם ‎-i לבד משנה את הקובץ.', '-i alone changes the file too.'), T('ההפך: הוא שומר אותו.', 'The opposite: it keeps it.')] },
      { type: 'fill', prompt: T('השלימו כדי לשנות את port ל־9090 בתוך config.ini ולשמור גיבוי', 'Fill in to change port to 9090 inside config.ini and keep a backup'), before: 'sed ', after: " 's/8080/9090/' config.ini", options: ['-i.bak', '-n', '-bak', '-e.bak'], answer: '-i.bak' },
      { type: 'terminal', prompt: T('שנו בתוך config.ini את 8080 ל־9090', 'Change 8080 to 9090 inside config.ini'), hint: T("sed -i 's/8080/9090/' config.ini", "sed -i 's/8080/9090/' config.ini"), goal: sh => sh.files.get('/home/user/config.ini')?.content.includes('port = 9090\n'), solve: ["sed -i 's/8080/9090/' config.ini"] },
    ] },
    { title: T('טווחים', 'Ranges'), exercises: [
      { type: 'teach', cmd: '1,3', name: 'ranges', text: T('לפני הפקודה אפשר לכתוב טווח: ‎2,4‎ שורות 2 עד 4, ‎3,$‎ משורה 3 עד הסוף, ו־‎/start/,/end/‎ מהשורה שיש בה start עד השורה שיש בה end. ‎!‎ הופך: ‎1!d‎ מוחקת הכול חוץ משורה 1.', 'Before the command you can write a range: 2,4 lines 2 to 4, 3,$ from line 3 to the end, and /start/,/end/ from the line with start to the line with end. ! flips it: 1!d deletes everything but line 1.'), demo: [[], "sed -n '/08:10/,/08:20/p' logs/app.log"] },
      { type: 'output', prompt: WHAT, cmd: "sed '2,$d' notes.txt", wrongCmds: ["sed '2d' notes.txt", "sed '1d' notes.txt"] },
      { type: 'sentence', prompt: READ, text: T('בכתובת של sed, הסימן ___ הוא השורה האחרונה.', 'In a sed address, the ___ sign is the last line.'), options: ['$', '^', '*'], answer: '$' },
      { type: 'output', prompt: WHAT, cmd: "sed -n '/cake/,/coffee/p' sales.csv", wrongCmds: ["sed -n '/cake/p' sales.csv", "sed -n '/coffee/p' sales.csv"] },
      { type: 'match', prompt: T('התאימו כל כתובת לשורות שהיא בוחרת', 'Match each address to the lines it picks'), pairs: [['3', T('שורה 3', 'line 3')], ['3,$', T('משורה 3 עד הסוף', 'line 3 to the end')], ['/x/', T('כל שורה עם x', 'every line with x')], ['1!', T('הכול חוץ משורה 1', 'all but line 1')]] },
      { type: 'choice', prompt: T('איזו פקודה מוחקת את כל השורות של 08:10 עד 08:20 מהלוג (כולל)?', 'Which command deletes every log line from 08:10 to 08:20 (inclusive)?'), options: ["sed '/08:10/,/08:20/d' logs/app.log", "sed '/08:10/d;/08:20/d' logs/app.log", "sed -n '/08:10/,/08:20/p' logs/app.log", "sed '08:10,08:20d' logs/app.log"], answer: "sed '/08:10/,/08:20/d' logs/app.log",
        why: { "sed '/08:10/d;/08:20/d' logs/app.log": T('זה מוחק רק את שתי השורות האלה, לא את מה שביניהן.', 'That deletes only those two lines, not the ones between.'), "sed -n '/08:10/,/08:20/p' logs/app.log": T('זה מדפיס את הטווח במקום למחוק אותו.', 'That prints the range instead of deleting it.'), "sed '08:10,08:20d' logs/app.log": T('טקסט בכתובת צריך להיות בין לוכסנים.', 'Text in an address must be between slashes.') } },
      { type: 'terminal', prompt: T('הדפיסו את sales.csv מהשורה הראשונה של 2026-10-02 ועד הסוף', 'Print sales.csv from the first 2026-10-02 line to the end'), hint: T("sed -n '/2026-10-02/,$p' sales.csv", "sed -n '/2026-10-02/,$p' sales.csv"), goal: (sh, log) => shows(log, "sed -n '/2026-10-02/,$p' sales.csv"), solve: ["sed -n '/2026-10-02/,$p' sales.csv"] },
    ] },
    { title: T('כמה פעולות', 'Several edits'), exercises: [
      { type: 'teach', cmd: 'sed -e', name: 'expressions', text: T('אפשר לתת ל־sed כמה פקודות: עם ; ביניהן, או עם ‎-e‎ לפני כל אחת. הן רצות לפי הסדר על כל שורה.', 'You can give sed several commands: with ; between them, or with -e before each one. They run in order on every line.'), demo: [[], "sed -e '/^#/d' -e 's/ = /=/' config.ini"] },
      { type: 'output', prompt: WHAT, cmd: "sed 's/tea/TEA/;s/cake/CAKE/' sales.csv", wrongCmds: ["sed 's/tea/TEA/' sales.csv", "sed 's/cake/CAKE/' sales.csv"] },
      { type: 'sentence', prompt: READ, text: T('לפני כל פקודה נוספת ל־sed אפשר לכתוב ___.', 'Before each extra sed command you can write ___.'), options: ['-e', '-n', '-i'], answer: '-e' },
      { type: 'choice', prompt: T('מה ההבדל בין ‎sed \'1d;s/a/b/\'‎ לבין ‎sed -e \'1d\' -e \'s/a/b/\'‎?', 'What is the difference between sed \'1d;s/a/b/\' and sed -e \'1d\' -e \'s/a/b/\'?'), plain: true,
        options: [T('אין הבדל, אלה שתי דרכים לכתוב אותו דבר', 'None, they are two ways to write the same thing'), T('הראשונה מריצה רק את 1d', 'The first runs only 1d'), T('השנייה משנה את הקובץ', 'The second changes the file'), T('הסדר הפוך', 'The order is reversed')],
        why: [null, T('; מפרידה בין פקודות, ושתיהן רצות.', '; separates commands, and both run.'), T('רק ‎-i‎ משנה את הקובץ.', 'Only -i changes the file.'), T('בשתיהן 1d רצה קודם.', 'In both, 1d runs first.')] },
      { type: 'output', prompt: WHAT, cmd: "sed -e '1d' -e 's/,/ /g' people.csv", wrongCmds: ["sed 's/,/ /g' people.csv", "sed '1d' people.csv"] },
      { type: 'fill', prompt: T('השלימו כדי למחוק הערות וגם להחליף true ב־yes', 'Fill in to delete comments and also replace true with yes'), before: "sed '/^#/d", after: "s/true/yes/' config.ini", options: [';', ',', '|', '&'], answer: ';' },
      { type: 'terminal', prompt: T('הציגו את people.csv בלי שורת הכותרת, ועם רווח במקום כל פסיק', 'Show people.csv without its header line, with a space instead of every comma'), hint: T("sed -e '1d' -e 's/,/ /g' people.csv", "sed -e '1d' -e 's/,/ /g' people.csv"), goal: (sh, log) => shows(log, "sed -e '1d' -e 's/,/ /g' people.csv"), solve: ["sed -e '1d' -e 's/,/ /g' people.csv"] },
    ] },
    { title: T('קבוצות ו־&', 'Groups and &'), exercises: [
      { type: 'teach', cmd: '\\1 &', name: 'back references', text: T('בהחלפה, & הוא כל מה שנמצא. עם ‎-E‎, כל זוג סוגריים נשמר: ‎\\1‎ הוא מה שנמצא בסוגריים הראשונים, ‎\\2‎ בשניים. ככה מחליפים סדר של עמודות.', 'In the replacement, & is everything that matched. With -E, each pair of parentheses is saved: \\1 is what the first pair matched, \\2 the second. That is how you swap columns.'), demo: [[], "sed -E 's/([a-z]+),([a-z-]+),.*/\\2: \\1/' people.csv"] },
      { type: 'output', prompt: WHAT, cmd: "sed 's/[0-9]\\+/<&>/' people.csv", wrongCmds: ["sed 's/[0-9]\\+/<>/' people.csv"], wrongText: ['name,city,age\ndana,haifa,<&>\nomer,tel-aviv,<&>\nnoa,haifa,<&>\nyossi,eilat,<&>'] },
      { type: 'sentence', prompt: READ, text: T('בהחלפה של sed, הסימן ___ הוא כל הטקסט שנמצא.', 'In a sed replacement, the ___ sign is all the text that matched.'), options: ['&', '$', '%'], answer: '&' },
      { type: 'output', prompt: WHAT, cmd: "sed -E 's/([a-z]+): (.*)/\\2 (\\1)/' contacts.txt", wrongCmds: ["sed -E 's/([a-z]+): (.*)/\\1 (\\2)/' contacts.txt", 'cat contacts.txt'] },
      { type: 'choice', prompt: T('בשורה dana,haifa,31, מה זה ‎\\1‎ אחרי ‎s/([a-z]+),([a-z]+)/…/‎ עם ‎-E‎?', 'On the line dana,haifa,31, what is \\1 after s/([a-z]+),([a-z]+)/…/ with -E?'), options: ['dana', 'haifa', '31', 'dana,haifa'], answer: 'dana',
        why: { haifa: T('זה ‎\\2: הסוגריים השניים.', 'That is \\2: the second pair.'), 31: T('הספרות לא בתוך אף זוג סוגריים.', 'The digits are not inside any pair.'), 'dana,haifa': T('זה כל מה שנמצא, כלומר &.', 'That is everything that matched, which is &.') } },
      { type: 'terminal', prompt: T('הדפיסו מ־contacts.txt שורות בצורה ‎050-1234567 dana‎: קודם המספר, אחר כך השם', 'Print contacts.txt lines as 050-1234567 dana: the number first, then the name'), hint: T("sed -E 's/([a-z]+): (.*)/\\2 \\1/' contacts.txt", "sed -E 's/([a-z]+): (.*)/\\2 \\1/' contacts.txt"), goal: (sh, log) => shows(log, "sed -E 's/([a-z]+): (.*)/\\2 \\1/' contacts.txt"), solve: ["sed -E 's/([a-z]+): (.*)/\\2 \\1/' contacts.txt"] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('מתקנים קבצים בתוכם, עם גיבוי.', 'Fixing files in place, with a backup.'), exercises: [
    { type: 'terminal', prompt: T('בתוך sales.csv, שנו כל tea ל־green-tea ושמרו גיבוי בשם sales.csv.bak', 'Inside sales.csv, change every tea to green-tea and keep a backup named sales.csv.bak'), hint: T("sed -i.bak 's/tea/green-tea/g' sales.csv", "sed -i.bak 's/tea/green-tea/g' sales.csv"), goal: sh => sh.files.has('/home/user/sales.csv.bak') && (sh.files.get('/home/user/sales.csv').content.match(/green-tea/g) || []).length === 2, solve: ["sed -i.bak 's/tea/green-tea/g' sales.csv"] },
    { type: 'terminal', prompt: T('מחקו בתוך config.ini את כל שורות ההערה', 'Delete every comment line inside config.ini'), hint: T("sed -i '/^#/d' config.ini", "sed -i '/^#/d' config.ini"), goal: sh => sh.files.get('/home/user/config.ini').content === 'port = 8080\nhost = localhost\ndebug = true\n', solve: ["sed -i '/^#/d' config.ini"] },
    { type: 'terminal', prompt: T('הדפיסו את people.csv בלי כותרת, בצורה ‎dana (31)‎', 'Print people.csv without its header, as dana (31)'), hint: T("sed -E -e '1d' -e 's/([a-z]+),.*,([0-9]+)/\\1 (\\2)/' people.csv", "sed -E -e '1d' -e 's/([a-z]+),.*,([0-9]+)/\\1 (\\2)/' people.csv"), goal: (sh, log) => shows(log, "sed -E -e '1d' -e 's/([a-z]+),.*,([0-9]+)/\\1 (\\2)/' people.csv"), solve: ["sed -E -e '1d' -e 's/([a-z]+),.*,([0-9]+)/\\1 (\\2)/' people.csv"] },
  ] },
};

const UNIT_14 = {
  section: 2, unit: 14, exams: ['L103.2'], title: T('awk: היסודות', 'awk basics'), subtitle: T('עמודות, מפרידים ותנאים', 'Columns, separators and conditions'), color: 'purple', fixture: textFixture,
  lessons: [
    { title: T('עמודות', 'Fields'), exercises: [
      { type: 'teach', cmd: 'awk', name: 'awk', text: T('awk מחלקת כל שורה לעמודות לפי רווחים. ‎$1‎ היא העמודה הראשונה, ‎$2‎ השנייה, ו־‎$0‎ כל השורה. התוכנית כתובה בתוך ‎\'{ }\'‎.', 'awk splits each line into fields at spaces. $1 is the first field, $2 the second, and $0 the whole line. The program goes inside \'{ }\'.'), demo: [[], "awk '{print $1}' access.log"] },
      { type: 'output', prompt: WHAT, cmd: "awk '{print $2}' logs/app.log", wrongCmds: ["awk '{print $1}' logs/app.log", "awk '{print $3}' logs/app.log"] },
      { type: 'sentence', prompt: READ, text: T('ב־awk, ___ היא העמודה השלישית בשורה.', 'In awk, ___ is the third field on the line.'), options: ['$3', '#3', '%3'], answer: '$3' },
      { type: 'output', prompt: WHAT, cmd: "awk '{print $3, $1}' access.log", wrongCmds: ["awk '{print $1, $3}' access.log", "awk '{print $3}' access.log"] },
      { type: 'choice', prompt: T('מה ידפיס ‎awk \'{print $1 $2}\'‎ על השורה ‎10.0.0.1 GET /admin 403‎?', 'What will awk \'{print $1 $2}\' print for the line 10.0.0.1 GET /admin 403?'), options: ['10.0.0.1GET', '10.0.0.1 GET', '10.0.0.1,GET', '$1 $2'], answer: '10.0.0.1GET',
        why: { '10.0.0.1 GET': T('רווח בין העמודות מופיע רק עם פסיק: print $1, $2.', 'A space between fields only comes with a comma: print $1, $2.'), '10.0.0.1,GET': T('הפסיק ב־print הוא רווח בפלט, לא פסיק.', 'The comma in print becomes a space, not a comma.'), '$1 $2': T('awk מחליפה את ‎$1‎ ו־‎$2‎ בערכים.', 'awk replaces $1 and $2 with their values.') } },
      { type: 'fill', prompt: T('השלימו כדי להדפיס רק את הנתיבים (העמודה השלישית) מ־access.log', 'Fill in to print only the paths (the third field) from access.log'), before: "awk '{print ", after: "}' access.log", options: ['$3', '$2', '3', '$0'], answer: '$3' },
      { type: 'terminal', prompt: T('הדפיסו מ־access.log רק את קודי התשובה (העמודה הרביעית)', 'Print only the response codes (the fourth field) from access.log'), hint: T("awk '{print $4}' access.log", "awk '{print $4}' access.log"), goal: (sh, log) => shows(log, "awk '{print $4}' access.log"), solve: ["awk '{print $4}' access.log"] },
    ] },
    { title: T('‎-F: מפריד אחר', '-F: another separator'), exercises: [
      { type: 'teach', cmd: 'awk -F', name: 'field separator', text: T('‎-F‎ קובעת לפי מה לחלק: ‎-F ,‎ לקבצי CSV, ו־‎-F :‎ לקבצים כמו ‎/etc/passwd.', '-F sets what to split on: -F , for CSV files, and -F : for files like /etc/passwd.'), demo: [[], "awk -F , '{print $2}' people.csv"] },
      { type: 'output', prompt: WHAT, cmd: "awk -F , '{print $1}' sales.csv", wrongCmds: ["awk '{print $1}' sales.csv", "awk -F , '{print $2}' sales.csv"] },
      { type: 'sentence', prompt: READ, text: T('כדי לחלק שורות של CSV לעמודות כותבים awk ___.', 'To split CSV lines into fields, write awk ___.'), options: ['-F ,', '-d ,', '-t ,'], answer: '-F ,' },
      { type: 'output', prompt: WHAT, cmd: "awk -F ': ' '{print $2}' contacts.txt", wrongCmds: ["awk -F ': ' '{print $1}' contacts.txt", "awk '{print $2}' people.csv"] },
      { type: 'match', prompt: T('התאימו כל פקודה למה שהיא עושה', 'Match each command to what it does'), pairs: [['cut -d , -f 2', T('עמודה 2 של CSV, עם cut', 'CSV field 2, with cut')], ["awk -F , '{print $2}'", T('עמודה 2 של CSV, עם awk', 'CSV field 2, with awk')], ["awk '{print $2}'", T('עמודה 2 לפי רווחים', 'field 2 split on spaces')], ["awk '{print}'", T('כל השורה', 'the whole line')]] },
      { type: 'choice', prompt: T('למה ‎awk \'{print $2}\' people.csv‎ מדפיסה שורות ריקות?', 'Why does awk \'{print $2}\' people.csv print empty lines?'), plain: true,
        options: [T('אין רווחים בקובץ, אז לכל שורה יש רק עמודה אחת', 'There are no spaces in the file, so each line has only one field'), T('הקובץ ריק', 'The file is empty'), T('awk לא קוראת CSV', 'awk cannot read CSV'), T('צריך sudo', 'You need sudo')],
        why: [null, T('בקובץ יש 5 שורות.', 'The file has 5 lines.'), T('היא קוראת, רק צריך ‎-F ,‎.', 'It can, it just needs -F ,.'), T('אין קשר להרשאות.', 'It has nothing to do with permissions.')] },
      { type: 'terminal', prompt: T('הדפיסו מ־sales.csv רק את שמות המוצרים (העמודה השנייה)', 'Print only the item names (the second field) from sales.csv'), hint: T("awk -F , '{print $2}' sales.csv", "awk -F , '{print $2}' sales.csv"), goal: (sh, log) => shows(log, "awk -F , '{print $2}' sales.csv"), solve: ["awk -F , '{print $2}' sales.csv"] },
    ] },
    { title: T('NR ו־NF', 'NR and NF'), exercises: [
      { type: 'teach', cmd: 'NR NF', name: 'built-ins', text: T('NR הוא מספר השורה הנוכחית, ו־NF הוא מספר העמודות בה. ‎$NF‎ היא העמודה האחרונה.', 'NR is the current line number, and NF is how many fields it has. $NF is the last field.'), demo: [[], "awk '{print NR, $NF}' notes.txt"] },
      { type: 'output', prompt: WHAT, cmd: "awk '{print NF}' logs/app.log", wrongCmds: ["awk '{print NR}' logs/app.log"], wrongText: ['3\n3\n3\n3\n3\n3\n3\n3\n3\n3\n3\n3'] },
      { type: 'sentence', prompt: READ, text: T('ב־awk, ___ היא תמיד העמודה האחרונה בשורה.', 'In awk, ___ is always the last field on the line.'), options: ['$NF', '$NR', '$0'], answer: '$NF' },
      { type: 'output', prompt: WHAT, cmd: "awk '{print NR \": \" $0}' fruits.txt", wrongCmds: ["awk '{print NR}' fruits.txt", 'cat fruits.txt'] },
      { type: 'choice', prompt: T('איזו תוכנית מדפיסה את המילה האחרונה בכל שורה של logs/app.log?', 'Which program prints the last word of every line in logs/app.log?'), options: ["awk '{print $NF}' logs/app.log", "awk '{print NF}' logs/app.log", "awk '{print $NR}' logs/app.log", "awk '{print $-1}' logs/app.log"], answer: "awk '{print $NF}' logs/app.log",
        why: { "awk '{print NF}' logs/app.log": T('NF הוא מספר העמודות, לא העמודה עצמה.', 'NF is the number of fields, not the field itself.'), "awk '{print $NR}' logs/app.log": T('‎$NR‎ היא עמודה לפי מספר השורה.', '$NR is the field numbered like the line.'), "awk '{print $-1}' logs/app.log": T('ב־awk אין מספרים שליליים לעמודות.', 'awk has no negative field numbers.') } },
      { type: 'fill', prompt: T('השלימו כדי להדפיס את מספר השורה לפני כל שורה', 'Fill in to print the line number before each line'), before: "awk '{print ", after: ", $0}' notes.txt", options: ['NR', 'NF', '$1', 'LINE'], answer: 'NR' },
      { type: 'terminal', prompt: T('הדפיסו מ־logs/app.log את המילה האחרונה של כל שורה', 'Print the last word of every line in logs/app.log'), hint: T("awk '{print $NF}' logs/app.log", "awk '{print $NF}' logs/app.log"), goal: (sh, log) => shows(log, "awk '{print $NF}' logs/app.log"), solve: ["awk '{print $NF}' logs/app.log"] },
    ] },
    { title: T('תנאים', 'Conditions'), exercises: [
      { type: 'teach', cmd: "awk '$4 == 200'", name: 'patterns', text: T('לפני ה־{ } אפשר לכתוב תנאי, והפעולה תרוץ רק על שורות שעומדות בו. ‎$4 == 200‎, ‏‎$3 > 30‎, ‏‎NR > 1‎ או ‎/ERROR/‎. בלי { } בכלל, awk מדפיסה את השורה.', 'Before the { } you can write a condition, and the action runs only on lines that meet it: $4 == 200, $3 > 30, NR > 1 or /ERROR/. With no { } at all, awk prints the line.'), demo: [[], "awk '$4 == 200' access.log"] },
      { type: 'output', prompt: WHAT, cmd: "awk -F , 'NR > 1 && $3 > 30 {print $1}' people.csv", wrongCmds: ["awk -F , 'NR > 1 && $3 < 30 {print $1}' people.csv", "awk -F , 'NR > 1 {print $1}' people.csv"] },
      { type: 'sentence', prompt: READ, text: T('התנאי ___ מדלג על שורת הכותרת הראשונה.', 'The condition ___ skips the first header line.'), options: ['NR > 1', 'NF > 1', '$1 > 1'], answer: 'NR > 1' },
      { type: 'output', prompt: WHAT, cmd: "awk '/ERROR/ {print $1}' logs/app.log", wrongCmds: ["awk '/WARN/ {print $1}' logs/app.log", "awk '{print $1}' logs/app.log"] },
      { type: 'match', prompt: T('התאימו כל תנאי לשורות שהוא בוחר', 'Match each condition to the lines it picks'), pairs: [['NR == 1', T('השורה הראשונה', 'the first line')], ['/tea/', T('שורות עם tea', 'lines with tea')], ['$4 != 200', T('קוד שאינו 200', 'a code other than 200')], ['NF == 0', T('שורות ריקות', 'empty lines')]] },
      { type: 'choice', prompt: T('איזו פקודה מדפיסה את הנתיבים של בקשות שלא קיבלו 200?', 'Which command prints the paths of requests that did not get 200?'), options: ["awk '$4 != 200 {print $3}' access.log", "awk '$4 = 200 {print $3}' access.log", "awk '{print $3}' access.log", "awk '$3 != 200 {print $4}' access.log"], answer: "awk '$4 != 200 {print $3}' access.log",
        why: { "awk '$4 = 200 {print $3}' access.log": T('= אחד הוא השמה, לא השוואה. משווים עם == או !=.', 'A single = assigns, it does not compare. Compare with == or !=.'), "awk '{print $3}' access.log": T('בלי תנאי מקבלים את כל הנתיבים.', 'With no condition you get every path.'), "awk '$3 != 200 {print $4}' access.log": T('העמודות הפוכות: הקוד ב־‎$4‎, הנתיב ב־‎$3.', 'The fields are swapped: the code is $4, the path is $3.') } },
      { type: 'terminal', prompt: T('הדפיסו את שמות המוצרים מ־sales.csv שנמכרו ביותר מיחידה אחת (qty, העמודה השלישית)', 'Print the item names from sales.csv sold in more than one unit (qty, the third field)'), hint: T("awk -F , 'NR > 1 && $3 > 1 {print $2}' sales.csv", "awk -F , 'NR > 1 && $3 > 1 {print $2}' sales.csv"), goal: (sh, log) => shows(log, "awk -F , 'NR > 1 && $3 > 1 {print $2}' sales.csv"), solve: ["awk -F , 'NR > 1 && $3 > 1 {print $2}' sales.csv"] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('שולפים בדיוק את מה שצריך מקבצי נתונים.', 'Pulling exactly what you need out of data files.'), exercises: [
    { type: 'terminal', prompt: T('הדפיסו מ־access.log את כתובת ה־IP ואת הקוד של כל בקשה, בסדר הזה', 'Print the IP address and the code of each request in access.log, in that order'), hint: T("awk '{print $1, $4}' access.log", "awk '{print $1, $4}' access.log"), goal: (sh, log) => shows(log, "awk '{print $1, $4}' access.log"), solve: ["awk '{print $1, $4}' access.log"] },
    { type: 'terminal', prompt: T('הדפיסו מ־people.csv (בלי כותרת) את השם והעיר של מי שגר ב־haifa', 'Print the name and city of everyone in people.csv (no header) who lives in haifa'), hint: T("awk -F , '$2 == \"haifa\" {print $1, $2}' people.csv", "awk -F , '$2 == \"haifa\" {print $1, $2}' people.csv"), goal: (sh, log) => shows(log, "awk -F , '$2 == \"haifa\" {print $1, $2}' people.csv"), solve: ["awk -F , '$2 == \"haifa\" {print $1, $2}' people.csv"] },
    { type: 'terminal', prompt: T('הדפיסו את מספרי השורות של כל ה־ERROR ב־logs/app.log', 'Print the line numbers of every ERROR in logs/app.log'), hint: T("awk '/ERROR/ {print NR}' logs/app.log", "awk '/ERROR/ {print NR}' logs/app.log"), goal: (sh, log) => shows(log, "awk '/ERROR/ {print NR}' logs/app.log"), solve: ["awk '/ERROR/ {print NR}' logs/app.log"] },
  ] },
};

const UNIT_15 = {
  section: 2, unit: 15, exams: ['L103.2'], title: T('דוחות עם awk', 'awk reports'), subtitle: T('סכומים, ממוצעים, ספירות ו־printf', 'Sums, averages, counts and printf'), color: 'blue', fixture: textFixture,
  lessons: [
    { title: T('סכומים ו־END', 'Sums and END'), exercises: [
      { type: 'teach', cmd: 'END', name: 'end block', text: T('awk זוכרת משתנים בין שורות. ‎{s += $3}‎ מוסיפה את העמודה השלישית בכל שורה, ו־‎END {print s}‎ רצה פעם אחת אחרי השורה האחרונה ומדפיסה את הסכום.', 'awk remembers variables across lines. {s += $3} adds the third field on each line, and END {print s} runs once after the last line and prints the total.'), demo: [[], "awk -F , 'NR > 1 {s += $3} END {print s}' sales.csv"] },
      { type: 'output', prompt: WHAT, cmd: "awk -F , 'NR > 1 {s += $3} END {print s}' people.csv", wrongCmds: ["awk -F , 'NR > 1 {print $3}' people.csv"], wrongText: ['4', '31'] },
      { type: 'sentence', prompt: READ, text: T('החלק ___ ב־awk רץ פעם אחת, אחרי כל השורות.', 'The ___ part in awk runs once, after all the lines.'), options: ['END', 'BEGIN', 'NR'], answer: 'END' },
      { type: 'output', prompt: WHAT, cmd: "awk 'END {print NR}' logs/app.log", wrongCmds: ["awk 'END {print NF}' logs/app.log"], wrongText: ['1', '11'] },
      { type: 'choice', prompt: T('מה יקרה אם נכתוב ‎awk \'{s += $3; print s}\'‎ בלי END?', 'What happens with awk \'{s += $3; print s}\', without END?'), plain: true,
        options: [T('הסכום המצטבר יודפס אחרי כל שורה', 'The running total is printed after every line'), T('רק הסכום הסופי יודפס', 'Only the final total is printed'), T('שום דבר לא יודפס', 'Nothing is printed'), T('שגיאה', 'An error')],
        why: [null, T('בלי END, ה־print רץ על כל שורה.', 'Without END, the print runs on every line.'), T('print בתוך { } רץ על כל שורה.', 'A print inside { } runs on every line.'), T('זו תוכנית חוקית.', 'It is a valid program.')] },
      { type: 'fill', prompt: T('השלימו כדי לחשב כמה יחידות נמכרו בסך הכול ב־sales.csv', 'Fill in to total how many units were sold in sales.csv'), before: "awk -F , 'NR > 1 {n += $3} ", after: " {print n}' sales.csv", options: ['END', 'BEGIN', 'NR', 'NEXT'], answer: 'END' },
      { type: 'terminal', ask: T('מה הסכום?', 'What is the total?'), prompt: T('חשבו את סכום הגילאים ב־people.csv, בלי שורת הכותרת', 'Add up the ages in people.csv, without the header line'), hint: T("awk -F , 'NR > 1 {s += $3} END {print s}' people.csv", "awk -F , 'NR > 1 {s += $3} END {print s}' people.csv"), goal: (sh, log) => shows(log, "awk -F , 'NR > 1 {s += $3} END {print s}' people.csv"), solve: ["awk -F , 'NR > 1 {s += $3} END {print s}' people.csv"] },
    ] },
    { title: T('ממוצעים וחשבון', 'Averages and math'), exercises: [
      { type: 'teach', cmd: 's/n', name: 'arithmetic', text: T('awk יודעת חשבון: + - * / ו־%. ממוצע הוא סכום חלקי מספר: ‎{s += $3; n++} END {print s/n}‎.', 'awk does math: + - * / and %. An average is a total divided by a count: {s += $3; n++} END {print s/n}.'), demo: [[], "awk -F , 'NR > 1 {s += $3; n++} END {print s/n}' people.csv"] },
      { type: 'output', prompt: WHAT, cmd: "awk -F , 'NR > 1 {print $2, $3 * $4}' sales.csv", wrongCmds: ["awk -F , 'NR > 1 {print $2, $3 + $4}' sales.csv", "awk -F , 'NR > 1 {print $2, $4}' sales.csv"] },
      { type: 'sentence', prompt: READ, text: T('הביטוי ‎n++‎ ב־awk מוסיף ___ ל־n.', 'The expression n++ in awk adds ___ to n.'), options: ['1', '2', 'n'], answer: '1' },
      { type: 'output', prompt: WHAT, cmd: "awk -F , 'NR > 1 {t += $3 * $4} END {print t}' sales.csv", wrongCmds: ["awk -F , 'NR > 1 {t += $4} END {print t}' sales.csv", "awk -F , 'NR > 1 {t += $3} END {print t}' sales.csv"] },
      { type: 'match', prompt: T('התאימו כל ביטוי למה שהוא עושה', 'Match each expression to what it does'), pairs: [['s += $2', T('מוסיף את $2 ל־s', 'adds $2 to s')], ['n++', T('מגדיל את n ב־1', 'adds 1 to n')], ['s/n', T('ממוצע', 'an average')], ['$3 * $4', T('כפל של שתי עמודות', 'two fields multiplied')]] },
      { type: 'choice', prompt: T('ב־sales.csv יש עמודת qty (כמות) ועמודת price (מחיר). איך מחשבים את סך ההכנסות?', 'sales.csv has a qty column and a price column. How do you total the revenue?'), options: ["awk -F , 'NR > 1 {t += $3 * $4} END {print t}' sales.csv", "awk -F , 'NR > 1 {t += $4} END {print t}' sales.csv", "awk -F , '{t = $3 * $4} END {print t}' sales.csv", "awk -F , 'END {print $3 * $4}' sales.csv"], answer: "awk -F , 'NR > 1 {t += $3 * $4} END {print t}' sales.csv",
        why: { "awk -F , 'NR > 1 {t += $4} END {print t}' sales.csv": T('זה מחבר מחירים בלי להכפיל בכמות.', 'That adds prices without multiplying by quantity.'), "awk -F , '{t = $3 * $4} END {print t}' sales.csv": T('= דורס את t בכל שורה, אז נשארת רק השורה האחרונה.', '= overwrites t on each line, so only the last line is left.'), "awk -F , 'END {print $3 * $4}' sales.csv": T('ב־END יש רק את השורה האחרונה, לא סכום.', 'END has only the last line, not a total.') } },
      { type: 'terminal', ask: T('מה הממוצע?', 'What is the average?'), prompt: T('מה ממוצע הכמות (qty, עמודה 3) למכירה ב־sales.csv?', 'What is the average qty (field 3) per sale in sales.csv?'), hint: T("awk -F , 'NR > 1 {s += $3; n++} END {print s/n}' sales.csv", "awk -F , 'NR > 1 {s += $3; n++} END {print s/n}' sales.csv"), goal: (sh, log) => shows(log, "awk -F , 'NR > 1 {s += $3; n++} END {print s/n}' sales.csv"), solve: ["awk -F , 'NR > 1 {s += $3; n++} END {print s/n}' sales.csv"] },
    ] },
    { title: T('printf', 'printf'), exercises: [
      { type: 'teach', cmd: 'printf', name: 'formatted print', text: T('printf מדפיסה לפי תבנית: ‎%s‎ טקסט, ‎%d‎ מספר שלם, ‎%.2f‎ מספר עם שתי ספרות אחרי הנקודה, ו־‎%-8s‎ טקסט ברוחב 8. בסוף צריך ‎\\n‎ לשורה חדשה.', 'printf prints by a template: %s text, %d a whole number, %.2f a number with two decimals, and %-8s text 8 wide. You need \\n at the end for a new line.'), demo: [[], "awk -F , 'NR > 1 {printf \"%-6s %d\\n\", $1, $3}' people.csv"] },
      { type: 'output', prompt: WHAT, cmd: "awk -F , 'NR > 1 {printf \"%s costs %.2f\\n\", $2, $4}' sales.csv", wrongCmds: ["awk -F , 'NR > 1 {print $2, $4}' sales.csv"], wrongText: ['coffee costs 12\ntea costs 9\ncoffee costs 12\ncake costs 25\ntea costs 9\ncoffee costs 12'] },
      { type: 'sentence', prompt: READ, text: T('ב־printf, התבנית ___ מדפיסה מספר שלם.', 'In printf, the ___ placeholder prints a whole number.'), options: ['%d', '%s', '%n'], answer: '%d' },
      { type: 'choice', prompt: T('מה חסר ב־‎awk \'{printf "%s", $1}\'‎ שגורם לכל השמות להופיע באותה שורה?', 'What is missing in awk \'{printf "%s", $1}\' that makes all the names land on one line?'), options: ['\\n', '%d', '$0', 'END'], answer: '\\n',
        why: { '%d': T('‎%d‎ הוא למספרים, ולא יוסיף שורה חדשה.', '%d is for numbers, and adds no new line.'), '$0': T('‎$0‎ היא השורה, לא מעבר שורה.', '$0 is the line, not a line break.'), END: T('END לא קשור להדפסה של כל שורה.', 'END has nothing to do with printing each line.') } },
      { type: 'match', prompt: T('התאימו כל תבנית ל־printf למה שהיא מדפיסה', 'Match each printf placeholder to what it prints'), pairs: [['%s', T('טקסט', 'text')], ['%d', T('מספר שלם', 'a whole number')], ['%.2f', T('שתי ספרות אחרי הנקודה', 'two decimals')], ['%-8s', T('טקסט ברוחב 8', 'text 8 wide')]] },
      { type: 'output', prompt: WHAT, cmd: "awk 'BEGIN {printf \"%.1f\\n\", 10/4}'", wrongText: ['2.5000', '2', '2.50'] },
      { type: 'terminal', prompt: T('הדפיסו מ־people.csv (בלי כותרת) שורות בצורה "dana is 31", עם printf', 'Print people.csv lines (no header) as "dana is 31", using printf'), hint: T("awk -F , 'NR > 1 {printf \"%s is %d\\n\", $1, $3}' people.csv", "awk -F , 'NR > 1 {printf \"%s is %d\\n\", $1, $3}' people.csv"), goal: (sh, log) => shows(log, "awk -F , 'NR > 1 {printf \"%s is %d\\n\", $1, $3}' people.csv"), solve: ["awk -F , 'NR > 1 {printf \"%s is %d\\n\", $1, $3}' people.csv"] },
    ] },
    { title: T('ספירה לפי קבוצות', 'Counting by group'), exercises: [
      { type: 'teach', cmd: 'c[$2]++', name: 'arrays', text: T('מערך שומר מונה לכל ערך: ‎c[$2]++‎ מוסיפה 1 למונה של העיר בשורה. ב־END אפשר להדפיס מונה אחד, למשל ‎c["haifa"]‎.', 'An array keeps a counter for each value: c[$2]++ adds 1 to the counter of that line\'s city. In END you can print one of them, like c["haifa"].'), demo: [[], "awk -F , 'NR > 1 {c[$2]++} END {print c[\"haifa\"]}' people.csv"] },
      { type: 'output', prompt: WHAT, cmd: "awk -F , 'NR > 1 {q[$2] += $3} END {print q[\"coffee\"], q[\"tea\"]}' sales.csv", wrongCmds: ["awk -F , 'NR > 1 {q[$2]++} END {print q[\"coffee\"], q[\"tea\"]}' sales.csv"], wrongText: ['6'] },
      { type: 'sentence', prompt: READ, text: T('הביטוי ‎c[$1]++‎ סופר כמה פעמים הופיע כל ערך בעמודה ___.', 'The expression c[$1]++ counts how many times each value in field ___ appeared.'), options: ['1', '0', 'NR'], answer: '1' },
      { type: 'output', prompt: WHAT, cmd: "awk '{n[$1]++} END {print n[\"10.0.0.1\"], n[\"10.0.0.2\"], n[\"10.0.0.3\"]}' access.log", wrongText: ['1 1 1', '6', '2 2 2'] },
      { type: 'choice', prompt: T('מה עושה ‎awk \'!seen[$0]++\' fruits.txt‎?', 'What does awk \'!seen[$0]++\' fruits.txt do?'), plain: true,
        options: [T('מדפיסה כל שורה רק בפעם הראשונה שהיא מופיעה', 'Prints each line only the first time it appears'), T('סופרת שורות', 'Counts lines'), T('מדפיסה רק כפולים', 'Prints only duplicates'), T('ממיינת', 'Sorts')],
        why: [null, T('היא לא מדפיסה מספר, היא מסננת.', 'It prints no number, it filters.'), T('ההפך: כפולים לא מודפסים.', 'The opposite: duplicates are skipped.'), T('הסדר נשאר כמו בקובץ.', 'The order stays as in the file.')] },
      { type: 'output', prompt: WHAT, cmd: "awk '!seen[$0]++' fruits.txt", wrongCmds: ['sort fruits.txt', 'uniq fruits.txt'] },
      { type: 'terminal', ask: T('כמה בקשות?', 'How many requests?'), prompt: T('כמה בקשות הגיעו מ־10.0.0.2 לפי access.log? השתמשו במונה של awk לפי העמודה הראשונה', 'How many requests came from 10.0.0.2 in access.log? Use an awk counter on the first field'), hint: T("awk '{n[$1]++} END {print n[\"10.0.0.2\"]}' access.log", "awk '{n[$1]++} END {print n[\"10.0.0.2\"]}' access.log"), goal: (sh, log) => shows(log, "awk '{n[$1]++} END {print n[\"10.0.0.2\"]}' access.log") && log.some(l => /^awk\b/.test(l.cmd)), solve: ["awk '{n[$1]++} END {print n[\"10.0.0.2\"]}' access.log"] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('דוח מכירות לסוף השבוע.', 'An end-of-week sales report.'), exercises: [
    { type: 'terminal', ask: T('כמה הכנסות?', 'How much revenue?'), prompt: T('כמה כסף הכניסו כל המכירות ב־sales.csv? (כמות כפול מחיר, לכל שורה)', 'How much money did all the sales in sales.csv bring in? (qty times price, for each line)'), hint: T("awk -F , 'NR > 1 {t += $3 * $4} END {print t}' sales.csv", "awk -F , 'NR > 1 {t += $3 * $4} END {print t}' sales.csv"), goal: (sh, log) => shows(log, "awk -F , 'NR > 1 {t += $3 * $4} END {print t}' sales.csv"), solve: ["awk -F , 'NR > 1 {t += $3 * $4} END {print t}' sales.csv"] },
    { type: 'terminal', ask: T('כמה כוסות קפה?', 'How many coffees?'), prompt: T('כמה יחידות coffee נמכרו בסך הכול?', 'How many coffee units were sold in total?'), hint: T("awk -F , '$2 == \"coffee\" {n += $3} END {print n}' sales.csv", "awk -F , '$2 == \"coffee\" {n += $3} END {print n}' sales.csv"), goal: (sh, log) => shows(log, "awk -F , '$2 == \"coffee\" {n += $3} END {print n}' sales.csv"), solve: ["awk -F , '$2 == \"coffee\" {n += $3} END {print n}' sales.csv"] },
    { type: 'terminal', prompt: T('הדפיסו לכל שורה במכירות (בלי כותרת) את התאריך ואת הסכום שלה עם שתי ספרות אחרי הנקודה, למשל ‎2026-10-01 36.00', 'For each sale (no header) print the date and its total with two decimals, like 2026-10-01 36.00'), hint: T("awk -F , 'NR > 1 {printf \"%s %.2f\\n\", $1, $3 * $4}' sales.csv", "awk -F , 'NR > 1 {printf \"%s %.2f\\n\", $1, $3 * $4}' sales.csv"), goal: (sh, log) => shows(log, "awk -F , 'NR > 1 {printf \"%s %.2f\\n\", $1, $3 * $4}' sales.csv"), solve: ["awk -F , 'NR > 1 {printf \"%s %.2f\\n\", $1, $3 * $4}' sales.csv"] },
  ] },
};


const VI = T('בעורך vi', 'In the vi editor');

const UNIT_16 = {
  section: 2, unit: 16, exams: ['L103.4', 'R'], title: T('צנרת מתקדמת', 'Plumbing'), subtitle: T('tee, ‏$( ), xargs ו־&&', 'tee, $( ), xargs and &&'), color: 'green', fixture: textFixture,
  lessons: [
    { title: T('tee', 'tee'), exercises: [
      { type: 'teach', cmd: 'tee', name: 'tee', text: T('כמו צומת T בצינור: tee כותבת את מה שמגיע אליה לקובץ, וגם מעבירה אותו הלאה למסך או לפקודה הבאה. ‎-a‎ מוסיפה לסוף הקובץ במקום לדרוס.', 'Like a T joint in a pipe: tee writes what it gets into a file, and also passes it on to the screen or the next command. -a appends instead of overwriting.'), demo: [[], 'grep ERROR logs/app.log | tee errors.txt'] },
      { type: 'output', prompt: T('מה תדפיס cat errors.txt אחרי הפקודה?', 'What will cat errors.txt print after this command?'), setup: ['grep -c ERROR logs/app.log | tee errors.txt'], cmd: 'cat errors.txt', wrongCmds: ['grep ERROR logs/app.log'], wrongText: [''] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ שומרת פלט לקובץ וגם מציגה אותו.', 'The ___ command saves output to a file and also shows it.'), options: ['tee', 'cat', 'echo'], answer: 'tee' },
      { type: 'choice', prompt: T('מה ההבדל בין ‎grep ERROR logs/app.log > e.txt‎ לבין ‎grep ERROR logs/app.log | tee e.txt‎?', 'What is the difference between grep ERROR logs/app.log > e.txt and grep ERROR logs/app.log | tee e.txt?'), plain: true,
        options: [T('עם tee השורות גם מוצגות על המסך', 'With tee the lines also show on screen'), T('אין הבדל', 'There is no difference'), T('tee לא יוצרת קובץ', 'tee does not create a file'), T('> מוסיפה לסוף הקובץ', '> appends to the file')],
        why: [null, T('> שולחת הכול לקובץ ולא מציגה כלום.', '> sends everything to the file and shows nothing.'), T('tee יוצרת את הקובץ.', 'tee creates the file.'), T('> דורסת. ‎>>‎ מוסיפה.', '> overwrites. >> appends.')] },
      { type: 'fill', prompt: T('השלימו כדי להוסיף את התוצאה לסוף log.txt בלי לדרוס אותו', 'Fill in to add the result to the end of log.txt without overwriting it'), before: 'date | tee ', after: ' log.txt', options: ['-a', '-n', '>>', '-i'], answer: '-a' },
      { type: 'terminal', prompt: T('שמרו את שורות ה־WARN של logs/app.log בקובץ warn.txt, וגם הציגו אותן על המסך', 'Save the WARN lines of logs/app.log into warn.txt, and show them on screen too'), hint: T('grep WARN logs/app.log | tee warn.txt', 'grep WARN logs/app.log | tee warn.txt'), goal: (sh, log) => shows(log, 'grep WARN logs/app.log') && sh.files.get('/home/user/warn.txt')?.content === textOut('grep WARN logs/app.log'), solve: ['grep WARN logs/app.log | tee warn.txt'] },
    ] },
    { title: T('‎$( )', '$( )'), exercises: [
      { type: 'teach', cmd: '$( )', name: 'command substitution', text: T('‎$(command)‎ מריצה פקודה ושמה את הפלט שלה בתוך פקודה אחרת. ‎echo "Lines: $(wc -l < notes.txt)"‎. הצורה הישנה היא בגרשיים הפוכים: ‎`command`‎.', '$(command) runs a command and puts its output inside another command. echo "Lines: $(wc -l < notes.txt)". The old form uses backticks: `command`.'), demo: [[], 'echo "Lines: $(wc -l < notes.txt)"'] },
      { type: 'output', prompt: WHAT, cmd: 'echo "I am $(whoami)"', wrongCmds: ["echo 'I am $(whoami)'"], wrongText: ['I am whoami'] },
      { type: 'sentence', prompt: READ, text: T('הצורה ___ מריצה פקודה ושמה את הפלט שלה במקומה.', 'The ___ form runs a command and puts its output in its place.'), options: ['$( )', '${ }', '$[ ]'], answer: '$( )' },
      { type: 'output', prompt: WHAT, cmd: 'echo "There are $(grep -c ERROR logs/app.log) errors"', wrongCmds: ['echo "There are $(grep -c WARN logs/app.log) errors"'], wrongText: ['There are grep -c ERROR logs/app.log errors'] },
      { type: 'match', prompt: T('התאימו כל צורה למה שהיא', 'Match each form to what it is'), pairs: [['$(cmd)', T('הפלט של פקודה', 'the output of a command')], ['`cmd`', T('אותו דבר, בצורה הישנה', 'the same, old style')], ['$HOME', T('ערך של משתנה', 'a variable\'s value')], ["'$(cmd)'", T('הטקסט כמו שהוא', 'the text as it is')]] },
      { type: 'choice', prompt: T('איזו פקודה פותחת את הקובץ שנמצא בשם todo.txt, בלי לדעת איפה הוא?', 'Which command shows the file named todo.txt without knowing where it is?'), options: ['cat $(find . -name todo.txt)', 'cat find . -name todo.txt', 'find . -name todo.txt cat', 'cat "find . -name todo.txt"'], answer: 'cat $(find . -name todo.txt)',
        why: { 'cat find . -name todo.txt': T('cat תנסה לפתוח קבצים בשם find, ‏. וכן הלאה.', 'cat would try to open files named find, . and so on.'), 'find . -name todo.txt cat': T('find לא מריצה את cat כך.', 'find does not run cat like that.'), 'cat "find . -name todo.txt"': T('במרכאות זה שם קובץ אחד ארוך.', 'In quotes it is one long file name.') } },
      { type: 'terminal', prompt: T('הדפיסו את המשפט "Last line: " ואחריו השורה האחרונה של notes.txt, בפקודה אחת עם ‎$( )', 'Print "Last line: " followed by the last line of notes.txt, in one command with $( )'), hint: T('echo "Last line: $(tail -n 1 notes.txt)"', 'echo "Last line: $(tail -n 1 notes.txt)"'), goal: (sh, log) => log.some(l => l.out === 'Last line: learn grep' && l.cmd.includes('$(')), solve: ['echo "Last line: $(tail -n 1 notes.txt)"'] },
    ] },
    { title: T('xargs', 'xargs'), exercises: [
      { type: 'teach', cmd: 'xargs', name: 'build arguments', text: T('הופכת שורות שמגיעות בצינור לארגומנטים של פקודה. ‎find . -name "*.jpg" | xargs ls‎ מריצה ls על כל מה ש־find מצאה. ‎-n 1‎ מריצה פעם לכל פריט, ו־‎-I {}‎ שמה כל פריט במקום {}.', 'Turns lines coming down a pipe into arguments for a command. find . -name "*.jpg" | xargs ls runs ls on everything find found. -n 1 runs once per item, and -I {} puts each item where {} is.'), demo: [[], 'ls photos | xargs -I {} echo photo: {}'] },
      { type: 'output', prompt: WHAT, cmd: 'echo a b c | xargs -n 1 echo', wrongCmds: ['echo a b c | xargs echo'], wrongText: ['a b c\na b c\na b c'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ הופכת את מה שמגיע בצינור לארגומנטים של פקודה אחרת.', 'The ___ command turns what comes down a pipe into arguments for another command.'), options: ['xargs', 'tee', 'echo'], answer: 'xargs' },
      { type: 'output', prompt: T('ב־docs יש cv.pdf ו־todo.txt (2 שורות). מה תדפיס הפקודה?', 'docs has cv.pdf and todo.txt (2 lines). What will this print?'), cmd: 'find docs -name "*.txt" | xargs wc -l', wrongCmds: ['find docs -name "*.txt"'], wrongText: ['2'] },
      { type: 'choice', prompt: T('למה ‎find . -name "*.log" | rm‎ לא מוחקת כלום?', 'Why does find . -name "*.log" | rm delete nothing?'), plain: true,
        options: [T('rm לא קוראת שמות מהצינור, היא צריכה אותם כארגומנטים: ‎| xargs rm', 'rm does not read names from the pipe, it needs them as arguments: | xargs rm'), T('find לא מוצאת קבצים', 'find finds no files'), T('צריך sudo', 'You need sudo'), T('קבצי log מוגנים', 'Log files are protected')],
        why: [null, T('find כן מוצאת, הבעיה ב־rm.', 'find does find them; the problem is rm.'), T('אין קשר להרשאות.', 'It has nothing to do with permissions.'), T('אין הגנה כזו.', 'There is no such protection.')] },
      { type: 'fill', prompt: T('השלימו כדי להריץ echo פעם אחת לכל שם', 'Fill in to run echo once per name'), before: 'cat notes.txt | xargs ', after: ' 1 echo', options: ['-n', '-I', '-a', '-1'], answer: '-n' },
      { type: 'terminal', prompt: T('ספרו שורות בכל קבצי ה־.txt בתיקייה docs, עם find ו־xargs', 'Count the lines of every .txt file in docs, with find and xargs'), hint: T('find docs -name "*.txt" | xargs wc -l', 'find docs -name "*.txt" | xargs wc -l'), goal: (sh, log) => shows(log, 'find docs -name "*.txt" | xargs wc -l') && log.some(l => l.cmd.includes('xargs')), solve: ['find docs -name "*.txt" | xargs wc -l'] },
    ] },
    { title: T('‎&&, || ו־;', '&&, || and ;'), exercises: [
      { type: 'teach', cmd: '&&', name: 'and then', text: T('‎a && b‎ מריצה את b רק אם a הצליחה. ‎a || b‎ מריצה את b רק אם a נכשלה. ‎a ; b‎ מריצה את שתיהן, תמיד.', 'a && b runs b only if a succeeded. a || b runs b only if a failed. a ; b runs both, always.'), demo: [[], 'mkdir work && cd work && pwd'] },
      { type: 'output', prompt: WHAT, cmd: 'cd nowhere || echo "no such folder"', wrongCmds: ['echo "no such folder"'], wrongText: ['cd: nowhere: No such file or directory'] },
      { type: 'sentence', prompt: READ, text: T('בפקודה ‎a ___ b‎, הפקודה b רצה רק אם a הצליחה.', 'In a ___ b, b runs only if a succeeded.'), options: ['&&', '||', ';'], answer: '&&' },
      { type: 'output', prompt: WHAT, cmd: 'cd nowhere && echo moved', wrongCmds: ['echo moved'], wrongText: ['moved\ncd: nowhere: No such file or directory'] },
      { type: 'match', prompt: T('התאימו כל סימן למתי b רצה', 'Match each sign to when b runs'), pairs: [['a && b', T('רק אם a הצליחה', 'only if a worked')], ['a || b', T('רק אם a נכשלה', 'only if a failed')], ['a ; b', T('תמיד', 'always')], ['a | b', T('b מקבלת את הפלט של a', 'b gets a\'s output')]] },
      { type: 'tiles', prompt: T('צרו תיקייה בשם build ורק אם זה הצליח, היכנסו אליה', 'Create a folder named build and, only if that worked, go into it'), answer: 'mkdir build && cd build', tiles: ['mkdir', 'build', '&&', 'cd', 'build', '||', ';'] },
      { type: 'terminal', prompt: T('נסו להיכנס לתיקייה backup, ואם היא לא קיימת, צרו אותה (בפקודה אחת)', 'Try to go into backup, and if it does not exist, create it (in one command)'), hint: T('cd backup || mkdir backup', 'cd backup || mkdir backup'), goal: (sh, log) => sh.dirs.has('/home/user/backup') && log.some(l => l.cmd.includes('||')), solve: ['cd backup || mkdir backup'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('מחברים כמה פקודות לשרשרת אחת.', 'Linking several commands into one chain.'), exercises: [
    { type: 'terminal', prompt: T('שמרו בקובץ ips.txt את כתובות ה־IP השונות מ־access.log, ממוינות, וגם הציגו אותן', 'Save the distinct IP addresses from access.log, sorted, into ips.txt, and show them too'), hint: T("awk '{print $1}' access.log | sort -u | tee ips.txt", "awk '{print $1}' access.log | sort -u | tee ips.txt"), goal: sh => sh.files.get('/home/user/ips.txt')?.content === '10.0.0.1\n10.0.0.2\n10.0.0.3\n', solve: ["awk '{print $1}' access.log | sort -u | tee ips.txt"] },
    { type: 'terminal', prompt: T('הדפיסו "Errors today: " ואחריו מספר שורות ה־ERROR ב־logs/app.log', 'Print "Errors today: " followed by the number of ERROR lines in logs/app.log'), hint: T('echo "Errors today: $(grep -c ERROR logs/app.log)"', 'echo "Errors today: $(grep -c ERROR logs/app.log)"'), goal: (sh, log) => log.some(l => l.out === 'Errors today: 3'), solve: ['echo "Errors today: $(grep -c ERROR logs/app.log)"'] },
    { type: 'terminal', prompt: T('צרו תיקייה archive, ורק אם זה הצליח, העתיקו אליה את כל קבצי ה־.csv', 'Create an archive folder and, only if that worked, copy every .csv file into it'), hint: T('mkdir archive && cp *.csv archive', 'mkdir archive && cp *.csv archive'), goal: sh => sh.files.has('/home/user/archive/sales.csv') && sh.files.has('/home/user/archive/people.csv'), solve: ['mkdir archive && cp *.csv archive'] },
  ] },
};

const UNIT_17 = {
  section: 2, unit: 17, exams: ['L103.8', 'R'], title: T('vi: לשרוד', 'vi: survive'), subtitle: T('מצבים, שמירה ויציאה', 'Modes, saving and quitting'), color: 'purple', fixture: textFixture,
  lessons: [
    { title: T('מצבים', 'Modes'), exercises: [
      { type: 'teach', cmd: 'vi', name: 'visual editor', text: T('vi (או vim) הוא העורך שיש כמעט בכל שרת. הוא נפתח במצב פקודות: מקשים לא כותבים טקסט אלא עושים פעולות. i עוברת למצב כתיבה, ו־Esc חוזרת למצב פקודות.', 'vi (or vim) is the editor found on almost every server. It opens in command mode: keys do not type text, they run actions. i switches to insert mode, and Esc goes back to command mode.') },
      { type: 'choice', prompt: T('פתחתם קובץ ב־vi והקלדתם hello, אבל הטקסט לא הופיע ודברים מוזרים קרו. למה?', 'You opened a file in vi and typed hello, but no text appeared and strange things happened. Why?'), plain: true,
        options: [T('vi נפתח במצב פקודות, וכל אות היא פקודה', 'vi opens in command mode, and every letter is a command'), T('הקובץ לקריאה בלבד', 'The file is read-only'), T('המקלדת לא מחוברת', 'The keyboard is not connected'), T('צריך לשמור קודם', 'You have to save first')],
        why: [null, T('גם בקובץ שאפשר לכתוב בו זה יקרה.', 'It would happen in a writable file too.'), T('המקשים עובדים, רק כפקודות.', 'The keys work, just as commands.'), T('שמירה לא קשורה למצב.', 'Saving has nothing to do with the mode.')] },
      { type: 'sentence', prompt: READ, text: T('כדי לחזור ממצב כתיבה למצב פקודות לוחצים ___.', 'To go from insert mode back to command mode, press ___.'), options: ['Esc', 'Enter', 'Tab'], answer: 'Esc' },
      { type: 'match', prompt: T('התאימו כל מקש למה שהוא עושה במצב פקודות', 'Match each key to what it does in command mode'), pairs: [['i', T('כתיבה לפני הסמן', 'insert before the cursor')], ['a', T('כתיבה אחרי הסמן', 'append after the cursor')], ['o', T('שורה חדשה מתחת', 'a new line below')], ['Esc', T('חזרה למצב פקודות', 'back to command mode')]] },
      { type: 'choice', prompt: T('איזה מקש פותח שורה חדשה מתחת לשורה הנוכחית ומתחיל לכתוב בה?', 'Which key opens a new line below the current one and starts typing there?'), options: ['o', 'i', 'a', 'n'], answer: 'o',
        why: { i: T('i כותבת במקום, לפני הסמן.', 'i types in place, before the cursor.'), a: T('a כותבת אחרי הסמן באותה שורה.', 'a types after the cursor on the same line.'), n: T('n היא "החיפוש הבא".', 'n is "next search match".') } },
      { type: 'scenario', prompt: T('אתם במצב פקודות ורוצים להתחיל לכתוב לפני הסמן. איזה מקש?', 'You are in command mode and want to start typing before the cursor. Which key?'), hint: T('האות הראשונה של insert', 'The first letter of insert'), accept: ['i'] },
    ] },
    { title: T('שמירה ויציאה', 'Save and quit'), exercises: [
      { type: 'teach', cmd: ':wq', name: 'write and quit', text: T('במצב פקודות, : פותחת שורת פקודה בתחתית. ‎:w‎ שומרת, ‎:q‎ יוצאת, ‎:wq‎ (או ZZ) שומרת ויוצאת, ו־‎:q!‎ יוצאת בלי לשמור.', 'In command mode, : opens a command line at the bottom. :w saves, :q quits, :wq (or ZZ) saves and quits, and :q! quits without saving.') },
      { type: 'scenario', prompt: T('ערכתם קובץ ב־vi, ואתם במצב פקודות. מה מקלידים כדי לשמור ולצאת?', 'You edited a file in vi and you are in command mode. What do you type to save and quit?'), hint: T('נקודתיים, w, q', 'colon, w, q'), accept: [':wq', ':x', 'ZZ'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ יוצאת מ־vi בלי לשמור את השינויים.', 'The ___ command leaves vi without saving the changes.'), options: [':q!', ':wq', ':w'], answer: ':q!' },
      { type: 'match', prompt: T('התאימו כל פקודה למה שהיא עושה', 'Match each command to what it does'), pairs: [[':w', T('שומרת', 'saves')], [':q', T('יוצאת', 'quits')], [':wq', T('שומרת ויוצאת', 'saves and quits')], [':q!', T('יוצאת בלי לשמור', 'quits without saving')]] },
      { type: 'choice', prompt: T('הקלדתם ‎:q‎ וקיבלתם הודעה ‎No write since last change‎. מה זה אומר?', 'You typed :q and got "No write since last change". What does it mean?'), plain: true,
        options: [T('יש שינויים שלא נשמרו. ‎:wq‎ שומרת, ‎:q!‎ זורקת אותם', 'There are unsaved changes. :wq saves them, :q! throws them away'), T('הקובץ נמחק', 'The file was deleted'), T('vi קרס', 'vi crashed'), T('אין הרשאה לקובץ', 'You have no permission for the file')],
        why: [null, T('הקובץ במקומו, רק לא שמרתם.', 'The file is fine, you just did not save.'), T('זו הגנה רגילה, לא קריסה.', 'It is a normal safeguard, not a crash.'), T('הודעת הרשאות נראית אחרת.', 'A permission error looks different.')] },
      { type: 'scenario', prompt: T('הרסתם את הקובץ בטעות ורוצים לצאת בלי לשמור כלום. מה מקלידים?', 'You messed up the file and want to quit without saving anything. What do you type?'), hint: T('q עם סימן קריאה', 'q with an exclamation mark'), accept: [':q!'] },
    ] },
    { title: T('תזוזה', 'Moving around'), exercises: [
      { type: 'teach', cmd: 'h j k l', name: 'movement', text: T('במצב פקודות זזים עם h (שמאלה), j (למטה), k (למעלה), l (ימינה). w קופצת למילה הבאה, 0 לתחילת השורה ו־$ לסוף שלה. גם החצים עובדים.', 'In command mode you move with h (left), j (down), k (up), l (right). w jumps to the next word, 0 to the start of the line and $ to its end. The arrow keys work too.') },
      { type: 'match', prompt: T('התאימו כל מקש לכיוון', 'Match each key to its direction'), pairs: [['h', T('שמאלה', 'left')], ['j', T('למטה', 'down')], ['k', T('למעלה', 'up')], ['l', T('ימינה', 'right')]] },
      { type: 'sentence', prompt: READ, text: T('במצב פקודות של vi, המקש ___ מזיז את הסמן שורה אחת למטה.', 'In vi command mode, the ___ key moves the cursor one line down.'), options: ['j', 'k', 'h'], answer: 'j' },
      { type: 'choice', prompt: T('איך קופצים לסוף השורה הנוכחית?', 'How do you jump to the end of the current line?'), options: ['$', '0', 'G', 'w'], answer: '$',
        why: { 0: T('0 היא תחילת השורה.', '0 is the start of the line.'), G: T('G היא השורה האחרונה בקובץ.', 'G is the last line of the file.'), w: T('w היא המילה הבאה.', 'w is the next word.') } },
      { type: 'match', prompt: T('התאימו כל מקש לאן הוא קופץ', 'Match each key to where it jumps'), pairs: [['w', T('המילה הבאה', 'the next word')], ['b', T('המילה הקודמת', 'the previous word')], ['0', T('תחילת השורה', 'start of the line')], ['$', T('סוף השורה', 'end of the line')]] },
      { type: 'scenario', prompt: T('אתם במצב פקודות. איזה מקש מזיז את הסמן שורה אחת למעלה?', 'You are in command mode. Which key moves the cursor one line up?'), hint: T('בין j ל־l', 'Between j and l'), accept: ['k'] },
    ] },
    { title: T('תרגול', 'Practice'), exercises: [
      { type: 'teach', cmd: 'vi file', name: 'open a file', text: T('vi notes.txt פותחת את הקובץ, ואם הוא לא קיים, יוצרת אותו כשתשמרו. vim הוא vi משופר, ו־nano עורך פשוט יותר שמציג את הקיצורים בתחתית.', 'vi notes.txt opens the file, and creates it when you save if it does not exist. vim is an improved vi, and nano is a simpler editor that lists its shortcuts at the bottom.') },
      { type: 'scenario', prompt: T('פתחו את config.ini לעריכה ב־vi', 'Open config.ini for editing in vi'), hint: T('vi ואחריו שם הקובץ', 'vi, then the file name'), accept: ['vi config.ini', 'vim config.ini'] },
      { type: 'sentence', prompt: READ, text: T('כדי לערוך את notes.txt בעורך שקיים בכל שרת, כותבים ___ notes.txt.', 'To edit notes.txt in the editor found on every server, type ___ notes.txt.'), options: ['vi', 'cat', 'less'], answer: 'vi' },
      { type: 'choice', prompt: T('מה הסדר הנכון כדי להוסיף מילה לקובץ ב־vi ולשמור?', 'What is the right order to add a word to a file in vi and save?'), plain: true,
        options: [T('i, להקליד, Esc, ‏:wq', 'i, type, Esc, :wq'), T('להקליד, ‏:wq', 'type, :wq'), T(':wq, ‏i, להקליד', ':wq, i, type'), T('Esc, להקליד, ‏:q!', 'Esc, type, :q!')],
        why: [null, T('בלי i המקשים הם פקודות.', 'Without i, keys are commands.'), T(':wq בהתחלה יוצאת לפני שכתבתם.', ':wq first quits before you typed.'), T(':q! זורקת את מה שכתבתם.', ':q! throws away what you typed.')] },
      { type: 'match', prompt: T('התאימו כל עורך לתיאור שלו', 'Match each editor to its description'), pairs: [['vi', T('קיים כמעט בכל שרת', 'on almost every server')], ['vim', T('vi משופר', 'an improved vi')], ['nano', T('פשוט, עם קיצורים בתחתית', 'simple, shortcuts at the bottom')], ['EDITOR', T('משתנה שבוחר עורך ברירת מחדל', 'a variable that picks the default editor')]] },
      { type: 'scenario', prompt: T('סיימתם לכתוב והסמן במצב כתיבה. מה לוחצים לפני ‎:wq‎?', 'You finished typing and you are in insert mode. What do you press before :wq?'), hint: T('המקש שחוזר למצב פקודות', 'The key that goes back to command mode'), accept: ['Esc', 'esc', 'ESC'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('נכנסים ל־vi ויוצאים ממנו בשלום.', 'Getting into vi and out of it safely.'), exercises: [
    { type: 'scenario', prompt: T('פתחו את הקובץ todo.txt ב־vi', 'Open the file todo.txt in vi'), hint: T('vi todo.txt', 'vi todo.txt'), accept: ['vi todo.txt', 'vim todo.txt'] },
    { type: 'scenario', prompt: T('אתם במצב פקודות. עברו למצב כתיבה בשורה חדשה מתחת לשורה הנוכחית', 'You are in command mode. Switch to insert mode on a new line below the current one'), hint: T('האות o', 'The letter o'), accept: ['o'] },
    { type: 'scenario', prompt: T('חזרתם למצב פקודות. שמרו וצאו', 'You are back in command mode. Save and quit'), hint: T(':wq', ':wq'), accept: [':wq', ':x', 'ZZ'] },
  ] },
};

const UNIT_18 = {
  section: 2, unit: 18, exams: ['L103.8'], title: T('vi: לערוך מהר', 'vi: edit fast'), subtitle: T('מחיקה, העתקה, חיפוש והחלפה', 'Deleting, copying, searching and replacing'), color: 'blue', fixture: textFixture,
  lessons: [
    { title: T('מחיקה ו־undo', 'Delete and undo'), exercises: [
      { type: 'teach', cmd: 'dd', name: 'delete line', text: T('במצב פקודות: x מוחקת תו, dd מוחקת את כל השורה, dw מוחקת מילה, ו־u מבטלת את הפעולה האחרונה. מספר לפני פקודה חוזר עליה: 3dd מוחקת 3 שורות.', 'In command mode: x deletes a character, dd deletes the whole line, dw deletes a word, and u undoes the last action. A number before a command repeats it: 3dd deletes 3 lines.') },
      { type: 'match', prompt: T('התאימו כל פקודה למה שהיא מוחקת', 'Match each command to what it deletes'), pairs: [['x', T('תו אחד', 'one character')], ['dw', T('מילה', 'a word')], ['dd', T('שורה', 'a line')], ['3dd', T('שלוש שורות', 'three lines')]] },
      { type: 'sentence', prompt: READ, text: T('המקש ___ מבטל את הפעולה האחרונה ב־vi.', 'The ___ key undoes the last action in vi.'), options: ['u', 'z', 'r'], answer: 'u' },
      { type: 'choice', prompt: T('מחקתם שורה חשובה עם dd בטעות. מה עושים?', 'You deleted an important line with dd by mistake. What do you do?'), options: ['u', ':q', 'dd', 'p'], answer: 'u',
        why: { ':q': T('‎:q‎ לא תצא כשיש שינויים, וגם לא תחזיר את השורה.', ':q will not quit with changes, and will not bring the line back.'), dd: T('זה ימחק עוד שורה.', 'That deletes another line.'), p: T('p תדביק את השורה, אבל במקום אחר: מתחת לסמן.', 'p pastes the line, but below the cursor, not where it was.') } },
      { type: 'scenario', prompt: T('מחקו את השורה שהסמן עומד עליה', 'Delete the line the cursor is on'), hint: T('d פעמיים', 'd twice'), accept: ['dd'] },
      { type: 'scenario', prompt: T('מחקו 5 שורות, החל מהשורה הנוכחית', 'Delete 5 lines, starting from the current one'), hint: T('מספר ואז dd', 'A number, then dd'), accept: ['5dd'] },
    ] },
    { title: T('העתקה והדבקה', 'Copy and paste'), exercises: [
      { type: 'teach', cmd: 'yy p', name: 'yank and put', text: T('yy מעתיקה (yank) את השורה, ו־p מדביקה מתחת לסמן (P מעל). dd גם שומרת את מה שמחקה, אז dd ואחריה p היא "גזירה והדבקה".', 'yy copies (yanks) the line, and p pastes below the cursor (P above). dd also keeps what it deleted, so dd then p is "cut and paste".') },
      { type: 'match', prompt: T('התאימו כל פקודה למה שהיא עושה', 'Match each command to what it does'), pairs: [['yy', T('מעתיקה שורה', 'copies a line')], ['p', T('מדביקה מתחת', 'pastes below')], ['P', T('מדביקה מעל', 'pastes above')], ['yw', T('מעתיקה מילה', 'copies a word')]] },
      { type: 'sentence', prompt: READ, text: T('ב־vi, הפקודה ___ מעתיקה את כל השורה.', 'In vi, the ___ command copies the whole line.'), options: ['yy', 'cc', 'pp'], answer: 'yy' },
      { type: 'choice', prompt: T('איך מזיזים שורה אחת למטה בקובץ?', 'How do you move a line one place down in the file?'), options: ['dd ואז p', 'yy ואז P', 'p ואז dd', 'u ואז p'].map((o, i) => ['dd then p', 'yy then P', 'p then dd', 'u then p'][i]), answer: 'dd then p',
        why: { 'yy then P': T('זה משכפל את השורה מעל, לא מזיז.', 'That duplicates the line above, it does not move it.'), 'p then dd': T('קודם צריך לגזור, אחר כך להדביק.', 'Cut first, then paste.'), 'u then p': T('u מבטלת, היא לא גוזרת.', 'u undoes, it does not cut.') } },
      { type: 'scenario', prompt: T('העתיקו את השורה הנוכחית', 'Copy the current line'), hint: T('y פעמיים', 'y twice'), accept: ['yy', 'Y'] },
      { type: 'scenario', prompt: T('הדביקו את מה שהעתקתם מתחת לשורה הנוכחית', 'Paste what you copied below the current line'), hint: T('האות של put', 'The letter for put'), accept: ['p'] },
    ] },
    { title: T('חיפוש', 'Search'), exercises: [
      { type: 'teach', cmd: '/word', name: 'search', text: T('במצב פקודות, ‎/error‎ ואז Enter קופצת להופעה הבאה של error. n עוברת להופעה הבאה ו־N לקודמת. ‎?error‎ מחפשת אחורה.', 'In command mode, /error then Enter jumps to the next error. n goes to the next match and N to the previous one. ?error searches backwards.') },
      { type: 'scenario', prompt: T('חפשו בקובץ את המילה port', 'Search the file for the word port'), hint: T('לוכסן ואז המילה', 'A slash, then the word'), accept: ['/port'] },
      { type: 'sentence', prompt: READ, text: T('אחרי חיפוש, המקש ___ קופץ להופעה הבאה.', 'After a search, the ___ key jumps to the next match.'), options: ['n', 'j', 'w'], answer: 'n' },
      { type: 'match', prompt: T('התאימו כל פקודה לכיוון החיפוש', 'Match each command to its search direction'), pairs: [['/x', T('חיפוש קדימה', 'search forward')], ['?x', T('חיפוש אחורה', 'search backward')], ['n', T('ההופעה הבאה', 'next match')], ['N', T('ההופעה הקודמת', 'previous match')]] },
      { type: 'choice', prompt: T('איך קופצים לשורה הראשונה ולשורה האחרונה בקובץ?', 'How do you jump to the first and the last line of the file?'), options: ['gg and G', '0 and $', 'k and j', 'H and L'], answer: 'gg and G',
        why: { '0 and $': T('אלה תחילת השורה וסוף השורה.', 'Those are the start and end of the line.'), 'k and j': T('אלה שורה אחת למעלה או למטה.', 'Those move one line up or down.'), 'H and L': T('אלה החלק העליון והתחתון של המסך, לא של הקובץ.', 'Those are the top and bottom of the screen, not the file.') } },
      { type: 'scenario', prompt: T('קפצו לשורה האחרונה של הקובץ', 'Jump to the last line of the file'), hint: T('G גדולה', 'Capital G'), accept: ['G'] },
    ] },
    { title: T('החלפה', 'Replace'), exercises: [
      { type: 'teach', cmd: ':%s', name: 'substitute', text: T('‎:s/old/new/‎ מחליפה בשורה הנוכחית, ו־‎:%s/old/new/g‎ מחליפה בכל הקובץ, בדיוק כמו sed. ‎:set number‎ מציגה מספרי שורות, ו־‎:10‎ קופצת לשורה 10.', ':s/old/new/ replaces on the current line, and :%s/old/new/g replaces in the whole file, just like sed. :set number shows line numbers, and :10 jumps to line 10.') },
      { type: 'scenario', prompt: T('החליפו בכל הקובץ את localhost ב־127.0.0.1', 'Replace localhost with 127.0.0.1 in the whole file'), hint: T(':%s/localhost/127.0.0.1/g', ':%s/localhost/127.0.0.1/g'), accept: [':%s/localhost/127.0.0.1/g', ':%s/localhost/127.0.0.1/'] },
      { type: 'sentence', prompt: READ, text: T('ב־‎:%s/a/b/g‎, הסימן ___ אומר "בכל השורות".', 'In :%s/a/b/g, the ___ sign means "on every line".'), options: ['%', 'g', 's'], answer: '%' },
      { type: 'match', prompt: T('התאימו כל פקודה למה שהיא עושה', 'Match each command to what it does'), pairs: [[':%s/a/b/g', T('מחליפה בכל הקובץ', 'replaces in the whole file')], [':set number', T('מציגה מספרי שורות', 'shows line numbers')], [':10', T('קופצת לשורה 10', 'jumps to line 10')], [':w new.txt', T('שומרת לקובץ חדש', 'saves to a new file')]] },
      { type: 'choice', prompt: T('מה ההבדל בין ‎:%s/a/b/‎ לבין ‎:%s/a/b/g‎?', 'What is the difference between :%s/a/b/ and :%s/a/b/g?'), plain: true,
        options: [T('בלי g מוחלפת רק ההופעה הראשונה בכל שורה', 'Without g only the first match on each line is replaced'), T('בלי g מוחלפת רק השורה הראשונה', 'Without g only the first line is replaced'), T('אין הבדל', 'There is no difference'), T('g שומרת את הקובץ', 'g saves the file')],
        why: [null, T('% כבר אומר "כל השורות".', '% already means "every line".'), T('g משנה כמה הופעות בכל שורה.', 'g changes how many matches per line.'), T('g היא global, לא שמירה.', 'g means global, not save.')] },
      { type: 'scenario', prompt: T('הציגו מספרי שורות ב־vi', 'Show line numbers in vi'), hint: T(':set number', ':set number'), accept: [':set number', ':set nu'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('עורכים קובץ הגדרות ב־vi, בלי עכבר.', 'Editing a config file in vi, no mouse.'), exercises: [
    { type: 'scenario', prompt: T('קפצו לשורה 3 של הקובץ', 'Jump to line 3 of the file'), hint: T('נקודתיים ומספר', 'A colon and a number'), accept: [':3', '3G'] },
    { type: 'scenario', prompt: T('החליפו בכל הקובץ את true ב־false', 'Replace true with false in the whole file'), hint: T(':%s/true/false/g', ':%s/true/false/g'), accept: [':%s/true/false/g', ':%s/true/false/'] },
    { type: 'scenario', prompt: T('שמרו את הקובץ בשם חדש, config.bak, בלי לצאת', 'Save the file under a new name, config.bak, without quitting'), hint: T(':w ושם הקובץ', ':w and the file name'), accept: [':w config.bak'] },
  ] },
};

const UNIT_19 = {
  section: 2, unit: 19, exams: ['L103.2'], title: T('עוד כלים לטקסט', 'More text tools'), subtitle: T('diff, comm, paste, nl ובדיקת שלמות', 'diff, comm, paste, nl and checksums'), color: 'green', fixture: textFixture,
  lessons: [
    { title: T('diff ו־cmp', 'diff and cmp'), exercises: [
      { type: 'teach', cmd: 'diff', name: 'difference', text: T('משווה שני קבצים ומדפיסה מה השתנה. ‎2c2‎ אומר ששורה 2 השתנתה, < היא מהקובץ הראשון ו־> מהשני. ‎diff -u‎ מדפיסה בפורמט שבו - הוסר ו־+ נוסף. אם אין הבדל, אין פלט.', 'Compares two files and prints what changed. 2c2 means line 2 changed, < is from the first file and > from the second. diff -u prints a format where - was removed and + added. If nothing differs, there is no output.') },
      { type: 'output', prompt: T('ב־a.txt כתוב apple, banana, cherry. ב־b.txt כתוב apple, blueberry, cherry. הפלט הוקלט על לינוקס אמיתי. מה הודפס?', 'a.txt says apple, banana, cherry. b.txt says apple, blueberry, cherry. This was recorded on real Linux. What was printed?'), rec: 'ubuntu-diff', wrongRec: ['ubuntu-diff-u', 'ubuntu-comm'] },
      { type: 'sentence', prompt: READ, text: T('בפלט של diff, שורה שמתחילה ב־___ באה מהקובץ השני.', 'In diff output, a line starting with ___ comes from the second file.'), options: ['>', '<', '-'], answer: '>' },
      { type: 'output', prompt: T('אותם a.txt ו־b.txt, הפעם עם ‎diff -u‎ (בלי שתי שורות הכותרת). מה הודפס?', 'The same a.txt and b.txt, this time with diff -u (without the two header lines). What was printed?'), rec: 'ubuntu-diff-u', wrongRec: ['ubuntu-diff', 'ubuntu-comm-12'] },
      { type: 'teach', cmd: 'cmp', name: 'compare', text: T('cmp משווה בייט אחרי בייט ואומרת רק איפה ההבדל הראשון. טובה לקבצים בינאריים.', 'cmp compares byte by byte and only says where the first difference is. Good for binary files.') },
      { type: 'output', prompt: T('אותם a.txt ו־b.txt. מה תדפיס ‎cmp a.txt b.txt‎?', 'The same a.txt and b.txt. What will cmp a.txt b.txt print?'), rec: 'ubuntu-cmp', wrongRec: ['ubuntu-diff'], wrongText: ['a.txt b.txt are identical'] },
      { type: 'scenario', prompt: T('הציגו את ההבדלים בין old.conf ל־new.conf בפורמט המאוחד (עם + ו־-)', 'Show the differences between old.conf and new.conf in unified format (with + and -)'), hint: T('diff -u', 'diff -u'), accept: ['diff -u old.conf new.conf'] },
    ] },
    { title: T('comm ו־join', 'comm and join'), exercises: [
      { type: 'teach', cmd: 'comm', name: 'common', text: T('comm משווה שני קבצים ממוינים ומדפיסה שלוש עמודות: רק בראשון, רק בשני, ובשניהם. ‎-12‎ מסתירה את עמודות 1 ו־2, ונשאר רק מה שמשותף.', 'comm compares two sorted files and prints three columns: only in the first, only in the second, and in both. -12 hides columns 1 and 2, leaving only what is shared.') },
      { type: 'output', prompt: T('a.txt: apple, banana, cherry. ‏b.txt: apple, blueberry, cherry. מה הודפס על לינוקס אמיתי?', 'a.txt: apple, banana, cherry. b.txt: apple, blueberry, cherry. What was printed on real Linux?'), rec: 'ubuntu-comm-12', wrongRec: ['ubuntu-comm'], wrongText: ['banana\nblueberry'] },
      { type: 'sentence', prompt: READ, text: T('comm ___ מדפיסה רק את השורות שיש בשני הקבצים.', 'comm ___ prints only the lines found in both files.'), options: ['-12', '-3', '-u'], answer: '-12' },
      { type: 'teach', cmd: 'join', name: 'join', text: T('join מחברת שורות משני קבצים לפי עמודה משותפת, כמו טבלאות. כברירת מחדל לפי העמודה הראשונה, והקבצים צריכים להיות ממוינים לפיה.', 'join merges lines from two files on a shared field, like tables. By default it uses the first field, and both files must be sorted on it.') },
      { type: 'output', prompt: T('ב־names.txt: ‏1 dana, ‏2 omer, ‏3 noa. ב־cities.txt: ‏1 haifa, ‏2 tel-aviv, ‏3 eilat. מה הודפס על לינוקס אמיתי?', 'names.txt: 1 dana, 2 omer, 3 noa. cities.txt: 1 haifa, 2 tel-aviv, 3 eilat. What was printed on real Linux?'), rec: 'ubuntu-join', wrongText: ['1 dana\n2 omer\n3 noa\n1 haifa\n2 tel-aviv\n3 eilat', 'dana haifa\nomer tel-aviv\nnoa eilat'] },
      { type: 'match', prompt: T('התאימו כל פקודה למה שהיא עושה', 'Match each command to what it does'), pairs: [['diff', T('מה השתנה בין קבצים', 'what changed between files')], ['comm', T('מה משותף ומה לא', 'what is shared and what is not')], ['join', T('מחברת לפי עמודה', 'merges on a field')], ['cmp', T('ההבדל הראשון בבייטים', 'the first byte difference')]] },
    ] },
    { title: T('nl, paste ו־split', 'nl, paste and split'), exercises: [
      { type: 'teach', cmd: 'nl', name: 'number lines', text: T('nl מוסיפה מספר לכל שורה, כמו cat -n, אבל בלי למספר שורות ריקות.', 'nl numbers each line, like cat -n, but skips empty lines.'), demo: [[], 'nl notes.txt'] },
      { type: 'output', prompt: WHAT, cmd: 'paste -d , notes.txt contacts.txt', wrongCmds: ['paste -d , contacts.txt notes.txt', 'cat notes.txt contacts.txt'] },
      { type: 'sentence', prompt: READ, text: T('הפקודה ___ מצמידה שורות משני קבצים זו לצד זו.', 'The ___ command puts lines from two files side by side.'), options: ['paste', 'cat', 'join'], answer: 'paste' },
      { type: 'teach', cmd: 'paste', name: 'paste', text: T('paste מצמידה את שורה 1 של כל קובץ, אחר כך את שורה 2 וכן הלאה, עם טאב באמצע (או ‎-d‎ למפריד אחר). ‎paste -s‎ הופכת קובץ שלם לשורה אחת.', 'paste joins line 1 of each file, then line 2 and so on, with a tab in between (or -d for another separator). paste -s turns a whole file into one line.'), demo: [[], 'paste -s -d , fruits.txt'] },
      { type: 'output', prompt: T('ב־nums.txt יש את המספרים 1 עד 10, שורה לכל מספר. ‎split -l 4‎ חותכת אותו לקבצים של 4 שורות. מה הודפס על לינוקס אמיתי?', 'nums.txt has the numbers 1 to 10, one per line. split -l 4 cuts it into files of 4 lines. What was printed on real Linux?'), rec: 'ubuntu-split', wrongText: ['part_aa\npart_ab\npart_ac\n9\n10\n11\n12', 'part_aa\npart_ab\n9\n10'] },
      { type: 'terminal', prompt: T('הציגו את notes.txt כשמספר לפני כל שורה, עם nl', 'Show notes.txt with a number before each line, using nl'), hint: T('nl notes.txt', 'nl notes.txt'), goal: (sh, log) => shows(log, 'nl notes.txt'), solve: ['nl notes.txt'] },
    ] },
    { title: T('בדיקת שלמות ובינארי', 'Checksums and binary'), exercises: [
      { type: 'teach', cmd: 'sha256sum', name: 'checksum', text: T('sha256sum (וגם md5sum) מחשבת "טביעת אצבע" לקובץ. אם שינו בו אפילו תו אחד, הטביעה שונה לגמרי. ‎sha256sum -c SUMS‎ בודקת קבצים מול רשימה שמורה, וכך מוודאים שהורדה לא נפגמה.', 'sha256sum (and md5sum) computes a "fingerprint" of a file. Change even one character and the fingerprint is completely different. sha256sum -c SUMS checks files against a saved list, which is how you verify a download.') },
      { type: 'output', prompt: T('ב־hello.txt כתוב hello. מה תדפיס sha256sum על לינוקס אמיתי?', 'hello.txt says hello. What will sha256sum print on real Linux?'), rec: 'ubuntu-sha256', wrongRec: ['ubuntu-md5'], wrongText: ['hello.txt: OK'] },
      { type: 'sentence', prompt: READ, text: T('‎sha256sum ___ SUMS‎ בודקת שהקבצים לא השתנו.', 'sha256sum ___ SUMS checks that the files did not change.'), options: ['-c', '-v', '-s'], answer: '-c' },
      { type: 'output', prompt: T('שמרו את הטביעה של hello.txt בקובץ SUMS, ואחר כך שינו את התוכן ל־hello!. מה תדפיס ‎sha256sum -c SUMS‎?', 'The fingerprint of hello.txt was saved in SUMS, then its content was changed to hello!. What will sha256sum -c SUMS print?'), rec: 'ubuntu-sha256-check', wrongRec: ['ubuntu-sha256-ok', 'ubuntu-sha256'] },
      { type: 'teach', cmd: 'xxd od', name: 'hex dump', text: T('xxd ו־od מציגות את הבייטים של קובץ, גם תווים שלא רואים. בפלט, ‎0a‎ (או ‎\\n‎ ב־od -c) הוא סוף שורה.', 'xxd and od show a file\'s bytes, including characters you cannot see. In the output, 0a (or \\n in od -c) is the end of a line.') },
      { type: 'output', prompt: T('ב־hi.txt כתוב Hi! ואחריו סוף שורה. מה תדפיס xxd על לינוקס אמיתי?', 'hi.txt contains Hi! and an end of line. What will xxd print on real Linux?'), rec: 'ubuntu-xxd', wrongRec: ['ubuntu-od'], wrongText: ['Hi!'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('בודקים שקבצים הגיעו שלמים.', 'Checking that files arrived intact.'), exercises: [
    { type: 'scenario', prompt: T('חשבו את טביעת ה־SHA-256 של הקובץ ubuntu.iso', 'Compute the SHA-256 fingerprint of ubuntu.iso'), hint: T('sha256sum', 'sha256sum'), accept: ['sha256sum ubuntu.iso'] },
    { type: 'scenario', prompt: T('בדקו את כל הקבצים מול הרשימה SHA256SUMS', 'Check every file against the list SHA256SUMS'), rec: 'ubuntu-sha256-ok', hint: T('sha256sum -c', 'sha256sum -c'), accept: ['sha256sum -c SHA256SUMS'] },
    { type: 'terminal', prompt: T('צרו מ־fruits.txt שורה אחת שבה הפירות מופרדים בפסיקים', 'Turn fruits.txt into one line with the fruits separated by commas'), hint: T('paste -s -d , fruits.txt', 'paste -s -d , fruits.txt'), goal: (sh, log) => shows(log, 'paste -s -d , fruits.txt'), solve: ['paste -s -d , fruits.txt'] },
  ] },
};

const UNIT_20 = {
  section: 2, unit: 20, exams: ['L103.3', 'R', 'F'], title: T('ארכיונים ודחיסה', 'Archives and compression'), subtitle: T('tar, gzip, bzip2, xz ו־zip', 'tar, gzip, bzip2, xz and zip'), color: 'purple', fixture: textFixture,
  lessons: [
    { title: T('tar', 'tar'), exercises: [
      { type: 'teach', cmd: 'tar', name: 'tape archive', text: T('tar אורזת הרבה קבצים לקובץ אחד. ‎-c‎ יוצרת, ‎-t‎ מציגה מה בפנים, ‎-x‎ פורסת, ‎-f‎ היא שם הארכיון, ‎-v‎ מפרטת, ו־‎-z‎ דוחסת עם gzip. לכן ‎tar -czf a.tar.gz dir‎.', 'tar packs many files into one. -c creates, -t lists what is inside, -x extracts, -f names the archive, -v is verbose, and -z compresses with gzip. Hence tar -czf a.tar.gz dir.') },
      { type: 'output', prompt: T('בתיקייה project יש README.md ותיקייה src עם app.py. מה הודפס על לינוקס אמיתי (ממוין)?', 'project has README.md and a src folder with app.py. What was printed on real Linux (sorted)?'), rec: 'ubuntu-tar-c', wrongText: ['project.tar.gz', 'README.md\napp.py'] },
      { type: 'sentence', prompt: READ, text: T('ב־tar, האפשרות ___ פורסת את הארכיון.', 'In tar, the ___ option extracts the archive.'), options: ['-x', '-c', '-t'], answer: '-x' },
      { type: 'match', prompt: T('התאימו כל אפשרות של tar למה שהיא עושה', 'Match each tar option to what it does'), pairs: [['-c', T('יוצרת ארכיון', 'creates an archive')], ['-t', T('מציגה מה בפנים', 'lists the contents')], ['-x', T('פורסת', 'extracts')], ['-z', T('דוחסת עם gzip', 'compresses with gzip')]] },
      { type: 'choice', prompt: T('איזו פקודה אורזת ודוחסת את התיקייה logs לקובץ logs.tar.gz?', 'Which command packs and compresses the logs folder into logs.tar.gz?'), options: ['tar -czf logs.tar.gz logs', 'tar -xzf logs.tar.gz logs', 'tar -czf logs logs.tar.gz', 'gzip logs'], answer: 'tar -czf logs.tar.gz logs',
        why: { 'tar -xzf logs.tar.gz logs': T('‎-x‎ פורסת, לא יוצרת.', '-x extracts, it does not create.'), 'tar -czf logs logs.tar.gz': T('אחרי ‎-f‎ בא שם הארכיון, אחר כך מה לארוז.', 'After -f comes the archive name, then what to pack.'), 'gzip logs': T('gzip דוחסת קובץ אחד, לא תיקייה.', 'gzip compresses one file, not a folder.') } },
      { type: 'scenario', prompt: T('ארזו ודחסו את התיקייה docs לקובץ docs.tar.gz', 'Pack and compress the docs folder into docs.tar.gz'), hint: T('tar -czf ואז שם הארכיון', 'tar -czf, then the archive name'), accept: ['tar -czf docs.tar.gz docs', 'tar -czvf docs.tar.gz docs', 'tar czf docs.tar.gz docs', 'tar -zcf docs.tar.gz docs'] },
    ] },
    { title: T('להציג ולפרוס', 'List and extract'), exercises: [
      { type: 'teach', cmd: 'tar -xzf', name: 'extract', text: T('‎tar -tzf a.tar.gz‎ מציגה מה יש בארכיון בלי לפרוס. ‎tar -xzf a.tar.gz‎ פורסת לתיקייה הנוכחית, ו־‎-C dir‎ פורסת לתיקייה אחרת.', 'tar -tzf a.tar.gz lists the archive without extracting. tar -xzf a.tar.gz extracts into the current folder, and -C dir extracts somewhere else.') },
      { type: 'output', prompt: T('project.tar.gz נוצר מהתיקייה project (עם README.md ו־src/app.py). מה הודפס על לינוקס אמיתי (ממוין)?', 'project.tar.gz was made from project (with README.md and src/app.py). What was printed on real Linux (sorted)?'), rec: 'ubuntu-tar-t', wrongRec: ['ubuntu-tar-x'], wrongText: ['project.tar.gz'] },
      { type: 'sentence', prompt: READ, text: T('כדי לפרוס ארכיון לתיקייה אחרת מוסיפים ___ ואת שם התיקייה.', 'To extract an archive into another folder, add ___ and the folder name.'), options: ['-C', '-d', '-o'], answer: '-C' },
      { type: 'output', prompt: T('פורסים את project.tar.gz לתוך התיקייה הריקה restore. מה הודפס על לינוקס אמיתי?', 'project.tar.gz is extracted into the empty folder restore. What was printed on real Linux?'), rec: 'ubuntu-tar-x', wrongRec: ['ubuntu-tar-t'], wrongText: ['restore\nrestore/app.py'] },
      { type: 'choice', prompt: T('קיבלתם קובץ backup.tar.gz ואתם לא בטוחים מה יש בו. מה הכי בטוח לעשות קודם?', 'You got backup.tar.gz and you are not sure what is inside. What is safest to do first?'), options: ['tar -tzf backup.tar.gz', 'tar -xzf backup.tar.gz', 'gunzip backup.tar.gz', 'rm backup.tar.gz'], answer: 'tar -tzf backup.tar.gz',
        why: { 'tar -xzf backup.tar.gz': T('פריסה עלולה לדרוס קבצים קיימים.', 'Extracting could overwrite existing files.'), 'gunzip backup.tar.gz': T('זה רק מסיר את הדחיסה, עדיין לא רואים מה בפנים.', 'That only removes the compression, you still cannot see inside.'), 'rm backup.tar.gz': T('זה מוחק אותו.', 'That deletes it.') } },
      { type: 'scenario', prompt: T('פרסו את site.tar.gz לתוך התיקייה ‎/var/www', 'Extract site.tar.gz into the /var/www folder'), hint: T('tar -xzf ואז ‎-C', 'tar -xzf, then -C'), accept: ['tar -xzf site.tar.gz -C /var/www', 'tar -xzvf site.tar.gz -C /var/www', 'tar xzf site.tar.gz -C /var/www', 'tar -zxf site.tar.gz -C /var/www'] },
    ] },
    { title: T('gzip, bzip2 ו־xz', 'gzip, bzip2 and xz'), exercises: [
      { type: 'teach', cmd: 'gzip', name: 'compress', text: T('gzip דוחסת קובץ אחד ומחליפה אותו בקובץ ‎.gz. gunzip (או gzip -d) מחזירה. ‎-k‎ משאירה גם את המקור, ו־zcat מציגה קובץ דחוס בלי לפתוח אותו. bzip2 ו־xz עובדות אותו דבר, דוחסות יותר וקצת לאט יותר.', 'gzip compresses one file and replaces it with a .gz file. gunzip (or gzip -d) restores it. -k keeps the original too, and zcat shows a compressed file without unpacking it. bzip2 and xz work the same way, compress more and run a bit slower.') },
      { type: 'output', prompt: T('בתיקייה יש רק nums.txt. מה תדפיס ls אחרי gzip על לינוקס אמיתי?', 'The folder has only nums.txt. What does ls print after gzip, on real Linux?'), rec: 'ubuntu-gzip', wrongRec: ['ubuntu-gzip-k', 'ubuntu-bzip2'] },
      { type: 'sentence', prompt: READ, text: T('gzip ___ דוחסת ומשאירה גם את הקובץ המקורי.', 'gzip ___ compresses and keeps the original file too.'), options: ['-k', '-d', '-c'], answer: '-k' },
      { type: 'output', prompt: T('ב־notes.txt.gz דחוסות השורות line one ו־line two. מה תדפיס zcat על לינוקס אמיתי?', 'notes.txt.gz holds the lines line one and line two. What will zcat print on real Linux?'), rec: 'ubuntu-zcat', wrongText: ['notes.txt', 'notes.txt.gz'] },
      { type: 'match', prompt: T('התאימו כל סיומת לכלי שיצר אותה', 'Match each extension to the tool that made it'), pairs: [['.gz', 'gzip'], ['.bz2', 'bzip2'], ['.xz', 'xz'], ['.zip', 'zip']] },
      { type: 'match', prompt: T('התאימו כל פקודה ל־tar לסוג הדחיסה', 'Match each tar flag to its compression'), pairs: [['-z', 'gzip'], ['-j', 'bzip2'], ['-J', 'xz'], ['-a', T('לפי הסיומת', 'by the extension')]] },
    ] },
    { title: T('zip, cpio ו־dd', 'zip, cpio and dd'), exercises: [
      { type: 'teach', cmd: 'zip', name: 'zip', text: T('zip היא הפורמט של חלונות: ‎zip -r a.zip dir‎ אורזת תיקייה, ו־unzip פורסת. cpio היא ארכיון ישן שמקבל רשימת קבצים מהצינור, ו־dd מעתיקה בייטים גולמיים, למשל ליצירת קובץ דיסק או צריבת USB.', 'zip is the Windows format: zip -r a.zip dir packs a folder, and unzip extracts. cpio is an old archiver that takes a file list from a pipe, and dd copies raw bytes, for example to make a disk image or write a USB stick.') },
      { type: 'output', prompt: T('בתיקייה docs יש a.txt ו־b.txt. מה הודפס על לינוקס אמיתי?', 'docs has a.txt and b.txt. What was printed on real Linux?'), rec: 'ubuntu-zip', wrongText: ['docs.zip', 'docs/a.txt\ndocs/b.txt'] },
      { type: 'sentence', prompt: READ, text: T('כדי לארוז תיקייה שלמה ב־zip צריך את האפשרות ___.', 'To pack a whole folder with zip you need the ___ option.'), options: ['-r', '-z', '-a'], answer: '-r' },
      { type: 'output', prompt: T('dd יוצרת קובץ של 4 בלוקים של מגה מאפסים. מה הודפס על לינוקס אמיתי?', 'dd creates a file of 4 one-megabyte blocks of zeros. What was printed on real Linux?'), rec: 'ubuntu-dd', wrongText: ['4194304 disk.img', '4+0 records in\n4+0 records out'] },
      { type: 'choice', prompt: T('מה עושה ‎dd if=ubuntu.iso of=/dev/sdb bs=4M‎?', 'What does dd if=ubuntu.iso of=/dev/sdb bs=4M do?'), plain: true,
        options: [T('כותבת את הקובץ ubuntu.iso ישירות על הדיסק sdb, ומוחקת את מה שהיה עליו', 'Writes ubuntu.iso straight onto the disk sdb, erasing what was on it'), T('מעתיקה את sdb לקובץ', 'Copies sdb into a file'), T('דוחסת את הקובץ', 'Compresses the file'), T('מציגה את גודל הקובץ', 'Shows the file size')],
        why: [null, T('if הוא המקור ו־of היעד. כאן היעד הוא הדיסק.', 'if is the source and of the target. Here the target is the disk.'), T('dd לא דוחסת.', 'dd does not compress.'), T('היא מעתיקה, היא לא מציגה.', 'It copies, it does not show.')] },
      { type: 'scenario', prompt: T('ארזו את התיקייה photos לקובץ photos.zip', 'Pack the photos folder into photos.zip'), hint: T('zip -r', 'zip -r'), accept: ['zip -r photos.zip photos'] },
    ] },
  ],
  boss: { title: CHALLENGE, text: T('גיבוי אמיתי: לארוז, לבדוק, לשחזר.', 'A real backup: pack, check, restore.'), exercises: [
    { type: 'scenario', prompt: T('ארזו ודחסו את ‎/etc לקובץ etc-backup.tar.gz', 'Pack and compress /etc into etc-backup.tar.gz'), hint: T('tar -czf', 'tar -czf'), accept: ['tar -czf etc-backup.tar.gz /etc', 'tar -czvf etc-backup.tar.gz /etc', 'tar czf etc-backup.tar.gz /etc', 'tar -zcf etc-backup.tar.gz /etc'] },
    { type: 'scenario', prompt: T('הציגו מה יש בתוך etc-backup.tar.gz בלי לפרוס', 'List what is inside etc-backup.tar.gz without extracting'), hint: T('tar -tzf', 'tar -tzf'), accept: ['tar -tzf etc-backup.tar.gz', 'tar -tzvf etc-backup.tar.gz', 'tar tzf etc-backup.tar.gz', 'tar -ztf etc-backup.tar.gz', 'tar -tf etc-backup.tar.gz'] },
    { type: 'scenario', prompt: T('פרסו את etc-backup.tar.gz לתוך ‎/tmp/restore', 'Extract etc-backup.tar.gz into /tmp/restore'), hint: T('tar -xzf ואז ‎-C', 'tar -xzf, then -C'), accept: ['tar -xzf etc-backup.tar.gz -C /tmp/restore', 'tar -xzvf etc-backup.tar.gz -C /tmp/restore', 'tar xzf etc-backup.tar.gz -C /tmp/restore', 'tar -zxf etc-backup.tar.gz -C /tmp/restore', 'tar -xf etc-backup.tar.gz -C /tmp/restore'] },
  ] },
};

COURSE.push(UNIT_11, UNIT_12, UNIT_13, UNIT_14, UNIT_15, UNIT_16, UNIT_17, UNIT_18, UNIT_19, UNIT_20);
