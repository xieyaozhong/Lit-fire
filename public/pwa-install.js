'use strict';

(() => {
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone()) {
    document.documentElement.classList.add('is-pwa');
    return;
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafari = /^((?!crios|fxios|edgios|opios).)*safari/i.test(navigator.userAgent);
  const dismissedAt = Number(localStorage.getItem('litFireInstallDismissedAt') || 0);
  const canShowIosGuide = Date.now() - dismissedAt > 1000 * 60 * 60 * 24 * 7;
  let deferredPrompt = null;

  const style = document.createElement('style');
  style.textContent = `
    .pwa-install-card {
      position: fixed;
      left: max(14px, env(safe-area-inset-left));
      right: max(14px, env(safe-area-inset-right));
      bottom: max(14px, env(safe-area-inset-bottom));
      z-index: 10000;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 14px 14px 14px 16px;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 18px;
      background: rgba(15,10,27,.94);
      color: #fff;
      box-shadow: 0 18px 50px rgba(0,0,0,.42);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      font-family: inherit;
    }
    .pwa-install-card strong { display:block; margin-bottom:4px; }
    .pwa-install-card p { margin:0; color:rgba(255,255,255,.72); font-size:13px; line-height:1.45; }
    .pwa-install-actions { display:flex; gap:8px; align-items:center; }
    .pwa-install-card button {
      min-height: 40px;
      border: 0;
      border-radius: 12px;
      padding: 0 13px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .pwa-install-primary { background:#ffb85c; color:#25140a; }
    .pwa-install-close { background:rgba(255,255,255,.1); color:#fff; }
    @media (max-width: 520px) {
      .pwa-install-card { grid-template-columns: 1fr; }
      .pwa-install-actions { justify-content:flex-end; }
    }
  `;
  document.head.appendChild(style);

  function removeCard() {
    document.querySelector('.pwa-install-card')?.remove();
  }

  function showCard({ title, message, actionLabel, onAction }) {
    removeCard();
    const card = document.createElement('aside');
    card.className = 'pwa-install-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', title);

    const copy = document.createElement('div');
    const strong = document.createElement('strong');
    const paragraph = document.createElement('p');
    strong.textContent = title;
    paragraph.textContent = message;
    copy.append(strong, paragraph);

    const actions = document.createElement('div');
    actions.className = 'pwa-install-actions';

    if (actionLabel && onAction) {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'pwa-install-primary';
      action.textContent = actionLabel;
      action.addEventListener('click', onAction);
      actions.appendChild(action);
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'pwa-install-close';
    close.textContent = '稍後';
    close.addEventListener('click', () => {
      localStorage.setItem('litFireInstallDismissedAt', String(Date.now()));
      removeCard();
    });
    actions.appendChild(close);

    card.append(copy, actions);
    document.body.appendChild(card);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showCard({
      title: '把傳火計畫安裝到主畫面',
      message: '安裝後會像 App 一樣全螢幕開啟，不需要 App Store。',
      actionLabel: '立即安裝',
      onAction: async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        removeCard();
      }
    });
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    removeCard();
  });

  window.addEventListener('load', () => {
    if (isIos && isSafari && canShowIosGuide) {
      window.setTimeout(() => {
        showCard({
          title: '安裝到 iPhone 主畫面',
          message: '點 Safari 下方的分享按鈕，再選「加入主畫面」。',
          actionLabel: '',
          onAction: null
        });
      }, 1400);
    }
  });
})();
