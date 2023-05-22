// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
// const crabviz = await import('../../../pkg/crabviz');
import { graphviz } from '@hpcc-js/wasm';
import { groupFileExtensions } from './utils/languages';
import { convertSymbol } from './utils/lspTypesConversion';
import { retryCommand } from './utils/command';
import { ignoredExtensions, readIgnoreRules } from './utils/ignores';

// wasmFolder("https://cdn.jsdelivr.net/npm/@hpcc-js/wasm/dist");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('crabviz.generateCallGraph', async (entry: vscode.Uri | undefined) => {
		let cancelled = false;

		const ignores = await readIgnoreRules();

		let scanPath: string | vscode.RelativePattern = '**';
		if (entry !== undefined) {
			let folder = vscode.workspace.workspaceFolders!
				.find(folder => entry.path.startsWith(folder.uri.path))!
				.uri
				.path;

			scanPath = new vscode.RelativePattern(folder, `${path.relative(folder, entry.path)}/**`);
		}

		const extensions = await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Detecting project languages",
			cancellable: true
		}, (_, token) => {
			token.onCancellationRequested(() => {
				cancelled = true;
			});
			return collectFileExtensions(scanPath, token, ignores);
		});;

		if (cancelled) {
			return;
		}

		const extensionsByLanguage = groupFileExtensions(extensions);

		const selections = Object.keys(extensionsByLanguage).map(lang => ({ label: lang }));
		let lang: string;
		if (selections.length > 1) {
			const selectedItem = await vscode.window.showQuickPick(selections, {
				title: "Pick a language to generate call graph",
			});

			if (!selectedItem) {
				return;
			}
			lang = selectedItem.label;
		} else if (selections.length === 1) {
			lang = selections[0].label;
		} else {
			// TODO: user input
			return;
		}

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Crabviz: Generating call graph",
		}, _ => {
			let include: string | vscode.RelativePattern;
			if (typeof scanPath === 'string') {
				include = scanPath + `/*.{${extensionsByLanguage[lang].join(',')}}`;
			} else {
				include = new vscode.RelativePattern(scanPath.baseUri, `${scanPath.pattern}/*.{${extensionsByLanguage[lang].join(',')}}`);
			}

			const exclude = `{${ignores.join(',')}}`;
			return generateCallGraph(context, include, exclude);
		});
	});

	context.subscriptions.push(disposable);
}

async function generateCallGraph(context: vscode.ExtensionContext, include: string | vscode.RelativePattern, exclude: string) {
	const crabviz = await import('../../../pkg');
	crabviz.set_panic_hook();
	let generator = new crabviz.GraphGenerator();

	const files = await vscode.workspace.findFiles(include, exclude);

	for await (const file of files) {
		// retry several times if the LSP server is not ready
		let symbols = await retryCommand<vscode.DocumentSymbol[]>(5, 600, 'vscode.executeDocumentSymbolProvider', file);
		if (symbols === undefined) {
			vscode.window.showErrorMessage(`Document symbol information not available for '${file.fsPath}'`);
			continue;
		}

		let lspSymbols = symbols.map(convertSymbol);
		generator.add_file(file.path, lspSymbols);

		while (symbols.length > 0) {
			for await (const symbol of symbols) {
				if (![vscode.SymbolKind.Function, vscode.SymbolKind.Method, vscode.SymbolKind.Constructor, vscode.SymbolKind.Interface].includes(symbol.kind)) {
					continue;
				}

				let items: vscode.CallHierarchyItem[];
				try {
					items = await vscode.commands.executeCommand<vscode.CallHierarchyItem[]>('vscode.prepareCallHierarchy', file, symbol.selectionRange.start);
				} catch (e) {
					vscode.window.showErrorMessage(`${e}\n${file}\n${symbol.name}`);
					continue;
				}

				for await (const item of items) {
					await vscode.commands.executeCommand<vscode.CallHierarchyOutgoingCall[]>('vscode.provideOutgoingCalls', item)
						.then(outgoings => {
							generator.add_outgoing_calls(file.path, item.selectionRange.start, outgoings);
						})
						.then(undefined, err => {
							console.error(err);
						});
				}

				if (symbol.kind === vscode.SymbolKind.Interface) {
					await vscode.commands.executeCommand<vscode.Location[] | vscode.LocationLink[]>('vscode.executeImplementationProvider', file, symbol.selectionRange.start)
						.then(result => {
							if (result.length <= 0) {
								return;
							}

							let locations: vscode.Location[];
							if (!(result[0] instanceof vscode.Location)) {
								locations = result.map(l => {
									let link = l as vscode.LocationLink;
									return new vscode.Location(link.targetUri, link.targetSelectionRange ?? link.targetRange);
								});
							} else {
								locations = result as vscode.Location[];
							}
							generator.add_interface_implementations(file.path, symbol.selectionRange.start, locations);
						})
						.then(undefined, err => {
							console.log(err);
						});
				}
			}

			symbols = symbols.flatMap(symbol => symbol.children);
		}
	}

	const panel = vscode.window.createWebviewPanel('crabviz', 'crabviz', vscode.ViewColumn.One, {
		localResourceRoots: [
			vscode.Uri.joinPath(context.extensionUri, 'media')
		],
		enableScripts: true
	});
	const dot = generator.generate_dot_source();

	await activateWebviewPanel(context, panel, dot);
}

async function collectFileExtensions(scanPath: string | vscode.RelativePattern, token: vscode.CancellationToken, ignores: string[]): Promise<Set<string>> {
	const extensions: Set<string> = new Set();

	let files: vscode.Uri[];
	let exclude = undefined;

	let include: string | vscode.RelativePattern;
	if (typeof scanPath === 'string') {
		include = scanPath + '/*.*';
	} else {
		include = new vscode.RelativePattern(scanPath.baseUri, `${scanPath.pattern}/*.*`);
	}

	while (true) {
		exclude = `{${Array.from(extensions).concat(ignoredExtensions).map(ext => `**/*.${ext}`).concat(ignores).join(',')}}`;

		files = await vscode.workspace.findFiles(include, exclude, 1, token);
		if (files.length <= 0 || token.isCancellationRequested) {
			break;
		}

		const ext = files[0].path.split('.').pop()!;
		extensions.add(ext);
	}

	return extensions;
}

async function activateWebviewPanel(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, dot: string) {
	const svg = await graphviz.dot(dot);
	panel.webview.html = getWebviewContent(context, panel.webview, svg);
}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview, svg: String) {
	const resourceUri = vscode.Uri.joinPath(context.extensionUri, 'media');
	const stylesPath = vscode.Uri.joinPath(resourceUri, 'styles.css');
	const preprocessJsPath = vscode.Uri.joinPath(resourceUri, 'preprocess.js');
	const svgPanZoomJsPath = vscode.Uri.joinPath(resourceUri, 'svg-pan-zoom.min.js');

	const stylesUri = webview.asWebviewUri(stylesPath);
	const preprossessJsUri = webview.asWebviewUri(preprocessJsPath);
	const svgPanZoomJsUri = webview.asWebviewUri(svgPanZoomJsPath);

	const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" href="${stylesUri}">
		<script nonce="${nonce}" src="${svgPanZoomJsUri}"></script>
    <title>crabviz</title>
</head>
<body>
<body>
    ${svg}
		<script nonce="${nonce}" src="${preprossessJsUri}"></script>
</body>
</html>`;
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

// This method is called when your extension is deactivated
export function deactivate() {}
