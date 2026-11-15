/* Prayer House - api.js (web app endpoint file)
 * The ONLY place the backend URL lives. Paste your deployed GAS web app URL below.
 * All calls are POST with Content-Type text/plain, which avoids CORS preflight.
 * Nothing in here runs on a timer: every request is started by a person's action.
 */
(function (w) {
  'use strict';
  var DV = (w.DV = w.DV || {});

  var DV_API_URL = 'PASTE_YOUR_GAS_WEB_APP_URL_HERE'; // https://script.google.com/macros/s/.../exec

  function dvConfigured() {
    return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(DV_API_URL);
  }

  /* Resolves with the parsed reply ({ ok: true, ... }). Rejects with Error whose
   * message is one of: CFG (URL not set), OFFLINE, TIMEOUT, NET, SERVER or a backend code. */
  function dvCall(action, data) {
    if (!dvConfigured()) return Promise.reject(new Error('CFG'));
    if (w.navigator && w.navigator.onLine === false) return Promise.reject(new Error('OFFLINE'));
    var ctl = new AbortController();
    var timer = setTimeout(function () {
      ctl.abort();
    }, 25000);
    var body = JSON.stringify(Object.assign({ action: action }, data || {}));
    return fetch(DV_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body,
      redirect: 'follow',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: ctl.signal
    })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error('SERVER');
        return res.text();
      })
      .then(function (txt) {
        var j;
        try {
          j = JSON.parse(txt);
        } catch (e) {
          throw new Error('SERVER');
        }
        if (j && j.ok === false) throw new Error(j.code || 'SERVER');
        return j;
      })
      .catch(function (err) {
        clearTimeout(timer);
        if (err && err.name === 'AbortError') throw new Error('TIMEOUT');
        if (err instanceof TypeError) throw new Error('NET');
        throw err;
      });
  }

  DV.api = { call: dvCall, configured: dvConfigured };
})(window);
