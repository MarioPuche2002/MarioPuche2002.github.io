/* =============================================================================
   app.js — Interfaz del Laboratorio de Machine Learning
   ========================================================================== */
(function () {
"use strict";
const C = Charts, E = C.esc;
const $ = s => document.querySelector(s);
const MISSING_TOKENS = new Set(["", "na", "n/a", "nan", "null", "none", "?", "-", "--"]);

/* ----------------------------- hiperparámetros ----------------------------- */
const HP = {
  logreg: [{ k: "C", opts: [0.001, 0.01, 0.1, 1, 10, 100, 1000], def: 1, main: 1 },
           { k: "penalty", opts: ["l2", "l1", "none"], def: "l2", main: 1 },
           { k: "class_weight", opts: ["none", "balanced"], def: "none", main: 1 },
           { k: "max_iter", opts: [100, 300, 500, 1000], def: 300 }],
  linreg: [{ k: "degree", opts: [1, 2, 3, 4, 5, 6], def: 1, main: 1 },
           { k: "regularization", opts: ["none", "ridge", "lasso"], def: "none", main: 1 },
           { k: "alpha", opts: [0.001, 0.01, 0.1, 1, 10, 100], def: 1, main: 1, show: p => p.regularization !== "none" }],
  svm: [{ k: "kernel", opts: ["rbf", "linear", "poly", "sigmoid"], def: "rbf", main: 1 },
        { k: "C", opts: [0.01, 0.1, 1, 10, 100, 1000], def: 1, main: 1 },
        { k: "gamma", opts: ["scale", 0.01, 0.1, 0.5, 1, 5, 10], def: "scale", main: 1, show: p => p.kernel !== "linear" },
        { k: "degree", opts: [2, 3, 4, 5], def: 3, show: p => p.kernel === "poly" },
        { k: "epsilon", opts: [0.01, 0.05, 0.1, 0.2, 0.5, 1], def: 0.1, only: "regression" },
        { k: "class_weight", opts: ["none", "balanced"], def: "none", only: "classification", main: 1 }],
  tree: [{ k: "max_depth", opts: [1, 2, 3, 4, 5, 6, 8, 10, 15, "none"], def: 4, main: 1 },
         { k: "min_samples_leaf", opts: [1, 2, 5, 10, 20, 50], def: 1, main: 1 },
         { k: "criterion", opts: ["gini", "entropy"], def: "gini", only: "classification" },
         { k: "min_samples_split", opts: [2, 5, 10, 20, 50], def: 2 },
         { k: "max_features", opts: ["all", "sqrt", "log2", 0.5], def: "all" },
         { k: "class_weight", opts: ["none", "balanced"], def: "none", only: "classification", main: 1 }],
  rf: [{ k: "n_estimators", opts: [10, 25, 50, 100, 200, 300], def: 100, main: 1 },
       { k: "max_depth", opts: [2, 3, 4, 5, 6, 8, 10, 15, "none"], def: "none", main: 1 },
       { k: "max_features", opts: ["sqrt", "log2", 0.5, "all"], def: t => t === "classification" ? "sqrt" : "all" },
       { k: "min_samples_leaf", opts: [1, 2, 5, 10, 20], def: 1 },
       { k: "min_samples_split", opts: [2, 5, 10, 20], def: 2 },
       { k: "bootstrap", opts: [true, false], def: true },
       { k: "criterion", opts: ["gini", "entropy"], def: "gini", only: "classification" },
       { k: "class_weight", opts: ["none", "balanced"], def: "none", only: "classification", main: 1 }],
  nb: [{ k: "priors", opts: ["data", "balanced"], def: "data", main: 1 }],
  gb: [{ k: "n_estimators", opts: [10, 25, 50, 100, 200, 300, 500], def: 100, main: 1 },
       { k: "learning_rate", opts: [0.01, 0.05, 0.1, 0.2, 0.5, 1], def: 0.1, main: 1 },
       { k: "max_depth", opts: [1, 2, 3, 4, 5, 6], def: 3, main: 1 },
       { k: "subsample", opts: [0.5, 0.7, 0.8, 1], def: 1 },
       { k: "min_samples_leaf", opts: [1, 2, 5, 10, 20], def: 1 },
       { k: "max_features", opts: ["all", "sqrt", "log2"], def: "all" },
       { k: "loss", opts: ["squared_error", "absolute_error"], def: "squared_error", only: "regression" }]
};
const MODELS = { classification: ["logreg", "nb", "svm", "tree", "rf"], regression: ["linreg", "svm", "tree", "rf"] }; // Gradient Boosting se retiró de la lista

/* --------------------------------- estado ---------------------------------- */
const S = { details: false, how: { stage: null, sel: null, timer: null, model: null }, step: 1, tab: "summary", lang: "es", ds: null, practice: 0, dirty: 0, schemas: {}, addLabel: null, impute: { num: "median", k: 5 }, model: null, params: {}, fsel: [], valSize: 0.2, testSize: 0.2, seed: 7, evalSet: "val", showImputed: false, scale: "standard", dataView: "orig",
  run: null, stale: false, tab: "data", ex: 0, ey: 1, vx: null, vy: null, resX: -1, treeIndex: 0, play: [], history: {}, csv: null, exportTab: "py" };
try { const l = localStorage.getItem("ml-lab-lang"); if (l === "en" || l === "es") S.lang = l; } catch (e) {}

const t = k => { const v = TXT[S.lang][k]; return v === undefined ? k : v; };
function fmt(v, d) {
  if (v === null || v === undefined || Number.isNaN(v)) return "–";
  if (typeof v !== "number") return String(v);
  if (d === undefined) { const a = Math.abs(v); d = a >= 1000 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3; }
  const out = v.toLocaleString(S.lang === "es" ? "es-CO" : "en-US", { maximumFractionDigits: d }); return out === "-0" ? "0" : out;
}
C.fmt = v => fmt(v);
const pct = v => fmt(v * 100, 1) + " %";
const isCls = () => S.ds && S.ds.task === "classification";
const fName = j => S.ds.features[j][S.lang] || S.ds.features[j].key;
const fUnit = j => { const u = S.ds.features[j].unit || "", p = u.split("|"); return p.length > 1 ? (S.lang === "es" ? p[0] : p[1]) : u; };
const fLabel = j => fName(j) + (fUnit(j) ? ` (${fUnit(j)})` : "");
const cName = c => S.ds.classes[c][S.lang];
const tName = () => S.ds.target[S.lang] + (S.ds.target.unit ? ` (${S.ds.target.unit})` : "");
const scoreName = () => isCls() ? t("accuracy") : "R²";
const scoreFmt = v => isCls() ? pct(v) : fmt(v, 3);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isMiss = Prep.isMissing;
const prepOpts = c => ({ num: c.impute.num, k: c.impute.k, scale: c.scale || "standard" });

/* -------------------------------- datasets --------------------------------- */
function fromBuiltin(D) {
  return { key: D.key, task: D.task, name: D.name, desc: D.desc, simulated: D.simulated, classes: D.classes, target: D.target,
    features: D.features.map(f => Object.assign({ type: "num" }, f)), X: D.X, y: D.y };
}
function strHash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
let rawCache = { key: null, rows: null };
function rawRows() { // filas crudas, con faltantes de práctica si aplica
  const k = S.ds.key + "|" + S.practice + "|" + S.dirty + "|" + S.ds.y.length;
  if (rawCache.key === k) return rawCache.rows;
  let rows = S.ds.X;
  if (S.practice > 0) { const r = ML.rng(strHash(S.ds.key) + Math.round(S.practice * 100)); rows = rows.map(row => row.map(v => r() < S.practice ? null : v)); }
  if (S.dirty > 0) { const r = ML.rng(strHash(S.ds.key) + 777); // errores de captura de práctica
    rows = rows.map(row => row.map((v, j) => { if (isMiss(v) || r() >= S.dirty) return v;
      if (S.ds.features[j].type === "cat") return String(v).toUpperCase() + (r() < 0.5 ? " " : "");
      return r() < 0.5 ? -Math.abs(v) - 1 : +(v * 10).toFixed(4); })); }
  rawCache = { key: k, rows }; return rows;
}
function colStats(j) {
  const f = S.ds.features[j], vals = rawRows().map(r => r[j]).filter(v => !isMiss(v));
  if (f.type === "cat") { const cnt = {}; vals.forEach(v => cnt[v] = (cnt[v] || 0) + 1); const cats = Object.keys(cnt).sort(); return { cats, mode: cats.reduce((a, b) => cnt[b] > cnt[a] ? b : a, cats[0]) }; }
  const s = Float64Array.from(vals).sort(); return { min: s[0], max: s[s.length - 1], median: s[Math.floor(s.length / 2)] };
}

/* ------------------------------ render general ----------------------------- */
function applyLang() {
  document.documentElement.lang = S.lang; document.title = t("title");
  document.querySelectorAll("[data-i]").forEach(el => el.textContent = t(el.dataset.i));
  document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("on", b.dataset.lang === S.lang));
  renderAll();
}
function renderAll() { renderStepper(); renderData(); renderTrain(); renderPreview(); renderAnalysis(); }
/* ------------------------------ pasos (pantallas) ----------------------------- */
const STEPS = [1, 3, 4, 5]; // la validación (Pandera) corre por detrás, sin pantalla propia
const stepNo = n => STEPS.indexOf(n) + 1, stepAt = (n, d) => STEPS[STEPS.indexOf(n) + d];
function goStep(n) { S.step = n; renderAll(); window.scrollTo({ top: 0, behavior: "smooth" }); }
function renderStepper() {
  document.querySelectorAll(".screen").forEach(sc => sc.hidden = +sc.dataset.step !== S.step);
  const names = { 1: t("stepData"), 2: t("stepValid"), 3: t("stepTrain"), 4: t("stepResults"), 5: t("stepExport") };
  const R = S.run, done = { 1: !!S.ds, 2: !!S.ds, 3: !!R, 4: !!R, 5: false };
  let chip = "";
  if (R) chip = `<div class="runchip ${S.stale ? "stale-chip" : ""}" title="${E(t("models")[R.cfg.model][0])}"><span>${E(t("models")[R.cfg.model][0])}</span>${R.sets.val ? `<span>${t("valS")} <b>${scoreFmt(R.sets.val.score)}</b></span>` : ""}<span>${t("testS")} <b>${scoreFmt(R.sets.test.score)}</b></span>${S.stale ? `<span class="warnx">${t("staleShort")}</span>` : ""}</div>`;
  $("#stepper").innerHTML = `<div class="stepper-in"><ol>${STEPS.map(n => `<li><button class="${n === S.step ? "cur" : ""} ${done[n] && n !== S.step ? "done" : ""}" data-go="${n}"><span class="num">${stepNo(n)}</span><span class="nm">${names[n]}</span></button></li>`).join("")}</ol>${chip}</div>`;
  $("#stepper").querySelectorAll("[data-go]").forEach(b => b.onclick = () => goStep(+b.dataset.go));
  const pv = stepAt(S.step, -1), nx = stepAt(S.step, 1);
  const prev = pv ? `<button class="btn outline" id="sn-prev">← ${names[pv]}</button>` : "<span></span>";
  const next = nx ? `<button class="btn primary" id="sn-next">${t("nextStep")}: ${names[nx]} →</button>` : "<span></span>";
  $("#stepnav").innerHTML = S.ds ? prev + next : "";
  const p = $("#sn-prev"), x = $("#sn-next"); if (p) p.onclick = () => goStep(pv); if (x) x.onclick = () => goStep(nx);
}

/* ================================ 1. DATOS ================================= */
function renderData() {
  const el = $("#data-body"); const list = window.DATASETS;
  let h = `<div class="ds-list" role="listbox">` + list.map(D => `
    <button class="ds-item ${S.ds && S.ds.key === D.key ? "on" : ""}" data-k="${D.key}" role="option" aria-selected="${S.ds && S.ds.key === D.key}">
      <span class="ds-name">${E(D.name[S.lang])}</span>
      <span class="ds-meta">${D.task === "classification" ? t("classification") : t("regression")} · ${S.ds && S.ds.key === D.key ? S.ds.y.length : D.y.length} ${t("rowsN")}</span>
    </button>`).join("") +
    (S.ds && S.ds.key === "custom" ? `<button class="ds-item on" data-k="custom"><span class="ds-name">${E(S.ds.name[S.lang])}</span><span class="ds-meta">${t(S.ds.task)} · ${S.ds.y.length} ${t("rowsN")}</span></button>` : "") +
    `</div><button class="btn outline full" id="upload-btn">${t("uploadCsv")}</button>`;
  if (S.ds) {
    h += `<div class="sep"></div>`;
    if (S.ds.desc) h += `<p class="desc">${E(S.ds.desc[S.lang])}</p>`;
    if (S.ds.simulated) h += `<p class="note">${t("simNote")}</p>`;
    if (S.ds.key === "penguins") h += `<p class="note">${t("penguinsSrc")}</p>`;
    if (S.ds.key === "diabetes") h += `<p class="note warn">${t("healthNote")}</p>`;
    if (S.ds.dropped) h += `<p class="note">${S.ds.dropped} ${t("droppedTarget")}</p>`;
    if (S.ds.cleaned) h += `<p class="note">${E(S.ds.cleaned)}</p>`;
    const miss = Prep.missingReport(rawRows(), S.ds.features.length).perColumn;
    h += `<h4>${t("columns")}</h4><p class="help">${t("columnsHelp")}</p><div class="chips">` + S.ds.features.map((f, j) =>
      `<label class="chip ${S.fsel.includes(j) ? "on" : ""}"><input type="checkbox" value="${j}" ${S.fsel.includes(j) ? "checked" : ""}>${E(fName(j))}${f.type === "cat" ? `<span class="badge">${t("cat")}</span>` : ""}${miss[j] ? `<span class="badge miss">${miss[j]} ${t("missingShort")}</span>` : ""}</label>`).join("") + `</div>`;
    if (S.ds.added) h += `<p class="note">${t("addedNote")(S.ds.added)}</p>`;
    // preparación de los datos
    const hasNum = S.fsel.some(j => S.ds.features[j].type === "num"), catSel = S.fsel.filter(j => S.ds.features[j].type === "cat");
    const total = S.fsel.reduce((s, j) => s + miss[j], 0), P2 = t("prep2");
    h += `<div class="prep-box"><h4>${t("prepTitle")}</h4>`;
    if (hasNum) h += `<div class="prep-q">${P2.scaleQ}</div>${optCards("scale", ["standard", "minmax", "none"], S.scale, v => [t("scaleOpt")[v], t("scaleHelp")[v]])}`;
    if (catSel.length) h += `<div class="prep-q">${P2.catQ}</div><p class="note">${P2.catNote(catSel.map(j => fName(j)))}</p>`;
    h += `</div><div class="prep-box"><h4>${t("missingTitle")}</h4>`;
    if (S.ds.key !== "custom") h += field(t("practice"), sel("practice", [0, 0.05, 0.1, 0.2, 0.3], S.practice, v => v ? Math.round(v * 100) + " %" : t("practiceOff")), t("practiceHelp"));
    if (!total) h += `<p class="help">${t("missingNone")}</p>`;
    else {
      const numMiss = S.fsel.some(j => S.ds.features[j].type === "num" && miss[j]), catMiss = S.fsel.some(j => S.ds.features[j].type === "cat" && miss[j]);
      h += `<p class="note">${t("missingFound")(total)}</p>`;
      if (numMiss) {
        h += `<div class="prep-q">${t("imputeNum")}</div>${optCards("impnum", ["median", "mean", "knn"], S.impute.num, v => [({ median: t("impMedian"), mean: t("impMean"), knn: t("impKnn") })[v], t("impHelp")[v]])}`;
        if (S.impute.num === "knn") h += field(t("kNeighbors"), sel("impk", [1, 3, 5, 10, 20], S.impute.k));
      }
      if (catMiss) h += `<p class="help">${P2.catFill}</p>`;
    }
    h += `</div>`;
  }
  el.innerHTML = h;
  el.querySelectorAll(".ds-item").forEach(b => b.onclick = () => { if (b.dataset.k !== "custom") pickDataset(b.dataset.k); });
  $("#upload-btn").onclick = openUpload;
  el.querySelectorAll(".chip input").forEach(c => c.onchange = () => {
    const v = +c.value; if (c.checked) S.fsel = [...S.fsel, v].sort((a, b) => a - b); else if (S.fsel.length > 1) S.fsel = S.fsel.filter(x => x !== v);
    changed(); renderData(); renderAnalysis(); });
  bindSel(el, "practice", v => { S.practice = v; changed(); renderData(); renderAnalysis(); });
  bindCards(el, "impnum", v => { S.impute.num = v; changed(); renderData(); renderAnalysis(); });
  bindSel(el, "impk", v => { S.impute.k = v; changed(); renderAnalysis(); });
  bindCards(el, "scale", v => { S.scale = v; changed(); renderData(); renderAnalysis(); });
}
function optCards(id, opts, cur, lab) { SEL_OPTS[id] = opts; return `<div class="model-list opt-cards" data-oc="${id}">${opts.map((o, i) => { const [n, d] = lab(o);
  return `<button class="model-item ${o === cur ? "on" : ""}" data-oi="${i}"><span class="radio"></span><span><b>${E(n)}</b>${d ? `<small>${E(d)}</small>` : ""}</span></button>`; }).join("")}</div>`; }
function bindCards(root, id, fn) { const opts = SEL_OPTS[id]; root.querySelectorAll(`[data-oc="${id}"] [data-oi]`).forEach(b => b.onclick = () => fn(opts[+b.dataset.oi])); }
function field(label, ctl, help) { return `<div class="field"><label>${E(label)}</label>${ctl}${help ? `<div class="help">${E(help)}</div>` : ""}</div>`; }
const SEL_OPTS = {};
function sel(id, opts, cur, lab) { SEL_OPTS[id] = opts; return `<select data-sel="${id}">${opts.map((o, i) => `<option value="${i}" ${o === cur ? "selected" : ""}>${E(lab ? lab(o) : String(o))}</option>`).join("")}</select>`; }
function bindSel(root, id, fn) { const s = root.querySelector(`[data-sel="${id}"]`); if (!s) return; const opts = SEL_OPTS[id]; s.onchange = () => fn(opts[+s.value]); }

function pickDataset(key) {
  const D = window.DATASETS.find(d => d.key === key);
  setDataset(fromBuiltin(D));
}
function setDataset(ds) {
  freeRun(); S.ds = ds; S.practice = 0; S.dirty = 0; S.addLabel = null; rawCache = { key: null };
  S.fsel = ds.features.map((_, j) => j); S.run = null; S.stale = false; S.tab = "summary";
  const nums = ds.features.map((f, j) => f.type === "num" ? j : -1).filter(j => j >= 0);
  S.ex = nums[0] ?? 0; S.ey = isCls() ? (nums[1] ?? nums[0] ?? 0) : -1; S.vx = null; S.vy = null; S.resX = -1;
  if (!S.model || !MODELS[ds.task].includes(S.model)) setModel(ds.task === "classification" ? "tree" : "linreg"); else S.params = defaults(S.model);
  renderAll();
}

/* -------------------------------- subir CSV -------------------------------- */
/* --- lectura de CSV: limpia números con símbolos y convierte fechas en columnas útiles --- */
function mkDate(y, mo, d) { if (mo < 1 || mo > 12 || d < 1 || d > 31) return null; const dt = new Date(Date.UTC(y, mo - 1, d)); return dt.getUTCMonth() !== mo - 1 ? null : { y, m: mo, w: (dt.getUTCDay() + 6) % 7 + 1 }; }
function parseDate(s, order) {
  let m;
  if ((m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:[T ].*)?$/.exec(s))) return mkDate(+m[1], +m[2], +m[3]);
  if ((m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})(?:[T ].*)?$/.exec(s))) return order === "mdy" ? mkDate(+m[3], +m[1], +m[2]) : mkDate(+m[3], +m[2], +m[1]);
  return null;
}
function dateColumn(vals) { // → null si no es una columna de fechas
  const v = vals.filter(x => x !== null); if (!v.length) return null;
  let order = "dmy"; const parts = v.map(x => /^(\d{1,2})[-\/.](\d{1,2})[-\/.]\d{4}/.exec(x)).filter(Boolean);
  if (!parts.some(m => +m[1] > 12) && parts.some(m => +m[2] > 12)) order = "mdy";
  const parsed = vals.map(x => x === null ? null : parseDate(x, order));
  return parsed.filter(Boolean).length / v.length >= 0.9 ? parsed : null;
}
function numberColumn(vals) { // quita $, %, unidades y separadores de miles; devuelve números (o NaN)
  const CUR = /^(?:[$€£]|cop|usd|eur)\s*|\s*(?:[$€£%]|cop|usd|eur)$/gi;
  const hadCur = vals.some(x => x !== null && /[$€£]|cop|usd|eur/i.test(x));
  const core = vals.map(x => x === null ? null : x.replace(CUR, "").replace(/^(-?[\d.,\s]+?)\s*[a-zA-Z°µ²³\/]{1,6}$/, "$1").replace(/\s/g, ""));
  const v = core.filter(x => x !== null);
  const dotGroups = /^-?\d{1,3}(\.\d{3})+(,\d+)?$/, commaGroups = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/;
  const withDot = v.filter(x => x.includes(".")), withComma = v.filter(x => x.includes(","));
  const strong = re => hadCur || v.some(x => re.test(x) && ((x.match(/[.,]/g) || []).length > 1));
  let mode = "plain"; // punto decimal
  if (withDot.length && withDot.every(x => dotGroups.test(x)) && strong(dotGroups)) mode = "es"; // 1.200,50
  else if (withComma.length && withComma.every(x => commaGroups.test(x)) && strong(commaGroups) && !withComma.every(x => /^-?\d+,\d{1,2}$/.test(x))) mode = "en"; // 1,200.50
  else if (withComma.length && !withDot.length) mode = "comma"; // 3,5
  return core.map(x => { if (x === null) return null;
    const t2 = mode === "es" ? x.replace(/\./g, "").replace(",", ".") : mode === "en" ? x.replace(/,/g, "") : mode === "comma" ? x.replace(",", ".") : x;
    return /^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(t2) ? Number(t2) : NaN; });
}
const MIN_ROWS = 20, MIN_PER_CLASS = 3; // contrato mínimo del dataset
function parseCSV(text) {
  text = text.replace(/^﻿/, "");
  const first = text.split(/\r?\n/)[0], delim = [",", ";", "\t"].map(d => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === delim) { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some(c => c.trim() !== "")) rows.push(row); row = []; }
    else cur += ch; }
  row.push(cur); if (row.some(c => c.trim() !== "")) rows.push(row);
  if (rows.length < 3) throw new Error("short");
  const names = rows[0].map((c, i) => c.trim() || `col${i + 1}`), n = rows.length - 1;
  const raw = names.map((_, j) => rows.slice(1).map(r => { const s = (r[j] ?? "").trim(); return MISSING_TOKENS.has(s.toLowerCase()) ? null : s; }));
  const cols = [], types = [], data = [], bad = {}, es = S.lang === "es";
  names.forEach((name, j) => {
    const vals = raw[j], present = vals.filter(v => v !== null);
    const dates = dateColumn(vals);
    if (dates) { // fecha → año, mes y día de la semana
      [[es ? "año" : "year", "y"], [es ? "mes" : "month", "m"], [es ? "dia_semana" : "weekday", "w"]].forEach(([suf, k]) => {
        const col = dates.map(d => d ? d[k] : null); if (new Set(col.filter(v => v !== null)).size > 1) { cols.push(`${name}_${suf}`); types.push("num"); data.push(col); } });
      return; }
    const nums = numberColumn(vals), ok = nums.filter(v => v !== null && Number.isFinite(v)).length;
    if (present.length && ok / present.length >= 0.9) { cols.push(name); types.push("num"); data.push(nums.map(v => v === null || !Number.isFinite(v) ? null : v));
      bad[cols.length - 1] = vals.map((v, i) => v !== null && !Number.isFinite(nums[i]) ? { row: i, value: v } : null).filter(Boolean); return; }
    const uniq = new Set(present).size;
    cols.push(name); types.push(present.length && uniq <= 30 && uniq < present.length ? "cat" : "text"); data.push(vals);
  });
  const outRows = Array.from({ length: n }, (_, i) => data.map(col => col[i]));
  return { cols, rows: outRows, types, bad, target: cols[cols.length - 1], task: "auto", use: cols.map((_, j) => types[j] !== "text" && j !== cols.length - 1) };
}
function openUpload() {
  const Q = t("contract");
  openModal(`<h2>${t("uploadCsv")}</h2><div class="contract"><b>${Q.title}</b><p class="help">${Q.lead}</p><ul>${Q.items.map(x => `<li>${x}</li>`).join("")}</ul></div>
    <label class="btn primary" style="display:inline-flex">${t("uploadCsv")}<input type="file" id="csv-in" accept=".csv,text/csv,.txt" hidden></label>
    <div id="csv-cfg"></div>`);
  $("#csv-in").onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { try { S.csv = parseCSV(r.result); S.csv.name = f.name.replace(/\.[^.]+$/, ""); renderUpload(); } catch (err) { $("#csv-cfg").innerHTML = `<p class="err">${t("csvErr")}</p>`; } };
    r.readAsText(f); };
  if (S.csv) renderUpload();
}
function renderUpload() {
  const c = S.csv, el = $("#csv-cfg"); if (!el) return;
  const missing = c.cols.map((_, j) => c.rows.filter(r => r[j] === null).length);
  const typeLab = ty => ty === "num" ? t("num") : ty === "cat" ? t("cat") : "texto";
  el.innerHTML = `<p class="help"><b>${E(c.name)}</b> · ${c.rows.length} ${t("rowsN")}</p>
    <div class="grid2">${field(t("target"), `<select id="csv-t">${c.cols.map((n, j) => `<option value="${j}" ${n === c.target ? "selected" : ""}>${E(n)}</option>`).join("")}</select>`)}
    ${field(t("taskType"), `<select id="csv-task"><option value="auto">${t("autoDetect")}</option><option value="classification">${t("classification")}</option><option value="regression">${t("regression")}</option></select>`)}</div>
    <h4>${t("columns")}</h4>
    <div class="tablebox" style="max-height:260px"><table class="data"><tr><th></th><th>${S.lang === "es" ? "Columna" : "Column"}</th><th>${S.lang === "es" ? "Tipo" : "Type"}</th><th>${t("missingShort")}</th><th>${S.lang === "es" ? "Ejemplo" : "Example"}</th></tr>
    ${c.cols.map((n, j) => n === c.target ? "" : `<tr class="${c.types[j] === "text" ? "muted" : ""}"><td><input type="checkbox" data-j="${j}" ${c.use[j] ? "checked" : ""} ${c.types[j] === "text" ? "disabled" : ""}></td><td>${E(n)}</td><td>${typeLab(c.types[j])}</td><td>${missing[j] || ""}</td><td>${E(c.rows.find(r => r[j] !== null)?.[j] ?? "")}</td></tr>`).join("")}</table></div>
    <div class="actions"><button class="btn primary" id="csv-go">${t("useData")}</button><span class="err" id="csv-err"></span></div>`;
  $("#csv-task").value = c.task;
  $("#csv-t").onchange = e => { c.target = c.cols[+e.target.value]; c.use = c.cols.map((n, j) => c.types[j] !== "text" && n !== c.target); renderUpload(); };
  $("#csv-task").onchange = e => c.task = e.target.value;
  el.querySelectorAll("input[data-j]").forEach(i => i.onchange = () => c.use[+i.dataset.j] = i.checked);
  $("#csv-go").onclick = () => {
    const ti = c.cols.indexOf(c.target), fidx = c.cols.map((_, j) => j).filter(j => c.use[j] && j !== ti && c.types[j] !== "text");
    if (!fidx.length) { $("#csv-err").textContent = t("csvNoFeat"); return; }
    const keep = c.rows.map((r, i) => i).filter(i => { const v = c.rows[i][ti]; return v !== null && v !== undefined && !(typeof v === "number" && isNaN(v)); });
    let rows = keep.map(i => c.rows[i]); const newIdx = new Map(keep.map((ri, k) => [ri, k]));
    const dropped = c.rows.length - rows.length;
    let task = c.task; const yNum = c.types[ti] === "num";
    if (task === "auto") { const u = new Set(rows.map(r => r[ti])); task = !yNum || (u.size <= 10 && [...u].every(v => Number.isInteger(v))) ? "classification" : "regression"; }
    if (rows.length < MIN_ROWS) { $("#csv-err").textContent = t("contract").fewRows(rows.length); return; }
    if (task === "regression" && !yNum) { $("#csv-err").textContent = S.lang === "es" ? "Para regresión la columna a predecir debe ser numérica." : "For regression the target column must be numeric."; return; }
    let classes = null, y;
    if (task === "classification") { const labs = [...new Set(rows.map(r => String(r[ti])))].sort((a, b) => yNum ? a - b : a.localeCompare(b));
      if (labs.length > 12) { $("#csv-err").textContent = S.lang === "es" ? "Demasiadas clases (máximo 12)." : "Too many classes (max 12)."; return; }
      const small = labs.filter(l => rows.filter(r => String(r[ti]) === l).length < MIN_PER_CLASS);
      if (small.length) { $("#csv-err").textContent = t("contract").smallClass(small, MIN_PER_CLASS); return; }
      classes = labs.map(l => ({ es: l, en: l })); y = rows.map(r => labs.indexOf(String(r[ti]))); }
    else y = rows.map(r => r[ti]);
    const features = fidx.map(j => { const vals = rows.map(r => r[j]).filter(v => v !== null);
      return { key: c.cols[j], es: c.cols[j], en: c.cols[j], unit: "", type: c.types[j], integer: c.types[j] === "num" && vals.every(Number.isInteger), binary: c.types[j] === "num" && vals.every(v => v === 0 || v === 1) }; });
    const ds = { key: "custom", task, name: { es: c.name, en: c.name }, desc: null, simulated: false, classes, target: { key: c.target, es: c.target, en: c.target, unit: "" },
      features, X: rows.map(r => fidx.map(j => r[j])), y, dropped, csvName: c.name,
      badType: Object.fromEntries(fidx.map((j, k) => [k, (c.bad[j] || []).filter(b => newIdx.has(b.row)).map(b => ({ row: newIdx.get(b.row), value: b.value }))])) };
    closeModal(); setDataset(autoClean(ds));
  };
}

