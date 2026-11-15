/* Prayer House - cover-page.js
 * Full-screen welcome cover shown once per app launch. The person taps Enter to continue,
 * so nothing advances on a timer. Self-contained: it injects its own markup.
 */
(function (w) {
  'use strict';
  var DV = (w.DV = w.DV || {});
  if (DV.blocked) return;

  function dvCoverShow(onEnter) {
    var doc = document;
    var box = doc.createElement('div');
    box.className = 'dv-cover';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Welcome to Prayer House');

    var logo = doc.createElement('div');
    logo.innerHTML = DV.logo ? DV.logo(112, '#FFFFFF', '#DF1E5A') : '';

    var h = doc.createElement('h1');
    h.textContent = 'Prayer House';

    var p = doc.createElement('p');
    p.textContent = 'A prayer chain for your community. Share a need, pray for others, and celebrate what God answers.';

    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'dv-btn';
    b.textContent = 'Enter';
    b.addEventListener('click', function () {
      box.classList.add('dv-out');
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 400);
      if (onEnter) onEnter();
    });

    box.appendChild(logo);
    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(b);
    doc.body.appendChild(box);
  }

  DV.cover = { show: dvCoverShow };
})(window);
