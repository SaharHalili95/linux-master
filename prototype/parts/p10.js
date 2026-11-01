// Part 10: Mock exams, units 78-80. Each draws its questions from the units tagged for that exam (see buildExam in app.js).
COURSE.push(
  { section: 10, unit: 78, exams: ['L'], exam: { tag: 'L', count: 60, minutes: 90, pass: 0.625 }, title: T('מבחן דמה: LPIC-1', 'Mock exam: LPIC-1'), subtitle: T('60 שאלות מכל נושאי LPIC-1, ‏90 דקות', '60 questions across LPIC-1, 90 minutes'), color: 'green' },
  { section: 10, unit: 79, exams: ['R'], exam: { tag: 'R', count: 20, minutes: 0, pass: 0.7 }, title: T('מבחן דמה: RHCSA', 'Mock exam: RHCSA'), subtitle: T('20 שאלות על משימות RHCSA', '20 questions on RHCSA tasks'), color: 'purple' },
  { section: 10, unit: 80, exams: ['F'], exam: { tag: 'F', count: 20, minutes: 0, pass: 0.67 }, title: T('מבחן דמה: LFCS', 'Mock exam: LFCS'), subtitle: T('20 שאלות על נושאי LFCS', '20 questions on LFCS topics'), color: 'blue' },
);
