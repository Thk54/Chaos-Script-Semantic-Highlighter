import * as vscode from 'vscode';

export class DeclarationProvider implements vscode.DeclarationProvider{
	async provideDeclaration(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Declaration>{
		document.lineAt(position.line)
		return
	}
}