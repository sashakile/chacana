# Default: list available recipes
default:
    @just --list

# Run all checks (local CI equivalent)
check: lint test ts-all

# Run all linters
lint: ruff-check ruff-fmt-check typecheck spellcheck

# Run ruff linter
ruff-check:
    uv run ruff check src/ tests/

# Check formatting (no changes)
ruff-fmt-check:
    uv run ruff format --check src/ tests/

# Auto-format code
fmt:
    uv run ruff format src/ tests/

# Auto-fix lint issues
fix:
    uv run ruff check --fix src/ tests/

# Type check with mypy
typecheck:
    uv run mypy src/chacana/

# Spell check with typos
spellcheck:
    uvx typos src/ tests/ README.md .wai/ openspec/

# Prose lint with vale
vale:
    uvx vale .

# Run Python tests
test *ARGS:
    uv run python -m pytest tests/ -v {{ ARGS }}

# Run a single test file or pattern
test-k PATTERN:
    uv run python -m pytest tests/ -v -k "{{ PATTERN }}"

# Generate tree-sitter parser
ts-generate:
    cd tree-sitter-chacana && npx tree-sitter generate

# Run tree-sitter tests
ts-test:
    cd tree-sitter-chacana && npx tree-sitter test

# Generate and test tree-sitter parser
ts-all: ts-generate ts-test

# Build docs
docs-build:
    uv run mkdocs build --strict

# Serve docs locally
docs-serve:
    uv run mkdocs serve

# Install dev dependencies
setup:
    uv sync --dev

# Install tree-sitter dependencies
ts-setup:
    cd tree-sitter-chacana && npm ci

# Install all dependencies (dev + docs + tree-sitter)
setup-all:
    uv sync --dev --extra docs
    cd tree-sitter-chacana && npm ci
