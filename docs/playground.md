---
hide:
  - navigation
  - toc
---

# Playground

Type a Chacana tensor expression to see its syntax tree and type-check diagnostics in real time. Optionally provide a TOML context for rank and operator validation.

<style>
.playground-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
  opacity: 0.7;
}
#expr-input, #toml-input {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  padding: 0.75rem 1rem;
  border: 2px solid var(--md-default-fg-color--lightest);
  border-radius: 0.4rem;
  background: var(--md-code-bg-color);
  color: var(--md-code-fg-color);
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
}
#expr-input { font-size: 1.05rem; min-height: 3rem; }
#toml-input { font-size: 0.82rem; min-height: 6rem; }
#expr-input:focus, #toml-input:focus { border-color: var(--md-accent-fg-color); }
#tree-output {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 0.82rem;
  line-height: 1.5;
  padding: 0.75rem 1rem;
  border: 2px solid var(--md-default-fg-color--lightest);
  border-radius: 0.4rem;
  background: var(--md-code-bg-color);
  color: var(--md-code-fg-color);
  min-height: 12rem;
  max-height: 32rem;
  overflow: auto;
  white-space: pre;
  tab-size: 2;
}
#diagnostics-output {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 0.82rem;
  line-height: 1.5;
  padding: 0.75rem 1rem;
  border-radius: 0.4rem;
  min-height: 2.5rem;
  max-height: 10rem;
  overflow: auto;
  margin-top: 0.5rem;
}
.diag-ok { background: #065f4620; border: 1px solid #065f46; color: #059669; }
.diag-err { background: #7f1d1d20; border: 1px solid #991b1b; color: #dc2626; }
[data-md-color-scheme="slate"] .diag-ok { background: #06553820; border-color: #059669; color: #34d399; }
[data-md-color-scheme="slate"] .diag-err { background: #450a0a20; border-color: #dc2626; color: #f87171; }
.node-type  { color: #7c3aed; }
.field-name { color: #0891b2; }
.anon-token { color: #059669; }
.node-error { color: #dc2626; font-weight: 700; }
[data-md-color-scheme="slate"] .node-type  { color: #a78bfa; }
[data-md-color-scheme="slate"] .field-name { color: #22d3ee; }
[data-md-color-scheme="slate"] .anon-token { color: #34d399; }
.example-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.75rem; }
.example-chip {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 0.78rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: 1rem;
  background: transparent;
  color: var(--md-default-fg-color--light);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.example-chip:hover { border-color: var(--md-accent-fg-color); color: var(--md-accent-fg-color); }
#load-status { font-size: 0.8rem; opacity: 0.6; margin-top: 0.3rem; }
details.toml-context { margin-top: 0.5rem; }
details.toml-context summary {
  font-size: 0.85rem; cursor: pointer; opacity: 0.7;
  font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
}
</style>

<div class="playground-grid">
  <div class="pg-panel">
    <label class="pg-label" for="expr-input">Expression</label>
    <textarea id="expr-input" spellcheck="false" autocomplete="off">R{^a _b _c _d} * g{^b ^d} + T{^a _c}</textarea>
    <div id="load-status">Loading parser&hellip;</div>
    <div class="example-chips">
      <button class="example-chip" data-expr="R{^a _b _c _d}">Riemann</button>
      <button class="example-chip" data-expr="d(omega){_a _b}">d(omega){_a _b}</button>
      <button class="example-chip" data-expr="L(X, g{_a _b})">Lie derivative</button>
      <button class="example-chip" data-expr="T{_( a b _)}">Symmetrization</button>
      <button class="example-chip" data-expr="@2(g{_a _b})">Perturbation</button>
      <button class="example-chip" data-expr="[A, B]">Commutator</button>
      <button class="example-chip" data-expr="R{^a _b _c _d} + R{^a _c _d _b} + R{^a _d _b _c}">Bianchi</button>
      <button class="example-chip" data-expr="R * R - 4 * R{_a _b} * R{^a ^b} + R{_a _b _c _d} * R{^a ^b ^c ^d}">Gauss-Bonnet</button>
      <button class="example-chip" data-expr="Tr(T{^a _b})">Trace</button>
      <button class="example-chip" data-expr="det(g)">Determinant</button>
      <button class="example-chip" data-expr="star(F)">Hodge star</button>
      <button class="example-chip" data-expr="R{^a _b _c _d ;e}">Cov. deriv.</button>
    </div>
    <details class="toml-context" id="toml-details">
      <summary>TOML Context (optional)</summary>
      <textarea id="toml-input" spellcheck="false" autocomplete="off" placeholder="Paste TOML context here for rank and operator checking...">[manifold.M]
dimension = 4

[tensor.R]
manifold = "M"
rank = 4
index_pattern = ["Contra", "Covar", "Covar", "Covar"]

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]

[tensor.g]
manifold = "M"
rank = 2
index_pattern = ["Covar", "Covar"]</textarea>
    </details>
  </div>
  <div class="pg-panel">
    <label class="pg-label">Syntax Tree</label>
    <div id="tree-output"></div>
    <div id="diagnostics-output" class="diag-ok"></div>
  </div>
</div>

<script>

// --- web-tree-sitter loader ---
var TS_CDN = 'https://cdn.jsdelivr.net/npm/web-tree-sitter@0.24.7/';

function siteRoot() {
  var loc = window.location.href;
  var idx = loc.indexOf('/playground');
  return idx !== -1 ? loc.substring(0, idx) + '/' : '../';
}

async function loadTreeSitter() {
  await new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = TS_CDN + 'tree-sitter.js';
    s.onload = resolve;
    s.onerror = function() { reject(new Error('Failed to load tree-sitter.js')); };
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
  await new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = siteRoot() + 'assets/js/chacana-checker.js';
    s.onload = resolve;
    s.onerror = function() { reject(new Error('Failed to load checker')); };
    document.head.appendChild(s);
  });
}

// --- Main IIFE ---
(function() {
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

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hasSyntaxErrors(node) {
    if (node.isMissing || node.type === 'ERROR') return true;
    for (var i = 0; i < node.childCount; i++) {
      if (hasSyntaxErrors(node.child(i))) return true;
    }
    return false;
  }

  var exprInput = document.getElementById('expr-input');
  var tomlInput = document.getElementById('toml-input');
  var treeOutput = document.getElementById('tree-output');
  var diagOutput = document.getElementById('diagnostics-output');
  var loadStatus = document.getElementById('load-status');
  var activeParser = null;
  var checkerReady = false;

  function update() {
    if (!activeParser) return;
    var text = exprInput.value;
    if (!text.trim()) {
      treeOutput.innerHTML = '<span style="opacity:0.5">Enter an expression above</span>';
      diagOutput.className = 'diag-ok';
      diagOutput.textContent = '';
      return;
    }
    var tree = activeParser.parse(text);
    treeOutput.innerHTML = formatTree(tree.rootNode, 0);

    // Type checking via ChacanaChecker (browser bundle)
    if (!checkerReady || typeof ChacanaChecker === 'undefined') {
      diagOutput.className = 'diag-ok';
      diagOutput.textContent = 'Checker loading...';
      return;
    }

    // Check for syntax errors first
    if (hasSyntaxErrors(tree.rootNode)) {
      diagOutput.className = 'diag-err';
      diagOutput.textContent = 'Syntax error — fix expression to enable type checking';
      return;
    }

    try {
      var ast = ChacanaChecker.buildAST(tree.rootNode);
      if (!ast) {
        diagOutput.className = 'diag-err';
        diagOutput.textContent = 'Could not build AST';
        return;
      }

      // Load context if provided
      var ctx = null;
      var tomlText = tomlInput.value.trim();
      if (tomlText) {
        try {
          ctx = ChacanaChecker.loadContext(tomlText);
        } catch (e) {
          diagOutput.className = 'diag-err';
          diagOutput.textContent = 'TOML error: ' + e.message;
          return;
        }
      }

      var diags = ChacanaChecker.checkAll(ast, ctx);
      if (diags.length === 0) {
        diagOutput.className = 'diag-ok';
        diagOutput.textContent = 'Valid — no type errors';
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

  Promise.all([loadTreeSitter(), loadChecker()]).then(function(results) {
    activeParser = results[0];
    checkerReady = true;
    loadStatus.textContent = 'Parser + checker ready';
    update();
  }).catch(function(err) {
    loadStatus.textContent = 'Failed to load: ' + err.message;
    console.error('Playground load error:', err);
  });

  exprInput.addEventListener('input', update);
  tomlInput.addEventListener('input', update);

  var chips = document.querySelectorAll('.example-chip');
  for (var i = 0; i < chips.length; i++) {
    chips[i].addEventListener('click', function() {
      exprInput.value = this.getAttribute('data-expr');
      update();
      exprInput.focus();
    });
  }
})();
</script>
