/* charts.js — pequeña librería de gráficos SVG sin dependencias */
window.Charts = (function () {
  "use strict";
  const PAL = ["#3B6FB6", "#D9A441", "#4E9A6A", "#7B5EA7", "#2A9D8F", "#B5838D", "#5C6670", "#C1663A", "#364FC7", "#8C6D46", "#A23E8C", "#6B8E23"];
  const SEQ = ["#F3F7FC", "#DCE7F5", "#BBD0EC", "#90B2DF", "#6592CF", "#3B6FB6", "#2B5591", "#1C3A66"];
  const INK = "#3C4043", MUTED = "#80868B", GRID = "#EDEEF0";
  const C = { PAL, SEQ, INK, MUTED, GRID, fmt: v => String(v) };
  C.esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  C.hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  C.color = i => PAL[i % PAL.length];
  C.seq = v => { v = Math.max(0, Math.min(1, v)); const n = SEQ.length - 1, i = Math.min(n - 1, Math.floor(v * n)), f = v * n - i, a = C.hex(SEQ[i]), b = C.hex(SEQ[i + 1]);
    return a.map((x, j) => Math.round(x + (b[j] - x) * f)); };
  C.seqCss = v => `rgb(${C.seq(v).join(",")})`;
  C.ticks = (a, b, n = 5) => { if (a === b) { a -= 1; b += 1; } const st0 = (b - a) / n, mag = Math.pow(10, Math.floor(Math.log10(st0))), e = st0 / mag;
    const st = (e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1) * mag, out = [];
    for (let v = Math.ceil(a / st) * st; v <= b + st * 1e-9; v += st) out.push(+v.toFixed(10)); return out; };
  C.extent = (arr, pad = 0) => { let lo = Infinity, hi = -Infinity; for (const v of arr) { if (v == null || Number.isNaN(v)) continue; if (v < lo) lo = v; if (v > hi) hi = v; }
    if (lo === Infinity) { lo = 0; hi = 1; } if (lo === hi) { lo -= 1; hi += 1; } const p = (hi - lo) * pad; return [lo - p, hi + p]; };

  C.frame = function ({ w = 560, h = 380, x, y, xl = "", yl = "", m }) {
    m = Object.assign({ t: 12, r: 16, b: 48, l: 60 }, m || {});
    const W = w - m.l - m.r, H = h - m.t - m.b, f = C.fmt;
    const sx = v => m.l + (v - x[0]) / (x[1] - x[0]) * W, sy = v => m.t + H - (v - y[0]) / (y[1] - y[0]) * H;
    const bg = `<rect x="${m.l}" y="${m.t}" width="${W}" height="${H}" fill="#fff"/>`;
    const axes = (border = true) => {
      let a = "";
      for (const v of C.ticks(x[0], x[1], Math.max(3, Math.round(W / 90)))) { if (v < x[0] || v > x[1]) continue; const X = sx(v);
        a += `<line x1="${X}" x2="${X}" y1="${m.t}" y2="${m.t + H}" stroke="${GRID}"/><text x="${X}" y="${m.t + H + 17}" text-anchor="middle" font-size="12" fill="${MUTED}">${f(v)}</text>`; }
      for (const v of C.ticks(y[0], y[1], Math.max(3, Math.round(H / 60)))) { if (v < y[0] || v > y[1]) continue; const Y = sy(v);
        a += `<line x1="${m.l}" x2="${m.l + W}" y1="${Y}" y2="${Y}" stroke="${GRID}"/><text x="${m.l - 8}" y="${Y + 4}" text-anchor="end" font-size="12" fill="${MUTED}">${f(v)}</text>`; }
      if (border) a += `<rect x="${m.l}" y="${m.t}" width="${W}" height="${H}" fill="none" stroke="#E3E5E8"/>`;
      a += `<text x="${m.l + W / 2}" y="${h - 8}" text-anchor="middle" font-size="13" font-weight="500" fill="${INK}">${C.esc(xl)}</text>`;
      a += `<text transform="translate(15 ${m.t + H / 2}) rotate(-90)" text-anchor="middle" font-size="13" font-weight="500" fill="${INK}">${C.esc(yl)}</text>`;
      return a;
    };
    return { w, h, m, W, H, sx, sy, bg, axes, wrap: inner => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>` };
  };

  C.barsH = function (items, { w = 560, color = PAL[0], signed = false, fmtv = v => C.fmt(v) } = {}) {
    const rowH = 32, m = { t: 6, r: 100, b: 6, l: Math.min(250, 14 + Math.max(...items.map(i => i.label.length)) * 7.2) };
    const h = m.t + m.b + rowH * items.length, W = w - m.l - m.r;
    const maxV = Math.max(1e-9, ...items.map(i => Math.abs(i.value) + (i.err || 0)));
    const lo = signed ? -maxV : Math.min(0, ...items.map(i => i.value - (i.err || 0))), hi = maxV;
    const sx = v => m.l + (v - lo) / (hi - lo) * W, z = sx(0);
    let s = `<line x1="${z}" x2="${z}" y1="${m.t - 2}" y2="${h - m.b + 2}" stroke="#9AA0A6"/>`;
    items.forEach((it, i) => {
      const y = m.t + i * rowH + 6, x0 = Math.min(z, sx(it.value)), bw = Math.abs(sx(it.value) - z), col = typeof color === "function" ? color(it, i) : color;
      s += `<text x="${m.l - 10}" y="${y + 14}" text-anchor="end" font-size="13" fill="${INK}">${C.esc(it.label)}</text>`;
      s += `<rect x="${x0}" y="${y}" width="${Math.max(1, bw)}" height="20" rx="3" fill="${col}"><title>${C.esc(it.label)}: ${fmtv(it.value)}</title></rect>`;
      if (it.err) { const a = sx(it.value - it.err), b = sx(it.value + it.err); s += `<line x1="${a}" x2="${b}" y1="${y + 10}" y2="${y + 10}" stroke="${INK}" stroke-width="1.5"/><line x1="${a}" x2="${a}" y1="${y + 5}" y2="${y + 15}" stroke="${INK}" stroke-width="1.5"/><line x1="${b}" x2="${b}" y1="${y + 5}" y2="${y + 15}" stroke="${INK}" stroke-width="1.5"/>`; }
      const tx = it.value >= 0 ? Math.max(sx(it.value), it.err ? sx(it.value + it.err) : 0) + 6 : sx(it.value) - 6;
      s += `<text x="${tx}" y="${y + 14}" text-anchor="${it.value >= 0 ? "start" : "end"}" font-size="12" fill="${MUTED}">${fmtv(it.value)}</text>`;
    });
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  };

  C.histogram = function (values, { w = 560, h = 280, bins = 16, xl = "", yl = "", color = PAL[0], zero = false } = {}) {
    const [lo, hi] = C.extent(values, 0.02), bw = (hi - lo) / bins, cnt = new Array(bins).fill(0);
    values.forEach(v => { cnt[Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / bw)))]++; });
    const F = C.frame({ w, h, x: [lo, hi], y: [0, Math.max(...cnt) * 1.1 || 1], xl, yl });
    let s = F.bg + F.axes();
    cnt.forEach((c, i) => { const x0 = F.sx(lo + i * bw), x1 = F.sx(lo + (i + 1) * bw), y = F.sy(c);
      s += `<rect x="${x0 + 1}" y="${y}" width="${Math.max(0, x1 - x0 - 2)}" height="${F.sy(0) - y}" fill="${color}"><title>${C.fmt(lo + i * bw)} – ${C.fmt(lo + (i + 1) * bw)}: ${c}</title></rect>`; });
    if (zero && lo < 0 && hi > 0) s += `<line x1="${F.sx(0)}" x2="${F.sx(0)}" y1="${F.m.t}" y2="${F.m.t + F.H}" stroke="${PAL[3]}" stroke-width="2" stroke-dasharray="5 4"/>`;
    return F.wrap(s);
  };

  // imagen (data URL) de una cuadrícula G×G; fill(ix, iy) → [r,g,b]
  C.gridImage = function (G, fill) {
    const cv = document.createElement("canvas"); cv.width = G; cv.height = G;
    const ctx = cv.getContext("2d"), img = ctx.createImageData(G, G);
    for (let iy = 0; iy < G; iy++) for (let ix = 0; ix < G; ix++) { const c = fill(ix, iy), p = ((G - 1 - iy) * G + ix) * 4; img.data[p] = c[0]; img.data[p + 1] = c[1]; img.data[p + 2] = c[2]; img.data[p + 3] = 255; }
    ctx.putImageData(img, 0, 0); return cv.toDataURL();
  };
  C.legend = items => `<div class="legend">${items.map(([c, l]) => `<span><i style="background:${c}"></i>${C.esc(l)}</span>`).join("")}</div>`;
  C.seqLegend = (lo, hi, label) => `<div class="legend"><span>${C.esc(label)}</span><span>${C.fmt(lo)}</span><span class="grad" style="background:linear-gradient(90deg,${SEQ.join(",")})"></span><span>${C.fmt(hi)}</span></div>`;
  return C;
})();
