"""Tests for differential geometry operator type checking.

Covers spec requirements from openspec/specs/differential-geometry/spec.md:
- Exterior calculus: d, hodge/star, interior product (i)
- Lie derivative: L
- Algebraic operators: Tr, det, inv
"""

import pytest

from chacana.checker import check
from chacana.errors import ChacanaTypeError
from tests.helpers import make_token as _make_token

# ===========================================================================
# Visitor: head_map entries
# ===========================================================================


class TestVisitorHeadMap:
    """Visitor maps operator identifiers to canonical head names."""

    def test_hodge_maps_to_HodgeStar(self):
        token = _make_token("hodge(omega)")
        assert token.head == "HodgeStar"

    def test_star_maps_to_HodgeStar(self):
        token = _make_token("star(omega)")
        assert token.head == "HodgeStar"

    def test_i_maps_to_InteriorProduct(self):
        token = _make_token("i(X, omega)")
        assert token.head == "InteriorProduct"

    def test_d_maps_to_ExteriorDerivative(self):
        token = _make_token("d(omega)")
        assert token.head == "ExteriorDerivative"

    def test_L_maps_to_LieDerivative(self):
        token = _make_token("L(X, g)")
        assert token.head == "LieDerivative"

    def test_Tr_maps_to_Trace(self):
        token = _make_token("Tr(T)")
        assert token.head == "Trace"

    def test_det_maps_to_Determinant(self):
        token = _make_token("det(g)")
        assert token.head == "Determinant"

    def test_inv_maps_to_Inverse(self):
        token = _make_token("inv(T)")
        assert token.head == "Inverse"


# ===========================================================================
# Exterior Derivative
# ===========================================================================


class TestExteriorDerivative:
    """d(expr) — the exterior derivative."""

    def test_d_of_wedge_parses(self, diffgeom_context):
        """Spec: d(A ^ B) must parse and type-check."""
        token = _make_token("d(A ^ B)")
        assert token.head == "ExteriorDerivative"
        check(token, diffgeom_context)

    def test_d_of_form_passes(self, diffgeom_context):
        token = _make_token("d(omega)")
        check(token, diffgeom_context)

    def test_d_without_context(self):
        """d(omega) passes structural checks without context; operator checks skipped."""
        token = _make_token("d(omega)")
        result = check(token)  # structural checks only (no ctx)
        assert result is token


# ===========================================================================
# Hodge Star
# ===========================================================================


class TestHodgeStar:
    """hodge(omega) / star(omega) — requires active_metric."""

    def test_hodge_with_active_metric_passes(self, diffgeom_context):
        """Spec: hodge(omega) with active_metric in context passes."""
        token = _make_token("hodge(omega)")
        check(token, diffgeom_context)

    def test_star_with_active_metric_passes(self, diffgeom_context):
        """star(omega) is a synonym for hodge(omega)."""
        token = _make_token("star(omega)")
        check(token, diffgeom_context)

    def test_hodge_without_active_metric_fails(self, no_metric_context):
        """Spec: hodge(omega) without active_metric must raise ChacanaTypeError."""
        token = _make_token("hodge(omega)")
        pat = "[Hh]odge.*metric|metric.*[Hh]odge|active_metric"
        with pytest.raises(ChacanaTypeError, match=pat):
            check(token, no_metric_context)

    def test_star_without_active_metric_fails(self, no_metric_context):
        """star(omega) without active_metric must raise ChacanaTypeError."""
        token = _make_token("star(omega)")
        pat = "[Hh]odge.*metric|metric.*[Hh]odge|active_metric"
        with pytest.raises(ChacanaTypeError, match=pat):
            check(token, no_metric_context)

    def test_hodge_without_any_context(self):
        """hodge(omega) passes structural checks without context; metric check skipped."""
        token = _make_token("hodge(omega)")
        result = check(token)  # structural checks only (no ctx)
        assert result is token


# ===========================================================================
# Interior Product
# ===========================================================================


