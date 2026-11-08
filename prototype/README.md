# Learn mode (beta)

The course: 93 units in 10 parts and 6 mock exams, for LPIC-1, RHCSA, LFCS, Linux Essentials, SUSE SCA and CompTIA Linux+. Unit list: [materials/curriculum.md](../materials/curriculum.md).

Next: accounts and progress sync across devices. Design: [docs/superpowers/specs/2026-11-08-accounts-sync-design.md](../docs/superpowers/specs/2026-11-08-accounts-sync-design.md).

```bash
node tests/serve.js 8791
```

Then open http://localhost:8791/prototype/ (phone size works best). Live: https://saharhalili95.github.io/linux-master/prototype/

The Trivia | Learn switch in both top bars moves between the classic app and this mode. Both share the `lang` setting, so Hebrew or English carries over.

## What's in it

- Winding path: each unit has 4 lessons, a chest and a terminal challenge. Unit 1 lives in `lessons.js`, units 2-6 in `units.js`, and the rest in `parts/`.
- Lessons of 6-7 exercises: new-command cards, choice, "what does it print?", build the command from tiles, fill the flag, match pairs, and live terminal tasks.
- Green / red check bar, mistakes return at the end of the lesson, combo counter, sounds, confetti.
- XP, streak with a week view, gems, 3 daily quests, practice from mistakes, profile.
- Original mascot. Correct outputs come from the real simulator (`../shell.js`), never hand-written.

## Storage

- Progress is stored under its own `localStorage` key and doesn't touch the main app's progress.

Tests: `tests/prototype.spec.js` plays Unit 1 on desktop and phones, plays the whole course on desktop, and checks every exercise against the simulator (answers, solvable terminal tasks, full English).
