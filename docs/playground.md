---
hide:
  - navigation
  - toc
---

# Playground

Type a Chacana tensor expression and see it validated in real time.

## TL;DR

Use the playground when you want to try Chacana in the browser without installing the Python package.

What you can do here:
- type or paste an expression and see syntax highlighting immediately
- inspect validation feedback and the syntax tree
- preview browser-only LaTeX import/export from the TypeScript checker bundle
- experiment with a lightweight TOML context editor

The playground also includes browser-only LaTeX import/export powered by the TypeScript checker bundle. For implementation details and current availability, see [Browser LaTeX Transpiler](api/latex.md).

<style>
/* Layout */
.playground-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
}
@media (max-width: 768px) {
  .playground-grid { grid-template-columns: 1fr; }
}
.pg-panel { display: flex; flex-direction: column; }
.pg-label {
  font-weight: 600;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.85;
}

/* Expression input */
#expr-input {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 1.05rem;
  padding: 0.75rem 1rem;
  border: 2px solid var(--md-default-fg-color--lightest);
  border-radius: 0.4rem;
  background: var(--md-code-bg-color);
  color: var(--md-code-fg-color);
  resize: vertical;
  outline: none;
  min-height: 3rem;
  transition: border-color 0.15s;
}
#expr-input:focus { border-color: var(--md-accent-fg-color); }
#load-status { font-size: 0.8rem; opacity: 0.6; margin-top: 0.3rem; }
#load-status.loaded { opacity: 0; transition: opacity 0.6s ease 1.5s; }

