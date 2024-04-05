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
/* 			let defineRange = new vscode.Range(document.positionAt(define.contents.capture.Index), document.positionAt(define.contents.capture.Index + define.contents.capture.Text.length));
			let symbolRange = new vscode.Range(document.positionAt(define.name.Index), document.positionAt(define.name.Index + define.name.Name.length));
			let symbolName = define.name.Name;
			let symbolDetail = define.type.typeString;
			let symbolKind = define.type.legendEntry;
			docs.push(new vscode.DocumentSymbol(symbolName, symbolDetail, tokenTypes.get(symbolKind), defineRange, symbolRange)); */
		}
		protoDiagnostics.set(document.uri, diagnostics)
		return docs;
	}
}
