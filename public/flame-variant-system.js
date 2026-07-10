'use strict';

(() => {
  if (window.__flameVariantSystemLoaded) return;
  window.__flameVariantSystemLoaded = true;

  const originalFetch = window.fetch.bind(window);
  const button = document.getElementById('ignitionButton');
  const card = document.getElementById('flameCard');
  const nameNode = document.getElementById('flameName');
  const descriptionNode = document.getElementById('flameDescription');
  const sigilNode = document.getElementById('flameSigil');
  const badge = document.getElementById('flameRarityBadge');

  if (!button || !card) return;

  const VARIANTS = {
    ember: [
      { id: 'ember-corona', label: '日冕', chance: .22, style: 'a', glow: '255,215,112', hue: 5, speed: 3.1, ringSpeed: 3.35, flashSpeed: 2.42, scale: 1.035, brightness: 1.18, saturate: 1.08 },
      { id: 'ember-amber', label: '琥珀', chance: .11, style: 'b', glow: '255,145,72', hue: -9, speed: 2.45, ringSpeed: 2.65, flashSpeed: 1.76, scale: 1.055, brightness: 1.22, saturate: 1.18 }
    ],
    azure: [
      { id: 'azure-gale', label: '疾電', chance: .22, style: 'a', glow: '112,231,255', hue: -10, speed: 2.35, ringSpeed: 2.54, flashSpeed: 1.83, scale: 1.045, brightness: 1.2, saturate: 1.18 },
      { id: 'azure-comet', label: '流光', chance: .11, style: 'b', glow: '112,162,255', hue: 12, speed: 2.75, ringSpeed: 2.97, flashSpeed: 1.98, scale: 1.025, brightness: 1.16, saturate: 1.12 }
    ],
    dream: [
      { id: 'dream-moonveil', label: '月幕', chance: .22, style: 'a', glow: '255,170,226', hue: 8, speed: 3.7, ringSpeed: 4, flashSpeed: 2.89, scale: 1.025, brightness: 1.14, saturate: 1.1 },
      { id: 'dream-stardust', label: '星塵', chance: .11, style: 'b', glow: '188,140,255', hue: -7, speed: 3.05, ringSpeed: 3.3, flashSpeed: 2.2, scale: 1.04, brightness: 1.18, saturate: 1.2 }
    ],
    forest: [
      { id: 'forest-moss', label: '苔靈', chance: .22, style: 'a', glow: '142,255,145', hue: -7, speed: 3.25, ringSpeed: 3.51, flashSpeed: 2.54, scale: 1.025, brightness: 1.14, saturate: 1.1 },
      { id: 'forest-sprout', label: '新芽', chance: .11, style: 'b', glow: '105,255,194', hue: 11, speed: 2.65, ringSpeed: 2.86, flashSpeed: 1.91, scale: 1.05, brightness: 1.19, saturate: 1.18 }
    ],
    spark: [
      { id: 'spark-drift', label: '飛絮', chance: .22, style: 'a', glow: '255,218,122', hue: 4, speed: 3.05, ringSpeed: 3.3, flashSpeed: 2.38, scale: 1.025, brightness: 1.17, saturate: 1.08 },
      { id: 'spark-flare', label: '爆芒', chance: .11, style: 'b', glow: '255,165,76', hue: -6, speed: 2.15, ringSpeed: 2.32, flashSpeed: 1.55, scale: 1.065, brightness: 1.25, saturate: 1.16 }
    ],
    rainbow: [
      { id: 'rainbow-prism', label: '稜鏡', chance: .2, style: 'a', glow: '255,225,128', hue: 16, speed: 2.8, ringSpeed: 3.02, flashSpeed: 2.18, scale: 1.045, brightness: 1.18, saturate: 1.22 },
      { id: 'rainbow-aurora', label: '極光', chance: .1, style: 'b', glow: '112,255,208', hue: -18, speed: 3.25, ringSpeed: 3.51, flashSpeed: 2.34, scale: 1.025, brightness: 1.16, saturate: 1.28 }
    ],
    frost: [
      { id: 'frost-glacier', label: '冰河', chance: .2, style: 'a', glow: '175,239,255', hue: -8, speed: 3.45, ringSpeed: 3.73, flashSpeed: 2.69, scale: 1.02, brightness: 1.16, saturate: 1.06 },
      { id: 'frost-snowglint', label: '雪耀', chance: .1, style: 'b', glow: '238,252,255', hue: 7, speed: 2.6, ringSpeed: 2.81, flashSpeed: 1.87, scale: 1.055, brightness: 1.25, saturate: 1.02 }
    ],
    thunder: [
      { id: 'thunder-storm', label: '暴雷', chance: .2, style: 'a', glow: '255,229,103', hue: -4, speed: 1.95, ringSpeed: 2.11, flashSpeed: 1.52, scale: 1.065, brightness: 1.28, saturate: 1.18 },
      { id: 'thunder-skybreak', label: '裂空', chance: .1, style: 'b', glow: '180,132,255', hue: 10, speed: 2.35, ringSpeed: 2.54, flashSpeed: 1.69, scale: 1.04, brightness: 1.22, saturate: 1.24 }
    ],
    tide: [
      { id: 'tide-seafoam', label: '浪沫', chance: .2, style: 'a', glow: '130,255,231', hue: -10, speed: 3.15, ringSpeed: 3.4, flashSpeed: 2.46, scale: 1.03, brightness: 1.15, saturate: 1.13 },
      { id: 'tide-deepsea', label: '深藍', chance: .1, style: 'b', glow: '88,173,255', hue: 13, speed: 3.55, ringSpeed: 3.83, flashSpeed: 2.56, scale: .99, brightness: 1.11, saturate: 1.22 }
    ],
    heart: [
      { id: 'heart-blush', label: '微醺', chance: .18, style: 'a', glow: '255,175,207', hue: -4, speed: 3.05, ringSpeed: 3.3, flashSpeed: 2.38, scale: 1.025, brightness: 1.18, saturate: 1.12 },
      { id: 'heart-vow', label: '誓約', chance: .09, style: 'b', glow: '255,130,181', hue: 8, speed: 2.4, ringSpeed: 2.59, flashSpeed: 1.73, scale: 1.06, brightness: 1.23, saturate: 1.2 }
    ],
    echo: [
      { id: 'echo-resonance', label: '共鳴', chance: .18, style: 'a', glow: '177,202,255', hue: -8, speed: 3.2, ringSpeed: 3.46, flashSpeed: 2.5, scale: 1.03, brightness: 1.16, saturate: 1.1 },
      { id: 'echo-afterglow', label: '餘音', chance: .09, style: 'b', glow: '150,140,255', hue: 9, speed: 3.7, ringSpeed: 4, flashSpeed: 2.66, scale: .99, brightness: 1.12, saturate: 1.2 }
    ],
    'blue-party': [
      { id: 'blue-party-strobe', label: '炫閃', chance: .18, style: 'a', glow: '110,218,255', hue: -10, speed: 1.65, ringSpeed: 1.78, flashSpeed: 1.29, scale: 1.075, brightness: 1.3, saturate: 1.28 },
      { id: 'blue-party-neon', label: '霓虹', chance: .09, style: 'b', glow: '82,150,255', hue: 13, speed: 2.05, ringSpeed: 2.21, flashSpeed: 1.48, scale: 1.045, brightness: 1.22, saturate: 1.32 }
    ],
    dawn: [
      { id: 'dawn-sunrise', label: '晨金', chance: .18, style: 'a', glow: '255,220,136', hue: -4, speed: 3.45, ringSpeed: 3.73, flashSpeed: 2.69, scale: 1.03, brightness: 1.18, saturate: 1.1 },
      { id: 'dawn-rosy', label: '曦紅', chance: .09, style: 'b', glow: '255,158,112', hue: 9, speed: 2.85, ringSpeed: 3.08, flashSpeed: 2.05, scale: 1.045, brightness: 1.22, saturate: 1.2 }
    ],
    dark: [
      { id: 'dark-abyss', label: '深淵', chance: .16, style: 'a', glow: '116,91,176', hue: -7, speed: 3.8, ringSpeed: 4.1, flashSpeed: 2.96, scale: .975, brightness: 1.07, saturate: 1.12 },
      { id: 'dark-eclipse', label: '蝕影', chance: .08, style: 'b', glow: '162,146,218', hue: 9, speed: 4.1, ringSpeed: 4.43, flashSpeed: 2.95, scale: 1.025, brightness: 1.11, saturate: 1.06 }
    ],
    'pure-spark': [
      { id: 'pure-spark-sacred', label: '聖輝', chance: .15, style: 'a', glow: '255,244,187', hue: -2, speed: 2.25, ringSpeed: 2.43, flashSpeed: 1.76, scale: 1.065, brightness: 1.3, saturate: 1.08 },
      { id: 'pure-spark-nova', label: '星核', chance: .07, style: 'b', glow: '255,216,118', hue: 8, speed: 1.85, ringSpeed: 2, flashSpeed: 1.33, scale: 1.085, brightness: 1.38, saturate: 1.18 }
    ]
  };

  const style = document.createElement('style');
  style.textContent = `
    .flame-variant-overlay{position:absolute;inset:-18%;z-index:3;pointer-events:none;opacity:0;visibility:hidden;transition:opacity .28s ease;mix-blend-mode:screen}
    #ignitionButton[data-flame-variant] .flame-variant-overlay{opacity:1;visibility:visible}
    .flame-variant-overlay::before,.flame-variant-overlay::after{content:'';position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}
    .flame-variant-overlay::before{width:72%;aspect-ratio:1;border:1px solid rgba(var(--variant-glow),.42);box-shadow:0 0 12px rgba(var(--variant-glow),.3),0 0 30px rgba(var(--variant-glow),.15);animation:variant-orbit var(--variant-ring-speed) linear infinite}
    .flame-variant-overlay::after{width:44%;aspect-ratio:1;background:radial-gradient(circle,rgba(var(--variant-glow),.28),rgba(var(--variant-glow),0) 68%);animation:variant-breathe var(--variant-flash-speed) ease-in-out infinite}
    #ignitionButton[data-flame-variant] #persistentFlameCanvas{filter:hue-rotate(var(--variant-hue)) saturate(var(--variant-saturate)) brightness(var(--variant-brightness)) drop-shadow(0 0 10px rgba(var(--variant-glow),.34)) drop-shadow(0 0 22px rgba(var(--variant-glow),.19))}
    #ignitionButton[data-flame-variant] .ignition-core{box-shadow:0 0 18px rgba(var(--variant-glow),.34),0 0 38px rgba(var(--variant-glow),.17)!important;animation-duration:var(--variant-speed)!important}
    #ignitionButton[data-flame-variant] .ignition-ring{box-shadow:0 0 11px rgba(var(--variant-glow),.38),0 0 30px rgba(var(--variant-glow),.17)!important;animation-duration:var(--variant-ring-speed)!important}
    #ignitionButton[data-flame-variant-style="a"] .flame-variant-overlay::before{border-style:dashed;animation-direction:normal}
    #ignitionButton[data-flame-variant-style="b"] .flame-variant-overlay::before{width:82%;border-width:2px;animation-direction:reverse}
    #ignitionButton[data-flame-variant-style="b"] .flame-variant-overlay::after{width:54%;animation-name:variant-flash}
    #flameCard[data-flame-variant]{border-color:rgba(var(--variant-glow),.28)!important;box-shadow:0 0 0 1px rgba(var(--variant-glow),.07),0 0 25px rgba(var(--variant-glow),.1),inset 0 0 20px rgba(var(--variant-glow),.04)!important}
    #flameCard[data-flame-variant] #flameSigil{text-shadow:0 0 7px rgba(var(--variant-glow),.58),0 0 19px rgba(var(--variant-glow),.3)}
    @keyframes variant-orbit{from{transform:translate(-50%,-50%) rotate(0deg) scale(var(--variant-scale))}to{transform:translate(-50%,-50%) rotate(360deg) scale(var(--variant-scale))}}
    @keyframes variant-breathe{0%,100%{opacity:.38;transform:translate(-50%,-50%) scale(.88)}50%{opacity:.92;transform:translate(-50%,-50%) scale(1.13)}}
    @keyframes variant-flash{0%,100%{opacity:.24;transform:translate(-50%,-50%) scale(.86)}45%{opacity:.85;transform:translate(-50%,-50%) scale(1.08)}55%{opacity:.38;transform:translate(-50%,-50%) scale(.96)}70%{opacity:1;transform:translate(-50%,-50%) scale(1.16)}}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('span');
  overlay.className = 'flame-variant-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  button.appendChild(overlay);

  function pickVariant(type) {
    const choices = VARIANTS[type];
    if (!choices?.length) return null;
    const roll = Math.random();
    let cursor = 0;
    for (const choice of choices) {
      cursor += choice.chance;
      if (roll <= cursor) return choice;
    }
    return null;
  }

  function findVariant(flame) {
    const choices = VARIANTS[flame?.type];
    if (!choices?.length) return null;
    if (flame.variantId) {
      const direct = choices.find((choice) => choice.id === flame.variantId);
      if (direct) return direct;
    }
    const savedName = String(flame?.displayName || flame?.name || '');
    return choices.find((choice) => savedName.endsWith(`・${choice.label}`)) || null;
  }

  function withVariantMetadata(flame, variant) {
    const currentName = String(flame.name || '無名之火');
    const baseName = currentName.includes('・') ? currentName.split('・')[0] : currentName;
    const displayName = `${baseName}・${variant.label}`;
    return {
      ...flame,
      name: displayName,
      baseType: flame.type,
      variantResolved: true,
      variantVersion: 2,
      variantId: variant.id,
      variantLabel: variant.label,
      variantStyle: variant.style,
      displayName,
      variantFx: {
        glow: variant.glow,
        hue: `${variant.hue}deg`,
        speed: `${variant.speed}s`,
        ringSpeed: `${variant.ringSpeed}s`,
        flashSpeed: `${variant.flashSpeed}s`,
        scale: variant.scale,
        brightness: variant.brightness,
        saturate: variant.saturate
      }
    };
  }

  function decorateFlame(flame) {
    if (!flame?.type) return flame;
    const existing = findVariant(flame);
    if (existing) return withVariantMetadata(flame, existing);
    if (flame.variantResolved) return flame;

    const variant = pickVariant(flame.type);
    if (!variant) {
      return {
        ...flame,
        baseType: flame.type,
        variantResolved: true,
        variantVersion: 2,
        variantId: null,
        variantLabel: '',
        displayName: flame.name
      };
    }
    return withVariantMetadata(flame, variant);
  }

  function hydrateFlame(flame) {
    if (!flame?.type) return flame;
    const variant = findVariant(flame);
    return variant ? withVariantMetadata(flame, variant) : flame;
  }

  function clearVariantUi() {
    button.removeAttribute('data-flame-variant');
    button.removeAttribute('data-flame-variant-style');
    card.removeAttribute('data-flame-variant');
    card.removeAttribute('data-flame-variant-style');
    ['--variant-glow','--variant-hue','--variant-speed','--variant-ring-speed','--variant-flash-speed','--variant-scale','--variant-brightness','--variant-saturate'].forEach((property) => button.style.removeProperty(property));
    card.style.removeProperty('--variant-glow');
  }

  function applyVariantUi(rawFlame) {
    const flame = hydrateFlame(rawFlame);
    if (!flame) return;
    if (nameNode) nameNode.textContent = flame.displayName || flame.name || nameNode.textContent;
    if (descriptionNode && flame.description) descriptionNode.textContent = flame.description;
    if (sigilNode && flame.sigil) sigilNode.textContent = flame.sigil;

    if (!flame.variantId) {
      clearVariantUi();
      return;
    }

    const fx = flame.variantFx || {};
    button.dataset.flameVariant = flame.variantId;
    button.dataset.flameVariantStyle = flame.variantStyle || 'a';
    card.dataset.flameVariant = flame.variantId;
    card.dataset.flameVariantStyle = flame.variantStyle || 'a';

    button.style.setProperty('--variant-glow', fx.glow || '255,200,120');
    button.style.setProperty('--variant-hue', fx.hue || '0deg');
    button.style.setProperty('--variant-speed', fx.speed || '3s');
    button.style.setProperty('--variant-ring-speed', fx.ringSpeed || fx.speed || '3s');
    button.style.setProperty('--variant-flash-speed', fx.flashSpeed || fx.speed || '2.4s');
    button.style.setProperty('--variant-scale', String(fx.scale || 1));
    button.style.setProperty('--variant-brightness', String(fx.brightness || 1));
    button.style.setProperty('--variant-saturate', String(fx.saturate || 1));
    card.style.setProperty('--variant-glow', fx.glow || '255,200,120');

    if (badge && flame.rarity) {
      badge.hidden = false;
      badge.dataset.rarity = flame.rarity;
      badge.textContent = flame.rarityLabel || badge.textContent;
    }
  }

  function syncPayload(payload) {
    const flame = payload?.state?.current?.flame || payload?.current?.flame || payload?.flame;
    if (!flame) return;
    [20, 120, 360].forEach((delay) => setTimeout(() => applyVariantUi(flame), delay));
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    let nextInit = init;

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame && typeof body.flame === 'object') {
          body.flame = decorateFlame(body.flame);
          nextInit = { ...init, body: JSON.stringify(body) };
          [0, 90, 280].forEach((delay) => setTimeout(() => applyVariantUi(body.flame), delay));
        }
      } catch {
        // Leave unrelated requests untouched.
      }
    }

    const response = await originalFetch(input, nextInit);
    response.clone().json().then(syncPayload).catch(() => {});
    return response;
  };

  new MutationObserver(() => {
    if (!button.classList.contains('lit')) clearVariantUi();
  }).observe(button, { attributes: true, attributeFilter: ['class'] });
})();
