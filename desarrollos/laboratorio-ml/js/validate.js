/* =============================================================================
   validate.js — Validación de datasets al estilo Pandera.
   - infer(): propone un esquema a partir de datos limpios (como pandera.infer_schema).
   - run(): revisa todas las reglas y junta todos los errores (como validate(lazy=True)).
   - pandera(): genera el código Python equivalente con la librería Pandera.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Validate = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const isMissing = v => v === null || v === undefined || v === "" || (typeof v === "number" && Number.isNaN(v));
  const niceDown = (v, span) => { if (v >= 0 && v - span * 0.25 <= 0) return 0; const st = Math.pow(10, Math.floor(Math.log10(Math.max(span, 1e-9))) - 1); return Math.floor((v - span * 0.05) / st) * st; };
  const niceUp = (v, span) => { const st = Math.pow(10, Math.floor(Math.log10(Math.max(span, 1e-9))) - 1); return Math.ceil((v + span * 0.05) / st) * st; };
  const round = v => +Number(v).toPrecision(6);

  /* Esquema: { columns: [{ key, type, nullable, min, max, isin, unique }], target: {...}, minRows, noDuplicates } */
  function infer(ds) {
    const columns = ds.features.map((f, j) => {
      const vals = ds.X.map(r => r[j]), present = vals.filter(v => !isMissing(v));
      const c = { key: f.key, type: f.type, nullable: present.length < vals.length, unique: false, min: null, max: null, isin: null };
      if (f.type === "num" && present.length) {
        const lo = Math.min(...present), hi = Math.max(...present), span = (hi - lo) || Math.abs(hi) || 1;
        c.min = round(niceDown(lo, span)); c.max = round(niceUp(hi, span));
      } else if (f.type === "cat") c.isin = [...new Set(present.map(String))].sort();
      return c;
    });
    const target = { key: ds.target.key, type: ds.classes ? "cat" : "num", nullable: false, unique: false, min: null, max: null, isin: null };
    if (ds.classes) target.isin = ds.classes.map(c => c.es);
    else { const lo = Math.min(...ds.y), hi = Math.max(...ds.y), span = (hi - lo) || 1; target.min = round(niceDown(lo, span)); target.max = round(niceUp(hi, span)); }
    return { columns, target, minRows: Math.min(30, ds.y.length), noDuplicates: true };
  }

  /* rows: filas crudas (una entrada por feature), y: target (índices de clase o números)
     extra.badType: { colIndex: [{row, value}] } valores que no eran números en el CSV */
  function run(schema, ds, rows, extra) {
    const fails = [], push = (col, check, idx, vals) => { if (idx.length) fails.push({ col, check, rows: idx, examples: vals.slice(0, 5) }); };
    const yVal = i => ds.classes ? ds.classes[ds.y[i]].es : ds.y[i];
    const cols = schema.columns.map((c, j) => ({ c, get: i => rows[i][j] })).concat([{ c: schema.target, get: yVal, isTarget: true }]);
    const n = rows.length;
    cols.forEach(({ c, get }, j) => {
      const bad = (extra && extra.badType && extra.badType[j]) || [];
      push(c.key, "dtype", bad.map(b => b.row), bad.map(b => b.value));
      const nulls = [], lo = [], hi = [], out = [], seen = new Map(), dup = [];
      for (let i = 0; i < n; i++) {
        const v = get(i);
        if (isMissing(v)) { if (!c.nullable) nulls.push(i); continue; }
        if (c.type === "num") {
          if (c.min !== null && c.min !== "" && v < +c.min) lo.push(i);
          if (c.max !== null && c.max !== "" && v > +c.max) hi.push(i);
        } else if (c.isin && c.isin.length && !c.isin.includes(String(v))) out.push(i);
        if (c.unique) { const k = String(v); if (seen.has(k)) dup.push(i); else seen.set(k, i); }
      }
      push(c.key, "not_null", nulls, nulls.map(() => "NaN"));
      push(c.key, "ge", lo, lo.map(get)); push(c.key, "le", hi, hi.map(get));
      push(c.key, "isin", out, out.map(get)); push(c.key, "unique", dup, dup.map(get));
    });
    if (schema.noDuplicates) {
      const seen = new Set(), dup = [];
      for (let i = 0; i < n; i++) { const k = JSON.stringify(rows[i]) + "|" + yVal(i); if (seen.has(k)) dup.push(i); else seen.add(k); }
      push("DataFrame", "duplicates", dup, dup.map(i => `#${i + 1}`));
    }
    if (n < schema.minRows) fails.push({ col: "DataFrame", check: "min_rows", rows: [], examples: [`${n} < ${schema.minRows}`] });
    const badRows = new Set(); fails.forEach(f => f.rows.forEach(r => badRows.add(r)));
    return { ok: !fails.length, fails, badRows, n };
  }

  /* ----------------------------- código Pandera ----------------------------- */
  const pyStr = s => JSON.stringify(String(s));
  function pandera(schema, ds, lang, csvName) {
    const es = lang === "es", lines = [];
    const colCode = (c, label) => {
      const checks = [];
      if (c.type === "num") { if (c.min !== null && c.min !== "") checks.push(`pa.Check.ge(${+c.min})`); if (c.max !== null && c.max !== "") checks.push(`pa.Check.le(${+c.max})`); }
      else if (c.isin && c.isin.length) checks.push(`pa.Check.isin([${c.isin.map(pyStr).join(", ")}])`);
      const args = [c.type === "num" ? "float" : "str"];
      if (checks.length) args.push(`checks=[${checks.join(", ")}]`);
      args.push(`nullable=${c.nullable ? "True" : "False"}`);
      if (c.unique) args.push("unique=True");
      return `        ${pyStr(c.key)}: pa.Column(${args.join(", ")}),${label ? `  # ${label}` : ""}`;
    };
    const target = Object.assign({}, schema.target, ds.classes ? { isin: ds.classes.map(c => c[lang]) } : {});
    lines.push(`# ${es ? "Validación del dataset con Pandera" : "Dataset validation with Pandera"}`);
    lines.push(`# ${es ? "Requisitos" : "Requirements"}: pip install pandas "pandera>=0.24"`);
    lines.push("import pandas as pd");
    lines.push(`import pandera.pandas as pa   # ${es ? "en versiones anteriores a 0.24: import pandera as pa" : "before 0.24: import pandera as pa"}`);
    lines.push("");
    lines.push("schema = pa.DataFrameSchema(");
    lines.push("    {");
    schema.columns.forEach((c, j) => lines.push(colCode(c, ds.features[j] ? ds.features[j][lang] : "")));
    lines.push(colCode(target, `target (${ds.target[lang]})`));
    lines.push("    },");
    if (schema.noDuplicates) lines.push(`    unique=[${schema.columns.map(c => pyStr(c.key)).concat([pyStr(target.key)]).join(", ")}],  # ${es ? "sin filas duplicadas" : "no duplicate rows"}`);
    lines.push(`    checks=pa.Check(lambda df: len(df) >= ${schema.minRows}, element_wise=False, error="min_rows"),`);
    lines.push("    coerce=True,   # " + (es ? "convierte los tipos (p. ej. texto a número) antes de revisar" : "converts types (e.g. text to number) before checking"));
    lines.push("    strict=False,  # " + (es ? "permite columnas extra (como la de partición)" : "allows extra columns (such as the split column)"));
    lines.push(")");
    lines.push("");
    lines.push(`df = pd.read_csv(${pyStr(csvName)})`);
    lines.push("try:");
    lines.push(`    df = schema.validate(df, lazy=True)  # lazy=True: ${es ? "reúne todos los errores, no solo el primero" : "collects every error, not just the first"}`);
    lines.push(`    print(${pyStr(es ? "El dataset cumple el esquema." : "The dataset passes the schema.")})`);
    lines.push("except pa.errors.SchemaErrors as err:");
    lines.push(`    print(${pyStr(es ? "Errores encontrados:" : "Errors found:")})`);
    lines.push("    print(err.failure_cases[[\"column\", \"check\", \"index\", \"failure_case\"]])");
    return lines.join("\n") + "\n";
  }

  return { infer, run, pandera, isMissing };
});
