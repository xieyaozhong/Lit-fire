'use strict';

(() => {
  if (window.__darkTriggerHardeningLoaded) return;
  window.__darkTriggerHardeningLoaded = true;

  const priorSetTimeout = window.setTimeout.bind(window);
  const button = document.getElementById('ignitionButton');
  const resetButton = document.getElementById('resetFlameButton');

  const HOLD_MS = 5000;
  const MIN_GAP_MS = 340;
  const MAX_GAP_MS = 460;

  let tapTimes = [];
  let secondPointerId = null;
  let secondDownAt = 0;
  let secondHolding = false;
  let holdCompleted = false;

  function clearHold() {
    secondPointerId = null;
    secondDownAt = 0;
    secondHolding = false;
    holdCompleted = false;
  }

  function resetSequence() {
    tapTimes = [];
    clearHold();
  }

  function hasValidDoubleTap() {
    if (tapTimes.length !== 2) return false;
    const gap = tapTimes[1] - tapTimes[0];
    return gap >= MIN_GAP_MS && gap <= MAX_GAP_MS;
  }

  function recordTap(event) {
    if (!button || !button.contains(event.target)) return;
    if (button.classList.contains('lit')) return;

    const now = performance.now();
    const previous = tapTimes.at(-1);

    if (!previous || now - previous > 1600) {
      tapTimes = [now];
      clearHold();
      return;
    }

    tapTimes.push(now);

    if (tapTimes.length === 2 && hasValidDoubleTap()) {
      secondPointerId = event.pointerId;
      secondDownAt = now;
      secondHolding = true;
      holdCompleted = false;
      return;
    }

    if (tapTimes.length >= 3) {
      clearHold();
      if (tapTimes.length > 3) tapTimes.shift();
    }
  }

  function releaseSecondTap(event) {
    if (secondPointerId === null || event.pointerId !== secondPointerId) return;

    const heldFor = performance.now() - secondDownAt;
    holdCompleted = secondHolding && heldFor >= HOLD_MS;
    secondHolding = false;
    secondPointerId = null;

    if (!holdCompleted) {
      secondDownAt = 0;
    }
  }

  function cancelSecondTap(event) {
    if (secondPointerId === null) return;
    if (event?.pointerId !== undefined && event.pointerId !== secondPointerId) return;
    clearHold();
  }

  function qualifiesForDark() {
    if (!hasValidDoubleTap() || !secondDownAt) return false;
    const heldFor = performance.now() - secondDownAt;
    return heldFor >= HOLD_MS && (secondHolding || holdCompleted);
  }

  document.addEventListener('pointerdown', recordTap, true);
  document.addEventListener('pointerup', releaseSecondTap, true);
  document.addEventListener('pointercancel', cancelSecondTap, true);
  button?.addEventListener('pointerleave', cancelSecondTap, true);
  button?.addEventListener('lostpointercapture', cancelSecondTap, true);
  button?.addEventListener('contextmenu', (event) => {
    if (secondHolding) event.preventDefault();
  });
  resetButton?.addEventListener('click', resetSequence, true);
  window.addEventListener('blur', () => cancelSecondTap());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelSecondTap();
  });

  window.setTimeout = (callback, delay = 0, ...args) => {
    if (Number(delay) === 560) {
      if (!hasValidDoubleTap() || !secondHolding) {
        return priorSetTimeout(() => {}, HOLD_MS);
      }

      const remaining = Math.max(0, HOLD_MS - (performance.now() - secondDownAt));
      return priorSetTimeout(() => {
        if (qualifiesForDark()) callback(...args);
        resetSequence();
      }, remaining);
    }

    return priorSetTimeout(callback, delay, ...args);
  };
})();
