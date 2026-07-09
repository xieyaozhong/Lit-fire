'use strict';

(() => {
  const RAINBOW_COLORS = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#5856d6', '#bf5af2'];
  const RAINBOW_NAME = '虹焰';
  const RAINBOW_DESCRIPTION = '越點越快的加速節奏，喚醒紅、橙、黃、綠、藍、靛、紫交織的七彩火焰。';
  const originalFetch = window.fetch.bind(window);

  function isAccelerating(intervals) {
    if (!Array.isArray(intervals) || intervals.length < 3) return false;

    let clearDecreases = 0;
    let nonIncreases = 0;
    for (let index = 1; index < intervals.length; index += 1) {
      if (intervals[index] <= intervals[index - 1] * 0.92) clearDecreases += 1;
      if (intervals[index] <= intervals[index - 1] * 1.02) nonIncreases += 1;
    }

    const steps = intervals.length - 1;
    const enoughClearDecreases = clearDecreases >= Math.ceil(steps * 0.66);
    const mostlyNonIncreasing = nonIncreases >= steps - 1;
    const strongOverallAcceleration = intervals.at(-1) <= intervals[0] * 0.68;
    return enoughClearDecreases && mostlyNonIncreasing && strongOverallAcceleration;
  }

  function makeRainbowFlame(flame) {
    return {
      ...flame,
      type: 'rainbow',
      name: RAINBOW_NAME,
      colors: RAINBOW_COLORS,
      rainbow: true
    };
  }

  function getCurrentFlame(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  function applyRainbowUi(flame) {
    const button = document.getElementById('ignitionButton');
    const flameCard = document.getElementById('flameCard');
    const flameName = document.getElementById('flameName');
    const flameDescription = document.getElementById('flameDescription');
    const flameSigil = document.getElementById('flameSigil');
    const persistentCanvas = document.getElementById('persistentFlameCanvas');
    if (!button) return;

    const isRainbow = flame?.type === 'rainbow' || flame?.rainbow === true;
    if (!isRainbow) {
      delete button.dataset.flameType;
      persistentCanvas?.classList.remove('rainbow-active');
      return;
    }

    button.dataset.flameType = 'rainbow';
    button.style.setProperty('--flame-primary', '#ff9500');
    button.style.setProperty('--flame-secondary', '#34c759');
    flameCard?.style.setProperty('--flame-primary', '#ff9500');
    flameCard?.style.setProperty('--flame-secondary', '#5856d6');
    if (flameName) flameName.textContent = RAINBOW_NAME;
    if (flameDescription) flameDescription.textContent = RAINBOW_DESCRIPTION;
    if (flameSigil) flameSigil.textContent = '◉';
    persistentCanvas?.classList.add('rainbow-active');
  }

  function scheduleUiSync(flame) {
    window.setTimeout(() => applyRainbowUi(flame), 0);
    window.setTimeout(() => applyRainbowUi(flame), 120);
  }

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame && isAccelerating(body.flame.rhythm)) {
          body.flame = makeRainbowFlame(body.flame);
          nextInit = { ...init, body: JSON.stringify(body) };
          scheduleUiSync(body.flame);
        }
      } catch {
        // Leave unrelated requests untouched.
      }
    }

    const response = await originalFetch(input, nextInit);

    response.clone().json().then((payload) => {
      const flame = getCurrentFlame(payload);
      if (flame || payload?.state?.current) scheduleUiSync(flame);
    }).catch(() => {});

    return response;
  };

  const style = document.createElement('style');
  style.textContent = `
    .ignition-button[data-flame-type="rainbow"] .ignition-ring {
      border-color: rgba(255, 255, 255, 0.78) !important;
      animation: slow-spin 7s linear infinite, rainbow-ring 3.2s linear infinite !important;
      box-shadow: 0 0 30px rgba(255, 255, 255, 0.34), inset 0 0 28px rgba(255, 255, 255, 0.2) !important;
    }

    #persistentFlameCanvas.rainbow-active {
      animation: rainbow-canvas 2.6s linear infinite;
      filter: saturate(1.4) brightness(1.14);
    }

    .ignition-button[data-flame-type="rainbow"] .ignition-core {
      background:
        radial-gradient(circle at 50% 32%, rgba(255,255,255,0.25), transparent 15%),
        conic-gradient(from 0deg, rgba(255,59,48,0.18), rgba(255,149,0,0.18), rgba(255,214,10,0.18), rgba(52,199,89,0.18), rgba(10,132,255,0.18), rgba(88,86,214,0.18), rgba(191,90,242,0.18), rgba(255,59,48,0.18)),
        radial-gradient(circle, rgba(18,10,30,0.2), rgba(8,5,14,0.94) 72%) !important;
    }

    @keyframes rainbow-canvas {
      from { filter: hue-rotate(0deg) saturate(1.45) brightness(1.14); }
      to { filter: hue-rotate(360deg) saturate(1.45) brightness(1.14); }
    }

    @keyframes rainbow-ring {
      from { filter: hue-rotate(0deg) brightness(1.16); }
      to { filter: hue-rotate(360deg) brightness(1.16); }
    }
  `;
  document.head.appendChild(style);
})();
