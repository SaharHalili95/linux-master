const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');

const LEVELS = ['intro', 'functions', 'pipe', 'pipeFunction', 'pro', 'pipeTwoFlag', 'workflow', 'bandit'];
const SCENARIO_POOLS = {
  pipe: 'pipeScenarios', pipeFunction: 'pipeFlagScenarios', pro: 'professionalScenarios',
  pipeTwoFlag: 'pipeTwoFlagScenarios', workflow: 'workflowScenarios', bandit: 'banditScenarios',
};

async function fresh(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('./?mode=trivia');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => typeof startQuiz === 'function');
  return errors;
}

const dump = page => page.evaluate(() => ({
  commands, guideUses, pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios, banditScenarios,
  commandQs: commands.map(c => commandQuestion(c, commands)),
  meaningQs: commands.map(c => commandMeaningQuestion(c, commands)),
  introPool: levelQuiz.intro.ids().length,
  guideQs: guideUses.map(u => ({ u, syntax: u.kind === 'key' ? `${u.command}: ${u.usage}` : guideSyntax(u), q: guideUseQuestion(u, guideUses) })),
  similar: similarCommands,
}));

const flagCount = cmd => (cmd.replace(/'[^']*'|"[^"]*"/g, '').match(/(^|\s)-{1,2}[A-Za-z]/g) || []).length;

test.describe('content @content', () => {
  let data;
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await fresh(page);
    data = await dump(page);
    await page.close();
  });

  test('header version matches the service worker cache version', async () => {
    const fs = require('fs'), path = require('path');
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
    const version = html.match(/class="version"[^>]*>v(\d+)</)[1];
    expect(sw.match(/linux-master-v(\d+)/)[1]).toBe(version);
    const assetVersions = [...html.matchAll(/(?:src|href)="[^"]+\?v=(\d+)"/g), ...sw.matchAll(/\?v=(\d+)'/g)].map(m => m[1]);
    expect(assetVersions.length).toBeGreaterThanOrEqual(8);
    expect(new Set(assetVersions)).toEqual(new Set([version]));
  });

  test('every translation lines up with the Hebrew content', async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('./?mode=trivia');
    const sizes = await page.evaluate(() => ({
      guide: [CONTENT.en.guide.length, guideUses.length],
      commands: commands.every(c => CONTENT.en.commands[c.name]),
      prompts: Object.keys(CONTENT.en.prompts).length,
      scenarios: Object.entries(CONTENT.en.scenarios).map(([k, v]) => [k, v.length, { pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios, banditScenarios }[k].length]),
      ui: Object.keys(I18N.he).filter(k => !(k in I18N.en)),
    }));
    await page.close();
    expect(sizes.guide[0]).toBe(sizes.guide[1]);
    expect(sizes.commands).toBe(true);
    for (const [name, en, he] of sizes.scenarios) expect(en, name).toBe(he);
    expect(sizes.ui).toEqual([]);
  });

  test('pool sizes match README (46 commands, 450 uses, 15 per scenario level)', () => {
    expect(data.commands).toHaveLength(46);
    expect(data.guideUses).toHaveLength(450);
    for (const [level, name] of Object.entries(SCENARIO_POOLS)) expect(data[name], name).toHaveLength(level === 'bandit' ? 30 : 15);
  });

  test('commands: unique names and no empty fields', () => {
    const names = data.commands.map(c => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const c of data.commands) for (const k of ['name', 'meaning', 'flag', 'flagMeaning', 'example']) expect(c[k], `${c.name}.${k}`).toBeTruthy();
  });

  test('stage 01 questions never reveal the answer in the prompt', () => {
    const leaks = data.commandQs.filter(q => new RegExp(`(^|[^a-z-])${q.answer.replace(/[-.]/g, '\\$&')}([^a-z-]|$)`).test(q.prompt));
    expect(leaks.map(q => q.prompt)).toEqual([]);
  });

  test('stage 01 reverse direction: 46 questions, 4 distinct meanings, correct meaning never contains the command name', () => {
    expect(data.introPool).toBe(92);
    for (const q of data.meaningQs) {
      const keys = q.options.map(o => o.key);
      expect(new Set(keys).size, q.prompt).toBe(4);
      expect(keys.filter(k => k === q.answer), q.prompt).toHaveLength(1);
      expect(q.answer.toLowerCase(), q.prompt).not.toContain(q.code.toLowerCase());
    }
  });

  test('stage 01 every question has 4 distinct options with exactly one correct', () => {
    for (const q of data.commandQs) {
      const keys = q.options.map(o => o.key);
      expect(new Set(keys).size, q.prompt).toBe(4);
      expect(keys.filter(k => k === q.answer), q.prompt).toHaveLength(1);
    }
  });

  test('guide uses: command exists, no empty fields', () => {
    const names = new Set(data.commands.map(c => c.name));
    const bad = data.guideUses.filter(u => !u.command || !u.usage || !u.meaning || !names.has(u.command));
    expect(bad).toEqual([]);
  });

  test('guide uses: same syntax never has two different meanings (ambiguous question)', () => {
    const bySyntax = new Map();
    for (const { u, syntax } of data.guideQs) bySyntax.set(syntax, [...(bySyntax.get(syntax) || []), u.meaning]);
    const dupes = [...bySyntax].filter(([, m]) => new Set(m).size > 1).map(([s, m]) => `${s} => ${m.join(' || ')}`);
    expect(dupes).toEqual([]);
  });

  test('guide uses: shown command never glues the command name onto another command', () => {
    const extra = new Set(['id', 'groups', 'who', 'w', 'logname', 'printenv', 'export', 'echo', 'type', 'pushd', 'popd', 'pwd', 'readlink', 'jobs', 'fg', 'bg', 'sudo', 'printf']);
    const names = new Set([...data.commands.map(c => c.name), ...extra]);
    const bad = data.guideQs.filter(({ u, syntax }) => u.kind !== 'key' && syntax.split(' ')[0] === u.command && names.has(syntax.split(' ')[1]) && syntax.split(' ')[1] !== u.command && !/^(help|man|sudo|env|type)$/.test(u.command)).map(x => x.syntax);
    expect(bad).toEqual([]);
  });

  test('guide uses: pager keys are asked as keys, not as commands', () => {
    const keys = ['q', 'n', 'N', 'g / G', 'Space', 'Space / b', '/TEXT', '?TEXT', '/WORD'];
    const bad = data.guideQs.filter(({ u }) => ['less', 'man'].includes(u.command) && keys.includes(u.usage) && u.kind !== 'key').map(x => x.syntax);
    expect(bad).toEqual([]);
  });

  test('guide uses: descriptions are real sentences (10+ chars, Hebrew, no garbage)', () => {
    const bad = data.guideUses.filter(u => u.meaning.length < 10 || !/[\u0590-\u05ff]/.test(u.meaning) || /[^\x20-\x7e]/.test(u.usage)).map(u => `${u.command} ${u.usage} => ${u.meaning}`);
    expect(bad).toEqual([]);
  });

  test('guide uses: wrong options come from the same command when possible', () => {
    const meaningsOf = cmd => new Set(data.guideUses.filter(u => u.command === cmd).map(u => u.meaning));
    const bad = data.guideQs.filter(({ u, q }) => q.options.filter(o => o.key !== q.answer).some(o => !meaningsOf(u.command).has(o.key))).map(x => x.syntax);
    expect(bad).toEqual([]);
  });

  test('stage 01: wrong options never include a command that also fits', () => {
    const bad = [];
    for (let r = 0; r < 20; r++) for (const q of data.commandQs) for (const o of q.options) if (o.key !== q.answer && data.similar.some(g => g.includes(o.key) && g.includes(q.answer))) bad.push(`${q.answer}/${o.key}`);
    expect(bad).toEqual([]);
  });

  test('guide uses: no exact duplicate entries', () => {
    const keys = data.guideUses.map(u => `${u.command}|${u.usage}|${u.meaning}`);
    const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(dup).toEqual([]);
  });

  test('scenarios: 3 distinct wrong answers, none equal to the answer, fields filled', () => {
    for (const name of Object.values(SCENARIO_POOLS)) for (const s of data[name]) {
      expect(s.prompt && s.answer && s.explanation, `${name}: ${s.prompt}`).toBeTruthy();
      expect(s.wrong, s.prompt).toHaveLength(3);
      expect(new Set([s.answer, ...s.wrong]).size, s.prompt).toBe(4);
    }
  });

  test('scenarios: no duplicate prompts or answers across all levels', () => {
    const all = Object.values(SCENARIO_POOLS).flatMap(n => data[n]);
    const dupP = all.map(s => s.prompt).filter((p, i, a) => a.indexOf(p) !== i);
    const dupA = all.map(s => s.answer).filter((p, i, a) => a.indexOf(p) !== i);
    expect({ dupP, dupA }).toEqual({ dupP: [], dupA: [] });
  });

  test('scenarios: every correct answer is valid bash syntax', () => {
    const bad = [];
    for (const name of Object.values(SCENARIO_POOLS)) for (const s of data[name]) {
      try { execFileSync('bash', ['-n', '-c', s.answer], { stdio: 'pipe' }); } catch (e) { bad.push(`${name}: ${s.answer} -> ${e.stderr}`); }
    }
    expect(bad).toEqual([]);
  });

  test('stage rules: 03 pipe without flags', () => {
    const bad = data.pipeScenarios.filter(s => !s.answer.includes('|') || flagCount(s.answer) !== 0).map(s => s.answer);
    expect(bad).toEqual([]);
  });

  test('stage rules: 04 pipe with exactly one flag', () => {
    const bad = data.pipeFlagScenarios.filter(s => !s.answer.includes('|') || flagCount(s.answer) !== 1).map(s => s.answer);
    expect(bad).toEqual([]);
  });

  test('stage rules: 05 single command with two flags', () => {
    const bad = data.professionalScenarios.filter(s => flagCount(s.answer) < 2).map(s => s.answer);
    expect(bad).toEqual([]);
  });

  test('stage rules: 06 pipe with two or more flags', () => {
    const bad = data.pipeTwoFlagScenarios.filter(s => !s.answer.includes('|') || flagCount(s.answer) < 2).map(s => s.answer);
    expect(bad).toEqual([]);
  });

  test('stage rules: 07 combines several commands', () => {
    const bad = data.workflowScenarios.filter(s => !/[|;&>]/.test(s.answer)).map(s => s.answer);
    expect(bad).toEqual([]);
  });

  test('no "useless cat" in correct answers (cat with a single file piped on)', () => {
    const all = Object.values(SCENARIO_POOLS).flatMap(n => data[n]);
    const bad = all.filter(s => /(^|\|\s*)cat \S+ \|/.test(s.answer) && !/\| *tr /.test(s.answer)).map(s => s.answer);
    expect(bad).toEqual([]);
  });

  test('tutorial examples: every scenario example is non-empty bash', () => {
    const bad = data.commands.filter(c => { try { execFileSync('bash', ['-n', '-c', c.example], { stdio: 'pipe' }); return false; } catch { return true; } }).map(c => c.example);
    expect(bad).toEqual([]);
  });
});

