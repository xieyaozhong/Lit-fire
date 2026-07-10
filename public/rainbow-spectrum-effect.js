'use strict';

(() => {
  if (window.__rainbowSpectrumEffectLoaded) return;
  window.__rainbowSpectrumEffectLoaded = true;

  const button = document.getElementById('ignitionButton');
  if (!button) return;

  button.style.isolation = 'isolate';

  const canvas = document.createElement('canvas');
  canvas.id = 'rainbowSpectrumCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '142%',
    height: '142%',
    transform: 'translate(-50%, -50%)',
    zIndex: '8',
    pointerEvents: 'none',
    opacity: '0',
    visibility: 'hidden',
    transition: 'opacity 220ms ease',
    mixBlendMode: 'screen'
  });
  button.appendChild(canvas);

  const style = document.createElement('style');
  style.textContent = `
    #ignitionButton.lit[data-flame-type="rainbow"] #rainbowSpectrumCanvas {
      opacity: 1 !important;
      visibility: visible !important;
    }

    #ignitionButton.lit[data-flame-type="rainbow"] .flame-variant-overlay {
      display: none !important;
    }

    #ignitionButton.lit[data-flame-type="rainbow"] #persistentFlameCanvas {
      filter: saturate(1.35) brightness(1.12) contrast(1.05);
    }

    #ignitionButton.lit[data-flame-type="rainbow"] .ignition-ring {
      border-style: solid !important;
      border-color: rgba(255,255,255,.62) !important;
      animation: none !important;
      box-shadow:
        0 0 14px rgba(255,86,113,.42),
        0 0 28px rgba(90,218,255,.34),
        0 0 46px rgba(145,105,255,.25),
        inset 0 0 28px rgba(255,238,130,.16) !important;
    }
  `;
  document.head.appendChild(style);

  const ctx = canvas.getContext('2d');
  const particles = [];
  let width = 1;
  let height = 1;
  let dpr = 1;
  let lastTime = performance.now();
  let lastSpawnAt = 0;
  let wasActive = false;

  function isActive() {
    return button.classList.contains('lit') && button.dataset.flameType === 'rainbow';
  }

  function syncVisibility() {
    const active = isActive();
    canvas.style.opacity = active ? '1' : '0';
    canvas.style.visibility = active ? 'visible' : 'hidden';
    return active;
  }

  function resize() {
    const rect = button.getBoundingClientRect();
    const cssSize = Math.max(1, Math.max(rect.width, rect.height) * 1.42);
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

  function hsla(hue, saturation, lightness, alpha) {
    const normalizedHue = ((hue % 360) + 360) % 360;
    return `hsla(${normalizedHue}, ${saturation}%, ${lightness}%, ${alpha})`;
  }

  function drawFlameLobe(cx, baseY, flameWidth, flameHeight, time, hue, phase, alpha) {
    const waveA = Math.sin(time * 0.0052 + phase) * flameWidth * 0.14;
    const waveB = Math.sin(time * 0.0084 + phase * 1.8) * flameWidth * 0.085;
    const tipDrift = Math.sin(time * 0.0037 + phase * 1.25) * flameWidth * 0.12;

    const gradient = ctx.createLinearGradient(cx, baseY, cx + tipDrift, baseY - flameHeight);
    gradient.addColorStop(0, hsla(hue + 62, 100, 58, 0.08));
    gradient.addColorStop(0.22, hsla(hue + 34, 100, 58, 0.78));
    gradient.addColorStop(0.58, hsla(hue, 100, 62, 0.96));
    gradient.addColorStop(1, hsla(hue - 42, 100, 76, 0.98));

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 22;
    ctx.shadowColor = hsla(hue, 100, 60, 0.92);
    ctx.beginPath();
    ctx.moveTo(cx + tipDrift, baseY - flameHeight);
    ctx.bezierCurveTo(
      cx - flameWidth * 0.08 + waveA,
      baseY - flameHeight * 0.73,
      cx - flameWidth * 0.67 + waveB,
      baseY - flameHeight * 0.3,
      cx - flameWidth * 0.46,
      baseY
    );
    ctx.quadraticCurveTo(cx, baseY + flameHeight * 0.07, cx + flameWidth * 0.46, baseY);
    ctx.bezierCurveTo(
      cx + flameWidth * 0.67 - waveA,
      baseY - flameHeight * 0.31,
      cx + flameWidth * 0.08 - waveB,
      baseY - flameHeight * 0.7,
      cx + tipDrift,
      baseY - flameHeight
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function spawnParticle(strength = 1) {
    if (particles.length > 72) return;

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.28;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.15;
    const speed = radius * (0.55 + Math.random() * 0.65) * strength;

    particles.push({
      x: cx + (Math.random() - 0.5) * radius * 0.58,
      y: cy + radius * (0.22 + Math.random() * 0.14),
      vx: Math.cos(angle) * speed * 0.28,
      vy: Math.sin(angle) * speed,
      hue: Math.random() * 360,
      life: 1,
      decay: 1.1 + Math.random() * 1.15,
      size: 1.2 + Math.random() * 2.4,
      phase: Math.random() * Math.PI * 2
    });
  }

  function spawnBurst(amount = 18) {
    for (let index = 0; index < amount; index += 1) {
      spawnParticle(1.05 + Math.random() * 0.5);
    }
  }

  function drawParticles(time, dt) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      const previousX = particle.x;
      const previousY = particle.y;

      particle.vx += Math.sin(time * 0.008 + particle.phase) * 3.2 * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= particle.decay * dt;
      particle.hue += 95 * dt;

      const alpha = Math.max(0, particle.life);
      ctx.strokeStyle = hsla(particle.hue, 100, 70, alpha * 0.48);
      ctx.lineWidth = Math.max(0.7, particle.size * 0.65);
      ctx.shadowBlur = 8;
      ctx.shadowColor = hsla(particle.hue, 100, 62, alpha);
      ctx.beginPath();
      ctx.moveTo(previousX, previousY);
      ctx.lineTo(particle.x, particle.y);
      ctx.stroke();

      ctx.fillStyle = hsla(particle.hue + 35, 100, 78, alpha * 0.95);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();

      if (particle.life <= 0 || particle.y < height * 0.08) particles.splice(index, 1);
    }

    ctx.restore();
  }

  function reset() {
    particles.length = 0;
    ctx.clearRect(0, 0, width, height);
    lastSpawnAt = 0;
  }

  function frame(time) {
    resize();
    const active = syncVisibility();
    const dt = Math.min(0.034, Math.max(0.001, (time - lastTime) / 1000));
    lastTime = time;
    ctx.clearRect(0, 0, width, height);

    if (!active) {
      if (particles.length) reset();
      wasActive = false;
      requestAnimationFrame(frame);
      return;
    }

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.28;
    const baseY = cy + radius * 0.56;
    const hueBase = time * 0.082;

    if (!wasActive) spawnBurst(26);
    wasActive = true;

    const halo = ctx.createRadialGradient(cx, cy, radius * 0.12, cx, cy, radius * 1.34);
    halo.addColorStop(0, hsla(hueBase + 45, 100, 72, 0.32));
    halo.addColorStop(0.34, hsla(hueBase + 160, 100, 64, 0.2));
    halo.addColorStop(0.67, hsla(hueBase + 275, 100, 62, 0.13));
    halo.addColorStop(1, hsla(hueBase, 100, 55, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    drawFlameLobe(cx, baseY, radius * 0.7, radius * 1.16, time, hueBase + 10, 0.4, 0.68);
    drawFlameLobe(cx + Math.sin(time * 0.0027) * radius * 0.09, baseY - radius * 0.03, radius * 0.54, radius * 0.96, time, hueBase + 105, 2.2, 0.76);
    drawFlameLobe(cx - Math.sin(time * 0.0038) * radius * 0.07, baseY - radius * 0.07, radius * 0.4, radius * 0.74, time, hueBase + 205, 4.5, 0.88);
    drawFlameLobe(cx, baseY - radius * 0.12, radius * 0.24, radius * 0.5, time, hueBase + 305, 6.1, 0.96);

    if (time - lastSpawnAt > 54) {
      spawnParticle(0.9 + Math.random() * 0.45);
      if (Math.random() < 0.28) spawnParticle(0.85 + Math.random() * 0.35);
      lastSpawnAt = time;
    }

    drawParticles(time, dt);
    requestAnimationFrame(frame);
  }

  new MutationObserver(() => {
    const active = syncVisibility();
    if (!active) reset();
  }).observe(button, {
    attributes: true,
    attributeFilter: ['class', 'data-flame-type']
  });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  syncVisibility();
  requestAnimationFrame(frame);
})();
