/* =============================================================================
   ml.js — Motor de Machine Learning en JavaScript (sin dependencias, salvo
   libsvm para SVM). Implementa las mismas ideas que scikit-learn:
   árbol de decisión (CART), bosque aleatorio, gradient boosting, regresión
   logística, regresión lineal (OLS / Ridge / Lasso + polinomios) y SVM.
   Funciona en el navegador (window.ML) y en Node (module.exports).
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ML = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------------------------- utilidades ---------------------------- */
  function rng(seed) { // mulberry32: aleatorio reproducible
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, r) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  const range = n => Array.from({ length: n }, (_, i) => i);
  const sum = a => { let s = 0; for (const v of a) s += v; return s; };
  const mean = a => sum(a) / a.length;
  function median(a) { const s = Float64Array.from(a).sort(); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
  const argmax = a => { let b = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i; return b; };
  const col = (X, j) => X.map(r => r[j]);
  const take = (A, idx) => idx.map(i => A[i]);
  const sigmoid = z => z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
  function softmaxRow(z) { const m = Math.max(...z); const e = z.map(v => Math.exp(v - m)); const s = sum(e); return e.map(v => v / s); }

  class Scaler {
    fit(X) { const d = X[0].length, n = X.length; this.mean = new Array(d).fill(0); this.std = new Array(d).fill(0);
      for (const r of X) for (let j = 0; j < d; j++) this.mean[j] += r[j] / n;
      for (const r of X) for (let j = 0; j < d; j++) this.std[j] += (r[j] - this.mean[j]) ** 2 / n;
      this.std = this.std.map(s => Math.sqrt(s) || 1); return this; }
    transform(X) { return X.map(r => r.map((v, j) => (v - this.mean[j]) / this.std[j])); }
  }
  function polyExpand(X, degree) { // como PolynomialFeatures(include_bias=False)
    if (degree <= 1) return X;
    const d = X[0].length, combos = [];
    (function gen(start, cur) { if (cur.length) combos.push(cur.slice()); if (cur.length === degree) return;
      for (let j = start; j < d; j++) { cur.push(j); gen(j, cur); cur.pop(); } })(0, []);
    combos.sort((a, b) => a.length - b.length);
    return X.map(r => combos.map(c => c.reduce((p, j) => p * r[j], 1)));
  }
  function solve(A, b) { // eliminación gaussiana con pivoteo parcial
    const n = A.length, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      const piv = M[c][c] || 1e-12;
      for (let r = c + 1; r < n; r++) { const f = M[r][c] / piv; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / (M[r][r] || 1e-12); }
    return x;
  }
  function nFeaturesFor(maxFeatures, d) {
    if (maxFeatures === "sqrt") return Math.max(1, Math.floor(Math.sqrt(d)));
    if (maxFeatures === "log2") return Math.max(1, Math.floor(Math.log2(d)));
    if (typeof maxFeatures === "number" && maxFeatures <= 1) return Math.max(1, Math.floor(maxFeatures * d));
    if (typeof maxFeatures === "number") return Math.min(d, maxFeatures);
    return d;
  }
  function classWeights(y, k, mode) {
    if (mode !== "balanced") return new Array(k).fill(1);
    const cnt = new Array(k).fill(0); y.forEach(v => cnt[v]++);
    return cnt.map(c => c ? y.length / (k * c) : 0);
  }

  /* ----------------------- Árbol de decisión (CART) ------------------- */
  class DecisionTree {
    constructor(o = {}) {
      this.task = o.task || "classification";
      this.criterion = o.criterion || (this.task === "classification" ? "gini" : "squared_error");
      this.maxDepth = o.max_depth == null ? Infinity : o.max_depth;
      this.minSplit = o.min_samples_split || 2;
      this.minLeaf = o.min_samples_leaf || 1;
      this.maxFeatures = o.max_features ?? null;
      this.nClasses = o.nClasses || 0;
      this.classWeight = Array.isArray(o.class_weight) ? o.class_weight : null;
      this.rand = o.rand || rng(o.seed || 1);
    }
    // idx: filas a usar (puede repetir filas → bootstrap). w: peso por fila (opcional)
    fit(X, y, idx, w) {
      idx = idx || range(X.length);
      this.d = X[0].length; this.nodes = []; this.importances = new Array(this.d).fill(0);
      this.X = X; this.y = y; this.w = w || null;
      if (this.task === "classification" && this.classWeight) {
        const cw = this.classWeight; const base = this.w;
        this.w = new Float64Array(X.length).fill(0).map((_, i) => (base ? base[i] : 1) * cw[y[i]]);
      }
      this.kF = nFeaturesFor(this.maxFeatures, this.d);
      this.totalW = this._wsum(idx);
      this._build(idx, 0);
      const s = sum(this.importances); if (s > 0) this.importances = this.importances.map(v => v / s);
      delete this.X; delete this.y; delete this.w;
      return this;
    }
    _wi(i) { return this.w ? this.w[i] : 1; }
    _wsum(idx) { let s = 0; for (const i of idx) s += this._wi(i); return s; }
    _stats(idx) {
      if (this.task === "classification") { const c = new Array(this.nClasses).fill(0); for (const i of idx) c[this.y[i]] += this._wi(i); return c; }
      let s = 0, s2 = 0, W = 0; for (const i of idx) { const w = this._wi(i), v = this.y[i]; s += w * v; s2 += w * v * v; W += w; }
      return [s, s2, W];
    }
    _imp(st) {
      if (this.task === "classification") {
        const W = sum(st); if (W <= 0) return 0; let g = 0;
        if (this.criterion === "entropy") { for (const c of st) if (c > 0) { const p = c / W; g -= p * Math.log2(p); } return g; }
        for (const c of st) { const p = c / W; g += p * p; } return 1 - g;
      }
      const [s, s2, W] = st; if (W <= 0) return 0; return Math.max(0, s2 / W - (s / W) ** 2);
    }
    _value(st) {
      if (this.task === "classification") { const W = sum(st) || 1; return st.map(c => c / W); }
      return st[0] / (st[2] || 1);
    }
    _build(idx, depth) {
      const st = this._stats(idx), W = this.task === "classification" ? sum(st) : st[2], imp = this._imp(st);
      const node = { id: this.nodes.length, samples: idx.length, impurity: imp, value: this._value(st), leaf: true, idx: null };
      this.nodes.push(node);
      if (depth >= this.maxDepth || idx.length < this.minSplit || idx.length < 2 * this.minLeaf || imp <= 1e-12) { node.idx = idx; return node.id; }
      const best = this._bestSplit(idx, st, imp, W);
      if (!best) { node.idx = idx; return node.id; }
      this.importances[best.f] += best.gain;
      node.leaf = false; node.feature = best.f; node.threshold = best.t;
      const L = [], R = []; for (const i of idx) (this.X[i][best.f] <= best.t ? L : R).push(i);
      node.left = this._build(L, depth + 1);
      node.right = this._build(R, depth + 1);
      return node.id;
    }
    _bestSplit(idx, st, imp, W) {
      const feats = range(this.d); if (this.kF < this.d) shuffle(feats, this.rand);
      let best = null, bestScore = -Infinity; const cls = this.task === "classification", n = idx.length;
      for (let fi = 0; fi < feats.length; fi++) {
        if (fi >= this.kF && best) break;
        const f = feats[fi];
        const order = idx.slice().sort((a, b) => this.X[a][f] - this.X[b][f]);
        let left, right;
        if (cls) { left = new Array(this.nClasses).fill(0); right = st.slice(); } else { left = [0, 0, 0]; right = st.slice(); }
        for (let k = 0; k < n - 1; k++) {
          const i = order[k], w = this._wi(i);
          if (cls) { left[this.y[i]] += w; right[this.y[i]] -= w; }
          else { const v = this.y[i]; left[0] += w * v; left[1] += w * v * v; left[2] += w; right[0] -= w * v; right[1] -= w * v * v; right[2] -= w; }
          const a = this.X[i][f], b = this.X[order[k + 1]][f];
          if (b - a <= 1e-12) continue;
          if (k + 1 < this.minLeaf || n - k - 1 < this.minLeaf) continue;
          const WL = cls ? sum(left) : left[2], WR = W - WL;
          const score = -(WL * this._imp(left) + WR * this._imp(right));
          if (score > bestScore + 1e-12) { bestScore = score; best = { f, t: (a + b) / 2, WL }; }
        }
      }
      if (!best) return null;
      best.gain = (W * imp + bestScore) / this.totalW;
      if (best.gain <= 1e-12) return null;
      return best;
    }
    leafOf(x) { let n = this.nodes[0]; while (!n.leaf) n = this.nodes[x[n.feature] <= n.threshold ? n.left : n.right]; return n; }
    predictRow(x) { return this.leafOf(x).value; }
    predict(X) { return this.task === "classification" ? X.map(x => argmax(this.predictRow(x))) : X.map(x => this.predictRow(x)); }
    predictProba(X) { return X.map(x => this.predictRow(x).slice()); }
    depth() { const d = id => { const n = this.nodes[id]; return n.leaf ? 0 : 1 + Math.max(d(n.left), d(n.right)); }; return d(0); }
    nLeaves() { return this.nodes.filter(n => n.leaf).length; }
    clearIdx() { this.nodes.forEach(n => delete n.idx); }
  }

  /* --------------------------- Bosque aleatorio ------------------------ */
  class RandomForest {
    constructor(o = {}) { this.o = o; this.task = o.task; }
    fit(X, y) {
      const o = this.o, n = X.length, r = rng(o.seed || 1);
      const cw = this.task === "classification" ? classWeights(y, o.nClasses, o.class_weight) : null;
      this.trees = [];
      for (let t = 0; t < (o.n_estimators || 100); t++) {
        const idx = o.bootstrap === false ? range(n) : Array.from({ length: n }, () => Math.floor(r() * n));
        const tree = new DecisionTree({ ...o, max_features: o.max_features ?? (this.task === "classification" ? "sqrt" : 1.0),
          class_weight: o.class_weight === "balanced" ? cw : null, rand: rng(Math.floor(r() * 1e9)) });
        tree.fit(X, y, idx); tree.clearIdx(); this.trees.push(tree);
      }
      const d = X[0].length; this.importances = new Array(d).fill(0);
      this.trees.forEach(t => t.importances.forEach((v, j) => this.importances[j] += v / this.trees.length));
      const s = sum(this.importances); if (s > 0) this.importances = this.importances.map(v => v / s);
      return this;
    }
    predictProba(X) { const k = this.o.nClasses; return X.map(x => { const p = new Array(k).fill(0); for (const t of this.trees) { const v = t.predictRow(x); for (let c = 0; c < k; c++) p[c] += v[c]; } return p.map(v => v / this.trees.length); }); }
    predict(X) { if (this.task === "classification") return this.predictProba(X).map(argmax); return X.map(x => mean(this.trees.map(t => t.predictRow(x)))); }
    perTree(x) { return this.trees.map(t => this.task === "classification" ? argmax(t.predictRow(x)) : t.predictRow(x)); }
  }

  /* --------------------------- Gradient Boosting ----------------------- */
  class GradientBoosting {
    constructor(o = {}) { this.o = o; this.task = o.task; }
    fit(X, y, evalSets) {
      const o = this.o, n = X.length, lr = o.learning_rate ?? 0.1, r = rng(o.seed || 1);
      const M = o.n_estimators || 100, sub = o.subsample ?? 1, K = this.task === "classification" ? o.nClasses : 1;
      this.K = K; this.lr = lr; this.stages = [];
      const treeOpts = { task: "regression", max_depth: o.max_depth ?? 3, min_samples_leaf: o.min_samples_leaf || 1, min_samples_split: o.min_samples_split || 2, max_features: o.max_features ?? null };
      // valor inicial
      if (this.task === "regression") { this.init = [o.loss === "absolute_error" ? median(y) : mean(y)]; }
      else if (K === 2) { const p = Math.min(1 - 1e-6, Math.max(1e-6, mean(y))); this.init = [Math.log(p / (1 - p))]; }
      else { const cnt = new Array(K).fill(0); y.forEach(v => cnt[v]++); this.init = cnt.map(c => Math.log(Math.max(c, 1e-6) / n)); }
      const nOut = K === 2 ? 1 : K;
      const F = Array.from({ length: n }, () => this.init.slice(0, nOut));
      const evalF = (evalSets || []).map(s => s.X.map(() => this.init.slice(0, nOut)));
      this.staged = (evalSets || []).map(() => []);
      for (let m = 0; m < M; m++) {
        let idx = range(n); if (sub < 1) idx = shuffle(range(n), r).slice(0, Math.max(2, Math.round(sub * n)));
        const stage = [];
        // probabilidades actuales (clasificación)
        const P = this.task === "classification" ? F.map(f => K === 2 ? [sigmoid(f[0])] : softmaxRow(f)) : null;
        for (let k = 0; k < nOut; k++) {
          let res;
          if (this.task === "regression") res = y.map((v, i) => o.loss === "absolute_error" ? Math.sign(v - F[i][0]) : v - F[i][0]);
          else if (K === 2) res = y.map((v, i) => v - P[i][0]);
          else res = y.map((v, i) => (v === k ? 1 : 0) - P[i][k]);
          const tree = new DecisionTree({ ...treeOpts, rand: rng(Math.floor(r() * 1e9)) }).fit(X, res, idx);
          // valores de hoja (paso de Newton, como scikit-learn)
          for (const nd of tree.nodes) {
            if (!nd.leaf) continue; const ii = nd.idx;
            if (this.task === "regression") {
              nd.value = o.loss === "absolute_error" ? median(ii.map(i => y[i] - F[i][0])) : mean(ii.map(i => res[i]));
            } else {
              let num = 0, den = 0;
              for (const i of ii) { num += res[i]; const a = Math.abs(res[i]); den += K === 2 ? P[i][0] * (1 - P[i][0]) : a * (1 - a); }
              nd.value = (K === 2 ? 1 : (K - 1) / K) * num / Math.max(den, 1e-12);
            }
          }
          tree.clearIdx(); stage.push(tree);
        }
        for (let i = 0; i < n; i++) for (let k = 0; k < nOut; k++) F[i][k] += lr * stage[k].predictRow(X[i]);
        (evalSets || []).forEach((s, e) => { for (let i = 0; i < s.X.length; i++) for (let k = 0; k < nOut; k++) evalF[e][i][k] += lr * stage[k].predictRow(s.X[i]);
          this.staged[e].push(s.score(this._fromRaw(evalF[e]))); });
        this.stages.push(stage);
      }
      const d = X[0].length; this.importances = new Array(d).fill(0);
      this.stages.forEach(st => st.forEach(t => t.importances.forEach((v, j) => this.importances[j] += v)));
      const s = sum(this.importances); if (s > 0) this.importances = this.importances.map(v => v / s);
      return this;
    }
    _raw(X) { const nOut = this.K === 2 ? 1 : this.K; return X.map(x => { const f = this.init.slice(0, nOut); for (const st of this.stages) for (let k = 0; k < nOut; k++) f[k] += this.lr * st[k].predictRow(x); return f; }); }
    _fromRaw(F) {
      if (this.task === "regression") return F.map(f => f[0]);
      return F.map(f => this.K === 2 ? (f[0] > 0 ? 1 : 0) : argmax(f));
    }
    predictProba(X) { return this._raw(X).map(f => this.K === 2 ? [1 - sigmoid(f[0]), sigmoid(f[0])] : softmaxRow(f)); }
    predict(X) { return this._fromRaw(this._raw(X)); }
  }

  /* --------------------------- Regresión logística --------------------- */
  class LogisticRegression {
    constructor(o = {}) { this.o = o; }
    fit(X0, y) {
      const o = this.o, K = o.nClasses, X = X0;
      const n = X.length, d = X[0].length, C = o.C ?? 1, pen = o.penalty || "l2", iters = o.max_iter || 500;
      const cw = classWeights(y, K, o.class_weight), sw = y.map(v => cw[v]), SW = sum(sw);
      const lam = pen === "none" ? 0 : 1 / (C * SW); // objetivo promediado: (1/SW)·Σ w·pérdida + lam·reg
      const nOut = K === 2 ? 1 : K;
      let W = Array.from({ length: nOut }, () => new Array(d).fill(0)), b = new Array(nOut).fill(0);
      let Wy = W.map(r => r.slice()), by = b.slice(), t = 1;
      const sq = mean(X.map(x => x.reduce((a, v) => a + v * v, 0))) + 1, L = (K === 2 ? 0.25 : 0.5) * sq + (pen === "l2" ? lam : 0) + 1e-9, step = 1 / L;
      for (let it = 0; it < iters; it++) {
        // gradiente en el punto acelerado (FISTA)
        const gW = Array.from({ length: nOut }, () => new Array(d).fill(0)), gb = new Array(nOut).fill(0);
        for (let i = 0; i < n; i++) {
          const x = X[i], z = Wy.map((w, k) => by[k] + w.reduce((s, v, j) => s + v * x[j], 0));
          const p = K === 2 ? [sigmoid(z[0])] : softmaxRow(z);
          for (let k = 0; k < nOut; k++) { const e = sw[i] * (p[k] - (K === 2 ? y[i] : (y[i] === k ? 1 : 0))) / SW; gb[k] += e; const g = gW[k]; for (let j = 0; j < d; j++) g[j] += e * x[j]; }
        }
        const Wn = Wy.map((w, k) => w.map((v, j) => {
          let u = v - step * (gW[k][j] + (pen === "l2" ? lam * v : 0));
          if (pen === "l1") u = Math.sign(u) * Math.max(0, Math.abs(u) - step * lam);
          return u; }));
        const bn = by.map((v, k) => v - step * gb[k]);
        const tn = (1 + Math.sqrt(1 + 4 * t * t)) / 2, f = (t - 1) / tn;
        Wy = Wn.map((w, k) => w.map((v, j) => v + f * (v - W[k][j]))); by = bn.map((v, k) => v + f * (v - b[k]));
        W = Wn; b = bn; t = tn;
      }
      this.W = W; this.b = b; this.K = K;
      this.coef = W; // en la escala de las features transformadas
      return this;
    }
    predictProba(X) { return X.map(x => { const z = this.W.map((w, k) => this.b[k] + w.reduce((s, v, j) => s + v * x[j], 0)); return this.K === 2 ? [1 - sigmoid(z[0]), sigmoid(z[0])] : softmaxRow(z); }); }
    predict(X) { return this.predictProba(X).map(argmax); }
  }

  /* --------------------------- Regresión lineal ------------------------ */
  class LinearRegression {
    constructor(o = {}) { this.o = o; }
    fit(X0, y) {
      const o = this.o, deg = o.degree || 1, reg = o.regularization || "none", alpha = o.alpha ?? 1;
      const P = polyExpand(X0, deg); this.sc = deg > 1 ? new Scaler().fit(P) : null; const X = this.sc ? this.sc.transform(P) : P;
      const n = X.length, d = X[0].length, ym = mean(y), yc = y.map(v => v - ym);
      this.xm = range(d).map(j => mean(X.map(x => x[j]))); const Xc = X.map(x => x.map((v, j) => v - this.xm[j]));
      let w;
      if (reg === "lasso") { // descenso por coordenadas: (1/2n)||y-Xw||² + alpha·||w||₁
        w = new Array(d).fill(0); const r = yc.slice(); const nrm = range(d).map(j => sum(Xc.map(x => x[j] * x[j])) / n);
        for (let it = 0; it < (o.max_iter || 1000); it++) {
          let maxDelta = 0;
          for (let j = 0; j < d; j++) {
            let rho = 0; for (let i = 0; i < n; i++) rho += Xc[i][j] * (r[i] + Xc[i][j] * w[j]); rho /= n;
            const nw = Math.sign(rho) * Math.max(0, Math.abs(rho) - alpha) / (nrm[j] || 1);
            const dw = nw - w[j]; if (dw) { for (let i = 0; i < n; i++) r[i] -= Xc[i][j] * dw; w[j] = nw; }
            maxDelta = Math.max(maxDelta, Math.abs(dw));
          }
          if (maxDelta < 1e-6) break;
        }
      } else {
        const A = range(d).map(a => range(d).map(b => { let s = 0; for (let i = 0; i < n; i++) s += Xc[i][a] * Xc[i][b]; return s; }));
        const lam = reg === "ridge" ? alpha : 1e-8 * n;
        for (let j = 0; j < d; j++) A[j][j] += lam;
        const rhs = range(d).map(j => { let s = 0; for (let i = 0; i < n; i++) s += Xc[i][j] * yc[i]; return s; });
        w = solve(A, rhs);
      }
      this.w = w; this.b = ym - this.xm.reduce((acc, m, j) => acc + m * w[j], 0); this.deg = deg;
      this.coef = deg === 1 ? [w] : null;
      return this;
    }
    predict(X0) { const P = polyExpand(X0, this.deg), X = this.sc ? this.sc.transform(P) : P; return X.map(x => this.b + x.reduce((s, v, j) => s + v * this.w[j], 0)); }
  }

  /* --------------------------------- SVM ------------------------------- */
  let LIBSVM = null;
  function setLibsvm(S) { LIBSVM = S; }
  class SVM {
    constructor(o = {}) { this.o = o; this.task = o.task; }
    fit(X0, y) {
      if (!LIBSVM) throw new Error("libsvm no está cargado");
      const o = this.o, X = X0, d = X[0].length; const flat = X.flat(), fm = mean(flat), fv = mean(flat.map(v => (v - fm) ** 2)) || 1;
      const K = LIBSVM.KERNEL_TYPES, kernel = { linear: K.LINEAR, rbf: K.RBF, poly: K.POLYNOMIAL, sigmoid: K.SIGMOID }[o.kernel || "rbf"];
      const gamma = (o.gamma === "scale" || o.gamma == null) ? 1 / (d * fv) : +o.gamma; // igual que gamma="scale" de scikit-learn
      const opts = { kernel, gamma, cost: o.C ?? 1, degree: o.degree || 3, coef0: 0, quiet: true, shrinking: true };
      let yy = y;
      if (this.task === "classification") {
        opts.type = LIBSVM.SVM_TYPES.C_SVC; opts.probabilityEstimates = true;
        if (o.class_weight === "balanced") { const cw = classWeights(y, o.nClasses, "balanced"); opts.weight = {}; cw.forEach((v, k) => opts.weight[k] = v); }
      } else {
        opts.type = LIBSVM.SVM_TYPES.EPSILON_SVR; opts.epsilon = o.epsilon ?? 0.1;
        this.ym = mean(y); this.ys = Math.sqrt(mean(y.map(v => (v - this.ym) ** 2))) || 1; yy = y.map(v => (v - this.ym) / this.ys);
      }
      this.free();
      this.m = new LIBSVM(opts); this.m.train(X, yy); this.k = o.nClasses;
      return this;
    }
    free() { if (this.m) { try { this.m.free(); } catch (e) {} this.m = null; } }
    predictProba(X) {
      return this.m.predictProbability(X).map(r => { const p = new Array(this.k).fill(0); r.estimates.forEach(e => p[e.label] = e.probability); return p; });
    }
    predictWithProba(X) { return this.m.predictProbability(X).map(r => { const p = new Array(this.k).fill(0); r.estimates.forEach(e => p[e.label] = e.probability); return { pred: r.prediction, p }; }); }
    predict(X) { const p = this.m.predict(X); return this.task === "classification" ? p.map(v => Math.round(v)) : p.map(v => v * this.ys + this.ym); }
  }

  /* --------------------------- fábrica de modelos ---------------------- */
  function make(name, task, params, nClasses, seed) {
    const o = Object.assign({}, params, { task, nClasses, seed });
    if (o.max_depth === "none") o.max_depth = null;
    if (o.max_features === "all") o.max_features = null;
    switch (name) {
      case "logreg": return new LogisticRegression(o);
      case "linreg": return new LinearRegression(o);
      case "svm": return new SVM(o);
      case "tree": { const t = new DecisionTree(o), f = t.fit.bind(t);
        t.fit = (X, y) => { t.classWeight = (task === "classification" && o.class_weight === "balanced") ? classWeights(y, nClasses, "balanced") : null; f(X, y); t.clearIdx(); return t; };
        return t; }
      case "rf": return new RandomForest(o);
      case "gb": return new GradientBoosting(o);
    }
    throw new Error("modelo desconocido " + name);
  }

  /* ------------------------------- métricas ---------------------------- */
  const accuracy = (y, p) => y.reduce((s, v, i) => s + (v === p[i] ? 1 : 0), 0) / y.length;
  function confusion(y, p, k) { const M = Array.from({ length: k }, () => new Array(k).fill(0)); y.forEach((v, i) => M[v][p[i]]++); return M; }
  function prf(y, p, k) {
    const M = confusion(y, p, k), P = [], R = [], F = [], S = [];
    for (let c = 0; c < k; c++) { const tp = M[c][c], pc = sum(M.map(r => r[c])), rc = sum(M[c]);
      const pr = pc ? tp / pc : 0, re = rc ? tp / rc : 0; P.push(pr); R.push(re); F.push(pr + re ? 2 * pr * re / (pr + re) : 0); S.push(rc); }
    const present = range(k).filter(c => S[c] > 0 || sum(M.map(r => r[c])) > 0);
    const mac = a => present.length ? sum(present.map(c => a[c])) / present.length : 0;
    return { precision: P, recall: R, f1: F, support: S, macro: { precision: mac(P), recall: mac(R), f1: mac(F) }, confusion: M };
  }
  function r2(y, p) { const m = mean(y); let a = 0, b = 0; y.forEach((v, i) => { a += (v - p[i]) ** 2; b += (v - m) ** 2; }); return b ? 1 - a / b : 0; }
  const mae = (y, p) => mean(y.map((v, i) => Math.abs(v - p[i])));
  const rmse = (y, p) => Math.sqrt(mean(y.map((v, i) => (v - p[i]) ** 2)));

  function split(y, task, testSize, seed, nClasses) {
    const r = rng(seed * 7919 + 13), n = y.length, test = [], train = [];
    if (task === "classification") {
      for (let c = 0; c < nClasses; c++) { const ids = shuffle(range(n).filter(i => y[i] === c), r); const nt = Math.round(ids.length * testSize);
        ids.forEach((id, j) => (j < nt ? test : train).push(id)); }
    } else { const ids = shuffle(range(n), r), nt = Math.round(n * testSize); ids.forEach((id, j) => (j < nt ? test : train).push(id)); }
    return { train: train.sort((a, b) => a - b), test: test.sort((a, b) => a - b) };
  }

  function permutationImportance(model, X, y, scoreFn, repeats, seed) {
    const r = rng(seed + 101), base = scoreFn(y, model.predict(X)), d = X[0].length, out = { mean: [], std: [] };
    for (let j = 0; j < d; j++) {
      const drops = [];
      for (let k = 0; k < repeats; k++) { const perm = shuffle(range(X.length), r); const Xp = X.map((row, i) => { const c = row.slice(); c[j] = X[perm[i]][j]; return c; });
        drops.push(base - scoreFn(y, model.predict(Xp))); }
      const m = mean(drops); out.mean.push(m); out.std.push(Math.sqrt(mean(drops.map(v => (v - m) ** 2))));
    }
    return out;
  }


  /* ---------------------- partición train / val / test ------------------ */
  function split3(y, task, valSize, testSize, seed, nClasses) {
    const r = rng(seed * 7919 + 13), n = y.length, out = { train: [], val: [], test: [] };
    const put = ids => { const nt = Math.round(ids.length * testSize), nv = Math.round(ids.length * valSize);
      ids.forEach((id, j) => (j < nt ? out.test : j < nt + nv ? out.val : out.train).push(id)); };
    if (task === "classification") for (let c = 0; c < nClasses; c++) put(shuffle(range(n).filter(i => y[i] === c), r));
    else put(shuffle(range(n), r));
    for (const k in out) out[k].sort((a, b) => a - b);
    return out;
  }

  /* ----------------------- métricas de clasificación -------------------- */
  function curves(y01, score) { // ROC y Precision-Recall para una clase (uno contra el resto)
    const idx = range(y01.length).sort((a, b) => score[b] - score[a]);
    const P = sum(y01), N = y01.length - P; let tp = 0, fp = 0; const roc = [[0, 0]], pr = []; let auc = 0, ap = 0, prevR = 0;
    for (let i = 0; i < idx.length; i++) {
      if (y01[idx[i]]) tp++; else fp++;
      if (i < idx.length - 1 && score[idx[i + 1]] === score[idx[i]]) continue;
      const tpr = P ? tp / P : 0, fpr = N ? fp / N : 0, last = roc[roc.length - 1];
      auc += (fpr - last[0]) * (tpr + last[1]) / 2; roc.push([fpr, tpr]);
      const prec = tp / (tp + fp); ap += (tpr - prevR) * prec; prevR = tpr; pr.push([tpr, prec]);
    }
    return { roc, pr, auc: P && N ? auc : NaN, ap: P ? ap : NaN, prevalence: P / (y01.length || 1) };
  }
  function classMetrics(y, pred, proba, k) {
    const M = confusion(y, pred, k), n = y.length, rows = [];
    for (let c = 0; c < k; c++) {
      const tp = M[c][c], fn = sum(M[c]) - tp, fp = sum(M.map(r => r[c])) - tp, tn = n - tp - fn - fp;
      const d = (a, b) => b ? a / b : NaN;
      const prec = d(tp, tp + fp), rec = d(tp, tp + fn), spec = d(tn, tn + fp), npv = d(tn, tn + fn);
      const f1 = (prec + rec) ? 2 * prec * rec / (prec + rec) : 0, cv = proba ? curves(y.map(v => v === c ? 1 : 0), proba.map(p => p[c])) : null;
      rows.push({ tp, fn, fp, tn, prec: isNaN(prec) ? 0 : prec, rec: isNaN(rec) ? 0 : rec, spec: isNaN(spec) ? 0 : spec, npv: isNaN(npv) ? 0 : npv,
        fpr: d(fp, fp + tn) || 0, fnr: d(fn, fn + tp) || 0, f1: isNaN(f1) ? 0 : f1, jac: d(tp, tp + fp + fn) || 0, sup: tp + fn, auc: cv ? cv.auc : NaN, ap: cv ? cv.ap : NaN, curve: cv });
    }
    const keys = ["prec", "rec", "spec", "npv", "f1", "jac", "auc", "ap"];
    const macro = {}, weighted = {};
    keys.forEach(kk => { const v = rows.filter(r => !isNaN(r[kk])); macro[kk] = v.length ? mean(v.map(r => r[kk])) : NaN;
      const w = sum(v.map(r => r.sup)); weighted[kk] = w ? sum(v.map(r => r[kk] * r.sup)) / w : NaN; });
    const TP = sum(rows.map(r => r.tp)), FP = sum(rows.map(r => r.fp)), FN = sum(rows.map(r => r.fn));
    const micro = { prec: TP / (TP + FP || 1), rec: TP / (TP + FN || 1) }; micro.f1 = (micro.prec + micro.rec) ? 2 * micro.prec * micro.rec / (micro.prec + micro.rec) : 0;
    const acc = TP / (n || 1), rs = M.map(r => sum(r)), cs = range(k).map(c => sum(M.map(r => r[c])));
    const pe = sum(range(k).map(c => rs[c] * cs[c])) / (n * n || 1), kappa = pe < 1 ? (acc - pe) / (1 - pe) : 0;
    const mccDen = Math.sqrt((n * n - sum(cs.map(v => v * v))) * (n * n - sum(rs.map(v => v * v))));
    const mcc = mccDen ? (TP * n - sum(range(k).map(c => cs[c] * rs[c]))) / mccDen : 0;
    let logloss = NaN, brier = NaN;
    if (proba) { logloss = -mean(y.map((v, i) => Math.log(Math.min(1 - 1e-15, Math.max(1e-15, proba[i][v])))));
      brier = k === 2 ? mean(y.map((v, i) => (proba[i][1] - v) ** 2)) : mean(y.map((v, i) => sum(proba[i].map((p, c) => (p - (c === v ? 1 : 0)) ** 2)))); }
    return { M, rows, n, acc, err: 1 - acc, bal: macro.rec, kappa, mcc, logloss, brier, macro, weighted, micro };
  }
  function regMetrics(y, p, nFeat) {
    const n = y.length, res = y.map((v, i) => v - p[i]), R2 = r2(y, p), ym = mean(y);
    const vr = mean(res.map(v => (v - mean(res)) ** 2)), vy = mean(y.map(v => (v - ym) ** 2));
    const nz = y.filter(v => v !== 0).length === n;
    return { r2: R2, r2adj: n - nFeat - 1 > 0 ? 1 - (1 - R2) * (n - 1) / (n - nFeat - 1) : NaN, evs: vy ? 1 - vr / vy : 0,
      mae: mae(y, p), mse: mean(res.map(v => v * v)), rmse: rmse(y, p), medae: median(res.map(Math.abs)),
      mape: nz ? mean(res.map((v, i) => Math.abs(v / y[i]))) : NaN, maxe: Math.max(...res.map(Math.abs)), res };
  }

  /* ------------------------------- PCA --------------------------------- */
  function pca(X, k) { // componentes principales (Jacobi sobre la matriz de covarianza)
    const n = X.length, d = X[0].length, mu = range(d).map(j => mean(X.map(r => r[j])));
    const A = range(d).map(a => range(d).map(b => { let s = 0; for (const r of X) s += (r[a] - mu[a]) * (r[b] - mu[b]); return s / ((n - 1) || 1); }));
    const V = range(d).map(i => range(d).map(j => i === j ? 1 : 0));
    for (let sweep = 0; sweep < 60; sweep++) {
      let off = 0; for (let p = 0; p < d; p++) for (let q = p + 1; q < d; q++) off += A[p][q] * A[p][q];
      if (off < 1e-18) break;
      for (let p = 0; p < d; p++) for (let q = p + 1; q < d; q++) {
        if (Math.abs(A[p][q]) < 1e-14) continue;
        const th = (A[q][q] - A[p][p]) / (2 * A[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let i = 0; i < d; i++) { const a = A[i][p], b = A[i][q]; A[i][p] = c * a - s * b; A[i][q] = s * a + c * b; }
        for (let i = 0; i < d; i++) { const a = A[p][i], b = A[q][i]; A[p][i] = c * a - s * b; A[q][i] = s * a + c * b; }
        for (let i = 0; i < d; i++) { const a = V[i][p], b = V[i][q]; V[i][p] = c * a - s * b; V[i][q] = s * a + c * b; }
      }
    }
    const order = range(d).sort((a, b) => A[b][b] - A[a][a]), tot = sum(range(d).map(i => Math.max(0, A[i][i]))) || 1;
    const comps = order.slice(0, k).map(j => { const v = range(d).map(i => V[i][j]), m = v[argmax(v.map(Math.abs))]; return m < 0 ? v.map(x => -x) : v; });
    return { mean: mu, comps, ratio: order.slice(0, k).map(j => Math.max(0, A[j][j]) / tot) };
  }
  function project(P, X, k) { return X.map(r => P.comps.slice(0, k).map(c => c.reduce((s, v, j) => s + v * (r[j] - P.mean[j]), 0))); }

  return { pca, project, split3, curves, classMetrics, regMetrics, rng, shuffle, range, mean, median, argmax, col, take, Scaler, polyExpand, DecisionTree, RandomForest, GradientBoosting,
    LogisticRegression, LinearRegression, SVM, setLibsvm, make, accuracy, confusion, prf, r2, mae, rmse, split, permutationImportance };
});
