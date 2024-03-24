import * as vscode from 'vscode';
import { updateFilesMapsIfEntries } from '../mapsManager';
import { typesLegend, fileToDefines, IDefined, fileToNameToCompoundDefine, fileToNameToDefine } from '../constants';
import { getDefineFromWord, typeStringifyer } from "./commonFunctions";


export class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		//update active file and wait for map to be updated
		await updateFilesMapsIfEntries(document);
		//get newly updated ICompounds
		//determie tokens
		const builder: vscode.SemanticTokensBuilder = new vscode.SemanticTokensBuilder();
		//fileToCompoundsMap.set(document.uri, update)
		let promises = [];
		if (fileToDefines.get(document.uri.toString())?.values())
			for (let defines of fileToDefines.get(document.uri.toString())?.values()) {
				promises.push(builderTokens(builder, defines, document));
			}
		await Promise.allSettled(promises);
		let lamo = [];
		return builder.build();

	}
}
async function builderTokens(builder: vscode.SemanticTokensBuilder, compound: IDefined, document: vscode.TextDocument) {
	const mainOffset = compound.Contents.Index; // ./regexes.stringExcluderCapture() // Mostly verbose could be more function-ized
	for (let word of compound.Contents.Content.matchAll(/(?<=\s|^)(?:\b(?:(?:(?:Ability|Flavour)?Text|Description|TODO):|(?<GainAbilityText>GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b|\S+?)(?=\s|$)/gis)) {
		let result = getDefineFromWord(word[0].toLowerCase())
		if (result) {
			let tokenStart = document.positionAt(word.index + mainOffset);
			if (!(typeof (typesLegend.get(typeStringifyer(result.Type))) === "number")) {
				console.log('Unhandled Type: ' + typeStringifyer(result.Type) + ' defaulting to "UHANDLED"');
				result.Type.Define = 'UHANDLED';
				result.Type.Compound = 'UHANDLED';
			}
			builder.push(tokenStart.line, tokenStart.character, word[0].length, typesLegend.get(typeStringifyer(result.Type)));
		}
	}
	let nameStart = document.positionAt(compound.Name.Index);
	builder.push(nameStart.line, nameStart.character, compound.Name.Name.length, typesLegend.get(typeStringifyer(compound.Type)));
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
