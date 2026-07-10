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
    width: '184%',
    height: '184%',
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
    const cssSize = Math.max(1, Math.max(rect.width, rect.height) * 1.84);
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

  function spawnElectron(strength = 1, side = 0) {
    if (particles.length > 84) return;

    const cx = width / 2;
    const cy = height / 2;
    const direction = side || (Math.random() < 0.5 ? -1 : 1);
    const speed = width * (0.34 + Math.random() * 0.24) * strength;
    const horizontalRatio = 0.58 + Math.random() * 0.34;
    const verticalRatio = 0.34 + Math.random() * 0.48;
    const color = ELECTRON_COLORS[Math.floor(Math.random() * ELECTRON_COLORS.length)];
    const size = 0.85 + Math.random() * 1.7;
    const startRadius = width * (0.022 + Math.random() * 0.025);

    const x = cx + direction * startRadius;
    const y = cy + (Math.random() - 0.5) * width * 0.025;

    particles.push({
      x,
      y,
      previousX: x,
      previousY: y,
      vx: direction * speed * horizontalRatio,
      vy: -speed * verticalRatio,
      gravity: width * (0.82 + Math.random() * 0.34),
      drag: 0.992 - Math.random() * 0.006,
      life: 1,
      decay: 0.72 + Math.random() * 0.36,
      size,
      color,
      flicker: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 18
    });
  }

  function spawnBurst(amount = 14, strength = 1) {
    for (let index = 0; index < amount; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      spawnElectron(strength * (0.9 + Math.random() * 0.26), side);
    }
  }

  function reset() {
    particles.length = 0;
    ctx.clearRect(0, 0, width, height);
    lastSpawnAt = 0;
    nextBurstAt = 0;
  }

  function drawParticle(particle, time) {
    const alpha = Math.max(0, particle.life);
    const flicker = 0.72 + Math.sin(time * 0.026 + particle.flicker) * 0.28;
    const tailX = particle.previousX;
    const tailY = particle.previousY;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';

    ctx.strokeStyle = rgba(particle.color, alpha * 0.18 * flicker);
    ctx.lineWidth = particle.size * 5.4;
    ctx.shadowBlur = 19;
    ctx.shadowColor = rgba(particle.color, alpha * 0.95);
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();

    ctx.strokeStyle = rgba(particle.color, alpha * 0.9 * flicker);
    ctx.lineWidth = particle.size * 1.05;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.98})`;
    ctx.shadowBlur = 13;
    ctx.shadowColor = rgba(particle.color, alpha);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * (0.72 + alpha * 0.46), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function frame(time) {
    resize();
    const active = syncVisibility();
    const dt = Math.min(0.032, Math.max(0.001, (time - lastTime) / 1000));
    lastTime = time;

    ctx.clearRect(0, 0, width, height);

    if (active && !wasActive) {
      spawnBurst(26, 1.18);
      nextBurstAt = time + 760 + Math.random() * 520;
    }

    if (active) {
      if (time - lastSpawnAt > 70) {
        const count = Math.random() < 0.28 ? 2 : 1;
        for (let index = 0; index < count; index += 1) {
          spawnElectron(0.82 + Math.random() * 0.25);
        }
        lastSpawnAt = time;
      }

      if (!nextBurstAt || time >= nextBurstAt) {
        spawnBurst(8 + Math.floor(Math.random() * 7), 0.96 + Math.random() * 0.18);
        nextBurstAt = time + 900 + Math.random() * 900;
      }
    }

    const cx = width / 2;
    const cy = height / 2;

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.previousX = particle.x;
      particle.previousY = particle.y;

      particle.vy += particle.gravity * dt;
      particle.vx *= Math.pow(particle.drag, dt * 60);
      particle.vy *= Math.pow(0.997, dt * 60);
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.flicker += particle.spin * dt;
      particle.life -= particle.decay * dt;

      drawParticle(particle, time);

      const outsideHorizontal = particle.x < width * 0.02 || particle.x > width * 0.98;
      const belowCanvas = particle.y > height * 0.98;
      const distance = Math.hypot(particle.x - cx, particle.y - cy);
      if (particle.life <= 0 || outsideHorizontal || belowCanvas || distance > width * 0.62) {
        particles.splice(index, 1);
      }
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
