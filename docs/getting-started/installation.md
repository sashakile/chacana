# Installation

## Requirements

- Python 3.10 or later

## With uv (recommended)

```bash
git clone https://github.com/sashakile/chacana.git
cd chacana
uv sync --dev
```

## With pip

```bash
git clone https://github.com/sashakile/chacana.git
cd chacana
pip install -e ".[dev]"
```

## Dependencies

Chacana has minimal runtime dependencies:

- **arpeggio** -- PEG parser library
- **tomli** -- TOML parser (only needed for Python < 3.11)

## Verifying the installation

```bash
python -c "import chacana; print(chacana.__version__)"
# 0.1.0
```