/* ============================== 2. ENTRENAMIENTO ============================ */
function defaults(m) { const p = {}; HP[m].forEach(h => p[h.k] = typeof h.def === "function" ? h.def(S.ds.task) : h.def); return p; }
function setModel(m) { S.model = m; S.params = defaults(m); S.treeIndex = 0; }
function optLabel(k, v) {
  const o = t("opt");
  if (k === "max_depth" && v === "none") return o.noLimit;
  if (k === "max_features" && v === 0.5) return o.half;
  if (typeof v === "boolean") return v ? o.yes : o.no;
  if (v === "l1" || v === "l2") return v.toUpperCase();
  if ((k === "class_weight" || k === "priors") && v !== "balanced") return o.balNo; if ((k === "class_weight" || k === "priors") && v === "balanced") return o.balYes;
  if (typeof v === "string" && o[v]) return o[v];
  return typeof v === "number" ? fmt(v, 4) : String(v);
}
const SK = { C: "C", penalty: "penalty", class_weight: "class_weight", max_iter: "max_iter", degree: "degree", regularization: "", alpha: "alpha", kernel: "kernel", gamma: "gamma",
  epsilon: "epsilon", criterion: "criterion", max_depth: "max_depth", min_samples_split: "min_samples_split", min_samples_leaf: "min_samples_leaf", max_features: "max_features",
  n_estimators: "n_estimators", bootstrap: "bootstrap", learning_rate: "learning_rate", subsample: "subsample", loss: "loss" };
function hpField(h) {
  const [lab, help] = t("hp")[h.k];
  return `<div class="field"><label>${E(lab)}</label>${sel("hp-" + h.k, h.opts, S.params[h.k], v => optLabel(h.k, v))}<div class="help">${E(help)}</div></div>`;
}
function partBar(tr, va, te) {
  return `<div class="partbar"><i class="p-tr" style="flex:${tr}">${Math.round(tr * 100)}%</i>${va ? `<i class="p-va" style="flex:${va}">${Math.round(va * 100)}%</i>` : ""}<i class="p-te" style="flex:${te}">${Math.round(te * 100)}%</i></div>
    <div class="legend small"><span><i class="p-tr"></i>${t("trainSize")}</span>${va ? `<span><i class="p-va"></i>${t("valSize")}</span>` : ""}<span><i class="p-te"></i>${t("testSize")}</span></div>`;
}
function renderTrain() {
  const el = $("#train-body");
  if (!S.ds) { el.innerHTML = `<p class="placeholder">${S.lang === "es" ? "Selecciona un dataset en «Datos»." : "Select a dataset in «Data»."}</p>`; return; }
  const visible = HP[S.model].filter(h => h.main && (!h.only || h.only === S.ds.task) && (!h.show || h.show(S.params)));
  const main = visible, adv = [];
  el.innerHTML = `<h4>${t("model")}</h4><div class="model-list">${MODELS[S.ds.task].map(m => { const [n, d] = t("models")[m];
      return `<button class="model-item ${S.model === m ? "on" : ""}" data-m="${m}"><span class="radio"></span><span><b>${E(n)}</b><small>${E(d)}</small></span></button>`; }).join("")}</div>
    <h4>${t("hyper")}</h4>${main.map(hpField).join("")}
    ${adv.length ? `<details class="adv" ${S.advOpen ? "open" : ""}><summary>${t("advanced")}</summary>${adv.map(hpField).join("")}</details>` : ""}
    <details class="adv opts" ${S.optsOpen ? "open" : ""}><summary>${t("teen").advOpts}</summary><p class="help">${t("teen").advHelp}</p>
    <h4>${t("partition")}</h4>
    <div class="grid2 tight">${field(t("valSize"), sel("val", [0, 0.1, 0.15, 0.2, 0.25, 0.3], S.valSize, v => v ? Math.round(v * 100) + " %" : t("noVal")))}
    ${field(t("testSize"), sel("test", [0.1, 0.15, 0.2, 0.25, 0.3], S.testSize, v => Math.round(v * 100) + " %"))}</div>
    ${partBar(1 - S.valSize - S.testSize, S.valSize, S.testSize)}<p class="help">${t("partHelp")}</p>
    <div class="field"><label>${t("seed")}</label><div class="row-inline"><span class="seed">${S.seed}</span><button class="btn text" id="reseed">${t("shuffle")}</button></div><div class="help">${t("seedHelp")}</div></div>
    </details>
    <div class="stale ${S.stale ? "show" : ""}">${t("stale")}</div>
    <button class="btn primary full big" id="train-btn">${t("train")}</button>`;
  el.querySelectorAll(".model-item").forEach(b => b.onclick = () => { setModel(b.dataset.m); changed(); renderTrain(); });
  visible.forEach(h => bindSel(el, "hp-" + h.k, v => { S.params[h.k] = v; changed(); renderTrain(); }));
  const d = el.querySelector("details.adv:not(.opts)"); if (d) d.ontoggle = () => S.advOpen = d.open;
  const d2 = el.querySelector("details.opts"); if (d2) d2.ontoggle = () => S.optsOpen = d2.open;
  bindSel(el, "val", v => { S.valSize = v; changed(); renderTrain(); renderAnalysis(); });
  bindSel(el, "test", v => { S.testSize = v; changed(); renderTrain(); renderAnalysis(); });
  $("#reseed").onclick = () => { S.seed = 1 + Math.floor(Math.random() * 999); changed(); renderTrain(); renderAnalysis(); };
  $("#train-btn").onclick = trainNow;
}
function changed() { if (S.run && !S.stale) { S.stale = true; renderStepper(); const s = document.querySelector("#train-body .stale"); if (s) s.classList.add("show"); } }

