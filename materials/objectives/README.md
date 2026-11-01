# Official exam objectives, mapped to units

Downloaded 2026-11-01 from the official pages. Each entry lists the units (from [../curriculum.md](../curriculum.md)) that teach it.

| File | Exam | Source | Entries |
| --- | --- | --- | --- |
| `lpic1.json` | LPIC-1 v5.0 (exams 101-500 and 102-500) | https://wiki.lpi.org/wiki/LPIC-1_Objectives_V5.0 | 42 objectives with weight and the official list of files, terms and utilities |
| `rhcsa.json` | RHCSA EX200 | https://www.redhat.com/en/services/training/ex200-red-hat-certified-system-administrator-rhcsa-exam | 62 tasks in 10 areas, in short form |
| `lfcs.json` | LFCS | https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/ | 34 competencies in 5 weighted domains, in short form |

How to use them when writing a unit:

1. Find every entry whose `units` contains the unit number.
2. For LPIC objectives, teach every item in `terms` that belongs to the unit's topic. Each term must appear in at least one unit before part 10 ships, and a test checks this.
3. RHCSA and LFCS are hands-on, and every configuration in them must survive a reboot. Teach the persistent way (`--permanent`, `/etc/fstab`, `systemctl enable`) next to the quick way.

`tests/prototype.spec.js` checks that every entry maps to a real unit and that every unit 1-77 is mapped by some entry. Re-check the sources before each phase; exam versions change.

Notes from the official pages (2026-11-01):
- LPIC-1 v5.0 has no objective 104.4 and no SQL. Exams 101 and 102 each weigh 60.
- RHCSA no longer lists containers. It does list Flatpak, tuned profiles, a persistent journal, VFAT, NFS and autofs, and SELinux port labels and booleans.
- LFCS weights: Operations Deployment 25%, Networking 25%, Storage 20%, Essential Commands 20%, Users and Groups 10%. It includes libvirt, containers, NAT, bridges and bonding, reverse proxies, Git, SSL certificates and LDAP accounts.
