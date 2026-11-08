# Accounts and progress sync

## Why

Progress lives only in one browser, so the owner's MacBook and iPhone do not see each other. The owner wants user
accounts with one-tap sign-in. The learner comes first: nobody should have to sign up before they have learned
anything, and nobody should ever lose progress.

## Goals

- The profile always offers sign-in, and shows the account and its options once signed in.
- Start learning at once, with no sign-up. Sign-in is offered after the first or second lesson, and again at natural
  moments (a finished unit, before a mock exam). "Later" always works.
- One tap with Google, Apple or GitHub first; LinkedIn and X after that.
- Progress follows the account across devices. Signing in never deletes progress.
- The app keeps working offline and without an account, exactly as today.
- Moving to another provider later stays possible.

## Non-goals

- Email and password sign-in.
- Syncing Trivia mode (Learn mode only for now). The owner's call to widen it.
- Paid plans, leaderboards, friends.
- Skipping stages and the cyber background: separate designs.

## Decisions

Decided by the owner: learn first, sign in later; providers Google, Apple, GitHub, LinkedIn, X.

My calls, for the owner to check:

- **Supabase** for sign-in and storage. Free up to 50,000 monthly users, but free projects pause after a week with no
  activity. Pro is from $25 a month with 100,000 users, no pausing, daily backups for 7 days. Move to Pro before launch.
- **Apple rules.** Guideline 4.8: an app with Google, X or LinkedIn login must also offer a login that limits data to
  name and email, lets people hide their email and does not track for ads. Sign in with Apple is the usual way to meet
  it, so it ships in the first group. Guideline 5.1.1(v): an app without significant account features must work without
  login, which learn-first satisfies. Account deletion must start inside the app and delete the whole account.

## How it works

**Portability.** The OAuth apps at each provider are registered under the owner's accounts. Progress is keyed by our
own learner id, in our own table. All sync code lives in one file, `prototype/sync.js`, so changing provider touches
that file only.

**Storage.** `learners (id, auth_user_id unique)` and `progress (learner_id, state jsonb, updated_at)`, with row-level
security so a learner reads and writes only their own row, and a size limit on `state`. Only the public (publishable)
key is in the app. The Supabase client library is served from `prototype/vendor/` so offline keeps working.

**What syncs.** xp, gems, done, streak, lastDay, days, mistakes, quests, track. Staying on the device: sound, layout
fixes and the report list.

**Merging two devices, never losing anything.**

| Field | Rule |
|---|---|
| done, days | union |
| xp, gems | the larger value (gems are never spent today) |
| lastDay, track | from the side with the later lastDay |
| streak | from the side with the later lastDay; the larger on the same day |
| mistakes | union (a review item may come back once, but none is lost) |
| quests | the later day; within a day, the larger counts |

Merged state always goes through `loadState`, which already rejects bad data.

**When it syncs.** At startup, when a lesson ends, when the app comes back to the foreground. Offline changes wait and
merge on the next connection. A failed sync never interrupts a lesson.

**Screens.** A short sign-in sheet after lesson one or two, an account card in the profile (who is signed in, last sync,
sign out, delete account), and a clear message if sign-in fails.

**Account deletion.** A database function deletes the learner, their progress and the sign-in record. The device keeps
its local copy.

**Privacy page.** Required once accounts exist. It ships with this work, with the About page (exam names, no logos, not
affiliated): item 3 of the store checklist.

## What only the owner can do

Create the Supabase project and the developer apps at Google, Apple (needs the $99 Apple Developer account) and GitHub,
then LinkedIn and X. Passwords and secret keys are entered by the owner directly in those consoles, never in chat.

## Order of work

1. Privacy and About pages.
2. Database tables and security rules, with tests that one learner cannot read another's row.
3. `sync.js`, merging (fully unit-tested) and the profile card, with Google.
4. Apple and GitHub, the sign-in sheet, account deletion.
5. LinkedIn and X.
6. Native sign-in inside the store app, with the Capacitor packaging (item 5). Apple advises against sending people out
   to a browser to sign in, so the web flow is not enough there.

## Left to the builder

Exact wording and timing of the prompt, within the rules above.
