import * as esbuild from "esbuild";
import { cpSync } from "fs";

const watch = process.argv.includes("--watch");

/** @type {esbuild.BuildOptions} */
const shared = {
  bundle: true,
  sourcemap: true,
  minify: !watch,
  platform: "node",
  target: "node18",
  external: ["vscode"],
  logLevel: "info",
};

const clientOpts = {
  ...shared,
  entryPoints: ["src/client/extension.ts"],
  outfile: "dist/client/extension.js",
  format: "cjs",
};

const serverOpts = {
  ...shared,
  entryPoints: ["src/server/server.ts"],
  outfile: "dist/server/server.js",
  format: "cjs",
};

if (watch) {
  const [clientCtx, serverCtx] = await Promise.all([
    esbuild.context(clientOpts),
    esbuild.context(serverOpts),
  ]);
  await Promise.all([clientCtx.watch(), serverCtx.watch()]);
  // Copy WASM once at start
  cpSync("wasm", "dist/wasm", { recursive: true });
  console.log("Watching for changes...");
} else {
  // Browser bundle for docs playground (IIFE, no Node deps)
  const browserOpts = {
    bundle: true,
    sourcemap: true,
    minify: true,
    platform: "browser",
    target: "es2020",
    entryPoints: ["src/browser/index.ts"],
    outfile: "dist/browser/chacana-checker.js",
    format: "iife",
    globalName: "ChacanaChecker",
    logLevel: "info",
  };

  await Promise.all([
    esbuild.build(clientOpts),
    esbuild.build(serverOpts),
    esbuild.build(browserOpts),
  ]);
  cpSync("wasm", "dist/wasm", { recursive: true });
}