/* ------------------------------- entrenamiento ------------------------------ */
const SETS = ["train", "val", "test"];
const setLabel = n => t(n + "S");
function freeRun() { if (S.run) { S.run.model.free && S.run.model.free(); S.run = null; } }
function cfgSnapshot() { return JSON.parse(JSON.stringify({ scale: S.scale, model: S.model, params: S.params, fsel: S.fsel, valSize: S.valSize, testSize: S.testSize, seed: S.seed, impute: S.impute, practice: S.practice })); }
function makeModel(cfg, k) { return ML.make(cfg.model, S.ds.task, cfg.params, k, cfg.seed); }
const scoreFn = (y, p) => isCls() ? ML.accuracy(y, p) : ML.r2(y, p);
function predictSet(model, X) {
  if (!isCls()) return { pred: model.predict(X) };
  if (model.predictWithProba) { const r = model.predictWithProba(X); return { pred: r.map(o => o.pred), proba: r.map(o => o.p) }; }
  return { pred: model.predict(X), proba: model.predictProba ? model.predictProba(X) : null };
}
function doSplit(c) { const ds = S.ds, n0 = ds.n0 ?? ds.y.length, sp = ML.split3(ds.y.slice(0, n0), ds.task, c.valSize, c.testSize, c.seed, ds.classes ? ds.classes.length : 0);
  for (let i = n0; i < ds.y.length; i++) sp.train.push(i); return sp; }
const plannedSplit = () => doSplit(S);
function evalName() { const R = S.run; if (!R) return "test"; if (S.evalSet === "val" && !R.sets.val) return "test"; return S.evalSet; }

async function trainNow() {
  const btn = $("#train-btn"); btn.disabled = true; btn.textContent = t("training");
  const n = S.ds.y.length, P0 = S.params, heavy = (S.model === "rf" && P0.n_estimators * n > 25000) || (S.model === "gb" && P0.n_estimators * n * (S.ds.classes ? Math.max(1, S.ds.classes.length - 1) : 1) > 40000) || (S.model === "svm" && n > 300) || S.impute.num === "knn";
  const toast = $("#toast"), t0 = Date.now();
  if (heavy) { toast.innerHTML = factsHTML("facts-t"); toast.hidden = false; startFacts("facts-t"); }
  await sleep(heavy ? 120 : 30);
  try {
    freeRun();
    const cfg = cfgSnapshot(), ds = S.ds, k = ds.classes ? ds.classes.length : 0;
    const raw = rawRows(), rows = raw.map(r => cfg.fsel.map(j => r[j])), meta = cfg.fsel.map(j => ({ type: ds.features[j].type }));
    const sp = doSplit(cfg);
    const P = Prep.fit(ML.take(rows, sp.train), meta, prepOpts(cfg));
    const sets = {};
    SETS.forEach(nm => { if (!sp[nm].length) return; const r = ML.take(rows, sp[nm]); sets[nm] = { name: nm, idx: sp[nm], rows: r, X: P.transform(r), y: ML.take(ds.y, sp[nm]) }; });
    const model = makeModel(cfg, k);
    const evalSets = cfg.model === "gb" ? SETS.filter(nm => nm !== "train" && sets[nm]).map(nm => ({ X: sets[nm].X, score: p => scoreFn(sets[nm].y, p), nm })) : undefined;
    model.fit(sets.train.X, sets.train.y, evalSets);
    for (const nm in sets) { const o = sets[nm], pr = predictSet(model, o.X); o.pred = pr.pred; o.proba = pr.proba; o.score = scoreFn(o.y, o.pred);
      o.m = isCls() ? ML.classMetrics(o.y, o.pred, o.proba, k) : ML.regMetrics(o.y, o.pred, P.encoded.length); }
    const run = { cfg, k, P, model, meta, sets, viz: {} };
    if (evalSets) { run.staged = {}; evalSets.forEach((e, i) => run.staged[e.nm] = model.staged[i]); }
    run.missing = cfg.fsel.reduce((s2, j) => s2 + raw.filter(r => isMiss(r[j])).length, 0);
    // importancia por permutación (en validación si existe; si no, en prueba)
    const E2 = sets.val || sets.test, rr = ML.rng(cfg.seed + 101), imp = { mean: [], std: [], on: E2.name };
    for (let j = 0; j < cfg.fsel.length; j++) { const drops = [];
      for (let rep = 0; rep < 5; rep++) { const perm = ML.shuffle(ML.range(E2.rows.length), rr); const Rp = E2.rows.map((r, i) => { const c = r.slice(); c[j] = E2.rows[perm[i]][j]; return c; });
        drops.push(E2.score - scoreFn(E2.y, model.predict(P.transform(Rp)))); }
      const m = ML.mean(drops); imp.mean.push(m); imp.std.push(Math.sqrt(ML.mean(drops.map(v => (v - m) ** 2)))); }
    run.imp = imp;
    if (model.importances) { const agg = new Array(cfg.fsel.length).fill(0); P.encoded.forEach((e, i) => agg[e.src] += model.importances[i] || 0); run.native = agg; }
    if (model.coef && model.coef.length === 1) run.coef = model.coef[0];
    howStop(); S.how = { stage: null, sel: null, timer: null, model: null };
    S.run = run; S.stale = false; S.evalSet = sets.val ? "val" : "test";
    S.play = cfg.fsel.map(j => { const st = colStats(j); return ds.features[j].type === "cat" ? st.mode : st.median; });
    S.treeIndex = 0;
    const H = S.history[ds.key] = S.history[ds.key] || [];
    H.push({ n: H.length + 1, cfg, train: sets.train.score, val: sets.val ? sets.val.score : null, test: sets.test.score, missing: run.missing });
  } catch (e) { console.error(e); alertBox(String(e.message || e)); }
  btn.disabled = false; renderAll();
  if (window.innerWidth < 980 && S.run) $("#s3-right").closest(".card").scrollIntoView({ behavior: "smooth", block: "start" });
  if (heavy) { await sleep(Math.max(0, 3500 - (Date.now() - t0))); toast.hidden = true; stopFacts("facts-t"); }
}
function alertBox(msg) { const p = $("#s3-right"); if (p) p.insertAdjacentHTML("afterbegin", `<p class="err">${E(msg)}</p>`); }

/* ============================== 3. INFERENCIA =============================== */
const factTimers = {};
function factsHTML(id) { return `<div class="facts" id="${id}"><div class="facts-h"><span>${t("didYouKnow")}</span><span class="n"></span></div><p></p><div class="dots">${t("facts").map(() => "<i></i>").join("")}</div></div>`; }
function startFacts(id) {
  clearInterval(factTimers[id]); const f = t("facts"); let i = Math.floor(Math.random() * f.length);
  const go = () => { const el = document.getElementById(id); if (!el) return clearInterval(factTimers[id]); const k = i++ % f.length;
    el.querySelector("p").textContent = f[k]; el.querySelectorAll(".dots i").forEach((d, j) => d.classList.toggle("on", j === k)); el.querySelector(".n").textContent = `${k + 1}/${f.length}`; };
  go(); factTimers[id] = setInterval(go, 6000);
}
function stopFacts(id) { clearInterval(factTimers[id]); }
function applyDetails() { const on = !!(S.details && S.run); $("#analysis").hidden = !on; document.querySelector('.screen[data-step="4"] .split').classList.toggle("solo", !on); }
function renderPreview() {
  applyDetails();
  const el = $("#preview-body"), R = S.run, xb = $("#export-btn");
  if (!R) { xb.hidden = true; el.innerHTML = `<p class="placeholder">${t("previewEmpty")}</p>${factsHTML("facts-p")}`; startFacts("facts-p"); return; }
  stopFacts("facts-p"); xb.hidden = false;
  let h = `<div class="kpis">${SETS.filter(n => n !== "train" && R.sets[n]).map(n => `<div class="kpi ${n === "test" ? "main" : ""}"><span>${setLabel(n)} <em class="nick">· ${t("teen").nick[n]}</em></span><b>${scoreFmt(R.sets[n].score)}</b><small>${scoreName()}</small></div>`).join("")}</div>`;
  const [vk, vc] = verdict(R); h += `<div class="verdict ${vc} slim"><b>${t(vk + "T")}</b></div>`;
  h += `<button class="btn primary full how-btn" id="how-btn">${t("teen").howBtn}</button>`;
  h += `<button class="btn outline full details-btn" id="details-btn"><span><b>${S.details ? t("det").hide : t("det").show}</b><small>${t("det").sub(isCls())}</small></span><span aria-hidden="true">${S.details ? "‹" : "›"}</span></button>`;
  h += `<h4>${t("tryIt")}</h4>`;
  R.cfg.fsel.forEach((j, i) => { const f = S.ds.features[j], st = colStats(j);
    if (f.type === "cat") h += field(fName(j), `<select data-p="${i}">${st.cats.map(c => `<option ${c === S.play[i] ? "selected" : ""}>${E(c)}</option>`).join("")}</select>`);
    else { const step = f.integer || f.binary ? 1 : +(((st.max - st.min) / 100) || 0.01).toPrecision(1);
      h += `<div class="field slider"><label>${E(fLabel(j))}<output id="po${i}">${fmt(S.play[i])}</output></label><input type="range" data-p="${i}" min="${st.min}" max="${st.max}" step="${step}" value="${S.play[i]}"></div>`; } });
  h += `<div id="play-out"></div>`;
  const tgtCtl = isCls() ? `<select id="add-y">${S.ds.classes.map((c, i) => `<option value="${i}" ${S.addLabel === i ? "selected" : ""}>${E(c[S.lang])}</option>`).join("")}</select>`
    : `<input type="number" id="add-y" class="num-in" step="any" placeholder="${E(S.ds.target[S.lang])}">`;
  h += `<div class="addbox"><h4>${t("addTitle")}</h4><p class="help">${t("addHelp")}</p><div class="row-inline"><label>${E(S.ds.target[S.lang])}</label>${tgtCtl}<button class="btn outline sm" id="add-btn">${t("addBtn")}</button></div>${S.ds.added ? `<p class="help">${t("addedNote")(S.ds.added)}</p>` : ""}</div>`;
  el.innerHTML = h;
  el.querySelectorAll("[data-p]").forEach(inp => inp.oninput = inp.onchange = () => { const i = +inp.dataset.p; S.play[i] = inp.tagName === "SELECT" ? inp.value : +inp.value;
    const o = $("#po" + i); if (o) o.textContent = fmt(S.play[i]); schedPredict(); });
  $("#add-btn").onclick = addExample;
  $("#how-btn").onclick = () => { S.details = true; S.tab = "how"; applyDetails(); renderPreview(); renderAnalysis(); $("#analysis").scrollIntoView({ behavior: "smooth", block: "start" }); };
  $("#details-btn").onclick = () => { S.details = !S.details; applyDetails(); renderPreview(); renderAnalysis();
    if (S.details && window.innerWidth < 980) $("#analysis").scrollIntoView({ behavior: "smooth", block: "start" }); };
  predictNow();
}
function addExample() {
  const inp = $("#add-y"), R = S.run; let yv;
  if (isCls()) { yv = +inp.value; S.addLabel = yv; } else { yv = parseFloat(inp.value); if (!Number.isFinite(yv)) { inp.focus(); return; } }
  if (!S.ds.own) S.ds = Object.assign({}, S.ds, { X: S.ds.X.map(r => r.slice()), y: S.ds.y.slice(), own: true, n0: S.ds.y.length, added: 0 });
  S.ds.X.push(S.ds.features.map((f, j) => { const i = R.cfg.fsel.indexOf(j); return i >= 0 ? S.play[i] : null; }));
  S.ds.y.push(yv); S.ds.added++; rawCache = { key: null };
  changed(); renderData(); renderPreview(); renderAnalysis();
}
let raf = 0; function schedPredict() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; predictNow(); }); }
function predictNow() {
  const R = S.run, out = $("#play-out"); if (!R || !out) return;
  const x = R.P.transform([S.play]), m = R.model; let h = "";
  if (isCls()) {
    const r = predictSet(m, x), pred = r.pred[0], p = r.proba ? r.proba[0] : null;
    h += `<div class="answer" style="border-left-color:${C.color(pred)}"><span>${t("prediction")}</span><b style="color:${C.color(pred)}">${E(cName(pred))}</b>${p ? `<small>P(ŷ = ${E(cName(pred))}) = ${fmt(Math.max(...p), 3)}</small>` : ""}</div>`;
    if (p) h += S.ds.classes.map((c, i) => `<div class="prob"><span>${E(c[S.lang])}</span><div class="bar"><i style="width:${p[i] * 100}%;background:${C.color(i)}"></i></div><span>${fmt(p[i], 3)}</span></div>`).join("");
    if (m.perTree) { const v = m.perTree(x[0]), cnt = new Array(R.k).fill(0); v.forEach(c => cnt[c]++);
      h += `<h5>${t("votes")}</h5><div class="votes">${v.slice().sort((a, b) => a - b).map(c => `<i style="background:${C.color(c)}" title="${E(cName(c))}"></i>`).join("")}</div><p class="help">${cnt.map((nn, c) => nn ? `${E(cName(c))}: ${nn}` : "").filter(Boolean).join(" · ")}</p>`; }
  } else {
    const v = m.predict(x)[0], u = S.ds.target.unit ? " " + S.ds.target.unit : "";
    h += `<div class="answer"><span>${t("prediction")} (ŷ)</span><b>${fmt(v)}${u}</b><small>${E(S.ds.target[S.lang])}</small></div>`;
    if (m.perTree) { const vals = m.perTree(x[0]), ex = C.extent(vals.concat([v]), 0.1), F = C.frame({ w: 360, h: 90, x: ex, y: [0, 1], m: { t: 6, b: 28, l: 10, r: 10 } });
      let s = vals.map((q, i) => `<circle cx="${F.sx(q)}" cy="${F.sy(0.2 + 0.6 * ((i * 0.618) % 1))}" r="3" fill="${C.PAL[0]}" fill-opacity=".45"/>`).join("");
      s += `<line x1="${F.sx(v)}" x2="${F.sx(v)}" y1="${F.m.t}" y2="${F.m.t + F.H}" stroke="${C.PAL[1]}" stroke-width="2.5"/>`;
      C.ticks(ex[0], ex[1], 4).forEach(q => { if (q >= ex[0] && q <= ex[1]) s += `<text x="${F.sx(q)}" y="${F.h - 8}" text-anchor="middle" font-size="11" fill="${C.MUTED}">${fmt(q)}</text>`; });
      h += `<h5>${t("treesSay")}</h5><div class="chart">${F.wrap(s)}</div>${C.legend([[C.PAL[0], S.lang === "es" ? "árbol individual" : "single tree"], [C.PAL[1], t("avg")]])}`; }
  }
  out.innerHTML = h;
}

