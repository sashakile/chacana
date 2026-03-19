---
hide:
  - navigation
  - toc
---

# Playground

Type a Chacana tensor expression to see its syntax tree in real time.

<style>
.playground-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
}
@media (max-width: 768px) {
  .playground-container { grid-template-columns: 1fr; }
}
.playground-input, .playground-output {
  display: flex;
  flex-direction: column;
}
.playground-input label, .playground-output label {
  font-weight: 600;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
}
#expr-input {
  font-family: var(--md-code-font-family, "Roboto Mono", monospace);
  font-size: 1.05rem;
  padding: 0.75rem 1rem;
  border: 2px solid var(--md-default-fg-color--lightest);
  border-radius: 0.4rem;
  background: var(--md-code-bg-color);
  color: var(--md-code-fg-color);
  resize: vertical;
  min-height: 3rem;
  outline: none;
  transition: border-color 0.15s;
}
#expr-input:focus {
  border-color: var(--md-accent-fg-color);
}
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
.node-type  { color: #7c3aed; }       /* purple - named nodes */
.field-name { color: #0891b2; }       /* teal - field names */
.anon-token { color: #059669; }       /* green - anonymous tokens */
.node-error { color: #dc2626; font-weight: 700; }
[data-md-color-scheme="slate"] .node-type  { color: #a78bfa; }
[data-md-color-scheme="slate"] .field-name { color: #22d3ee; }
[data-md-color-scheme="slate"] .anon-token { color: #34d399; }
.example-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.75rem;
}
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
.example-chip:hover {
  border-color: var(--md-accent-fg-color);
  color: var(--md-accent-fg-color);
}
#load-status {
  font-size: 0.8rem;
  opacity: 0.6;
  margin-top: 0.3rem;
}
</style>

<div class="playground-container">
  <div class="playground-input">
    <label for="expr-input">Expression</label>
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
  </div>
  <div class="playground-output">
    <label>Syntax Tree</label>
    <div id="tree-output"></div>
  </div>
</div>

<script>

// --- web-tree-sitter loader ---
const TS_CDN = 'https://cdn.jsdelivr.net/npm/web-tree-sitter@0.24.7/';

// Resolve grammar WASM relative to site root
function grammarWasmUrl() {
  var loc = window.location.href;
  var idx = loc.indexOf('/playground');
  if (idx !== -1) return loc.substring(0, idx) + '/assets/wasm/tree-sitter-chacana.wasm';
  return '../assets/wasm/tree-sitter-chacana.wasm';
}

async function loadTreeSitter() {
  // Load web-tree-sitter JS (sets window.TreeSitter)
  await new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = TS_CDN + 'tree-sitter.js';
    s.onload = resolve;
    s.onerror = function() { reject(new Error('Failed to load tree-sitter.js from CDN')); };
    document.head.appendChild(s);
  });

  // Wait a tick for the global to be set
  await new Promise(function(r) { setTimeout(r, 50); });

  if (typeof TreeSitter === 'undefined') {
    throw new Error('TreeSitter global not found after loading script');
  }

  await TreeSitter.init({
    locateFile: function(path) { return TS_CDN + path; },
  });

  var parser = new TreeSitter();
  var lang = await TreeSitter.Language.load(grammarWasmUrl());
  parser.setLanguage(lang);
  return parser;
}

// Wrap everything in an IIFE to avoid global scope collisions with mkdocs
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
      var fieldName = node.fieldNameForChild(i);
      if (fieldName) {
        var childStr = formatTree(child, 0).replace(/^\s+/, '');
        parts.push(pad + '  <span class="field-name">' + esc(fieldName) + ':</span> ' + childStr);
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

  var exprInput  = document.getElementById('expr-input');
  var treeOutput = document.getElementById('tree-output');
  var loadStatus = document.getElementById('load-status');
  var activeParser = null;

  function update() {
    if (!activeParser) return;
    var text = exprInput.value;
    if (!text.trim()) {
      treeOutput.innerHTML = '<span style="opacity:0.5">Enter an expression above</span>';
      return;
    }
    var tree = activeParser.parse(text);
    treeOutput.innerHTML = formatTree(tree.rootNode, 0);
  }

  loadTreeSitter().then(function(p) {
    activeParser = p;
    loadStatus.textContent = 'Parser ready (8 KB WASM)';
    update();
  }).catch(function(err) {
    loadStatus.textContent = 'Failed to load parser: ' + err.message;
    console.error('Playground load error:', err);
  });

  exprInput.addEventListener('input', update);

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
