'use strict';

(() => {
  const button = document.getElementById('ignitionButton');
  if (!button) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'persistentFlameCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '4%',
    zIndex: '2',
    width: '92%',
    height: '92%',
    borderRadius: '50%',
    pointerEvents: 'none',
    mixBlendMode: 'screen'
  });
  button.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const particles = [];
  let cssWidth = 1;
  let cssHeight = 1;
  let dpr = 1;

  function resize() {
    const rect = button.getBoundingClientRect();
    cssWidth = Math.max(1, rect.width * 0.92);
    cssHeight = Math.max(1, rect.height * 0.92);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(cssWidth * dpr);
    const height = Math.round(cssHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function parseColor(value, fallback) {
    const color = String(value || '').trim();
    const hex = color.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
      const n = Number.parseInt(hex[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const rgb = color.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i);
    if (rgb) return rgb.slice(1, 4).map(Number);
    return fallback;
  }

  function rgba(rgb, alpha) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  function drawFlame(cx, baseY, width, height, rgb, time, phase, alpha) {
    const waveA = Math.sin(time * 0.004 + phase) * width * 0.11;
    const waveB = Math.sin(time * 0.0068 + phase * 1.6) * width * 0.07;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = rgba(rgb, 1);
    ctx.shadowBlur = 22;
    ctx.shadowColor = rgba(rgb, 0.9);
    ctx.beginPath();
    ctx.moveTo(cx, baseY - height);
    ctx.bezierCurveTo(
      cx - width * 0.08 + waveA,
      baseY - height * 0.72,
      cx - width * 0.64 + waveB,
      baseY - height * 0.32,
      cx - width * 0.45,
      baseY
    );
    ctx.quadraticCurveTo(cx, baseY + height * 0.08, cx + width * 0.45, baseY);
    ctx.bezierCurveTo(
      cx + width * 0.64 - waveA,
      baseY - height * 0.32,
      cx + width * 0.08 - waveB,
      baseY - height * 0.7,
      cx,
      baseY - height
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function spawnParticle(cx, cy, radius, colors) {
    if (particles.length > 42) return;
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push({
      x: cx + (Math.random() - 0.5) * radius * 0.56,
      y: cy + radius * 0.38 + Math.random() * 7,
      vx: (Math.random() - 0.5) * 0.34,
      vy: -(Math.random() * 0.85 + 0.45),
      life: 1,
      decay: Math.random() * 0.012 + 0.008,
      size: Math.random() * 2.7 + 0.8,
      color
    });
  }

  function clear() {
    particles.length = 0;
    ctx.clearRect(0, 0, cssWidth, cssHeight);
  }

  function frame(time) {
    resize();
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const lit = button.classList.contains('lit');
    if (!lit) {
      particles.length = 0;
      requestAnimationFrame(frame);
      return;
    }

    const styles = getComputedStyle(button);
    const primary = parseColor(styles.getPropertyValue('--flame-primary'), [255, 154, 72]);
    const secondary = parseColor(styles.getPropertyValue('--flame-secondary'), [255, 78, 53]);
    const light = primary.map((value) => Math.min(255, value + 80));
    const dark = secondary.map((value) => Math.max(0, value - 45));

    const cx = cssWidth / 2;
    const cy = cssHeight / 2;
    const radius = Math.min(cssWidth, cssHeight) * 0.43;
    const pulse = 1 + Math.sin(time * 0.0025) * 0.018;

    const halo = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.16);
    halo.addColorStop(0, rgba(primary, 0.18));
    halo.addColorStop(0.52, rgba(secondary, 0.12));
    halo.addColorStop(1, rgba(dark, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.14 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.96, 0, Math.PI * 2);
    ctx.clip();

    const baseY = cy + radius * 0.58;
    const phase = time * 0.00025;
    drawFlame(cx, baseY, radius * 0.72, radius * 1.15, dark, time, phase, 0.48);
    drawFlame(cx + Math.sin(time * 0.0022) * radius * 0.08, baseY - radius * 0.04, radius * 0.56, radius * 0.94, secondary, time, phase + 2.1, 0.78);
    drawFlame(cx - Math.sin(time * 0.0031) * radius * 0.06, baseY - radius * 0.08, radius * 0.39, radius * 0.72, primary, time, phase + 4.4, 0.93);
    drawFlame(cx, baseY - radius * 0.13, radius * 0.22, radius * 0.48, light, time, phase + 6.2, 0.98);

    const core = ctx.createRadialGradient(cx, cy + radius * 0.2, 0, cx, cy + radius * 0.2, radius * 0.45);
    core.addColorStop(0, rgba(light, 0.78));
    core.addColorStop(0.45, rgba(primary, 0.34));
    core.addColorStop(1, rgba(primary, 0));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.22, radius * 0.34, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.lineWidth = Math.max(1.5, radius * 0.025);
    ctx.strokeStyle = rgba(primary, 0.72);
    ctx.shadowBlur = 14;
    ctx.shadowColor = rgba(primary, 0.8);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (0.98 + Math.sin(time * 0.0022) * 0.012), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (Math.random() < 0.34) spawnParticle(cx, cy, radius, [light, primary, secondary]);

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      if (particle.life <= 0) {
        particles.splice(index, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = rgba(particle.color, 1);
      ctx.shadowBlur = 10;
      ctx.shadowColor = rgba(particle.color, 0.9);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(frame);
  }

  new MutationObserver(() => {
    if (!button.classList.contains('lit')) clear();
  }).observe(button, { attributes: true, attributeFilter: ['class', 'style'] });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(frame);
})();
