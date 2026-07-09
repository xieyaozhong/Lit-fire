'use strict';

(() => {
  if (window.__flameCountPriorityLoaded) return;
  window.__flameCountPriorityLoaded = true;

  const originalFetch = window.fetch.bind(window);

  const BLUE_PARTY = {
    type: 'blue-party',
    name: '歸藍趴火',
    rarity: 'epic',
    rarityLabel: '罕見',
    rarityRank: 3,
    colors: ['#effcff', '#6ee7ff', '#147cff', '#2720a8'],
    sigil: '♬',
    description: '它一明一滅地召集失散的節拍，讓快樂不再只屬於一個人。象徵重新歸隊、共享歡樂，以及與夥伴再次連結。'
  };

  const PURE_SPARK = {
    type: 'pure-spark',
    name: '純正星火',
    rarity: 'special',
    rarityLabel: '特殊',
    rarityRank: 4,
    colors: ['#ffffff', '#fff7c7', '#ffd95e', '#ff8b35'],
    sigil: '✧',
    description: '四段近乎無誤的節奏彼此咬合，凝成不受雜質干擾的金白星芒。象徵純粹的初心、堅定的信念，以及把最真實的光傳向遠方。'
  };

  const SPARK_FALLBACK = {
    type: 'spark',
    name: '星火',
    rarity: 'common',
    rarityLabel: '常見',
    rarityRank: 1,
    colors: ['#ffffff', '#ffe47d', '#ff9d42', '#e64535'],
    sigil: '✦',
    description: '它也許微小，卻足以成為一段故事、一個選擇或一次改變的起點。象徵靈感、開始，以及把光傳往更遠地方的可能。'
  };

  function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function spread(values) {
    return values.length ? Math.max(...values) / Math.max(1, Math.min(...values)) : 1;
  }

  function isWithin(values, min, max, ratio) {
    return values.length > 0
      && values.every((value) => Number.isFinite(value) && value >= min && value <= max)
      && spread(values) <= ratio;
  }

  function qualifiesPureSpark(flame) {
    const rhythm = Array.isArray(flame?.rhythm) ? flame.rhythm.map(Number) : [];
    if (Number(flame?.tapCount) !== 11 || rhythm.length !== 10) return false;

    // Eleven taps use four groups: 2 → pause → 3 → pause → 4 → pause → 2.
    const pauses = [rhythm[1], rhythm[4], rhythm[8]];
    const shortBeats = [rhythm[0], rhythm[2], rhythm[3], rhythm[5], rhythm[6], rhythm[7], rhythm[9]];
    const total = rhythm.reduce((sum, value) => sum + value, 0);

    return isWithin(pauses, 380, 980, 1.8)
      && isWithin(shortBeats, 45, 210, 2)
      && mean(shortBeats) <= 160
      && mean(pauses) >= mean(shortBeats) * 2.2
      && total >= 1700
      && total <= 5000;
  }

  function applyPriority(flame) {
    const tapCount = Number(flame?.tapCount);

    // Nine taps remain a guaranteed Blue Party flame.
    if (tapCount === 9) {
      return {
        ...flame,
        ...BLUE_PARTY,
        tapCount,
        specialFlame: true,
        priorityByTapCount: true,
        priorityRule: '9-tap-guaranteed'
      };
    }

    // Eleven taps receive Pure Spark priority only after passing its rhythm signature.
    if (qualifiesPureSpark(flame)) {
      return {
        ...flame,
        ...PURE_SPARK,
        tapCount,
        specialFlame: true,
        priorityByTapCount: true,
        priorityRule: '11-tap-qualified'
      };
    }

    // Retire the former twelve-tap Pure Spark trigger.
    if (tapCount === 12 && flame?.type === 'pure-spark') {
      return {
        ...flame,
        ...SPARK_FALLBACK,
        tapCount,
        specialFlame: false,
        priorityByTapCount: false,
        priorityRule: '12-tap-pure-spark-retired'
      };
    }

    return flame;
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
