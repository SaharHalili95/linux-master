# Curriculum: 80 units, from zero to Linux certification

Goal (owner's words): a learner who finishes all 80 units can pass the best official Linux certifications. The course covers the union of three exams:

- **LPIC-1** v5.0 (LPI, exams 101-500 and 102-500): multiple choice and fill-in. The app can prepare for it almost fully. Tag: `L` + objective, e.g. `L103.7`.
- **RHCSA** EX200 on RHEL 10 (Red Hat): hands-on tasks. The app teaches all the knowledge; the learner should still practise on a real VM before the exam. Tag: `R`.
- **LFCS** (Linux Foundation): hands-on tasks, 6 domains. Same caveat. Tag: `F`.

Shape (Duolingo style), unchanged from units 1-6: **parts → units → lessons**. A unit has 4 lessons of 6-8 exercises, a chest after lesson 2 and a boss. About 31 exercises per unit, about 2,300 in total.

Sim column: ✅ the simulated shell (`shell.js`) runs it · 🟡 needs new simulator commands · 🎞 not simulated: real output recorded in Docker (Ubuntu 24.04 or AlmaLinux 10) plus concept questions. Never invent output.

Unit numbers are permanent: progress is saved per unit number (`u12-L0`), so a unit never moves to another number once it ships.

## Part 1: Foundations (units 1-10)

| # | Unit | Commands and ideas | Exams | Sim | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Where am I? | `pwd`, `ls`, `ls -a`, `cd`, `.`, `..`, `~`, `/` | L103.1 F | ✅ | live |
| 2 | Reading files | `cat`, `head`, `tail`, `cat -n`, `file` | L103.1 | ✅ | live |
| 3 | Making and moving | `mkdir`, `cp`, `mv`, `rm`, `rm -r` | L103.3 R F | ✅ | live |
| 4 | Searching | `grep -i -c -v -n`, `find -name -type` | L103.7 L104.7 | ✅ | live |
| 5 | Pipes and redirection | `\|`, `>`, `>>`, `2>`, `/dev/null` | L103.4 R | ✅ | live |
| 6 | Sort, count, cut | `sort`, `uniq -c`, `wc`, `cut`, `tr` | L103.2 | ✅ | live |
| 7 | Patterns | regex `.` `[ ]` `*` `^` `$`, `grep -E`, `egrep` | L103.7 R | ✅ | live |
| 8 | Getting help | `man` sections, `--help`, `info`, `whatis`, `apropos`, `type`, `which`, `/usr/share/doc` | L103.1 R | 🎞 | live |
| 9 | Globs and quoting | `*` `?` `[ ]` `{a,b}`, `'single'` vs `"double"`, `\` escaping, `touch`, `rmdir` | L103.3 | 🟡 | live |
| 10 | Your shell | `history`, `!!`, `alias`, `echo $SHELL`, `type`, `~/.bashrc`, tab completion | L103.1 | 🟡 | live |

## Part 2: Text power (units 11-20)

| # | Unit | Commands and ideas | Exams | Sim | Status |
| --- | --- | --- | --- | --- | --- |
| 11 | Extended regex | `grep -E` `+` `?` `{n}` `\|` `( )`, `grep -o`, `grep -w`, `grep -r` | L103.7 R | 🟡 | live |
| 12 | sed basics | `sed 's/a/b/'`, `/g`, `-n p`, `d`, line numbers | L103.2 | ✅ | live |
| 13 | sed in practice | `sed -i`, ranges `2,5`, `/re/d`, `-e` chains, backups | L103.2 F | 🟡 | live |
| 14 | awk basics | `awk '{print $1}'`, `-F`, `NR`, `NF`, patterns | L103.2 | 🟡 | live |
| 15 | awk reports | sums, `BEGIN`/`END`, conditions, `printf` | L103.2 | 🟡 | live |
| 16 | Plumbing | `tee`, `xargs`, `$( )`, `` ` ` ``, `&&`, `\|\|`, `;`, `<` | L103.4 R | 🟡 | live |
| 17 | vi: survive | modes, `i` `a` `o` `Esc`, `:w` `:q` `:wq` `:q!`, `h j k l` | L103.8 R | 🎞 | live |
| 18 | vi: edit fast | `dd` `yy` `p` `u`, `/search` `n`, `:%s/a/b/g`, `G` `gg` | L103.8 | 🎞 | live |
| 19 | More text tools | `diff`, `cmp`, `comm`, `paste`, `join`, `nl`, `split`, `od`, `xxd`, `md5sum`, `sha256sum` | L103.2 | 🟡 | live |
| 20 | Archives | `tar -czf -xzf -tf -C`, `gzip`, `bzip2`, `xz`, `zip`, `cpio`, `dd` | L103.3 R F | 🎞 | live |

## Part 3: Files, permissions and disks (units 21-32)

| # | Unit | Commands and ideas | Exams | Sim | Status |
| --- | --- | --- | --- | --- | --- |
| 21 | Links and inodes | `ln`, `ln -s`, `ls -li`, `stat`, `readlink`, hard vs soft | L104.6 R | 🟡 | live |
| 22 | Permissions | `ls -l` columns, `rwx`, octal `755`, `chmod u+x` | L104.5 R F | 🟡 | live |
| 23 | Owners and umask | `chown`, `chgrp`, `umask 022`, default modes | L104.5 R | 🟡 | live |
| 24 | Special bits and ACLs | SUID, SGID, sticky, `chmod 4755`, `getfacl`, `setfacl` | L104.5 R F | 🎞 | live |
| 25 | The filesystem tree | FHS: `/etc` `/var` `/usr` `/opt` `/home` `/proc` `/dev` `/boot` `/tmp` | L104.7 | ✅ | live |
| 26 | Finding anything | `find -perm -user -size -mtime -exec`, `locate`, `updatedb`, `whereis`, `which` | L104.7 R | 🟡 | live |
| 27 | Disks and partitions | `lsblk`, `blkid`, `fdisk`, `gdisk`, `parted`, MBR vs GPT, partition layout | L102.1 L104.1 R F | 🎞 | |
| 28 | Filesystems | `mkfs.ext4`, `mkfs.xfs`, `mkfs.vfat`, `fsck`, `e2fsck`, `xfs_repair`, `tune2fs` | L104.1 L104.2 R F | 🎞 | |
| 29 | Mounting | `mount`, `umount`, `/etc/fstab`, UUID, `findmnt`, `mount -a` | L104.3 R F | 🎞 | |
| 30 | Space and quotas | `df -h`, `du -sh`, `du --max-depth`, quotas, `iostat`, full-disk troubleshooting | L104.2 | 🟡 | |
| 31 | LVM | PV, VG, LV, `pvcreate`, `vgcreate`, `lvcreate`, `lvextend -r` | R F | 🎞 | |
| 32 | Swap and network storage | `mkswap`, `swapon`, NFS mounts, `autofs`, network block devices (iSCSI/NBD) | L104.1 R F | 🎞 | |

## Part 4: Users, processes, services and boot (units 33-44)

| # | Unit | Commands and ideas | Exams | Sim | Status |
| --- | --- | --- | --- | --- | --- |
| 33 | Users and groups | `whoami`, `id`, `groups`, `/etc/passwd`, `/etc/shadow`, `/etc/group` | L107.1 R F | 🟡 | |
| 34 | Managing users | `useradd -m`, `usermod -aG`, `userdel -r`, `passwd`, `groupadd`, `chage`, LDAP accounts with `sssd` | L107.1 R F | 🎞 | |
| 35 | sudo and su | `sudo`, `su -`, `visudo`, `/etc/sudoers`, wheel/sudo group | L110.1 R F | 🎞 | |
| 36 | Processes | `ps aux`, `top`, `pgrep`, `pkill`, `kill -9 -15`, signals | L103.5 R F | 🎞 | |
| 37 | Jobs and priority | `&`, `jobs`, `bg`, `fg`, `nohup`, `nice`, `renice`, `screen`/`tmux` | L103.5 L103.6 R | 🎞 | |
| 38 | systemd services | `systemctl start stop restart status enable disable is-active` | L101.3 R F | 🎞 | |
| 39 | systemd deeper | unit files, `daemon-reload`, targets, `get-default`, `set-default`, `isolate` | L101.3 R F | 🎞 | |
| 40 | Logs | `journalctl -u -b -p -f`, persistent journal, `/var/log`, `rsyslog`, `logrotate`, `logger` | L108.2 R F | 🎞 | |
| 41 | Boot | BIOS/UEFI, GRUB2, kernel arguments, initramfs, rescue/emergency, reset root password | L101.2 L102.2 R | 🎞 | |
| 42 | Kernel and hardware | `uname`, `lsmod`, `modprobe`, `lspci`, `lsusb`, `/proc`, `/sys`, `dmesg`, udev, `sysctl` | L101.1 R F | 🎞 | |
| 43 | Time | `date`, `timedatectl`, `chronyc`, NTP, `hwclock`, time zones | L108.1 R F | 🎞 | |
| 44 | Health and tuning | `uptime`, load average, `free -h`, `vmstat`, `tuned-adm`, `/proc/meminfo`, service limits | R F | 🎞 | |

## Part 5: Installing software (units 45-50)

| # | Unit | Commands and ideas | Exams | Sim | Status |
| --- | --- | --- | --- | --- | --- |
| 45 | apt | `apt update`, `install`, `remove`, `purge`, `search`, `show`, `upgrade` | L102.4 F | 🎞 | |
| 46 | dpkg and repos | `dpkg -i -l -L -S -r`, `/etc/apt/sources.list.d`, `apt-cache` | L102.4 | 🎞 | |
| 47 | dnf | `dnf install remove search info provides`, repos, `dnf history` | L102.5 R | 🎞 | |
| 48 | rpm | `rpm -qa -qi -ql -qf -ivh -e`, `rpm2cpio` | L102.5 R | 🎞 | |
| 49 | Libraries | `ldd`, `ldconfig`, `/etc/ld.so.conf`, `LD_LIBRARY_PATH` | L102.3 | 🎞 | |
| 50 | Flatpak, VMs and containers | `flatpak install`, VM vs container, cloud-init, libvirt `virsh`, `podman`/`docker` containers | L102.6 R | 🎞 | |

## Part 6: Networking and SSH (units 51-58)

| # | Unit | Commands and ideas | Exams | Sim | Status |
| --- | --- | --- | --- | --- | --- |
| 51 | Network fundamentals | IPv4, IPv6, netmasks/CIDR, ports, TCP vs UDP, private ranges | L109.1 | concept | |
| 52 | ip | `ip addr`, `ip link`, `ip route`, default gateway, static routes | L109.2 L109.3 R F | 🎞 | |
| 53 | Persistent network config | `nmcli`, NetworkManager, `hostnamectl`, `/etc/hosts`, `/etc/resolv.conf`, `/etc/nsswitch.conf`, bridges and bonding | L109.2 L109.4 R F | 🎞 | |
| 54 | DNS | `host`, `dig`, `getent hosts`, resolution order | L109.4 F | 🎞 | |
| 55 | Network troubleshooting | `ping`, `traceroute`, `tracepath`, `ss -tulpn`, `nc`, `curl` | L109.3 F | 🎞 | |
| 56 | SSH | `ssh user@host -p`, `scp`, `~/.ssh/config`, `known_hosts` | L110.3 R F | 🎞 | |
| 57 | SSH keys | `ssh-keygen`, `ssh-copy-id`, `authorized_keys`, `sshd_config` hardening | L110.3 R F | 🎞 | |
| 58 | Moving files around | `rsync -av`, `sftp`, `wget`, `curl -O` | F | 🎞 | |

## Part 7: Scripting and scheduling (units 59-66)

| # | Unit | Commands and ideas | Exams | Sim | Status |
| --- | --- | --- | --- | --- | --- |
| 59 | Variables and environment | `VAR=x`, `export`, `env`, `$PATH`, `~/.bashrc` vs `~/.profile`, login shells | L105.1 R | 🟡 | |
| 60 | Conditions | `test`, `[ -f ]`, `[ "$a" = "$b" ]`, `-eq -lt`, `if/elif/else`, `$?` | L105.2 R | 🟡 | |
| 61 | Loops | `for`, `while`, `read`, `seq`, `break` | L105.2 R | 🟡 | |
| 62 | Your first script | `#!/bin/bash`, `$1` `$#` `$@`, `chmod +x`, `./run.sh`, `exit 1` | L105.2 R | 🟡 | |
| 63 | Functions and case | functions, `local`, `case`, `$(( ))` arithmetic | L105.2 | 🟡 | |
| 64 | Real scripts | backup script, log report, user report: putting it together | L105.2 R F | 🟡 | |
| 65 | cron and at | `crontab -e -l`, the 5 fields, `/etc/crontab`, `/etc/cron.d`, `anacron`, `at` | L107.2 R F | 🎞 | |
| 66 | systemd timers | `.timer` units, `OnCalendar`, `systemctl list-timers` | L107.2 R | 🎞 | |

## Part 8: Security (units 67-72)

| # | Unit | Commands and ideas | Exams | Sim | Status |
| --- | --- | --- | --- | --- | --- |
| 67 | Security checks | `who`, `w`, `last`, `find -perm -4000`, `ss -tlnp`, `ulimit`, `/etc/security/limits.conf` | L110.1 | 🎞 | |
| 68 | Passwords and policies | `/etc/shadow` fields, `chage`, `/etc/login.defs`, locking accounts | L110.1 R F | 🎞 | |
| 69 | Firewalls | `firewall-cmd --add-service --permanent --reload`, zones, port forwarding and NAT, `nft`, `ufw` | R F | 🎞 | |
| 70 | SELinux | modes, `getenforce`, `setenforce`, `ls -Z`, `restorecon`, `semanage port`, booleans | R | 🎞 | |
| 71 | Hardening services | disabling services, `systemctl mask`, `ss`, TCP wrappers history | L110.2 F | 🎞 | |
| 72 | Encryption | `gpg --gen-key -e -d --verify`, checksums, SSH agent | L110.3 | 🎞 | |

## Part 9: More exam topics (units 73-77)

| # | Unit | Commands and ideas | Exams | Sim | Status |
| --- | --- | --- | --- | --- | --- |
| 73 | Language and time zones | `locale`, `LANG`, `LC_ALL`, `iconv`, `tzselect`, `/etc/timezone` | L107.3 | 🎞 | |
| 74 | Printing and mail | CUPS, `lpr`, `lpq`, `lprm`, MTA, `mail`, `/etc/aliases`, `newaliases`, `~/.forward`, `mailq` | L108.3 L108.4 | 🎞 | |
| 75 | Desktop and accessibility | X11, Wayland, display managers, `DISPLAY`, remote desktop, accessibility tools | L106.1 L106.2 L106.3 | concept | |
| 76 | Git basics | `git clone`, `status`, `add`, `commit`, `log`, `diff`, `branch`, `checkout`, `push` | F | 🎞 | |
| 77 | Web servers and proxies | nginx/Apache basics, virtual hosts, reverse proxy, `curl -I`, TLS certificates with `openssl` | F | 🎞 | |

## Part 10: Mock exams (units 78-80)

| # | Unit | Content | Exams |
| --- | --- | --- | --- |
| 78 | LPIC-1 mock exam | 60 questions from the LPIC-tagged bank, weighted by objective, 90 minutes, pass at 500/800 | L |
| 79 | RHCSA mock exam | 20 task-style questions on the R-tagged bank, no hints | R |
| 80 | LFCS mock exam | 20 task-style questions on the F-tagged bank, weighted by the 6 domains | F |

The official objectives of all three exams, mapped to these units, are in [objectives/](objectives/). Every LPIC-1 v5.0 objective (101.1 to 110.3; v5.0 has no 104.4 and no SQL objective) appears in at least one unit above; `tests/prototype.spec.js` checks that every objective tag is covered.

## Sources

- LPIC-1 v5.0 objectives: https://www.lpi.org/our-certifications/lpic-1-overview
- RHCSA EX200 objectives: https://www.redhat.com/en/services/training/ex200-red-hat-certified-system-administrator-rhcsa-exam
- LFCS domains: https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/
- Command examples from [tldr/](tldr/) where they fit, with credit.
