'use strict';

(() => {
  if (window.__stableFlameEngineV2Loaded) return;
  window.__stableFlameEngineV2Loaded = true;

  const baseFetch = window.fetch.bind(window);
  const baseSetTimeout = window.setTimeout.bind(window);
  const $ = (selector) => document.querySelector(selector);

  const ui = {
    button: $('#ignitionButton'),
    text: $('#ignitionText'),
    ripples: $('#tapRipples'),
    dots: $('#rhythmDots'),
    tempo: $('#tempoLabel'),
    card: $('#flameCard'),
    name: $('#flameName'),
    description: $('#flameDescription'),
    sigil: $('#flameSigil'),
    reset: $('#resetFlameButton'),
    send: $('#sendRoleButton'),
    receive: $('#receiveRoleButton'),
    toast: $('#toast')
  };

  const TYPES = {
    ember: ['恆星火', '穩定而持續的節拍，像守住約定的橙紅火光。', ['#fff0a8', '#ff9f43', '#ff4d2e', '#7e1f2b'], '☀'],
    azure: ['疾風火', '快速密集的節奏，點燃清亮而銳利的藍色火焰。', ['#e9ffff', '#69e7ff', '#168cff', '#3927a8'], '↯'],
    dream: ['夢燼', '緩慢留白的節奏，形成安靜流動的紫粉火光。', ['#fff0ff', '#ff8bd8', '#9a5cff', '#43206f'], '☾'],
    forest: ['森靈火', '長短交錯的節奏，像枝葉間跳動的翠綠生命火。', ['#f2ffd5', '#9cff64', '#1fd69a', '#15665c'], '✤'],
    spark: ['星火', '帶有切分與驚喜的節奏，迸發金白色的傳承火種。', ['#ffffff', '#ffe47d', '#ff9d42', '#e64535'], '✦'],
    rainbow: ['虹焰', '越點越快的節奏，讓七彩火光持續升溫；象徵突破、自由，以及把熱情推向最高點。', ['#ff5c5c', '#ffd65c', '#48e48d', '#6b71ff'], '◉'],
    frost: ['霜晶火', '越點越慢的節奏，凝成冷白與冰藍交錯的霜晶；象徵沉澱、清醒，以及在寂靜中守住純粹。', ['#f7ffff', '#b8f4ff', '#4fc3ff', '#5b7cff'], '❄'],
    thunder: ['雷脈火', '短拍與長停頓交替，如雷光在脈搏間爆裂；象徵覺醒、決斷，以及打破停滯的力量。', ['#fff9b0', '#ffd60a', '#9d4edd', '#3a0ca3'], 'ϟ'],
    tide: ['潮汐火', '先加速再放慢的往返節奏，形成像潮水呼吸般流動的青藍火焰。', ['#d9fff8', '#4ee3c4', '#00a8cc', '#224d8f'], '≋'],
    heart: ['心願火', '兩組三連拍中間留下一次呼吸，點燃柔亮的粉紅火光。', ['#fff2f8', '#ffadd2', '#ff5ca8', '#9b245f'], '♡'],
    dark: ['黯火', '敲擊兩下後，光線沉入紫黑火焰；象徵直面陰影、沉靜蓄力，以及在無光處守住核心。', ['#e9e4ff', '#7660b8', '#2a1d45', '#050308'], '◈'],
    'blue-party': ['歸藍趴火', '前五下快速聚集，第六下放慢落地，讓高亮藍焰爆發派對脈衝。', ['#effcff', '#6ee7ff', '#147cff', '#2720a8'], '♬'],
    dawn: ['破曉火', '前四下沉穩蓄光，後四下突然加速，讓金白火焰穿過夜色。', ['#fffdf0', '#ffe08a', '#ff9f5a', '#d84a32'], '☼'],
    echo: ['回聲火', '三組成對短拍在相近停頓間彼此回應，化成銀藍同心光波。', ['#f7fbff', '#b9ddff', '#7f76ff', '#30236f'], '◎']
  };

  let roomCode = '';
  let deviceId = '';
  let deviceName = '';
  let taps = [];
  let finalizeTimer = null;
  let darkTimer = null;
  let locked = false;
  let pendingUntil = 0;

  const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const spread = (values) => values.length ? Math.max(...values) / Math.max(1, Math.min(...values)) : 1;
  const intervals = () => taps.slice(1).map((time, index) => Math.round(time - taps[index]));
  const last = (values, size) => values.length >= size ? values.slice(-size) : null;

  function deviation(values) {
    if (values.length < 2) return 0;
    const average = mean(values);
    return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
  }

  function fast(values, min = 35, max = 340, ratio = 2.1) {
    return values.length > 0 && values.every((value) => value >= min && value <= max) && spread(values) <= ratio;
  }

  function slow(values, min = 210, max = 920, ratio = 2.05) {
    return values.length > 0 && values.every((value) => value >= min && value <= max) && spread(values) <= ratio;
  }

  function matchBlueParty(v) {
    if (v.length !== 5) return false;
    const quick = v.slice(0, 4);
    return fast(quick, 35, 315, 2) && v[4] >= Math.max(410, mean(quick) * 1.7) && v[4] <= 1500;
  }

  function matchHeart(v) {
    if (v.length !== 5) return false;
    const quick = [v[0], v[1], v[3], v[4]];
    return fast([v[0], v[1]], 35, 340, 2)
      && fast([v[3], v[4]], 35, 340, 2)
      && spread(quick) <= 2.15
      && v[2] >= Math.max(340, mean(quick) * 1.7)
      && v[2] <= 1450;
  }

  function matchEcho(v) {
    if (v.length !== 5) return false;
    const quick = [v[0], v[2], v[4]];
    const pauses = [v[1], v[3]];
    return fast(quick, 35, 360, 2.1)
      && pauses.every((value) => value >= 250 && value <= 1220)
      && spread(pauses) <= 1.8
      && mean(pauses) >= mean(quick) * 1.55;
  }

  function matchDawn(v) {
    if (v.length !== 7) return false;
    const opening = v.slice(0, 3);
    const ending = v.slice(3);
    return slow(opening, 210, 900, 2)
      && fast(ending, 35, 335, 2.2)
      && mean(ending) <= mean(opening) * 0.66
      && Math.max(...ending) <= Math.min(...opening) * 0.92;
  }

  function matchTide(v) {
    if (v.length !== 5) return false;
    const [a, b, c, d, e] = v;
    return a > b && b > c && c < d && d < e && c >= 35 && c <= Math.min(a, e) * 0.84 && spread(v) <= 3.4;
  }

  function matchThunder(v) {
    if (v.length < 4 || v.length > 5) return false;
    return [0, 1].some((offset) => {
      const quick = [];
      const pauses = [];
      v.forEach((value, index) => ((index + offset) % 2 === 0 ? quick : pauses).push(value));
      return quick.length >= 2 && pauses.length >= 2
        && fast(quick, 35, 340, 2.15)
        && pauses.every((value) => value >= 250 && value <= 1200)
        && mean(pauses) >= mean(quick) * 1.7;
    });
  }

  function matchTrend(v, accelerating) {
    if (v.length < 3) return false;
    let matches = 0;
    for (let index = 1; index < v.length; index += 1) {
      if (accelerating ? v[index] <= v[index - 1] * 0.99 : v[index] >= v[index - 1] * 1.01) matches += 1;
    }
    return matches >= v.length - 1
      && (accelerating ? v.at(-1) <= v[0] * 0.74 && mean(v) <= 440 : v.at(-1) >= v[0] * 1.34 && mean(v) >= 210);
  }

  function classifyBase(v) {
    const average = mean(v);
    const variation = average ? deviation(v) / average : 0;
    if (average < 290) return 'azure';
    if (average > 720) return 'dream';
    if (variation < 0.13) return 'ember';
    const changes = [];
    for (let index = 1; index < v.length; index += 1) {
      changes.push(Math.abs(v[index] - v[index - 1]) / Math.max(v[index], v[index - 1]));
    }
    return variation > 0.42 || mean(changes) > 0.38 ? 'forest' : 'spark';
  }

  function classify(v) {
    const rules = [
      ['dawn', 7, matchDawn],
      ['blue-party', 5, matchBlueParty],
      ['heart', 5, matchHeart],
      ['echo', 5, matchEcho],
      ['tide', 5, matchTide],
      ['thunder', 5, matchThunder],
      ['thunder', 4, matchThunder]
    ];
    for (const [type, size, matcher] of rules) {
      const sample = last(v, size);
      if (sample && matcher(sample)) return { type, rhythm: sample };
    }
    const trends = [v, last(v, 5), last(v, 4), last(v, 3)].filter(Boolean);
    for (const sample of trends) if (matchTrend(sample, true)) return { type: 'rainbow', rhythm: sample };
    for (const sample of trends) if (matchTrend(sample, false)) return { type: 'frost', rhythm: sample };
    return { type: classifyBase(v), rhythm: v };
  }

  function delayFor(v) {
    if (taps.length === 5 && fast(v, 35, 325, 2)) return 1750;
    if ((taps.length === 2 || taps.length === 4) && v.at(-1) >= 35 && v.at(-1) <= 380) return 1450;
    if (taps.length === 4 && slow(v, 200, 920, 2.1)) return 1350;
    return 1050;
  }

  function showToast(message) {
    if (!ui.toast) return;
    ui.toast.textContent = message;
    ui.toast.classList.add('show');
    baseSetTimeout(() => ui.toast.classList.remove('show'), 2200);
  }

  function addRipple() {
    if (!ui.ripples) return;
    const ripple = document.createElement('span');
    ripple.className = 'tap-ripple';
    ui.ripples.appendChild(ripple);
    baseSetTimeout(() => ripple.remove(), 750);
  }

  function renderPreview(v) {
    if (ui.dots) {
      ui.dots.innerHTML = '';
      taps.forEach((_, index) => {
        if (index > 0) {
          const gap = document.createElement('span');
          gap.className = 'rhythm-gap';
          gap.style.width = `${Math.min(40, Math.max(7, v[index - 1] / 22))}px`;
          ui.dots.appendChild(gap);
        }
        const dot = document.createElement('span');
        dot.className = 'rhythm-dot';
        ui.dots.appendChild(dot);
      });
    }
    if (ui.tempo) ui.tempo.textContent = v.length ? `${Math.round(60000 / mean(v))} BPM` : '-- BPM';
    if (ui.text) ui.text.innerHTML = taps.length < 3 ? `再點 ${3 - taps.length} 次` : '停下<br>成火';
  }

  function renderFlame(flame) {
    const meta = TYPES[flame.type] || TYPES.spark;
    const colors = flame.colors || meta[2];
    locked = true;
    ui.button?.classList.add('lit');
    if (ui.button) {
      ui.button.dataset.flameType = flame.type;
      ui.button.style.setProperty('--flame-primary', colors[1] || colors[0]);
      ui.button.style.setProperty('--flame-secondary', colors[2] || colors[1]);
    }
    ui.card?.classList.remove('empty');
    if (ui.card) {
      ui.card.dataset.flameType = flame.type;
      ui.card.style.setProperty('--flame-primary', colors[1] || colors[0]);
      ui.card.style.setProperty('--flame-secondary', colors[2] || colors[1]);
    }
    if (ui.name) ui.name.textContent = flame.name || meta[0];
    if (ui.description) ui.description.textContent = flame.description || meta[1];
    if (ui.sigil) ui.sigil.textContent = meta[3];
    if (ui.reset) ui.reset.disabled = false;
    if (ui.text) ui.text.innerHTML = '火種<br>燃燒中';
    if (ui.tempo) ui.tempo.textContent = flame.tempo ? `${flame.tempo} BPM` : '-- BPM';
    ui.send?.classList.add('active');
    ui.receive?.classList.remove('active');
  }

  function makeFlame(type, rhythm) {
    const meta = TYPES[type];
    return {
      id: `stable-v2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      name: meta[0],
      description: meta[1],
      colors: meta[2],
      seed: Math.abs(rhythm.reduce((hash, value) => Math.imul(hash ^ value, 16777619), 2166136261) >>> 0),
      tempo: rhythm.length ? Math.round(60000 / mean(rhythm)) : 0,
      rhythm,
      bornAt: Date.now(),
      origin: deviceName || '星火旅人',
      specialFlame: !['ember', 'azure', 'dream', 'forest', 'spark'].includes(type)
    };
  }

  async function syncFlame(flame) {
    renderFlame(flame);
    pendingUntil = Date.now() + 2200;
    navigator.vibrate?.([35, 40, 80]);
    if (!roomCode || !deviceId) {
      showToast('房間資料尚未同步，請再試一次');
      locked = false;
      return;
    }
    try {
      const response = await baseFetch('/api/flame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ roomCode, deviceId, flame })
      });
      if (!response.ok) throw new Error('sync failed');
    } catch {
      showToast('火焰已生成，但同步失敗');
    }
  }

  async function finalizeDark() {
    darkTimer = null;
    if (locked || taps.length !== 2) return;
    const gap = intervals()[0];
    if (!Number.isFinite(gap) || gap < 70 || gap > 700) return;
    taps = [];
    clearTimeout(finalizeTimer);
    finalizeTimer = null;
    await syncFlame(makeFlame('dark', [gap]));
  }

  async function finalizeNormal() {
    finalizeTimer = null;
    if (locked || taps.length < 3) return;
    const values = intervals();
    const result = classify(values);
    taps = [];
    clearTimeout(darkTimer);
    darkTimer = null;
    await syncFlame(makeFlame(result.type, result.rhythm));
  }

  function onTap(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (locked) {
      navigator.vibrate?.([16, 24, 16]);
      return;
    }
    const now = performance.now();
    const previous = taps.at(-1);
    if (previous && now - previous > 1900) taps = [];
    if (taps.length >= 10) taps.shift();
    taps.push(now);

    ui.button?.classList.add('tapped');
    baseSetTimeout(() => ui.button?.classList.remove('tapped'), 120);
    addRipple();
    navigator.vibrate?.(18);

    const values = intervals();
    renderPreview(values);
    clearTimeout(finalizeTimer);
    clearTimeout(darkTimer);

    if (taps.length === 2) darkTimer = baseSetTimeout(finalizeDark, 560);
    if (taps.length >= 3) finalizeTimer = baseSetTimeout(finalizeNormal, delayFor(values));
  }

  function resetLocal() {
    locked = false;
    pendingUntil = 0;
    taps = [];
    clearTimeout(finalizeTimer);
    clearTimeout(darkTimer);
    finalizeTimer = null;
    darkTimer = null;
  }

  function currentFlame(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  window.fetch = async (input, init = {}) => {
    const response = await baseFetch(input, init);
    const url = typeof input === 'string' ? input : input?.url || '';
    response.clone().json().then((payload) => {
      if (url.includes('/api/join')) {
        roomCode = payload?.roomCode || roomCode;
        deviceId = payload?.deviceId || deviceId;
        deviceName = $('#nameInput')?.value?.trim() || deviceName;
      }
      if (url.includes('/api/state')) {
        try {
          const parsed = new URL(url, location.origin);
          roomCode = parsed.searchParams.get('room') || roomCode;
          deviceId = parsed.searchParams.get('device') || deviceId;
        } catch {}
      }
      const flame = currentFlame(payload);
      if (flame) renderFlame(flame);
      else if ((payload?.state?.current || payload?.current) && Date.now() > pendingUntil) locked = false;
    }).catch(() => {});
    return response;
  };

  ui.button?.addEventListener('pointerdown', onTap, true);
  ui.reset?.addEventListener('click', resetLocal, true);

  const style = document.createElement('style');
  style.textContent = `
    .ignition-button[data-flame-type="dark"] .ignition-ring {
      border-color: rgba(118, 96, 184, 0.58) !important;
      box-shadow: 0 0 26px rgba(85, 60, 145, 0.36), inset 0 0 40px rgba(10, 5, 20, 0.86) !important;
      animation: dark-v2-ring 5.8s ease-in-out infinite !important;
    }
    .ignition-button[data-flame-type="dark"] #persistentFlameCanvas {
      filter: saturate(.82) brightness(.78) contrast(1.28);
    }
    @keyframes dark-v2-ring {
      0%, 100% { transform: scale(.985); opacity: .65; }
      50% { transform: scale(1.025); opacity: .95; }
    }
  `;
  document.head.appendChild(style);
})();
