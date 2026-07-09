'use strict';

(() => {
  const originalFetch = window.fetch.bind(window);
  let currentRoom = '';
  let currentDevice = '';
  let currentFlame = null;
  let pendingFlame = readIncomingFlame();
  let importStarted = false;

  function encodePayload(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
  }

  function decodePayload(value) {
    const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function isHexColor(value) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  }

  function sanitizeFlame(value) {
    if (!value || typeof value !== 'object') return null;
    const colors = Array.isArray(value.colors) ? value.colors.filter(isHexColor).slice(0, 7) : [];
    if (colors.length < 2) return null;

    const rhythm = Array.isArray(value.rhythm)
      ? value.rhythm.slice(0, 10).map(Number).filter((interval) => Number.isFinite(interval) && interval >= 50 && interval <= 1700)
      : [];

    return {
      id: `airdrop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: String(value.type || 'spark').slice(0, 24),
      name: String(value.name || '遠方火種').slice(0, 32),
      colors,
      seed: Number.isFinite(Number(value.seed)) ? Math.abs(Math.trunc(Number(value.seed))) : Date.now(),
      tempo: Number.isFinite(Number(value.tempo)) ? Math.max(20, Math.min(600, Math.round(Number(value.tempo)))) : 0,
      rhythm,
      bornAt: Date.now(),
      origin: String(value.origin || 'AirDrop 旅人').slice(0, 24),
      specialFlame: Boolean(value.specialFlame),
      symbolicMeaning: typeof value.symbolicMeaning === 'string' ? value.symbolicMeaning.slice(0, 120) : undefined
    };
  }

  function readIncomingFlame() {
    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const encoded = params.get('fire');
      if (!encoded) return null;
      const payload = decodePayload(encoded);
      const flame = sanitizeFlame(payload?.flame);
      if (!flame) return null;
      if (payload.room) {
        const room = String(payload.room).toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, '').slice(0, 5);
        if (room) {
          const url = new URL(window.location.href);
          url.searchParams.set('room', room);
          history.replaceState({}, '', `${url.pathname}${url.search}${window.location.hash}`);
        }
      }
      return flame;
    } catch {
      return null;
    }
  }

  function getFlameFromPayload(payload) {
    return payload?.state?.current?.flame || payload?.current?.flame || null;
  }

  function showMessage(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function flameShareUrl() {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('room', currentRoom);
    url.searchParams.set('airdrop', '1');
    const payload = encodePayload({ version: 1, room: currentRoom, flame: currentFlame });
    url.hash = `fire=${payload}`;
    return url.toString();
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
  }

  async function shareFlame() {
    if (!currentRoom || !currentFlame) {
      showMessage('請先點燃一個火種');
      return;
    }

    const url = flameShareUrl();
    const flameName = currentFlame.name || '火種';
    const data = {
      title: `${flameName}｜傳火計畫`,
      text: `我把「${flameName}」傳給你。開啟連結、加入房間後即可接火。`,
      url
    };

    if (navigator.share) {
      try {
        await navigator.share(data);
        showMessage('已開啟分享面板，選擇 AirDrop 即可傳火');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    await copyText(url);
    showMessage('火種連結已複製');
  }

  async function importPendingFlame() {
    if (!pendingFlame || !currentRoom || !currentDevice || importStarted) return;
    importStarted = true;

    try {
      const response = await originalFetch('/api/flame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ roomCode: currentRoom, deviceId: currentDevice, flame: pendingFlame })
      });
      if (!response.ok) throw new Error('import failed');

      currentFlame = pendingFlame;
      pendingFlame = null;
      const url = new URL(window.location.href);
      url.searchParams.delete('airdrop');
      url.hash = '';
      history.replaceState({}, '', `${url.pathname}${url.search}`);
      showMessage(`已透過 AirDrop 接收「${currentFlame.name || '火種'}」`);
      navigator.vibrate?.([35, 45, 90]);
    } catch {
      importStarted = false;
      showMessage('AirDrop 火種匯入失敗，請重新加入房間');
    }
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.roomCode) currentRoom = body.roomCode;
        if (body.deviceId) currentDevice = body.deviceId;
        currentFlame = body.flame || null;
      } catch {
        // Ignore unrelated or malformed bodies.
      }
    }

    const response = await originalFetch(input, init);

    response.clone().json().then((payload) => {
      if (url.includes('/api/join')) {
        currentRoom = payload?.roomCode || currentRoom;
        currentDevice = payload?.deviceId || currentDevice;
        window.setTimeout(importPendingFlame, 240);
      }

      const serverFlame = getFlameFromPayload(payload);
      if (payload?.state?.current || payload?.current) currentFlame = serverFlame;
      updateAirDropButton();
    }).catch(() => {});

    return response;
  };

  function updateAirDropButton() {
    const button = document.getElementById('airdropFlameButton');
    if (!button) return;
    button.disabled = !currentFlame;
    button.classList.toggle('ready', Boolean(currentFlame));
  }

  function buildInterface() {
    const transferPanel = document.querySelector('.transfer-panel');
    const transferHeading = transferPanel?.querySelector('.section-heading p');
    const motionHint = document.getElementById('motionHint');
    const actions = document.querySelector('.transfer-actions');
    const joinPanel = document.getElementById('joinPanel');

    if (transferHeading) {
      transferHeading.textContent = '兩台手機開啟動作感測後，請用側邊或底部輕碰；也可以保持距離，同時做一次短促晃動。';
    }
    if (motionHint) {
      motionHint.textContent = '請勿將兩支 iPhone 頂端靠近，以免觸發 NameDrop／AirDrop。';
    }

    if (transferPanel && !document.getElementById('airdropSafeNote')) {
      const note = document.createElement('div');
      note.id = 'airdropSafeNote';
      note.className = 'airdrop-safe-note';
      note.innerHTML = '<strong>避免誤觸 AirDrop</strong><span>使用手機側邊／底部輕碰，或不接觸、同時短促晃動。需要完全關閉時：設定 → 一般 → AirDrop → 關閉「將裝置靠近」。</span>';
      const roleSelector = transferPanel.querySelector('.role-selector');
      roleSelector?.insertAdjacentElement('beforebegin', note);
    }

    if (actions && !document.getElementById('airdropFlameButton')) {
      const button = document.createElement('button');
      button.id = 'airdropFlameButton';
      button.className = 'secondary-button airdrop-flame-button';
      button.type = 'button';
      button.disabled = true;
      button.innerHTML = '<span>◉</span> 用 AirDrop 傳火';
      button.addEventListener('click', shareFlame);
      actions.prepend(button);
    }

    if (pendingFlame && joinPanel && !document.getElementById('incomingFlameNotice')) {
      const notice = document.createElement('div');
      notice.id = 'incomingFlameNotice';
      notice.className = 'incoming-flame-notice';
      notice.innerHTML = `<strong>收到 AirDrop 火種</strong><span>輸入名字並加入房間後，將自動接收「${pendingFlame.name || '火種'}」。</span>`;
      joinPanel.querySelector('.section-heading')?.insertAdjacentElement('afterend', notice);
      const joinButton = document.getElementById('joinRoomButton');
      if (joinButton) joinButton.textContent = '加入並接火';
    }

    const helpItems = document.querySelectorAll('#helpDialog li');
    if (helpItems[3]) {
      helpItems[3].textContent = '兩台手機啟用動作感測後，用側邊／底部輕碰，或保持距離同時短促晃動；不要把 iPhone 頂端靠在一起。';
    }

    updateAirDropButton();
  }

  const style = document.createElement('style');
  style.textContent = `
    .airdrop-safe-note,
    .incoming-flame-notice {
      display: grid;
      gap: 4px;
      margin: 12px 0 16px;
      padding: 12px 14px;
      border: 1px solid rgba(105, 231, 255, 0.2);
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(22, 140, 255, 0.09), rgba(154, 92, 255, 0.08));
      color: rgba(242, 247, 255, 0.78);
      font-size: 0.78rem;
      line-height: 1.55;
    }

    .airdrop-safe-note strong,
    .incoming-flame-notice strong {
      color: #e9ffff;
      font-size: 0.82rem;
    }

    .incoming-flame-notice {
      border-color: rgba(255, 173, 210, 0.24);
      background: linear-gradient(135deg, rgba(255, 92, 168, 0.1), rgba(88, 86, 214, 0.09));
    }

    .airdrop-flame-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
    }

    .airdrop-flame-button.ready {
      border-color: rgba(105, 231, 255, 0.34);
      box-shadow: 0 0 22px rgba(22, 140, 255, 0.12);
    }

    .airdrop-flame-button:disabled {
      opacity: 0.42;
    }
  `;
  document.head.appendChild(style);
  buildInterface();
})();
