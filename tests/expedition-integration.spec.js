const { test, expect } = require('@playwright/test');

test('expedition state rejects corrupt records without manufacturing achievements', async ({ page }) => {
  await page.goto('./prototype/');
  const states = await page.evaluate(() => [
    loadState(JSON.stringify({ xp: 150, done: ['L0'], worldGear: 3, worldGearUpdatedAt: 20, expeditionBests: { '1:explore': 0, '2:streak': 4, '3:streak': 999, '11:explore': 3, '1:other': 2, '4:explore': -1 } })),
    loadState(JSON.stringify({ worldGear: 99, worldGearUpdatedAt: 999, expeditionBests: [] }))
  ]);
  expect(states[0]).toMatchObject({ xp: 150, done: ['L0'], worldGear: 3, worldGearUpdatedAt: 20, expeditionBests: { '1:explore': 0, '2:streak': 4 } });
  expect(Object.keys(states[0].expeditionBests)).toHaveLength(2);
  expect(states[1]).toMatchObject({ worldGear: 0, worldGearUpdatedAt: 0, expeditionBests: {} });
});

test('merging expedition records keeps bests and a valid explicit unequip choice', async ({ page }) => {
  await page.goto('./prototype/');
  const results = await page.evaluate(() => {
    const a = { worldGear: 3, worldGearUpdatedAt: 10, expeditionBests: { '1:explore': 2, '2:streak': 4 } };
    const b = { worldGear: 0, worldGearUpdatedAt: 20, expeditionBests: { '1:explore': 1, '3:explore': 0, '2:streak': 999 } };
    const corrupt = { worldGear: -1, worldGearUpdatedAt: 999 };
    return [mergeProgress(a, b), mergeProgress(b, a), mergeProgress(a, corrupt)];
  });
  for (const result of results.slice(0, 2)) expect(result).toMatchObject({ worldGear: 0, worldGearUpdatedAt: 20, expeditionBests: { '1:explore': 2, '2:streak': 4, '3:explore': 0 } });
  expect(results[2]).toMatchObject({ worldGear: 3, worldGearUpdatedAt: 10 });
});

async function seed(page) {
  await page.goto('./prototype/'); await page.waitForFunction(() => window.courseReady);
  await page.evaluate(() => { S.done = ['L0']; S.sound = false; S.xp = 150; S.gems = 7; });
}
test('expedition completion preserves canonical IDs and isolates rewards', async ({ page }) => {
  await seed(page);
  const result = await page.evaluate(() => {
    startExpedition(1, 'explore');
    const ids = [L.ex, ...L.queue].map(ex => ex.uid);
    const before = JSON.stringify([S.xp,S.gems,S.done,S.lives,S.quests]);
    for (let i=0;i<3;i++) { answer(true); next(); }
    finishLesson();
    return {ids,best:S.expeditionBests['1:explore'],before,after:JSON.stringify([S.xp,S.gems,S.done,S.lives,S.quests])};
  });
  expect(result.ids.every(id => /^L0\.[0-9]+$/.test(id))).toBe(true);
  expect(new Set(result.ids).size).toBe(3); expect(result.best).toBe(3);
  expect(result.after).toBe(result.before);
  await expect(page.locator('#expeditionResult')).toBeVisible(); await expect(page.locator('#endXp')).toHaveText('0');
});
test('expedition retries cannot improve first attempt scores', async ({ page }) => {
  await seed(page);
  const result=await page.evaluate(() => {
    startExpedition(1,'explore');const missed=L.ex.uid;
    answer(false);next();answer(true);next();answer(true);next();
    const retry={uid:L.ex.uid,retry:L.ex.retry};answer(true);next();
    return {missed,retry,best:S.expeditionBests['1:explore'],lives:S.lives};
  });
  expect(result.retry).toEqual({uid:result.missed,retry:true});expect(result.best).toBe(2);expect(result.lives).toBe(5);
});
test('quitting an expedition creates no record and leaves normal lessons independent', async ({ page }) => {
  await seed(page);
  const result=await page.evaluate(() => {
    startExpedition(1,'explore');answer(true);closeOverlays();
    const record=Object.hasOwn(S.expeditionBests,'1:explore');
    startLesson('L0',withFixture(COURSE[0],COURSE[0].lessons[0].exercises),{});
    return {record,uid:L.ex.uid,expedition:!!L.opts.expedition};
  });
  expect(result).toEqual({record:false,uid:'L0.0',expedition:false});
  await expect(page.locator('#expeditionHud')).toBeHidden();
});

