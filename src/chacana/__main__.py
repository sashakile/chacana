"""Command-line interface for Chacana.

Usage:
    chacana parse <expression> [--context FILE]
    chacana check <expression> [--context FILE]
    chacana --help
    python -m chacana <expression> [--context FILE]
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any

from chacana import parse as _parse
from chacana.context import load_context_file
from chacana.errors import ChacanaError


def _load_context(path: str | None) -> Any:
    """Load a context file, or return None if no path given."""
    if path is None:
        return None
    return load_context_file(path)


def cmd_parse(args: argparse.Namespace) -> int:
    """Parse an expression and print the JSON AST."""
    try:
        ctx = _load_context(args.context)
        result = _parse(args.expression, context=ctx)
        json.dump(result, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0
    except ChacanaError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def cmd_check(args: argparse.Namespace) -> int:
    """Check an expression for validity. Exit 0 if valid, 1 if not."""
    try:
        ctx = _load_context(args.context)
        _parse(args.expression, context=ctx)
        return 0
    except ChacanaError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser."""
    parser = argparse.ArgumentParser(
        prog="chacana",
        description="Chacana — a tensor calculus DSL with static type checking",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # parse subcommand
    parse_p = sub.add_parser("parse", help="Parse an expression and print the JSON AST")
    parse_p.add_argument("expression", help="Tensor expression to parse")
    parse_p.add_argument("--context", "-c", help="Path to TOML context file")
    parse_p.set_defaults(func=cmd_parse)

    # check subcommand
    check_p = sub.add_parser("check", help="Check an expression for validity")
    check_p.add_argument("expression", help="Tensor expression to check")
    check_p.add_argument("--context", "-c", help="Path to TOML context file")
    check_p.set_defaults(func=cmd_check)

    return parser


def main(argv: list[str] | None = None) -> int:
    """CLI entry point."""
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)  # type: ignore[no-any-return]


if __name__ == "__main__":
    sys.exit(main())
