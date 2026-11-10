(function () {
  'use strict';
  const worlds = {
    1: { color: '#ffb347', shape: '<path d="M30 35 50 19l20 16v35L50 82 30 70Z"/><path d="M40 23v-8m20 8v-8"/>', detail: '<path d="m42 55 5 5-5 5m10 0h8"/>' },
    2: { color: '#ff8a73', shape: '<path d="M28 42q0-23 22-23t22 23v24q-6 16-22 16T28 66Z"/><path d="M26 72q-8-4-8-13m56 13q8-4 8-13"/>', detail: '<path d="M38 57h24M38 63h16"/>' },
    3: { color: '#ffc53d', shape: '<path d="M24 35h20l6 7h26v29H24Z"/><path d="M32 35v-9h36v16"/>', detail: '<rect x="44" y="56" width="12" height="11" rx="2"/><path d="M47 56v-3a3 3 0 0 1 6 0v3"/>' },
    4: { color: '#ff6ec7', shape: '<path d="M24 77V29h10v-9h11v9h10v-9h11v9h10v48Z"/><path d="M33 77V57h34v20"/>', detail: '<path d="M34 61h8l4-7 6 14 4-7h10"/>' },
    5: { color: '#c6f04f', shape: '<path d="M20 51h60L71 75H29Z"/><path d="M35 50V28h30v22M31 28h38l-7-9H38Z"/>', detail: '<path d="M39 45h22M50 34v15"/>' },
    6: { color: '#38e1ff', shape: '<path d="M50 19 73 32v36L50 81 27 68V32Z"/><path d="m36 27-9-9m37 9 9-9M24 18h6m40 0h6"/>', detail: '<circle cx="50" cy="60" r="4"/><circle cx="37" cy="68" r="3"/><circle cx="63" cy="68" r="3"/><path d="m46 62-6 4m14-4 6 4"/>' },
    7: { color: '#ff9a3d', shape: '<path d="M24 75V45l15-10v9l14-9v9l18-11v42Z"/><path d="M28 40V21h10v16M62 36V18h9v20"/>', detail: '<path d="m39 59-5 4 5 4m22-8 5 4-5 4m-7-11-5 14"/>' },
    8: { color: '#ffb02e', shape: '<path d="M50 16 77 27v24q0 20-27 32Q23 71 23 51V27Z"/><path d="M32 30 50 23l18 7"/>', detail: '<path d="m40 62 7 7 14-16"/>' },
    9: { color: '#ff9ec4', shape: '<path d="M25 22q15-5 25 4 10-9 25-4v52q-15-5-25 5-10-10-25-5Z"/><path d="M50 27v52"/>', detail: '<path d="M31 57h12m-12 7h10m16-7h12m-12 7h10"/>' },
    10: { color: '#b79cff', shape: '<path d="M50 14q21 12 21 39L60 70H40L29 53q0-27 21-39Z"/><path d="m29 48-10 15 15-2m37-13 10 15-15-2M43 72l-4 10m18-10 4 10"/>', detail: '<circle cx="50" cy="59" r="6"/><path d="M50 55v8m-4-4h8"/>' },
    11: { color: '#ffc53d', shape: '<path d="M29 23h42v19q0 21-21 27-21-6-21-27Z"/><path d="M29 30H19q0 17 14 19m38-19h10q0 17-14 19M43 69v8h14v-8m-21 9h28"/>', detail: '<path d="m50 51 2 4 5 .7-3.5 3.4.8 4.9-4.3-2.3-4.3 2.3.8-4.9-3.5-3.4 5-.7Z"/>' }
  };
  window.worldCharacter = function (unit) {
    const section = unit && unit.section;
    const unitCharacters = { 1: 1, 2: 9, 3: 3, 4: 6, 5: 7, 6: 2 };
    const topic = `${unit?.title?.en || ''} ${unit?.subtitle?.en || ''}`.toLowerCase();
    const themes = [
      [/mock exam|certification|exam/, 11],
      [/security|firewall|permission|sudo|ssh|encrypt|access|password|selinux|apparmor/, 8],
      [/network|dns|tcp| ip |routing|wireless|http|firewall|ethernet/, 6],
      [/script|bash|shell|programming|condition|loop|variable|automation|cron/, 7],
      [/package|apt|dpkg|dnf|rpm|repositor|install/, 5],
      [/virtual|container|docker|podman|cloud|kubernetes/, 10],
      [/process|systemd|service|boot|kernel|hardware|performance|memory/, 4],
      [/file|director|storage|disk|partition|mount|lvm|raid|filesystem/, 3],
      [/text|grep|sed|awk|pattern|search|regular expression|filter|sort|pipe/, 2],
      [/archive|compress|backup|documentation|help|log|journal/, 9]
    ];
    const matched = themes.find(([pattern]) => pattern.test(topic));
    const index = Number(section) === 1 && unitCharacters[unit.unit] ? unitCharacters[unit.unit] : (matched?.[1] || Math.min(11, Math.max(1, Number(section) || 1)));
    const specialDetails = Number(section) === 1 ? {
      4: '<circle cx="47" cy="59" r="7"/><path d="m52 64 8 8"/>',
      5: '<path d="M37 53h9v8h9v8h9M37 50v6m27 10v6"/>',
      6: '<path d="M39 54h19M39 60h13M39 66h7m13-12v14m-4-4 4 4 4-4"/>'
    } : {};
    const baseWorld = worlds[index] || worlds[1];
    const world = specialDetails[unit && unit.unit] ? { ...baseWorld, detail: specialDetails[unit.unit] } : baseWorld;
    const arms = [
      'M31 48 19 56l-4 10m54-18 12 8 4 10',
      'M31 48 18 43l-7-9m58 14 12-5 8-9',
      'M31 49 19 53l-3 13m53-17 12 4 3 13',
      'M31 50 18 55l-5-5m56 0 13 5 5-5',
      'M31 48 20 54l-8-4m57-2 11 6 8-4',
      'M31 48 20 41l-3-10m52 17 11-7 3-10',
      'M31 48 18 54l-5-3m56-3 13 6 5-3',
      'M31 48 21 52l-5 12m53-16 10 4 5 12',
      'M31 48 19 54l-4 8m54-14 12 6 4 8',
      'M31 49 20 54l-5 10m54-15 11 5 5 10',
      'M31 48 20 39l-5-8m54 17 11-9 5-8'
    ];
    const hands = [[15,66,85,66],[11,34,89,34],[16,66,84,66],[13,50,87,50],[12,50,88,50],[17,31,83,31],[13,51,87,51],[16,64,84,64],[15,62,85,62],[15,64,85,64],[15,31,85,31]];
    const extras = [
      '<path d="M39 27h22l-4-6H43Z"/>',
      '<path d="M36 29q14-11 28 0M35 28l-5 5m35-5 5 5"/>',
      '<path d="M36 28h28l-4-7H40Z"/>',
      '<path d="M38 28v-7l6 4 6-6 6 6 6-4v7"/>',
      '<path d="M34 28q16-10 32 0l-4-8H38Z"/>',
      '<path d="M39 27 34 17m27 10 5-10"/><circle cx="34" cy="16" r="2"/><circle cx="66" cy="16" r="2"/>',
      '<path d="M36 28v-6h28v6M42 22v-5h16v5"/>',
      '<path d="m38 27 12-10 12 10M50 19v8"/>',
      '<path d="M36 27q14-10 28 0M36 29h28"/>',
      '<path d="M34 30q0-17 16-17t16 17M37 27q13-12 26 0"/>',
      '<path d="m36 28-4-10 11 6 7-10 7 10 11-6-4 10"/>'
    ];
    const bodies = [
      'M34 53 41 48h18l7 5-4 21-12 6-12-6Z',
      'M33 56q0-8 17-8t17 8l-3 17q-14 10-28 0Z',
      'M31 53h38v23H31Z',
      'M31 52 50 47l19 5-3 18-16 10-16-10Z',
      'M29 52h42l-6 22-15 6-15-6Z',
      'M50 46 69 57 63 76H37l-6-19Z',
      'M32 52h36v22l-9 6H41l-9-6Z',
      'M30 51 50 47l20 4-4 18-16 12-16-12Z',
      'M32 52q10-5 18 1 8-6 18-1v22q-10-4-18 4-8-8-18-4Z',
      'M50 46q16 6 17 20l-9 13H42L33 66q1-14 17-20Z',
      'M30 50h40l-5 19-15 11-15-11Z'
    ];
    const heads = [
      'M31 34q0-10 10-10h18q10 0 10 10v10q0 10-10 10H41q-10 0-10-10Z',
      'M30 39q0-17 20-17t20 17q0 16-20 16T30 39Z',
      'M30 27h40v27H30Z',
      'M50 22 69 31v17L50 56 31 48V31Z',
      'M29 30q21-13 42 0l-5 20H34Z',
      'M50 20 70 36 64 53H36l-6-17Z',
      'M33 26h34l4 13-4 14H33l-4-14Z',
      'M50 21 71 29l-3 19-18 8-18-8-3-19Z',
      'M30 28q11-5 20 1 9-6 20-1v23q-10-4-20 4-10-8-20-4Z',
      'M50 19q19 2 19 20L62 53H38L31 39q0-18 19-20Z',
      'M29 27h42l-4 20-17 10-17-10Z'
    ];
    const eyes = index === 2 || index === 9 ? '<path d="M40 42q3-3 6 0m8 0q3-3 6 0" fill="none" stroke="#a2f6dd" stroke-width="2.5"/>' : index === 11 ? '<path d="m40 43 3-3 3 3m8 0 3-3 3 3" fill="none" stroke="#a2f6dd" stroke-width="2.5"/>' : '<circle cx="43" cy="42" r="3"/><circle cx="57" cy="42" r="3"/>';
    return `<svg class="world-character" viewBox="0 0 100 100" aria-hidden="true" focusable="false" style="--world-character-accent:${world.color}"><g transform="translate(18 19) scale(.64)" opacity=".48" fill="#142b3a" stroke="${world.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${world.shape}</g><g fill="none" stroke="#66899a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="${arms[index - 1]}"/><path d="M42 72 39 84h-6m25-12 3 12h6"/></g><g fill="#183347" stroke="${world.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="${hands[index - 1][0]}" cy="${hands[index - 1][1]}" r="4"/><circle cx="${hands[index - 1][2]}" cy="${hands[index - 1][3]}" r="4"/><path d="${bodies[index - 1]}"/><path d="${heads[index - 1]}"/>${extras[index - 1]}</g><rect x="35" y="34" width="30" height="16" rx="7" fill="#091927"/><g fill="#a2f6dd">${eyes}</g><path d="M46 47q4 3 8 0" fill="none" stroke="#a2f6dd" stroke-width="1.5" stroke-linecap="round"/><g transform="translate(25 29) scale(.5)" fill="none" stroke="${world.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${world.detail}</g></svg>`;
  };
}());
