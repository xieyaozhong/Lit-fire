'use strict';

const $ = (selector) => document.querySelector(selector);

const elements = {
  ambientCanvas: $('#ambientCanvas'),
  joinPanel: $('#joinPanel'),
  experiencePanel: $('#experiencePanel'),
  nameInput: $('#nameInput'),
  roomInput: $('#roomInput'),
  createRoomButton: $('#createRoomButton'),
  joinRoomButton: $('#joinRoomButton'),
  joinMessage: $('#joinMessage'),
  roomCodeLabel: $('#roomCodeLabel'),
  connectionBadge: $('#connectionBadge'),
  shareRoomButton: $('#shareRoomButton'),
  leaveRoomButton: $('#leaveRoomButton'),
  ignitionStage: $('#ignitionStage'),
  flameCanvas: $('#flameCanvas'),
  ignitionButton: $('#ignitionButton'),
  ignitionText: $('#ignitionText'),
  tapRipples: $('#tapRipples'),
  rhythmDots: $('#rhythmDots'),
  tempoLabel: $('#tempoLabel'),
  flameCard: $('#flameCard'),
  flameSigil: $('#flameSigil'),
  flameName: $('#flameName'),
  flameDescription: $('#flameDescription'),
  resetFlameButton: $('#resetFlameButton'),
  sendRoleButton: $('#sendRoleButton'),
  receiveRoleButton: $('#receiveRoleButton'),
  motionOrb: $('#motionOrb'),
  motionStatus: $('#motionStatus'),
  motionHint: $('#motionHint'),
  enableMotionButton: $('#enableMotionButton'),
  sensitivityInput: $('#sensitivityInput'),
  sensitivityOutput: $('#sensitivityOutput'),
  simulateBumpButton: $('#simulateBumpButton'),
  copyLinkButton: $('#copyLinkButton'),
  transferStatus: $('#transferStatus'),
  peopleList: $('#peopleList'),
  helpButton: $('#helpButton'),
  helpDialog: $('#helpDialog'),
  closeHelpButton: $('#closeHelpButton'),
  toast: $('#toast')
};

const FLAME_TYPES = {
  ember: {
    name: '恆星火',
    description: '穩定而持續的節拍，像守住約定的橙紅火光。',
    colors: ['#fff0a8', '#ff9f43', '#ff4d2e', '#7e1f2b'],
    sigil: '☀'
  },
  azure: {
    name: '疾風火',
    description: '快速密集的節奏，點燃清亮而銳利的藍色火焰。',
    colors: ['#e9ffff', '#69e7ff', '#168cff', '#3927a8'],
    sigil: '↯'
  },
  dream: {
    name: '夢燼',
    description: '緩慢留白的節奏，形成安靜流動的紫粉火光。',
    colors: ['#fff0ff', '#ff8bd8', '#9a5cff', '#43206f'],
    sigil: '☾'
  },
  forest: {
    name: '森靈火',
    description: '長短交錯的節奏，像枝葉間跳動的翠綠生命火。',
    colors: ['#f2ffd5', '#9cff64', '#1fd69a', '#15665c'],
    sigil: '✤'
  },
  spark: {
    name: '星火',
    description: '帶有切分與驚喜的節奏，迸發金白色的傳承火種。',
    colors: ['#ffffff', '#ffe47d', '#ff9d42', '#e64535'],
    sigil: '✦'
  }
};

const state = {
  roomCode: '',
  deviceId: '',
  deviceName: '',
  role: 'send',
  flame: null,
  isResettingFlame: false,
  flameRevision: 0,
  ignoreEmptyServerUntil: 0,
  tapTimes: [],
  finalizeTimer: null,
  pollTimer: null,
  lastTransferId: '',
  motionEnabled: false,
  motionHandler: null,
  lastMotionMagnitude: null,
  lastBumpAt: 0,
  lastApiErrorAt: 0,
  flameParticles: [],
  ambientParticles: [],
  toastTimer: null
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - avg) ** 2)));
}

function hashNumbers(values) {
  let hash = 2166136261;
  values.forEach((value) => {
    hash ^= Math.round(value * 1000);
    hash = Math.imul(hash, 16777619);
  });
  return Math.abs(hash >>> 0);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2200);
}

