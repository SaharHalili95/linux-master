const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function fresh(page, setup = {}) {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('./?mode=trivia');
  await page.evaluate(values => { localStorage.clear(); for (const [k, v] of Object.entries(values)) localStorage.setItem(k, v); }, setup);
  await page.reload();
  await page.waitForFunction(() => typeof startQuiz === 'function');
  return errors;
}

// Builds equivalent spellings of a command: shuffled flag units, merged switches,
// values attached to their flag, single quotes swapped for double quotes where safe.
function variants(answer, valueFlags, seed) {
  let state = seed;
  const random = () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;
  const tokens = answer.match(/'[^']*'|"[^"]*"|\S+/g);
  const ops = new Set(['|', '&&', ';', '>', '>>', '<', '&', '2>', '||']);
  const segments = []; let current = [];
  for (const tk of tokens) { if (ops.has(tk)) { segments.push({ words: current, op: tk }); current = []; } else current.push(tk); }
  segments.push({ words: current, op: '' });
  const out = new Set();
  for (let n = 0; n < 12; n++) {
    const parts = segments.map(({ words, op }) => {
      const [cmd, ...rest] = words;
      if (!cmd || ['find', 'openssl', 'git', 'for', 'do', 'done', 'echo', 'cd'].includes(cmd) || cmd.startsWith(':') || cmd.startsWith('$')) return [words.join(' '), op];
      const vf = valueFlags[cmd] || '', units = [], pos = [];
      for (let i = 0; i < rest.length; i++) {
        const w = rest[i];
        if (/^-[a-zA-Z]$/.test(w) && vf.includes(w[1]) && rest[i + 1] !== undefined) {
          const value = rest[++i];
          units.push({ flag: w, value, switch: false });
        } else if (/^-[a-zA-Z]$/.test(w)) units.push({ flag: w, switch: true });
        else pos.push(w);
      }
      for (let i = units.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [units[i], units[j]] = [units[j], units[i]]; }
      const pieces = []; let pendingSwitches = '';
      for (const u of units) {
        if (u.switch && random() < 0.6) { pendingSwitches += u.flag[1]; continue; }
        if (pendingSwitches) { pieces.push('-' + pendingSwitches); pendingSwitches = ''; }
        if (u.switch) pieces.push(u.flag);
        else if (!/^['"]/.test(u.value) && random() < 0.5) pieces.push(u.flag + u.value);
        else pieces.push(u.flag + ' ' + u.value);
      }
      if (pendingSwitches) pieces.push('-' + pendingSwitches);
      const positional = pos.map(p => (p.startsWith("'") && !/[$\\]/.test(p) && random() < 0.5) ? '"' + p.slice(1, -1) + '"' : p);
      return [[cmd, ...pieces, ...positional].join(' '), op];
    });
    const spaced = random() < 0.5;
    out.add(parts.map(([text, op]) => op ? text + (spaced ? ` ${op} ` : (op === '&' ? ' &' : op)) : text).join('').replace(/\s+/g, ' ').trim());
  }
  return [...out];
}

test.describe('typing check', () => {
  test('every answer is accepted in many equivalent spellings', async ({ page }) => {
    await fresh(page);
    const { answers, valueFlags } = await page.evaluate(() => ({
      answers: [pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios, banditScenarios].flat().map(s => s.answer),
      valueFlags: VALUE_FLAGS,
    }));
    const cases = answers.flatMap((a, i) => variants(a, valueFlags, i + 7).map(v => [a, v]));
    expect(cases.length).toBeGreaterThan(200);
    const rejected = await page.evaluate(list => list.filter(([a, v]) => canonicalCommand(a) !== canonicalCommand(v)), cases);
    expect(rejected).toEqual([]);
  });

  test('dropping any single flag from an answer is rejected', async ({ page }) => {
    await fresh(page);
    const wrongly = await page.evaluate(() => {
      const out = [];
      for (const s of [pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios].flat()) {
        const words = s.answer.split(' ');
        words.forEach((w, i) => {
          if (!/^-[a-zA-Z]$/.test(w)) return;
          const cmd = words.slice(0, i).reverse().find(x => /^[a-z]/.test(x) && !x.startsWith('-'));
          const takesValue = (VALUE_FLAGS[cmd] || '').includes(w[1]);
          const without = [...words.slice(0, i), ...words.slice(i + (takesValue ? 2 : 1))].join(' ');
          if (canonicalCommand(without) === canonicalCommand(s.answer)) out.push(without);
        });
      }
      return out;
    });
    expect(wrongly).toEqual([]);
  });

  test('known traps are rejected and known equivalents accepted', async ({ page }) => {
    await fresh(page);
    const r = await page.evaluate(() => {
      const same = (a, b) => canonicalCommand(a) === canonicalCommand(b);
      return {
        accepted: [['ls | head -n5', 'ls | head -n 5'], ['cut -d: -f2 x', 'cut -d : -f 2 x'], ['cut -f 2 -d : x', 'cut -d : -f 2 x'], ['sort -k2 f', 'sort -k 2 f'], ['nc -lp 4444 &', 'nc -l -p 4444 &']].map(([a, b]) => same(a, b)),
        rejected: [['cat --spaces in this filename--', 'cat "--spaces in this filename--"'], ['tar -f -c -z b.tgz c', 'tar -c -z -f b.tgz c'], ['find . -name *.log', 'find . -name "*.log"'], ['awk "{print $1}" f', "awk '{print $1}' f"], ['cp b a', 'cp a b'], ['nc -l -p 4444', 'nc -l -p 4444 &']].map(([a, b]) => same(a, b)),
      };
    });
    expect(r.accepted.every(Boolean)).toBe(true);
    expect(r.rejected.some(Boolean)).toBe(false);
  });
});

test.describe('stats', () => {
  test('a wrong pipe blames only the part that was wrong', async ({ page }) => {
    await fresh(page);
    const byCommand = await page.evaluate(() => {
      selectLevel('pipeFunction');
      const id = pipeFlagScenarios.findIndex(s => s.answer === 'ls | grep -i report');
      quizQuestions = [makeEntry('pipeFunction', id, {})]; quizIndex = 0; showScreen('quiz'); renderQuestion();
      [...document.querySelectorAll('.answer')].find(b => b.dataset.answer === 'ls | grep report').click(); clearTimeout(questionTimer);
      return stats.byCommand;
    });
    expect(byCommand).toEqual({ grep: { a: 1, c: 0 } });
  });

  test('accuracy counts first attempts only, review retries still move the question', async ({ page }) => {
    await fresh(page);
    const r = await page.evaluate(() => {
      selectLevel('pipe'); startQuiz();
      const first = quizQuestions[0];
      [...document.querySelectorAll('.answer')].find(b => b.dataset.answer !== first.q.answer).click(); clearTimeout(questionTimer);
      const retryIndex = quizQuestions.findIndex((e, i) => i > 0 && e.retry);
      quizIndex = retryIndex; renderQuestion();
      [...document.querySelectorAll('.answer')].find(b => b.dataset.answer === first.q.answer).click(); clearTimeout(questionTimer);
      return { answered: stats.answered, correct: stats.correct, level: stats.byLevel.pipe, box: reviewState.pipe.boxes[first.id] };
    });
    expect(r).toEqual({ answered: 1, correct: 0, level: { a: 1, c: 0 }, box: 1 });
  });
});

test('an update found mid-round waits for the home screen', async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { selectLevel('pipe'); startQuiz(); });
  await page.evaluate(() => navigator.serviceWorker.dispatchEvent?.(new Event('controllerchange')));
  await page.evaluate(() => { updateWaiting = true; });
  expect(await page.evaluate(() => document.getElementById('quiz').classList.contains('active'))).toBe(true);
  const reloaded = page.waitForEvent('load');
  await page.evaluate(() => goHome());
  await reloaded;
  await page.waitForFunction(() => typeof startQuiz === 'function');
});

