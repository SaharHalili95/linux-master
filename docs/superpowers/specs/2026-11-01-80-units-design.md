# Design: Learn mode grows to 80 units

Date: 2026-11-01. Status: approved by the owner ("80", "יאלה רוץ מאשר מיזוג").

## Intent

The owner's goal: whoever finishes Learn mode is ready to pass the best official Linux certifications. We cover the union of LPIC-1 v5.0, RHCSA (EX200, RHEL 10) and LFCS. The owner chose 80 units after we discussed 50: enough to cover every exam topic with practice, not so many that it repeats itself.

The full unit list, with commands and exam tags, is [materials/curriculum.md](../../../materials/curriculum.md). That file is the source of truth for what each unit teaches.

## Goals

- 80 units in 10 parts. Units 1-6 already exist and stay exactly as they are.
- Every LPIC-1 v5.0 objective is covered by at least one unit. RHCSA and LFCS topics are covered as knowledge.
- Units 78-80 are mock exams for LPIC-1, RHCSA and LFCS.
- Every unit has the same feel as units 1-6: 4 lessons, a chest, a boss, Hebrew and English, and the same exercise types.
- Every new part ships as its own branch and PR, merged only after all checks pass.

## Non-goals

- No real VM or real Linux in the browser. RHCSA and LFCS are hands-on exams, and the app says honestly that the learner should also practise on a VM before them.
- No accounts, server or payments. Progress stays in `localStorage`.
- No change to Trivia mode.

## Anti-goals: failure even if it works

- **Invented output.** Every "what will it print?" answer comes from the simulator or from output recorded on real Linux. Never hand-written.
- **Unclear questions.** The owner's rules from the clarity pass apply to every new exercise:
  - Name the file and say what is in it.
  - Show the file contents on "what will it print?".
  - The answer shows the full command with the path.
  - Counting tasks end with a number box.
  - No sideways scrolling.
  - Never call a command "new" if it was used before (`known: true`).
- **Lost progress.** A unit number never changes once shipped (keys are `u{n}-{node}`).

## How it is built

### Files

`prototype/units.js` holds units 2-6 today. It would grow past 5,000 lines, so new units go in one classic-script file per part: `prototype/parts/p1.js` … `p10.js`.
- Each file pushes its units onto `COURSE`.
- `index.html` loads them in order after `units.js`, with the same `?v=pNN` version.
- `pages.yml` must deploy the new folder. The "Pages deploys every file Learn mode loads" test enforces this.
- Unit 7 (Patterns) replaces its locked placeholder in `lessons.js` and moves into `p1.js`.

### Fixtures

- `homeFixture()` stays for text work.
- New units may add fixtures (for example a `/etc` with `passwd`, `group`, `fstab` and `hosts`, or a script folder) next to their part.
- Every unit names its fixture in `unit.fixture`.

### Three sources of truth for answers

1. **Simulator (✅/🟡).** `shell.js` gains the commands the curriculum marks 🟡, each with tests in `tests/simulator.spec.js`:
   - `touch`, `rmdir`, `tee`, `xargs`, `ln`, `stat`, `id`, `groups`, `export` and `env`.
   - `test` and `[`, `seq`, `diff`, `nl`, `paste`, `md5sum`.
   - More `sed`, `awk` and `grep -E`.
   - Basic `if`, `for` and `while` and script running, as far as practical.

   The Ubuntu sandbox job keeps checking that the simulator agrees with real Ubuntu.
2. **Recorded output (🎞).** A new script, `tests/sandbox/record.sh`, runs a command list (`tests/sandbox/record/*.txt`) in Docker and writes `prototype/recorded.json`, in the form `{ id: { distro, cmd, out } }`.
   - It runs on `ubuntu:24.04` for Debian-family commands and on `almalinux:10` for RHEL-family commands.
   - Containers run privileged where the topic needs it: loop devices for LVM and mount, and systemd as PID 1 for systemctl.
   - Output exercises use `rec: 'id'` instead of `cmd`. The card shows "Recorded on Ubuntu 24.04" or "Recorded on AlmaLinux 10".
   - A content test fails if an exercise points to a missing recording.
   - If a command cannot be recorded honestly, the topic is taught with concept questions instead.
3. **Concept questions.** Choice, sentence and match exercises on ideas, for example GPT vs MBR or SELinux modes.

### Bosses for units the simulator can't run

Their boss is a "scenario" of 3 steps using recorded output: read this output, then answer or type the command. Typed commands are checked against an accepted list (`accept: [...]`), not run.

### Mock exams (units 78-80)

- A new node kind, `exam`, replaces the 4-lesson layout for these units.
- Questions are drawn from the bank by exam tag (`exam: ['L103.7', 'R', 'F']` on each exercise or unit).
- LPIC-1: 60 questions, 90-minute timer, weighted by objective, pass mark 500/800.
- RHCSA and LFCS: 20 questions each.
- No hints and no feedback until the end. The result screen shows the score and which topics to review.

### Path UI

- **Part headers** go between units, for example "Part 3 · Files, permissions and disks".
- **Exam chips** (LPIC, RHCSA, LFCS) go on each unit banner.
- On open, the path scrolls to the current node.
- A part list in the profile tab lets the learner jump to a part.
- Lesson numbers stay 1-4 per unit (PR 19).

### Tests in every phase

- The content test, "every exercise in every unit is answerable and fully translated", runs over every unit automatically. It is extended with these checks:
  - `rec` ids exist.
  - Exam tags are valid.
  - Every LPIC-1 objective is covered once part 10 ships.
- The whole-course play test is split per part (`@part1` … `@part10`) and CI runs parts in parallel, so time stays flat.
- The layout ("fits the screen") test and the accessibility (axe) test run on one unit of every part.
- These must all stay green before every merge:
  - ESLint
  - html-validate
  - Playwright on chromium, iphone-webkit, android-chrome and iphone-se
  - The Ubuntu answers job

## Phases

Each phase is one branch and one PR, merged after checks pass. The plan with steps is [docs/superpowers/plans/2026-11-01-80-units-plan.md](../plans/2026-11-01-80-units-plan.md).

| Phase | What ships |
| --- | --- |
| 0 | Infrastructure: `parts/` loading, part headers, exam chips, scroll to current, recording pipeline, per-part test split |
| 1 | Units 7-10 (finishes part 1) |
| 2 | Units 11-20 |
| 3 | Units 21-32 |
| 4 | Units 33-44 |
| 5 | Units 45-50 |
| 6 | Units 51-58 |
| 7 | Units 59-66 |
| 8 | Units 67-72 |
| 9 | Units 73-77 |
| 10 | Units 78-80: mock exams and the objective-coverage test |

Big parts (2, 3, 4) may ship in two PRs of about 5-6 units each.

## Calls I made (the owner can overrule)

- One script file per part, loaded up front. With gzip, 80 units come to roughly 300 KB, fine for a phone. Lazy loading can come later if needed.
- AlmaLinux 10 stands in for RHEL 10 when recording, since RHEL itself needs a subscription.
- The mock exam sizes: 60, 20 and 20 questions.
- Units marked "concept" have no terminal at all.