function setJoinMessage(message, isError = false) {
  elements.joinMessage.textContent = message;
  elements.joinMessage.style.color = isError ? '#ffb3c2' : '#caffdf';
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    cache: 'no-store',
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `連線失敗（${response.status}）`);
  }
  return data;
}

function roomUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('room', state.roomCode);
  return url.toString();
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
    showToast(successMessage);
  }
}

async function joinRoom(createNew) {
  const name = elements.nameInput.value.trim() || '星火旅人';
  const requestedRoom = createNew ? '' : elements.roomInput.value.trim();
  if (!createNew && requestedRoom.length < 5) {
    setJoinMessage('請輸入完整的 5 碼房間代碼。', true);
    return;
  }

  elements.createRoomButton.disabled = true;
  elements.joinRoomButton.disabled = true;
  setJoinMessage('正在連接火種房間…');

  try {
    const data = await api('/api/join', {
      method: 'POST',
      body: JSON.stringify({ name, roomCode: requestedRoom })
    });

    state.roomCode = data.roomCode;
    state.deviceId = data.deviceId;
    state.deviceName = name;
    localStorage.setItem('firePassingName', name);
    elements.roomCodeLabel.textContent = state.roomCode;
    elements.joinPanel.classList.add('hidden');
    elements.experiencePanel.classList.remove('hidden');
    elements.connectionBadge.textContent = '已連線';
    elements.connectionBadge.classList.add('online');

    const url = new URL(window.location.href);
    url.searchParams.set('room', state.roomCode);
    history.replaceState({}, '', url);

    applyServerState(data.state, true);
    startPolling();
    showToast(`已進入房間 ${state.roomCode}`);
  } catch (error) {
    setJoinMessage(error.message, true);
  } finally {
    elements.createRoomButton.disabled = false;
    elements.joinRoomButton.disabled = false;
  }
}

function leaveRoom() {
  stopPolling();
  disableMotion();
  state.roomCode = '';
  state.deviceId = '';
  state.flame = null;
  state.lastTransferId = '';
  elements.experiencePanel.classList.add('hidden');
  elements.joinPanel.classList.remove('hidden');
  elements.roomInput.value = '';
  resetFlameUi();
  const url = new URL(window.location.href);
  url.searchParams.delete('room');
  history.replaceState({}, '', url);
}

function startPolling() {
  stopPolling();
  pollState();
  state.pollTimer = setInterval(pollState, 850);
}

function stopPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = null;
}

async function pollState() {
  if (!state.roomCode || !state.deviceId) return;
  try {
    const data = await api(`/api/state?room=${encodeURIComponent(state.roomCode)}&device=${encodeURIComponent(state.deviceId)}`);
    elements.connectionBadge.textContent = '已連線';
    elements.connectionBadge.classList.add('online');
    applyServerState(data.state);
  } catch (error) {
    elements.connectionBadge.textContent = '重新連線';
    elements.connectionBadge.classList.remove('online');
    if (Date.now() - state.lastApiErrorAt > 5000) {
      state.lastApiErrorAt = Date.now();
      showToast(error.message);
    }
  }
}

function applyServerState(serverState, initial = false) {
  if (!serverState) return;
  renderPeople(serverState.devices || []);

  const current = serverState.current;
  if (current) {
    const incomingFlame = current.flame || null;
    const ignoreStaleFlame = state.isResettingFlame && incomingFlame;
    const ignoreStaleEmpty = !incomingFlame && state.flame && Date.now() < state.ignoreEmptyServerUntil;
    const changed = JSON.stringify(incomingFlame) !== JSON.stringify(state.flame);
    if (changed && !ignoreStaleFlame && !ignoreStaleEmpty) {
      clearFlameVisuals();
      state.flame = incomingFlame;
      if (state.flame) {
        state.ignoreEmptyServerUntil = 0;
        renderFlame(state.flame, !initial);
      } else {
        resetFlameUi(false);
      }
    }
  }

  const transfer = serverState.lastTransfer;
  if (transfer && transfer.id !== state.lastTransferId) {
    state.lastTransferId = transfer.id;
    if (transfer.toId === state.deviceId) {
      setTransferStatus('success', '火焰已傳入你的手中', `${transfer.fromName} 把「${transfer.flameName}」傳給了你。`, '✦');
      showToast(`收到 ${transfer.fromName} 的「${transfer.flameName}」`);
      pulseScreen();
    } else if (transfer.fromId === state.deviceId) {
      setTransferStatus('success', '傳火成功', `你的「${transfer.flameName}」已傳給 ${transfer.toName}。`, '✓');
      showToast(`已把火傳給 ${transfer.toName}`);
      pulseScreen();
    }
  }
}

