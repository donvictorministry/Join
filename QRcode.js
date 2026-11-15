/* Prayer House - QRcode.js
 * Dependency-free QR code generator (byte mode, error correction L, versions 1-10).
 * Output is an inline SVG string, so no images or CDN files are needed.
 * Usage: DV.qr.svg('https://example.com', { size: 240 })
 */
(function (w) {
  'use strict';
  var DV = (w.DV = w.DV || {});

  var DV_QR_DATA = [19, 34, 55, 80, 108, 136, 156, 194, 232, 274]; // data codewords, level L
  var DV_QR_ECC = [7, 10, 15, 20, 26, 18, 20, 24, 30, 18]; // ec codewords per block
  var DV_QR_BLOCKS = [1, 1, 1, 1, 1, 2, 2, 2, 2, 4]; // block count
  var DV_QR_ALIGN = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  var EXP = new Array(512);
  var LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 256) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function dvMul(a, b) {
    return a && b ? EXP[LOG[a] + LOG[b]] : 0;
  }

  function dvRsGen(n) {
    var g = [1];
    for (var i = 0; i < n; i++) {
      var ng = new Array(g.length + 1).fill(0);
      for (var j = 0; j < g.length; j++) {
        ng[j] ^= g[j];
        ng[j + 1] ^= dvMul(g[j], EXP[i]);
      }
      g = ng;
    }
    return g;
  }

  function dvRsEncode(data, n) {
    var g = dvRsGen(n);
    var res = new Array(n).fill(0);
    for (var i = 0; i < data.length; i++) {
      var f = data[i] ^ res[0];
      res.shift();
      res.push(0);
      if (f) for (var j = 0; j < n; j++) res[j] ^= dvMul(g[j + 1], f);
    }
    return res;
  }

  function dvUtf8(text) {
    if (w.TextEncoder) return Array.prototype.slice.call(new TextEncoder().encode(text));
    var s = unescape(encodeURIComponent(text));
    var out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  function dvBuildCodewords(bytes) {
    var v = 0;
    for (var i = 0; i < 10; i++) {
      var lenBits = i + 1 <= 9 ? 8 : 16;
      if (4 + lenBits + bytes.length * 8 <= DV_QR_DATA[i] * 8) {
        v = i + 1;
        break;
      }
    }
    if (!v) throw new Error('QR_TOO_LONG');
    var cap = DV_QR_DATA[v - 1];
    var bits = [];
    function put(val, len) {
      for (var k = len - 1; k >= 0; k--) bits.push((val >>> k) & 1);
    }
    put(4, 4);
    put(bytes.length, v <= 9 ? 8 : 16);
    bytes.forEach(function (b) {
      put(b, 8);
    });
    for (var t = 0; t < 4 && bits.length < cap * 8; t++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    var cw = [];
    for (var p = 0; p < bits.length; p += 8) {
      var byte = 0;
      for (var q = 0; q < 8; q++) byte = (byte << 1) | bits[p + q];
      cw.push(byte);
    }
    for (var pad = 0; cw.length < cap; pad++) cw.push(pad % 2 ? 0x11 : 0xec);

    var nb = DV_QR_BLOCKS[v - 1];
    var ecc = DV_QR_ECC[v - 1];
    var short = Math.floor(cap / nb);
    var longCount = cap % nb;
    var blocks = [];
    var ecs = [];
    var pos = 0;
    for (var b = 0; b < nb; b++) {
      var len = short + (b >= nb - longCount ? 1 : 0);
      var blk = cw.slice(pos, pos + len);
      pos += len;
      blocks.push(blk);
      ecs.push(dvRsEncode(blk, ecc));
    }
    var out = [];
    var maxLen = short + (longCount ? 1 : 0);
    for (var c = 0; c < maxLen; c++) for (var k2 = 0; k2 < nb; k2++) if (c < blocks[k2].length) out.push(blocks[k2][c]);
    for (var e = 0; e < ecc; e++) for (var k3 = 0; k3 < nb; k3++) out.push(ecs[k3][e]);
    return { version: v, codewords: out };
  }

  function dvBuildMatrix(version, codewords) {
    var n = 17 + 4 * version;
    var m = [];
    var fn = [];
    for (var r = 0; r < n; r++) {
      m.push(new Array(n).fill(false));
      fn.push(new Array(n).fill(false));
    }
    function setFn(r2, c2, v) {
      m[r2][c2] = v;
      fn[r2][c2] = true;
    }
    function finder(r0, c0) {
      for (var dr = -1; dr <= 7; dr++)
        for (var dc = -1; dc <= 7; dc++) {
          var rr = r0 + dr;
          var cc = c0 + dc;
          if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
          var on =
            (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
            (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
          setFn(rr, cc, on);
        }
    }
    finder(0, 0);
    finder(0, n - 7);
    finder(n - 7, 0);
    for (var i = 8; i < n - 8; i++) {
      setFn(6, i, i % 2 === 0);
      setFn(i, 6, i % 2 === 0);
    }
    var al = DV_QR_ALIGN[version - 1];
    for (var a = 0; a < al.length; a++)
      for (var b = 0; b < al.length; b++) {
        if ((a === 0 && b === 0) || (a === 0 && b === al.length - 1) || (a === al.length - 1 && b === 0)) continue;
        for (var dr2 = -2; dr2 <= 2; dr2++)
          for (var dc2 = -2; dc2 <= 2; dc2++) setFn(al[a] + dr2, al[b] + dc2, Math.max(Math.abs(dr2), Math.abs(dc2)) !== 1);
      }
    // reserve format and version areas
    for (var f = 0; f < 9; f++) {
      fn[8][f] = true;
      fn[f][8] = true;
    }
    for (var g = 0; g < 8; g++) {
      fn[8][n - 1 - g] = true;
      fn[n - 1 - g][8] = true;
    }
    setFn(n - 8, 8, true);
    if (version >= 7)
      for (var vi = 0; vi < 6; vi++)
        for (var vj = 0; vj < 3; vj++) {
          fn[vi][n - 11 + vj] = true;
          fn[n - 11 + vj][vi] = true;
        }
    // place data bits in zigzag
    var bits = [];
    codewords.forEach(function (cw) {
      for (var k = 7; k >= 0; k--) bits.push((cw >>> k) & 1);
    });
    var idx = 0;
    var up = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col = 5;
      for (var t = 0; t < n; t++) {
        var row = up ? n - 1 - t : t;
        for (var k2 = 0; k2 < 2; k2++) {
          var cc2 = col - k2;
          if (!fn[row][cc2]) {
            m[row][cc2] = idx < bits.length ? bits[idx] === 1 : false;
            idx++;
          }
        }
      }
      up = !up;
    }
    return { n: n, m: m, fn: fn };
  }

  var DV_QR_MASKS = [
    function (r, c) { return (r + c) % 2 === 0; },
    function (r) { return r % 2 === 0; },
    function (r, c) { return c % 3 === 0; },
    function (r, c) { return (r + c) % 3 === 0; },
    function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
    function (r, c) { return ((r * c) % 2) + ((r * c) % 3) === 0; },
    function (r, c) { return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0; },
    function (r, c) { return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0; }
  ];

  function dvApplyMask(base, version, mask) {
    var n = base.n;
    var m = base.m.map(function (row) {
      return row.slice();
    });
    for (var r = 0; r < n; r++)
      for (var c = 0; c < n; c++) if (!base.fn[r][c] && DV_QR_MASKS[mask](r, c)) m[r][c] = !m[r][c];
    // format info (level L = 01)
    var data = (1 << 3) | mask;
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var fbits = ((data << 10) | rem) ^ 0x5412;
    function gb(x, k) {
      return ((x >>> k) & 1) === 1;
    }
    for (var a = 0; a <= 5; a++) m[a][8] = gb(fbits, a);
    m[7][8] = gb(fbits, 6);
    m[8][8] = gb(fbits, 7);
    m[8][7] = gb(fbits, 8);
    for (var b = 9; b < 15; b++) m[8][14 - b] = gb(fbits, b);
    for (var d = 0; d < 8; d++) m[8][n - 1 - d] = gb(fbits, d);
    for (var e = 8; e < 15; e++) m[n - 15 + e][8] = gb(fbits, e);
    m[n - 8][8] = true;
    if (version >= 7) {
      var vr = version;
      for (var j = 0; j < 12; j++) vr = (vr << 1) ^ ((vr >>> 11) * 0x1f25);
      var vbits = (version << 12) | vr;
      for (var k = 0; k < 18; k++) {
        var on = gb(vbits, k);
        var x = n - 11 + (k % 3);
        var y = Math.floor(k / 3);
        m[y][x] = on;
        m[x][y] = on;
      }
    }
    return m;
  }

  function dvPenalty(m, n) {
    var p = 0;
    var r, c, run, line;
    for (var pass = 0; pass < 2; pass++) {
      for (r = 0; r < n; r++) {
        run = 1;
        line = '';
        for (c = 0; c < n; c++) {
          var cur = pass ? m[c][r] : m[r][c];
          line += cur ? '1' : '0';
          if (c > 0) {
            var prev = pass ? m[c - 1][r] : m[r][c - 1];
            if (cur === prev) {
              run++;
              if (run === 5) p += 3;
              else if (run > 5) p += 1;
            } else run = 1;
          }
        }
        var idx = -1;
        while ((idx = line.indexOf('10111010000', idx + 1)) !== -1) p += 40;
        idx = -1;
        while ((idx = line.indexOf('00001011101', idx + 1)) !== -1) p += 40;
      }
    }
    for (r = 0; r < n - 1; r++)
      for (c = 0; c < n - 1; c++) if (m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c] && m[r][c] === m[r + 1][c + 1]) p += 3;
    var dark = 0;
    for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (m[r][c]) dark++;
    p += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
    return p;
  }

  function dvQrMatrix(text) {
    var built = dvBuildCodewords(dvUtf8(String(text)));
    var base = dvBuildMatrix(built.version, built.codewords);
    var best = null;
    var bestScore = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      var mm = dvApplyMask(base, built.version, mask);
      var score = dvPenalty(mm, base.n);
      if (score < bestScore) {
        bestScore = score;
        best = mm;
      }
    }
    return best;
  }

  function dvQrSvg(text, opts) {
    opts = opts || {};
    var m = dvQrMatrix(text);
    var n = m.length;
    var quiet = opts.margin == null ? 4 : opts.margin;
    var total = n + quiet * 2;
    var d = '';
    for (var r = 0; r < n; r++)
      for (var c = 0; c < n; c++) if (m[r][c]) d += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
    var size = opts.size || 240;
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" width="' + size + '" height="' + size +
      '" shape-rendering="crispEdges" role="img" aria-label="QR code">' +
      '<rect width="' + total + '" height="' + total + '" fill="#FFFFFF"/>' +
      '<path d="' + d + '" fill="#121212"/></svg>'
    );
  }

  DV.qr = { svg: dvQrSvg, matrix: dvQrMatrix };
})(window);
