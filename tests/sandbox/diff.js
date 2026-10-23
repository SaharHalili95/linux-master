// Differential test: runs the same commands on the in-browser simulator (shell.js) and on real
// Ubuntu 24.04 in Docker, on the same sample files, and reports any difference in output.
const fs = require('fs'), vm = require('vm'), path = require('path'), { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..', '..');
const ctx = { atob, btoa, console }; vm.createContext(ctx);
vm.runInContext(['shell.js', 'data/content.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n') +
  ';globalThis.api={Shell,ShellUnsupported,lessonFixture,pools:[pipeScenarios,pipeFlagScenarios,professionalScenarios,pipeTwoFlagScenarios,workflowScenarios,banditScenarios]};', ctx);
const { Shell, ShellUnsupported, lessonFixture, pools } = ctx.api;

const commands = [...new Set(pools.flat().flatMap(s => [s.answer, ...s.wrong, ...(s.accept || [])]))]
  .concat(fs.existsSync(path.join(__dirname, 'extra-commands.txt')) ? fs.readFileSync(path.join(__dirname, 'extra-commands.txt'), 'utf8').split('\n').filter(Boolean) : []);
// Simulated on purpose or tied to the whole machine (users, processes, /etc, the root file system),
// so they legitimately differ between a container and the lesson files.
const canned = /^(who|history|ps|getent|whoami)\b|\| *(who|history|ps|whoami)\b|\/etc\b|find \/ /;
const sim = [];
for (const variant of [0, 1]) for (const cmd of commands) {
  if (canned.test(cmd)) continue;
  try { const r = new Shell(lessonFixture(variant), { interactive: false }).run(cmd); sim.push({ variant, cmd, out: r.out, code: r.code, err: !!r.err }); }
  catch (e) { if (!(e instanceof ShellUnsupported)) throw e; }
}
const b64 = s => Buffer.from(s, 'latin1').toString('base64');
let script = 'set +e\nexport LC_ALL=C\n';
for (const variant of [0, 1]) {
  const fx = lessonFixture(variant);
  script += `rm -rf /fx${variant} && mkdir -p /fx${variant}\n`;
  for (const d of fx.dirs.filter(d => d.startsWith('/home/user'))) script += `mkdir -p /fx${variant}${d}\n`;
  for (const [p, f] of fx.files.filter(([p]) => p.startsWith('/home/user'))) script += `echo ${b64(f.content)} | base64 -d > /fx${variant}${p}\n`;
}
sim.forEach((s, i) => {
  script += `rm -rf /home/user && cp -a /fx${s.variant}/home/user /home/user && cd /home/user && env -i HOME=/home/user USER=user PATH=/usr/local/bin:/usr/bin:/bin LC_ALL=C timeout 10 bash -c ${JSON.stringify(s.cmd).replace(/\$/g, '\\$').replace(/`/g, '\\`')} > /tmp/o 2> /tmp/e < /dev/null; echo "${i} $? $(base64 -w0 < /tmp/o) $([ -s /tmp/e ] && echo 1 || echo 0)"; cd /\n`;
});
fs.writeFileSync(path.join(__dirname, 'diff-run.sh'), script);
const output = execFileSync('docker', ['run', '--rm', '-v', `${__dirname}:/s`, 'ubuntu:24.04', 'bash', '-c', 'apt-get update -qq >/dev/null && apt-get install -y -qq binutils file >/dev/null 2>&1; bash /s/diff-run.sh'], { maxBuffer: 64 * 1024 * 1024 }).toString();
const real = new Map(output.trim().split('\n').filter(l => /^\d+ /.test(l)).map(l => { const [i, code, out, err] = l.split(' '); return [+i, { code: +code, out: Buffer.from(out || '', 'base64').toString('latin1'), err: err === '1' }]; }));
const unordered = cmd => /\b(find|du)\b/.test(cmd) && !/\|\s*sort\b/.test(cmd);   // directory order on a real disk is not defined
const diffs = [];
sim.forEach((s, i) => {
  const r = real.get(i);
  if (!r) { diffs.push(`#${i} no result for ${s.cmd}`); return; }
  const norm = t => unordered(s.cmd) ? t.split('\n').sort().join('\n') : t;
  if (norm(r.out) !== norm(s.out) || r.code !== s.code || r.err !== s.err) diffs.push(`v${s.variant} ${s.cmd}\n   sim  code=${s.code} err=${s.err} ${JSON.stringify(s.out.slice(0, 160))}\n   real code=${r.code} err=${r.err} ${JSON.stringify(r.out.slice(0, 160))}`);
});
console.log(`${sim.length} command runs compared (${commands.length} distinct commands, 2 file sets)`);
if (diffs.length) { console.log(diffs.join('\n')); process.exit(1); }
