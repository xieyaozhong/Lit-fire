'use strict';

(() => {
  if (window.__tideBreathingWaveEffectLoaded) return;
  window.__tideBreathingWaveEffectLoaded = true;

  const button = document.getElementById('ignitionButton');
  if (!button) return;

  button.style.isolation = 'isolate';

  const canvas = document.createElement('canvas');
  canvas.id = 'tideBreathingWaveCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '148%',
    height: '148%',
    transform: 'translate(-50%, -50%)',
    zIndex: '7',
    pointerEvents: 'none',
    opacity: '0',
    visibility: 'hidden',
    transition: 'opacity 260ms ease',
    mixBlendMode: 'screen'
  });
  button.appendChild(canvas);

  const style = document.createElement('style');
  style.textContent = `
    #ignitionButton.lit[data-flame-type="tide"] #tideBreathingWaveCanvas {
      opacity: 1 !important;
      visibility: visible !important;
    }

    #ignitionButton.lit[data-flame-type="tide"] #persistentFlameCanvas {
      transform-origin: 50% 68%;
      animation: tide-flame-breathe 3.8s ease-in-out infinite !important;
      filter: saturate(1.3) brightness(1.08) hue-rotate(-5deg);
    }

    #ignitionButton.lit[data-flame-type="tide"] .ignition-core {
      animation: tide-core-breathe 3.8s ease-in-out infinite !important;
      background:
        radial-gradient(circle at 50% 42%, rgba(232,255,255,.28), transparent 16%),
        radial-gradient(circle at 50% 52%, rgba(71,226,235,.22), rgba(24,112,194,.19) 46%, rgba(6,14,34,.97) 78%) !important;
    }

    #ignitionButton.lit[data-flame-type="tide"] .ignition-ring {
      border-color: rgba(143,244,255,.72) !important;
      animation: tide-ring-breathe 3.8s ease-in-out infinite !important;
    }

    @keyframes tide-flame-breathe {
      0%, 100% {
        transform: scale(.97) translateY(2px);
        opacity: .76;
        filter: saturate(1.18) brightness(.9) hue-rotate(-8deg);
      }
      50% {
        transform: scale(1.055) translateY(-3px);
        opacity: 1;
        filter: saturate(1.48) brightness(1.28) hue-rotate(8deg);
      }
    }

    @keyframes tide-core-breathe {
      0%, 100% {
        transform: scale(.985);
        box-shadow: inset 0 0 58px rgba(68,225,239,.08), 0 0 70px rgba(27,132,210,.18);
      }
      50% {
        transform: scale(1.035);
        box-shadow: inset 0 0 74px rgba(176,255,255,.17), 0 0 112px rgba(56,219,232,.34), 0 0 148px rgba(35,104,218,.18);
      }
    }

    @keyframes tide-ring-breathe {
      0%, 100% {
        transform: scale(.985);
        opacity: .58;
        box-shadow: 0 0 20px rgba(68,202,236,.2), inset 0 0 26px rgba(31,126,211,.12);
      }
      50% {
        transform: scale(1.045);
        opacity: 1;
        box-shadow: 0 0 34px rgba(150,255,255,.5), 0 0 68px rgba(53,178,230,.28), inset 0 0 34px rgba(78,234,218,.24);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #ignitionButton.lit[data-flame-type="tide"] #persistentFlameCanvas,
      #ignitionButton.lit[data-flame-type="tide"] .ignition-core,
      #ignitionButton.lit[data-flame-type="tide"] .ignition-ring {
        animation-duration: 6s !important;
      }
    }
  `;
  document.head.appendChild(style);

  const ctx = canvas.getContext('2d');
  const foam = [];
  let width = 1;
  let height = 1;
  let dpr = 1;
  let lastTime = performance.now();
  let lastFoamAt = 0;

  function isActive() {
    return button.classList.contains('lit') && button.dataset.flameType === 'tide';
  }

  function syncVisibility() {
    const active = isActive();
    canvas.style.opacity = active ? '1' : '0';
    canvas.style.visibility = active ? 'visible' : 'hidden';
    return active;
  }

  function resize() {
    const rect = button.getBoundingClientRect();
    const cssSize = Math.max(1, Math.max(rect.width, rect.height) * 1.48);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = cssSize;
    height = cssSize;

    const pixelWidth = Math.round(cssSize * dpr);
    const pixelHeight = Math.round(cssSize * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function drawWaveBand(cx, cy, radius, time, offset, amplitude, speed, alpha, verticalOffset) {
    const left = cx - radius * 1.02;
    const right = cx + radius * 1.02;
    const baseY = cy + verticalOffset;
    const phase = time * speed + offset;

    const gradient = ctx.createLinearGradient(left, baseY, right, baseY);
    gradient.addColorStop(0, `rgba(20,72,176,${alpha * 0.86})`);
    gradient.addColorStop(0.26, `rgba(30,164,224,${alpha})`);
    gradient.addColorStop(0.52, `rgba(73,232,222,${alpha * 0.96})`);
    gradient.addColorStop(0.76, `rgba(104,212,245,${alpha})`);
    gradient.addColorStop(1, `rgba(19,82,190,${alpha * 0.82})`);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = `rgba(77,225,241,${alpha * 0.82})`;
    ctx.beginPath();
    ctx.moveTo(left, cy + radius * 1.08);

    const steps = 42;
    for (let index = 0; index <= steps; index += 1) {
      const ratio = index / steps;
      const x = left + (right - left) * ratio;
      const y = baseY
        + Math.sin(ratio * Math.PI * 2.2 + phase) * amplitude
        + Math.sin(ratio * Math.PI * 4.6 - phase * 0.72) * amplitude * 0.24;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(right, cy + radius * 1.08);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(220,255,255,${Math.min(1, alpha * 1.42)})`;
    ctx.lineWidth = Math.max(1.2, radius * 0.018);
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let index = 0; index <= steps; index += 1) {
      const ratio = index / steps;
      const x = left + (right - left) * ratio;
      const y = baseY
        + Math.sin(ratio * Math.PI * 2.2 + phase) * amplitude
        + Math.sin(ratio * Math.PI * 4.6 - phase * 0.72) * amplitude * 0.24;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function spawnFoam() {
    if (foam.length > 44) return;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.29;
    foam.push({
      x: cx + (Math.random() - 0.5) * radius * 1.35,
      y: cy + radius * (0.1 + Math.random() * 0.48),
      vx: (Math.random() - 0.5) * radius * 0.055,
      vy: -radius * (0.08 + Math.random() * 0.13),
      life: 1,
      decay: 0.42 + Math.random() * 0.36,
      size: 1.1 + Math.random() * 2.6,
      phase: Math.random() * Math.PI * 2
    });
  }

  function drawFoam(time, dt) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let index = foam.length - 1; index >= 0; index -= 1) {
      const particle = foam[index];
      particle.x += (particle.vx + Math.sin(time * 0.004 + particle.phase) * 4.6) * dt;
      particle.y += particle.vy * dt;
      particle.life -= particle.decay * dt;

      const alpha = Math.max(0, particle.life);
      ctx.fillStyle = `rgba(226,255,255,${alpha * 0.84})`;
      ctx.shadowBlur = 9;
      ctx.shadowColor = `rgba(102,236,245,${alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (0.65 + alpha * 0.42), 0, Math.PI * 2);
      ctx.fill();

      if (particle.life <= 0) foam.splice(index, 1);
    }

    ctx.restore();
  }

  function reset() {
    foam.length = 0;
    ctx.clearRect(0, 0, width, height);
    lastFoamAt = 0;
  }

  function frame(time) {
    resize();
    const active = syncVisibility();
    const dt = Math.min(0.034, Math.max(0.001, (time - lastTime) / 1000));
    lastTime = time;
    ctx.clearRect(0, 0, width, height);

    if (!active) {
      if (foam.length) reset();
      requestAnimationFrame(frame);
      return;
    }

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.29;
    const breath = (Math.sin(time * 0.00165 - Math.PI / 2) + 1) / 2;
    const breathEase = 0.28 + breath * 0.72;

    const halo = ctx.createRadialGradient(cx, cy, radius * 0.14, cx, cy, radius * (1.18 + breath * 0.12));
    halo.addColorStop(0, `rgba(224,255,255,${0.15 + breath * 0.2})`);
    halo.addColorStop(0.32, `rgba(69,229,225,${0.14 + breath * 0.18})`);
    halo.addColorStop(0.66, `rgba(25,132,221,${0.1 + breath * 0.12})`);
    halo.addColorStop(1, 'rgba(10,42,128,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.02, 0, Math.PI * 2);
    ctx.clip();

    drawWaveBand(cx, cy, radius, time, 0.4, radius * (0.052 + breath * 0.018), 0.00125, 0.24 + breathEase * 0.25, radius * 0.3);
    drawWaveBand(cx, cy, radius, time, 2.2, radius * (0.07 + breath * 0.022), -0.00155, 0.28 + breathEase * 0.31, radius * 0.12);
    drawWaveBand(cx, cy, radius, time, 4.4, radius * (0.082 + breath * 0.026), 0.00185, 0.32 + breathEase * 0.36, -radius * 0.08);

    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = `rgba(157,250,255,${0.28 + breath * 0.58})`;
    ctx.lineWidth = Math.max(1.4, radius * 0.025);
    ctx.shadowBlur = 18 + breath * 18;
    ctx.shadowColor = `rgba(72,220,239,${0.48 + breath * 0.4})`;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (0.91 + breath * 0.07), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (time - lastFoamAt > 95 - breath * 35) {
      spawnFoam();
      if (Math.random() < 0.34 + breath * 0.25) spawnFoam();
      lastFoamAt = time;
    }

    drawFoam(time, dt);
    requestAnimationFrame(frame);
  }

  new MutationObserver(() => {
    if (!syncVisibility()) reset();
  }).observe(button, {
    attributes: true,
    attributeFilter: ['class', 'data-flame-type']
  });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  syncVisibility();
  requestAnimationFrame(frame);
})();