function renderPeople(devices) {
  elements.peopleList.innerHTML = '';
  if (!devices.length) {
    elements.peopleList.innerHTML = '<div class="person-row"><small>尚無旅人</small></div>';
    return;
  }

  devices.forEach((device) => {
    const row = document.createElement('div');
    row.className = 'person-row';
    const label = device.isCurrent ? `${device.name}（你）` : device.name;
    row.innerHTML = `
      <div class="person-main">
        <span class="person-avatar">${device.hasFlame ? '🔥' : '○'}</span>
        <div>
          <strong>${escapeHtml(label)}</strong>
          <small>${device.hasFlame ? escapeHtml(device.flameName || '擁有火焰') : '等待火種'}</small>
        </div>
      </div>
      <small>${Date.now() - device.lastSeen < 8000 ? '在線' : '暫離'}</small>
    `;
    elements.peopleList.appendChild(row);
  });

  const otherCount = devices.filter((device) => !device.isCurrent).length;
  if (otherCount > 0 && elements.transferStatus.classList.contains('idle')) {
    setTransferStatus('idle', '另一支手機已加入', '選擇角色並同時輕碰手機，即可傳遞火焰。', '◉');
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function registerTap(event) {
  event.preventDefault();
  const now = performance.now();
  const lastTap = state.tapTimes.at(-1);
  if (lastTap && now - lastTap > 1700) state.tapTimes = [];
  if (state.tapTimes.length >= 10) state.tapTimes.shift();
  state.tapTimes.push(now);

  elements.ignitionButton.classList.add('tapped');
  setTimeout(() => elements.ignitionButton.classList.remove('tapped'), 120);
  addRipple();
  navigator.vibrate?.(18);
  renderRhythmPreview();

  clearTimeout(state.finalizeTimer);
  state.finalizeTimer = setTimeout(finalizeRhythm, 1050);
}

function addRipple() {
  const ripple = document.createElement('span');
  ripple.className = 'tap-ripple';
  elements.tapRipples.appendChild(ripple);
  setTimeout(() => ripple.remove(), 750);
}

function getIntervals() {
  return state.tapTimes.slice(1).map((time, index) => time - state.tapTimes[index]);
}

function renderRhythmPreview() {
  const intervals = getIntervals();
  elements.rhythmDots.innerHTML = '';
  state.tapTimes.forEach((_, index) => {
    if (index > 0) {
      const gap = document.createElement('span');
      gap.className = 'rhythm-gap';
      gap.style.width = `${clamp(intervals[index - 1] / 22, 7, 40)}px`;
      elements.rhythmDots.appendChild(gap);
    }
    const dot = document.createElement('span');
    dot.className = 'rhythm-dot';
    dot.style.transform = `scale(${1 + Math.min(index, 5) * 0.05})`;
    elements.rhythmDots.appendChild(dot);
  });

  if (intervals.length) {
    elements.tempoLabel.textContent = `${Math.round(60000 / mean(intervals))} BPM`;
  } else {
    elements.tempoLabel.textContent = '-- BPM';
  }
  elements.ignitionText.innerHTML = state.tapTimes.length < 3 ? `再點 ${3 - state.tapTimes.length} 次` : '停下<br>成火';
}

function classifyRhythm(intervals) {
  const avg = mean(intervals);
  const std = standardDeviation(intervals);
  const variation = avg ? std / avg : 0;

  if (avg < 290) return 'azure';
  if (avg > 720) return 'dream';
  if (variation < 0.13) return 'ember';

  const alternationScores = [];
  for (let index = 1; index < intervals.length; index += 1) {
    alternationScores.push(Math.abs(intervals[index] - intervals[index - 1]) / Math.max(intervals[index], intervals[index - 1]));
  }
  if (variation > 0.42 || mean(alternationScores) > 0.38) return 'forest';
  return 'spark';
}

async function finalizeRhythm() {
  if (state.tapTimes.length < 3) {
    elements.ignitionText.innerHTML = '至少<br>點 3 次';
    setTimeout(() => {
      if (!state.flame) elements.ignitionText.innerHTML = '點擊<br>點火';
    }, 900);
    return;
  }

  const intervals = getIntervals();
  const type = classifyRhythm(intervals);
  const meta = FLAME_TYPES[type];
  const tempo = Math.round(60000 / mean(intervals));
  const flame = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    name: meta.name,
    colors: meta.colors,
    seed: hashNumbers(intervals),
    tempo,
    rhythm: intervals.map((value) => Math.round(value)),
    bornAt: Date.now(),
    origin: state.deviceName
  };

  const flameRevision = ++state.flameRevision;
  clearFlameVisuals();
  state.isResettingFlame = false;
  state.ignoreEmptyServerUntil = Date.now() + 10000;
  state.flame = flame;
  renderFlame(flame, true);
  setRole('send');
  elements.ignitionText.innerHTML = '火種已成';
  navigator.vibrate?.([35, 40, 80]);

  try {
    await api('/api/flame', {
      method: 'POST',
      body: JSON.stringify({ roomCode: state.roomCode, deviceId: state.deviceId, flame })
    });
    if (flameRevision !== state.flameRevision) return;
    state.ignoreEmptyServerUntil = Date.now() + 1800;
    setTransferStatus('idle', '火焰已準備好', '讓另一支手機加入同一房間，準備進行傳火。', '🔥');
  } catch (error) {
    if (flameRevision !== state.flameRevision) return;
    showToast(`火焰已生成，但同步失敗：${error.message}`);
  }
}

function renderFlame(flame, celebrate = false) {
  const meta = FLAME_TYPES[flame.type] || {
    name: flame.name || '未知火焰',
    description: '一簇從遠方傳來的火焰。',
    colors: flame.colors,
    sigil: '✦'
  };
  const colors = flame.colors?.length >= 2 ? flame.colors : meta.colors;

  elements.flameCard.classList.remove('empty');
  elements.flameCard.style.setProperty('--flame-primary', colors[1] || colors[0]);
  elements.flameCard.style.setProperty('--flame-secondary', colors[2] || colors[1]);
  elements.ignitionButton.classList.add('lit');
  elements.ignitionButton.style.setProperty('--flame-primary', colors[1] || colors[0]);
  elements.ignitionButton.style.setProperty('--flame-secondary', colors[2] || colors[1]);
  elements.flameName.textContent = flame.name || meta.name;
  elements.flameDescription.textContent = meta.description;
  elements.flameSigil.textContent = meta.sigil;
  elements.resetFlameButton.disabled = false;
  elements.tempoLabel.textContent = flame.tempo ? `${flame.tempo} BPM` : '-- BPM';
  elements.ignitionText.innerHTML = '燃燒中';

  if (Array.isArray(flame.rhythm) && flame.rhythm.length) {
    elements.rhythmDots.innerHTML = '';
    flame.rhythm.forEach((interval, index) => {
      if (index === 0) {
        const first = document.createElement('span');
        first.className = 'rhythm-dot';
        elements.rhythmDots.appendChild(first);
      }
      const gap = document.createElement('span');
      gap.className = 'rhythm-gap';
      gap.style.width = `${clamp(interval / 22, 7, 40)}px`;
      const dot = document.createElement('span');
      dot.className = 'rhythm-dot';
      elements.rhythmDots.append(gap, dot);
    });
  }

  if (celebrate) pulseScreen();
}

async function resetFlame(sendToServer = true) {
  const resetRevision = ++state.flameRevision;
  state.isResettingFlame = true;
  state.ignoreEmptyServerUntil = 0;
  clearTimeout(state.finalizeTimer);
  state.finalizeTimer = null;
  state.flame = null;
  state.tapTimes = [];
  clearFlameVisuals();
  resetFlameUi();
  setRole('receive');

  if (!sendToServer || !state.roomCode) {
    if (resetRevision === state.flameRevision) state.isResettingFlame = false;
    return;
  }

  try {
    const data = await api('/api/flame', {
      method: 'POST',
      body: JSON.stringify({ roomCode: state.roomCode, deviceId: state.deviceId, flame: null })
    });
    if (resetRevision !== state.flameRevision || state.flame) return;
    state.isResettingFlame = false;
    applyServerState(data.state);
  } catch (error) {
    if (resetRevision !== state.flameRevision) return;
    state.isResettingFlame = false;
    showToast(error.message);
  }
}

function clearFlameVisuals() {
  state.flameParticles.length = 0;
  elements.tapRipples.innerHTML = '';

  const canvas = elements.flameCanvas;
  const context = canvas.getContext('2d');
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.restore();
}

function resetFlameUi(clearState = true) {
  if (clearState) state.flame = null;
  clearFlameVisuals();
  elements.flameCard.classList.add('empty');
  elements.flameCard.style.removeProperty('--flame-primary');
  elements.flameCard.style.removeProperty('--flame-secondary');
  elements.ignitionButton.classList.remove('lit');
  elements.ignitionButton.style.removeProperty('--flame-primary');
  elements.ignitionButton.style.removeProperty('--flame-secondary');
  elements.flameName.textContent = '尚未點燃';
  elements.flameDescription.textContent = '讓你的節奏決定火焰的顏色與性格。';
  elements.flameSigil.textContent = '✦';
  elements.resetFlameButton.disabled = true;
  elements.tempoLabel.textContent = '-- BPM';
  elements.rhythmDots.innerHTML = '';
  elements.ignitionText.innerHTML = '點擊<br>點火';
}

async function setRole(role, sync = true) {
  state.role = role;
  elements.sendRoleButton.classList.toggle('active', role === 'send');
  elements.receiveRoleButton.classList.toggle('active', role === 'receive');

  if (role === 'send' && !state.flame) {
    setTransferStatus('idle', '尚未擁有火焰', '請先用中央點火區生成火焰，或改成接火模式。', '○');
  } else if (role === 'send') {
    setTransferStatus('idle', '準備傳出火焰', '等待另一支手機選擇接火並一起碰撞。', '🔥');
  } else {
    setTransferStatus('idle', '準備接收火焰', '等待擁有火焰的手機與你一起碰撞。', '🫴');
  }

  if (sync && state.roomCode) {
    try {
      await api('/api/intent', {
        method: 'POST',
        body: JSON.stringify({ roomCode: state.roomCode, deviceId: state.deviceId, intent: role })
      });
    } catch (error) {
      showToast(error.message);
    }
  }
}

function setTransferStatus(kind, title, detail, icon) {
  elements.transferStatus.className = `transfer-status ${kind}`;
  elements.transferStatus.innerHTML = `
    <span class="status-icon">${icon}</span>
    <div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div>
  `;
}

async function enableMotion() {
  if (state.motionEnabled) {
    disableMotion();
    return;
  }

  if (typeof DeviceMotionEvent === 'undefined') {
    elements.motionStatus.textContent = '此裝置不支援';
    elements.motionHint.textContent = '仍可使用「模擬碰撞」測試傳火。';
    showToast('此瀏覽器無法使用動作感測');
    return;
  }

  try {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== 'granted') throw new Error('你沒有允許動作感測權限');
    }

    state.motionHandler = handleDeviceMotion;
    window.addEventListener('devicemotion', state.motionHandler, { passive: true });
    state.motionEnabled = true;
    elements.motionOrb.classList.add('active');
    elements.motionStatus.textContent = '已啟用，等待碰撞';
    elements.motionHint.textContent = '請讓兩台手機輕碰邊緣，避免用力撞擊螢幕。';
    elements.enableMotionButton.textContent = '關閉動作感測';
    showToast('動作感測已啟用');
  } catch (error) {
    elements.motionStatus.textContent = '權限未開啟';
    elements.motionHint.textContent = '請在 Safari 設定中允許動作與方向存取，或使用模擬碰撞。';
    showToast(error.message);
  }
}

