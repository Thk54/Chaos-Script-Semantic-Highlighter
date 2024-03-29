import * as vscode from 'vscode';
import { fileToGatherResults, defineTypeMap } from '../constants';


export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		let defines = fileToGatherResults?.get(document.uri.toString()).Defines ?? [];
		let docs = [];
		for (let define of defines) {
			let defineRange = new vscode.Range(document.positionAt(define.contents.Capture.Index), document.positionAt(define.contents.Capture.Index + define.contents.Capture.Text.length));
			let symbolRange = new vscode.Range(document.positionAt(define.name.Index), document.positionAt(define.name.Index + define.name.Name.length));
			let symbolName = define.name.Name;
			let symbolDetail = define.type.typeString;
			let symbolKind = define.type.legendEntry;
			docs.push(new vscode.DocumentSymbol(symbolName, symbolDetail, symbolKind, defineRange, symbolRange));
		}
		return docs;
	}
}