/* ================================ 4. ANÁLISIS =============================== */
/* ---- ¿Cómo decide? Explicación visual del modelo con 2 features (clasificación) o 1 feature (regresión) ---- */
const sigm = z => 1 / (1 + Math.exp(-z)), smax = z => { const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
function treeNodeAt(tree, x, d) { let n = tree.nodes[0], k = 0; while (!n.leaf && k < d) { n = tree.nodes[x[n.feature] <= n.threshold ? n.left : n.right]; k++; } return n; }
function treePath(tree, x, d) { const out = []; let n = tree.nodes[0], k = 0; while (!n.leaf && k < d) { const go = x[n.feature] <= n.threshold; out.push({ n, go }); n = tree.nodes[go ? n.left : n.right]; k++; } return { steps: out, end: n }; }
function gbOut(m, X, n) { // salida de Gradient Boosting usando solo los primeros n árboles
  const nOut = m.K === 2 ? 1 : m.K;
  return X.map(x => { const f = m.init.slice(0, nOut); for (let s = 0; s < n; s++) for (let k = 0; k < nOut; k++) f[k] += m.lr * m.stages[s][k].predictRow(x);
    if (m.task === "regression") return f[0]; return m.K === 2 ? [1 - sigm(f[0]), sigm(f[0])] : smax(f); });
}
function gbStages(M) { const s = [0, 1, 2, 3, 5, 10, 20, 50, 100, 200, 300].filter(v => v < M); s.push(M); return s; }
function howModel(R) { // modelo de 2 features (clasificación) o 1 feature (regresión) con la misma configuración
  const ds = S.ds, cls = isCls(), nums = R.cfg.fsel.filter(j => ds.features[j].type === "num");
  if (cls && nums.length < 2) return { err: t("how").need2 }; if (!cls && !nums.length) return { err: t("how").need1 };
  if (!nums.includes(S.vx)) S.vx = nums[0];
  if (cls && (!nums.includes(S.vy) || S.vy === S.vx)) S.vy = nums.find(j => j !== S.vx);
  const feats = cls ? [S.vx, S.vy] : [S.vx], key = "how|" + feats.join(",");
  if (R.viz[key]) return R.viz[key];
  const raw = rawRows(), rows = raw.map(r => feats.map(j => r[j])), tr = R.sets.train.idx;
  const P2 = Prep.fit(ML.take(rows, tr), feats.map(() => ({ type: "num" })), prepOpts(R.cfg));
  const X = P2.transform(rows), imp = P2.impute(rows), Xtr = ML.take(X, tr), ytr = ML.take(ds.y, tr);
  const m = makeModel(R.cfg, R.k); m.fit(Xtr, ytr);
  const V = { feats, P2, X, imp, m, tr, ytr, Xtr, nums, model: R.cfg.model, cache: {} };
  if (cls) {
    const G = 56, xr = C.extent(imp.map(r => r[0]), 0.06), yr = C.extent(imp.map(r => r[1]), 0.06), grid = [];
    for (let iy = 0; iy < G; iy++) for (let ix = 0; ix < G; ix++) grid.push([xr[0] + (xr[1] - xr[0]) * ix / (G - 1), yr[0] + (yr[1] - yr[0]) * iy / (G - 1)]);
    Object.assign(V, { G, xr, yr, grid, gridX: P2.transform(grid) });
  } else {
    const xr = C.extent(imp.map(r => r[0]), 0.03), xs = Array.from({ length: 160 }, (_, i) => xr[0] + (xr[1] - xr[0]) * i / 159);
    Object.assign(V, { xr, xs, xsX: P2.transform(xs.map(v => [v])) });
  }
  // etapas del aprendizaje
  const mo = R.cfg.model;
  if (mo === "tree") { const D = m.depth(); V.stages = ML.range(D + 1); V.stageLab = s => t("how").depthN(s); }
  else if (mo === "gb") { V.stages = gbStages(m.stages.length); V.stageLab = s => t("how").treesN(s); }
  else if (mo === "rf") { V.stages = cls ? ML.range(7) : [1, 2, 3, 5, 10, 20, 50, 100, 200, 300].filter(v => v <= m.trees.length); V.stageLab = s => t("how").treesN(s); }
  else if (mo === "logreg") { V.stages = [1, 2, 4, 8, 16, 32, 64, R.cfg.params.max_iter || 500].filter((v, i, a) => a.indexOf(v) === i && v <= (R.cfg.params.max_iter || 500)); V.stageLab = s => t("how").itersN(s); }
  else if (mo === "linreg") { V.stages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; V.stageLab = s => t("how").pctN(s * 10); }
  else { V.stages = [0]; V.stageLab = () => ""; }
  if (mo === "svm") { // la SVM se libera: se guardan sus predicciones
    if (cls) { const g = predictSet(m, V.gridX), pts = predictSet(m, X); V.svm = { cls: g.pred, conf: g.proba.map(q => Math.max(...q)), proba: pts.proba };
      try { V.sv = new Set(m.m.getSVIndices().map(i => tr[i])); } catch (e) { V.sv = null; } }
    else V.svm = { curve: m.predict(V.xsX), pts: m.predict(X) };
    m.free && m.free();
  }
  if (S.how.sel === null || S.how.sel >= ds.y.length) S.how.sel = R.sets.test.idx[0];
  return R.viz[key] = V;
}
// predicciones (clasificación) en la rejilla y en un punto, para una etapa
function howCls(V, s) {
  const c = V.cache[s]; if (c) return c; const m = V.m, mo = V.model; let gp;
  if (mo === "tree") gp = V.gridX.map(x => treeNodeAt(m, x, s).value);
  else if (mo === "gb") gp = gbOut(m, V.gridX, s);
  else if (mo === "logreg") { let mm = V.lr && V.lr[s]; if (!mm) { const cfg = S.run.cfg; mm = makeModel(Object.assign({}, cfg, { params: Object.assign({}, cfg.params, { max_iter: s }) }), S.run.k).fit(V.Xtr, V.ytr); (V.lr = V.lr || {})[s] = mm; } gp = mm.predictProba(V.gridX); }
  else if (mo === "rf" || mo === "nb") gp = m.predictProba(V.gridX);
  else return V.cache[s] = { cls: V.svm.cls, conf: V.svm.conf };
  return V.cache[s] = { cls: gp.map(q => q.indexOf(Math.max(...q))), conf: gp.map(q => Math.max(...q)) };
}
function howProba(V, s, i) { const m = V.m, mo = V.model, x = V.X[i];
  if (mo === "tree") return treeNodeAt(m, x, s).value; if (mo === "gb") return gbOut(m, [x], s)[0];
  if (mo === "logreg") { howCls(V, s); return V.lr[s].predictProba([x])[0]; } if (mo === "rf" || mo === "nb") return m.predictProba([x])[0]; return V.svm.proba[i]; }
function howReg(V, s, X) { const m = V.m, mo = V.model;
  if (mo === "tree") return X.map(x => treeNodeAt(m, x, s).value);
  if (mo === "gb") return gbOut(m, X, s);
  if (mo === "rf") return X.map(x => ML.mean(m.trees.slice(0, s).map(tr => tr.predictRow(x))));
  if (mo === "linreg") { const mu = ML.mean(V.ytr), f = m.predict(X); return f.map(v => mu + (v - mu) * s / 10); }
  return X === V.X ? V.svm.pts : V.svm.curve;
}
const unX = (V, j, z) => z * V.P2.s[j] + V.P2.c[j]; // umbral en unidades originales
function regionSVG(F, G, cls, conf, k, fade) {
  const img = C.gridImage(G, (ix, iy) => { const i = iy * G + ix, c = C.hex(C.color(cls[i])), a = (0.14 + 0.42 * Math.max(0, Math.min(1, (conf[i] - 1 / k) / (1 - 1 / k)))) * (fade || 1); return c.map(x => Math.round(255 + (x - 255) * a)); });
  let s = `<image href="${img}" x="${F.m.l}" y="${F.m.t}" width="${F.W}" height="${F.H}" preserveAspectRatio="none"/>`, dd = ""; const cw = F.W / G, ch = F.H / G;
  for (let iy = 0; iy < G; iy++) for (let ix = 0; ix < G; ix++) { const c = cls[iy * G + ix], x1 = F.m.l + (ix + 1) * cw, yTop = F.m.t + F.H - (iy + 1) * ch;
    if (ix < G - 1 && cls[iy * G + ix + 1] !== c) dd += `M${x1.toFixed(1)},${yTop.toFixed(1)}v${ch.toFixed(1)}`;
    if (iy < G - 1 && cls[(iy + 1) * G + ix] !== c) dd += `M${(x1 - cw).toFixed(1)},${yTop.toFixed(1)}h${cw.toFixed(1)}`; }
  return s + `<path d="${dd}" fill="none" stroke="#3C4043" stroke-width="2" stroke-linecap="square"/>`;
}
function gauge(p) { return `<div class="how-gauge">${p.map((q, c) => q > 0.005 ? `<span style="width:${(q * 100).toFixed(1)}%;background:${C.color(c)}" title="${E(cName(c))}">${q >= 0.12 ? Math.round(q * 100) + "%" : ""}</span>` : "").join("")}</div>`; }
function treeSVG(V, tree, x, stage, isReg) { // árbol visible hasta 3 niveles, con el camino del punto resaltado
  const D = Math.min(stage, 3), path = new Set(), H = t("how"); let n = tree.nodes[0], k = 0; path.add(n.id);
  while (!n.leaf && k < stage) { n = tree.nodes[x[n.feature] <= n.threshold ? n.left : n.right]; path.add(n.id); k++; }
  const pos = {}; let leaf = 0;
  (function lay(id, d) { const nd = tree.nodes[id]; if (nd.leaf || d >= D) { pos[id] = { x: leaf++, d, end: true }; return pos[id].x; }
    const a = lay(nd.left, d + 1), b = lay(nd.right, d + 1); pos[id] = { x: (a + b) / 2, d }; return pos[id].x; })(0, 0);
  const W = Math.max(leaf, 1) * 170, Hh = (D + 1) * 74 + 10, px = v => 85 + v * 170, py = d => 26 + d * 74; let s = "";
  Object.keys(pos).forEach(id => { const nd = tree.nodes[id], p = pos[id]; if (p.end) return;
    [[nd.left, H.yes], [nd.right, H.no]].forEach(([c, lab]) => { const on = path.has(+id) && path.has(c);
      s += `<line x1="${px(p.x)}" y1="${py(p.d) + 18}" x2="${px(pos[c].x)}" y2="${py(pos[c].d) - 16}" stroke="${on ? "#1B1F24" : "#C9CDD2"}" stroke-width="${on ? 3 : 1.4}"/><text x="${(px(p.x) + px(pos[c].x)) / 2 + (c === nd.left ? -10 : 10)}" y="${(py(p.d) + py(pos[c].d)) / 2 + 4}" font-size="12" text-anchor="middle" fill="#67707B">${lab}</text>`; }); });
  Object.keys(pos).forEach(id => { const nd = tree.nodes[id], p = pos[id], on = path.has(+id), x0 = px(p.x), y0 = py(p.d);
    if (p.end) { const lab = isReg ? fmt(nd.value, 1) : cName(nd.value.indexOf(Math.max(...nd.value))), col = isReg ? "#5C6670" : C.color(nd.value.indexOf(Math.max(...nd.value)));
      s += `<rect x="${x0 - 56}" y="${y0 - 16}" width="112" height="32" rx="8" fill="${col}" fill-opacity="${on ? 0.95 : 0.28}" stroke="${on ? "#1B1F24" : "none"}" stroke-width="2"/><text x="${x0}" y="${y0 + 5}" font-size="13" text-anchor="middle" fill="${on ? "#fff" : "#1B1F24"}">${E(lab)}${!nd.leaf ? " …" : ""}</text>`; }
    else { const q = `${fName(V.feats[nd.feature])} ≤ ${fmt(unX(V, nd.feature, nd.threshold), 1)}`;
      s += `<rect x="${x0 - 80}" y="${y0 - 18}" width="160" height="36" rx="8" fill="#fff" stroke="${on ? "#1B1F24" : "#C9CDD2"}" stroke-width="${on ? 2.5 : 1.2}"/><text x="${x0}" y="${y0 + 5}" font-size="12" text-anchor="middle" fill="#1B1F24">${E(q.length > 27 ? q.slice(0, 26) + "…" : q)}</text>`; } });
  return `<svg viewBox="0 0 ${W} ${Hh}" style="width:${Math.min(W, 680)}px;max-width:100%;height:auto">${s}</svg>`;
}
function bellSVG(V, j, sel) { // campanas de Naive Bayes de la feature j, en unidades originales
  const m = V.m, K = m.K, sc = V.P2.s[j], c0 = V.P2.c[j], xr = j === 0 ? V.xr : V.yr, xs = Array.from({ length: 120 }, (_, i) => xr[0] + (xr[1] - xr[0]) * i / 119);
  const dens = (k, x) => { const mu = m.theta[k][j] * sc + c0, sd = Math.sqrt(m.var[k][j]) * sc; return Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)); };
  const ys = ML.range(K).map(k => xs.map(x => dens(k, x))), top = Math.max(...ys.flat()) * 1.08, F = C.frame({ w: 430, h: 240, x: xr, y: [0, top], xl: fLabel(V.feats[j]), yl: "" });
  let s = F.bg + F.axes(); ys.forEach((y, k) => s += `<polyline fill="${C.color(k)}" fill-opacity=".12" stroke="${C.color(k)}" stroke-width="2.5" points="${F.sx(xs[0])},${F.sy(0)} ${xs.map((x, i) => `${F.sx(x)},${F.sy(y[i])}`).join(" ")} ${F.sx(xs[119])},${F.sy(0)}"/>`);
  const v = V.imp[sel][j]; s += `<line x1="${F.sx(v)}" x2="${F.sx(v)}" y1="${F.sy(0)}" y2="${F.sy(top)}" stroke="#1B1F24" stroke-width="2.5"/>`;
  ML.range(K).forEach(k => s += `<circle cx="${F.sx(v)}" cy="${F.sy(dens(k, v))}" r="5" fill="${C.color(k)}" stroke="#fff" stroke-width="1.5"/>`);
  return `<div class="chart">${F.wrap(s)}</div>`;
}
function pHow(el) {
  const R = S.run, ds = S.ds, cls = isCls(), H = t("how"), V = howModel(R);
  if (V.err) { el.innerHTML = `<p class="placeholder">${V.err}</p>`; return; }
  const mo = V.model, last = V.stages.length - 1; if (S.how.stage == null || S.how.stage > last || S.how.model !== mo) { S.how.stage = last; S.how.model = mo; }
  const st = V.stages[S.how.stage], sel = S.how.sel, test = new Set(R.sets.test.idx);
  const opt = cur => V.nums.map(j => `<option value="${j}" ${j === cur ? "selected" : ""}>${E(fName(j))}</option>`).join("");
  let h = tip(H.intro[mo]) + `<div class="row-inline"><label>${t("axisX")}</label><select id="hx">${opt(S.vx)}</select>${cls ? `<label>${t("axisY")}</label><select id="hy">${opt(S.vy)}</select>` : ""}<span class="help" style="margin:0">${H.twoNote(cls ? 2 : 1)}</span></div>`;
  if (V.stages.length > 1) h += `<div class="how-play"><button class="btn primary sm" id="how-play">${S.how.timer ? H.pause : H.play}</button><input type="range" id="how-st" min="0" max="${last}" step="1" value="${S.how.stage}"><b>${V.stageLab(st)}</b></div>`;
  let cap = "";
  if (cls) {
    const F = C.frame({ w: 680, h: 440, x: V.xr, y: V.yr, xl: fLabel(V.feats[0]), yl: fLabel(V.feats[1]) });
    let s = "";
    if (mo === "rf") { // mapas pequeños: un árbol cada uno
      const n = st, mini = []; const p = sel !== null ? V.X[sel] : null, votes = new Array(R.k).fill(0);
      for (let i = 0; i < 6; i++) { const tree = V.m.trees[i], key = "rf" + i; if (!V.cache[key]) { const gp = V.gridX.map(x => tree.predictRow(x)); V.cache[key] = { cls: gp.map(q => q.indexOf(Math.max(...q))), conf: gp.map(q => Math.max(...q)) }; }
        const on = i < n, F2 = C.frame({ w: 224, h: 170, x: V.xr, y: V.yr, m: { l: 8, r: 8, t: 8, b: 8 } }), vote = p ? tree.predictRow(p) : null, vc = vote ? vote.indexOf(Math.max(...vote)) : 0; if (on && p) votes[vc]++;
        let s2 = regionSVG(F2, V.G, V.cache[key].cls, V.cache[key].conf, R.k, on ? 1 : 0.35) + `<rect x="8" y="8" width="${F2.W}" height="${F2.H}" fill="none" stroke="#C9CDD2"/>`;
        if (p) s2 += `<circle cx="${F2.sx(V.imp[sel][0])}" cy="${F2.sy(V.imp[sel][1])}" r="7" fill="${C.color(ds.y[sel])}" stroke="#1B1F24" stroke-width="2.5"/>`;
        mini.push(`<div class="how-mini ${on ? "" : "off"}">${F2.wrap(s2)}<div>${H.treeI(i + 1)}: ${on && p ? `<b style="color:${C.color(vc)}">${E(cName(vc))}</b>` : "…"}</div></div>`); }
      h += `<div class="how-grid">${mini.join("")}</div>`;
      const all = p ? V.m.predictProba([p])[0] : null;
      if (p) h += `<p>${H.votes6(votes.map((v, c) => `${E(cName(c))} ${v}`).join(" · "))}</p><p>${H.forestAll(V.m.trees.length)}</p>${gauge(all)}`;
      cap = H.capRf(sel !== null ? E(cName(ds.y[sel])) : "");
      h += `<div class="actions" style="margin:6px 0 0"><button class="btn outline sm" id="how-next">${H.next}</button></div>`;
      el.innerHTML = h + `<p class="how-cap">${cap}</p>` + C.legend(ds.classes.map((c, i) => [C.color(i), c[S.lang]]));
    } else {
      const g = howCls(V, st); s += regionSVG(F, V.G, g.cls, g.conf, R.k) + F.axes();
      V.imp.forEach((p, i) => { const on = i === sel, sv = V.sv && V.sv.has(i);
        if (sv) s += `<circle cx="${F.sx(p[0])}" cy="${F.sy(p[1])}" r="8.5" fill="none" stroke="#1B1F24" stroke-width="1.4"/>`;
        s += `<circle data-p="${i}" cx="${F.sx(p[0])}" cy="${F.sy(p[1])}" r="${on ? 8 : 4.2}" fill="${C.color(ds.y[i])}" stroke="${on ? "#1B1F24" : "#fff"}" stroke-width="${on ? 3 : 1}" style="cursor:pointer" opacity="${sel !== null && !on ? 0.8 : 1}"><title>${E(cName(ds.y[i]))}</title></circle>`; });
      let side = "";
      if (sel !== null) { const pr = howProba(V, st, sel), k = pr.indexOf(Math.max(...pr)), ok = k === ds.y[sel];
        side = `<div class="how-side"><b>${H.thisPoint}</b><p class="help">${E(fName(V.feats[0]))}: ${fmt(V.imp[sel][0], 1)} · ${E(fName(V.feats[1]))}: ${fmt(V.imp[sel][1], 1)}</p>${gauge(pr)}<p>${H.says(E(cName(k)), E(cName(ds.y[sel])), ok)}</p>`;
        if (mo === "tree") { const tp = treePath(V.m, V.X[sel], st);
          side += `<ol class="how-steps">${tp.steps.map(({ n, go }) => `<li>${H.q(E(fName(V.feats[n.feature])), fmt(unX(V, n.feature, n.threshold), 1), fmt(V.imp[sel][n.feature], 1), go)}</li>`).join("")}<li>${H.leaf(E(cName(tp.end.value.indexOf(Math.max(...tp.end.value)))))}</li></ol>`; }
        side += `</div>`; }
      h += `<div class="how-wrap"><div class="chart">${F.wrap(s)}</div>${side}</div>`;
      if (mo === "tree") h += `<h4>${H.treeTitle}</h4><div class="chart how-tree">${treeSVG(V, V.m, sel !== null ? V.X[sel] : V.X[0], st, false)}</div>${st > 3 ? `<p class="help">${H.treeCut}</p>` : ""}`;
      if (mo === "nb" && sel !== null) h += `<h4>${H.bellsTitle}</h4><p class="help">${H.bellHelp}</p><div class="how-bells">${[0, 1].map(j => bellSVG(V, j, sel)).join("")}</div>`;
      cap = H.cap[mo](V.sv ? V.sv.size : 0);
      el.innerHTML = h + C.legend(ds.classes.map((c, i) => [C.color(i), c[S.lang]])) + `<p class="help">${H.clickHint}${mo === "svm" && V.sv ? " · " + H.svLegend : ""}</p><p class="how-cap">${cap}</p>`;
    }
  } else {
    const xs = V.xs, curve = howReg(V, st, V.xsX), ptsP = howReg(V, st, V.X), trS = new Set(V.tr);
    const F = C.frame({ w: 680, h: 420, x: C.extent(xs, 0.02), y: C.extent(ds.y.concat(curve), 0.06), xl: fLabel(V.feats[0]), yl: tName() });
    let s = F.bg + F.axes(), err = 0, nTr = 0;
    V.imp.forEach((p, i) => { if (!trS.has(i)) return; const on = i === sel; err += Math.abs(ds.y[i] - ptsP[i]); nTr++;
      s += `<line x1="${F.sx(p[0])}" x2="${F.sx(p[0])}" y1="${F.sy(ds.y[i])}" y2="${F.sy(ptsP[i])}" stroke="${on ? "#1B1F24" : "#D9A441"}" stroke-width="${on ? 3 : 1.2}" opacity="${on ? 1 : 0.7}"/>`; });
    if (mo === "rf") V.m.trees.slice(0, Math.min(st, 4)).forEach(tr => s += `<polyline fill="none" stroke="#7B5EA7" stroke-opacity=".35" stroke-width="1.5" points="${xs.map((v, i) => `${F.sx(v)},${F.sy(tr.predictRow(V.xsX[i]))}`).join(" ")}"/>`);
    s += `<polyline fill="none" stroke="#3B6FB6" stroke-width="3.5" points="${xs.map((v, i) => `${F.sx(v)},${F.sy(curve[i])}`).join(" ")}"/>`;
    V.imp.forEach((p, i) => { if (!trS.has(i) && i !== sel) return; const on = i === sel;
      s += `<circle data-p="${i}" cx="${F.sx(p[0])}" cy="${F.sy(ds.y[i])}" r="${on ? 7.5 : 4}" fill="#5C6670" fill-opacity="${on ? 1 : 0.55}" stroke="${on ? "#1B1F24" : "#fff"}" stroke-width="${on ? 3 : 0.8}" style="cursor:pointer"/>`; });
    let side = `<div class="how-side"><b>${H.errTitle}</b><p class="how-big">${fmt(err / (nTr || 1), 1)}</p><p class="help">${H.errHelp}</p>`;
    if (sel !== null) { side += `<div class="sep"></div><b>${H.thisPoint}</b><p class="help">${E(fName(V.feats[0]))}: ${fmt(V.imp[sel][0], 1)}</p><p>${H.regSays(fmt(ptsP[sel], 1), fmt(ds.y[sel], 1), fmt(Math.abs(ds.y[sel] - ptsP[sel]), 1))}</p>`;
      if (mo === "tree") { const tp = treePath(V.m, V.X[sel], st); side += `<ol class="how-steps">${tp.steps.map(({ n, go }) => `<li>${H.q(E(fName(V.feats[n.feature])), fmt(unX(V, n.feature, n.threshold), 1), fmt(V.imp[sel][n.feature], 1), go)}</li>`).join("")}<li>${H.leafReg(fmt(tp.end.value, 1))}</li></ol>`; } }
    side += `</div>`;
    h += `<div class="how-wrap"><div class="chart">${F.wrap(s)}</div>${side}</div>` + C.legend([["#5C6670", t("realData")], ["#3B6FB6", t("modelLine")], ["#D9A441", H.errLine]].concat(mo === "rf" ? [["#7B5EA7", H.someTrees]] : []));
    if (mo === "tree") h += `<h4>${H.treeTitle}</h4><div class="chart how-tree">${treeSVG(V, V.m, sel !== null ? V.X[sel] : V.X[0], st, true)}</div>${st > 3 ? `<p class="help">${H.treeCut}</p>` : ""}`;
    el.innerHTML = h + `<p class="help">${H.clickHintReg}</p><p class="how-cap">${H.capReg[mo]}</p>`;
  }
  el.querySelectorAll("[data-p]").forEach(c => c.onclick = () => { S.how.sel = +c.dataset.p; pHow(el); });
  const nx = $("#how-next"); if (nx) nx.onclick = () => { const te = R.sets.test.idx; S.how.sel = te[(te.indexOf(S.how.sel) + 1) % te.length]; pHow(el); };
  const hx = $("#hx"), hy = $("#hy"); if (hx) hx.onchange = e => { S.vx = +e.target.value; howStop(); pHow(el); }; if (hy) hy.onchange = e => { S.vy = +e.target.value; howStop(); pHow(el); };
  const rg = $("#how-st"); if (rg) rg.oninput = e => { howStop(); S.how.stage = +e.target.value; pHow(el); };
  const pb = $("#how-play"); if (pb) pb.onclick = () => { if (S.how.timer) { howStop(); pHow(el); return; }
    S.how.stage = 0; S.how.timer = setInterval(() => { if (S.tab !== "how" || S.step !== 4 || !document.body.contains(el)) { howStop(); return; } if (S.how.stage >= last) { howStop(); pHow(el); return; } S.how.stage++; pHow(el); }, 900); pHow(el); };
}
function howStop() { if (S.how.timer) { clearInterval(S.how.timer); S.how.timer = null; } }
function tabsFor() {
  const tb = ["summary"];
  if (isCls()) tb.push("conf", "roc"); else tb.push("pa", "res");
  tb.push("how", "tree", "imp"); return tb; // «Experimentos» se retiró
}
function tabLabel(k) { if (k === "map" && !isCls()) return t("tabs").curve; return t("tabs")[k]; }
function noData(el) { el.innerHTML = `<p class="placeholder">${t("pickFirst")}</p>`; }
function renderAnalysis() {
  if (S.step === 1) { const el = $("#s1-right"); if (!S.ds) { renderWelcome(el); return; } stopFacts("facts-w"); pData(el); return; }
  if (S.step === 2) { const el = $("#s2-body"); if (!S.ds) return noData(el); pValid(el); return; }
  if (S.step === 3) { const el = $("#s3-right"); if (!S.ds) return noData(el); renderTrainRight(el); return; }
  if (S.step === 5) { renderExport(); return; }
  const el = $("#analysis-body");
  if (!S.ds) { $("#tabs").innerHTML = ""; return noData(el); }
  const tb = tabsFor(); if (!tb.includes(S.tab)) S.tab = "summary";
  $("#tabs").innerHTML = tb.map(k => `<button class="tab ${S.tab === k ? "on" : ""}" data-t="${k}">${tabLabel(k)}</button>`).join("");
  $("#tabs").querySelectorAll(".tab").forEach(b => b.onclick = () => { S.tab = b.dataset.t; renderAnalysis(); });
  el.innerHTML = "";
  if (S.tab !== "hist" && !S.run) { el.innerHTML = `<p class="placeholder">${t("needTrain")}</p><div class="actions" style="justify-content:center"><button class="btn primary" id="go3">${t("goTrain")}</button></div>`; $("#go3").onclick = () => goStep(3); return; }
  ({ summary: pSummary, how: pHow, conf: pConf, roc: pRoc, pa: pPA, res: pRes, tree: pTree, imp: pImp, hist: pHist })[S.tab](el);
}
function renderWelcome(el) {
  el.innerHTML = `<div class="welcome"><h3>${t("wTitle")}</h3><p class="lead">${t("wLead")}</p><ol class="how">${[1, 2, 3, 4].map(n => `<li>${t("wStep" + n)}</li>`).join("")}</ol>${factsHTML("facts-w")}</div>`;
  startFacts("facts-w");
}
function renderTrainRight(el) {
  const R = S.run;
  if (!R) { el.innerHTML = `<p class="placeholder">${t("trainFirst")}</p>${factsHTML("facts-tr")}`; startFacts("facts-tr"); return; }
  stopFacts("facts-tr");
  const [vk, vc] = verdict(R), have = SETS.filter(n => n !== "train" && R.sets[n]);
  el.innerHTML = (S.stale ? `<div class="stale show">${t("stale")}</div>` : "")
    + `<div class="score-row" style="grid-template-columns:repeat(${have.length},1fr)">${have.map(n => `<div class="score-card ${n === "test" ? "accent" : ""}"><span>${setLabel(n)}</span><b>${scoreFmt(R.sets[n].score)}</b><small>${scoreName()}</small></div>`).join("")}</div>
    <div class="verdict ${vc}"><b>${t(vk + "T")}</b><span>${t(vk + "P")}</span></div><h4>${tabLabel("map")}</h4><div id="s3-map"></div>
    <div class="actions"><button class="btn outline" id="go4">${t("seeResults")} →</button></div>`;
  pMap($("#s3-map")); $("#go4").onclick = () => goStep(4);
}
const tip = txt => `<div class="tip"><b>${t("what")}</b><span>${txt}</span></div>`;
function setPicker() {
  const R = S.run, cur = evalName();
  return `<div class="seg"><span>${t("evalOn")}</span>${SETS.filter(n => n !== "train" && R.sets[n]).map(n => `<button class="${n === cur ? "on" : ""}" data-set="${n}">${setLabel(n)}</button>`).join("")}</div>`;
}
function bindSetPicker(el) { el.querySelectorAll("[data-set]").forEach(b => b.onclick = () => { S.evalSet = b.dataset.set; renderAnalysis(); }); }

