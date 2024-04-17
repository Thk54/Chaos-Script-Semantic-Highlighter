import * as vscode from 'vscode';
import { tokenTypes, nameToDefines, uriToGatherResultsDefines } from '../constants';
import { returnArgumentsAsString } from './commonFunctions';
export class CompletionItemProvider implements vscode.CompletionItemProvider {
	async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
		let completionItems: vscode.CompletionItem[] = [];
		let inCompound = uriToGatherResultsDefines.get(document.uri.toString()).defines.find((define)=>{return define.contents.capture.location.range.contains(position)})
		let vars:Set<string> = new Set
		inCompound?.contents?.tree.documentSymbolArray.filter((symbol)=>{return !(symbol?.define)}).forEach((symbol)=>{if (symbol.selectionRange) {vars.add(document.getText(symbol.selectionRange))}}) // Doesn't exclude flags right now
		for (let string of vars){
			completionItems.push(new vscode.CompletionItem(string))
		}
		for (let defines of nameToDefines.entries()){
			let types:Set<string> = new Set
			for (let define of defines[1]){
				if (!types.has(define.type.typeString)) {
					types.add(define.type.typeString)
					let item = new vscode.CompletionItem({label:define.name?.asFound ?? define.name.name,description:define.type.typeString})
					if (define?.args?.length) {item.documentation = returnArgumentsAsString(define)}
					if (define.type.isValidType()) {item.kind = tokenTypes.get(define.type.legendEntry)}
					completionItems.push(item)
				}
			}
		}
		return completionItems;
	}
}
