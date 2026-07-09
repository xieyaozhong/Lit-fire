'use strict';

(() => {
  if (window.__pureSparkNineTapLoaded) return;
  window.__pureSparkNineTapLoaded = true;

  const PURE_SPARK = {
    type: 'pure-spark',
    name: '純正星火',
    description: '三組短促而完整的三連拍彼此呼應，凝成不受雜質干擾的金白星芒。象徵純粹的初心、堅定的信念，以及把最真實的光傳向遠方。',
    symbolicMeaning: '純粹的初心、堅定的信念，以及把最真實的光傳向遠方。',
    colors: ['#ffffff', '#fff7c7', '#ffd95e', '#ff8b35'],
    sigil: '✧'
  };

  const originalFetch = window.fetch.bind(window);
  const nativeSetTimeout = window.setTimeout.bind(window);
  const button = document.getElementById('ignitionButton');
  const flameCard = document.getElementById('flameCard');
  const flameName = document.getElementById('flameName');
  const flameDescription = document.getElementById('flameDescription');
  const flameSigil = document.getElementById('flameSigil');

  let tapTimes = [];
  let qualifiedUntil = 0;
  let blockedUntil = 0;

  function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function spread(values) {
    return values.length ? Math.max(...values) / Math.max(1, Math.min(...values)) : 1;
  }

  function getIntervals(times = tapTimes) {
    return times.slice(1).map((time, index) => time - times[index]);
  }

  function isShortGroup(values) {
    return values.length > 0
      && values.every((value) => value >= 40 && value <= 320)
      && spread(values) <= 2.15;
  }

  function isThreeTriplePattern(times) {
    if (!Array.isArray(times) || times.length !== 9) return false;
    const values = getIntervals(times);
    const shortBeats = [values[0], values[1], values[3], values[4], values[6], values[7]];
    const pauses = [values[2], values[5]];
    const shortAverage = mean(shortBeats);
    const pauseAverage = mean(pauses);
    const total = times.at(-1) - times[0];

    return isShortGroup(shortBeats)
      && shortAverage <= 245
      && pauses.every((value) => value >= 420 && value <= 1150)
      && spread(pauses) <= 1.8
      && pauseAverage >= shortAverage * 1.75
      && total <= 4700;
  }

  function isPotentialPrefix() {
    const values = getIntervals();
    if (tapTimes.length === 3) {
      return isShortGroup(values.slice(0, 2));
    }
    if (tapTimes.length === 6 && values.length === 5) {
      return isShortGroup([values[0], values[1], values[3], values[4]])
        && values[2] >= 360
        && values[2] <= 1250;
    }
    return false;
  }

  window.setTimeout = (callback, delay = 0, ...args) => {
    let nextDelay = delay;
    if (Number(delay) === 1050 && isPotentialPrefix()) {
      nextDelay = 1450;
    }
    return nativeSetTimeout(callback, nextDelay, ...args);
  };

  function recordTap(event) {
    if (!button || !button.contains(event.target)) return;
    if (button.classList.contains('lit')) return;

    const now = performance.now();
    const previous = tapTimes.at(-1);
    if (!previous || now - previous > 1350) tapTimes = [now];
    else tapTimes.push(now);

    if (tapTimes.length === 9) {
      if (isThreeTriplePattern(tapTimes)) {
        qualifiedUntil = Date.now() + 2600;
        blockedUntil = 0;
        navigator.vibrate?.([18, 20, 18, 20, 18, 70]);
      } else {
        qualifiedUntil = 0;
      }
      return;
    }

    if (tapTimes.length > 9) {
      qualifiedUntil = 0;
      blockedUntil = Date.now() + 2200;
      if (tapTimes.length > 11) tapTimes.shift();
    }
  }

  function makePureSpark(flame) {
    return {
      ...flame,
      type: PURE_SPARK.type,
      name: PURE_SPARK.name,
      description: PURE_SPARK.description,
      symbolicMeaning: PURE_SPARK.symbolicMeaning,
      colors: PURE_SPARK.colors,
      specialFlame: true,
      tapCount: 9,
      rhythmSignature: 'three-groups-of-three-short-taps'
    };
  }

  function applyUi(flame = PURE_SPARK) {
    if (!button) return;
    button.dataset.flameType = PURE_SPARK.type;
    if (flameCard) flameCard.dataset.flameType = PURE_SPARK.type;
    button.style.setProperty('--flame-primary', PURE_SPARK.colors[1]);
    button.style.setProperty('--flame-secondary', PURE_SPARK.colors[2]);
    flameCard?.style.setProperty('--flame-primary', PURE_SPARK.colors[1]);
    flameCard?.style.setProperty('--flame-secondary', PURE_SPARK.colors[2]);
    if (flameName) flameName.textContent = flame.name || PURE_SPARK.name;
    if (flameDescription) flameDescription.textContent = flame.description || PURE_SPARK.description;
    if (flameSigil) flameSigil.textContent = PURE_SPARK.sigil;
  }

  function scheduleUi(flame) {
    [0, 100, 300, 700, 1250].forEach((delay) => nativeSetTimeout(() => applyUi(flame), delay));
  }

  function currentFlame(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  document.addEventListener('pointerdown', recordTap, true);

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame && Date.now() <= qualifiedUntil && Date.now() > blockedUntil) {
          body.flame = makePureSpark(body.flame);
          nextInit = { ...init, body: JSON.stringify(body) };
          scheduleUi(body.flame);
          tapTimes = [];
          qualifiedUntil = 0;
          blockedUntil = 0;
        } else if (body.flame === null) {
          tapTimes = [];
          qualifiedUntil = 0;
          blockedUntil = 0;
        }
      } catch {
        // Keep unrelated requests unchanged.
      }
    }

    const response = await originalFetch(input, nextInit);
    response.clone().json().then((payload) => {
      const flame = currentFlame(payload);
      if (flame?.type === PURE_SPARK.type || flame?.name === PURE_SPARK.name) scheduleUi(flame);
    }).catch(() => {});
    return response;
  };

  if (flameName) {
    new MutationObserver(() => {
      if (flameName.textContent.trim() === PURE_SPARK.name) applyUi();
    }).observe(flameName, { childList: true, subtree: true, characterData: true });
  }

  const style = document.createElement('style');
  style.textContent = `
    .ignition-button[data-flame-type="pure-spark"] .ignition-ring {
      border-color: rgba(255, 247, 199, 0.92) !important;
      box-shadow:
        0 0 22px rgba(255, 255, 255, 0.52),
        0 0 54px rgba(255, 217, 94, 0.38),
        inset 0 0 34px rgba(255, 247, 199, 0.18) !important;
      animation: pure-spark-ring 3.4s ease-in-out infinite !important;
    }

    .ignition-button[data-flame-type="pure-spark"] #persistentFlameCanvas {
      filter: saturate(1.12) brightness(1.28) contrast(1.04);
      animation: pure-spark-flame 3.4s ease-in-out infinite !important;
      transform-origin: 50% 68%;
    }

    .flame-card[data-flame-type="pure-spark"] {
      background: linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,217,94,.10), rgba(255,139,53,.07));
      box-shadow: inset 0 0 30px rgba(255,247,199,.08), 0 0 30px rgba(255,217,94,.10);
    }

    @keyframes pure-spark-ring {
      0%, 100% { transform: scale(.99); filter: brightness(.92); opacity: .78; }
      50% { transform: scale(1.035); filter: brightness(1.32); opacity: 1; }
    }

    @keyframes pure-spark-flame {
      0%, 100% { transform: scale(.98); filter: saturate(1.06) brightness(1.04); }
      50% { transform: scale(1.055); filter: saturate(1.18) brightness(1.48); }
    }
  `;
  document.head.appendChild(style);
})();
