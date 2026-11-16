/* Prayer House - app.js
 * Core of the app: icons, IndexedDB, Android back-button handling, centered modals,
 * the two sidebars, public pages, QR scan and join, install and share.
 * Every network call starts from something the person does. Nothing here polls or pings.
 */
(function (w) {
  'use strict';
  var DV = (w.DV = w.DV || {});
  if (DV.blocked) return;
  var doc = document;

  /* ================= DOM helpers ================= */
  function dvEl(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  DV.el = dvEl;

  /* ================= Icons (inline SVG, Material paths) ================= */
  var DV_ICONS = {
    menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    dark: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z',
    light: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
    qr: 'M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5 1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5 1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0 3H19V19h-1.5v-1.5zM22 7h-2V4h-3V2h5v5zm0 15v-5h-2v3h-3v2h5zM2 22h5v-2H4v-3H2v5zM2 2v5h2V4h3V2H2z',
    install: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
    share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z',
    heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    check: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    error: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
    flag: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
    person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    group: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    help: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
    doc: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
    link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    mail: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    sync: 'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
    flash: 'M7 2v11h3v9l7-12h-4l4-8z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'
  };
  function dvIcon(name, cls) {
    return '<svg class="' + (cls || 'dv-ico') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + (DV_ICONS[name] || '') + '"/></svg>';
  }
  function dvHydrate(root) {
    (root || doc).querySelectorAll('[data-icon]').forEach(function (n) {
      if (!n.getAttribute('data-done')) {
        n.innerHTML = dvIcon(n.getAttribute('data-icon'));
        n.setAttribute('data-done', '1');
        if (n.tagName === 'SPAN') n.style.display = 'inline-flex';
      }
    });
  }
  function dvLogo(size, bg, fg) {
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<circle cx="24" cy="24" r="24" fill="' + bg + '"/>' +
      '<path d="M24 14L12 23.5V37h8.5v-8h7v8H36V23.5L24 14z" fill="' + fg + '"/>' +
      '<rect x="23" y="5" width="2" height="9" rx="1" fill="' + fg + '"/>' +
      '<rect x="19.5" y="8" width="9" height="2" rx="1" fill="' + fg + '"/></svg>'
    );
  }
  DV.icon = dvIcon;
  DV.hydrate = dvHydrate;
  DV.logo = dvLogo;

  /* ================= IndexedDB ================= */
  var dvDbPromise = null;
  function dvDbOpen() {
    if (dvDbPromise) return dvDbPromise;
    dvDbPromise = new Promise(function (res, rej) {
      if (!w.indexedDB) return rej(new Error('NOIDB'));
      var rq = indexedDB.open('dvPrayerHouse', 1);
      rq.onupgradeneeded = function () {
        var d = rq.result;
        d.createObjectStore('kv');
        d.createObjectStore('queue', { autoIncrement: true });
        d.createObjectStore('mine', { keyPath: 'id' });
      };
      rq.onsuccess = function () { res(rq.result); };
      rq.onerror = function () { rej(rq.error); };
    });
    return dvDbPromise;
  }
  function dvTx(store, mode, fn) {
    return dvDbOpen().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(store, mode);
        var out = fn(tx.objectStore(store));
        tx.oncomplete = function () { res(out && 'result' in out ? out.result : undefined); };
        tx.onerror = tx.onabort = function () { rej(tx.error); };
      });
    });
  }
  function dvSafe(p, fallback) {
    return p.catch(function () { return fallback; });
  }
  DV.db = {
    get: function (s, k) { return dvSafe(dvTx(s, 'readonly', function (st) { return st.get(k); }), undefined); },
    put: function (s, v, k) { return dvSafe(dvTx(s, 'readwrite', function (st) { return k === undefined ? st.put(v) : st.put(v, k); }), undefined); },
    del: function (s, k) { return dvSafe(dvTx(s, 'readwrite', function (st) { return st.delete(k); }), undefined); },
    all: function (s) { return dvSafe(dvTx(s, 'readonly', function (st) { return st.getAll(); }), []); },
    queueAdd: function (v) { return dvSafe(dvTx('queue', 'readwrite', function (st) { return st.add(v); }), undefined); },
    queueAll: function () {
      return dvSafe(
        dvDbOpen().then(function (db) {
          return new Promise(function (res, rej) {
            var out = [];
            var tx = db.transaction('queue', 'readonly');
            tx.objectStore('queue').openCursor().onsuccess = function (e) {
              var c = e.target.result;
              if (c) { out.push({ key: c.key, value: c.value }); c.continue(); }
            };
            tx.oncomplete = function () { res(out); };
            tx.onerror = function () { rej(tx.error); };
          });
        }),
        []
      );
    }
  };

  /* ================= Navigation stack (Android back button) ================= */
  DV.nav = (function () {
    var stack = [];
    var after = null;
    try { history.replaceState({ d: 0 }, ''); } catch (e) {}
    function push(id, close) {
      stack.push({ id: id, close: close });
      history.pushState({ dv: 1, d: stack.length }, '');
    }
    function replaceTop(id, close) {
      if (!stack.length) return push(id, close);
      stack[stack.length - 1] = { id: id, close: close };
      history.replaceState({ dv: 1, d: stack.length }, '');
    }
    function back(n, cb) {
      n = Math.min(n || 1, stack.length);
      if (n <= 0) { if (cb) cb(); return; }
      after = cb || null;
      history.go(-n);
    }
    function depth() { return stack.length; }
    function top() { return stack.length ? stack[stack.length - 1].id : null; }
    w.addEventListener('popstate', function (e) {
      var d = e.state && e.state.d ? e.state.d : 0;
      while (stack.length > d) {
        var en = stack.pop();
        try { en.close(); } catch (x) {}
      }
      if (after) {
        var cb = after;
        after = null;
        setTimeout(cb, 0);
      }
    });
    return { push: push, replaceTop: replaceTop, back: back, depth: depth, top: top };
  })();

  /* ================= Centered modal ================= */
  DV.modal = (function () {
    var root = doc.getElementById('dvModalRoot');
    var wrap = null;
    var open = false;
    var afterClose = null;
    var onClose = null;

    function build(o) {
      var m = dvEl('div', 'dv-modal');
      m.setAttribute('role', 'dialog');
      m.setAttribute('aria-modal', 'true');
      var iconName = { success: 'check', error: 'error', info: 'info', confirm: 'help', loading: 'sync' }[o.type];
      if (iconName) {
        var ic = dvEl('div', 'dv-modal-icon dv-t-' + (o.type === 'confirm' || o.type === 'loading' ? 'info' : o.type));
        ic.innerHTML = o.type === 'loading' ? dvIcon('sync', 'dv-ico dv-spin') : dvIcon(iconName, 'dv-ico');
        if (o.type !== 'loading') ic.firstChild.setAttribute('style', 'width:44px;height:44px');
        m.appendChild(ic);
      }
      if (o.title) m.appendChild(dvEl('h3', '', o.title));
      var b = dvEl('div', 'dv-modal-body');
      if (typeof o.body === 'string') b.appendChild(dvEl('p', '', o.body));
      else if (o.body) b.appendChild(o.body);
      if (o.type === 'loading') b.style.textAlign = 'center';
      m.appendChild(b);
      if (o.actions && o.actions.length) {
        var row = dvEl('div', 'dv-modal-actions' + (o.row ? ' dv-row' : ''));
        o.actions.forEach(function (a) {
          var kind = a.kind || 'primary';
          var btn = dvEl('button', 'dv-btn' + (kind === 'tonal' ? ' dv-btn-tonal' : kind === 'text' ? ' dv-btn-text' : kind === 'danger' ? ' dv-btn-danger' : kind === 'outline' ? ' dv-btn-outline' : ''), a.label);
          btn.type = 'button';
          btn.addEventListener('click', function () {
            if (a.keep) { if (a.onClick) a.onClick(btn); }
            else close(a.onClick);
          });
          row.appendChild(btn);
        });
        m.appendChild(row);
      }
      return m;
    }

    var cur = null;
    function show(o) {
      o = o || {};
      cur = o;
      var m = build(o);
      onClose = o.onClose || null;
      if (!open) {
        open = true;
        wrap = dvEl('div', 'dv-modal-wrap');
        wrap.addEventListener('click', function (e) {
          if (e.target === wrap && cur && !cur.sticky && cur.type !== 'loading') close();
        });
        wrap.appendChild(m);
        root.appendChild(wrap);
        var shown = wrap;
        requestAnimationFrame(function () { if (shown.parentNode) shown.classList.add('dv-on'); });
        DV.nav.push('modal', teardown);
      } else {
        wrap.replaceChildren(m);
      }
      var first = m.querySelector('input,textarea,select');
      if (first && !o.noFocus) setTimeout(function () { try { first.focus(); } catch (e) {} }, 220);
    }
    function teardown() {
      if (!open) return;
      open = false;
      var oc = onClose;
      onClose = null;
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      wrap = null;
      if (oc) { try { oc(); } catch (e) {} }
      var cb = afterClose;
      afterClose = null;
      if (cb) setTimeout(cb, 0); // run after the back-stack has finished unwinding
    }
    function close(cb) {
      if (!open) { if (cb) cb(); return; }
      afterClose = cb || null;
      DV.nav.back(1);
    }
    return { show: show, close: close, isOpen: function () { return open; } };
  })();

  /* Friendly text for backend and network errors */
  DV.err = function (code) {
    var map = {
      CFG: ['Not connected yet', 'This app has no server address yet. The admin needs to paste the web app URL into api.js.'],
      OFFLINE: ['You are offline', 'Your phone has no connection right now. You can keep reading saved prayers.'],
      NET: ['Cannot reach the server', 'Check your connection and try again.'],
      TIMEOUT: ['The server took too long', 'Check your connection and try again.'],
      SERVER: ['The server had a problem', 'Please try again in a moment.'],
      BUSY: ['The server is busy', 'Many people are using it right now. Try again in a moment.'],
      LIMIT: ['Please wait a moment', 'You are sending things too quickly. Wait a few seconds and try again.'],
      BAD: ['Check what you entered', 'Some details were missing or too short.'],
      SETUP: ['Setup not finished', 'The admin needs to run the Smart Installer in the Google Sheet.'],
      AUTH: ['Not allowed', 'This action is not allowed from this phone.'],
      NOTFOUND: ['Not found', 'That item is no longer available.']
    };
    var r = map[code] || ['Something went wrong', 'Please try again.'];
    return { title: r[0], body: r[1] };
  };
  DV.showError = function (code) {
    var e = DV.err(code);
    DV.modal.show({ type: 'error', title: e.title, body: e.body, actions: [{ label: 'OK' }] });
  };

  /* ================= Utilities: share, URL ================= */
  DV.appUrl = function () {
    return (location.origin + location.pathname).replace(/index\.html$/, '').replace(/admin\.html$/, '');
  };
  DV.share = function (o) {
    var data = { title: o.title || 'Prayer House', text: o.text || '', url: o.url || DV.appUrl() };
    if (navigator.share) {
      return navigator.share(data).catch(function (e) {
        if (e && e.name === 'AbortError') return;
        return DV.copy(data);
      });
    }
    return DV.copy(data);
  };
  DV.copy = function (data) {
    var text = (data.text ? data.text + '\n' : '') + data.url;
    var done = function () { DV.toast('Link copied. Paste it to share.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(done, done);
    done();
  };

  /* ================= Haptics, centered toast, confirm ================= */
  DV.haptic = function (ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) {}
  };
  /* Web apps cannot call Android's system Toast, so this is an identical-looking centered toast. */
  DV.toast = function (msg, kind) {
    var t = dvEl('div', 'dv-toast' + (kind === 'error' ? ' dv-toast-err' : ''), msg);
    t.setAttribute('role', 'status');
    doc.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('dv-on'); });
    DV.haptic(kind === 'error' ? [20, 40, 20] : 15);
    setTimeout(function () {
      t.classList.remove('dv-on');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, 1800 + msg.length * 35);
  };
  DV.confirm = function (o) {
    DV.modal.show({
      type: 'confirm', title: o.title, body: o.body, sticky: true,
      actions: [{ label: o.ok || 'Yes', kind: o.kind || 'primary', onClick: o.onOk }, { label: o.cancel || 'Cancel', kind: 'text' }]
    });
  };

  /* ================= Ripple ================= */
  doc.addEventListener('pointerdown', function (e) {
    var t = e.target.closest && e.target.closest('.dv-ripple,.dv-btn,.dv-chip,.dv-fab,.dv-nav,.dv-iconbtn,.dv-brand');
    if (!t) return;
    DV.haptic(10);
    var r = t.getBoundingClientRect();
    var s = Math.max(r.width, r.height) * 2;
    var wv = dvEl('span', 'dv-wave');
    wv.style.width = wv.style.height = s + 'px';
    wv.style.left = e.clientX - r.left - s / 2 + 'px';
    wv.style.top = e.clientY - r.top - s / 2 + 'px';
    t.appendChild(wv);
    setTimeout(function () { if (wv.parentNode) wv.parentNode.removeChild(wv); }, 600);
  }, { passive: true });

  /* ================= Theme and font ================= */
  var darkSwitch = doc.getElementById('dvDarkSwitch');
  var fontRange = doc.getElementById('dvFontRange');
  var fontVal = doc.getElementById('dvFontVal');

  function dvSetTheme(t) {
    doc.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('dvTheme', t); } catch (e) {}
    darkSwitch.checked = t === 'dark';
    var di = doc.getElementById('dvDarkIcon');
    di.innerHTML = dvIcon(t === 'dark' ? 'light' : 'dark');
  }
  function dvSetFont(n) {
    n = Math.max(19, Math.min(22, parseInt(n, 10) || 19));
    doc.documentElement.style.setProperty('--dv-fs', n + 'px');
    try { localStorage.setItem('dvFont', String(n)); } catch (e) {}
    fontRange.value = String(n);
    fontVal.textContent = n + 'px';
  }

  /* ================= Sidebars ================= */
  var left = doc.getElementById('dvLeft');
  var right = doc.getElementById('dvRight');
  var scrim = doc.getElementById('dvScrim');
  var main = doc.getElementById('dvMain');

  function dvShowDrawer(el, on) {
    el.classList.toggle('dv-on', on);
    el.setAttribute('aria-hidden', on ? 'false' : 'true');
    var any = left.classList.contains('dv-on') || right.classList.contains('dv-on');
    scrim.classList.toggle('dv-on', any);
  }
  function dvOpenDrawer(el) {
    if (DV.nav.top() === 'left' || DV.nav.top() === 'right' || DV.modal.isOpen()) return;
    dvShowDrawer(el, true);
    DV.nav.push(el === left ? 'left' : 'right', function () { dvShowDrawer(el, false); });
  }
  doc.getElementById('dvBtnMenu').addEventListener('click', function () { dvOpenDrawer(left); });
  doc.getElementById('dvBtnMore').addEventListener('click', function () { dvOpenDrawer(right); });
  scrim.addEventListener('click', function () { DV.nav.back(1); });

  /* ================= PLACEHOLDERS: swap these with your real details ================= */
  var DV_FOUNDER = {
    photo: 'https://REPLACE-WITH-YOUR-PHOTO-URL/founder.jpg',
    name: 'Founder Name',
    role: 'Founder and Director',
    bio: 'Tell your story here: how God called you, why Prayer House exists, and what you hope it becomes for every person who joins. Share the moment the vision began, the people who walked with you, and the prayer that keeps you going. Replace this paragraph with your own words.'
  };
  var DV_TEAM = {
    photo: 'https://REPLACE-WITH-YOUR-PHOTO-URL/team-member.jpg',
    name: 'Team Member Name',
    role: 'Prayer Coordinator',
    bio: 'A short introduction goes here: who this person is, how they serve, and why they care about prayer. Replace this text with the real bio.'
  };
  var DV_LINKS = {
    gmail: 'mailto:REPLACE@example.com',
    whatsapp: 'https://wa.me/REPLACE_NUMBER',
    phone: 'tel:+REPLACE_NUMBER',
    facebook: 'https://www.facebook.com/REPLACE_PAGE'
  };

  var DV_TITLES = { aims: 'Our Aims', founder: 'About the Founder', team: 'Meet our Team', howto: 'How to Use App', terms: 'Terms of Use', partner: 'Partner With Us', contact: 'Contact Us' };
  var DV_HOOK = {
    contact: ['We would love to hear from you', 'Need prayer, have a question, or want to serve? Reach out the way that is easiest for you. Every message is read by the team.'],
    partner: ['Let us build something that lasts', 'Prayer House grows when ministries, churches and friends link arms. Your gift, skill or platform could be the next link in the chain.']
  };
  var DV_HOWTO = [
    'Open the Prayer Wall to read requests that a moderator has approved.',
    'Tap \u201CI prayed\u201D after you pray for someone. Each person can add one to a request\u2019s count.',
    'Tap \u201CNew request\u201D to share a need. Your name is optional, so you can stay anonymous.',
    'Every request is reviewed before it appears. Follow its progress under Mine.',
    'When God answers, open Mine, tap \u201CMark as answered\u201D, then share a testimony.',
    'Tap \u201CPass it on\u201D to send a request to friends outside the app.',
    'No signal? Your requests and prayers stay on your phone. Tap \u201CSend now\u201D when you are back online.',
    'Use the three-dot menu for dark mode, text size, QR code, install and share.'
  ];
  var DV_TERMS = [
    'Prayer House is a community space for sharing prayer needs and testimonies. By using it, you agree to be respectful and honest.',
    'Every request and testimony is reviewed before it is published. Content that is hurtful, hateful, misleading, promotional or private may be edited, declined or removed.',
    'Do not post phone numbers, home addresses, medical records or other personal details about yourself or anyone else. If you post about another person, you confirm they are comfortable with it.',
    'You may post anonymously. Messages sent through Contact Us and Partner With Us are read by the admin team.',
    'Prayer House does not replace medical, legal, financial or emergency help. In an emergency, contact your local emergency services.',
    'Your own posts are also kept privately on your phone so you can read them offline. Everything else is stored in the ministry\u2019s own database.',
    'The app is provided as is. These terms may change, and continuing to use the app means you accept the update.'
  ];
  DV.pagesData = {};

  /* ---------- card helpers: every block is an edge-to-edge card ---------- */
  function dvPcard(cls) { return dvEl('section', 'dv-pcard' + (cls ? ' ' + cls : '')); }
  function dvTextCard(text) {
    var c = dvPcard();
    var p = dvEl('p', '', text);
    p.style.whiteSpace = 'pre-line';
    c.appendChild(p);
    return c;
  }
  function dvParaCards(frag, text) {
    String(text || '').split(/\n{2,}/).forEach(function (p) {
      if (p.trim()) frag.appendChild(dvTextCard(p.trim()));
    });
  }

  /* ---------- show more / show less (clamped to five lines) ---------- */
  function dvBio(text) {
    var wrap = dvEl('div', 'dv-bio');
    var p = dvEl('p', 'dv-clamp', text);
    var b = dvEl('button', 'dv-btn dv-btn-tonal dv-hide', 'Show more');
    b.type = 'button';
    b.addEventListener('click', function () {
      var clamped = p.classList.toggle('dv-clamp');
      b.textContent = clamped ? 'Show more' : 'Show less';
    });
    wrap.appendChild(p);
    wrap.appendChild(b);
    wrap.dvCheck = function () {
      if (p.classList.contains('dv-clamp') && p.scrollHeight > p.clientHeight + 2) b.classList.remove('dv-hide');
    };
    return wrap;
  }

  /* ---------- rotating gear ring (the photo itself never rotates) ---------- */
  function dvGearSvg() {
    var cx = 107, cy = 107, n = 24, rh = 91, rb = 99, rt = 106, step = (2 * Math.PI) / n, d = '';
    for (var i = 0; i < n; i++) {
      var a = i * step;
      [[rb, a - step * 0.5], [rb, a - step * 0.3], [rt, a - step * 0.2], [rt, a + step * 0.2], [rb, a + step * 0.3], [rb, a + step * 0.5]].forEach(function (q, j) {
        d += (i === 0 && j === 0 ? 'M' : 'L') + (cx + q[0] * Math.cos(q[1])).toFixed(2) + ' ' + (cy + q[0] * Math.sin(q[1])).toFixed(2) + ' ';
      });
    }
    d += 'Z M' + (cx - rh) + ' ' + cy + ' a' + rh + ' ' + rh + ' 0 1 0 ' + 2 * rh + ' 0 a' + rh + ' ' + rh + ' 0 1 0 ' + -2 * rh + ' 0 Z';
    return '<svg class="dv-gear" viewBox="0 0 214 214" aria-hidden="true" focusable="false"><path fill-rule="evenodd" fill="#DF1E5A" d="' + d + '"/></svg>';
  }

  function dvProfile(cfg, size, ring) {
    var c = dvPcard('dv-profile');
    var holder = dvEl('div', 'dv-photo');
    var box = ring ? 214 : size;
    holder.style.width = holder.style.height = box + 'px';
    if (ring) holder.innerHTML = dvGearSvg();
    var inner = dvEl('div', 'dv-photo-in');
    inner.style.width = inner.style.height = size + 'px';
    inner.style.marginLeft = inner.style.marginTop = -size / 2 + 'px';
    inner.innerHTML = dvIcon('person', 'dv-ico dv-ph-ico');
    var img = dvEl('img');
    img.src = cfg.photo;
    img.alt = cfg.name;
    img.width = size;
    img.height = size;
    img.decoding = 'async';
    img.addEventListener('error', function () { img.style.opacity = '0'; });
    inner.appendChild(img);
    holder.appendChild(inner);
    c.appendChild(holder);
    c.appendChild(dvEl('h2', 'dv-pname', cfg.name));
    c.appendChild(dvEl('div', 'dv-prole', cfg.role));
    c.appendChild(dvBio(cfg.bio));
    return c;
  }

  /* ---------- contact buttons in original brand colours ---------- */
  var DV_CALL = 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z';
  var DV_BRANDS = [
    ['gmail', '#EA4335', 'Email us', '<path fill="#fff" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4.2l-8 5-8-5V6l8 5 8-5v2.2z"/>'],
    ['whatsapp', '#25D366', 'Chat on WhatsApp', '<path fill="#fff" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/><path fill="#25D366" transform="translate(6.6 6.6) scale(.45)" d="' + DV_CALL + '"/>'],
    ['phone', '#34A853', 'Call us', '<path fill="#fff" d="' + DV_CALL + '"/>'],
    ['facebook', '#1877F2', 'Facebook', '<path fill="#fff" d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5h1.7V3.7c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.2H7.7V13h2.7v8h3.1z"/>']
  ];
  function dvSocialCard() {
    var c = dvPcard();
    c.appendChild(dvEl('p', 'dv-lead', 'Reach us instantly'));
    var row = dvEl('div', 'dv-social');
    DV_BRANDS.forEach(function (b) {
      var a = dvEl('a', 'dv-brand dv-ripple');
      a.href = DV_LINKS[b[0]];
      a.setAttribute('aria-label', b[2]);
      a.style.background = b[1];
      if (/^https?:/.test(DV_LINKS[b[0]])) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">' + b[3] + '</svg>';
      a.addEventListener('click', function (e) {
        if (DV_LINKS[b[0]].indexOf('REPLACE') >= 0) {
          e.preventDefault();
          DV.modal.show({ type: 'info', title: 'Link not set yet', body: 'Add your real link for this button in app.js, inside DV_LINKS.', actions: [{ label: 'OK' }] });
        }
      });
      row.appendChild(a);
    });
    c.appendChild(row);
    return c;
  }

  /* ---------- contact and partner forms ---------- */
  function dvFormCards(kind, frag) {
    var name = dvEl('input', 'dv-input');
    name.placeholder = 'Your name';
    name.maxLength = 60;
    name.autocomplete = 'name';
    var contact = dvEl('input', 'dv-input');
    contact.placeholder = 'Email or phone number';
    contact.maxLength = 120;
    var msg = dvEl('textarea', 'dv-textarea');
    msg.placeholder = kind === 'partner' ? 'Tell us about your ministry and how we can work together' : 'How can we help?';
    msg.maxLength = 800;
    var err = dvEl('p', 'dv-t-error');
    function field(label, input) {
      var l = dvEl('label', 'dv-field');
      l.appendChild(dvEl('span', '', label));
      l.appendChild(input);
      return l;
    }
    var c1 = dvPcard();
    c1.appendChild(field('Your name', name));
    c1.appendChild(field('Email or phone', contact));
    var c2 = dvPcard();
    c2.appendChild(field('Your message', msg));
    c2.appendChild(err);
    var send = dvEl('button', 'dv-btn dv-btn-block', 'Send message');
    send.type = 'button';
    c2.appendChild(send);
    send.addEventListener('click', function () {
      err.textContent = '';
      if (msg.value.trim().length < 5) { err.textContent = 'Write a short message first.'; return; }
      DV.confirm({ title: 'Send this message?', body: 'The team will read it and reply if needed.', ok: 'Yes, send', onOk: go });
    });
    function go() {
      DV.modal.show({ type: 'loading', title: 'Sending', body: 'Please wait...' });
      DV.wall.device().then(function (dev) {
        return DV.wall.enqueue('contact', { type: kind, name: name.value, contact: contact.value, message: msg.value, device: dev }).then(DV.wall.flush);
      }).then(function (r) {
        if (r.left === 0) {
          msg.value = '';
          DV.modal.close(function () { DV.toast('Message sent. Thank you.'); });
        } else if (r.err && ['BAD', 'AUTH', 'NOTFOUND'].indexOf(r.err) < 0 && r.err !== 'CFG') {
          DV.modal.close(function () { DV.toast('Saved on this phone. Tap Send now on the Prayer Wall when online.'); });
        } else DV.showError(r.err || 'ERR');
      });
    }
    frag.appendChild(c1);
    frag.appendChild(c2);
  }

  /* ---------- page content ---------- */
  function dvPageContent(key) {
    var d = DV.pagesData[key] || {};
    var frag = doc.createDocumentFragment();
    var hasBody = d.b && String(d.b).trim();
    if (key === 'founder') { frag.appendChild(dvProfile(DV_FOUNDER, 170, true)); return frag; }
    if (key === 'team') { frag.appendChild(dvProfile(DV_TEAM, 160, false)); return frag; }
    if (key === 'partner' || key === 'contact') {
      var hero = dvPcard('dv-hero');
      hero.appendChild(dvEl('h2', '', DV_HOOK[key][0]));
      hero.appendChild(dvEl('p', '', DV_HOOK[key][1]));
      frag.appendChild(hero);
      frag.appendChild(dvSocialCard());
      if (hasBody) dvParaCards(frag, d.b);
      dvFormCards(key, frag);
      return frag;
    }
    if (hasBody) { dvParaCards(frag, d.b); return frag; }
    if (key === 'howto') {
      DV_HOWTO.forEach(function (s, i) {
        var c = dvPcard('dv-step');
        c.appendChild(dvEl('span', 'dv-num', String(i + 1)));
        c.appendChild(dvEl('p', '', s));
        frag.appendChild(c);
      });
      return frag;
    }
    if (key === 'terms') { DV_TERMS.forEach(function (s) { frag.appendChild(dvTextCard(s)); }); return frag; }
    var e = dvPcard('dv-soon');
    e.innerHTML = dvIcon('info', 'dv-ico-lg');
    e.appendChild(dvEl('h2', '', 'Coming soon'));
    e.appendChild(dvEl('p', '', 'This page has not been published yet.'));
    frag.appendChild(e);
    return frag;
  }

  /* ---------- full-screen page layer with a native back arrow ---------- */
  var layer = doc.getElementById('dvPageLayer');
  var layerOpen = false;
  var layerTimer = 0;
  function dvMarkNav(key) {
    doc.querySelectorAll('#dvLeft .dv-nav').forEach(function (b) {
      if (key && b.getAttribute('data-page') === key) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }
  function dvCloseLayer() {
    layerOpen = false;
    layer.classList.remove('dv-on');
    layer.setAttribute('aria-hidden', 'true');
    clearTimeout(layerTimer);
    layerTimer = setTimeout(function () { if (!layerOpen) layer.replaceChildren(); }, 320);
    dvMarkNav(null);
  }
  function dvOpenLayer(key) {
    clearTimeout(layerTimer);
    var bar = dvEl('header', 'dv-pbar');
    var back = dvEl('button', 'dv-iconbtn dv-ripple');
    back.type = 'button';
    back.setAttribute('aria-label', 'Back');
    back.innerHTML = dvIcon('back');
    back.addEventListener('click', function () { DV.nav.back(1); });
    bar.appendChild(back);
    bar.appendChild(dvEl('h1', '', (DV.pagesData[key] && DV.pagesData[key].t) || DV_TITLES[key]));
    var body = dvEl('main', 'dv-pbody');
    body.appendChild(dvPageContent(key));
    layer.replaceChildren(bar, body);
    layer.classList.add('dv-on');
    layer.setAttribute('aria-hidden', 'false');
    layerOpen = true;
    dvMarkNav(key);
    requestAnimationFrame(function () {
      body.querySelectorAll('.dv-bio').forEach(function (w) { if (w.dvCheck) w.dvCheck(); });
    });
  }

  doc.querySelectorAll('#dvLeft .dv-nav').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-page');
      if (key === 'wall') { DV.nav.back(1); return; }
      dvShowDrawer(left, false);
      DV.nav.replaceTop('page', dvCloseLayer);
      dvOpenLayer(key);
    });
  });
  doc.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { DV.nav.back(1); });
  });
  DV.showView = function () { DV.wall.mount(main); };

  /* Right menu rows */
  darkSwitch.addEventListener('change', function () { dvSetTheme(darkSwitch.checked ? 'dark' : 'light'); });
  doc.getElementById('dvRowDark').addEventListener('click', function (e) {
    if (e.target === darkSwitch) return;
    dvSetTheme(darkSwitch.checked ? 'light' : 'dark');
  });
  fontRange.addEventListener('input', function () { dvSetFont(fontRange.value); });

  var dvDeferredInstall = null;
  w.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); dvDeferredInstall = e; });
  w.addEventListener('appinstalled', function () { dvDeferredInstall = null; });

  doc.getElementById('dvBtnInstall').addEventListener('click', function () {
    DV.nav.back(1, function () {
      var standalone = (w.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
      if (standalone) {
        DV.toast('Prayer House is already installed');
      } else if (dvDeferredInstall) {
        var ev = dvDeferredInstall;
        dvDeferredInstall = null;
        ev.prompt();
      } else {
        DV.modal.show({
          type: 'info', title: 'Install Prayer House',
          body: 'Tap the three-dot menu in Chrome, then choose Install app or Add to Home screen.',
          actions: [{ label: 'Got it' }]
        });
      }
    });
  });
  doc.getElementById('dvBtnShare').addEventListener('click', function () {
    DV.nav.back(1, function () {
      DV.share({ title: 'Prayer House', text: 'Join me on Prayer House. Share a request and pray for others.', url: DV.appUrl() });
    });
  });
  doc.getElementById('dvBtnQr').addEventListener('click', function () {
    DV.nav.back(1, dvQrModal);
  });

  /* ================= QR: show my code, scan to join ================= */
  function dvQrModal() {
    var stream = null;
    var raf = 0;
    var body = dvEl('div');
    var tabs = dvEl('div', 'dv-tabs');
    var tMine = dvEl('button', 'dv-chip', 'My QR');
    var tScan = dvEl('button', 'dv-chip', 'Scan');
    tMine.type = tScan.type = 'button';
    tabs.appendChild(tMine);
    tabs.appendChild(tScan);
    var panel = dvEl('div');
    body.appendChild(tabs);
    body.appendChild(panel);

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    }
    function setTab(which) {
      stop();
      tMine.setAttribute('aria-pressed', which === 'mine');
      tScan.setAttribute('aria-pressed', which === 'scan');
      panel.replaceChildren();
      if (which === 'mine') {
        var url = DV.appUrl();
        var box = dvEl('div', 'dv-qrbox');
        try { box.innerHTML = DV.qr.svg(url, { size: Math.min(w.innerWidth - 140, 280) }); } catch (e) { box.textContent = 'Link too long for a QR code.'; }
        panel.appendChild(box);
        panel.appendChild(dvEl('p', 'dv-meta', 'Friends can scan this code to join Prayer House.'));
      } else {
        panel.appendChild(dvEl('p', '', 'Point your camera at a Prayer House QR code to join.'));
        var go = dvEl('button', 'dv-btn dv-btn-block', 'Start camera');
        go.type = 'button';
        go.addEventListener('click', function () { startScan(go); });
        panel.appendChild(go);
      }
    }
    function handle(value) {
      stop();
      var u = null;
      try { u = new URL(value); } catch (e) {}
      if (u && u.origin === location.origin) {
        DV.modal.show({
          type: 'success', title: 'Prayer House found', body: 'Tap Join to open it.',
          actions: [{ label: 'Join', onClick: function () { location.href = u.href; } }, { label: 'Cancel', kind: 'text' }]
        });
      } else {
        DV.modal.show({
          type: 'info', title: 'Not a Prayer House code', body: 'This QR code is for something else, so it was not opened.',
          actions: [{ label: 'OK' }]
        });
      }
    }
    function startScan(btn) {
      if (!('BarcodeDetector' in w) || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        panel.replaceChildren(dvEl('p', '', 'This browser cannot scan inside the app. Open your phone camera app and point it at the code instead.'));
        return;
      }
      btn.disabled = true;
      var det = new BarcodeDetector({ formats: ['qr_code'] });
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }).then(function (s) {
        stream = s;
        var v = dvEl('video', 'dv-video');
        v.setAttribute('playsinline', '');
        v.muted = true;
        v.srcObject = s;
        panel.replaceChildren(v);
        return v.play().then(function () {
          (function tick() {
            if (!stream) return;
            det.detect(v).then(function (codes) {
              if (codes && codes.length) handle(codes[0].rawValue);
              else raf = requestAnimationFrame(tick);
            }).catch(function () { raf = requestAnimationFrame(tick); });
          })();
        });
      }).catch(function () {
        stop();
        panel.replaceChildren(dvEl('p', 'dv-t-error', 'Camera access was blocked. Allow the camera for this site in Chrome settings, then try again.'));
      });
    }
    tMine.addEventListener('click', function () { setTab('mine'); });
    tScan.addEventListener('click', function () { setTab('scan'); });
    setTab('mine');
    DV.modal.show({ title: 'QR Scan & Join', body: body, sticky: true, noFocus: true, onClose: stop, actions: [{ label: 'Close', kind: 'tonal' }] });
  }

  /* ================= Boot ================= */
  function dvBoot() {
    dvHydrate(doc);
    doc.getElementById('dvLeftLogo').innerHTML = dvLogo(56, '#FFFFFF', '#DF1E5A');
    dvSetTheme(doc.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    dvSetFont(parseInt(localStorage.getItem('dvFont'), 10) || 19);

    DV.db.get('kv', 'pages').then(function (p) {
      if (p) DV.pagesData = p;
      DV.showView();
      DV.wall.start();
    });

    var covered = false;
    try { covered = sessionStorage.getItem('dvCover') === '1'; } catch (e) {}
    if (!covered && DV.cover) {
      DV.cover.show(function () { try { sessionStorage.setItem('dvCover', '1'); } catch (e) {} });
    }

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      w.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
    }
  }
  dvBoot();
})(window);
