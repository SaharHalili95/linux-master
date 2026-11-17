# Trivia into Linux Master: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One app at the site root, with Trivia as a feature inside it (Practice tab) and the separate Trivia app deleted.

**Architecture:** Learn mode moves from `prototype/` to the root. The old Trivia app is parked in `classic/` while its features are rebuilt with Learn's components on top of a lazily loaded `trivia.js` engine. Then `classic/` is deleted. Each phase ships on its own branch and PR.

**Tech Stack:** Plain JS/HTML/CSS (no framework, no build), Service Worker PWA, Playwright tests in `tests/`, GitHub Pages deploy via `.github/workflows/pages.yml`.

**Spec:** `trivia-merge-design.md` (Hebrew). It is approved. Commit it to `docs/superpowers/specs/2026-11-16-trivia-merge-design.md` in Task 1.

**Base:** origin/main `4e98ce0`. The local checkout at `/Users/saharhalili/github-updates/linux-master` is behind, so run `git pull` first.

## Global Constraints

- **Storage keys never change.** Trivia uses `quizStats`, `levelProgress`, `reviewState`, `banditDone`, `roundSize`, `answerMode`, `guideScope`, `learningLevel` and `lang`. Learn uses `linux-master-proto`, `learnOffline` and `lang`. Do not rename them or migrate them.
- **The manifest keeps `"id": "./"` and `"scope": "./"`.**
- **First load of `/` stays under 125 KiB gzipped,** measured over the non-`defer` scripts and stylesheets in `index.html`. If it is over, stop and report. Never raise the limit. (Raised from 120 by the owner on 2026-11-17: 120 was set for Trivia and never measured Learn, which already weighed 123 KiB.)
- **The page talks only to `localhost`, `fonts.googleapis.com` and `fonts.gstatic.com`.**
- **No framework, no build step, no new npm runtime dependency.**
- **UI is built only from Learn's classes and tokens:** `btn`, `card`, `practice-card`, `chip`, `tab`, `ic` and the `:root` variables in `styles.css`. Add no new hex colors outside `:root`.
- **Every user-facing string goes through `i18n.js`,** in both `he` and `en`.
- **Branch and PR per phase:**
  - Phase 1 (Tasks 1-2): `feat/learn-at-root`
  - Phase 2 (Tasks 3-6): `feat/trivia-feature`
  - Phase 3 (Task 7): `feat/remove-classic`
- **Commits:** stage files by name, never `--no-verify`, new commits only. End each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Verification:** `cd tests && npm run quality && npx playwright test` must pass before each PR.

## Review Focus

1. **A learner who has only Trivia progress** (Trivia keys set, no `linux-master-proto`) opens `/`. Learn onboarding must not clear Trivia keys, and the Trivia screen must show their stats. Test it in Task 4.
2. **An installed PWA opens offline right after a deploy.** It must still load. The old caches may be deleted only after the new cache is filled. Test it in Task 2.
3. **Old deep links:** `/prototype/?x=1#y`, `/prototype/legal.html` and `/?mode=trivia` keep working and keep their query and hash. Test them in Task 1, and `?mode=trivia` again in Task 7.
4. **A learner using English** (`lang=en`) sees the Trivia, Tutorials and Missions screens fully in English. Test it in Tasks 4-6.
5. **Bad stored values,** such as `roundSize='7'`, `answerMode='x'` or `quizStats='not json'`, fall back to the defaults without throwing. Test it in Task 3.

---

## Phase 1: Learn at the root

### Task 1: Move Learn to `/` and park Trivia in `classic/`

**Files:**
- Move `index.html`, `app.js` and `styles.css` to `classic/`. Inside them, fix paths: `shell.js`, `data/` and `sw.js` become `../`, the `prototype/` links become `../`, and the manifest and icons become `../`. Drop the redirect block at `index.html:6-10`.
- Move every file in `prototype/` to the root. Fix `../shell.js`, `../data/`, `../sw.js` and `../icon-*` to root paths, including `loadTrivia()` in `app.js` around line 177 and the SW register at line 1108.
- Create `prototype/index.html` and `prototype/legal.html` as redirect pages. Each one runs `location.replace('../' + page + location.search + location.hash)` and has a `<meta http-equiv="refresh">` fallback.
- In the new root `index.html`, add an inline head script: if `?mode=trivia` is in the URL, `location.replace('classic/' + location.hash)`. Point the `toTrivia` link at `classic/`.
- Modify `.github/workflows/pages.yml`: copy the root files plus `classic/` and the `prototype/` redirect pages.
- Modify `tests/package.json`: update the `lint` and `validate` paths.
- Modify all spec files: `goto('./prototype/')` and `goto('/prototype/')` become `goto('./')`. Leave `goto('./?mode=trivia')` as it is.
- Modify `tests/budget.spec.js`: measure the first-load files of the new root `index.html`, using the non-`defer` `<script src>` and `<link rel=stylesheet>` parsed from the HTML. Update the deploy-copy list.
- Create `tests/merge.spec.js`.
- Copy the spec into `docs/superpowers/specs/2026-11-16-trivia-merge-design.md`.

