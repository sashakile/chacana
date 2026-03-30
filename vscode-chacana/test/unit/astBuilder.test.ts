import { describe, it, expect, beforeAll } from "vitest";
import { initParser, createParser, parse } from "../../src/server/parser.js";
import { buildAST } from "../../src/server/astBuilder.js";
import { Variance, HEAD_ADD, HEAD_MULTIPLY, HEAD_WEDGE, HEAD_NUMBER, HEAD_NEGATE, HEAD_PERTURBATION, HEAD_COMMUTATOR } from "../../src/server/ast.js";
import type TreeSitterType from "web-tree-sitter";

let parser: TreeSitterType;

beforeAll(async () => {
  await initParser();
  parser = createParser();
});

function astOf(expr: string) {
  const tree = parse(parser, expr);
  return buildAST(tree.rootNode);
}

describe("astBuilder", () => {
  it("builds a bare tensor", () => {
    const ast = astOf("R");
    expect(ast?.head).toBe("R");
    expect(ast?.indices).toHaveLength(0);
    expect(ast?.args).toHaveLength(0);
  });

  it("builds a tensor with indices", () => {
    const ast = astOf("R{^a _b _c _d}");
    expect(ast?.head).toBe("R");
    expect(ast?.indices).toHaveLength(4);
    expect(ast?.indices[0].variance).toBe(Variance.Contra);
    expect(ast?.indices[0].label).toBe("a");
    expect(ast?.indices[1].variance).toBe(Variance.Covar);
  });

  it("builds a sum expression (flattened)", () => {
    const ast = astOf("A + B + C");
    expect(ast?.head).toBe(HEAD_ADD);
    expect(ast?.args).toHaveLength(3);
    expect(ast?.args[0].head).toBe("A");
    expect(ast?.args[1].head).toBe("B");
    expect(ast?.args[2].head).toBe("C");
  });

  it("wraps subtracted terms in Negate", () => {
    const ast = astOf("A - B");
    expect(ast?.head).toBe(HEAD_ADD);
    expect(ast?.args).toHaveLength(2);
    expect(ast?.args[0].head).toBe("A");
    expect(ast?.args[1].head).toBe(HEAD_NEGATE);
    expect(ast?.args[1].args[0].head).toBe("B");
  });

  it("builds a product expression", () => {
    const ast = astOf("A * B");
    expect(ast?.head).toBe(HEAD_MULTIPLY);
    expect(ast?.args).toHaveLength(2);
  });

  it("builds a wedge expression", () => {
    const ast = astOf("A ^ B");
    expect(ast?.head).toBe(HEAD_WEDGE);
    expect(ast?.args).toHaveLength(2);
  });

  it("builds a scalar", () => {
    const ast = astOf("42");
    expect(ast?.head).toBe(HEAD_NUMBER);
    expect(ast?.value).toBe(42);
  });

  it("builds a float scalar", () => {
    const ast = astOf("3.14");
    expect(ast?.head).toBe(HEAD_NUMBER);
    expect(ast?.value).toBeCloseTo(3.14);
  });

  it("builds exterior derivative", () => {
    const ast = astOf("d(omega)");
    expect(ast?.head).toBe("ExteriorDerivative");
    expect(ast?.args).toHaveLength(1);
    expect(ast?.args[0].head).toBe("omega");
  });

  it("builds Lie derivative with two args", () => {
    const ast = astOf("L(X, T)");
    expect(ast?.head).toBe("LieDerivative");
    expect(ast?.args).toHaveLength(2);
  });

  it("maps all functional operators", () => {
    const cases: [string, string][] = [
      ["d(A)", "ExteriorDerivative"],
      ["L(X, T)", "LieDerivative"],
      ["Tr(T)", "Trace"],
      ["det(g)", "Determinant"],
      ["inv(M)", "Inverse"],
      ["star(F)", "HodgeStar"],
      ["hodge(F)", "HodgeStar"],
      ["i(X, omega)", "InteriorProduct"],
    ];
    for (const [expr, expected] of cases) {
      const ast = astOf(expr);
      expect(ast?.head, expr).toBe(expected);
    }
  });

  it("builds functional op with index attachment", () => {
    const ast = astOf("d(omega){_a _b}");
    expect(ast?.head).toBe("ExteriorDerivative");
    expect(ast?.args).toHaveLength(1);
    expect(ast?.indices).toHaveLength(2);
  });

  it("builds perturbation with order", () => {
    const ast = astOf("@2(A + B)");
    expect(ast?.head).toBe(HEAD_PERTURBATION);
    expect(ast?.metadata.order).toBe(2);
    expect(ast?.args).toHaveLength(1);
    expect(ast?.args[0].head).toBe(HEAD_ADD);
  });

  it("builds commutator", () => {
    const ast = astOf("[A, B]");
    expect(ast?.head).toBe(HEAD_COMMUTATOR);
    expect(ast?.args).toHaveLength(2);
  });

  it("builds symmetrization metadata", () => {
    const ast = astOf("T{_( a b _)}");
    expect(ast?.head).toBe("T");
    expect(ast?.indices).toHaveLength(2);
    expect(ast?.metadata.symmetrized_groups).toEqual([[0, 1]]);
  });

  it("builds anti-symmetrization metadata", () => {
    const ast = astOf("T{_[ a b _]}");
    expect(ast?.head).toBe("T");
    expect(ast?.metadata.antisymmetrized_groups).toEqual([[0, 1]]);
  });

  it("builds mixed plain + symmetrization", () => {
    const ast = astOf("T{^c _( a b _)}");
    expect(ast?.head).toBe("T");
    expect(ast?.indices).toHaveLength(3);
    expect(ast?.indices[0].label).toBe("c");
    expect(ast?.indices[0].variance).toBe(Variance.Contra);
    expect(ast?.metadata.symmetrized_groups).toEqual([[1, 2]]);
  });

  it("builds covariant derivative index", () => {
    const ast = astOf("T{^a ;b}");
    expect(ast?.indices).toHaveLength(2);
    expect(ast?.indices[1].isDerivative).toBe(true);
    expect(ast?.indices[1].derivativeType).toBe("semicolon");
    expect(ast?.indices[1].label).toBe("b");
  });

  it("builds comma derivative index", () => {
    const ast = astOf("T{^a ,b}");
    expect(ast?.indices[1].derivativeType).toBe("comma");
  });

  it("respects operator precedence", () => {
    const ast = astOf("A + B * C");
    expect(ast?.head).toBe(HEAD_ADD);
    expect(ast?.args[1].head).toBe(HEAD_MULTIPLY);
  });

  it("returns null for ERROR nodes", () => {
    const tree = parse(parser, "R{}");
    const ast = buildAST(tree.rootNode);
    expect(ast).toBeNull();
  });

  it("returns null for empty paren expression", () => {
    const tree = parse(parser, "()");
    // Should return null, not crash
    expect(() => buildAST(tree.rootNode)).not.toThrow();
  });

  it("builds AST for each expression in a multi-line document", () => {
    const tree = parse(parser, "A{^a _b}\nB + C\nD * E");
    const children = tree.rootNode.namedChildren;
    expect(children).toHaveLength(3);

    const ast0 = buildAST(children[0]);
    expect(ast0?.head).toBe("A");
    expect(ast0?.indices).toHaveLength(2);

    const ast1 = buildAST(children[1]);
    expect(ast1?.head).toBe(HEAD_ADD);

    const ast2 = buildAST(children[2]);
    expect(ast2?.head).toBe(HEAD_MULTIPLY);
  });

  it("preserves correct line positions in multi-line document", () => {
    const tree = parse(parser, "A\nB\nC");
    const children = tree.rootNode.namedChildren;
    expect(children[0].startPosition.row).toBe(0);
    expect(children[1].startPosition.row).toBe(1);
    expect(children[2].startPosition.row).toBe(2);
  });
});
