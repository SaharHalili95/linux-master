# Progressive Learn Loading

Goal: make the existing first world playable before the rest of the curriculum finishes downloading, preserving the final UI, moon, animation, content and progress.

- Keep shell, language, units 1-6, world, sync, app and character scripts in the critical path. Load remaining original content scripts with ordered defer tags.
- Preload the existing fonts and suppress the uninitialized header only until the existing world stage is ready, avoiding a visible layout jump.
- Finalize the full course in a new small script: sort existing units, refresh the path only when no lesson or popover is active, preserve user scrolling, update an open track chooser.
- Mark offline readiness only after all course assets finish loading and caching. Report an incomplete curriculum through the existing localized load-error message.
- Add tests that hold a later course file and prove the first lesson works before release, remains open after release, and saved advanced progress opens the correct next lesson.
- Verify existing accessibility, mobile layout, curriculum, backup and offline tests. Compare three simulated-mobile Lighthouse runs against the recorded baseline.

No educational source files, scenery definitions, scoring, saved keys or final layout are changed. Keep the work on the existing separate branch with new commits.

Implementation refinements:
- Keep a starter-course snapshot so partially downloaded units cannot appear through navigation, track selection, exams or practice.
- Append fully loaded units while preserving the mounted first world and its moon.
- Cover missing course chunks and a missing finalizer: the starter remains usable and no offline-ready claim is made.
- The previous GitHub browser job cancelled at its 20-minute limit. Run the same coverage in four parallel device jobs; course and Ubuntu jobs remain intact.

Verification:
- ESLint and HTML validation passed.
- Full 654-case suite: 634 passed initially, 7 skipped, 13 interrupted by macOS sleep. Power logs confirmed sleep; all 13 passed when rerun with temporary idle-sleep prevention. Total distinct passing cases: 647.
- Held-download tests prove first-lesson interactivity, retained lesson state, complete-course visibility, saved progress and no partially downloaded practice units.
- Failed-download tests keep the starter usable and never mark an incomplete course as offline-ready.
- Existing offline, course play-through, exam, backup, language, accessibility and mobile-layout coverage was exercised.
- Independent review found premature exposure of partial units. A failing regression reproduced it, and starter-course gating fixed it.
- Three local simulated-mobile Lighthouse runs: median performance 77 versus the recorded baseline 45; accessibility, best practices and SEO 100. Some trace diagnostic audits are unavailable with the installed Lighthouse/Chrome pair, so the scores are not field-performance guarantees.
- Direct CDP network/CPU throttling (200 KiB/s, 150ms latency, 4x CPU) observed the first world at about 1.8 seconds, before full-course readiness.
- Final screenshots at 390x844 and 1440x1000: all 99 units rendered, no horizontal overflow and no page errors.
- Original scenery, character art/styles, curriculum files, translations and simulator are unchanged.
