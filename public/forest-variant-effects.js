'use strict';

(() => {
  if (window.__forestVariantEffectsLoaded) return;
  window.__forestVariantEffectsLoaded = true;

  const button = document.getElementById('ignitionButton');
  if (!button) return;

  button.style.isolation = 'isolate';

  const canvas = document.createElement('canvas');
  canvas.id = 'forestVariantCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '154%',
    height: '154%',
    transform: 'translate(-50%, -50%)',
    zIndex: '8',
    pointerEvents: 'none',
    opacity: '0',
    visibility: 'hidden',
    transition: 'opacity 240ms ease',
    mixBlendMode: 'screen'
  });
  button.appendChild(canvas);

  const style = document.createElement('style');
  style.textContent = `
    #ignitionButton.lit[data-flame-type="forest"][data-flame-variant="forest-firefly"] #forestVariantCanvas,
    #ignitionButton.lit[data-flame-type="forest"][data-flame-variant="forest-vida"] #forestVariantCanvas {
      opacity: 1 !important;
      visibility: visible !important;
    }

    #ignitionButton.lit[data-flame-type="forest"][data-flame-variant="forest-firefly"] #persistentFlameCanvas {
      filter:
        saturate(1.24)
        brightness(1.15)
        drop-shadow(0 0 10px rgba(215,255,126,.3))
        drop-shadow(0 0 22px rgba(115,238,128,.18));
    }

    #ignitionButton.lit[data-flame-type="forest"][data-flame-variant="forest-firefly"] .ignition-core {
      box-shadow:
        inset 0 0 38px rgba(208,255,113,.08),
        0 0 54px rgba(179,255,105,.17) !important;
    }

    #ignitionButton.lit[data-flame-type="forest"][data-flame-variant="forest-vida"] #persistentFlameCanvas {
      transform-origin: 50% 70%;
      animation: forest-vida-breathe 4.4s ease-in-out infinite !important;
      filter:
        hue-rotate(-15deg)
        saturate(1.02)
        brightness(1.07)
        drop-shadow(0 0 12px rgba(73,205,116,.28))
        drop-shadow(0 0 28px rgba(24,121,81,.22));
    }

    #ignitionButton.lit[data-flame-type="forest"][data-flame-variant="forest-vida"] .ignition-core {
      background:
        radial-gradient(circle at 50% 43%, rgba(208,255,215,.2), transparent 16%),
        radial-gradient(circle, rgba(62,191,103,.2), rgba(18,93,61,.18) 48%, rgba(5,20,18,.98) 79%) !important;
      box-shadow:
        inset 0 0 52px rgba(98,230,131,.1),
        0 0 76px rgba(35,166,96,.24) !important;
      animation: forest-vida-core 4.4s ease-in-out infinite !important;
    }

    #ignitionButton.lit[data-flame-type="forest"][data-flame-variant="forest-vida"] .ignition-ring {
      border-color: rgba(98,218,139,.66) !important;
      box-shadow:
        0 0 17px rgba(75,214,122,.3),
        0 0 43px rgba(23,127,79,.22),
        inset 0 0 28px rgba(109,229,143,.12) !important;
    }

    @keyframes forest-vida-breathe {
      0%, 100% { transform: scale(.985) translateY(1px); filter: hue-rotate(-15deg) saturate(.94) brightness(.92); }
      50% { transform: scale(1.045) translateY(-2px); filter: hue-rotate(-10deg) saturate(1.16) brightness(1.24); }
    }

    @keyframes forest-vida-core {
      0%, 100% { transform: scale(.99); opacity: .82; }
      50% { transform: scale(1.035); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  const ctx = canvas.getContext('2d');
  const particles = [];
  let width = 1;
  let height = 1;
  let dpr = 1;
  let lastTime = performance.now();
  let lastFireflyAt = 0;
  let lastVidaAt = 0;

  function variantId() {
    return button.dataset.flameVariant || '';
  }

  function isActive() {
    if (!button.classList.contains('lit') || button.dataset.flameType !== 'forest') return false;
    return variantId() === 'forest-firefly' || variantId() === 'forest-vida';
  }

  function syncVisibility() {
    const active = isActive();
    canvas.style.opacity = active ? '1' : '0';
    canvas.style.visibility = active ? 'visible' : 'hidden';
    return active;
  }

  function resize() {
    const rect = button.getBoundingClientRect();
    const cssSize = Math.max(1, Math.max(rect.width, rect.height) * 1.54);
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

  function spawnFirefly(amount = 1) {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.29;

    for (let index = 0; index < amount && particles.length < 42; index += 1) {
      particles.push({
        kind: 'firefly',
        x: cx + (Math.random() - 0.5) * radius * 1.45,
        y: cy + radius * (-0.18 + Math.random() * 0.96),
        vx: (Math.random() - 0.5) * radius * 0.055,
        vy: -radius * (0.018 + Math.random() * 0.045),
        life: 1,
        decay: 0.16 + Math.random() * 0.18,
        size: 1.1 + Math.random() * 2.15,
        phase: Math.random() * Math.PI * 2,
        flickerSpeed: 0.007 + Math.random() * 0.009
      });
    }
  }

  function spawnVidaMote(amount = 1) {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.29;

    for (let index = 0; index < amount && particles.length < 34; index += 1) {
      particles.push({
        kind: 'vida',
        x: cx + (Math.random() - 0.5) * radius * 0.92,
        y: cy + radius * (0.08 + Math.random() * 0.55),
        vx: (Math.random() - 0.5) * radius * 0.035,
        vy: -radius * (0.035 + Math.random() * 0.06),
        life: 1,
        decay: 0.2 + Math.random() * 0.2,
        size: 1.8 + Math.random() * 2.6,
        phase: Math.random() * Math.PI * 2,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 1.8
      });
    }
  }

  function drawFirefly(particle, time) {
    const alpha = Math.max(0, particle.life);
    const flicker = 0.28 + ((Math.sin(time * particle.flickerSpeed + particle.phase) + 1) / 2) * 0.72;

    ctx.fillStyle = `rgba(229,255,128,${alpha * flicker})`;
    ctx.shadowBlur = 15 + flicker * 8;
    ctx.shadowColor = `rgba(204,255,93,${alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * (0.72 + flicker * 0.38), 0, Math.PI * 2);
    ctx.fill();
  }

  function drawVidaMote(particle, time) {
    const alpha = Math.max(0, particle.life);
    const pulse = 0.7 + Math.sin(time * 0.0045 + particle.phase) * 0.3;

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.angle);
    ctx.fillStyle = `rgba(104,229,137,${alpha * pulse})`;
    ctx.shadowBlur = 13;
    ctx.shadowColor = `rgba(50,192,104,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, particle.size * 1.65, particle.size * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawVidaHalo(time) {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.29;
    const breath = (Math.sin(time * 0.00142 - Math.PI / 2) + 1) / 2;

    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.14, cx, cy, radius * (1.03 + breath * 0.16));
    gradient.addColorStop(0, `rgba(144,246,158,${0.08 + breath * 0.12})`);
    gradient.addColorStop(0.46, `rgba(45,175,104,${0.06 + breath * 0.11})`);
    gradient.addColorStop(1, 'rgba(8,78,55,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function reset() {
    particles.length = 0;
    ctx.clearRect(0, 0, width, height);
    lastFireflyAt = 0;
    lastVidaAt = 0;
  }

  function frame(time) {
    resize();
    const active = syncVisibility();
    const dt = Math.min(0.034, Math.max(0.001, (time - lastTime) / 1000));
    lastTime = time;
    ctx.clearRect(0, 0, width, height);

    if (!active) {
      if (particles.length) reset();
      requestAnimationFrame(frame);
      return;
    }

    const currentVariant = variantId();

    if (currentVariant === 'forest-firefly') {
      if (!lastFireflyAt || time - lastFireflyAt > 620 + Math.random() * 880) {
        spawnFirefly(Math.random() < 0.24 ? 2 : 1);
        lastFireflyAt = time;
      }
    } else if (currentVariant === 'forest-vida') {
      drawVidaHalo(time);
      if (!lastVidaAt || time - lastVidaAt > 240 + Math.random() * 360) {
        spawnVidaMote(Math.random() < 0.3 ? 2 : 1);
        lastVidaAt = time;
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.x += (particle.vx + Math.sin(time * 0.0026 + particle.phase) * 4.2) * dt;
      particle.y += particle.vy * dt;
      particle.life -= particle.decay * dt;

      if (particle.kind === 'firefly') {
        drawFirefly(particle, time);
      } else {
        particle.angle += particle.spin * dt;
        drawVidaMote(particle, time);
      }

      if (particle.life <= 0 || particle.y < height * 0.06) particles.splice(index, 1);
    }

    ctx.restore();
    requestAnimationFrame(frame);
  }

  new MutationObserver(() => {
    if (!syncVisibility()) reset();
  }).observe(button, {
    attributes: true,
    attributeFilter: ['class', 'data-flame-type', 'data-flame-variant']
  });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  syncVisibility();
  requestAnimationFrame(frame);
})();