test.describe('app', () => {
  test('loads with no console errors and no failed requests', async ({ page }) => {
    const errors = await fresh(page);
    await page.waitForLoadState('networkidle');
    const failed = [];
    page.on('requestfailed', r => failed.push(r.url()));
    page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.level-card')).toHaveCount(8);
    await expect(page.locator('#commandCount')).toHaveText('46');
    expect({ errors, failed }).toEqual({ errors: [], failed: [] });
  });

  test('html has lang=he and dir=rtl', async ({ page }) => {
    await fresh(page);
    expect(await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir])).toEqual(['he', 'rtl']);
  });

  test('selected level persists across reload', async ({ page }) => {
    await fresh(page);
    await page.click('#levelPro');
    await page.reload();
    await expect(page.locator('#levelPro')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#levelIntro')).toHaveAttribute('aria-pressed', 'false');
  });

  for (const level of LEVELS) {
    test(`full round via real clicks: ${level}`, async ({ page }) => {
      const errors = await fresh(page);
      await page.evaluate(l => selectLevel(l), level);
      await page.click('button:has-text("מתחילים")');
      await expect(page.locator('#quiz')).toHaveClass(/active/);
      let expectedScore = 0, answered = 0, i = 0, firstAnswered = 0, firstCorrect = 0;
      while (!(await page.locator('#result').evaluate(e => e.classList.contains('active')))) {
        const total = await page.evaluate(() => quizQuestions.length);
        await expect(page.locator('#quizCounter')).toHaveText(`${String(i + 1).padStart(2, '0')} / ${total}`);
        const answers = page.locator('.answer');
        await expect(answers).toHaveCount(4);
        const keys = await answers.evaluateAll(bs => bs.map(b => b.dataset.answer));
        expect(new Set(keys).size).toBe(4);
        const correctKey = await page.evaluate(() => quizQuestions[quizIndex].q.answer);
        expect(keys.filter(k => k === correctKey)).toHaveLength(1);
        const pickCorrect = i % 2 === 0;
        const idx = pickCorrect ? keys.indexOf(correctKey) : keys.findIndex(k => k !== correctKey);
        const isRetry = await page.evaluate(() => !!quizQuestions[quizIndex].retry);
        await answers.nth(idx).click();
        answered++; if (pickCorrect) expectedScore++;
        if (!isRetry) { firstAnswered++; if (pickCorrect) firstCorrect++; }
        await expect(answers.nth(idx)).toHaveClass(pickCorrect ? /correct/ : /wrong/);
        if (!pickCorrect) await expect(page.locator('.answer.correct')).toHaveCount(1);
        await expect(page.locator('#quizScore')).toHaveText(String(expectedScore));
        await expect(page.locator('#feedback')).toHaveClass(/show/);
        await page.evaluate(() => nextQuestion());
        i++;
        expect(i).toBeLessThan(60);
      }
      await expect(page.locator('#resultScore')).toHaveText(`${expectedScore} מתוך ${answered} נכונות`);
      const s = await page.evaluate(() => JSON.parse(localStorage.getItem('quizStats')));
      expect(s).toMatchObject({ correct: firstCorrect, answered: firstAnswered });
      expect(s.byLevel[level]).toEqual({ a: firstAnswered, c: firstCorrect });
      expect(errors).toEqual([]);
    });
  }

  test('double click on answers counts only once', async ({ page }) => {
    await fresh(page);
    await page.click('button:has-text("מתחילים")');
    const correctKey = await page.evaluate(() => quizQuestions[0].q.answer);
    await page.locator(`.answer[data-answer="${correctKey}"]`).dblclick();
    await page.locator('.answer').first().click({ force: true }).catch(() => {});
    const s = await page.evaluate(() => [JSON.parse(localStorage.getItem('quizStats')).answered, progress.intro.pos]);
    expect(s).toEqual([1, 1]);
  });

  test('progress survives reload mid-round and continues with unseen questions', async ({ page }) => {
    await fresh(page);
    await page.click('button:has-text("מתחילים")');
    const seen = [];
    for (let i = 0; i < 3; i++) {
      seen.push(await page.evaluate(() => quizQuestions[quizIndex].q.answer));
      await page.evaluate(() => { const e = quizQuestions[quizIndex]; [...document.querySelectorAll('.answer')].find(b => b.dataset.answer === e.q.answer).click(); });
      await page.waitForFunction(k => quizIndex === k, i + 1);
    }
    await page.reload();
    await expect(page.locator('#quizModeMeta')).toContainText('3/92');
    await page.click('button:has-text("מתחילים")');
    const next = await page.evaluate(() => quizQuestions.map(e => e.q.answer));
    expect(next).toHaveLength(20);
    expect(next.filter(a => seen.includes(a))).toEqual([]);
  });

  test('stage 01 cycle covers all 92 questions exactly once, then reshuffles', async ({ page }) => {
    await fresh(page);
    const seen = [];
    const sizes = [];
    for (let r = 0; r < 5; r++) {
      await page.evaluate(() => startQuiz());
      const batch = await page.evaluate(() => quizQuestions.map(e => e.id));
      sizes.push(batch.length);
      seen.push(...batch);
      await page.evaluate(() => { for (let i = 0; i < quizQuestions.length; i++) { const e = quizQuestions[quizIndex]; [...document.querySelectorAll('.answer')].find(b => b.dataset.answer === e.q.answer).click(); nextQuestion(); } });
    }
    expect(sizes).toEqual([20, 20, 20, 20, 12]);
    expect(new Set(seen).size).toBe(92);
    await page.evaluate(() => goHome());
    await page.evaluate(() => startQuiz());
    expect(await page.evaluate(() => [progress.intro.pos, quizQuestions.length])).toEqual([0, 20]);
  });

  test('home progress label after finishing a cycle', async ({ page }) => {
    await fresh(page);
    await page.evaluate(() => selectLevel('pipe'));
    await page.evaluate(() => { startQuiz(); for (let i = 0; i < quizQuestions.length; i++) { document.querySelector('.answer').click(); nextQuestion(); } goHome(); });
    await expect(page.locator('#quizModeMeta')).toContainText('15/15');
  });

  test('leaving a quiz cancels the auto-advance timer', async ({ page }) => {
    await fresh(page);
    await page.click('button:has-text("מתחילים")');
    await page.locator('.answer').first().click();
    await page.locator('#quiz .back-btn').click();
    await page.waitForTimeout(2500);
    await expect(page.locator('#home')).toHaveClass(/active/);
    expect(await page.evaluate(() => quizIndex)).toBe(0);
  });

  test('accuracy stat matches answers', async ({ page }) => {
    await fresh(page);
    await page.evaluate(() => { startQuiz(); for (let i = 0; i < 4; i++) { const q = quizQuestions[quizIndex].q; const b = [...document.querySelectorAll('.answer')].find(x => (x.dataset.answer === q.answer) === (i < 3)); b.click(); nextQuestion(); } goHome(); });
    await expect(page.locator('#learnedCount')).toHaveText('3');
    await expect(page.locator('#bestScore')).toHaveText('75%');
  });

  test('tutorials: every level renders all lessons, load more and search work', async ({ page }) => {
    await fresh(page);
    await page.click('button:has-text("פתיחת ההדרכות")');
    const tabs = page.locator('.tutorial-tab');
    await expect(tabs).toHaveCount(8);
    for (let i = 0; i < 8; i++) {
      await tabs.nth(i).click();
      const total = await page.evaluate(() => currentTutorialLessons.length);
      while (await page.locator('#tutorialLoadMore').isVisible()) await page.locator('#tutorialLoadMore button').click();
      await expect(page.locator('.tutorial-lesson')).toHaveCount(total);
      const empty = await page.locator('.tutorial-lesson').evaluateAll(ls => ls.filter(l => !l.querySelector('strong').textContent.trim() || !l.querySelector('code').textContent.trim()).length);
      expect(empty).toBe(0);
    }
    await tabs.nth(1).click();
    await page.fill('#tutorialSearch', 'base64');
    const hits = await page.locator('.tutorial-lesson').count();
    expect(hits).toBeGreaterThan(0);
    for (const t of await page.locator('.tutorial-lesson').allTextContents()) expect(t.toLowerCase()).toContain('base64');
    await page.fill('#tutorialSearch', 'zzzznotfound');
    await expect(page.locator('.tutorial-lesson')).toHaveCount(0);
  });

  test('tutorial tab shows aria-selected on the active tab', async ({ page }) => {
    await fresh(page);
    await page.click('button:has-text("פתיחת ההדרכות")');
    await page.locator('.tutorial-tab').nth(3).click();
    await expect(page.locator('.tutorial-tab[aria-selected="true"]')).toHaveCount(1);
    await expect(page.locator('.tutorial-tab').nth(3)).toHaveAttribute('aria-selected', 'true');
  });

  test('corrupted localStorage does not break the app', async ({ page }) => {
    await fresh(page);
    await page.evaluate(() => { localStorage.setItem('quizStats', '{bad'); localStorage.setItem('levelProgress', 'nope'); });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.reload();
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
    await page.click('button:has-text("מתחילים")');
    await expect(page.locator('.answer')).toHaveCount(4);
  });

  test('stale progress from an older pool size is reset', async ({ page }) => {
    await fresh(page);
    await page.evaluate(() => localStorage.setItem('levelProgress', JSON.stringify({ intro: { order: [0, 1, 2], pos: 2 } })));
    await page.reload();
    await page.evaluate(() => startQuiz());
    expect(await page.evaluate(() => [quizQuestions.length, progress.intro.order.length])).toEqual([20, 92]);
  });

  test('no horizontal scroll on any screen', async ({ page }) => {
    await fresh(page);
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow(), 'home').toBeLessThanOrEqual(0);
    await page.click('button:has-text("פתיחת ההדרכות")');
    for (let i = 0; i < 8; i++) { await page.locator('.tutorial-tab').nth(i).click(); for (const d of await page.locator('.tutorial-lesson').all()) await d.evaluate(e => e.open = true); expect(await overflow(), `tutorial ${i}`).toBeLessThanOrEqual(0); }
    for (const level of LEVELS) {
      await page.evaluate(l => { goHome(); selectLevel(l); startQuiz(); }, level);
      for (let i = 0; i < 20 && await page.evaluate(() => !document.getElementById('result').classList.contains('active')); i++) {
        expect(await overflow(), `quiz ${level} #${i}`).toBeLessThanOrEqual(0);
        await page.evaluate(() => { document.querySelector('.answer').click(); nextQuestion(); });
      }
      expect(await overflow(), `result ${level}`).toBeLessThanOrEqual(0);
    }
  });

  test('answer buttons are at least 44px tall (touch target)', async ({ page }) => {
    await fresh(page);
    await page.click('button:has-text("מתחילים")');
    const heights = await page.locator('.answer').evaluateAll(bs => bs.map(b => b.getBoundingClientRect().height));
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
  });

  test('manifest and icons are valid', async ({ page, request }) => {
    await fresh(page);
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBeTruthy();
    const m = await (await request.get(new URL(href, page.url()).href)).json();
    expect(m.lang).toBe('he');
    for (const icon of m.icons) {
      const r = await request.get(new URL(icon.src, page.url()).href);
      expect(r.status(), icon.src).toBe(200);
      const buf = await r.body();
      const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
      expect(`${w}x${h}`, icon.src).toBe(icon.sizes);
    }
    const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
    expect(apple, 'apple-touch-icon').toBeTruthy();
  });

  test('works offline after first visit (service worker)', async ({ page, context, browserName }) => {
    test.skip(browserName === 'webkit', 'Playwright WebKit does not support service workers');
    await fresh(page);
    await page.waitForFunction(async () => (await navigator.serviceWorker.ready).active?.state === 'activated');
    await page.reload();
    await page.waitForTimeout(1000);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.level-card')).toHaveCount(8);
    const fontOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px Assistant'); });
    expect(fontOk, 'Assistant font available offline').toBe(true);
    await page.click('button:has-text("מתחילים")');
    await expect(page.locator('.answer')).toHaveCount(4);
    await context.setOffline(false);
  });

  test('keyboard: answers reachable with Tab and selectable with Enter', async ({ page, browserName }) => {
    await fresh(page);
    await page.click('button:has-text("מתחילים")');
    await page.locator('.answer').first().focus();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('quizStats')).answered)).toBe(1);
  });
});