/* ---- Dataset ---- */
function pearson(a, b) { const xs = [], ys = []; for (let i = 0; i < a.length; i++) if (!isMiss(a[i]) && !isMiss(b[i])) { xs.push(a[i]); ys.push(b[i]); } return xs.length > 2 ? corr(xs, ys) : NaN; }
function pData(el) {
  const ds = S.ds, raw = rawRows(), nf = ds.features.length, miss = Prep.missingReport(raw, nf), N = ds.y.length;
  let h = `<div class="kv"><div><b>${N}</b>${t("rows")}</div><div><b>${S.fsel.length} / ${nf}</b>${t("cols")}</div><div><b>${E(ds.target[S.lang])}</b>${t("toPredict")}</div><div><b>${t(ds.task)}</b>${t("task")}</div>${isCls() ? `<div><b>${ds.classes.length}</b>${t("nClasses")}</div>` : ""}<div><b>${miss.total} (${fmt(100 * miss.total / (N * nf), 1)} %)</b>${t("missingPct")}</div></div>`;
  // esquema
  h += `<h4>${t("schema")}</h4><div class="tablebox" style="max-height:none"><table class="data"><tr><th>${t("colName")}</th><th>${t("role")}</th><th>${t("type")}</th><th>${t("missingCol")}</th><th>${t("min")}</th><th>${t("max")}</th><th>${t("mean")}</th><th>${t("median")}</th><th>${t("std")}</th><th>${t("uniq")}</th><th>${t("mode")}</th></tr>`;
  const statRow = (vals, type) => {
    const v = vals.filter(x => !isMiss(x)), u = new Set(v).size;
    if (type === "cat") { const cnt = {}; v.forEach(x => cnt[x] = (cnt[x] || 0) + 1); const mo = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; return `<td>–</td><td>–</td><td>–</td><td>–</td><td>–</td><td>${u}</td><td>${E(mo ?? "–")}</td>`; }
    const s2 = Float64Array.from(v).sort(), m = ML.mean(v), sd = Math.sqrt(ML.mean(v.map(x => (x - m) ** 2)));
    return `<td>${fmt(s2[0])}</td><td>${fmt(s2[s2.length - 1])}</td><td>${fmt(m)}</td><td>${fmt(ML.median(v))}</td><td>${fmt(sd)}</td><td>${u}</td><td>–</td>`;
  };
  ds.features.forEach((f, j) => { const inc = S.fsel.includes(j);
    h += `<tr class="${inc ? "" : "muted"}"><td><b>${E(fLabel(j))}</b><br><code>${E(f.key)}</code></td><td class="role ${inc ? "feat" : "excl"}">${inc ? "Feature" : t("roleExcl")}</td><td>${t(f.type)}</td><td>${miss.perColumn[j] ? `<span class="badge miss">${miss.perColumn[j]} (${fmt(100 * miss.perColumn[j] / N, 1)} %)</span>` : "0"}</td>${statRow(raw.map(r => r[j]), f.type)}</tr>`; });
  h += `<tr class="tgt-row"><td><b>${E(tName())}</b><br><code>${E(ds.target.key)}</code></td><td class="role tgt">Target</td><td>${isCls() ? t("cat") : t("num")}</td><td>0</td>${isCls() ? statRow(ds.y.map(cName), "cat") : statRow(ds.y, "num")}</tr></table></div>`;
  h += `<div class="grid2"><div>`;
  // target y partición
  const sp = plannedSplit();
  if (isCls()) { const cnt = new Array(ds.classes.length).fill(0); ds.y.forEach(v => cnt[v]++);
    h += `<h4>${t("classDist")}</h4><div class="chart">${C.barsH(ds.classes.map((c, i) => ({ label: c[S.lang], value: cnt[i] })), { w: 520, color: (it, i) => C.color(i), fmtv: v => `${fmt(v, 0)} (${fmt(100 * v / N, 1)} %)` })}</div><p class="help">${t("imbalance")(fmt(Math.max(...cnt) / Math.max(1, Math.min(...cnt)), 2))}</p>`;
    h += `<h4>${t("partPlan")}</h4><p class="help">${t("partPlanHelp")}</p><div class="compact-wrap"><table class="data compact"><tr><th></th>${SETS.filter(n => sp[n].length).map(n => `<th>${setLabel(n)}</th>`).join("")}</tr>
      ${ds.classes.map((c, i) => `<tr><td><i class="dot" style="background:${C.color(i)}"></i>${E(c[S.lang])}</td>${SETS.filter(n => sp[n].length).map(n => `<td>${sp[n].filter(r => ds.y[r] === i).length}</td>`).join("")}</tr>`).join("")}
      <tr class="best"><td><b>Total</b></td>${SETS.filter(n => sp[n].length).map(n => `<td><b>${sp[n].length}</b></td>`).join("")}</tr></table></div>`;
  } else {
    h += `<h4>${t("targetDist")}</h4><div class="chart">${C.histogram(ds.y, { w: 520, h: 240, bins: 14, xl: tName(), yl: t("count") })}</div>`;
    h += `<h4>${t("partPlan")}</h4><p class="help">${t("partPlanHelp")}</p><div class="compact-wrap"><table class="data compact"><tr>${SETS.filter(n => sp[n].length).map(n => `<th>${setLabel(n)}</th>`).join("")}</tr><tr>${SETS.filter(n => sp[n].length).map(n => `<td><b>${sp[n].length}</b> (${fmt(100 * sp[n].length / N, 0)} %)</td>`).join("")}</tr></table></div>`;
  }
  h += `</div><div>`;
  // correlación
  const nums = S.fsel.filter(j => ds.features[j].type === "num");
  const vars = nums.map(j => ({ lab: fName(j), v: raw.map(r => r[j]) })); if (!isCls()) vars.push({ lab: ds.target[S.lang], v: ds.y });
  if (vars.length >= 2) {
    const n = vars.length, cell = Math.max(34, Math.min(64, 380 / n)), lw = 130, W = lw + cell * n + 8, Hh = 20 + cell * n + 90;
    let s = "";
    vars.forEach((a, i) => vars.forEach((b, j) => { const r = i === j ? 1 : pearson(a.v, b.v), c = isNaN(r) ? "#eee" : r >= 0 ? `rgba(59,111,182,${Math.abs(r)})` : `rgba(74,79,87,${Math.abs(r)})`;
      s += `<rect x="${lw + j * cell}" y="${10 + i * cell}" width="${cell - 2}" height="${cell - 2}" rx="3" fill="${c}"><title>${E(a.lab)} · ${E(b.lab)}: ${fmt(r, 3)}</title></rect><text x="${lw + j * cell + cell / 2 - 1}" y="${10 + i * cell + cell / 2 + 4}" text-anchor="middle" font-size="${cell > 48 ? 12 : 10}" fill="${Math.abs(r) > 0.55 ? "#fff" : "#3C4043"}">${isNaN(r) ? "" : fmt(r, 2)}</text>`; }));
    vars.forEach((a, i) => { s += `<text x="${lw - 6}" y="${10 + i * cell + cell / 2 + 4}" text-anchor="end" font-size="11.5">${E(a.lab.slice(0, 18))}</text><text transform="translate(${lw + i * cell + cell / 2} ${14 + n * cell}) rotate(40)" font-size="11.5">${E(a.lab.slice(0, 18))}</text>`; });
    h += `<h4>${t("corrTitle")}</h4><p class="help">${t("corrHelp")}</p><div class="chart cm"><svg viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}">${s}</svg></div>`;
  }
  // dispersión
  const allNum = ds.features.map((f, j) => f.type === "num" ? j : -1).filter(j => j >= 0);
  if (allNum.length) {
    if (!allNum.includes(S.ex)) S.ex = allNum[0];
    if (S.ey !== -1 && !allNum.includes(S.ey)) S.ey = isCls() ? (allNum[1] ?? allNum[0]) : -1;
    const opts = (cur, tg) => (tg ? `<option value="-1" ${cur === -1 ? "selected" : ""}>${E(ds.target[S.lang])}</option>` : "") + allNum.map(j => `<option value="${j}" ${j === cur ? "selected" : ""}>${E(fName(j))}</option>`).join("");
    h += `<h4>${t("scatterTitle")}</h4><div class="row-inline"><label>${t("axisX")}</label><select id="ex">${opts(S.ex)}</select><label>${t("axisY")}</label><select id="ey">${opts(S.ey, !isCls())}</select></div>`;
    const pts = raw.map((r, i) => [r[S.ex], S.ey === -1 ? ds.y[i] : r[S.ey], ds.y[i]]).filter(p => !isMiss(p[0]) && !isMiss(p[1]));
    const F = C.frame({ w: 540, h: 380, x: C.extent(pts.map(p => p[0]), 0.05), y: C.extent(pts.map(p => p[1]), 0.05), xl: fLabel(S.ex), yl: S.ey === -1 ? tName() : fLabel(S.ey) }), yr = C.extent(ds.y);
    let s = F.bg + F.axes();
    pts.forEach(p => s += `<circle cx="${F.sx(p[0])}" cy="${F.sy(p[1])}" r="4" fill="${isCls() ? C.color(p[2]) : C.seqCss(0.15 + 0.85 * (p[2] - yr[0]) / (yr[1] - yr[0]))}" fill-opacity=".8" stroke="#fff" stroke-width=".7"/>`);
    h += `<div class="chart">${F.wrap(s)}</div>` + (isCls() ? C.legend(ds.classes.map((c, i) => [C.color(i), c[S.lang]])) : C.seqLegend(yr[0], yr[1], ds.target[S.lang]));
  }
  h += `</div></div>`;
  el.innerHTML = h;
  const ex = $("#ex"), ey = $("#ey"); if (ex) { ex.onchange = () => { S.ex = +ex.value; renderAnalysis(); }; ey.onchange = () => { S.ey = +ey.value; renderAnalysis(); }; }
  const si = $("#showimp"); if (si) si.onchange = () => { S.showImputed = si.checked; renderAnalysis(); };
  el.querySelectorAll("[data-view]").forEach(b => b.onclick = () => { S.dataView = b.dataset.view; renderAnalysis(); });
}

