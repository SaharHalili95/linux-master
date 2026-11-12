(() => {
  const colors = Object.freeze([
    Object.freeze({ id: 'auto', label: Object.freeze({ he: 'לפי דרגה', en: 'By rank' }), accent: null }),
    Object.freeze({ id: 'mint', label: Object.freeze({ he: 'מנטה', en: 'Mint' }), accent: '#8bf0cf' }),
    Object.freeze({ id: 'cyan', label: Object.freeze({ he: 'תכלת', en: 'Cyan' }), accent: '#6de5ff' }),
    Object.freeze({ id: 'violet', label: Object.freeze({ he: 'סגול', en: 'Violet' }), accent: '#c0a2ff' })
  ]);
  const forms = Object.freeze([
    Object.freeze({ id: 'core', label: Object.freeze({ he: 'ליבה', en: 'Core' }) }),
    Object.freeze({ id: 'scout', label: Object.freeze({ he: 'סייר', en: 'Scout' }) }),
    Object.freeze({ id: 'guardian', label: Object.freeze({ he: 'שומר', en: 'Guardian' }) })
  ]);
  let instance = 0;
  function normalizeForm(value) {
    return forms.some(form => form.id === value) ? value : forms[0].id;
  }
  function normalize(value) {
    return colors.some(color => color.id === value) ? value : colors[0].id;
  }
  function render(container, selected, lang, onSelect) {
    const language = lang === 'he' ? 'he' : 'en';
    const current = normalize(selected);
    const group = document.createElement('fieldset');
    group.className = 'avatar-options';
    const legend = document.createElement('legend');
    legend.textContent = language === 'he' ? 'צבע הדמות' : 'Character color';
    group.append(legend);
    const list = document.createElement('div');
    list.className = 'avatar-options__list';
    const name = `avatar-color-${++instance}`;
    for (const color of colors) {
      const label = document.createElement('label');
      label.className = 'avatar-options__choice';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.value = color.id;
      input.checked = color.id === current;
      input.addEventListener('change', () => { if (input.checked) onSelect(color.id); });
      const marker = document.createElement('span');
      marker.className = 'avatar-options__marker';
      if (color.accent) marker.style.setProperty('--avatar-option-color', color.accent);
      else marker.classList.add('avatar-options__marker--auto');
      marker.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span');
      text.textContent = color.label[language];
      label.append(input, marker, text);
      list.append(label);
    }
    group.append(list);
    container.replaceChildren(group);
  }
  function renderForms(container, selected, lang, onSelect, preview) {
    const language = lang === 'he' ? 'he' : 'en';
    const current = normalizeForm(selected);
    const group = document.createElement('fieldset');
    group.className = 'avatar-options avatar-options--forms';
    const legend = document.createElement('legend');
    legend.textContent = language === 'he' ? 'דמות' : 'Character form';
    group.append(legend);
    const list = document.createElement('div');
    list.className = 'avatar-options__list';
    const name = `avatar-form-${++instance}`;
    for (const form of forms) {
      const label = document.createElement('label');
      label.className = 'avatar-options__choice';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.value = form.id;
      input.checked = form.id === current;
      input.addEventListener('change', () => { if (input.checked) onSelect(form.id); });
      const text = document.createElement('span');
      text.textContent = form.label[language];
      label.append(input);
      if (typeof preview === 'function') {
        const art = document.createElement('span');
        art.className = 'avatar-options__preview';
        art.dataset.formPreview = form.id;
        art.setAttribute('aria-hidden', 'true');
        art.innerHTML = preview(form.id);
        label.append(art);
      }
      label.append(text);
      list.append(label);
    }
    group.append(list);
    container.replaceChildren(group);
  }
  window.AvatarOptions = Object.freeze({ colors, forms, normalize, normalizeForm, render, renderForms });
})();
