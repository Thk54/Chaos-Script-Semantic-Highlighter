import * as vscode from 'vscode';
import { fileToGatherResults, tokenTypes } from '../constants';
import { buildTree } from "./treeFunctions";
import { protoDiagnostics } from '../initialize'


export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		let defines = fileToGatherResults?.get(document.uri.toString()).defines ?? [];
		let docs = [];
		let diagnostics:vscode.Diagnostic[] = []
		for (let define of defines) {
			docs.push(buildTree(define,diagnostics))
		}
		protoDiagnostics.set(document.uri, diagnostics)
		return docs;
	}
}
