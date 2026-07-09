'use strict';

(() => {
  if (window.__flameRarityEngineLoaded) return;
  window.__flameRarityEngineLoaded = true;

  const baseFetch = window.fetch.bind(window);
  const button = document.getElementById('ignitionButton');
  const card = document.getElementById('flameCard');
  const nameNode = document.getElementById('flameName');
  const descriptionNode = document.getElementById('flameDescription');
  const sigilNode = document.getElementById('flameSigil');
  const resetButton = document.getElementById('resetFlameButton');
  const rhythmDots = document.getElementById('rhythmDots');
  const tempoLabel = document.getElementById('tempoLabel');
  const ignitionText = document.getElementById('ignitionText');
  const tapRipples = document.getElementById('tapRipples');

  if (!button || !card) return;

  const RARITY = {
    common: { label: '常見', rank: 1 },
    rare: { label: '稀有', rank: 2 },
    epic: { label: '罕見', rank: 3 },
    special: { label: '特殊', rank: 4 }
  };

  const FLAMES = {
    ember: {
      name: '恆星火',
      rarity: 'common',
      description: '它不追逐瞬間的耀眼，而是在一次次穩定節拍中持續燃燒。象徵守護、可靠，以及願意長久陪伴的承諾。',
      colors: ['#fff0a8', '#ff9f43', '#ff4d2e', '#7e1f2b'],
      sigil: '☀',
      trigger: '三下穩定中速節拍'
    },
    azure: {
      name: '疾風火',
      rarity: 'common',
      description: '它像迎面而來的風，催促人跨出停留已久的那一步。象徵行動、突破，以及面對未知仍選擇前進的勇氣。',
      colors: ['#e9ffff', '#69e7ff', '#168cff', '#3927a8'],
      sigil: '↯',
      trigger: '三下快速節拍'
    },
    dream: {
      name: '夢燼',
      rarity: 'common',
      description: '它在緩慢的留白裡保存尚未熄滅的願望，讓疲憊的心重新找到想像。象徵療癒、夢想，以及黑暗中仍被珍藏的希望。',
      colors: ['#fff0ff', '#ff8bd8', '#9a5cff', '#43206f'],
      sigil: '☾',
      trigger: '三下緩慢節拍'
    },
    forest: {
      name: '森靈火',
      rarity: 'common',
      description: '它隨著長短交錯的節奏生長，像新芽穿過土壤，重新與世界相連。象徵成長、復甦，以及在變化中保持生命力。',
      colors: ['#f2ffd5', '#9cff64', '#1fd69a', '#15665c'],
      sigil: '✤',
      trigger: '三下長短交錯節拍'
    },
    spark: {
      name: '星火',
      rarity: 'common',
      description: '它也許微小，卻足以成為一段故事、一個選擇或一次改變的起點。象徵靈感、開始，以及把光傳往更遠地方的可能。',
      colors: ['#ffffff', '#ffe47d', '#ff9d42', '#e64535'],
      sigil: '✦',
      trigger: '三下不規則中速節拍'
    },
    rainbow: {
      name: '虹焰',
      rarity: 'rare',
      description: '它讓不同色彩在同一簇火中共存，不必被迫成為單一模樣。象徵多元、自由，以及坦然擁抱完整而真實的自己。',
      colors: ['#ff5c5c', '#ffd65c', '#48e48d', '#6b71ff'],
      sigil: '◉',
      trigger: '四下逐次加速'
    },
    frost: {
      name: '霜晶火',
      rarity: 'rare',
      description: '它把躁動凝結成清澈的冰光，使人能在安靜中重新看見真正重要的事。象徵沉澱、清醒，以及不被雜音動搖的純粹。',
      colors: ['#f7ffff', '#b8f4ff', '#4fc3ff', '#5b7cff'],
      sigil: '❄',
      trigger: '四下逐次放慢'
    },
    thunder: {
      name: '雷脈火',
      rarity: 'rare',
      description: '它在停頓與爆發之間劃出雷光，提醒人不再等待完美時機。象徵覺醒、決斷，以及打破停滯的力量。',
      colors: ['#fff9b0', '#ffd60a', '#9d4edd', '#3a0ca3'],
      sigil: 'ϟ',
      trigger: '五下短長短長交替'
    },
    tide: {
      name: '潮汐火',
      rarity: 'rare',
      description: '它懂得湧向前方，也懂得退回內心休息，如潮水般保有自己的節奏。象徵包容、平衡，以及進退之間的智慧。',
      colors: ['#d9fff8', '#4ee3c4', '#00a8cc', '#224d8f'],
      sigil: '≋',
      trigger: '六下先加速再放慢'
    },
    heart: {
      name: '心願火',
      rarity: 'epic',
      description: '它把沒有說出口的心意凝成柔亮粉光，等待被重要的人看見。象徵真心、溫柔，以及勇敢表達愛與思念。',
      colors: ['#fff2f8', '#ffadd2', '#ff5ca8', '#9b245f'],
      sigil: '♡',
      trigger: '七下三短、單點、三短'
    },
    echo: {
      name: '回聲火',
      rarity: 'epic',
      description: '它把曾經說出的心聲送往遠方，再以另一種形式回到身邊。象徵記憶、回應，以及真心終有被聽見的一刻。',
      colors: ['#f7fbff', '#b9ddff', '#7f76ff', '#30236f'],
      sigil: '◎',
      trigger: '八下四組雙拍'
    },
    'blue-party': {
      name: '歸藍趴火',
      rarity: 'epic',
      description: '它一明一滅地召集失散的節拍，讓快樂不再只屬於一個人。象徵重新歸隊、共享歡樂，以及與夥伴再次連結。',
      colors: ['#effcff', '#6ee7ff', '#147cff', '#2720a8'],
      sigil: '♬',
      trigger: '九下高速連點'
    },
    dawn: {
      name: '破曉火',
      rarity: 'epic',
      description: '一點微光、兩縷晨色、三道霞光，最後以四束日光完整升起。象徵重啟、希望，以及相信黎明終會抵達。',
      colors: ['#fffdf0', '#ffe08a', '#ff9f5a', '#d84a32'],
      sigil: '☼',
      trigger: '十下，一、二、三、四組遞增'
    },
    dark: {
      name: '黯火',
      rarity: 'special',
      description: '它不逃避陰影，而是在最深的黑暗中守住一點不肯消失的核心。象徵直面自己、沉靜蓄力，以及從低谷重新站起。',
      colors: ['#e9e4ff', '#7660b8', '#2a1d45', '#050308'],
      sigil: '◈',
      trigger: '兩下精準間隔，第二下長按五秒'
    },
    'pure-spark': {
      name: '純正星火',
      rarity: 'special',
      description: '四段近乎無誤的節奏彼此咬合，凝成不受雜質干擾的金白星芒。象徵純粹的初心、堅定的信念，以及把最真實的光傳向遠方。',
      colors: ['#ffffff', '#fff7c7', '#ffd95e', '#ff8b35'],
      sigil: '✧',
      trigger: '十二下，二、三、四、三組精準節拍'
    }
  };

  const INACTIVITY_MS = 1300;
  const SEQUENCE_RESET_MS = 1650;
  const DARK_HOLD_MS = 5000;

  let roomCode = '';
  let deviceId = '';
  let taps = [];
  let finalizeTimer = null;
  let holdTimer = null;
  let holdPointerId = null;
  let locked = false;
  let generationRevision = 0;

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
    return taps.slice(1).map((tap, index) => tap.down - taps[index].down);
  }

  function clearTimers() {
    clearTimeout(finalizeTimer);
    clearTimeout(holdTimer);
    finalizeTimer = null;
    holdTimer = null;
  }

  function resetSequence() {
    clearTimers();
    taps = [];
    holdPointerId = null;
    renderPreview();
  }

  function getRarity(type) {
    return RARITY[FLAMES[type]?.rarity] || RARITY.common;
  }

  function ensureBadge() {
    let badge = document.getElementById('flameRarityBadge');
    if (badge) return badge;
    badge = document.createElement('span');
    badge.id = 'flameRarityBadge';
    badge.className = 'flame-rarity-badge';
    badge.hidden = true;
    const label = card.querySelector('.mini-label');
    label?.insertAdjacentElement('afterend', badge);
    return badge;
  }

  const badge = ensureBadge();

  const style = document.createElement('style');
  style.textContent = `
    .flame-rarity-badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      margin: 4px 0 6px;
      padding: 3px 9px;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .12em;
      line-height: 1.4;
      color: rgba(255,255,255,.9);
      background: rgba(255,255,255,.06);
      box-shadow: inset 0 0 16px rgba(255,255,255,.04);
    }

    .flame-rarity-badge[hidden] { display: none !important; }
    .flame-rarity-badge[data-rarity="common"] { color: #e9edf5; }
    .flame-rarity-badge[data-rarity="rare"] { color: #8fe9ff; border-color: rgba(84,209,255,.38); }
    .flame-rarity-badge[data-rarity="epic"] { color: #d7adff; border-color: rgba(179,111,255,.42); box-shadow: 0 0 16px rgba(157,78,221,.12); }
    .flame-rarity-badge[data-rarity="special"] { color: #ffe89a; border-color: rgba(255,214,92,.5); box-shadow: 0 0 22px rgba(255,214,92,.16); }

    .ignition-button[data-flame-type="blue-party"] #persistentFlameCanvas,
    .ignition-button[data-flame-type="blue-party"] .ignition-ring,
    .ignition-button[data-flame-type="blue-party"] .ignition-core {
      animation: unified-blue-party-blink .92s steps(2,end) infinite !important;
    }

    .ignition-button[data-flame-type="pure-spark"] #persistentFlameCanvas {
      transform-origin: 50% 68%;
      animation: unified-pure-spark-flame 3.4s ease-in-out infinite !important;
    }

    .ignition-button[data-flame-type="pure-spark"] .ignition-ring {
      border-color: rgba(255,247,199,.92) !important;
      box-shadow: 0 0 22px rgba(255,255,255,.52), 0 0 54px rgba(255,217,94,.38), inset 0 0 34px rgba(255,247,199,.18) !important;
      animation: unified-pure-spark-ring 3.4s ease-in-out infinite !important;
    }

    @keyframes unified-blue-party-blink {
      0%, 42% { opacity: 1; filter: brightness(1.45) saturate(1.25); }
      50%, 92% { opacity: .16; filter: brightness(.55) saturate(.8); }
    }

    @keyframes unified-pure-spark-flame {
      0%, 100% { transform: scale(.98); filter: saturate(1.06) brightness(1.04); }
      50% { transform: scale(1.055); filter: saturate(1.18) brightness(1.48); }
    }

    @keyframes unified-pure-spark-ring {
      0%, 100% { transform: scale(.99); filter: brightness(.92); opacity: .78; }
      50% { transform: scale(1.035); filter: brightness(1.32); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  function addRipple() {
    if (!tapRipples) return;
    const ripple = document.createElement('span');
    ripple.className = 'tap-ripple';
    tapRipples.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 760);
  }

  function renderPreview() {
    const values = intervals();
    if (rhythmDots) {
      rhythmDots.innerHTML = '';
      taps.forEach((_, index) => {
        if (index > 0) {
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

    if (tempoLabel) {
      tempoLabel.textContent = values.length ? `${Math.round(60000 / mean(values))} BPM` : '-- BPM';
    }

    if (ignitionText && !locked) {
      if (!taps.length) ignitionText.innerHTML = '點擊<br>點火';
      else if (holdPointerId !== null) ignitionText.innerHTML = '持續<br>按住';
      else ignitionText.innerHTML = `${taps.length} 下<br>等待成火`;
    }
  }

  function isShort(values, min = 60, max = 250, maxSpread = 2) {
    return values.length > 0
      && values.every((value) => value >= min && value <= max)
      && spread(values) <= maxSpread;
  }

  function isPause(values, min = 400, max = 900, maxSpread = 1.55) {
    return values.length > 0
      && values.every((value) => value >= min && value <= max)
      && spread(values) <= maxSpread;
  }

  function matchRainbow(values) {
    if (values.length !== 3) return false;
    return values[0] >= 470 && values[0] <= 920
      && values[1] <= values[0] * 0.82
      && values[2] <= values[1] * 0.78
      && values[2] >= 70 && values[2] <= 270;
  }

  function matchFrost(values) {
    if (values.length !== 3) return false;
    return values[0] >= 70 && values[0] <= 270
      && values[1] >= values[0] * 1.22
      && values[2] >= values[1] * 1.28
      && values[2] >= 470 && values[2] <= 920;
  }

  function matchThunder(values) {
    if (values.length !== 4) return false;
    const shortBeats = [values[0], values[2]];
    const pauses = [values[1], values[3]];
    return isShort(shortBeats, 65, 235, 1.55)
      && isPause(pauses, 420, 850, 1.45)
      && mean(pauses) >= mean(shortBeats) * 2.5;
  }

  function matchTide(values) {
    if (values.length !== 5) return false;
    const [a, b, c, d, e] = values;
    const symmetric = Math.abs(a - e) / Math.max(a, e) <= 0.28
      && Math.abs(b - d) / Math.max(b, d) <= 0.3;
    return a >= 480 && a <= 900
      && a > b * 1.18
      && b > c * 1.35
      && c >= 70 && c <= 260
      && d > c * 1.35
      && e > d * 1.18
      && e <= 900
      && symmetric;
  }

  function matchHeart(values) {
    if (values.length !== 6) return false;
    const shortBeats = [values[0], values[1], values[4], values[5]];
    const pauses = [values[2], values[3]];
    return isShort(shortBeats, 65, 235, 1.65)
      && isPause(pauses, 440, 790, 1.35)
      && mean(pauses) >= mean(shortBeats) * 2.8;
  }

  function matchEcho(values) {
    if (values.length !== 7) return false;
    const shortBeats = [values[0], values[2], values[4], values[6]];
    const pauses = [values[1], values[3], values[5]];
    return isShort(shortBeats, 65, 235, 1.6)
      && isPause(pauses, 380, 720, 1.35)
      && mean(pauses) >= mean(shortBeats) * 2.45;
  }

  function matchBlueParty(values) {
    if (values.length !== 8) return false;
    return isShort(values, 50, 175, 1.75)
      && mean(values) <= 135
      && values.reduce((sum, value) => sum + value, 0) <= 1250;
  }

  function matchDawn(values) {
    if (values.length !== 9) return false;
    const pauses = [values[0], values[2], values[5]];
    const shortBeats = [values[1], values[3], values[4], values[6], values[7], values[8]];
    return isPause(pauses, 500, 820, 1.38)
      && isShort(shortBeats, 65, 205, 1.85)
      && mean(pauses) >= mean(shortBeats) * 3;
  }

  function matchPureSpark(values) {
    if (values.length !== 11) return false;
    const pauses = [values[1], values[4], values[8]];
    const shortBeats = [values[0], values[2], values[3], values[5], values[6], values[7], values[9], values[10]];
    const total = values.reduce((sum, value) => sum + value, 0);
    return isPause(pauses, 560, 790, 1.22)
      && isShort(shortBeats, 65, 165, 1.45)
      && mean(shortBeats) <= 130
      && mean(pauses) >= mean(shortBeats) * 4.2
      && total >= 2400
      && total <= 4000;
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
    if (ratio >= 2 && Math.min(...sample) <= 330 && Math.max(...sample) >= 520) return 'forest';
    if (variation > 0.36) return 'forest';
    return 'spark';
  }

  function classify() {
    const values = intervals();
    const count = taps.length;

    if (count === 4) {
      if (matchRainbow(values)) return 'rainbow';
      if (matchFrost(values)) return 'frost';
    }
    if (count === 5 && matchThunder(values)) return 'thunder';
    if (count === 6 && matchTide(values)) return 'tide';
    if (count === 7 && matchHeart(values)) return 'heart';
    if (count === 8 && matchEcho(values)) return 'echo';
    if (count === 9 && matchBlueParty(values)) return 'blue-party';
    if (count === 10 && matchDawn(values)) return 'dawn';
    if (count === 12 && matchPureSpark(values)) return 'pure-spark';

    return classifyCommon(values);
  }

  function hashNumbers(values) {
    let hash = 2166136261;
    values.forEach((value) => {
      hash ^= Math.round(value * 1000);
      hash = Math.imul(hash, 16777619);
    });
    return Math.abs(hash >>> 0);
  }

  function buildFlame(type) {
    const meta = FLAMES[type] || FLAMES.spark;
    const values = intervals().map((value) => Math.round(value));
    const rarity = getRarity(type);
    return {
      id: `rarity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      name: meta.name,
      description: meta.description,
      symbolicMeaning: meta.description.split('象徵')[1]?.replace(/^[:：\s]*/, '') || '',
      colors: meta.colors,
      seed: hashNumbers([...values, rarity.rank]),
      tempo: values.length ? Math.round(60000 / mean(values)) : 0,
      rhythm: values,
      bornAt: Date.now(),
      origin: document.getElementById('nameInput')?.value?.trim() || '星火旅人',
      rarity: meta.rarity,
      rarityLabel: rarity.label,
      rarityRank: rarity.rank,
      triggerSignature: meta.trigger,
      tapCount: taps.length,
      specialFlame: meta.rarity !== 'common'
    };
  }

  function applyBadge(flame) {
    if (!badge) return;
    const meta = FLAMES[flame?.type];
    if (!meta) {
      badge.hidden = true;
      badge.removeAttribute('data-rarity');
      return;
    }
    const rarity = RARITY[meta.rarity];
    badge.hidden = false;
    badge.dataset.rarity = meta.rarity;
    badge.textContent = rarity.label;
  }

  function renderFlame(flame) {
    const meta = FLAMES[flame.type] || FLAMES.spark;
    const primary = flame.colors?.[1] || meta.colors[1];
    const secondary = flame.colors?.[2] || meta.colors[2];

    locked = true;
    button.classList.add('lit');
    button.dataset.flameType = flame.type;
    button.style.setProperty('--flame-primary', primary);
    button.style.setProperty('--flame-secondary', secondary);
    card.classList.remove('empty');
    card.dataset.flameType = flame.type;
    card.style.setProperty('--flame-primary', primary);
    card.style.setProperty('--flame-secondary', secondary);
    if (nameNode) nameNode.textContent = flame.name || meta.name;
    if (descriptionNode) descriptionNode.textContent = flame.description || meta.description;
    if (sigilNode) sigilNode.textContent = meta.sigil;
    if (resetButton) resetButton.disabled = false;
    if (tempoLabel) tempoLabel.textContent = flame.tempo ? `${flame.tempo} BPM` : '-- BPM';
    if (ignitionText) ignitionText.innerHTML = '燃燒中';
    applyBadge(flame);
    window.__flameEffectLifecycle?.activate?.(flame);
  }

  function renderEmpty() {
    locked = false;
    applyBadge(null);
    resetSequence();
  }

  async function postFlame(flame) {
    const currentRoom = roomCode || document.getElementById('roomCodeLabel')?.textContent?.trim();
    if (!currentRoom || currentRoom === '-----' || !deviceId) return;

    const revision = ++generationRevision;
    try {
      const response = await baseFetch('/api/flame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ roomCode: currentRoom, deviceId, flame })
      });
      const payload = await response.clone().json().catch(() => null);
      if (!response.ok && revision === generationRevision) throw new Error(payload?.error || '同步失敗');
    } catch {
      // Local flame remains visible; normal polling can recover later.
    }
  }

  function generate(type) {
    if (locked) return;
    clearTimers();
    const flame = buildFlame(type);
    renderFlame(flame);
    navigator.vibrate?.(getRarity(type).rank >= 3 ? [24, 32, 52, 36, 88] : [28, 36, 70]);
    postFlame(flame);
    taps = [];
    holdPointerId = null;
  }

  function finalize() {
    finalizeTimer = null;
    if (locked || taps.length < 3 || holdPointerId !== null) return;
    generate(classify());
  }

  function scheduleFinalize() {
    clearTimeout(finalizeTimer);
    finalizeTimer = window.setTimeout(finalize, INACTIVITY_MS);
  }

  function isDarkCandidate() {
    if (taps.length !== 2) return false;
    const gap = taps[1].down - taps[0].down;
    return gap >= 340 && gap <= 460;
  }

  function beginDarkHold(event) {
    if (!isDarkCandidate()) return false;
    holdPointerId = event.pointerId;
    clearTimeout(finalizeTimer);
    holdTimer = window.setTimeout(() => {
      if (holdPointerId === event.pointerId && !locked) generate('dark');
    }, DARK_HOLD_MS);
    renderPreview();
    return true;
  }

  function cancelDarkHold(pointerId) {
    if (holdPointerId === null) return;
    if (pointerId !== undefined && pointerId !== holdPointerId) return;
    clearTimeout(holdTimer);
    holdTimer = null;
    holdPointerId = null;
    if (!locked) scheduleFinalize();
    renderPreview();
  }

  function handlePointerDown(event) {
    if (!button.contains(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    if (locked || button.classList.contains('lit')) {
      navigator.vibrate?.([18, 28, 18]);
      return;
    }

    const now = performance.now();
    const previous = taps.at(-1)?.down;
    if (!previous || now - previous > SEQUENCE_RESET_MS) resetSequence();

    taps.push({ down: now, pointerId: event.pointerId, up: null });
    if (taps.length > 12) taps.shift();

    button.classList.add('tapped');
    window.setTimeout(() => button.classList.remove('tapped'), 120);
    addRipple();
    navigator.vibrate?.(14);
    renderPreview();

    if (taps.length === 2 && beginDarkHold(event)) return;
    scheduleFinalize();
  }

  function handlePointerUp(event) {
    const tap = [...taps].reverse().find((item) => item.pointerId === event.pointerId && item.up === null);
    if (tap) tap.up = performance.now();
    if (holdPointerId === event.pointerId) cancelDarkHold(event.pointerId);
  }

  function handlePointerCancel(event) {
    if (holdPointerId === event.pointerId) cancelDarkHold(event.pointerId);
  }

  function syncFromPayload(payload) {
    const joinedRoom = payload?.roomCode;
    const joinedDevice = payload?.deviceId;
    if (joinedRoom) roomCode = joinedRoom;
    if (joinedDevice) deviceId = joinedDevice;

    const hasCurrent = Boolean(payload?.state?.current || payload?.current);
    if (!hasCurrent) return;
    const flame = payload?.state?.current?.flame || payload?.current?.flame || null;
    if (flame) {
      renderFlame(flame);
    } else if (!button.classList.contains('lit')) {
      renderEmpty();
    }
  }

  window.fetch = async (input, init = {}) => {
    const response = await baseFetch(input, init);
    response.clone().json().then(syncFromPayload).catch(() => {});
    return response;
  };

  document.addEventListener('pointerdown', handlePointerDown, true);
  document.addEventListener('pointerup', handlePointerUp, true);
  document.addEventListener('pointercancel', handlePointerCancel, true);
  button.addEventListener('pointerleave', (event) => {
    if (holdPointerId === event.pointerId) cancelDarkHold(event.pointerId);
  }, true);
  button.addEventListener('contextmenu', (event) => {
    if (holdPointerId !== null) event.preventDefault();
  });

  resetButton?.addEventListener('click', () => {
    generationRevision += 1;
    locked = false;
    resetSequence();
    applyBadge(null);
  }, true);

  document.getElementById('leaveRoomButton')?.addEventListener('click', () => {
    generationRevision += 1;
    roomCode = '';
    deviceId = '';
    locked = false;
    resetSequence();
    applyBadge(null);
  }, true);

  new MutationObserver(() => {
    if (!button.classList.contains('lit')) {
      locked = false;
      applyBadge(null);
    }
  }).observe(button, { attributes: true, attributeFilter: ['class'] });
})();
