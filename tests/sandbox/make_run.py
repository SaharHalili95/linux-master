import json, shlex, sys

d = json.load(open(sys.argv[1]))
levels = ['pipeScenarios', 'pipeFlagScenarios', 'professionalScenarios', 'pipeTwoFlagScenarios', 'workflowScenarios', 'banditScenarios']

fixture = r'''
mkdir -p /fx && cd /fx
for i in $(seq 1 40); do
  case $((i % 8)) in
    0) echo "2026-10-01 10:$i INFO service started";;
    1) echo "2026-10-01 10:$i DEBUG cache warm $i";;
    2) echo "2026-10-01 10:$i ERROR disk full";;
    3) echo "2026-10-01 10:$i error connection refused $i";;
    4) echo "2026-10-01 10:$i WARN ssh login from 10.0.0.$i";;
    5) echo "2026-10-01 10:$i INFO sshd restarted";;
    6) echo "2026-10-01 10:$i Timeout waiting for db $i";;
    7) echo "2026-10-01 10:$i timeout on api";;
  esac
done > app.log
printf "2026-10-01 11:00 ERROR disk full\n2026-10-01 11:00 ERROR disk full\n2026-10-01 11:01 WARN SSH key rejected\n2026-10-01 11:02 INFO done\n" >> app.log
printf 'Dana\navi\nAvi\ndana\nNoa\nben\nDana\nzoe\nBen\nnoa\nAvi\nkeren\n' > names.txt
printf 'connect with SSH\nbuy milk\nconnect with SSH\nalpha line\nzeta line\nbeta line\nbuy milk\n' > notes.txt
printf '10\n9\n100\n25\n3\n' > scores.txt
printf 'alice 1001 admin\nbob 1002 dev\nalice 1003 ops\ncarol 1004 dev\nbob 1005 qa\n' > users.txt
printf 'apple:12\npear:5\nfig:100\nkiwi:7\n' > inventory.txt
printf '\x00\x01token=abc\x00\x02TOKEN_LONGVALUE_X\x00tok\x00\xffmytoken12345\x00' > data.bin
printf 'banana apple papaya\n' > words.txt
printf 'zebra\nmango\n' > first.txt; printf 'apple\nkiwi\n' > second.txt
printf 'the quick brown fox\njumps over the lazy dog\nend of report\n' > report.txt
for ip in 10.0.0.1 10.0.0.2 10.0.0.1 10.0.0.3 10.0.0.1 10.0.0.2; do echo "$ip - - [01/Oct] GET /"; done > access.log
for i in $(seq 1 30); do if [ $((i%3)) -eq 0 ]; then echo "Oct 1 sshd: Failed password $i"; elif [ $((i%3)) -eq 1 ]; then echo "Oct 1 sshd: failed login $i"; else echo "Oct 1 cron: job ok $i"; fi; done > auth.log
printf '5 a\n40 b\n300 c\n7 d\n' > data.txt
mkdir -p logs config/sub/sub2 source backup
mkdir -p logs/old; printf 'x\n%.0s' $(seq 1 3000) > logs/a.log; echo b > logs/b.log; echo o > logs/old/c.log
echo c > config/app.conf; echo d > config/sub/deep.conf; echo e > config/sub/sub2/deeper.conf; echo f > z.conf; echo g > config/b.conf; mkdir -p config/dir.conf
echo s > source/one.txt; echo s > source.txt
echo r > report_2026.txt; echo R > Report.md; echo t > tmp_file; echo t > file.tmp; mkdir -p old.log
tar -cf backup.tar config
echo key > KEY; echo f > FILE
printf 'Dana\nNoa\nben\n' > names1.txt; printf 'Noa\nzoe\nDana\nAvi\n' > names2.txt
tar -czf backup.tar.gz config logs
mkdir -p /fx/bandit && cd /fx/bandit
mkdir -p inhere && echo hidden > inhere/.secret && echo text > inhere/-file01
printf 'x%.0s' $(seq 1 1033) > inhere/sized; chmod -x inhere/sized
echo 'echo ok' > script.sh
printf 'old\nsame\n' > old.txt; printf 'new\nsame\n' > new.txt
echo secret > pass.txt; echo key > key.private; chmod 644 key.private
echo dash > ./-; echo spaced > ./"--spaces in this filename--"
echo zipped | gzip > data
echo 'Gur cnffjbeq vf Uryyb Jbeyq' > data.txt
getent group bandit6 >/dev/null || groupadd bandit6; id bandit7 >/dev/null 2>&1 || useradd -M bandit7
mkdir -p /srv && printf 'x%.0s' $(seq 1 33) > /srv/found && chown bandit7:bandit6 /srv/found
mkdir -p /etc/cron.d && echo '* * * * * root /usr/bin/true' > /etc/cron.d/demo
git config --global user.email t@t && git config --global user.name t && git config --global init.defaultBranch main
git init -q --bare /srv/remote.git && git init -q . && git add -A && git commit -qm first && git branch dev && git tag v1
git remote add origin /srv/remote.git && git push -q -u origin main
echo '*.txt' > .gitignore && echo k > key.txt
cd /fx
'''

lines = ['set +e', fixture, 'cd /', ': > /results.tsv']
for lvl in levels:
    for i, s in enumerate(d[lvl]):
        for kind, cmd in [('A', s['answer'])] + [(f'W{j}', w) for j, w in enumerate(s['wrong'])]:
            tag = f'{lvl}\t{i}\t{kind}'
            lines.append(
                f'rm -rf /w && cp -a /fx /w && cd /w{"/bandit" if lvl == "banditScenarios" else ""} && '
                f'timeout 15 bash -c {shlex.quote(cmd)} > /tmp/out 2> /tmp/err < /dev/null; code=$?; '
                f'for f in errors.txt logs-list.txt failures.txt procs.txt; do [ -f $f ] && {{ echo "== $f"; (tar -tzf $f 2>/dev/null || cat $f) | sort; }} >> /tmp/out; done; '
                f'{{ echo "== tree"; find . -newer /fx/KEY 2>/dev/null | sort; ls backup restore 2>/dev/null; stat -c "%n %a" key.private script.sh 2>/dev/null; md5sum data.bin data.gz data 2>/dev/null; }} >> /tmp/out; '
                f'printf "%s\\t%s\\t%s\\t%s\\n" {shlex.quote(tag)} $code "$(md5sum < /tmp/out | cut -c1-8)" "$(head -c 160 /tmp/err | tr "\\n\\t" "  ")" >> /results.tsv; cd /'
            )
print('\n'.join(lines))
