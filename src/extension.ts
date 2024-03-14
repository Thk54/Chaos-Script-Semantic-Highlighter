import * as vscode from 'vscode';


const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();
const typesOfCompounds = new Map <string, number>();
const fileToCompoundsMap = new Map<vscode.Uri, ICompounds>();
const fileToNameToCompoundListMap = new Map<vscode.Uri,Map<string,ICompound>>();


const legend = (function() {
	const tokenTypesLegend = [
		'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
		'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
		'method', 'decorator', 'macro', 'variable', 'parameter', 'property', 'label'
	];
	tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

	const chaosMappings = [//green, salmon, pink, pale yellow, purple, off-text-white, teal, blue, light sky blue, and text-white
		'comment', //'comment',//green
		'STRING', //'string',//salmon
		'CUBE', //'keyword',//pink
		'DOUBLE', //'number',//pale yellow
		'ABILITY', //'regexp',//purple
		'PERK', //'operator',//offwhite
		'e', //'namespace',//teal
		'f', //'type',//teal
		'g', //'struct',//teal
		'h', //'class',//teal
		'i', //'interface',//teal
		'BOOLEAN', //'enum',//teal
		'k', //'typeParameter',//teal
		'l', //'function',//pale yellow
		'm', //'method',//pale yellow
		'POSITION', //'decorator',//pale yellow
		'ACTION', //'macro',//blue
		'p', //'variable',//light sky blue
		'q', //'parameter',//light sky blue
		'DIRECTION', //'property',//light sky blue
		'Type' //'label'//text white
	]
	chaosMappings.forEach((compoundtype,index)=>typesOfCompounds.set(compoundtype, index))

	const tokenModifiersLegend = [
		'declaration', 'documentation', 'readonly', 'static', 'abstract', 'deprecated',
		'modification', 'async'
	];
	tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));
	
	return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();

async function addToFileToNameToCompoundListMap(compoundsAndMap:ICompounds,uri:vscode.Uri){
	const nameToCompoundMap = new Map<string,ICompound>();
	for (let compoundArray of Object.values(compoundsAndMap)) {
		for (let compound of compoundArray){
			if (compound.Name.Name){
				nameToCompoundMap.set(compound.Name.Name.toLowerCase(),compound)
			}	
		}
	}
	if (nameToCompoundMap.size !== 0) {
		fileToNameToCompoundListMap.set(uri,nameToCompoundMap)
	}
	return Promise
}

async function initializeCompounds() {
	let files = await vscode.workspace.findFiles('**/*.txt')
	let promises = []
	let definitionDetails:ICompounds
	for  (let txt of files){
		await vscode.workspace.openTextDocument(txt).then((document) => {
			definitionDetails = extractDefinitionDetails(gatherCompounds(document))
		})
		let hasEntries = 0
		for (let compTypeArray of Object.values(definitionDetails)){
			hasEntries = hasEntries + compTypeArray.length
		}
		if (hasEntries) {
			fileToCompoundsMap.set(txt,definitionDetails)
			promises.push(addToFileToNameToCompoundListMap(definitionDetails,txt))
		}
	}
	await Promise.allSettled(promises)
	console.log('initial map done')
}

/* async function addToMapsIfEntriesExist(uri:vscode.Uri) {
	let definitionDetails:ICompounds
	await vscode.workspace.openTextDocument(uri).then((document) => {
		definitionDetails = extractDefinitionDetails(gatherCompounds(document))
	})
	let hasEntries = 0
	for (let compTypeArray of Object.values(definitionDetails)){
		hasEntries = hasEntries + compTypeArray.length
	}
	if (hasEntries) {
		fileToCompoundsMap.set(txt,definitionDetails)
		promises.push(addToFileToNameToCompoundListMap(definitionDetails,txt))
} */

export function activate(context: vscode.ExtensionContext) {
	
	initializeCompounds()
	
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ language: 'cubechaos' }, new FoldingRangeProvider()));
	//context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'cubechaos' }, new DocumentSymbolProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'cubechaos' }, new DocumentSemanticTokensProvider(), legend))
}


interface ICompounds {
	Abilities?: ICompound[];
	Actions?: ICompound[];
	Booleans?: ICompound[];
	Directions?: ICompound[];
	Doubles?: ICompound[];
	Cubes?: ICompound[];
	Positions?: ICompound[];
}

interface ICompound {
	Type: string,
	Name: IName,
	Contents: IContents,
	Arguments?: IArguments[]
}

interface IName {
	Name: string,
	Index: number
}

interface IContents {
	Content: string,
	Index: number
}

interface IArguments {
	Type: string,
	String: string,
	Index: number
}

