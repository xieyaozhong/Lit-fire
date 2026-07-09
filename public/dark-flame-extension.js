'use strict';

(() => {
  const DARK_FLAME = {
    type: 'dark',
    name: '黯火',
    description: '緩慢兩拍、長久沉默後突然收束，凝成吞噬光線的紫黑火焰；象徵直面陰影、沉靜蓄力，以及在無光處仍守住自己的核心。',
    colors: ['#e9e4ff', '#7660b8', '#2a1d45', '#050308'],
    sigil: '◈'
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

  function similarPair(a, b, tolerance = 1.6) {
    return Math.max(a, b) / Math.max(1, Math.min(a, b)) <= tolerance;
  }

  function isDarkRhythm(intervals) {
    if (!Array.isArray(intervals) || intervals.length !== 5) return false;

    const [first, second, silence, fourth, fifth] = intervals.map(Number);
    if (![first, second, silence, fourth, fifth].every(Number.isFinite)) return false;

    const opening = mean([first, second]);
    const ending = mean([fourth, fifth]);

    return opening >= 300
      && opening <= 760
      && ending >= 70
      && ending <= 300
      && similarPair(first, second, 1.5)
      && similarPair(fourth, fifth, 1.55)
      && silence >= Math.max(900, opening * 1.8, ending * 3.2)
      && silence <= 1650
      && ending <= opening * 0.58;
  }

  function makeDarkFlame(flame) {
    return {
      ...flame,
      type: DARK_FLAME.type,
      name: DARK_FLAME.name,
      colors: DARK_FLAME.colors,
      specialFlame: true,
      symbolicMeaning: '直面陰影、沉靜蓄力，以及在無光處仍守住自己的核心。'
    };
  }

  function getCurrentFlame(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  function applyDarkUi(flame) {
    if (!button) return;
    const isDark = flame?.type === DARK_FLAME.type || flame?.name === DARK_FLAME.name;

    if (!isDark) {
      if (button.dataset.flameType === DARK_FLAME.type) delete button.dataset.flameType;
      if (flameCard?.dataset.flameType === DARK_FLAME.type) delete flameCard.dataset.flameType;
      return;
    }

    button.dataset.flameType = DARK_FLAME.type;
    if (flameCard) flameCard.dataset.flameType = DARK_FLAME.type;
    button.style.setProperty('--flame-primary', DARK_FLAME.colors[1]);
    button.style.setProperty('--flame-secondary', DARK_FLAME.colors[2]);
    flameCard?.style.setProperty('--flame-primary', DARK_FLAME.colors[1]);
    flameCard?.style.setProperty('--flame-secondary', DARK_FLAME.colors[2]);
    if (flameName) flameName.textContent = DARK_FLAME.name;
    if (flameDescription) flameDescription.textContent = DARK_FLAME.description;
    if (flameSigil) flameSigil.textContent = DARK_FLAME.sigil;
  }

  function scheduleUiSync(flame) {
    [0, 120, 380, 900].forEach((delay) => window.setTimeout(() => applyDarkUi(flame), delay));
  }

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame && isDarkRhythm(body.flame.rhythm)) {
          body.flame = makeDarkFlame(body.flame);
          nextInit = { ...init, body: JSON.stringify(body) };
          scheduleUiSync(body.flame);
        }
      } catch {
        // Leave unrelated requests unchanged.
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
      if (flameName.textContent.trim() === DARK_FLAME.name) {
        applyDarkUi({ type: DARK_FLAME.type, name: DARK_FLAME.name });
      }
    }).observe(flameName, { childList: true, subtree: true });
  }

  const style = document.createElement('style');
  style.textContent = `
    .ignition-button[data-flame-type="dark"] .ignition-ring {
      border-color: rgba(118, 96, 184, 0.56) !important;
      box-shadow: 0 0 24px rgba(85, 60, 145, 0.34), inset 0 0 38px rgba(17, 10, 30, 0.82) !important;
      animation: dark-ring 6.8s ease-in-out infinite, slow-spin 28s linear infinite reverse !important;
    }

    .ignition-button[data-flame-type="dark"] #persistentFlameCanvas {
      animation: dark-flame 5.4s ease-in-out infinite;
      filter: saturate(0.82) brightness(0.78) contrast(1.28);
      mix-blend-mode: screen;
    }

    .ignition-button[data-flame-type="dark"] .ignition-core {
      opacity: 0.82 !important;
      background:
        radial-gradient(circle at 50% 31%, rgba(233, 228, 255, 0.12), transparent 13%),
        radial-gradient(circle at 50% 52%, rgba(76, 54, 126, 0.13), rgba(20, 12, 33, 0.72) 43%, rgba(2, 1, 5, 0.99) 76%) !important;
      box-shadow:
        inset 0 0 82px rgba(0, 0, 0, 0.88),
        inset 0 -22px 48px rgba(0, 0, 0, 0.95),
        0 0 78px rgba(64, 43, 108, 0.18) !important;
    }

    .flame-card[data-flame-type="dark"] {
      border-color: rgba(118, 96, 184, 0.2);
      background: linear-gradient(135deg, rgba(18, 11, 30, 0.95), rgba(43, 29, 69, 0.32), rgba(4, 2, 8, 0.98));
    }

    @keyframes dark-ring {
      0%, 100% { transform: scale(0.985); filter: brightness(0.72); opacity: 0.62; }
      48% { transform: scale(1.025); filter: brightness(1.18); opacity: 0.92; }
      58% { transform: scale(0.995); filter: brightness(0.84); opacity: 0.7; }
    }

    @keyframes dark-flame {
      0%, 100% { transform: scale(0.965) translateY(3px); filter: saturate(0.7) brightness(0.68) contrast(1.34); opacity: 0.8; }
      44% { transform: scale(1.02) translateY(-2px); filter: saturate(0.92) brightness(0.9) contrast(1.22); opacity: 0.96; }
      62% { transform: scale(0.985); filter: saturate(0.76) brightness(0.74) contrast(1.3); opacity: 0.86; }
    }
  `;
  document.head.appendChild(style);
})();
