import * as vscode from 'vscode';
export class CodeLensProvider implements vscode.CodeLensProvider {
	onDidChangeCodeLenses?: vscode.Event<void>;
	provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
		throw new Error('Method not implemented.');
	}
	resolveCodeLens?(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {
		throw new Error('Method not implemented.');
	}
}