interface RegExCompoundCaptures{
	RegExComments: RegExpMatchArray[];
	RegExAbilities: RegExpMatchArray[];
	RegExActions: RegExpMatchArray[];
	RegExBooleans: RegExpMatchArray[];
	RegExDirections: RegExpMatchArray[];
	RegExDoubles: RegExpMatchArray[];
	RegExCubes: RegExpMatchArray[];
	RegExPositions: RegExpMatchArray[];
}

interface Token{
	line:number,
	character:number,
	length:number,
	type:number,
	modifiers?:number
}

class FoldingRangeProvider implements vscode.FoldingRangeProvider {
	async provideFoldingRanges(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.FoldingRange[]> {
		const captureArray = gatherCompounds(document);
		let ranges: vscode.FoldingRange[] = []
		for (let captures of Object.entries(captureArray)){
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
		return ranges
	}
}
		
function gatherCompounds(document: vscode.TextDocument): RegExCompoundCaptures {
	let regExComments: RegExpMatchArray[] = []
	let regExAbilities: RegExpMatchArray[] = []
	let regExActions: RegExpMatchArray[] = []
	let regExBooleans: RegExpMatchArray[] = []
	let regExDirections: RegExpMatchArray[] = []
	let regExDoubles: RegExpMatchArray[] = []
	let regExCubes: RegExpMatchArray[] = []
	let regExPositions: RegExpMatchArray[] = []
	for (let match of document.getText().matchAll(/[\s^](?<CommentString>\/-(?=\s).*?\s-\/)[\s$]|(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<CompoundType>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<CompoundName>[\S]*)\s(?<CompoundContents>.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?)\b[Ee][Nn][Dd]\b)/gsd)){
		switch (match.groups['CompoundType']) {
		case 'ABILITY':
			regExAbilities.push(match)
			break;
		case 'ACTION':
			regExActions.push(match)
			break;
		case 'BOOLEAN':
			regExBooleans.push(match)
			break;
		case 'DIRECTION':
			regExDirections.push(match)
			break;
		case 'DOUBLE':
			regExDoubles.push(match)
			break;
		case 'CUBE':
			regExCubes.push(match)
			break;
		case 'POSITION':
			regExPositions.push(match)
			break;
		default:
			if (match.groups['CommentString']) {regExComments.push(match)} else {
				console.log("Something has gone wrong or a new compound type was added");
			};
		break;
		}
	}
	return{
		RegExComments:regExComments,
		RegExAbilities:regExAbilities,
		RegExActions:regExActions,
		RegExBooleans:regExBooleans,
		RegExDirections:regExDirections,
		RegExDoubles:regExDoubles,
		RegExCubes:regExCubes,
		RegExPositions:regExPositions
	}
}

function extractDefinitionDetails(compounds: RegExCompoundCaptures): ICompounds {
	function packIntoCompound (capture:RegExpMatchArray): ICompound {
		let args:IArguments[] = []
		///(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?:\bGeneric(?:Perk|Position|String|Word|Name|Action|Boolean|Direction|Double|Constant|Cube|Stacking|Time)\b)/gd
		///(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?:\b[Gg][eE][nN][eE][rR][iI][cC](?:[Pp][eE][rR][kK]|[Pp][oO][sS][iI][tT][iI][oO][nN]|[Ss][tT][rR][iI][nN][gG]|[Ww][oO][rR][dD]|[Nn][aA][mM][eE]|[Aa][cC][tT][iI][oO][nN]|[Bb][oO][oO][lL][eE][aA][nN]|[Dd][iI][rR][eE][cC][tT][iI][oO][nN]|[Dd][oO][uU][bB][lL][eE]|[Cc][oO][nN][sS][tT][aA][nN][tT]|[Cc][uU][bB][eE]|[Ss][tT][aA][cC][kK][iI][nN][gG]|[Tt][iI][mM][eE])\b)/gd
		for(let generic of capture.groups['CompoundContents'].matchAll(/(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?<CompoundGenerics>\b[Gg][eE][nN][eE][rR][iI][cC](?:[Pp][eE][rR][kK]|[Pp][oO][sS][iI][tT][iI][oO][nN]|[Ss][tT][rR][iI][nN][gG]|[Ww][oO][rR][dD]|[Nn][aA][mM][eE]|[Aa][cC][tT][iI][oO][nN]|[Bb][oO][oO][lL][eE][aA][nN]|[Dd][iI][rR][eE][cC][tT][iI][oO][nN]|[Dd][oO][uU][bB][lL][eE]|[Cc][oO][nN][sS][tT][aA][nN][tT]|[Cc][uU][bB][eE]|[Ss][tT][aA][cC][kK][iI][nN][gG]|[Tt][iI][mM][eE])\b)/gd)){
			if (generic.groups['CompoundGenerics'])
			args.push({
		String: generic.groups['CompoundGenerics'],
		Type: generic.groups['CompoundGenerics'].slice(7),
		Index: generic.indices.groups['CompoundGenerics'][0]+capture.index
	})
}
return {
	Type:capture.groups['CompoundType'],
	Contents: {Content:capture.groups['CompoundContents'], Index:capture.indices.groups['CompoundContents'][0]},
	Name: {Name:capture.groups['CompoundName'], Index:capture.indices.groups['CompoundName'][0]},
	Arguments: args
}
}

let abilities: ICompound[] = []
let actions: ICompound[] = []
let booleans: ICompound[] = []
let directions: ICompound[] = []
let doubles: ICompound[] = []
let cubes: ICompound[] = []
let positions: ICompound[] = []
for (let captures of Object.entries(compounds)) {
	for (let capture of captures[1]){
		switch (capture.groups['CompoundType']) {
			case 'ABILITY':
				abilities.push(packIntoCompound(capture))
				break;
			case 'ACTION':
				actions.push(packIntoCompound(capture))
				break;
			case 'BOOLEAN':
				booleans.push(packIntoCompound(capture))
				break;
			case 'DIRECTION':
				directions.push(packIntoCompound(capture))
				break;
			case 'DOUBLE':
				doubles.push(packIntoCompound(capture))
				break;
			case 'CUBE':
				cubes.push(packIntoCompound(capture))
				break;
			case 'POSITION':
				positions.push(packIntoCompound(capture))
				break;
			default:
				if (capture.groups['CommentString']) {break;} else {
					console.log("Something has gone wrong or a new compound type was added");
				};
			}
		}
	}
	return{
		Abilities:abilities,
		Actions:actions,
		Booleans:booleans,
		Directions:directions,
		Doubles:doubles,
		Cubes:cubes,
		Positions:positions
		//NameMap:new Map<string,ICompound>()
	}
}

class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		return this._parseDefinitionsText(document);
	}

	private _parseDefinitionsText(document: vscode.TextDocument): vscode.DocumentSymbol[] { 
		//const text = document.getText()
		let docs:vscode.DocumentSymbol[] = []
		//const lineLengths: number[] = text.split(/\r\n|\r|\n/).map(l => l.length+ 1 + Number(1 < text.split(/\r\n/).length));
		/* /
		First try to capture comments
		(?:\s|^((/-)\s.*?\s-/)\s|$)|
		Try to capture all of any compounds
		(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<compoundType>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<compoundName>[\S]*)\s.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?\b[Ee][Nn][Dd]\b)|
		Try to capture most of other definition flags
		//todo
		/gsd */
		for (let match of document.getText().matchAll(/(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<CompoundType>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<CompoundName>[\S]*)\s(?<CompoundContents>.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?)\b[Ee][Nn][Dd]\b)/gsd)){
			let compoundStartPos = document.positionAt(match.index)
			let compoundEndPos = document.positionAt(match.index+match.length)
			let compoundRange = new vscode.Range(compoundStartPos,compoundEndPos)
			let symbolStartPos = document.positionAt(match.indices.groups['CompoundName'][0])
			let symbolEndPos = document.positionAt(match.indices.groups['CompoundName'][1])
			let symbolRange = new vscode.Range(symbolStartPos,symbolEndPos)
			let symbolName = match.groups['CompoundName']
			let symbolDetail = match.groups['CompoundType']
			let symbolKind = 11// todo make this number dynamic
			docs.push(new vscode.DocumentSymbol(symbolName,symbolDetail,symbolKind,compoundRange,symbolRange))
		}

		return docs
	}
}


class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		//update active file
		const update = extractDefinitionDetails(gatherCompounds(document))
		//wait for map to be updated
		await addToFileToNameToCompoundListMap(update,document.uri)
		//determie tokens
		const builder:vscode.SemanticTokensBuilder = new vscode.SemanticTokensBuilder()
		fileToCompoundsMap.set(document.uri, update)
		let promises = []
		for (let array of Object.values(update)){
			for (let compound of array){
				promises.push(this.builderTokens(builder,compound,document))
			}
		}
		await Promise.allSettled(promises)
		let lamo = []
		return builder.build()

	}
private async builderTokens(builder:vscode.SemanticTokensBuilder,compound:ICompound,document:vscode.TextDocument) {
	const mainOffset = compound.Contents.Index
	for (let word of compound.Contents.Content.matchAll(/(?<=[\s^])(?:Text:\s.*?\b[Ee][Nn][Dd])|\S+?(?=[\s$])/gis)){
		let result = fileToNameToCompoundListMap.get(document.uri).get(word[0].toLowerCase())
		if (result) {
			let tokenStart = document.positionAt(word.index+mainOffset)
			builder.push(tokenStart.line, tokenStart.character, word[0].length, typesOfCompounds.get(result.Type))
		}
	}
	return Promise
}
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
