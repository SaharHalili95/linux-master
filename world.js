// The eleven regions of the course (see DESIGN.md): each part of the path has its own colors, landscape and moon.
const REGIONS = {
  1: { scene: 'ridges', ground: '#0b3a40', panel: '#0f4a52', far: '#12545c', near: '#0e4750', accent: '#ffb347', name: T('השער', 'The Gateway'), blurb: T('כאן הכול מתחיל. פקודה ראשונה, ואתם בפנים.', 'It all starts here. One command, and you are in.') },
  2: { scene: 'waves', ground: '#0b2f5c', panel: '#103c73', far: '#15487f', near: '#0f3b6c', accent: '#ff8a73', name: T('נהר הטקסט', 'River of Text'), blurb: T('בלינוקס הכול טקסט. מי שיודע לכוון אותו, שולט בנתונים.', 'In Linux everything is text. Direct it, and you rule the data.') },
  3: { scene: 'towers', ground: '#141a52', panel: '#1d2468', far: '#222b75', near: '#1a2160', accent: '#ffc53d', name: T('עיר הקבצים', 'City of Files'), blurb: T('כל קובץ שייך למישהו. כאן לוקחים שליטה.', 'Every file belongs to someone. Here you take control.') },
  4: { scene: 'citadel', ground: '#2a1257', panel: '#37196f', far: '#40207f', near: '#331a6b', accent: '#ff6ec7', name: T('מצודת התהליכים', 'Citadel of Processes'), blurb: T('מי רץ, מי עוצר ומי עולה ראשון. אתם מחליטים.', 'Who runs, who stops, who boots first. You decide.') },
  5: { scene: 'containers', ground: '#0a3b2c', panel: '#0e4b38', far: '#125a44', near: '#0f4c39', accent: '#c6f04f', name: T('נמל החבילות', 'Package Harbor'), blurb: T('תוכנה נכנסת לשרת דרך הנמל. כאן מנהלים את המשלוחים.', 'Software reaches the server through the harbor. Run the shipments.') },
  6: { scene: 'network', ground: '#06122e', panel: '#0c1c44', far: '#10254f', near: '#0b1b3f', accent: '#38e1ff', name: T('רשת האורות', 'Grid of Lights'), blurb: T('כל שרת הוא אור ברשת. כאן מחברים ביניהם.', 'Every server is a light on the grid. Connect them.') },
  7: { scene: 'factory', ground: '#3a1f10', panel: '#4b2a16', far: '#57321b', near: '#472814', accent: '#ff9a3d', name: T('מפעל הסקריפטים', 'The Script Works'), blurb: T('מה שעשיתם פעמיים, המכונה תעשה מעכשיו לבד.', 'What you did twice, the machine now does alone.') },
  8: { scene: 'wall', ground: '#470f16', panel: '#5a141c', far: '#6a1a23', near: '#551319', accent: '#ffb02e', name: T('חומת האש', 'The Firewall'), blurb: T('מאחורי החומה יש מי לשמור עליו. הגיע תורכם.', 'Behind the wall is someone to protect. Your turn.') },
  9: { scene: 'stacks', ground: '#3a1238', panel: '#4a1a47', far: '#572153', near: '#461a43', accent: '#ff9ec4', name: T('הארכיון', 'The Archive'), blurb: T('הידע שמבדיל בין מי שעבר למי שכמעט.', 'The knowledge between passing and almost.') },
  10: { scene: 'horizon', ground: '#06372f', panel: '#0a463d', far: '#0f5548', near: '#0c473d', accent: '#b79cff', name: T('גבולות חדשים', 'New Frontiers'), blurb: T('עוד הסמכות, עוד כלים, עוד עולמות לגלות.', 'More certifications, more tools, more worlds to explore.') },
  11: { scene: 'arena', ground: '#0a0a0f', panel: '#16161f', far: '#1e1e2a', near: '#15151e', accent: '#ffc53d', name: T('הזירה', 'The Arena'), blurb: T('בלי רמזים ועם שעון. כאן מגלים שאתם מוכנים.', 'No hints, a clock running. Here you find out you are ready.') },
};
const REGION_INK = '#f5f8ff', REGION_MUTE = '#d6e0f0', REGION_ON_ACCENT = '#0a0d1a';

