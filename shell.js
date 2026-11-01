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
      if (c === '"' && /\$\(|`/.test(text.slice(i + 1, text.indexOf('"', i + 1)))) {
        const end = text.indexOf('"', i + 1); const inner = text.slice(i + 1, end); let k = 0;
        while (k < inner.length) {
          if (inner.startsWith('$(', k)) { let depth = 0, j = k + 1; for (; j < inner.length; j++) { if (inner[j] === '(') depth++; else if (inner[j] === ')' && --depth === 0) break; } parts.push({ sub: inner.slice(k + 2, j), quoted: true }); k = j + 1; }
          else if (inner[k] === '`') { const e = inner.indexOf('`', k + 1); parts.push({ sub: inner.slice(k + 1, e), quoted: true }); k = e + 1; }
          else { let j = k; while (j < inner.length && !inner.startsWith('$(', j) && inner[j] !== '`') j++; parts.push({ text: inner.slice(k, j).replace(/\\(["\\$`])/g, '$1'), quoted: true, expand: true }); k = j; }
        }
        i = end + 1; continue;
      }
      if (c === "'") { const end = text.indexOf("'", i + 1); if (end < 0) throw new ShellUnsupported('quote'); parts.push({ text: text.slice(i + 1, end), quoted: true, expand: false }); i = end + 1; }
      else if (c === '"') { const end = text.indexOf('"', i + 1); if (end < 0) throw new ShellUnsupported('quote'); parts.push({ text: text.slice(i + 1, end).replace(/\\(["\\$`])/g, '$1'), quoted: true, expand: true }); i = end + 1; }
      else if (c === '\\') { parts.push({ text: text[i + 1] || '', quoted: true, expand: false }); i += 2; }
      else if (text.startsWith('$(', i)) { let depth = 0, j = i + 1; for (; j < text.length; j++) { if (text[j] === '(') depth++; else if (text[j] === ')' && --depth === 0) break; } if (j >= text.length) throw new ShellUnsupported('quote'); parts.push({ sub: text.slice(i + 2, j), quoted: false }); i = j + 1; }
      else if (c === '`') { const end = text.indexOf('`', i + 1); if (end < 0) throw new ShellUnsupported('quote'); parts.push({ sub: text.slice(i + 1, end), quoted: false }); i = end + 1; }
      else { let j = i; while (j < text.length && !/[\s'"\\&|;<>`]/.test(text[j]) && !text.startsWith('$(', j)) j++; if (j === i) j++; parts.push({ text: text.slice(i, j), quoted: false, expand: true }); i = j; }
    }
    tokens.push({ parts });
  }
  return tokens;
}

class Shell {
  constructor(fixture, { interactive = true } = {}) {
    this.interactive = interactive;
    this.files = new Map(); this.dirs = new Set(['/']); this.order = []; this.cwd = fixture.cwd || '/home/user';
    this.env = { HOME: '/home/user', USER: 'user', SHELL: '/bin/bash', PATH: '/usr/local/bin:/usr/bin:/bin', ...fixture.env };
    this.aliases = { ...fixture.aliases };
    this.locked = new Set(fixture.locked || []);
    this.history = fixture.history || []; this.processes = fixture.processes || []; this.who = fixture.who || [];
    this.dmeta = new Map(); this.umaskValue = 0o022;
    for (const d of fixture.dirs || []) this.mkdirp(this.abs(d));
    for (const [p, f] of fixture.files) this.write(this.abs(p), f.content, f);
    for (const [p, target] of fixture.links || []) this.symlink(this.abs(p), target);
    for (const [p, m] of fixture.dirMeta || []) Object.assign(this.dirInfo(this.abs(p)), m);
  }
  abs(p) {
    if (p === '~' || p.startsWith('~/')) p = this.env.HOME + p.slice(1);
    const parts = (p.startsWith('/') ? p : `${this.cwd}/${p}`).split('/'), out = [];
    for (const part of parts) { if (!part || part === '.') continue; if (part === '..') out.pop(); else out.push(part); }
    return '/' + out.join('/');
  }
  rel(p) { const base = this.cwd === '/' ? '/' : this.cwd + '/'; return p.startsWith(base) ? p.slice(base.length) : p; }
  parent(p) { return p.slice(0, p.lastIndexOf('/')) || '/'; }
  mkdirp(p) { const segs = p.split('/').filter(Boolean); let cur = ''; for (const s of segs) { cur += '/' + s; if (this.files.has(cur)) throw new ShellError(`not a directory: ${cur}`); if (!this.dirs.has(cur)) { this.dirs.add(cur); this.order.push(cur); this.dirInfo(cur); } } }
  // Folders outside the home folder belong to root, like on a real system; /tmp is world-writable with the sticky bit.
  dirInfo(p) {
    if (!this.dmeta.has(p)) { const home = p === this.env.HOME || p.startsWith(this.env.HOME + '/'); this.dmeta.set(p, { mode: p === '/tmp' ? 0o1777 : home ? 0o777 & ~this.umaskValue : 0o755, owner: home ? this.whoAmI() : 'root', group: home ? this.whoAmI() : 'root' }); }
    return this.dmeta.get(p);
  }
  whoAmI() { return this.asRoot ? 'root' : this.env.USER; }
  write(p, content, meta = {}) {
    if (this.dirs.has(p)) throw new ShellError(`Is a directory`);
    if (!this.dirs.has(this.parent(p))) throw new ShellError(`No such file or directory`);
    const old = this.files.get(p);
    if (old?.link !== undefined) { const t = this.resolve(p); if (!t) throw new ShellError('No such file or directory'); return this.write(t, content, meta); }
    if (old) { old.content = content; for (const k of ['mode', 'owner', 'group']) if (meta[k] !== undefined) old[k] = meta[k]; return; }
    this.order.push(p);
    this.files.set(p, { content, mode: meta.mode ?? 0o666 & ~this.umaskValue, owner: meta.owner ?? this.whoAmI(), group: meta.group ?? meta.owner ?? this.whoAmI() });
  }
  symlink(p, target) {
    if (this.exists(p)) throw new ShellError(`failed to create symbolic link '${p}': File exists`);
    if (!this.dirs.has(this.parent(p))) throw new ShellError(`failed to create symbolic link '${p}': No such file or directory`);
    const shell = this; this.order.push(p);
    this.files.set(p, { link: target, mode: 0o777, owner: this.whoAmI(), group: this.whoAmI(), get content() { const t = shell.resolve(p); if (!t) throw new ShellError('No such file or directory'); return shell.files.get(t).content; } });
  }
  // The file a path finally points to, following symbolic links; null if the chain is broken.
  resolve(p, depth = 0) { const f = this.files.get(p); if (!f || depth > 8) return null; if (f.link === undefined) return p; const t = f.link.startsWith('/') ? f.link : `${this.parent(p)}/${f.link}`; return this.resolve(this.abs(t), depth + 1); }
  read(p) { const f = this.files.get(p); if (!f) throw new ShellError(this.dirs.has(p) ? 'Is a directory' : 'No such file or directory'); if (f.link !== undefined && !this.resolve(p)) throw new ShellError('No such file or directory'); return f.content; }
  meta(p) { return this.dirs.has(p) ? this.dirInfo(p) : this.files.get(p); }
  exists(p) { return this.files.has(p) || this.dirs.has(p); }
  blocks(p) { const f = this.files.get(p); return this.dirs.has(p) ? 4 : !f || f.link !== undefined ? 0 : Math.ceil(f.content.length / 4096) * 4; }
  // ls -l: GNU column layout. Every file shows the same fixed time, since the simulation has no clock.
  longList(entries, o) {
    const rows = entries.map(([name, p]) => {
      const f = this.files.get(p), dir = this.dirs.has(p), m = this.meta(p);
      const links = dir ? 2 + this.children(p).filter(c => this.dirs.has(c)).length : [...this.files.values()].filter(x => x === f).length;
      const size = dir ? 4096 : f.link !== undefined ? f.link.length : f.content.length;
      return [modeString(m.mode, dir ? 'd' : f.link !== undefined ? 'l' : '-'), String(links), m.owner, m.group, o.h ? humanSize(size) : String(size), name + (f && f.link !== undefined ? ` -> ${f.link}` : '')];
    });
    const w = i => Math.max(...rows.map(r => r[i].length));
    return join(rows.map(r => `${r[0]} ${r[1].padStart(w(1))} ${r[2].padEnd(w(2))} ${r[3].padEnd(w(3))} ${r[4].padStart(w(4))} Nov  1 10:00 ${r[5]}`));
  }
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
    const words = [];
    for (const part of token.parts) {
      if (part.sub !== undefined) {
        const r = this.run(part.sub), value = r.out.replace(/\n+$/, '');
        if (part.quoted) { text += value.replace(/[*?{}]/g, m => '\uE000' + m); continue; }
        const pieces = value.split(/\s+/).filter(Boolean);
        if (!pieces.length) continue;
        text += pieces[0]; for (const w of pieces.slice(1)) { words.push(text); text = w; }
        quotedAll = false; continue;
      }
      let t = part.text;
      if (part.expand) {
        t = t.replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, (_, name) => this.env[name] ?? '').replace(/\$([0-9?#@*!])/g, () => { throw new ShellUnsupported('special variable'); });
      }
      if (!part.quoted) { quotedAll = false; if (/[*?]/.test(t)) hasGlob = true; }
      text += part.quoted ? t.replace(/[*?{}]/g, m => '\uE000' + m) : t;
    }
    if (!text && !words.length && token.parts.every(p => p.sub !== undefined)) return [];
    return [...words, text].flatMap(braces).flatMap(word => {
      if (hasGlob && !quotedAll) { const matches = this.glob(word.replace(/\uE000/g, '')); if (matches.length) return matches; }
      return [word.replace(/\uE000/g, '')];
    });
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
    if (this.aliases[words[0]] !== undefined) words = [...this.aliases[words[0]].split(/\s+/).filter(Boolean), ...words.slice(1)];
    const [name, ...args] = words, fn = COMMANDS[name];
    if (!fn) throw new ShellUnsupported(`command ${name}`);
    return fn.call(this, args, stdin);
  }
}

// {a,b} and {1..3}, left to right, like bash. Quoted braces arrive marked with \uE000 and stay as they are.
function braces(word) {
  const m = word.match(/^(.*?)(?<!\uE000)\{([^{}]*)(?<!\uE000)\}(.*)$/s);
  if (!m) return [word];
  const [, pre, body, post] = m, range = body.match(/^(-?\d+)\.\.(-?\d+)$/) || body.match(/^([a-z])\.\.([a-z])$/i);
  let items;
  if (range) {
    const num = /\d/.test(range[1]), a = num ? +range[1] : range[1].charCodeAt(0), b = num ? +range[2] : range[2].charCodeAt(0), step = a <= b ? 1 : -1;
    items = []; for (let i = a; step > 0 ? i <= b : i >= b; i += step) items.push(num ? String(i) : String.fromCharCode(i));
  } else if (body.includes(',')) items = body.split(',');
  else return [word];
  return items.flatMap(i => braces(pre + i + post));
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
  return files.map(f => { const p = shell.abs(f); if (shell.dirs.has(p)) return { name: f, error: `${name}: ${f}: Is a directory\n` }; if (!shell.files.has(p) || !shell.resolve(p)) return { name: f, error: `${name}: ${f}: No such file or directory\n` }; return { name: f, text: shell.read(p) }; });
}
const isBinary = text => text.includes('\u0000');
function modeString(mode, type) {
  const bit = (b, ch) => (mode & b ? ch : '-');
  const x = (exec, special, on, off) => special ? (exec ? on : off) : exec ? 'x' : '-';
  return type + bit(0o400, 'r') + bit(0o200, 'w') + x(mode & 0o100, mode & 0o4000, 's', 'S') + bit(0o40, 'r') + bit(0o20, 'w') + x(mode & 0o10, mode & 0o2000, 's', 'S') + bit(0o4, 'r') + bit(0o2, 'w') + x(mode & 0o1, mode & 0o1000, 't', 'T');
}
function humanSize(n) { if (n < 1024) return String(n); const units = ['K', 'M', 'G']; let v = n / 1024, u = 0; while (v >= 1024 && u < 2) { v /= 1024; u++; } return v < 10 ? `${(Math.ceil(v * 10) / 10).toFixed(1)}${units[u]}` : `${Math.ceil(v)}${units[u]}`; }
// chmod's symbolic and octal modes, applied to an existing mode.
function applyMode(spec, mode, isDir, umask) {
  if (/^[0-7]{3,4}$/.test(spec)) return parseInt(spec, 8) | (isDir && spec.length === 3 ? mode & 0o6000 : 0);
  for (const clause of spec.split(',')) {
    const whole = clause.match(/^([ugoa]*)((?:[+=-][rwxXst]*)+)$/); if (!whole) throw new ShellUnsupported('chmod mode');
    for (const [, op, perms] of whole[2].matchAll(/([+=-])([rwxXst]*)/g)) mode = applyOne([null, whole[1], op, perms], mode, isDir, umask);
  }
  return mode;
}
function applyOne(m, mode, isDir, umask) {
  {
    const who = m[1] || 'a', bits = { r: 4, w: 2, x: 1 }, shift = { u: 6, g: 3, o: 0 };
    let mask = 0, clear = 0;
    for (const w of who === 'a' ? 'ugo' : who) {
      clear |= 0o7 << shift[w] | (w === 'u' ? 0o4000 : w === 'g' ? 0o2000 : 0o1000);
      for (const b of m[3]) { if (bits[b]) mask |= bits[b] << shift[w]; if (b === 'X' && (isDir || mode & 0o111)) mask |= 1 << shift[w]; if (b === 's' && w !== 'o') mask |= w === 'u' ? 0o4000 : 0o2000; if (b === 't') mask |= 0o1000; }
    }
    if (!m[1] && m[2] !== '=') mask &= ~umask;
    return m[2] === '+' ? mode | mask : m[2] === '-' ? mode & ~mask : (mode & ~clear) | mask;
  }
}
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
  let src = o.F ? pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : posixRegex(pattern, o.E);
  if (o.w) src = `(?<![A-Za-z0-9_])(?:${src})(?![A-Za-z0-9_])`;
  return new RegExp(src, o.i ? 'i' : '');
}
// BRE (grep, sed) or ERE (grep -E, sed -E, awk) to a JavaScript regular expression source.
function posixRegex(pattern, extended) {
  let src = extended ? pattern : pattern.replace(/\\([|(){}+?])|([|(){}+?])/g, (_, esc, plain) => esc || '\\' + plain);
  return src.replace(/\[\[:(alpha|digit|alnum|upper|lower|space|punct):\]\]/g, (_, c) => `[${{ alpha: 'A-Za-z', digit: '0-9', alnum: 'A-Za-z0-9', upper: 'A-Z', lower: 'a-z', space: '\\s', punct: '!-\\/:-@\\[-`{-~' }[c]}]`);
}

function parseSed(script, extended) {
  const cmds = []; let i = 0;
  const regexAt = () => { const d = script[i++]; let r = ''; while (i < script.length && script[i] !== d) { if (script[i] === '\\' && script[i + 1] === d) { r += d; i += 2; continue; } if (script[i] === '\\') { r += script[i] + script[i + 1]; i += 2; continue; } r += script[i++]; } i++; return r; };
  const addr = () => {
    if (/\d/.test(script[i])) { let n = ''; while (/\d/.test(script[i])) n += script[i++]; return { line: +n }; }
    if (script[i] === '$') { i++; return { last: true }; }
    if (script[i] === '/') return { re: new RegExp(posixRegex(regexAt(), extended)) };
    return null;
  };
  while (i < script.length) {
    while (/[\s;]/.test(script[i] || '')) i++;
    if (i >= script.length) break;
    const c = { a1: addr(), a2: null, not: false };
    if (c.a1 && script[i] === ',') { i++; c.a2 = addr(); }
    while (script[i] === ' ') i++;
    if (script[i] === '!') { c.not = true; i++; }
    c.cmd = script[i++];
    if (c.cmd === 's') {
      const d = script[i]; const re = regexAt(); i--; script[i] === d; const rep = (() => { i++; let r = ''; while (i < script.length && script[i] !== d) { if (script[i] === '\\' && script[i + 1] === d) { r += d; i += 2; continue; } r += script[i++]; } i++; return r; })();
      let flags = ''; while (/[gpI0-9]/.test(script[i] || '')) flags += script[i++];
      c.re = new RegExp(posixRegex(re, extended), (flags.includes('g') ? 'g' : '') + (flags.includes('I') ? 'i' : ''));
      c.nth = +(flags.match(/\d+/) || [0])[0]; c.print = flags.includes('p');
      c.rep = rep.replace(/\$/g, '$$$$').replace(/\\([1-9])/g, '$$$1').replace(/\\&/g, '\uE002').replace(/&/g, '$$&').replace(/\uE002/g, '&').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\(.)/g, '$1');
    } else if (c.cmd === 'y') {
      const from = regexAt(); i--; const to = regexAt(); c.map = Object.fromEntries([...from].map((ch, k) => [ch, to[k]]));
    } else if (!'pdq='.includes(c.cmd)) throw new ShellUnsupported(`sed command ${c.cmd}`);
    cmds.push(c);
  }
  return cmds;
}
function runSed(cmds, text, quiet) {
  const ls = lines(text), out = [], active = new Map();
  const hit = (a, line, n) => a.line !== undefined ? n === a.line : a.last ? n === ls.length : a.re.test(line);
  for (let n = 1; n <= ls.length; n++) {
    let line = ls[n - 1], deleted = false, quit = false;
    for (const c of cmds) {
      let on;
      if (!c.a1) on = true;
      else if (!c.a2) on = hit(c.a1, line, n);
      else if (active.get(c)) { on = true; if (c.a2.line !== undefined ? n >= c.a2.line : hit(c.a2, line, n)) active.set(c, false); }
      else if (hit(c.a1, line, n)) { on = true; if (!(c.a2.line !== undefined && c.a2.line <= n)) active.set(c, true); }
      else on = false;
      if (on === c.not) continue;
      if (c.cmd === 'd') { deleted = true; break; }
      if (c.cmd === 'p') out.push(line);
      if (c.cmd === '=') out.push(String(n));
      if (c.cmd === 'q') { quit = true; break; }
      if (c.cmd === 'y') line = [...line].map(ch => c.map[ch] ?? ch).join('');
      if (c.cmd === 's') {
        let k = 0, changed = false;
        const next = c.nth ? line.replace(new RegExp(c.re.source, 'g' + c.re.flags.replace('g', '')), (...m) => { k++; if (k !== c.nth) return m[0]; changed = true; return m[0].replace(new RegExp(c.re.source, c.re.flags.replace('g', '')), c.rep); })
          : line.replace(c.re, (...m) => { changed = true; return m[0].replace(new RegExp(c.re.source, c.re.flags.replace('g', '')), c.rep); });
        line = next; if (changed && c.print) out.push(line);
      }
    }
    if (!deleted && !quiet) out.push(line);
    if (quit) break;
  }
  return { out: join(out) };
}

// A small awk: patterns, BEGIN/END, fields, variables, arrays, if/else, for, printf and the common functions.
function runAwk(program, read, fs, vars) {
  const T = awkTokens(program); let p = 0;
  const peek = (v, k = 0) => T[p + k] && (v === undefined ? T[p + k] : T[p + k].v === v && T[p + k].t !== 'str');
  const eat = v => { if (!peek(v)) throw new ShellUnsupported(`awk syntax near ${T[p] ? T[p].v : 'end'}`); return T[p++]; };
  const skipNl = () => { while (peek('\n') || peek(';')) p++; };
  const binary = (next, ops) => () => { let l = next(); while (T[p] && T[p].t === 'op' && ops.includes(T[p].v)) { const op = T[p++].v; skipOptNl(); l = { k: 'bin', op, l, r: next() }; } return l; };
  const skipOptNl = () => { while (peek('\n')) p++; };
  let noGt = false;
  const primary = () => {
    const tk = T[p++]; if (!tk) throw new ShellUnsupported('awk syntax');
    if (tk.t === 'num') return { k: 'num', v: +tk.v };
    if (tk.t === 'str') return { k: 'str', v: tk.v };
    if (tk.t === 're') return { k: 're', v: new RegExp(tk.v) };
    if (tk.v === '$') return { k: 'field', e: postfix() };
    if (tk.v === '(') { const save = noGt; noGt = false; const e = expr(); noGt = save; eat(')'); return e; }
    if (tk.v === '-') return { k: 'neg', e: unary() };
    if (tk.v === '!') return { k: 'not', e: unary() };
    if (tk.v === '++' || tk.v === '--') return { k: 'preinc', op: tk.v, e: postfix() };
    if (tk.t === 'name') {
      if (peek('(') && AWK_FUNCS.includes(tk.v)) { p++; const a = []; if (!peek(')')) { a.push(expr()); while (peek(',')) { p++; a.push(expr()); } } eat(')'); return { k: 'call', f: tk.v, a }; }
      if (tk.v === 'length') return { k: 'call', f: 'length', a: [] };
      if (peek('[')) { p++; const i = expr(); eat(']'); return { k: 'idx', n: tk.v, i }; }
      return { k: 'var', n: tk.v };
    }
    throw new ShellUnsupported(`awk syntax near ${tk.v}`);
  };
  const postfix = () => { const e = primary(); if (peek('++') || peek('--')) return { k: 'postinc', op: T[p++].v, e }; return e; };
  const unary = () => postfix();
  const pow = binary(unary, ['^']);
  const mul = binary(pow, ['*', '/', '%']);
  const add = binary(mul, ['+', '-']);
  const startsOperand = () => { const tk = T[p]; return tk && (['num', 'str', 'name', 're'].includes(tk.t) || ['$', '(', '!', '++', '--'].includes(tk.v)) && !(tk.t === 'name' && ['in', 'else'].includes(tk.v)); };
  const concat = () => { let l = add(); while (startsOperand()) l = { k: 'cat', l, r: add() }; return l; };
  const cmp = () => { let l = concat(); while (T[p] && T[p].t === 'op' && ['<', '<=', '>', '>=', '==', '!=', '~', '!~'].includes(T[p].v) && !(noGt && T[p].v === '>')) { const op = T[p++].v; l = { k: 'bin', op, l, r: concat() }; } return l; };
  const inop = () => { let l = cmp(); if (peek('in')) { p++; return { k: 'in', key: l, n: T[p++].v }; } return l; };
  const and = binary(inop, ['&&']);
  const or = binary(and, ['||']);
  const ternary = () => { const c = or(); if (peek('?')) { p++; const a = ternary(); eat(':'); return { k: 'tern', c, a, b: ternary() }; } return c; };
  const expr = () => { const l = ternary(); if (T[p] && T[p].t === 'op' && ['=', '+=', '-=', '*=', '/=', '%='].includes(T[p].v) && ['var', 'field', 'idx'].includes(l.k)) { const op = T[p++].v; return { k: 'assign', op, l, r: expr() }; } return l; };
  const simple = () => {
    if (peek('print') || peek('printf')) {
      const f = T[p++].v, a = []; noGt = true;
      if (!(peek(';') || peek('\n') || peek('}') || peek('>'))) { const paren = peek('(') && awkParenList(T, p); if (paren) { p++; a.push(expr()); while (peek(',')) { p++; a.push(expr()); } eat(')'); } else { a.push(expr()); while (peek(',')) { p++; a.push(expr()); } } }
      noGt = false; if (peek('>') || peek('>>')) throw new ShellUnsupported('awk redirection');
      return { k: f, a };
    }
    if (peek('next')) { p++; return { k: 'next' }; }
    if (peek('delete')) { p++; const n = T[p++].v; if (peek('[')) { p++; const i = expr(); eat(']'); return { k: 'delete', n, i }; } return { k: 'delete', n }; }
    return { k: 'expr', e: expr() };
  };
  const stmt = () => {
    skipNl();
    if (peek('{')) return block();
    if (peek('if')) { p++; eat('('); const c = expr(); eat(')'); const a = stmt(); const save = p; skipNl(); if (peek('else')) { p++; return { k: 'if', c, a, b: stmt() }; } p = save; return { k: 'if', c, a }; }
    if (peek('while')) { p++; eat('('); const c = expr(); eat(')'); return { k: 'while', c, body: stmt() }; }
    if (peek('for')) {
      p++; eat('(');
      if (T[p + 1] && T[p + 1].v === 'in' && T[p + 3] && T[p + 3].v === ')') { const v = T[p].v, n = T[p + 2].v; p += 4; return { k: 'forin', v, n, body: stmt() }; }
      const init = peek(';') ? null : simple(); eat(';'); const c = peek(';') ? null : expr(); eat(';'); const inc = peek(')') ? null : simple(); eat(')');
      return { k: 'for', init, c, inc, body: stmt() };
    }
    const s = simple(); if (peek(';')) p++; return s;
  };
  const block = () => { eat('{'); const body = []; skipNl(); while (!peek('}')) { body.push(stmt()); skipNl(); } eat('}'); return { k: 'block', body }; };
  const items = [];
  skipNl();
  while (p < T.length) {
    if (peek('BEGIN')) { p++; skipOptNl(); items.push({ when: 'BEGIN', body: block() }); }
    else if (peek('END')) { p++; skipOptNl(); items.push({ when: 'END', body: block() }); }
    else { const pat = peek('{') ? null : expr(); items.push({ when: 'main', pat, body: peek('{') ? block() : { k: 'block', body: [{ k: 'print', a: [] }] } }); }
    skipNl();
  }
  const V = { NR: 0, NF: 0, FS: fs ?? ' ', OFS: ' ', ORS: '\n', ...Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, strnum(v)])) }, A = {};
  let fields = [], line = '', out = '';
  const split = l => { const f = V.FS === ' ' ? l.trim().split(/[ \t]+/).filter(Boolean) : V.FS.length === 1 ? l.split(V.FS) : l.split(new RegExp(V.FS)); return l === '' ? [] : f; };
  const setLine = l => { line = l; fields = split(l); V.NF = fields.length; };
  const getField = i => i === 0 ? strnum(line) : strnum(fields[i - 1] ?? '');
  const num = v => typeof v === 'number' ? v : v && typeof v === 'object' ? v.n : (parseFloat(String(v ?? '').match(/^\s*[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/i)?.[0]) || 0);
  const str = v => typeof v === 'number' ? awkNum(v) : v && typeof v === 'object' ? v.s : String(v ?? '');
  const isNum = v => typeof v === 'number' || (v && typeof v === 'object');
  const truth = v => isNum(v) ? num(v) !== 0 : str(v) !== '';
  const lval = (e, val) => { if (e.k === 'var') V[e.n] = val; else if (e.k === 'idx') (A[e.n] ||= {})[str(ev(e.i))] = val; else { const i = num(ev(e.e)); if (i === 0) setLine(str(val)); else { while (fields.length < i) fields.push(''); fields[i - 1] = str(val); V.NF = fields.length; line = fields.join(V.OFS); } } };
  const ev = e => {
    switch (e.k) {
      case 'num': return e.v; case 'str': return e.v; case 're': return e.v.test(line) ? 1 : 0;
      case 'field': return getField(num(ev(e.e)));
      case 'var': return e.n === 'NF' ? V.NF : V[e.n] ?? '';
      case 'idx': return (A[e.n] || {})[str(ev(e.i))] ?? '';
      case 'in': return str(ev(e.key)) in (A[e.n] || {}) ? 1 : 0;
      case 'neg': return -num(ev(e.e)); case 'not': return truth(ev(e.e)) ? 0 : 1;
      case 'cat': return str(ev(e.l)) + str(ev(e.r));
      case 'tern': return truth(ev(e.c)) ? ev(e.a) : ev(e.b);
      case 'preinc': case 'postinc': { const old = num(ev(e.e)), nv = old + (e.op === '++' ? 1 : -1); lval(e.e, nv); return e.k === 'preinc' ? nv : old; }
      case 'assign': { let v = ev(e.r); if (e.op !== '=') { const a = num(ev(e.l)), b = num(v); v = { '+=': a + b, '-=': a - b, '*=': a * b, '/=': a / b, '%=': a % b }[e.op]; } lval(e.l, v); return v; }
      case 'call': return awkCall(e.f, e.a.map(ev), { str, num, line: () => line, a: e.a, A });
      case 'bin': {
        if (e.op === '&&') return truth(ev(e.l)) && truth(ev(e.r)) ? 1 : 0;
        if (e.op === '||') return truth(ev(e.l)) || truth(ev(e.r)) ? 1 : 0;
        const l = ev(e.l);
        if (e.op === '~' || e.op === '!~') { const re = e.r.k === 're' ? e.r.v : new RegExp(str(ev(e.r))); return re.test(str(l)) === (e.op === '~') ? 1 : 0; }
        const r = ev(e.r);
        if (['+', '-', '*', '/', '%', '^'].includes(e.op)) { const a = num(l), b = num(r); return { '+': a + b, '-': a - b, '*': a * b, '/': a / b, '%': a % b, '^': a ** b }[e.op]; }
        const numeric = isNum(l) && isNum(r), a = numeric ? num(l) : str(l), b = numeric ? num(r) : str(r);
        return { '<': a < b, '<=': a <= b, '>': a > b, '>=': a >= b, '==': a === b, '!=': a !== b }[e.op] ? 1 : 0;
      }
    }
    throw new ShellUnsupported('awk expression');
  };
  class Next {}
  const exec = s => {
    switch (s.k) {
      case 'block': for (const x of s.body) exec(x); return;
      case 'print': out += (s.a.length ? s.a.map(x => { const v = ev(x); return typeof v === 'number' ? awkNum(v, V.OFMT) : str(v); }).join(str(V.OFS)) : line) + str(V.ORS); return;
      case 'printf': { const [f, ...rest] = s.a.map(ev); out += awkFormat(str(f), rest, str, num); return; }
      case 'expr': ev(s.e); return;
      case 'if': if (truth(ev(s.c))) exec(s.a); else if (s.b) exec(s.b); return;
      case 'while': { let g = 0; while (truth(ev(s.c))) { exec(s.body); if (++g > 100000) throw new ShellUnsupported('awk loop'); } return; }
      case 'for': { let g = 0; if (s.init) exec(s.init); while (!s.c || truth(ev(s.c))) { exec(s.body); if (s.inc) exec(s.inc); if (++g > 100000) throw new ShellUnsupported('awk loop'); } return; }
      case 'forin': for (const k of Object.keys(A[s.n] || {})) { V[s.v] = strnum(k); exec(s.body); } return;
      case 'next': throw new Next();
      case 'delete': if (s.i) delete (A[s.n] || {})[str(ev(s.i))]; else A[s.n] = {}; return;
    }
  };
  for (const it of items.filter(i => i.when === 'BEGIN')) exec(it.body);
  if (items.some(i => i.when !== 'BEGIN')) for (const l of lines(read())) {
    V.NR++; setLine(l);
    try { for (const it of items.filter(i => i.when === 'main')) if (!it.pat || truth(ev(it.pat))) exec(it.body); } catch (e) { if (!(e instanceof Next)) throw e; }
  }
  for (const it of items.filter(i => i.when === 'END')) exec(it.body);
  return out;
}
const AWK_FUNCS = ['length', 'substr', 'index', 'toupper', 'tolower', 'int', 'split', 'sprintf', 'sub', 'gsub'];
// Field values that look like numbers compare as numbers, like awk's "strnum".
function strnum(s) { s = String(s); return /^\s*[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?\s*$/i.test(s) ? { s, n: parseFloat(s) } : s; }
function awkNum(n) { return Number.isInteger(n) ? String(n) : String(+n.toPrecision(6)); }
function awkParenList(T, p) { let depth = 0; for (let i = p; i < T.length; i++) { if (T[i].v === '(') depth++; else if (T[i].v === ')') { depth--; if (!depth) return !T[i + 1] || [';', '\n', '}'].includes(T[i + 1].v); } } return false; }
function awkCall(f, args, h) {
  const { str, num } = h;
  switch (f) {
    case 'length': return args.length ? str(args[0]).length : h.line().length;
    case 'substr': { const s = str(args[0]), start = Math.round(num(args[1])); const from = Math.max(start, 1), end = args.length > 2 ? start + Math.round(num(args[2])) : Infinity; return s.slice(from - 1, Math.max(from - 1, end - 1)); }
    case 'index': return str(args[0]).indexOf(str(args[1])) + 1;
    case 'toupper': return str(args[0]).toUpperCase(); case 'tolower': return str(args[0]).toLowerCase();
    case 'int': return Math.trunc(num(args[0]));
    case 'sprintf': return awkFormat(str(args[0]), args.slice(1), str, num);
    case 'split': { const parts = str(args[0]).split(args.length > 2 ? str(args[2]) : /\s+/); const n = h.a[1].n; h.A[n] = Object.fromEntries(parts.map((v, i) => [i + 1, strnum(v)])); return parts.length; }
    default: throw new ShellUnsupported(`awk function ${f}`);
  }
}
function awkFormat(fmt, args, str, num) {
  let i = 0;
  return fmt.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/%([-0 ]*)(\d*)(?:\.(\d+))?([sdifcxeg%])/g, (_, flags, w, prec, c) => {
    if (c === '%') return '%';
    const v = args[i++]; let s;
    if (c === 's') s = prec !== undefined ? str(v).slice(0, +prec) : str(v);
    else if (c === 'd' || c === 'i') s = String(Math.trunc(num(v)));
    else if (c === 'f') s = num(v).toFixed(prec !== undefined ? +prec : 6);
    else if (c === 'c') s = typeof v === 'number' ? String.fromCharCode(v) : str(v)[0] || '';
    else if (c === 'x') s = Math.trunc(num(v)).toString(16);
    else s = String(+num(v).toPrecision(prec !== undefined ? +prec || 1 : 6));
    if (w && s.length < +w) s = flags.includes('-') ? s.padEnd(+w) : flags.includes('0') && c !== 's' ? s.padStart(+w, '0') : s.padStart(+w);
    return s;
  });
}
function awkTokens(src) {
  const T = []; let i = 0;
  const operandEnd = () => { const l = T[T.length - 1]; return l && (['num', 'str', 'name', 're'].includes(l.t) && !['print', 'printf', 'return', 'in'].includes(l.v) || [')', ']', '$', '++', '--'].includes(l.v) && l.v !== '$'); };
  while (i < src.length) {
    const c = src[i];
    if (c === '\\' && src[i + 1] === '\n') { i += 2; continue; }
    if (c === ' ' || c === '\t') { i++; continue; }
    if (c === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '\n') { T.push({ t: 'op', v: '\n' }); i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) { const m = src.slice(i).match(/^(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/i); if (m) { T.push({ t: 'num', v: m[0] }); i += m[0].length; continue; } }
    if (c === '"') { let s = ''; i++; while (i < src.length && src[i] !== '"') { if (src[i] === '\\') { const n = src[++i]; s += n === 'n' ? '\n' : n === 't' ? '\t' : n; i++; continue; } s += src[i++]; } i++; T.push({ t: 'str', v: s }); continue; }
    if (c === '/' && !operandEnd()) { let r = ''; i++; while (i < src.length && src[i] !== '/') { if (src[i] === '\\') { r += src[i] + src[i + 1]; i += 2; continue; } r += src[i++]; } i++; T.push({ t: 're', v: posixRegex(r, true) }); continue; }
    if (/[A-Za-z_]/.test(c)) { const m = src.slice(i).match(/^[A-Za-z_]\w*/)[0]; T.push({ t: 'name', v: m }); i += m.length; continue; }
    const op = ['+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '&&', '||', '++', '--', '!~', '>>'].find(o => src.startsWith(o, i)) || c;
    T.push({ t: 'op', v: op }); i += op.length;
  }
  return T;
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
    const [o, paths] = opts(args, 'alhrt1Rd'); if (o.t || o.R) throw new ShellUnsupported('ls option');
    const targets = (paths.length ? paths : ['.']).slice().sort((x, y) => (o.d ? 0 : (this.dirs.has(this.abs(x)) - this.dirs.has(this.abs(y)))) || cmpC(x, y));
    let out = '', err = '', sections = 0;
    const files = targets.filter(t => this.files.has(this.abs(t)) || (o.d && this.dirs.has(this.abs(t))));
    if (files.length) out += o.l ? this.longList(files.map(t => [t, this.abs(t)]), o) : join(files);
    for (const t of targets) {
      const p = this.abs(t);
      if (files.includes(t)) continue;
      if (!this.dirs.has(p)) { err += `ls: cannot access '${t}': No such file or directory\n`; continue; }
      let names = this.children(p).map(c => c.slice(c.lastIndexOf('/') + 1)).filter(n => o.a || !n.startsWith('.'));
      if (o.a) names.push('.', '..');
      names.sort(cmpC); if (o.r) names.reverse();
      if (targets.length > 1) out += `${sections++ || out ? '\n' : ''}${t}:\n`;
      if (!o.l) { out += join(names); continue; }
      const entries = names.map(n => [n, n === '.' ? p : n === '..' ? this.parent(p) : (p === '/' ? '' : p) + '/' + n]);
      const total = entries.reduce((s, [, q]) => s + this.blocks(q), 0);
      out += `total ${o.h && total ? humanSize(total * 1024) : total}\n` + this.longList(entries, o);
    }
    return { out, err, code: err ? 2 : 0 };
  },
  grep(args, stdin) {
    const [o, rest] = opts(args, 'ivnclwEFrsho', 'eAB');
    const pattern = o.e ?? rest.shift();
    if (pattern === undefined) throw new ShellError('usage: grep [OPTION]... PATTERNS [FILE]...', 2);
    if (o.A || o.B || o.h) throw new ShellUnsupported('grep option');
    const re = grepRegex(pattern, o);
    // -r walks folders in sorted order; real grep uses disk order, so lessons sort or search one file.
    const walk = (p, label) => this.dirs.has(p) ? this.order.filter(f => f.startsWith(p === '/' ? '/' : p + '/') && this.files.has(f)).sort(cmpC).map(f => ({ name: label + f.slice(p.length + (p === '/' ? 0 : 1)), text: this.read(f) })) : this.files.has(p) ? [{ name: label.replace(/\/$/, ''), text: this.read(p) }] : [{ name: label, error: `grep: ${label}: No such file or directory\n` }];
    const sources = o.r ? (rest.length ? rest.flatMap(r => walk(this.abs(r), r.replace(/\/?$/, '/'))) : walk(this.cwd, '')) : inputs(this, rest, stdin, 'grep');
    const many = sources.length > 1 || (o.r && !(rest.length === 1 && this.files.has(this.abs(rest[0]))));
    let out = '', err = '', matched = false;
    for (const src of sources) {
      if (src.error) { if (!o.s) err += src.error; continue; }
      const hits = []; lines(src.text).forEach((l, i) => { if (re.test(l) !== !!o.v) hits.push([i + 1, l]); });
      if (hits.length) matched = true;
      const label = src.name === '-' ? '(standard input)' : src.name;
      if (o.c) { out += (many ? `${label}:` : '') + hits.length + '\n'; continue; }
      if (o.l) { if (hits.length) out += label + '\n'; continue; }
      if (hits.length && isBinary(src.text)) { err += `grep: ${label}: binary file matches\n`; continue; }
      const g = new RegExp(re.source, re.flags + 'g');
      for (const [n, l] of hits) {
        if (o.o && !o.v) { for (const m of l.match(g) || []) if (m) out += (many ? `${label}:` : '') + (o.n ? `${n}:` : '') + m + '\n'; continue; }
        out += (many ? `${label}:` : '') + (o.n ? `${n}:` : '') + l + '\n';
      }
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
    const [o, rest] = opts(args, '', 'Fv'); const program = rest.shift();
    if (program === undefined) throw new ShellError('usage: awk [-F fs] [-v var=value] program [file ...]', 2);
    const vars = {}; if (o.v !== undefined) { const eq = o.v.indexOf('='); vars[o.v.slice(0, eq)] = o.v.slice(eq + 1); }
    let err = '';
    const read = () => { const sources = inputs(this, rest, stdin, 'awk'), bad = sources.find(s => s.error); if (bad) { err = bad.error.replace(/^awk: (.*): No such file or directory\n$/, 'awk: cannot open "$1" (No such file or directory)\n'); return ''; } return sources.map(s => s.text).join(''); };
    const out = runAwk(program, read, o.F, vars);
    return { out, err, code: err ? 2 : 0 };
  },
  sed(args, stdin) {
    const o = {}, scripts = [], files = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-n') o.n = true; else if (a === '-E' || a === '-r') o.E = true; else if (a === '-e') scripts.push(args[++i]);
      else if (a.startsWith('-i')) o.i = a.slice(2) || ''; else if (/^-[nE]+$/.test(a)) { if (a.includes('n')) o.n = true; if (a.includes('E')) o.E = true; }
      else if (a.startsWith('-') && a !== '-') throw new ShellUnsupported(`sed option ${a}`); else files.push(a);
    }
    if (!scripts.length) { if (!files.length) throw new ShellError('usage: sed [OPTION]... {script} [input-file]...', 1); scripts.push(files.shift()); }
    const cmds = parseSed(scripts.join('\n'), o.E);
    if (o.i !== undefined) {
      if (!files.length) throw new ShellError('no input files', 1);
      for (const f of files) { const p = this.abs(f); const text = this.read(p); if (o.i) this.write(p + o.i, text); this.write(p, runSed(cmds, text, o.n).out); }
      return { out: '' };
    }
    const sources = inputs(this, files, stdin, 'sed'); let err = '';
    for (const s of sources) if (s.error) err += s.error.replace(/^sed: (.*): No such/, "sed: can't read $1: No such");
    const r = runSed(cmds, sources.filter(s => !s.error).map(s => s.text).join(''), o.n);
    return { out: r.out, err, code: err ? 2 : 0 };
  },
  find(args) {
    const start = []; let i = 0;
    while (i < args.length && !args[i].startsWith('-') && args[i] !== '!' && args[i] !== '(') start.push(args[i++]);
    const tests = []; let maxdepth = Infinity, mindepth = 0, negate = false, exec = null, del = false;
    for (; i < args.length; i++) {
      const a = args[i];
      if (a === '!' || a === '-not') { negate = true; continue; }
      const push = fn => { const n = negate; tests.push(n ? (p, info) => !fn(p, info) : fn); negate = false; };
      if (a === '-maxdepth') maxdepth = +args[++i];
      else if (a === '-mindepth') mindepth = +args[++i];
      else if (a === '-type') { const t = args[++i]; push((p, info) => t === 'd' ? info.dir : t === 'l' ? info.link : t === 'f' ? !info.dir && !info.link : false); }
      else if (a === '-perm') { const s = args[++i], m = s.match(/^([-/]?)([0-7]{3,4})$/); if (!m) throw new ShellUnsupported('find -perm'); const want = parseInt(m[2], 8); push((p, info) => m[1] === '-' ? (info.mode & want) === want : m[1] === '/' ? (info.mode & want) !== 0 : (info.mode & 0o7777) === want); }
      else if (a === '-empty') push((p, info) => info.dir ? !this.children(p).length : info.size === 0);
      else if (a === '-exec') { const cmd = []; while (++i < args.length && args[i] !== ';' && args[i] !== '+') cmd.push(args[i]); if (i >= args.length) throw new ShellError("missing argument to `-exec'", 1); exec = { cmd, batch: args[i] === '+' }; }
      else if (a === '-delete') del = true;
      else if (a === '-name' || a === '-iname') { const g = args[++i], flags = a === '-iname' ? 'i' : ''; const re = new RegExp('^' + g.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', flags); push(p => re.test(p.slice(p.lastIndexOf('/') + 1))); }
      else if (a === '-size') { const s = args[++i], m = s.match(/^([+-]?)(\d+)([ckMG]?)$/); if (!m) throw new ShellUnsupported('find -size'); const unit = { c: 1, k: 1024, M: 1048576, G: 1073741824, '': 512 }[m[3]]; push((p, info) => { if (info.dir) return false; const size = m[3] === '' || m[3] === 'k' || m[3] === 'M' || m[3] === 'G' ? Math.ceil(info.size / unit) : info.size; return m[1] === '+' ? size > +m[2] : m[1] === '-' ? size < +m[2] : size === +m[2]; }); }
      else if (a === '-executable') push((p, info) => info.dir || (info.mode & 0o111) !== 0);
      else if (a === '-readable') push(p => !this.locked.has(p));
      else if (a === '-print') continue;
      else if (a === '-user') { const u = args[++i]; push((p, info) => info.owner === u); }
      else if (a === '-group') { const g = args[++i]; push((p, info) => info.group === g); }
      else throw new ShellUnsupported(`find ${a}`);
    }
    let out = '', err = ''; const found = [];
    for (const s of start.length ? start : ['.']) {
      const root = this.abs(s);
      if (!this.exists(root)) { err += `find: '${s}': No such file or directory\n`; continue; }
      const walk = (p, depth, shown) => {
        const f = this.files.get(p), m = this.meta(p), link = f?.link !== undefined;
        const info = { dir: this.dirs.has(p), link, size: f && !link ? f.content.length : 0, mode: m.mode, owner: m.owner, group: m.group };
        if (depth >= mindepth && tests.every(t => t(p, info))) { if (exec || del) found.push([p, shown]); else out += shown + '\n'; }
        if (info.dir && this.locked.has(p)) { err += `find: '${shown}': Permission denied\n`; return; }
        if (info.dir && depth < maxdepth) for (const c of this.children(p)) walk(c, depth + 1, (shown === '/' ? '' : shown) + '/' + c.slice(c.lastIndexOf('/') + 1));
      };
      walk(root, 0, s.replace(/\/+$/, '') || '/');
    }
    if (del) for (const [p] of found.reverse()) { if (this.dirs.has(p)) { if (!this.children(p).length) this.dirs.delete(p); } else this.files.delete(p); }
    if (exec) {
      const call = words => { const r = this.exec(words, ''); out += r.out; err += r.err || ''; };
      if (exec.batch) call(exec.cmd.flatMap(w => w === '{}' ? found.map(x => x[1]) : [w]));
      else for (const [, shown] of found) call(exec.cmd.map(w => w.split('{}').join(shown)));
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
    const [o, rest] = opts(args, 'Rv'); const [mode, ...files] = rest;
    if (!mode || !files.length) throw new ShellError('missing operand');
    const targets = files.flatMap(f => { const p = this.abs(f); return o.R && this.dirs.has(p) ? [[f, p], ...this.order.filter(q => q.startsWith(p + '/') && this.exists(q)).map(q => [q, q])] : [[f, p]]; });
    for (const [f, p] of targets) {
      const m = this.meta(this.files.has(p) ? this.resolve(p) ?? p : p);
      if (!m) throw new ShellError(`cannot access '${f}': No such file or directory`);
      if (!this.asRoot && m.owner !== this.env.USER) throw new ShellError(`changing permissions of '${f}': Operation not permitted`);
      m.mode = applyMode(mode, m.mode, this.dirs.has(p), this.umaskValue);
    }
    return { out: '' };
  },
  chown(args) { return changeOwner.call(this, args, 'chown'); },
  chgrp(args) { return changeOwner.call(this, args, 'chgrp'); },
  umask(args) {
    if (!args.length) return { out: this.umaskValue.toString(8).padStart(4, '0') + '\n' };
    if (args[0] === '-S') { const k = 0o777 & ~this.umaskValue, part = s => (k >> s & 4 ? 'r' : '') + (k >> s & 2 ? 'w' : '') + (k >> s & 1 ? 'x' : ''); return { out: `u=${part(6)},g=${part(3)},o=${part(0)}\n` }; }
    if (!/^[0-7]{1,4}$/.test(args[0])) throw new ShellUnsupported('umask mode');
    this.umaskValue = parseInt(args[0], 8); return { out: '' };
  },
  sudo(args) {
    if (!args.length) throw new ShellError('usage: sudo command', 1);
    const was = this.asRoot, user = this.env.USER; this.asRoot = true; this.env.USER = 'root';
    try { return this.exec(args, ''); } finally { this.asRoot = was; this.env.USER = user; }
  },
  ln(args) {
    const [o, paths] = opts(args, 'sf'); if (paths.length !== 2) throw new ShellUnsupported('ln form');
    let [target, link] = paths; let lp = this.abs(link);
    if (this.dirs.has(lp)) lp = `${lp}/${target.slice(target.lastIndexOf('/') + 1)}`;
    if (o.f && this.files.has(lp)) this.files.delete(lp);
    if (o.s) { this.symlink(lp, target); return { out: '' }; }
    const tp = this.abs(target);
    if (this.dirs.has(tp)) throw new ShellError(`${target}: hard link not allowed for directory`);
    if (!this.files.has(tp)) throw new ShellError(`failed to access '${target}': No such file or directory`);
    if (this.exists(lp)) throw new ShellError(`failed to create hard link '${link}': File exists`);
    this.order.push(lp); this.files.set(lp, this.files.get(tp));
    return { out: '' };
  },
  readlink(args) {
    const [o, paths] = opts(args, 'f'); let out = '', code = 0;
    for (const f of paths) { const p = this.abs(f), file = this.files.get(p); if (o.f) { const r = this.resolve(p); if (r) out += r + '\n'; else if (this.dirs.has(p)) out += p + '\n'; else code = 1; } else if (file?.link !== undefined) out += file.link + '\n'; else code = 1; }
    return { out, code };
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
  tee(args, stdin) {
    const [o, files] = opts(args, 'a');
    for (const f of files) { const p = this.abs(f); this.write(p, (o.a && this.files.has(p) ? this.read(p) : '') + stdin); }
    return { out: stdin };
  },
  xargs(args, stdin) {
    const o = {}; let k = 0;
    for (; k < args.length && args[k].startsWith('-'); k++) { if (args[k] === '-n' || args[k] === '-I') o[args[k][1]] = args[++k]; else if (/^-n\d+$/.test(args[k])) o.n = args[k].slice(2); else throw new ShellUnsupported(`xargs option ${args[k]}`); }
    const rest = args.slice(k);
    const items = (stdin.match(/\S+/g) || []), cmd = rest.length ? rest : ['echo'];
    let out = '', err = '', code = 0;
    const call = words => { const r = this.exec(words, ''); out += r.out; err += r.err || ''; if (r.code) code = 123; };
    try {
      if (o.I !== undefined) for (const line of lines(stdin)) call(cmd.map(w => w.split(o.I).join(line)));
      else if (o.n) for (let i = 0; i < items.length; i += +o.n) call([...cmd, ...items.slice(i, i + +o.n)]);
      else if (items.length || cmd[0] === 'echo') call([...cmd, ...items]);
    } catch (e) { if (!(e instanceof ShellError)) throw e; err += `${cmd[0]}: ${e.message}\n`; code = 123; }
    return { out, err, code };
  },
  nl(args, stdin) {
    const [o, files] = opts(args, '', 'b'); const src = inputs(this, files, stdin, 'nl')[0]; if (src.error) return { out: '', err: src.error, code: 1 };
    let n = 0; return { out: join(lines(src.text).map(l => (l || o.b === 'a') ? `${String(++n).padStart(6)}\t${l}` : '')) };
  },
  paste(args, stdin) {
    const [o, files] = opts(args, 's', 'd'); const d = o.d ?? '\t';
    const srcs = inputs(this, files, stdin, 'paste'); const bad = srcs.find(s => s.error); if (bad) return { out: '', err: bad.error, code: 1 };
    const cols = srcs.map(s => lines(s.text));
    if (o.s) return { out: join(cols.map(c => c.join(d))) };
    const rows = Math.max(...cols.map(c => c.length)); const out = [];
    for (let i = 0; i < rows; i++) out.push(cols.map(c => c[i] ?? '').join(d));
    return { out: join(out) };
  },
  touch(args) {
    if (!args.length) throw new ShellError('missing file operand');
    for (const f of args) { const p = this.abs(f); if (!this.exists(p)) { if (!this.dirs.has(this.parent(p))) throw new ShellError(`cannot touch '${f}': No such file or directory`); this.write(p, ''); } }
    return { out: '' };
  },
  rmdir(args) {
    const [o, dirs] = opts(args, 'p'); if (o.p) throw new ShellUnsupported('rmdir -p');
    if (!dirs.length) throw new ShellError('missing operand');
    for (const d of dirs) {
      const p = this.abs(d);
      if (this.files.has(p)) throw new ShellError(`failed to remove '${d}': Not a directory`);
      if (!this.dirs.has(p)) throw new ShellError(`failed to remove '${d}': No such file or directory`);
      if (this.children(p).length) throw new ShellError(`failed to remove '${d}': Directory not empty`);
      this.dirs.delete(p);
    }
    return { out: '' };
  },
  alias(args) {
    if (!args.length) return { out: join(Object.keys(this.aliases).sort(cmpC).map(n => `alias ${n}='${this.aliases[n]}'`)) };
    let out = '', err = '';
    for (const a of args) {
      const eq = a.indexOf('=');
      if (eq > 0) this.aliases[a.slice(0, eq)] = a.slice(eq + 1);
      else if (this.aliases[a] !== undefined) out += `alias ${a}='${this.aliases[a]}'\n`;
      else err += `alias: ${a}: not found\n`;
    }
    return { out, err, code: err ? 1 : 0 };
  },
  unalias(args) { for (const a of args) { if (this.aliases[a] === undefined) throw new ShellError(`${a}: not found`); delete this.aliases[a]; } return { out: '' }; },
  type(args) {
    let out = '', err = '';
    for (const n of args) {
      if (this.aliases[n] !== undefined) out += `${n} is aliased to \`${this.aliases[n]}'\n`;
      else if (BUILTINS.includes(n)) out += `${n} is a shell builtin\n`;
      else if (COMMANDS[n]) out += `${n} is /usr/bin/${n}\n`;
      else err += `type: ${n}: not found\n`;
    }
    return { out, err, code: err ? 1 : 0 };
  },
  which(args) {
    const found = args.filter(n => COMMANDS[n] && !BUILTIN_ONLY.includes(n));
    return { out: join(found.map(n => `/usr/bin/${n}`)), code: found.length === args.length ? 0 : 1 };
  },
  who() { return { out: join(this.who) }; },
  whoami() { return { out: this.env.USER + '\n' }; },
  history() { return { out: join(this.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`)) }; },
  ps(args) { const [o] = opts(args, 'ef'); const rows = o.f ? this.processes.full : this.processes.short; return { out: join(o.e ? rows : [rows[0], ...rows.slice(1).filter(r => /pts\/0/.test(r))]) }; },
  getent(args) { if (args[0] !== 'passwd') throw new ShellUnsupported('getent'); return { out: this.read('/etc/passwd') }; },
};
// What bash's type reports as builtins, and which of those have no /usr/bin twin for which to find.
const BUILTINS = ['alias', 'cd', 'echo', 'history', 'pwd', 'type', 'unalias'];
const BUILTIN_ONLY = ['alias', 'cd', 'history', 'type', 'unalias'];
function changeOwner(args, name) {
  const [o, rest] = opts(args, 'R'); const [spec, ...files] = rest;
  if (!spec || !files.length) throw new ShellError('missing operand');
  const [owner, group] = name === 'chgrp' ? [undefined, spec] : spec.split(':');
  for (const f of files) {
    const p = this.abs(f), m = this.meta(p);
    if (!m) throw new ShellError(`cannot access '${f}': No such file or directory`);
    if (!this.asRoot) throw new ShellError(`changing ${name === 'chgrp' ? 'group' : 'ownership'} of '${f}': Operation not permitted`);
    const targets = o.R && this.dirs.has(p) ? [p, ...this.order.filter(q => q.startsWith(p + '/') && this.exists(q))] : [p];
    for (const q of targets) { const mq = this.meta(q); if (owner) mq.owner = owner; if (group !== undefined) mq.group = group || mq.group; if (this.files.has(q) && mq.mode & 0o111) mq.mode &= ~0o6000; }
  }
  return { out: '' };
}
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