test('Hebrew interface uses one form of address (plural)', async ({ page }) => {
  await fresh(page);
  const found = await page.evaluate(() => {
    const texts = [...Object.values(I18N.he).filter(v => typeof v === 'string'), ...Object.values(I18N.he.levels).flatMap(l => Object.values(l)),
      ...[...document.querySelectorAll('body *')].filter(e => e.children.length === 0).map(e => e.textContent)];
    const singular = /(^|[\s.,])(שלך|בחרי|בחר|תקבלי|קבל|ענית|עברת|תוכל|יודע\/ת)([\s.,!?]|$)/;
    return texts.filter(t => singular.test(t));
  });
  expect(found).toEqual([]);
});

test('typing field has an accessible name and the prompt line is a generic Linux prompt', async ({ page }) => {
  await fresh(page, { answerMode: 'type' });
  await page.evaluate(() => { selectLevel('pipe'); startQuiz(); });
  await expect(page.locator('#typeInput')).toHaveAttribute('aria-label', 'הקלידו את הפקודה');
  await page.evaluate(() => { goHome(); selectLevel('functions'); quizQuestions = [makeEntry('functions', 10, {})]; quizIndex = 0; showScreen('quiz'); renderQuestion(); });
  await expect(page.locator('#questionCode .prompt')).toHaveText('user@linux:~$ ');
});

test('pages deploy runs only after Tests pass', () => {
  const pages = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'pages.yml'), 'utf8');
  expect(pages).toMatch(/workflow_run:\s*\n\s*workflows: \[Tests\]/);
  expect(pages).toContain("github.event.workflow_run.conclusion == 'success'");
  expect(pages).toContain('github.event.workflow_run.head_sha');
  expect(pages).not.toMatch(/^\s*push:/m);
});
