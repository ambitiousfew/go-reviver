import path from 'path';
import * as vscode from 'vscode';
import { ReviverConfig } from './types/config';

import { runLinter } from './commands/lint';
import { configHasChanged, getExtensionConfig, processConfig } from './utils/config';
import { formatLog } from './utils/logging';
import { LogType } from './types/log';

const outputChannel = vscode.window.createOutputChannel('Go Reviver');
const diagnosticCollection = vscode.languages.createDiagnosticCollection('reviveLinter');

let cachedConfig: ReviverConfig | undefined;
let extensionEnabled: boolean = false;
let lintOnSave: boolean = false;


export function activate(context: vscode.ExtensionContext) {
	outputChannel.appendLine(formatLog("reviver extension activated", LogType.INFO));

	const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspaceFolder) {
		outputChannel.appendLine(formatLog("No workspace is open.", LogType.ERROR));
    return;
	}

	// register the lint package command so linting can also be manually triggered
	const lintPackageCommand = vscode.commands.registerCommand('go-reviver.lint.package', () => {
		if (!extensionEnabled) {
			vscode.window.showWarningMessage('Reviver is not enabled');
			return;
		}
		const editor = vscode.window.activeTextEditor;
		if(!editor){
			vscode.window.showWarningMessage('No active file open to lint, ensure you open a .go file before running the package linter.');
			return;
		}

		const document = editor.document;
		if(document.languageId !== 'go') {
			vscode.window.showWarningMessage('You must have an active .go file open before running the package linter.');
			return;
		}

		const cwd = path.dirname(document.uri.fsPath);
		
		const unprocessedConfig = getExtensionConfig();
		processConfig(unprocessedConfig)
		.then((conf: ReviverConfig) => {
				runLinter(conf, cwd, diagnosticCollection);
			})
			.catch((e) => {
				outputChannel.appendLine(formatLog("Error processing extension config: " + e, LogType.ERROR));
				return;
			});
	});
	
	// Listener for changes to settings.json
	const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
		// check if the reviver extension is enabled
		const reviverConfig = vscode.workspace.getConfiguration('reviver');
		extensionEnabled = reviverConfig.get('enable', false);
		if (!extensionEnabled) {
			outputChannel.appendLine(formatLog("reviver extension is disabled", LogType.INFO));
			return;
		}

		// check if the go.lintOnSave is enabled mostly to log a warning for the user in Output tab.
		const goExtConfig = vscode.workspace.getConfiguration('go');
		lintOnSave = reviverConfig.get<boolean>('lintOnSave', true);

		if(goExtConfig.get('lintOnSave', "off") !== "off") {
			outputChannel.appendLine(formatLog("go.lintOnSave is currently enabled, this may cause linters to be run multiple times", LogType.WARN));
		}

		// retrieve the initial extension configuration values
		const unprocessedConfig = getExtensionConfig();
		processConfig(unprocessedConfig)
			.then((conf: ReviverConfig) => {
				// cache the processed config
				cachedConfig = conf;
				console.log("cachedConfig: ", cachedConfig);
			})
			.catch((e) => {
				outputChannel.appendLine(formatLog("Error processing extension config: " + e, LogType.ERROR));
				return;
			});

		if(!configHasChanged(e)) {
			return
		}

		// change detected, re-retrieve the config for the extension
		// const unprocessedConfig = getExtensionConfig();
		outputChannel.appendLine(formatLog("reviver config change detected, reloading", LogType.INFO));

		processConfig(unprocessedConfig)
		.then((conf: ReviverConfig) => {
			cachedConfig = conf;
			if(!cachedConfig.enabled){
				vscode.window.showWarningMessage(`Unable to run, could not find a valid configuration for: ${conf.lintTool} ${conf.lintFlags.join(' ')}`);
			}
		})
		.catch((e) => {	
			// console.error("Error processing config flags: ", e);
			outputChannel.appendLine(formatLog("Error processing extension config after config change: " + e, LogType.ERROR));
		})
	});

	// Listener for file saves against any .go file
	const saveListener = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		if (!extensionEnabled || document.languageId !== 'go' || !lintOnSave) {
			// not a go file, just ignore it.
			return;
		}

		if (!cachedConfig) {
			// we have no cached config yet, so we can't run the linter
			// console.error("No cached config found");
			outputChannel.appendLine(formatLog(`No cache config found prior to saving document: ${document.fileName}`, LogType.ERROR));
			return;
		}

		// get the parent directory of the document we are saving
		const cwd = path.dirname(document.uri.fsPath);
		// dont run the linter if the config couldnt process the configs correctly
		if(!cachedConfig.enabled) {
			// the last loaded/cached config was not valid, so we can't run the linter
			outputChannel.appendLine(formatLog(`Unable to run after save, potentially due to bad config values to: ${cachedConfig.lintTool} ${cachedConfig.lintFlags.join(' ')}`, LogType.ERROR));
			return;
		}
		const message = `running linter: ${cachedConfig.lintFlags.length > 0 ? cachedConfig.lintTool + ' ' + cachedConfig.lintFlags.join(' ') : cachedConfig.lintTool}`;
  	vscode.window.showInformationMessage(message);
		outputChannel.appendLine(formatLog(message, LogType.INFO));
		// attempt to run the linter with the cached config
		runLinter(cachedConfig, cwd, diagnosticCollection);
		outputChannel.appendLine(formatLog("linter run complete", LogType.INFO));
	});
	
	// register the listeners with the context
	context.subscriptions.push(lintPackageCommand);
	context.subscriptions.push(configChangeListener);
	context.subscriptions.push(saveListener);
}

// This method is called when your extension is deactivated
export function deactivate() {
	outputChannel.appendLine(formatLog("reviver extension deactivate", LogType.INFO));
	outputChannel.dispose();
	diagnosticCollection.clear();
	diagnosticCollection.dispose();
}
