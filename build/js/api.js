/* global $ */
/**
 * Architecture Master — Backend API Integration
 * Handles auth, cloud save/load, and design management.
 */
(function () {
  'use strict';

  var API_BASE = 'http://localhost:3003/api';

  // ── Storage helpers ─────────────────────────────────────────────────────────
  function getToken() { return localStorage.getItem('a3d_token'); }
  function setToken(t) { localStorage.setItem('a3d_token', t); }
  function removeToken() { localStorage.removeItem('a3d_token'); }
  function getUser() { var u = localStorage.getItem('a3d_user'); return u ? JSON.parse(u) : null; }
  function setUser(u) { localStorage.setItem('a3d_user', JSON.stringify(u)); }
  function removeUser() { localStorage.removeItem('a3d_user'); }

  // ── Fetch wrapper ────────────────────────────────────────────────────────────
  function apiRequest(method, path, body) {
    console.log('[a3d] apiRequest:', method, path);
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    var token = getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) opts.body = JSON.stringify(body);
    return fetch(API_BASE + path, opts).then(function (res) {
      console.log('[a3d] apiResponse status:', res.status);
      return res.json().then(function (data) {
        if (!res.ok) {
          console.error('[a3d] apiRequest failed:', data);
          throw new Error(data.message || 'Request failed');
        }
        return data;
      }).catch(function (err) {
        if (!res.ok) throw new Error('Request failed (' + res.status + ')');
        throw err;
      });
    });
  }

  // ── Toast notifications ──────────────────────────────────────────────────────
  function showToast(message, type) {
    type = type || 'success';
    var icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
    var toast = $('<div class="a3d-toast a3d-toast-' + type + '">' +
      '<span class="a3d-toast-icon">' + (icons[type] || '✓') + '</span>' +
      '<span class="a3d-toast-msg">' + escapeHtml(message) + '</span>' +
      '</div>');
    $('#a3d-toast-container').append(toast);
    setTimeout(function () { toast.addClass('a3d-toast-show'); }, 10);
    setTimeout(function () {
      toast.removeClass('a3d-toast-show');
      setTimeout(function () { toast.remove(); }, 350);
    }, 3200);
  }

  function escapeHtml(text) { return $('<div>').text(String(text)).html(); }

  // ── Auth UI ──────────────────────────────────────────────────────────────────
  function updateAuthUI() {
    var user = getUser();
    if (user) {
      $('#a3d-auth-btn').hide();
      $('#a3d-user-section').show();
      $('#a3d-username-display').text(user.name);
      $('#a3d-user-avatar').text(user.name.charAt(0).toUpperCase());
    } else {
      $('#a3d-auth-btn').show();
      $('#a3d-user-section').hide();
    }
  }

  // ── Client-side validation helpers ────────────────────────────────────────
  function setFieldError(id, msg) {
    var $el = $('#' + id);
    $el.text(msg);
    $el.closest('div').find('.a3d-input').toggleClass('a3d-input-error', !!msg);
  }

  function clearAllErrors() {
    $('.a3d-field-error').text('');
    $('.a3d-input').removeClass('a3d-input-error');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function validateRegister(name, email, pass) {
    clearAllErrors();
    var ok = true;
    if (!name) { setFieldError('err-name', 'Name is required'); ok = false; }
    else if (name.length > 50) { setFieldError('err-name', 'Max 50 characters'); ok = false; }

    if (!email) { setFieldError('err-email', 'Email is required'); ok = false; }
    else if (!isValidEmail(email)) { setFieldError('err-email', 'Enter a valid email address'); ok = false; }

    if (!pass) { setFieldError('err-password', 'Password is required'); ok = false; }
    else if (pass.length < 3) { setFieldError('err-password', 'At least 3 characters required'); ok = false; }
    else if (!/[a-zA-Z]/.test(pass)) { setFieldError('err-password', 'Must contain at least one letter'); ok = false; }
    else if (!/[^a-zA-Z0-9\s]/.test(pass)) { setFieldError('err-password', 'Must contain at least one symbol (!@#$%^&* etc.)'); ok = false; }
    return ok;
  }

  function validateLogin(email, pass) {
    clearAllErrors();
    var ok = true;
    if (!email) { setFieldError('err-email', 'Email is required'); ok = false; }
    else if (!isValidEmail(email)) { setFieldError('err-email', 'Enter a valid email address'); ok = false; }
    if (!pass) { setFieldError('err-password', 'Password is required'); ok = false; }
    return ok;
  }

  function doRegister() {
    var name = $('#auth-name').val().trim();
    var email = $('#auth-email').val().trim().toLowerCase();
    var pass = $('#auth-password').val();
    if (!validateRegister(name, email, pass)) return;

    var $btn = $('#auth-submit-btn').prop('disabled', true).text('Creating account…');
    apiRequest('POST', '/auth/register', { name: name, email: email, password: pass })
      .then(function (data) {
        setToken(data.token);
        setUser({ _id: data._id, name: data.name, email: data.email });
        $('#a3d-auth-modal').modal('hide');
        updateAuthUI();
        showToast('Welcome, ' + data.name + '!');
      })
      .catch(function (err) { showToast(err.message, 'error'); })
      .finally(function () { $btn.prop('disabled', false).text('Create Account'); });
  }

  function doLogin() {
    var email = $('#auth-email').val().trim().toLowerCase();
    var pass = $('#auth-password').val();
    if (!validateLogin(email, pass)) return;

    var $btn = $('#auth-submit-btn').prop('disabled', true).text('Logging in…');
    apiRequest('POST', '/auth/login', { email: email, password: pass })
      .then(function (data) {
        setToken(data.token);
        setUser({ _id: data._id, name: data.name, email: data.email });
        $('#a3d-auth-modal').modal('hide');
        updateAuthUI();
        showToast('Welcome back, ' + data.name + '!');
      })
      .catch(function (err) { showToast(err.message, 'error'); })
      .finally(function () { $btn.prop('disabled', false).text('Login'); });
  }

  function resetToNewCanvas() {
    currentDesignId = null;
    currentDesignName = 'Untitled Design';
    $('#a3d-design-name').val('Untitled Design');
    $('#a3d-save-indicator').text('').removeClass('saved unsaved');
    // Reset the 3D/2D canvas to an empty room
    if (_bp3d) {
      _bp3d.model.loadSerialized('{"floorplan":{"corners":{},"walls":[],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
    }
  }

  function doLogout() {
    var hasUnsavedWork = _bp3d && $('#a3d-save-indicator').hasClass('unsaved');
    var hasAnyDesign = _bp3d && currentDesignId;

    // If there is work to save, auto-save then logout
    if (getToken() && _bp3d && (hasUnsavedWork || hasAnyDesign)) {
      showToast('Saving your design before logout…', 'info');
      var serialized = JSON.parse(_bp3d.model.exportSerialized());
      var name = $('#a3d-design-name').val().trim() || 'Untitled Design';
      var payload = { name: name, floorplan: serialized.floorplan, items: serialized.items };
      var method = currentDesignId ? 'PUT' : 'POST';
      var path = currentDesignId ? '/designs/' + currentDesignId : '/designs';

      apiRequest(method, path, payload)
        .then(function () { showToast('Design saved. Logging out…', 'info'); })
        .catch(function () { showToast('Could not auto-save, logging out anyway…', 'warning'); })
        .finally(function () {
          removeToken();
          removeUser();
          updateAuthUI();
          resetToNewCanvas();
          showToast('You have been logged out', 'info');
        });
    } else {
      removeToken();
      removeUser();
      updateAuthUI();
      resetToNewCanvas();
      showToast('You have been logged out', 'info');
    }
  }

  // ── Design manager ───────────────────────────────────────────────────────────
  var _bp3d = null;
  var currentDesignId = null;
  var currentDesignName = 'Untitled Design';

  function markUnsaved() {
    $('#a3d-save-indicator').text('Unsaved changes').removeClass('saved').addClass('unsaved');
  }

  function markSaved() {
    $('#a3d-save-indicator').text('All changes saved').removeClass('unsaved').addClass('saved');
  }

  // Normalize room keys: sort corner IDs within each comma-separated key
  // so that the key order is consistent regardless of corner traversal order.
  function normalizeRoomKeys(rooms) {
    if (!rooms || typeof rooms !== 'object') return rooms;
    var normalized = {};
    for (var key in rooms) {
      if (rooms.hasOwnProperty(key)) {
        var sortedKey = key.split(',').sort().join(',');
        normalized[sortedKey] = rooms[key];
      }
    }
    return normalized;
  }

  function saveToCloud() {
    console.log('[a3d] saveToCloud called');
    if (!getToken()) { 
      console.warn('[a3d] No token found, prompting login');
      showToast('Please log in to save your design', 'info'); 
      $('#a3d-auth-modal').modal('show');
      return; 
    }
    if (!_bp3d) {
      console.error('[a3d] Engine reference (_bp3d) is missing!');
      showToast('Engine not initialized correctly', 'error');
      return;
    }

    // For a new (unsaved) design, prompt for a name first
    if (!currentDesignId) {
      var existing = $('#a3d-design-name').val().trim();
      $('#savename-input').val(existing === 'Untitled Design' ? '' : existing);
      $('#a3d-savename-modal').modal('show');
      return;
    }

    // Already saved before – just overwrite silently
    performSave($('#a3d-design-name').val().trim() || 'Untitled Design');
  }

  function performSave(name) {
    if (!_bp3d) return;
    console.log('[a3d] performing save for:', name);
    var serialized;
    try {
      serialized = JSON.parse(_bp3d.model.exportSerialized());
    } catch (e) {
      console.error('[a3d] serialization failed:', e);
      showToast('Could not read design data: ' + e.message, 'error');
      return;
    }

    var payload = { name: name, floorplan: serialized.floorplan, items: serialized.items };
    // Normalize room keys for consistent storage
    if (payload.floorplan && payload.floorplan.rooms) {
      payload.floorplan.rooms = normalizeRoomKeys(payload.floorplan.rooms);
    }
    var $btn = $('#a3d-cloud-save-btn').prop('disabled', true);
    $btn.find('.btn-label').text('Saving…');

    var method = currentDesignId ? 'PUT' : 'POST';
    var path = currentDesignId ? '/designs/' + currentDesignId : '/designs';

    apiRequest(method, path, payload)
      .then(function (data) {
        currentDesignId = data._id;
        currentDesignName = data.name;
        $('#a3d-design-name').val(data.name);
        markSaved();
        showToast('"' + data.name + '" saved to cloud');
      })
      .catch(function (err) {
        console.error('[a3d] save failed:', err);
        showToast('Save failed: ' + (err.message || 'Check that the backend is running on port 3003'), 'error');
      })
      .finally(function () { $btn.prop('disabled', false).find('.btn-label').text('Save'); });
  }

  function loadMyDesigns() {
    if (!getToken()) { showToast('Please log in to view your designs', 'error'); return; }

    $('#my-designs-grid').html(
      '<div class="designs-loading"><div class="a3d-spinner"></div><p>Loading your designs…</p></div>'
    );
    $('#a3d-designs-modal').modal('show');

    apiRequest('GET', '/designs')
      .then(function (designs) {
        if (!designs.length) {
          $('#my-designs-grid').html(
            '<div class="designs-empty">' +
            '<div class="designs-empty-icon">📐</div>' +
            '<p>No saved designs yet.</p>' +
            '<p class="designs-empty-sub">Create a floorplan and click <strong>Save</strong> to store it here.</p>' +
            '</div>'
          );
          return;
        }
        var html = designs.map(function (d) {
          var date = new Date(d.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
          return (
            '<div class="design-card" data-id="' + d._id + '">' +
            '  <div class="design-card-thumb"><span>🏠</span></div>' +
            '  <div class="design-card-info">' +
            '    <div class="design-card-name">' + escapeHtml(d.name) + '</div>' +
            '    <div class="design-card-date">' + date + '</div>' +
            '  </div>' +
            '  <div class="design-card-actions">' +
            '    <button class="btn btn-sm btn-primary load-design-btn" data-id="' + d._id + '">Open</button>' +
            '    <button class="btn btn-sm btn-danger delete-design-btn" data-id="' + d._id + '">Delete</button>' +
            '  </div>' +
            '</div>'
          );
        }).join('');
        $('#my-designs-grid').html(html);

        $('#my-designs-grid').on('click', '.load-design-btn', function () {
          loadDesignById($(this).data('id'));
        });
        $('#my-designs-grid').on('click', '.delete-design-btn', function () {
          deleteDesignById($(this).data('id'), this);
        });
      })
      .catch(function (err) {
        $('#my-designs-grid').html('<div class="designs-error">Failed to load designs: ' + escapeHtml(err.message) + '</div>');
      });
  }

  function loadDesignById(id) {
    apiRequest('GET', '/designs/' + id)
      .then(function (design) {
        // Normalize room keys so corner ID order matches engine's traversal order
        if (design.floorplan && design.floorplan.rooms) {
          design.floorplan.rooms = normalizeRoomKeys(design.floorplan.rooms);
        }
        var serialized = JSON.stringify({ floorplan: design.floorplan, items: design.items });
        _bp3d.model.loadSerialized(serialized);
        currentDesignId = design._id;
        currentDesignName = design.name;
        $('#a3d-design-name').val(design.name);
        $('#a3d-designs-modal').modal('hide');
        markSaved();
        showToast('Design "' + design.name + '" loaded');
      })
      .catch(function (err) { showToast('Load failed: ' + err.message, 'error'); });
  }

  function deleteDesignById(id, btn) {
    if (!confirm('Delete this design? This cannot be undone.')) return;
    var $btn = $(btn).prop('disabled', true).text('…');
    apiRequest('DELETE', '/designs/' + id)
      .then(function () {
        $btn.closest('.design-card').fadeOut(300, function () { $(this).remove(); });
        if (currentDesignId === id) {
          currentDesignId = null;
          $('#a3d-save-indicator').text('').removeClass('saved unsaved');
        }
        showToast('Design deleted', 'info');
      })
      .catch(function (err) {
        showToast('Delete failed: ' + err.message, 'error');
        $btn.prop('disabled', false).text('Delete');
      });
  }

  // ── New design helper ────────────────────────────────────────────────────────
  function newDesign() {
    if (!confirm('Start a new design? Unsaved changes will be lost.')) return;
    currentDesignId = null;
    currentDesignName = 'Untitled Design';
    $('#a3d-design-name').val('Untitled Design');
    $('#a3d-save-indicator').text('').removeClass('saved unsaved');
    // Delegate to existing buttons
    $('#new').trigger('click');
    $('#new2d').trigger('click');
  }

  // ── DOM ready ────────────────────────────────────────────────────────────────
  $(document).ready(function () {
    updateAuthUI();

    // ── Auth modal mode switching ──
    var isLoginMode = true;

    function switchAuthMode(login) {
      isLoginMode = login;
      clearAllErrors();
      if (login) {
        $('#auth-name-group').hide();
        $('#auth-pw-hints').hide();
        $('#auth-modal-title').text('Welcome Back');
        $('#auth-submit-btn').text('Login');
        $('#auth-switch-text').html(
          "Don't have an account? <a href='#' id='auth-switch-link'>Sign up</a>"
        );
      } else {
        $('#auth-name-group').show();
        $('#auth-pw-hints').show();
        $('#auth-modal-title').text('Create Account');
        $('#auth-submit-btn').text('Create Account');
        $('#auth-switch-text').html(
          "Already have an account? <a href='#' id='auth-switch-link'>Login</a>"
        );
      }
      $('#auth-switch-link').off('click').on('click', function (e) {
        e.preventDefault();
        switchAuthMode(!isLoginMode);
      });
    }

    switchAuthMode(true);
    $('#a3d-auth-modal').on('show.bs.modal', function () { switchAuthMode(true); });
    $('#a3d-auth-modal').on('hidden.bs.modal', function () {
      clearAllErrors();
      $('#auth-name').val('');
      $('#auth-email').val('');
      $('#auth-password').val('');
    });

    // Live password strength hints (register mode only)
    $('#auth-password').on('input', function () {
      if (isLoginMode) return;
      var pw = $(this).val();
      function hint(id, ok) {
        var $h = $('#' + id);
        $h.text((ok ? '\u2713 ' : '\u2717 ') + $h.text().replace(/^[\u2713\u2717]\s/, ''));
        $h.toggleClass('pw-hint-ok', ok).toggleClass('pw-hint-fail', !ok && pw.length > 0);
      }
      hint('pwh-len',    pw.length >= 3);
      hint('pwh-letter', /[a-zA-Z]/.test(pw));
      hint('pwh-symbol', /[^a-zA-Z0-9\s]/.test(pw));
    });

    $('#auth-submit-btn').click(function () {
      if (isLoginMode) doLogin(); else doRegister();
    });
    $('body').on('keypress', '#auth-email, #auth-password, #auth-name', function (e) {
      if (e.which === 13) { if (isLoginMode) doLogin(); else doRegister(); }
    });

    // ── Navbar actions ──
    $('#a3d-auth-btn').click(function () { $('#a3d-auth-modal').modal('show'); });
    $('#a3d-cloud-save-btn').click(saveToCloud);
    $('#a3d-my-designs-btn').click(loadMyDesigns);
    $('#a3d-new-design-btn').click(newDesign);

    // Save-name modal: confirm button
    $('#savename-confirm-btn').on('click', function () {
      var name = $('#savename-input').val().trim();
      if (!name) { showToast('Please enter a design name', 'warning'); return; }
      $('#a3d-design-name').val(name);
      $('#a3d-savename-modal').modal('hide');
      performSave(name);
    });
    $('#savename-input').on('keypress', function (e) {
      if (e.which === 13) { $('#savename-confirm-btn').trigger('click'); }
    });
    // Focus the input when modal opens
    $('#a3d-savename-modal').on('shown.bs.modal', function () {
      $('#savename-input').focus();
    });

    // Design rename marks unsaved
    $('#a3d-design-name').on('input', function () {
      if (currentDesignId) markUnsaved();
    });

    // ── Avatar click → toggle dropdown ──
    $('#a3d-user-avatar').on('click', function (e) {
      e.stopPropagation();
      var $dd = $('#a3d-user-dropdown');
      $dd.is(':visible') ? $dd.hide() : $dd.show();
    });
    $(document).on('click', function (e) {
      if (!$(e.target).closest('#a3d-user-section').length) {
        $('#a3d-user-dropdown').hide();
      }
    });
    // Logout click must close dropdown first
    // ── My Designs button ──
    $('#a3d-my-designs-btn').on('click', function(e) {
      e.preventDefault();
      loadMyDesigns();
    });

    // ── Auto-load if coming from dashboard ──
    setTimeout(function() {
      var autoLoadId = localStorage.getItem('a3d_design_id');
      if (autoLoadId && _bp3d) {
        localStorage.removeItem('a3d_design_id');
        loadDesignById(autoLoadId);
      }
    }, 500);
  });


  // ── Public interface ─────────────────────────────────────────────────────────
  window.A3DApi = {
    setBP3DRef: function (bp) {
      _bp3d = bp;
      // Mark unsaved whenever the floorplan or scene is modified
      if (bp.model && bp.model.floorplan) {
        bp.model.floorplan.addEventListener('updated', function () {
          if (getToken()) markUnsaved();
        });
      }
      if (bp.model && bp.model.scene) {
        bp.model.scene.addEventListener('ItemLoaded', function () {
          if (getToken()) markUnsaved();
        });
      }
    },
    markUnsaved: markUnsaved,
    showToast: showToast,
    cloudSave: saveToCloud,
    loadDesign: loadDesignById
  };


})();