/* Highlighted expression */
#hl-output {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 1.15rem;
  line-height: 1.7;
  padding: 1rem 1.25rem;
  border: 2px solid var(--md-default-fg-color--lightest);
  border-radius: 0.4rem;
  background: var(--md-code-bg-color);
  color: var(--md-code-fg-color);
  min-height: 3rem;
  white-space: pre-wrap;
  word-break: break-word;
}
.hl-tensor   { color: #7c3aed; font-weight: 600; }
.hl-index    { color: #0891b2; }
.hl-op       { color: #dc2626; font-weight: 600; }
.hl-opkw     { color: #2563eb; font-weight: 600; }
.hl-variance { color: #d97706; font-weight: 600; }
.hl-number   { color: #059669; font-weight: 600; }
.hl-deriv    { color: #ea580c; font-weight: 700; font-style: italic; }
.hl-punct    { opacity: 0.45; }
.hl-error    { color: #dc2626; background: #dc262615;
  text-decoration: wavy underline #dc2626; text-underline-offset: 0.2em; }
[data-md-color-scheme="slate"] .hl-tensor   { color: #a78bfa; }
[data-md-color-scheme="slate"] .hl-index    { color: #22d3ee; }
[data-md-color-scheme="slate"] .hl-op       { color: #f87171; }
[data-md-color-scheme="slate"] .hl-opkw     { color: #60a5fa; }
[data-md-color-scheme="slate"] .hl-variance { color: #fbbf24; }
[data-md-color-scheme="slate"] .hl-number   { color: #34d399; }
[data-md-color-scheme="slate"] .hl-deriv    { color: #fb923c; }

/* Diagnostics */
#diagnostics-output {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 0.85rem;
  line-height: 1.5;
  padding: 0.6rem 1rem;
  border-radius: 0.4rem;
  margin-top: 0.5rem;
  min-height: 1.8rem;
}
.diag-ok  { background: #065f4620; border: 1px solid #065f46; color: #059669; }
.diag-err { background: #7f1d1d20; border: 1px solid #991b1b; color: #dc2626; }
[data-md-color-scheme="slate"] .diag-ok  { background: #06553820; border-color: #059669; color: #34d399; }
[data-md-color-scheme="slate"] .diag-err { background: #450a0a20; border-color: #dc2626; color: #f87171; }

/* Example chips */
.example-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.75rem; }
.example-chip {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 0.78rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: 1rem;
  background: transparent;
  color: var(--md-default-fg-color);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.example-chip:hover, .example-chip:focus-visible {
  border-color: var(--md-accent-fg-color);
  color: var(--md-accent-fg-color);
  outline: none;
}

/* Context editor */
.ctx-section {
  margin-top: 0.75rem;
  border: 2px solid var(--md-default-fg-color--lightest);
  border-radius: 0.4rem;
  padding: 0.5rem 0.75rem;
  transition: border-color 0.15s;
}
.ctx-section[open] { border-color: var(--md-accent-fg-color); }
.ctx-section summary {
  font-size: 0.85rem; cursor: pointer; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--md-default-fg-color); opacity: 0.85;
}
.ctx-manifold {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.85rem; margin: 0.5rem 0;
  color: var(--md-default-fg-color); opacity: 0.85;
}
.ctx-manifold input {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 0.85rem;
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: 0.25rem; padding: 0.15rem 0.35rem;
  background: var(--md-code-bg-color); color: var(--md-code-fg-color);
  text-align: center; width: 3rem;
}
.ctx-manifold input[type="number"] { width: 3.5rem; }
.ctx-tensor-row {
  display: flex; align-items: center; gap: 0.2rem;
  margin-bottom: 0.3rem; padding: 0.2rem 0;
}
.ctx-name {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 0.9rem; font-weight: 600;
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: 0.25rem; padding: 0.2rem 0.35rem;
  background: var(--md-code-bg-color);
  color: #7c3aed; width: 3.5rem; text-align: center;
}
[data-md-color-scheme="slate"] .ctx-name { color: #a78bfa; }
.idx-toggle {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 0.85rem; font-weight: 700;
  width: 1.5rem; height: 1.5rem;
  border: 1px solid; border-radius: 0.2rem;
  cursor: pointer; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  transition: all 0.1s;
}
.idx-toggle.contra {
  color: #d97706; border-color: #d9770640; background: #d9770610;
}
.idx-toggle.covar {
  color: #0891b2; border-color: #0891b240; background: #0891b210;
}
[data-md-color-scheme="slate"] .idx-toggle.contra {
  color: #fbbf24; border-color: #fbbf2440; background: #fbbf2410;
}
[data-md-color-scheme="slate"] .idx-toggle.covar {
  color: #22d3ee; border-color: #22d3ee40; background: #22d3ee10;
}
.ctx-btn {
  font-size: 0.78rem; width: 1.3rem; height: 1.3rem;
  border: 1px dashed var(--md-default-fg-color--lightest);
  border-radius: 0.2rem; background: transparent;
  cursor: pointer; color: var(--md-default-fg-color--light);
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0; margin-left: 0.1rem;
}
.ctx-btn:hover { border-color: var(--md-accent-fg-color); color: var(--md-accent-fg-color); }
.ctx-add-row {
  font-size: 0.8rem; margin-top: 0.25rem;
  padding: 0.2rem 0.6rem;
  border: 1px dashed var(--md-default-fg-color--lightest);
  border-radius: 0.25rem; background: transparent;
  cursor: pointer; color: var(--md-default-fg-color--light);
}
.ctx-add-row:hover { border-color: var(--md-accent-fg-color); color: var(--md-accent-fg-color); }
.ctx-actions { display: flex; gap: 0.4rem; margin-top: 0.25rem; }
.ctx-add-row.copied { border-color: #059669; color: #059669; }

/* LaTeX preview */
#latex-output {
  font-size: 1.3rem;
  padding: 1rem 1.25rem;
  border: 2px solid var(--md-default-fg-color--lightest);
  border-radius: 0.4rem;
  background: var(--md-code-bg-color);
  min-height: 3rem;
  display: flex;
  align-items: center;
}
.latex-import-section {
  margin-top: 0.75rem;
  border: 2px solid var(--md-default-fg-color--lightest);
  border-radius: 0.4rem;
  padding: 0.5rem 0.75rem;
  transition: border-color 0.15s;
}
.latex-import-section[open] { border-color: var(--md-accent-fg-color); }
.latex-import-section summary {
  font-size: 0.85rem; cursor: pointer; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--md-default-fg-color); opacity: 0.85;
}
#latex-import-input {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 0.9rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: 0.25rem;
  background: var(--md-code-bg-color);
  color: var(--md-code-fg-color);
  width: 100%;
  margin-top: 0.4rem;
  box-sizing: border-box;
}
#latex-import-btn {
  font-size: 0.8rem;
  margin-top: 0.3rem;
  padding: 0.25rem 0.7rem;
  border: 1px solid var(--md-accent-fg-color);
  border-radius: 0.25rem;
  background: transparent;
  color: var(--md-accent-fg-color);
  cursor: pointer;
}
#latex-import-btn:hover { background: var(--md-accent-fg-color); color: #fff; }
#latex-import-error {
  font-size: 0.8rem;
  color: #dc2626;
  margin-top: 0.25rem;
}
[data-md-color-scheme="slate"] #latex-import-error { color: #f87171; }

/* Collapsible tree */
.tree-section {
  margin-top: 0.75rem;
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: 0.4rem; padding: 0.4rem 0.6rem;
}
.tree-section summary {
  font-size: 0.78rem; cursor: pointer; opacity: 0.6;
  text-transform: uppercase; letter-spacing: 0.05em;
}
#tree-output {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 0.75rem; line-height: 1.4;
  padding: 0.5rem; max-height: 20rem; overflow: auto;
  white-space: pre; tab-size: 2;
}
.node-type  { color: #7c3aed; }
.field-name { color: #0891b2; }
.anon-token { color: #059669; }
.node-error { color: #dc2626; font-weight: 700; }
[data-md-color-scheme="slate"] .node-type  { color: #a78bfa; }
[data-md-color-scheme="slate"] .field-name { color: #22d3ee; }
[data-md-color-scheme="slate"] .anon-token { color: #34d399; }
</style>

<div class="playground-grid">
  <div class="pg-panel">
    <label class="pg-label" for="expr-input">Expression</label>
    <textarea id="expr-input" spellcheck="false" autocomplete="off"
      aria-describedby="diagnostics-output load-status"
    >R{^a _b _c _d} * g{^b ^d} + T{^a _c}</textarea>
    <div id="load-status" role="status" aria-live="polite">Loading parser&hellip;</div>
    <div class="example-chips">
      <button class="example-chip" data-expr="R{^a _b _c _d}">Riemann</button>
      <button class="example-chip" data-expr="d(omega){_a _b}">Exterior deriv.</button>
      <button class="example-chip" data-expr="L(X, g{_a _b})">Lie derivative</button>
      <button class="example-chip" data-expr="T{_( a b _)}" data-ctx="[]">Symmetrization</button>
      <button class="example-chip" data-expr="@2(g{_a _b})">Perturbation</button>
      <button class="example-chip" data-expr="[A, B]">Commutator</button>
      <button class="example-chip" data-expr="R{^a _b _c _d} + R{^a _c _d _b} + R{^a _d _b _c}">Bianchi</button>
      <button class="example-chip" data-expr="R * R - 4 * R{_a _b} * R{^a ^b} + R{_a _b _c _d} * R{^a ^b ^c ^d}" data-ctx="[]">Gauss-Bonnet</button>
      <button class="example-chip" data-expr="Tr(T{^a _b})">Trace</button>
      <button class="example-chip" data-expr="det(g)">Determinant</button>
      <button class="example-chip" data-expr="star(F)" data-ctx="[]">Hodge star</button>
      <button class="example-chip" data-expr="R{^a _b _c _d ;e}">Cov. deriv.</button>
    </div>
    <details class="ctx-section" id="ctx-details">
      <summary>Context (optional)</summary>
      <div class="ctx-manifold">
        <span>Manifold</span>
        <input id="ctx-mfld-name" value="M" maxlength="4" aria-label="Manifold name">
        <span>dim</span>
        <input id="ctx-mfld-dim" value="4" type="number" min="1" max="99" aria-label="Dimension">
      </div>
      <div id="ctx-tensors"></div>
      <div class="ctx-actions">
        <button class="ctx-add-row" id="ctx-add-btn" type="button">+ Add tensor</button>
        <button class="ctx-add-row" id="ctx-copy-btn" type="button">Copy TOML</button>
      </div>
    </details>
  </div>
  <div class="pg-panel">
    <div id="hl-output" role="region" aria-label="Highlighted expression" aria-live="polite"></div>
    <div id="diagnostics-output" class="diag-ok" role="status" aria-live="polite"
      aria-label="Validation"></div>
    <details class="tree-section">
      <summary>Syntax Tree</summary>
      <div id="tree-output"></div>
    </details>
    <div class="pg-label" style="margin-top:0.75rem">LaTeX Preview</div>
    <div id="latex-output" aria-label="LaTeX rendered output" aria-live="polite"></div>
    <details class="latex-import-section">
      <summary>Import from LaTeX</summary>
      <input id="latex-import-input" type="text" placeholder="e.g. R_{abc}^{d}" spellcheck="false">
      <button id="latex-import-btn" type="button">Import</button>
      <div id="latex-import-error"></div>
    </details>
  </div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
  integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+"
  crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"
  integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg"
  crossorigin="anonymous"></script>

<script>
var TS_CDN = 'https://cdn.jsdelivr.net/npm/web-tree-sitter@0.24.7/';

function siteRoot() {
  var loc = window.location.href;
  var idx = loc.indexOf('/playground');
  return idx !== -1 ? loc.substring(0, idx) + '/' : '../';
}

var TS_SRI = 'sha384-uYgb55edOAS63pUkgoGB7s1F2xTznuWl7wRUxVsjvf9cyOSw/VXlG5ZJKTpbEuIE';

async function loadTreeSitter() {
  await new Promise(function(ok, fail) {
    var s = document.createElement('script');
    s.src = TS_CDN + 'tree-sitter.js';
    s.integrity = TS_SRI;
    s.crossOrigin = 'anonymous';
    s.onload = ok;
    s.onerror = function() { fail(new Error('Failed to load tree-sitter.js')); };
    document.head.appendChild(s);
  });
  await new Promise(function(r) { setTimeout(r, 50); });
  if (typeof TreeSitter === 'undefined') throw new Error('TreeSitter not found');
  await TreeSitter.init({ locateFile: function(p) { return TS_CDN + p; } });
  var parser = new TreeSitter();
  var lang = await TreeSitter.Language.load(siteRoot() + 'assets/wasm/tree-sitter-chacana.wasm');
  parser.setLanguage(lang);
  return parser;
}

async function loadChecker() {
  await new Promise(function(ok, fail) {
    var s = document.createElement('script');
    s.src = siteRoot() + 'assets/js/chacana-checker.js';
    s.onload = ok;
    s.onerror = function() { fail(new Error('Failed to load checker')); };
    document.head.appendChild(s);
  });
}

(function() {
  // --- State ---
  var ctxState = {
    manifold: { name: 'M', dimension: 4 },
    tensors: [
      { name: 'R', pattern: ['Contra', 'Covar', 'Covar', 'Covar'] },
      { name: 'T', pattern: ['Contra', 'Covar'] },
      { name: 'g', pattern: ['Contra', 'Contra'] }
    ]
  };

  // --- DOM ---
  var exprInput    = document.getElementById('expr-input');
  var hlOutput     = document.getElementById('hl-output');
  var treeOutput   = document.getElementById('tree-output');
  var diagOutput   = document.getElementById('diagnostics-output');
  var loadStatus   = document.getElementById('load-status');
  var ctxTensorsEl = document.getElementById('ctx-tensors');
  var ctxMfldName  = document.getElementById('ctx-mfld-name');
  var ctxMfldDim   = document.getElementById('ctx-mfld-dim');
  var latexOutput  = document.getElementById('latex-output');
  var latexImportInput = document.getElementById('latex-import-input');
  var latexImportBtn   = document.getElementById('latex-import-btn');
  var latexImportError = document.getElementById('latex-import-error');
  var activeParser = null;
  var checkerReady = false;

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ==================== Syntax highlighting ====================

  function classifyLeaf(node) {
    if (node.isMissing) return '';
    var p = node.parent;
    var pt = p ? p.type : '';
    if (node.isNamed) {
      if (node.type === 'identifier') {
        if (pt === 'tensor_expr') return 'hl-tensor';
        if (pt === 'derivative') return 'hl-deriv';
        if (pt === 'index') return 'hl-index';
        return 'hl-tensor';
      }
      if (node.type === 'operator_keyword') return 'hl-opkw';
      if (node.type === 'scalar' || node.type === 'integer') return 'hl-number';
      if (node.type === 'variance_marker') return 'hl-variance';
    }
    if (node.type === 'ERROR') return 'hl-error';
    var t = node.type;
    if (t === '+' || t === '-' || t === '*' || t === '/' || t === '@') return 'hl-op';
    if (t === '^' && pt === 'wedge_expression') return 'hl-op';
    if (t === '^' || t === '_') return 'hl-variance';
    if ((t === ';' || t === ',') && pt === 'derivative') return 'hl-deriv';
    if ('{},()[]'.indexOf(t) !== -1) return 'hl-punct';
    return '';
  }

  function highlightExpr(rootNode, text) {
    var spans = [];
    function collect(node) {
      if (node.type === 'ERROR') {
        spans.push({ s: node.startIndex, e: node.endIndex, c: 'hl-error' });
        return;
      }
      if (node.childCount === 0) {
        spans.push({ s: node.startIndex, e: node.endIndex, c: classifyLeaf(node) });
      } else {
        for (var i = 0; i < node.childCount; i++) collect(node.child(i));
      }
    }
    collect(rootNode);
    var html = '', pos = 0;
    for (var i = 0; i < spans.length; i++) {
      var sp = spans[i];
      if (sp.s > pos) html += esc(text.substring(pos, sp.s));
      if (sp.c) html += '<span class="' + sp.c + '">' + esc(text.substring(sp.s, sp.e)) + '</span>';
      else html += esc(text.substring(sp.s, sp.e));
      pos = sp.e;
    }
    if (pos < text.length) html += esc(text.substring(pos));
    return html;
  }

  // ==================== Tree formatting ====================

  function formatTree(node, indent) {
    indent = indent || 0;
    var pad = '  '.repeat(indent);
    if (node.childCount === 0) {
      if (node.isNamed) return pad + '<span class="node-type">(' + esc(node.type) + ')</span>';
      return pad + '<span class="anon-token">"' + esc(node.type) + '"</span>';
    }
    var parts = [];
    var cls = node.isError ? 'node-error' : 'node-type';
    parts.push(pad + '<span class="' + cls + '">(' + esc(node.type) + '</span>');
    for (var i = 0; i < node.childCount; i++) {
      var child = node.child(i);
      var fn = node.fieldNameForChild(i);
      if (fn) {
        var cs = formatTree(child, 0).replace(/^\s+/, '');
        parts.push(pad + '  <span class="field-name">' + esc(fn) + ':</span> ' + cs);
      } else if (child.isNamed || child.isError) {
        parts.push(formatTree(child, indent + 1));
      }
    }
    parts.push(pad + '<span class="node-type">)</span>');
    return parts.join('\n');
  }

  function hasSyntaxErrors(node) {
    if (node.isMissing || node.type === 'ERROR') return true;
    for (var i = 0; i < node.childCount; i++) {
      if (hasSyntaxErrors(node.child(i))) return true;
    }
    return false;
  }

  // ==================== Context editor ====================

  function buildTOML() {
    var lines = [];
    var m = ctxState.manifold;
    lines.push('[manifold.' + m.name + ']');
    lines.push('dimension = ' + m.dimension);
    lines.push('');
    ctxState.tensors.forEach(function(t) {
      if (!t.name.trim()) return;
      lines.push('[tensor.' + t.name + ']');
      lines.push('manifold = "' + m.name + '"');
      lines.push('rank = ' + t.pattern.length);
      lines.push('index_pattern = [' + t.pattern.map(function(p) {
        return '"' + p + '"';
      }).join(', ') + ']');
      lines.push('');
    });
    return lines.join('\n');
  }

  function renderTensors() {
    ctxTensorsEl.innerHTML = '';
    ctxState.tensors.forEach(function(tensor, ti) {
      var row = document.createElement('div');
      row.className = 'ctx-tensor-row';

      // Name input
      var name = document.createElement('input');
      name.className = 'ctx-name';
      name.value = tensor.name;
      name.maxLength = 8;
      name.setAttribute('aria-label', 'Tensor name');
      name.addEventListener('input', function() {
        tensor.name = this.value;
        update();
      });
      row.appendChild(name);

      // Index variance buttons
      var idxWrap = document.createElement('span');
      idxWrap.style.cssText = 'display:inline-flex;gap:0.15rem;margin-left:0.3rem';
      tensor.pattern.forEach(function(v, vi) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'idx-toggle ' + (v === 'Contra' ? 'contra' : 'covar');
        btn.textContent = v === 'Contra' ? '^' : '_';
        btn.setAttribute('aria-label',
          tensor.name + ' index ' + (vi + 1) + ': click to toggle variance');
        btn.addEventListener('click', function() {
          tensor.pattern[vi] = tensor.pattern[vi] === 'Contra' ? 'Covar' : 'Contra';
          renderTensors();
          update();
        });
        idxWrap.appendChild(btn);
      });
      row.appendChild(idxWrap);

      // + index
      var addIdx = document.createElement('button');
      addIdx.type = 'button';
      addIdx.className = 'ctx-btn';
      addIdx.textContent = '+';
      addIdx.title = 'Add index';
      addIdx.addEventListener('click', function() {
        tensor.pattern.push('Covar');
        renderTensors();
        update();
      });
      row.appendChild(addIdx);

      // − index (if >1)
      if (tensor.pattern.length > 1) {
        var rmIdx = document.createElement('button');
        rmIdx.type = 'button';
        rmIdx.className = 'ctx-btn';
        rmIdx.textContent = '\u2212';
        rmIdx.title = 'Remove last index';
        rmIdx.addEventListener('click', function() {
          tensor.pattern.pop();
          renderTensors();
          update();
        });
        row.appendChild(rmIdx);
      }

      // × remove tensor
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'ctx-btn';
      rm.textContent = '\u00d7';
      rm.title = 'Remove tensor';
      rm.style.marginLeft = '0.4rem';
      rm.addEventListener('click', function() {
        ctxState.tensors.splice(ti, 1);
        renderTensors();
        update();
      });
      row.appendChild(rm);

      ctxTensorsEl.appendChild(row);
    });
  }

  // ==================== Main update ====================

  function update() {
    if (!activeParser) return;
    var text = exprInput.value;
    if (!text.trim()) {
      hlOutput.innerHTML = '<span style="opacity:0.4">Enter an expression\u2026</span>';
      treeOutput.innerHTML = '';
      diagOutput.className = 'diag-ok';
      diagOutput.textContent = '';
      latexOutput.innerHTML = '';
      return;
    }
    var tree = activeParser.parse(text);
    hlOutput.innerHTML = highlightExpr(tree.rootNode, text);
    treeOutput.innerHTML = formatTree(tree.rootNode, 0);

    if (!checkerReady || typeof ChacanaChecker === 'undefined') {
      diagOutput.className = 'diag-ok';
      diagOutput.textContent = 'Checker loading\u2026';
      return;
    }
    if (hasSyntaxErrors(tree.rootNode)) {
      diagOutput.className = 'diag-err';
      diagOutput.textContent = 'Syntax error \u2014 fix expression to enable type checking';
      return;
    }
    try {
      var ast = ChacanaChecker.buildAST(tree.rootNode);
      if (!ast) {
        diagOutput.className = 'diag-err';
        diagOutput.textContent = 'Could not build AST';
        latexOutput.innerHTML = '';
        return;
      }
      // LaTeX preview
      if (typeof katex !== 'undefined' && ChacanaChecker.toLatex) {
        try {
          var latex = ChacanaChecker.toLatex(ast);
          katex.render(latex, latexOutput, { throwOnError: false, displayMode: true });
        } catch (_e) {
          latexOutput.innerHTML = '<span style="opacity:0.4">LaTeX error</span>';
        }
      }
      var ctx = null;
      var hasTensors = ctxState.tensors.some(function(t) { return t.name.trim(); });
      if (hasTensors) {
        try { ctx = ChacanaChecker.loadContext(buildTOML()); }
        catch (e) {
          diagOutput.className = 'diag-err';
          diagOutput.textContent = 'Context error: ' + e.message;
          return;
        }
      }
      var diags = ChacanaChecker.checkAll(ast, ctx);
      if (diags.length === 0) {
        diagOutput.className = 'diag-ok';
        diagOutput.textContent = ctx
          ? '\u2713 Valid \u2014 no type errors'
          : '\u2713 Syntax OK';
      } else {
        diagOutput.className = 'diag-err';
        diagOutput.innerHTML = diags.map(function(d) {
          return '<div>' + esc(d.code) + ': ' + esc(d.message) + '</div>';
        }).join('');
      }
    } catch (e) {
      diagOutput.className = 'diag-err';
      diagOutput.textContent = 'Checker error: ' + e.message;
    }
  }

  // ==================== Init ====================

  renderTensors();

  ctxMfldName.addEventListener('input', function() {
    ctxState.manifold.name = this.value; update();
  });
  ctxMfldDim.addEventListener('input', function() {
    ctxState.manifold.dimension = parseInt(this.value) || 4; update();
  });
  document.getElementById('ctx-add-btn').addEventListener('click', function() {
    ctxState.tensors.push({ name: '', pattern: ['Covar'] });
    renderTensors();
    var rows = ctxTensorsEl.querySelectorAll('.ctx-name');
    if (rows.length) rows[rows.length - 1].focus();
  });

  var copyBtn = document.getElementById('ctx-copy-btn');
  copyBtn.addEventListener('click', function() {
    var toml = buildTOML();
    var done = function() {
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('copied');
      setTimeout(function() {
        copyBtn.textContent = 'Copy TOML';
        copyBtn.classList.remove('copied');
      }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(toml).then(done).catch(fallback);
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = toml;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    }
  });

  exprInput.addEventListener('input', update);

  // LaTeX import
  latexImportBtn.addEventListener('click', function() {
    var latex = latexImportInput.value.trim();
    latexImportError.textContent = '';
    if (!latex) return;
    if (typeof ChacanaChecker === 'undefined' || !ChacanaChecker.fromLatex) {
      latexImportError.textContent = 'Checker not loaded yet';
      return;
    }
    var result = ChacanaChecker.fromLatex(latex);
    if (result.ok) {
      exprInput.value = result.value;
      latexImportInput.value = '';
      update();
      exprInput.focus();
    } else {
      latexImportError.textContent = result.error;
    }
  });

  var defaultTensors = JSON.parse(JSON.stringify(ctxState.tensors));

  var chips = document.querySelectorAll('.example-chip');
  for (var i = 0; i < chips.length; i++) {
    chips[i].addEventListener('click', function() {
      exprInput.value = this.getAttribute('data-expr');
      var ctxAttr = this.getAttribute('data-ctx');
      if (ctxAttr !== null) {
        ctxState.tensors = JSON.parse(ctxAttr);
        renderTensors();
      } else if (JSON.stringify(ctxState.tensors) === '[]') {
        ctxState.tensors = JSON.parse(JSON.stringify(defaultTensors));
        renderTensors();
      }
      update();
      exprInput.focus();
    });
  }

  Promise.all([loadTreeSitter(), loadChecker()]).then(function(results) {
    activeParser = results[0];
    checkerReady = true;
    loadStatus.textContent = 'Ready';
    loadStatus.classList.add('loaded');
    update();
  }).catch(function(err) {
    loadStatus.textContent = 'Failed to load: ' + err.message;
    console.error('Playground load error:', err);
  });
})();
</script>