**Interfaces:**
- Produces: Learn served at `/`, the old Trivia at `/classic/`, and redirect stubs at `/prototype/`.

- [ ] **Step 1:** Write `tests/merge.spec.js` with these tests:
  - `'old Learn address opens the app at the root'`: `goto('./prototype/?x=1#y')` leads to `expect(page).toHaveURL(/\/\?x=1#y$/)`, and `#learn` is visible.
  - `'old legal page redirects'`: `goto('./prototype/legal.html')` leads to `toHaveURL(/\/legal\.html$/)`.
  - `'?mode=trivia opens classic Trivia'`: `goto('./?mode=trivia')` leads to `toHaveURL(/\/classic\/$/)`, and `#home` is visible.
  - `'progress of both modes survives the move'`: use `addInitScript` to seed `linux-master-proto` with `{xp:120}` and `quizStats` with `{correct:7,answered:9}`. Then `/` shows 120 XP, and `classic/` shows `#learnedCount` = `7`.
- [ ] **Step 2:** Run `npx playwright test merge.spec.js --project=chromium`. It should FAIL because the redirects don't exist yet.
- [ ] **Step 3:** Do the moves with `git mv`, then make the path fixes listed under Files. Until Task 2 lands, `sw.js` still routes by `/prototype/`. Both tasks ship in the same PR, so do not deploy between them.
- [ ] **Step 4:** Run `npm run quality && npx playwright test`. Everything should PASS, including `budget.spec.js`. If the budget fails, stop and report the KiB number.
- [ ] **Step 5:** Commit with the message `refactor: serve Learn at the root, park Trivia in classic/`.

### Task 2: One service worker cache, network first

**Files:**
- Modify `sw.js`:
  - Use one cache, `linux-master-v31`, with `FILES` set to the root first-load files plus `manifest.webmanifest` and the icons.
  - Use one strategy for every same-origin GET: the network first, then the cached copy. This is today's `learnMode()`, generalized.
  - Keep the Google Fonts runtime caching.
  - In `activate`, delete every cache except `linux-master-v31`.
- Modify `tests/update.spec.js` and `tests/merge.spec.js`.

- [ ] **Step 1:** Add the test `'old caches are removed and the app opens offline after update'` to `merge.spec.js`:
  - Before the new SW installs, seed the caches `linux-master-v30` and `linux-master-learn`.
  - Wait for `navigator.serviceWorker.ready`, then call `context.setOffline(true)` and reload.
  - Expect `#learn` to be visible, and `await caches.keys()` to equal `['linux-master-v31']`.
- [ ] **Step 2:** Run it. It should FAIL.
- [ ] **Step 3:** Implement the `sw.js` changes. Bump `?v=` in `index.html` wherever the SW `FILES` list requires it.
- [ ] **Step 4:** Run `npx playwright test merge.spec.js update.spec.js budget.spec.js`. Everything should PASS.
- [ ] **Step 5:** Commit with the message `feat: single service worker cache, network first`. Open the PR for Phase 1.

## Phase 2: Trivia as a feature

### Task 3: `trivia.js` engine (logic only, no DOM)

**Files:**
- Create `trivia.js`, ported from `classic/app.js`:
  - question builders: lines 17-25 and 118-154
  - Leitner, cycles and batches: lines 48-63 and 155-190
  - typed-answer canonicalization: lines 281-358
  - `CORE_GUIDE_IDS` and `similarCommands`
- Modify `app.js`: `loadTrivia()` also loads `trivia.js?v=...`.
- Create `tests/trivia-engine.spec.js`.

