'use strict';

(() => {
  if (window.__thunderStrikeAnimationLoaded) return;
  window.__thunderStrikeAnimationLoaded = true;

  const button = document.getElementById('ignitionButton');
  const flameCard = document.getElementById('flameCard');
  if (!button) return;

  if (!button.querySelector('.thunder-strike-layer')) {
    const layer = document.createElement('span');
    layer.className = 'thunder-strike-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = `
      <svg class="thunder-bolt-svg" viewBox="0 0 100 100" focusable="false" aria-hidden="true">
        <path class="thunder-bolt thunder-bolt-main" d="M58 -8 L45 22 L56 22 L42 51 L53 51 L38 83" />
        <path class="thunder-bolt thunder-bolt-left" d="M28 5 L21 29 L31 29 L23 50" />
        <path class="thunder-bolt thunder-bolt-right" d="M79 8 L69 31 L78 31 L70 54" />
        <path class="thunder-arc thunder-arc-one" d="M18 65 C31 52 39 75 52 61 C64 49 71 72 84 58" />
        <path class="thunder-arc thunder-arc-two" d="M23 78 C35 66 43 86 55 72 C66 60 72 82 80 72" />
      </svg>
      <span class="thunder-impact-core"></span>
      <span class="thunder-impact-wave thunder-impact-wave-one"></span>
      <span class="thunder-impact-wave thunder-impact-wave-two"></span>
    `;
    button.appendChild(layer);
  }

  const style = document.createElement('style');
  style.textContent = `
    .thunder-strike-layer {
      position: absolute;
      inset: -8%;
      z-index: 8;
      pointer-events: none;
      opacity: 0;
      overflow: visible;
      border-radius: 50%;
    }

    .thunder-bolt-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      filter: drop-shadow(0 0 4px rgba(255,255,255,.96)) drop-shadow(0 0 12px rgba(255,225,64,.82));
    }

    .thunder-bolt,
    .thunder-arc {
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
      opacity: 0;
    }

    .thunder-bolt {
      stroke: #fffce8;
      stroke-width: 3.2;
      stroke-dasharray: 130;
      stroke-dashoffset: 130;
    }

    .thunder-bolt-main {
      stroke-width: 4.6;
    }

    .thunder-arc {
      stroke: #d8e7ff;
      stroke-width: 1.7;
      stroke-dasharray: 85;
      stroke-dashoffset: 85;
      filter: drop-shadow(0 0 5px rgba(139,77,255,.92));
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
      width: 22%;
      aspect-ratio: 1;
      background: radial-gradient(circle, rgba(255,255,255,.98) 0%, rgba(255,233,104,.76) 28%, rgba(157,78,221,.24) 62%, transparent 76%);
      filter: blur(1px);
      box-shadow: 0 0 18px rgba(255,255,255,.95), 0 0 44px rgba(255,214,10,.72), 0 0 72px rgba(139,77,255,.42);
    }

    .thunder-impact-wave {
      width: 38%;
      aspect-ratio: 1;
      border: 2px solid rgba(235,242,255,.82);
      box-shadow: 0 0 18px rgba(255,227,90,.62), inset 0 0 18px rgba(157,78,221,.22);
    }

    .ignition-button[data-flame-type="thunder"] .thunder-strike-layer {
      opacity: 1;
    }

    .ignition-button[data-flame-type="thunder"] .thunder-bolt-main {
      animation: thunder-main-strike 2.7s steps(1, end) infinite;
    }

    .ignition-button[data-flame-type="thunder"] .thunder-bolt-left {
      animation: thunder-side-strike 2.7s steps(1, end) .08s infinite;
    }

    .ignition-button[data-flame-type="thunder"] .thunder-bolt-right {
      animation: thunder-side-strike 2.7s steps(1, end) .15s infinite;
    }

    .ignition-button[data-flame-type="thunder"] .thunder-arc-one {
      animation: thunder-arc-flash 1.35s linear infinite;
    }

    .ignition-button[data-flame-type="thunder"] .thunder-arc-two {
      animation: thunder-arc-flash 1.35s linear .34s infinite;
    }

    .ignition-button[data-flame-type="thunder"] .thunder-impact-core {
      animation: thunder-impact-core 2.7s ease-out infinite;
    }

    .ignition-button[data-flame-type="thunder"] .thunder-impact-wave-one {
      animation: thunder-impact-wave 2.7s ease-out infinite;
    }

    .ignition-button[data-flame-type="thunder"] .thunder-impact-wave-two {
      animation: thunder-impact-wave 2.7s ease-out .12s infinite;
    }

    .ignition-button[data-flame-type="thunder"] #persistentFlameCanvas {
      transform-origin: 50% 68%;
      animation: thunder-electrified-flame 2.7s steps(1, end) infinite !important;
    }

    .ignition-button[data-flame-type="thunder"] .ignition-ring {
      border-color: rgba(255, 237, 111, .92) !important;
      animation: thunder-ring-shock 2.7s steps(1, end) infinite !important;
    }

    .ignition-button[data-flame-type="thunder"] .ignition-core {
      background:
        radial-gradient(circle at 50% 48%, rgba(255,255,255,.24), transparent 15%),
        radial-gradient(circle, rgba(255,214,10,.20), rgba(157,78,221,.20) 48%, rgba(7,5,14,.97) 78%) !important;
      animation: thunder-core-flash 2.7s steps(1, end) infinite !important;
    }

    .flame-card[data-flame-type="thunder"] {
      animation: thunder-card-charge 2.7s steps(1, end) infinite;
    }

    @keyframes thunder-main-strike {
      0%, 3%, 100% { opacity: 0; stroke-dashoffset: 130; }
      4% { opacity: 1; stroke-dashoffset: 0; }
      7% { opacity: .16; stroke-dashoffset: 0; }
      9% { opacity: 1; stroke-dashoffset: 0; }
      13% { opacity: 0; stroke-dashoffset: 0; }
    }

    @keyframes thunder-side-strike {
      0%, 5%, 100% { opacity: 0; stroke-dashoffset: 130; }
      6% { opacity: .92; stroke-dashoffset: 0; }
      10% { opacity: .12; stroke-dashoffset: 0; }
      12% { opacity: .78; stroke-dashoffset: 0; }
      16% { opacity: 0; stroke-dashoffset: 0; }
    }

    @keyframes thunder-arc-flash {
      0%, 34%, 100% { opacity: 0; stroke-dashoffset: 85; }
      38% { opacity: .86; stroke-dashoffset: 0; }
      46% { opacity: .15; stroke-dashoffset: 0; }
      52% { opacity: .72; stroke-dashoffset: 0; }
      62% { opacity: 0; stroke-dashoffset: 0; }
    }

    @keyframes thunder-impact-core {
      0%, 3%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(.32); }
      5% { opacity: 1; transform: translate(-50%, -50%) scale(1.28); }
      10% { opacity: .25; transform: translate(-50%, -50%) scale(.92); }
      13% { opacity: .88; transform: translate(-50%, -50%) scale(1.08); }
      20% { opacity: 0; transform: translate(-50%, -50%) scale(1.45); }
    }

    @keyframes thunder-impact-wave {
      0%, 5%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(.35); }
      7% { opacity: .92; transform: translate(-50%, -50%) scale(.62); }
      22% { opacity: 0; transform: translate(-50%, -50%) scale(2.05); }
    }

    @keyframes thunder-electrified-flame {
      0%, 3%, 100% { transform: scale(1); filter: saturate(1.06) brightness(1); }
      4% { transform: scale(1.11) translateY(-3px); filter: saturate(1.65) brightness(1.92) contrast(1.12); }
      7% { transform: scale(.98); filter: saturate(.92) brightness(.72); }
      9% { transform: scale(1.08) translateY(-2px); filter: saturate(1.5) brightness(1.68); }
      14% { transform: scale(1.01); filter: saturate(1.15) brightness(1.08); }
    }

    @keyframes thunder-ring-shock {
      0%, 3%, 100% {
        transform: scale(1);
        opacity: .78;
        box-shadow: 0 0 24px rgba(255,214,10,.30), inset 0 0 28px rgba(157,78,221,.14);
      }
      4% {
        transform: scale(1.08);
        opacity: 1;
        box-shadow: 0 0 46px rgba(255,255,255,.72), 0 0 78px rgba(255,214,10,.64), inset 0 0 38px rgba(157,78,221,.30);
      }
      7% { transform: scale(.99); opacity: .56; }
      9% { transform: scale(1.05); opacity: 1; }
      15% { transform: scale(1); opacity: .82; }
    }

    @keyframes thunder-core-flash {
      0%, 3%, 100% { filter: brightness(1); }
      4% { filter: brightness(2.1); }
      7% { filter: brightness(.64); }
      9% { filter: brightness(1.72); }
      15% { filter: brightness(1.05); }
    }

    @keyframes thunder-card-charge {
      0%, 3%, 100% { box-shadow: inset 0 0 26px rgba(157,78,221,.06), 0 0 18px rgba(255,214,10,.06); }
      4% { box-shadow: inset 0 0 38px rgba(255,255,255,.16), 0 0 42px rgba(255,214,10,.24); }
      9% { box-shadow: inset 0 0 32px rgba(157,78,221,.14), 0 0 34px rgba(255,214,10,.18); }
      18% { box-shadow: inset 0 0 26px rgba(157,78,221,.08), 0 0 22px rgba(255,214,10,.08); }
    }

    @media (prefers-reduced-motion: reduce) {
      .ignition-button[data-flame-type="thunder"] .thunder-bolt,
      .ignition-button[data-flame-type="thunder"] .thunder-arc,
      .ignition-button[data-flame-type="thunder"] .thunder-impact-core,
      .ignition-button[data-flame-type="thunder"] .thunder-impact-wave,
      .ignition-button[data-flame-type="thunder"] #persistentFlameCanvas,
      .ignition-button[data-flame-type="thunder"] .ignition-ring,
      .ignition-button[data-flame-type="thunder"] .ignition-core,
      .flame-card[data-flame-type="thunder"] {
        animation-duration: 5.4s !important;
      }
    }
  `;

  document.head.appendChild(style);
})();
