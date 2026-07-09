'use strict';

(() => {
  if (window.__flameCountPriorityLoaded) return;
  window.__flameCountPriorityLoaded = true;

  const originalFetch = window.fetch.bind(window);

  const PRIORITY_FLAMES = {
    9: {
      type: 'blue-party',
      name: '歸藍趴火',
      rarity: 'epic',
      rarityLabel: '罕見',
      rarityRank: 3,
      colors: ['#effcff', '#6ee7ff', '#147cff', '#2720a8'],
      sigil: '♬',
      description: '它一明一滅地召集失散的節拍，讓快樂不再只屬於一個人。象徵重新歸隊、共享歡樂，以及與夥伴再次連結。'
    },
    12: {
      type: 'pure-spark',
      name: '純正星火',
      rarity: 'special',
      rarityLabel: '特殊',
      rarityRank: 4,
      colors: ['#ffffff', '#fff7c7', '#ffd95e', '#ff8b35'],
      sigil: '✧',
      description: '四段近乎無誤的節奏彼此咬合，凝成不受雜質干擾的金白星芒。象徵純粹的初心、堅定的信念，以及把最真實的光傳向遠方。'
    }
  };

  function applyPriority(flame) {
    const tapCount = Number(flame?.tapCount);
    const priority = PRIORITY_FLAMES[tapCount];
    if (!priority) return flame;

    return {
      ...flame,
      ...priority,
      tapCount,
      specialFlame: true,
      priorityByTapCount: true,
      priorityRule: `${tapCount}-tap-guaranteed`
    };
  }

  function updateUi(flame) {
    const button = document.getElementById('ignitionButton');
    const card = document.getElementById('flameCard');
    const nameNode = document.getElementById('flameName');
    const descriptionNode = document.getElementById('flameDescription');
    const sigilNode = document.getElementById('flameSigil');
    const badge = document.getElementById('flameRarityBadge');

    const apply = () => {
      if (button) {
        button.dataset.flameType = flame.type;
        button.style.setProperty('--flame-primary', flame.colors[1]);
        button.style.setProperty('--flame-secondary', flame.colors[2]);
      }
      if (card) {
        card.dataset.flameType = flame.type;
        card.style.setProperty('--flame-primary', flame.colors[1]);
        card.style.setProperty('--flame-secondary', flame.colors[2]);
      }
      if (nameNode) nameNode.textContent = flame.name;
      if (descriptionNode) descriptionNode.textContent = flame.description;
      if (sigilNode) sigilNode.textContent = flame.sigil;
      if (badge) {
        badge.hidden = false;
        badge.dataset.rarity = flame.rarity;
        badge.textContent = flame.rarityLabel;
      }
    };

    apply();
    setTimeout(apply, 80);
    setTimeout(apply, 260);
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    let nextInit = init;

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame && typeof body.flame === 'object') {
          const prioritized = applyPriority(body.flame);
          if (prioritized !== body.flame) {
            body.flame = prioritized;
            nextInit = { ...init, body: JSON.stringify(body) };
            updateUi(prioritized);
          }
        }
      } catch {
        // Leave unrelated or malformed requests untouched.
      }
    }

    return originalFetch(input, nextInit);
  };
})();
