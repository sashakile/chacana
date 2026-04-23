# Development

## TL;DR

Use this page when you want to work on the repository itself rather than just use the Python package.

Prerequisites:
- Git
- Python 3.10+
- `uv` for the documented developer workflow

This page shows how to set up the dev environment, enable repository hooks, run quality checks, and build the docs.

## Development environment setup

```bash
git clone https://github.com/sashakile/chacana.git
cd chacana
uv sync --dev
```

The repository includes hook scripts in `.githooks/`, but Git only uses them after you point `core.hooksPath` at that directory:

```bash
git config core.hooksPath .githooks
```

After you run that command once in this clone, `git commit` will use the repository's pre-commit hook and `git push` will use the pre-push hook.

## Developer quality checks

```bash
# Tests
uv run python -m pytest tests/ -v

# Lint + format
uv run ruff check src/ tests/
uv run ruff format src/ tests/

# Type check
uv run mypy src/chacana/

# Spell check
uvx typos src/ tests/ README.md .wai/ openspec/
```

## What the pre-commit hook runs

The pre-commit hook runs automatically on `git commit`:

1. **typos** -- spell check
2. **ruff check** -- lint
3. **ruff format --check** -- format verification
4. **mypy** -- type check

## What the pre-push hook runs

The pre-push hook runs `pytest` before allowing a push.

## Documentation build and preview

```bash
uv sync --extra docs
uv run mkdocs serve     # Local preview at http://127.0.0.1:8000
uv run mkdocs build     # Build static site to site/
```

## CI summary

GitHub Actions runs on every push to `main` and on pull requests:

- **lint** job: ruff, mypy, typos
- **test** job: pytest across Python 3.10--3.13

Docs are deployed to GitHub Pages automatically on push to `main`.

## Repository layout overview

```
chacana/
├── src/chacana/          # Source code
│   ├── __init__.py       # Public API: parse(), check(), load_context()
│   ├── ast.py            # AST node dataclasses
│   ├── grammar.py        # PEG grammar + Unicode normalization
│   ├── visitor.py        # Parse tree → AST visitor
│   ├── context.py        # TOML context loader
│   ├── checker.py        # Static type checker
│   └── errors.py         # Exception types
├── tests/                # Test suite (208 tests)
├── docs/                 # Documentation source (mkdocs)
├── examples/             # Example TOML contexts
├── openspec/specs/       # Formal specifications
├── .githooks/            # Git hooks (pre-commit, pre-push)
└── .github/workflows/    # CI configuration
```
