(() => {
  const characters = Object.freeze({
    explorer: Object.freeze({ asset: 'character-art/explorer.webp' }),
    reader: Object.freeze({ asset: 'character-art/reader.webp' }),
    courier: Object.freeze({ asset: 'character-art/courier.webp' }),
    scout: Object.freeze({ asset: 'character-art/scout.webp' }),
    engineer: Object.freeze({ asset: 'character-art/engineer.webp' }),
    analyst: Object.freeze({ asset: 'character-art/analyst.webp' })
  });
  const worldRoles = Object.freeze({ 1: 'explorer', 2: 'analyst', 3: 'courier', 4: 'engineer', 5: 'courier', 6: 'scout', 7: 'engineer', 8: 'scout', 9: 'reader', 10: 'engineer', 11: 'reader' });
  const unitRoles = Object.freeze({
    2: 'reader', 3: 'courier', 4: 'scout', 5: 'engineer', 6: 'analyst', 7: 'analyst', 8: 'reader', 10: 'engineer',
    16: 'engineer', 17: 'reader', 18: 'reader', 20: 'courier',
    22: 'scout', 23: 'scout', 24: 'scout', 26: 'scout', 32: 'scout',
    33: 'scout', 34: 'scout', 35: 'scout', 40: 'reader',
    50: 'engineer', 58: 'courier', 76: 'engineer', 77: 'engineer',
    81: 'reader', 83: 'courier', 85: 'courier', 87: 'courier', 88: 'scout', 92: 'scout', 93: 'scout', 95: 'analyst', 96: 'scout'
  });
  function roleFor(unit) {
    return unitRoles[unit?.unit] || worldRoles[unit?.section] || 'explorer';
  }
  const assetPaths = () => Object.values(characters).map(character => character.asset);
  window.worldCharacterCatalog = Object.freeze({ characters, roleFor, assetPaths });
  window.worldCharacter = unit => `<img class="world-character-art" src="${characters[roleFor(unit)].asset}" loading="lazy" decoding="async" alt="" aria-hidden="true">`;
})();
