import * as vscode from 'vscode';
import { initialize } from 'codetwin';
import { CallGraphPanel } from './webview';
import { CommandManager } from './command-manager';

/**
 * Activates the extension.
 * 
 * @param context The extension context.
 */
export async function activate(context: vscode.ExtensionContext) {
	try {
		// Initialize codetwin
		await initialize();
	} catch (error) {
		vscode.window.showErrorMessage('Failed to initialize: ' + error);
		return;
	}

	// Initialize command manager
	const manager = new CommandManager(context);
	
	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('codetwin.generateCallGraph', manager.generateCallGraph.bind(manager)),
		vscode.commands.registerTextEditorCommand('codetwin.generateFuncCallGraph', manager.generateFuncCallGraph.bind(manager)),
		vscode.commands.registerCommand('codetwin.exportCallGraph', () => {
			CallGraphPanel.currentPanel?.exportSVG();
		})
	);
}

export function deactivate() {
    // Clean up resources
}
