'use strict';

(() => {
  const FLAMES = {
    dawn: {
      type: 'dawn',
      name: '破曉火',
      description: '前四下沉穩蓄光，後四下突然加速，讓金白火焰穿過夜色向上升起；象徵重新出發、跨越轉折，以及相信黎明終會到來。',
      colors: ['#fffdf0', '#ffe08a', '#ff9f5a', '#d84a32'],
      sigil: '☼',
      meaning: '重新出發、跨越轉折，以及相信黎明終會到來。'
    },
    echo: {
      type: 'echo',
      name: '回聲火',
      description: '三組成對的短拍在相近停頓間彼此回應，化成銀藍色同心光波；象徵記憶、回應，以及真心終會被另一顆心聽見。',
      colors: ['#f7fbff', '#b9ddff', '#7f76ff', '#30236f'],
      sigil: '◎',
      meaning: '記憶、回應，以及真心終會被另一顆心聽見。'
    }
  };

  const originalFetch = window.fetch.bind(window);
  const button = document.getElementById('ignitionButton');
  const flameCard = document.getElementById('flameCard');
  const flameName = document.getElementById('flameName');
  const flameDescription = document.getElementById('flameDescription');
  const flameSigil = document.getElementById('flameSigil');

  function mean(values) {
    return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  }

  function spreadRatio(values) {
    return Math.max(...values) / Math.max(1, Math.min(...values));
  }

  function isDawnRhythm(intervals) {
    if (!Array.isArray(intervals) || intervals.length !== 7) return false;

    const slow = intervals.slice(0, 3).map(Number);
    const fast = intervals.slice(3).map(Number);
    if (![...slow, ...fast].every(Number.isFinite)) return false;

    const slowAverage = mean(slow);
    const fastAverage = mean(fast);

    return slowAverage >= 360
      && slowAverage <= 760
      && fastAverage >= 65
      && fastAverage <= 255
      && spreadRatio(slow) <= 1.45
      && spreadRatio(fast) <= 1.55
      && fastAverage <= slowAverage * 0.5
      && Math.max(...fast) <= Math.min(...slow) * 0.72;
  }

  function isEchoRhythm(intervals) {
    if (!Array.isArray(intervals) || intervals.length !== 5) return false;

    const values = intervals.map(Number);
    if (!values.every(Number.isFinite)) return false;

    const shortBeats = [values[0], values[2], values[4]];
    const pauses = [values[1], values[3]];
    const shortAverage = mean(shortBeats);
    const pauseAverage = mean(pauses);

    return shortAverage >= 75
      && shortAverage <= 300
      && pauseAverage >= 390
      && pauseAverage <= 930
      && spreadRatio(shortBeats) <= 1.55
      && spreadRatio(pauses) <= 1.35
      && pauseAverage >= shortAverage * 2.15;
  }

  function detectType(intervals) {
    if (isDawnRhythm(intervals)) return 'dawn';
    if (isEchoRhythm(intervals)) return 'echo';
    return null;
  }

  function makeFlame(flame, type) {
    const meta = FLAMES[type];
    return {
      ...flame,
      type,
      name: meta.name,
      colors: meta.colors,
      specialFlame: true,
      symbolicMeaning: meta.meaning,
      rhythmSignature: type === 'dawn' ? 'four-slow-four-fast' : 'three-echo-pairs'
    };
  }

  function currentFlame(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  function applyUi(flame) {
    if (!button) return;
    const type = FLAMES[flame?.type] ? flame.type : null;

    if (!type) {
      if (FLAMES[button.dataset.flameType]) delete button.dataset.flameType;
      if (flameCard && FLAMES[flameCard.dataset.flameType]) delete flameCard.dataset.flameType;
      return;
    }

    const meta = FLAMES[type];
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
    [0, 140, 420, 880].forEach((delay) => window.setTimeout(() => applyUi(flame), delay));
  }

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame) {
          const type = detectType(body.flame.rhythm);
          if (type) {
            body.flame = makeFlame(body.flame, type);
            nextInit = { ...init, body: JSON.stringify(body) };
            scheduleUi(body.flame);
          }
        }
      } catch {
        // Leave unrelated requests unchanged.
      }
    }

    const response = await originalFetch(input, nextInit);
    response.clone().json().then((payload) => {
      const flame = currentFlame(payload);
      if (flame || payload?.state?.current) scheduleUi(flame);
    }).catch(() => {});
    return response;
  };

  if (flameName) {
    new MutationObserver(() => {
      const name = flameName.textContent.trim();
      const type = Object.keys(FLAMES).find((key) => FLAMES[key].name === name);
      if (type) applyUi({ type });
    }).observe(flameName, { childList: true, subtree: true });
  }

  const style = document.createElement('style');
  style.textContent = `
    .ignition-button[data-flame-type="dawn"] .ignition-ring {
      border-color: rgba(255, 224, 138, 0.9) !important;
      box-shadow: 0 0 30px rgba(255, 159, 90, 0.42), 0 -16px 46px rgba(255, 253, 240, 0.24), inset 0 0 28px rgba(255, 224, 138, 0.22) !important;
      animation: dawn-ring 2.8s ease-in-out infinite !important;
    }

    .ignition-button[data-flame-type="dawn"] #persistentFlameCanvas {
      transform-origin: 50% 76%;
      animation: dawn-flame 2.8s ease-in-out infinite;
      filter: saturate(1.12) brightness(1.26);
    }

    .ignition-button[data-flame-type="dawn"] .ignition-core {
      background:
        linear-gradient(to top, rgba(216,74,50,0.12), rgba(255,159,90,0.16) 42%, rgba(255,253,240,0.2) 76%, transparent),
        radial-gradient(circle at 50% 72%, rgba(255,224,138,0.25), rgba(38,17,20,0.22) 48%, rgba(7,5,14,0.96) 76%) !important;
    }

    .flame-card[data-flame-type="dawn"] {
      border-color: rgba(255, 224, 138, 0.24);
      background: linear-gradient(135deg, rgba(255,253,240,0.13), rgba(255,159,90,0.13), rgba(216,74,50,0.12));
    }

    .ignition-button[data-flame-type="echo"] .ignition-ring {
      border-color: rgba(185, 221, 255, 0.82) !important;
      box-shadow: 0 0 0 5px rgba(185,221,255,0.08), 0 0 0 13px rgba(127,118,255,0.05), 0 0 34px rgba(127,118,255,0.34), inset 0 0 30px rgba(185,221,255,0.18) !important;
      animation: echo-ring 2.4s ease-out infinite !important;
    }

    .ignition-button[data-flame-type="echo"] #persistentFlameCanvas {
      animation: echo-flame 2.4s ease-in-out infinite;
      filter: saturate(0.92) brightness(1.18);
    }

    .ignition-button[data-flame-type="echo"] .ignition-core {
      background:
        repeating-radial-gradient(circle, rgba(185,221,255,0.13) 0 2px, transparent 3px 15px),
        radial-gradient(circle, rgba(127,118,255,0.16), rgba(48,35,111,0.2) 50%, rgba(6,5,15,0.97) 76%) !important;
    }

    .flame-card[data-flame-type="echo"] {
      border-color: rgba(185, 221, 255, 0.22);
      background: linear-gradient(135deg, rgba(247,251,255,0.1), rgba(185,221,255,0.11), rgba(48,35,111,0.15));
    }

    @keyframes dawn-ring {
      0%, 100% { transform: scale(0.99); filter: brightness(1); }
      48% { transform: scale(1.035) translateY(-2px); filter: brightness(1.38); }
      68% { transform: scale(1.01) translateY(-5px); filter: brightness(1.18); }
    }

    @keyframes dawn-flame {
      0%, 100% { transform: translateY(3px) scaleY(0.97); filter: saturate(1.05) brightness(1.12); }
      50% { transform: translateY(-7px) scaleY(1.08); filter: saturate(1.2) brightness(1.38); }
    }

    @keyframes echo-ring {
      0% { transform: scale(0.97); opacity: 0.72; filter: brightness(1); }
      38% { transform: scale(1.025); opacity: 1; filter: brightness(1.35); }
      72% { transform: scale(1.055); opacity: 0.76; filter: brightness(1.1); }
      100% { transform: scale(1.075); opacity: 0.58; filter: brightness(0.94); }
    }

    @keyframes echo-flame {
      0%, 100% { transform: scale(0.985); opacity: 0.88; }
      24% { transform: scale(1.035); opacity: 1; }
      48% { transform: scale(0.995); opacity: 0.9; }
      72% { transform: scale(1.025); opacity: 0.98; }
    }
  `;
  document.head.appendChild(style);
})();
