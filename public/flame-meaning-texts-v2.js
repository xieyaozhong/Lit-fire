'use strict';

(() => {
  if (window.__flameMeaningTextsV2Loaded) return;
  window.__flameMeaningTextsV2Loaded = true;

  const MEANINGS = {
    ember: {
      name: '恆星火',
      description: '它不追逐瞬間的耀眼，而是在一次次穩定節拍中持續燃燒。象徵守護、可靠，以及願意長久陪伴的承諾。',
      symbolicMeaning: '守護、可靠，以及願意長久陪伴的承諾。'
    },
    azure: {
      name: '疾風火',
      description: '它像迎面而來的風，催促人跨出停留已久的那一步。象徵行動、突破，以及面對未知仍選擇前進的勇氣。',
      symbolicMeaning: '行動、突破，以及面對未知仍選擇前進的勇氣。'
    },
    dream: {
      name: '夢燼',
      description: '它在緩慢的留白裡保存尚未熄滅的願望，讓疲憊的心重新找到想像。象徵療癒、夢想，以及黑暗中仍被珍藏的希望。',
      symbolicMeaning: '療癒、夢想，以及黑暗中仍被珍藏的希望。'
    },
    forest: {
      name: '森靈火',
      description: '它隨著長短交錯的節奏生長，像新芽穿過土壤，重新與世界相連。象徵成長、復甦，以及在變化中保持生命力。',
      symbolicMeaning: '成長、復甦，以及在變化中保持生命力。'
    },
    spark: {
      name: '星火',
      description: '它也許微小，卻足以成為一段故事、一個選擇或一次改變的起點。象徵靈感、開始，以及把光傳往更遠地方的可能。',
      symbolicMeaning: '靈感、開始，以及把光傳往更遠地方的可能。'
    },
    rainbow: {
      name: '虹焰',
      description: '它讓不同色彩在同一簇火中共存，不必被迫成為單一模樣。象徵多元、自由，以及坦然擁抱完整而真實的自己。',
      symbolicMeaning: '多元、自由，以及坦然擁抱完整而真實的自己。'
    },
    frost: {
      name: '霜晶火',
      description: '它把躁動凝結成清澈的冰光，使人能在安靜中重新看見真正重要的事。象徵沉澱、清醒，以及不被雜音動搖的純粹。',
      symbolicMeaning: '沉澱、清醒，以及不被雜音動搖的純粹。'
    },
    thunder: {
      name: '雷脈火',
      description: '它在停頓與爆發之間劃出雷光，提醒人不再等待完美時機。象徵覺醒、決斷，以及打破停滯的力量。',
      symbolicMeaning: '覺醒、決斷，以及打破停滯的力量。'
    },
    tide: {
      name: '潮汐火',
      description: '它懂得湧向前方，也懂得退回內心休息，如潮水般保有自己的節奏。象徵包容、平衡，以及進退之間的智慧。',
      symbolicMeaning: '包容、平衡，以及進退之間的智慧。'
    },
    heart: {
      name: '心願火',
      description: '它把沒有說出口的心意凝成柔亮粉光，等待被重要的人看見。象徵真心、溫柔，以及勇敢表達愛與思念。',
      symbolicMeaning: '真心、溫柔，以及勇敢表達愛與思念。'
    },
    dark: {
      name: '黯火',
      description: '它不逃避陰影，而是在最深的黑暗中守住一點不肯消失的核心。象徵直面自己、沉靜蓄力，以及從低谷重新站起。',
      symbolicMeaning: '直面自己、沉靜蓄力，以及從低谷重新站起。'
    },
    'blue-party': {
      name: '歸藍趴火',
      description: '它一明一滅地召集失散的節拍，讓快樂不再只屬於一個人。象徵重新歸隊、共享歡樂，以及與夥伴再次連結。',
      symbolicMeaning: '重新歸隊、共享歡樂，以及與夥伴再次連結。'
    },
    dawn: {
      name: '破曉火',
      description: '它從微弱晨光慢慢變亮，提醒人黑夜再長，也無法阻止新的一天到來。象徵重啟、希望，以及相信黎明終會抵達。',
      symbolicMeaning: '重啟、希望，以及相信黎明終會抵達。'
    },
    echo: {
      name: '回聲火',
      description: '它把曾經說出的心聲送往遠方，再以另一種形式回到身邊。象徵記憶、回應，以及真心終有被聽見的一刻。',
      symbolicMeaning: '記憶、回應，以及真心終有被聽見的一刻。'
    },
    'pure-spark': {
      name: '純正星火',
      description: '四段近乎無誤的節奏彼此咬合，凝成不受雜質干擾的金白星芒。象徵純粹的初心、堅定的信念，以及把最真實的光傳向遠方。',
      symbolicMeaning: '純粹的初心、堅定的信念，以及把最真實的光傳向遠方。'
    }
  };

  const BY_NAME = Object.fromEntries(
    Object.entries(MEANINGS).map(([type, value]) => [value.name, { type, ...value }])
  );

  const originalFetch = window.fetch.bind(window);
  const flameName = document.getElementById('flameName');
  const flameDescription = document.getElementById('flameDescription');

  function resolveMeaning(flame) {
    if (!flame || typeof flame !== 'object') return null;
    const plainName = String(flame.name || '').split('・')[0];
    return MEANINGS[flame.type] || BY_NAME[plainName] || null;
  }

  function variantSuffix(flame) {
    const source = String(flame?.displayName || flame?.name || '');
    const separator = source.indexOf('・');
    return separator >= 0 ? source.slice(separator) : '';
  }

  function updateFlame(flame) {
    const meaning = resolveMeaning(flame);
    if (!meaning) return flame;
    const suffix = variantSuffix(flame);
    const normalizedName = `${meaning.name}${suffix}`;
    return {
      ...flame,
      name: normalizedName,
      displayName: suffix ? normalizedName : flame.displayName,
      description: meaning.description,
      symbolicMeaning: meaning.symbolicMeaning
    };
  }

  function syncVisibleText() {
    if (!flameName || !flameDescription) return;
    const plainName = flameName.textContent.trim().split('・')[0];
    const meaning = BY_NAME[plainName];
    if (!meaning) return;
    if (flameDescription.textContent !== meaning.description) {
      flameDescription.textContent = meaning.description;
    }
  }

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame && typeof body.flame === 'object') {
          body.flame = updateFlame(body.flame);
          nextInit = { ...init, body: JSON.stringify(body) };
        }
      } catch {
        // Leave unrelated requests unchanged.
      }
    }

    const response = await originalFetch(input, nextInit);

    response.clone().json().then((payload) => {
      const flame = payload?.state?.current?.flame || payload?.current?.flame;
      if (flame) {
        const meaning = resolveMeaning(flame);
        if (meaning) {
          [0, 120, 360].forEach((delay) => window.setTimeout(syncVisibleText, delay));
        }
      }
    }).catch(() => {});

    return response;
  };

  if (flameName) {
    new MutationObserver(syncVisibleText).observe(flameName, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (flameDescription) {
    new MutationObserver(syncVisibleText).observe(flameDescription, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  syncVisibleText();
})();
