'use strict';

(() => {
  if (window.__dawnRisingRhythmLoaded) return;
  window.__dawnRisingRhythmLoaded = true;

  const DAWN = {
    type: 'dawn',
    name: '破曉火',
    description: '一點微光、兩縷晨色、三道霞光，最後以四束日光完整升起。象徵重啟、希望，以及相信黎明終會抵達。',
    symbolicMeaning: '重啟、希望，以及相信黎明終會抵達。',
    colors: ['#fffdf0', '#ffe08a', '#ff9f5a', '#d84a32'],
    sigil: '☼'
  };

  const FALLBACKS = {
    ember: ['恆星火', ['#fff0a8', '#ff9f43', '#ff4d2e', '#7e1f2b'], '☀'],
    azure: ['疾風火', ['#e9ffff', '#69e7ff', '#168cff', '#3927a8'], '↯'],
    dream: ['夢燼', ['#fff0ff', '#ff8bd8', '#9a5cff', '#43206f'], '☾'],
    forest: ['森靈火', ['#f2ffd5', '#9cff64', '#1fd69a', '#15665c'], '✤'],
    spark: ['星火', ['#ffffff', '#ffe47d', '#ff9d42', '#e64535'], '✦']
  };

  const originalFetch = window.fetch.bind(window);
  const priorSetTimeout = window.setTimeout.bind(window);
  const button = document.getElementById('ignitionButton');
  const flameCard = document.getElementById('flameCard');
  const flameName = document.getElementById('flameName');
  const flameDescription = document.getElementById('flameDescription');
  const flameSigil = document.getElementById('flameSigil');
  const resetButton = document.getElementById('resetFlameButton');

  let tapTimes = [];
  let qualifiedUntil = 0;
  let blockedUntil = 0;

  function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function spread(values) {
    return values.length ? Math.max(...values) / Math.max(1, Math.min(...values)) : 1;
  }

  function deviation(values) {
    if (values.length < 2) return 0;
    const average = mean(values);
    return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
  }

  function intervals(times = tapTimes) {
    return times.slice(1).map((time, index) => time - times[index]);
  }

  function isShortRun(values) {
    return values.length > 0
      && values.every((value) => value >= 65 && value <= 225)
      && spread(values) <= 1.9;
  }

  function isRisingDawnPattern(times) {
    if (!Array.isArray(times) || times.length !== 10) return false;

    const values = intervals(times);
    const groupTwo = [values[1]];
    const groupThree = [values[3], values[4]];
    const groupFour = [values[6], values[7], values[8]];
    const shortBeats = [...groupTwo, ...groupThree, ...groupFour];
    const pauses = [values[0], values[2], values[5]];
    const shortAverage = mean(shortBeats);
    const pauseAverage = mean(pauses);
    const total = times.at(-1) - times[0];

    return isShortRun(groupTwo)
      && isShortRun(groupThree)
      && isShortRun(groupFour)
      && shortAverage <= 175
      && spread(shortBeats) <= 2
      && pauses.every((value) => value >= 520 && value <= 820)
      && spread(pauses) <= 1.4
      && pauseAverage >= shortAverage * 3.1
      && total >= 2200
      && total <= 4300;
  }

  function isPotentialPrefix() {
    if (tapTimes.length === 3) {
      const values = intervals();
      return values.length === 2
        && values[0] >= 470
        && values[0] <= 870
        && isShortRun([values[1]]);
    }

    if (tapTimes.length === 6) {
      const values = intervals();
      return values.length === 5
        && values[0] >= 470
        && values[0] <= 870
        && isShortRun([values[1]])
        && values[2] >= 470
        && values[2] <= 870
        && isShortRun([values[3], values[4]]);
    }

    return false;
  }

  function resetSequence() {
    tapTimes = [];
    qualifiedUntil = 0;
    blockedUntil = 0;
  }

  function recordTap(event) {
    if (!button || !button.contains(event.target)) return;
    if (button.classList.contains('lit')) return;

    const now = performance.now();
    const previous = tapTimes.at(-1);
    if (!previous || now - previous > 1100) tapTimes = [now];
    else tapTimes.push(now);

    if (tapTimes.length === 10) {
      if (isRisingDawnPattern(tapTimes)) {
        qualifiedUntil = Date.now() + 2500;
        blockedUntil = 0;
        navigator.vibrate?.([14, 22, 20, 28, 30, 70]);
      } else {
        qualifiedUntil = 0;
      }
      return;
    }

    if (tapTimes.length > 10) {
      qualifiedUntil = 0;
      blockedUntil = Date.now() + 2300;
      if (tapTimes.length > 12) tapTimes.shift();
    }
  }

  window.setTimeout = (callback, delay = 0, ...args) => {
    if (Number(delay) === 1050 && isPotentialPrefix()) {
      return priorSetTimeout(callback, 1500, ...args);
    }
    return priorSetTimeout(callback, delay, ...args);
  };

  function classifyFallback(rhythm) {
    const values = Array.isArray(rhythm) ? rhythm.map(Number).filter(Number.isFinite) : [];
    if (!values.length) return 'spark';

    const average = mean(values);
    const variation = average ? deviation(values) / average : 0;
    if (average < 290) return 'azure';
    if (average > 720) return 'dream';
    if (variation < 0.13) return 'ember';
    return variation > 0.42 ? 'forest' : 'spark';
  }

  function makeDawn(flame) {
    return {
      ...flame,
      type: DAWN.type,
      name: DAWN.name,
      description: DAWN.description,
      symbolicMeaning: DAWN.symbolicMeaning,
      colors: DAWN.colors,
      specialFlame: true,
      tapCount: 10,
      rhythmSignature: 'one-two-three-four-rising-rhythm'
    };
  }

  function makeFallback(flame) {
    const type = classifyFallback(flame?.rhythm);
    const fallback = FALLBACKS[type] || FALLBACKS.spark;
    return {
      ...flame,
      type,
      name: fallback[0],
      colors: fallback[1],
      specialFlame: false,
      symbolicMeaning: undefined,
      tapCount: undefined,
      rhythmSignature: undefined
    };
  }

  function applyUi(flame = DAWN) {
    if (!button) return;
    button.dataset.flameType = DAWN.type;
    if (flameCard) flameCard.dataset.flameType = DAWN.type;
    button.style.setProperty('--flame-primary', DAWN.colors[1]);
    button.style.setProperty('--flame-secondary', DAWN.colors[2]);
    flameCard?.style.setProperty('--flame-primary', DAWN.colors[1]);
    flameCard?.style.setProperty('--flame-secondary', DAWN.colors[2]);
    if (flameName) flameName.textContent = flame.name || DAWN.name;
    if (flameDescription) flameDescription.textContent = flame.description || DAWN.description;
    if (flameSigil) flameSigil.textContent = DAWN.sigil;
  }

  function applyFallbackUi(flame) {
    const fallback = FALLBACKS[flame.type] || FALLBACKS.spark;
    if (!button) return;
    button.dataset.flameType = flame.type;
    if (flameCard) flameCard.dataset.flameType = flame.type;
    button.style.setProperty('--flame-primary', fallback[1][1] || fallback[1][0]);
    button.style.setProperty('--flame-secondary', fallback[1][2] || fallback[1][1]);
    flameCard?.style.setProperty('--flame-primary', fallback[1][1] || fallback[1][0]);
    flameCard?.style.setProperty('--flame-secondary', fallback[1][2] || fallback[1][1]);
    if (flameName) flameName.textContent = flame.name;
    if (flameSigil) flameSigil.textContent = fallback[2];
  }

  function scheduleUi(flame, dawn = true) {
    [0, 100, 320, 720, 1280].forEach((delay) => {
      priorSetTimeout(() => dawn ? applyUi(flame) : applyFallbackUi(flame), delay);
    });
  }

  function currentFlame(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  document.addEventListener('pointerdown', recordTap, true);
  resetButton?.addEventListener('click', resetSequence, true);

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame) {
          const qualified = Date.now() <= qualifiedUntil && Date.now() > blockedUntil;
          if (qualified) {
            body.flame = makeDawn(body.flame);
            nextInit = { ...init, body: JSON.stringify(body) };
            scheduleUi(body.flame, true);
            resetSequence();
          } else if (body.flame.type === DAWN.type) {
            body.flame = makeFallback(body.flame);
            nextInit = { ...init, body: JSON.stringify(body) };
            scheduleUi(body.flame, false);
            resetSequence();
          }
        } else if (body.flame === null) {
          resetSequence();
        }
      } catch {
        // Keep unrelated requests unchanged.
      }
    }

    const response = await originalFetch(input, nextInit);
    response.clone().json().then((payload) => {
      const flame = currentFlame(payload);
      if (flame?.type === DAWN.type || flame?.name === DAWN.name) scheduleUi(flame, true);
    }).catch(() => {});
    return response;
  };
})();
