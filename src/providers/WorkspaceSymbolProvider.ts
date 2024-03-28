import * as vscode from 'vscode';
import { IDefined, defineTypeMap, nameToDefines } from '../constants';
import { regexes } from '../regexes';
import { typeStringifyer } from "./commonFunctions";


export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
	async provideWorkspaceSymbols(query: string, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[]> {
		let symbols: vscode.SymbolInformation[] = [];
		for (let define of await this._findRelevantDefines(query)) {
			if (define.iDefined.Name?.AsFound && define.iDefined.Name?.Index) {
				let location = new vscode.Location(define.document.uri, new vscode.Range(define.document.positionAt(define.iDefined.Name.Index), define.document.positionAt(define.iDefined.Name.Index + define.iDefined.Name.AsFound.length)));
				symbols.push({ name: define.iDefined.Name.AsFound, containerName: define.iDefined.Type?.Compound ? typeStringifyer(define.iDefined.Type) : define.iDefined.Type.Define, kind: defineTypeMap.get(typeStringifyer(define.iDefined.Type)), location: location });
			}
		}
		return symbols;
	}
	private async _findRelevantDefines(query: string): Promise<{ iDefined: IDefined; document: vscode.TextDocument; }[]> {
		let output:{ iDefined: IDefined; document: vscode.TextDocument; }[] = []; {
		let promises:Promise<{ iDefined: IDefined; document: vscode.TextDocument; }>[] = []
		let resolveUri = async (defined:IDefined) => {
			return { iDefined: defined, document: await vscode.workspace.openTextDocument(vscode.Uri.parse(defined.Uri, true)) }
		}
		for (let name of this._filterNames(query)) {
			for (let defined of nameToDefines.get(name)){
				 promises.push(resolveUri(defined))
			}
		}
		for (let promise of promises){
			output.push(await promise)
		}; }
		return output
	}
	private _filterNames(query:string):string[] {
		let output:string[] = []
		let regex = regexes.generateWorkspaceSymbolsFilter(query)
		console.log(query+': '+regex.source)
		for (let name of nameToDefines.keys()){
			if (regex.test(name)) output.push(name)
		}
		return output
	}
}
