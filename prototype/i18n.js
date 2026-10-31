// Same 'lang' key as the trivia app, so both modes open in the language picked last.
let LANG = 'he';
try { if (localStorage.getItem('lang') === 'en') LANG = 'en'; } catch { /* storage blocked: Hebrew */ }
const T = (he, en) => ({ he, en });
const tr = v => (v && typeof v === 'object' && 'he' in v ? v[LANG] : v);

const I18N = {
  he: {
    title: 'Linux Master · מצב למידה', mode: 'מצב', trivia: '🎯 טריוויה', learn: '🎓 למידה', langBtn: 'EN', langLabel: 'Switch to English',
    streak: 'ימי רצף', gems: 'יהלומים', pathLabel: 'מסלול הלימוד', nav: 'ניווט', tabLearn: 'לימוד', tabPractice: 'תרגול', tabQuests: 'משימות', tabProfile: 'פרופיל',
    practiceTitle: 'תרגול', mistakesTitle: 'חזרה על טעויות', practiceBtn: 'תרגול', mixTitle: 'תרגול מעורב', mixText: '8 תרגילים מהשיעורים שסיימתם', startBtn: 'התחלה',
    questsTitle: 'משימות יומיות', questsSub: 'מתחדשות כל יום. כל משימה שווה 💎 10.', profileTitle: 'הפרופיל שלי', profileSub: 'ההתקדמות נשמרת רק במכשיר הזה',
    pStreak: 'ימי רצף', pXp: 'XP בסך הכול', pLessons: 'שיעורים', pGems: 'יהלומים', sound: 'צלילים', reset: 'איפוס ההתקדמות', toTrivia: 'למצב טריוויה ←',
    quit: 'יציאה מהשיעור', check: 'בדיקה', gotIt: 'הבנתי', continue: 'המשך', report: '🚩 דיווח על תקלה', endXp: 'סה״כ XP', endAcc: 'דיוק', endTime: 'זמן', streakDays: 'ימי רצף',
    kicker: (s, u) => `חלק ${s}, יחידה ${u}`, locked: 'נעול', lessonN: (n, title) => `שיעור ${n}: ${title}`, chest: 'תיבת אוצר', open: 'פתחו!', start: 'התחילו',
    lockedUnitText: 'היחידה הזו בדרך. היא תיפתח בקרוב.', notYet: 'עוד לא', notYetText: 'סיימו את השלבים הקודמים כדי לפתוח.',
    chestOpened: 'התיבה נפתחה', chestDone: 'כבר קיבלתם ממנה 💎 15.', chestText: 'יש בה יהלומים. היהלומים קונים הקפאת רצף.', chestBtn: 'פתיחה ⁦+15 💎⁩',
    lessonOf: (n, total) => `שיעור ${n} מתוך ${total}`,
    again: 'שוב ⁦+5 XP⁩', toBoss: 'לאתגר ⁦+25 XP⁩', startXp: 'התחילו ⁦+10 XP⁩', gemsToast: '💎 +15 יהלומים',
    newCmd: '✨ פקודה חדשה', knownCmd: '↺ פקודה שכבר פגשתם', retry: '↻ טעות קודמת', praise: ['מעולה!', 'נכון!', 'יפה מאוד!', 'בדיוק!', 'אלופים!'], inARow: n => `🔥 ${n} ברצף!`,
    solution: 'הפתרון: ', correctAnswer: 'התשובה הנכונה:', quitConfirm: 'לצאת מהשיעור? ההתקדמות בשיעור הזה לא תישמר.',
    tryIt: 'נסו לראות מה קורה:', sampleLine: 'דוגמה לשורה בפלט:', noOutput: '(אין פלט)',
    goalFound: 'מצאו את הקובץ המוסתר (ls -a)', goalRead: 'קראו את התוכן שלו (cat)', goalTyped: 'הקלידו את מילת הקוד למטה', codeWord: 'מילת הקוד:',
    command: 'פקודה', unsupported: name => `${name}: הפקודה לא זמינה בטרמינל המדומה`, hint: '💡 רמז',
    bossSolution: (w, d) => `${w} (בתיקייה ${d})`, bossWhy: d => `ls -a ${d} ואז cat ${d}/.code`,
    bossWon: 'ניצחתם את האתגר!', perfect: 'שיעור מושלם!', done: 'השיעור הושלם!',
    questsDone: n => `🏆 השלמתם ${n === 1 ? 'משימה יומית' : `${n} משימות יומיות`}: ⁦+${n * 10} 💎⁩`,
    streakFirst: 'התחלתם רצף! חזרו מחר כדי להמשיך אותו.', streakMore: n => `${n} ימים ברצף. אל תשברו אותו!`, days: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
    mistakesN: n => `${n} תרגילים שטעיתם בהם`, noMistakes: 'אין טעויות לתרגל. כל הכבוד!', noMistakesToast: 'אין טעויות לתרגל', finishFirst: 'סיימו קודם שיעור אחד',
    resetConfirm: 'למחוק את כל ההתקדמות במצב הלמידה?', resetDone: 'ההתקדמות אופסה',
    qXp: 'צברו 30 XP', qPerfect: 'סיימו שיעור בלי טעויות', qCombo: '5 תשובות נכונות ברצף',
  },
  en: {
    title: 'Linux Master · Learn mode', mode: 'Mode', trivia: '🎯 Trivia', learn: '🎓 Learn', langBtn: 'עב', langLabel: 'עברו לעברית',
    streak: 'day streak', gems: 'gems', pathLabel: 'Learning path', nav: 'Navigation', tabLearn: 'Learn', tabPractice: 'Practice', tabQuests: 'Quests', tabProfile: 'Profile',
    practiceTitle: 'Practice', mistakesTitle: 'Review mistakes', practiceBtn: 'Practice', mixTitle: 'Mixed practice', mixText: '8 exercises from lessons you finished', startBtn: 'Start',
    questsTitle: 'Daily quests', questsSub: 'They reset every day. Each one is worth 💎 10.', profileTitle: 'My profile', profileSub: 'Progress is saved on this device only',
    pStreak: 'day streak', pXp: 'total XP', pLessons: 'lessons', pGems: 'gems', sound: 'Sounds', reset: 'Reset progress', toTrivia: '← Trivia mode',
    quit: 'Quit lesson', check: 'Check', gotIt: 'Got it', continue: 'Continue', report: '🚩 Report a problem', endXp: 'Total XP', endAcc: 'Accuracy', endTime: 'Time', streakDays: 'day streak',
    kicker: (s, u) => `Section ${s}, Unit ${u}`, locked: 'Locked', lessonN: (n, title) => `Lesson ${n}: ${title}`, chest: 'Treasure chest', open: 'Open!', start: 'Start',
    lockedUnitText: 'This unit is on its way. It opens soon.', notYet: 'Not yet', notYetText: 'Finish the steps before it to unlock.',
    chestOpened: 'Chest opened', chestDone: 'You already got 💎 15 from it.', chestText: 'It holds gems. Gems buy streak freezes.', chestBtn: 'Open +15 💎',
    lessonOf: (n, total) => `Lesson ${n} of ${total}`,
    again: 'Again +5 XP', toBoss: 'Challenge +25 XP', startXp: 'Start +10 XP', gemsToast: '💎 +15 gems',
    newCmd: '✨ New command', knownCmd: '↺ One you have met', retry: '↻ Previous mistake', praise: ['Great!', 'Correct!', 'Nice!', 'Exactly!', 'Awesome!'], inARow: n => `🔥 ${n} in a row!`,
    solution: 'Solution: ', correctAnswer: 'Correct answer:', quitConfirm: "Quit the lesson? Progress in this lesson won't be saved.",
    tryIt: 'See what happens:', sampleLine: 'A sample output line:', noOutput: '(no output)',
    goalFound: 'Find the hidden file (ls -a)', goalRead: 'Read what it says (cat)', goalTyped: 'Type the code word below', codeWord: 'Code word:',
    command: 'Command', unsupported: name => `${name}: this command isn't available in the simulated terminal`, hint: '💡 Hint',
    bossSolution: (w, d) => `${w} (in ${d})`, bossWhy: d => `ls -a ${d}, then cat ${d}/.code`,
    bossWon: 'You beat the challenge!', perfect: 'Perfect lesson!', done: 'Lesson complete!',
    questsDone: n => `🏆 You finished ${n === 1 ? 'a daily quest' : `${n} daily quests`}: +${n * 10} 💎`,
    streakFirst: 'You started a streak! Come back tomorrow to keep it going.', streakMore: n => `${n} days in a row. Don't break it!`, days: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    mistakesN: n => `${n} exercises you got wrong`, noMistakes: 'No mistakes to practice. Well done!', noMistakesToast: 'No mistakes to practice', finishFirst: 'Finish a lesson first',
    resetConfirm: 'Delete all progress in Learn mode?', resetDone: 'Progress reset',
    qXp: 'Earn 30 XP', qPerfect: 'Finish a lesson with no mistakes', qCombo: '5 correct answers in a row',
  },
};
const t = (key, ...args) => { const v = I18N[LANG][key] ?? I18N.he[key]; return typeof v === 'function' ? v(...args) : v; };
