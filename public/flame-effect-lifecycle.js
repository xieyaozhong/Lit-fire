'use strict';

(() => {
  if (window.__flameEffectLifecycleLoaded) return;
  window.__flameEffectLifecycleLoaded = true;

  const originalFetch = window.fetch.bind(window);
  const button = document.getElementById('ignitionButton');
  const card = document.getElementById('flameCard');
  const resetButton = document.getElementById('resetFlameButton');
  const leaveButton = document.getElementById('leaveRoomButton');
  const nameNode = document.getElementById('flameName');
  const descriptionNode = document.getElementById('flameDescription');
  const sigilNode = document.getElementById('flameSigil');
  const ripples = document.getElementById('tapRipples');

  if (!button || !card) return;

  const META = {
    ember: { name: '恆星火', sigil: '☀' },
    azure: { name: '疾風火', sigil: '↯' },
    dream: { name: '夢燼', sigil: '☾' },
    forest: { name: '森靈火', sigil: '✤' },
    spark: { name: '星火', sigil: '✦' },
    rainbow: { name: '虹焰', sigil: '◉' },
    frost: { name: '霜晶火', sigil: '❄' },
    thunder: { name: '雷脈火', sigil: 'ϟ' },
    tide: { name: '潮汐火', sigil: '≋' },
    heart: { name: '心願火', sigil: '♡' },
    dark: { name: '黯火', sigil: '◈' },
    'blue-party': { name: '歸藍趴火', sigil: '♬' },
    dawn: { name: '破曉火', sigil: '☼' },
    echo: { name: '回聲火', sigil: '◎' },
    'pure-spark': { name: '純正星火', sigil: '✧' }
  };

  const EFFECT_CLASSES = [
    'thunder-active',
    'dawn-active',
    'blue-party-active',
    'pure-spark-active',
    'dark-active',
    'effect-active',
    'effect-entering',
    'effect-leaving'
  ];

  let epoch = 0;
  let activeFlame = null;
  let activeType = '';
  let protectActiveUntil = 0;
  let suppressIncomingUntil = 0;
  let enforcing = false;
  let enforceQueued = false;

  const style = document.createElement('style');
  style.textContent = `
    html.flame-effects-resetting #ignitionButton,
    html.flame-effects-resetting #ignitionButton *,
    html.flame-effects-resetting #flameCard,
    html.flame-effects-resetting #flameCard * {
      animation: none !important;
      transition: none !important;
    }

    #ignitionButton:not([data-flame-type="thunder"]) .thunder-strike-layer,
    #ignitionButton:not([data-flame-type="dawn"]) .dawn-horizon-glow,
    #ignitionButton:not([data-flame-type="dawn"]) .dawn-sun-disc {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);

  function clearCanvas(canvas) {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }

  function restartAnimationTree() {
    document.documentElement.classList.add('flame-effects-resetting');
    requestAnimationFrame(() => {
      void button.offsetWidth;
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('flame-effects-resetting');
      });
    });
  }

  function clearTransientStyles() {
    const nodes = [
      button,
      card,
      button.querySelector('.ignition-ring'),
      button.querySelector('.ignition-core'),
      button.querySelector('#persistentFlameCanvas'),
      ...button.querySelectorAll('.thunder-strike-layer, .thunder-bolt, .thunder-arc, .thunder-impact-core, .thunder-impact-wave, .dawn-horizon-glow, .dawn-sun-disc')
    ].filter(Boolean);

    nodes.forEach((node) => {
      ['animation', 'animation-name', 'filter', 'opacity', 'transform', 'visibility'].forEach((property) => {
        node.style.removeProperty(property);
      });
      EFFECT_CLASSES.forEach((className) => node.classList.remove(className));
    });
  }

  function clearEffectSurface({ clearFlameCanvas = true } = {}) {
    enforcing = true;
    button.removeAttribute('data-flame-type');
    card.removeAttribute('data-flame-type');
    button.removeAttribute('data-effect-type');
    card.removeAttribute('data-effect-type');
    button.removeAttribute('data-effect-epoch');
    card.removeAttribute('data-effect-epoch');

    EFFECT_CLASSES.forEach((className) => {
      button.classList.remove(className);
      card.classList.remove(className);
    });

    button.style.removeProperty('--flame-primary');
    button.style.removeProperty('--flame-secondary');
    card.style.removeProperty('--flame-primary');
    card.style.removeProperty('--flame-secondary');

    clearTransientStyles();
    if (clearFlameCanvas) {
      clearCanvas(document.getElementById('persistentFlameCanvas'));
      clearCanvas(document.getElementById('flameCanvas'));
    }
    if (ripples) ripples.innerHTML = '';
    enforcing = false;
    restartAnimationTree();
  }

  function setColors(flame) {
    const colors = Array.isArray(flame?.colors) ? flame.colors : [];
    if (!colors.length) return;
    const primary = colors[1] || colors[0];
    const secondary = colors[2] || colors[1] || colors[0];
    button.style.setProperty('--flame-primary', primary);
    button.style.setProperty('--flame-secondary', secondary);
    card.style.setProperty('--flame-primary', primary);
    card.style.setProperty('--flame-secondary', secondary);
  }

  function enforceActiveFlame() {
    if (enforcing) return;
    enforcing = true;

    if (!activeType || !activeFlame) {
      if (button.dataset.flameType || card.dataset.flameType) {
        button.removeAttribute('data-flame-type');
        card.removeAttribute('data-flame-type');
      }
      button.removeAttribute('data-effect-type');
      card.removeAttribute('data-effect-type');
      enforcing = false;
      return;
    }

    const meta = META[activeType] || {};
    button.dataset.flameType = activeType;
    card.dataset.flameType = activeType;
    button.dataset.effectType = activeType;
    card.dataset.effectType = activeType;
    button.dataset.effectEpoch = String(epoch);
    card.dataset.effectEpoch = String(epoch);
    setColors(activeFlame);

    if (nameNode) nameNode.textContent = activeFlame.name || meta.name || nameNode.textContent;
    if (descriptionNode && activeFlame.description) descriptionNode.textContent = activeFlame.description;
    if (sigilNode && meta.sigil) sigilNode.textContent = meta.sigil;

    enforcing = false;
  }

  function queueEnforce() {
    if (enforceQueued) return;
    enforceQueued = true;
    queueMicrotask(() => {
      enforceQueued = false;
      enforceActiveFlame();
    });
  }

  function activate(flame, { restart = false } = {}) {
    if (!flame || typeof flame !== 'object' || !flame.type) return;
    const changed = activeType !== flame.type || activeFlame?.id !== flame.id;
    if (changed || restart) clearEffectSurface({ clearFlameCanvas: false });
    activeFlame = { ...flame };
    activeType = flame.type;
    protectActiveUntil = Date.now() + 3200;
    enforceActiveFlame();
  }

  function deactivate({ protectFromStale = true } = {}) {
    epoch += 1;
    activeFlame = null;
    activeType = '';
    protectActiveUntil = 0;
    suppressIncomingUntil = protectFromStale ? Date.now() + 3200 : 0;
    clearEffectSurface();
  }

  function currentFlameFromPayload(payload) {
    if (payload?.state?.current) return payload.state.current.flame || null;
    if (payload?.current) return payload.current.flame || null;
    return undefined;
  }

  function hasCurrentState(payload) {
    return Boolean(payload?.state?.current || payload?.current);
  }

  function applyResponseState(payload, requestEpoch) {
    if (!hasCurrentState(payload)) return;
    const flame = currentFlameFromPayload(payload);

    if (flame) {
      if (Date.now() < suppressIncomingUntil && requestEpoch !== epoch) return;
      suppressIncomingUntil = 0;
      activate(flame);
      return;
    }

    if (activeFlame && Date.now() < protectActiveUntil) return;
    if (requestEpoch !== epoch && activeFlame) return;
    deactivate({ protectFromStale: false });
  }

  resetButton?.addEventListener('click', () => deactivate(), true);
  leaveButton?.addEventListener('click', () => deactivate({ protectFromStale: false }), true);

  const observer = new MutationObserver(() => {
    if (enforcing) return;
    if (!button.classList.contains('lit') && activeType) {
      activeFlame = null;
      activeType = '';
      clearEffectSurface();
      return;
    }
    queueEnforce();
  });

  observer.observe(button, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-flame-type', 'data-effect-type'],
    subtree: true,
    childList: true
  });
  observer.observe(card, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-flame-type', 'data-effect-type'],
    subtree: true,
    childList: true
  });
  if (nameNode) observer.observe(nameNode, { childList: true, subtree: true, characterData: true });
  if (descriptionNode) observer.observe(descriptionNode, { childList: true, subtree: true, characterData: true });
  if (sigilNode) observer.observe(sigilNode, { childList: true, subtree: true, characterData: true });

  window.fetch = async (input, init = {}) => {
    let requestEpoch = epoch;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        requestEpoch = ++epoch;
        if (body.flame && typeof body.flame === 'object') {
          suppressIncomingUntil = 0;
          activate(body.flame, { restart: true });
        } else if (body.flame === null) {
          deactivate();
          requestEpoch = epoch;
        }
      } catch {
        // Leave unrelated requests untouched.
      }
    }

    const response = await originalFetch(input, init);
    response.clone().json().then((payload) => applyResponseState(payload, requestEpoch)).catch(() => {});
    return response;
  };

  window.__flameEffectLifecycle = {
    clear: () => deactivate({ protectFromStale: false }),
    activate: (flame) => activate(flame, { restart: true }),
    get activeType() {
      return activeType;
    }
  };
})();
