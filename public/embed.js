/**
 * ChatBot Studio — Embed SDK v1.0
 * Lightweight launcher that lazy-loads the widget iframe on demand.
 *
 * Usage:
 *   <script>
 *     window.$chatbot = { id: "YOUR_EMBED_TOKEN", color: "#0a84ff", position: "bottom-right" };
 *   </script>
 *   <script src="https://yourapp.lovable.app/embed.js" async></script>
 *
 * API:
 *   window.ChatBotStudio.open()
 *   window.ChatBotStudio.close()
 *   window.ChatBotStudio.toggle()
 *   window.ChatBotStudio.setUser({ name, email })
 */
(function () {
  'use strict';

  var cfg = window.$chatbot || {};
  if (!cfg.id) {
    console.warn('[ChatBotStudio] Missing embed token. Set window.$chatbot = { id: "YOUR_TOKEN" }');
    return;
  }

  var COLOR = cfg.color || '#0a84ff';
  var POSITION = cfg.position || 'bottom-right';
  var ORIGIN = cfg.origin || (function () {
    var s = document.currentScript;
    if (s && s.src) {
      var u = new URL(s.src);
      return u.origin;
    }
    return window.location.origin;
  })();

  var WIDGET_URL = ORIGIN + '/widget/' + cfg.id;
  var MOBILE_BP = 640;

  // State
  var isOpen = false;
  var iframe = null;
  var iframeLoaded = false;
  var userMeta = null;

  // ---- Helpers ----
  function isMobile() {
    return window.innerWidth <= MOBILE_BP;
  }

  function positionStyles() {
    var pos = { position: 'fixed', zIndex: '2147483647' };
    if (POSITION === 'bottom-left') {
      pos.bottom = '20px';
      pos.left = '20px';
    } else {
      pos.bottom = '20px';
      pos.right = '20px';
    }
    return pos;
  }

  function applyStyles(el, styles) {
    for (var k in styles) {
      if (styles.hasOwnProperty(k)) el.style[k] = styles[k];
    }
  }

  // ---- Launcher bubble ----
  var bubble = document.createElement('div');
  bubble.id = 'cbs-bubble';
  bubble.setAttribute('role', 'button');
  bubble.setAttribute('tabindex', '0');
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';

  applyStyles(bubble, Object.assign({}, positionStyles(), {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: COLOR,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    border: 'none',
    outline: 'none',
    userSelect: 'none',
  }));

  bubble.addEventListener('mouseenter', function () { bubble.style.transform = 'scale(1.08)'; });
  bubble.addEventListener('mouseleave', function () { bubble.style.transform = isOpen ? 'scale(0)' : 'scale(1)'; });
  bubble.addEventListener('click', toggle);
  bubble.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });

  document.body.appendChild(bubble);

  // ---- Container ----
  var container = document.createElement('div');
  container.id = 'cbs-container';

  function updateContainerStyles() {
    var mobile = isMobile();
    var base = mobile
      ? { position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', width: '100%', height: '100%', borderRadius: '0' }
      : Object.assign({}, positionStyles(), { width: '400px', height: '600px', bottom: '88px', borderRadius: '16px' });

    applyStyles(container, Object.assign(base, {
      zIndex: '2147483646',
      overflow: 'hidden',
      boxShadow: mobile ? 'none' : '0 8px 32px rgba(0,0,0,0.3)',
      display: 'none',
      opacity: '0',
      transform: mobile ? 'translateY(100%)' : 'translateY(12px) scale(0.96)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
    }));
  }
  updateContainerStyles();
  document.body.appendChild(container);

  window.addEventListener('resize', function () {
    if (isOpen) updateContainerStyles();
  });

  // ---- Iframe (lazy) ----
  function ensureIframe() {
    if (iframe) return;
    iframe = document.createElement('iframe');
    iframe.src = WIDGET_URL;
    iframe.setAttribute('title', 'Chat Widget');
    iframe.setAttribute('allow', 'clipboard-write');
    applyStyles(iframe, {
      width: '100%',
      height: '100%',
      border: 'none',
      background: '#000',
    });
    container.appendChild(iframe);

    iframe.addEventListener('load', function () {
      iframeLoaded = true;
      sendToWidget({ type: 'cbs:init', theme: cfg.theme || 'dark', user: userMeta });
    });
  }

  // ---- PostMessage bridge ----
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'cbs:close') close();
  });

  function sendToWidget(msg) {
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(msg, '*');
    }
  }

  // ---- Open / Close / Toggle ----
  function open() {
    if (isOpen) return;
    isOpen = true;
    ensureIframe();
    container.style.display = 'block';
    bubble.style.transform = 'scale(0)';
    bubble.style.pointerEvents = 'none';

    // Force reflow then animate
    container.offsetHeight; // eslint-disable-line no-unused-expressions
    container.style.opacity = '1';
    container.style.transform = isMobile() ? 'translateY(0)' : 'translateY(0) scale(1)';
    bubble.setAttribute('aria-label', 'Close chat');
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    container.style.opacity = '0';
    container.style.transform = isMobile() ? 'translateY(100%)' : 'translateY(12px) scale(0.96)';
    bubble.style.transform = 'scale(1)';
    bubble.style.pointerEvents = 'auto';
    bubble.setAttribute('aria-label', 'Open chat');

    setTimeout(function () {
      if (!isOpen) container.style.display = 'none';
    }, 260);
  }

  function toggle() {
    isOpen ? close() : open();
  }

  // ---- Public API ----
  window.ChatBotStudio = {
    open: open,
    close: close,
    toggle: toggle,
    setUser: function (u) {
      userMeta = u;
      if (iframeLoaded) sendToWidget({ type: 'cbs:user', user: u });
    },
  };
})();
