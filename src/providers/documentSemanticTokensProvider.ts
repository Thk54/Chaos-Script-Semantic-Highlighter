import * as vscode from 'vscode';
import { updateFilesMapsIfEntries } from "./commonFunctions";
import { fileToGatherResults, tokenTypes, legend } from '../constants';
import { CDefined } from "../classes";
import { protoDiagnostics } from '../initialize';


export class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	public async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		//update active file and wait for maps to be updated
		await updateFilesMapsIfEntries(document);
		const builder: vscode.SemanticTokensBuilder = new vscode.SemanticTokensBuilder(legend);
		let diagnostics: vscode.Diagnostic[] = []
		let promises = [];
		for (let define of fileToGatherResults.get(document.uri.toString())?.defines ?? []) {
			promises.push(builderTokens(builder, define));
			diagnostics.push(...define.contents.diagnostics)
		}
		await Promise.allSettled(promises);
		protoDiagnostics.set(document.uri, diagnostics)
		return builder.build();

	}
}
async function builderTokens(builder: vscode.SemanticTokensBuilder, compound: CDefined) {
	const mainOffset = compound.contents.index;
	if (!compound.type.isBuiltIn) {
		for (let symbol of compound.contents.tree.semanticSymbols){
			builder.push(symbol.range, symbol.tokenType)
		}
		let nameStart = compound.name.index;
		builder.push(nameStart.line, nameStart.character, compound.name.name.length, tokenTypes.get(compound.type.legendEntry));
	}
	//return Promise
	/*private _encodeTokenModifiers(strTokenModifiers: string[]): number {
		let result = 0;
		for (let i = 0; i < strTokenModifiers.length; i++) {
			const tokenModifier = strTokenModifiers[i];
			if (tokenModifiers.has(tokenModifier)) {
				result = result | (1 << tokenModifiers.get(tokenModifier)!);
			} else if (tokenModifier === 'notInLegend') {
				result = result | (1 << tokenModifiers.size + 2);
			}
		}
		return result;
	} */
}
