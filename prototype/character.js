/* global S, rankOf, COURSE, unitNodes */
(() => {
  let serial = 0;
  const worldGear = [
    '',
    '<circle cx="12" cy="12" r="8"/><path d="m16 8-2 6-6 2 2-6Z" fill="currentColor"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3"/>',
    '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 8h6m-6 4h4"/>',
    '<path d="M5 3h8l4 4v6H5Zm8 0v5h4"/><circle cx="15" cy="16" r="3"/><path d="m12 18-4 4m1-1-2-2"/>',
    '<rect x="5" y="5" width="14" height="14" rx="4"/><path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
    '<path d="M7 7V5q5-5 10 0v2M3 7h18v14H3Zm0 2 9 5 9-5"/><path d="M10 12h4v5h-4Z" fill="currentColor"/>',
    '<path d="M12 10v11m-5 0h10M6 6q-6 5 0 10M18 6q6 5 0 10M9 9q-3 2 0 4m6-4q3 2 0 4"/><circle cx="12" cy="5" r="2" fill="currentColor"/>',
    '<path d="m6 4-4 4 4 4m12-8 4 4-4 4M14 3l-4 10m-4 5 4-2 4 2 4-2m-8 0v5m4-3v3"/>',
    '<path d="m12 2 9 4v6q-1 7-9 10-8-3-9-10V6Z"/><path d="m8 12 3 3 5-6"/>',
    '<path d="m12 2 9 6v9l-9 5-9-5V8Zm-9 6 9 5 9-5m-9 5v9m-5-12 10-5"/>',
    '<path d="m8 21 2-10h4l2 10ZM6 21h12M7 5l-4-2m14 2 4-2M12 1v3M4 10H1m22 0h-3"/><circle cx="12" cy="8" r="3" fill="currentColor"/>'
  ];
  function worldGearIcon(section) {
    if (!Number.isInteger(section) || section < 1 || section > 10) return '';
    return `<svg class="world-gear-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${worldGear[section]}</svg>`;
  }
  function character(mood = 'idle', level = rankOf(S.xp).level, formOverride) {
    const id = `hero-${++serial}`;
    const requestedForm = formOverride === undefined ? S.avatarForm : formOverride;
    const form = ['core', 'scout', 'guardian'].includes(requestedForm) ? requestedForm : 'core';
    const heads = { core: 'M24 20q5-8 26-8t26 8l4 22q-1 11-14 14H34Q21 53 20 42Z', scout: 'M31 17Q50 5 69 17l5 20-8 13-16 7-16-7-8-13Z', guardian: 'M22 18Q50 8 78 18l7 12v14L74 57H26L15 44V30Z' };
    const shells = { core: 'm31 53 19-4 19 4-6 24-13 5-13-5Z', scout: 'm37 53 13-4 13 4-4 22-9 6-9-6Z', guardian: 'M25 54q25-8 50 0l-4 22-21 9-21-9Z' };
    const silhouette = form === 'scout'
      ? `<g class="hero-form-kit" data-form-kit="explorer"><path d="M29 51 20 57l3 23 10-4M68 53l9 4-2 19-9-4" fill="#253950" stroke="#8dabc0" stroke-width="1.5"/><path d="M32 23 27 9l-7-4" fill="none" stroke="#a7c6d7" stroke-width="2.4"/><circle cx="20" cy="5" r="2.5" fill="var(--hero-accent)"/><path d="m35 52-12 3-8 11 17-5 11-8" fill="var(--hero-accent)" stroke="#1c3546" stroke-width="1.2"/></g>`
      : form === 'guardian'
        ? `<g class="hero-form-kit" data-form-kit="protector"><path d="M28 49 17 48 8 56l4 17 18 2m42-26 11-1 9 8-4 17-18 2" fill="#304a60" stroke="#abc3d2" stroke-width="1.8"/><path d="m12 57 7-4 8 2m46 0 8-2 7 4" fill="none" stroke="var(--hero-accent)" stroke-width="2.5"/></g>` : '';
    const avatar = S.avatarStyle || 'auto';
    const chosen = window.AvatarOptions?.colors.find(color => color.id === avatar);
    const accent = chosen?.accent || (level >= 11 ? '#ffd36e' : level >= 9 ? '#ff8edb' : level >= 7 ? '#c0a2ff' : level >= 5 ? '#6de5ff' : '#8bf0cf');
    const eyes = mood === 'sad' ? '<rect x="34" y="31" width="9" height="10" rx="4"/><rect x="57" y="31" width="9" height="10" rx="4"/><path d="M43 44q7 3 14 0"/>' : mood === 'party' ? '<path d="m34 37 5-4 5 4m12 0 5-4 5 4M43 43q7 10 14 0"/>' : `<rect x="34" y="31" width="9" height="10" rx="4"/><rect x="57" y="31" width="9" height="10" rx="4"/>${mood === 'happy' ? '<path d="M43 44q7 6 14 0"/>' : '<path d="M45 45h10"/>'}`;
    const gear = (min, name, shape) => level >= min ? `<g data-equipment="${name}">${shape}</g>` : '';
    const back = gear(3, 'power-pack', `<path d="M28 57 21 60v17l10 4m41-24 7 3v17l-10 4" fill="#253950" stroke="${accent}" stroke-width="1.5"/>`)
      + gear(9, 'signal-fins', `<path d="m24 57-14-9 7 20m59-11 14-9-7 20" fill="#23334b" stroke="${accent}" stroke-width="1.8"/>`)
      + gear(10, 'cape', '<path d="m32 55-8 35 13-4 13 7 13-7 13 4-8-35" fill="#463154" stroke="#9675bc" stroke-width="1.2"/>')
      + gear(11, 'orbit', `<ellipse cx="50" cy="57" rx="46" ry="29" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="2 7" opacity=".65"/>`);
    const front = gear(2, 'antenna', `<path d="M50 13V6" stroke="${accent}" stroke-width="2.2"/><circle cx="50" cy="5" r="3" fill="${accent}"/>`)
      + gear(4, 'headset', `<path d="M19 31q0-20 31-20t31 20" fill="none" stroke="#8facc4" stroke-width="3"/><rect x="15" y="30" width="8" height="19" rx="4" fill="#274257" stroke="${accent}"/><rect x="77" y="30" width="8" height="19" rx="4" fill="#274257" stroke="${accent}"/><path d="m81 48-5 6h-8" fill="none" stroke="${accent}" stroke-width="2"/>`)
      + gear(5, 'gauntlets', `<g fill="#345366" stroke="${accent}" stroke-width="1.2"><path d="m14 66 8-3 5 9-8 5-6-5Z"/><path d="m86 66-8-3-5 9 8 5 6-5Z"/></g>`)
      + gear(6, 'visor-hud', `<path d="M30 28h8m-8 0v5m40-5h-8m8 0v5M31 48h7m31 0h-7" fill="none" stroke="${accent}" stroke-width="1" opacity=".9"/>`)
      + gear(7, 'shoulder-plates', `<path d="m25 56 10-3 3 8-11 5-6-4Zm50 0-10-3-3 8 11 5 6-4Z" fill="#3f526d" stroke="${accent}" stroke-width="1.3"/>`)
      + gear(8, 'core-badge', '<path d="m50 61 6 4v7l-6 4-6-4v-7Z" fill="#173139" stroke="#ffd36e" stroke-width="1.5"/><path d="m51 64-4 5h4l-2 4 5-6h-4Z" fill="#ffd36e"/>')
      + gear(12, 'crown', '<path d="m30 15-3-11 13 6 10-9 10 9 13-6-3 11Z" fill="#e5b65c" stroke="#ffefbd" stroke-width="1.3"/><circle cx="50" cy="8" r="2" fill="#a5f5ff"/>');
    const selectedGear = S.worldGear;
    const earnedGear = Number.isInteger(selectedGear) && selectedGear >= 1 && selectedGear <= 10
      && window.WorldExpeditions?.unlockedGear(COURSE, S.done, !!window.courseReady, unitNodes).some(item => item.section === selectedGear);
    const worldEquipment = earnedGear ? `<g class="hero-world-gear" data-world-gear="${selectedGear}" transform="translate(71 66)"><path d="M-2 3Q12-5 26 3v19Q12 30-2 22Z" fill="#122535" stroke="${accent}" stroke-width="1.4"/><g fill="none" stroke="${accent}" color="${accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${worldGear[selectedGear]}</g></g>` : '';
    return `<svg class="mascot character-hero ${mood}" data-mood="${mood}" data-rank="${level}" data-avatar="${avatar}" data-form="${form}" data-world-gear="${earnedGear ? selectedGear : 0}" viewBox="0 0 100 100" aria-hidden="true" style="--hero-accent:${accent}">
      <defs><linearGradient id="${id}-metal" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#6e8a9f"/><stop offset=".2" stop-color="#354b63"/><stop offset="1" stop-color="#131e32"/></linearGradient><linearGradient id="${id}-visor" x2=".4" y2="1"><stop stop-color="#14283a"/><stop offset="1" stop-color="#060d19"/></linearGradient><linearGradient id="${id}-edge" x2=".8" y2="1"><stop stop-color="#d9f8ff"/><stop offset=".45" stop-color="${accent}"/><stop offset="1" stop-color="#3e6378"/></linearGradient></defs>
      <ellipse cx="50" cy="94" rx="24" ry="3" fill="#000" opacity=".24"/>${back}${silhouette}
      <g class="hero-legs" transform="${form === 'scout' ? 'translate(5 -6) scale(.9 1.06)' : form === 'guardian' ? 'translate(-5 0) scale(1.1 1)' : ''}"><path d="m35 75-2 11h14l1-11m17 0 2 11H53l-1-11" fill="url(#${id}-metal)" stroke="#7e9cb0" stroke-width="1.1"/><path d="M31 85h17v7H29v-3Zm21 0h17l2 4v3H52Z" fill="#17283c" stroke="#7695ab" stroke-width="1.2"/><path d="M33 89h10m14 0h10" stroke="${accent}" stroke-width="1.5"/></g>
      <g class="hero-arm hero-arm-left"><path d="m28 57-9 5-3 9 6 5 6-7 7-7" fill="url(#${id}-metal)" stroke="#94aebf" stroke-width="1.3"/><path d="m17 70 7 4-3 5-7-4Z" fill="#152536" stroke="${accent}" stroke-width="1.2"/></g>
      <g class="hero-arm hero-arm-right"><path d="m72 57 9 5 3 9-6 5-6-7-7-7" fill="url(#${id}-metal)" stroke="#94aebf" stroke-width="1.3"/><path d="m83 70-7 4 3 5 7-4Z" fill="#152536" stroke="${accent}" stroke-width="1.2"/></g>
      <g class="hero-torso"><path d="${shells[form]}" fill="url(#${id}-metal)" stroke="#91adbf" stroke-width="1.3"/><path d="${form === 'guardian' ? 'm33 58 17 3 17-3-3 14-14 8-14-8Z' : form === 'scout' ? 'm41 58 9 3 9-3-2 13-7 5-7-5Z' : 'm36 58 14 4 14-4-3 13-11 5-11-5Z'}" fill="#152c3b"/><path d="m44 65 4 4-4 4m9 0h6" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g class="hero-head"><path d="${heads[form]}" fill="url(#${id}-metal)" stroke="url(#${id}-edge)" stroke-width="2"/><path d="${form === 'scout' ? 'm35 21 15-6 15 6' : form === 'guardian' ? 'M26 22q24-7 48 0' : 'm29 21 11-4h20l11 4'}" fill="none" stroke="#b8d2df" stroke-width="1.3" opacity=".8"/><rect x="${form === 'scout' ? 30 : 25}" y="25" width="${form === 'scout' ? 40 : 50}" height="25" rx="${form === 'guardian' ? 6 : 10}" fill="url(#${id}-visor)" stroke="#627e94" stroke-width="1.1"/><path d="M31 27h34l-14 7H29Z" fill="#c3ecff" opacity=".08"/><g class="hero-expression" fill="${accent}" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${eyes}</g><path d="M35 53h30" stroke="${accent}" stroke-opacity=".65" stroke-width="1.4"/><circle cx="23" cy="38" r="1.5" fill="${accent}"/><circle cx="77" cy="38" r="1.5" fill="${accent}"/></g>${front}
      ${worldEquipment}
    </svg>`;
  }
  window.mascot = character;
  window.worldGearIcon = worldGearIcon;
  document.querySelectorAll('.mascot').forEach(node => {
    const mood = ['party', 'sad', 'happy'].find(name => node.classList.contains(name)) || 'idle';
    node.outerHTML = character(mood);
  });
  const foot = document.getElementById('foot'), feedback = document.querySelector('#fbBox .fb-icon');
  function react() {
    const mood = foot.classList.contains('good') ? 'happy' : foot.classList.contains('bad') ? 'sad' : 'idle';
    feedback.classList.add('character-feedback'); feedback.innerHTML = character(mood);
  }
  new MutationObserver(react).observe(foot, { attributes: true, attributeFilter: ['class'] });
  react();
})();
