/**
 * Chacana VS Code extension client.
 * Starts the LSP server and connects to it.
 */

import * as path from "path";
import { workspace, type ExtensionContext } from "vscode";
import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from "vscode-languageclient/node.js";

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext): void {
  const serverModule = context.asAbsolutePath(
    path.join("dist", "server", "server.js"),
  );

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ["--nolazy", "--inspect=6009"] },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "chacana" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.toml"),
    },
  };

  client = new LanguageClient(
    "chacana",
    "Chacana Language Server",
    serverOptions,
    clientOptions,
  );

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop();
}
