import * as vscode from 'vscode';
export class CompletionItemProvider implements vscode.CompletionItemProvider {
	async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
		return
	}
}