/* ---- Resumen ---- */
function verdict(R) {
  const tr = R.sets.train.score, ref = (R.sets.val || R.sets.test).score, gap = tr - ref, cls = isCls(), low = cls ? tr < 0.72 : tr < 0.5;
  if (gap > (cls ? 0.08 : 0.12)) return ["vOver", "bad"]; if (low) return ["vUnder", "warn"];
  if (gap > (cls ? 0.04 : 0.06)) return ["vOk", "info"]; return ["vGood", "good"];
}
function metricTableRows() {
  if (!isCls()) return [["R²", m => fmt(m.r2, 3)], ["MAE", m => fmt(m.mae)], ["MSE", m => fmt(m.mse)], ["MAPE", m => isNaN(m.mape) ? "–" : fmt(m.mape * 100, 2) + " %"]];
  const rows = [[t("acc"), m => pct(m.acc)], [t("bal"), m => pct(m.bal)]];
  if (S.run.k === 2) { const c = 1; rows.push([t("prec"), m => pct(m.rows[c].prec)], [t("rec"), m => pct(m.rows[c].rec)], [t("spec"), m => pct(m.rows[c].spec)], [t("f1"), m => pct(m.rows[c].f1)], [t("auc"), m => isNaN(m.rows[c].auc) ? "–" : fmt(m.rows[c].auc, 3)]); }
  return rows;
}
function pSummary(el) {
  const R = S.run, [vk, vc] = verdict(R), have = SETS.filter(n => n !== "train" && R.sets[n]), ref = R.sets.val ? "val" : "test";
  let h = tip(t("sumTip")) + `<div class="score-row" style="grid-template-columns:repeat(${have.length},1fr)">${have.map(n => `<div class="score-card ${n === "test" ? "accent" : ""}"><span>${setLabel(n)} · n = ${R.sets[n].y.length}</span><b>${scoreFmt(R.sets[n].score)}</b><small>${scoreName()}</small></div>`).join("")}</div>
    <div class="verdict ${vc}"><b>${t(vk + "T")}</b><span>${t(vk + "P")}</span></div>`;
  h += `<h4>${isCls() ? t("globalMetrics") + (R.k === 2 ? ` · ${E(t("binTitle")(cName(1)))}` : "") : t("regMetrics")}</h4><div class="tablebox" style="max-height:none"><table class="data"><tr><th></th>${have.map(n => `<th>${setLabel(n)}</th>`).join("")}</tr>
    ${metricTableRows().map(([lab, f]) => `<tr><td>${E(lab)}</td>${have.map(n => `<td>${f(R.sets[n].m)}</td>`).join("")}</tr>`).join("")}</table></div>`;
  if (R.missing) h += `<p class="note">${t("imputedNote")(R.missing, impLabel(R.cfg))}</p>`;
  if (R.staged) {
    const all = Object.values(R.staged).flat(), n = Object.values(R.staged)[0].length, F = C.frame({ w: 680, h: 290, x: [1, n], y: C.extent(all, 0.08), xl: t("nTrees"), yl: scoreName() });
    const cols = { val: C.PAL[1], test: C.PAL[2] };
    const line = (a, c, dash) => `<polyline fill="none" stroke="${c}" stroke-width="2.4" ${dash ? 'stroke-dasharray="6 4"' : ""} points="${a.map((v, i) => `${F.sx(i + 1)},${F.sy(v)}`).join(" ")}"/>`;
    h += `<h4>${t("stagedTitle")}</h4><div class="chart">${F.wrap(F.bg + F.axes() + Object.keys(R.staged).map(k2 => line(R.staged[k2], cols[k2], k2 === "train")).join(""))}</div>${C.legend(Object.keys(R.staged).map(k2 => [cols[k2], setLabel(k2)]))}`;
  }
  el.innerHTML = h;
}
function impLabel(cfg) { return cfg.impute.num === "knn" ? `KNN (n_neighbors=${cfg.impute.k})` : cfg.impute.num === "mean" ? t("impMean") : t("impMedian"); }

/* ---- Frontera de decisión / dependencia parcial ---- */
function pcaOf(R) { if (!R.pca) R.pca = ML.pca(R.sets.train.X, 2); return R.pca; }
function encName(R, i) { const e = R.P.encoded[i]; return fName(R.cfg.fsel[e.src]) + (e.cat !== undefined ? ` = ${e.cat}` : ""); }
function pcaMix(R, c) { const v = pcaOf(R).comps[c]; return ML.range(v.length).sort((x, y) => Math.abs(v[y]) - Math.abs(v[x])).slice(0, 2).map(i => encName(R, i)).join(S.lang === "es" ? " y " : " and "); }
function pMap(el) {
  const R = S.run, ds = S.ds, nums = R.cfg.fsel.filter(j => ds.features[j].type === "num"), tr = R.sets.train, te = R.sets.test, raw = rawRows();
  if (!isCls()) return pCurve(el, R, ds, nums, tr, raw);
  const d = R.P.encoded.length; if (d < 2) { el.innerHTML = `<p class="placeholder">${t("mapNeed2")}</p>`; return; }
  let mode = S.mapMode === "feat" ? "feat" : "pca2"; if (mode === "feat" && nums.length < 2) mode = "pca2";
  const modes = [["pca2", "PCA"]].concat(nums.length >= 2 ? [["feat", t("mapFeat")]] : []);
  let h = `<div class="seg">${modes.map(([k, l]) => `<button class="${k === mode ? "on" : ""}" data-mode="${k}">${l}</button>`).join("")}</div>`;
  const bindModes = () => el.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { S.mapMode = b.dataset.mode; renderAnalysis(); });
  const test = new Set(te.idx), sel2 = raw.map(r => R.cfg.fsel.map(j => r[j])), anyMiss = sel2.map(r => r.some(isMiss));
  let V, xl, yl, foot;
  if (mode === "feat") {
    if (!nums.includes(S.vx)) S.vx = nums[0];
    if (!nums.includes(S.vy) || S.vy === S.vx) S.vy = nums.find(j => j !== S.vx);
    const opts = cur => nums.map(j => `<option value="${j}" ${j === cur ? "selected" : ""}>${E(fName(j))}</option>`).join("");
    h += `<div class="row-inline"><label>${t("axisX")}</label><select id="vx">${opts(S.vx)}</select><label>${t("axisY")}</label><select id="vy">${opts(S.vy)}</select></div>`;
    const key = S.vx + "," + S.vy; V = R.viz[key];
    if (!V) {
      const rows2 = raw.map(r => [r[S.vx], r[S.vy]]), meta = [{ type: "num" }, { type: "num" }];
      const P2 = Prep.fit(ML.take(rows2, tr.idx), meta, prepOpts(R.cfg)), m2 = makeModel(R.cfg, R.k);
      m2.fit(P2.transform(ML.take(rows2, tr.idx)), tr.y);
      const imp = P2.impute(rows2), xr = C.extent(imp.map(r => r[0]), 0.06), yr = C.extent(imp.map(r => r[1]), 0.06), G = 96, grid = [];
      for (let iy = 0; iy < G; iy++) for (let ix = 0; ix < G; ix++) grid.push([xr[0] + (xr[1] - xr[0]) * ix / (G - 1), yr[0] + (yr[1] - yr[0]) * iy / (G - 1)]);
      const g = predictSet(m2, P2.transform(grid)), cls = g.pred, conf = g.proba ? g.proba.map(q => Math.max(...q)) : cls.map(() => 1);
      const acc2 = ML.accuracy(te.y, predictSet(m2, P2.transform(ML.take(rows2, te.idx))).pred);
      m2.free && m2.free();
      V = R.viz[key] = { G, xr, yr, cls, conf, imp, missing: rows2.map(r => isMiss(r[0]) || isMiss(r[1])), acc2 };
    }
    xl = fLabel(S.vx); yl = fLabel(S.vy);
    foot = `<p class="note">${t("map2")} <b>${pct(V.acc2)}</b> (${t("withAll")}: <b>${pct(te.score)}</b>)</p>`;
  } else {
    const P = pcaOf(R); V = R.viz.pca2;
    if (!V) {
      const Z = ML.project(P, R.P.transform(sel2), 2), xr = C.extent(Z.map(z => z[0]), 0.08), yr = C.extent(Z.map(z => z[1]), 0.08), G = 96, grid = [];
      for (let iy = 0; iy < G; iy++) for (let ix = 0; ix < G; ix++) { const u = xr[0] + (xr[1] - xr[0]) * ix / (G - 1), v = yr[0] + (yr[1] - yr[0]) * iy / (G - 1);
        grid.push(P.mean.map((m, j) => m + u * P.comps[0][j] + v * P.comps[1][j])); }
      const g = predictSet(R.model, grid);
      V = R.viz.pca2 = { G, xr, yr, cls: g.pred, conf: g.proba ? g.proba.map(q => Math.max(...q)) : g.pred.map(() => 1), imp: Z, missing: anyMiss };
    }
    xl = t("pcaAxis")(1, fmt(P.ratio[0] * 100, 0)); yl = t("pcaAxis")(2, fmt(P.ratio[1] * 100, 0));
    foot = `<p class="note">${t("pcaMixNote")(pcaMix(R, 0), pcaMix(R, 1))}</p><p class="help">${t("pcaSlice")}</p>`;
  }
  const k = R.k, img = C.gridImage(V.G, (ix, iy) => { const i = iy * V.G + ix, c = C.hex(C.color(V.cls[i])), a = 0.14 + 0.42 * Math.max(0, Math.min(1, (V.conf[i] - 1 / k) / (1 - 1 / k))); return c.map(x => Math.round(255 + (x - 255) * a)); });
  const F = C.frame({ w: 680, h: 500, x: V.xr, y: V.yr, xl, yl });
  let s = `<image href="${img}" x="${F.m.l}" y="${F.m.t}" width="${F.W}" height="${F.H}" preserveAspectRatio="none"/>` + F.axes();
  { const G = V.G, cw = F.W / G, ch = F.H / G; let dd = "";
    for (let iy = 0; iy < G; iy++) for (let ix = 0; ix < G; ix++) { const c = V.cls[iy * G + ix], x1 = F.m.l + (ix + 1) * cw, yTop = F.m.t + F.H - (iy + 1) * ch;
      if (ix < G - 1 && V.cls[iy * G + ix + 1] !== c) dd += `M${x1.toFixed(1)},${yTop.toFixed(1)}v${ch.toFixed(1)}`;
      if (iy < G - 1 && V.cls[(iy + 1) * G + ix] !== c) dd += `M${(x1 - cw).toFixed(1)},${yTop.toFixed(1)}h${cw.toFixed(1)}`; }
    s += `<path d="${dd}" fill="none" stroke="#3C4043" stroke-width="2" stroke-linecap="square"/>`; }
  V.imp.forEach((p, i) => { const tt = test.has(i);
    s += `<circle cx="${F.sx(p[0])}" cy="${F.sy(p[1])}" r="${tt ? 5 : 4}" fill="${C.color(ds.y[i])}" stroke="${tt ? "#3C4043" : "#fff"}" stroke-width="${tt ? 1.6 : 1}" ${V.missing[i] ? 'stroke-dasharray="2 2" fill-opacity=".45"' : ""}><title>${E(cName(ds.y[i]))}</title></circle>`; });
  el.innerHTML = h + tip(mode === "feat" ? t("mapTip") : t("pcaTip")) + `<div class="chart">${F.wrap(s)}</div>` + C.legend(ds.classes.map((c, i) => [C.color(i), c[S.lang]]))
    + `<p class="help">${t("ptsLegend")}${V.missing.some(Boolean) ? " · " + t("imputedPts") : ""}</p>` + foot;
  bindModes();
  if (mode === "feat") { $("#vx").onchange = e => { S.vx = +e.target.value; renderAnalysis(); }; $("#vy").onchange = e => { S.vy = +e.target.value; renderAnalysis(); }; }
}
function pCurve(el, R, ds, nums, tr, raw) {
  if (!nums.length) { el.innerHTML = `<p class="placeholder">${t("mapNeed2")}</p>`; return; }
  if (!nums.includes(S.vx)) S.vx = nums[0];
  if (S.vy !== null && (!nums.includes(S.vy) || S.vy === S.vx)) S.vy = null;
  const opts = (cur, none) => (none ? `<option value="-1" ${cur === null ? "selected" : ""}>${t("none")}</option>` : "") + nums.map(j => `<option value="${j}" ${j === cur ? "selected" : ""}>${E(fName(j))}</option>`).join("");
  let h = `<div class="row-inline"><label>${t("axisX")}</label><select id="vx">${opts(S.vx)}</select><label>${t("axisY")}</label><select id="vy">${opts(S.vy, true)}</select></div>`;
  {
    const fi = R.cfg.fsel.indexOf(S.vx), impAll = R.P.impute(raw.map(r => R.cfg.fsel.map(j => r[j]))), trImp = R.P.impute(tr.rows);
    const typical = R.cfg.fsel.map((j, i) => ds.features[j].type === "cat" ? R.P.fill[i] : ML.median(trImp.map(r => r[i])));
    const xr = C.extent(impAll.map(r => r[fi])), xs = Array.from({ length: 90 }, (_, i) => xr[0] + (xr[1] - xr[0]) * i / 89);
    const curve = R.model.predict(R.P.transform(xs.map(v => { const r = typical.slice(); r[fi] = v; return r; })));
    const F = C.frame({ w: 680, h: 400, x: C.extent(xs, 0.03), y: C.extent(ds.y.concat(curve), 0.06), xl: fLabel(S.vx), yl: tName() });
    let s = F.bg + F.axes();
    impAll.forEach((r, i) => s += `<circle cx="${F.sx(r[fi])}" cy="${F.sy(ds.y[i])}" r="3.6" fill="${C.PAL[0]}" fill-opacity=".4"/>`);
    s += `<polyline fill="none" stroke="${C.PAL[1]}" stroke-width="3" points="${xs.map((v, i) => `${F.sx(v)},${F.sy(curve[i])}`).join(" ")}"/>`;
    h += tip(t("curveTip")) + `<div class="chart">${F.wrap(s)}</div>` + C.legend([[C.PAL[0], t("realData")], [C.PAL[1], t("modelLine")]]);
    if (S.vy !== null) {
      const fj = R.cfg.fsel.indexOf(S.vy), G = 48, yr = C.extent(impAll.map(r => r[fj])), grid = [];
      for (let iy = 0; iy < G; iy++) for (let ix = 0; ix < G; ix++) { const r = typical.slice(); r[fi] = xr[0] + (xr[1] - xr[0]) * ix / (G - 1); r[fj] = yr[0] + (yr[1] - yr[0]) * iy / (G - 1); grid.push(r); }
      const z = R.model.predict(R.P.transform(grid)), zr = C.extent(z), img = C.gridImage(G, (ix, iy) => C.seq((z[iy * G + ix] - zr[0]) / (zr[1] - zr[0])));
      const F2 = C.frame({ w: 680, h: 460, x: xr, y: yr, xl: fLabel(S.vx), yl: fLabel(S.vy) });
      let s2 = `<image href="${img}" x="${F2.m.l}" y="${F2.m.t}" width="${F2.W}" height="${F2.H}" preserveAspectRatio="none"/>` + F2.axes();
      impAll.forEach(r => s2 += `<circle cx="${F2.sx(r[fi])}" cy="${F2.sy(r[fj])}" r="2.3" fill="#3C4043" fill-opacity=".45"/>`);
      h += `<div class="sep"></div>` + tip(t("heatTip")) + `<div class="chart">${F2.wrap(s2)}</div>` + C.seqLegend(zr[0], zr[1], `ŷ: ${ds.target[S.lang]}`);
    }
  }
  el.innerHTML = h;
  $("#vx").onchange = e => { S.vx = +e.target.value; renderAnalysis(); };
  $("#vy").onchange = e => { const v = +e.target.value; S.vy = v < 0 ? null : v; renderAnalysis(); };
}

