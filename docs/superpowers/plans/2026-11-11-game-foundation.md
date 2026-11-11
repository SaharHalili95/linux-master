# Game Foundation Implementation Plan

**Goal:** Establish an explicit, testable presentation foundation for player identity and learning-world characters while preserving the existing game and content.

**Architecture:** Keep the current player mascot and original world renderer independent. A character catalog owns the available art and explicit unit-to-role assignments; the path renderer asks it for a character and the offline cache derives the same asset list from it. Course content, progress, moon, backgrounds and learning behavior remain the existing source of truth. Document the wider gameplay and visual architecture separately as a proposal, not an implemented system.

**Tech Stack:** Existing vanilla JavaScript, SVG and WebP, HTML/CSS, Playwright.

- [x] Document product boundaries, future extension points, risks and measurable acceptance criteria.
- [x] Add focused tests for complete unit mapping, stable topic assignment regardless of copy or language, safe fallback, character assets and existing learner identity.
- [x] Replace title keyword guessing with a catalog and explicit mappings for the existing course; derive offline assets from the catalog.
- [x] Run quality, focused desktop and iPhone tests, verify render and original world files, and request review before any merge.
