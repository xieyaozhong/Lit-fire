'use strict';

(() => {
  if (window.__thunderElectronSparksLoaded) return;
  window.__thunderElectronSparksLoaded = true;

  const button = document.getElementById('ignitionButton');
  if (!button) return;

  button.style.isolation = 'isolate';

  const canvas = document.createElement('canvas');
  canvas.id = 'thunderElectronSparkCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '176%',
    height: '176%',
    transform: 'translate(-50%, -50%)',
    zIndex: '10',
    pointerEvents: 'none',
    transition: 'opacity 180ms ease',
    overflow: 'visible',
    mixBlendMode: 'screen'
  });
  button.appendChild(canvas);

  const style = document.createElement('style');
  style.textContent = `
    #thunderElectronSparkCanvas {
      opacity: 0;
      visibility: hidden;
    }

    #ignitionButton.lit[data-flame-type="thunder"] #thunderElectronSparkCanvas {
      opacity: 1 !important;
      visibility: visible !important;
    }
  `;
  document.head.appendChild(style);

  const ctx = canvas.getContext('2d');
  const particles = [];
  const ELECTRON_COLORS = [
    [255, 255, 246],
    [255, 232, 92],
    [144, 224, 255],
    [182, 135, 255]
  ];

  let width = 1;
  let height = 1;
  let dpr = 1;
  let lastTime = performance.now();
  let lastSpawnAt = 0;
  let nextBurstAt = 0;
  let wasActive = false;

  function isActive() {
    return button.classList.contains('lit') && button.dataset.flameType === 'thunder';
  }

  function syncVisibility() {
    const active = isActive();
    canvas.style.opacity = active ? '1' : '0';
    canvas.style.visibility = active ? 'visible' : 'hidden';
    return active;
  }

  function resize() {
    const rect = button.getBoundingClientRect();
    const cssSize = Math.max(1, Math.max(rect.width, rect.height) * 1.76);
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

  function rgba(color, alpha) {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  }

  function spawnElectron(strength = 1, forcedAngle = null) {
    if (particles.length > 78) return;

    const cx = width / 2;
    const cy = height / 2;
    const angle = forcedAngle ?? Math.random() * Math.PI * 2;
    const startRadius = width * (0.07 + Math.random() * 0.055);
    const speed = width * (0.42 + Math.random() * 0.38) * strength;
    const color = ELECTRON_COLORS[Math.floor(Math.random() * ELECTRON_COLORS.length)];
    const size = 0.8 + Math.random() * 1.6;

    const x = cx + Math.cos(angle) * startRadius;
    const y = cy + Math.sin(angle) * startRadius;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      life: 1,
      decay: 1.65 + Math.random() * 1.45,
      size,
      color,
      bend: (Math.random() - 0.5) * 8.5,
      jitter: 10 + Math.random() * 20,
      phase: Math.random() * Math.PI * 2,
      branchChance: 0.1 + Math.random() * 0.12
    });
  }

  function spawnBurst(amount = 12, strength = 1) {
    const offset = Math.random() * Math.PI * 2;
    for (let index = 0; index < amount; index += 1) {
      const angle = offset + (Math.PI * 2 * index) / amount + (Math.random() - 0.5) * 0.28;
      spawnElectron(strength * (0.88 + Math.random() * 0.3), angle);
    }
  }

  function reset() {
    particles.length = 0;
    ctx.clearRect(0, 0, width, height);
    lastSpawnAt = 0;
    nextBurstAt = 0;
  }

  function drawParticle(particle) {
    const alpha = Math.max(0, particle.life);
    const speed = Math.hypot(particle.vx, particle.vy);
    const tailScale = Math.min(1.9, 0.65 + speed / Math.max(1, width * 0.42));
    const tailX = particle.x - particle.vx * 0.017 * tailScale;
    const tailY = particle.y - particle.vy * 0.017 * tailScale;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';

    ctx.strokeStyle = rgba(particle.color, alpha * 0.18);
    ctx.lineWidth = particle.size * 5.2;
    ctx.shadowBlur = 18;
    ctx.shadowColor = rgba(particle.color, alpha * 0.9);
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();

    ctx.strokeStyle = rgba(particle.color, alpha * 0.82);
    ctx.lineWidth = particle.size * 1.05;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.96})`;
    ctx.shadowBlur = 12;
    ctx.shadowColor = rgba(particle.color, alpha);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * (0.75 + alpha * 0.4), 0, Math.PI * 2);
    ctx.fill();

    if (Math.random() < particle.branchChance * alpha) {
      const branchAngle = particle.angle + (Math.random() > 0.5 ? 1 : -1) * (0.55 + Math.random() * 0.55);
      const branchLength = width * (0.018 + Math.random() * 0.026) * alpha;
      ctx.strokeStyle = rgba(particle.color, alpha * 0.52);
      ctx.lineWidth = 0.65;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(
        particle.x + Math.cos(branchAngle) * branchLength,
        particle.y + Math.sin(branchAngle) * branchLength
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  function frame(time) {
    resize();
    const active = syncVisibility();
    const dt = Math.min(0.034, Math.max(0.001, (time - lastTime) / 1000));
    lastTime = time;

    ctx.clearRect(0, 0, width, height);

    if (active && !wasActive) {
      spawnBurst(22, 1.18);
      nextBurstAt = time + 650 + Math.random() * 450;
    }

    if (active) {
      if (time - lastSpawnAt > 45) {
        const count = Math.random() < 0.36 ? 2 : 1;
        for (let index = 0; index < count; index += 1) {
          spawnElectron(0.82 + Math.random() * 0.28);
        }
        lastSpawnAt = time;
      }

      if (!nextBurstAt || time >= nextBurstAt) {
        spawnBurst(10 + Math.floor(Math.random() * 8), 1.04 + Math.random() * 0.2);
        nextBurstAt = time + 720 + Math.random() * 680;
      }
    }

    const cx = width / 2;
    const cy = height / 2;
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      const radialAngle = Math.atan2(particle.y - cy, particle.x - cx);
      const bendWave = Math.sin(time * 0.018 + particle.phase) * particle.jitter;
      const tangentX = -Math.sin(radialAngle);
      const tangentY = Math.cos(radialAngle);

      particle.vx += tangentX * bendWave * dt;
      particle.vy += tangentY * bendWave * dt;
      particle.angle += particle.bend * dt * 0.035;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= particle.decay * dt;

      drawParticle(particle);

      const distance = Math.hypot(particle.x - cx, particle.y - cy);
      if (particle.life <= 0 || distance > width * 0.47) particles.splice(index, 1);
    }

    if (!active && particles.length === 0) reset();
    wasActive = active;
    requestAnimationFrame(frame);
  }

  new MutationObserver(() => {
    const active = syncVisibility();
    if (!active) {
      nextBurstAt = 0;
      if (!button.classList.contains('lit')) reset();
    }
  }).observe(button, {
    attributes: true,
    attributeFilter: ['class', 'data-flame-type']
  });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  syncVisibility();
  requestAnimationFrame(frame);
})();
