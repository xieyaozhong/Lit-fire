'use strict';

(() => {
  if (window.__transferHapticFeedbackLoaded) return;
  window.__transferHapticFeedbackLoaded = true;

  const transferStatus = document.getElementById('transferStatus');
  const ignitionButton = document.getElementById('ignitionButton');
  const appShell = document.querySelector('.app-shell');
  if (!transferStatus) return;

  const style = document.createElement('style');
  style.textContent = `
    .transfer-status.haptic-confirm {
      animation: transfer-haptic-confirm .82s cubic-bezier(.16,.88,.22,1) both;
      box-shadow:
        0 0 0 2px rgba(255,255,255,.15),
        0 0 28px rgba(255,209,105,.32),
        0 0 58px rgba(102,223,255,.2) !important;
    }

    #ignitionButton.transfer-haptic-confirm {
      animation: transfer-flame-haptic-confirm .88s cubic-bezier(.16,.84,.25,1) both;
    }

    .app-shell.transfer-feedback-shake {
      animation: transfer-shell-shake .48s cubic-bezier(.2,.7,.25,1) both;
    }

    .transfer-feedback-overlay {
      --feedback-primary: #ffd56b;
      --feedback-secondary: #76eaff;
      position: fixed;
      inset: 0;
      z-index: 1200;
      pointer-events: none;
      overflow: hidden;
      opacity: 0;
      visibility: hidden;
    }

    .transfer-feedback-overlay.active {
      visibility: visible;
      animation: transfer-screen-flash 1.28s ease-out both;
    }

    .transfer-feedback-overlay::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--feedback-primary) 56%, transparent) 0%, transparent 32%),
        radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--feedback-secondary) 30%, transparent) 0%, transparent 62%),
        rgba(255,255,255,.04);
      opacity: 0;
      animation: transfer-overlay-glow 1.15s ease-out both;
    }

    .transfer-feedback-core,
    .transfer-feedback-ring {
      position: absolute;
      left: 50%;
      top: 48%;
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(.15);
      opacity: 0;
    }

    .transfer-feedback-core {
      width: min(38vw, 180px);
      aspect-ratio: 1;
      background: radial-gradient(circle,
        rgba(255,255,255,.98) 0%,
        color-mix(in srgb, var(--feedback-primary) 88%, white) 16%,
        color-mix(in srgb, var(--feedback-secondary) 68%, transparent) 45%,
        transparent 73%);
      filter: blur(.2px);
      box-shadow:
        0 0 34px color-mix(in srgb, var(--feedback-primary) 82%, transparent),
        0 0 88px color-mix(in srgb, var(--feedback-secondary) 52%, transparent);
    }

    .transfer-feedback-overlay.active .transfer-feedback-core {
      animation: transfer-core-burst .88s ease-out both;
    }

    .transfer-feedback-ring {
      width: min(42vw, 200px);
      aspect-ratio: 1;
      border: 3px solid color-mix(in srgb, var(--feedback-primary) 88%, white);
      box-shadow:
        0 0 16px color-mix(in srgb, var(--feedback-primary) 64%, transparent),
        inset 0 0 18px color-mix(in srgb, var(--feedback-secondary) 30%, transparent);
    }

    .transfer-feedback-overlay.active .ring-a {
      animation: transfer-ring-expand 1.02s ease-out .02s both;
    }

    .transfer-feedback-overlay.active .ring-b {
      animation: transfer-ring-expand 1.08s ease-out .15s both;
    }

    .transfer-feedback-overlay.active .ring-c {
      animation: transfer-ring-expand 1.14s ease-out .28s both;
    }

    .transfer-feedback-label {
      position: absolute;
      left: 50%;
      top: calc(48% + min(27vw, 132px));
      transform: translate(-50%, 18px) scale(.88);
      display: grid;
      gap: 4px;
      min-width: min(78vw, 310px);
      padding: 13px 18px;
      border: 1px solid color-mix(in srgb, var(--feedback-primary) 58%, transparent);
      border-radius: 999px;
      background: rgba(8,10,24,.78);
      box-shadow:
        0 0 26px color-mix(in srgb, var(--feedback-primary) 24%, transparent),
        inset 0 0 22px rgba(255,255,255,.04);
      color: #fff;
      text-align: center;
      opacity: 0;
      backdrop-filter: blur(12px);
    }

    .transfer-feedback-label strong {
      font-size: 1rem;
      letter-spacing: .08em;
    }

    .transfer-feedback-label span {
      color: rgba(244,249,255,.72);
      font-size: .76rem;
    }

    .transfer-feedback-overlay.active .transfer-feedback-label {
      animation: transfer-label-pop 1.16s cubic-bezier(.16,.84,.26,1) .08s both;
    }

    .web-haptic-switch {
      position: fixed !important;
      left: -120px !important;
      top: -120px !important;
      width: 1px !important;
      height: 1px !important;
      opacity: .001 !important;
      pointer-events: none !important;
      z-index: -1 !important;
    }

    @keyframes transfer-haptic-confirm {
      0% { transform: scale(1); filter: brightness(1); }
      18% { transform: scale(1.06); filter: brightness(1.45); }
      36% { transform: scale(.975); filter: brightness(1.1); }
      58% { transform: scale(1.035); filter: brightness(1.3); }
      78% { transform: scale(.992); }
      100% { transform: scale(1); filter: brightness(1); }
    }

    @keyframes transfer-flame-haptic-confirm {
      0% { transform: scale(1); filter: brightness(1); }
      18% { transform: scale(1.12); filter: brightness(1.7); }
      37% { transform: scale(.96); filter: brightness(1.12); }
      58% { transform: scale(1.075); filter: brightness(1.48); }
      76% { transform: scale(.985); }
      100% { transform: scale(1); filter: brightness(1); }
    }

    @keyframes transfer-shell-shake {
      0%, 100% { transform: translate3d(0,0,0); }
      14% { transform: translate3d(-5px,1px,0); }
      28% { transform: translate3d(5px,-1px,0); }
      43% { transform: translate3d(-3px,0,0); }
      58% { transform: translate3d(3px,1px,0); }
      74% { transform: translate3d(-1px,0,0); }
    }

    @keyframes transfer-screen-flash {
      0% { opacity: 0; }
      7% { opacity: 1; }
      20% { opacity: .92; }
      100% { opacity: 0; }
    }

    @keyframes transfer-overlay-glow {
      0% { opacity: 0; transform: scale(.72); }
      12% { opacity: 1; transform: scale(1); }
      45% { opacity: .72; }
      100% { opacity: 0; transform: scale(1.12); }
    }

    @keyframes transfer-core-burst {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(.12); }
      12% { opacity: 1; transform: translate(-50%, -50%) scale(1.12); }
      28% { opacity: .78; transform: translate(-50%, -50%) scale(.84); }
      48% { opacity: .95; transform: translate(-50%, -50%) scale(1.02); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(1.55); }
    }

    @keyframes transfer-ring-expand {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(.28); }
      12% { opacity: .95; }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(3.1); }
    }

    @keyframes transfer-label-pop {
      0% { opacity: 0; transform: translate(-50%, 18px) scale(.88); }
      18% { opacity: 1; transform: translate(-50%, 0) scale(1.035); }
      65% { opacity: 1; transform: translate(-50%, 0) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -8px) scale(.98); }
    }

    @media (prefers-reduced-motion: reduce) {
      .transfer-status.haptic-confirm,
      #ignitionButton.transfer-haptic-confirm,
      .app-shell.transfer-feedback-shake,
      .transfer-feedback-overlay.active,
      .transfer-feedback-overlay.active *,
      .transfer-feedback-overlay.active::before {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
      }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'transfer-feedback-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <span class="transfer-feedback-core"></span>
    <span class="transfer-feedback-ring ring-a"></span>
    <span class="transfer-feedback-ring ring-b"></span>
    <span class="transfer-feedback-ring ring-c"></span>
    <div class="transfer-feedback-label">
      <strong>傳火成功</strong>
      <span>火種已完成交接</span>
    </div>
  `;
  document.body.appendChild(overlay);

  const labelTitle = overlay.querySelector('strong');
  const labelDetail = overlay.querySelector('span');

  const switchInput = document.createElement('input');
  switchInput.type = 'checkbox';
  switchInput.setAttribute('switch', '');
  switchInput.className = 'web-haptic-switch';
  switchInput.tabIndex = -1;
  switchInput.setAttribute('aria-hidden', 'true');
  document.body.appendChild(switchInput);

  let lastSuccessSignature = '';
  let visualTimer = 0;
  let overlayTimer = 0;
  let switchTimers = [];
  let audioContext = null;

  function ensureAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }

  function warmAudio() {
    ensureAudioContext();
  }

  document.addEventListener('pointerdown', warmAudio, { passive: true, once: true });
  document.addEventListener('touchstart', warmAudio, { passive: true, once: true });

  function clearSwitchTimers() {
    switchTimers.forEach((timer) => window.clearTimeout(timer));
    switchTimers = [];
  }

  function triggerSafariHaptics(delays) {
    clearSwitchTimers();
    delays.forEach((delay) => {
      const timer = window.setTimeout(() => {
        try {
          switchInput.click();
        } catch {
          // Safari haptic fallback is best effort only.
        }
      }, delay);
      switchTimers.push(timer);
    });
  }

  function playTone(context, start, frequency, duration, volume, type = 'sine') {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.08, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function playSuccessChime(kind) {
    try {
      const context = ensureAudioContext();
      if (!context || context.state !== 'running') return;
      const now = context.currentTime + 0.025;

      if (kind === 'received') {
        playTone(context, now, 440, .13, .075, 'sine');
        playTone(context, now + .11, 659, .15, .08, 'triangle');
        playTone(context, now + .23, 988, .24, .095, 'sine');
      } else {
        playTone(context, now, 523, .14, .075, 'triangle');
        playTone(context, now + .14, 784, .24, .09, 'sine');
      }
    } catch {
      // Audio feedback is optional and must never block transfer feedback.
    }
  }

  function readFlameColor() {
    if (!ignitionButton) return '';
    const styles = getComputedStyle(ignitionButton);
    return styles.getPropertyValue('--flame-primary').trim();
  }

  function triggerOverlay(kind, detail) {
    window.clearTimeout(overlayTimer);
    const received = kind === 'received';
    const flameColor = readFlameColor();
    overlay.style.setProperty('--feedback-primary', flameColor || (received ? '#8ff7ff' : '#ffd56b'));
    overlay.style.setProperty('--feedback-secondary', received ? '#9d8cff' : '#ff8d65');
    labelTitle.textContent = received ? '接火成功' : '傳火成功';
    labelDetail.textContent = detail || (received ? '火種已傳入你的手中' : '火種已成功交給對方');

    overlay.classList.remove('active');
    void overlay.offsetWidth;
    overlay.classList.add('active');
    overlayTimer = window.setTimeout(() => overlay.classList.remove('active'), 1380);
  }

  function triggerVisualConfirmation(kind, detail) {
    window.clearTimeout(visualTimer);
    transferStatus.classList.remove('haptic-confirm');
    ignitionButton?.classList.remove('transfer-haptic-confirm');
    appShell?.classList.remove('transfer-feedback-shake');
    void transferStatus.offsetWidth;
    transferStatus.classList.add('haptic-confirm');
    ignitionButton?.classList.add('transfer-haptic-confirm');
    appShell?.classList.add('transfer-feedback-shake');
    triggerOverlay(kind, detail);

    visualTimer = window.setTimeout(() => {
      transferStatus.classList.remove('haptic-confirm');
      ignitionButton?.classList.remove('transfer-haptic-confirm');
      appShell?.classList.remove('transfer-feedback-shake');
    }, 920);
  }

  function playHaptic(kind, detail) {
    const received = kind === 'received';
    const pattern = received
      ? [70, 35, 105, 45, 190]
      : [105, 45, 165];

    let usedVibrationApi = false;
    try {
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(0);
        usedVibrationApi = navigator.vibrate(pattern) !== false;
      }
    } catch {
      usedVibrationApi = false;
    }

    if (!usedVibrationApi) {
      triggerSafariHaptics(received ? [0, 90, 205, 345] : [0, 145, 310]);
    }

    playSuccessChime(kind);
    triggerVisualConfirmation(kind, detail);
  }

  function readStatus() {
    if (!transferStatus.classList.contains('success')) {
      lastSuccessSignature = '';
      return;
    }

    const title = transferStatus.querySelector('strong')?.textContent?.trim() || '';
    const detail = transferStatus.querySelector('p')?.textContent?.trim() || '';
    const signature = `${title}|${detail}`;
    if (!signature || signature === lastSuccessSignature) return;

    lastSuccessSignature = signature;
    const kind = title.includes('傳入你的手中') || title.includes('接收') ? 'received' : 'sent';
    playHaptic(kind, detail);
  }

  new MutationObserver(readStatus).observe(transferStatus, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
    characterData: true
  });

  readStatus();
})();
