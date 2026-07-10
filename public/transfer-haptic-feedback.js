'use strict';

(() => {
  if (window.__transferHapticFeedbackLoaded) return;
  window.__transferHapticFeedbackLoaded = true;

  const transferStatus = document.getElementById('transferStatus');
  const ignitionButton = document.getElementById('ignitionButton');
  if (!transferStatus) return;

  const style = document.createElement('style');
  style.textContent = `
    .transfer-status.haptic-confirm {
      animation: transfer-haptic-confirm .52s cubic-bezier(.2,.78,.25,1) both;
    }

    #ignitionButton.transfer-haptic-confirm {
      animation: transfer-flame-haptic-confirm .62s cubic-bezier(.16,.84,.25,1) both;
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
      0% { transform: scale(1); }
      28% { transform: scale(1.025); }
      52% { transform: scale(.992); }
      76% { transform: scale(1.012); }
      100% { transform: scale(1); }
    }

    @keyframes transfer-flame-haptic-confirm {
      0% { transform: scale(1); }
      25% { transform: scale(1.035); }
      48% { transform: scale(.985); }
      72% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .transfer-status.haptic-confirm,
      #ignitionButton.transfer-haptic-confirm {
        animation: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  const switchInput = document.createElement('input');
  switchInput.type = 'checkbox';
  switchInput.setAttribute('switch', '');
  switchInput.className = 'web-haptic-switch';
  switchInput.tabIndex = -1;
  switchInput.setAttribute('aria-hidden', 'true');
  document.body.appendChild(switchInput);

  let lastSuccessSignature = '';
  let visualTimer = 0;
  let switchTimers = [];

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

  function triggerVisualConfirmation() {
    window.clearTimeout(visualTimer);
    transferStatus.classList.remove('haptic-confirm');
    ignitionButton?.classList.remove('transfer-haptic-confirm');
    void transferStatus.offsetWidth;
    transferStatus.classList.add('haptic-confirm');
    ignitionButton?.classList.add('transfer-haptic-confirm');

    visualTimer = window.setTimeout(() => {
      transferStatus.classList.remove('haptic-confirm');
      ignitionButton?.classList.remove('transfer-haptic-confirm');
    }, 700);
  }

  function playHaptic(kind) {
    const received = kind === 'received';
    const pattern = received
      ? [32, 28, 58, 34, 112]
      : [58, 36, 96];

    let usedVibrationApi = false;
    try {
      if (typeof navigator.vibrate === 'function') {
        usedVibrationApi = navigator.vibrate(pattern) !== false;
      }
    } catch {
      usedVibrationApi = false;
    }

    if (!usedVibrationApi) {
      triggerSafariHaptics(received ? [0, 95, 205] : [0, 125]);
    }

    triggerVisualConfirmation();
  }

  function readStatus() {
    if (!transferStatus.classList.contains('success')) return;

    const title = transferStatus.querySelector('strong')?.textContent?.trim() || '';
    const detail = transferStatus.querySelector('p')?.textContent?.trim() || '';
    const signature = `${title}|${detail}`;
    if (!signature || signature === lastSuccessSignature) return;

    lastSuccessSignature = signature;
    const kind = title.includes('傳入你的手中') || title.includes('接收') ? 'received' : 'sent';
    playHaptic(kind);
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
