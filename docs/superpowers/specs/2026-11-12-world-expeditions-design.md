# World expeditions and player identity

## Intent and authorization

The user requested another iteration after the product was assessed at 7/10, specifically addressing similar player silhouettes, passive narrative framing and progress that unlocks no new play. They approved another merge after verification and retained the requirement for a separate branch. The following mechanics are implementation choices, not claims that the user specified each number.

## Preserve

Keep Sahar's moon and every world's existing background and animation. Do not edit course questions, accepted answers, terminal goals, exam scoring, certification tags, existing XP rewards or earned progress. Keep the old branch and every existing asset. No LinkedIn posting. Native controls, Hebrew/English, 320px layouts, keyboard focus and reduced motion remain required.

## Player identity

Core remains the friendly terminal robot. Scout gets a visibly different exploration silhouette and Guardian a broader protective shell, with readable friendly expressions. Preserve existing rank equipment and palette choices. The profile form choices show real character previews rather than text alone. The player remains separate from topic NPCs.

## Expedition loop

Add a world expedition board to Quests, above the unchanged daily quests. Select one of worlds 1–10; the exam world remains for mock exams. Show the world's existing companion, a short objective grounded in its Linux topic, progress toward unlocks and a clear mode choice.

Explore mode draws exactly 3 distinct graded exercises from completed lessons in that world. It is available when the full course is ready and at least 3 eligible exercises exist. Streak mode draws exactly 5 and unlocks at world level 2, with at least 5 eligible exercises. Questions, answers and fixtures are reused unchanged. No live timer is imposed. Missing data or modules keep the original learning path usable and show an honest unavailable/loading state.

Runs use the existing lesson engine with practice protection (no lost lives), preserve each exercise's canonical UID for mistake review, and record first-attempt results only. Normal retries still teach the answer but cannot improve the first-attempt score. Match errors also count against first-attempt accuracy. Finishing a run records the best number of first-attempt correct answers for world and mode. Quitting records no expedition result. Runs do not award XP, gems, official medals or course completion keys; the reward is a personal best and visible mastery feedback. Summary shows objectives achieved, previous/new record and a useful retry/return action.

## World equipment

Reaching level 2 in any learning world unlocks one topic-specific cosmetic equipment item. The profile offers None and earned items, while locked items explain the requirement. One world item can be equipped at a time in addition to existing rank equipment. Selection persists through reload and backup/restore and merges by validated timestamp. Locked/invalid selections never render as earned equipment. Appearance is independent from challenge scores. The level-2 unlock also exposes Streak mode, making progress change the available play.

## State and modular boundaries

WorldExpeditions owns immutable world metadata, read-only exercise selection and derived unlocks. Expedition bests use keys `1:explore` through `10:streak` and bounded integer values 0–3/0–5; absence means no completed run. Merge bests by max, without manufacturing missing records. The existing required sync module provides state validation so a missing optional expedition script does not erase saved data. UI and rendering stay separate from course data.

## Acceptance

Distinct silhouettes at actual mobile sizes; friendly expressions; visible selector previews. Correct locked/unlocked states; no future/exam questions in runs; unique canonical IDs and intact fixtures; honest first-attempt results, retries and aborts; persisted equipment and records; no rank/XP/exam regression; missing-module recovery; full local suite and CI; independent review; merge the exact tested commit and verify the live site afterward. Automated success alone cannot prove a subjective 10/10 or market fit.
