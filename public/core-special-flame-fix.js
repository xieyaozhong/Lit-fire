'use strict';

(() => {
  if (window.__coreSpecialFlameFixLoaded) return;
  window.__coreSpecialFlameFixLoaded = true;

  const TYPES = {
    dark: {
      name: '黯火',
      description: '緩慢兩拍、長久沉默後突然收束，凝成吞噬光線的紫黑火焰；象徵直面陰影、沉靜蓄力，以及在無光處仍守住自己的核心。',
      colors: ['#e9e4ff', '#7660b8', '#2a1d45', '#050308'],
      sigil: '◈',
      meaning: '直面陰影、沉靜蓄力，以及在無光處仍守住自己的核心。'
    },
    dawn: {
      name: '破曉火',
      description: '前四下沉穩蓄光，後四下突然加速，讓金白火焰穿過夜色向上升起；象徵重新出發、跨越轉折，以及相信黎明終會到來。',
      colors: ['#fffdf0', '#ffe08a', '#ff9f5a', '#d84a32'],
      sigil: '☼',
      meaning: '重新出發、跨越轉折，以及相信黎明終會到來。'
    },
    echo: {
      name: '回聲火',
      description: '三組成對的短拍在相近停頓間彼此回應，化成銀藍色同心光波；象徵記憶、回應，以及真心終會被另一顆心聽見。',
      colors: ['#f7fbff', '#b9ddff', '#7f76ff', '#30236f'],
      sigil: '◎',
      meaning: '記憶、回應，以及真心終會被另一顆心聽見。'
    }
  };

  const nativeFetch = window.fetch.bind(window);
  const nativeSetTimeout = window.setTimeout.bind(window);
  const button = document.getElementById('ignitionButton');
  const flameCard = document.getElementById('flameCard');
  const flameName = document.getElementById('flameName');
  const flameDescription = document.getElementById('flameDescription');
  const flameSigil = document.getElementById('flameSigil');

  let taps = [];

  function mean(values) {
    return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  }

  function spread(values) {
    return Math.max(...values) / Math.max(1, Math.min(...values));
  }

  function intervalsFromTaps() {
    return taps.slice(1).map((time, index) => time - taps[index]);
  }

  function isDark(intervals) {
    if (!Array.isArray(intervals) || intervals.length !== 5) return false;
    const [first, second, silence, fourth, fifth] = intervals.map(Number);
    if (![first, second, silence, fourth, fifth].every(Number.isFinite)) return false;
    const opening = mean([first, second]);
    const ending = mean([fourth, fifth]);
    return opening >= 260
      && opening <= 850
      && ending >= 45
      && ending <= 350
      && spread([first, second]) <= 1.75
      && spread([fourth, fifth]) <= 1.8
      && silence >= Math.max(700, opening * 1.35, ending * 2.5)
      && silence <= 1680
      && ending <= opening * 0.72;
  }

  function isDawn(intervals) {
    if (!Array.isArray(intervals) || intervals.length !== 7) return false;
    const slow = intervals.slice(0, 3).map(Number);
    const fast = intervals.slice(3).map(Number);
    if (![...slow, ...fast].every(Number.isFinite)) return false;
    const slowAverage = mean(slow);
    const fastAverage = mean(fast);
    return slowAverage >= 280
      && slowAverage <= 850
      && fastAverage >= 40
      && fastAverage <= 320
      && spread(slow) <= 1.75
      && spread(fast) <= 1.9
      && fastAverage <= slowAverage * 0.62
      && Math.max(...fast) <= Math.min(...slow) * 0.88;
  }

  function isEcho(intervals) {
    if (!Array.isArray(intervals) || intervals.length !== 5) return false;
    const values = intervals.map(Number);
    if (!values.every(Number.isFinite)) return false;
    const shortBeats = [values[0], values[2], values[4]];
    const pauses = [values[1], values[3]];
    const shortAverage = mean(shortBeats);
    const pauseAverage = mean(pauses);
    return shortAverage >= 45
      && shortAverage <= 360
      && pauseAverage >= 280
      && pauseAverage <= 1180
      && spread(shortBeats) <= 1.9
      && spread(pauses) <= 1.7
      && pauseAverage >= shortAverage * 1.65;
  }

  function detect(intervals) {
    if (isDark(intervals)) return 'dark';
    if (isDawn(intervals)) return 'dawn';
    if (isEcho(intervals)) return 'echo';
    return null;
  }

  function recordTap() {
    if (button?.classList.contains('lit')) return;
    const now = performance.now();
    if (taps.length && now - taps.at(-1) > 1700) taps = [];
    taps.push(now);
    if (taps.length > 10) taps.shift();
  }

  function potentialDarkOpening() {
    if (taps.length !== 3) return false;
    const intervals = intervalsFromTaps();
    if (intervals.length !== 2) return false;
    return intervals.every((value) => value >= 250 && value <= 900)
      && spread(intervals) <= 1.85;
  }

  function potentialEchoPause() {
    if (taps.length !== 2 && taps.length !== 4) return false;
    const lastInterval = intervalsFromTaps().at(-1);
    return Number.isFinite(lastInterval) && lastInterval >= 40 && lastInterval <= 380;
  }

  function isFinalizeTimer(callback, delay) {
    return typeof callback === 'function'
      && callback.name === 'finalizeRhythm'
      && Number(delay) === 1050;
  }

  window.setTimeout = (callback, delay = 0, ...args) => {
    let nextDelay = delay;
    if (isFinalizeTimer(callback, delay)) {
      if (potentialDarkOpening()) nextDelay = 1880;
      else if (potentialEchoPause()) nextDelay = 1420;
    }
    return nativeSetTimeout(callback, nextDelay, ...args);
  };

  function makeFlame(flame, type) {
    const meta = TYPES[type];
    return {
      ...flame,
      type,
      name: meta.name,
      colors: meta.colors,
      specialFlame: true,
      symbolicMeaning: meta.meaning,
      rhythmSignature: type === 'dark'
        ? 'slow-slow-silence-fast-fast'
        : type === 'dawn'
          ? 'four-slow-four-fast'
          : 'three-echo-pairs'
    };
  }

  function applyUi(flame) {
    const type = TYPES[flame?.type] ? flame.type : null;
    if (!type || !button) return;
    const meta = TYPES[type];
    button.dataset.flameType = type;
    if (flameCard) flameCard.dataset.flameType = type;
    button.style.setProperty('--flame-primary', meta.colors[1]);
    button.style.setProperty('--flame-secondary', meta.colors[2]);
    flameCard?.style.setProperty('--flame-primary', meta.colors[1]);
    flameCard?.style.setProperty('--flame-secondary', meta.colors[2]);
    if (flameName) flameName.textContent = meta.name;
    if (flameDescription) flameDescription.textContent = meta.description;
    if (flameSigil) flameSigil.textContent = meta.sigil;
  }

  function scheduleUi(flame) {
    [0, 100, 280, 650, 1200].forEach((delay) => nativeSetTimeout(() => applyUi(flame), delay));
  }

  function getCurrentFlame(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame && Array.isArray(body.flame.rhythm)) {
          const type = detect(body.flame.rhythm);
          if (type) {
            body.flame = makeFlame(body.flame, type);
            nextInit = { ...init, body: JSON.stringify(body) };
            scheduleUi(body.flame);
          }
        } else if (body.flame === null) {
          taps = [];
        }
      } catch {
        // Keep unrelated requests unchanged.
      }
    }

    const response = await nativeFetch(input, nextInit);
    response.clone().json().then((payload) => {
      const flame = getCurrentFlame(payload);
      if (flame) scheduleUi(flame);
    }).catch(() => {});
    return response;
  };

  button?.addEventListener('pointerdown', recordTap, true);
  if (button) {
    new MutationObserver(() => {
      if (button.classList.contains('lit')) taps = [];
    }).observe(button, { attributes: true, attributeFilter: ['class'] });
  }
})();
