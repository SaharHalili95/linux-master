// Merges one recording run into prototype/recorded.js, keeping the other distro's recordings.
const fs = require('fs');
const path = require('path');
// Usage: node record-merge.js <distro> <folder> [target, e.g. recorded/p6.js]. Part files add to RECORDED with Object.assign.
const [distro, dir, target = 'recorded.js'] = process.argv.slice(2);
const file = path.join(__dirname, '../../prototype', target), part = target !== 'recorded.js';
const vm = require('vm');
const ctx = {};
if (fs.existsSync(file)) vm.runInNewContext(part ? `const RECORDED = {};\n${fs.readFileSync(file, 'utf8')}\nthis.r = RECORDED;` : `${fs.readFileSync(file, 'utf8')}\nthis.r = RECORDED;`, ctx);
const all = ctx.r || {};
for (const line of fs.readFileSync(path.join(dir, 'cmds.tsv'), 'utf8').split('\n').filter(Boolean)) {
  const [id, a, b] = line.split('\t'), cmd = b === undefined ? a : b, setup = b === undefined ? undefined : a;
  all[id] = { distro, cmd, out: fs.readFileSync(path.join(dir, `${id}.out`), 'utf8'), ...(setup ? { setup } : {}) };
}
const body = Object.keys(all).sort().map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(all[id])},`).join('\n');
fs.writeFileSync(file, part ? `// Real output recorded by tests/sandbox/record.sh or record-vm.sh. Do not edit by hand.\nObject.assign(RECORDED, {\n${body}\n});\n` : `// Real output recorded by tests/sandbox/record.sh. Do not edit by hand.\nconst RECORDED = {\n${body}\n};\n`);
console.log(`${Object.keys(all).length} recordings in prototype/${target}`);
