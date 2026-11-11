(() => {
  const firstUnits = ['explorer', 'reader', 'courier', 'scout', 'engineer', 'analyst'];
  const topics = [
    [/search|find|network|dns|tcp|routing|security|firewall|permission|access|password|ssh/, 'scout'],
    [/pipe|script|shell|automation|systemd|service|process|kernel|hardware|container|virtual/, 'engineer'],
    [/sort|count|cut|filter|data|awk|sed|regular expression/, 'analyst'],
    [/file|director|storage|disk|partition|mount|lvm|raid|package|install|archive|backup/, 'courier'],
    [/read|text|log|journal|documentation|help|exam|certification/, 'reader']
  ];
  window.worldCharacter = unit => {
    const topic = `${unit?.title?.en || ''} ${unit?.subtitle?.en || ''}`.toLowerCase();
    const kind = unit?.section === 1 && firstUnits[unit.unit - 1] || topics.find(([pattern]) => pattern.test(topic))?.[1] || 'explorer';
    return `<img class="world-character-art" src="character-art/${kind}.webp" loading="lazy" decoding="async" alt="" aria-hidden="true">`;
  };
})();
