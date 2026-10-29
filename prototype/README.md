# Duolingo-style prototype (throwaway)

One full unit of the planned course ([materials/curriculum.md](../materials/curriculum.md), Unit 1 "Where am I?"), built to feel the Duolingo loop before replacing the current app.

```bash
node tests/serve.js 8791
```

Then open http://localhost:8791/prototype/ (phone size works best).

## What's in it

- Winding path: 4 lessons, a chest, a terminal boss, and a locked Unit 2 preview.
- Lessons of 6-7 exercises: new-command cards, choice, "what does it print?", build the command from tiles, fill the flag, match pairs, and live terminal tasks.
- Green / red check bar, mistakes return at the end of the lesson, combo counter, sounds, confetti.
- XP, streak with a week view, gems, 3 daily quests, practice from mistakes, profile.
- Original mascot. Correct outputs come from the real simulator (`../shell.js`), never hand-written.

## Known gaps

- Hebrew only. No English yet.
- `ls -l` isn't supported by the simulator, so it's taught by example only.
- Not deployed: `pages.yml` copies only the root files.
- Before deploying under the same origin, `sw.js` must stop caching every navigation as `./index.html`. Today a visit to `/prototype/` would overwrite the cached main page.
- Progress is stored under its own `localStorage` key and doesn't touch the main app's progress.

Tests: `tests/prototype.spec.js` plays the whole unit on desktop and phones.
