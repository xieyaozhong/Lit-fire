'use strict';

(() => {
  const HEART_FLAME = {
    type: 'heart',
    name: '心願火',
    description: '兩組溫柔的三連拍，中間留下一次呼吸，點燃柔亮的粉紅火光；象徵溫柔、勇敢表達，以及把真心傳給重要的人。',
    colors: ['#fff2f8', '#ffadd2', '#ff5ca8', '#9b245f'],
    sigil: '♡'
  };

  const SYMBOLIC_MEANINGS = {
    恆星火: '穩定而持續的節拍，像守住約定的橙紅火光；象徵守護、可靠，以及願意長久陪伴的承諾。',
    疾風火: '快速密集的節奏，點燃清亮而銳利的藍色火焰；象徵行動、突破，以及迎向改變的勇氣。',
    夢燼: '緩慢留白的節奏，形成安靜流動的紫粉火光；象徵想像、療癒，以及在黑暗中仍然保存希望。',
    森靈火: '長短交錯的節奏，像枝葉間跳動的翠綠生命火；象徵成長、復甦，以及與世界重新連結。',
    星火: '帶有切分與驚喜的節奏，迸發金白色的傳承火種；象徵靈感、開始，以及微小光芒也能照亮未來。',
    虹焰: '越點越快的加速節奏，喚醒七彩交織的火焰；象徵多元、自由，以及擁抱完整而真實的自己。',
    霜晶火: '越點越慢的節奏，讓火焰凝結成冷白與冰藍交錯的霜晶；象徵沉澱、清醒，以及在寂靜中守住純粹。',
    雷脈火: '短拍與長停頓交替，如雷光在脈搏間爆裂；象徵覺醒、決斷，以及打破停滯的力量。',
    潮汐火: '先加速再放慢的往返節奏，形成像潮水呼吸般流動的青藍火焰；象徵包容、節奏，以及懂得前進也懂得退讓。',
    心願火: HEART_FLAME.description
  };

  const originalFetch = window.fetch.bind(window);
  const button = document.getElementById('ignitionButton');
  const flameCard = document.getElementById('flameCard');
  const flameName = document.getElementById('flameName');
  const flameDescription = document.getElementById('flameDescription');
  const flameSigil = document.getElementById('flameSigil');

  function mean(values) {
    return values.reduce((total, value) => total + value, 0) / values.length;
  }

  function isHeartRhythm(intervals) {
    if (!Array.isArray(intervals) || intervals.length !== 5) return false;

    const [first, second, breath, fourth, fifth] = intervals;
    const shortIntervals = [first, second, fourth, fifth];
    const averageShort = mean(shortIntervals);
    const shortest = Math.min(...shortIntervals);
    const longest = Math.max(...shortIntervals);
    const leftAverage = mean([first, second]);
    const rightAverage = mean([fourth, fifth]);
    const sideRatio = Math.max(leftAverage, rightAverage) / Math.max(1, Math.min(leftAverage, rightAverage));

    return averageShort >= 100
      && averageShort <= 520
      && longest / Math.max(1, shortest) <= 1.65
      && sideRatio <= 1.38
      && breath >= averageShort * 1.65
      && breath <= averageShort * 4.2;
  }

  function makeHeartFlame(flame) {
    return {
      ...flame,
      type: HEART_FLAME.type,
      name: HEART_FLAME.name,
      colors: HEART_FLAME.colors,
      specialFlame: true,
      symbolicMeaning: '溫柔、勇敢表達，以及把真心傳給重要的人。'
    };
  }

  function getCurrentFlame(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  function applyMeaningCopy() {
    if (!flameName || !flameDescription) return;
    const description = SYMBOLIC_MEANINGS[flameName.textContent.trim()];
    if (description && flameDescription.textContent !== description) {
      flameDescription.textContent = description;
    }
  }

  function applyHeartUi(flame) {
    if (!button) return;

    const isHeart = flame?.type === HEART_FLAME.type || flame?.name === HEART_FLAME.name;
    if (!isHeart) {
      if (button.dataset.flameType === HEART_FLAME.type) delete button.dataset.flameType;
      if (flameCard?.dataset.flameType === HEART_FLAME.type) delete flameCard.dataset.flameType;
      applyMeaningCopy();
      return;
    }

    button.dataset.flameType = HEART_FLAME.type;
    if (flameCard) flameCard.dataset.flameType = HEART_FLAME.type;
    button.style.setProperty('--flame-primary', HEART_FLAME.colors[1]);
    button.style.setProperty('--flame-secondary', HEART_FLAME.colors[2]);
    flameCard?.style.setProperty('--flame-primary', HEART_FLAME.colors[1]);
    flameCard?.style.setProperty('--flame-secondary', HEART_FLAME.colors[2]);
    if (flameName) flameName.textContent = HEART_FLAME.name;
    if (flameDescription) flameDescription.textContent = HEART_FLAME.description;
    if (flameSigil) flameSigil.textContent = HEART_FLAME.sigil;
  }

  function scheduleUiSync(flame) {
    [20, 160, 460, 900].forEach((delay) => {
      window.setTimeout(() => {
        applyHeartUi(flame);
        applyMeaningCopy();
      }, delay);
    });
  }

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame && isHeartRhythm(body.flame.rhythm)) {
          body.flame = makeHeartFlame(body.flame);
          nextInit = { ...init, body: JSON.stringify(body) };
          scheduleUiSync(body.flame);
        }
      } catch {
        // Keep unrelated requests unchanged.
      }
    }

    const response = await originalFetch(input, nextInit);

    response.clone().json().then((payload) => {
      const flame = getCurrentFlame(payload);
      if (flame || payload?.state?.current) scheduleUiSync(flame);
    }).catch(() => {});

    return response;
  };

  if (flameName) {
    new MutationObserver(() => {
      applyMeaningCopy();
      if (flameName.textContent.trim() === HEART_FLAME.name && button?.dataset.flameType !== HEART_FLAME.type) {
        applyHeartUi({ type: HEART_FLAME.type, name: HEART_FLAME.name });
      }
    }).observe(flameName, { childList: true, subtree: true });
  }

  if (button) {
    new MutationObserver(() => {
      if (flameName?.textContent.trim() === HEART_FLAME.name && button.dataset.flameType !== HEART_FLAME.type) {
        applyHeartUi({ type: HEART_FLAME.type, name: HEART_FLAME.name });
      }
    }).observe(button, { attributes: true, attributeFilter: ['data-flame-type', 'class'] });
  }

  const style = document.createElement('style');
  style.textContent = `
    .ignition-button[data-flame-type="heart"] .ignition-ring {
      border-color: rgba(255, 185, 220, 0.86) !important;
      box-shadow: 0 0 34px rgba(255, 92, 168, 0.42), inset 0 0 28px rgba(255, 173, 210, 0.28) !important;
      animation: heart-ring 1.42s ease-in-out infinite !important;
    }

    .ignition-button[data-flame-type="heart"] #persistentFlameCanvas {
      animation: heart-flame 1.42s ease-in-out infinite;
      filter: saturate(1.22) brightness(1.16);
    }

    .ignition-button[data-flame-type="heart"] .ignition-core {
      background:
        radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.28), transparent 15%),
        radial-gradient(circle at 38% 43%, rgba(255, 173, 210, 0.22), transparent 34%),
        radial-gradient(circle at 62% 43%, rgba(255, 92, 168, 0.2), transparent 34%),
        radial-gradient(circle, rgba(96, 21, 60, 0.22), rgba(8, 5, 14, 0.96) 74%) !important;
    }

    .flame-card[data-flame-type="heart"] {
      background: linear-gradient(135deg, rgba(255, 173, 210, 0.15), rgba(255, 92, 168, 0.11), rgba(155, 36, 95, 0.14));
    }

    @keyframes heart-ring {
      0%, 100% { transform: scale(0.99); filter: brightness(1); }
      18% { transform: scale(1.045); filter: brightness(1.32); }
      32% { transform: scale(1); filter: brightness(1.08); }
      48% { transform: scale(1.03); filter: brightness(1.22); }
      68% { transform: scale(0.995); filter: brightness(1.02); }
    }

    @keyframes heart-flame {
      0%, 100% { transform: scale(0.985); filter: saturate(1.15) brightness(1.08); }
      18% { transform: scale(1.04); filter: saturate(1.34) brightness(1.24); }
      32% { transform: scale(1); filter: saturate(1.2) brightness(1.12); }
      48% { transform: scale(1.025); filter: saturate(1.3) brightness(1.2); }
      68% { transform: scale(0.99); filter: saturate(1.18) brightness(1.1); }
    }
  `;
  document.head.appendChild(style);
  applyMeaningCopy();
})();
