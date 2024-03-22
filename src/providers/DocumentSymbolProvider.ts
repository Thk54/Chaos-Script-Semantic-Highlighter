import * as vscode from 'vscode';
import { fileToDefines, defineTypeMap } from '../constants';
import { typeStringifyer } from '../constants';


export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		let defines = fileToDefines?.get(document.uri.toString()) ?? [];
		let docs = [];
		for (let define of defines) {
			let defineRange = new vscode.Range(document.positionAt(define.Contents.Capture.Index), document.positionAt(define.Contents.Capture.Index + define.Contents.Capture.Text.length));
			let symbolRange = new vscode.Range(document.positionAt(define.Name.Index), document.positionAt(define.Name.Index + define.Name.Name.length));
			let symbolName = define.Name.Name;
			let symbolDetail = typeStringifyer(define.Type);
			let symbolKind = defineTypeMap.get(typeStringifyer(define.Type));
			docs.push(new vscode.DocumentSymbol(symbolName, symbolDetail, symbolKind, defineRange, symbolRange));
		}
		return docs;
	}
}