class TestInteriorProduct:
    """i(X, omega) — interior product."""

    def test_interior_product_vector_and_form(self, diffgeom_context):
        """Spec: i(X, omega) with vector X and 1-form omega passes."""
        token = _make_token("i(X, omega)")
        check(token, diffgeom_context)

    def test_interior_product_rank_mismatch_scalar(self, diffgeom_context):
        """Spec: i(X, f) where f is 0-form must raise ChacanaTypeError."""
        token = _make_token("i(X, f)")
        with pytest.raises(ChacanaTypeError, match="[Ii]nterior.*0-form|rank.*0|undefined.*0"):
            check(token, diffgeom_context)

    def test_interior_product_without_context(self):
        """i(X, omega) passes structural checks without context; vector check skipped."""
        token = _make_token("i(X, omega)")
        result = check(token)  # structural checks only (no ctx)
        assert result is token

    def test_interior_product_first_arg_must_be_vector(self, diffgeom_context):
        """First arg of i(...) must be a vector (rank 1, contravariant)."""
        # omega is a 1-form (covariant), not a vector
        token = _make_token("i(omega, omega)")
        pat = "[Ii]nterior.*vector|first.*vector|contravariant"
        with pytest.raises(ChacanaTypeError, match=pat):
            check(token, diffgeom_context)


# ===========================================================================
# Lie Derivative
# ===========================================================================


class TestLieDerivative:
    """L(X, T) — Lie derivative."""

    def test_lie_derivative_of_metric(self, diffgeom_context):
        """Spec: L(X, g{_a _b}) with vector X passes."""
        token = _make_token("L(X, g{_a _b})")
        check(token, diffgeom_context)

    def test_lie_derivative_scalar_first_arg(self, diffgeom_context):
        """Spec: L(f, T) where f is scalar must raise ChacanaTypeError."""
        token = _make_token("L(f, T{^a _b})")
        with pytest.raises(ChacanaTypeError, match="[Ll]ie.*vector|first.*vector"):
            check(token, diffgeom_context)

    def test_lie_derivative_form_first_arg(self, diffgeom_context):
        """L(omega, T) where omega is a 1-form (covariant) must fail."""
        token = _make_token("L(omega, T{^a _b})")
        with pytest.raises(ChacanaTypeError, match="[Ll]ie.*vector|first.*vector|contravariant"):
            check(token, diffgeom_context)

    def test_lie_derivative_without_context(self):
        """L(X, T) passes structural checks without context; vector check skipped."""
        token = _make_token("L(X, T)")
        result = check(token)  # structural checks only (no ctx)
        assert result is token


# ===========================================================================
# Trace
# ===========================================================================


class TestTrace:
    """Tr(T) — trace of a tensor."""

    def test_trace_mixed_tensor(self, diffgeom_context):
        """Spec: Tr(T{^a _b}) — mixed tensor, passes."""
        token = _make_token("Tr(T{^a _b})")
        check(token, diffgeom_context)

    def test_trace_bare_mixed_tensor(self, diffgeom_context):
        """Tr(T) where T is declared mixed (Contra, Covar) passes."""
        token = _make_token("Tr(T)")
        check(token, diffgeom_context)

    def test_trace_covariant_with_metric_passes(self, diffgeom_context):
        """Tr(g{_a _b}) — covariant tensor is OK with active_metric."""
        token = _make_token("Tr(g{_a _b})")
        assert check(token, diffgeom_context) is token

    def test_trace_rank0_fails(self, diffgeom_context):
        """Tr(f) where f is rank 0 — trace needs at least rank 2."""
        token = _make_token("Tr(f)")
        with pytest.raises(ChacanaTypeError, match="[Tt]race.*rank|rank.*[Tt]race"):
            check(token, diffgeom_context)

    def test_trace_without_context(self):
        """Tr(T) passes structural checks without context; rank check skipped."""
        token = _make_token("Tr(T)")
        result = check(token)  # structural checks only (no ctx)
        assert result is token


# ===========================================================================
# Determinant
# ===========================================================================


