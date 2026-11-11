# Gameplay Systems Implementation Plan

**Goal:** Add meaningful, reversible world progression, practice medals, player appearance selection and contextual story framing while preserving the original learning experience.

**Architecture:** World progression and mock-exam medals derive only from the existing completed-node set and complete course, with no duplicate rewards or official certification claims. An accessible player form and palette selectors is persisted and validated in the existing save format; NPCs remain separate. Story framing uses existing unit metadata and never changes questions, answers, terminal goals or scoring. All UI layers preserve the moon, scenery and reduced-motion support.

**Tech Stack:** Vanilla JavaScript, existing SVG, HTML/CSS, Playwright.

- [x] Add tested world progression and mock-exam medal calculations with loading, empty and duplicate-data safeguards.
- [x] Add an accessible, validated player form and palette selectors and persist it through reload and backup without changing earned rank or NPCs.
- [x] Add bilingual, contextual mission introductions for existing learning units, separate from daily quests and mock exams.
- [x] Integrate world progress and medals into existing map/profile surfaces without false certification claims.
- [ ] Verify responsive layout, RTL/LTR, keyboard, existing saved data, offline behavior, original moon/background, lessons, exams and all affected CI checks. Inspect rendered results.
- [ ] Review the final change and merge the separate branch only after all required checks pass, as the user authorized.
