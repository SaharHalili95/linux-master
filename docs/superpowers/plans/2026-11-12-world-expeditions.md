# World Expeditions Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or executing-plans. Parent integrates and commits; agents own disjoint files and report verification.

**Goal:** Add recognizable player forms, earned world equipment and replayable world challenges without changing the learning content or original worlds.

**Architecture:** A pure WorldExpeditions module selects existing completed-lesson exercises and derives unlocks. The existing lesson engine reports first-attempt results into separately validated best-score state. Player rendering and native UI remain independent.

**Tech Stack:** Existing JavaScript, SVG, CSS and Playwright. No new runtime dependency.

**Spec:** docs/superpowers/specs/2026-11-12-world-expeditions-design.md

## Global Constraints

- Preserve moon, backgrounds, course data, exam scoring, existing XP rewards and all assets.
- Separate branch codex/world-expeditions; merge authorized only after verification. No branch deletion.
- Hebrew/English, 320px, keyboard, reduced motion and optional-module resilience.

## Review Focus

- A saved equipment choice may refer to a still-locked world; never display it as earned.
- A course download may be incomplete; do not draw future questions or falsely unlock modes.
- A match mismatch or retry must not improve first-attempt accuracy.
- Corrupt or merged records must not add progress, inflate values or erase a valid choice.
- A missing optional script must leave lessons and saved progress usable.

### Task 1: Pure expedition model

Files: create prototype/world-expeditions.js and tests/world-expeditions.spec.js.
Interfaces: window.WorldExpeditions.worlds; pool(course, done, section, unitNodes, withFixture); prepare(course, done, section, mode, ready, unitNodes, withFixture, random=Math.random); unlockedGear(course, done, ready, unitNodes). Uses window.GameProgress.world for level calculation. Worlds expose section, bilingual title/brief/gearName. prepare returns null or {section,mode,count,exercises}; valid modes explore=3 and streak=5, streak requires level>=2. Pool uses original lesson exercise index in canonical UID, excludes teach/exams/locked units, includes fixtures and is deduplicated.
- [x] Write failing tests for loading/locks, pool eligibility, original UIDs/fixtures, no mutation, unique samples, invalid modes and gear thresholds.
- [x] Implement and run component tests on Chromium and WebKit.

### Task 2: Character art and previews

Files: prototype/character.js, prototype/character.css, prototype/avatar-options.js, prototype/avatar-options.css; tests/avatar-options.spec.js and new tests/character-identity.spec.js.
Interfaces: mascot(mood, level, formOverride) remains backward compatible; window.worldGearIcon(section) returns decorative SVG. Equipped gear uses S.worldGear (0 means None) only if WorldExpeditions.unlockedGear(...).some(item=>item.section===S.worldGear). renderForms gains optional final preview(formId) callback. Root integration will pass form=>mascot('happy',rankOf(S.xp).level,form).
- [x] Pin distinct form render output and preview keyboard behavior in tests.
- [x] Implement three recognizable silhouettes, friendly expressions, preserved rank layers and 10 topic gear motifs.
- [x] Inspect real-size character previews, reduced motion and existing character tests.

### Task 3: Expedition state and integration

Files: new prototype/expedition-play.js, prototype/expedition-ui.js, prototype/expedition-ui.css and tests/expedition-ui.spec.js; prototype/app.js, prototype/sync.js, prototype/index.html, prototype/i18n.js, prototype/gameplay.css, prototype/course-ready.js; tests/expedition-integration.spec.js, tests/gameplay-integration.spec.js.
Interfaces: S.expeditionBests validated map; S.worldGear integer 0..10 and S.worldGearUpdatedAt nonnegative safe integer. sync helpers normalizeExpeditionBests(value), merge bests by max, merge gear choice by validated timestamp and stable tie break. Optional model absence cannot erase state. UI renders choices, locks, bests, narrative and gear selection. Lesson engine preserves canonical UIDs for expedition exercises and tracks initial answers and match misses, then stores completed-run bests without XP/gems/done changes. Quitting produces no result.
- [x] Test validation, corruption and merge; then implement independent state helpers.
- [x] Test normal/streak entry, eligibility, completion, incorrect matches, retries, abort, reward isolation, backup/restore and unavailable modules.
- [x] Implement board, equipment collection, first-attempt tracking and result feedback. Verify Hebrew/English and 320px focus/layout.

### Task 4: Delivery

Files: tests/playwright.config.js, tests/package.json, .github/workflows/pages.yml, prototype/index.html and docs/design/game-foundation.md.
- [x] Include new assets in deployment/lint/device tests and version changed scripts/styles.
- [ ] Run relevant tests during development, then full suite and quality checks. Inspect actual screens and request independent review.
  Focused integration/UI tests: 40 passed. Quality checks passed. Screens inspected and independent review completed. Full regression run is in progress; final delivery evidence belongs in the QA report and PR.
- [ ] Commit specific files, push a new PR, wait for CI and merge the exact approved commit while retaining branches.
- [ ] Verify post-merge CI/deployment and live interactions. Save a detailed QA report on Desktop and report the actual remaining limits without claiming subjective perfection.