**Interfaces:**
- Produces a global `Trivia`:
  - `Trivia.LEVELS`: a string array, `['intro','functions','pipe','pipeFunction','pro','pipeTwoFlag','workflow','bandit']`
  - `Trivia.settings()`: returns `{roundSize: 5|10|20, answerMode: 'choice'|'type', guideScope: 'core'|'all', level: string}`
  - `Trivia.setSetting(key, value)`: returns `void`. It writes the same localStorage key as today.
  - `Trivia.nextRound(level)`: returns `Entry[]` of length `roundSize`. Each entry is `{level, key, id, q: {prompt, options?, answer, tag}, commands: string[]}`.
  - `Trivia.record(entry, correct, given)`: returns `void`. It updates `quizStats`, `levelProgress` and `reviewState` exactly as `recordAnswer` and `finishAnswer` do today.
  - `Trivia.checkTyped(answer, given)`: returns `{ok: boolean, blamed: string[]}` (uses `canonicalCommand` and `blamedCommands`).
  - `Trivia.progressText(level)`: returns a string.
  - `Trivia.stats()`: returns `{correct, answered, byLevel, byCommand}`.
  - `Trivia.weakCommands(n)`: returns `string[]`.

- [ ] **Step 1:** Write the tests. Each one loads `/`, `await page.evaluate(() => loadTrivia())`, and then:
  - `'typed answers match regardless of flag order and spacing'`: `checkTyped('ls -la', 'ls  -al').ok === true`, and `checkTyped('grep -i x f', 'grep x f').ok === false`. Also copy the equivalence cases that exist today in `tests/fixes.spec.js` and `tests/learning.spec.js`.
  - `'a round has roundSize entries'`: `setSetting('roundSize', 5)`, then `nextRound('intro').length === 5`.
  - `'record keeps today\'s storage format'`: after `record(entry, true)`, `JSON.parse(localStorage.quizStats).correct` goes up by 1, and `reviewState.intro.boxes[id]` is `>= 1`.
  - `'bad stored values fall back to defaults'`: seed `roundSize='7'`, `answerMode='x'` and `quizStats='not json'`. Then `settings()` deep-equals `{roundSize:20, answerMode:'choice', guideScope:'all', level:'intro'}`, and `stats().answered === 0`.
- [ ] **Step 2:** Run `npx playwright test trivia-engine.spec.js --project=chromium`. It should FAIL because `Trivia` is not defined.
- [ ] **Step 3:** Port the code into `trivia.js` behind the interface above. Strings come from `i18n.js`, not from a local `I18N`.
- [ ] **Step 4:** Run the same command. It should PASS. Then run `npm run lint`, after adding `trivia.js` to the lint list.
- [ ] **Step 5:** Commit with the message `feat: trivia engine as a lazy module`.

### Task 4: Trivia screen in the Practice tab

**Files:**
- Modify `index.html`:
  - Add a card `#practiceTrivia` (`card practice-card`, icon `ic-target`) to `#practice`.
  - Add a sheet or screen `#triviaScreen` containing:
    - the level list (8 buttons from `Trivia.LEVELS` with `progressText`)
    - the segmented toggles for round size (5/10/20), answer mode and scope
    - a Start button
    - a stats panel with correct/answered and `weakCommands(5)`
- Modify `app.js`:
  - `openTrivia()` renders the screen.
  - The Start button calls `startLesson('trivia-' + level, exercises, { practice: true, onAnswer })`, where `exercises` is built from `Trivia.nextRound(level)`.
  - Add the hook `opts.onAnswer(ex, correct, given)` to `startLesson`. It calls `Trivia.record`.
  - Typed questions use Learn's existing free-text exercise type if it has one. If not, add `type: 'command'`, checked by `Trivia.checkTyped`. Hints come from `hintLines` (ported into `trivia.js`).
  - Question reports use Learn's existing report flow (`editQ` / `showReports`) instead of the GitHub URL.
- Modify `i18n.js`: add the keys `triviaTitle`, `triviaText`, `levels.*`, `roundSize`, `answerChoice`, `answerType`, `scopeCore`, `scopeAll`, `triviaStats` and `weakTitle`, each in `he` and `en`.
- Modify `styles.css`: add layout rules only, built from the existing tokens.
- Port the Trivia-screen assertions from `learning`, `hints`, `explain`, `fixes`, `habits`, `report`, `english`, `layout` and `a11y` (the `?mode=trivia` tests) to `goto('./')`, then open Practice and then Trivia.

- [ ] **Step 1:** Write the tests in `tests/trivia-feature.spec.js`:
  - `'trivia round from Practice records progress'`: open Practice, then Trivia, then level intro, with size 5 and Start. Answer 5 questions, and expect `quizStats.answered === 5`.
  - `'typed mode accepts an equivalent command'`.
  - `'trivia-only learner keeps stats'`: seed only `quizStats={correct:7,answered:9}`. `/` loads, and the stats panel shows `7 / 9`. Afterwards `localStorage.quizStats` is unchanged.
  - `'trivia screen in English'`: with `lang=en`, there must be no Hebrew characters (`/[֐-׿]/`) in `#triviaScreen` text.
  - `'trivia screen passes axe'`.