function disableMotion() {
  if (state.motionHandler) window.removeEventListener('devicemotion', state.motionHandler);
  state.motionHandler = null;
  state.motionEnabled = false;
  state.lastMotionMagnitude = null;
  elements.motionOrb.classList.remove('active', 'bump');
  elements.motionStatus.textContent = '尚未啟用';
  elements.motionHint.textContent = 'iPhone 需點擊按鈕後允許「動作與方向」權限。';
  elements.enableMotionButton.textContent = '啟用動作感測';
}

function handleDeviceMotion(event) {
  const acceleration = event.acceleration || {};
  const withGravity = event.accelerationIncludingGravity || {};
  const ax = Number(acceleration.x) || 0;
  const ay = Number(acceleration.y) || 0;
  const az = Number(acceleration.z) || 0;
  const gx = Number(withGravity.x) || 0;
  const gy = Number(withGravity.y) || 0;
  const gz = Number(withGravity.z) || 0;

  const linearMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);
  const gravityMagnitude = Math.sqrt(gx * gx + gy * gy + gz * gz);
  const jerk = state.lastMotionMagnitude === null ? 0 : Math.abs(gravityMagnitude - state.lastMotionMagnitude);
  state.lastMotionMagnitude = gravityMagnitude;

  const strength = Math.max(linearMagnitude, jerk * 1.6);
  const threshold = Number(elements.sensitivityInput.value);
  const scale = clamp(1 + strength / 35, 1, 1.3);
  elements.motionOrb.style.transform = `scale(${scale})`;

  if (strength >= threshold && Date.now() - state.lastBumpAt > 2100) {
    triggerBump(strength);
  }
}

