"""Bidirectional LaTeX ↔ Chacana transpiler.

Converts between Chacana ValidationToken ASTs and LaTeX mathematical notation.
"""

from __future__ import annotations

import re

from chacana.ast import (
    HEAD_ADD,
    HEAD_DETERMINANT,
    HEAD_EXTERIOR_DERIVATIVE,
    HEAD_HODGE_STAR,
    HEAD_INTERIOR_PRODUCT,
    HEAD_INVERSE,
    HEAD_LIE_DERIVATIVE,
    HEAD_MULTIPLY,
    HEAD_NEGATE,
    HEAD_NUMBER,
    HEAD_TRACE,
    HEAD_WEDGE,
    ValidationToken,
    Variance,
)

# Structural heads that are not leaf tensor tokens.
STRUCTURAL_HEADS = frozenset(
    {
        HEAD_ADD,
        HEAD_MULTIPLY,
        HEAD_WEDGE,
        HEAD_NEGATE,
        HEAD_NUMBER,
    }
)

# Unicode → LaTeX command mapping for Greek letters.
GREEK_TO_LATEX: dict[str, str] = {
    "α": "\\alpha",
    "β": "\\beta",
    "γ": "\\gamma",
    "δ": "\\delta",
    "ε": "\\epsilon",
    "ζ": "\\zeta",
    "η": "\\eta",
    "θ": "\\theta",
    "ι": "\\iota",
    "κ": "\\kappa",
    "λ": "\\lambda",
    "μ": "\\mu",
    "ν": "\\nu",
    "ξ": "\\xi",
    "π": "\\pi",
    "ρ": "\\rho",
    "σ": "\\sigma",
    "τ": "\\tau",
    "υ": "\\upsilon",
    "φ": "\\phi",
    "χ": "\\chi",
    "ψ": "\\psi",
    "ω": "\\omega",
    "Γ": "\\Gamma",
    "Δ": "\\Delta",
    "Θ": "\\Theta",
    "Λ": "\\Lambda",
    "Ξ": "\\Xi",
    "Π": "\\Pi",
    "Σ": "\\Sigma",
    "Υ": "\\Upsilon",
    "Φ": "\\Phi",
    "Ψ": "\\Psi",
    "Ω": "\\Omega",
}

# LaTeX command → Unicode Greek mapping (inverse of GREEK_TO_LATEX).
LATEX_TO_GREEK: dict[str, str] = {v: k for k, v in GREEK_TO_LATEX.items()}

# Greek letter range for character matching.
GREEK_RE = re.compile(r"[\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9]")

# Letter class matching both ASCII and Greek letters (used in regexes).
LETTER_CLASS = r"A-Za-z\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9"

# Heads that produce compound (multi-term) LaTeX needing parens when negated.
COMPOUND_HEADS = {HEAD_ADD, HEAD_WEDGE}

# Unsupported LaTeX structural commands.
UNSUPPORTED = frozenset(
    {
        "\\frac",
        "\\sqrt",
        "\\sum",
        "\\int",
        "\\prod",
        "\\lim",
    }
)

# Greek LaTeX command pattern for replacement.
_GREEK_CMD_RE = re.compile(
    r"\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|"
    r"lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|"
    r"Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)\b"
)


def _greek_to_latex(s: str) -> str:
    """Replace Unicode Greek chars with LaTeX commands."""
    return GREEK_RE.sub(lambda m: GREEK_TO_LATEX.get(m.group(0), m.group(0)), s)


def _latex_to_greek(s: str) -> str:
    """Replace LaTeX Greek commands with Unicode."""
    return _GREEK_CMD_RE.sub(lambda m: LATEX_TO_GREEK.get(m.group(0), m.group(0)), s)


def _render_indices(token: ValidationToken) -> str:
    """Render the index portion of a tensor as LaTeX."""
    if not token.indices:
        return ""

    sym_starts: set[int] = set()
    sym_ends: set[int] = set()
    anti_starts: set[int] = set()
    anti_ends: set[int] = set()

    for group in token.metadata.symmetrized_groups:
        if len(group) >= 2:
            sym_starts.add(group[0])
            sym_ends.add(group[-1])
    for group in token.metadata.antisymmetrized_groups:
        if len(group) >= 2:
            anti_starts.add(group[0])
            anti_ends.add(group[-1])

    result = ""
    i = 0
    while i < len(token.indices):
        current_variance = token.indices[i].variance

        # Collect a run of same-variance indices
        run_end = i + 1
        while run_end < len(token.indices) and token.indices[run_end].variance == current_variance:
            run_end += 1

        marker = "^" if current_variance == Variance.CONTRA else "_"

        # Emit empty-brace separator between variance changes (staggered form)
        if i > 0:
            result += "{}"

        result += marker + "{"

        for j in range(i, run_end):
            if j > i:
                result += " "

            if j in sym_starts:
                result += "("
            if j in anti_starts:
                result += "["

            idx = token.indices[j]
            if idx.is_derivative and idx.derivative_type == "semicolon":
                result += ";\\! "
            elif idx.is_derivative and idx.derivative_type == "comma":
                result += ",\\! "

            result += _greek_to_latex(idx.label)

            if j in sym_ends:
                result += ")"
            if j in anti_ends:
                result += "]"

        result += "}"
        i = run_end

    return result


