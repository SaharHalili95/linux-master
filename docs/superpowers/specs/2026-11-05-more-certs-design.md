# Three more certifications: Linux Essentials, SUSE SCA, CompTIA Linux+

## Why

The owner's goal: anyone preparing for a Linux certification studies with us first, and passes. The learner is
the most important person in this work: every exercise must teach properly and follow the clarity rules
(every task names its file, never invent output, one idea at a time). Marketing comes later and depends on the
course being worth recommending.

## Goals

- A learner can pick a track for Linux Essentials, SUSE SCA or CompTIA Linux+ and see exactly the units that
  exam needs, then take a mock exam shaped like the real one.
- Every official objective of the three exams maps to at least one unit, guarded by a content test, the same
  way LPIC-1, RHCSA and LFCS are guarded today.
- Command output shown to learners is recorded on a real machine (GitHub VM, or an openSUSE container for
  SUSE tools). Concept topics that cannot be practiced in the simulator (AI use, Python, Kubernetes,
  monitoring) are taught with explanation cards, comprehension questions and scenarios. The owner approved this
  on 2026-11-05.

## Non-goals

- RHCE, LPIC-2, LPIC-3, SUSE SCE, RHCA. Researched, left for later.
- Real-machine practice. Still postponed.
- Marketing pages. A separate piece of work after the content lands.

## Official sources

| Exam | Source | Shape |
|---|---|---|
| Linux Essentials 010-200 (objectives v2.0) | lpi.org/our-certifications/exam-010-objectives/ | 19 objectives, 40 questions, 60 min, pass 500/800 |
| SUSE SCA in SLES 16 | suse.com/training/exam/sca_sles16/ | 56 objective lines (grouped here into 18), 70 questions, 90 min, 70% |
| CompTIA Linux+ XK0-006 V8 (objectives document v5.0) | CompTIA objectives PDF | 29 objectives in 5 domains (23/20/18/17/22%), up to 90 questions, 90 min, 720/900 |

The maps live in `materials/objectives/linux-essentials.json`, `suse-sca.json` and `linux-plus.json`.

## Design

**Tags.** A unit's `exams` list gains `E<objective>` (Linux Essentials, e.g. `E013.2`), `S<n>` (SUSE group) and
`C<objective>` (Linux+, e.g. `C1.3`). Tracks and mock exams already select units by tag prefix, so the new
tracks are three more buttons in the track sheet.

**Where new units go.** Units keep permanent numbers. New content is Part 10 "More certifications", units
81-96. Mock exams move to Part 11: the existing 78-80 plus 97 (Linux Essentials), 98 (SUSE SCA) and
99 (Linux+). `COURSE` is ordered by part, so the path reads Part 9, Part 10, Part 11.

**New units.**

| Unit | Title | For |
|---|---|---|
| 81 | Open source and distributions: families, release types, licenses (GPL, BSD, copyleft, Creative Commons, FSF, OSI), major apps, apk | E, C |
| 82 | Linux in everyday computing: hardware and CPU architectures, Raspberry Pi, block devices, install media, dual boot, WSL, password managers, MFA, passkeys | E, C |
| 83 | SUSE and SLES 16: zypper, SLES in the public cloud, supportconfig, a basic manual deployment | S |
| 84 | Cockpit and remote desktop: install and reach Cockpit, MFA, users in Cockpit, GNOME Remote Desktop | S |
| 85 | Btrfs and snapshots: subvolumes, snapper, persistent device names | S, C |
| 86 | Hardware and kernel modules in depth: dmidecode, lshw, lsmem, modinfo, depmod, rmmod, dracut, mkinitrd, sensors, ipmitool | C |
| 87 | LVM in depth and RAID: pvs/vgs/lvs, pvmove, vgextend, lvremove, vgexport/vgimport, mdadm, /proc/mdstat, growpart, mount options | C |
| 88 | Network tools: ethtool, tcpdump, iperf3, netplan, nmap, nslookup | C |
| 89 | Performance and tracing: strace, pstree, mpstat, pidstat, atop, systemd-analyze blame | C |
| 90 | Virtualization: QEMU/KVM, virt-manager, qcow2, snapshots, VM networking | C |
| 91 | Containers in depth: Dockerfile, images and tags, volumes, ports, networks, privileged, Compose | C |
| 92 | Security tools: auditd, fail2ban, SELinux troubleshooting (audit2allow, sealert), chattr/lsattr, PAM, polkit, rbash, login banners | C |
| 93 | Compliance and encryption: OpenSCAP, CIS, AIDE, rkhunter, CVE/CVSS, shred, LUKS2, WireGuard, certificates | C |
| 94 | Automation and infrastructure as code: Ansible, Puppet, OpenTofu, CI/CD, GitOps, Kubernetes, cloud-init, kickstart | C |
| 95 | Python and AI for administrators: venv, pip, data types, PEP 8; responsible AI use | C |
| 96 | Monitoring and troubleshooting method: SLA/SLO/SLI, SNMP, alerts, logs; troubleshooting scenarios | C |

Smaller gaps go into existing lessons with `cvAdd` (the coverage pattern in `parts/p11.js`): resolvectl, SLAAC,
wtmpdb, `/var/tmp`, `ls -d`, vimrc, `/dev/disk/by-uuid`, adduser/deluser/chsh/lastlog, git rebase/stash,
zgrep/zless/ddrescue, sdiff, ipset, pip/npm/cargo.

**Mock exams.** 97: 40 questions, 60 minutes, pass 62.5%. 98: 70 questions, 90 minutes, pass 70%. 99: 60
questions, 90 minutes, pass 80%. Each takes one question per objective first, then fills at random, like LPIC-1.

## Order of work

1. Infrastructure PR: the three maps, tags on existing units, sections, mock exams, track buttons, tests.
2. Linux Essentials content (81, 82, additions).
3. SUSE content (83-85) with openSUSE recordings.
4. Linux+ content (86-96, additions), in several PRs.
5. Coverage check (every objective taught, every listed term present), iPhone screenshots, live check.

Each PR merges only after all 13 checks pass.
