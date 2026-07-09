'use strict';

(() => {
  if (window.__dawnSunriseAnimationLoaded) return;
  window.__dawnSunriseAnimationLoaded = true;

  const ignitionButton = document.getElementById('ignitionButton');
  if (!ignitionButton) return;

  if (!ignitionButton.querySelector('.dawn-horizon-glow')) {
    const horizon = document.createElement('span');
    horizon.className = 'dawn-horizon-glow';
    horizon.setAttribute('aria-hidden', 'true');

    const sun = document.createElement('span');
    sun.className = 'dawn-sun-disc';
    sun.setAttribute('aria-hidden', 'true');

    ignitionButton.append(horizon, sun);
  }

  const style = document.createElement('style');
  style.textContent = `
    .dawn-horizon-glow,
    .dawn-sun-disc {
      position: absolute;
      pointer-events: none;
      opacity: 0;
    }

    .dawn-horizon-glow {
      left: 12%;
      right: 12%;
      bottom: 10%;
      height: 48%;
      z-index: 1;
      border-radius: 50%;
      background:
        radial-gradient(ellipse at 50% 100%,
          rgba(255, 252, 216, 0.92) 0%,
          rgba(255, 224, 138, 0.56) 22%,
          rgba(255, 159, 90, 0.26) 48%,
          transparent 74%);
      filter: blur(8px);
    }

    .dawn-sun-disc {
      left: 50%;
      bottom: 17%;
      width: 25%;
      aspect-ratio: 1;
      z-index: 2;
      border-radius: 50%;
      transform: translate(-50%, 34px) scale(0.72);
      background:
        radial-gradient(circle at 42% 38%,
          #fffef2 0%,
          #fff1a8 30%,
          #ffca69 64%,
          #ff8e4d 100%);
      box-shadow:
        0 0 18px rgba(255, 224, 138, 0.52),
        0 0 46px rgba(255, 159, 90, 0.32),
        0 0 82px rgba(216, 74, 50, 0.18);
    }

    .ignition-button[data-flame-type="dawn"] .dawn-horizon-glow {
      animation: dawn-horizon-brighten 8.8s ease-in-out infinite alternate;
    }

    .ignition-button[data-flame-type="dawn"] .dawn-sun-disc {
      animation: dawn-sun-rise 8.8s cubic-bezier(.22,.61,.36,1) infinite alternate;
    }

    .ignition-button[data-flame-type="dawn"] #persistentFlameCanvas {
      transform-origin: 50% 78%;
      animation: dawn-flame-brighten 8.8s ease-in-out infinite alternate !important;
    }

    .ignition-button[data-flame-type="dawn"] .ignition-ring {
      border-color: rgba(255, 208, 112, 0.68) !important;
      animation: dawn-ring-brighten 8.8s ease-in-out infinite alternate !important;
    }

    .ignition-button[data-flame-type="dawn"] .ignition-core {
      background:
        radial-gradient(circle at 50% 72%, rgba(255, 253, 232, 0.24), transparent 18%),
        linear-gradient(to top,
          rgba(216, 74, 50, 0.20),
          rgba(255, 159, 90, 0.18) 38%,
          rgba(255, 224, 138, 0.13) 62%,
          rgba(255, 253, 240, 0.06) 78%,
          rgba(7, 5, 14, 0.96) 100%) !important;
      animation: dawn-core-brighten 8.8s ease-in-out infinite alternate !important;
    }

    .flame-card[data-flame-type="dawn"] {
      border-color: rgba(255, 224, 138, 0.26);
      background:
        linear-gradient(135deg,
          rgba(216, 74, 50, 0.10),
          rgba(255, 159, 90, 0.13),
          rgba(255, 253, 240, 0.11));
      animation: dawn-card-glow 8.8s ease-in-out infinite alternate;
    }

    @keyframes dawn-sun-rise {
      0% {
        opacity: 0.10;
        transform: translate(-50%, 34px) scale(0.72);
        filter: brightness(0.58) saturate(0.86);
      }
      28% {
        opacity: 0.30;
        transform: translate(-50%, 25px) scale(0.80);
        filter: brightness(0.82) saturate(0.94);
      }
      58% {
        opacity: 0.70;
        transform: translate(-50%, 10px) scale(0.94);
        filter: brightness(1.10) saturate(1.02);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, -8px) scale(1.08);
        filter: brightness(1.42) saturate(1.05);
      }
    }

    @keyframes dawn-horizon-brighten {
      0% {
        opacity: 0.08;
        transform: scale(0.76) translateY(18px);
        filter: blur(12px) brightness(0.52);
      }
      40% {
        opacity: 0.34;
        transform: scale(0.90) translateY(9px);
        filter: blur(10px) brightness(0.82);
      }
      72% {
        opacity: 0.72;
        transform: scale(1.02) translateY(2px);
        filter: blur(8px) brightness(1.12);
      }
      100% {
        opacity: 1;
        transform: scale(1.14) translateY(-4px);
        filter: blur(7px) brightness(1.40);
      }
    }

    @keyframes dawn-flame-brighten {
      0% {
        opacity: 0.42;
        transform: translateY(7px) scale(0.94);
        filter: saturate(0.86) brightness(0.66) contrast(1.08);
      }
      45% {
        opacity: 0.72;
        transform: translateY(2px) scale(0.99);
        filter: saturate(1.02) brightness(0.94) contrast(1.06);
      }
      100% {
        opacity: 1;
        transform: translateY(-7px) scale(1.07);
        filter: saturate(1.16) brightness(1.46) contrast(1.02);
      }
    }

    @keyframes dawn-ring-brighten {
      0% {
        opacity: 0.44;
        transform: scale(0.98);
        filter: brightness(0.62);
        box-shadow:
          0 0 14px rgba(216, 74, 50, 0.16),
          inset 0 0 22px rgba(255, 159, 90, 0.08);
      }
      55% {
        opacity: 0.76;
        transform: scale(1.01);
        filter: brightness(1.02);
        box-shadow:
          0 0 28px rgba(255, 159, 90, 0.30),
          0 -10px 40px rgba(255, 224, 138, 0.18),
          inset 0 0 28px rgba(255, 224, 138, 0.16);
      }
      100% {
        opacity: 1;
        transform: scale(1.045);
        filter: brightness(1.38);
        box-shadow:
          0 0 40px rgba(255, 224, 138, 0.54),
          0 -22px 70px rgba(255, 253, 240, 0.34),
          inset 0 0 38px rgba(255, 224, 138, 0.26);
      }
    }

    @keyframes dawn-core-brighten {
      0% {
        opacity: 0.62;
        filter: brightness(0.70);
      }
      55% {
        opacity: 0.84;
        filter: brightness(1.02);
      }
      100% {
        opacity: 1;
        filter: brightness(1.34);
      }
    }

    @keyframes dawn-card-glow {
      0% {
        box-shadow: inset 0 0 20px rgba(216, 74, 50, 0.04), 0 0 14px rgba(255, 159, 90, 0.04);
      }
      100% {
        box-shadow: inset 0 0 32px rgba(255, 224, 138, 0.12), 0 0 34px rgba(255, 159, 90, 0.18);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ignition-button[data-flame-type="dawn"] .dawn-horizon-glow,
      .ignition-button[data-flame-type="dawn"] .dawn-sun-disc,
      .ignition-button[data-flame-type="dawn"] #persistentFlameCanvas,
      .ignition-button[data-flame-type="dawn"] .ignition-ring,
      .ignition-button[data-flame-type="dawn"] .ignition-core,
      .flame-card[data-flame-type="dawn"] {
        animation-duration: 14s !important;
      }
    }
  `;

  document.head.appendChild(style);
})();
