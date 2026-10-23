// A small simulated shell for checking typed answers by their output and for the Bandit missions.
// It covers the commands the lessons use, in the C locale, and throws ShellUnsupported for anything else
// so the caller can fall back to comparing the text of the command.
class ShellUnsupported extends Error {}

const SHELL_OPS = ['&&', '||', '2>', '>>', '|', ';', '>', '<'];

function shellTokens(text) {
  const tokens = []; let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '#' ) break;
    const op = SHELL_OPS.find(o => text.startsWith(o, i));
    if (op && !(op === '2>' && i > 0 && /\S/.test(text[i - 1]))) { tokens.push({ op }); i += op.length; continue; }
    if (text[i] === '&') throw new ShellUnsupported('background jobs');
    let parts = [];
    while (i < text.length && !/\s/.test(text[i]) && !SHELL_OPS.some(o => o !== '2>' && text.startsWith(o, i)) && text[i] !== '&') {
      const c = text[i];
      if (c === "'") { const end = text.indexOf("'", i + 1); if (end < 0) throw new ShellUnsupported('quote'); parts.push({ text: text.slice(i + 1, end), quoted: true, expand: false }); i = end + 1; }
      else if (c === '"') { const end = text.indexOf('"', i + 1); if (end < 0) throw new ShellUnsupported('quote'); parts.push({ text: text.slice(i + 1, end).replace(/\\(["\\$`])/g, '$1'), quoted: true, expand: true }); i = end + 1; }
      else if (c === '\\') { parts.push({ text: text[i + 1] || '', quoted: true, expand: false }); i += 2; }
      else { let j = i; while (j < text.length && !/[\s'"\\&|;<>]/.test(text[j])) j++; if (j === i) j++; parts.push({ text: text.slice(i, j), quoted: false, expand: true }); i = j; }
    }
    tokens.push({ parts });
  }
  return tokens;
}

class Shell {
  constructor(fixture, { interactive = true } = {}) {
    this.interactive = interactive;
    this.files = new Map(); this.dirs = new Set(['/']); this.order = []; this.cwd = fixture.cwd || '/home/user';
    this.env = { HOME: '/home/user', USER: 'user', PATH: '/usr/local/bin:/usr/bin:/bin', ...fixture.env };
    this.locked = new Set(fixture.locked || []);
    this.history = fixture.history || []; this.processes = fixture.processes || []; this.who = fixture.who || [];
    for (const d of fixture.dirs || []) this.mkdirp(this.abs(d));
    for (const [p, f] of fixture.files) this.write(this.abs(p), f.content, f);
  }
  abs(p) {
    if (p === '~' || p.startsWith('~/')) p = this.env.HOME + p.slice(1);
    const parts = (p.startsWith('/') ? p : `${this.cwd}/${p}`).split('/'), out = [];
    for (const part of parts) { if (!part || part === '.') continue; if (part === '..') out.pop(); else out.push(part); }
    return '/' + out.join('/');
  }
  rel(p) { const base = this.cwd === '/' ? '/' : this.cwd + '/'; return p.startsWith(base) ? p.slice(base.length) : p; }
  parent(p) { return p.slice(0, p.lastIndexOf('/')) || '/'; }
  mkdirp(p) { const segs = p.split('/').filter(Boolean); let cur = ''; for (const s of segs) { cur += '/' + s; if (this.files.has(cur)) throw new ShellError(`not a directory: ${cur}`); if (!this.dirs.has(cur)) { this.dirs.add(cur); this.order.push(cur); } } }
  write(p, content, meta = {}) {
    if (this.dirs.has(p)) throw new ShellError(`Is a directory`);
    if (!this.dirs.has(this.parent(p))) throw new ShellError(`No such file or directory`);
    const old = this.files.get(p);
    if (!old) this.order.push(p);
    this.files.set(p, { content, mode: meta.mode ?? old?.mode ?? 0o644, owner: meta.owner ?? old?.owner ?? 'user', group: meta.group ?? old?.group ?? 'user' });
  }
  read(p) { const f = this.files.get(p); if (!f) throw new ShellError(this.dirs.has(p) ? 'Is a directory' : 'No such file or directory'); return f.content; }
  exists(p) { return this.files.has(p) || this.dirs.has(p); }
  children(dir) { const base = dir === '/' ? '/' : dir + '/'; return this.order.filter(p => p.startsWith(base) && !p.slice(base.length).includes('/') && this.exists(p)); }
  glob(word, cwd = this.cwd) {
    const dir = word.includes('/') ? this.abs(word.slice(0, word.lastIndexOf('/')) || '/') : cwd;
    const prefix = word.includes('/') ? word.slice(0, word.lastIndexOf('/') + 1) : '';
    const leaf = new RegExp('^' + (word.includes('/') ? word.slice(word.lastIndexOf('/') + 1) : word).replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    const names = this.children(dir).map(p => p.slice(p.lastIndexOf('/') + 1)).filter(n => leaf.test(n) && (!n.startsWith('.') || (word.split('/').pop()).startsWith('.')));
    return names.sort(cmpC).map(n => prefix + n);
  }
  expandWord(token) {
    let text = '', hasGlob = false, quotedAll = true;
    for (const part of token.parts) {
      let t = part.text;
      if (part.expand) {
        if (/\$\(|`/.test(t)) throw new ShellUnsupported('command substitution');
        t = t.replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, (_, name) => this.env[name] ?? '').replace(/\$([0-9?#@*!])/g, () => { throw new ShellUnsupported('special variable'); });
      }
      if (!part.quoted) { quotedAll = false; if (/[*?]/.test(t)) hasGlob = true; if (/[{}]/.test(t) && /\.\.|,/.test(t)) throw new ShellUnsupported('brace expansion'); }
      text += part.quoted ? t.replace(/[*?]/g, m => '\uE000' + m) : t;
    }
    if (hasGlob && !quotedAll) { const matches = this.glob(text.replace(/\uE000/g, '')); if (matches.length) return matches; }
    return [text.replace(/\uE000/g, '')];
  }
  parse(text) {
    const tokens = shellTokens(text), list = []; let pipeline = [], cmd = { words: [], redirects: [] };
    const endCmd = () => { if (!cmd.words.length && !cmd.redirects.length) throw new ShellUnsupported('empty command'); pipeline.push(cmd); cmd = { words: [], redirects: [] }; };
    for (let i = 0; i < tokens.length; i++) {
      const tk = tokens[i];
      if (tk.op === '|') endCmd();
      else if (['&&', '||', ';'].includes(tk.op)) { endCmd(); list.push({ pipeline, next: tk.op }); pipeline = []; }
      else if (['>', '>>', '<', '2>'].includes(tk.op)) { const target = tokens[++i]; if (!target || target.op) throw new ShellUnsupported('redirect'); cmd.redirects.push({ op: tk.op, target: this.expandWord(target)[0] }); }
      else cmd.words.push(...this.expandWord(tk));
    }
    if (cmd.words.length || cmd.redirects.length) endCmd();
    if (pipeline.length) list.push({ pipeline, next: '' });
    if (!list.length) throw new ShellUnsupported('empty');
    return list;
  }
  run(text) {
    let out = '', err = '', code = 0, connector = null;
    for (const { pipeline, next } of this.parse(text)) {
      const skip = (connector === '&&' && code !== 0) || (connector === '||' && code === 0);
      connector = next;
      if (skip) continue;
      let input = '';
      for (let i = 0; i < pipeline.length; i++) {
        const c = pipeline[i];
        let stdin = i === 0 ? '' : input, stdout = '', stderr = '';
        this.keyboard = i === 0 && !c.redirects.some(r => r.op === '<');
        try {
          for (const r of c.redirects) if (r.op === '<') stdin = this.read(this.abs(r.target));
          const result = this.exec(c.words, stdin);
          stdout = result.out; stderr = result.err || ''; code = result.code || 0;
        } catch (e) {
          if (!(e instanceof ShellError)) throw e;
          stderr = `${c.words[0]}: ${e.message}\n`; code = e.code;
        }
        for (const r of c.redirects) {
          if (r.op === '>' || r.op === '>>') { const p = this.abs(r.target); if (r.target !== '/dev/null') this.write(p, (r.op === '>>' && this.files.has(p) ? this.read(p) : '') + stdout); stdout = ''; }
          if (r.op === '2>') { if (r.target !== '/dev/null') this.write(this.abs(r.target), stderr); stderr = ''; }
        }
        err += stderr;
        input = stdout;
      }
      out += input;
    }
    return { out, err, code };
  }
  exec(words, stdin) {
    const [name, ...args] = words, fn = COMMANDS[name];
    if (!fn) throw new ShellUnsupported(`command ${name}`);
    return fn.call(this, args, stdin);
  }
}

class ShellError extends Error { constructor(message, code = 1) { super(message); this.code = code; } }

// C-locale byte order, like LC_ALL=C on Ubuntu.
function cmpC(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

function opts(args, switches, valued = '', { long = {}, numericFlag = false } = {}) {
  const o = {}, rest = []; let i = 0;
  for (; i < args.length; i++) {
    const a = args[i];
    if (a === '--') { rest.push(...args.slice(i + 1)); break; }
    if (long[a] !== undefined) { o[long[a]] = true; continue; }
    if (a.startsWith('--')) throw new ShellUnsupported(`option ${a}`);
    if (numericFlag && /^-\d+$/.test(a)) { o.num = Number(a.slice(1)); continue; }
    if (!/^-[A-Za-z]/.test(a) && !(a.length === 2 && switches.includes(a[1]))) { rest.push(a); continue; }
    for (let j = 1; j < a.length; j++) {
      const ch = a[j];
      if (valued.includes(ch)) { const v = a.slice(j + 1) || args[++i]; if (v === undefined) throw new ShellError(`option requires an argument -- '${ch}'`, 1); o[ch] = v; break; }
      if (!switches.includes(ch)) throw new ShellUnsupported(`option -${ch}`);
      o[ch] = true;
    }
  }
  return [o, rest];
}
const lines = text => { if (!text) return []; const l = text.split('\n'); if (l[l.length - 1] === '') l.pop(); return l; };
const join = l => l.length ? l.join('\n') + '\n' : '';
function inputs(shell, files, stdin, name) {
  if (!files.length || (files.length === 1 && files[0] === '-')) {
    if (shell.keyboard && shell.interactive) throw new ShellError('waiting for keyboard input (nothing was piped in)', 130);
    return [{ name: '-', text: stdin }];
  }
  return files.map(f => { const p = shell.abs(f); if (shell.dirs.has(p)) return { name: f, error: `${name}: ${f}: Is a directory\n` }; if (!shell.files.has(p)) return { name: f, error: `${name}: ${f}: No such file or directory\n` }; return { name: f, text: shell.read(p) }; });
}
const isBinary = text => text.includes('\u0000');
function blocks(bytes) { return Math.ceil(bytes / 4096) * 4; }
function human(kib) {
  const units = ['K', 'M', 'G']; let v = kib, u = 0;
  while (v >= 1024 && u < units.length - 1) { v /= 1024; u++; }
  return v < 10 ? `${(Math.ceil(v * 10) / 10).toFixed(1)}${units[u]}` : `${Math.ceil(v)}${units[u]}`;
}
function parseHuman(s) { const m = s.trim().match(/^(-?\d+(?:\.\d+)?)([KMGTP]?)/i); if (!m) return 0; return parseFloat(m[1]) * 1024 ** ' KMGTP'.indexOf((m[2] || ' ').toUpperCase()); }
function charSet(spec) {
  const classes = { '[:upper:]': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '[:lower:]': 'abcdefghijklmnopqrstuvwxyz', '[:digit:]': '0123456789', '[:space:]': ' \t\n\r\v\f' };
  let s = spec.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\'), out = '';
  for (const [k, v] of Object.entries(classes)) s = s.split(k).join(v);
  for (let i = 0; i < s.length; i++) {
    if (s[i + 1] === '-' && i + 2 < s.length) { for (let c = s.charCodeAt(i); c <= s.charCodeAt(i + 2); c++) out += String.fromCharCode(c); i += 2; }
    else out += s[i];
  }
  return out;
}
function grepRegex(pattern, o) {
  let src = o.F ? pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : o.E ? pattern : pattern.replace(/\\([|(){}+?])/g, '\uE001$1').replace(/([|(){}+?])/g, '\\$1').replace(/\uE001([|(){}+?])/g, '$1');
  if (o.w) src = `(?<![A-Za-z0-9_])(?:${src})(?![A-Za-z0-9_])`;
  return new RegExp(src, o.i ? 'i' : '');
}
function sortKey(line, o) {
  if (o.k === undefined) return line;
  const k = String(o.k).split(',')[0], field = parseInt(k, 10);
  const parts = o.t !== undefined ? line.split(o.t) : line.split(/(?<=\S)(?=\s)/);
  return (parts[field - 1] || '').replace(o.t === undefined ? /^\s+/ : /^$/, '');
}
function numericValue(s) { const m = s.match(/^\s*(-?\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; }

const COMMANDS = {
  echo(args) { let nl = true; if (args[0] === '-n') { nl = false; args = args.slice(1); } return { out: args.join(' ') + (nl ? '\n' : '') }; },
  pwd() { return { out: this.cwd + '\n' }; },
  cd(args) { const p = this.abs(args[0] || this.env.HOME); if (!this.dirs.has(p)) throw new ShellError(`${args[0]}: No such file or directory`); this.cwd = p; return { out: '' }; },
  cat(args, stdin) {
    const [o, files] = opts(args, 'nAETbs'); if (o.A || o.E || o.T || o.b || o.s) throw new ShellUnsupported('cat option');
    let out = '', err = '';
    for (const f of inputs(this, files, stdin, 'cat')) { if (f.error) err += f.error; else out += f.text; }
    if (o.n) { let n = 0; out = join(lines(out).map(l => `${String(++n).padStart(6)}\t${l}`)); }
    return { out, err, code: err ? 1 : 0 };
  },
  ls(args) {
    const [o, paths] = opts(args, 'alhrt1R'); if (o.t || o.R) throw new ShellUnsupported('ls option');
    if (o.l) throw new ShellUnsupported('ls -l');
    const targets = (paths.length ? paths : ['.']).slice().sort((x, y) => (this.dirs.has(this.abs(x)) - this.dirs.has(this.abs(y))) || cmpC(x, y));
    let out = '', err = '', sections = 0;
    for (const t of targets) {
      const p = this.abs(t);
      if (this.files.has(p)) { out += t + '\n'; continue; }
      if (!this.dirs.has(p)) { err += `ls: cannot access '${t}': No such file or directory\n`; continue; }
      let names = this.children(p).map(c => c.slice(c.lastIndexOf('/') + 1)).filter(n => o.a || !n.startsWith('.'));
      if (o.a) names.push('.', '..');
      names.sort(cmpC); if (o.r) names.reverse();
      if (targets.length > 1) out += `${sections++ || out ? '\n' : ''}${t}:\n`;
      out += join(names);
    }
    return { out, err, code: err ? 2 : 0 };
  },
  grep(args, stdin) {
    const [o, rest] = opts(args, 'ivnclwEFrsho', 'eAB');
    const pattern = o.e ?? rest.shift();
    if (pattern === undefined) throw new ShellError('usage: grep [OPTION]... PATTERNS [FILE]...', 2);
    if (o.r || o.A || o.B || o.h || o.o) throw new ShellUnsupported('grep option');
    const re = grepRegex(pattern, o), sources = inputs(this, rest, stdin, 'grep'), many = sources.length > 1;
    let out = '', err = '', matched = false;
    for (const src of sources) {
      if (src.error) { if (!o.s) err += src.error; continue; }
      const hits = []; lines(src.text).forEach((l, i) => { if (re.test(l) !== !!o.v) hits.push([i + 1, l]); });
      if (hits.length) matched = true;
      const label = src.name === '-' ? '(standard input)' : src.name;
      if (o.c) { out += (many ? `${label}:` : '') + hits.length + '\n'; continue; }
      if (o.l) { if (hits.length) out += label + '\n'; continue; }
      if (hits.length && isBinary(src.text)) { err += `grep: ${label}: binary file matches\n`; continue; }
      for (const [n, l] of hits) out += (many ? `${label}:` : '') + (o.n ? `${n}:` : '') + l + '\n';
    }
    return { out, err, code: err && !matched ? 2 : matched ? 0 : 1 };
  },
  sort(args, stdin) {
    const [o, files] = opts(args, 'nrufhbMc', 'kto'); if (o.M || o.c || o.b) throw new ShellUnsupported('sort option');
    let all = []; let err = '';
    for (const f of inputs(this, files, stdin, 'sort')) { if (f.error) err += f.error.replace(': No such', ': cannot read: No such'); else all.push(...lines(f.text)); }
    if (err) return { out: '', err: err.replace(/^sort: (.*): cannot read: No such file or directory/m, 'sort: cannot read: $1: No such file or directory'), code: 2 };
    const key = l => sortKey(l, o);
    const cmp = (a, b) => {
      let ka = key(a), kb = key(b), r;
      if (o.n) r = numericValue(ka) - numericValue(kb);
      else if (o.h) r = parseHuman(ka) - parseHuman(kb);
      else { if (o.f) { ka = ka.toUpperCase(); kb = kb.toUpperCase(); } r = cmpC(ka, kb); }
      if (r === 0 && !o.u) r = cmpC(a, b);
      return o.r ? -r : r;
    };
    all.sort(cmp);
    if (o.u) all = all.filter((l, i) => i === 0 || cmp(all[i - 1], l) !== 0);
    const out = join(all);
    if (o.o) { this.write(this.abs(o.o), out); return { out: '' }; }
    return { out };
  },
  uniq(args, stdin) {
    const [o, files] = opts(args, 'cudi'); if (files.length > 1) throw new ShellUnsupported('uniq output file');
    const src = inputs(this, files, stdin, 'uniq')[0]; if (src.error) return { out: '', err: src.error, code: 1 };
    const groups = []; for (const l of lines(src.text)) { const last = groups[groups.length - 1]; if (last && (o.i ? last.line.toLowerCase() === l.toLowerCase() : last.line === l)) last.n++; else groups.push({ line: l, n: 1 }); }
    const keep = groups.filter(g => o.u ? g.n === 1 : o.d ? g.n > 1 : true);
    return { out: join(keep.map(g => o.c ? `${String(g.n).padStart(7)} ${g.line}` : g.line)) };
  },
  head(args, stdin) { return headTail.call(this, args, stdin, 'head'); },
  tail(args, stdin) { return headTail.call(this, args, stdin, 'tail'); },
  wc(args, stdin) {
    const [o, files] = opts(args, 'lwcm'); if (o.m) throw new ShellUnsupported('wc -m');
    const want = o.l || o.w || o.c ? ['l', 'w', 'c'].filter(k => o[k]) : ['l', 'w', 'c'];
    const sources = inputs(this, files, stdin, 'wc'), counts = [];
    let err = '';
    for (const s of sources) { if (s.error) { err += s.error; continue; } counts.push({ name: s.name, l: lines(s.text).length + (s.text && !s.text.endsWith('\n') ? 0 : 0), w: (s.text.match(/\S+/g) || []).length, c: s.text.length, raw: s.text }); }
    for (const c of counts) c.l = (c.raw.match(/\n/g) || []).length;
    const fromStdin = sources.length === 1 && sources[0].name === '-';
    const total = { name: 'total', l: 0, w: 0, c: 0 }; for (const c of counts) for (const k of 'lwc') total[k] += c[k];
    const rows = counts.length > 1 ? [...counts, total] : counts;
    let width;
    if (fromStdin) width = want.length === 1 ? 1 : 7;
    else width = sources.length === 1 && want.length === 1 ? 1 : Math.max(1, String(counts.reduce((n, c) => n + c.c, 0)).length);
    const out = rows.map(r => want.map(k => String(r[k]).padStart(width)).join(' ') + (r.name === '-' ? '' : ` ${r.name}`)).join('\n') + (rows.length ? '\n' : '');
    return { out, err, code: err ? 1 : 0 };
  },
  cut(args, stdin) {
    const [o, files] = opts(args, 's', 'dfcb'); const src = inputs(this, files, stdin, 'cut')[0]; if (src.error) return { out: '', err: src.error, code: 1 };
    const spec = o.f ?? o.c ?? o.b; if (!spec) throw new ShellError('you must specify a list of bytes, characters, or fields', 1);
    const pick = (len) => { const keep = new Set(); for (const part of spec.split(',')) { const [a, b] = part.includes('-') ? part.split('-') : [part, part]; const from = a ? +a : 1, to = b === '' ? len : +b; for (let i = from; i <= Math.min(to, len); i++) keep.add(i); } return [...keep].sort((x, y) => x - y); };
    const delim = o.d ?? '\t';
    if (o.d !== undefined && o.d.length !== 1) throw new ShellError('the delimiter must be a single character', 1);
    const out = lines(src.text).map(l => {
      if (o.f !== undefined) { if (!l.includes(delim)) return o.s ? null : l; const parts = l.split(delim); return pick(parts.length).map(i => parts[i - 1]).join(delim); }
      return pick(l.length).map(i => l[i - 1]).join('');
    }).filter(l => l !== null);
    return { out: join(out) };
  },
  tr(args, stdin) {
    const [o, sets] = opts(args, 'ds');
    if (this.keyboard && this.interactive) throw new ShellError('waiting for keyboard input (nothing was piped in)', 130);
    if (o.d) { const del = charSet(sets[0]); return { out: [...stdin].filter(c => !del.includes(c)).join('') }; }
    if (sets.length < 2 && !o.s) throw new ShellError('missing operand', 1);
    if (sets.length > 2) throw new ShellError(`extra operand '${sets[2]}'`, 1);
    const a = charSet(sets[0]), b = sets[1] !== undefined ? charSet(sets[1]) : '';
    let out = [...stdin].map(c => { const i = a.indexOf(c); return i < 0 || !b ? c : b[Math.min(i, b.length - 1)]; }).join('');
    if (o.s) { const squeeze = b || a; out = out.replace(/(.)\1+/gs, (m, c) => squeeze.includes(c) ? c : m); }
    return { out };
  },
  awk(args, stdin) {
    const [o, rest] = opts(args, '', 'F'); const program = rest.shift(); const src = inputs(this, rest, stdin, 'awk')[0]; if (src.error) return { out: '', err: src.error, code: 2 };
    const m = program && program.trim().match(/^\{\s*print(?:\s+(\$NF|\$\d+|NR|NF))?\s*\}$/);
    if (!m) throw new ShellUnsupported('awk program');
    const out = lines(src.text).map((l, i) => {
      const fields = o.F !== undefined ? l.split(o.F) : l.trim().split(/\s+/).filter(Boolean);
      const what = m[1];
      if (!what) return l; if (what === 'NR') return String(i + 1); if (what === 'NF') return String(fields.length);
      if (what === '$NF') return fields[fields.length - 1] ?? ''; const n = +what.slice(1); return n === 0 ? l : fields[n - 1] ?? '';
    });
    return { out: join(out) };
  },
  sed(args, stdin) {
    const [o, rest] = opts(args, 'n', 'e'); const script = o.e ?? rest.shift(); const src = inputs(this, rest, stdin, 'sed')[0]; if (src.error) return { out: '', err: src.error, code: 2 };
    let m, out = [];
    const ls = lines(src.text);
    if ((m = script.match(/^s\/((?:\\.|[^/])*)\/((?:\\.|[^/])*)\/(g?)$/))) { const re = new RegExp(m[1], m[3] ? 'g' : ''); out = ls.map(l => l.replace(re, m[2])); if (o.n) out = []; }
    else if ((m = script.match(/^\/((?:\\.|[^/])*)\/d$/))) out = ls.filter(l => !new RegExp(m[1]).test(l));
    else if ((m = script.match(/^\/((?:\\.|[^/])*)\/p$/)) && o.n) out = ls.filter(l => new RegExp(m[1]).test(l));
    else if ((m = script.match(/^(\d+),(\d+)p$/)) && o.n) out = ls.slice(+m[1] - 1, +m[2]);
    else throw new ShellUnsupported('sed script');
    return { out: join(out) };
  },
  find(args) {
    const start = []; let i = 0;
    while (i < args.length && !args[i].startsWith('-') && args[i] !== '!' && args[i] !== '(') start.push(args[i++]);
    const tests = []; let maxdepth = Infinity, mindepth = 0, negate = false;
    for (; i < args.length; i++) {
      const a = args[i];
      if (a === '!' || a === '-not') { negate = true; continue; }
      const push = fn => { const n = negate; tests.push(n ? (p, info) => !fn(p, info) : fn); negate = false; };
      if (a === '-maxdepth') maxdepth = +args[++i];
      else if (a === '-mindepth') mindepth = +args[++i];
      else if (a === '-type') { const t = args[++i]; push((p, info) => (t === 'd') === info.dir); }
      else if (a === '-name' || a === '-iname') { const g = args[++i], flags = a === '-iname' ? 'i' : ''; const re = new RegExp('^' + g.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', flags); push(p => re.test(p.slice(p.lastIndexOf('/') + 1))); }
      else if (a === '-size') { const s = args[++i], m = s.match(/^([+-]?)(\d+)([ckMG]?)$/); if (!m) throw new ShellUnsupported('find -size'); const unit = { c: 1, k: 1024, M: 1048576, G: 1073741824, '': 512 }[m[3]]; push((p, info) => { if (info.dir) return false; const size = m[3] === '' || m[3] === 'k' || m[3] === 'M' || m[3] === 'G' ? Math.ceil(info.size / unit) : info.size; return m[1] === '+' ? size > +m[2] : m[1] === '-' ? size < +m[2] : size === +m[2]; }); }
      else if (a === '-executable') push((p, info) => info.dir || (info.mode & 0o111) !== 0);
      else if (a === '-readable') push(p => !this.locked.has(p));
      else if (a === '-print') continue;
      else if (a === '-user') { const u = args[++i]; push((p, info) => info.owner === u); }
      else if (a === '-group') { const g = args[++i]; push((p, info) => info.group === g); }
      else throw new ShellUnsupported(`find ${a}`);
    }
    let out = '', err = '';
    for (const s of start.length ? start : ['.']) {
      const root = this.abs(s);
      if (!this.exists(root)) { err += `find: '${s}': No such file or directory\n`; continue; }
      const walk = (p, depth, shown) => {
        const info = { dir: this.dirs.has(p), size: this.files.get(p) ? this.files.get(p).content.length : 0, mode: this.files.get(p)?.mode ?? 0o755, owner: this.files.get(p)?.owner ?? 'user', group: this.files.get(p)?.group ?? 'user' };
        if (depth >= mindepth && tests.every(t => t(p, info))) out += shown + '\n';
        if (info.dir && this.locked.has(p)) { err += `find: '${shown}': Permission denied\n`; return; }
        if (info.dir && depth < maxdepth) for (const c of this.children(p)) walk(c, depth + 1, (shown === '/' ? '' : shown) + '/' + c.slice(c.lastIndexOf('/') + 1));
      };
      walk(root, 0, s.replace(/\/+$/, '') || '/');
    }
    return { out, err, code: err ? 1 : 0 };
  },
  du(args) {
    const [o, paths] = opts(args, 'hsac'); if (o.a || o.c) throw new ShellUnsupported('du option');
    const size = p => this.dirs.has(p) ? 4 + this.children(p).reduce((n, c) => n + size(c), 0) : blocks(this.files.get(p).content.length);
    const fmt = (k, name) => `${o.h ? human(k) : k}\t${name}\n`;
    let out = '';
    for (const t of paths.length ? paths : ['.']) {
      const p = this.abs(t);
      if (!this.exists(p)) throw new ShellError(`cannot access '${t}': No such file or directory`);
      const visit = (q, shown) => { if (this.dirs.has(q)) for (const c of this.children(q)) if (this.dirs.has(c)) visit(c, `${shown.replace(/\/$/, '')}/${c.slice(c.lastIndexOf('/') + 1)}`); out += fmt(size(q), shown); };
      if (o.s || this.files.has(p)) out += fmt(size(p), t); else visit(p, t);
    }
    return { out };
  },
  file(args) {
    const [o, files] = opts(args, 'b'); let out = '';
    const width = Math.max(0, ...files.map(f => f.length)) + 1;
    for (const f of files) {
      const p = this.abs(f), label = o.b ? '' : `${f}:`.padEnd(width) + ' ';
      if (this.dirs.has(p)) { out += `${label}directory\n`; continue; }
      if (!this.files.has(p)) { out += `${label}cannot open \`${f}' (No such file or directory)\n`; continue; }
      const c = this.files.get(p).content;
      out += label + (c.startsWith('\u001f\u008b') ? 'gzip compressed data' : c === '' ? 'empty' : isBinary(c) || /[\u0080-\u00ff]/.test(c) ? 'data' : 'ASCII text') + '\n';
    }
    return { out };
  },
  strings(args, stdin) {
    const [o, files] = opts(args, 'a', 'n'); const min = +(o.n ?? 4);
    const src = inputs(this, files, stdin, 'strings')[0]; if (src.error) return { out: '', err: src.error, code: 1 };
    const out = (src.text.match(new RegExp(`[\\x20-\\x7e\\t]{${min},}`, 'g')) || []);
    return { out: join(out) };
  },
  chmod(args) {
    const [mode, ...files] = args.filter(a => a !== '-v');
    if (!mode || !files.length) throw new ShellError('missing operand');
    for (const f of files) {
      const p = this.abs(f), file = this.files.get(p);
      if (!file) throw new ShellError(`cannot access '${f}': No such file or directory`);
      if (/^[0-7]{3}$/.test(mode)) { file.mode = parseInt(mode, 8); continue; }
      const m = mode.match(/^([ugoa]*)([+-])([rwx]+)$/); if (!m) throw new ShellUnsupported('chmod mode');
      const who = m[1] || 'a', bits = { r: 4, w: 2, x: 1 }, shift = { u: 6, g: 3, o: 0 };
      let mask = 0; for (const w of who === 'a' ? 'ugo' : who) for (const b of m[3]) mask |= bits[b] << shift[w];
      file.mode = m[2] === '+' ? file.mode | mask : file.mode & ~mask;
    }
    return { out: '' };
  },
  mkdir(args) { const [o, dirs] = opts(args, 'p'); for (const d of dirs) { const p = this.abs(d); if (this.exists(p)) { if (!o.p) throw new ShellError(`cannot create directory '${d}': File exists`); continue; } if (!o.p && !this.dirs.has(this.parent(p))) throw new ShellError(`cannot create directory '${d}': No such file or directory`); this.mkdirp(p); } return { out: '' }; },
  cp(args) {
    const [o, paths] = opts(args, 'rinv'); if (o.i || o.n || o.v) throw new ShellUnsupported('cp option');
    if (paths.length < 2) throw new ShellError('missing destination file operand');
    const dest = paths.pop(), dp = this.abs(dest);
    if (paths.length > 1 && !this.dirs.has(dp)) throw new ShellError(`target '${dest}': Not a directory`);
    if (dest.endsWith('/') && !this.dirs.has(dp) && paths.some(p => this.files.has(this.abs(p)))) throw new ShellError(`cannot create regular file '${dest}': Not a directory`);
    for (const s of paths) {
      const sp = this.abs(s), target = this.dirs.has(dp) ? `${dp}/${sp.slice(sp.lastIndexOf('/') + 1)}` : dp;
      if (this.dirs.has(sp)) { if (!o.r) throw new ShellError(`-r not specified; omitting directory '${s}'`); this.mkdirp(target); for (const p of [...this.order]) if (p.startsWith(sp + '/')) { const t = target + p.slice(sp.length); if (this.dirs.has(p)) this.mkdirp(t); else this.write(t, this.read(p)); } }
      else this.write(target, this.read(sp));
    }
    return { out: '' };
  },
  mv(args) { const [, paths] = opts(args, 'f'); if (paths.length !== 2) throw new ShellUnsupported('mv many'); const [s, d] = paths.map(p => this.abs(p)); const target = this.dirs.has(d) ? `${d}/${s.slice(s.lastIndexOf('/') + 1)}` : d; if (this.dirs.has(s)) throw new ShellUnsupported('mv dir'); this.write(target, this.read(s), this.files.get(s)); this.files.delete(s); return { out: '' }; },
  rm(args) { const [o, paths] = opts(args, 'rf'); if (o.r) throw new ShellUnsupported('rm -r'); for (const f of paths) { const p = this.abs(f); if (!this.files.has(p)) { if (o.f) continue; throw new ShellError(`cannot remove '${f}': No such file or directory`); } this.files.delete(p); } return { out: '' }; },
  base64(args, stdin) {
    const [o, files] = opts(args, 'd'); const src = inputs(this, files, stdin, 'base64')[0]; if (src.error) return { out: '', err: src.error, code: 1 };
    if (o.d) { try { return { out: atob(src.text.replace(/\s+/g, '')) }; } catch { throw new ShellError('invalid input'); } }
    const enc = btoa(src.text); return { out: join(enc.match(/.{1,76}/g) || []) };
  },
  who() { return { out: join(this.who) }; },
  whoami() { return { out: this.env.USER + '\n' }; },
  history() { return { out: join(this.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`)) }; },
  ps(args) { const [o] = opts(args, 'ef'); const rows = o.f ? this.processes.full : this.processes.short; return { out: join(o.e ? rows : [rows[0], ...rows.slice(1).filter(r => /pts\/0/.test(r))]) }; },
  getent(args) { if (args[0] !== 'passwd') throw new ShellUnsupported('getent'); return { out: this.read('/etc/passwd') }; },
};
function headTail(args, stdin, which) {
  const [o, files] = opts(args, 'qv', 'nc', { numericFlag: true });
  const sources = inputs(this, files, stdin, which), many = sources.length > 1;
  let out = '', err = '';
  sources.forEach((s, idx) => {
    if (s.error) { err += s.error.replace(`${which}: ${s.name}:`, `${which}: cannot open '${s.name}' for reading:`); return; }
    if (many) out += `${idx ? '\n' : ''}==> ${s.name} <==\n`;
    if (o.c !== undefined) { const n = +o.c; out += which === 'head' ? s.text.slice(0, n) : s.text.slice(-n); return; }
    const n = o.n !== undefined ? o.n : o.num ?? 10, all = lines(s.text);
    const fromStart = typeof n === 'string' && n.startsWith('+');
    const count = Math.abs(parseInt(n, 10));
    const picked = which === 'head' ? (String(n).startsWith('-') ? all.slice(0, Math.max(0, all.length - count)) : all.slice(0, count)) : fromStart ? all.slice(count - 1) : all.slice(Math.max(0, all.length - count));
    out += join(picked);
  });
  return { out, err, code: err ? 1 : 0 };
}

const ETC_DIRS = ['/etc/apt', '/etc/cron.d', '/etc/default', '/etc/ssh', '/etc/systemd'];
const ETC_FILES = ['adduser.conf', 'bash.bashrc', 'debian_version', 'environment', 'fstab', 'group', 'host.conf', 'hostname', 'hosts', 'issue', 'login.defs', 'motd', 'os-release', 'profile', 'shells'].map(n => [`/etc/${n}`, { content: `${n}\n` }]);

// Sample files for checking answers. Two variants with different content and creation order,
// so a command that only works by accident on one of them is caught by the other.
function lessonFixture(variant) {
  const files = [], add = (p, content, meta = {}) => files.push([p, { content, ...meta }]);
  const rnd = (() => { let s = variant * 7919 + 13; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; })();
  const kinds = ['INFO service started', 'DEBUG cache warm', 'ERROR disk full', 'error connection refused', 'WARN ssh login from 10.0.0.%', 'INFO sshd restarted', 'Timeout waiting for db', 'timeout on api', 'WARN SSH key rejected', 'Error retry later'];
  const log = []; for (let i = 1; i <= 36 + variant * 5; i++) { const k = kinds[Math.floor(rnd() * kinds.length)].replace('%', i); log.push(`2026-10-0${1 + variant} 10:${String(i).padStart(2, '0')} ${k}`); }
  log.push(log[3], log[3], `2026-10-0${1 + variant} 11:00 DEBUG flush`, `2026-10-0${1 + variant} 11:01 INFO done`, `2026-10-0${1 + variant} 11:02 DEBUG idle`);
  const names = variant ? ['Noa', 'avi', 'Dana', 'noa', 'ben', 'Avi', 'zoe', 'Ben', 'Dana', 'keren', 'Avi'] : ['Dana', 'avi', 'Avi', 'dana', 'Noa', 'ben', 'Dana', 'zoe', 'Ben', 'noa', 'Avi', 'keren'];
  const dirs = variant ? ['config', 'logs', 'source', 'logs/old', 'config/sub', 'config/sub/sub2', 'config/dir.conf', 'old.log'] : ['logs', 'logs/old', 'config', 'config/sub', 'config/sub/sub2', 'config/dir.conf', 'source', 'old.log'];
  const order = [
    () => add('app.log', log.join('\n') + '\n'),
    () => add('names.txt', names.join('\n') + '\n'),
    () => add('notes.txt', variant ? 'zeta line\nconnect with SSH\nbuy milk\nalpha line\nbuy milk\n' : 'connect with SSH\nbuy milk\nconnect with SSH\nalpha line\nzeta line\nbeta line\nbuy milk\n'),
    () => add('scores.txt', variant ? '7\n300\n42\n8\n' : '10\n9\n100\n25\n3\n'),
    () => add('users.txt', variant ? 'dan 2001 dev\nmia 2002 ops\ndan 2003 qa\n' : 'alice 1001 admin\nbob 1002 dev\nalice 1003 ops\ncarol 1004 dev\nbob 1005 qa\n'),
    () => add('inventory.txt', variant ? 'plum:3\nlime:40\nfig:100\n' : 'apple:12\npear:5\nfig:100\nkiwi:7\n'),
    () => add('data.bin', variant ? '\u0000\u0002TOKEN_SECOND_VALUE\n\u0000x\u0000token-777888\u0000ab\nzzzz-tail-one\u0000qq\nlast-string-here\u0000\u00ffgamma\u0000' : '\u0000\u0001token=abc\u0000\u0002TOKEN_LONGVALUE_X\ntok\u0000\u00ffmytoken12345\n\u0000alpha-string\u0000beta\nomega-final\u0000'),
    () => add('words.txt', variant ? 'apricot banana\n' : 'banana apple papaya\n'),
    () => add('first.txt', variant ? 'yak\nant\n' : 'zebra\nmango\n'),
    () => add('second.txt', variant ? 'cow\nbee\n' : 'apple\nkiwi\n'),
    () => add('report.txt', variant ? 'one two\nthree\n' : 'the quick brown fox\njumps over the lazy dog\nend of report\n'),
    () => add('access.log', (variant ? ['10.0.0.9', '10.0.0.4', '10.0.0.9', '10.0.0.9', '10.0.0.4', '10.0.0.7'] : ['10.0.0.1', '10.0.0.2', '10.0.0.1', '10.0.0.3', '10.0.0.1', '10.0.0.2']).map(ip => `${ip} - - [01/Oct] GET /`).join('\n') + '\n'),
    () => add('auth.log', Array.from({ length: 30 + variant * 4 }, (_, i) => i % 3 === 0 ? `Oct 1 sshd: Failed password ${i}` : i % 3 === 1 ? `Oct 1 sshd: failed login ${i}` : `Oct 1 cron: job ok ${i}`).join('\n') + '\n'),
    () => add('data.txt', variant ? '12 x\n3 y\n250 z\n' : '5 a\n40 b\n300 c\n7 d\n'),
    () => add('names1.txt', variant ? 'Avi\nzoe\n' : 'Dana\nNoa\nben\n'),
    () => add('names2.txt', variant ? 'zoe\nkeren\nAvi\n' : 'Noa\nzoe\nDana\nAvi\n'),
    () => add('logs/a.log', 'x\n'.repeat(variant ? 5000 : 3000)),
    () => add('logs/b.log', 'b\n'),
    () => add('logs/old/c.log', 'o\n'),
    () => add('config/app.conf', 'c\n'), () => add('config/b.conf', 'g\n'), () => add('config/sub/deep.conf', 'd\n'), () => add('config/sub/sub2/deeper.conf', 'e\n'), () => add('z.conf', 'f\n'),
    () => add('source/one.txt', 's\n'), () => add('source.txt', 's\n'),
    () => add('report_2026.txt', 'r\n'), () => add('Report.md', 'R\n'), () => add('tmp_file', 't\n'), () => add('file.tmp', 't\n'),
    () => add('KEY', 'key\n'), () => add('FILE', 'f\n'),
  ];
  if (variant) order.reverse();
  for (const step of order) step();
  return {
    cwd: '/home/user', dirs: ['/home/user', '/etc', '/tmp', ...ETC_DIRS, ...dirs.map(d => `/home/user/${d}`)],
    files: [...files.map(([p, f]) => [`/home/user/${p}`, f]), ...ETC_FILES, ['/etc/passwd', { content: 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nuser:x:1000:1000::/home/user:/bin/bash\nsync:x:4:65534:sync:/bin:/bin/sync\n' }]],
    history: variant ? ['ls -la', 'ssh admin@host', 'cat notes.txt', 'SSH -v', 'grep ssh app.log'] : ['cd logs', 'ssh -p 2220 bandit0@host', 'ls', 'grep error app.log', 'ssh bandit1@host', 'history'],
    processes: {
      short: ['    PID TTY          TIME CMD', '      1 ?        00:00:01 init', '    410 ?        00:00:00 sshd', '    520 ?        00:00:00 nginx', '    101 pts/0    00:00:00 bash', '    150 pts/0    00:00:00 ps'],
      full: ['UID          PID    PPID  C STIME TTY          TIME CMD', 'root           1       0  0 10:00 ?        00:00:01 /sbin/init', 'root         410       1  0 10:00 ?        00:00:00 sshd: /usr/sbin/sshd -D', 'www-data     520       1  0 10:01 ?        00:00:00 nginx: worker process', 'user         101      99  0 10:02 pts/0    00:00:00 -bash', 'user         150     101  0 10:03 pts/0    00:00:00 ps -e -f'].concat(variant ? ['root         530       1  0 10:01 ?        00:00:00 NGINX: master process'] : []),
    },
    who: variant ? ['mia      pts/1        2026-10-02 09:00', 'dan      pts/0        2026-10-02 08:00'] : ['user     pts/0        2026-10-01 10:00', 'alice    pts/1        2026-10-01 10:05'],
  };
}

// Runs both commands on both fixture variants. Returns true/false when the simulator can judge,
// or null when either command uses something it does not support.
function sameOutput(answer, typed, fixture = lessonFixture) {
  try {
    for (const variant of [0, 1]) {
      const a = new Shell(fixture(variant)), b = new Shell(fixture(variant));
      const ra = a.run(answer), rb = b.run(typed);
      if (ra.err) return null;
      if (rb.out !== ra.out || rb.code !== ra.code || !!rb.err !== !!ra.err) return false;
      const snapshot = s => JSON.stringify([...s.files].filter(([p]) => p.startsWith('/home/user')).map(([p, f]) => [p, f.content, f.mode]).sort());
      if (snapshot(a) !== snapshot(b)) return false;
    }
    return true;
  } catch (e) {
    if (e instanceof ShellUnsupported || e instanceof ShellError) return null;
    throw e;
  }
}
function previewOutput(command, fixture = lessonFixture, maxLines = 6) {
  try { const r = new Shell(fixture(0)).run(command); const out = lines(r.out + r.err); return out.slice(0, maxLines).join('\n') + (out.length > maxLines ? `\n… (+${out.length - maxLines})` : ''); }
  catch { return null; }
}

// Sample files shaped like the Bandit levels: odd names, hidden files, exact sizes and permissions, owners.
function banditFixture(variant) {
  const pad = (n, ch) => ch.repeat(n);
  const textFile = variant ? 'kM8cQ2 readable text here' : 'readable text here kM8cQ2';
  const files = [
    ['-', { content: variant ? 'dash-file-two\n' : 'dash-file-one\n' }],
    ['--spaces in this filename--', { content: variant ? 'spaces-two\n' : 'spaces-one\n' }],
    ['inhere/.hidden-file', { content: 'hidden\n' }],
    ['inhere/-file00', { content: '\u0000\u0091\u0003bin' }],
    [`inhere/-file0${variant ? 1 : 2}`, { content: textFile + '\n' }],
    [`inhere/-file0${variant ? 2 : 1}`, { content: '\u0000\u00a0\u0001bin' }],
    ['inhere/-file03', { content: '\u0000\u00ff\u0004bin' }],
    [`inhere/maybehere0${variant}/.file1`, { content: pad(1032, 'a') + '\n', mode: 0o644 }],
    ['inhere/maybehere05/file2', { content: pad(1032, 'b') + '\n', mode: 0o755 }],
    ['inhere/maybehere06/file3', { content: pad(999, 'c') + '\n', mode: 0o644 }],
    ['data.txt', { content: variant ? 'Gur frperg vf Nccyr Gerr\n' : 'Gur cnffjbeq vf Uryyb Jbeyq\n' }],
    ['old.txt', { content: 'old\nsame\n' }], ['new.txt', { content: 'new\nsame\n' }],
    ['pass.txt', { content: 'secret\n' }], ['key.private', { content: 'key\n', mode: 0o644 }], ['sshkey.private', { content: 'key\n', mode: 0o600 }],
    ['script.sh', { content: 'echo ok\n', mode: 0o644 }], ['readme', { content: 'read me\n' }],
  ];
  if (variant) files.reverse();
  return {
    cwd: '/home/user', locked: ['/root', '/etc/ssl/private'],
    dirs: ['/home/user', '/home/user/inhere', ...[0, 1, 5, 6].map(n => `/home/user/inhere/maybehere0${n}`), '/tmp', '/root', '/etc', '/etc/cron.d', '/etc/ssl', '/etc/ssl/private', '/var', '/var/lib', '/var/lib/dpkg', '/var/lib/dpkg/info', '/var/log'],
    files: [...files.map(([p, f]) => [`/home/user/${p}`, f]),
      ['/var/lib/dpkg/info/bandit7.password', { content: pad(32, variant ? 'y' : 'x') + '\n', owner: 'bandit7', group: 'bandit6' }],
      ['/var/log/decoy.log', { content: pad(32, 'z') + '\n', owner: 'bandit6', group: 'bandit7' }],
      ['/var/log/other.log', { content: pad(32, 'w') + '\n', owner: 'bandit7', group: 'bandit7' }],
      ['/root/secret', { content: 'nope\n', owner: 'root', group: 'root' }],
      ['/etc/cron.d/cronjob_bandit22', { content: '@reboot bandit22 /usr/bin/cronjob_bandit22.sh &> /dev/null\n' }],
      ['/etc/cron.d/cronjob_bandit23', { content: '* * * * * bandit23 /usr/bin/cronjob_bandit23.sh &> /dev/null\n' }],
      ['/etc/passwd', { content: 'root:x:0:0:root:/root:/bin/bash\nbandit0:x:11000:11000::/home/bandit0:/bin/bash\n' }]],
    history: [], processes: { short: ['    PID TTY          TIME CMD'], full: ['UID          PID    PPID  C STIME TTY          TIME CMD'] }, who: [],
  };
}
