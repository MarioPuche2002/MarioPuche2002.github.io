/* =============================================================================
   export.js — Exportar el experimento: script .py, notebook .ipynb, datos .csv
   y modelo .pkl (entrenado con scikit-learn real vía Pyodide, solo bajo demanda).
   ========================================================================== */
window.Exporter = (function () {
  "use strict";
  const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
  const SAFE_EXT = ["txt", "json", "md", "csv", "zip", "html", "svg", "pdf", "png", "xlsx"];

  /* ------------------------ literales de Python ------------------------ */
  const py = v => v === null || v === undefined || v === "none" || v === "all" ? "None" : v === true ? "True" : v === false ? "False" : typeof v === "number" ? String(v) : JSON.stringify(v);

  function estimator(model, task, P, seed, nK) {
    const cls = task === "classification", imp = new Set();
    const cw = cls && P.class_weight === "balanced" ? `, class_weight="balanced"` : "";
    let code;
    switch (model) {
      case "logreg": {
        imp.add("from sklearn.linear_model import LogisticRegression");
        const pen = P.penalty === "none" ? `penalty=None` : P.penalty === "l1" ? `C=${P.C}, penalty="l1", solver="saga"` : `C=${P.C}, penalty="l2"`;
        code = `LogisticRegression(${pen}, max_iter=${Math.max(P.max_iter, 1000)}${cw})`; break; }
      case "linreg": {
        const reg = P.regularization === "ridge" ? `Ridge(alpha=${P.alpha})` : P.regularization === "lasso" ? `Lasso(alpha=${P.alpha}, max_iter=10000)` : "LinearRegression()";
        imp.add(`from sklearn.linear_model import ${reg.split("(")[0]}`);
        if (P.degree > 1) { imp.add("from sklearn.preprocessing import PolynomialFeatures"); imp.add("from sklearn.preprocessing import StandardScaler"); }
        code = P.degree > 1 ? `make_pipeline(PolynomialFeatures(degree=${P.degree}, include_bias=False), StandardScaler(), ${reg})` : reg; break; }
      case "svm": {
        const g = P.kernel !== "linear" ? `, gamma=${py(P.gamma)}` : "", dg = P.kernel === "poly" ? `, degree=${P.degree}` : "";
        if (cls) { imp.add("from sklearn.svm import SVC"); code = `SVC(kernel="${P.kernel}", C=${P.C}${g}${dg}${cw})`; }
        else { imp.add("from sklearn.svm import SVR"); imp.add("from sklearn.compose import TransformedTargetRegressor"); imp.add("from sklearn.preprocessing import StandardScaler");
          code = `TransformedTargetRegressor(regressor=SVR(kernel="${P.kernel}", C=${P.C}${g}${dg}, epsilon=${P.epsilon}),\n        transformer=StandardScaler())`; }
        break; }
      case "tree": {
        const n = cls ? "DecisionTreeClassifier" : "DecisionTreeRegressor"; imp.add(`from sklearn.tree import ${n}`);
        code = `${n}(${cls ? `criterion="${P.criterion}", ` : ""}max_depth=${py(P.max_depth)}, min_samples_split=${P.min_samples_split}, min_samples_leaf=${P.min_samples_leaf}, max_features=${py(P.max_features)}${cw}, random_state=${seed})`; break; }
      case "rf": {
        const n = cls ? "RandomForestClassifier" : "RandomForestRegressor"; imp.add(`from sklearn.ensemble import ${n}`);
        code = `${n}(n_estimators=${P.n_estimators}, ${cls ? `criterion="${P.criterion}", ` : ""}max_depth=${py(P.max_depth)}, min_samples_split=${P.min_samples_split}, min_samples_leaf=${P.min_samples_leaf},\n        max_features=${py(P.max_features)}, bootstrap=${py(P.bootstrap)}${cw}, random_state=${seed})`; break; }
      case "nb": { imp.add("from sklearn.naive_bayes import GaussianNB"); code = P.priors === "balanced" ? `GaussianNB(priors=[1 / ${nK || 2}] * ${nK || 2})` : "GaussianNB()"; break; }
      case "gb": {
        const n = cls ? "GradientBoostingClassifier" : "GradientBoostingRegressor"; imp.add(`from sklearn.ensemble import ${n}`);
        code = `${n}(${cls ? "" : `loss="${P.loss}", `}n_estimators=${P.n_estimators}, learning_rate=${P.learning_rate}, max_depth=${P.max_depth},\n        subsample=${P.subsample}, min_samples_leaf=${P.min_samples_leaf}, max_features=${py(P.max_features)}, random_state=${seed})`; break; }
    }
    return { code, imports: [...imp] };
  }

  const splitLabels = lang => lang === "es" ? { train: "entrenamiento", val: "validacion", test: "prueba" } : { train: "train", val: "validation", test: "test" };
  /* Partes del código compartidas por el script, el notebook y el .pkl */
  function parts(ctx) {
    const { ds, cfg, lang } = ctx, es = lang === "es", cls = ds.task === "classification";
    const cols = cfg.fsel.map(j => ds.features[j]);
    const num = cols.filter(f => f.type === "num").map(f => f.key), cat = cols.filter(f => f.type === "cat").map(f => f.key);
    const est = estimator(cfg.model, ds.task, cfg.params, cfg.seed, ds.classes ? ds.classes.length : 0), sc = cfg.scale || "standard";
    const scalerCode = sc === "standard" ? "StandardScaler()" : sc === "minmax" ? "MinMaxScaler()" : null;
    const imputerCode = cfg.impute.num === "knn" ? `KNNImputer(n_neighbors=${cfg.impute.k})` : `SimpleImputer(strategy="${cfg.impute.num}")`;
    const numImp = scalerCode ? `make_pipeline(${scalerCode}, ${imputerCode})` : imputerCode;
    const prepImp = new Set(est.imports.filter(l => l.startsWith("from sklearn.preprocessing")).flatMap(l => l.replace("from sklearn.preprocessing import ", "").split(", ")));
    if (num.length && sc === "standard") prepImp.add("StandardScaler"); if (num.length && sc === "minmax") prepImp.add("MinMaxScaler"); if (cat.length) prepImp.add("OneHotEncoder");
    const imports = ["import pandas as pd", "from sklearn.pipeline import Pipeline, make_pipeline", "from sklearn.compose import ColumnTransformer",
      `from sklearn.impute import SimpleImputer${cfg.impute.num === "knn" && num.length ? ", KNNImputer" : ""}`,
      ...(prepImp.size ? [`from sklearn.preprocessing import ${[...prepImp].sort().join(", ")}`] : []), ...est.imports.filter(l => !l.startsWith("from sklearn.preprocessing")),
      cls ? "from sklearn.metrics import accuracy_score, classification_report, confusion_matrix" : "from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error, mean_absolute_percentage_error"];
    const splitCol = es ? "particion" : "split", L = splitLabels(lang), hasVal = ctx.split.val && ctx.split.val.length;
    const load = `${es ? "# 1) Cargar la tabla" : "# 1) Load the table"}
df = pd.read_csv(${ctx.csvExpr || JSON.stringify(ctx.csvName)})
num_cols = ${JSON.stringify(num)}
cat_cols = ${JSON.stringify(cat)}
X = df[num_cols + cat_cols]
y = df[${JSON.stringify(ds.target.key)}]

${es ? "# 2) Misma partición entrenamiento / validación / prueba que en la página" : "# 2) Same train / validation / test split as in the page"}
part = df["${splitCol}"]
X_train, y_train = X[part == "${L.train}"], y[part == "${L.train}"]
${hasVal ? `X_val, y_val = X[part == "${L.val}"], y[part == "${L.val}"]
` : ""}X_test, y_test = X[part == "${L.test}"], y[part == "${L.test}"]`;
    const trs = [];
    if (num.length) trs.push(`    ("num", ${numImp}, num_cols)`);
    if (cat.length) trs.push(`    ("cat", make_pipeline(SimpleImputer(strategy="most_frequent"), OneHotEncoder(handle_unknown="ignore")), cat_cols)`);
    const build = `${es ? "# 3) Preprocesamiento y modelo" : "# 3) Preprocessing and model"}
${es ? "#    El Pipeline ajusta escalado, imputación y one-hot SOLO con entrenamiento (evita data leakage)" : "#    The Pipeline fits scaling, imputation and one-hot on the training set ONLY (avoids data leakage)"}
preprocess = ColumnTransformer([
${trs.join(",\n")}
])
model = Pipeline([
    ("prep", preprocess),
    ("model", ${est.code}),
])`;
    const fit = `${es ? "# 4) Entrenar" : "# 4) Train"}
model.fit(X_train, y_train)`;
    const sets = (hasVal ? [["val", "X_val", "y_val"]] : []).concat([["test", "X_test", "y_test"]]);
    const evalc = `${es ? "# 5) Evaluación" : "# 5) Evaluation"}\n` + sets.map(([k, Xn, yn]) => cls
      ? `pred = model.predict(${Xn})\nprint("${es ? (k === "val" ? "Validación" : "Prueba") : (k === "val" ? "Validation" : "Test")} - accuracy:", round(accuracy_score(${yn}, pred), 3))\nprint(confusion_matrix(${yn}, pred))\nprint(classification_report(${yn}, pred))`
      : `pred = model.predict(${Xn})\nprint("${es ? (k === "val" ? "Validación" : "Prueba") : (k === "val" ? "Validation" : "Test")}")\nprint("  R2  :", round(r2_score(${yn}, pred), 3))\nprint("  MAE :", round(mean_absolute_error(${yn}, pred), 3))\nprint("  MSE :", round(mean_squared_error(${yn}, pred), 3))\nprint("  MAPE:", round(mean_absolute_percentage_error(${yn}, pred), 3))`).join("\n\n");
    const save = `${es ? "# 6) Guardar el modelo entrenado" : "# 6) Save the trained model"}
import pickle
with open("${ctx.pklName}", "wb") as f:
    pickle.dump(model, f)`;
    return { imports: imports.join("\n"), load, build, fit, evalc, save, num, cat };
  }

  function script(ctx) {
    const p = parts(ctx), es = ctx.lang === "es", M = TXT[ctx.lang].models[ctx.cfg.model][0];
    return `# ${TXT[ctx.lang].title} — ${es ? "experimento exportado" : "exported experiment"}
# ${es ? "Datos" : "Data"}: ${ctx.ds.name[ctx.lang]} · ${es ? "Modelo" : "Model"}: ${M}
# ${es ? "Requisitos" : "Requirements"}: pip install pandas scikit-learn

${p.imports}

${p.load}

${p.build}

${p.fit}

${p.evalc}

${p.save}
`;
  }

  function notebook(ctx) {
    const p = parts(ctx), es = ctx.lang === "es", T = TXT[ctx.lang];
    const md = s => ({ cell_type: "markdown", metadata: {}, source: s.split("\n").map((l, i, a) => i < a.length - 1 ? l + "\n" : l) });
    const code = s => ({ cell_type: "code", metadata: {}, execution_count: null, outputs: [], source: s.split("\n").map((l, i, a) => i < a.length - 1 ? l + "\n" : l) });
    const cells = [
      md(`# ${T.title}\n**${es ? "Datos" : "Data"}:** ${ctx.ds.name[ctx.lang]}  \n**${es ? "Modelo" : "Model"}:** ${T.models[ctx.cfg.model][0]}\n\n${es ? "Sube el archivo" : "Upload the file"} \`${ctx.csvName}\` ${es ? "junto a este notebook (en Colab: icono de carpeta → subir)." : "next to this notebook (in Colab: folder icon → upload)."}`),
      code(p.imports), md(es ? "## 1. Carga del dataset y partición train / validación / test" : "## 1. Load the dataset and train / validation / test split"), code(p.load),
      md(es ? "## 2. Preprocesamiento y modelo\nEl `Pipeline` ajusta el escalado, la imputación y el one-hot encoding solo con el conjunto de entrenamiento (evita *data leakage*)." : "## 2. Preprocessing and model\nThe `Pipeline` fits scaling, imputation and one-hot encoding on the training set only (avoids *data leakage*)."),
      code(p.build), md(es ? "## 3. Entrenar" : "## 3. Train"), code(p.fit), md(es ? "## 4. Evaluación en validación y prueba" : "## 4. Evaluation on validation and test"), code(p.evalc),
      md(es ? "## 5. Guardar el modelo" : "## 5. Save the model"), code(p.save)
    ];
    return JSON.stringify({ cells, metadata: { kernelspec: { display_name: "Python 3", language: "python", name: "python3" }, language_info: { name: "python" } }, nbformat: 4, nbformat_minor: 5 }, null, 1);
  }

  function csv(ctx) {
    const { ds, rows, split, lang } = ctx, es = lang === "es", L = splitLabels(lang), lab = new Array(rows.length);
    ["train", "val", "test"].forEach(k => (split[k] || []).forEach(i => lab[i] = L[k]));
    const q = v => { if (v === null || v === undefined || (typeof v === "number" && isNaN(v))) return ""; const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const head = [...ds.features.map(f => f.key), ds.target.key, es ? "particion" : "split"];
    const lines = [head.map(q).join(",")];
    rows.forEach((r, i) => { const t = ds.classes ? ds.classes[ds.y[i]][lang] : ds.y[i];
      lines.push([...r.map(q), q(t), lab[i]].join(",")); });
    return lines.join("\n") + "\n";
  }

  function usage(ctx) {
    const es = ctx.lang === "es", cols = ctx.cfg.fsel.map(j => ctx.ds.features[j]);
    const ex = cols.map(f => `${JSON.stringify(f.key)}: [${f.type === "cat" ? JSON.stringify(ctx.example[f.key]) : ctx.example[f.key]}]`).join(", ");
    return `import pickle
import pandas as pd

with open("${ctx.pklName}", "rb") as f:
    model = pickle.load(f)

${es ? "nuevo" : "new"} = pd.DataFrame({${ex}})
print(model.predict(${es ? "nuevo" : "new"}))`;
  }

  /* ------------------------------ .pkl --------------------------------- */
  let pyodideP = null;
  function loadScript(src) { return new Promise((ok, bad) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => bad(new Error("No se pudo cargar " + src)); document.head.appendChild(s); }); }
  function getPyodide(onStep) {
    if (!pyodideP) pyodideP = (async () => {
      if (!window.loadPyodide) await loadScript(PYODIDE + "pyodide.js");
      const pyo = await window.loadPyodide({ indexURL: PYODIDE });
      onStep && onStep(0.5);
      await pyo.loadPackage(["numpy", "pandas", "scikit-learn"]);
      return pyo;
    })().catch(e => { pyodideP = null; throw e; });
    return pyodideP;
  }
  async function pkl(ctx, onStep) {
    const pyo = await getPyodide(onStep);
    onStep && onStep(0.9);
    const p = parts(Object.assign({}, ctx, { csvExpr: "io.StringIO(CSV_TEXT)" }));
    pyo.globals.set("CSV_TEXT", csv(ctx));
    const cls = ctx.ds.task === "classification";
    const code = `import io, pickle, sklearn
${p.imports}
${p.load}
${p.build}
${p.fit}
_pred = model.predict(X_test)
${cls ? "_score = accuracy_score(y_test, _pred)" : "_score = r2_score(y_test, _pred)"}
_PKL = pickle.dumps(model)
(_PKL, float(_score), sklearn.__version__)`;
    const res = await pyo.runPythonAsync(code);
    const [bytesProxy, score, version] = res.toJs({ depth: 1 });
    const bytes = bytesProxy.toJs ? bytesProxy.toJs() : bytesProxy;
    res.destroy && res.destroy();
    return { bytes: new Uint8Array(bytes), score, version };
  }

  /* ------------------------------ ZIP ---------------------------------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) { // [{name, data: string|Uint8Array}] → Uint8Array (sin compresión)
    const enc = new TextEncoder(), chunks = [], central = []; let off = 0;
    for (const f of files) {
      const name = enc.encode(f.name), data = typeof f.data === "string" ? enc.encode(f.data) : f.data, crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      chunks.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
      c.setUint32(42, off, true); central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    }
    const csize = central.reduce((s, b) => s + b.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    const all = [...chunks, ...central, new Uint8Array(e.buffer)], out = new Uint8Array(all.reduce((s, b) => s + b.length, 0)); let p = 0;
    for (const b of all) { out.set(b, p); p += b.length; } return out;
  }

  /* --------------------------- descargas ------------------------------- */
  let dlP = null;
  function downloadsApi() {
    if (!dlP) dlP = (window.claude && typeof window.claude.use === "function") ? window.claude.use("downloads").catch(() => null) : Promise.resolve(null);
    return dlP;
  }
  async function save(name, data) {
    const api = await downloadsApi();
    if (api) {
      const ext = name.split(".").pop().toLowerCase();
      if (!SAFE_EXT.includes(ext)) { data = zip([{ name, data }]); name = name + ".zip"; }
      try { await api.save({ filename: name, data: typeof data === "string" ? data : new Blob([data]) }); return "saved"; }
      catch (e) { return (e && e.code) || "unavailable"; }
    }
    const blob = data instanceof Blob ? data : new Blob([data], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "saved";
  }
  const inClaude = async () => !!(await downloadsApi());

  return { script, notebook, csv, usage, pkl, zip, save, inClaude, downloadsApi, getPyodide };
})();