// The hero's ranks, earned by XP.
const RANKS = [[0, T('טירון', 'Recruit')], [100, T('חוקר טרמינל', 'Terminal Explorer')], [300, T('צייד טקסט', 'Text Hunter')], [600, T('שומר הקבצים', 'File Keeper')], [1000, T('שומר ההרשאות', 'Keeper of Permissions')], [1500, T('מאלף תהליכים', 'Process Tamer')], [2200, T('רב־חובל חבילות', 'Package Captain')], [3000, T('נווט רשתות', 'Network Navigator')], [4000, T('מהנדס סקריפטים', 'Script Engineer')], [5200, T('מגן החומה', 'Wall Guardian')], [6500, T('אדריכל מערכות', 'Systems Architect')], [8000, T('מאסטר לינוקס', 'Linux Master')]];
function rankOf(xp) { let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++; return { level: i + 1, name: tr(RANKS[i][1]), from: RANKS[i][0], to: RANKS[i + 1]?.[0] ?? null }; }

// Each scene draws its far and near layers; the last shape fades into the region's ground.
const seeded = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const sceneBlocks = (rnd, y, min, max, fill, extra = () => '') => { let s = '', x = -6; while (x < 390) { const w = 34 + rnd() * 34, h = min + rnd() * (max - min); s += `<rect x="${x.toFixed(0)}" y="${(y - h).toFixed(0)}" width="${w.toFixed(0)}" height="${(h + 300 - y).toFixed(0)}" fill="${fill}"/>` + extra(x, y - h, w, h); x += w + 6; } return s; };
const jagged = (rnd, y, amp, fill) => { let d = `M0 ${y}`, x = 0; while (x < 390) { x += 40 + rnd() * 50; d += ` L${Math.min(x, 390).toFixed(0)} ${(y - rnd() * amp).toFixed(0)}`; } return `<path d="${d} V300 H0Z" fill="${fill}"/>`; };
const SCENES = {
  ridges: (r, c) => jagged(r, 190, 90, c.far) + jagged(r, 240, 70, c.near),
  waves: (r, c) => [[170, c.far], [210, c.near]].map(([y, fill]) => `<path d="M0 ${y} C60 ${y - 34} 120 ${y + 34} 195 ${y} S330 ${y - 34} 390 ${y} V300 H0Z" fill="${fill}"/>`).join('') + [150, 186].map(y => `<path d="M30 ${y} H110 M170 ${y + 12} H280 M320 ${y} H380" stroke="${c.accent}" stroke-opacity=".55" stroke-width="2"/>`).join(''),
  towers: (r, c) => sceneBlocks(r, 250, 50, 110, c.far, (x, y, w) => { let s = ''; for (let i = y + 14; i < 230; i += 22) if (r() > .45) s += `<rect x="${(x + w / 3).toFixed(0)}" y="${i.toFixed(0)}" width="9" height="5" fill="${c.accent}"/>`; return s; }) + sceneBlocks(r, 280, 20, 70, c.near),
  citadel: (r, c) => { let s = `<rect x="70" y="176" width="250" height="124" fill="${c.far}"/>`; for (let x = 70; x < 320; x += 36) s += `<rect x="${x}" y="156" width="20" height="24" fill="${c.far}"/>`; for (const x of [40, 310]) s += `<rect x="${x}" y="130" width="42" height="170" fill="${c.near}"/><rect x="${x + 16}" y="152" width="10" height="26" fill="${c.accent}"/>`; return s + `<rect x="170" y="226" width="50" height="74" fill="${c.near}"/>`; },
  containers: (r, c) => { let s = ''; for (let row = 0; row < 4; row++) for (let x = (row % 2) * 30 - 10; x < 390; x += 74) if (r() > .25 + row * .14) s += `<rect x="${x}" y="${250 - row * 36}" width="68" height="31" fill="${r() > .75 ? c.accent : r() > .5 ? c.far : c.near}"/>`; return s + `<rect y="280" width="390" height="20" fill="${c.near}"/>`; },
  network: (r, c) => { const p = Array.from({ length: 13 }, () => [20 + r() * 350, 90 + r() * 170]); let s = ''; p.forEach((a, i) => { for (let j = i + 1; j < p.length; j++) if (Math.hypot(a[0] - p[j][0], a[1] - p[j][1]) < 120) s += `<path d="M${a[0].toFixed(0)} ${a[1].toFixed(0)}L${p[j][0].toFixed(0)} ${p[j][1].toFixed(0)}" stroke="${c.accent}" stroke-opacity=".4"/>`; }); return s + p.map(a => `<circle cx="${a[0].toFixed(0)}" cy="${a[1].toFixed(0)}" r="4" fill="${c.accent}"/>`).join(''); },
  factory: (r, c) => { let s = ''; for (const x of [176, 232]) s += `<rect x="${x}" y="${70 + r() * 40}" width="24" height="230" fill="${c.far}"/>`; let d = 'M0 200'; for (let x = 0; x < 390; x += 65) d += ` L${x + 65} 150 V200`; return s + `<path d="${d} V300 H0Z" fill="${c.near}"/>`; },
  wall: (r, c) => { let s = ''; for (let row = 0; row < 6; row++) for (let x = row % 2 ? -22 : -2; x < 390; x += 46) s += `<rect x="${x}" y="${156 + row * 25}" width="42" height="21" fill="${r() > .8 ? c.near : c.far}"/>`; for (let x = 20; x < 390; x += 56) s += `<path d="M${x} 156 q10 -${20 + r() * 26} 20 0z" fill="${c.accent}"/>`; return s; },
  stacks: (r, c) => { let s = ''; for (let x = 10; x < 390; x += 74) { for (let y = 142; y < 290; y += 34) { let bx = x; while (bx < x + 60) { const w = 6 + r() * 8, h = 18 + r() * 12; s += `<rect x="${bx.toFixed(0)}" y="${(y + 30 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${r() > .8 ? c.accent : c.far}"/>`; bx += w + 2; } s += `<rect x="${x - 3}" y="${y + 30}" width="68" height="3" fill="${c.near}"/>`; } } return s; },
  horizon: (r, c) => [160, 188, 212].map((y, i) => `<path d="M0 ${y} C110 ${y - 56} 260 ${y + 46} 390 ${y - 16}" fill="none" stroke="${c.accent}" stroke-opacity="${.75 - i * .2}" stroke-width="${16 - i * 4}"/>`).join('') + jagged(r, 240, 40, c.far) + jagged(r, 270, 26, c.near),
  arena: (r, c) => [0, 1, 2, 3].map(i => `<path d="M${-30 + i * 24} 300 A${225 - i * 24} ${190 - i * 34} 0 0 1 ${420 - i * 24} 300Z" fill="${i % 2 ? c.near : c.far}"/>`).join('') + Array.from({ length: 9 }, (_, i) => `<rect x="${24 + i * 41}" y="${120 + (i % 2) * 12}" width="4" height="30" fill="${c.accent}"/>`).join(''),
};
const mixColor = (hex, to, amount) => '#' + [1, 3, 5].map(i => { const a = parseInt(hex.slice(i, i + 2), 16), b = parseInt(to.slice(i, i + 2), 16); return Math.round(a + (b - a) * amount).toString(16).padStart(2, '0'); }).join('');
// The signature of the world: a digital moon in the region's color, etched with circuits and carrying the $_ prompt.
function moonSvg(part, cx, cy, r, tag = '') {
  const c = REGIONS[part], rnd = seeded(part * 104729 + 7), id = `moon${part}${tag}`, deep = mixColor(c.accent, '#000000', 0.42), etch = mixColor(c.accent, '#000000', 0.24), lit = mixColor(c.accent, '#ffffff', 0.62);
  const stars = Array.from({ length: 16 }, () => `<circle cx="${(rnd() * 390).toFixed(0)}" cy="${(6 + rnd() * 130).toFixed(0)}" r="${(0.6 + rnd() * 1.1).toFixed(1)}" fill="#fff" opacity="${(0.35 + rnd() * 0.55).toFixed(2)}"/>`).join('');
  const craters = Array.from({ length: 7 }, () => { const a = rnd() * 6.28, d = (0.62 + rnd() * 0.32) * r, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, q = r * (0.06 + rnd() * 0.09); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${q.toFixed(1)}" fill="${deep}" opacity=".55"/><path d="M${(x - q * 0.8).toFixed(1)} ${(y + q * 0.45).toFixed(1)}A${q.toFixed(1)} ${q.toFixed(1)} 0 0 0 ${(x + q * 0.8).toFixed(1)} ${(y + q * 0.45).toFixed(1)}" fill="none" stroke="${lit}" stroke-width="1" opacity=".7"/>`; }).join('');
  const traces = [[-0.86, -0.3, -0.42, -0.3, -0.2, -0.56, 0.3, -0.56], [0.86, 0.2, 0.46, 0.2, 0.24, 0.46, -0.34, 0.46], [-0.7, 0.42, -0.5, 0.2, -0.5, -0.02], [0.66, -0.5, 0.5, -0.24, 0.72, -0.24]].map(t => { const pts = []; for (let i = 0; i < t.length; i += 2) pts.push(`${(cx + t[i] * r).toFixed(1)} ${(cy + t[i + 1] * r).toFixed(1)}`); const end = pts[pts.length - 1].split(' '); return `<path d="M${pts.join('L')}" fill="none" stroke="${etch}" stroke-width="1.6"/><circle cx="${end[0]}" cy="${end[1]}" r="2.6" fill="${etch}"/>`; }).join('');
  const o = r * 1.3;
  return `${stars}<defs><radialGradient id="${id}g" cx="36%" cy="30%" r="80%"><stop offset="0" stop-color="${lit}"/><stop offset=".52" stop-color="${c.accent}"/><stop offset="1" stop-color="${deep}"/></radialGradient><radialGradient id="${id}h"><stop offset=".55" stop-color="${c.accent}" stop-opacity=".42"/><stop offset="1" stop-color="${c.accent}" stop-opacity="0"/></radialGradient><clipPath id="${id}c"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
<circle cx="${cx}" cy="${cy}" r="${r * 1.85}" fill="url(#${id}h)"/>
<g transform="rotate(-20 ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${o}" ry="${o * 0.3}" fill="none" stroke="${lit}" stroke-opacity=".5" stroke-width="1.4"/></g>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}g)"/>
<g clip-path="url(#${id}c)">${craters}${traces}<text x="${cx}" y="${cy + r * 0.2}" text-anchor="middle" direction="ltr" font-family="JetBrains Mono, monospace" font-weight="700" font-size="${r * 0.72}" fill="${mixColor(c.accent, '#000000', 0.62)}">$_</text></g>
<g transform="rotate(-20 ${cx} ${cy})"><path d="M${cx - o} ${cy}A${o} ${o * 0.3} 0 0 0 ${cx + o} ${cy}" fill="none" stroke="${lit}" stroke-width="2"/><g transform="translate(${cx} ${cy}) scale(1 .3)"><g class="moon-orbit"><circle cx="${o}" r="6" fill="#fff"/><circle cx="${o}" r="11" fill="#fff" opacity=".25"/></g></g></g>`;
}
// The moon keeps its size on any width; the land stretches under it, anchored to the bottom edge, behind the rows.
function regionScene(part) {
  const c = REGIONS[part], rnd = seeded(part * 7919 + 13), moonX = LANG === 'he' ? 74 : 316;
  return `<svg class="stage-moon" width="390" height="300" viewBox="0 0 390 300" aria-hidden="true">${moonSvg(part, moonX, 138, 50, 's')}</svg><svg class="region-scene" viewBox="0 0 390 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g transform="translate(0 60)">${SCENES[c.scene](rnd, c)}</g></svg>`;
}

// The land behind the path: contour lines and orbits that trail the scroll on a damped spring and take the color of the region you are in.
function startField(cv) {
  const SCALE = 260, LEVELS = 15, STEP = 0.22, FROM = -1.54;
  const RINGS = [{ x: 0.04, y: 0.1, r: 120, s: 0.2, a: 0.6, turn: 1 }, { x: 0.97, y: 0.34, r: 155, s: 0.11, a: 2.4, turn: -1 }, { x: 0.5, y: 0.58, r: 80, s: 0.3, a: 4.1, turn: 1 }, { x: 0.08, y: 0.8, r: 175, s: 0.15, a: 1.5, turn: -1 }];
  // Edge pairs per marching-squares case. Edges: 0 top, 1 right, 2 bottom, 3 left.
  const SEG = [[], [3, 2], [2, 1], [3, 1], [0, 1], [3, 0, 2, 1], [0, 2], [3, 0], [3, 0], [0, 2], [0, 1, 3, 2], [0, 1], [3, 1], [2, 1], [3, 2], []];
  const terrain = (x, y, z) => {
    const wx = x + 0.6 * Math.sin(y * 0.7 + z * 0.9), wy = y + 0.6 * Math.cos(x * 0.6 - z * 0.7);
    return Math.sin(wx * 1.1 + z * 0.5) * Math.cos(wy * 0.9 - z * 0.35) + 0.55 * Math.sin(wx * 2.1 - wy * 1.3 + z * 0.8) + 0.3 * Math.cos(wy * 3.1 + wx * 0.7 - z * 1.1);
  };
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const ctx = cv.getContext('2d'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, cell = 13;
  let w = 0, h = 0, cols = 0, rows = 0, grid = new Float32Array(0), raf = 0, last = 0, pos = reduce ? 0 : scrollY - 260, vel = 0, wanted = [255, 179, 71], tint = [...wanted];
  const contours = major => {
    ctx.beginPath();
    for (let n = 0; n < LEVELS; n++) {
      if ((n % 4 === 0) !== major) continue;
      const level = FROM + n * STEP;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const top = j * (cols + 1) + i, bottom = top + cols + 1, a = grid[top], b = grid[top + 1], c = grid[bottom + 1], d = grid[bottom];
        const kind = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
        if (kind === 0 || kind === 15) continue;
        const x = i * cell, y = j * cell, edge = SEG[kind];
        edge.forEach((side, e) => {
          const px = side === 0 ? x + (cell * (level - a)) / (b - a) : side === 1 ? x + cell : side === 2 ? x + (cell * (level - d)) / (c - d) : x;
          const py = side === 0 ? y : side === 1 ? y + (cell * (level - b)) / (c - b) : side === 2 ? y + cell : y + (cell * (level - a)) / (d - a);
          if (e % 2 === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
      }
    }
    ctx.lineWidth = major ? 1.3 : 0.8; ctx.strokeStyle = `rgba(${tint.map(Math.round)},${major ? 0.3 : 0.16})`; ctx.stroke();
  };
  const rings = () => {
    const margin = 190, span = h + margin * 2, color = tint.map(Math.round).join(',');
    for (const ring of RINGS) {
      const cx = ring.x * w, cy = ((((ring.y * span - pos * ring.s) % span) + span) % span) - margin, turn = ring.a + pos * 0.0019 * ring.turn, inner = ring.r * 0.62;
      ctx.lineWidth = 1; ctx.setLineDash([3, 7]); ctx.lineDashOffset = pos * ring.s * 0.4 * ring.turn; ctx.strokeStyle = `rgba(${color},.3)`;
      ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.strokeStyle = `rgba(${color},.18)`;
      ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(${color},.75)`;
      ctx.beginPath(); ctx.arc(cx + Math.cos(turn) * ring.r, cy + Math.sin(turn) * ring.r, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - Math.cos(turn * 1.4) * inner, cy - Math.sin(turn * 1.4) * inner, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  };
  const draw = () => {
    if (!w) return;
    const shift = pos * 0.22, z = pos * 0.00085;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) grid[j * (cols + 1) + i] = terrain((i * cell) / SCALE, (j * cell + shift) / SCALE, z);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(cv.width / w, 0, 0, cv.height / h, 0, 0); ctx.lineCap = 'round'; contours(false); contours(true); rings();
  };
  const frame = now => {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, 0.04) : 1 / 60, goal = scrollY, omega = 9;
    last = now; vel += (omega * omega * (goal - pos) - 2 * omega * vel) * dt; pos += vel * dt;
    let shade = 0;
    tint = tint.map((v, c) => { const next = v + (wanted[c] - v) * Math.min(dt * 5, 1); shade += Math.abs(wanted[c] - next); return next; });
    draw();
    if (Math.abs(goal - pos) > 0.3 || Math.abs(vel) > 1 || shade > 1) raf = requestAnimationFrame(frame); else last = 0;
  };
  const start = () => { if (reduce) { pos = scrollY; tint = [...wanted]; draw(); } else if (!raf) raf = requestAnimationFrame(frame); };
  new ResizeObserver(() => {
    const box = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 3);
    w = box.width; h = box.height; if (!w) return;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / cell); rows = Math.ceil(h / cell); grid = new Float32Array((cols + 1) * (rows + 1));
    draw(); start();
  }).observe(cv);
  addEventListener('scroll', start, { passive: true });
  return { tint: hex => { wanted = rgb(hex); start(); } };
}

// Energy over the land: currents that run across the screen, and now and then a thin bolt of lightning.
function startBolts(cv) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return { tint() {} };
  const ctx = cv.getContext('2d'), R = Math.random;
  let w = 0, h = 0, color = [255, 179, 71], last = 0, wait = 1400, bolts = [];
  const streams = Array.from({ length: 6 }, () => ({ y: R(), phase: R() * 6.28, speed: 0.05 + R() * 0.07, amp: 26 + R() * 46, t: R() }));
  const at = (s, t) => [t * (w + 160) - 80, s.y * h + Math.sin(t * 6 + s.phase) * s.amp];
  const bright = () => color.map(v => Math.round(v + (255 - v) * 0.65)).join(',');
  const jag = (x1, y1, x2, y2, rough) => {
    if (rough < 5) return [[x1, y1], [x2, y2]];
    const mx = (x1 + x2) / 2 + (R() - 0.5) * rough, my = (y1 + y2) / 2 + (R() - 0.5) * rough;
    return [...jag(x1, y1, mx, my, rough / 2), ...jag(mx, my, x2, y2, rough / 2).slice(1)];
  };
  const strike = () => {
    const x = 30 + R() * (w - 60), y = h * (0.25 + R() * 0.2), ex = x + (R() - 0.5) * 150, ey = y + 130 + R() * 170, main = jag(x, y, ex, ey, 62), lines = [main];
    for (let n = 0; n < 2; n++) { const [bx, by] = main[Math.floor(main.length * (0.25 + R() * 0.5))]; lines.push(jag(bx, by, bx + (R() - 0.5) * 110, by + 40 + R() * 70, 26)); }
    bolts.push({ lines, age: 0, life: 460 });
  };
  const trace = line => { ctx.beginPath(); line.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
  const frame = now => {
    requestAnimationFrame(frame);
    if (now - last < 33 || !w || document.hidden || document.body.classList.contains('in-lesson') || !document.getElementById('learn').classList.contains('active')) { if (now - last >= 33) last = now; return; }
    const dt = Math.min(now - last, 80); last = now;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(cv.width / w, 0, 0, cv.height / h, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const hue = color.join(','), hot = bright();
    for (const s of streams) {
      s.t += (s.speed * dt) / 1000; if (s.t > 1.05) { s.t = -0.05; s.y = R(); }
      for (let i = 0; i < 14; i++) {
        const [x1, y1] = at(s, s.t - (i + 1) * 0.012), [x2, y2] = at(s, s.t - i * 0.012), fade = 1 - i / 14;
        ctx.lineWidth = 1 + 2 * fade; ctx.strokeStyle = `rgba(${hue},${0.6 * fade})`; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      const [hx, hy] = at(s, s.t);
      ctx.fillStyle = `rgba(${hot},.95)`; ctx.beginPath(); ctx.arc(hx, hy, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    wait -= dt; if (wait <= 0) { strike(); wait = 2200 + R() * 3000; }
    bolts = bolts.filter(b => (b.age += dt) < b.life);
    for (const b of bolts) {
      const k = (1 - b.age / b.life) ** 2;
      b.lines.forEach((line, i) => {
        ctx.lineWidth = i ? 3 : 7; ctx.strokeStyle = `rgba(${hue},${0.22 * k})`; trace(line);
        ctx.lineWidth = i ? 0.9 : 1.7; ctx.strokeStyle = `rgba(${hot},${k})`; trace(line);
      });
    }
  };
  new ResizeObserver(() => {
    const box = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 3);
    w = box.width; h = box.height; if (!w) return;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }).observe(cv);
  requestAnimationFrame(frame);
  return { tint: hex => { color = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); } };
}
