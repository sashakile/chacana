import { describe, it, expect } from "vitest";
import {
  Variance,
  IndexType,
  detectIndexType,
  makeToken,
  HEAD_ADD,
  HEAD_MULTIPLY,
  FUNCTIONAL_OP_MAP,
  STRUCTURAL_HEADS,
  type ChacanaIndex,
} from "../../src/server/ast.js";

describe("AST types", () => {
  it("creates a simple token", () => {
    const token = makeToken("R");
    expect(token.head).toBe("R");
    expect(token.args).toEqual([]);
    expect(token.indices).toEqual([]);
    expect(token.value).toBeNull();
  });

  it("creates a token with indices", () => {
    const indices: ChacanaIndex[] = [
      { label: "a", variance: Variance.Contra, indexType: IndexType.Latin, isDerivative: false, derivativeType: null },
      { label: "b", variance: Variance.Covar, indexType: IndexType.Latin, isDerivative: false, derivativeType: null },
    ];
    const token = makeToken("T", [], indices);
    expect(token.indices).toHaveLength(2);
    expect(token.indices[0].variance).toBe(Variance.Contra);
    expect(token.indices[1].variance).toBe(Variance.Covar);
  });

  it("creates a sum token with args", () => {
    const a = makeToken("A");
    const b = makeToken("B");
    const sum = makeToken(HEAD_ADD, [a, b]);
    expect(sum.head).toBe("Add");
    expect(sum.args).toHaveLength(2);
  });

  it("creates a product token", () => {
    const token = makeToken(HEAD_MULTIPLY, [makeToken("A"), makeToken("B")]);
    expect(token.head).toBe("Multiply");
  });

  it("detects Latin index type", () => {
    expect(detectIndexType("a")).toBe(IndexType.Latin);
    expect(detectIndexType("abc")).toBe(IndexType.Latin);
    expect(detectIndexType("R")).toBe(IndexType.Latin);
  });

  it("detects Greek index type", () => {
    expect(detectIndexType("α")).toBe(IndexType.Greek);
    expect(detectIndexType("β")).toBe(IndexType.Greek);
    expect(detectIndexType("Γ")).toBe(IndexType.Greek);
  });

  it("maps functional operators to canonical heads", () => {
    expect(FUNCTIONAL_OP_MAP["d"]).toBe("ExteriorDerivative");
    expect(FUNCTIONAL_OP_MAP["L"]).toBe("LieDerivative");
    expect(FUNCTIONAL_OP_MAP["Tr"]).toBe("Trace");
    expect(FUNCTIONAL_OP_MAP["det"]).toBe("Determinant");
    expect(FUNCTIONAL_OP_MAP["inv"]).toBe("Inverse");
    expect(FUNCTIONAL_OP_MAP["star"]).toBe("HodgeStar");
    expect(FUNCTIONAL_OP_MAP["hodge"]).toBe("HodgeStar");
    expect(FUNCTIONAL_OP_MAP["i"]).toBe("InteriorProduct");
  });

  it("structural heads are not tensor names", () => {
    expect(STRUCTURAL_HEADS.has("Add")).toBe(true);
    expect(STRUCTURAL_HEADS.has("Multiply")).toBe(true);
    expect(STRUCTURAL_HEADS.has("R")).toBe(false);
  });
});
