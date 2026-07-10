'use strict';

(() => {
  if (window.__flameVariantDisplayGuardLoaded) return;
  window.__flameVariantDisplayGuardLoaded = true;

  const button = document.getElementById('ignitionButton');
  const card = document.getElementById('flameCard');
  const nameNode = document.getElementById('flameName');
  if (!button || !card || !nameNode) return;

  const originalFetch = window.fetch.bind(window);
  let activeVariantName = '';
  let restoring = false;
  let restoreQueued = false;

  function isVariantName(value) {
    return String(value || '').includes('・');
  }

  function remember(value) {
    const name = String(value || '').trim();
    if (isVariantName(name)) activeVariantName = name;
  }

  function clear() {
    activeVariantName = '';
    restoreQueued = false;
  }

  function restore() {
    restoreQueued = false;
    if (restoring || !activeVariantName || !button.classList.contains('lit')) return;
    if (nameNode.textContent.trim() === activeVariantName) return;

    restoring = true;
    nameNode.textContent = activeVariantName;
    restoring = false;
  }

  function queueRestore() {
    if (restoreQueued || !activeVariantName) return;
    restoreQueued = true;
    queueMicrotask(restore);
  }

  new MutationObserver(() => {
    const current = nameNode.textContent.trim();
    if (isVariantName(current)) {
      remember(current);
      return;
    }
    queueRestore();
  }).observe(nameNode, {
    childList: true,
    subtree: true,
    characterData: true
  });

  new MutationObserver(() => {
    if (!button.classList.contains('lit')) {
      clear();
      return;
    }
    queueRestore();
  }).observe(button, {
    attributes: true,
    attributeFilter: ['class', 'data-flame-type', 'data-flame-variant']
  });

  new MutationObserver(queueRestore).observe(card, {
    attributes: true,
    attributeFilter: ['data-flame-type', 'data-flame-variant']
  });

  window.fetch = async (input, init = {}) => {
    const response = await originalFetch(input, init);
    response.clone().json().then((payload) => {
      const flame = payload?.state?.current?.flame || payload?.current?.flame || payload?.flame;
      if (!flame) return;
      remember(flame.displayName || flame.name);
      [0, 30, 120, 360].forEach((delay) => setTimeout(queueRestore, delay));
    }).catch(() => {});
    return response;
  };

  remember(nameNode.textContent);
})();
