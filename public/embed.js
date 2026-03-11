/**
 * ChatBot Studio — Embed SDK v2.0
 * Production-grade launcher with lazy iframe, resize, expand, security, and mobile support.
 *
 * Usage:
 *   <script>
 *     window.$chatbot = {
 *       id: "YOUR_EMBED_TOKEN",
 *       color: "#0a84ff",
 *       position: "bottom-right",
 *       width: 400,          // optional, default 400
 *       height: 600,         // optional, default 600
 *       autoOpen: 5000       // optional, ms delay to auto-open
 *     };
 *   </script>
 *   <script src="https://yourapp.lovable.app/embed.js" async></script>
 *
 * API:
 *   window.ChatBotStudio.open()
 *   window.ChatBotStudio.close()
 *   window.ChatBotStudio.toggle()
 *   window.ChatBotStudio.expand()
 *   window.ChatBotStudio.collapse()
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
  var BASE_W = Math.min(Math.max(cfg.width || 400, 320), 700);
  var BASE_H = Math.min(Math.max(cfg.height || 600, 400), 900);
  var EXPAND_W = Math.min(BASE_W + 100, 700);
  var EXPAND_H = Math.min(BASE_H + 120, 900);

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
  var isExpanded = false;
  var iframe = null;
  var iframeLoaded = false;
  var userMeta = null;
  var hasUnread = false;

  // ---- Helpers ----
  function isMobile() {
    return window.innerWidth <= MOBILE_BP;
  }

  function positionProps() {
    var pos = {};
    if (POSITION === 'bottom-left') {
      pos.bottom = '20px'; pos.left = '20px';
    } else {
      pos.bottom = '20px'; pos.right = '20px';
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

  applyStyles(bubble, Object.assign({}, positionProps(), {
    position: 'fixed',
    zIndex: '2147483647',
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

  // Notification dot
  var dot = document.createElement('span');
  dot.id = 'cbs-dot';
  applyStyles(dot, {
    position: 'absolute',
    top: '2px',
    right: '2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#ff3b30',
    border: '2px solid #fff',
    display: 'none',
  });
  bubble.style.position = 'fixed'; // ensure relative context
  bubble.appendChild(dot);

  document.body.appendChild(bubble);

  // ---- Container ----
  var container = document.createElement('div');
  container.id = 'cbs-container';

  function getContainerStyles(forceHidden) {
    var mobile = isMobile();
    var w = isExpanded ? EXPAND_W : BASE_W;
    var h = isExpanded ? EXPAND_H : BASE_H;

    var base = mobile
      ? { position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', width: '100%', height: '100%', borderRadius: '0', resize: 'none' }
      : Object.assign({}, positionProps(), {
          position: 'fixed',
          width: w + 'px',
          height: h + 'px',
          bottom: '88px',
          borderRadius: '16px',
          resize: 'both',
          overflow: 'hidden',
          minWidth: '320px',
          minHeight: '400px',
          maxWidth: '700px',
          maxHeight: '900px',
        });

    base.zIndex = '2147483646';
    base.boxShadow = mobile ? 'none' : '0 8px 32px rgba(0,0,0,0.3)';

    if (forceHidden) {
      base.display = 'none';
      base.opacity = '0';
      base.transform = mobile ? 'translateY(100%)' : 'translateY(12px) scale(0.96)';
    }
    base.transition = 'opacity 0.25s ease, transform 0.25s ease, width 0.2s ease, height 0.2s ease';

    return base;
  }

  applyStyles(container, getContainerStyles(true));
  document.body.appendChild(container);

  // Fix: only update position/radius on resize, never reset display/opacity when open
  window.addEventListener('resize', function () {
    if (!isOpen) return;
    var mobile = isMobile();
    if (mobile) {
      applyStyles(container, { top: '0', left: '0', right: '0', bottom: '0', width: '100%', height: '100%', borderRadius: '0', resize: 'none' });
    } else {
      var w = isExpanded ? EXPAND_W : BASE_W;
      var h = isExpanded ? EXPAND_H : BASE_H;
      applyStyles(container, Object.assign({}, positionProps(), {
        width: w + 'px', height: h + 'px', bottom: '88px', borderRadius: '16px', resize: 'both',
      }));
    }
  });

  // ---- Escape key ----
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) close();
  });

  // ---- Iframe (lazy) ----
  function ensureIframe() {
    if (iframe) return;
    iframe = document.createElement('iframe');
    iframe.src = WIDGET_URL;
    iframe.setAttribute('title', 'Chat Widget');
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
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

  // ---- PostMessage bridge with origin validation ----
  window.addEventListener('message', function (e) {
    // Validate origin
    if (e.origin !== ORIGIN) return;
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'cbs:close') close();
    if (e.data.type === 'cbs:unread') showUnread();
  });

  function sendToWidget(msg) {
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(msg, ORIGIN);
    }
  }

  function showUnread() {
    if (isOpen) return;
    hasUnread = true;
    dot.style.display = 'block';
  }

  function clearUnread() {
    hasUnread = false;
    dot.style.display = 'none';
  }

  // ---- Open / Close / Toggle ----
  function open() {
    if (isOpen) return;
    isOpen = true;
    ensureIframe();
    clearUnread();

    applyStyles(container, getContainerStyles(false));
    container.style.display = 'block';
    container.style.overflow = 'hidden';
    bubble.style.transform = 'scale(0)';
    bubble.style.pointerEvents = 'none';

    // Force reflow then animate
    container.offsetHeight;
    container.style.opacity = '1';
    container.style.transform = isMobile() ? 'translateY(0)' : 'translateY(0) scale(1)';
    bubble.setAttribute('aria-label', 'Close chat');

    // Tell widget to focus input
    setTimeout(function () { sendToWidget({ type: 'cbs:focus' }); }, 300);
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

  function expand() {
    if (isExpanded || isMobile()) return;
    isExpanded = true;
    applyStyles(container, { width: EXPAND_W + 'px', height: EXPAND_H + 'px' });
    sendToWidget({ type: 'cbs:expanded', expanded: true });
  }

  function collapse() {
    if (!isExpanded) return;
    isExpanded = false;
    applyStyles(container, { width: BASE_W + 'px', height: BASE_H + 'px' });
    sendToWidget({ type: 'cbs:expanded', expanded: false });
  }

  // ---- Auto-open ----
  if (cfg.autoOpen && typeof cfg.autoOpen === 'number' && cfg.autoOpen > 0) {
    setTimeout(function () {
      if (!isOpen) open();
    }, cfg.autoOpen);
  }

  // ---- Public API ----
  window.ChatBotStudio = {
    open: open,
    close: close,
    toggle: toggle,
    expand: expand,
    collapse: collapse,
    setUser: function (u) {
      userMeta = u;
      if (iframeLoaded) sendToWidget({ type: 'cbs:user', user: u });
    },
  };
})();