async function triggerBump(strength = 12) {
  if (!state.roomCode) return;
  state.lastBumpAt = Date.now();
  elements.motionOrb.classList.add('bump');
  setTimeout(() => elements.motionOrb.classList.remove('bump'), 350);
  navigator.vibrate?.([60, 35, 60]);
  setTransferStatus('searching', '感受到碰撞', '正在尋找 1.7 秒內同步碰撞的另一支手機…', '◌');

  try {
    const data = await api('/api/bump', {
      method: 'POST',
      body: JSON.stringify({
        roomCode: state.roomCode,
        deviceId: state.deviceId,
        intent: state.role,
        strength: clamp(Math.round(strength * 4), 1, 100)
      })
    });
    applyServerState(data.state);
    if (!data.matched) {
      setTimeout(() => {
        if (elements.transferStatus.classList.contains('searching')) {
          setTransferStatus('idle', '這次沒有配對成功', '請確認兩支手機在同一房間，並更接近同一時間碰撞。', '◎');
        }
      }, 1900);
    }
  } catch (error) {
    setTransferStatus('idle', '碰撞同步失敗', error.message, '!');
  }
}

function pulseScreen() {
  const flash = document.createElement('div');
  Object.assign(flash.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '90',
    pointerEvents: 'none',
    background: `radial-gradient(circle, ${state.flame?.colors?.[0] || '#fff5c7'} 0%, transparent 68%)`,
    opacity: '0',
    transition: 'opacity 260ms ease'
  });
  document.body.appendChild(flash);
  requestAnimationFrame(() => { flash.style.opacity = '0.55'; });
  setTimeout(() => { flash.style.opacity = '0'; }, 130);
  setTimeout(() => flash.remove(), 430);
}

