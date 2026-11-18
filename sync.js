// Combines the progress of two devices for one learner. Nothing a learner earned is ever dropped.
const union = (a = [], b = []) => [...new Set([...a, ...b])];
function mergeQuests(a = {}, b = {}) {
  if (a.day !== b.day) return (a.day || '') > (b.day || '') ? a : b;
  return { day: a.day, xp: Math.max(a.xp || 0, b.xp || 0), perfect: Math.max(a.perfect || 0, b.perfect || 0), combo: Math.max(a.combo || 0, b.combo || 0), claimed: union(a.claimed, b.claimed) };
}
function mergeProgress(a, b) {
  const latest = (b.lastDay || '') > (a.lastDay || '') ? b : a;
  const sameDay = (a.lastDay || '') === (b.lastDay || '');
  const validAvatar = value => ['auto', 'mint', 'cyan', 'violet'].includes(value) ? value : 'auto';
  const stamp = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  const aa = { style: validAvatar(a.avatarStyle), at: validAvatar(a.avatarStyle) === a.avatarStyle ? stamp(a.avatarUpdatedAt) : 0 }, bb = { style: validAvatar(b.avatarStyle), at: validAvatar(b.avatarStyle) === b.avatarStyle ? stamp(b.avatarUpdatedAt) : 0 };
  const avatar = aa.at === bb.at ? (aa.style >= bb.style ? aa : bb) : aa.at > bb.at ? aa : bb;
  const validForm = value => ['core', 'scout', 'guardian'].includes(value) ? value : 'core';
  const fa = { form: validForm(a.avatarForm), at: validForm(a.avatarForm) === a.avatarForm ? stamp(a.avatarFormUpdatedAt) : 0 }, fb = { form: validForm(b.avatarForm), at: validForm(b.avatarForm) === b.avatarForm ? stamp(b.avatarFormUpdatedAt) : 0 };
  const form = fa.at === fb.at ? (fa.form >= fb.form ? fa : fb) : fa.at > fb.at ? fa : fb;
  return {
    avatarForm: form.form,
    avatarFormUpdatedAt: form.at,
    avatarStyle: avatar.style,
    avatarUpdatedAt: avatar.at,
    xp: Math.max(a.xp || 0, b.xp || 0),
    gems: Math.max(a.gems || 0, b.gems || 0),
    done: union(a.done, b.done),
    days: union(a.days, b.days),
    mistakes: union(a.mistakes, b.mistakes),
    skipped: union(a.skipped, b.skipped),
    lastDay: latest.lastDay ?? null,
    streak: sameDay ? Math.max(a.streak || 0, b.streak || 0) : latest.streak || 0,
    track: latest.track || a.track || b.track || '',
    quests: mergeQuests(a.quests, b.quests),
  };
}
