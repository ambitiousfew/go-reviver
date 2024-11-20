import path from 'path';
import * as vscode from 'vscode';
import { GoLintConfig } from './types/config';

import { runLinter } from './commands/lint';
import { configHasChanged, getExtensionConfig, processConfig } from './utils/config';

const outputChannel = vscode.window.createOutputChannel('Go Reviver');
const diagnosticCollection = vscode.languages.createDiagnosticCollection('reviveLinter');

let cachedConfig: GoLintConfig | undefined;


export function activate(context: vscode.ExtensionContext) {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspaceFolder) {
		// console.error("No workspace is open.");
    return;
	}

	const golintConfig = vscode.workspace.getConfiguration('reviver');
	if(!golintConfig.get('enable')) {
		// extension is disabled
		// console.error("reviver extension is disabled");
		return;
	}

	// retrieve the initial extension configuration values
	const unprocessedConfig = getExtensionConfig('revive');

	// console.log("No cached linter command found, processing config flags");
	processConfig(unprocessedConfig)
		.then((conf: GoLintConfig) => {
			// cache the processed config
			cachedConfig = conf;
		})
		.catch((e) => {	
			return;
		})


	// Listener for changes to settings.json
	const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
		if(!configHasChanged(e)) {
			return
		}
		// change detected, re-retrieve the config for the extension
		const unprocessedConfig = getExtensionConfig('revive');
		processConfig(unprocessedConfig)
		.then((conf: GoLintConfig) => {
			cachedConfig = conf;
			if(!conf.enabled){
				vscode.window.showWarningMessage(`Unable to run, could not find a valid configuration for: ${conf.lintTool} ${conf.lintFlags.join(' ')} `);
			}
		})
		.catch((e) => {	
			// console.error("Error processing config flags: ", e);
			return;
		})
	});


	// Listener for file saves against any .go file
	const saveListener = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		if (document.languageId !== 'go') {
			// not a go file, just ignore it.
			return;
		}

		if (!cachedConfig) {
			// we have no cached config yet, so we can't run the linter
			// console.error("No cached config found");
			return;
		}

		// get the parent directory of the document we are saving
		const cwd = path.dirname(document.uri.fsPath);

		// dont run the linter if the config couldnt process the configs correctly
		if(!cachedConfig.enabled) {
			// log a line for this in the output channel
			return;
		}

		// attempt to run the linter with the cached config
		runLinter(cachedConfig, cwd, diagnosticCollection);
	});

	// register the listeners with the context
	context.subscriptions.push(configChangeListener);
	context.subscriptions.push(saveListener);
}

// This method is called when your extension is deactivated
export function deactivate() {
	outputChannel.dispose();
	diagnosticCollection.clear();
	diagnosticCollection.dispose();
}
