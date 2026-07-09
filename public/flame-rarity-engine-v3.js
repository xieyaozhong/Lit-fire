'use strict';

(() => {
  if (window.__flameRarityEngineV3Loaded) return;
  window.__flameRarityEngineV3Loaded = true;

  const baseFetch = window.fetch.bind(window);
  const button = document.getElementById('ignitionButton');
  const card = document.getElementById('flameCard');
  const nameNode = document.getElementById('flameName');
  const descriptionNode = document.getElementById('flameDescription');
  const sigilNode = document.getElementById('flameSigil');
  const resetButton = document.getElementById('resetFlameButton');
  const leaveButton = document.getElementById('leaveRoomButton');
  const rhythmDots = document.getElementById('rhythmDots');
  const tempoLabel = document.getElementById('tempoLabel');
  const ignitionText = document.getElementById('ignitionText');
  const tapRipples = document.getElementById('tapRipples');

  if (!button || !card) return;

  const RARITY = {
    common: ['常見', 1],
    rare: ['稀有', 2],
    epic: ['罕見', 3],
    special: ['特殊', 4]
  };

  const FLAMES = {
    ember: ['恆星火', 'common', ['#fff0a8', '#ff9f43', '#ff4d2e', '#7e1f2b'], '☀', '它不追逐瞬間的耀眼，而是在一次次穩定節拍中持續燃燒。象徵守護、可靠，以及願意長久陪伴的承諾。'],
    azure: ['疾風火', 'common', ['#e9ffff', '#69e7ff', '#168cff', '#3927a8'], '↯', '它像迎面而來的風，催促人跨出停留已久的那一步。象徵行動、突破，以及面對未知仍選擇前進的勇氣。'],
    dream: ['夢燼', 'common', ['#fff0ff', '#ff8bd8', '#9a5cff', '#43206f'], '☾', '它在緩慢的留白裡保存尚未熄滅的願望，讓疲憊的心重新找到想像。象徵療癒、夢想，以及黑暗中仍被珍藏的希望。'],
    forest: ['森靈火', 'common', ['#f2ffd5', '#9cff64', '#1fd69a', '#15665c'], '✤', '它隨著長短交錯的節奏生長，像新芽穿過土壤，重新與世界相連。象徵成長、復甦，以及在變化中保持生命力。'],
    spark: ['星火', 'common', ['#ffffff', '#ffe47d', '#ff9d42', '#e64535'], '✦', '它也許微小，卻足以成為一段故事、一個選擇或一次改變的起點。象徵靈感、開始，以及把光傳往更遠地方的可能。'],
    rainbow: ['虹焰', 'rare', ['#ff5c5c', '#ffd65c', '#48e48d', '#6b71ff'], '◉', '它讓不同色彩在同一簇火中共存，不必被迫成為單一模樣。象徵多元、自由，以及坦然擁抱完整而真實的自己。'],
    frost: ['霜晶火', 'rare', ['#f7ffff', '#b8f4ff', '#4fc3ff', '#5b7cff'], '❄', '它把躁動凝結成清澈的冰光，使人能在安靜中重新看見真正重要的事。象徵沉澱、清醒，以及不被雜音動搖的純粹。'],
    thunder: ['雷脈火', 'rare', ['#fff9b0', '#ffd60a', '#9d4edd', '#3a0ca3'], 'ϟ', '它在停頓與爆發之間劃出雷光，提醒人不再等待完美時機。象徵覺醒、決斷，以及打破停滯的力量。'],
    tide: ['潮汐火', 'rare', ['#d9fff8', '#4ee3c4', '#00a8cc', '#224d8f'], '≋', '它懂得湧向前方，也懂得退回內心休息，如潮水般保有自己的節奏。象徵包容、平衡，以及進退之間的智慧。'],
    heart: ['心願火', 'epic', ['#fff2f8', '#ffadd2', '#ff5ca8', '#9b245f'], '♡', '它把沒有說出口的心意凝成柔亮粉光，等待被重要的人看見。象徵真心、溫柔，以及勇敢表達愛與思念。'],
    echo: ['回聲火', 'epic', ['#f7fbff', '#b9ddff', '#7f76ff', '#30236f'], '◎', '它把曾經說出的心聲送往遠方，再以另一種形式回到身邊。象徵記憶、回應，以及真心終有被聽見的一刻。'],
    'blue-party': ['歸藍趴火', 'epic', ['#effcff', '#6ee7ff', '#147cff', '#2720a8'], '♬', '它一明一滅地召集失散的節拍，讓快樂不再只屬於一個人。象徵重新歸隊、共享歡樂，以及與夥伴再次連結。'],
    dawn: ['破曉火', 'epic', ['#fffdf0', '#ffe08a', '#ff9f5a', '#d84a32'], '☼', '一點微光、兩縷晨色、三道霞光，最後以四束日光完整升起。象徵重啟、希望，以及相信黎明終會抵達。'],
    dark: ['黯火', 'special', ['#e9e4ff', '#7660b8', '#2a1d45', '#050308'], '◈', '它不逃避陰影，而是在最深的黑暗中守住一點不肯消失的核心。象徵直面自己、沉靜蓄力，以及從低谷重新站起。'],
    'pure-spark': ['純正星火', 'special', ['#ffffff', '#fff7c7', '#ffd95e', '#ff8b35'], '✧', '四段近乎無誤的節奏彼此咬合，凝成不受雜質干擾的金白星芒。象徵純粹的初心、堅定的信念，以及把最真實的光傳向遠方。']
  };

  const FINALIZE_MS = 1300;
  const RESET_GAP_MS = 1650;
  const DARK_WAIT_MS = 7000;

  let roomCode = '';
  let deviceId = '';
  let taps = [];
  let finalizeTimer = 0;
  let darkTimer = 0;
  let darkWaiting = false;
  let locked = false;
  let ignoreIncomingUntil = 0;
  let wasLit = button.classList.contains('lit');

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

  function intervals() {
    return taps.slice(1).map((tap, index) => tap.time - taps[index].time);
  }

  function clearTimers() {
    clearTimeout(finalizeTimer);
    clearTimeout(darkTimer);
    finalizeTimer = 0;
    darkTimer = 0;
    darkWaiting = false;
  }

  function resetInput() {
    clearTimers();
    taps = [];
    renderPreview();
  }

  function ensureBadge() {
    let badge = document.getElementById('flameRarityBadge');
    if (badge) return badge;
    badge = document.createElement('span');
    badge.id = 'flameRarityBadge';
    badge.className = 'flame-rarity-badge';
    badge.hidden = true;
    card.querySelector('.mini-label')?.insertAdjacentElement('afterend', badge);
    return badge;
  }

  const badge = ensureBadge();
  const style = document.createElement('style');
  style.textContent = `
    .flame-rarity-badge{display:inline-flex;width:fit-content;margin:4px 0 6px;padding:3px 9px;border:1px solid rgba(255,255,255,.18);border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.12em;color:rgba(255,255,255,.9);background:rgba(255,255,255,.06)}
    .flame-rarity-badge[hidden]{display:none!important}.flame-rarity-badge[data-rarity="rare"]{color:#8fe9ff}.flame-rarity-badge[data-rarity="epic"]{color:#d7adff}.flame-rarity-badge[data-rarity="special"]{color:#ffe89a}
    .ignition-button[data-flame-type="blue-party"] #persistentFlameCanvas,.ignition-button[data-flame-type="blue-party"] .ignition-ring,.ignition-button[data-flame-type="blue-party"] .ignition-core{animation:rarity-blue-blink .92s steps(2,end) infinite!important}
    .ignition-button[data-flame-type="pure-spark"] #persistentFlameCanvas{transform-origin:50% 68%;animation:rarity-pure-flame 3.4s ease-in-out infinite!important}
    .ignition-button[data-flame-type="pure-spark"] .ignition-ring{animation:rarity-pure-ring 3.4s ease-in-out infinite!important}
    @keyframes rarity-blue-blink{0%,42%{opacity:1;filter:brightness(1.45)}50%,92%{opacity:.16;filter:brightness(.55)}}
    @keyframes rarity-pure-flame{0%,100%{transform:scale(.98);filter:brightness(1.04)}50%{transform:scale(1.055);filter:brightness(1.48)}}
    @keyframes rarity-pure-ring{0%,100%{transform:scale(.99);filter:brightness(.92);opacity:.78}50%{transform:scale(1.035);filter:brightness(1.32);opacity:1}}
  `;
  document.head.appendChild(style);

  function addRipple() {
    if (!tapRipples) return;
    const ripple = document.createElement('span');
    ripple.className = 'tap-ripple';
    tapRipples.appendChild(ripple);
    setTimeout(() => ripple.remove(), 760);
  }

  function renderPreview() {
    const values = intervals();
    if (rhythmDots) {
      rhythmDots.innerHTML = '';
      taps.forEach((_, index) => {
        if (index) {
          const gap = document.createElement('span');
          gap.className = 'rhythm-gap';
          gap.style.width = `${Math.min(42, Math.max(7, values[index - 1] / 22))}px`;
          rhythmDots.appendChild(gap);
        }
        const dot = document.createElement('span');
        dot.className = 'rhythm-dot';
        rhythmDots.appendChild(dot);
      });
    }
    if (tempoLabel) tempoLabel.textContent = values.length ? `${Math.round(60000 / mean(values))} BPM` : '-- BPM';
    if (ignitionText && !locked) {
      ignitionText.innerHTML = darkWaiting ? '停留<br>7 秒' : taps.length ? `${taps.length} 下<br>等待成火` : '點擊<br>點火';
    }
  }

  function isShort(values, min, max, ratio) {
    return values.length > 0 && values.every((value) => value >= min && value <= max) && spread(values) <= ratio;
  }

  function isPause(values, min, max, ratio) {
    return values.length > 0 && values.every((value) => value >= min && value <= max) && spread(values) <= ratio;
  }

  function matchRainbow(v) {
    return v.length === 3
      && v[0] >= 350 && v[0] <= 1050
      && v[1] <= v[0] * 0.9
      && v[2] <= v[1] * 0.88
      && v[2] >= 50;
  }

  function matchFrost(v) {
    return v.length === 3
      && v[0] >= 50 && v[0] <= 320
      && v[1] >= v[0] * 1.1
      && v[2] >= v[1] * 1.12
      && v[2] <= 1050;
  }

  function matchThunder(v) {
    return v.length === 4
      && isShort([v[0], v[2]], 50, 280, 2)
      && isPause([v[1], v[3]], 300, 980, 1.8)
      && mean([v[1], v[3]]) >= mean([v[0], v[2]]) * 1.8;
  }

  function matchTide(v) {
    if (v.length !== 5) return false;
    const [a, b, c, d, e] = v;
    return a >= 350 && a <= 1050
      && a > b * 1.05
      && b > c * 1.15
      && c >= 50 && c <= 320
      && d > c * 1.15
      && e > d * 1.05
      && e <= 1050
      && Math.abs(a - e) / Math.max(a, e) <= 0.42
      && Math.abs(b - d) / Math.max(b, d) <= 0.45;
  }

  function matchHeart(v) {
    return v.length === 6
      && isShort([v[0], v[1], v[4], v[5]], 50, 280, 2)
      && isPause([v[2], v[3]], 300, 920, 1.8);
  }

  function matchEcho(v) {
    return v.length === 7
      && isShort([v[0], v[2], v[4], v[6]], 50, 280, 2)
      && isPause([v[1], v[3], v[5]], 260, 860, 1.8);
  }

  function matchBlue(v) {
    return v.length === 8
      && isShort(v, 40, 210, 2.2)
      && mean(v) <= 165
      && v.reduce((sum, value) => sum + value, 0) <= 1550;
  }

  function matchDawn(v) {
    return v.length === 9
      && isPause([v[0], v[2], v[5]], 360, 980, 1.9)
      && isShort([v[1], v[3], v[4], v[6], v[7], v[8]], 50, 240, 2.1);
  }

  function matchPure(v) {
    if (v.length !== 11) return false;
    const pauses = [v[1], v[4], v[8]];
    const shortBeats = [v[0], v[2], v[3], v[5], v[6], v[7], v[9], v[10]];
    const total = v.reduce((sum, value) => sum + value, 0);
    return isPause(pauses, 380, 980, 1.8)
      && isShort(shortBeats, 45, 210, 2)
      && mean(shortBeats) <= 160
      && mean(pauses) >= mean(shortBeats) * 2.2
      && total >= 1800
      && total <= 5200;
  }

  function classifyCommon(values) {
    const sample = values.length > 2 ? values.slice(-2) : values;
    if (!sample.length) return 'spark';
    const average = mean(sample);
    const variation = average ? deviation(sample) / average : 0;
    const ratio = spread(sample);
    if (sample.every((value) => value >= 380 && value <= 650) && ratio <= 1.18) return 'ember';
    if (sample.every((value) => value >= 65 && value <= 300) && average <= 235) return 'azure';
    if (sample.every((value) => value >= 650 && value <= 1250) && average >= 760) return 'dream';
    if ((ratio >= 2 && Math.min(...sample) <= 330 && Math.max(...sample) >= 520) || variation > 0.36) return 'forest';
    return 'spark';
  }

  function classify() {
    const values = intervals();
    const count = taps.length;
    if (count === 4 && matchRainbow(values)) return 'rainbow';
    if (count === 4 && matchFrost(values)) return 'frost';
    if (count === 5 && matchThunder(values)) return 'thunder';
    if (count === 6 && matchTide(values)) return 'tide';
    if (count === 7 && matchHeart(values)) return 'heart';
    if (count === 8 && matchEcho(values)) return 'echo';
    if (count === 9 && matchBlue(values)) return 'blue-party';
    if (count === 10 && matchDawn(values)) return 'dawn';
    if (count === 12 && matchPure(values)) return 'pure-spark';
    return classifyCommon(values);
  }

  function hash(values) {
    let value = 2166136261;
    values.forEach((item) => {
      value ^= Math.round(item * 1000);
      value = Math.imul(value, 16777619);
    });
    return Math.abs(value >>> 0);
  }

  function makeFlame(type) {
    const meta = FLAMES[type] || FLAMES.spark;
    const values = intervals().map(Math.round);
    const rarity = RARITY[meta[1]];
    return {
      id: `rarity-v3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      name: meta[0],
      description: meta[4],
      colors: meta[2],
      seed: hash([...values, rarity[1]]),
      tempo: values.length ? Math.round(60000 / mean(values)) : 0,
      rhythm: values,
      bornAt: Date.now(),
      origin: document.getElementById('nameInput')?.value?.trim() || '星火旅人',
      rarity: meta[1],
      rarityLabel: rarity[0],
      rarityRank: rarity[1],
      tapCount: taps.length,
      specialFlame: meta[1] !== 'common'
    };
  }

  function showBadge(type) {
    const meta = FLAMES[type];
    if (!badge || !meta) return;
    badge.hidden = false;
    badge.dataset.rarity = meta[1];
    badge.textContent = RARITY[meta[1]][0];
  }

  function hideBadge() {
    if (!badge) return;
    badge.hidden = true;
    badge.removeAttribute('data-rarity');
    badge.textContent = '';
  }

  function renderFlame(flame) {
    const type = FLAMES[flame?.type] ? flame.type : 'spark';
    const meta = FLAMES[type];
    const colors = Array.isArray(flame?.colors) && flame.colors.length >= 2 ? flame.colors : meta[2];
    locked = true;
    button.classList.add('lit');
    button.dataset.flameType = type;
    button.style.setProperty('--flame-primary', colors[1] || colors[0]);
    button.style.setProperty('--flame-secondary', colors[2] || colors[1]);
    card.classList.remove('empty');
    card.dataset.flameType = type;
    card.style.setProperty('--flame-primary', colors[1] || colors[0]);
    card.style.setProperty('--flame-secondary', colors[2] || colors[1]);
    if (nameNode) nameNode.textContent = meta[0];
    if (descriptionNode) descriptionNode.textContent = meta[4];
    if (sigilNode) sigilNode.textContent = meta[3];
    if (resetButton) resetButton.disabled = false;
    if (tempoLabel) tempoLabel.textContent = flame?.tempo ? `${flame.tempo} BPM` : '-- BPM';
    if (ignitionText) ignitionText.innerHTML = '燃燒中';
    showBadge(type);
  }

  function currentRoom() {
    const label = document.getElementById('roomCodeLabel')?.textContent?.trim();
    return roomCode || (label && label !== '-----' ? label : '');
  }

  async function postFlame(flame) {
    const room = currentRoom();
    if (!room || !deviceId) return;
    try {
      await baseFetch('/api/flame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ roomCode: room, deviceId, flame })
      });
    } catch {
      // Keep the local flame visible; polling can recover later.
    }
  }

  function generate(type) {
    if (locked) return;
    clearTimers();
    const flame = makeFlame(type);
    renderFlame(flame);
    postFlame(flame);
    navigator.vibrate?.(RARITY[FLAMES[type][1]][1] >= 3 ? [24, 32, 52, 36, 88] : [28, 36, 70]);
    taps = [];
  }

  function finalize() {
    finalizeTimer = 0;
    if (locked || darkWaiting || taps.length < 3) return;
    generate(classify());
  }

  function scheduleFinalize() {
    clearTimeout(finalizeTimer);
    finalizeTimer = setTimeout(finalize, FINALIZE_MS);
  }

  function cancelDarkWait({ preserveTaps = true } = {}) {
    clearTimeout(darkTimer);
    darkTimer = 0;
    darkWaiting = false;
    if (!preserveTaps) taps = [];
    renderPreview();
  }

  function beginDarkWait() {
    if (taps.length !== 2) return false;
    clearTimeout(finalizeTimer);
    clearTimeout(darkTimer);
    finalizeTimer = 0;
    darkWaiting = true;
    darkTimer = setTimeout(() => {
      darkTimer = 0;
      if (!locked && darkWaiting && taps.length === 2 && document.visibilityState === 'visible') {
        generate('dark');
      } else {
        cancelDarkWait();
      }
    }, DARK_WAIT_MS);
    renderPreview();
    return true;
  }

  function onPointerDown(event) {
    if (!button.contains(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    if (locked || button.classList.contains('lit')) {
      navigator.vibrate?.([18, 28, 18]);
      return;
    }

    const now = performance.now();
    const previous = taps.at(-1)?.time;
    if (!previous || now - previous > RESET_GAP_MS) resetInput();

    if (darkWaiting) cancelDarkWait();
    taps.push({ time: now });
    if (taps.length > 12) taps.shift();

    button.classList.add('tapped');
    setTimeout(() => button.classList.remove('tapped'), 120);
    addRipple();
    navigator.vibrate?.(14);
    renderPreview();

    if (taps.length === 2 && beginDarkWait()) return;
    scheduleFinalize();
  }

  function clearAfterExtinguish() {
    ignoreIncomingUntil = Date.now() + 3200;
    locked = false;
    resetInput();
    hideBadge();
    requestAnimationFrame(() => {
      if (!button.classList.contains('lit')) {
        button.removeAttribute('data-flame-type');
        card.removeAttribute('data-flame-type');
      }
    });
  }

  function syncPayload(payload) {
    if (payload?.roomCode) roomCode = payload.roomCode;
    if (payload?.deviceId) deviceId = payload.deviceId;
    const current = payload?.state?.current || payload?.current;
    if (!current) return;

    if (current.flame) {
      if (Date.now() < ignoreIncomingUntil && !button.classList.contains('lit')) return;
      renderFlame(current.flame);
    }
    // Empty polling responses never cancel the current rhythm or dark wait.
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame === null) ignoreIncomingUntil = Date.now() + 3200;
      } catch {
        // Leave unrelated requests untouched.
      }
    }
    const response = await baseFetch(input, init);
    response.clone().json().then(syncPayload).catch(() => {});
    return response;
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  resetButton?.addEventListener('click', clearAfterExtinguish, true);
  leaveButton?.addEventListener('click', () => {
    roomCode = '';
    deviceId = '';
    clearAfterExtinguish();
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && darkWaiting) resetInput();
  });
  window.addEventListener('pagehide', () => {
    if (darkWaiting) resetInput();
  });

  new MutationObserver(() => {
    const lit = button.classList.contains('lit');
    if (wasLit && !lit) clearAfterExtinguish();
    wasLit = lit;
  }).observe(button, { attributes: true, attributeFilter: ['class'] });
})();
