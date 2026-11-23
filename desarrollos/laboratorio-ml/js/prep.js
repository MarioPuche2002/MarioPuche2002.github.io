/* =============================================================================
   prep.js — Preprocesamiento (equivalente a un ColumnTransformer de scikit-learn)
   - Numéricas: escalado (StandardScaler / MinMaxScaler / ninguno) → imputación
     (media, mediana o KNN, calculadas en la escala elegida).
   - Categóricas: imputación por moda → one-hot.
   Todo se AJUSTA (fit) solo con el conjunto de entrenamiento.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Prep = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const isMissing = v => v === null || v === undefined || v === "" || (typeof v === "number" && Number.isNaN(v));
  const medianOf = a => { const s = Float64Array.from(a).sort(), k = s.length; return k ? (k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2) : 0; };

  function fit(rows, meta, opts) {
    opts = opts || {}; const strat = opts.num || "median", K = opts.k || 5, scale = opts.scale || "standard", d = meta.length;
    const P = { meta, strat, K, scale, fill: [], cats: [], c: [], s: [] };
    for (let j = 0; j < d; j++) {
      const vals = rows.map(r => r[j]).filter(v => !isMissing(v));
      if (meta[j].type === "cat") {
        const cnt = {}; vals.forEach(v => cnt[v] = (cnt[v] || 0) + 1);
        const cats = Object.keys(cnt).sort();
        P.cats[j] = cats; P.fill[j] = cats.length ? cats.reduce((a, b) => cnt[b] > cnt[a] ? b : a, cats[0]) : "?";
      } else {
        const x = vals.map(Number), n = x.length || 1;
        if (scale === "standard") { const m = x.reduce((a, b) => a + b, 0) / n; P.c[j] = m; P.s[j] = Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / n) || 1; }
        else if (scale === "minmax") { const lo = Math.min(...x), hi = Math.max(...x); P.c[j] = lo; P.s[j] = (hi - lo) || 1; }
        else { P.c[j] = 0; P.s[j] = 1; }
        const z = x.map(v => (v - P.c[j]) / P.s[j]);
        P.fill[j] = strat === "median" ? medianOf(z) : (z.length ? z.reduce((a, b) => a + b, 0) / z.length : 0);
      }
    }
    P.numIdx = meta.map((m, j) => m.type === "num" ? j : -1).filter(j => j >= 0);
    if (strat === "knn") P.donors = rows.map(r => P.numIdx.map(j => isMissing(r[j]) ? NaN : (Number(r[j]) - P.c[j]) / P.s[j]));
    P.encoded = [];
    meta.forEach((m, j) => { if (m.type === "cat") P.cats[j].forEach(c => P.encoded.push({ src: j, cat: c })); else P.encoded.push({ src: j }); });
    P.transform = rs => transform(P, rs);
    P.impute = rs => impute(P, rs);
    return P;
  }

  function knnFill(P, row) {
    const nn = P.numIdx.length, out = row.slice();
    const miss = row.map((v, i) => Number.isNaN(v) ? i : -1).filter(i => i >= 0);
    if (!miss.length) return out;
    const dists = P.donors.map(dn => { let s = 0, c = 0; for (let i = 0; i < nn; i++) { const a = row[i], b = dn[i]; if (!Number.isNaN(a) && !Number.isNaN(b)) { s += (a - b) ** 2; c++; } } return c ? Math.sqrt(s * nn / c) : Infinity; });
    for (const i of miss) {
      const cand = []; for (let r = 0; r < P.donors.length; r++) if (!Number.isNaN(P.donors[r][i]) && dists[r] < Infinity) cand.push(r);
      cand.sort((a, b) => dists[a] - dists[b]);
      const use = cand.slice(0, P.K);
      out[i] = use.length ? use.reduce((s, r) => s + P.donors[r][i], 0) / use.length : 0;
    }
    return out;
  }

  // filas en la escala transformada (numéricas escaladas e imputadas; categóricas imputadas)
  function scaledRows(P, rows) {
    return rows.map(r => {
      const o = r.slice();
      const z = P.numIdx.map(j => isMissing(r[j]) ? NaN : (Number(r[j]) - P.c[j]) / P.s[j]);
      const f = P.strat === "knn" ? knnFill(P, z) : z.map((v, i) => Number.isNaN(v) ? P.fill[P.numIdx[i]] : v);
      P.numIdx.forEach((j, i) => o[j] = f[i]);
      P.meta.forEach((m, j) => { if (m.type === "cat" && isMissing(o[j])) o[j] = P.fill[j]; });
      return o;
    });
  }
  // filas imputadas en las unidades originales (para mostrar y graficar)
  function impute(P, rows) { return scaledRows(P, rows).map(o => { const r = o.slice(); P.numIdx.forEach(j => r[j] = o[j] * P.s[j] + P.c[j]); return r; }); }
  // matriz numérica que recibe el modelo
  function transform(P, rows) {
    return scaledRows(P, rows).map(r => { const x = [];
      P.meta.forEach((m, j) => { if (m.type === "cat") P.cats[j].forEach(c => x.push(String(r[j]) === c ? 1 : 0)); else x.push(r[j]); });
      return x; });
  }
  function missingReport(rows, d) {
    const cnt = new Array(d).fill(0); let rowsWith = 0;
    rows.forEach(r => { let any = false; for (let j = 0; j < d; j++) if (isMissing(r[j])) { cnt[j]++; any = true; } if (any) rowsWith++; });
    return { perColumn: cnt, rows: rowsWith, total: cnt.reduce((a, b) => a + b, 0) };
  }
  return { fit, isMissing, missingReport };
});
