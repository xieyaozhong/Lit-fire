'use strict';

(() => {
  if (window.__darkTriggerHardeningLoaded) return;
  window.__darkTriggerHardeningLoaded = true;

  const priorSetTimeout = window.setTimeout.bind(window);
  const button = document.getElementById('ignitionButton');
  const resetButton = document.getElementById('resetFlameButton');

  let tapTimes = [];

  function resetSequence() {
    tapTimes = [];
  }

  function recordTap(event) {
    if (!button || !button.contains(event.target)) return;
    if (button.classList.contains('lit')) return;

    const now = performance.now();
    const previous = tapTimes.at(-1);
    if (!previous || now - previous > 1600) tapTimes = [now];
    else tapTimes.push(now);

    if (tapTimes.length > 3) tapTimes.shift();
  }

  function qualifiesForDark() {
    if (tapTimes.length !== 2) return false;
    const gap = tapTimes[1] - tapTimes[0];
    return gap >= 340 && gap <= 460;
  }

  document.addEventListener('pointerdown', recordTap, true);
  resetButton?.addEventListener('click', resetSequence, true);

  window.setTimeout = (callback, delay = 0, ...args) => {
    if (Number(delay) === 560) {
      if (!qualifiesForDark()) {
        return priorSetTimeout(() => {}, 1080);
      }

      return priorSetTimeout(() => {
        if (qualifiesForDark()) callback(...args);
        resetSequence();
      }, 1080);
    }

    return priorSetTimeout(callback, delay, ...args);
  };
})();
