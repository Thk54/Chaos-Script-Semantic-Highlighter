import * as vscode from 'vscode';
import { IDefined, fileToNameToCompoundDefine, fileToNameToDefine, defineTypeMap } from '../constants';
import { typeStringifyer } from "./commonFunctions";


export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
	async provideWorkspaceSymbols(query: string, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[]> {
		let defineds: { iDefined: IDefined; document: vscode.TextDocument; }[] = [];
		let promise = this._findMatchingNames(fileToNameToCompoundDefine, query, defineds);
		await this._findMatchingNames(fileToNameToDefine, query, defineds);
		await promise;
		let symbols: vscode.SymbolInformation[] = [];
		for (let define of defineds) {
			if (define.iDefined.Name?.AsFound && define.iDefined.Name?.Index) {
				let location = new vscode.Location(define.document.uri, new vscode.Range(define.document.positionAt(define.iDefined.Name.Index), define.document.positionAt(define.iDefined.Name.Index + define.iDefined.Name.AsFound.length)));
				symbols.push({ name: define.iDefined.Name.AsFound, containerName: typeStringifyer(define.iDefined.Type), kind: defineTypeMap.get(typeStringifyer(define.iDefined.Type)), location: location });
			}
		}
		return symbols;
	}
	private async _findMatchingNames(map: Map<string, Map<string, IDefined>>, query: string, output: { iDefined: IDefined; document: vscode.TextDocument; }[]): Promise<void> {
		for (let names of map.entries()) {
			let textDocumentCache: vscode.TextDocument;
			for (let name of names[1].keys()) {
				if (name.includes(query.toLowerCase())) {
					textDocumentCache = textDocumentCache ?? await vscode.workspace.openTextDocument(vscode.Uri.parse(names[0], true));
					output.push({ iDefined: names[1].get(name), document: textDocumentCache });
				}
			}
		}
	}
}
