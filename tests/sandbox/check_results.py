"""Fails if a correct answer errors on Ubuntu. Wrong options with identical output are reported, not failed,
because some differences only show with specific files (see README)."""
import collections, json, sys

data = json.load(open(sys.argv[1]))
rows = [line.rstrip('\n').split('\t') for line in open(sys.argv[2])]
results = collections.defaultdict(dict)
for level, index, kind, code, digest, err in rows:
    results[(level, int(index))][kind] = (int(code), digest, err)

needs_server_or_shell = ('history', 'ssh ', 'scp ', 'nc ', 'who ')
failures = []
for (level, index), runs in sorted(results.items()):
    answer = data[level][index]['answer']
    if answer.startswith(needs_server_or_shell):
        continue
    code, digest, err = runs['A']
    if code != 0 or err.strip():
        failures.append(f'{level}#{index}: "{answer}" exited {code}: {err[:160]}')
    for kind, (wcode, wdigest, _) in runs.items():
        if kind != 'A' and (wcode, wdigest) == (code, digest):
            print(f'note: {level}#{index} wrong option {data[level][index]["wrong"][int(kind[1])]!r} gives the same output here')

print(f'{len(results)} scenarios checked')
if failures:
    print('\n'.join(failures))
    sys.exit(1)