def to_latex(token: ValidationToken) -> str:
    """Convert a ValidationToken AST into a valid LaTeX string.

    Args:
        token: The AST node to convert.

    Returns:
        A LaTeX string representation of the expression.
    """
    head = token.head
    args = token.args
    value = token.value

    # Number literal
    if head == HEAD_NUMBER:
        return str(value) if value is not None else "0"

    # Negation: -<inner> (wrap compound expressions in parens)
    if head == HEAD_NEGATE and len(args) == 1:
        inner = args[0]
        inner_latex = to_latex(inner)
        if inner.head in COMPOUND_HEADS:
            return f"-({inner_latex})"
        return "-" + inner_latex

    # Addition: handles subtraction via Negate args (A + Negate(B) → A - B)
    if head == HEAD_ADD:
        parts: list[str] = []
        for i, arg in enumerate(args):
            if i > 0 and arg.head == HEAD_NEGATE and len(arg.args) == 1:
                parts.append(" - " + to_latex(arg.args[0]))
            elif i == 0:
                parts.append(to_latex(arg))
            else:
                parts.append(" + " + to_latex(arg))
        return "".join(parts)

    # Multiplication: implicit juxtaposition
    if head == HEAD_MULTIPLY:
        return " ".join(to_latex(arg) for arg in args)

    # Wedge product: a \wedge b
    if head == HEAD_WEDGE:
        return " \\wedge ".join(to_latex(arg) for arg in args)

    # Lie derivative: \mathcal{L}_{X} <body>
    if head == HEAD_LIE_DERIVATIVE and len(args) == 2:
        return f"\\mathcal{{L}}_{{{to_latex(args[0])}}} {to_latex(args[1])}"

    # Interior product: \iota_{X} <body>
    if head == HEAD_INTERIOR_PRODUCT and len(args) == 2:
        return f"\\iota_{{{to_latex(args[0])}}} {to_latex(args[1])}"

    # Inverse: g^{-1}
    if head == HEAD_INVERSE and len(args) == 1:
        return to_latex(args[0]) + "^{-1}"

    # Determinant: \det(<inner>)
    if head == HEAD_DETERMINANT and len(args) == 1:
        return f"\\det({to_latex(args[0])})"

    # Trace: \operatorname{Tr}(<inner>)
    if head == HEAD_TRACE and len(args) == 1:
        return f"\\operatorname{{Tr}}({to_latex(args[0])})"

    # Hodge star: \star(<inner>)
    if head == HEAD_HODGE_STAR and len(args) == 1:
        return f"\\star({to_latex(args[0])})"

    # Exterior derivative: d(<inner>)
    if head == HEAD_EXTERIOR_DERIVATIVE and len(args) == 1:
        return f"d({to_latex(args[0])})"

    # Tensor or plain identifier
    if head not in STRUCTURAL_HEADS:
        name = _greek_to_latex(head)
        return name + _render_indices(token)

    # Fallback for unhandled structural heads
    inner_str = ", ".join(to_latex(arg) for arg in args)
    return f"\\operatorname{{{head}}}({inner_str})"


# ---------------------------------------------------------------------------
# fromLatex
# ---------------------------------------------------------------------------


class FromLatexResult:
    """Result of a from_latex conversion."""

    def __init__(self, ok: bool, value: str = "", error: str = ""):
        self.ok = ok
        self.value = value
        self.error = error


