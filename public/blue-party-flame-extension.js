'use strict';

(() => {
  const BLUE_PARTY_FLAME = {
    type: 'blue-party',
    name: '歸藍趴火',
    description: '十三下連續快點，把節拍壓縮成高亮藍焰與派對脈衝；象徵重新歸隊、放下拘束，以及和同伴一起把快樂點燃。',
    colors: ['#effcff', '#6ee7ff', '#147cff', '#2720a8', '#08061f'],
    sigil: '♬'
  };

  const originalFetch = window.fetch.bind(window);
  const ignitionButton = document.getElementById('ignitionButton');
  const flameCard = document.getElementById('flameCard');
  const flameName = document.getElementById('flameName');
  const flameDescription = document.getElementById('flameDescription');
  const flameSigil = document.getElementById('flameSigil');

  let rapidTapTimes = [];
  let qualifyingSequenceUntil = 0;

  function recordRapidTap() {
    if (ignitionButton?.classList.contains('lit')) return;

    const now = performance.now();
    const previous = rapidTapTimes.at(-1);
    if (previous && now - previous > 380) rapidTapTimes = [];

    rapidTapTimes.push(now);
    if (rapidTapTimes.length > 13) rapidTapTimes.shift();

    if (isThirteenFastTaps(rapidTapTimes)) {
      qualifyingSequenceUntil = Date.now() + 2200;
      navigator.vibrate?.([18, 22, 18, 22, 70]);
    }
  }

  function isThirteenFastTaps(times) {
    if (!Array.isArray(times) || times.length !== 13) return false;
    const intervals = times.slice(1).map((time, index) => time - times[index]);
    const average = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const maximum = Math.max(...intervals);
    const minimum = Math.min(...intervals);
    const totalDuration = times.at(-1) - times[0];

    return average >= 55
      && average <= 260
      && maximum <= 360
      && minimum >= 35
      && totalDuration <= 3200;
  }

  function makeBluePartyFlame(flame) {
    return {
      ...flame,
      type: BLUE_PARTY_FLAME.type,
      name: BLUE_PARTY_FLAME.name,
      colors: BLUE_PARTY_FLAME.colors,
      specialFlame: true,
      symbolicMeaning: '重新歸隊、放下拘束，以及和同伴一起把快樂點燃。',
      tapCount: 13
    };
  }

  function getCurrentFlame(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  function applyBluePartyUi(flame) {
    if (!ignitionButton) return;
    const active = flame?.type === BLUE_PARTY_FLAME.type || flame?.name === BLUE_PARTY_FLAME.name;

    if (!active) {
      if (ignitionButton.dataset.flameType === BLUE_PARTY_FLAME.type) delete ignitionButton.dataset.flameType;
      if (flameCard?.dataset.flameType === BLUE_PARTY_FLAME.type) delete flameCard.dataset.flameType;
      return;
    }

    ignitionButton.dataset.flameType = BLUE_PARTY_FLAME.type;
    if (flameCard) flameCard.dataset.flameType = BLUE_PARTY_FLAME.type;
    ignitionButton.style.setProperty('--flame-primary', BLUE_PARTY_FLAME.colors[1]);
    ignitionButton.style.setProperty('--flame-secondary', BLUE_PARTY_FLAME.colors[2]);
    flameCard?.style.setProperty('--flame-primary', BLUE_PARTY_FLAME.colors[1]);
    flameCard?.style.setProperty('--flame-secondary', BLUE_PARTY_FLAME.colors[2]);
    if (flameName) flameName.textContent = BLUE_PARTY_FLAME.name;
    if (flameDescription) flameDescription.textContent = BLUE_PARTY_FLAME.description;
    if (flameSigil) flameSigil.textContent = BLUE_PARTY_FLAME.sigil;
  }

  function scheduleUiSync(flame) {
    [0, 90, 240, 520, 980].forEach((delay) => window.setTimeout(() => applyBluePartyUi(flame), delay));
  }

  if (ignitionButton) {
    ignitionButton.addEventListener('pointerdown', recordRapidTap, true);
  }

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame && Date.now() <= qualifyingSequenceUntil) {
          body.flame = makeBluePartyFlame(body.flame);
          nextInit = { ...init, body: JSON.stringify(body) };
          scheduleUiSync(body.flame);
          qualifyingSequenceUntil = 0;
          rapidTapTimes = [];
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
      if (flameName.textContent.trim() === BLUE_PARTY_FLAME.name) {
        applyBluePartyUi({ type: BLUE_PARTY_FLAME.type, name: BLUE_PARTY_FLAME.name });
      }
    }).observe(flameName, { childList: true, subtree: true });
  }

  const style = document.createElement('style');
  style.textContent = `
    .ignition-button[data-flame-type="blue-party"] .ignition-ring {
      border-color: rgba(110, 231, 255, 0.92) !important;
      border-style: solid !important;
      box-shadow:
        0 0 24px rgba(20, 124, 255, 0.58),
        0 0 52px rgba(39, 32, 168, 0.42),
        inset 0 0 30px rgba(110, 231, 255, 0.25) !important;
      animation: blue-party-ring 0.78s steps(4, end) infinite, slow-spin 5.2s linear infinite !important;
    }

    .ignition-button[data-flame-type="blue-party"] #persistentFlameCanvas {
      animation: blue-party-flame 0.78s steps(4, end) infinite;
      filter: saturate(1.55) brightness(1.22) contrast(1.16);
    }

    .ignition-button[data-flame-type="blue-party"] .ignition-core {
      background:
        repeating-conic-gradient(from 0deg, rgba(110,231,255,0.17) 0 8deg, transparent 8deg 28deg),
        radial-gradient(circle at 50% 30%, rgba(239,252,255,0.24), transparent 14%),
        radial-gradient(circle, rgba(20,124,255,0.18), rgba(39,32,168,0.18) 46%, rgba(5,4,20,0.97) 76%) !important;
    }

    .flame-card[data-flame-type="blue-party"] {
      border-color: rgba(110, 231, 255, 0.25);
      background: linear-gradient(135deg, rgba(20,124,255,0.17), rgba(39,32,168,0.16), rgba(5,4,20,0.96));
      box-shadow: inset 0 0 28px rgba(110,231,255,0.05), 0 0 26px rgba(20,124,255,0.08);
    }

    @keyframes blue-party-ring {
      0%, 100% { transform: scale(0.99) rotate(0deg); filter: brightness(1); opacity: 0.82; }
      25% { transform: scale(1.045) rotate(1deg); filter: brightness(1.65); opacity: 1; }
      50% { transform: scale(1.005) rotate(-1deg); filter: brightness(1.12); opacity: 0.88; }
      75% { transform: scale(1.03) rotate(2deg); filter: brightness(1.42); opacity: 1; }
    }

    @keyframes blue-party-flame {
      0%, 100% { transform: translateY(2px) scale(0.99); filter: saturate(1.35) brightness(1.08) hue-rotate(0deg); }
      25% { transform: translateY(-3px) scale(1.045); filter: saturate(1.8) brightness(1.38) hue-rotate(8deg); }
      50% { transform: translateX(-2px) scale(1.01); filter: saturate(1.5) brightness(1.18) hue-rotate(-7deg); }
      75% { transform: translateX(2px) scale(1.035); filter: saturate(1.7) brightness(1.3) hue-rotate(12deg); }
    }
  `;
  document.head.appendChild(style);
})();