- [ ] **Step 2:** Run it. It should FAIL.
- [ ] **Step 3:** Implement the changes listed under Files.
- [ ] **Step 4:** Run `npx playwright test trivia-feature.spec.js` plus the ported specs, on all projects. Everything should PASS.
- [ ] **Step 5:** Commit with the message `feat: trivia in the Practice tab`.

### Task 5: Tutorials card

**Files:**
- Modify `trivia.js`: port `tutorialCurriculum` and the lesson filter from `classic/app.js:79-117`. Expose `Trivia.tutorials(level)`, which returns `{title, lessons: {cmd, meaning, example}[]}`.
- Modify `index.html` and `app.js`: add a card `#practiceTutorials` that opens `#tutorialsScreen`. It has a level picker, a search field, and a list that pages 30 at a time with a "more" button.
- Modify `i18n.js` and the tests.

- [ ] **Step 1:** Write the tests:
  - `'tutorials list, filter and load more'`: the first page shows 30 items, the filter narrows the list, and "more" adds 30 more.
  - `'tutorials in English'`: the same no-Hebrew check as in Task 4.
- [ ] **Step 2:** Run them. They should FAIL.
- [ ] **Step 3:** Implement the changes listed under Files.
- [ ] **Step 4:** Run them again. They should PASS.
- [ ] **Step 5:** Commit with the message `feat: tutorials in the Practice tab`.

### Task 6: Terminal missions card, backup, reminder

**Files:**
- Modify `index.html` and `app.js`:
  - **Missions:** add a card `#practiceMissions` that lazily loads `data/missions.js`. It opens `#missionsScreen` with the mission list and a terminal (`shell.js`), ported from the `#bandit` and `#missions` sections and `renderBandit` (`classic/app.js:381-399`). Done levels are stored in `banditDone`, in the same format.
  - **Backup:** `saveBackup()` writes `{app:'linux-master-learn', format:2, state, lang, trivia:{<each Trivia key>: raw string}}`. `restoreBackup()` accepts three formats:
    - Learn format 1
    - Learn format 2, which also restores the `trivia` keys
    - the old Trivia backup `{app:'linux-master', format:1, code}`, decoded with `decodeBackup` (port it from `classic/app.js:407-419`)
  - **Reminder:** if `i18n.js` has no reminder key, port the daily reminder (`addReminder` and `#reminderTime`) into `#profile`.
- Port `bandit.spec.js` and `missions.spec.js` to the new screen.

- [ ] **Step 1:** Write these tests, then port the bandit and missions specs:
  - `'mission completes and is saved'`
  - `'old trivia backup restores'`, using a fixture made with the current `encodeBackup` format
  - `'backup format 2 round-trips both modes'`
  - `'missions in English'`
- [ ] **Step 2:** Run them. They should FAIL.
- [ ] **Step 3:** Implement the changes listed under Files.
- [ ] **Step 4:** Run the full suite. Everything should PASS.
- [ ] **Step 5:** Commit with the message `feat: terminal missions, unified backup`. Open the PR for Phase 2.

## Phase 3: Remove the old app

### Task 7: Delete `classic/` and finish up

**Files:**
- Delete `classic/` and any spec file that still targets it.
- Modify the root `index.html` head script: `?mode=trivia` now leads to `showTab('practice')` and `openTrivia()`, with no redirect. Remove the `toTrivia` link and the `mode`, `trivia` and `learn` i18n keys if nothing uses them.
- Modify `manifest.webmanifest`: set `theme_color` to `#16213a` and `background_color` to `#081129`.
- Modify `pages.yml`, `tests/package.json` and `README.md`. The README describes one app with Learn plus a Trivia feature, and updates the command count and features.
- Modify `tests/merge.spec.js`: the `?mode=trivia` test now expects `#triviaScreen` visible at `/`.

- [ ] **Step 1:** Update the `?mode=trivia` test. Add `'no classic files are deployed'`: `pages.yml` must not contain `classic`.
- [ ] **Step 2:** Run them. They should FAIL.
- [ ] **Step 3:** Delete `classic/` and make the edits listed under Files.
- [ ] **Step 4:** Run `npm run quality && npx playwright test`. Everything should PASS on all projects.
- [ ] **Step 5:** Commit with the message `chore: remove the separate Trivia app`. Open the PR for Phase 3.
