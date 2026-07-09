'use strict';

(() => {
  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  const nativeSetInterval = window.setInterval.bind(window);
  const nativeFetch = window.fetch.bind(window);
  const nativeGetContext = HTMLCanvasElement.prototype.getContext;

  const FRAME_INTERVAL = 1000 / 30;
  const lastFrameByCallback = new WeakMap();
  const timeoutByFrameId = new Map();
  let nextFrameId = 1;

  function scheduleFrame(callback) {
    const id = nextFrameId++;

    const tick = (timestamp) => {
      if (!timeoutByFrameId.has(id)) return;

      if (document.hidden) {
        const timeout = window.setTimeout(() => {
          timeoutByFrameId.set(id, nativeRequestAnimationFrame(tick));
        }, 220);
        timeoutByFrameId.set(id, timeout);
        return;
      }

      const lastFrame = lastFrameByCallback.get(callback) || 0;
      if (timestamp - lastFrame >= FRAME_INTERVAL - 1) {
        timeoutByFrameId.delete(id);
        lastFrameByCallback.set(callback, timestamp);
        callback(timestamp);
        return;
      }

      timeoutByFrameId.set(id, nativeRequestAnimationFrame(tick));
    };

    timeoutByFrameId.set(id, nativeRequestAnimationFrame(tick));
    return id;
  }

  window.requestAnimationFrame = scheduleFrame;
  window.cancelAnimationFrame = (id) => {
    const nativeId = timeoutByFrameId.get(id);
    timeoutByFrameId.delete(id);
    if (nativeId !== undefined) {
      nativeCancelAnimationFrame(nativeId);
      window.clearTimeout(nativeId);
    }
  };

  window.setInterval = (callback, delay = 0, ...args) => {
    const optimizedDelay = delay > 0 && delay < 1300 ? 1300 : delay;
    return nativeSetInterval(callback, optimizedDelay, ...args);
  };

  function createNoopGradient() {
    return { addColorStop() {} };
  }

  function createNoopContext(canvas) {
    const values = { canvas };
    const noop = () => {};
    return new Proxy(values, {
      get(target, property) {
        if (property in target) return target[property];
        if (property === 'createRadialGradient' || property === 'createLinearGradient' || property === 'createConicGradient') {
          return createNoopGradient;
        }
        if (property === 'measureText') return () => ({ width: 0 });
        return noop;
      },
      set(target, property, value) {
        target[property] = value;
        return true;
      }
    });
  }

  const disabledContexts = new WeakMap();
  HTMLCanvasElement.prototype.getContext = function optimizedGetContext(type, options) {
    if (this.id === 'flameCanvas' && type === '2d') {
      if (!disabledContexts.has(this)) disabledContexts.set(this, createNoopContext(this));
      this.dataset.rendererDisabled = 'true';
      return disabledContexts.get(this);
    }
    return nativeGetContext.call(this, type, options);
  };

  window.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    const nativeClone = response.clone.bind(response);
    const sharedSource = nativeClone();
    let sharedJsonPromise = null;

    response.clone = () => {
      const clone = nativeClone();
      clone.json = () => {
        if (!sharedJsonPromise) sharedJsonPromise = sharedSource.json();
        return sharedJsonPromise;
      };
      return clone;
    };

    return response;
  };

  const style = document.createElement('style');
  style.textContent = `
    #flameCanvas[data-renderer-disabled="true"] {
      display: none !important;
    }

    html.fire-page-hidden *,
    html.fire-page-hidden *::before,
    html.fire-page-hidden *::after {
      animation-play-state: paused !important;
    }

    @media (prefers-reduced-motion: reduce) {
      #ambientCanvas {
        opacity: 0.42;
      }
    }
  `;
  document.head.appendChild(style);

  function syncVisibility() {
    document.documentElement.classList.toggle('fire-page-hidden', document.hidden);
  }

  document.addEventListener('visibilitychange', syncVisibility, { passive: true });
  syncVisibility();
})();
