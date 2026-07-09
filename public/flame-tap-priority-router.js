'use strict';

(() => {
  if (window.__flameTapPriorityRouterLoaded) return;
  window.__flameTapPriorityRouterLoaded = true;

  const originalFetch = window.fetch.bind(window);
  const button = document.getElementById('ignitionButton');
  const card = document.getElementById('flameCard');
  const nameNode = document.getElementById('flameName');
  const sigilNode = document.getElementById('flameSigil');

  const META = {
    ember: ['恆星火', ['#fff0a8', '#ff9f43', '#ff4d2e', '#7e1f2b'], '☀'],
    azure: ['疾風火', ['#e9ffff', '#69e7ff', '#168cff', '#3927a8'], '↯'],
    dream: ['夢燼', ['#fff0ff', '#ff8bd8', '#9a5cff', '#43206f'], '☾'],
    forest: ['森靈火', ['#f2ffd5', '#9cff64', '#1fd69a', '#15665c'], '✤'],
    spark: ['星火', ['#ffffff', '#ffe47d', '#ff9d42', '#e64535'], '✦'],
    rainbow: ['虹焰', ['#ff5c5c', '#ffd65c', '#48e48d', '#6b71ff'], '◉'],
    frost: ['霜晶火', ['#f7ffff', '#b8f4ff', '#4fc3ff', '#5b7cff'], '❄'],
    thunder: ['雷脈火', ['#fff9b0', '#ffd60a', '#9d4edd', '#3a0ca3'], 'ϟ'],
    tide: ['潮汐火', ['#d9fff8', '#4ee3c4', '#00a8cc', '#224d8f'], '≋'],
    heart: ['心願火', ['#fff2f8', '#ffadd2', '#ff5ca8', '#9b245f'], '♡'],
    dark: ['黯火', ['#e9e4ff', '#7660b8', '#2a1d45', '#050308'], '◈'],
    'blue-party': ['歸藍趴火', ['#effcff', '#6ee7ff', '#147cff', '#2720a8'], '♬'],
    dawn: ['破曉火', ['#fffdf0', '#ffe08a', '#ff9f5a', '#d84a32'], '☼'],
    echo: ['回聲火', ['#f7fbff', '#b9ddff', '#7f76ff', '#30236f'], '◎'],
    'pure-spark': ['純正星火', ['#ffffff', '#fff7c7', '#ffd95e', '#ff8b35'], '✧']
  };

  const PRIORITY = {
    2: { dark: 100 },
    3: { ember: 30, azure: 30, dream: 30, forest: 30, spark: 30 },
    4: { rainbow: 80, frost: 75, ember: 30, azure: 30, dream: 30, forest: 30, spark: 30 },
    5: { thunder: 90, rainbow: 80, frost: 75, ember: 30, azure: 30, dream: 30, forest: 30, spark: 30 },
    6: { heart: 96, echo: 94, tide: 92, thunder: 90, rainbow: 80, frost: 75, ember: 30, azure: 30, dream: 30, forest: 30, spark: 30 },
    7: { 'blue-party': 100, rainbow: 80, frost: 75, ember: 30, azure: 30, dream: 30, forest: 30, spark: 30 },
    8: { rainbow: 80, frost: 75, ember: 30, azure: 30, dream: 30, forest: 30, spark: 30 },
    9: { rainbow: 80, frost: 75, ember: 30, azure: 30, dream: 30, forest: 30, spark: 30 },
    10: { 'pure-spark': 110, dawn: 105, rainbow: 80, frost: 75, ember: 30, azure: 30, dream: 30, forest: 30, spark: 30 }
  };

  const BASE_TYPES = new Set(['ember', 'azure', 'dream', 'forest', 'spark']);

  function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function spread(values) {
    return values.length ? Math.max(...values) / Math.max(1, Math.min(...values)) : 1;
  }

  function deviation(values) {
    if (values.length < 2) return 0;
    const average = mean(values);
    return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
  }

  function fast(values, min = 35, max = 340, ratio = 2.1) {
    return values.length > 0
      && values.every((value) => value >= min && value <= max)
      && spread(values) <= ratio;
  }

  function matchHeart(values) {
    if (values.length !== 5) return false;
    const quick = [values[0], values[1], values[3], values[4]];
    return fast([values[0], values[1]], 35, 340, 2)
      && fast([values[3], values[4]], 35, 340, 2)
      && spread(quick) <= 2.15
      && values[2] >= Math.max(340, mean(quick) * 1.7)
      && values[2] <= 1450;
  }

  function matchEcho(values) {
    if (values.length !== 5) return false;
    const quick = [values[0], values[2], values[4]];
    const pauses = [values[1], values[3]];
    return fast(quick, 35, 360, 2.1)
      && pauses.every((value) => value >= 250 && value <= 1220)
      && spread(pauses) <= 1.8
      && mean(pauses) >= mean(quick) * 1.55;
  }

  function matchTide(values) {
    if (values.length !== 5) return false;
    const [a, b, c, d, e] = values;
    return a > b
      && b > c
      && c < d
      && d < e
      && c >= 35
      && c <= Math.min(a, e) * 0.84
      && spread(values) <= 3.4;
  }

  function matchThunder(values) {
    if (values.length < 4 || values.length > 5) return false;
    return [0, 1].some((offset) => {
      const quick = [];
      const pauses = [];
      values.forEach((value, index) => ((index + offset) % 2 === 0 ? quick : pauses).push(value));
      return quick.length >= 2
        && pauses.length >= 2
        && fast(quick, 35, 340, 2.15)
        && pauses.every((value) => value >= 250 && value <= 1200)
        && mean(pauses) >= mean(quick) * 1.7;
    });
  }

  function matchTrend(values, accelerating) {
    if (values.length < 3) return false;
    let matches = 0;
    for (let index = 1; index < values.length; index += 1) {
      if (accelerating ? values[index] <= values[index - 1] * 0.99 : values[index] >= values[index - 1] * 1.01) {
        matches += 1;
      }
    }
    return matches >= values.length - 1
      && (accelerating
        ? values.at(-1) <= values[0] * 0.74 && mean(values) <= 440
        : values.at(-1) >= values[0] * 1.34 && mean(values) >= 210);
  }

  function classifyBase(values) {
    if (!values.length) return 'spark';
    const average = mean(values);
    const variation = average ? deviation(values) / average : 0;
    if (average < 290) return 'azure';
    if (average > 720) return 'dream';
    if (variation < 0.13) return 'ember';

    const changes = [];
    for (let index = 1; index < values.length; index += 1) {
      changes.push(Math.abs(values[index] - values[index - 1]) / Math.max(values[index], values[index - 1]));
    }
    return variation > 0.42 || mean(changes) > 0.38 ? 'forest' : 'spark';
  }

  function trendOrBase(values) {
    if (matchTrend(values, true)) return 'rainbow';
    if (matchTrend(values, false)) return 'frost';
    return classifyBase(values);
  }

  function getTapCount(flame) {
    const explicit = Number(flame?.tapCount);
    if (Number.isInteger(explicit) && explicit > 0) return explicit;
    const rhythm = Array.isArray(flame?.rhythm) ? flame.rhythm : [];
    return rhythm.length + 1;
  }

  function chooseType(flame, tapCount) {
    const values = Array.isArray(flame?.rhythm)
      ? flame.rhythm.map(Number).filter(Number.isFinite)
      : [];

    if (tapCount === 2) return flame.type === 'dark' ? 'dark' : classifyBase(values);
    if (tapCount === 3) return classifyBase(values);
    if (tapCount === 4) return trendOrBase(values);

    if (tapCount === 5) {
      if (matchThunder(values)) return 'thunder';
      return trendOrBase(values);
    }

    if (tapCount === 6) {
      if (matchHeart(values)) return 'heart';
      if (matchEcho(values)) return 'echo';
      if (matchTide(values)) return 'tide';
      if (matchThunder(values)) return 'thunder';
      return trendOrBase(values);
    }

    if (tapCount === 7) {
      if (flame.type === 'blue-party' && flame.rhythmSignature === 'seven-short-taps') return 'blue-party';
      return trendOrBase(values);
    }

    if (tapCount === 10) {
      if (flame.type === 'pure-spark' && flame.rhythmSignature === 'two-short-four-short-four-short') return 'pure-spark';
      if (flame.type === 'dawn' && flame.rhythmSignature === 'one-two-three-four-rising-rhythm') return 'dawn';
      return trendOrBase(values);
    }

    if (tapCount === 8 || tapCount === 9 || tapCount > 10) return trendOrBase(values);
    return BASE_TYPES.has(flame.type) ? flame.type : trendOrBase(values);
  }

  function applyType(flame, type, tapCount) {
    const meta = META[type] || META.spark;
    const rank = PRIORITY[tapCount]?.[type] ?? (BASE_TYPES.has(type) ? 30 : 0);
    const preserveSpecialText = type === 'pure-spark' || type === 'dawn';

    return {
      ...flame,
      type,
      name: meta[0],
      colors: meta[1],
      description: preserveSpecialText ? flame.description : flame.description,
      specialFlame: !BASE_TYPES.has(type),
      tapCount,
      priorityAtTapCount: tapCount,
      priorityRank: rank,
      priorityRule: `${tapCount}-tap-priority`
    };
  }

  function applyUi(flame) {
    const meta = META[flame.type] || META.spark;
    if (button) {
      button.dataset.flameType = flame.type;
      button.style.setProperty('--flame-primary', meta[1][1] || meta[1][0]);
      button.style.setProperty('--flame-secondary', meta[1][2] || meta[1][1]);
    }
    if (card) {
      card.dataset.flameType = flame.type;
      card.style.setProperty('--flame-primary', meta[1][1] || meta[1][0]);
      card.style.setProperty('--flame-secondary', meta[1][2] || meta[1][1]);
    }
    if (nameNode) nameNode.textContent = meta[0];
    if (sigilNode) sigilNode.textContent = meta[2];
  }

  function scheduleUi(flame) {
    [0, 120, 360, 760].forEach((delay) => window.setTimeout(() => applyUi(flame), delay));
  }

  window.fetch = async (input, init = {}) => {
    let nextInit = init;
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/flame') && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (body.flame && typeof body.flame === 'object') {
          const tapCount = getTapCount(body.flame);
          const type = chooseType(body.flame, tapCount);
          const routed = applyType(body.flame, type, tapCount);
          body.flame = routed;
          nextInit = { ...init, body: JSON.stringify(body) };
          if (type !== init?.flame?.type) scheduleUi(routed);
        }
      } catch {
        // Leave unrelated requests untouched.
      }
    }

    return originalFetch(input, nextInit);
  };
})();
