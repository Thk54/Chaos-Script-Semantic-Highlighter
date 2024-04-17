import * as vscode from 'vscode';
import { uriToGatherResultsDefines, tokenTypes } from '../constants';


export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		let defines = uriToGatherResultsDefines?.get(document.uri.toString()).defines ?? [];
		let docs = [];
		//let diagnostics:vscode.Diagnostic[] = []
		for (let define of defines) {
			if (!define.contents?.tree) {define.contents.buildTheTree}
			if (define.contents?.tree) {docs.push(define.contents.tree)}
		} 
		return docs;
	}
}
