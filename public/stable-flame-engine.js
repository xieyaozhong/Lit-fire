'use strict';

(() => {
  if (window.__stableFlameEngineLoaded) return;
  window.__stableFlameEngineLoaded = true;

  const nativeFetch = window.fetch.bind(window);
  const nativeSetTimeout = window.setTimeout.bind(window);

  const TYPES = {
    ember: { name: '恆星火', description: '穩定而持續的節拍，像守住約定的橙紅火光。', colors: ['#fff0a8', '#ff9f43', '#ff4d2e', '#7e1f2b'], sigil: '☀' },
    azure: { name: '疾風火', description: '快速密集的節奏，點燃清亮而銳利的藍色火焰。', colors: ['#e9ffff', '#69e7ff', '#168cff', '#3927a8'], sigil: '↯' },
    dream: { name: '夢燼', description: '緩慢留白的節奏，形成安靜流動的紫粉火光。', colors: ['#fff0ff', '#ff8bd8', '#9a5cff', '#43206f'], sigil: '☾' },
    forest: { name: '森靈火', description: '長短交錯的節奏，像枝葉間跳動的翠綠生命火。', colors: ['#f2ffd5', '#9cff64', '#1fd69a', '#15665c'], sigil: '✤' },
    spark: { name: '星火', description: '帶有切分與驚喜的節奏，迸發金白色的傳承火種。', colors: ['#ffffff', '#ffe47d', '#ff9d42', '#e64535'], sigil: '✦' },
    rainbow: { name: '虹焰', description: '越點越快的節奏，讓七彩火光持續升溫；象徵突破、自由，以及把熱情推向最高點。', colors: ['#ff5c5c', '#ffd65c', '#48e48d', '#6b71ff'], sigil: '◉' },
    frost: { name: '霜晶火', description: '越點越慢的節奏，凝成冷白與冰藍交錯的霜晶；象徵沉澱、清醒，以及在寂靜中守住純粹。', colors: ['#f7ffff', '#b8f4ff', '#4fc3ff', '#5b7cff'], sigil: '❄' },
    thunder: { name: '雷脈火', description: '短拍與長停頓交替，如雷光在脈搏間爆裂；象徵覺醒、決斷，以及打破停滯的力量。', colors: ['#fff9b0', '#ffd60a', '#9d4edd', '#3a0ca3'], sigil: 'ϟ' },
    tide: { name: '潮汐火', description: '先加速再放慢的往返節奏，形成像潮水呼吸般流動的青藍火焰；象徵包容、節奏，以及懂得前進也懂得退讓。', colors: ['#d9fff8', '#4ee3c4', '#00a8cc', '#224d8f'], sigil: '≋' },
    heart: { name: '心願火', description: '兩組溫柔的三連拍，中間留下一次呼吸，點燃柔亮的粉紅火光；象徵溫柔、勇敢表達，以及把真心傳給重要的人。', colors: ['#fff2f8', '#ffadd2', '#ff5ca8', '#9b245f'], sigil: '♡' },
    dark: { name: '黯火', description: '緩慢兩拍、長久沉默後突然收束，凝成吞噬光線的紫黑火焰；象徵直面陰影、沉靜蓄力，以及在無光處仍守住自己的核心。', colors: ['#e9e4ff', '#7660b8', '#2a1d45', '#050308'], sigil: '◈' },
    'blue-party': { name: '歸藍趴火', description: '前五下快速聚集節拍，第六下放慢落地，讓高亮藍焰在停頓後爆發派對脈衝；象徵重新歸隊、放下拘束，以及和同伴一起把快樂點燃。', colors: ['#effcff', '#6ee7ff', '#147cff', '#2720a8'], sigil: '♬' },
    dawn: { name: '破曉火', description: '前四下沉穩蓄光，後四下突然加速，讓金白火焰穿過夜色向上升起；象徵重新出發、跨越轉折，以及相信黎明終會到來。', colors: ['#fffdf0', '#ffe08a', '#ff9f5a', '#d84a32'], sigil: '☼' },
    echo: { name: '回聲火', description: '三組成對的短拍在相近停頓間彼此回應，化成銀藍色同心光波；象徵記憶、回應，以及真心終會被另一顆心聽見。', colors: ['#f7fbff', '#b9ddff', '#7f76ff', '#30236f'], sigil: '◎' }
  };

  const button = document.getElementById('ignitionButton');
  const ignitionText = document.getElementById('ignitionText');
  const tapRipples = document.getElementById('tapRipples');
  const rhythmDots = document.getElementById('rhythmDots');
  const tempoLabel = document.getElementById('tempoLabel');
  const flameCard = document.getElementById('flameCard');
  const flameName = document.getElementById('flameName');
  const flameDescription = document.getElementById('flameDescription');
  const flameSigil = document.getElementById('flameSigil');
  const resetButton = document.getElementById('resetFlameButton');
  const sendRoleButton = document.getElementById('sendRoleButton');
  const receiveRoleButton = document.getElementById('receiveRoleButton');
  const toast = document.getElementById('toast');

  let roomCode = '';
  let deviceId = '';
  let deviceName = '';
  let taps = [];
  let timer = null;
  let locked = false;
  let pendingUntil = 0;

  function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function deviation(values) {
    if (values.length < 2) return 0;
    const average = mean(values);
    return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
  }

  function spread(values) {
    return values.length ? Math.max(...values) / Math.max(1, Math.min(...values)) : 1;
  }

  function intervalsFromTaps() {
    return taps.slice(1).map((time, index) => Math.round(time - taps[index]));
  }

  function lastWindow(values, size) {
    return values.length >= size ? values.slice(-size) : null;
  }

  function fastGroup(values, min = 35, max = 330, maxSpread = 2) {
    return values.length > 0
      && values.every((value) => value >= min && value <= max)
      && spread(values) <= maxSpread;
  }

  function slowGroup(values, min = 220, max = 900, maxSpread = 1.95) {
    return values.length > 0
      && values.every((value) => value >= min && value <= max)
      && spread(values) <= maxSpread;
  }

  function matchBlueParty(values) {
    if (values.length !== 5) return false;
    const fast = values.slice(0, 4);
    const slow = values[4];
    const average = mean(fast);
    return fastGroup(fast, 35, 315, 1.95)
      && slow >= Math.max(410, average * 1.72)
      && slow <= 1500;
  }

  function matchHeart(values) {
    if (values.length !== 5) return false;
    const left = values.slice(0, 2);
    const pause = values[2];
    const right = values.slice(3);
    const fast = [...left, ...right];
    const average = mean(fast);
    return fastGroup(left, 40, 335, 1.95)
      && fastGroup(right, 40, 335, 1.95)
      && spread(fast) <= 2.1
      && pause >= Math.max(340, average * 1.75)
      && pause <= 1450;
  }

  function matchDark(values) {
    if (values.length !== 5) return false;
    const opening = values.slice(0, 2);
    const silence = values[2];
    const ending = values.slice(3);
    const openingAverage = mean(opening);
    const endingAverage = mean(ending);
    return slowGroup(opening, 210, 920, 2)
      && fastGroup(ending, 35, 360, 2)
      && silence >= Math.max(660, openingAverage * 1.25, endingAverage * 2.35)
      && silence <= 1780
      && endingAverage <= openingAverage * 0.78;
  }

  function matchEcho(values) {
    if (values.length !== 5) return false;
    const shortBeats = [values[0], values[2], values[4]];
    const pauses = [values[1], values[3]];
    const shortAverage = mean(shortBeats);
    const pauseAverage = mean(pauses);
    return fastGroup(shortBeats, 35, 355, 2.05)
      && pauses.every((value) => value >= 250 && value <= 1220)
      && spread(pauses) <= 1.8
      && pauseAverage >= shortAverage * 1.55;
  }

  function matchDawn(values) {
    if (values.length !== 7) return false;
    const slow = values.slice(0, 3);
    const fast = values.slice(3);
    const slowAverage = mean(slow);
    const fastAverage = mean(fast);
    return slowGroup(slow, 210, 900, 2)
      && fastGroup(fast, 35, 335, 2.15)
      && fastAverage <= slowAverage * 0.66
      && Math.max(...fast) <= Math.min(...slow) * 0.92;
  }

  function matchTide(values) {
    if (values.length !== 5) return false;
    const [a, b, c, d, e] = values;
    return a > b && b > c && c < d && d < e
      && c >= 35
      && c <= Math.min(a, e) * 0.84
      && spread(values) <= 3.4;
  }

  function matchThunder(values) {
    if (values.length < 4 || values.length > 5) return false;
    return [0, 1].some((offset) => {
      const shorts = [];
      const longs = [];
      values.forEach((value, index) => {
        if ((index + offset) % 2 === 0) shorts.push(value);
        else longs.push(value);
      });
      return shorts.length >= 2
        && longs.length >= 2
        && fastGroup(shorts, 35, 340, 2.1)
        && longs.every((value) => value >= 250 && value <= 1200)
        && spread(longs) <= 2.2
        && mean(longs) >= mean(shorts) * 1.7;
    });
  }

  function matchRainbow(values) {
    if (values.length < 3) return false;
    let decreases = 0;
    for (let index = 1; index < values.length; index += 1) {
      if (values[index] <= values[index - 1] * 0.99) decreases += 1;
    }
    return decreases >= values.length - 1
      && values.at(-1) <= values[0] * 0.74
      && mean(values) <= 440;
  }

  function matchFrost(values) {
    if (values.length < 3) return false;
    let increases = 0;
    for (let index = 1; index < values.length; index += 1) {
      if (values[index] >= values[index - 1] * 1.01) increases += 1;
    }
    return increases >= values.length - 1
      && values.at(-1) >= values[0] * 1.34
      && mean(values) >= 210;
  }

  function classifyBase(values) {
    const average = mean(values);
    const variation = average ? deviation(values) / average : 0;
    if (average < 290) return 'azure';
    if (average > 720) return 'dream';
    if (variation < 0.13) return 'ember';

    const differences = [];
    for (let index = 1; index < values.length; index += 1) {
      differences.push(Math.abs(values[index] - values[index - 1]) / Math.max(values[index], values[index - 1]));
    }
    if (variation > 0.42 || mean(differences) > 0.38) return 'forest';
    return 'spark';
  }

  function classify(values) {
    const fixed = [
      ['dawn', 7, matchDawn],
      ['blue-party', 5, matchBlueParty],
      ['heart', 5, matchHeart],
      ['dark', 5, matchDark],
      ['echo', 5, matchEcho],
      ['tide', 5, matchTide],
      ['thunder', 5, matchThunder],
      ['thunder', 4, matchThunder]
    ];

    for (const [type, size, matcher] of fixed) {
      const window = lastWindow(values, size);
      if (window && matcher(window)) return { type, rhythm: window };
    }

    const trendWindows = [values, lastWindow(values, 5), lastWindow(values, 4), lastWindow(values, 3)].filter(Boolean);
    for (const window of trendWindows) {
      if (matchRainbow(window)) return { type: 'rainbow', rhythm: window };
    }
    for (const window of trendWindows) {
      if (matchFrost(window)) return { type: 'frost', rhythm: window };
    }

    return { type: classifyBase(values), rhythm: values };
  }

  function finalizeDelay(values) {
    const count = taps.length;
    if (count === 3 && values.length === 2 && slowGroup(values, 200, 940, 2.05)) return 1900;
    if ((count === 2 || count === 4) && values.at(-1) >= 35 && values.at(-1) <= 380) return 1450;
    if (count === 5 && values.length === 4 && fastGroup(values, 35, 325, 2)) return 1750;
    if (count === 4 && values.length === 3 && slowGroup(values, 200, 920, 2.05)) return 1350;
    return 1050;
  }

  function showMessage(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    nativeSetTimeout(() => toast.classList.remove('show'), 2200);
  }

  function addRipple() {
    if (!tapRipples) return;
    const ripple = document.createElement('span');
    ripple.className = 'tap-ripple';
    tapRipples.appendChild(ripple);
    nativeSetTimeout(() => ripple.remove(), 750);
  }

  function renderPreview(values) {
    if (rhythmDots) {
      rhythmDots.innerHTML = '';
      taps.forEach((_, index) => {
        if (index > 0) {
          const gap = document.createElement('span');
          gap.className = 'rhythm-gap';
          gap.style.width = `${Math.min(40, Math.max(7, values[index - 1] / 22))}px`;
          rhythmDots.appendChild(gap);
        }
        const dot = document.createElement('span');
        dot.className = 'rhythm-dot';
        rhythmDots.appendChild(dot);
      });
    }
    if (tempoLabel) tempoLabel.textContent = values.length ? `${Math.round(60000 / mean(values))} BPM` : '-- BPM';
    if (ignitionText) ignitionText.innerHTML = taps.length < 3 ? `再點 ${3 - taps.length} 次` : '停下<br>成火';
  }

  function renderFlame(flame) {
    const meta = TYPES[flame.type] || TYPES.spark;
    const colors = flame.colors || meta.colors;
    locked = true;
    button?.classList.add('lit');
    if (button) {
      button.dataset.flameType = flame.type;
      button.style.setProperty('--flame-primary', colors[1] || colors[0]);
      button.style.setProperty('--flame-secondary', colors[2] || colors[1]);
    }
    flameCard?.classList.remove('empty');
    if (flameCard) {
      flameCard.dataset.flameType = flame.type;
      flameCard.style.setProperty('--flame-primary', colors[1] || colors[0]);
      flameCard.style.setProperty('--flame-secondary', colors[2] || colors[1]);
    }
    if (flameName) flameName.textContent = flame.name || meta.name;
    if (flameDescription) flameDescription.textContent = flame.description || meta.description;
    if (flameSigil) flameSigil.textContent = meta.sigil;
    if (resetButton) resetButton.disabled = false;
    if (ignitionText) ignitionText.innerHTML = '火種<br>燃燒中';
    if (tempoLabel) tempoLabel.textContent = flame.tempo ? `${flame.tempo} BPM` : '-- BPM';
    sendRoleButton?.classList.add('active');
    receiveRoleButton?.classList.remove('active');
  }

  function resetLocal() {
    locked = false;
    pendingUntil = 0;
    taps = [];
    clearTimeout(timer);
    timer = null;
  }

  async function finalize() {
    clearTimeout(timer);
    timer = null;
    if (locked || taps.length < 3) return;

    const values = intervalsFromTaps();
    const result = classify(values);
    const meta = TYPES[result.type];
    const flame = {
      id: `stable-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: result.type,
      name: meta.name,
      description: meta.description,
      colors: meta.colors,
      seed: Math.abs(result.rhythm.reduce((hash, value) => Math.imul(hash ^ value, 16777619), 2166136261) >>> 0),
      tempo: Math.round(60000 / mean(result.rhythm)),
      rhythm: result.rhythm,
      bornAt: Date.now(),
      origin: deviceName || '星火旅人',
      specialFlame: !['ember', 'azure', 'dream', 'forest', 'spark'].includes(result.type)
    };

    taps = [];
    pendingUntil = Date.now() + 2200;
    renderFlame(flame);
    navigator.vibrate?.([35, 40, 80]);

    if (!roomCode || !deviceId) {
      showMessage('房間資料尚未同步，請再試一次');
      locked = false;
      return;
    }

    try {
      const response = await nativeFetch('/api/flame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ roomCode, deviceId, flame })
      });
      if (!response.ok) throw new Error('sync failed');
    } catch {
      showMessage('火焰已生成，但同步失敗');
    }
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

    button?.classList.add('tapped');
    nativeSetTimeout(() => button?.classList.remove('tapped'), 120);
    addRipple();
    navigator.vibrate?.(18);

    const values = intervalsFromTaps();
    renderPreview(values);
    clearTimeout(timer);
    timer = nativeSetTimeout(finalize, finalizeDelay(values));
  }

  function currentFlame(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  window.fetch = async (input, init = {}) => {
    const response = await nativeFetch(input, init);
    const url = typeof input === 'string' ? input : input?.url || '';

    response.clone().json().then((payload) => {
      if (url.includes('/api/join')) {
        roomCode = payload?.roomCode || roomCode;
        deviceId = payload?.deviceId || deviceId;
        const inputName = document.getElementById('nameInput')?.value?.trim();
        if (inputName) deviceName = inputName;
      }
      if (url.includes('/api/state')) {
        try {
          const parsed = new URL(url, window.location.origin);
          roomCode = parsed.searchParams.get('room') || roomCode;
          deviceId = parsed.searchParams.get('device') || deviceId;
        } catch {
          // Ignore malformed state URL.
        }
      }

      const flame = currentFlame(payload);
      if (flame) {
        renderFlame(flame);
      } else if ((payload?.state?.current || payload?.current) && Date.now() > pendingUntil) {
        locked = false;
      }
    }).catch(() => {});

    return response;
  };

  button?.addEventListener('pointerdown', onTap, true);
  resetButton?.addEventListener('click', resetLocal, true);
})();
