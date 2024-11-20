import * as vscode from 'vscode';
import * as fs from 'fs/promises';

export function currentWorkingDirectory(): string {
	return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
}


export async function findFirstAccessibleFile(filepaths: string[]): Promise<string> {
	for(const filepath of filepaths) {
		try {
			await fs.access(filepath);
			return filepath;
		} catch(e) {
			// file not found
		}
	}

	return '';
}
