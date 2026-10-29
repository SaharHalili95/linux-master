# Duolingo mechanics: copy, adapt, skip

Goal: feel as close to Duolingo as possible, while staying free with no server and no account.

| Duolingo | What it does | Linux Master |
| --- | --- | --- |
| **Path** of units and lessons on a winding map | Always shows "where am I, what's next" | **Copy.** Winding path, round lesson nodes, locked / current / done, a big "Start" bubble on the current node |
| Section and unit header ("Section 1, Unit 1: ...") | Context and a sense of progress | **Copy.** Coloured unit banner above each part of the path |
| Short lessons (~15 exercises) with a top progress bar | Small wins, quick sessions | **Adapt.** 6-8 exercises per lesson, same top bar, close (X) on the left |
| Exercise variety: translate, word bank, match pairs, listen, fill blank | Keeps lessons from feeling the same | **Adapt.** Choice, build-the-command from tiles, match pairs, fill the flag, what does it print, type in the terminal |
| Bottom check bar that turns green / red | Clear instant feedback | **Copy.** Full-width bar with "Check" → "Correct! / Continue" or "Correct answer: ..." |
| Mistakes repeat at the end of the lesson | You can't finish with an error left | **Copy.** Wrong exercises come back at the end of the same lesson |
| Hearts / Energy | Limits mistakes; sells Super | **Skip.** No limits, it's free |
| XP, combo, lesson-end screen | Reward after every lesson | **Copy.** XP per lesson, bonus for a perfect lesson and for combos, end screen with XP, accuracy and time |
| Daily goal and streak, streak freeze | Daily habit | **Copy.** Flame counter in the top bar; freeze is earned (one per 7-day streak), never bought |
| Gems and chests | Rewards and a currency | **Adapt.** Chests on the path give gems; gems only buy streak freezes and cosmetic items. Never pay-to-learn |
| Daily quests | Small goals beyond the lesson | **Copy.** 3 daily quests (earn 30 XP, perfect lesson, 5 in a row) |
| Leagues | Weekly competition | **Later.** Needs a server. Option without a server: "you vs. last week" |
| Mascot (Duo) and characters | Emotion, reactions, personality | **Adapt.** Our own original mascot, not Duo and not Tux. Reacts on correct, wrong and finish |
| Sounds and confetti | Feel-good feedback | **Copy.** Short synthesized sounds (Web Audio, no files), confetti on lesson end, a mute toggle |
| Unit review / Legendary | Hard mode for mastery | **Copy.** Unit end boss (terminal task), Legendary later |
| Practice Hub | Review from your own mistakes | **Copy later.** Built on the existing Leitner engine |
| Bottom tab bar (Learn, Practice, Quests, Profile) | Navigation on phones | **Copy.** Learn, Practice, Quests, Profile |

## Things to keep from today's app

- Answers checked by really running them in the simulated shell, and accepted when the output matches.
- "Why this is wrong" explanation for every wrong option.
- Hebrew and English with RTL, offline PWA, no account, progress in `localStorage`.
- The report-a-problem button (v25).

## Sources

- [Duolingo blog: new home screen and path](https://blog.duolingo.com/new-duolingo-home-screen-design)
- [Duolingo blog: Practice Hub](https://blog.duolingo.com/guide-to-duolingo-practice-hub/)
- [Duolingo 101](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo)
- [StriveCloud: Duolingo gamification and retention](https://www.strivecloud.io/blog/blog-gamification-examples-boost-user-retention-duolingo)
- [Product teardown: Duolingo](https://prodlab.substack.com/p/product-teardown-duolingo)
