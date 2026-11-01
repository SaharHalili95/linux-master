const { test, expect } = require('@playwright/test');

async function fresh(page, setup = {}) {
  await page.goto('./?mode=trivia');
  await page.evaluate(values => { localStorage.clear(); for (const [k, v] of Object.entries(values)) localStorage.setItem(k, v); }, setup);
  await page.reload();
  await page.waitForFunction(() => typeof startQuiz === 'function');
}

test.describe('simulated shell', () => {
  test('no wrong option is ever accepted by comparing output', async ({ page }) => {
    await fresh(page);
    const r = await page.evaluate(() => {
      const pools = { pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios, banditScenarios };
      let judged = 0; const accepted = [];
      for (const [name, list] of Object.entries(pools)) list.forEach((s, i) => {
        const fixture = name === 'banditScenarios' ? banditFixture : lessonFixture;
        for (const wrong of s.wrong) { const result = sameOutput(s.answer, wrong, fixture); if (result !== null) judged++; if (result === true) accepted.push(`${name}#${i}: ${wrong}`); }
      });
      return { judged, accepted };
    });
    expect(r.accepted).toEqual([]);
    expect(r.judged).toBeGreaterThan(150);
  });

  test('every answer the simulator can run gives the same output as itself and as its listed alternatives', async ({ page }) => {
    await fresh(page);
    const bad = await page.evaluate(() => {
      const pools = { pipeScenarios, pipeFlagScenarios, professionalScenarios, pipeTwoFlagScenarios, workflowScenarios, banditScenarios };
      const out = [];
      for (const [name, list] of Object.entries(pools)) list.forEach((s, i) => {
        const fixture = name === 'banditScenarios' ? banditFixture : lessonFixture;
        if (sameOutput(s.answer, s.answer, fixture) === null) return;
        // An accepted long listing (ls -l -a for ls -a) shows the same files with more columns, so its output differs on purpose.
        for (const alt of s.accept || []) if (!/\bls -l\b/.test(alt) && sameOutput(s.answer, alt, fixture) === false) out.push(`${name}#${i}: ${alt}`);
      });
      return out;
    });
    expect(bad).toEqual([]);
  });

  test('real alternative solutions are recognised', async ({ page }) => {
    await fresh(page);
    const r = await page.evaluate(() => [
      ['cat names1.txt names2.txt | sort -u', 'sort -u names1.txt names2.txt'],
      ['sort names.txt | uniq', 'sort -u names.txt'],
      ['grep -i -w ssh app.log | wc -l', 'grep -ciw ssh app.log'],
      ['cut -d : -f 2 inventory.txt | sort -n', "awk -F : '{print $2}' inventory.txt | sort -n"],
      ['ls | wc -l', 'ls -1 | wc -l'],
      ['tail app.log | grep INFO', 'tail -n 10 app.log | grep INFO'],
    ].map(([a, b]) => sameOutput(a, b)));
    expect(r.every(x => x === true)).toBe(true);
  });

  test('a filter at the start of a pipe waits for the keyboard, like a real terminal', async ({ page }) => {
    await fresh(page);
    const r = await page.evaluate(() => new Shell(lessonFixture(0)).run('grep log | ls'));
    expect(r.err).toContain('waiting for keyboard input');
  });

  test('find / shows permission errors that 2>/dev/null hides', async ({ page }) => {
    await fresh(page);
    const r = await page.evaluate(() => ['find / -user bandit7 -group bandit6 -size 33c', 'find / -user bandit7 -group bandit6 -size 33c 2>/dev/null'].map(c => new Shell(banditFixture(0)).run(c)));
    expect(r[0].out).toBe('/var/lib/dpkg/info/bandit7.password\n');
    expect(r[0].err).toContain('Permission denied');
    expect(r[1]).toEqual({ out: '/var/lib/dpkg/info/bandit7.password\n', err: '', code: 1 });
  });
});

