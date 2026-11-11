(() => {
  const worlds = Object.freeze({
    1: { he: 'בשער מתחילים לגלות את לינוקס, צעד אחר צעד.', en: 'At the Gateway, start discovering Linux one step at a time.' },
    2: { he: 'בנהר הטקסט לומדים לקרוא מידע ולעבוד איתו.', en: 'At the River of Text, learn to read and work with information.' },
    3: { he: 'בעיר הקבצים חוקרים את המבנה ואת הגישה לקבצים.', en: 'In the City of Files, explore structure and access to files.' },
    4: { he: 'במצודה מכירים את המשתמשים והתהליכים שמפעילים את המערכת.', en: 'In the Citadel, meet the users and processes that run the system.' },
    5: { he: 'בנמל החבילות מגלים איך תוכנה מגיעה למערכת.', en: 'At Package Harbor, discover how software reaches the system.' },
    6: { he: 'ברשת האורות חוקרים כיצד מערכות מתקשרות זו עם זו.', en: 'On the Grid of Lights, explore how systems communicate.' },
    7: { he: 'במפעל הסקריפטים לומדים לבנות פעולות שאפשר להריץ שוב.', en: 'At the Script Works, learn to build actions that can run again.' },
    8: { he: 'בחומת האש בוחנים דרכים להגן על המערכת.', en: 'At the Firewall, explore ways to protect the system.' },
    9: { he: 'בארכיון מרחיבים את ארגז הכלים ואת הידע השימושי.', en: 'In the Archive, expand your toolkit and practical knowledge.' },
    10: { he: 'בגבולות החדשים מגלים כלים ונושאים נוספים של לינוקס.', en: 'At New Frontiers, discover more Linux tools and topics.' },
    11: { he: 'בזירה חוזרים על הידע וממשיכים להתכונן לאתגרים.', en: 'In the Arena, revisit your knowledge and prepare for challenges.' }
  });
  const opening = Object.freeze({
    1: { he: 'בשער לומדים להתמצא בתיקיות עם pwd, ‏ls ו־cd.', en: 'At the Gateway, explore directory navigation with pwd, ls and cd.' },
    2: { he: 'קוראים קבצים מזוויות שונות בעזרת cat, ‏head ו־tail.', en: 'Read files from different angles with cat, head and tail.' },
    3: { he: 'יוצרים, מעתיקים ומעבירים קבצים ותיקיות בדרך שלכם.', en: 'Create, copy and move files and folders as you explore.' },
    4: { he: 'מחפשים מידע בתוך קבצים וקבצים בתוך תיקיות.', en: 'Search for information in files and find files in folders.' },
    5: { he: 'מחברים פקודות בצינורות ומפנים את הפלט ליעדו.', en: 'Connect commands with pipes and direct their output.' },
    6: { he: 'ממיינים, סופרים וחותכים טקסט כדי לגלות מה נמצא בו.', en: 'Sort, count and cut text to discover the data inside.' }
  });
  function forUnit(unit, lang) {
    if (!unit || unit.locked || unit.exam || !Number.isInteger(unit.section) || !Object.hasOwn(worlds, unit.section)) return null;
    const language = lang === 'en' ? 'en' : 'he';
    const title = unit.title?.[language];
    if (typeof title !== 'string' || !title.trim()) return null;
    const intro = unit.section === 1 && Object.hasOwn(opening, unit.unit) ? opening[unit.unit][language] : `${language === 'en' ? 'Your focus' : 'הנושא שלכם'}: ${title}. ${worlds[unit.section][language]}`;
    return { label: language === 'en' ? 'World story' : 'סיפור העולם', title, text: intro };
  }
  function render(container, unit, lang) {
    const story = forUnit(unit, lang);
    if (!story || !container || typeof container.append !== 'function') return null;
    const aside = document.createElement('aside');
    aside.className = 'story-mission';
    aside.setAttribute('aria-label', story.label);
    const title = document.createElement('strong');
    title.className = 'story-mission-title';
    title.textContent = story.title;
    const text = document.createElement('p');
    text.className = 'story-mission-text';
    text.textContent = story.text;
    aside.append(title, text);
    container.append(aside);
    return aside;
  }
  window.StoryMissions = Object.freeze({ forUnit, render });
})();
