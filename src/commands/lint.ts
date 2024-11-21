import * as vscode from 'vscode';
import { parsePackageReviveOutput } from '../utils/revive';
import { updateDiagnostics } from '../utils/diagnostics';
import { ReviverConfig } from '../types/config';


export function runLinter(conf: ReviverConfig, cwd: string, diagnostics: vscode.DiagnosticCollection): void {
	const spawn = require('child_process').spawn;
	const child = spawn(conf.lintTool, conf.lintFlags, { cwd: cwd });

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
				const diagnosticsByFile = parsePackageReviveOutput(cwd, buffer.toString());
				updateDiagnostics(diagnosticsByFile, diagnostics);
		}
	});
}