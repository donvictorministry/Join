/* Prayer House - computer-blocker.js
 * Strictly for Android phones. Load this FIRST (synchronously, in <head>).
 * Sets DV.blocked = true and replaces the page with a full-screen notice on anything else.
 */
(function (w) {
  'use strict';
  var DV = (w.DV = w.DV || {});
  var ua = (w.navigator && w.navigator.userAgent) || '';
  var uad = w.navigator && w.navigator.userAgentData;

  var isAndroid = /Android/i.test(ua);
  var isPhone = /Mobile/i.test(ua); // Android tablets omit "Mobile"
  var notDesktopHints = !/Windows NT|Macintosh|X11|CrOS|Linux x86_64|Linux i686/i.test(ua) || isAndroid;
  var uaMobileOk = !uad || uad.mobile !== false;
  var smallest = Math.min(w.screen ? w.screen.width : 0, w.screen ? w.screen.height : 0);
  var touchOk = (w.navigator.maxTouchPoints || 0) > 0;

  DV.blocked = !(isAndroid && isPhone && notDesktopHints && uaMobileOk && touchOk && smallest > 0 && smallest <= 900);

  if (!DV.blocked) return;

  function dvRenderBlock() {
    var css =
      'html,body{margin:0;padding:0;width:100%;height:100%;background:#121212;color:#fff;' +
      'font-family:Roboto,system-ui,sans-serif;font-size:19px;}' +
      '#dvBlock{position:fixed;inset:0;width:100dvw;height:100dvh;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;padding:32px;box-sizing:border-box;text-align:center;gap:20px;background:#121212;z-index:2147483647}' +
      '#dvBlock h1{font-size:1.5rem;margin:0;font-weight:500}#dvBlock p{font-size:1rem;line-height:1.55;margin:0;color:#E0E0E0}';
    var svg =
      '<svg width="88" height="88" viewBox="0 0 24 24" aria-hidden="true" fill="#DF1E5A">' +
      '<path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 20h-4v-1h4v1zm3.25-3H6.75V4h10.5v14z"/></svg>';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    document.body.innerHTML = '';
    var box = document.createElement('div');
    box.id = 'dvBlock';
    box.innerHTML = svg + '<h1>Open on an Android phone</h1><p>Prayer House is built for Android phones only. Open this link in Chrome on your phone to continue.</p>';
    document.body.appendChild(box);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dvRenderBlock);
  else dvRenderBlock();
})(window);