test.describe('typing with output checking', () => {
  test('a different command with the same result is accepted and the reference answer is shown', async ({ page }) => {
    await fresh(page, { answerMode: 'type' });
    const text = await page.evaluate(() => {
      const id = pipeFlagScenarios.findIndex(s => s.answer === 'cat names1.txt names2.txt | sort -u');
      selectLevel('pipeFunction'); quizQuestions = [makeEntry('pipeFunction', id, {})]; quizIndex = 0; showScreen('quiz'); renderQuestion();
      document.getElementById('typeInput').value = 'sort -u names1.txt names2.txt'; document.querySelector('.type-actions .primary-btn').click(); clearTimeout(questionTimer);
      return { cls: document.getElementById('typeInput').className, fb: document.getElementById('feedback').textContent };
    });
    expect(text.cls).toContain('correct');
    expect(text.fb).toContain('זו דרך אחרת שנותנת בדיוק את אותה תוצאה.');
    expect(text.fb).toContain('הפתרון שלנו: cat names1.txt names2.txt | sort -u');
  });

  test('a wrong typed command shows its own output next to the right output', async ({ page }) => {
    await fresh(page, { answerMode: 'type' });
    const fb = await page.evaluate(() => {
      const id = pipeScenarios.findIndex(s => s.answer === 'ls | grep log');
      selectLevel('pipe'); quizQuestions = [makeEntry('pipe', id, {})]; quizIndex = 0; showScreen('quiz'); renderQuestion();
      document.getElementById('typeInput').value = 'ls | grep LOG'; document.querySelector('.type-actions .primary-btn').click(); clearTimeout(questionTimer);
      return document.getElementById('feedback').textContent;
    });
    expect(fb).toContain('הפלט שלכם על קבצי הדוגמה:\n(אין פלט)');
    expect(fb).toContain('הפלט הנכון:\naccess.log');
  });

  test('Bandit level 08 uses its own sample files', async ({ page }) => {
    await fresh(page, { answerMode: 'type' });
    const r = await page.evaluate(() => {
      const run = (answer, typed) => {
        const id = banditScenarios.findIndex(s => s.answer === answer);
        selectLevel('bandit'); quizQuestions = [makeEntry('bandit', id, {})]; quizIndex = 0; showScreen('quiz'); renderQuestion();
        document.getElementById('typeInput').value = typed; document.querySelector('.type-actions .primary-btn').click(); clearTimeout(questionTimer);
        return document.getElementById('typeInput').className.includes('correct');
      };
      return {
        dashViaPath: run('cat ./-', 'cat /home/user/-'),
        rot13Lower: run("cat data.txt | tr 'A-Za-z' 'N-ZA-Mn-za-m'", "tr 'a-zA-Z' 'n-za-mN-ZA-M' < data.txt"),
        chmodSymbolic: run('chmod 600 key.private', 'chmod go-r key.private'),
        chmodWrong: run('chmod 600 key.private', 'chmod 640 key.private'),
      };
    });
    expect(r).toEqual({ dashViaPath: true, rot13Lower: true, chmodSymbolic: true, chmodWrong: false });
  });
});

