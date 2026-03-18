"""Tests for AST data model."""

from chacana.ast import ChacanaIndex, ValidationToken, Variance


class TestChacanaIndex:
    def test_to_dict_contra(self):
        idx = ChacanaIndex(label="a", variance=Variance.CONTRA)
        assert idx.to_dict() == {"label": "a", "variance": "Contra", "type": "Latin"}

    def test_to_dict_covar(self):
        idx = ChacanaIndex(label="b", variance=Variance.COVAR)
        assert idx.to_dict() == {"label": "b", "variance": "Covar", "type": "Latin"}

    def test_frozen(self):
        idx = ChacanaIndex(label="a", variance=Variance.CONTRA)
        import pytest
        with pytest.raises(AttributeError):
            idx.label = "b"


class TestValidationToken:
    def test_leaf_tensor(self):
        token = ValidationToken(
            head="R",
            indices=[
                ChacanaIndex("a", Variance.CONTRA),
                ChacanaIndex("b", Variance.COVAR),
                ChacanaIndex("c", Variance.COVAR),
                ChacanaIndex("d", Variance.COVAR),
            ],
        )
        d = token.to_dict()
        assert d["head"] == "R"
        assert len(d["indices"]) == 4
        assert d["type"] == "TensorExpression"
        assert d["indices"][0] == {"label": "a", "variance": "Contra", "type": "Latin"}
        assert "value" not in d

    def test_sum(self):
        a = ValidationToken(head="A")
        b = ValidationToken(head="B")
        token = ValidationToken(head="Add", args=[a, b])
        d = token.to_dict()
        assert d["type"] == "TensorExpression"
        assert d["head"] == "Add"
        assert len(d["args"]) == 2
        assert "indices" not in d

    def test_scalar(self):
        token = ValidationToken(head="Number", value=3.14)
        d = token.to_dict()
        assert d["type"] == "TensorExpression"
        assert d["head"] == "Number"
        assert d["value"] == 3.14
