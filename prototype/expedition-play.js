/* global $, S, L, COURSE, LANG, REGIONS, unitNodes, withFixture, tr, t, el, icon, startLesson, closeOverlays, showTab, toHere, save, repaintAvatar, rankOf, mascot, winMoment, SFX, confetti, toast */
(() => {
  let choice = { section: 1, mode: 'explore' };
  const words = {
    he: { step: (n,total,score) => `יעד ${n} מתוך ${total} · ${score} הצלחות בניסיון הראשון`, review: 'סבב חיזוק · השיא נקבע בניסיון הראשון', title: 'המסע הושלם', score: (n,total) => `${n} מתוך ${total} יעדים בניסיון הראשון`, first: 'המסע הראשון נשמר', record: 'שיא אישי חדש!', kept: n => `השיא האישי נשמר: ${n}`, retry: 'מסע נוסף', back: 'חזרה למסעות', invalid: 'סיימו את כל יעדי המסע כדי לשמור תוצאה.', unlocked: names => `נפתחו ציוד חדש ומצב רצף: ${names}` },
    en: { step: (n,total,score) => `Objective ${n} of ${total} · ${score} first-attempt successes`, review: 'Reinforcement round · Your first attempts determine the record', title: 'Expedition complete', score: (n,total) => `${n} of ${total} objectives on the first attempt`, first: 'First expedition saved', record: 'New personal best!', kept: n => `Personal best retained: ${n}`, retry: 'Another expedition', back: 'Back to expeditions', invalid: 'Complete every expedition objective to save a result.', unlocked: names => `New equipment and Streak unlocked: ${names}` }
  };
  const text = (key,...args) => { const value=words[LANG === 'en' ? 'en' : 'he'][key]; return typeof value === 'function' ? value(...args) : value; };
  const ready = () => !!window.courseReady && !window.courseLoadFailed;
  function renderBoard() {
    const root=$('expeditionBoard'), model=window.WorldExpeditions, ui=window.ExpeditionUI;
    if (!root) return;
    if (!model || !ui) { root.textContent=t('expeditionsUnavailable'); return; }
    const progress=window.GameProgress?.world(COURSE,S.done,choice.section,ready(),unitNodes);
    const unit=COURSE.find(item=>item.section===choice.section && !item.exam && !item.locked);
    ui.renderBoard(root, {worlds:model.worlds.map(world=>({...world,worldName:REGIONS[world.section].name})), ...choice, progress, poolSize:ready() ? model.pool(COURSE,S.done,choice.section,unitNodes,withFixture).length : 0, bests:S.expeditionBests, lang:LANG, ready:ready(), error:!!window.courseLoadFailed || !window.GameProgress, companionHTML:unit ? window.worldCharacter?.(unit) || '' : '', accent:REGIONS[choice.section]?.accent}, {
      onChange(nextChoice) { choice=nextChoice; renderBoard(); },
      onStart() { start(choice.section,choice.mode); },
      onLearn() { showTab('learn'); toHere(); }
    });
  }
  function renderGear() {
    const root=$('worldEquipment'), model=window.WorldExpeditions, ui=window.ExpeditionUI;
    if (!root) return;
    if (!model || !ui) { root.textContent=t('gearUnavailable'); return; }
    const unlocked=model.unlockedGear(COURSE,S.done,ready(),unitNodes).map(item=>item.section);
    ui.renderGear(root,{worlds:model.worlds.map(world=>({...world,worldName:REGIONS[world.section].name})),unlocked,selected:S.worldGear,lang:LANG,ready:ready(),error:!!window.courseLoadFailed || !window.GameProgress,icon:window.worldGearIcon}, value=>{
      if (value!==0 && !unlocked.includes(value)) return;
      S.worldGear=value; S.worldGearUpdatedAt=Date.now(); save(); repaintAvatar();
    });
  }
  function start(section,mode) {
    const run=window.WorldExpeditions?.prepare(COURSE,S.done,section,mode,ready(),unitNodes,withFixture);
    if (!run) { toast(t('finishFirst')); return false; }
    choice={section,mode}; $('end').hidden=true; $('streakScreen').hidden=true;
    startLesson(`expedition-${section}`,run.exercises,{practice:true,expedition:{section,mode,count:run.count,uids:run.exercises.map(ex=>ex.uid),results:{},finished:false}});
    return true;
  }
  function record(ok) {
    const run=L?.opts.expedition;
    if (!run || run.finished || L.ex.retry || !run.uids.includes(L.ex.uid) || Object.hasOwn(run.results,L.ex.uid)) return;
    run.results[L.ex.uid]=!!ok; updateHud();
  }
  function updateHud() {
    const hud=$('expeditionHud'),run=L?.opts.expedition;
    if (!hud) return;
    hud.hidden=!run;
    if (run) hud.textContent=L.ex.retry ? text('review') : text('step',run.uids.indexOf(L.ex.uid)+1,run.count,Object.values(run.results).filter(Boolean).length);
  }
  function finish() {
    const run=L?.opts.expedition;
    if (!run || run.finished) return;
    run.finished=true;
    if (!run.uids.every(uid=>Object.hasOwn(run.results,uid))) { closeOverlays(); toast(text('invalid')); return; }
    const score=Object.values(run.results).filter(Boolean).length,key=`${run.section}:${run.mode}`,before=S.expeditionBests[key];
    S.expeditionBests[key]=Math.max(before ?? 0,score);save();
    $('lesson').hidden=true;$('end').hidden=false;$('comboTag').textContent='';
    $('endMascot').innerHTML=mascot(score===run.count ? 'party' : 'happy');
    winMoment(run.section,rankOf(S.xp).level,'');$('endTitle').textContent=text('title');
    $('endXp').textContent='0';$('endAcc').textContent=`${Math.round(score/run.count*100)}%`;
    const secs=Math.round((Date.now()-L.start)/1000);$('endTime').textContent=`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
    $('endQuests').textContent=before===undefined ? text('first') : score>before ? text('record') : text('kept',before);
    const result=$('expeditionResult');result.hidden=false;result.replaceChildren();
    const stars=el('div','expedition-stars');stars.setAttribute('aria-hidden','true');
    const earned=score===run.count ? 3 : score>=Math.ceil(run.count*.6) ? 2 : score>0 ? 1 : 0;
    for(let i=0;i<3;i++){const star=icon('star');star.classList.toggle('earned',i<earned);stars.append(star);}
    const retry=el('button','btn ghost',text('retry'));retry.type='button';retry.id='expeditionRetry';retry.onclick=()=>start(run.section,run.mode);
    result.append(stars,el('p','',text('score',score,run.count)),retry);
    $('endBtn').textContent=text('back');$('endBtn').onclick=closeOverlays;
    if(score===run.count){SFX.win();confetti();}$('endBtn').focus();
  }
  function unlockMessage(before) {
    const earned=window.WorldExpeditions?.unlockedGear(COURSE,S.done,ready(),unitNodes).filter(item=>!before.includes(item.section)) || [];
    return earned.length ? text('unlocked',earned.map(item=>tr(item.gearName)).join(', ')) : '';
  }
  window.ExpeditionPlay=Object.freeze({renderBoard,renderGear,start,record,updateHud,finish,unlockMessage});
})();
