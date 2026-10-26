const LANGS = {he:{name:'עברית',short:'עב',dir:'rtl'},en:{name:'English',short:'EN',dir:'ltr'}};
const I18N = {
  he:{"hintBtn": "💡 רמז", "hintExample": "דוגמת שימוש: ", "hintRemoved": "הורדנו שתי תשובות שגויות.", "hintUses": "הפקודות שבתשובה:", "hintedNote": "עניתם עם רמז, אז השאלה תחזור בסבב הבא לחיזוק.","hintStands": "מקור השם: ","missionsTitle": "משימות בטרמינל", "missionsIntro": "12 משימות לפי שלבים 1-12 של Bandit, בטרמינל מדומה. בכל כניסה נוצרת סיסמה חדשה, אז מחפשים אותה בעזרת פקודות.", "openMissions": "משימות בטרמינל ←", "missionBack": "← לכל המשימות", "missionHint": "רמז", "missionPasswordLabel": "הסיסמה שמצאתם", "missionSubmit": "בדיקת סיסמה", "missionSolvedTag": "נפתרה ✓", "missionCorrect": "נכון! מצאתם את הסיסמה.", "missionWrong": "זו לא הסיסמה. המשיכו לחפש.", "missionNext": "למשימה הבאה ←", "missionPractice": "תרגול במשימה ←", "termLabel": "טרמינל מדומה", "termPlaceholder": "הקלידו פקודה ולחצו Enter", "termHelp": "פקודות זמינות: ls, cd, pwd, cat, file, find, grep, sort, uniq, head, tail, wc, cut, tr, strings, base64, awk, sed, du, echo, clear",missionNumber:n=>`משימה ${n}`,missionsDone:(n,total)=>`פתרתם ${n} מתוך ${total}`,termUnsupported:name=>`${name}: הפקודה הזו לא זמינה בטרמינל המדומה. כתבו help לרשימת הפקודות.`,"altWorks": "זו דרך אחרת שנותנת בדיוק את אותה תוצאה.", "ourAnswer": "הפתרון שלנו: ", "yourOutput": "הפלט שלכם על קבצי הדוגמה:", "rightOutput": "הפלט הנכון:", "noOutput": "(אין פלט)","whyNot": "למה לא: ",describes:x=>`זה התיאור של ⁦${x}⁩`,"dailyTitle": "יעד יומי", "goalLabel": "יעד", "backupTitle": "גיבוי ההתקדמות", "backupNote": "ההתקדמות נשמרת רק במכשיר הזה. שמרו קובץ או קוד גיבוי כדי לשחזר אותה במכשיר אחר או אחרי התקנה מחדש.", "backupDownload": "הורדת קובץ גיבוי", "backupCopy": "העתקת קוד גיבוי", "backupRestore": "שחזור מקובץ או מקוד", "backupCopied": "קוד הגיבוי הועתק.", "backupPrompt": "הדביקו כאן את קוד הגיבוי:", "backupConfirm": "השחזור יחליף את ההתקדמות הנוכחית במכשיר. להמשיך?", "backupBad": "הקוד או הקובץ אינם גיבוי תקין של Linux Master.", "reminderTitle": "תזכורת יומית", "reminderNote": "אתר לא יכול להעיר את הטלפון בשעה קבועה, אז מוסיפים ליומן אירוע יומי שמזכיר לתרגל.", "reminderAdd": "הוספה ליומן", "reminderTime": "שעה", "reminderEvent": "תרגול Linux Master",dailyProgress:(done,goal)=>`היום ${done}/${goal}`,streakText:n=>n===1?'יום אחד ברצף':`${n} ימים ברצף`,"banditTitle": "מסלול Bandit", "banditSub": "כל 34 השלבים של Bandit, מה צריך לדעת בכל אחד, וסימון של מה שכבר עברתם. בלי סיסמאות ובלי פתרונות.", "openBandit": "פתיחת המסלול ←", "banditLogin": "כניסה לשלב 0", "banditPage": "דף השלב ↗", "banditPassed": "עברתי", "banditPractice": "תרגול שלב 08 ←", "banditNote": "שלב 08 באפליקציה מתרגל את הכלים שמופיעים כאן.",banditDone:(n,total)=>`עברתם ${n} מתוך ${total} שלבים`,banditStep:n=>`משלב ${n-1} לשלב ${n}`,"modeLabel": "סוג תשובה", "modeChoice": "בחירה", "modeType": "הקלדה", "scopeLabel": "היקף שלב 02", "scopeCore": "ליבה", "scopeAll": "הכל", "typePlaceholder": "הקלידו את הפקודה", "check": "בדיקה", "dontKnow": "לא יודעים, הציגו תשובה", "answerWas": "התשובה: ", "reviewTag": "↻ חזרה", "typeNA": "בשלב הזה התשובות הן תיאורים, ולכן השאלות נשארות בבחירה.", "statsTitle": "הסטטיסטיקה שלכם", "statsAnswered": "נענו", "statsAccuracy": "דיוק", "statsReview": "לחזרה", "weakTitle": "פקודות לחזק", "statsEmpty": "עוד אין נתונים. אחרי כמה סבבים יופיעו כאן נקודות החולשה.",hintNames:list=>`בתשובה מופיעים: ${list}`,toReview:n=>`${n} לחזרה`,weakLine:(cmd,acc,n)=>`\u2066${cmd}\u2069 · ${acc}% מתוך ${n}`,"labTagline": "מעבדת הפקודות שלכם", "heroTitle": "הדרך שלכם<br>לשלוט בטרמינל.", "heroCopy": "לא צריך להכיר פקודות מראש. <strong>לומדים אותן צעד־צעד, עם דוגמאות וטריוויה.</strong>", "terminalHint": "בחרו את המשימה הבאה", "statCorrect": "תשובות נכונות", "statCommands": "פקודות במאגר", "statAccuracy": "דיוק כולל", "chooseLevel": "בוחרים רמת לימוד", "chooseLevelSub": "אפשר להתחיל מהבסיס ולהתקדם בקצב שלכם", "levelsAria": "בחירת רמת לימוד", "startPractice": "מתחילים לתרגל ←", "tutorials": "הדרכות", "tutorialsSub": "בחרו נושא בסרגל וקבלו הסבר ודוגמאות צעד אחר צעד", "openTutorials": "פתיחת ההדרכות ←", "reminder": "תזכורת קטנה", "pill1": "ls · רואים מה יש", "pill2": "cd · עוברים תיקייה", "pill3": "cat · קוראים קובץ", "pill4": "לא צריך לזכור הכול עכשיו", "backHome": "← חזרה למסך הראשי", "tutorialsTitle": "הדרכות Linux Master", "tutorialsIntro": "בחרו נושא בסרגל כדי ללמוד בקצב שלכם.", "tutorialsAria": "נושאי ההדרכות", "searchLabel": "חיפוש במדריך", "searchPlaceholder": "חיפוש פקודה, דגל או הסבר", "quizTitle": "סבב טריוויה", "quizSubtitleDefault": "בחרו את התשובה הנכונה. לומדים גם מהטעויות.", "roundScore": "נכונות בסבב", "nextQ": "השאלה הבאה ←", "toSummary": "לסיכום הסבב ←", "roundDone": "סבב הושלם!", "greatRound": "איזה יופי, סבב חזק!", "playAgain": "לשחק שוב ↻", "homeBtn": "חזרה למסך הראשי", "footer1": "Linux Master · מעבדת פקודות לינוקס", "footer2": "תוכן לימודי מבוסס על מדריך Bandit המצורף", "example": "דוגמה", "examplePrefix": "דוגמה: ", "correct": "נכון! ",levels:{"intro": {"step": "01", "card": "פקודות", "cardDesc": "מה הפקודה עושה, בשפה פשוטה", "title": "פקודות בסיסיות", "note": "<strong>מתחילים מהבסיס.</strong> לומדים שמות של פקודות, מה הן עושות ודוגמה פשוטה.", "subtitle": "נלמד את כל הפקודות במאגר. אחרי כל תשובה תופיע דוגמה קצרה.", "tag": "שלב 01 / פקודות", "tutTitle": "פקודות בסיסיות", "tutDesc": "מה כל פקודה עושה ומתי משתמשים בה."}, "functions": {"step": "02", "card": "פקודה + שימוש", "cardDesc": "אפשרות אחת, למשל ‎ls -a", "title": "פקודה + שימוש", "note": "<strong>שלב שני.</strong> לומדים אפשרויות ותחביר שימוש מתוך המדריך.", "subtitle": "נלמד את כל אפשרויות השימוש שמופיעות במדריך.", "tag": "שלב 02 / פקודה + שימוש", "tutTitle": "פקודה + שימושים", "tutDesc": "לומדים אפשרויות, תחביר ודוגמאות שימוש מתוך המדריך."}, "pipe": {"step": "03", "card": "פקודות יחד", "cardDesc": "מחברים אותן בצינור ‎|", "title": "פקודות יחד", "note": "<strong>שלב שלישי.</strong> מחברים פקודות זו לזו בעזרת צינור ‎|, בלי להוסיף דגלים.", "subtitle": "מעבירים את הפלט של פקודה אחת אל הבאה, בלי דגלים.", "tag": "שלב 03 / פקודות בצינור", "tutTitle": "פקודות יחד", "tutDesc": "הסימן | מעביר את הפלט של פקודה אחת אל הפקודה הבאה."}, "pipeFunction": {"step": "04", "card": "צינור + דגל", "cardDesc": "שרשרת פקודות עם אפשרות אחת", "title": "צינור + דגל אחד", "note": "<strong>שלב רביעי.</strong> מוסיפים דגל אחד לשרשרת פקודות בצינור.", "subtitle": "מחברים פקודות בצינור ומשתמשים בדגל אחד.", "tag": "שלב 04 / צינור + דגל אחד", "tutTitle": "צינור + דגל אחד", "tutDesc": "משלבים צינור עם דגל שמדייק את החיפוש או את הפלט."}, "pro": {"step": "05", "card": "מקצוענות", "cardDesc": "פקודה עם שני דגלים במשימות אמיתיות", "title": "פקודה מקצועית + שני דגלים", "note": "<strong>שלב חמישי.</strong> פותרים תרחישים אמיתיים בעזרת פקודה עם שני דגלים.", "subtitle": "תרגול מקצועי: פקודה אחת עם שני דגלים.", "tag": "שלב 05 / מקצוענות", "tutTitle": "פקודה מקצועית + שני דגלים", "tutDesc": "שתי אפשרויות או יותר בפקודה אחת, בתרחישים אמיתיים."}, "pipeTwoFlag": {"step": "06", "card": "צינור + שני דגלים", "cardDesc": "שילובים מורכבים יותר", "title": "צינור + שני דגלים", "note": "<strong>שלב שישי.</strong> משלבים צינורות עם שני דגלים או יותר.", "subtitle": "משלבים צינור עם כמה דגלים.", "tag": "שלב 06 / צינור + שני דגלים", "tutTitle": "צינור + שני דגלים", "tutDesc": "כמה שלבים בצינור, עם דגלים שמשנים את הפקודות."}, "bandit": {"step": "08", "card": "כלים ל־Bandit", "cardDesc": "כל מה שחסר לשלבים 0-33", "title": "כלים ל־Bandit", "note": "<strong>שלב שמיני.</strong> שמות קבצים מוזרים, find מתקדם, nmap, setuid, cron, לולאות, git, vi ו־‎$0.", "subtitle": "הכלים שצריך כדי לעבור את Bandit עד הסוף.", "tag": "שלב 08 / Bandit", "tutTitle": "כלים ל־Bandit", "tutDesc": "הכלים שמופיעים בשלבים המתקדמים של Bandit."}, "workflow": {"step": "07", "card": "תהליכי עבודה", "cardDesc": "משימות מערכת שלמות", "title": "תהליכי עבודה", "note": "<strong>שלב שביעי.</strong> מחברים כמה פקודות כדי להשלים משימות מערכת שלמות.", "subtitle": "מחברים כמה פקודות למשימה שלמה.", "tag": "שלב 07 / תהליכי עבודה", "tutTitle": "תהליכי עבודה", "tutDesc": "שרשראות פקודות למשימות מערכת שלמות."}},loadMore:(shown,total)=>`הצגת עוד 30 הדרכות (${shown} מתוך ${total})`,step:n=>`שלב ${n}`,describe:m=>`איזו פקודה מתאימה לתיאור:\n${m}?`,whatDoes:name=>`מה עושה הפקודה ${name}?`,whatKey:(key,cmd)=>`מה עושה המקש ${key} בתוך ${cmd}?`,keyTitle:(cmd,key)=>`${cmd}: המקש ${key}`,meaningOf:syntax=>`מה המשמעות של ${syntax}?`,progress:(done,total,size)=>`${done}/${total} הושלמו · סבבים של ${size}`,resultText:n=>`עניתם על ${n} שאלות. כל תשובה היא עוד צעד בהיכרות עם לינוקס.`,resultScore:(points,n)=>`${points} מתוך ${n} נכונות`},
  en:{"hintBtn": "💡 Hint", "hintExample": "Example: ", "hintRemoved": "Two wrong answers removed.", "hintUses": "Commands in the answer:", "hintedNote": "You used a hint, so this question comes back next round for practice.","hintStands": "Name comes from: ","missionsTitle": "Terminal missions", "missionsIntro": "12 missions shaped like Bandit levels 1-12, in a simulated terminal. Each visit plants a new password, so you find it with commands.", "openMissions": "Terminal missions →", "missionBack": "← All missions", "missionHint": "Hint", "missionPasswordLabel": "Password you found", "missionSubmit": "Check password", "missionSolvedTag": "Solved ✓", "missionCorrect": "Correct! You found the password.", "missionWrong": "That isn't the password. Keep looking.", "missionNext": "Next mission →", "missionPractice": "Practice in a mission →", "termLabel": "Simulated terminal", "termPlaceholder": "Type a command and press Enter", "termHelp": "Available commands: ls, cd, pwd, cat, file, find, grep, sort, uniq, head, tail, wc, cut, tr, strings, base64, awk, sed, du, echo, clear",missionNumber:n=>`Mission ${n}`,missionsDone:(n,total)=>`Solved ${n} of ${total}`,termUnsupported:name=>`${name}: this command isn't available in the simulated terminal. Type help for the list.`,"altWorks": "That's a different command with exactly the same result.", "ourAnswer": "Our answer: ", "yourOutput": "Your output on the sample files:", "rightOutput": "The right output:", "noOutput": "(no output)","whyNot": "Why not: ",describes:x=>`That describes ${x}`,"dailyTitle": "Daily goal", "goalLabel": "Goal", "backupTitle": "Back up your progress", "backupNote": "Progress is saved only on this device. Keep a backup file or code to restore it on another device or after reinstalling.", "backupDownload": "Download backup file", "backupCopy": "Copy backup code", "backupRestore": "Restore from file or code", "backupCopied": "Backup code copied.", "backupPrompt": "Paste your backup code here:", "backupConfirm": "Restoring replaces the progress on this device. Continue?", "backupBad": "That code or file isn't a valid Linux Master backup.", "reminderTitle": "Daily reminder", "reminderNote": "A website can't wake your phone at a set time, so this adds a daily calendar event that reminds you to practice.", "reminderAdd": "Add to calendar", "reminderTime": "Time", "reminderEvent": "Practice Linux Master",dailyProgress:(done,goal)=>`Today ${done}/${goal}`,streakText:n=>n===1?'1 day streak':`${n} day streak`,"banditTitle": "Bandit path", "banditSub": "All 34 Bandit levels, what each one needs, and a checkbox for the ones you've passed. No passwords, no solutions.", "openBandit": "Open the path →", "banditLogin": "Log in to level 0", "banditPage": "Level page ↗", "banditPassed": "Passed", "banditPractice": "Practice level 08 →", "banditNote": "Level 08 in the app practices the tools listed here.",banditDone:(n,total)=>`You passed ${n} of ${total} levels`,banditStep:n=>`Level ${n-1} → ${n}`,"modeLabel": "Answer type", "modeChoice": "Choice", "modeType": "Typing", "scopeLabel": "Level 02 scope", "scopeCore": "Core", "scopeAll": "All", "typePlaceholder": "Type the command", "check": "Check", "dontKnow": "I don't know", "answerWas": "Answer: ", "reviewTag": "↻ Review", "typeNA": "This level's answers are descriptions, so its questions stay multiple choice.", "statsTitle": "Your stats", "statsAnswered": "Answered", "statsAccuracy": "Accuracy", "statsReview": "To review", "weakTitle": "Commands to work on", "statsEmpty": "No data yet. After a few rounds your weak spots show up here.",hintNames:list=>`The answer uses: ${list}`,toReview:n=>`${n} to review`,weakLine:(cmd,acc,n)=>`\u2066${cmd}\u2069 · ${acc}% of ${n}`,"labTagline": "Your command lab", "heroTitle": "Your path<br>to mastering the terminal.", "heroCopy": "No prior knowledge needed. <strong>Learn commands step by step, with examples and trivia.</strong>", "terminalHint": "pick your next task", "statCorrect": "Correct answers", "statCommands": "Commands", "statAccuracy": "Accuracy", "chooseLevel": "Choose a level", "chooseLevelSub": "Start from the basics and move at your own pace", "levelsAria": "Choose a learning level", "startPractice": "Start practicing →", "tutorials": "Tutorials", "tutorialsSub": "Pick a topic and get explanations and examples, step by step", "openTutorials": "Open tutorials →", "reminder": "Quick reminder", "pill1": "ls · see what is there", "pill2": "cd · change directory", "pill3": "cat · read a file", "pill4": "No need to remember it all now", "backHome": "← Back to home", "tutorialsTitle": "Linux Master tutorials", "tutorialsIntro": "Pick a topic to learn at your own pace.", "tutorialsAria": "Tutorial topics", "searchLabel": "Search the guide", "searchPlaceholder": "Search a command, flag or explanation", "quizTitle": "Trivia round", "quizSubtitleDefault": "Pick the right answer. Mistakes teach too.", "roundScore": "Correct this round", "nextQ": "Next question →", "toSummary": "Round summary →", "roundDone": "Round complete!", "greatRound": "Great job, strong round!", "playAgain": "Play again ↻", "homeBtn": "Back to home", "footer1": "Linux Master · Linux command lab", "footer2": "Learning content based on the Bandit guide", "example": "Example", "examplePrefix": "Example: ", "correct": "Correct! ",levels:{"intro": {"step": "01", "card": "Commands", "cardDesc": "What each command does, in plain words", "title": "Basic commands", "note": "<strong>Start from the basics.</strong> Learn command names, what they do and a simple example.", "subtitle": "Learn every command in the set. A short example follows each answer.", "tag": "Level 01 / Commands", "tutTitle": "Basic commands", "tutDesc": "What each command does and when to use it."}, "functions": {"step": "02", "card": "Command + usage", "cardDesc": "One option, e.g. ls -a", "title": "Command + usage", "note": "<strong>Level two.</strong> Learn options and usage syntax from the guide.", "subtitle": "Learn every usage option from the guide.", "tag": "Level 02 / Command + usage", "tutTitle": "Command + usages", "tutDesc": "Options, syntax and usage examples from the guide."}, "pipe": {"step": "03", "card": "Commands together", "cardDesc": "Join them with a pipe |", "title": "Commands together", "note": "<strong>Level three.</strong> Connect commands with a pipe |, without adding flags.", "subtitle": "Pass one command's output to the next, without flags.", "tag": "Level 03 / Pipes", "tutTitle": "Commands together", "tutDesc": "The | sign passes one command's output to the next command."}, "pipeFunction": {"step": "04", "card": "Pipe + flag", "cardDesc": "A chain of commands with one option", "title": "Pipe + one flag", "note": "<strong>Level four.</strong> Add one flag to a chain of piped commands.", "subtitle": "Connect commands with a pipe and use one flag.", "tag": "Level 04 / Pipe + one flag", "tutTitle": "Pipe + one flag", "tutDesc": "Combine a pipe with a flag that sharpens the search or the output."}, "pro": {"step": "05", "card": "Pro", "cardDesc": "A command with two flags on real tasks", "title": "Pro command + two flags", "note": "<strong>Level five.</strong> Solve real scenarios with a command that takes two flags.", "subtitle": "Pro practice: one command with two flags.", "tag": "Level 05 / Pro", "tutTitle": "Pro command + two flags", "tutDesc": "Two or more options in one command, in real scenarios."}, "pipeTwoFlag": {"step": "06", "card": "Pipe + two flags", "cardDesc": "More complex combinations", "title": "Pipe + two flags", "note": "<strong>Level six.</strong> Combine pipes with two or more flags.", "subtitle": "Combine a pipe with several flags.", "tag": "Level 06 / Pipe + two flags", "tutTitle": "Pipe + two flags", "tutDesc": "Several steps in a pipe, with flags that change the commands."}, "bandit": {"step": "08", "card": "Bandit tools", "cardDesc": "Everything levels 0-33 need", "title": "Bandit tools", "note": "<strong>Level eight.</strong> Odd file names, advanced find, nmap, setuid, cron, loops, git, vi and $0.", "subtitle": "The tools you need to finish Bandit.", "tag": "Level 08 / Bandit", "tutTitle": "Bandit tools", "tutDesc": "The tools that show up in the later Bandit levels."}, "workflow": {"step": "07", "card": "Workflows", "cardDesc": "Complete system tasks", "title": "Workflows", "note": "<strong>Level seven.</strong> Connect several commands to complete whole system tasks.", "subtitle": "Connect several commands into one complete task.", "tag": "Level 07 / Workflows", "tutTitle": "Workflows", "tutDesc": "Command chains for complete system tasks."}},loadMore:(shown,total)=>`Show 30 more (${shown} of ${total})`,step:n=>`Level ${n}`,describe:m=>`Which command matches this description:\n${m}?`,whatDoes:name=>`What does the ${name} command do?`,whatKey:(key,cmd)=>`What does the ${key} key do inside ${cmd}?`,keyTitle:(cmd,key)=>`${cmd}: the ${key} key`,meaningOf:syntax=>`What does ${syntax} mean?`,progress:(done,total,size)=>`${done}/${total} done · rounds of ${size}`,resultText:n=>`You answered ${n} questions. Every answer is another step into Linux.`,resultScore:(points,n)=>`${points} of ${n} correct`}
};
let LANG = 'he';
try { const saved = localStorage.getItem('lang'); if (saved in LANGS) LANG = saved; } catch {}
const t = (key, ...args) => { const value = I18N[LANG][key] ?? I18N.he[key]; return typeof value === 'function' ? value(...args) : value; };
const levelText = key => I18N[LANG].levels[key];
if (CONTENT[LANG]) {
  const content = CONTENT[LANG];
  commands.forEach(item => { item.meaning = content.commands[item.name] ?? item.meaning; });
  guideUses.forEach((item, index) => { item.meaning = content.guide[index] ?? item.meaning; });
  const pools = {pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios, banditScenarios};
  Object.entries(content.scenarios).forEach(([name, list]) => list.forEach((text, index) => Object.assign(pools[name][index], text)));
}
const makeScenarioQuestion = (scenario,tag='SCENARIO / תרגול מעשי') => {
  const choices=shuffle([scenario.answer,...scenario.wrong]);
  return {tag,prompt:scenario.prompt,code:'',answer:scenario.answer,accept:scenario.accept||[],hints:scenario.hints,wrong:scenario.wrong,why:scenario.why||[],optionMode:'code',typed:true,options:choices.map(value=>({key:value,label:value})),explanation:scenario.explanation};
};

