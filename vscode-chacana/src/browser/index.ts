/**
 * Browser entry point for the Chacana checker.
 * Exports the public API as a global `ChacanaChecker` object for use
 * in the docs playground and other browser contexts.
 */

export { buildAST } from "../server/astBuilder.js";
export { checkAll, type CheckerDiagnostic } from "../server/checker.js";
export { loadContext, type GlobalContext } from "../server/context.js";
export {
  type ValidationToken,
  type ChacanaIndex,
  Variance,
  IndexType,
  HEAD_ADD,
  HEAD_MULTIPLY,
  STRUCTURAL_HEADS,
} from "../server/ast.js";
