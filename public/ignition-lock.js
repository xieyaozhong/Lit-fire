'use strict';

(() => {
  const button = document.getElementById('ignitionButton');
  const text = document.getElementById('ignitionText');
  if (!button || !text) return;

  let restoreTimer = null;

  function syncLockState() {
    const locked = button.classList.contains('lit');
    button.classList.toggle('ignition-locked', locked);
    button.setAttribute('aria-disabled', locked ? 'true' : 'false');
    button.setAttribute('aria-label', locked ? '請先熄滅目前火種，才能再次點火' : '點擊點火');
  }

  function blockIgnition(event) {
    if (!button.classList.contains('lit')) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    navigator.vibrate?.([25, 35, 25]);

    clearTimeout(restoreTimer);
    text.textContent = '請先熄滅';
    button.classList.add('locked-hint');

    restoreTimer = setTimeout(() => {
      button.classList.remove('locked-hint');
      if (button.classList.contains('lit')) text.textContent = '燃燒中';
    }, 900);
  }

  button.addEventListener('pointerdown', blockIgnition, true);
  button.addEventListener('click', blockIgnition, true);

  new MutationObserver(syncLockState).observe(button, {
    attributes: true,
    attributeFilter: ['class']
  });

  const style = document.createElement('style');
  style.textContent = `
    .ignition-button.ignition-locked {
      cursor: not-allowed;
    }

    .ignition-button.ignition-locked .ignition-ring {
      animation-duration: 28s;
    }

    .ignition-button.ignition-locked.locked-hint .ignition-ring {
      animation: locked-pulse 420ms ease-out;
    }

    @keyframes locked-pulse {
      0% { transform: scale(1); filter: brightness(1); }
      45% { transform: scale(1.055); filter: brightness(1.5); }
      100% { transform: scale(1); filter: brightness(1); }
    }
  `;
  document.head.appendChild(style);

  syncLockState();
})();
