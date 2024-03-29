import * as vscode from 'vscode';
import { fileToGatherResults, defineTypeMap } from '../constants';


export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		let defines = fileToGatherResults?.get(document.uri.toString()).Defines ?? [];
		let docs = [];
		for (let define of defines) {
			let defineRange = new vscode.Range(document.positionAt(define.Contents.Capture.Index), document.positionAt(define.Contents.Capture.Index + define.Contents.Capture.Text.length));
			let symbolRange = new vscode.Range(document.positionAt(define.Name.Index), document.positionAt(define.Name.Index + define.Name.Name.length));
			let symbolName = define.Name.Name;
			let symbolDetail = define.Type.typeString;
			let symbolKind = define.Type.legendEntry;
			docs.push(new vscode.DocumentSymbol(symbolName, symbolDetail, symbolKind, defineRange, symbolRange));
		}
		return docs;
	}
}
