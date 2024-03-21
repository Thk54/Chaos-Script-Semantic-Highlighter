import * as vscode from 'vscode';
import { updateFilesMapsIfEntries } from './mapsManager';
import { gatherDefinitions } from './parser';
import { typesLegend, fileToDefines, IType, IDefined, fileToNameToCompoundDefine, fileToNameToDefine, defineTypeMap, GatherResults } from './constants';

export function typeStringifyer(type:IType):string {
	return type.Define === 'COMPOUND' ? (type.Define+' '+type.Compound) : type.Define
}

export class FoldingRangeProvider implements vscode.FoldingRangeProvider {
	async provideFoldingRanges(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.FoldingRange[]> {
	let gatherResults:GatherResults = (await gatherDefinitions(document))
	let ranges: vscode.FoldingRange[] = []
	for (let iDefine of gatherResults.Defines ?? []){
		if (iDefine){
			let posStart = document.positionAt(iDefine.Contents.Capture.Index)
			let posEnd = document.positionAt(iDefine.Contents.Capture.Index+iDefine.Contents.Capture.Text.length)
			ranges.push({start:posStart.line,end:posEnd.line})
		}
	}
	for (let comment of gatherResults?.Comments ?? []){
		if (comment){
			let posStart = document.positionAt(comment.index)
			let posEnd = document.positionAt(comment.index+comment[0].length)
			ranges.push({start:posStart.line,end:posEnd.line,kind:1})
		}
	}
	for (let scenario of gatherResults?.Scenarios ?? []){
		if (scenario){
			let posStart = document.positionAt(scenario.index)
			let posEnd = document.positionAt(scenario.index+scenario[0].length)
			ranges.push({start:posStart.line,end:posEnd.line})
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
		if (fileToDefines.get(document.uri.toString())?.values())
		for (let defines of fileToDefines.get(document.uri.toString())?.values()){
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
				console.log('Unhandled Type: '+typeStringifyer(result.Type)+' defaulting to "UHANDLED"')
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

export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		let defines = fileToDefines?.get(document.uri.toString()) ?? []
		let docs = []
		for (let define of defines){
			let defineRange = new vscode.Range(document.positionAt(define.Contents.Capture.Index),document.positionAt(define.Contents.Capture.Index+define.Contents.Capture.Text.length))
			let symbolRange = new vscode.Range(document.positionAt(define.Name.Index),document.positionAt(define.Name.Index+define.Name.Name.length))
			let symbolName = define.Name.Name
			let symbolDetail = typeStringifyer(define.Type)
			let symbolKind = defineTypeMap.get(typeStringifyer(define.Type))
			docs.push(new vscode.DocumentSymbol(symbolName,symbolDetail,symbolKind,defineRange,symbolRange))
		}
		return docs
	}
}

export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
	async provideWorkspaceSymbols(query: string, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[]> {
		let defineds:{iDefined:IDefined,document:vscode.TextDocument}[] = []
		let promise = this._findMatchingNames(fileToNameToCompoundDefine, query, defineds)
		await this._findMatchingNames(fileToNameToDefine, query, defineds)
		await promise
		let symbols:vscode.SymbolInformation[] = []
		for (let define of defineds){
			if (define.iDefined.Name?.AsFound&&define.iDefined.Name?.Index) {
				let location = new vscode.Location(define.document.uri, new vscode.Range(define.document.positionAt(define.iDefined.Name.Index),define.document.positionAt(define.iDefined.Name.Index+define.iDefined.Name.AsFound.length)))
				symbols.push({name:define.iDefined.Name.AsFound, containerName:typeStringifyer(define.iDefined.Type), kind:defineTypeMap.get(typeStringifyer(define.iDefined.Type)), location:location})
			}
		}
		return symbols
	}
	private async _findMatchingNames(map:Map<string, Map<string, IDefined>>, query:string, output:{iDefined:IDefined,document:vscode.TextDocument}[]):Promise<void>{
		for (let names of map.entries()){
			let textDocumentCache:vscode.TextDocument
			for (let name of names[1].keys()){
				if (name.includes(query.toLowerCase())){
					textDocumentCache = textDocumentCache ?? await vscode.workspace.openTextDocument(vscode.Uri.parse(names[0],true))
					output.push({iDefined:names[1].get(name),document:textDocumentCache})
				}
			}
		}
	}
}
