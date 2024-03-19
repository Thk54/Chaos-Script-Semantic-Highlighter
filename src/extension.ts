import * as vscode from 'vscode';
import { updateFilesMapsIfEntries } from './mapsManager';
import { gatherDefinitions } from './parser';
import { typesLegend, fileToDefines, IType, IDefined, fileToNameToCompoundDefine, fileToNameToDefine } from './constants';

export function typeStringifyer(type:IType){
	return type.Define === 'COMPOUND' ? (type.Define+type.Compound) : type.Define
}

export async function presentTextDocumentFromURIToReturnlessFunction(uri:vscode.Uri,fuc:Function){
	await vscode.workspace.openTextDocument(uri).then((document)=>{fuc(document)})
	return Promise
}

export class FoldingRangeProvider implements vscode.FoldingRangeProvider {
	async provideFoldingRanges(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.FoldingRange[]> {
		let ranges: vscode.FoldingRange[] = []
		for (let iDefine of await gatherDefinitions(document)){
			if (iDefine){
				let pos = document.positionAt(iDefine.Contents.Capture.Index)
				ranges.push({start:pos.line,end:pos.translate({characterDelta:iDefine.Contents.Capture.Text.length}).line})
		}
	}
	if (ranges.length) return ranges
	return;
	}
}

export class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		//update active file and wait for map to be updated
		await updateFilesMapsIfEntries(document)
		//get newly updated ICompounds
		 
		//determie tokens
		const builder:vscode.SemanticTokensBuilder = new vscode.SemanticTokensBuilder()
		//fileToCompoundsMap.set(document.uri, update)
		let promises = []
		if (fileToDefines.get(document.uri)?.values())
		for (let defines of fileToDefines.get(document.uri)?.values()){
				promises.push(builderTokens(builder,defines,document))
		}
		await Promise.allSettled(promises)
		let lamo = []
		return builder.build()

	}
}
async function builderTokens(builder:vscode.SemanticTokensBuilder,compound:IDefined,document:vscode.TextDocument) {
	const mainOffset = compound.Contents.Index
	for (let word of compound.Contents.Content.matchAll(/(?<=[\s^])\b(?:(?:(?:Ability|Flavour)?Text|Description|TODO):|(?:GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b|\S+?(?=[\s$])/gis)){
		let result
		for (let file of fileToNameToCompoundDefine.keys()){
			result = fileToNameToCompoundDefine.get(file).get(word[0].toLowerCase())
			if (result) break
		}
		if (!result){
			for (let file of fileToNameToDefine.keys()){
				result = fileToNameToDefine.get(file).get(word[0].toLowerCase())
				if (result) break
			}
		}
		if (result) {
			let tokenStart = document.positionAt(word.index+mainOffset)
			if (!(typeof(typesLegend.get(typeStringifyer(result.Type)))==="number")){
				console.log('Unhandled Type: '+result.Type+' defaulting to "UHANDLED"')
				result.Type.Define = 'UHANDLED'
				result.Type.Compound = 'UHANDLED'
			}
			builder.push(tokenStart.line, tokenStart.character, word[0].length, typesLegend.get(typeStringifyer(result.Type)))
		}
	}
	let nameStart = document.positionAt(compound.Name.Index)
	builder.push(nameStart.line, nameStart.character, compound.Name.Name.length, typesLegend.get(typeStringifyer(compound.Type)))
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

/* class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		return this._parseDefinitionsText(document);
	}

	private _parseDefinitionsText(document: vscode.TextDocument): vscode.DocumentSymbol[] { 
		//const text = document.getText()
		let docs:vscode.DocumentSymbol[] = []
		//const lineLengths: number[] = text.split(/\r\n|\r|\n/).map(l => l.length+ 1 + Number(1 < text.split(/\r\n/).length));
		///
		//First try to capture comments
		//(?:\s|^((/-)\s.*?\s-/)\s|$)|
		//Try to capture all of any compounds
		//(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<TypeOfCompound>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<NameOfCompound>[\S]*)\s.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?\b[Ee][Nn][Dd]\b)|
		//Try to capture most of other definition flags
		//todo
		///gsd
		for (let list of fileToNameToDefinedListMap){
			for (let defined of list[1]){
				let iDefined = defined[1]
				let defineStartPos
				iDefined.Contents
			}
		}
		for (let list of fileToNameToCompoundListMap){
			for (let compound of list[1]){
				
			}
		}
			let compoundStartPos = document.positionAt(match.index)
			let compoundEndPos = document.positionAt(match.index+match.length)
			let compoundRange = new vscode.Range(compoundStartPos,compoundEndPos)
			let symbolStartPos = document.positionAt(match.indices.groups['NameOfCompound'][0])
			let symbolEndPos = document.positionAt(match.indices.groups['NameOfCompound'][1])
			let symbolRange = new vscode.Range(symbolStartPos,symbolEndPos)
			let symbolName = match.groups['NameOfCompound']
			let symbolDetail = match.groups['TypeOfCompound']
			let symbolKind = 11// todo make this number dynamic
			docs.push(new vscode.DocumentSymbol(symbolName,symbolDetail,symbolKind,compoundRange,symbolRange))
		

		return docs
	}
} */