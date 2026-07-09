'use strict';

(() => {
  if (window.__ignitionTouchGuardLoaded) return;
  window.__ignitionTouchGuardLoaded = true;

  const stage = document.getElementById('ignitionStage');
  const button = document.getElementById('ignitionButton');
  const ignitionText = document.getElementById('ignitionText');

  if (!stage || !button) return;

  const style = document.createElement('style');
  style.textContent = `
    #ignitionStage,
    #ignitionStage *,
    #ignitionButton,
    #ignitionButton * {
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    #ignitionButton {
      touch-action: none !important;
      -webkit-user-drag: none !important;
    }
  `;
  document.head.appendChild(style);

  button.setAttribute('draggable', 'false');
  ignitionText?.setAttribute('draggable', 'false');

  function isInsideIgnition(target) {
    return target instanceof Node && stage.contains(target);
  }

  function blockNativeAction(event) {
    if (!isInsideIgnition(event.target)) return;
    event.preventDefault();
  }

  function clearSelection(event) {
    if (!isInsideIgnition(event.target)) return;
    const selection = window.getSelection?.();
    if (selection && selection.rangeCount) selection.removeAllRanges();
  }

  document.addEventListener('selectstart', blockNativeAction, true);
  document.addEventListener('dragstart', blockNativeAction, true);
  document.addEventListener('contextmenu', blockNativeAction, true);
  document.addEventListener('copy', blockNativeAction, true);
  document.addEventListener('pointerdown', clearSelection, true);
  document.addEventListener('touchstart', clearSelection, { capture: true, passive: true });
})();
