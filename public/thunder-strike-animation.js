'use strict';

(() => {
  if (window.__thunderStrikeAnimationLoaded) return;
  window.__thunderStrikeAnimationLoaded = true;

  const button = document.getElementById('ignitionButton');
  if (!button) return;

  const layer = document.createElement('span');
  layer.className = 'thunder-strike-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `
    <svg class="thunder-bolt-svg" viewBox="0 0 100 100" focusable="false" aria-hidden="true">
      <path class="thunder-bolt thunder-bolt-main" d="M60 -10 L44 23 L57 23 L40 55 L53 55 L36 90" />
      <path class="thunder-bolt thunder-bolt-side" d="M77 2 L67 29 L77 29 L68 54" />
    </svg>
    <span class="thunder-impact-core"></span>
    <span class="thunder-impact-wave"></span>
  `;
  button.appendChild(layer);

  const style = document.createElement('style');
  style.textContent = `
    .thunder-strike-layer {
      position: absolute;
      inset: -10%;
      z-index: 12;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      overflow: visible;
      border-radius: 50%;
    }

    .thunder-strike-layer.strike-once {
      visibility: visible;
      animation: thunder-layer-once .88s ease-out both;
    }

    .thunder-bolt-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      filter: drop-shadow(0 0 5px rgba(255,255,255,.98)) drop-shadow(0 0 16px rgba(255,222,55,.92));
    }

    .thunder-bolt {
      fill: none;
      stroke: #fffdf0;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
      stroke-dasharray: 145;
      stroke-dashoffset: 145;
      opacity: 0;
    }

    .thunder-bolt-main { stroke-width: 4.8; }
    .thunder-bolt-side { stroke-width: 2.8; }

    .strike-once .thunder-bolt-main {
      animation: thunder-bolt-once .72s steps(1,end) both;
    }

    .strike-once .thunder-bolt-side {
      animation: thunder-bolt-side-once .72s steps(1,end) .06s both;
    }

    .thunder-impact-core,
    .thunder-impact-wave {
      position: absolute;
      left: 50%;
      top: 57%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      opacity: 0;
    }

    .thunder-impact-core {
      width: 24%;
      aspect-ratio: 1;
      background: radial-gradient(circle, rgba(255,255,255,1), rgba(255,225,72,.78) 30%, rgba(157,78,221,.26) 62%, transparent 78%);
      box-shadow: 0 0 22px rgba(255,255,255,.95), 0 0 54px rgba(255,214,10,.75), 0 0 82px rgba(139,77,255,.42);
    }

    .thunder-impact-wave {
      width: 42%;
      aspect-ratio: 1;
      border: 2px solid rgba(240,246,255,.9);
      box-shadow: 0 0 22px rgba(255,227,90,.66), inset 0 0 20px rgba(157,78,221,.24);
    }

    .strike-once .thunder-impact-core {
      animation: thunder-core-once .78s ease-out both;
    }

    .strike-once .thunder-impact-wave {
      animation: thunder-wave-once .82s ease-out .05s both;
    }

    @keyframes thunder-layer-once {
      0% { opacity: 0; }
      4% { opacity: 1; }
      24% { opacity: .92; }
      100% { opacity: 0; }
    }

    @keyframes thunder-bolt-once {
      0%, 5% { opacity: 0; stroke-dashoffset: 145; }
      7% { opacity: 1; stroke-dashoffset: 0; }
      14% { opacity: .16; stroke-dashoffset: 0; }
      18% { opacity: 1; stroke-dashoffset: 0; }
      31%, 100% { opacity: 0; stroke-dashoffset: 0; }
    }

    @keyframes thunder-bolt-side-once {
      0%, 8% { opacity: 0; stroke-dashoffset: 145; }
      10% { opacity: .9; stroke-dashoffset: 0; }
      18% { opacity: .12; stroke-dashoffset: 0; }
      22% { opacity: .75; stroke-dashoffset: 0; }
      34%, 100% { opacity: 0; stroke-dashoffset: 0; }
    }

    @keyframes thunder-core-once {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(.25); }
      8% { opacity: 1; transform: translate(-50%, -50%) scale(1.34); }
      18% { opacity: .3; transform: translate(-50%, -50%) scale(.9); }
      25% { opacity: .9; transform: translate(-50%, -50%) scale(1.08); }
      55%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.55); }
    }

    @keyframes thunder-wave-once {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(.28); }
      11% { opacity: .95; transform: translate(-50%, -50%) scale(.62); }
      62%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(2.2); }
    }

    @media (prefers-reduced-motion: reduce) {
      .thunder-strike-layer.strike-once { animation-duration: .5s; }
    }
  `;
  document.head.appendChild(style);

  let previousActive = false;
  let timer = 0;

  function isThunderActive() {
    return button.classList.contains('lit') && button.dataset.flameType === 'thunder';
  }

  function playStrike() {
    clearTimeout(timer);
    layer.classList.remove('strike-once');
    void layer.offsetWidth;
    layer.classList.add('strike-once');
    navigator.vibrate?.([32, 28, 78]);
    timer = window.setTimeout(() => layer.classList.remove('strike-once'), 920);
  }

  function sync() {
    const active = isThunderActive();
    if (active && !previousActive) playStrike();
    previousActive = active;
  }

  new MutationObserver(sync).observe(button, {
    attributes: true,
    attributeFilter: ['class', 'data-flame-type']
  });

  sync();
})();
