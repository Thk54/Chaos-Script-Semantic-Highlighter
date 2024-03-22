import * as vscode from 'vscode';

export class HoverProvider implements vscode.HoverProvider {
	async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover>{
		return new vscode.Hover('guyg')
	}
}