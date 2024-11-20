import * as vscode from 'vscode';

export function updateDiagnostics(
	diagnosticsByFile: Map<string, vscode.Diagnostic[]>,
	diagnosticCollection: vscode.DiagnosticCollection
) {
	// Clear existing diagnostics
	diagnosticCollection.clear();

	// Set diagnostics for each file
	for (const [file, diagnostics] of diagnosticsByFile.entries()) {
			const fileUri = vscode.Uri.file(file);
			diagnosticCollection.set(fileUri, diagnostics);
	}
}