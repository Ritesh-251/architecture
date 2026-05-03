/**
 * Architect3D — Global Toast Notification System
 * Usage: A3D.toast.show("Saved!", "success")
 */
(function (global) {
  'use strict';

  // ── Ensure container ──
  function getContainer() {
    let c = document.getElementById('a3d-toasts');
    if (!c) {
      c = document.createElement('div');
      c.id = 'a3d-toasts';
      c.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
      document.body.appendChild(c);
    }
    return c;
  }

  const ICONS = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
  const COLORS = {
    success: '#00C9A7',
    error:   '#FF5A5F',
    info:    '#6C63FF',
    warning: '#F59E0B',
  };

  let activeCount = 0;
  const MAX_TOASTS = 3;

  function show(message, type = 'info', duration = 3000) {
    const container = getContainer();

    // Enforce max 3 toasts
    if (activeCount >= MAX_TOASTS) {
      const oldest = container.querySelector('.a3d-toast');
      if (oldest) dismiss(oldest);
    }

    const toast = document.createElement('div');
    toast.className = 'a3d-toast';
    toast.style.cssText = `
      pointer-events:all;
      display:flex;align-items:center;gap:12px;
      padding:14px 18px;
      background:#1C1C2E;
      border:1px solid rgba(255,255,255,0.15);
      border-left:3px solid ${COLORS[type] || COLORS.info};
      border-radius:14px;
      box-shadow:0 8px 32px rgba(0,0,0,0.5);
      font-family:'Inter','Outfit',sans-serif;
      font-size:14px;font-weight:500;
      color:#F0F0F5;
      transform:translateX(120%);
      transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
      max-width:360px;min-width:220px;
    `;

    const icon = document.createElement('span');
    icon.style.cssText = `font-size:16px;color:${COLORS[type]};flex-shrink:0;`;
    icon.textContent = ICONS[type] || 'ℹ';

    const text = document.createElement('span');
    text.style.flex = '1';
    text.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background:none;border:none;color:rgba(255,255,255,0.4);cursor:pointer;font-size:18px;line-height:1;padding:0 4px;margin-left:4px;';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => dismiss(toast);

    toast.appendChild(icon);
    toast.appendChild(text);
    toast.appendChild(closeBtn);
    container.appendChild(toast);
    activeCount++;

    // Animate in
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => dismiss(toast), duration);
    }

    return toast;
  }

  function dismiss(toast) {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
      activeCount = Math.max(0, activeCount - 1);
    }, 400);
  }

  // ── Expose ──
  global.A3D = global.A3D || {};
  global.A3D.toast = { show, dismiss };

})(window);
