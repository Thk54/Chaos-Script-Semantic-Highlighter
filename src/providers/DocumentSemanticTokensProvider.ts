import * as vscode from 'vscode';
import { updateFilesMapsIfEntries } from "./commonFunctions";
import { fileToGatherResults, CDefined, nameToDefines, tokenTypes, legend } from '../constants';
import { regexes } from '../regexes';


export class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		//update active file and wait for map to be updated
		await updateFilesMapsIfEntries(document);
		//get newly updated ICompounds
		//determie tokens
		const builder: vscode.SemanticTokensBuilder = new vscode.SemanticTokensBuilder(legend);
		//fileToCompoundsMap.set(document.uri, update)
		let promises = [];
		for (let defines of fileToGatherResults.get(document.uri.toString())?.Defines ?? []) {
			promises.push(builderTokens(builder, defines, document));
		}
		await Promise.allSettled(promises);
		let lamo = [];
		return builder.build();

	}
}
async function builderTokens(builder: vscode.SemanticTokensBuilder, compound: CDefined, document: vscode.TextDocument) {
	const mainOffset = compound.contents.index; // ./regexes.stringExcluderCapture() // Mostly verbose could be more function-ized
/* 	for (let word of compound.contents.content.matchAll(regexes.stringExcluderCapture)) {
		if ((compound.type.define === 'TEXTTOOLTIP')) break //abort if tooltiptext but still highlight name
		let result = nameToDefines.get(word[0].toLowerCase())?.length ? nameToDefines.get(word[0].toLowerCase())[0] : null
		if (result) {
			let tokenStart = document.positionAt(word.index + mainOffset);
			if (!result.type.isValidType()) {
				console.log('Unhandled Type: ' + result.type.typeString + ' from ' + result.UriString +' defaulting to "UHANDLED" Contents: '+ result.contents.capture.Text);
				result.type.define = 'UHANDLED';
			}
			builder.push(tokenStart.line, tokenStart.character, word[0].length, tokenTypes.get(result.type.legendEntry));
		}
	} */
	for (let component of compound.contents.components){
		builder.push(component.range, component.tokenType)
	}
	let nameStart = document.positionAt(compound.name.Index);
	builder.push(nameStart.line, nameStart.character, compound.name.Name.length, tokenTypes.get(compound.type.legendEntry));
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
