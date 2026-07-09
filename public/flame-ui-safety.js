'use strict';

(() => {
  if (window.__flameUiSafetyLoaded) return;
  window.__flameUiSafetyLoaded = true;

  const button = document.getElementById('ignitionButton');
  const card = document.getElementById('flameCard');
  const resetButton = document.getElementById('resetFlameButton');
  const leaveButton = document.getElementById('leaveRoomButton');
  const badge = () => document.getElementById('flameRarityBadge');

  if (!button || !card) return;

  const transientClasses = [
    'thunder-active',
    'dawn-active',
    'blue-party-active',
    'pure-spark-active',
    'dark-active',
    'effect-active',
    'effect-entering',
    'effect-leaving'
  ];

  function clearCanvas(id) {
    const canvas = document.getElementById(id);
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }

  function clearSpecialEffects() {
    button.removeAttribute('data-flame-type');
    card.removeAttribute('data-flame-type');
    button.removeAttribute('data-effect-type');
    card.removeAttribute('data-effect-type');
    button.removeAttribute('data-effect-epoch');
    card.removeAttribute('data-effect-epoch');

    transientClasses.forEach((className) => {
      button.classList.remove(className);
      card.classList.remove(className);
    });

    button.style.removeProperty('--flame-primary');
    button.style.removeProperty('--flame-secondary');
    card.style.removeProperty('--flame-primary');
    card.style.removeProperty('--flame-secondary');

    const effectNodes = button.querySelectorAll(
      '.thunder-strike-layer, .thunder-bolt, .thunder-arc, .thunder-impact-core, .thunder-impact-wave, .dawn-horizon-glow, .dawn-sun-disc'
    );
    effectNodes.forEach((node) => {
      node.style.removeProperty('animation');
      node.style.removeProperty('animation-name');
      node.style.removeProperty('filter');
      node.style.removeProperty('opacity');
      node.style.removeProperty('transform');
      node.style.removeProperty('visibility');
    });

    clearCanvas('persistentFlameCanvas');
    clearCanvas('flameCanvas');

    const rarityBadge = badge();
    if (rarityBadge) {
      rarityBadge.hidden = true;
      rarityBadge.removeAttribute('data-rarity');
      rarityBadge.textContent = '';
    }
  }

  function clearWhenExtinguished() {
    requestAnimationFrame(() => {
      if (!button.classList.contains('lit')) clearSpecialEffects();
    });
  }

  resetButton?.addEventListener('click', clearWhenExtinguished, false);
  leaveButton?.addEventListener('click', clearWhenExtinguished, false);

  new MutationObserver(() => {
    if (!button.classList.contains('lit')) clearSpecialEffects();
  }).observe(button, { attributes: true, attributeFilter: ['class'] });
})();