def from_latex(input_str: str) -> FromLatexResult:
    """Convert a LaTeX string into Chacana micro-syntax.

    Args:
        input_str: A LaTeX mathematical expression string.

    Returns:
        A FromLatexResult with the converted Chacana expression.
    """
    # Check for unsupported commands first
    for cmd in UNSUPPORTED:
        if cmd in input_str:
            name = cmd[1:]  # remove backslash
            return FromLatexResult(ok=False, error=f"Unsupported LaTeX command: {name}")

    s = input_str

    # Strip \left and \right, keep the delimiter
    s = re.sub(r"\\left\s*", "", s)
    s = re.sub(r"\\right\s*", "", s)

    # Sentinels prevent the index regex from consuming operator subscripts.
    s = re.sub(
        r"\\mathcal\{L\}_\{([^}]+)\}\s*",
        lambda m: f"__LIE__{_latex_to_greek(m.group(1))}__LIESEP__",
        s,
    )

    # Handle \nabla_{e} T^{bc} → T{^b ^c ;e} via sentinel
    s = re.sub(
        rf"\\nabla(?:_\{{([^}}]+)\}}|_([{LETTER_CLASS}]))\s*",
        lambda m: f"__COVD__{(m.group(1) or m.group(2)).strip()}__SEP__",
        s,
    )

    # Handle \det(...) → det(...)
    s = re.sub(r"\\det", "det", s)

    # Handle \operatorname{Tr} → Tr
    s = re.sub(r"\\operatorname\{Tr\}", "Tr", s)

    # Handle \star → star
    s = re.sub(r"\\star", "star", s)

    # Handle \iota → i
    s = re.sub(r"\\iota", "i", s)

    # Normalize operators
    s = re.sub(r"\\cdot", "*", s)
    s = re.sub(r"\\times", "*", s)
    s = re.sub(r"\\wedge", "^", s)

    # Convert Greek LaTeX commands to Unicode
    s = _latex_to_greek(s)

    # Process tensors with indices: Name_{...}^{...} or Name^{...}_{...}
    def _process_tensor(m: re.Match) -> str:
        name = m.group(1)
        index_part = m.group(2)
        indices: list[str] = []
        group_re = re.compile(r"([_^])\{([^}]*)\}")
        for gm in group_re.finditer(index_part):
            variance = "^" if gm.group(1) == "^" else "_"
            content = gm.group(2).strip()
            if not content:
                continue
            # Split indices: if content has spaces, split on whitespace;
            # otherwise treat each character as a separate index label.
            labels = content.split() if " " in content else [ch for ch in content if ch.strip()]
            for label in labels:
                indices.append(variance + label)
        if indices:
            return name + "{" + " ".join(indices) + "}"  # type: ignore[no-any-return]
        return name  # type: ignore[no-any-return]

    s = re.sub(
        rf"([{LETTER_CLASS}])((?:\s*{{}})*(?:\s*[_^]\{{[^}}]*\}}(?:\s*{{}})*)+)",
        _process_tensor,
        s,
    )

    # Restore Lie derivative sentinels
    s = re.sub(
        r"__LIE__(\S+?)__LIESEP__(\w+(?:\{[^}]*\})*)",
        lambda m: f"L({m.group(1).strip()}, {m.group(2).strip()})",
        s,
    )

    # Restore covariant derivative sentinels: __COVD__e__SEP__T{^b ^c}
    # becomes T{^b ^c ;e}. Also handles bare names: __COVD__e__SEP__f -> f{;e}
    s = re.sub(
        r"__COVD__(\w+)__SEP__(\w+\{[^}]*\})",
        lambda m: m.group(2)[:-1] + f" ;{m.group(1)}" + "}",
        s,
    )
    s = re.sub(
        r"__COVD__(\w+)__SEP__(\w+)\b",
        lambda m: f"{m.group(2)}{{;{m.group(1)}}}",
        s,
    )

    # Insert explicit * between adjacent tokens (Chacana requires explicit
    # multiplication). Handles: T{...} T{...}, T{...} scalar, scalar T{...},
    # and bare-name juxtaposition. Supports both ASCII and Greek letters.
    _L = LETTER_CLASS
    # Pattern: } followed by space and letter/digit/(
    s = re.sub(rf"}}(\s+)(?=[{_L}0-9(])", lambda m: f"}} *{m.group(1)}", s)
    # Pattern: digit followed by space and letter
    s = re.sub(rf"(\b\d+)(\s+)(?=[{_L}])", lambda m: f"{m.group(1)} *{m.group(2)}", s)
    # Pattern: letter followed by space and letter (bare tensor names)
    s = re.sub(
        rf"([{_L}])(\s+)(?=[{_L}]\w*(?:\{{|$))",
        lambda m: f"{m.group(1)} *{m.group(2)}",
        s,
    )

    # Clean up whitespace
    s = re.sub(r"\s+", " ", s).strip()
    # Remove spaces after ( and before )
    s = re.sub(r"\(\s+", "(", s)
    s = re.sub(r"\s+\)", ")", s)

    return FromLatexResult(ok=True, value=s)
