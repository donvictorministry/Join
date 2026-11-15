/* Prayer House - prayer-wall.js
 * The prayer chain wall: requests, "I prayed", sharing, answered prayer and testimonies.
 * Writes always go to an on-device queue first (IndexedDB), then are sent when the person acts.
 * Nothing here polls: data loads when the app opens, on pull-to-refresh, on Refresh and on Send now.
 */
(function (w) {
  'use strict';
  var DV = (w.DV = w.DV || {});
  if (DV.blocked) return;

  var CATS = ['Healing', 'Family', 'Guidance', 'Provision', 'Salvation', 'Thanksgiving', 'Other'];
  var RETRY = ['OFFLINE', 'NET', 'TIMEOUT', 'SERVER', 'BUSY', 'LIMIT', 'CFG', 'SETUP', 'ERR'];
  var S = { feed: { requests: [], testimonies: [] }, mine: [], prayed: {}, filter: 'all', queue: 0, host: null, fab: null, pull: null, flushing: null, loading: false };

  function el(t, c, x) { return DV.el(t, c, x); }

  /* ---------- device id (private, random, stays on this phone) ---------- */
  var devP = null;
  function dvDevice() {
    if (devP) return devP;
    devP = DV.db.get('kv', 'device').then(function (d) {
      if (d) return d;
      var a = new Uint8Array(24);
      crypto.getRandomValues(a);
      var cs = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      var s = '';
      for (var i = 0; i < 24; i++) s += cs.charAt(a[i] % cs.length);
      return DV.db.put('kv', s, 'device').then(function () { return s; });
    });
    return devP;
  }

  function dvAgo(t) {
    var s = Math.max(0, (Date.now() - Number(t)) / 1000);
    if (s < 60) return 'just now';
    var m = s / 60;
    if (m < 60) return Math.floor(m) + ' min ago';
    var h = m / 60;
    if (h < 24) return Math.floor(h) + ' hr ago';
    var d = Math.floor(h / 24);
    if (d < 30) return d + (d === 1 ? ' day ago' : ' days ago');
    return new Date(Number(t)).toLocaleDateString();
  }

  function dvFindMine(id) {
    for (var i = 0; i < S.mine.length; i++) if (S.mine[i].id === id || S.mine[i].localId === id) return S.mine[i];
    return null;
  }
  function dvSaveMine(rec) { return DV.db.put('mine', rec); }

  /* ---------- offline write queue ---------- */
  function dvEnqueue(action, payload, meta) {
    return DV.db.queueAdd({ action: action, payload: payload, meta: meta || {} }).then(function () {
      return DV.db.queueAll().then(function (a) { S.queue = a.length; });
    });
  }

  async function dvApplied(v, r, map) {
    var rec;
    if (v.action === 'submit_request' && r.id) {
      rec = dvFindMine(v.meta.localId);
      if (rec) {
        await DV.db.del('mine', rec.id);
        map[v.meta.localId] = r.id;
        rec.id = r.id;
        rec.status = 'pending';
        await dvSaveMine(rec);
        await DV.db.put('kv', map, 'idmap');
      }
    } else if (v.action === 'submit_testimony') {
      rec = dvFindMine(v.meta.recId);
      if (rec && rec.testi) { rec.testi.state = 'pending'; await dvSaveMine(rec); }
    }
    return map;
  }

  async function dvDropped(v) {
    var rec;
    if (v.action === 'submit_request') {
      rec = dvFindMine(v.meta.localId);
      if (rec) { rec.status = 'failed'; await dvSaveMine(rec); }
      var all = await DV.db.queueAll(); // items that depended on this request can never be sent
      for (var i = 0; i < all.length; i++) if (all[i].value.payload && all[i].value.payload.id === v.meta.localId) await DV.db.del('queue', all[i].key);
    } else if (v.action === 'submit_testimony') {
      rec = dvFindMine(v.meta.recId);
      if (rec && rec.testi) { rec.testi.state = 'failed'; await dvSaveMine(rec); }
    }
  }

  function dvFlush() {
    if (S.flushing) return S.flushing;
    S.flushing = (async function () {
      var items = await DV.db.queueAll();
      var sent = 0;
      var err = null;
      var map = (await DV.db.get('kv', 'idmap')) || {};
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var v = it.value;
        var p = Object.assign({}, v.payload);
        if (p.id && /^L/.test(p.id)) {
          if (map[p.id]) p.id = map[p.id];
          else continue;
        }
        try {
          var r = await DV.api.call(v.action, p);
          map = await dvApplied(v, r, map);
          await DV.db.del('queue', it.key);
          sent++;
        } catch (e) {
          var c = (e && e.message) || 'ERR';
          if (RETRY.indexOf(c) >= 0) { err = c; break; }
          await dvDropped(v);
          await DV.db.del('queue', it.key);
          err = c;
        }
      }
      var left = (await DV.db.queueAll()).length;
      S.queue = left;
      return { sent: sent, left: left, err: err };
    })().then(
      function (r) { S.flushing = null; return r; },
      function () { S.flushing = null; return { sent: 0, left: S.queue, err: 'ERR' }; }
    );
    return S.flushing;
  }

  /* ---------- loading data from the server (user triggered) ---------- */
  async function dvApplyBoot(res) {
    S.feed = { requests: res.requests || [], testimonies: res.testimonies || [] };
    await DV.db.put('kv', S.feed, 'feed');
    DV.pagesData = res.pages || {};
    await DV.db.put('kv', DV.pagesData, 'pages');
    if (res.mine) {
      var rm = {};
      var tm = {};
      res.mine.requests.forEach(function (x) { rm[x.id] = x; });
      res.mine.testimonies.forEach(function (x) { tm[x.r] = x; });
      for (var i = 0; i < S.mine.length; i++) {
        var rec = S.mine[i];
        var changed = false;
        if (rm[rec.id]) { rec.status = rm[rec.id].s; rec.prayed = rm[rec.id].p; changed = true; }
        if (tm[rec.id]) { rec.testi = rec.testi || { name: '', text: '', state: 'pending' }; rec.testi.state = tm[rec.id].s; changed = true; }
        if (changed) await dvSaveMine(rec);
      }
    }
  }

  async function dvRefresh(user) {
    if (S.loading) return;
    S.loading = true;
    dvPullState(true);
    try {
      await dvFlush();
      var dev = await dvDevice();
      var res = await DV.api.call('bootstrap', { device: dev, mine: S.mine.some(function (x) { return !/^L/.test(x.id); }) });
      await dvApplyBoot(res);
    } catch (e) {
      if (user) DV.showError(e && e.message);
    }
    S.loading = false;
    dvPullState(false);
    dvRender();
  }

  /* ---------- pull to refresh indicator ---------- */
  function dvPullShow(d) {
    if (!S.pull) return;
    S.pull.style.opacity = String(Math.min(1, d / 60));
    S.pull.style.transform = 'translateY(' + (d - 60) + 'px)';
  }
  function dvPullState(on) {
    if (!S.pull) return;
    S.pull.firstChild.setAttribute('class', on ? 'dv-ico dv-spin' : 'dv-ico');
    S.pull.style.transition = 'transform 0.2s, opacity 0.2s';
    if (on) dvPullShow(70);
    else dvPullShow(0);
    setTimeout(function () { if (S.pull) S.pull.style.transition = ''; }, 250);
  }

  /* ---------- rendering ---------- */
  var STATUS = {
    queued: ['Saved on this phone', 'dv-badge-warn'],
    pending: ['Waiting for approval', ''],
    approved: ['On the wall', 'dv-badge-ok'],
    answered: ['Answered', 'dv-badge-ok'],
    rejected: ['Not published', 'dv-badge-warn'],
    failed: ['Not sent', 'dv-badge-warn']
  };
  var TESTI_STATE = { queued: 'Saved on this phone', pending: 'Waiting for approval', approved: 'Published', rejected: 'Not published', failed: 'Not sent' };

  function fromFeed(r) {
    return {
      src: 'feed', id: r.id, name: r.n, cat: r.c, urg: r.u === 'urgent', text: r.x, status: r.s, prayed: r.p || 0, t: r.t,
      testi: S.feed.testimonies.filter(function (t) { return t.r === r.id; }), raw: r
    };
  }
  function fromMine(m) {
    return { src: 'mine', id: m.id, name: m.name, cat: m.cat, urg: m.urg, text: m.text, status: m.status, prayed: m.prayed || 0, t: m.t, rec: m };
  }
  function dvItems() {
    var f = S.filter;
    if (f === 'mine') return S.mine.slice().sort(function (a, b) { return b.t - a.t; }).map(fromMine);
    var list = S.feed.requests.filter(function (r) {
      if (f === 'urgent') return r.u === 'urgent' && r.s === 'approved';
      if (f === 'answered') return r.s === 'answered';
      return true;
    });
    if (f === 'all') {
      var hot = list.filter(function (r) { return r.u === 'urgent' && r.s === 'approved'; });
      var rest = list.filter(function (r) { return !(r.u === 'urgent' && r.s === 'approved'); });
      list = hot.concat(rest);
    }
    return list.map(fromFeed);
  }

  function btn(label, icon, kind, fn, extra) {
    var b = el('button', 'dv-btn ' + (kind === 'tonal' ? 'dv-btn-tonal' : kind === 'text' ? 'dv-btn-text' : '') + (extra ? ' ' + extra : ''));
    b.type = 'button';
    b.innerHTML = (icon ? DV.icon(icon) : '') + '<span></span>';
    b.lastChild.textContent = label;
    b.addEventListener('click', fn);
    return b;
  }

  function dvShareReq(it) {
    var t = it.text.length > 160 ? it.text.slice(0, 157) + '...' : it.text;
    DV.share({ title: 'Please pray', text: 'Please pray with me: \u201C' + t + '\u201D', url: DV.appUrl() });
  }

  function dvCard(it) {
    var cls = 'dv-link';
    if (it.status === 'answered') cls += ' dv-done';
    else if (it.urg && it.status !== 'rejected' && it.status !== 'failed') cls += ' dv-urgent';
    var wrap = el('div', cls);
    var card = el('div', 'dv-card');
    wrap.appendChild(card);

    var head = el('div', 'dv-card-head');
    head.appendChild(el('span', 'dv-badge', it.cat));
    if (it.urg) head.appendChild(el('span', 'dv-badge dv-badge-warn', 'Urgent'));
    if (it.src === 'mine') {
      var st = STATUS[it.status] || STATUS.pending;
      head.appendChild(el('span', 'dv-badge ' + st[1], st[0]));
    } else if (it.status === 'answered') {
      head.appendChild(el('span', 'dv-badge dv-badge-ok', 'Answered'));
    }
    card.appendChild(head);
    card.appendChild(el('div', 'dv-meta', (it.name || 'Anonymous') + ', ' + dvAgo(it.t)));
    card.appendChild(el('p', 'dv-req-text', it.text));

    var live = it.status === 'approved' || it.status === 'answered';
    if (it.src === 'mine' && live) card.appendChild(el('div', 'dv-meta', it.prayed + (it.prayed === 1 ? ' person has prayed' : ' people have prayed')));

    var tests = it.src === 'feed' ? it.testi : [];
    tests.forEach(function (t) {
      var b = el('div', 'dv-testi');
      b.appendChild(el('b', '', 'Testimony from ' + (t.n || 'Anonymous')));
      b.appendChild(el('p', '', t.x));
      card.appendChild(b);
    });
    if (it.src === 'mine' && it.rec.testi) {
      var tb = el('div', 'dv-testi');
      tb.appendChild(el('b', '', 'Your testimony: ' + (TESTI_STATE[it.rec.testi.state] || '')));
      tb.appendChild(el('p', '', it.rec.testi.text));
      card.appendChild(tb);
    }

    var acts = el('div', 'dv-actions');
    acts.style.marginTop = '12px';
    if (it.src === 'feed') {
      var done = !!S.prayed[it.id];
      var p = btn((done ? 'Prayed' : 'I prayed') + ' (' + it.prayed + ')', 'heart', 'tonal', function () { dvPray(it); }, done ? 'dv-pray-on' : '');
      if (done) p.disabled = true;
      acts.appendChild(p);
      acts.appendChild(btn('Pass it on', 'share', 'text', function () { dvShareReq(it); }));
    } else {
      var rec = it.rec;
      if (it.status === 'approved') acts.appendChild(btn('Mark as answered', 'check', 'tonal', function () { dvAnswer(rec); }));
      if (it.status === 'answered' && !rec.testi) acts.appendChild(btn('Share a testimony', 'edit', 'tonal', function () { dvTestimony(rec); }));
      if (live) acts.appendChild(btn('Pass it on', 'share', 'text', function () { dvShareReq(it); }));
      if (it.status === 'rejected' || it.status === 'failed') acts.appendChild(btn('Remove', 'close', 'text', function () { dvRemoveMine(rec); }));
    }
    if (acts.childNodes.length) card.appendChild(acts);
    return wrap;
  }

  function dvChips() {
    var bar = el('div', 'dv-chips');
    [['all', 'All'], ['urgent', 'Urgent'], ['answered', 'Answered'], ['mine', 'Mine']].forEach(function (c) {
      var b = el('button', 'dv-chip', c[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', S.filter === c[0] ? 'true' : 'false');
      b.addEventListener('click', function () {
        S.filter = c[0];
        dvRender();
        if (S.host) S.host.scrollTop = 0;
      });
      bar.appendChild(b);
    });
    var r = el('button', 'dv-chip');
    r.type = 'button';
    r.innerHTML = DV.icon('sync', 'dv-ico') + '<span>Refresh</span>';
    r.firstChild.setAttribute('style', 'width:20px;height:20px');
    r.addEventListener('click', function () { dvRefresh(true); });
    bar.appendChild(r);
    return bar;
  }

  function dvSyncBar() {
    var bar = el('div', 'dv-sync');
    bar.appendChild(el('span', '', S.queue + (S.queue === 1 ? ' item is saved on this phone.' : ' items are saved on this phone.')));
    var b = el('button', 'dv-btn', 'Send now');
    b.type = 'button';
    b.addEventListener('click', dvSendNow);
    bar.appendChild(b);
    return bar;
  }

  function dvEmpty() {
    var copy = {
      all: ['No prayer requests yet', 'Be the first to share a need. Others will pray with you.', true],
      urgent: ['No urgent requests right now', 'Urgent requests that are approved will be pinned here.', false],
      answered: ['No answered prayers yet', 'When a request is answered, it appears here with its testimony.', false],
      mine: ['You have not shared a request', 'Your requests and their progress will appear here, even offline.', true]
    }[S.filter];
    var e = el('div', 'dv-empty');
    e.innerHTML = DV.icon('heart', 'dv-ico-lg');
    e.appendChild(el('h2', '', copy[0]));
    e.appendChild(el('p', '', copy[1]));
    if (copy[2]) {
      var b = el('button', 'dv-btn', 'New request');
      b.type = 'button';
      b.addEventListener('click', dvNewRequest);
      e.appendChild(b);
    }
    return e;
  }

  function dvRender() {
    var h = S.host;
    if (!h) return;
    var top = h.scrollTop;
    h.replaceChildren();
    h.appendChild(dvChips());
    if (S.queue > 0) h.appendChild(dvSyncBar());
    var items = dvItems();
    if (!items.length) h.appendChild(dvEmpty());
    else {
      var chain = el('div', 'dv-chain');
      items.forEach(function (it) { chain.appendChild(dvCard(it)); });
      h.appendChild(chain);
    }
    h.scrollTop = top;
  }

  /* ---------- actions ---------- */
  function dvPray(it) {
    if (S.prayed[it.id]) return;
    S.prayed[it.id] = 1;
    DV.db.put('kv', Object.keys(S.prayed), 'prayed');
    if (it.raw) it.raw.p = (it.raw.p || 0) + 1;
    DV.db.put('kv', S.feed, 'feed');
    dvRender();
    dvDevice()
      .then(function (dev) { return dvEnqueue('pray', { id: it.id, device: dev }); })
      .then(dvFlush)
      .then(dvRender);
  }

  function dvField(label, node) {
    var l = el('label', 'dv-field');
    l.appendChild(el('span', '', label));
    l.appendChild(node);
    return l;
  }

  function dvNewRequest() {
    var body = el('div');
    var name = el('input', 'dv-input');
    name.placeholder = 'Anonymous if left blank';
    name.maxLength = 60;
    var cat = el('select', 'dv-select');
    CATS.forEach(function (c) { var o = el('option', '', c); o.value = c; cat.appendChild(o); });
    var row = el('div', 'dv-switch-row');
    row.appendChild(el('span', '', 'Mark as urgent'));
    var sw = el('label', 'dv-switch');
    var urgent = el('input');
    urgent.type = 'checkbox';
    urgent.setAttribute('aria-label', 'Mark as urgent');
    sw.appendChild(urgent);
    sw.appendChild(el('i'));
    row.appendChild(sw);
    var text = el('textarea', 'dv-textarea');
    text.placeholder = 'Share what you would like prayer for';
    text.maxLength = 600;
    var count = el('div', 'dv-count', '0 / 600');
    text.addEventListener('input', function () { count.textContent = text.value.length + ' / 600'; });
    var err = el('p', 'dv-t-error');

    body.appendChild(dvField('Your name (optional)', name));
    body.appendChild(dvField('Category', cat));
    body.appendChild(dvField('Your request', text));
    body.appendChild(count);
    body.appendChild(row);
    body.appendChild(err);

    DV.modal.show({
      title: 'New prayer request', body: body, sticky: true,
      actions: [
        { label: 'Send request', keep: true, onClick: submit },
        { label: 'Cancel', kind: 'text' }
      ]
    });

    async function submit() {
      var t = text.value.trim();
      if (t.length < 5) { err.textContent = 'Please write at least a few words.'; return; }
      DV.modal.show({ type: 'loading', title: 'Sending', body: 'Sharing your request...' });
      var dev = await dvDevice();
      var lid = 'L' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
      var rec = { id: lid, localId: lid, name: name.value.trim(), cat: cat.value, urg: urgent.checked, text: t, status: 'queued', prayed: 0, t: Date.now(), testi: null };
      S.mine.push(rec);
      await dvSaveMine(rec);
      await dvEnqueue('submit_request', { device: dev, name: rec.name, category: rec.cat, urgency: rec.urg ? 'urgent' : 'normal', text: t }, { localId: lid });
      var r = await dvFlush();
      var cur = dvFindMine(lid);
      S.filter = 'mine';
      dvRender();
      if (cur && cur.status === 'pending') {
        DV.modal.show({
          type: 'success', title: 'Request received',
          body: 'A moderator will review it before it appears on the wall. You can follow its progress under Mine.',
          actions: [{ label: 'OK' }]
        });
      } else if (cur && cur.status === 'failed') DV.showError(r.err || 'BAD');
      else if (r.err === 'CFG') DV.showError('CFG');
      else {
        DV.modal.show({
          type: 'info', title: 'Saved on this phone',
          body: 'The server could not be reached. Your request is safe here. Tap Send now when you are back online.',
          actions: [{ label: 'OK' }]
        });
      }
    }
  }

  function dvAnswer(rec) {
    DV.modal.show({
      type: 'confirm', title: 'Mark as answered?',
      body: 'It will show as answered on the Prayer Wall, and you can share a testimony.',
      actions: [
        { label: 'Yes, it was answered', onClick: go },
        { label: 'Not yet', kind: 'text' }
      ]
    });
    async function go() {
      rec.status = 'answered';
      await dvSaveMine(rec);
      var dev = await dvDevice();
      await dvEnqueue('answered', { id: rec.id, device: dev }, { recId: rec.id });
      dvRender();
      DV.modal.show({ type: 'loading', title: 'Updating', body: 'Please wait...' });
      var r = await dvFlush();
      dvRender();
      DV.modal.show({
        type: 'success', title: 'Praise God',
        body: r.left > 0 ? 'Saved on this phone. It will update the wall when you tap Send now.' : 'Your request is now marked as answered.',
        actions: [
          { label: 'Share a testimony', onClick: function () { dvTestimony(rec); } },
          { label: 'Later', kind: 'text' }
        ]
      });
    }
  }

  function dvTestimony(rec) {
    var body = el('div');
    var name = el('input', 'dv-input');
    name.value = rec.name || '';
    name.maxLength = 60;
    name.placeholder = 'Anonymous if left blank';
    var text = el('textarea', 'dv-textarea');
    text.placeholder = 'How did God answer?';
    text.maxLength = 500;
    var err = el('p', 'dv-t-error');
    body.appendChild(dvField('Your name (optional)', name));
    body.appendChild(dvField('Your testimony', text));
    body.appendChild(err);
    DV.modal.show({
      title: 'Share a testimony', body: body, sticky: true,
      actions: [{ label: 'Send testimony', keep: true, onClick: submit }, { label: 'Cancel', kind: 'text' }]
    });
    async function submit() {
      var t = text.value.trim();
      if (t.length < 5) { err.textContent = 'Please write at least a few words.'; return; }
      DV.modal.show({ type: 'loading', title: 'Sending', body: 'Please wait...' });
      var dev = await dvDevice();
      rec.testi = { name: name.value.trim(), text: t, state: 'queued' };
      await dvSaveMine(rec);
      await dvEnqueue('submit_testimony', { id: rec.id, name: rec.testi.name, text: t, device: dev }, { recId: rec.id });
      var r = await dvFlush();
      dvRender();
      if (rec.testi.state === 'pending') {
        DV.modal.show({ type: 'success', title: 'Testimony received', body: 'Thank you. It will appear after a moderator reviews it.', actions: [{ label: 'OK' }] });
      } else if (rec.testi.state === 'failed') {
        DV.showError(r.err || 'BAD');
      } else if (r.err === 'CFG') DV.showError('CFG');
      else {
        DV.modal.show({ type: 'info', title: 'Saved on this phone', body: 'Your testimony is safe here. Tap Send now when you are back online.', actions: [{ label: 'OK' }] });
      }
    }
  }

  function dvRemoveMine(rec) {
    DV.modal.show({
      type: 'confirm', title: 'Remove from this phone?', body: 'This only removes your private copy.',
      actions: [
        { kind: 'danger', label: 'Remove', onClick: function () {
          S.mine = S.mine.filter(function (x) { return x !== rec; });
          DV.db.del('mine', rec.id);
          dvRender();
        } },
        { label: 'Keep', kind: 'text' }
      ]
    });
  }

  async function dvSendNow() {
    DV.modal.show({ type: 'loading', title: 'Sending', body: 'Sending what is saved on this phone...' });
    var r = await dvFlush();
    if (r.left === 0) {
      await dvRefresh(false);
      DV.modal.show({ type: 'success', title: 'All sent', body: 'Everything saved on this phone has been sent.', actions: [{ label: 'OK' }] });
    } else {
      dvRender();
      DV.showError(r.err || 'NET');
    }
  }

  /* ---------- mount / start ---------- */
  function dvEnsureChrome() {
    if (!S.fab) {
      S.fab = el('button', 'dv-fab');
      S.fab.type = 'button';
      S.fab.innerHTML = DV.icon('add') + '<span>New request</span>';
      S.fab.addEventListener('click', dvNewRequest);
      document.body.appendChild(S.fab);
    }
    if (!S.pull) {
      S.pull = el('div', 'dv-pullind');
      S.pull.innerHTML = DV.icon('sync');
      document.body.appendChild(S.pull);
      var main = document.getElementById('dvMain');
      var ptr = { y: 0, on: false, armed: false };
      main.addEventListener('touchstart', function (e) {
        if (!S.host || main.scrollTop > 0 || S.loading || DV.modal.isOpen() || DV.nav.depth() > 0) return;
        ptr.y = e.touches[0].clientY;
        ptr.on = true;
        ptr.armed = false;
      }, { passive: true });
      main.addEventListener('touchmove', function (e) {
        if (!ptr.on) return;
        var dy = e.touches[0].clientY - ptr.y;
        if (dy <= 0) { ptr.on = false; dvPullShow(0); return; }
        dvPullShow(Math.min(dy * 0.5, 80));
        ptr.armed = dy > 130;
      }, { passive: true });
      main.addEventListener('touchend', function () {
        if (!ptr.on) return;
        ptr.on = false;
        if (ptr.armed) dvRefresh(true);
        else dvPullShow(0);
      });
    }
  }

  async function dvStart() {
    var d = await Promise.all([DV.db.get('kv', 'feed'), DV.db.get('kv', 'prayed'), DV.db.all('mine'), DV.db.queueAll()]);
    if (d[0]) S.feed = d[0];
    (d[1] || []).forEach(function (id) { S.prayed[id] = 1; });
    S.mine = d[2] || [];
    S.queue = d[3].length;
    dvRender();
    dvRefresh(false); // opening the app is the person's action
  }

  DV.wall = {
    mount: function (host) {
      S.host = host;
      dvEnsureChrome();
      S.fab.classList.remove('dv-hide');
      dvRender();
    },
    detach: function () {
      S.host = null;
      if (S.fab) S.fab.classList.add('dv-hide');
    },
    start: dvStart,
    refresh: dvRefresh,
    newRequest: dvNewRequest,
    enqueue: dvEnqueue,
    flush: dvFlush,
    device: dvDevice
  };
})(window);