/* ---- Matriz de confusión y métricas ---- */
function pConf(el) {
  const R = S.run, st = R.sets[evalName()], k = R.k, m = st.m, M = m.M, cell = Math.max(54, Math.min(88, 400 / k)), lw = 120, w = lw + cell * k + 10, hh = 56 + cell * k + 8, mx = Math.max(1, ...M.flat());
  let s = `<text x="${lw + cell * k / 2}" y="14" text-anchor="middle" font-size="13" font-weight="500">${t("predicted")} (ŷ)</text>`;
  for (let j = 0; j < k; j++) s += `<text x="${lw + cell * j + cell / 2}" y="44" text-anchor="middle" font-size="12" fill="${C.MUTED}">${E(cName(j).slice(0, 12))}</text>`;
  for (let i = 0; i < k; i++) {
    s += `<text x="${lw - 8}" y="${56 + cell * i + cell / 2 + 4}" text-anchor="end" font-size="12" fill="${C.MUTED}">${E(cName(i).slice(0, 16))}</text>`;
    for (let j = 0; j < k; j++) { const v = M[i][j], a = v / mx, fill = i === j ? `rgba(59,111,182,${0.08 + 0.8 * a})` : v ? `rgba(217,119,6,${0.1 + 0.7 * a})` : "#fff";
      s += `<rect x="${lw + cell * j}" y="${56 + cell * i}" width="${cell - 4}" height="${cell - 4}" rx="6" fill="${fill}" stroke="#E3E5E8"/><text x="${lw + cell * j + cell / 2 - 2}" y="${56 + cell * i + cell / 2 + 5}" text-anchor="middle" font-size="${cell > 70 ? 18 : 15}" font-weight="600" fill="${a > 0.6 ? "#fff" : "#3C4043"}">${v}</text>`; } }
  s += `<text transform="translate(12 ${56 + cell * k / 2}) rotate(-90)" text-anchor="middle" font-size="13" font-weight="500">${t("real")} (y)</text>`;
  const card = (lab, v, sub) => `<div class="score-card"><span>${E(lab)}</span><b class="m">${v}</b>${sub ? `<small>${sub}</small>` : ""}</div>`;
  let right = `<h4>${t("globalMetrics")}</h4><div class="score-row">${card(t("acc"), pct(m.acc))}${card(t("bal"), pct(m.bal))}</div>`;
  if (k === 2) { const r = m.rows[1], pos = cName(1);
    right += `<h4>${E(t("binTitle")(pos))}</h4><div class="score-row">${card(t("tp"), r.tp)}${card(t("fn"), r.fn)}${card(t("fp"), r.fp)}${card(t("tn"), r.tn)}</div>`; }
  const P = v => pct(v), cols = [["prec", P], ["rec", P], ["spec", P], ["f1", P], ["auc", v => isNaN(v) ? "–" : fmt(v, 3)]];
  const tbl = `<h4>${t("perClassMetrics")}</h4><div class="tablebox" style="max-height:none"><table class="data"><tr><th></th>${cols.map(([c]) => `<th>${t(c)}</th>`).join("")}<th>${t("support")}</th></tr>`
    + m.rows.map((r, i) => `<tr><td><i class="dot" style="background:${C.color(i)}"></i>${E(cName(i))}</td>${cols.map(([c, f]) => `<td>${f(r[c])}</td>`).join("")}<td>${r.sup}</td></tr>`).join("") + `</table></div>`;
  const wrong = st.idx.map((row, i) => ({ row, i })).filter(o => st.pred[o.i] !== st.y[o.i]).slice(0, 12), raw = rawRows();
  let wr = "";
  if (wrong.length) wr = `<h4>${t("wrongTitle")}</h4><div class="tablebox" style="max-height:240px"><table class="data"><tr><th>#</th>${R.cfg.fsel.map(j => `<th>${E(fName(j))}</th>`).join("")}<th>${t("real")} (y)</th><th>${t("predicted")} (ŷ)</th></tr>${wrong.map(o => `<tr><td>${o.row + 1}</td>${R.cfg.fsel.map(j => { const v = raw[o.row][j]; return isMiss(v) ? `<td class="miss">NaN</td>` : `<td>${typeof v === "number" ? fmt(v) : E(v)}</td>`; }).join("")}<td>${E(cName(st.y[o.i]))}</td><td class="bad">${E(cName(st.pred[o.i]))}</td></tr>`).join("")}</table></div>`;
  el.innerHTML = setPicker() + tip(t("confTip")) + `<div class="grid2"><div class="chart cm"><svg viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}">${s}</svg></div><div>${right}</div></div>${tbl}<p class="help"><a href="#" class="open-gloss">${t("glossary")}</a></p>${wr}`;
  bindSetPicker(el); el.querySelector(".open-gloss").onclick = e => { e.preventDefault(); openGlossary("cls"); };
}

/* ---- Curva ROC ---- */
function pRoc(el) {
  const R = S.run, st = R.sets[evalName()];
  if (!st.proba) { el.innerHTML = setPicker() + `<p class="placeholder">${t("rocNoProba")}</p>`; bindSetPicker(el); return; }
  const classes = R.k === 2 ? [1] : ML.range(R.k), F = C.frame({ w: 560, h: 500, x: [0, 1], y: [0, 1], xl: t("fpr"), yl: t("rec") });
  let s = F.bg + F.axes() + `<line x1="${F.sx(0)}" y1="${F.sy(0)}" x2="${F.sx(1)}" y2="${F.sy(1)}" stroke="#9AA1A9" stroke-dasharray="6 5"/>`;
  classes.forEach(c => { const cv = st.m.rows[c].curve; if (!cv) return;
    s += `<polyline fill="none" stroke="${C.color(c)}" stroke-width="2.5" points="${cv.roc.map(([x, y]) => `${F.sx(x)},${F.sy(y)}`).join(" ")}"/>`; });
  const leg = classes.map(c => [C.color(c), `${cName(c)}${R.k === 2 ? "" : " vs. resto"} — AUC = ${isNaN(st.m.rows[c].auc) ? "–" : fmt(st.m.rows[c].auc, 3)}`]).concat([["#9AA1A9", `${t("chance")} (AUC = 0,5)`]]);
  el.innerHTML = setPicker() + tip(t("rocTip")) + `<div class="chart" style="max-width:600px">${F.wrap(s)}</div>${C.legend(leg)}`;
  bindSetPicker(el);
}

/* ---- Observado vs predicho ---- */
function pPA(el) {
  const R = S.run, st = R.sets[evalName()], tr = R.sets.train, ex = C.extent(st.y.concat(st.pred, tr.y, tr.pred), 0.04);
  const F = C.frame({ w: 600, h: 470, x: ex, y: ex, xl: `y — ${tName()}`, yl: "ŷ" });
  let s = F.bg + F.axes() + `<line x1="${F.sx(ex[0])}" y1="${F.sy(ex[0])}" x2="${F.sx(ex[1])}" y2="${F.sy(ex[1])}" stroke="${C.PAL[1]}" stroke-width="2" stroke-dasharray="7 5"/>`;
  st.y.forEach((a, i) => s += `<circle cx="${F.sx(a)}" cy="${F.sy(st.pred[i])}" r="4.8" fill="${C.PAL[0]}" stroke="#fff"><title>y = ${fmt(a)} · ŷ = ${fmt(st.pred[i])}</title></circle>`);
  el.innerHTML = setPicker() + tip(t("paTip")) + `<div class="chart">${F.wrap(s)}</div>` + C.legend([].concat([[C.PAL[0], setLabel(st.name)], [C.PAL[1], t("perfect")]]));
  bindSetPicker(el);
}

/* ---- Residuos ---- */
function corr(a, b) { const n = a.length, ma = ML.mean(a), mb = ML.mean(b); let ab = 0, aa = 0, bb = 0; for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; ab += x * y; aa += x * x; bb += y * y; } return ab / (Math.sqrt(aa * bb) || 1); }
function pRes(el) {
  const R = S.run, st = R.sets[evalName()], res = st.m.res, pred = st.pred, imp = R.P.impute(st.rows), nums = R.cfg.fsel.map((j, i) => [j, i]).filter(([j]) => S.ds.features[j].type === "num");
  const mres = ML.mean(res), sd = Math.sqrt(ML.mean(res.map(v => (v - mres) ** 2)));
  const qc = a => { const m = ML.mean(a); return Math.abs(corr(res, a.map(v => (v - m) ** 2))); };
  const notes = [];
  if (Math.abs(mres) > 0.25 * sd) notes.push(["bad", t("resBias") + (mres > 0 ? t("resHigh") : t("resLow"))]);
  const curved = [[-1, qc(pred)], ...nums.map(([j, i]) => [j, qc(imp.map(r => r[i]))])].filter(c => c[1] > 0.3).sort((a, b) => b[1] - a[1]);
  if (curved.length) { const f = curved[0][0]; notes.push(["bad", t("resCurve") + (f >= 0 ? ` <b>${t("resLook")} «${E(fName(f))}».</b>` : "")]);
    if (S.resAuto !== R && f >= 0 && S.resX === -1) { S.resAuto = R; S.resX = f; } }
  if (corr(res.map(Math.abs), pred) > 0.35) notes.push(["info", t("resFunnel")]);
  if (st.score < 0.5) notes.push(["bad", t("resLowR2")]);
  if (!notes.length) notes.push(["good", t("resOk")]);
  if (S.resX !== -1 && !nums.some(([j]) => j === S.resX)) S.resX = -1;
  const xs = S.resX === -1 ? pred : imp.map(r => r[R.cfg.fsel.indexOf(S.resX)]);
  const lim = Math.max(...res.map(Math.abs)) * 1.08 || 1, F = C.frame({ w: 580, h: 380, x: C.extent(xs, 0.05), y: [-lim, lim], xl: S.resX === -1 ? "ŷ" : fLabel(S.resX), yl: "e = y − ŷ" });
  let s = F.bg + `<rect x="${F.m.l}" y="${F.sy(sd)}" width="${F.W}" height="${F.sy(-sd) - F.sy(sd)}" fill="${C.PAL[0]}" fill-opacity=".06"/>` + F.axes();
  s += `<line x1="${F.m.l}" x2="${F.m.l + F.W}" y1="${F.sy(0)}" y2="${F.sy(0)}" stroke="${C.PAL[3]}" stroke-width="2" stroke-dasharray="6 4"/>`;
  res.forEach((r, i) => s += `<circle cx="${F.sx(xs[i])}" cy="${F.sy(r)}" r="4.4" fill="${r >= 0 ? C.PAL[0] : C.PAL[1]}" fill-opacity=".85"><title>e = ${fmt(r)}</title></circle>`);
  const u = S.ds.target.unit ? " " + S.ds.target.unit : "";
  el.innerHTML = setPicker() + tip(t("resTip")) + `<div class="score-row three"><div class="score-card"><span>${t("resMean")} (ē)</span><b class="m">${fmt(mres)}${u}</b></div><div class="score-card"><span>${t("resStd")} (σₑ)</span><b class="m">${fmt(sd)}${u}</b></div><div class="score-card"><span>${t("resMax")}</span><b class="m">${fmt(Math.max(...res.map(Math.abs)))}${u}</b></div></div>`
    + notes.map(([c, n]) => `<div class="verdict ${c} slim"><span>${n}</span></div>`).join("")
    + `<div class="grid2"><div><div class="row-inline"><label>${t("resVs")}</label><select id="resx"><option value="-1">ŷ (${t("predicted")})</option>${nums.map(([j]) => `<option value="${j}" ${j === S.resX ? "selected" : ""}>${E(fName(j))}</option>`).join("")}</select></div><div class="chart">${F.wrap(s)}</div>${C.legend([[C.PAL[0], t("under")], [C.PAL[1], t("over")]])}</div>
       <div><h4>${t("resHist")}</h4><div class="chart">${C.histogram(res, { w: 560, h: 380, bins: 15, xl: "e", yl: t("count"), color: "#BBD0EC", zero: true })}</div></div></div>`;
  bindSetPicker(el); $("#resx").onchange = e => { S.resX = +e.target.value; renderAnalysis(); };
}

/* ---- Árbol ---- */
function pTree(el) {
  const R = S.run, m = R.model, name = R.cfg.model, cls = isCls();
  if (!["tree", "rf"].includes(name)) { el.innerHTML = `<p class="placeholder">${t("treeNA")}</p>`; return; }
  let tree, kind = "single", count = 1;
  if (name === "tree") tree = m;
  else if (name === "rf") { kind = "forest"; count = m.trees.length; tree = m.trees[S.treeIndex % count]; }
  else { kind = "boosting"; count = m.stages.length; tree = m.stages[S.treeIndex % count][0]; }
  const maxD = kind === "single" ? 4 : 3, shown = [], byId = {};
  (function walk(id, d) { const n = tree.nodes[id], c = Object.assign({}, n, { d, cut: !n.leaf && d >= maxD }); byId[id] = c; shown.push(c); if (!n.leaf && d < maxD) { walk(n.left, d + 1); walk(n.right, d + 1); } })(0, 0);
  let leafX = 0; const pos = {};
  (function lay(id) { const n = byId[id]; if (n.leaf || n.cut) return pos[id] = leafX++; const a = lay(n.left), b = lay(n.right); return pos[id] = (a + b) / 2; })(0);
  const BW = 164, BH = 64, GX = 12, GY = 48, depth = Math.max(...shown.map(n => n.d));
  const W = leafX * (BW + GX) + 16, H = (depth + 1) * (BH + GY) + 6, X = id => 8 + pos[id] * (BW + GX), Y = id => 4 + byId[id].d * (BH + GY);
  const enc = R.P.encoded, vals = shown.map(n => typeof n.value === "number" ? n.value : 0), vr = C.extent(vals);
  const q = n => { const e = enc[n.feature], fl = fName(R.cfg.fsel[e.src]); return e.cat !== undefined ? { txt: `¿${fl} = ${e.cat}?`, oh: true } : { txt: `¿${fl} ≤ ${fmt(n.threshold * R.P.s[e.src] + R.P.c[e.src], 2)}?`, oh: false }; };
  const impName = kind === "boosting" || !cls ? "MSE" : (R.cfg.params.criterion === "entropy" ? "entropy" : "gini");
  let s = "";
  shown.forEach(n => { if (n.leaf || n.cut) return; const oh = q(n).oh;
    [[n.left, oh ? t("no") : t("yes")], [n.right, oh ? t("yes") : t("no")]].forEach(([c, lab]) => { const x1 = X(n.id) + BW / 2, y1 = Y(n.id) + BH, x2 = X(c) + BW / 2, y2 = Y(c);
      s += `<path d="M${x1},${y1} C${x1},${y1 + GY / 2} ${x2},${y2 - GY / 2} ${x2},${y2}" fill="none" stroke="#BDC1C6" stroke-width="1.5"/><text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + 4}" text-anchor="middle" font-size="11" fill="${C.MUTED}" paint-order="stroke" stroke="#fff" stroke-width="4">${lab}</text>`; }); });
  shown.forEach(n => { const x = X(n.id), y = Y(n.id); let fill = "#fff", l2;
    if (cls && kind !== "boosting") { const kk = ML.argmax(n.value), a = n.value[kk]; fill = `rgba(${C.hex(C.color(kk)).join(",")},${0.08 + 0.4 * a})`; l2 = `${E(cName(kk).slice(0, 16))} · ${Math.round(a * 100)} %`; }
    else { fill = C.seqCss(0.05 + 0.6 * (n.value - vr[0]) / ((vr[1] - vr[0]) || 1)); l2 = (kind === "boosting" ? (n.value > 0 ? "+" : "") : "≈ ") + fmt(n.value, 2); }
    const l1 = n.leaf ? t("leaf") : n.cut ? "…" : E(q(n).txt);
    s += `<g><rect x="${x}" y="${y}" width="${BW}" height="${BH}" rx="6" fill="${fill}" stroke="${n.leaf ? "#DADCE0" : "#9AA0A6"}" ${n.cut ? 'stroke-dasharray="4 3"' : ""}/>
      <text x="${x + BW / 2}" y="${y + 18}" text-anchor="middle" font-size="12" font-weight="600">${l1.length > 28 ? l1.slice(0, 27) + "…" : l1}</text>
      <text x="${x + BW / 2}" y="${y + 37}" text-anchor="middle" font-size="12.5">${l2}</text>
      <text x="${x + BW / 2}" y="${y + 54}" text-anchor="middle" font-size="11" fill="${C.MUTED}">${n.samples} ${t("samples")}</text></g>`; });
  let h = tip(t("treeTip"));
  if (kind !== "single") h += `<p class="note">${kind === "forest" ? t("treeForest") : t("treeBoost")}</p><div class="row-inline"><button class="btn outline sm" id="tp">${t("prev")}</button><b>${t("treeN")} ${S.treeIndex % count + 1} / ${count}</b><button class="btn outline sm" id="tn">${t("next")}</button></div>`;
  h += `<p class="help">${shown.some(n => n.cut) ? `${t("treeCut")} ${tree.depth()} · ` : ""}${tree.nLeaves()} ${t("leaves")} · ${t("treeScroll")}</p><div class="tree-box"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:${Math.round(W * 0.8)}px;height:auto">${s}</svg></div>`;
  el.innerHTML = h;
  const box = el.querySelector(".tree-box"); box.scrollLeft = Math.max(0, (box.scrollWidth - box.clientWidth) / 2);
  if (kind !== "single") { $("#tp").onclick = () => { S.treeIndex = (S.treeIndex - 1 + count) % count; renderAnalysis(); }; $("#tn").onclick = () => { S.treeIndex = (S.treeIndex + 1) % count; renderAnalysis(); }; }
}

/* ---- Importancia ---- */
function pImp(el) {
  const R = S.run, items = R.cfg.fsel.map((j, i) => ({ label: fName(j), value: R.imp.mean[i], err: R.imp.std[i] })).sort((a, b) => b.value - a.value);
  let h = tip(t("impTip")) + `<h4>${t("impDrop")} (Δ ${scoreName()}) · ${t("evalOn")}: ${setLabel(R.imp.on)}</h4><div class="chart">${C.barsH(items, { w: 680, color: (it, i) => i === 0 ? C.PAL[0] : "#E6BFBF", fmtv: v => fmt(v, 3) })}</div>`;
  el.innerHTML = h;
}

/* ---- Experimentos ---- */
function paramsTxt(cfg) {
  const vis = HP[cfg.model].filter(h => h.main && (!h.only || h.only === S.ds.task) && (!h.show || h.show(cfg.params)));
  return vis.map(h => `${t("hp")[h.k][0]}: ${optLabel(h.k, cfg.params[h.k])}`).join(" · ");
}
function pHist(el) {
  const H = S.history[S.ds.key] || [];
  if (!H.length) { el.innerHTML = tip(t("histTip")) + `<p class="placeholder">${t("histEmpty")}</p>`; return; }
  const key = r => r.val != null ? r.val : r.test, best = Math.max(...H.map(key));
  el.innerHTML = tip(t("histTip")) + `<div class="tablebox" style="max-height:480px"><table class="data"><tr><th>#</th><th>${t("hModel")}</th><th>${t("hParams")}</th><th>${t("hCols")}</th><th>${t("hImpute")}</th><th>${t("hSplit")}</th><th>${setLabel("val")}</th><th>${setLabel("test")}</th><th></th></tr>
   ${H.slice().reverse().map(r => `<tr class="${key(r) === best ? "best" : ""}"><td>${r.n}</td><td>${E(t("models")[r.cfg.model][0])}</td><td class="wrap mono">${E(paramsTxt(r.cfg))}</td><td>${r.cfg.fsel.length}</td><td>${r.missing ? E(impLabel(r.cfg)) + (r.cfg.practice ? ` · MCAR ${Math.round(r.cfg.practice * 100)} %` : "") : "–"}</td><td class="mono">${Math.round((1 - r.cfg.valSize - r.cfg.testSize) * 100)}/${Math.round(r.cfg.valSize * 100)}/${Math.round(r.cfg.testSize * 100)} · seed ${r.cfg.seed}</td><td><b>${r.val != null ? scoreFmt(r.val) : "–"}</b></td><td>${scoreFmt(r.test)}</td><td><button class="btn text sm" data-r="${r.n}">${t("restore")}</button></td></tr>`).join("")}</table></div>
   <p class="help">${scoreName()}</p><div class="actions"><button class="btn text" id="hclear">${t("clear")}</button></div>`;
  el.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { const r = H.find(x => x.n === +b.dataset.r), c = JSON.parse(JSON.stringify(r.cfg));
    Object.assign(S, { scale: c.scale || "standard", model: c.model, params: c.params, fsel: c.fsel, valSize: c.valSize, testSize: c.testSize, seed: c.seed, impute: c.impute, practice: c.practice }); rawCache = { key: null }; changed(); goStep(3); });
  $("#hclear").onclick = () => { S.history[S.ds.key] = []; renderAnalysis(); };
}