// Commands added for Learn mode part 1; outputs checked against Ubuntu 24.04 with `npm run diff`.
test('braces, touch, rmdir, alias, type and which behave like bash', () => {
  const fs = require('fs'), vm = require('vm'), path = require('path');
  const ctx = vm.createContext({});
  vm.runInContext(`${fs.readFileSync(path.join(__dirname, '../shell.js'), 'utf8')}\nthis.Shell = Shell;`, ctx);
  const sh = new ctx.Shell({ cwd: '/home/user', dirs: ['/home/user', '/home/user/docs', '/home/user/empty'], files: [['/home/user/docs/a.txt', { content: 'a\n' }]] });
  const run = c => { const r = sh.run(c); return r.out + (r.err ? `!${r.err}` : ''); };
  expect(run('echo {a,b}.txt file{1..3} x{c..a}')).toBe('a.txt b.txt file1 file2 file3 xc xb xa\n');
  expect(run(`echo '{a,b}' "{1..2}"`)).toBe('{a,b} {1..2}\n');
  run('mkdir -p bk/{x,y}'); expect(run('ls bk')).toBe('x\ny\n');
  run('touch new.txt docs/a.txt'); expect(run('cat new.txt docs/a.txt')).toBe('a\n');
  expect(run('rmdir docs')).toBe("!rmdir: failed to remove 'docs': Directory not empty\n");
  expect(run('rmdir empty && ls')).toBe('bk\ndocs\nnew.txt\n');
  run('alias ll="ls -a"');
  expect(run('alias')).toBe("alias ll='ls -a'\n");
  expect(run('ll bk')).toBe('.\n..\nx\ny\n');
  expect(run('type ll cd ls')).toBe("ll is aliased to `ls -a'\ncd is a shell builtin\nls is /usr/bin/ls\n");
  expect(run('which ls cd')).toBe('/usr/bin/ls\n');
  expect(run('echo $SHELL')).toBe('/bin/bash\n');
});

// ls -l, chmod and umask are checked against output recorded on Ubuntu with the same files (tests/sandbox/record/ubuntu.txt, check-*).
test('ls -l, chmod, umask and links print exactly what Ubuntu printed', () => {
  const fs = require('fs'), vm = require('vm'), path = require('path');
  const ctx = vm.createContext({});
  vm.runInContext(`${fs.readFileSync(path.join(__dirname, '../shell.js'), 'utf8')}\n${fs.readFileSync(path.join(__dirname, '../prototype/recorded.js'), 'utf8')}\nthis.Shell = Shell; this.R = RECORDED;`, ctx);
  const sh = (files, dirs = []) => new ctx.Shell({ cwd: '/home/user', dirs: ['/home/user', ...dirs.map(d => `/home/user/${d}`)], files: files.map(([p, c]) => [`/home/user/${p}`, { content: c }]) });
  const run = (s, cmds) => { let out; for (const c of cmds) out = s.run(c).out; return out; };
  expect(run(sh([['readme.txt', 'Welcome to Linux!\n'], ['notes.txt', 'buy milk\ncall mom\nlearn grep\n'], ['big.txt', 'x'.repeat(5000)]], ['docs', 'logs', 'photos', 'projects']),
    ['chmod 600 notes.txt', 'chmod 4755 readme.txt', 'chmod 1777 photos', 'chmod 2775 projects', 'ln -s notes.txt link.txt', 'ln notes.txt hard.txt', 'sudo chown -R user:user readme.txt', 'ls -l'])).toBe(ctx.R['check-ls-l'].out);
  expect(run(sh([['big.txt', 'x'.repeat(5000)], ['small.txt', 'hi\n']], ['dir']), ['ls -lh'])).toBe(ctx.R['check-ls-lh'].out);
  expect(run(sh([['f.txt', 'hi\n']], ['sub', 'sub/a', 'sub/b']), ['chmod 640 f.txt', 'ls -ld sub f.txt'])).toBe(ctx.R['check-ls-ld'].out);
  expect(run(sh([]), ['umask 027', 'touch f.txt', 'mkdir d', 'ls -ld f.txt d'])).toBe(ctx.R['check-umask'].out);
  expect(run(sh([['f.txt', 'hi\n']]), ['chmod 644 f.txt', 'chmod u+x,g+w,o-r f.txt', 'ls -l f.txt'])).toBe(ctx.R['check-chmod-sym'].out);
  expect(run(sh([['f.txt', 'hi\n']]), ['chmod 777 f.txt', 'chmod u=rwx,go=rx f.txt', 'chmod g-x+s f.txt', 'ls -l f.txt'])).toBe(ctx.R['check-chmod-eq'].out);
});
