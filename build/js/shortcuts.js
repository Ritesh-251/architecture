/**
 * Architecture Master — Keyboard Shortcuts + Help Modal
 * Requires: toast.js, jQuery (for blueprint3d compat)
 */
(function (global) {
  'use strict';

  // ── Help Modal HTML ──
  const MODAL_HTML = `
<div id="kb-help-modal" style="
  display:none; position:fixed; inset:0; z-index:9998;
  background:rgba(0,0,0,0.7); backdrop-filter:blur(4px);
  align-items:center; justify-content:center;
">
  <div style="
    background:#13131F; border:1px solid rgba(255,255,255,0.12);
    border-radius:20px; padding:32px; width:100%; max-width:520px;
    box-shadow:0 32px 80px rgba(0,0,0,0.7);
    font-family:'Inter','Outfit',sans-serif; color:#F0F0F5;
  ">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
      <div style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;">Keyboard Shortcuts</div>
      <button onclick="A3D.help.close()" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:24px;cursor:pointer;line-height:1;">×</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${[
        ['Ctrl + S', 'Save design'],
        ['Ctrl + Z', 'Undo'],
        ['Ctrl + Y', 'Redo'],
        ['Ctrl + D', 'Duplicate element'],
        ['Ctrl + G', 'Toggle grid snap'],
        ['Ctrl + 3', 'Toggle 3D view'],
        ['Ctrl + E', 'Export menu'],
        ['Delete', 'Remove selected'],
        ['Escape', 'Deselect / close'],
        ['?', 'This help screen'],
      ].map(([key, desc]) => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
          <kbd style="background:rgba(108,99,255,0.2);border:1px solid rgba(108,99,255,0.4);border-radius:6px;padding:3px 8px;font-size:12px;font-weight:700;color:#818CF8;white-space:nowrap;">${key}</kbd>
          <span style="font-size:13px;color:rgba(240,240,245,0.7);">${desc}</span>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:20px;text-align:center;font-size:12px;color:rgba(255,255,255,0.3);">Press <kbd style="background:rgba(255,255,255,0.08);border-radius:4px;padding:1px 6px;">?</kbd> or <kbd style="background:rgba(255,255,255,0.08);border-radius:4px;padding:1px 6px;">Escape</kbd> to close</div>
  </div>
</div>`;

  function injectModal() {
    if (document.getElementById('kb-help-modal')) return;
    document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
  }

  function open() {
    injectModal();
    const m = document.getElementById('kb-help-modal');
    m.style.display = 'flex';
  }

  function close() {
    const m = document.getElementById('kb-help-modal');
    if (m) m.style.display = 'none';
  }

  // ── Keyboard handler ──
  document.addEventListener('keydown', function (e) {
    const tag = (e.target.tagName || '').toLowerCase();
    const inInput = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;

    // ? key — help (not in input)
    if (e.key === '?' && !inInput) { open(); return; }

    // Escape — close help modal / deselect
    if (e.key === 'Escape') {
      close();
      // Deselect in Blueprint3D if available
      if (global.blueprint3d && global.blueprint3d.three) {
        try { global.blueprint3d.three.itemSelectedCallbacks.fire(null); } catch (_) {}
      }
      return;
    }

    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;

    switch (e.key.toLowerCase()) {
      case 's':
        e.preventDefault();
        if (global.A3D && global.A3D.save) A3D.save();
        else if (global.A3DApi) A3DApi.cloudSave && A3DApi.cloudSave();
        break;

      case 'z':
        e.preventDefault();
        if (global.A3D && global.A3D.history) A3D.history.undo();
        break;

      case 'y':
        e.preventDefault();
        if (global.A3D && global.A3D.history) A3D.history.redo();
        break;

      case 'd':
        e.preventDefault();
        if (global.A3D && global.A3D.duplicate) A3D.duplicate();
        break;

      case 'g':
        e.preventDefault();
        if (global.A3D && global.A3D.toggleGrid) A3D.toggleGrid();
        break;

      case '3':
        e.preventDefault();
        const designBtn = document.getElementById('showDesign');
        const planBtn   = document.getElementById('showFloorPlan');
        if (designBtn && planBtn) {
          const in3d = designBtn.classList.contains('active');
          if (in3d) planBtn.click(); else designBtn.click();
        }
        break;

      case 'e':
        e.preventDefault();
        if (global.A3D && global.A3D.export) A3D.export.openMenu();
        break;
    }
  });

  // Close modal on backdrop click
  document.addEventListener('click', function (e) {
    const m = document.getElementById('kb-help-modal');
    if (m && e.target === m) close();
  });

  global.A3D = global.A3D || {};
  global.A3D.help = { open, close };

})(window);
