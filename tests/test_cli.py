"""Tests for the Chacana CLI."""

import json
import subprocess
import sys

from chacana.__main__ import main


class TestCLIEntryPoint:
    """Test the CLI entry point function directly."""

    def test_parse_simple_expression(self):
        """Parse a simple expression and print JSON AST."""
        exit_code = main(["parse", "R{^a _b}"])
        assert exit_code == 0

    def test_parse_invalid_expression(self):
        """Parse an invalid expression should exit with code 1."""
        exit_code = main(["parse", "R{?a}"])
        assert exit_code == 1

    def test_check_valid_expression(self, basic_context_file):
        """Check a valid expression with context should exit 0."""
        exit_code = main(
            [
                "check",
                "R{^a _b _c _d}",
                "--context",
                str(basic_context_file),
            ]
        )
        assert exit_code == 0

    def test_check_invalid_expression(self, basic_context_file):
        """Check an invalid expression with context should exit 1."""
        exit_code = main(
            [
                "check",
                "R{^a _b}",
                "--context",
                str(basic_context_file),
            ]
        )
        assert exit_code == 1

    def test_check_missing_context_file(self):
        """Check with a non-existent context file should exit 1."""
        exit_code = main(
            [
                "check",
                "R{^a _b}",
                "--context",
                "nonexistent.toml",
            ]
        )
        assert exit_code == 1


class TestCLIProcess:
    """Test the CLI as a subprocess (via python -m chacana)."""

    def test_parse_output_is_json(self, tmp_path):
        """Parse output should be valid JSON."""
        result = subprocess.run(
            [sys.executable, "-m", "chacana", "parse", "R{^a _b}"],
            capture_output=True,
            text=True,
            cwd=tmp_path,
        )
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert data["head"] == "R"
        assert len(data["indices"]) == 2

    def test_parse_error_on_stderr(self, tmp_path):
        """Parse error should go to stderr and exit 1."""
        result = subprocess.run(
            [sys.executable, "-m", "chacana", "parse", "R{?a}"],
            capture_output=True,
            text=True,
            cwd=tmp_path,
        )
        assert result.returncode == 1
        assert "Error" in result.stderr

    def test_parse_help(self, tmp_path):
        """--help should print usage."""
        result = subprocess.run(
            [sys.executable, "-m", "chacana", "--help"],
            capture_output=True,
            text=True,
            cwd=tmp_path,
        )
        assert result.returncode == 0
        assert "usage" in result.stdout.lower()
