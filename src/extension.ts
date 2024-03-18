import * as vscode from 'vscode';
import { addToMapsIfEntriesExist } from './mapsManager';
import { gatherDefinitions } from './parser';
import { typesLegend, fileToCompoundsesMap, fileToDefinedsesMap, fileToNameToCompoundListMap, fileToNameToDefinedListMap, ICompound } from './constants';


export async function presentTextDocumentFromURIToReturnlessFunction(uri:vscode.Uri,fuc:Function){
	await vscode.workspace.openTextDocument(uri).then((document)=>{fuc(document)})
	return Promise
}

export class FoldingRangeProvider implements vscode.FoldingRangeProvider {
	async provideFoldingRanges(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.FoldingRange[]> {
		const captureArrayArray = gatherDefinitions(document);
		let ranges: vscode.FoldingRange[] = []
		for (let captureArray of captureArrayArray){
			if (captureArray){
			for (let captures of captureArray){
				for (let capture of captures[1]){
					let foldRange:vscode.FoldingRange
					if (capture.groups['CommentString']){
						foldRange = new vscode.FoldingRange(
						document.positionAt(capture.indices.groups['CommentString'][0]).line,
						document.positionAt(capture.indices.groups['CommentString'][1]).line,
						vscode.FoldingRangeKind.Comment)
					} else {
						foldRange = new vscode.FoldingRange(
						document.positionAt(capture.index).line,
						document.positionAt(capture.index + capture[0].length).line
					)}
					ranges.push(foldRange)
				}
			}
		}
	}
		return ranges
	}
}

export class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		//update active file and wait for map to be updated
		await addToMapsIfEntriesExist(document)
		//get newly updated ICompounds
		 
		//determie tokens
		const builder:vscode.SemanticTokensBuilder = new vscode.SemanticTokensBuilder()
		//fileToCompoundsMap.set(document.uri, update)
		let promises = []
		if (fileToCompoundsesMap.get(document.uri)?.values())
		for (let array of fileToCompoundsesMap.get(document.uri)?.values()){
			for (let compound of array){
				promises.push(builderTokens(builder,compound,document))
			}
		}
		if (fileToDefinedsesMap.get(document.uri)?.values())
		for (let array of fileToDefinedsesMap.get(document.uri)?.values()){
			for (let defined of array){
				promises.push(builderTokens(builder,defined,document))
			}
		}
		await Promise.allSettled(promises)
		let lamo = []
		return builder.build()

	}
}
async function builderTokens(builder:vscode.SemanticTokensBuilder,compound:ICompound,document:vscode.TextDocument) {
	const mainOffset = compound.Contents.Index
	for (let word of compound.Contents.Content.matchAll(/(?<=[\s^])\b(?:(?:(?:Ability)?Text|Description|TODO|FlavourText):|(?:GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b|\S+?(?=[\s$])/gis)){
		let result 
		for (let file of fileToNameToCompoundListMap.keys()){
			result = fileToNameToCompoundListMap.get(file).get(word[0].toLowerCase())
			if (result) break
		}
		if (!result){
			for (let file of fileToNameToDefinedListMap.keys()){
				result = fileToNameToDefinedListMap.get(file).get(word[0].toLowerCase())
				if (result) break
			}
		}
		if (result) {
			let tokenStart = document.positionAt(word.index+mainOffset)
			if (!(typeof(typesLegend.get(result.Type.toUpperCase()))==="number")){
				console.log('Unhandled Type: '+result.Type+' defaulting to "TYPE"')
				result.Type = 'TYPE'
			}
			builder.push(tokenStart.line, tokenStart.character, word[0].length, typesLegend.get(result.Type.toUpperCase()))
		}
	}
	let nameStart = document.positionAt(compound.Name.Index)
	builder.push(nameStart.line, nameStart.character, compound.Name.Name.length, typesLegend.get(compound.Type))
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