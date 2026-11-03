// Applies a layout fix sent from the in-app ✏️ editor: finds the course string the owner edited and rewrites it
// with the new spaces and line breaks. Refuses anything that changes more than whitespace.
// Usage: node layout-fix.js <issue-body-file>
const fs = require('fs');
const path = require('path');
const espree = require('espree');

const body = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n');
const block = body.match(/```json\n([\s\S]*?)\n```/);
if (!block) fail('no fix block in the issue');
let fix;
try { fix = JSON.parse(block[1]); } catch { fail('the fix block is not valid JSON'); }
const { original, layout } = fix;
const bare = s => s.replace(/[\s‎]+/g, '');
if (typeof original !== 'string' || typeof layout !== 'string' || !original.trim()) fail('the fix block is incomplete');
if (original === layout) fail('nothing changed');
if (bare(original) !== bare(layout)) fail('the fix changes more than spaces and line breaks');

const root = path.join(__dirname, '..', 'prototype');
const files = ['lessons.js', 'units.js', ...fs.readdirSync(path.join(root, 'parts')).map(f => `parts/${f}`)];
const quote = (q, s) => q + s.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), `\\${q}`).replace(/\n/g, '\\n')
  .replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(q === '`' ? /\$\{/g : /$^/, '\\${') + q;
let changed = 0;
for (const rel of files) {
  const file = path.join(root, rel);
  const src = fs.readFileSync(file, 'utf8');
  const hits = espree.tokenize(src, { ecmaVersion: 'latest', range: true })
    .filter(t => t.type === 'String' || (t.type === 'Template' && t.value.startsWith('`') && t.value.endsWith('`')))
    .filter(t => (0, eval)(t.value) === original);
  if (!hits.length) continue;
  let out = src;
  for (const t of hits.reverse()) out = out.slice(0, t.range[0]) + quote(t.value[0], layout) + out.slice(t.range[1]);
  fs.writeFileSync(file, out);
  changed += hits.length;
  console.log(`${rel}: ${hits.length}`);
}
if (!changed) fail('the text was not found as one string in the course files (it may be built from several parts)');

function fail(why) { console.error(why); process.exit(1); }
