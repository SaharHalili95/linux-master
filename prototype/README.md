# Learn mode (beta)

One full unit of the planned course ([materials/curriculum.md](../materials/curriculum.md), Unit 1 "Where am I?"), built to feel the Duolingo loop before replacing the current app.

```bash
node tests/serve.js 8791
```

Then open http://localhost:8791/prototype/ (phone size works best). Live: https://saharhalili95.github.io/linux-master/prototype/

The Trivia | Learn switch in both top bars moves between the classic app and this mode. Both share the `lang` setting, so Hebrew or English carries over.

## What's in it

- Winding path: 4 lessons, a chest, a terminal boss, and a locked Unit 2 preview.
- Lessons of 6-7 exercises: new-command cards, choice, "what does it print?", build the command from tiles, fill the flag, match pairs, and live terminal tasks.
- Green / red check bar, mistakes return at the end of the lesson, combo counter, sounds, confetti.
- XP, streak with a week view, gems, 3 daily quests, practice from mistakes, profile.
- Original mascot. Correct outputs come from the real simulator (`../shell.js`), never hand-written.

## Known gaps

- `ls -l` isn't supported by the simulator, so it's taught by example only.
- Not offline yet: the root service worker deliberately skips `/prototype/` so it never overwrites the main app's cached page.
- No backup or export yet, unlike Trivia mode.
- Progress is stored under its own `localStorage` key and doesn't touch the main app's progress.

Tests: `tests/prototype.spec.js` plays the whole unit on desktop and phones.
