// Part 11: Mock exams, units 78-80 and 97-99. Each draws its questions from the units tagged for that exam (see buildExam in app.js).
COURSE.push(
  { section: 11, unit: 78, exams: ['L'], exam: { tag: 'L', count: 60, minutes: 90, pass: 0.625 }, title: T('מבחן דמה: LPIC-1', 'Mock exam: LPIC-1'), subtitle: T('60 שאלות מכל נושאי LPIC-1, ‏90 דקות', '60 questions across LPIC-1, 90 minutes'), color: 'green' },
  { section: 11, unit: 79, exams: ['R'], exam: { tag: 'R', count: 20, minutes: 0, pass: 0.7 }, title: T('מבחן דמה: RHCSA', 'Mock exam: RHCSA'), subtitle: T('20 שאלות על משימות RHCSA', '20 questions on RHCSA tasks'), color: 'purple' },
  { section: 11, unit: 80, exams: ['F'], exam: { tag: 'F', count: 20, minutes: 0, pass: 0.67 }, title: T('מבחן דמה: LFCS', 'Mock exam: LFCS'), subtitle: T('20 שאלות על נושאי LFCS', '20 questions on LFCS topics'), color: 'blue' },
  { section: 11, unit: 97, exams: ['E'], exam: { tag: 'E', count: 40, minutes: 60, pass: 0.625 }, title: T('מבחן דמה: Linux Essentials', 'Mock exam: Linux Essentials'), subtitle: T('40 שאלות מכל נושאי Linux Essentials, ‏60 דקות', '40 questions across Linux Essentials, 60 minutes'), color: 'green' },
  { section: 11, unit: 98, exams: ['S'], exam: { tag: 'S', count: 70, minutes: 90, pass: 0.7 }, title: T('מבחן דמה: SUSE SCA', 'Mock exam: SUSE SCA'), subtitle: T('70 שאלות על נושאי SLES 16, ‏90 דקות', '70 questions on SLES 16 topics, 90 minutes'), color: 'blue' },
  { section: 11, unit: 99, exams: ['C'], exam: { tag: 'C', count: 60, minutes: 90, pass: 0.8 }, title: T('מבחן דמה: CompTIA Linux+', 'Mock exam: CompTIA Linux+'), subtitle: T('60 שאלות מכל חמשת התחומים, ‏90 דקות', '60 questions across the five domains, 90 minutes'), color: 'purple' },
);