const $ = id => document.getElementById(id);
const shuffle = list => {const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const ROUND_SIZE = 20, REVIEW_PER_ROUND = 5, RETRY_GAP = 4;
const CORE_GUIDE_IDS = [0, 1, 9, 10, 11, 12, 13, 14, 16, 20, 21, 22, 23, 30, 36, 37, 38, 39, 41, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 66, 67, 68, 69, 70, 71, 72, 74, 75, 80, 81, 82, 89, 90, 91, 99, 100, 101, 102, 105, 106, 110, 111, 112, 120, 121, 122, 125, 131, 132, 136, 137, 138, 140, 145, 149, 150, 156, 157, 158, 160, 161, 162, 170, 172, 180, 181, 182, 183, 184, 185, 187, 190, 193, 194, 195, 199, 204, 209, 210, 211, 212, 213, 220, 221, 223, 224, 231, 240, 250, 258, 260, 261, 266, 269, 270, 271, 272, 277, 280, 281, 282, 284, 288, 289, 290, 291, 292, 300, 301, 310, 311, 312, 320, 323, 324, 326, 327, 328, 329, 335, 336, 340, 349, 350, 357, 358, 360, 361, 363, 368, 370, 371, 372, 375, 380, 381, 387, 390, 391, 400, 407, 408, 409, 414, 415, 417, 420, 421, 429, 438, 448];
let updateWaiting = false;
let quizQuestions = [], quizIndex = 0, quizPoints = 0, quizLocked = false, quizAnswered = 0, questionTimer = null;
const readSaved = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key)); return value && typeof value === 'object' ? value : fallback; } catch { return fallback; } };
const stats = Object.assign({correct:0, answered:0, byLevel:{}, byCommand:{}}, readSaved('quizStats', {}));
const progress = readSaved('levelProgress', {});
const reviewState = readSaved('reviewState', {});
const daily = readSaved('daily', {});
const readSetting = (key, allowed, fallback) => { try { const value = localStorage.getItem(key); return allowed.includes(value) ? value : fallback; } catch { return fallback; } };
let answerMode = readSetting('answerMode', ['choice', 'type'], 'choice');
let guideScope = readSetting('guideScope', ['all', 'core'], 'all');
let dailyGoal = Number(readSetting('dailyGoal', ['10', '20', '40'], '20'));
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
let selectedLevel = localStorage.getItem('learningLevel') || 'intro';
if ('serviceWorker' in navigator && window.isSecureContext) {
  if (navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener('controllerchange', () => { if ($('home').classList.contains('active')) location.reload(); else updateWaiting = true; });
  navigator.serviceWorker.register('./sw.js').then(registration => document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') registration.update().catch(() => {}); })).catch(() => {});
}
renderStats();

$('commandCount').textContent = commands.length;
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active');window.scrollTo({top:0,behavior:'smooth'});}
function goHome(){if(updateWaiting){location.reload();return;}clearTimeout(questionTimer);questionTimer=null;selectLevel(selectedLevel);showScreen('home');$('toast').classList.remove('show');}
function renderStats(){$('learnedCount').textContent=stats.correct;$('bestScore').textContent=stats.answered?`${Math.round(stats.correct/stats.answered*100)}%`:'0%';}
function leitner(level){ return reviewState[level] ??= {boxes:{}, review:[]}; }
function recordAnswer(entry, correct, given){
  const level=entry.level, state=leitner(level), id=String(entry.id);
  if(!entry.retry){
    const today=dayKey(new Date()); daily[today]=(daily[today]||0)+1;
    stats.answered++; if(correct) stats.correct++;
    const byLevel=stats.byLevel[level] ??= {a:0,c:0}; byLevel.a++; if(correct) byLevel.c++;
    const counted=correct||entry.q.optionMode!=='code'?entry.commands:blamedCommands(entry.q.answer,given);
    for(const name of counted){ const byCommand=stats.byCommand[name] ??= {a:0,c:0}; byCommand.a++; if(correct) byCommand.c++; }
  }
  if(correct&&!entry.hinted){ state.boxes[id]=Math.min(3,(state.boxes[id]||0)+1); if(!entry.retry) state.review=state.review.filter(x=>String(x)!==id); }
  else if(correct){ if(!state.review.some(x=>String(x)===id)) state.review.push(entry.id); }
  else { state.boxes[id]=0; if(!state.review.some(x=>String(x)===id)) state.review.push(entry.id); }
  if(!entry.review && !entry.retry && progress[entry.key]) progress[entry.key].pos++;
  save('quizStats', stats); save('levelProgress', progress); save('reviewState', reviewState); save('daily', pruneDaily(daily));
  renderStats(); renderStatsPanel(); renderDaily();
}
const levelDetails = {
  intro:levelText('intro'),
  functions:levelText('functions'),
  pipe:levelText('pipe'),
  pipeFunction:levelText('pipeFunction'),
  pro:levelText('pro'),
  pipeTwoFlag:levelText('pipeTwoFlag'),
  workflow:levelText('workflow'),
  bandit:levelText('bandit')
};
function selectLevel(level){
  selectedLevel=level in levelDetails?level:'intro';localStorage.setItem('learningLevel',selectedLevel);
  document.querySelectorAll('.level-card').forEach(card=>{const active=card.dataset.level===selectedLevel;card.classList.toggle('selected',active);card.setAttribute('aria-pressed',String(active));});
  const info=levelDetails[selectedLevel];$('levelNote').innerHTML=info.note;$('quizModeMeta').textContent=levelProgressText(selectedLevel);renderToggles();
}
const tutorialCurriculum = [
  {key:'intro',label:t('step','01'),title:levelText('intro').tutTitle,description:levelText('intro').tutDesc,lessons:introNames.map(name=>{const item=commands.find(entry=>entry.name===name);return {title:fullName(item.name),explanation:item.meaning,example:item.example};})},
  {key:'functions',label:t('step','02'),title:levelText('functions').tutTitle,description:levelText('functions').tutDesc,lessons:guideUses.map(item=>item.kind==='key'?{title:t('keyTitle',item.command,item.usage),explanation:item.meaning,example:item.usage}:{title:guideSyntax(item),explanation:item.meaning,example:guideSyntax(item)})},
  {key:'pipe',label:t('step','03'),title:levelText('pipe').tutTitle,description:levelText('pipe').tutDesc,lessons:pipeScenarios.map(item=>({title:item.prompt,explanation:item.explanation,example:item.answer}))},
  {key:'pipeFunction',label:t('step','04'),title:levelText('pipeFunction').tutTitle,description:levelText('pipeFunction').tutDesc,lessons:pipeFlagScenarios.map(item=>({title:item.prompt,explanation:item.explanation,example:item.answer}))},
  {key:'pro',label:t('step','05'),title:levelText('pro').tutTitle,description:levelText('pro').tutDesc,lessons:professionalScenarios.map(item=>({title:item.prompt,explanation:item.explanation,example:item.answer}))},
  {key:'pipeTwoFlag',label:t('step','06'),title:levelText('pipeTwoFlag').tutTitle,description:levelText('pipeTwoFlag').tutDesc,lessons:pipeTwoFlagScenarios.map(item=>({title:item.prompt,explanation:item.explanation,example:item.answer}))},
  {key:'workflow',label:t('step','07'),title:levelText('workflow').tutTitle,description:levelText('workflow').tutDesc,lessons:workflowScenarios.map(item=>({title:item.prompt,explanation:item.explanation,example:item.answer}))},
  {key:'bandit',label:t('step','08'),title:levelText('bandit').tutTitle,description:levelText('bandit').tutDesc,lessons:banditScenarios.map(item=>({title:item.prompt,explanation:item.explanation,example:item.answer}))}
];
function openTutorials(){showScreen('tutorials');renderTutorialLevel(selectedLevel);}
function renderTutorialLevel(key){
  const stage=tutorialCurriculum.find(item=>item.key===key)||tutorialCurriculum[0];
  const tabs=$('tutorialLevels');tabs.innerHTML='';
  tutorialCurriculum.forEach(item=>{const button=document.createElement('button');button.className='tutorial-tab';button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-selected',String(item.key===stage.key));button.innerHTML=`<span>${item.label}</span><strong>${item.title}</strong>`;button.onclick=()=>renderTutorialLevel(item.key);tabs.appendChild(button);});
  $('tutorialLevelTitle').textContent=stage.title;$('tutorialLevelDescription').textContent=stage.description;
  const list=$('tutorialLessonList');list.innerHTML='';$('tutorialSearch').value='';currentTutorialLessons=stage.lessons;filterTutorialLessons();
}
let currentTutorialLessons=[];let filteredTutorialLessons=[];let tutorialVisibleCount=30;
function filterTutorialLessons(){
  const query=$('tutorialSearch').value.trim().toLocaleLowerCase();
  filteredTutorialLessons=currentTutorialLessons.filter(lesson=>`${lesson.title} ${lesson.explanation} ${lesson.example}`.toLocaleLowerCase().includes(query));
  tutorialVisibleCount=30;renderTutorialLessons();
}
function showMoreTutorialLessons(){tutorialVisibleCount+=30;renderTutorialLessons();}
function renderTutorialLessons(){
  const list=$('tutorialLessonList');list.innerHTML='';
  filteredTutorialLessons.slice(0,tutorialVisibleCount).forEach((lesson,index)=>{
    const card=document.createElement('details');card.className='tutorial-lesson';
    const summary=document.createElement('summary');const title=document.createElement('strong');title.textContent=lesson.title;
    const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');summary.append(title,number);
    const explanation=document.createElement('p');explanation.textContent=lesson.explanation;
    const example=document.createElement('div');example.className='tutorial-example';const label=document.createElement('span');label.textContent=t('example');
    const code=document.createElement('code');code.dir='ltr';code.textContent=lesson.example;example.append(label,code);
    card.append(summary,explanation,example);list.appendChild(card);
  });
  $('tutorialLoadMore').hidden=filteredTutorialLessons.length<=tutorialVisibleCount;
  $('tutorialLoadMore').querySelector('button').textContent=t('loadMore',Math.min(tutorialVisibleCount,filteredTutorialLessons.length),filteredTutorialLessons.length);
}
const similarCommands = [['cat','less','head','tail','xxd','strings'],['ssh','nc','openssl','scp'],['cp','scp'],['cmp','diff'],['gzip','bzip2','tar'],['whoami','id'],['ltrace','strace'],['man','help'],['ls','find'],['awk','cut'],['tr','sed']];
function commandQuestion(item,pool){
  const prompts=CONTENT[LANG]?.prompts||{ls:'איזו פקודה מציגה את הקבצים שבתיקייה?',cd:'איזו פקודה מעבירה אותנו לתיקייה אחרת?',pwd:'איזו פקודה מציגה איפה אנחנו נמצאים?',cat:'איזו פקודה מציגה את תוכן הקובץ?',file:'איזו פקודה מזהה את סוג הקובץ?',ssh:'באיזו פקודה מתחברים לשרת מרוחק?',whoami:'איזו פקודה מציגה את שם המשתמש הפעיל?',head:'איזו פקודה מציגה את תחילת הקובץ?',tail:'איזו פקודה מציגה את סוף הקובץ?',wc:'איזו פקודה סופרת שורות, מילים או תווים?'};
  const options=shuffle([item,...shuffle(pool.filter(option=>option.name!==item.name&&!similarCommands.some(group=>group.includes(item.name)&&group.includes(option.name)))).slice(0,3)]).map(option=>({key:option.name,label:option.name}));
  return {tag:levelText('intro').tag,prompt:prompts[item.name]||t('describe',item.meaning.replace(/\.$/,'')),code:'',answer:item.name,optionMode:'command',typed:true,options,explanation:`${fullName(item.name)}\n${item.meaning}\n${t('examplePrefix')}${item.example}`};
}
function commandMeaningQuestion(item,pool){
  const meanings=[...new Set(pool.filter(entry=>entry.meaning!==item.meaning).map(entry=>entry.meaning))];
  const options=shuffle([item.meaning,...shuffle(meanings).slice(0,3)]).map(meaning=>({key:meaning,label:meaning}));
  return {tag:levelText('intro').tag,prompt:`${t('whatDoes',item.name)}${abbreviations[item.name]?`\n\u2066(${abbreviations[item.name]})\u2069`:''}`,code:item.name,answer:item.meaning,optionMode:'text',options,explanation:`${fullName(item.name)}\n${item.meaning}\n${t('examplePrefix')}${item.example}`};
}
function guideSyntax(item){
  if(item.kind==='cmd')return item.usage;
  return item.usage.startsWith(item.command+' ')||item.usage===item.command?item.usage:`${item.command} ${item.usage}`;
}
function guideUseQuestion(item,pool){
  const others=entries=>shuffle([...new Set(entries.filter(entry=>entry.meaning!==item.meaning).map(entry=>entry.meaning))]);
  const sameCommand=others(pool.filter(entry=>entry.command===item.command));
  const distractors=[...sameCommand,...others(pool.filter(entry=>entry.command!==item.command))].slice(0,3);
  const options=shuffle([item.meaning,...distractors]).map(meaning=>({key:meaning,label:meaning}));
  if(item.kind==='key')return {tag:levelText('functions').tag,prompt:t('whatKey',item.usage,item.command),code:'',answer:item.meaning,optionMode:'text',options,explanation:`${t('keyTitle',item.command,item.usage)}\n${item.meaning}`};
  const syntax=guideSyntax(item);
  return {tag:levelText('functions').tag,prompt:t('meaningOf',syntax),code:syntax,answer:item.meaning,optionMode:'text',options,explanation:`${syntax}\n${item.meaning}`};
}
const range = n => Array.from({length:n},(_,i)=>i);
const commandsIn = answer => [...new Set(answer.split(/\|\||&&|\||;/).map(part=>part.trim().split(/\s+/)[0]).filter(name=>name&&!name.startsWith('-')))];
const scenarioLevel = (pool,level) => ({ids:()=>range(pool.length),get:id=>pool[id],make:item=>makeScenarioQuestion(item,levelText(level).tag),commands:item=>commandsIn(item.answer),subtitle:levelText(level).subtitle});
const levelQuiz = {
  intro:{ids:()=>range(commands.length*2),get:id=>({item:commands[id>>1],reverse:id%2===1}),make:({item,reverse})=>reverse?commandMeaningQuestion(item,commands):commandQuestion(item,commands),commands:({item})=>[item.name],subtitle:levelText('intro').subtitle},
  functions:{ids:()=>guideScope==='core'?CORE_GUIDE_IDS:range(guideUses.length),get:id=>guideUses[id],make:item=>guideUseQuestion(item,guideScope==='core'?CORE_GUIDE_IDS.map(id=>guideUses[id]):guideUses),commands:item=>[item.command],subtitle:levelText('functions').subtitle},
  pipe:scenarioLevel(pipeScenarios,'pipe'),
  pipeFunction:scenarioLevel(pipeFlagScenarios,'pipeFunction'),
  pro:scenarioLevel(professionalScenarios,'pro'),
  pipeTwoFlag:scenarioLevel(pipeTwoFlagScenarios,'pipeTwoFlag'),
  workflow:scenarioLevel(workflowScenarios,'workflow'),
  bandit:scenarioLevel(banditScenarios,'bandit')
};
const progressKey = level => level==='functions'&&guideScope==='core'?'functions:core':level;
function validProgress(level){
  const ids=levelQuiz[level].ids(), p=progress[progressKey(level)];
  if(!p||!Array.isArray(p.order)) return null;
  const size=p.poolSize ?? p.order.length;
  const known=new Set(ids);
  return size===ids.length && p.order.every(id=>known.has(id)) ? p : null;
}
const dueInCycle = (box, cycle) => box<=1 || (box===2 && cycle%2===0) || (box>=3 && cycle%4===0);
function startCycle(level, previous){
  const ids=levelQuiz[level].ids(), cycle=(previous?.cycle||1)+(previous?1:0), boxes=leitner(level).boxes;
  const due=previous?ids.filter(id=>dueInCycle(boxes[id]||0,cycle)):ids;
  const p={order:shuffle(due.length?due:ids),pos:0,poolSize:ids.length,cycle};
  progress[progressKey(level)]=p; save('levelProgress',progress); return p;
}
function reviewIds(level){ const known=new Set(levelQuiz[level].ids()); return leitner(level).review.filter(id=>known.has(id)); }
function levelProgressText(level){
  const p=validProgress(level), total=p?p.order.length:levelQuiz[level].ids().length, done=p?Math.min(p.pos,total):0, review=reviewIds(level).length;
  return t('progress',done,total,Math.min(ROUND_SIZE,total))+(review?` · ${t('toReview',review)}`:'');
}
function makeEntry(level, id, flags){
  const quiz=levelQuiz[level], item=quiz.get(id);
  return {level, key:progressKey(level), id, item, q:quiz.make(item), commands:quiz.commands(item), ...flags};
}
function nextBatch(level){
  let p=validProgress(level);
  if(!p) p=startCycle(level,null);
  else if(p.pos>=p.order.length) p=startCycle(level,p);
  const review=reviewIds(level), fresh=p.order.slice(p.pos);
  const reviewNow=shuffle(review.filter(id=>!fresh.slice(0,ROUND_SIZE).includes(id))).slice(0,REVIEW_PER_ROUND);
  const freshNow=fresh.slice(0,ROUND_SIZE-reviewNow.length);
  const batch=freshNow.map(id=>makeEntry(level,id,{}));
  for(const id of reviewNow)batch.splice(Math.floor(Math.random()*(batch.length+1)),0,makeEntry(level,id,{review:true}));
  return batch;
}
function startQuiz(){
  quizQuestions=nextBatch(selectedLevel);
  $('quizSubtitle').textContent=levelQuiz[selectedLevel].subtitle;
  quizIndex=0;quizPoints=0;quizAnswered=0;showScreen('quiz');renderQuestion();
}
function renderQuestion(){
  clearTimeout(questionTimer);questionTimer=null;quizLocked=false;const entry=quizQuestions[quizIndex],q=entry.q;
  $('quizCounter').textContent=`${String(quizIndex+1).padStart(2,'0')} / ${quizQuestions.length}`;
  $('quizProgress').style.width=`${quizIndex/quizQuestions.length*100}%`;
  $('quizScore').textContent=quizPoints;$('feedback').className='feedback';$('feedback').textContent='';$('nextQuestion').hidden=true;$('nextQuestion').classList.remove('counting');
  $('questionTag').textContent=q.tag;if(entry.review||entry.retry){const badge=document.createElement('span');badge.className='review';badge.textContent=t('reviewTag');$('questionTag').append(badge);}$('questionText').textContent=q.prompt;
  $('questionCode').hidden=!q.code;$('questionCode').textContent='';if(q.code){const prompt=document.createElement('span');prompt.className='prompt';prompt.textContent='user@linux:~$ ';$('questionCode').append(prompt,q.code);}
  $('hintBtn').disabled=false;$('hintText').hidden=true;$('hintText').textContent='';
  const root=$('answers');root.innerHTML='';
  if(answerMode==='type'&&q.typed){renderTyping(root,entry);return;}
  q.options.forEach((opt,index)=>{const b=document.createElement('button');b.className='answer';b.dataset.answer=opt.key;const letter=document.createElement('span');letter.className='letter';letter.textContent=String.fromCharCode(65+index);const label=document.createElement('span');if(q.optionMode==='command'||q.optionMode==='code'){const code=document.createElement('code');code.dir='ltr';code.textContent=opt.label;label.appendChild(code);}else label.textContent=opt.label;b.append(letter,label);b.onclick=()=>chooseAnswer(b,opt,entry);root.appendChild(b);});
}
const commandMeaning = name => commands.find(c=>c.name===name)?.meaning;
function hintLines(entry){
  const {level,item,q}=entry,cmd=name=>({code:name,text:commandMeaning(name)?`: ${commandMeaning(name)}`:''});
  if(level==='intro'){
    if(item.reverse)return [{label:t('hintExample'),code:item.item.example}];
    const {name,example}=item.item;
    return [...(abbreviations[name]?[{label:t('hintStands'),code:abbreviations[name]}]:[]),{label:t('hintExample'),code:example.replace(new RegExp(`(^|\\s)${name}(?=\\s|$)`,'g'),'$1___')}];
  }
  if(level==='functions')return commandMeaning(item.command)?[cmd(item.command)]:[];
  return [{label:t('hintUses')},...commandsIn(q.answer).map(cmd)];
}
function showHint(){
  const entry=quizQuestions[quizIndex];if(quizLocked||!entry)return;
  entry.hinted=true;$('hintBtn').disabled=true;
  const lines=hintLines(entry),wrong=shuffle([...document.querySelectorAll('.answer')].filter(b=>b.dataset.answer!==entry.q.answer)).slice(0,2);
  wrong.forEach(b=>{b.disabled=true;b.classList.add('eliminated');});
  if(wrong.length)lines.push({label:t('hintRemoved')});
  const box=$('hintText');box.innerHTML='';
  for(const line of lines){const row=document.createElement('div');if(line.label)row.append(line.label);if(line.code){const code=document.createElement('code');code.dir='ltr';code.textContent=line.code;row.append(code);}if(line.text)row.append(line.text);box.append(row);}
  box.hidden=false;
}
function chooseAnswer(button,opt,entry){if(quizLocked)return;const q=entry.q;const all=[...document.querySelectorAll('.answer')];all.forEach(b=>b.disabled=true);const correct=opt.key===q.answer;
  if(correct)button.classList.add('correct');else{button.classList.add('wrong');all.find(b=>b.dataset.answer===q.answer)?.classList.add('correct');}
  finishAnswer(entry,correct,'',opt.key);
}
function scheduleRetry(entry){
  const retry=makeEntry(entry.level,entry.id,{retry:true});
  quizQuestions.splice(Math.min(quizIndex+1+RETRY_GAP,quizQuestions.length),0,retry);
}
function finishAnswer(entry,correct,typedAnswer,given){
  quizLocked=true;quizAnswered++;$('hintBtn').disabled=true;const q=entry.q,feedback=$('feedback');
  recordAnswer(entry,correct,given);
  if(!correct&&!entry.retry)scheduleRetry(entry);
  if(correct){quizPoints++;feedback.className='feedback show good';feedback.textContent=entry.sameResult?`${t('correct')}${t('altWorks')}\n${t('ourAnswer')}${q.answer}\n${q.explanation}`:`${t('correct')}${q.explanation}`;if(entry.hinted)feedback.textContent+=`\n${t('hintedNote')}`;}
  else{const why=whyWrong(entry,given);feedback.className='feedback show bad';feedback.textContent=(why?`${t('whyNot')}${why}\n`:'')+(typedAnswer?`${t('answerWas')}${q.answer}\n`:'')+q.explanation+(typedAnswer&&given?outputComparison(q.answer,given,entry.fixture):'');}
  $('quizCounter').textContent=`${String(quizIndex+1).padStart(2,'0')} / ${quizQuestions.length}`;
  $('quizScore').textContent=quizPoints;$('nextQuestion').hidden=false;$('nextQuestion').classList.remove('counting');void $('nextQuestion').offsetWidth;$('nextQuestion').classList.add('counting');$('nextQuestion').textContent=quizIndex===quizQuestions.length-1?t('toSummary'):t('nextQ');questionTimer=setTimeout(nextQuestion,2000);
}
function nextQuestion(){if(!quizLocked)return;clearTimeout(questionTimer);questionTimer=null;if(quizIndex<quizQuestions.length-1){quizIndex++;renderQuestion();}else showResult();}
function showResult(){showScreen('result');const ratio=quizAnswered?quizPoints/quizAnswered:0;$('resultIcon').textContent=ratio>=.7?'✦':'↗';$('resultTitle').textContent=ratio>=.7?t('greatRound'):t('roundDone');$('resultText').textContent=t('resultText',quizAnswered);$('resultScore').textContent=t('resultScore',quizPoints,quizAnswered);$('playAgain').onclick=startQuiz;}
const OPERATORS = ['&&', '||', '2>', '>>', '|', '&', ';', '>', '<'];
// Short flags that take a value, per command. Flags not listed are treated as switches.
const VALUE_FLAGS = {head:'nc',tail:'nc',cut:'dfcb',sort:'kto',grep:'ABCefm',uniq:'fsw',tar:'fC',ssh:'pilo',scp:'Pi',nc:'wpq',strings:'nte',xxd:'lscg',awk:'Fv',sed:'ef',du:'dt',ps:'upoC',kill:'s',
  'ssh-keygen':'tfERFN',base64:'w',cp:'t',ltrace:'eslpo',strace:'espo',nmap:'p',stat:'c',env:'u',cmp:'in',file:'f',git:'m'};
const LONG_SINGLE_DASH = new Set(['find','openssl']);
function lexCommand(text){
  const tokens=[];let i=0;
  while(i<text.length){
    const ch=text[i];
    if(/\s/.test(ch)){i++;continue;}
    const op=OPERATORS.find(o=>text.startsWith(o,i));
    if(op&&!(op==='2>'&&i>0&&/\S/.test(text[i-1]))){tokens.push({op});i+=op.length;continue;}
    let value='',quote='none',dollarInDouble=false;
    while(i<text.length&&!/\s/.test(text[i])&&!OPERATORS.some(o=>o!=='2>'&&text.startsWith(o,i))){
      const c=text[i];
      if(c==="'"||c==='"'){const end=text.indexOf(c,i+1);const part=end<0?text.slice(i+1):text.slice(i+1,end);if(c==='"'&&part.includes('$'))dollarInDouble=true;value+=part;quote=quote==='none'?(c==="'"?'single':'double'):'mixed';i=end<0?text.length:end+1;}
      else{value+=c;i++;}
    }
    tokens.push({value,quote,dollarInDouble});
  }
  return tokens;
}
function wordKey(token){
  let key=(token.value.length>1?token.value.replace(/\/+$/,''):token.value).replace(/ /g,'\u0001');
  if(token.dollarInDouble)key+='\u0000dq';
  else if(token.quote==='none'&&/[*?[]/.test(token.value))key+='\u0000glob';
  return key;
}
function canonicalSegment(words){
  if(!words.length)return '';
  const command=words[0].value,valueFlags=VALUE_FLAGS[command]||'',flags=[],positionals=[];
  const rest=words.slice(1);
  for(let i=0;i<rest.length;i++){
    const token=rest[i],v=token.value;
    if(token.quote!=='none'||!/^-[a-zA-Z]/.test(v)||LONG_SINGLE_DASH.has(command)){positionals.push(wordKey(token));continue;}
    const letters=v.slice(1);
    for(let j=0;j<letters.length;j++){
      const letter=letters[j];
      if(!/[a-zA-Z]/.test(letter)){flags.push('-'+letters.slice(j));break;}
      if(valueFlags.includes(letter)){
        const attached=letters.slice(j+1);
        const value=attached||(rest[i+1]?wordKey(rest[++i]):'');
        flags.push(`-${letter} ${value}`);break;
      }
      flags.push('-'+letter);
    }
  }
  return [command,...flags.sort(),...positionals].join(' ');
}
function commandSegments(text){
  const segments=[];let words=[];
  for(const token of lexCommand(text.trim())){
    if(token.op){segments.push({text:canonicalSegment(words),command:words[0]?.value,op:token.op});words=[];}
    else words.push(token);
  }
  segments.push({text:canonicalSegment(words),command:words[0]?.value,op:''});
  return segments.filter(s=>s.text||s.op);
}
function canonicalCommand(text){
  return commandSegments(text).map(s=>s.op?`${s.text} ${s.op}`:s.text).join(' ').trim();
}
function blamedCommands(answer,given){
  const right=commandSegments(answer),guess=commandSegments(given||'');
  if(!given||!given.trim())return [...new Set(right.map(s=>s.command).filter(Boolean))];
  const blamed=new Set();
  right.forEach((segment,index)=>{const other=guess[index];if(!other||other.text!==segment.text||other.op!==segment.op)blamed.add(segment.command);});
  return [...blamed].filter(Boolean);
}
function answerHints(answer){
  const operators=['|','||','&&',';','>','>>','2>'];let first=true;const names=[];
  for(const token of (answer.match(/'[^']*'|"[^"]*"|\S+/g)||[])){
    if(operators.includes(token)){first=true;continue;}
    if(first){first=false;continue;}
    if(token.startsWith('-')||/[{}$]/.test(token))continue;
    if(/[./@*:]/.test(token)||/^[A-Z][A-Z_]+$/.test(token))names.push(token);
  }
  return [...new Set(names)];
}
function renderTyping(root,entry){
  const q=entry.q,box=document.createElement('div');box.className='type-box';
  const input=document.createElement('input');input.className='type-input';input.id='typeInput';input.setAttribute('aria-label',t('typePlaceholder'));input.type='text';input.dir='ltr';input.placeholder=t('typePlaceholder');
  input.autocomplete='off';input.spellcheck=false;input.setAttribute('autocapitalize','off');input.setAttribute('autocorrect','off');input.enterKeyHint='done';
  const hints=q.optionMode==='code'?(q.hints??answerHints(q.answer)):[];
  const actions=document.createElement('div');actions.className='type-actions';
  const check=document.createElement('button');check.className='primary-btn';check.type='button';check.textContent=t('check');
  const skip=document.createElement('button');skip.className='secondary-btn';skip.type='button';skip.textContent=t('dontKnow');
  const submit=giveUp=>{if(quizLocked)return;const value=input.value;if(!giveUp&&!value.trim()){input.focus();return;}
    const answers=[q.answer,...(q.accept||[])],fixture=entry.level==='bandit'?banditFixture:lessonFixture;
    const sameText=!giveUp&&answers.some(answer=>canonicalCommand(value)===canonicalCommand(answer));
    const sameResult=!giveUp&&!sameText&&q.optionMode==='code'&&answers.some(answer=>sameOutput(answer,value,fixture)===true);
    const correct=sameText||sameResult;entry.sameResult=sameResult;entry.fixture=fixture;
    input.disabled=true;check.disabled=true;skip.disabled=true;input.classList.add(correct?'correct':'wrong');
    finishAnswer(entry,correct,giveUp?' ':value,giveUp?'':value);};
  check.onclick=()=>submit(false);skip.onclick=()=>submit(true);
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submit(false);}});
  actions.append(check,skip);box.append(input);
  if(hints.length){const hint=document.createElement('div');hint.className='type-hint';const code=document.createElement('code');code.textContent=hints.join('  ');hint.append(t('hintNames',''),code);box.append(hint);}
  box.append(actions);root.appendChild(box);
  setTimeout(()=>input.focus({preventScroll:true}),50);
}
const banditDone = new Set((readSaved('banditDone', {}).levels) || []);
function openBandit(){showScreen('bandit');renderBandit();}
function practiceBandit(){selectLevel('bandit');startQuiz();}
function renderBandit(){
  $('banditProgress').textContent=t('banditDone',banditDone.size,BANDIT_MAP.length);
  const list=$('banditList');list.innerHTML='';
  for(const [n,he,en,cmds] of BANDIT_MAP){
    const row=document.createElement('li');row.className='bandit-row'+(banditDone.has(n)?' done':'');
    const head=document.createElement('div');head.className='bandit-head';
    const title=document.createElement('strong');title.textContent=n===0?t('banditLogin'):t('banditStep',n);
    const link=document.createElement('a');link.href=`https://overthewire.org/wargames/bandit/bandit${n}.html`;link.target='_blank';link.rel='noopener';link.textContent=t('banditPage');
    const check=document.createElement('label');check.className='bandit-check';const box=document.createElement('input');box.type='checkbox';box.checked=banditDone.has(n);
    box.onchange=()=>{box.checked?banditDone.add(n):banditDone.delete(n);save('banditDone',{levels:[...banditDone]});renderBandit();};
    check.append(box,t('banditPassed'));head.append(title,link,check);
    const text=document.createElement('p');text.textContent=LANG==='he'?he:en;
    const chips=document.createElement('div');chips.className='bandit-cmds';for(const c of cmds){const code=document.createElement('code');code.textContent=c;chips.append(code);}
    row.append(head,text,chips);if(MISSIONS.some(m=>m.level===n)){const go=document.createElement('button');go.type='button';go.className='secondary-btn';go.textContent=t('missionPractice');go.onclick=()=>openMission(n);row.append(go);}list.append(row);
  }
}
const BACKUP_KEYS = ['quizStats', 'levelProgress', 'reviewState', 'banditDone', 'daily', 'dailyGoal', 'answerMode', 'guideScope', 'learningLevel', 'lang'];
function dayKey(date){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function pruneDaily(days){ const keys=Object.keys(days).sort(); for(const k of keys.slice(0,Math.max(0,keys.length-120))) delete days[k]; return days; }
function streakDays(days, goal, now=new Date()){
  const day=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  if((days[dayKey(day)]||0)<goal) day.setDate(day.getDate()-1);
  let streak=0; while((days[dayKey(day)]||0)>=goal){ streak++; day.setDate(day.getDate()-1); }
  return streak;
}
function renderDaily(){
  const done=daily[dayKey(new Date())]||0;
  $('dailyProgress').textContent=t('dailyProgress',done,dailyGoal);
  $('dailyBar').max=dailyGoal;$('dailyBar').value=Math.min(done,dailyGoal);
  const streak=streakDays(daily,dailyGoal);$('streak').textContent=streak?`🔥 ${t('streakText',streak)}`:'';
  document.querySelectorAll('#goalToggle button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.value)===dailyGoal)));
}
function setDailyGoal(goal){ dailyGoal=goal; try{localStorage.setItem('dailyGoal',String(goal));}catch{} renderDaily(); }
function encodeBackup(){
  const data={};for(const key of BACKUP_KEYS){try{const v=localStorage.getItem(key);if(v!==null)data[key]=v;}catch{}}
  const json=JSON.stringify({app:'linux-master',format:1,savedAt:new Date().toISOString(),data});
  return btoa(String.fromCharCode(...new TextEncoder().encode(json)));
}
function decodeBackup(text){
  let parsed;
  try{const trimmed=text.trim();const json=trimmed.startsWith('{')?trimmed:new TextDecoder().decode(Uint8Array.from(atob(trimmed),c=>c.charCodeAt(0)));parsed=JSON.parse(json);}catch{return null;}
  if(!parsed||parsed.app!=='linux-master'||parsed.format!==1||typeof parsed.data!=='object')return null;
  const data={};for(const [k,v] of Object.entries(parsed.data)){if(BACKUP_KEYS.includes(k)&&typeof v==='string')data[k]=v;}
  return data;
}
function restoreBackup(text){
  const data=decodeBackup(text);
  if(!data){alert(t('backupBad'));return false;}
  if(!confirm(t('backupConfirm')))return false;
  try{for(const key of BACKUP_KEYS)localStorage.removeItem(key);for(const [k,v] of Object.entries(data))localStorage.setItem(k,v);}catch{}
  location.reload();return true;
}
function downloadFile(name,type,content){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function downloadBackup(){const code=encodeBackup();downloadFile(`linux-master-backup-${dayKey(new Date())}.json`,'application/json',JSON.stringify({app:'linux-master',format:1,code},null,1));}
async function copyBackup(){try{await navigator.clipboard.writeText(encodeBackup());alert(t('backupCopied'));}catch{prompt(t('backupCopy'),encodeBackup());}}
function startRestore(){$('restoreFile').click();}
async function restoreFromFile(input){
  const file=input.files[0];input.value='';
  if(!file){const code=prompt(t('backupPrompt'));if(code)restoreBackup(code);return;}
  const text=await file.text();let code=text;try{const parsed=JSON.parse(text);if(parsed.code)code=parsed.code;}catch{}
  restoreBackup(code);
}
function restoreFromCode(){const code=prompt(t('backupPrompt'));if(code)restoreBackup(code);}
function reminderIcs(time, now=new Date()){
  const [h,m]=time.split(':').map(Number),d=now,pad=n=>String(n).padStart(2,'0');
  const date=`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`,stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Linux Master//Reminder//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:linux-master-daily-${date}@saharhalili95.github.io`,`DTSTAMP:${stamp}`,
    `DTSTART:${date}T${pad(h)}${pad(m)}00`,`DURATION:PT15M`,'RRULE:FREQ=DAILY',`SUMMARY:${t('reminderEvent')}`,'URL:https://saharhalili95.github.io/linux-master/',
    'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${t('reminderEvent')}`,'TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n')+'\r\n';
}
function addReminder(){downloadFile('linux-master-reminder.ics','text/calendar',reminderIcs($('reminderTime').value||'20:00'));}
function outputComparison(answer,given,fixture){
  if(!fixture)return '';
  const mine=previewOutput(given,fixture),right=previewOutput(answer,fixture);
  if(mine===null||right===null||mine===right)return '';
  return `\n\n${t('yourOutput')}\n${mine||t('noOutput')}\n\n${t('rightOutput')}\n${right||t('noOutput')}`;
}
function whyWrong(entry,given){
  const q=entry.q;
  if(!given||!given.trim())return '';
  if(q.optionMode==='code'){const wrong=q.wrong||[];let index=wrong.indexOf(given);if(index<0)index=wrong.findIndex(w=>canonicalCommand(w)===canonicalCommand(given));return index>=0?q.why[index]||'':'';}
  if(q.optionMode==='command'){const chosen=commands.find(c=>c.name===given);return chosen?`${fullName(chosen.name)}: ${chosen.meaning}`:'';}
  if(entry.level==='intro'){const chosen=commands.find(c=>c.meaning===given);return chosen?t('describes',chosen.name):'';}
  if(entry.level==='functions'){
    const matches=guideUses.filter(u=>u.meaning===given);
    const chosen=matches.find(u=>u.command===entry.item.command)||matches[0];
    if(!chosen)return '';
    return t('describes',chosen.kind==='key'?t('keyTitle',chosen.command,chosen.usage):guideSyntax(chosen));
  }
  return '';
}
const missionsDone = new Set((readSaved('missionsDone', {}).levels) || []);
let mission = null;
function openMissions(){showScreen('missions');renderMissionList();}
function renderMissionList(){
  $('missionList').hidden=false;$('missionView').hidden=true;
  $('missionsProgress').textContent=t('missionsDone',missionsDone.size,MISSIONS.length);
  const list=$('missionList');list.innerHTML='';
  for(const m of MISSIONS){
    const item=document.createElement('li');const b=document.createElement('button');b.type='button';b.className='mission-card'+(missionsDone.has(m.level)?' done':'');
    const title=document.createElement('strong');title.textContent=`${t('missionNumber',m.level)}${missionsDone.has(m.level)?` · ${t('missionSolvedTag')}`:''}`;
    const goal=document.createElement('span');goal.textContent=LANG==='he'?m.he:m.en;
    b.append(title,goal);b.onclick=()=>openMission(m.level);item.append(b);list.append(item);
  }
}
function openMission(level){
  const m=MISSIONS.find(x=>x.level===level);if(!m)return;
  showScreen('missions');$('missionList').hidden=true;$('missionView').hidden=false;
  const password=missionPassword();
  mission={m,password,shell:new Shell(m.build(password)),history:[],at:0};
  $('missionTitle').textContent=t('missionNumber',m.level);$('missionGoal').textContent=LANG==='he'?m.he:m.en;
  const row=BANDIT_MAP.find(r=>r[0]===level);$('missionHintText').textContent=row?`${LANG==='he'?row[1]:row[2]} · ${row[3].join('  ')}`:'';$('missionHintText').hidden=true;
  $('termOutput').textContent='';$('termInput').value='';$('missionPassword').value='';$('missionResult').textContent='';$('missionResult').className='mission-result';$('missionNextBtn').hidden=true;
  renderPrompt();setTimeout(()=>$('termInput').focus({preventScroll:true}),50);
}
function termPrompt(){const sh=mission.shell,home=sh.env.HOME;const dir=sh.cwd===home?'~':sh.cwd.startsWith(home+'/')?'~'+sh.cwd.slice(home.length):sh.cwd;return `bandit@bandit:${dir}$ `;}
function renderPrompt(){$('termPrompt').textContent=termPrompt();}
function termPrint(text){const out=$('termOutput');out.textContent+=text;out.scrollTop=out.scrollHeight;}
function runTerminal(command){
  const trimmed=command.trim();termPrint(termPrompt()+command+'\n');
  if(trimmed){mission.history.push(trimmed);mission.at=mission.history.length;}
  if(!trimmed){renderPrompt();return;}
  if(trimmed==='clear'){$('termOutput').textContent='';renderPrompt();return;}
  if(trimmed==='help'){termPrint(t('termHelp')+'\n');renderPrompt();return;}
  try{const r=mission.shell.run(trimmed);termPrint(r.out+r.err);}
  catch(e){if(e instanceof ShellUnsupported)termPrint(t('termUnsupported',trimmed.split(/\s+/)[0])+'\n');else throw e;}
  renderPrompt();
}
function terminalKey(event){
  const input=$('termInput');
  if(event.key==='Enter'){event.preventDefault();runTerminal(input.value);input.value='';}
  else if(event.key==='ArrowUp'&&mission.history.length){event.preventDefault();mission.at=Math.max(0,mission.at-1);input.value=mission.history[mission.at];}
  else if(event.key==='ArrowDown'&&mission.history.length){event.preventDefault();mission.at=Math.min(mission.history.length,mission.at+1);input.value=mission.history[mission.at]||'';}
}
function toggleMissionHint(){$('missionHintText').hidden=!$('missionHintText').hidden;}
function submitMission(event){
  event.preventDefault();
  const ok=$('missionPassword').value.trim()===mission.password,result=$('missionResult');
  result.textContent=ok?t('missionCorrect'):t('missionWrong');result.className='mission-result '+(ok?'good':'bad');
  if(ok){missionsDone.add(mission.m.level);save('missionsDone',{levels:[...missionsDone]});$('missionNextBtn').hidden=!MISSIONS.some(x=>x.level>mission.m.level);}
}
function nextMission(){const next=MISSIONS.find(x=>x.level>mission.m.level);if(next)openMission(next.level);}
function setAnswerMode(mode){answerMode=mode;try{localStorage.setItem('answerMode',mode);}catch{}renderToggles();}
function setGuideScope(scope){guideScope=scope;try{localStorage.setItem('guideScope',scope);}catch{}renderToggles();$('quizModeMeta').textContent=levelProgressText(selectedLevel);}
function renderToggles(){
  document.querySelectorAll('#modeToggle button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===answerMode)));
  const scope=$('scopeToggle');scope.hidden=selectedLevel!=='functions';
  scope.querySelector('[data-value=core]').textContent=`${t('scopeCore')} (${CORE_GUIDE_IDS.length})`;
  scope.querySelector('[data-value=all]').textContent=`${t('scopeAll')} (${guideUses.length})`;
  scope.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===guideScope)));
  $('typeNote').hidden=!(answerMode==='type'&&selectedLevel==='functions');$('typeNote').textContent=t('typeNA');
}
function renderStatsPanel(){
  const levels=Object.keys(levelQuiz),rows=$('levelStats');rows.innerHTML='';
  const used=levels.filter(level=>stats.byLevel[level]?.a);
  if(!used.length){const p=document.createElement('p');p.textContent=t('statsEmpty');rows.append(p);}
  for(const level of used){
    const s=stats.byLevel[level],row=document.createElement('div');row.className='level-stat';
    const name=document.createElement('div');name.textContent=`${t('step',levelText(level).step)} · ${levelText(level).card}`;
    const answered=document.createElement('span');answered.textContent=`${t('statsAnswered')} ${s.a}`;
    const review=document.createElement('span');review.textContent=`${t('statsReview')} ${reviewIds(level).length}`;
    const acc=document.createElement('b');acc.textContent=`${Math.round(s.c/s.a*100)}%`;
    row.append(name,answered,review,acc);rows.append(row);
  }
  const weak=Object.entries(stats.byCommand).filter(([,v])=>v.a>=3&&v.c<v.a).sort((a,b)=>a[1].c/a[1].a-b[1].c/b[1].a||b[1].a-a[1].a).slice(0,5);
  const box=$('weakCommands');box.innerHTML='';
  if(!weak.length){const p=document.createElement('p');p.textContent=t('statsEmpty');box.append(p);}
  for(const [name,v] of weak){const chip=document.createElement('span');chip.textContent=t('weakLine',name,Math.round(v.c/v.a*100),v.a);box.append(chip);}
}
function applyLanguage(){
  document.documentElement.lang=LANG;document.documentElement.dir=LANGS[LANG].dir;
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-html]').forEach(el=>{el.innerHTML=t(el.dataset.i18nHtml);});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{el.placeholder=t(el.dataset.i18nPlaceholder);});
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.i18nAria));});
  document.querySelectorAll('.level-card').forEach(card=>{const info=levelText(card.dataset.level);card.querySelector('.level-step').textContent=t('step',info.step);card.querySelector('strong').textContent=info.card;card.querySelector('span:last-child').textContent=info.cardDesc;});
  const next=Object.keys(LANGS)[(Object.keys(LANGS).indexOf(LANG)+1)%Object.keys(LANGS).length];
  $('langBtn').textContent=LANGS[next].short;$('langBtn').setAttribute('aria-label',`${LANGS[next].short} ${LANGS[next].name}`);$('langBtn').lang=next;
}
function switchLanguage(){
  const codes=Object.keys(LANGS);const next=codes[(codes.indexOf(LANG)+1)%codes.length];
  try{localStorage.setItem('lang',next);}catch{}
  location.reload();
}
applyLanguage();
renderStatsPanel();
renderDaily();
selectLevel(selectedLevel);
