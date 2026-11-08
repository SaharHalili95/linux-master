// Combines the progress of two devices for one learner. Nothing a learner earned is ever dropped.
const union = (a = [], b = []) => [...new Set([...a, ...b])];
function mergeQuests(a = {}, b = {}) {
  if (a.day !== b.day) return (a.day || '') > (b.day || '') ? a : b;
  return { day: a.day, xp: Math.max(a.xp || 0, b.xp || 0), perfect: Math.max(a.perfect || 0, b.perfect || 0), combo: Math.max(a.combo || 0, b.combo || 0), claimed: union(a.claimed, b.claimed) };
}
function mergeProgress(a, b) {
  const latest = (b.lastDay || '') > (a.lastDay || '') ? b : a;
  const sameDay = (a.lastDay || '') === (b.lastDay || '');
  return {
    xp: Math.max(a.xp || 0, b.xp || 0),
    gems: Math.max(a.gems || 0, b.gems || 0),
    done: union(a.done, b.done),
    days: union(a.days, b.days),
    mistakes: union(a.mistakes, b.mistakes),
    lastDay: latest.lastDay ?? null,
    streak: sameDay ? Math.max(a.streak || 0, b.streak || 0) : latest.streak || 0,
    track: latest.track || a.track || b.track || '',
    quests: mergeQuests(a.quests, b.quests),
  };
}