function resizeCanvas(canvas, context, cssWidth, cssHeight) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(cssWidth * dpr));
  const height = Math.max(1, Math.floor(cssHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return dpr;
}

function initAmbient() {
  const canvas = elements.ambientCanvas;
  const ctx = canvas.getContext('2d');

  function resize() {
    resizeCanvas(canvas, ctx, window.innerWidth, window.innerHeight);
    const count = Math.min(60, Math.floor(window.innerWidth / 12));
    state.ambientParticles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.25,
      speed: Math.random() * 0.16 + 0.03,
      drift: (Math.random() - 0.5) * 0.08,
      alpha: Math.random() * 0.45 + 0.08
    }));
  }

  function frame() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    state.ambientParticles.forEach((particle) => {
      particle.y -= particle.speed;
      particle.x += particle.drift;
      if (particle.y < -5) {
        particle.y = window.innerHeight + 5;
        particle.x = Math.random() * window.innerWidth;
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 189, 106, ${particle.alpha})`;
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  frame();
}

function initFlameRenderer() {
  const canvas = elements.flameCanvas;
  const ctx = canvas.getContext('2d');

  function getSize() {
    const rect = elements.ignitionStage.getBoundingClientRect();
    resizeCanvas(canvas, ctx, rect.width, rect.height);
    return rect;
  }

  function spawnParticle(cx, cy, radius, colors) {
    state.flameParticles.push({
      x: cx + (Math.random() - 0.5) * radius * 0.58,
      y: cy + radius * 0.38 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 0.34,
      vy: -(Math.random() * 0.9 + 0.45),
      life: 1,
      decay: Math.random() * 0.012 + 0.009,
      r: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * Math.min(colors.length, 3))]
    });
  }

  function drawFlameShape(cx, baseY, width, height, color, time, phase, alpha) {
    const waveA = Math.sin(time * 0.0038 + phase) * width * 0.09;
    const waveB = Math.sin(time * 0.0061 + phase * 1.7) * width * 0.06;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - height);
    ctx.bezierCurveTo(
      cx - width * 0.1 + waveA,
      baseY - height * 0.72,
      cx - width * 0.62 + waveB,
      baseY - height * 0.3,
      cx - width * 0.46,
      baseY
    );
    ctx.quadraticCurveTo(cx, baseY + height * 0.08, cx + width * 0.46, baseY);
    ctx.bezierCurveTo(
      cx + width * 0.62 - waveA,
      baseY - height * 0.34,
      cx + width * 0.08 - waveB,
      baseY - height * 0.68,
      cx,
      baseY - height
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.shadowBlur = 24;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.restore();
  }

  function drawOrbHalo(cx, cy, radius, colors, time) {
    const outerGlow = ctx.createRadialGradient(cx, cy, radius * 0.18, cx, cy, radius * 1.72);
    outerGlow.addColorStop(0, `${colors[1]}1c`);
    outerGlow.addColorStop(0.42, `${colors[2] || colors[1]}22`);
    outerGlow.addColorStop(0.8, `${colors[3] || colors[2] || colors[1]}10`);
    outerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGlow;
    ctx.fillRect(cx - radius * 1.9, cy - radius * 1.9, radius * 3.8, radius * 3.8);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineWidth = radius * 0.07;
    ctx.strokeStyle = `${colors[1]}99`;
    ctx.shadowBlur = 16;
    ctx.shadowColor = colors[1];
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (1.01 + Math.sin(time * 0.0024) * 0.012), 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = radius * 0.028;
    ctx.strokeStyle = `${colors[0]}d0`;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (0.78 + Math.sin(time * 0.0033 + 1.4) * 0.014), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function frame(time) {
    const rect = getSize();
    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    if (state.flame) {
      const colors = state.flame.colors || FLAME_TYPES.ember.colors;
      const cx = width / 2;
      const cy = height * 0.53;
      const radius = Math.min(width, height) * 0.29;
      const baseY = cy + radius * 0.54;
      const seedPhase = (state.flame.seed % 1000) / 100;

      drawOrbHalo(cx, cy, radius, colors, time);

      const orbFill = ctx.createRadialGradient(cx, cy - radius * 0.24, radius * 0.12, cx, cy, radius * 1.05);
      orbFill.addColorStop(0, 'rgba(255,255,255,0.16)');
      orbFill.addColorStop(0.24, `${colors[0]}22`);
      orbFill.addColorStop(0.55, 'rgba(23, 15, 36, 0.8)');
      orbFill.addColorStop(1, 'rgba(7, 5, 14, 0.97)');
      ctx.fillStyle = orbFill;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.98, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.92, 0, Math.PI * 2);
      ctx.clip();

      const innerGlow = ctx.createRadialGradient(cx, cy + radius * 0.08, radius * 0.1, cx, cy + radius * 0.14, radius * 0.98);
      innerGlow.addColorStop(0, `${colors[1]}26`);
      innerGlow.addColorStop(0.52, `${colors[2] || colors[1]}10`);
      innerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = innerGlow;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      drawFlameShape(cx, baseY, radius * 0.7, radius * 0.98, colors[3] || colors[2], time, seedPhase, 0.38);
      drawFlameShape(cx + Math.sin(time * 0.0022) * radius * 0.08, baseY - radius * 0.03, radius * 0.54, radius * 0.82, colors[2] || colors[1], time, seedPhase + 2.2, 0.62);
      drawFlameShape(cx - Math.sin(time * 0.0034) * radius * 0.06, baseY - radius * 0.06, radius * 0.4, radius * 0.62, colors[1], time, seedPhase + 4.6, 0.88);
      drawFlameShape(cx, baseY - radius * 0.1, radius * 0.24, radius * 0.42, colors[0], time, seedPhase + 6.3, 0.96);

      const core = ctx.createRadialGradient(cx, cy + radius * 0.12, radius * 0.03, cx, cy + radius * 0.2, radius * 0.46);
      core.addColorStop(0, `${colors[0]}dd`);
      core.addColorStop(0.42, `${colors[1]}6e`);
      core.addColorStop(1, 'transparent');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(cx, cy + radius * 0.22, radius * 0.34, radius * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = `${colors[0]}35`;
      ctx.lineWidth = radius * 0.016;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (Math.random() < 0.44) spawnParticle(cx, cy, radius, colors);
    }

    state.flameParticles = state.flameParticles.filter((particle) => particle.life > 0);
    state.flameParticles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx += Math.sin(time * 0.002 + particle.y) * 0.003;
      particle.life -= particle.decay;
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r * particle.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', getSize);
  frame(0);
}

function bindEvents() {
  elements.createRoomButton.addEventListener('click', () => joinRoom(true));
  elements.joinRoomButton.addEventListener('click', () => joinRoom(false));
  elements.roomInput.addEventListener('input', () => {
    elements.roomInput.value = elements.roomInput.value.toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, '').slice(0, 5);
  });
  elements.roomInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') joinRoom(false);
  });
  elements.ignitionButton.addEventListener('pointerdown', registerTap);
  elements.resetFlameButton.addEventListener('click', () => resetFlame(true));
  elements.sendRoleButton.addEventListener('click', () => setRole('send'));
  elements.receiveRoleButton.addEventListener('click', () => setRole('receive'));
  elements.enableMotionButton.addEventListener('click', enableMotion);
  elements.simulateBumpButton.addEventListener('click', () => triggerBump(12));
  elements.sensitivityInput.addEventListener('input', () => {
    elements.sensitivityOutput.textContent = elements.sensitivityInput.value;
  });
  elements.shareRoomButton.addEventListener('click', async () => {
    const shareData = { title: '傳火計畫', text: `加入我的傳火房間：${state.roomCode}`, url: roomUrl() };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error.name !== 'AbortError') copyText(roomUrl(), '房間連結已複製');
      }
    } else {
      copyText(roomUrl(), '房間連結已複製');
    }
  });
  elements.copyLinkButton.addEventListener('click', () => copyText(roomUrl(), '房間連結已複製'));
  elements.leaveRoomButton.addEventListener('click', leaveRoom);
  elements.helpButton.addEventListener('click', () => elements.helpDialog.showModal());
  elements.closeHelpButton.addEventListener('click', () => elements.helpDialog.close());
  elements.helpDialog.addEventListener('click', (event) => {
    if (event.target === elements.helpDialog) elements.helpDialog.close();
  });
  window.addEventListener('pagehide', stopPolling);
}

function initialize() {
  const savedName = localStorage.getItem('firePassingName');
  if (savedName) elements.nameInput.value = savedName;
  const roomFromUrl = new URL(window.location.href).searchParams.get('room');
  if (roomFromUrl) elements.roomInput.value = roomFromUrl.toUpperCase().slice(0, 5);

  bindEvents();
  initAmbient();
  initFlameRenderer();
  setRole('send', false);
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }
}

initialize();
