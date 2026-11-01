# Learn mode (beta)

Six units of the planned course ([materials/curriculum.md](../materials/curriculum.md)): Where am I?, Reading files, Making and moving, Searching, Pipes and redirection, and Sort, count, cut. A locked Patterns unit comes next.

Roadmap: the course grows to 80 units that prepare for LPIC-1, RHCSA and LFCS. Unit list: [materials/curriculum.md](../materials/curriculum.md). Design: [docs/superpowers/specs/2026-11-01-80-units-design.md](../docs/superpowers/specs/2026-11-01-80-units-design.md). Phased plan: [docs/superpowers/plans/2026-11-01-80-units-plan.md](../docs/superpowers/plans/2026-11-01-80-units-plan.md).

```bash
node tests/serve.js 8791
```

Then open http://localhost:8791/prototype/ (phone size works best). Live: https://saharhalili95.github.io/linux-master/prototype/

The Trivia | Learn switch in both top bars moves between the classic app and this mode. Both share the `lang` setting, so Hebrew or English carries over.

## What's in it

- Winding path: each unit has 4 lessons, a chest and a terminal challenge. Unit 1 lives in `lessons.js`, units 2 onward in `units.js`.
- Lessons of 6-7 exercises: new-command cards, choice, "what does it print?", build the command from tiles, fill the flag, match pairs, and live terminal tasks.
- Green / red check bar, mistakes return at the end of the lesson, combo counter, sounds, confetti.
- XP, streak with a week view, gems, 3 daily quests, practice from mistakes, profile.
- Original mascot. Correct outputs come from the real simulator (`../shell.js`), never hand-written.

## Known gaps

- `ls -l` isn't supported by the simulator, so it's taught by example only.
- Not offline yet: the root service worker deliberately skips `/prototype/` so it never overwrites the main app's cached page.
- No backup or export yet, unlike Trivia mode.
- Progress is stored under its own `localStorage` key and doesn't touch the main app's progress.

Tests: `tests/prototype.spec.js` plays Unit 1 on desktop and phones, plays the whole course on desktop, and checks every exercise against the simulator (answers, solvable terminal tasks, full English).
