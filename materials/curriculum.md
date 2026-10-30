# Curriculum: from zero to everyday Linux

Learner: someone who has never opened a terminal and wants to feel at home in it. Bandit is one track inside the course, not the goal.

Shape (Duolingo style): **sections → units → lessons**. A lesson is 5-8 exercises. Each unit has 4-5 lessons, a review stop, and ends with a boss: a short task in the simulated terminal. A finished unit can be pushed to Legendary (no hints, no mistakes allowed).

Columns:
- **LPI:** the Linux Essentials 010 objective it covers.
- **Today:** what the current app already has for it (levels 01-08, missions M1-M12).
- **Sim:** can the simulated shell run it? ✅ yes · 🟡 partly / needs work · 🎞 no, use recorded Ubuntu output ("what does it print?") or concept questions.

## Section 1: First steps

| # | Unit | Commands and ideas | LPI | Today | Sim |
| --- | --- | --- | --- | --- | --- |
| 1 | Where am I? | `pwd`, `ls`, `ls -a`, `ls -l`, `cd`, `.`, `..`, `~`, `/` | 012.3 | L01, L02, M1 | ✅ |
| 2 | Reading files | `cat`, `less`, `head`, `tail`, `file` | 013.2 | L01, L02, M1-M4 | ✅ (`less` 🎞) |
| 3 | Making and moving | `touch`, `mkdir`, `cp`, `mv`, `rm`, `rmdir`, globs `*` `?` | 012.4 | L01, L02 | 🟡 (`touch`, `rmdir` missing) |
| 4 | Getting help | `man`, `--help`, `type`, `which`, `history` | 012.1, 012.2 | L01 (`man`, `help`) | 🎞 |

## Section 2: Text power

| # | Unit | Commands and ideas | LPI | Today | Sim |
| --- | --- | --- | --- | --- | --- |
| 5 | Searching | `grep`, `grep -i -n -v -r`, `find -name -type -size` | 012.3, 013.2 | L02-L05, M5-M6 | ✅ |
| 6 | Pipes and redirection | `\|`, `>`, `>>`, `2>`, `/dev/null`, `tee` | 013.2 | L03, L04 | ✅ (`tee` missing) |
| 7 | Sort, count, cut | `sort`, `uniq -c`, `wc`, `cut`, `tr` | 013.2 | L03-L06, M7-M9 | ✅ |
| 8 | Patterns | regex `.` `[ ]` `*` `^` `$`, `grep -E` | 013.2 | L05-L07 | ✅ |
| 9 | Archives | `tar -czf/-xzf/-tf`, `gzip`, `bzip2`, `xz`, `zip`, `unzip` | 013.1 | L02, M12 | 🎞 |

## Section 3: The system

| # | Unit | Commands and ideas | LPI | Today | Sim |
| --- | --- | --- | --- | --- | --- |
| 10 | Permissions | `ls -l` columns, `rwx`, `chmod 755`/`u+x`, `chown`, sticky bit | 015.3, 015.4 | L02, L08 | 🟡 (`chmod` yes, `chown` missing) |
| 11 | Users and sudo | `whoami`, `id`, `sudo`, `su`, `/etc/passwd`, `/etc/group`, `useradd`, `passwd` | 015.1, 015.2 | L01 (`whoami`, `id`) | 🟡 |
| 12 | Processes | `ps`, `top`, `free`, `kill`, `jobs`, `bg`, `fg`, `&` | 014.3 | L01 (`ps`, `kill`) | 🎞 |
| 13 | Services and logs | `systemctl start/stop/status`, `journalctl`, `dmesg`, `/var/log` | 014.3 | none | 🎞 |
| 14 | Installing software | `apt update/install/remove`, `apt search`, `dpkg -l` | 011.2 | none | 🎞 |
| 15 | Disks and files | `df -h`, `du -sh`, `lsblk`, `mount`, `/dev`, `/proc`, `/etc`, `/tmp`, `ln -s` | 014.2, 015.4 | L02 (`du`, `ln`) | 🟡 |

## Section 4: Networking and remote

| # | Unit | Commands and ideas | LPI | Today | Sim |
| --- | --- | --- | --- | --- | --- |
| 16 | Network basics | `ip addr`, `ip route`, `ss -tln`, `ping`, `host`, `/etc/hosts`, `curl` | 014.4 | L08 (`nc`, `nmap`) | 🎞 |
| 17 | SSH and keys | `ssh user@host -p`, `scp`, `ssh-keygen`, `~/.ssh/authorized_keys` | 015.1 | L01, L08 | 🎞 |

## Section 5: Scripting

| # | Unit | Commands and ideas | LPI | Today | Sim |
| --- | --- | --- | --- | --- | --- |
| 18 | Variables and PATH | `echo $VAR`, `VAR=x`, `export`, `$PATH`, `env` | 012.1 | L08 (`$0`) | 🟡 |
| 19 | Decisions and loops | `if [ -f ]`, `[ "$a" = "$b" ]`, `for f in *.txt`, `$?`, `&&`, `\|\|` | 013.3 | L07, L08 | 🟡 (`for`, `if` partly) |
| 20 | Your first script | `#!/bin/bash`, `$1`, `chmod +x`, `./script.sh`, exit codes | 013.3 | none | 🟡 |

## Section 6: Bandit track (optional, unlocks after Section 2)

| # | Unit | Content | Today |
| --- | --- | --- | --- |
| B1 | Bandit 0-6 | odd file names, hidden files, `find` by size and owner | M1-M6, L08 |
| B2 | Bandit 7-12 | `grep`, `sort \| uniq -u`, `strings`, `base64`, `tr` ROT13, compressed layers | M7-M12, L08 |
| B3 | Bandit 13-33 | ssh keys, ports, `nc`, `openssl`, setuid, cron, git, `$0` | L08, Bandit map |

## Notes for building

- About 60% of today's ~1,100 questions already fit Sections 1-2 and the Bandit track. Sections 3-5 are mostly new content.
- New 🎞 units: record real output in the Ubuntu Docker sandbox and build "what does it print?" and concept questions from it. Never invent output.
- Examples come from [tldr/](tldr/) where they fit, with credit.
- The prototype builds **Unit 1 (Where am I?)** only.
