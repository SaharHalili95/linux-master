// Merges one recording run into prototype/recorded.js, keeping the other distro's recordings.
const fs = require('fs');
const path = require('path');
const [distro, dir] = process.argv.slice(2);
const file = path.join(__dirname, '../../prototype/recorded.js');
const vm = require('vm');
const ctx = {};
if (fs.existsSync(file)) vm.runInNewContext(`${fs.readFileSync(file, 'utf8')}\nthis.r = RECORDED;`, ctx);
const all = ctx.r || {};
for (const line of fs.readFileSync(path.join(dir, 'cmds.tsv'), 'utf8').split('\n').filter(Boolean)) {
  const [id, cmd] = line.split('\t');
  all[id] = { distro, cmd, out: fs.readFileSync(path.join(dir, `${id}.out`), 'utf8') };
}
const body = Object.keys(all).sort().map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(all[id])},`).join('\n');
fs.writeFileSync(file, `// Real output recorded by tests/sandbox/record.sh. Do not edit by hand.\nconst RECORDED = {\n${body}\n};\n`);
console.log(`${Object.keys(all).length} recordings in prototype/recorded.js`);
