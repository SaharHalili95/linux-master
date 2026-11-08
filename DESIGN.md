# Linux Master design: a world you enter, a hero you become

Approved by the owner on 2026-11-08 from the mockups at
https://claude.ai/artifact/7V9MJNV8qi5YDo29sxFx6m (board "2+3"), with one change: more color, and parts need not match.
Feeling comes from big adventure games (the owner named Fortnite, God of War, Horizon, Call of Duty, Assassin's Creed).
Nothing is copied from them, and the look stays away from Duolingo's chunky buttons and winding circles.

## The idea

The course is a digital world. Each of the 11 parts is a region with its own landscape, colors, name and one or two
lines about why it matters. The learner is a hero: the terminal mascot gains ranks, and each command learned is a power.
Inside a lesson the world steps back and the terminal is the star.

## Regions

| Part | Topic | Region | Ground | Accent | Scene |
|---|---|---|---|---|---|
| 1 | Foundations | The Gateway | deep teal | sunset amber | ridges |
| 2 | Text power | River of Text | ocean blue | coral | waves |
| 3 | Files, permissions, disks | City of Files | indigo | gold | server towers |
| 4 | Users, processes, boot | Citadel of Processes | violet | magenta | citadel |
| 5 | Installing software | Package Harbor | emerald | lime | containers |
| 6 | Networking and SSH | The Grid of Lights | midnight | electric cyan | network |
| 7 | Scripting and scheduling | The Script Works | burnt umber | orange | factory |
| 8 | Security | The Firewall | crimson | ember | wall |
| 9 | More exam topics | The Archive | plum | rose | stacks |
| 10 | More certifications | New Frontiers | aurora green | violet | horizon |
| 11 | Mock exams | The Arena | black | gold | arena |

Scenes are drawn in SVG from one small generator, so there are no image downloads and offline stays small.

The owner likes the large moon. Every region keeps it as the recurring signature, in that region's accent color, in the sky of the path and behind the power on the win screen.

## Foundations

- **Type.** Secular One for headings (self-hosted, Hebrew and Latin), Rubik for text, JetBrains Mono only for commands,
  output and measurements.
- **Icons.** One drawn inline SVG set, one stroke weight. No emoji in the interface.
- **Buttons.** Flat, confident, square-cut, no chunky bottom shadow. Press scales to 0.97 in 100 ms.
- **Motion.** One easing, `cubic-bezier(0.23, 1, 0.32, 1)`, under 300 ms for interface moves. The win moment is the one
  authored, longer animation. Reduced motion gets short fades.
- **Sheets** rise from the bottom and leave the same way. A destructive action never looks like a safe one.
- **Text on color** is tinted from that color, and passes 4.5:1. Selection, caret, focus rings and scrollbars are themed.

## Heroes and powers

Ranks are earned by XP, with a Hebrew title for each. Nodes on the path are hexagons, and a finished one shows the power
it gave. Lesson progress and its saved keys do not change, so nobody loses progress.

## Order of work

1. Foundations: fonts, tokens, icons, buttons, top bar (the XP number is clipped today), sheets.
2. The world path: region scenes, names, short text, hexagon nodes.
3. Ranks, powers and the win moment.
4. Check every region and screen at phone width, then the live site.
