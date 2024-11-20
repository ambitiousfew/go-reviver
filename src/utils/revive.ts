import * as vscode from 'vscode';
import * as path from 'path';

// parsePackageReviveOutput parses the output of revive and returns a map of diagnostics by file
export function parsePackageReviveOutput(cwd: string, output: string): Map<string, vscode.Diagnostic[]> {
	const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();
	// console.log("size of output: ", output.length);
	const lines = output.split('\n');
	// console.log("size of lines: ", lines.length);
	for (const line of lines) {
			const match = line.match(/^(.+?):(\d+):(\d+):\s*(.+)$/);
			if (match) {
					const [_, file, lineNumber, column, message] = match;
					// Create a range for the diagnostic
					const range = new vscode.Range(
							new vscode.Position(parseInt(lineNumber, 10) - 1, parseInt(column, 10) - 1),
							new vscode.Position(parseInt(lineNumber, 10) - 1, parseInt(column, 10))
					);
					// Create the diagnostic
					const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
					diagnostic.source = 'reviver';
					const filepath = path.join(cwd, file);
					// Add the diagnostic to the correct file
					if (!diagnosticsByFile.has(filepath)) {
							diagnosticsByFile.set(filepath, []);
					}
					diagnosticsByFile.get(filepath)?.push(diagnostic);
			}
	}

	// console.log("size of: ", diagnosticsByFile.size);

	return diagnosticsByFile;
}
