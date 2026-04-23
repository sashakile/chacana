# Installation

## TL;DR

Use this page if you want to install the Python package and confirm it works before moving to the full example in [Quick Start](quickstart.md).

Prerequisites:
- Python 3.10 or later
- a clone of this repository if you want the editable install shown below

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

Run one of these from the repository root:

```bash
# If you installed with uv
uv run python -c "import chacana; print(chacana.__version__)"

# If you installed with pip into an active environment
python -c "import chacana; print(chacana.__version__)"

# Expected output
0.1.0
```

If the command prints a version number, the installation succeeded and you can continue to [Quick Start](quickstart.md) for a complete example using `examples/basic.toml`.