/* ---- Validación del dataset (estilo Pandera) ---- */
/* Validación silenciosa con el esquema inferido (Pandera por detrás): los valores que no son números ya
   quedan vacíos (se rellenan con la imputación) y se quitan las filas repetidas. Solo se muestra un aviso corto. */
function autoClean(ds) {
  const res = Validate.run(Validate.infer(ds), ds, ds.X, { badType: ds.badType }), A2 = t("autoClean");
  let nBad = 0; const dup = new Set();
  res.fails.forEach(f => { if (f.check === "dtype") nBad += f.rows.length; if (f.check === "duplicates") f.rows.forEach(r => dup.add(r)); });
  const keep = ds.y.map((_, i) => i).filter(i => !dup.has(i)), parts = [];
  if (nBad) parts.push(A2.bad(nBad)); if (dup.size) parts.push(A2.dup(dup.size));
  return Object.assign({}, ds, { X: keep.map(i => ds.X[i]), y: keep.map(i => ds.y[i]), badType: undefined, cleaned: parts.length ? A2.lead + " " + parts.join(" ") : null });
}
function schemaOf(ds) { const k = ds.key + "|" + ds.features.map(f => f.key).join(","); if (!S.schemas[k]) S.schemas[k] = Validate.infer(ds); return S.schemas[k]; }
function validationRun() { const ds = S.ds; return Validate.run(schemaOf(ds), ds, rawRows(), { badType: ds.badType }); }
function pValid(el) {
  const ds = S.ds, sch = schemaOf(ds), res = validationRun(), V = t("valid");
  const colRow = (c, j, label, isT) => {
    const minmax = c.type === "num" ? `<td><input type="number" step="any" class="num-in" data-c="${j}" data-f="min" value="${c.min ?? ""}"></td><td><input type="number" step="any" class="num-in" data-c="${j}" data-f="max" value="${c.max ?? ""}"></td><td class="muted">–</td>`
      : `<td class="muted">–</td><td class="muted">–</td><td><input type="text" class="txt-in" data-c="${j}" data-f="isin" value="${E((c.isin || []).join(", "))}" ${isT ? "disabled" : ""}></td>`;
    return `<tr${isT ? ' class="tgt-row"' : ""}><td><b>${E(label)}</b><br><code>${E(c.key)}</code></td><td>${c.type === "num" ? "float" : "str"}</td><td><input type="checkbox" data-c="${j}" data-f="nullable" ${c.nullable ? "checked" : ""} ${isT ? "disabled" : ""}></td>${minmax}<td><input type="checkbox" data-c="${j}" data-f="unique" ${c.unique ? "checked" : ""}></td></tr>`;
  };
  let h = tip(V.tip);
  if (ds.key !== "custom") h += `<div class="row-inline">${field(V.dirty, sel("dirty", [0, 0.02, 0.05, 0.1], S.dirty, v => v ? Math.round(v * 100) + " %" : t("practiceOff")), V.dirtyHelp)}</div>`;
  h += `<h4>${V.schemaTitle}</h4><p class="help">${V.schemaHelp}</p><div class="tablebox" style="max-height:none"><table class="data schema"><tr><th>${t("colName")}</th><th>dtype</th><th>nullable</th><th>${V.min} <code>Check.ge</code></th><th>${V.max} <code>Check.le</code></th><th>${V.allowed} <code>Check.isin</code></th><th>unique</th></tr>
    ${sch.columns.map((c, j) => colRow(c, j, fName(j))).join("")}${colRow(sch.target, -1, ds.target[S.lang], true)}</table></div>
    <div class="row-inline" style="margin-top:10px"><label class="check"><input type="checkbox" id="v-dup" ${sch.noDuplicates ? "checked" : ""}> ${V.noDup}</label>
    <label>${V.minRows}</label><input type="number" min="1" class="num-in" id="v-min" value="${sch.minRows}" style="width:90px">
    <button class="btn text sm" id="v-reset">${V.reset}</button></div>`;
  // resultado
  if (res.ok) h += `<div class="verdict good"><b>${V.ok}</b><span>${V.okP(res.n)}</span></div>`;
  else {
    h += `<div class="verdict bad"><b>${V.bad(res.fails.length, res.badRows.size)}</b><span>${V.badP}</span></div>
      <div class="tablebox" style="max-height:320px"><table class="data"><tr><th>${t("colName")}</th><th>${V.check}</th><th>${V.nFail}</th><th>${V.rowsCol}</th><th>${V.examples}</th></tr>
      ${res.fails.map(f => `<tr><td><b>${E(f.col)}</b></td><td>${E(V.checks[f.check])} <code>${f.check}</code></td><td>${f.rows.length || "–"}</td><td class="mono">${f.rows.slice(0, 8).map(r => r + 1).join(", ")}${f.rows.length > 8 ? "…" : ""}</td><td class="mono">${f.examples.map(v => E(typeof v === "number" ? fmt(v) : String(v))).join(", ")}</td></tr>`).join("")}</table></div>
      <div class="actions"><button class="btn primary" id="v-drop">${V.drop(res.badRows.size)}</button><button class="btn outline" id="v-nan">${V.toNan}</button></div><p class="help">${V.actionsHelp}</p>`;
  }
  const base = ds.key === "custom" ? (ds.csvName || "datos") : ds.key, code = Validate.pandera(sch, ds, S.lang, base + ".csv");
  h += `<details class="adv" style="margin-top:16px"><summary>${V.codeTitle}</summary><p class="help">${V.codeHelp}</p><pre class="code">${E(code)}</pre>
    <div class="actions"><button class="btn primary sm" id="v-dl">${t("download")} validar_${E(base)}.py</button><button class="btn outline sm" id="v-csv">${t("download")} ${E(base)}.csv</button><span class="err" id="v-msg"></span></div></details>`;
  el.innerHTML = h;
  // edición del esquema
  el.querySelectorAll("[data-c]").forEach(inp => inp.onchange = () => {
    const j = +inp.dataset.c, c = j < 0 ? sch.target : sch.columns[j], f = inp.dataset.f;
    if (f === "nullable" || f === "unique") c[f] = inp.checked;
    else if (f === "isin") c.isin = inp.value.split(",").map(x => x.trim()).filter(Boolean);
    else c[f] = inp.value === "" ? null : +inp.value;
    pValid(el); });
  $("#v-dup").onchange = e => { sch.noDuplicates = e.target.checked; pValid(el); };
  $("#v-min").onchange = e => { sch.minRows = Math.max(1, +e.target.value || 1); pValid(el); };
  $("#v-reset").onclick = () => { delete S.schemas[ds.key + "|" + ds.features.map(f => f.key).join(",")]; pValid(el); };
  bindSel(el, "dirty", v => { S.dirty = v; rawCache = { key: null }; changed(); renderData(); pValid(el); });
  const msg = r => { const m = $("#v-msg"); if (m) m.textContent = r === "saved" ? "" : r === "declined" ? t("dlDeclined") : t("dlErr"); };
  $("#v-dl").onclick = async () => msg(await Exporter.save(`validar_${base}.py`, code));
  $("#v-csv").onclick = async () => { const sp = plannedSplit(); msg(await Exporter.save(base + ".csv", Exporter.csv({ ds, rows: rawRows(), split: sp, lang: S.lang }))); };
  if (!res.ok) {
    const rebuild = (X, y, note) => { const sc = S.schemas, keep = { model: S.model, params: S.params, fsel: S.fsel };
      setDataset(Object.assign({}, ds, { X, y, own: true, n0: undefined, added: 0, badType: undefined, cleaned: note }));
      S.schemas = sc; Object.assign(S, keep); S.step = 2; renderAll(); };
    $("#v-drop").onclick = () => { const raw = rawRows(), idx = raw.map((_, i) => i).filter(i => !res.badRows.has(i));
      rebuild(idx.map(i => raw[i].slice()), idx.map(i => ds.y[i]), V.droppedNote(res.badRows.size)); };
    $("#v-nan").onclick = () => { const raw = rawRows().map(r => r.slice()); let n = 0;
      res.fails.forEach(f => { if (!["dtype", "ge", "le", "isin"].includes(f.check)) return; const j = sch.columns.findIndex(c => c.key === f.col); if (j < 0) return;
        sch.columns[j].nullable = true; f.rows.forEach(r => { if (!isMiss(raw[r][j])) { raw[r][j] = null; n++; } }); });
      rebuild(raw, ds.y.slice(), V.nanNote(n)); };
  }
}

/* ================================ PROYECTO ================================== */

/* ================================ GLOSARIO ================================= */
function openGlossary(cat) {
  const G = GLOSSARY[S.lang];
  const draw = q => {
    q = (q || "").toLowerCase();
    const items = G.items.filter(it => !q || (it.t + " " + it.d + " " + (it.f || "") + " " + (it.i || "")).toLowerCase().includes(q));
    return Object.keys(G.cats).map(c => { const list = items.filter(it => it.c === c); if (!list.length) return "";
      return `<section class="g-cat" id="g-${c}"><h3>${G.cats[c]}</h3>${list.map(it => `<article class="g-item"><h5>${E(it.t)}</h5><p>${E(it.d)}</p>${it.f ? `<div class="g-eq"><span>${G.labels.eq}</span><div class="g-math">${(window.GLOSSARY_MATH || {})[it.f] || `<code>${E(it.f)}</code>`}</div></div>` : ""}${it.i ? `<p class="g-int"><span>${G.labels.interp}:</span> ${E(it.i)}</p>` : ""}</article>`).join("")}</section>`; }).join("") || `<p class="placeholder">—</p>`;
  };
  openModal(`<div class="modal-h"><h2>${t("glossary")}</h2><button class="btn text" id="mclose">${t("close")}</button></div>
    <input type="search" id="gq" class="search" placeholder="${t("glossarySearch")}">
    <nav class="g-nav">${Object.entries(G.cats).map(([k, v]) => `<button data-gc="${k}">${v}</button>`).join("")}</nav><div id="g-body">${draw("")}</div>`, true);
  $("#mclose").onclick = closeModal;
  $("#gq").oninput = e => $("#g-body").innerHTML = draw(e.target.value);
  document.querySelectorAll("[data-gc]").forEach(b => b.onclick = () => { $("#gq").value = ""; $("#g-body").innerHTML = draw(""); document.getElementById("g-" + b.dataset.gc)?.scrollIntoView({ behavior: "smooth", block: "start" }); });
  if (cat) setTimeout(() => document.getElementById("g-" + cat)?.scrollIntoView({ block: "start" }), 50);
}

/* ================================ EXPORTAR ================================= */
function exportCtx() {
  const R = S.run, ds = S.ds, base = ds.key === "custom" ? (ds.csvName || "datos") : ds.key;
  const example = {}; R.cfg.fsel.forEach((j, i) => example[ds.features[j].key] = typeof S.play[i] === "number" ? +S.play[i].toFixed(4) : S.play[i]);
  const split = { train: R.sets.train.idx, val: R.sets.val ? R.sets.val.idx : [], test: R.sets.test.idx };
  return { ds, cfg: R.cfg, lang: S.lang, rows: rawRows(), split, csvName: base + ".csv", pklName: "modelo_" + base + ".pkl", example };
}
let pklCache = { run: null, bytes: null, info: null };
async function renderExport() {
  const L = $("#s5-left"), Rt = $("#s5-right");
  if (!S.ds) { noData(L); Rt.innerHTML = ""; return; }
  if (!S.run) { L.innerHTML = `<p class="placeholder">${t("needTrain")}</p><div class="actions" style="justify-content:center"><button class="btn primary" id="go3b">${t("goTrain")}</button></div>`; $("#go3b").onclick = () => goStep(3); Rt.innerHTML = `<p class="placeholder">${t("exEmpty")}</p>`; return; }
  const ctx = exportCtx(), X = t("exp"), R = S.run;
  if (pklCache.run !== S.run) pklCache = { run: S.run, bytes: null, info: null };
  L.innerHTML = `<div class="exp-model"><span>${t("hModel")}</span><b>${E(t("models")[R.cfg.model][0])}</b><small>${E(S.ds.name[S.lang])} · ${R.sets.val ? `${t("valS")} ${scoreFmt(R.sets.val.score)} · ` : ""}${t("testS")} ${scoreFmt(R.sets.test.score)}</small>${S.stale ? `<p class="stale show" style="margin:8px 0 0">${t("stale")}</p>` : ""}</div>
    <h4>${X.pklWhat}</h4><p class="help">${X.pklWhatP}</p>`;
  Rt.innerHTML = `<h4>${t("exPkl")}</h4><p class="help">${t("exPklTip")}</p><div class="actions" style="margin:0 0 10px"><button class="btn primary" id="pkl-go">${pklCache.bytes ? t("download") + " " + E(ctx.pklName) : t("exPklGo")}</button></div><span class="err" id="dl-msg"></span><div id="pkl-status">${pklCache.info || ""}</div><h4>${t("exPklUse")}</h4><pre class="code">${E(Exporter.usage(ctx))}</pre>`;
  const report = r => { const m = $("#dl-msg"); if (m) m.textContent = r === "saved" ? "" : r === "declined" ? t("dlDeclined") : t("dlErr"); };
  const go = $("#pkl-go"); if (go) go.onclick = async () => {
    if (pklCache.bytes) { report(await Exporter.save(ctx.pklName, pklCache.bytes)); return; }
    const st = $("#pkl-status"); go.disabled = true;
    st.innerHTML = `<p class="help">${t("exPklLoading")}</p><div class="prog"><i style="width:15%"></i></div>${factsHTML("facts-pkl")}`; startFacts("facts-pkl");
    try {
      const r = await Exporter.pkl(ctx, f => { const i = st.querySelector(".prog i"); if (i) i.style.width = Math.round(f * 100) + "%"; if (f >= 0.9) { const p = st.querySelector("p.help"); if (p) p.textContent = t("exPklTraining"); } });
      stopFacts("facts-pkl");
      pklCache.bytes = r.bytes; pklCache.info = `<p class="note good">${t("exPklDone")(isCls() ? pct(r.score) : "R² = " + fmt(r.score, 3))}</p><p class="help">${t("exPklVersion")(r.version)}</p>`;
      renderExport();
    } catch (e) { console.error(e); stopFacts("facts-pkl"); go.disabled = false; st.innerHTML = `<p class="err">${t("exPklErr")} ${E(String(e.message || e).split("\n").filter(Boolean).pop())}</p>`; }
  };
}

/* ---------------------------------- modal ---------------------------------- */
function openModal(html, wide) { const m = $("#modal"); m.querySelector(".modal-card").innerHTML = html; m.querySelector(".modal-card").classList.toggle("wide", !!wide); m.hidden = false; }
function closeModal() { $("#modal").hidden = true; stopFacts("facts-pkl"); }
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#modal").hidden) closeModal(); });

/* ---------------------------------- inicio --------------------------------- */
document.querySelectorAll(".lang button").forEach(b => b.onclick = () => { S.lang = b.dataset.lang; try { localStorage.setItem("ml-lab-lang", S.lang); } catch (e) {} applyLang(); });
$("#export-btn").onclick = () => goStep(5);
$("#gloss-btn").onclick = () => openGlossary();

/* ------------------------- recorrido guiado (primera visita) ------------------------- */
let tourI = -1;
function tourSteps() { return [["#data-body .ds-list", 1], ['#stepper [data-go="3"]', 1], ['#stepper [data-go="4"]', 1], ["#gloss-btn", 1]]; }
function tourShow() {
  const T = t("tour"), st = tourSteps(); let b = $("#tour"); if (tourI < 0 || tourI >= st.length) { if (b) b.remove(); document.querySelectorAll(".tour-hl").forEach(e => e.classList.remove("tour-hl")); return; }
  if (S.step !== 1) goStep(1);
  const tg = document.querySelector(st[tourI][0]); if (!tg) { tourI = -1; return tourShow(); }
  document.querySelectorAll(".tour-hl").forEach(e => e.classList.remove("tour-hl")); tg.classList.add("tour-hl");
  if (!b) { b = document.createElement("div"); b.id = "tour"; b.className = "tour"; document.body.appendChild(b); }
  b.innerHTML = `<div class="tour-n">${tourI + 1} / ${st.length}</div><b>${T.items[tourI][0]}</b><p>${T.items[tourI][1]}</p><div class="actions"><button class="btn text sm" id="tour-skip">${T.skip}</button><button class="btn primary sm" id="tour-next">${tourI === st.length - 1 ? T.done : T.next}</button></div>`;
  const r = tg.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 24);
  b.style.width = w + "px"; b.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + window.scrollX)) + "px"; b.style.top = (r.bottom + window.scrollY + 12) + "px";
  tg.scrollIntoView({ behavior: "smooth", block: "nearest" });
  $("#tour-next").onclick = () => { tourI++; tourShow(); }; $("#tour-skip").onclick = () => { tourI = -1; tourShow(); };
}
function tourStart() { tourI = 0; tourShow(); }
window.addEventListener("resize", () => { if (tourI >= 0) tourShow(); });
function boot() {
  if (window.libsvm) Promise.resolve(window.libsvm).then(L => ML.setLibsvm(L)).catch(e => console.error(e));
  Exporter.downloadsApi();
  applyLang();
  $("#tour-btn").onclick = tourStart;
  let seen = false; try { seen = localStorage.getItem("ml-lab-tour") === "1"; localStorage.setItem("ml-lab-tour", "1"); } catch (e) {}
  if (!seen) setTimeout(tourStart, 600);
}
boot();
})();
