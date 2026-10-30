# Materials

Everything collected for turning Linux Master into a Duolingo-style course, from a complete beginner to everyday terminal use. Questions are written by us; these sources are the map and the fact check.

| File | What it is |
| --- | --- |
| [curriculum.md](curriculum.md) | The course: sections, units and the commands each unit teaches, mapped to LPI objectives, existing app content and simulator support |
| [duolingo-mechanics.md](duolingo-mechanics.md) | How Duolingo works, and what we copy, adapt or skip |
| [tldr/](tldr/) | 110 tldr-pages command pages (CC BY 4.0), the source for real-world examples |

## Sources

| Source | Use | License | Can we copy text? |
| --- | --- | --- | --- |
| [OverTheWire Bandit](https://overthewire.org/wargames/bandit/) | Already the base of levels 2-8 and the 12 missions | Site content, no open license | No. Link and practise, never copy solutions |
| [LPI Linux Essentials 010 objectives](https://www.lpi.org/our-certifications/exam-010-objectives/) | Curriculum skeleton: which topics, in what order, how much weight | Public objectives list | Topic names only. Questions are ours |
| [tldr-pages](https://github.com/tldr-pages/tldr) | Short practical examples for every command | CC BY 4.0 (content), MIT (scripts) | Yes, with attribution. Copied to [tldr/](tldr/) |
| [The Linux Command Line, William Shotts](https://linuxcommand.org/tlcl.php) | Reference for explanations and order of topics | CC BY-NC-ND 3.0 | No. Read only, no derivatives |
| [Linux Journey](https://github.com/labex-labs/linuxjourney) | Reference for beginner topic order | No clear license on the repo | No. Read only until the license is clear |
| Ubuntu 24.04 man pages and real output | Source of truth for flags and output | Per package | Use real output we record in our own Docker sandbox (`tests/sandbox`) |
| [Duolingo blog](https://blog.duolingo.com/) | Product mechanics research | Duolingo | No. Ideas only, see [duolingo-mechanics.md](duolingo-mechanics.md) |

Collected 2026-10-29.
