'use strict';

(() => {
  if (window.__bluePartySevenTapLoaded) return;
  window.__bluePartySevenTapLoaded = true;

  const BLUE_PARTY = {
    type: 'blue-party',
    name: '歸藍趴火',
    description: '七下短促連點，把節拍壓縮成高亮藍焰與派對脈衝；象徵重新歸隊、放下拘束，以及和同伴一起把快樂點燃。',
    colors: ['#effcff', '#6ee7ff', '#147cff', '#2720a8'],
    sigil: '♬'
  };

  const FALLBACKS = {
    ember: {
      type: 'ember',
      name: '恆星火',
      description: '穩定而持續的節拍，像守住約定的橙紅火光。',
      colors: ['#fff0a8', '#ff9f43', '#ff4d2e', '#7e1f2b'],
      sigil: '☀'
    },
    azure: {
      type: 'azure',
      name: '疾風火',
      description: '快速密集的節奏，點燃清亮而銳利的藍色火焰。',
      colors: ['#e9ffff', '#69e7ff', '#168cff', '#3927a8'],
      sigil: '↯'
    },
    dream: {
      type: 'dream',
      name: '夢燼',
      description: '緩慢留白的節奏，形成安靜流動的紫粉火光。',
      colors: ['#fff0ff', '#ff8bd8', '#9a5cff', '#43206f'],
      sigil: '☾'
    },
    forest: {
      type: 'forest',
      name: '森靈火',
      description: '長短交錯的節奏，像枝葉間跳動的翠綠生命火。',
      colors: ['#f2ffd5', '#9cff64', '#1fd69a', '#15665c'],
      sigil: '✤'
    },
    spark: {
      type: 'spark',
      name: '星火',
      description: '帶有切分與驚喜的節奏，迸發金白色的傳承火種。',
      colors: ['#ffffff', '#ffe47d', '#ff9d42', '#e64535'],
      sigil: '✦'
    }
  };

  const originalFetch = window.fetch.bind(window);
  const ignitionButton = document.getElementById('ignitionButton');
  const flameCard = document.getElementById('flameCard');
  const flameName = document.getElementById('flameName');
  const flameDescription = document.getElementById('flameDescription');
  const flameSigil = document.getElementById('flameSigil');

  let sequence = [];
  let qualifiedUntil = 0;
  let blockedUntil = 0;

  function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function standardDeviation(values) {
    if (values.length < 2) return 0;
    const average = mean(values);
    return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
  }

  function intervals(times) {
    return times.slice(1).map((time, index) => time - times[index]);
  }

  function isSevenShortTaps(times) {
    if (!Array.isArray(times) || times.length !== 7) return false;
    const gaps = intervals(times);
    const average = mean(gaps);
    const longest = Math.max(...gaps);
    const shortest = Math.min(...gaps);
    const total = times.at(-1) - times[0];

    return gaps.every((gap) => gap >= 35 && gap <= 330)
      && average <= 245
      && longest / Math.max(1, shortest) <= 2.15
      && total <= 1900;
  }

  function classifyFallback(rhythm) {
    const values = Array.isArray(rhythm) ? rhythm.map(Number).filter(Number.isFinite) : [];
    if (!values.length) return FALLBACKS.spark;

    const average = mean(values);
    const variation = average ? standardDeviation(values) / average : 0;
    if (average < 290) return FALLBACKS.azure;
    if (average > 720) return FALLBACKS.dream;
    if (variation < 0.13) return FALLBACKS.ember;
    return variation > 0.42 ? FALLBACKS.forest : FALLBACKS.spark;
  }

  function applyUi(flame) {
    if (!flame || !ignitionButton) return;
    ignitionButton.dataset.flameType = flame.type;
    flameCard && (flameCard.dataset.flameType = flame.type);
    ignitionButton.style.setProperty('--flame-primary', flame.colors[1] || flame.colors[0]);
    ignitionButton.style.setProperty('--flame-secondary', flame.colors[2] || flame.colors[1]);
    flameCard?.style.setProperty('--flame-primary', flame.colors[1] || flame.colors[0]);
    flameCard?.style.setProperty('--flame-secondary', flame.colors[2] || flame.colors[1]);
    if (flameName) flameName.textContent = flame.name;
    if (flameDescription) flameDescription.textContent = flame.description;
    if (flameSigil) flameSigil.textContent = flame.sigil;
  }

  function makeBlueParty(flame) {
    return {
      ...flame,
      type: BLUE_PARTY.type,
      name: BLUE_PARTY.name,
      description: BLUE_PARTY.description,
      colors: BLUE_PARTY.colors,
      specialFlame: true,
      symbolicMeaning: '重新歸隊、放下拘束，以及和同伴一起把快樂點燃。',
      tapCount: 7,
      rhythmSignature: 'seven-short-taps'
    };
  }

  function makeFallback(flame) {
    const fallback = classifyFallback(flame?.rhythm);
    return {
      ...flame,
      type: fallback.type,
      name: fallback.name,
      description: fallback.description,
      colors: fallback.colors,
      specialFlame: false,
      symbolicMeaning: undefined,
      tapCount: undefined,
      rhythmSignature: undefined
    };
  }

  function recordTap(event) {
    if (!ignitionButton || !ignitionButton.contains(event.target)) return;
    if (ignitionButton.classList.contains('lit')) return;

    const now = performance.now();
    const previous = sequence.at(-1);
    if (!previous || now - previous > 380) sequence = [now];
    else sequence.push(now);

    if (sequence.length === 7 && isSevenShortTaps(sequence)) {
      qualifiedUntil = Date.now() + 1900;
      blockedUntil = 0;
      navigator.vibrate?.([16, 20, 16, 20, 78]);
      return;
    }

    if (sequence.length > 7) {
      qualifiedUntil = 0;
      blockedUntil = Date.now() + 1900;
      if (sequence.length > 10) sequence.shift();
    }
  }

  document.addEventListener('pointerdown', recordTap, true);

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame) {
          const canUseSevenTap = Date.now() <= qualifiedUntil && Date.now() > blockedUntil;

          if (canUseSevenTap) {
            body.flame = makeBlueParty(body.flame);
            nextInit = { ...init, body: JSON.stringify(body) };
            applyUi({ ...BLUE_PARTY });
            qualifiedUntil = 0;
            blockedUntil = 0;
            sequence = [];
          } else if (body.flame.type === BLUE_PARTY.type) {
            body.flame = makeFallback(body.flame);
            nextInit = { ...init, body: JSON.stringify(body) };
            const fallback = FALLBACKS[body.flame.type] || FALLBACKS.spark;
            applyUi(fallback);
            qualifiedUntil = 0;
            sequence = [];
          }
        } else if (body.flame === null) {
          sequence = [];
          qualifiedUntil = 0;
          blockedUntil = 0;
        }
      } catch {
        // Leave unrelated requests unchanged.
      }
    }

    return originalFetch(input, nextInit);
  };

  const style = document.createElement('style');
  style.textContent = `
    .ignition-button[data-flame-type="blue-party"] #persistentFlameCanvas {
      animation: blue-party-blink-flame 0.92s steps(2, end) infinite !important;
      transform-origin: 50% 68%;
    }

    .ignition-button[data-flame-type="blue-party"] .ignition-ring {
      border-color: rgba(110, 231, 255, 0.94) !important;
      box-shadow:
        0 0 28px rgba(20, 124, 255, 0.72),
        0 0 62px rgba(39, 32, 168, 0.52),
        inset 0 0 34px rgba(110, 231, 255, 0.28) !important;
      animation: blue-party-blink-ring 0.92s steps(2, end) infinite !important;
    }

    .ignition-button[data-flame-type="blue-party"] .ignition-core {
      background:
        radial-gradient(circle at 50% 36%, rgba(239, 252, 255, 0.34), transparent 14%),
        radial-gradient(circle, rgba(20, 124, 255, 0.24), rgba(39, 32, 168, 0.22) 48%, rgba(5, 4, 20, 0.98) 77%) !important;
      animation: blue-party-blink-core 0.92s steps(2, end) infinite !important;
    }

    .flame-card[data-flame-type="blue-party"] {
      animation: blue-party-card-pulse 1.84s ease-in-out infinite;
    }

    @keyframes blue-party-blink-flame {
      0%, 49% {
        opacity: 1;
        transform: scale(1.045);
        filter: saturate(1.8) brightness(1.48) contrast(1.15);
      }
      50%, 100% {
        opacity: 0.08;
        transform: scale(0.96);
        filter: saturate(0.65) brightness(0.32) contrast(1.25);
      }
    }

    @keyframes blue-party-blink-ring {
      0%, 49% {
        opacity: 1;
        transform: scale(1.035);
        filter: brightness(1.65);
      }
      50%, 100% {
        opacity: 0.18;
        transform: scale(0.985);
        filter: brightness(0.38);
      }
    }

    @keyframes blue-party-blink-core {
      0%, 49% {
        opacity: 1;
        filter: brightness(1.35);
      }
      50%, 100% {
        opacity: 0.28;
        filter: brightness(0.42);
      }
    }

    @keyframes blue-party-card-pulse {
      0%, 100% {
        box-shadow: inset 0 0 28px rgba(110, 231, 255, 0.05), 0 0 20px rgba(20, 124, 255, 0.06);
      }
      50% {
        box-shadow: inset 0 0 32px rgba(110, 231, 255, 0.13), 0 0 34px rgba(20, 124, 255, 0.18);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ignition-button[data-flame-type="blue-party"] #persistentFlameCanvas,
      .ignition-button[data-flame-type="blue-party"] .ignition-ring,
      .ignition-button[data-flame-type="blue-party"] .ignition-core {
        animation-duration: 1.8s !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
