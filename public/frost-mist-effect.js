'use strict';

(() => {
  if (window.__frostMistEffectLoaded) return;
  window.__frostMistEffectLoaded = true;

  const button = document.getElementById('ignitionButton');
  if (!button) return;

  button.style.isolation = 'isolate';

  const canvas = document.createElement('canvas');
  canvas.id = 'frostMistCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '158%',
    height: '158%',
    transform: 'translate(-50%, -50%)',
    zIndex: '7',
    pointerEvents: 'none',
    opacity: '0',
    visibility: 'hidden',
    transition: 'opacity 240ms ease',
    mixBlendMode: 'screen'
  });
  button.appendChild(canvas);

  const style = document.createElement('style');
  style.textContent = `
    #ignitionButton.lit[data-flame-type="frost"] #frostMistCanvas {
      opacity: 1 !important;
      visibility: visible !important;
    }

    #ignitionButton.lit[data-flame-type="frost"] #persistentFlameCanvas {
      filter:
        saturate(.82)
        brightness(1.22)
        contrast(1.05)
        drop-shadow(0 0 10px rgba(210,247,255,.46))
        drop-shadow(0 0 22px rgba(91,190,255,.24));
    }

    #ignitionButton.lit[data-flame-type="frost"] .ignition-core {
      background:
        radial-gradient(circle at 50% 43%, rgba(255,255,255,.3), transparent 15%),
        radial-gradient(circle, rgba(186,241,255,.23), rgba(60,146,220,.18) 48%, rgba(6,13,30,.97) 78%) !important;
      box-shadow:
        inset 0 0 60px rgba(222,251,255,.12),
        0 0 78px rgba(114,213,255,.24) !important;
    }

    #ignitionButton.lit[data-flame-type="frost"] .ignition-ring {
      border-color: rgba(210,250,255,.82) !important;
      box-shadow:
        0 0 14px rgba(229,255,255,.48),
        0 0 36px rgba(102,204,255,.34),
        inset 0 0 28px rgba(188,244,255,.18) !important;
    }
  `;
  document.head.appendChild(style);

  const ctx = canvas.getContext('2d');
  const mist = [];
  const crystals = [];
  let width = 1;
  let height = 1;
  let dpr = 1;
  let lastTime = performance.now();
  let lastCrystalAt = 0;
  let wasActive = false;

  function isActive() {
    return button.classList.contains('lit') && button.dataset.flameType === 'frost';
  }

  function syncVisibility() {
    const active = isActive();
    canvas.style.opacity = active ? '1' : '0';
    canvas.style.visibility = active ? 'visible' : 'hidden';
    return active;
  }

  function resize() {
    const rect = button.getBoundingClientRect();
    const cssSize = Math.max(1, Math.max(rect.width, rect.height) * 1.58);
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

  function seedMist() {
    if (mist.length) return;
    for (let index = 0; index < 20; index += 1) {
      mist.push({
        x: Math.random() * width,
        y: height * (0.27 + Math.random() * 0.58),
        rx: width * (0.07 + Math.random() * 0.11),
        ry: width * (0.025 + Math.random() * 0.055),
        vx: width * (0.006 + Math.random() * 0.014) * (Math.random() < 0.5 ? -1 : 1),
        vy: -width * (0.006 + Math.random() * 0.014),
        alpha: 0.05 + Math.random() * 0.11,
        phase: Math.random() * Math.PI * 2,
        tint: Math.random()
      });
    }
  }

  function spawnCrystal() {
    if (crystals.length > 46) return;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.28;
    crystals.push({
      x: cx + (Math.random() - 0.5) * radius * 1.45,
      y: cy + radius * (0.05 + Math.random() * 0.58),
      vx: (Math.random() - 0.5) * radius * 0.08,
      vy: -radius * (0.07 + Math.random() * 0.13),
      life: 1,
      decay: 0.42 + Math.random() * 0.42,
      size: 1.2 + Math.random() * 2.4,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 2.8
    });
  }

  function drawMist(time, dt) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const puff of mist) {
      puff.x += (puff.vx + Math.sin(time * 0.0016 + puff.phase) * width * 0.004) * dt;
      puff.y += puff.vy * dt;

      if (puff.x < -puff.rx) puff.x = width + puff.rx;
      if (puff.x > width + puff.rx) puff.x = -puff.rx;
      if (puff.y < height * 0.12) puff.y = height * (0.78 + Math.random() * 0.18);

      const pulse = 0.72 + Math.sin(time * 0.0019 + puff.phase) * 0.28;
      const color = puff.tint > 0.52 ? '214,248,255' : '167,224,255';
      const gradient = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.rx);
      gradient.addColorStop(0, `rgba(${color},${puff.alpha * pulse})`);
      gradient.addColorStop(0.52, `rgba(${color},${puff.alpha * pulse * 0.55})`);
      gradient.addColorStop(1, `rgba(${color},0)`);

      ctx.save();
      ctx.translate(puff.x, puff.y);
      ctx.scale(1, puff.ry / puff.rx);
      ctx.translate(-puff.x, -puff.y);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawCrystals(time, dt) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';

    for (let index = crystals.length - 1; index >= 0; index -= 1) {
      const crystal = crystals[index];
      crystal.x += crystal.vx * dt;
      crystal.y += crystal.vy * dt;
      crystal.angle += crystal.spin * dt;
      crystal.life -= crystal.decay * dt;

      const alpha = Math.max(0, crystal.life);
      const flicker = 0.7 + Math.sin(time * 0.018 + index) * 0.3;
      ctx.save();
      ctx.translate(crystal.x, crystal.y);
      ctx.rotate(crystal.angle);
      ctx.strokeStyle = `rgba(232,255,255,${alpha * flicker})`;
      ctx.lineWidth = 0.8;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(142,225,255,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(-crystal.size * 1.7, 0);
      ctx.lineTo(crystal.size * 1.7, 0);
      ctx.moveTo(0, -crystal.size * 1.7);
      ctx.lineTo(0, crystal.size * 1.7);
      ctx.stroke();
      ctx.restore();

      if (crystal.life <= 0) crystals.splice(index, 1);
    }

    ctx.restore();
  }

  function reset() {
    mist.length = 0;
    crystals.length = 0;
    ctx.clearRect(0, 0, width, height);
    lastCrystalAt = 0;
  }

  function frame(time) {
    resize();
    const active = syncVisibility();
    const dt = Math.min(0.034, Math.max(0.001, (time - lastTime) / 1000));
    lastTime = time;
    ctx.clearRect(0, 0, width, height);

    if (!active) {
      if (mist.length || crystals.length) reset();
      wasActive = false;
      requestAnimationFrame(frame);
      return;
    }

    if (!wasActive) {
      seedMist();
      for (let index = 0; index < 16; index += 1) spawnCrystal();
    }
    wasActive = true;

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.29;
    const breath = (Math.sin(time * 0.0015 - Math.PI / 2) + 1) / 2;

    const halo = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * (1.1 + breath * 0.1));
    halo.addColorStop(0, `rgba(240,255,255,${0.14 + breath * 0.14})`);
    halo.addColorStop(0.42, `rgba(152,226,255,${0.11 + breath * 0.12})`);
    halo.addColorStop(1, 'rgba(68,131,220,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    drawMist(time, dt);

    if (time - lastCrystalAt > 110) {
      spawnCrystal();
      if (Math.random() < 0.32) spawnCrystal();
      lastCrystalAt = time;
    }

    drawCrystals(time, dt);
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
