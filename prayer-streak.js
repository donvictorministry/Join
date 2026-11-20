/* Prayer House - prayer-streak.js  (Daily Prayer Streak widget)
 * =====================================================================
 *  SELF-CONTAINED. This file depends on NO other file in the project.
 *
 *  ADD IT      one line in index.html, just before </body>:
 *                <script src="prayer-streak.js"></script>
 *  REMOVE IT   delete that one line (and the file if you like).
 *              Nothing else in the app references it.
 *  REWORK IT   edit the SETTINGS block below, or anything else in here.
 *
 *  What it does: adds a small "Pray today" button at the bottom-left of the
 *  screen. Tapping it opens a full-screen Daily Prayer page with the person's
 *  streak, today's request (the approved request that needs prayer most) and
 *  an "I prayed today" button. Everything is stored on the phone only.
 *
 *  It brings its own styles, storage, dialogs, toast and back-button handling.
 *  It only talks to your server if you paste the web app URL below.
 * =====================================================================
 */
(function () {
  'use strict';
  if (window.__psLoaded || !document.body) return;
  window.__psLoaded = true;

  /* ===================== SETTINGS (edit freely) ===================== */
  var PS = {
    // Optional. Paste your Google Apps Script web app URL (ends in /exec) to load a real
    // request each day. Leave as is to use the daily prayer focus list below instead.
    apiUrl: 'PASTE_YOUR_GAS_WEB_APP_URL_HERE',

    // One missed day is forgiven, but only once every this many days.
    graceEveryDays: 7,

    // Shown when a streak reaches these days.
    milestones: {
      3: '3 days of prayer. A habit is forming.',
      7: '7 days of prayer. A full week of standing with others.',
      14: '14 days of prayer. Two weeks of faithfulness.',
      30: '30 days of prayer. Thank you for standing with others.',
      50: '50 days of prayer. Your prayers are making a difference.',
      100: '100 days of prayer. What a faithful heart.',
      200: '200 days of prayer. Keep going, you are a gift.',
      365: 'One full year of daily prayer. Glory to God.'
    },

    // Used when no request can be loaded. One per day, repeating.
    prompts: [
      'Thank God for three good things from this week.',
      'Pray for someone you know who is hurting today.',
      'Pray for your family, one person at a time.',
      'Pray for wisdom in the decisions in front of you.',
      'Pray for your church and its leaders.',
      'Pray for people who are sick or in hospital.',
      'Pray for peace in your community and nation.',
      'Pray for someone you find hard to love.',
      'Pray for children and young people.',
      'Pray for those who have lost someone.',
      'Pray for people who are far from home or alone.',
      'Pray for strength for the weary.',
      'Pray over the work of your hands this week.',
      'Pray for those who do not yet know God\u2019s love.',
      'Pray for forgiveness, and forgive someone in your heart.',
      'Pray for the poor and those without food or shelter.',
      'Pray for teachers and students.',
      'Pray for health workers and caregivers.',
      'Pray that your friends would feel God\u2019s nearness.',
      'Pray for a grateful heart.',
      'Pray for hope for someone who is discouraged.'
    ]
  };

  /* ===================== tiny helpers ===================== */
  var KEY_STATE = 'psStreak';
  var KEY_DAILY = 'psDaily';
  var KEY_DEV = 'psDev';
  var doc = document;

  function h(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function haptic(p) { try { if (navigator.vibrate) navigator.vibrate(p || 10); } catch (e) {} }

  var ICONS = {
    flame: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
    back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    check: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    help: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
    sync: 'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || 'ps-ico') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + ICONS[name] + '"/></svg>';
  }

  /* ===================== dates and streak rules ===================== */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dstr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return dstr(new Date()); }
  function diff(a, b) {
    var x = a.split('-'), y = b.split('-');
    return Math.round((Date.UTC(+y[0], +y[1] - 1, +y[2]) - Date.UTC(+x[0], +x[1] - 1, +x[2])) / 86400000);
  }
  function loadState() {
    var s = lsGet(KEY_STATE) || {};
    return { streak: s.streak || 0, best: s.best || 0, last: s.last || '', total: s.total || 0, days: s.days || [], grace: s.grace || '' };
  }
  function graceAvailable(s, t) { return !s.grace || diff(s.grace, t) >= PS.graceEveryDays; }
  /* Is the streak still alive today? */
  function alive(s, t) {
    if (!s.last || !s.streak) return false;
    var g = diff(s.last, t);
    return g <= 1 || (g === 2 && graceAvailable(s, t));
  }
  function shown(s, t) { return alive(s, t) ? s.streak : 0; }
  function prayedToday(s, t) { return s.last === t; }
  function recordPrayer() {
    var s = loadState(), t = today(), usedGrace = false;
    if (s.last === t) return { already: true, s: s };
    if (alive(s, t)) {
      if (diff(s.last, t) === 2) { usedGrace = true; s.grace = t; }
      s.streak += 1;
    } else s.streak = 1;
    s.last = t;
    s.total += 1;
    s.best = Math.max(s.best, s.streak);
    s.days.push(t);
    s.days = s.days.slice(-60);
    lsSet(KEY_STATE, s);
    return { s: s, usedGrace: usedGrace, milestone: PS.milestones[s.streak] || '' };
  }

  /* ===================== today's request or prayer focus ===================== */
  function dayOfYear() {
    var n = new Date();
    return Math.floor((n - new Date(n.getFullYear(), 0, 0)) / 86400000);
  }
  function promptToday() { return PS.prompts[dayOfYear() % PS.prompts.length]; }
  function deviceId() {
    var d = lsGet(KEY_DEV);
    if (d) return d;
    var a = new Uint8Array(24), cs = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', s = '';
    (window.crypto || {}).getRandomValues && crypto.getRandomValues(a);
    for (var i = 0; i < 24; i++) s += cs.charAt((a[i] || Math.floor(Math.random() * 255)) % cs.length);
    lsSet(KEY_DEV, s);
    return s;
  }
  function configured() { return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(PS.apiUrl); }
  function call(action, data, ms) {
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, ms || 9000);
    return fetch(PS.apiUrl, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: action }, data || {})),
      redirect: 'follow', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: ctl.signal
    }).then(function (r) { clearTimeout(timer); return r.json(); })
      .then(function (j) { if (!j || j.ok === false) throw new Error('SERVER'); return j; })
      .catch(function (e) { clearTimeout(timer); throw e; });
  }
  /* The approved, unanswered request with the fewest prayers (urgent first, then oldest). */
  function pickRequest(list) {
    var c = (list || []).filter(function (r) { return r.s === 'approved'; });
    if (!c.length) return null;
    c.sort(function (a, b) {
      return (a.p || 0) - (b.p || 0) || (b.u === 'urgent') - (a.u === 'urgent') || (a.t || 0) - (b.t || 0);
    });
    var r = c[0];
    return { date: today(), id: r.id, text: r.x, name: r.n, cat: r.c, p: r.p || 0 };
  }
  function storedDaily() {
    var d = lsGet(KEY_DAILY);
    return d && d.date === today() ? d : null;
  }

  /* ===================== styles (all prefixed ps-) ===================== */
  var css = '' +
    '.ps-root{--ps-bg:#FFFFFF;--ps-surface:#F8F9FA;--ps-text:#121212;--ps-text2:#4A4A4A;--ps-outline:#E0E0E0;--ps-tint:rgba(223,30,90,.08);' +
    '--ps-primary:#DF1E5A;--ps-hover:#C2194D;--ps-ok:#146C2E;--ps-err:#B3261E;--ps-fs:max(1rem,19px);' +
    'font-family:Roboto,"Google Sans",system-ui,sans-serif;font-size:var(--ps-fs);line-height:1.5;color:var(--ps-text);box-sizing:border-box;-webkit-tap-highlight-color:transparent}' +
    '.ps-root *,.ps-root *::before,.ps-root *::after{box-sizing:border-box}' +
    '.ps-root.ps-dark{--ps-bg:#121212;--ps-surface:#1E1E1E;--ps-text:#FFFFFF;--ps-text2:#C9C9C9;--ps-outline:#333333;--ps-tint:rgba(223,30,90,.18);--ps-ok:#6FD58A;--ps-err:#F2B8B5}' +
    '.ps-ico{width:24px;height:24px;fill:currentColor;display:block;flex:none}' +
    '.ps-btn{min-height:52px;padding:0 24px;border-radius:26px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;cursor:pointer;' +
    'font:inherit;font-weight:500;background:var(--ps-primary);color:#FFFFFF;touch-action:manipulation;transition:transform .08s,background-color .12s}' +
    '.ps-btn:active{transform:scale(.97);background:var(--ps-hover)}.ps-btn[disabled]{opacity:.55}' +
    '.ps-btn-tonal{background:var(--ps-tint);color:var(--ps-primary)}.ps-btn-tonal:active{background:rgba(223,30,90,.22)}' +
    '.ps-btn-text{background:transparent;color:var(--ps-primary)}.ps-btn-block{width:100%}' +
    /* floating button */
    '.ps-pill{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom));height:60px;padding:0 20px 0 16px;border-radius:20px;z-index:3;' +
    'display:inline-flex;align-items:center;gap:10px;background:var(--ps-surface);color:var(--ps-text);border:2px solid var(--ps-primary);font:inherit;font-weight:500;' +
    'box-shadow:0 3px 8px rgba(0,0,0,.3);cursor:pointer;touch-action:manipulation;transition:transform .08s}' +
    '.ps-pill:active{transform:scale(.95)}.ps-pill .ps-ico{color:var(--ps-primary);width:28px;height:28px}' +
    '.ps-pill.ps-done .ps-ico{color:var(--ps-ok)}' +
    '.ps-pill.ps-due{animation:ps-pulse 2.4s ease-out infinite}' +
    '@keyframes ps-pulse{0%{box-shadow:0 3px 8px rgba(0,0,0,.3),0 0 0 0 rgba(223,30,90,.5)}70%{box-shadow:0 3px 8px rgba(0,0,0,.3),0 0 0 14px rgba(223,30,90,0)}100%{box-shadow:0 3px 8px rgba(0,0,0,.3),0 0 0 0 rgba(223,30,90,0)}}' +
    /* full-screen page */
    '.ps-sheet{position:fixed;inset:0;width:100dvw;height:100dvh;z-index:150;display:flex;flex-direction:column;background:var(--ps-bg);' +
    'padding-top:env(safe-area-inset-top);transform:translateY(100%);transition:transform .28s cubic-bezier(.2,0,0,1)}' +
    '.ps-sheet.ps-on{transform:translateY(0)}' +
    '.ps-bar{flex:none;height:64px;display:flex;align-items:center;gap:8px;padding:0 16px 0 4px;background:var(--ps-primary);color:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.3)}' +
    '.ps-bar h1{margin:0;font-size:calc(var(--ps-fs) * 1.25);font-weight:500}' +
    '.ps-back{width:48px;height:48px;border-radius:50%;border:0;background:transparent;color:inherit;display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:manipulation}' +
    '.ps-back:active{background:rgba(255,255,255,.22);transform:scale(.95)}' +
    '.ps-body{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior-y:contain;padding-bottom:calc(32px + env(safe-area-inset-bottom))}' +
    '.ps-card{width:100%;margin:12px 0 0;padding:22px 20px;background:var(--ps-surface);border:solid var(--ps-outline);border-width:1px 0;border-left:4px solid var(--ps-primary)}' +
    '.ps-card p{margin:0 0 12px;line-height:1.65;overflow-wrap:anywhere}.ps-card p:last-child{margin-bottom:0}' +
    '.ps-card h2{margin:0 0 10px;font-size:calc(var(--ps-fs) * 1.2);font-weight:500;line-height:1.3}' +
    '.ps-meta{color:var(--ps-text2)}' +
    '.ps-badge{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:8px;background:var(--ps-tint);color:var(--ps-primary);font-weight:500;margin-bottom:10px}' +
    '.ps-streak{text-align:center;padding-top:28px}' +
    '.ps-big{display:flex;align-items:center;justify-content:center;gap:10px;color:var(--ps-primary)}' +
    '.ps-big .ps-ico{width:56px;height:56px}.ps-num{font-size:calc(var(--ps-fs) * 3.2);font-weight:500;line-height:1}' +
    '.ps-days{display:flex;justify-content:space-between;gap:6px;margin:18px 0 6px}' +
    '.ps-day{flex:1 1 0;display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--ps-text2)}' +
    '.ps-dot{width:34px;height:34px;border-radius:50%;border:2px solid var(--ps-outline);display:flex;align-items:center;justify-content:center;color:#FFFFFF}' +
    '.ps-dot.ps-hit{background:var(--ps-primary);border-color:var(--ps-primary)}.ps-dot.ps-now{border-color:var(--ps-primary)}' +
    '.ps-dot .ps-ico{width:20px;height:20px}' +
    '.ps-note{margin-top:12px;color:var(--ps-ok);font-weight:500}' +
    '.ps-bar-track{height:14px;border-radius:7px;background:var(--ps-outline);overflow:hidden;margin:12px 0 8px}' +
    '.ps-bar-fill{height:100%;background:var(--ps-primary);border-radius:7px;transition:width .4s}' +
    '.ps-list{margin:0;padding-left:1.25em}.ps-list li{margin-bottom:8px;line-height:1.6}.ps-list li:last-child{margin-bottom:0}' +
    '.ps-card .ps-btn{margin-top:16px}' +
    /* dialog + toast */
    '.ps-wrap{position:fixed;inset:0;width:100dvw;height:100dvh;z-index:160;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);padding:24px;opacity:0;transition:opacity .18s}' +
    '.ps-wrap.ps-on{opacity:1}' +
    '.ps-dlg{width:100%;max-height:calc(100dvh - 48px);overflow-y:auto;background:var(--ps-surface);color:var(--ps-text);border-radius:28px;padding:24px;box-shadow:0 8px 24px rgba(0,0,0,.4)}' +
    '.ps-dlg h3{margin:0 0 12px;font-size:calc(var(--ps-fs) * 1.3);font-weight:500;text-align:center}' +
    '.ps-dlg p{margin:0;text-align:center;line-height:1.55}' +
    '.ps-dlg-ico{display:flex;justify-content:center;margin-bottom:8px;color:var(--ps-primary)}.ps-dlg-ico .ps-ico{width:44px;height:44px}' +
    '.ps-acts{display:flex;flex-direction:column;gap:8px;margin-top:20px}' +
    '.ps-spin{animation:ps-rot .9s linear infinite}@keyframes ps-rot{to{transform:rotate(360deg)}}' +
    '.ps-toast{position:fixed;left:50%;top:50%;width:calc(100dvw - 64px);padding:16px 24px;border-radius:28px;background:rgba(50,50,50,.96);color:#FFFFFF;text-align:center;' +
    'line-height:1.45;transform:translate(-50%,-50%) scale(.9);opacity:0;transition:opacity .22s,transform .22s;z-index:170;pointer-events:none;box-shadow:0 6px 20px rgba(0,0,0,.4)}' +
    '.ps-toast.ps-on{opacity:1;transform:translate(-50%,-50%) scale(1)}' +
    '.ps-root.ps-dark.ps-toast{background:rgba(230,230,230,.96);color:#121212}' +
    '@media (prefers-reduced-motion:reduce){.ps-pill.ps-due{animation:none}.ps-sheet{transition:none}.ps-spin{animation-iteration-count:1}}';
  var style = h('style');
  style.id = 'ps-style';
  style.textContent = css;
  doc.head.appendChild(style);

  /* ===================== theme (follows the page, no dependency) ===================== */
  function isDark() {
    var a = doc.documentElement.getAttribute('data-theme');
    if (a) return a === 'dark';
    return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function theme(n) { n.classList.add('ps-root'); n.classList.toggle('ps-dark', isDark()); return n; }
  try {
    new MutationObserver(function () {
      doc.querySelectorAll('.ps-root').forEach(function (n) { n.classList.toggle('ps-dark', isDark()); });
    }).observe(doc.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) {}

  doc.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('.ps-btn,.ps-pill,.ps-back')) haptic(10);
  }, { passive: true });

  /* ===================== back button (own history entries) ===================== */
  var stack = [];
  var pending = null;
  function push(closeFn) {
    stack.push(closeFn);
    history.pushState(Object.assign({}, history.state || {}, { pw: stack.length }), '');
  }
  function goBack(cb) { pending = cb || null; history.back(); }
  window.addEventListener('popstate', function (e) {
    var n = (e.state && e.state.pw) || 0;
    while (stack.length > n) { var f = stack.pop(); try { f(); } catch (x) {} }
    if (pending) { var cb = pending; pending = null; setTimeout(cb, 0); }
  });

  /* ===================== centered dialog + toast ===================== */
  var dlgWrap = null;
  function dialog(o) {
    var box = h('div', 'ps-dlg');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    var name = { loading: 'sync', confirm: 'help' }[o.type];
    if (name) {
      var ic = h('div', 'ps-dlg-ico');
      ic.innerHTML = icon(name, o.type === 'loading' ? 'ps-ico ps-spin' : 'ps-ico');
      box.appendChild(ic);
    }
    if (o.title) box.appendChild(h('h3', '', o.title));
    if (o.body) box.appendChild(h('p', '', o.body));
    if (o.actions) {
      var row = h('div', 'ps-acts');
      o.actions.forEach(function (a) {
        var b = h('button', 'ps-btn' + (a.kind === 'text' ? ' ps-btn-text' : a.kind === 'tonal' ? ' ps-btn-tonal' : ''), a.label);
        b.type = 'button';
        b.addEventListener('click', function () {
          if (a.keep) a.onClick && a.onClick();
          else closeDialog(a.onClick);
        });
        row.appendChild(b);
      });
      box.appendChild(row);
    }
    if (!dlgWrap) {
      var w = theme(h('div', 'ps-wrap'));
      dlgWrap = w;
      w.appendChild(box);
      doc.body.appendChild(w);
      requestAnimationFrame(function () { w.classList.add('ps-on'); });
      push(function () { if (w.parentNode) w.parentNode.removeChild(w); dlgWrap = null; });
    } else dlgWrap.replaceChildren(box);
  }
  function closeDialog(cb) {
    if (!dlgWrap) { if (cb) cb(); return; }
    goBack(cb);
  }
  function toast(msg, ms) {
    var t = theme(h('div', 'ps-toast', msg));
    t.setAttribute('role', 'status');
    doc.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('ps-on'); });
    haptic([15, 30, 15]);
    setTimeout(function () {
      t.classList.remove('ps-on');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, ms || 1800 + msg.length * 35);
  }

  /* ===================== floating button ===================== */
  var pill = theme(h('button', 'ps-pill'));
  pill.type = 'button';
  pill.setAttribute('aria-label', 'Open daily prayer');
  doc.body.appendChild(pill);
  pill.addEventListener('click', openSheet);

  function refreshPill() {
    var s = loadState(), t = today(), n = shown(s, t), done = prayedToday(s, t);
    pill.classList.toggle('ps-done', done);
    pill.classList.toggle('ps-due', !done);
    pill.innerHTML = icon(done ? 'check' : 'flame') + '<span></span>';
    pill.lastChild.textContent = n > 0 ? 'Day ' + n : 'Pray today';
  }
  refreshPill();

  /* ===================== the full-screen Daily Prayer page ===================== */
  var sheet = null, body = null;

  function card(cls) { return h('section', 'ps-card' + (cls ? ' ' + cls : '')); }

  function render() {
    if (!body) return;
    var s = loadState(), t = today(), n = shown(s, t), done = prayedToday(s, t);
    var daily = storedDaily();
    var nodes = [];

    /* streak */
    var c1 = card('ps-streak');
    var big = h('div', 'ps-big');
    big.innerHTML = icon('flame');
    big.appendChild(h('span', 'ps-num', String(n)));
    c1.appendChild(big);
    c1.appendChild(h('p', 'ps-meta', 'day streak'));
    c1.appendChild(h('p', 'ps-meta', 'Best streak: ' + s.best + (s.best === 1 ? ' day' : ' days')));
    c1.appendChild(h('p', 'ps-meta', 'Total prayers: ' + s.total));
    var days = h('div', 'ps-days');
    for (var i = 6; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var ds = dstr(d), hit = s.days.indexOf(ds) >= 0;
      var col = h('div', 'ps-day');
      var dot = h('div', 'ps-dot' + (hit ? ' ps-hit' : '') + (i === 0 ? ' ps-now' : ''));
      if (hit) dot.innerHTML = icon('check');
      col.appendChild(dot);
      col.appendChild(h('span', '', 'SMTWTFS'.charAt(d.getDay())));
      days.appendChild(col);
    }
    c1.appendChild(days);
    if (!done && s.last && n > 0 && diff(s.last, t) === 2) {
      c1.appendChild(h('p', 'ps-note', 'You missed a day, but your streak is safe. Pray today to keep it.'));
    } else if (!done && s.streak > 0 && n === 0) {
      c1.appendChild(h('p', 'ps-note', 'A new streak starts with today\u2019s prayer.'));
    }
    nodes.push(c1);

    /* today's request or focus */
    var c2 = card();
    if (daily) {
      c2.appendChild(h('h2', '', 'Today\u2019s request'));
      c2.appendChild(h('span', 'ps-badge', daily.cat || 'Prayer request'));
      c2.appendChild(h('p', '', daily.text));
      c2.appendChild(h('p', 'ps-meta', (daily.name || 'Anonymous') + '. Chosen because it needs more prayer.'));
    } else {
      c2.appendChild(h('h2', '', 'Today\u2019s prayer focus'));
      c2.appendChild(h('p', '', promptToday()));
    }
    var go = h('button', 'ps-btn ps-btn-block', done ? 'Prayed today' : 'I prayed today');
    go.type = 'button';
    if (done) { go.disabled = true; c2.appendChild(go); c2.appendChild(h('p', 'ps-note', 'Done for today. Come back tomorrow to keep your streak growing.')); }
    else { go.addEventListener('click', confirmPray); c2.appendChild(go); }
    nodes.push(c2);

    /* next milestone */
    var keys = Object.keys(PS.milestones).map(Number).sort(function (a, b) { return a - b; });
    var next = keys.filter(function (k) { return k > n; })[0];
    var c3 = card();
    c3.appendChild(h('h2', '', 'Next milestone'));
    if (next) {
      c3.appendChild(h('p', '', next + ' days. ' + (next - n) + (next - n === 1 ? ' day to go.' : ' days to go.')));
      var track = h('div', 'ps-bar-track'), fill = h('div', 'ps-bar-fill');
      fill.style.width = Math.max(4, Math.min(100, Math.round((n / next) * 100))) + '%';
      track.appendChild(fill);
      c3.appendChild(track);
    } else c3.appendChild(h('p', '', 'You have reached every milestone. Thank you for praying.'));
    nodes.push(c3);

    /* how it works */
    var c4 = card();
    c4.appendChild(h('h2', '', 'How it works'));
    var ul = h('ul', 'ps-list');
    [
      'Pray once a day to grow your streak.',
      'Miss a day? One missed day is forgiven, once every ' + PS.graceEveryDays + ' days.',
      'Your streak is saved on this phone only.'
    ].forEach(function (x) { ul.appendChild(h('li', '', x)); });
    c4.appendChild(ul);
    var reset = h('button', 'ps-btn ps-btn-text', 'Reset my streak');
    reset.type = 'button';
    reset.addEventListener('click', confirmReset);
    c4.appendChild(reset);
    nodes.push(c4);

    body.replaceChildren.apply(body, nodes);
  }

  function openSheet() {
    if (sheet) return;
    sheet = theme(h('div', 'ps-sheet'));
    var bar = h('header', 'ps-bar');
    var back = h('button', 'ps-back');
    back.type = 'button';
    back.setAttribute('aria-label', 'Back');
    back.innerHTML = icon('back');
    back.addEventListener('click', function () { goBack(); });
    bar.appendChild(back);
    bar.appendChild(h('h1', '', 'Daily Prayer'));
    body = h('main', 'ps-body');
    sheet.appendChild(bar);
    sheet.appendChild(body);
    doc.body.appendChild(sheet);
    requestAnimationFrame(function () { sheet.classList.add('ps-on'); });
    var mine = sheet;
    push(function () {
      mine.classList.remove('ps-on');
      setTimeout(function () { if (mine.parentNode) mine.parentNode.removeChild(mine); }, 300);
      sheet = null; body = null;
      refreshPill();
    });
    if (!storedDaily() && configured() && navigator.onLine !== false) {
      dialog({ type: 'loading', title: 'Finding today\u2019s request', body: 'Please wait...' });
      call('bootstrap').then(function (r) {
        var pick = pickRequest(r.requests);
        if (pick) lsSet(KEY_DAILY, pick);
      }).catch(function () {}).then(function () {
        closeDialog(render);
      });
    }
    render();
  }

  /* ===================== actions: confirm, spinner, toast ===================== */
  function confirmPray() {
    haptic(15);
    var daily = storedDaily();
    dialog({
      type: 'confirm', title: 'Pray now?',
      body: daily ? 'Take a moment to pray for this request, then tap Yes, I prayed.' : 'Take a moment to pray, then tap Yes, I prayed.',
      actions: [
        { label: 'Yes, I prayed', keep: true, onClick: doPray },
        { label: 'Cancel', kind: 'text' }
      ]
    });
  }
  function doPray() {
    dialog({ type: 'loading', title: 'Saving', body: 'Adding your prayer...' });
    var daily = storedDaily();
    var started = Date.now();
    var send = daily && daily.id && configured() && navigator.onLine !== false
      ? call('pray', { id: daily.id, device: deviceId() }).catch(function () {})
      : Promise.resolve();
    send.then(function () {
      var wait = Math.max(0, 700 - (Date.now() - started)); // let the spinner be seen
      setTimeout(function () {
        var r = recordPrayer();
        closeDialog(function () {
          refreshPill();
          render();
          var s = r.s, msg = 'Day ' + s.streak + '. Thank you for praying.';
          if (r.usedGrace) msg = 'Streak saved. Day ' + s.streak + '. Thank you for praying.';
          if (r.milestone) msg = r.milestone;
          toast(msg, r.milestone ? 4200 : 0);
        });
      }, wait);
    });
  }
  function confirmReset() {
    dialog({
      type: 'confirm', title: 'Reset your streak?',
      body: 'Your streak and prayer history on this phone will be cleared. This cannot be undone.',
      actions: [
        { label: 'Yes, reset', keep: true, onClick: function () {
          dialog({ type: 'loading', title: 'Resetting', body: 'Please wait...' });
          setTimeout(function () {
            try { localStorage.removeItem(KEY_STATE); localStorage.removeItem(KEY_DAILY); } catch (e) {}
            closeDialog(function () { refreshPill(); render(); toast('Streak reset'); });
          }, 500);
        } },
        { label: 'Cancel', kind: 'text' }
      ]
    });
  }
})();
