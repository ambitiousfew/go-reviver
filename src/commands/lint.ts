import * as vscode from 'vscode';
import { parsePackageReviveOutput } from '../utils/revive';
import { updateDiagnostics } from '../utils/diagnostics';
import { GoLintConfig } from '../types/config';

export function runLinter(conf: GoLintConfig, cwd: string, diagnostics: vscode.DiagnosticCollection): void {
  vscode.window.showInformationMessage('Running linter: ' + conf.lintTool + ' ' + conf.lintFlags.join(' '));

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
		console.log(`child process exited with code ${code} running ${conf.lintTool} ${conf.lintFlags.join(' ')}`);
		if (code !== 0) {
				vscode.window.showErrorMessage(`exited with code ${code}`);
		} else {
				// vscode.window.showInformationMessage(`succeeded`);
				// Parse revive output and update diagnostics
				const diagnosticsByFile = parsePackageReviveOutput(cwd, buffer.toString());
				updateDiagnostics(diagnosticsByFile, diagnostics);
		}
	});
}