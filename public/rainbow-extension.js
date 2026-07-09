'use strict';

(() => {
  const SPECIAL_FLAMES = {
    rainbow: {
      name: '虹焰',
      description: '越點越快的加速節奏，喚醒紅、橙、黃、綠、藍、靛、紫交織的七彩火焰。',
      colors: ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#5856d6', '#bf5af2'],
      sigil: '◉'
    },
    frost: {
      name: '霜晶火',
      description: '越點越慢的節奏，讓火焰凝結成冷白與冰藍交錯的霜晶之火。',
      colors: ['#f7ffff', '#b8f4ff', '#4fc3ff', '#5b7cff'],
      sigil: '❄'
    },
    thunder: {
      name: '雷脈火',
      description: '短拍與長停頓交替，如雷光在脈搏間爆裂，迸發金紫色電火。',
      colors: ['#fff9b0', '#ffd60a', '#9d4edd', '#3a0ca3'],
      sigil: 'ϟ'
    },
    tide: {
      name: '潮汐火',
      description: '先加速再放慢的往返節奏，形成像潮水呼吸般流動的青藍火焰。',
      colors: ['#d9fff8', '#4ee3c4', '#00a8cc', '#224d8f'],
      sigil: '≋'
    }
  };

  const originalFetch = window.fetch.bind(window);

  function countTrend(intervals, comparator) {
    let count = 0;
    for (let index = 1; index < intervals.length; index += 1) {
      if (comparator(intervals[index], intervals[index - 1])) count += 1;
    }
    return count;
  }

  function isAccelerating(intervals) {
    if (!Array.isArray(intervals) || intervals.length < 3) return false;
    const steps = intervals.length - 1;
    const clearDecreases = countTrend(intervals, (current, previous) => current <= previous * 0.92);
    const nonIncreases = countTrend(intervals, (current, previous) => current <= previous * 1.02);
    return clearDecreases >= Math.ceil(steps * 0.66)
      && nonIncreases >= steps - 1
      && intervals.at(-1) <= intervals[0] * 0.68;
  }

  function isDecelerating(intervals) {
    if (!Array.isArray(intervals) || intervals.length < 3) return false;
    const steps = intervals.length - 1;
    const clearIncreases = countTrend(intervals, (current, previous) => current >= previous * 1.1);
    const nonDecreases = countTrend(intervals, (current, previous) => current >= previous * 0.98);
    return clearIncreases >= Math.ceil(steps * 0.66)
      && nonDecreases >= steps - 1
      && intervals.at(-1) >= intervals[0] * 1.48;
  }

  function isTidal(intervals) {
    if (!Array.isArray(intervals) || intervals.length < 5) return false;
    const minimum = Math.min(...intervals);
    const minimumIndex = intervals.indexOf(minimum);
    if (minimumIndex < 2 || minimumIndex > intervals.length - 3) return false;

    const left = intervals.slice(0, minimumIndex + 1);
    const right = intervals.slice(minimumIndex);
    const leftSteps = left.length - 1;
    const rightSteps = right.length - 1;
    const leftDecreases = countTrend(left, (current, previous) => current <= previous * 1.02);
    const rightIncreases = countTrend(right, (current, previous) => current >= previous * 0.98);

    return leftDecreases >= leftSteps - 1
      && rightIncreases >= rightSteps - 1
      && intervals[0] >= minimum * 1.45
      && intervals.at(-1) >= minimum * 1.45;
  }

  function isThunder(intervals) {
    if (!Array.isArray(intervals) || intervals.length < 4) return false;
    const sorted = [...intervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const labels = intervals.map((interval) => {
      if (interval <= median * 0.72) return 'short';
      if (interval >= median * 1.25) return 'long';
      return 'middle';
    });

    const shortCount = labels.filter((label) => label === 'short').length;
    const longCount = labels.filter((label) => label === 'long').length;
    const middleCount = labels.filter((label) => label === 'middle').length;
    let flips = 0;
    for (let index = 1; index < labels.length; index += 1) {
      if (labels[index] !== 'middle' && labels[index - 1] !== 'middle' && labels[index] !== labels[index - 1]) flips += 1;
    }

    return shortCount >= 2
      && longCount >= 2
      && middleCount <= 1
      && flips >= labels.length - 2;
  }

  function detectSpecialFlame(intervals) {
    if (isAccelerating(intervals)) return 'rainbow';
    if (isDecelerating(intervals)) return 'frost';
    if (isTidal(intervals)) return 'tide';
    if (isThunder(intervals)) return 'thunder';
    return null;
  }

  function makeSpecialFlame(flame, type) {
    const meta = SPECIAL_FLAMES[type];
    return {
      ...flame,
      type,
      name: meta.name,
      colors: meta.colors,
      specialFlame: true
    };
  }

  function getCurrentFlame(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  function applySpecialUi(flame) {
    const button = document.getElementById('ignitionButton');
    const flameCard = document.getElementById('flameCard');
    const flameName = document.getElementById('flameName');
    const flameDescription = document.getElementById('flameDescription');
    const flameSigil = document.getElementById('flameSigil');
    if (!button) return;

    const type = SPECIAL_FLAMES[flame?.type] ? flame.type : null;
    if (!type) {
      delete button.dataset.flameType;
      delete flameCard?.dataset.flameType;
      return;
    }

    const meta = SPECIAL_FLAMES[type];
    button.dataset.flameType = type;
    if (flameCard) flameCard.dataset.flameType = type;
    button.style.setProperty('--flame-primary', meta.colors[1] || meta.colors[0]);
    button.style.setProperty('--flame-secondary', meta.colors[2] || meta.colors[1]);
    flameCard?.style.setProperty('--flame-primary', meta.colors[1] || meta.colors[0]);
    flameCard?.style.setProperty('--flame-secondary', meta.colors[2] || meta.colors[1]);
    if (flameName) flameName.textContent = meta.name;
    if (flameDescription) flameDescription.textContent = meta.description;
    if (flameSigil) flameSigil.textContent = meta.sigil;
  }

  function scheduleUiSync(flame) {
    [0, 100, 360].forEach((delay) => window.setTimeout(() => applySpecialUi(flame), delay));
  }

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame) {
          const specialType = detectSpecialFlame(body.flame.rhythm);
          if (specialType) {
            body.flame = makeSpecialFlame(body.flame, specialType);
            nextInit = { ...init, body: JSON.stringify(body) };
            scheduleUiSync(body.flame);
          }
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

  function addPatternGuide() {
    const readout = document.querySelector('.rhythm-readout');
    if (!readout || document.getElementById('specialFlameGuide')) return;
    const guide = document.createElement('div');
    guide.id = 'specialFlameGuide';
    guide.className = 'special-flame-guide';
    guide.innerHTML = `
      <span>特殊火種</span>
      <div><b>虹焰</b> 越點越快</div>
      <div><b>霜晶火</b> 越點越慢</div>
      <div><b>雷脈火</b> 短長交替</div>
      <div><b>潮汐火</b> 先快後慢</div>
    `;
    readout.insertAdjacentElement('afterend', guide);
  }

  const style = document.createElement('style');
  style.textContent = `
    .special-flame-guide {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
      margin: 12px 0 16px;
      color: rgba(244, 236, 255, 0.78);
      font-size: 0.72rem;
    }

    .special-flame-guide > span {
      grid-column: 1 / -1;
      color: rgba(255, 221, 166, 0.78);
      font-size: 0.64rem;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .special-flame-guide > div {
      padding: 7px 9px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 11px;
      background: rgba(255, 255, 255, 0.035);
    }

    .special-flame-guide b {
      display: block;
      margin-bottom: 2px;
      color: #fff7e9;
      font-size: 0.76rem;
    }

    .ignition-button[data-flame-type="rainbow"] .ignition-ring {
      border-color: rgba(255, 255, 255, 0.78) !important;
      animation: slow-spin 7s linear infinite, rainbow-ring 3.2s linear infinite !important;
      box-shadow: 0 0 30px rgba(255, 255, 255, 0.34), inset 0 0 28px rgba(255, 255, 255, 0.2) !important;
    }

    .ignition-button[data-flame-type="rainbow"] #persistentFlameCanvas {
      animation: rainbow-canvas 2.6s linear infinite;
    }

    .ignition-button[data-flame-type="rainbow"] .ignition-core {
      background:
        radial-gradient(circle at 50% 32%, rgba(255,255,255,0.25), transparent 15%),
        conic-gradient(from 0deg, rgba(255,59,48,0.18), rgba(255,149,0,0.18), rgba(255,214,10,0.18), rgba(52,199,89,0.18), rgba(10,132,255,0.18), rgba(88,86,214,0.18), rgba(191,90,242,0.18), rgba(255,59,48,0.18)),
        radial-gradient(circle, rgba(18,10,30,0.2), rgba(8,5,14,0.94) 72%) !important;
    }

    .ignition-button[data-flame-type="frost"] .ignition-ring {
      border-color: rgba(205, 249, 255, 0.82) !important;
      box-shadow: 0 0 28px rgba(79, 195, 255, 0.42), inset 0 0 30px rgba(184, 244, 255, 0.24) !important;
      animation: frost-ring 3.6s ease-in-out infinite !important;
    }

    .ignition-button[data-flame-type="frost"] #persistentFlameCanvas {
      animation: frost-flame 3s ease-in-out infinite;
    }

    .ignition-button[data-flame-type="frost"] .ignition-core {
      background:
        repeating-conic-gradient(from 15deg, rgba(247,255,255,0.14) 0 7deg, transparent 7deg 22deg),
        radial-gradient(circle at 50% 38%, rgba(184,244,255,0.22), rgba(43,87,146,0.12) 48%, rgba(5,11,25,0.96) 74%) !important;
    }

    .ignition-button[data-flame-type="thunder"] .ignition-ring {
      border-color: rgba(255, 232, 74, 0.82) !important;
      border-style: dashed !important;
      box-shadow: 0 0 34px rgba(255, 214, 10, 0.34), inset 0 0 26px rgba(157, 78, 221, 0.3) !important;
      animation: thunder-ring 1.05s steps(1, end) infinite !important;
    }

    .ignition-button[data-flame-type="thunder"] #persistentFlameCanvas {
      animation: thunder-flame 1.08s steps(1, end) infinite;
    }

    .ignition-button[data-flame-type="thunder"] .ignition-core {
      background:
        linear-gradient(118deg, transparent 44%, rgba(255,246,120,0.25) 47%, transparent 50%),
        linear-gradient(62deg, transparent 46%, rgba(157,78,221,0.22) 49%, transparent 52%),
        radial-gradient(circle, rgba(50,18,82,0.25), rgba(8,5,14,0.96) 72%) !important;
    }

    .ignition-button[data-flame-type="tide"] .ignition-ring {
      border-color: rgba(78, 227, 196, 0.72) !important;
      box-shadow: 0 0 32px rgba(0, 168, 204, 0.34), inset 0 0 30px rgba(78, 227, 196, 0.22) !important;
      animation: tide-ring 4.6s ease-in-out infinite !important;
    }

    .ignition-button[data-flame-type="tide"] #persistentFlameCanvas {
      transform-origin: center;
      animation: tide-flame 4.2s ease-in-out infinite;
    }

    .ignition-button[data-flame-type="tide"] .ignition-core {
      background:
        conic-gradient(from 180deg, rgba(78,227,196,0.16), rgba(0,168,204,0.2), rgba(34,77,143,0.18), rgba(78,227,196,0.16)),
        radial-gradient(circle, rgba(12,61,85,0.2), rgba(5,10,22,0.96) 72%) !important;
    }

    .flame-card[data-flame-type="rainbow"] {
      background: linear-gradient(135deg, rgba(255,59,48,0.12), rgba(52,199,89,0.09), rgba(88,86,214,0.13));
    }

    .flame-card[data-flame-type="frost"] {
      background: linear-gradient(135deg, rgba(184,244,255,0.13), rgba(79,195,255,0.1), rgba(91,124,255,0.12));
    }

    .flame-card[data-flame-type="thunder"] {
      background: linear-gradient(135deg, rgba(255,214,10,0.12), rgba(157,78,221,0.12), rgba(58,12,163,0.13));
    }

    .flame-card[data-flame-type="tide"] {
      background: linear-gradient(135deg, rgba(78,227,196,0.12), rgba(0,168,204,0.11), rgba(34,77,143,0.13));
    }

    @keyframes rainbow-canvas {
      from { filter: hue-rotate(0deg) saturate(1.45) brightness(1.14); }
      to { filter: hue-rotate(360deg) saturate(1.45) brightness(1.14); }
    }

    @keyframes rainbow-ring {
      from { filter: hue-rotate(0deg) brightness(1.16); }
      to { filter: hue-rotate(360deg) brightness(1.16); }
    }

    @keyframes frost-ring {
      0%, 100% { transform: scale(0.99) rotate(0deg); filter: brightness(1); }
      50% { transform: scale(1.035) rotate(4deg); filter: brightness(1.35); }
    }

    @keyframes frost-flame {
      0%, 100% { filter: saturate(0.85) brightness(1.12) blur(0px); opacity: 0.9; }
      50% { filter: saturate(1.1) brightness(1.35) blur(0.3px); opacity: 1; }
    }

    @keyframes thunder-ring {
      0%, 18%, 24%, 68%, 74%, 100% { filter: brightness(1); transform: rotate(0deg) scale(1); }
      20%, 70% { filter: brightness(1.8); transform: rotate(2deg) scale(1.045); }
      22%, 72% { filter: brightness(0.85); transform: rotate(-1deg) scale(0.99); }
    }

    @keyframes thunder-flame {
      0%, 17%, 24%, 67%, 74%, 100% { filter: brightness(1.05) saturate(1.15); }
      19%, 69% { filter: brightness(1.9) saturate(1.5) hue-rotate(18deg); }
      21%, 71% { filter: brightness(0.82) saturate(1.2); }
    }

    @keyframes tide-ring {
      0%, 100% { transform: scale(0.985) rotate(-2deg); filter: brightness(0.95); }
      50% { transform: scale(1.045) rotate(3deg); filter: brightness(1.28); }
    }

    @keyframes tide-flame {
      0%, 100% { transform: translateX(-3px) rotate(-2deg) scale(0.98); filter: saturate(1.05) brightness(1.04); }
      50% { transform: translateX(3px) rotate(2deg) scale(1.035); filter: saturate(1.24) brightness(1.18); }
    }

    @media (max-width: 430px) {
      .special-flame-guide {
        grid-template-columns: 1fr 1fr;
      }
    }
  `;
  document.head.appendChild(style);
  addPatternGuide();
})();
