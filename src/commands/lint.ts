import * as vscode from 'vscode';
import { parsePackageReviveOutput } from '../utils/revive';
import { updateDiagnostics } from '../utils/diagnostics';
import { ReviverConfig } from '../types/config';


export function runLinter(conf: ReviverConfig, cwd: string, diagnostics: vscode.DiagnosticCollection): void {
	let currentFlags = [...conf.lintFlags];
	let currentDirectory = cwd;
	switch (conf.lintLevel) {
		case 'all':
			// alter the cwd to the workspace directory
			currentDirectory = conf.workspace;
			// alter the flags to include all subdirectories for revive
			currentFlags.push('./...');
			break;
		case 'package':
			// do nothing, package is default behavior of revive using cwd.
			break;
		default:
			vscode.window.showErrorMessage(`${conf.lintLevel} is not a valid lint level. Please use 'all' or 'package'.`);
			return;
	}

	const spawn = require('child_process').spawn;
	const child = spawn(conf.lintTool, currentFlags, { cwd: currentDirectory });

	// store buffer output from the linter
	// we must concat because the output may be split across multiple data events (chunking)
	let buffer = Buffer.alloc(0);

	child.stdout.on('data', (data: Buffer) => {
		// vscode.window.showInformationMessage(`Output: ${data.toString()}`);
		buffer = Buffer.concat([buffer, data]);
	});

	child.stderr.on('data', (data: Buffer) => {
		// vscode.window.showErrorMessage(`Error: ${data.toString()}`);
		buffer = Buffer.concat([buffer, data]);
	});

	child.on('close', (code: number) => {
		if (code !== 0) {
				vscode.window.showErrorMessage(`${conf.lintTool} exited with code ${code}`);
		} else {
				// vscode.window.showInformationMessage(`succeeded`);
				// Parse revive output and update diagnostics
				const diagnosticsByFile = parsePackageReviveOutput(currentDirectory, buffer.toString());
				updateDiagnostics(diagnosticsByFile, diagnostics);
		}
	});
}