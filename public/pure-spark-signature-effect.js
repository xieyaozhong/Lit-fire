'use strict';

(() => {
  if (window.__pureSparkSignatureEffectLoaded) return;
  window.__pureSparkSignatureEffectLoaded = true;

  const button = document.getElementById('ignitionButton');
  const card = document.getElementById('flameCard');
  const sigil = document.getElementById('flameSigil');
  if (!button || !card) return;

  const style = document.createElement('style');
  style.textContent = `
    #ignitionButton {
      isolation: isolate;
    }

    .pure-spark-signature {
      position: absolute;
      inset: -34%;
      z-index: 4;
      display: block;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transform: scale(.86);
      transition: opacity .3s ease, transform .42s cubic-bezier(.2,.9,.2,1), visibility .3s;
      filter: drop-shadow(0 0 12px rgba(255,248,211,.55));
    }

    #ignitionButton[data-flame-type="pure-spark"] .pure-spark-signature {
      opacity: 1;
      visibility: visible;
      transform: scale(1);
    }

    .pure-spark-aura,
    .pure-spark-rays,
    .pure-spark-ring,
    .pure-spark-star,
    .pure-spark-orbit {
      position: absolute;
      left: 50%;
      top: 50%;
      pointer-events: none;
    }

    .pure-spark-aura {
      width: 78%;
      aspect-ratio: 1;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle,
        rgba(255,255,255,.82) 0%,
        rgba(255,249,212,.5) 17%,
        rgba(255,215,105,.23) 40%,
        rgba(255,175,55,.08) 61%,
        transparent 74%);
      mix-blend-mode: screen;
      animation: pure-spark-aura-pulse 2.6s ease-in-out infinite;
    }

    .pure-spark-rays {
      width: 112%;
      aspect-ratio: 1;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      opacity: .88;
      background:
        linear-gradient(90deg, transparent 3%, rgba(255,255,255,0) 37%, rgba(255,255,255,.94) 49.5%, rgba(255,255,255,.94) 50.5%, rgba(255,255,255,0) 63%, transparent 97%),
        linear-gradient(0deg, transparent 3%, rgba(255,244,191,0) 37%, rgba(255,247,207,.92) 49.5%, rgba(255,247,207,.92) 50.5%, rgba(255,244,191,0) 63%, transparent 97%),
        linear-gradient(45deg, transparent 18%, rgba(255,229,145,0) 43%, rgba(255,234,159,.52) 49.5%, rgba(255,234,159,.52) 50.5%, rgba(255,229,145,0) 57%, transparent 82%),
        linear-gradient(-45deg, transparent 18%, rgba(255,229,145,0) 43%, rgba(255,234,159,.52) 49.5%, rgba(255,234,159,.52) 50.5%, rgba(255,229,145,0) 57%, transparent 82%);
      mix-blend-mode: screen;
      animation: pure-spark-rays-breathe 2.2s ease-in-out infinite, pure-spark-rays-turn 13s linear infinite;
    }

    .pure-spark-ring {
      border-radius: 50%;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    }

    .pure-spark-ring.outer {
      width: 72%;
      aspect-ratio: 1;
      border: 1px solid rgba(255,235,164,.72);
      box-shadow:
        0 0 8px rgba(255,255,255,.68),
        0 0 24px rgba(255,214,94,.42),
        inset 0 0 17px rgba(255,244,196,.2);
      animation: pure-spark-ring-turn 7.5s linear infinite, pure-spark-ring-pulse 2.8s ease-in-out infinite;
    }

    .pure-spark-ring.outer::before,
    .pure-spark-ring.outer::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      background: #fff9d8;
      box-shadow: 0 0 7px #fff, 0 0 15px rgba(255,207,74,.9);
    }

    .pure-spark-ring.outer::before {
      width: 7px;
      height: 7px;
      left: 9%;
      top: 19%;
    }

    .pure-spark-ring.outer::after {
      width: 5px;
      height: 5px;
      right: 7%;
      bottom: 22%;
    }

    .pure-spark-ring.inner {
      width: 52%;
      aspect-ratio: 1;
      border: 1px dashed rgba(255,255,255,.68);
      box-shadow: 0 0 14px rgba(255,238,172,.32);
      animation: pure-spark-ring-turn-reverse 5.2s linear infinite;
    }

    .pure-spark-star {
      width: 13%;
      aspect-ratio: 1;
      transform: translate(-50%, -50%) rotate(45deg);
      border-radius: 28%;
      background: linear-gradient(135deg, #fff 0%, #fffbdc 34%, #ffd85f 72%, #ff9e31 100%);
      box-shadow:
        0 0 7px #fff,
        0 0 18px rgba(255,245,194,.95),
        0 0 34px rgba(255,200,72,.72),
        0 0 56px rgba(255,155,39,.34);
      animation: pure-spark-star-pulse 1.65s ease-in-out infinite;
    }

    .pure-spark-star::before,
    .pure-spark-star::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      border-radius: 999px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.96), transparent);
      mix-blend-mode: screen;
    }

    .pure-spark-star::before {
      width: 330%;
      height: 12%;
    }

    .pure-spark-star::after {
      width: 12%;
      height: 330%;
      background: linear-gradient(0deg, transparent, rgba(255,248,207,.96), transparent);
    }

    .pure-spark-orbit {
      width: 0;
      height: 0;
      transform: rotate(var(--orbit-angle));
      animation: pure-spark-orbit-turn var(--orbit-speed) linear infinite;
      animation-delay: var(--orbit-delay);
    }

    .pure-spark-mote {
      position: absolute;
      left: var(--orbit-radius);
      top: 0;
      width: var(--mote-size);
      height: var(--mote-size);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      background: #fff9d8;
      box-shadow: 0 0 5px #fff, 0 0 12px rgba(255,205,71,.9);
      animation: pure-spark-mote-pulse var(--mote-pulse) ease-in-out infinite alternate;
      animation-delay: var(--orbit-delay);
    }

    #ignitionButton[data-flame-type="pure-spark"] #persistentFlameCanvas,
    #ignitionButton[data-flame-type="pure-spark"] + * {
      filter: brightness(1.25) saturate(1.16) drop-shadow(0 0 12px rgba(255,236,155,.48));
    }

    #ignitionButton[data-flame-type="pure-spark"] .ignition-core {
      box-shadow:
        0 0 20px rgba(255,255,255,.5),
        0 0 44px rgba(255,221,113,.36),
        inset 0 0 26px rgba(255,250,216,.2) !important;
      animation: pure-spark-core-pulse 2.6s ease-in-out infinite !important;
    }

    #ignitionButton[data-flame-type="pure-spark"] .ignition-ring {
      border-color: rgba(255,242,187,.92) !important;
      box-shadow:
        0 0 12px rgba(255,255,255,.75),
        0 0 34px rgba(255,218,100,.56),
        0 0 68px rgba(255,163,46,.22),
        inset 0 0 28px rgba(255,248,207,.16) !important;
    }

    #flameCard[data-flame-type="pure-spark"] {
      border-color: rgba(255,225,132,.38) !important;
      box-shadow:
        0 0 0 1px rgba(255,248,211,.08),
        0 0 30px rgba(255,210,86,.17),
        inset 0 0 28px rgba(255,245,194,.06) !important;
    }

    #flameCard[data-flame-type="pure-spark"] #flameSigil {
      color: #fff7c7;
      text-shadow:
        0 0 6px #fff,
        0 0 16px rgba(255,231,145,.9),
        0 0 30px rgba(255,185,52,.58);
      animation: pure-spark-sigil-pulse 2s ease-in-out infinite;
    }

    .pure-spark-signature.is-entering {
      animation: pure-spark-entry-burst .85s cubic-bezier(.12,.8,.2,1) both;
    }

    @keyframes pure-spark-entry-burst {
      0% { opacity: 0; transform: scale(.25) rotate(-18deg); filter: brightness(3) blur(7px); }
      48% { opacity: 1; transform: scale(1.18) rotate(4deg); filter: brightness(2.2) blur(0); }
      100% { opacity: 1; transform: scale(1) rotate(0); filter: brightness(1); }
    }

    @keyframes pure-spark-aura-pulse {
      0%,100% { opacity: .58; transform: translate(-50%, -50%) scale(.92); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.09); }
    }

    @keyframes pure-spark-rays-breathe {
      0%,100% { opacity: .52; filter: blur(.3px); }
      50% { opacity: 1; filter: blur(0); }
    }

    @keyframes pure-spark-rays-turn {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }

    @keyframes pure-spark-ring-turn {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }

    @keyframes pure-spark-ring-turn-reverse {
      from { transform: translate(-50%, -50%) rotate(360deg); }
      to { transform: translate(-50%, -50%) rotate(0deg); }
    }

    @keyframes pure-spark-ring-pulse {
      0%,100% { opacity: .66; }
      50% { opacity: 1; }
    }

    @keyframes pure-spark-star-pulse {
      0%,100% { transform: translate(-50%, -50%) rotate(45deg) scale(.84); filter: brightness(1.05); }
      50% { transform: translate(-50%, -50%) rotate(45deg) scale(1.16); filter: brightness(1.7); }
    }

    @keyframes pure-spark-orbit-turn {
      from { transform: rotate(var(--orbit-angle)); }
      to { transform: rotate(calc(var(--orbit-angle) + 360deg)); }
    }

    @keyframes pure-spark-mote-pulse {
      from { opacity: .28; transform: translate(-50%, -50%) scale(.55); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1.35); }
    }

    @keyframes pure-spark-core-pulse {
      0%,100% { filter: brightness(1.06) saturate(1.05); transform: scale(.985); }
      50% { filter: brightness(1.5) saturate(1.18); transform: scale(1.035); }
    }

    @keyframes pure-spark-sigil-pulse {
      0%,100% { transform: scale(.94) rotate(-4deg); opacity: .82; }
      50% { transform: scale(1.12) rotate(4deg); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .pure-spark-signature *,
      #ignitionButton[data-flame-type="pure-spark"] .ignition-core,
      #flameCard[data-flame-type="pure-spark"] #flameSigil {
        animation-duration: 8s !important;
      }
    }
  `;
  document.head.appendChild(style);

  const layer = document.createElement('span');
  layer.className = 'pure-spark-signature';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `
    <span class="pure-spark-aura"></span>
    <span class="pure-spark-rays"></span>
    <span class="pure-spark-ring outer"></span>
    <span class="pure-spark-ring inner"></span>
    <span class="pure-spark-star"></span>
  `;

  const fragment = document.createDocumentFragment();
  const orbitRadii = ['31%', '36%', '41%'];
  for (let index = 0; index < 18; index += 1) {
    const orbit = document.createElement('span');
    orbit.className = 'pure-spark-orbit';
    orbit.style.setProperty('--orbit-angle', `${index * 20}deg`);
    orbit.style.setProperty('--orbit-radius', orbitRadii[index % orbitRadii.length]);
    orbit.style.setProperty('--orbit-speed', `${6.2 + (index % 5) * .7}s`);
    orbit.style.setProperty('--orbit-delay', `${-(index % 9) * .41}s`);
    orbit.style.setProperty('--mote-size', `${2 + (index % 4)}px`);
    orbit.style.setProperty('--mote-pulse', `${1.15 + (index % 4) * .28}s`);

    const mote = document.createElement('span');
    mote.className = 'pure-spark-mote';
    orbit.appendChild(mote);
    fragment.appendChild(orbit);
  }
  layer.appendChild(fragment);
  button.appendChild(layer);

  let wasPureSpark = button.dataset.flameType === 'pure-spark';

  function syncEffect() {
    const isPureSpark = button.dataset.flameType === 'pure-spark';
    if (isPureSpark && !wasPureSpark) {
      layer.classList.remove('is-entering');
      void layer.offsetWidth;
      layer.classList.add('is-entering');
      window.setTimeout(() => layer.classList.remove('is-entering'), 900);
    }
    if (!isPureSpark) layer.classList.remove('is-entering');
    wasPureSpark = isPureSpark;
  }

  new MutationObserver(syncEffect).observe(button, {
    attributes: true,
    attributeFilter: ['data-flame-type']
  });

  new MutationObserver(() => {
    const active = card.dataset.flameType === 'pure-spark';
    if (sigil) sigil.classList.toggle('pure-spark-sigil-active', active);
  }).observe(card, {
    attributes: true,
    attributeFilter: ['data-flame-type']
  });

  syncEffect();
})();
