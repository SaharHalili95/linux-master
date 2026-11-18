/* global S, rankOf */
(() => {
  let serial = 0;
  function character(mood = 'idle', level = rankOf(S.xp).level) {
    const id = `hero-${++serial}`;
    const form = ['core', 'scout', 'guardian'].includes(S.avatarForm) ? S.avatarForm : 'core';
    const heads = { core: 'M24 20q5-8 26-8t26 8l4 22q-1 11-14 14H34Q21 53 20 42Z', scout: 'M25 21 34 13h32l9 8 5 19-6 12-10 5H36l-10-5-6-12Z', guardian: 'M20 22q3-10 15-10h30q12 0 15 10l3 18-5 12-12 6H34l-12-6-5-12Z' };
    const shells = { core: 'm31 53 19-4 19 4-6 24-13 5-13-5Z', scout: 'm33 53 17-4 17 4-4 22-13 8-13-8Z', guardian: 'm27 53 23-5 23 5-7 24-16 6-16-6Z' };
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
      + gear(5, 'gauntlets', `<path d="m14 66 8-3 5 9-8 5-6-5Zm72 0-8-3-5 9 8 5 6-5Z" fill="#345366" stroke="${accent}" stroke-width="1.2"/>`)
      + gear(6, 'visor-hud', `<path d="M30 28h8m-8 0v5m40-5h-8m8 0v5M31 48h7m31 0h-7" fill="none" stroke="${accent}" stroke-width="1" opacity=".9"/>`)
      + gear(7, 'shoulder-plates', `<path d="m25 56 10-3 3 8-11 5-6-4Zm50 0-10-3-3 8 11 5 6-4Z" fill="#3f526d" stroke="${accent}" stroke-width="1.3"/>`)
      + gear(8, 'core-badge', '<path d="m50 61 6 4v7l-6 4-6-4v-7Z" fill="#173139" stroke="#ffd36e" stroke-width="1.5"/><path d="m51 64-4 5h4l-2 4 5-6h-4Z" fill="#ffd36e"/>')
      + gear(12, 'crown', '<path d="m30 15-3-11 13 6 10-9 10 9 13-6-3 11Z" fill="#e5b65c" stroke="#ffefbd" stroke-width="1.3"/><circle cx="50" cy="8" r="2" fill="#a5f5ff"/>');
    return `<svg class="mascot character-hero ${mood}" data-mood="${mood}" data-rank="${level}" data-avatar="${avatar}" data-form="${form}" viewBox="0 0 100 100" aria-hidden="true" style="--hero-accent:${accent}">
      <defs><linearGradient id="${id}-metal" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#6e8a9f"/><stop offset=".2" stop-color="#354b63"/><stop offset="1" stop-color="#131e32"/></linearGradient><linearGradient id="${id}-visor" x2=".4" y2="1"><stop stop-color="#14283a"/><stop offset="1" stop-color="#060d19"/></linearGradient><linearGradient id="${id}-edge" x2=".8" y2="1"><stop stop-color="#d9f8ff"/><stop offset=".45" stop-color="${accent}"/><stop offset="1" stop-color="#3e6378"/></linearGradient></defs>
      <ellipse cx="50" cy="94" rx="24" ry="3" fill="#000" opacity=".24"/>${back}
      <g class="hero-legs"><path d="m35 75-2 11h14l1-11m17 0 2 11H53l-1-11" fill="url(#${id}-metal)" stroke="#7e9cb0" stroke-width="1.1"/><path d="M31 85h17v7H29v-3Zm21 0h17l2 4v3H52Z" fill="#17283c" stroke="#7695ab" stroke-width="1.2"/><path d="M33 89h10m14 0h10" stroke="${accent}" stroke-width="1.5"/></g>
      <g class="hero-arm hero-arm-left"><path d="m28 57-9 5-3 9 6 5 6-7 7-7" fill="url(#${id}-metal)" stroke="#94aebf" stroke-width="1.3"/><path d="m17 70 7 4-3 5-7-4Z" fill="#152536" stroke="${accent}" stroke-width="1.2"/></g>
      <g class="hero-arm hero-arm-right"><path d="m72 57 9 5 3 9-6 5-6-7-7-7" fill="url(#${id}-metal)" stroke="#94aebf" stroke-width="1.3"/><path d="m83 70-7 4 3 5 7-4Z" fill="#152536" stroke="${accent}" stroke-width="1.2"/></g>
      <g class="hero-torso"><path d="${shells[form]}" fill="url(#${id}-metal)" stroke="#91adbf" stroke-width="1.3"/><path d="m36 58 14 4 14-4-3 13-11 5-11-5Z" fill="#152c3b"/><path d="m44 65 4 4-4 4m9 0h6" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g class="hero-head"><path d="${heads[form]}" fill="url(#${id}-metal)" stroke="url(#${id}-edge)" stroke-width="2"/><path d="m29 21 11-4h20l11 4" fill="none" stroke="#b8d2df" stroke-width="1.3" opacity=".8"/><rect x="25" y="25" width="50" height="25" rx="10" fill="url(#${id}-visor)" stroke="#627e94" stroke-width="1.1"/><path d="M31 27h34l-14 7H29Z" fill="#c3ecff" opacity=".08"/><g class="hero-expression" fill="${accent}" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${eyes}</g><path d="M35 53h30" stroke="${accent}" stroke-opacity=".65" stroke-width="1.4"/><circle cx="23" cy="38" r="1.5" fill="${accent}"/><circle cx="77" cy="38" r="1.5" fill="${accent}"/></g>${front}
    </svg>`;
  }
  window.mascot = character;
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
