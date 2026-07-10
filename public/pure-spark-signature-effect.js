'use strict';

(() => {
  if (window.__pureSparkSignatureEffectLoaded) return;
  window.__pureSparkSignatureEffectLoaded = true;

  const button = document.getElementById('ignitionButton');
  const card = document.getElementById('flameCard');
  const sigil = document.getElementById('flameSigil');
  if (!button || !card) return;

  button.style.isolation = 'isolate';

  const style = document.createElement('style');
  style.textContent = `
    .pure-spark-signature {
      position: absolute;
      inset: -8%;
      z-index: 4;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transform: scale(.94);
      transition: opacity .3s ease, transform .38s ease, visibility .3s;
      mix-blend-mode: screen;
    }

    #ignitionButton.lit[data-flame-type="pure-spark"] .pure-spark-signature {
      opacity: 1;
      visibility: visible;
      transform: scale(1);
    }

    .pure-spark-core-halo,
    .pure-spark-flare,
    .pure-spark-mote {
      position: absolute;
      pointer-events: none;
    }

    .pure-spark-core-halo {
      left: 50%;
      top: 54%;
      width: 68%;
      aspect-ratio: 1;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(circle,
        rgba(255,255,255,.58) 0%,
        rgba(255,247,199,.34) 20%,
        rgba(255,211,91,.18) 45%,
        rgba(255,145,38,.06) 66%,
        transparent 78%);
      filter: blur(.2px);
      animation: pure-spark-core-breathe 2.45s ease-in-out infinite;
    }

    .pure-spark-flare {
      left: 50%;
      top: 49%;
      width: 9%;
      aspect-ratio: 1;
      transform: translate(-50%, -50%) rotate(45deg);
      border-radius: 30%;
      background: linear-gradient(135deg, #fff 0%, #fff9cf 42%, #ffd760 78%, #ff9e34 100%);
      box-shadow:
        0 0 7px rgba(255,255,255,.95),
        0 0 19px rgba(255,237,161,.88),
        0 0 34px rgba(255,191,65,.48);
      animation: pure-spark-flare-pulse 1.9s ease-in-out infinite;
    }

    .pure-spark-flare::before,
    .pure-spark-flare::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      border-radius: 999px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.9), transparent);
    }

    .pure-spark-flare::before {
      width: 245%;
      height: 10%;
    }

    .pure-spark-flare::after {
      width: 10%;
      height: 245%;
      background: linear-gradient(0deg, transparent, rgba(255,247,205,.9), transparent);
    }

    .pure-spark-mote {
      left: var(--mote-left);
      bottom: var(--mote-bottom);
      width: var(--mote-size);
      height: var(--mote-size);
      border-radius: 50%;
      background: var(--mote-color);
      box-shadow:
        0 0 5px rgba(255,255,255,.9),
        0 0 11px rgba(255,207,71,.78);
      opacity: 0;
      animation: pure-spark-mote-rise var(--mote-duration) ease-in infinite;
      animation-delay: var(--mote-delay);
    }

    #ignitionButton.lit[data-flame-type="pure-spark"] #persistentFlameCanvas {
      transform-origin: 50% 70%;
      animation: pure-spark-flame-breathe 2.45s ease-in-out infinite !important;
      filter:
        brightness(1.24)
        saturate(1.12)
        drop-shadow(0 0 9px rgba(255,246,194,.42))
        drop-shadow(0 0 19px rgba(255,186,62,.24));
    }

    #ignitionButton.lit[data-flame-type="pure-spark"] .ignition-core {
      background:
        radial-gradient(circle at 50% 44%, rgba(255,255,255,.24), transparent 16%),
        radial-gradient(circle, rgba(255,221,103,.19), rgba(255,134,43,.12) 48%, rgba(7,5,14,.97) 78%) !important;
      box-shadow:
        0 0 19px rgba(255,255,255,.34),
        0 0 42px rgba(255,213,101,.31),
        inset 0 0 26px rgba(255,245,198,.14) !important;
      animation: pure-spark-button-core 2.45s ease-in-out infinite !important;
    }

    #ignitionButton.lit[data-flame-type="pure-spark"] .ignition-ring {
      border-color: rgba(255,232,156,.82) !important;
      box-shadow:
        0 0 11px rgba(255,255,255,.48),
        0 0 27px rgba(255,207,78,.36),
        inset 0 0 25px rgba(255,241,190,.12) !important;
    }

    #flameCard[data-flame-type="pure-spark"] {
      border-color: rgba(255,220,120,.3) !important;
      box-shadow:
        0 0 0 1px rgba(255,248,211,.06),
        0 0 24px rgba(255,199,68,.13),
        inset 0 0 25px rgba(255,242,187,.05) !important;
    }

    #flameCard[data-flame-type="pure-spark"] #flameSigil {
      color: #fff6c1;
      text-shadow:
        0 0 5px rgba(255,255,255,.9),
        0 0 14px rgba(255,226,130,.76),
        0 0 25px rgba(255,169,47,.4);
      animation: pure-spark-sigil-pulse 2.1s ease-in-out infinite;
    }

    .pure-spark-signature.is-entering {
      animation: pure-spark-entry .62s cubic-bezier(.12,.8,.2,1) both;
    }

    @keyframes pure-spark-entry {
      0% { opacity: 0; transform: scale(.72); filter: brightness(2.4) blur(3px); }
      55% { opacity: 1; transform: scale(1.06); filter: brightness(1.55) blur(0); }
      100% { opacity: 1; transform: scale(1); filter: brightness(1); }
    }

    @keyframes pure-spark-core-breathe {
      0%,100% { opacity: .58; transform: translate(-50%, -50%) scale(.92); }
      50% { opacity: .98; transform: translate(-50%, -50%) scale(1.08); }
    }

    @keyframes pure-spark-flare-pulse {
      0%,100% { transform: translate(-50%, -50%) rotate(45deg) scale(.8); filter: brightness(1.02); }
      50% { transform: translate(-50%, -50%) rotate(45deg) scale(1.15); filter: brightness(1.55); }
    }

    @keyframes pure-spark-mote-rise {
      0% { opacity: 0; transform: translate3d(0, 8px, 0) scale(.45); }
      18% { opacity: .95; }
      62% { opacity: .72; }
      100% { opacity: 0; transform: translate3d(var(--mote-drift), -88px, 0) scale(1.15); }
    }

    @keyframes pure-spark-flame-breathe {
      0%,100% { transform: scale(.99) translateY(1px); }
      50% { transform: scale(1.035) translateY(-2px); }
    }

    @keyframes pure-spark-button-core {
      0%,100% { filter: brightness(1.04); transform: scale(.99); }
      50% { filter: brightness(1.34); transform: scale(1.025); }
    }

    @keyframes pure-spark-sigil-pulse {
      0%,100% { transform: scale(.95); opacity: .84; }
      50% { transform: scale(1.09); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .pure-spark-signature *,
      #ignitionButton.lit[data-flame-type="pure-spark"] #persistentFlameCanvas,
      #ignitionButton.lit[data-flame-type="pure-spark"] .ignition-core,
      #flameCard[data-flame-type="pure-spark"] #flameSigil {
        animation-duration: 7s !important;
      }
    }
  `;
  document.head.appendChild(style);

  const layer = document.createElement('span');
  layer.className = 'pure-spark-signature';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `
    <span class="pure-spark-core-halo"></span>
    <span class="pure-spark-flare"></span>
  `;

  const fragment = document.createDocumentFragment();
  const colors = ['#fffdf0', '#fff3b0', '#ffd968', '#ffaf45'];
  for (let index = 0; index < 16; index += 1) {
    const mote = document.createElement('span');
    mote.className = 'pure-spark-mote';
    mote.style.setProperty('--mote-left', `${24 + (index * 17) % 54}%`);
    mote.style.setProperty('--mote-bottom', `${20 + (index % 4) * 5}%`);
    mote.style.setProperty('--mote-size', `${2 + (index % 3)}px`);
    mote.style.setProperty('--mote-duration', `${2.5 + (index % 5) * .34}s`);
    mote.style.setProperty('--mote-delay', `${-(index % 8) * .39}s`);
    mote.style.setProperty('--mote-drift', `${-18 + (index * 11) % 36}px`);
    mote.style.setProperty('--mote-color', colors[index % colors.length]);
    fragment.appendChild(mote);
  }
  layer.appendChild(fragment);
  button.appendChild(layer);

  let wasPureSpark = button.classList.contains('lit') && button.dataset.flameType === 'pure-spark';

  function syncEffect() {
    const isPureSpark = button.classList.contains('lit') && button.dataset.flameType === 'pure-spark';
    if (isPureSpark && !wasPureSpark) {
      layer.classList.remove('is-entering');
      void layer.offsetWidth;
      layer.classList.add('is-entering');
      window.setTimeout(() => layer.classList.remove('is-entering'), 680);
    }
    if (!isPureSpark) layer.classList.remove('is-entering');
    wasPureSpark = isPureSpark;
  }

  new MutationObserver(syncEffect).observe(button, {
    attributes: true,
    attributeFilter: ['class', 'data-flame-type']
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