test('world progression unlocks the Streak run and earned equipment survives reload', async ({ page }) => {
  await seed(page);
  await page.locator('[data-tab="quests"]').click();
  await expect(page.locator('#expeditionStart')).toBeEnabled();
  await expect(page.locator('#expeditionModeStreak')).toBeDisabled();
  await page.evaluate(() => { S.done=COURSE.filter(u=>u.section===1).flatMap(u=>unitNodes(u).filter(n=>n.kind==='lesson').map(n=>n.key)).slice(0,10);save();showTab('quests'); });
  await expect(page.locator('#expeditionModeStreak')).toBeEnabled();
  await page.locator('#expeditionModeStreak').check();await page.locator('#expeditionStart').click();
  expect(await page.evaluate(()=>L.total)).toBe(5);
  await page.evaluate(()=>closeOverlays());await page.locator('[data-tab="profile"]').click();
  await page.locator('#expeditionGear1').check();await page.locator('#avatarPicker input[value="cyan"]').check();
  expect(await page.locator('[data-form-preview] .character-hero').evaluateAll(nodes=>nodes.map(n=>n.dataset.form))).toEqual(['core','scout','guardian']);
  await expect(page.locator('#profileMascot .character-hero')).toHaveAttribute('data-world-gear','1');
  await page.reload();await page.waitForFunction(()=>window.courseReady);await page.locator('[data-tab="profile"]').click();
  await expect(page.locator('#expeditionGear1')).toBeChecked();
  await expect(page.locator('#profileMascot .character-hero')).toHaveAttribute('data-world-gear','1');
});

test('an incorrect match affects only that expedition objective', async ({ page }) => {
  await seed(page);
  await page.evaluate(() => {
    S.done=COURSE.filter(u=>u.section===1).flatMap(u=>unitNodes(u).map(n=>n.key));
    const exercises=WorldExpeditions.pool(COURSE,S.done,1,unitNodes,withFixture).filter(ex=>ex.type==='match').slice(0,3);
    if(exercises.length!==3)throw Error('Need three real match exercises');
    startLesson('expedition-1',exercises,{practice:true,expedition:{section:1,mode:'explore',count:3,uids:exercises.map(ex=>ex.uid),results:{},finished:false}});
    const a=document.querySelector('.pair.cmd');a.click();[...document.querySelectorAll('.pair.mean')].find(b=>b.dataset.key!==a.dataset.key).click();
  });
  for(let i=0;i<3;i++) {
    await page.evaluate(()=>{for(const [key] of L.ex.pairs){document.querySelectorAll('.pair.cmd').forEach(b=>{if(b.dataset.key===key)b.click();});document.querySelectorAll('.pair.mean').forEach(b=>{if(b.dataset.key===key)b.click();});}});
    await page.locator('#checkBtn').click();
  }
  expect(await page.evaluate(()=>S.expeditionBests['1:explore'])).toBe(2);
});

for(const file of ['world-expeditions.js','expedition-ui.js','expedition-play.js']) test(`missing ${file} keeps saved gear, records and the learning path`, async ({page})=>{
  await page.route(`**/prototype/${file}*`,route=>route.abort());
  await page.addInitScript(()=>localStorage.setItem('linux-master-proto',JSON.stringify({xp:150,done:['L0'],worldGear:1,worldGearUpdatedAt:10,expeditionBests:{'1:explore':2},sound:false})));
  await page.goto('./prototype/');
  await expect(page.locator('.node.current').first()).toBeVisible();
  expect(await page.evaluate(()=>[S.xp,S.done,S.worldGear,S.expeditionBests])).toEqual([150,['L0'],1,{'1:explore':2}]);
  await page.locator('[data-tab="quests"]').click();await expect(page.locator('#expeditionBoard')).toContainText('רעננו');
  await page.locator('[data-tab="learn"]').click();await page.locator('.node.current').first().click();await page.locator('#pop .btn.primary').click();await expect(page.locator('#lesson')).toBeVisible();
});

for(const lang of ['he','en']) test(`integrated expedition and equipment UI is accessible at 320px (${lang})`,async({page})=>{
  const AxeBuilder=require('@axe-core/playwright').default;
  await page.setViewportSize({width:320,height:568});await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(lang=>localStorage.setItem('lang',lang),lang);await seed(page);
  for(const tab of ['quests','profile']) {
    await page.locator(`[data-tab="${tab}"]`).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  }
});