class TestDeterminant:
    """det(T) — determinant."""

    def test_det_rank2(self, diffgeom_context):
        """Spec: det(g{_a _b}) — rank 2, passes."""
        token = _make_token("det(g{_a _b})")
        check(token, diffgeom_context)

    def test_det_bare_rank2(self, diffgeom_context):
        """det(g) where g is declared rank 2 passes."""
        token = _make_token("det(g)")
        check(token, diffgeom_context)

    def test_det_rank3_fails(self, diffgeom_context):
        """Spec: det of a rank-3 tensor must fail."""
        token = _make_token("det(S)")
        with pytest.raises(ChacanaTypeError, match="[Dd]et.*rank.*2|rank.*[Dd]et"):
            check(token, diffgeom_context)

    def test_det_without_context(self):
        """det(T) passes structural checks without context; rank check skipped."""
        token = _make_token("det(T)")
        result = check(token)  # structural checks only (no ctx)
        assert result is token


# ===========================================================================
# Inverse
# ===========================================================================


class TestInverse:
    """inv(T) — matrix inverse."""

    def test_inv_rank2(self, diffgeom_context):
        """inv(T{_a _b}) — rank 2, passes."""
        token = _make_token("inv(g{_a _b})")
        check(token, diffgeom_context)

    def test_inv_bare_rank2(self, diffgeom_context):
        """inv(g) where g is declared rank 2 passes."""
        token = _make_token("inv(g)")
        check(token, diffgeom_context)

    def test_inv_rank3_fails(self, diffgeom_context):
        """Spec: inv(T{_a _b _c}) — non-rank-2 must fail."""
        token = _make_token("inv(S)")
        with pytest.raises(ChacanaTypeError, match="[Ii]nv.*rank.*2|rank.*[Ii]nv"):
            check(token, diffgeom_context)

    def test_inv_rank1_fails(self, diffgeom_context):
        """inv(X) where X is rank 1 must fail."""
        token = _make_token("inv(X)")
        with pytest.raises(ChacanaTypeError, match="[Ii]nv.*rank.*2|rank.*[Ii]nv"):
            check(token, diffgeom_context)

    def test_inv_without_context(self):
        """inv(T) passes structural checks without context; rank check skipped."""
        token = _make_token("inv(T)")
        result = check(token)  # structural checks only (no ctx)
        assert result is token


# ===========================================================================
# Integration: end-to-end via chacana.parse()
# ===========================================================================


class TestDiffGeomEndToEnd:
    """End-to-end tests using the public chacana.parse() API."""

    def test_hodge_e2e_with_metric(self, diffgeom_context):
        import chacana

        result = chacana.parse("hodge(omega)", context=diffgeom_context)
        assert result["head"] == "HodgeStar"

    def test_hodge_e2e_without_metric_fails(self, no_metric_context):
        import chacana

        pat = "[Hh]odge.*metric|metric.*[Hh]odge|active_metric"
        with pytest.raises(ChacanaTypeError, match=pat):
            chacana.parse("hodge(omega)", context=no_metric_context)

    def test_interior_product_e2e(self, diffgeom_context):
        import chacana

        result = chacana.parse("i(X, omega)", context=diffgeom_context)
        assert result["head"] == "InteriorProduct"

    def test_lie_derivative_e2e(self, diffgeom_context):
        import chacana

        result = chacana.parse("L(X, g{_a _b})", context=diffgeom_context)
        assert result["head"] == "LieDerivative"

    def test_trace_e2e(self, diffgeom_context):
        import chacana

        result = chacana.parse("Tr(T{^a _b})", context=diffgeom_context)
        assert result["head"] == "Trace"

    def test_det_e2e(self, diffgeom_context):
        import chacana

        result = chacana.parse("det(g{_a _b})", context=diffgeom_context)
        assert result["head"] == "Determinant"

    def test_inv_e2e(self, diffgeom_context):
        import chacana

        result = chacana.parse("inv(g{_a _b})", context=diffgeom_context)
        assert result["head"] == "Inverse"
