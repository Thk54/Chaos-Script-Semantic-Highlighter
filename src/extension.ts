import * as vscode from 'vscode';


const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();
const typesLegend = new Map<string, number>();
const compoundTypeMap = new Map<string,number>();
const defineTypeMap = new Map<string,number>();
type typeToRegExMatches = Map<string,RegExpMatchArray[]>;
const fileToCompoundsesMap = new Map<vscode.Uri, typeToCompoundsMap>();
type typeToCompoundsMap = Map<string,ICompound[]>;
const fileToDefinedsesMap = new Map<vscode.Uri, typeToDefinedsMap>();
type typeToDefinedsMap = Map<string,IDefined[]>
const fileToNameToCompoundListMap = new Map<vscode.Uri,Map<string,ICompound>>();
let tempInitalized:boolean = false

const generateMaps = (function() {
	const compoundTypeKeyArray = [
		'TRIGGER',
		'ABILITY',
		'ACTION',
		'BOOLEAN',
		'CUBE',
		'DIRECTION',
		'POSITION',
		'DOUBLE',
		'PERK',
		'STRING',
		'COMMENT'
	]
	compoundTypeKeyArray.forEach((TypeOfCompound,index)=>compoundTypeMap.set(TypeOfCompound, index))

	const defineTypeKeyArray = [
		'COMPOUND',//important that this maps to zero for else fallthough
		'CUBE',
		'PERK',
		'SCENARIO',
		'ARTOVERRIDE',
		'TEXTTOOLTIP'
	]
	defineTypeKeyArray.forEach((TypeOfDefine,index)=>defineTypeMap.set(TypeOfDefine, index))

	const chaosMappings = [//green, salmon, pink, pale yellow, purple, off-text-white, teal, blue, light sky blue, and text-white
		'COMMENT', //'comment',//green
		'ABILITY', //'string',//salmon
		'CUBE', //'keyword',//pink
		'DOUBLE', //'number',//pale yellow
		'STRING', //'regexp',//purple
		'PERK', //'operator',//offwhite
		'TRIGGER', //'namespace',//teal
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
		'TYPE' //'label'//text white
	]
	chaosMappings.forEach((TypeOfCompound,index)=>typesLegend.set(TypeOfCompound, index))
})();

const legend = (function() {
	const tokenTypesLegend = [
		'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
		'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
		'method', 'decorator', 'macro', 'variable', 'parameter', 'property', 'label'
	];
	tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

	const tokenModifiersLegend = [
		'declaration', 'documentation', 'readonly', 'static', 'abstract', 'deprecated',
		'modification', 'async'
	];
	tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));
	
	return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();

async function parseModdinginfo(document:vscode.TextDocument){
	const pack:Function =  function (lines:string[]):IBuiltins[] {// todo get this to work async
		let compounds:IBuiltins[] = []
		let type = lines[0].toUpperCase().match(/(.*?)S?: /)[1] //todo fix plural types
		lines.shift()
		for (let line of lines){
			let args:IArguments[] = []
			let name = line.match(/^\S+/)
			line.slice(name.length)
			for (let generic of line.matchAll(/\S+/ig)){
				args.push({Type: generic[0].toUpperCase()})
			}
			compounds.push({
				Type:type,
				Name: {Name:name[0]},
				Arguments: args
			})
		}
		return compounds
	}
	let compoundsMap = []
	for (let match of document.getText().matchAll(/^(Triggers|Actions|BOOLEAN|CUBE|DIRECTION|DOUBLE|PERK|POSITION|STRING): (?:$\s^(?:.(?!\:))+$)+/gim)){
	let sectionType = match[1].toUpperCase()
		switch (match[1].toUpperCase()) {
			case 'ACTIONS':
				compoundsMap[compoundTypeMap.get('ACTION')] = pack(match[0].split(/[\r\n]/))
				break;
			case 'TRIGGERS':
				compoundsMap[compoundTypeMap.get('TRIGGER')] = pack(match[0].split(/[\r\n]/))
				break;
			default:
				if (compoundTypeMap.get(sectionType)) {
					compoundsMap[compoundTypeMap.get(sectionType)] = pack(match[0].split(/[\r\n]/))}
					else {console.log("Something has gone wrong or a new compound type was added (parseModdinginfo)");}
				break;
		}
	}
	if (compoundsMap) {
		let returnMap:typeToCompoundsMap = new Map
		for (let compounds of compoundsMap){
			if (compounds?.length){
				returnMap.set(compounds[0].Type,compounds)
			}
		}
		fileToCompoundsesMap.set(document.uri,returnMap)
		addToFileToNameToCompoundListMap(returnMap,document.uri)
	}
	//while (!(compounds.Actions&&compounds.Booleans&&compounds.Doubles&&compounds.Cubes&&compounds.Positions&&compounds.Triggers&&compounds.Strings&&compounds.Perks)) {let wait}
	//await Promise.allSettled(await compounds['Abilities'])
	return Promise
}

async function initializeCompounds(context:vscode.ExtensionContext) {
	generateMaps
	let files = vscode.workspace.findFiles('**/*.txt')
	let promises = []
	promises.push(await presentTextDocumentFromURIToReturnlessFunction(context.extensionUri.with({path:context.extensionUri.path + '/ModdingInfo.txt.built-ins'}), parseModdinginfo))
	for  (let txt of await files){
		promises.push(presentTextDocumentFromURIToReturnlessFunction(txt,addToMapsIfEntriesExist))
	}
	await Promise.allSettled(promises)
	console.log('initial map done')
	tempInitalized = true
}

async function addToFileToNameToCompoundListMap(compoundsAndMap:typeToCompoundsMap,uri:vscode.Uri){
	const nameToCompoundMap = new Map<string,ICompound>();
	for (let compoundArray of compoundsAndMap) {
		for (let compound of compoundArray[1]){
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
async function addToFileToDefineNameListMap(definedsAndMap:typeToDefinedsMap,uri:vscode.Uri){
	const nameToDefinedMap = new Map<string,IDefined>();
	for (let definedsArray of definedsAndMap) {
		for (let defined of definedsArray[1]){
			if (defined.Name.Name){
				nameToDefinedMap.set(defined.Name.Name.toLowerCase(),defined)
			}	
		}
	}
	if (nameToDefinedMap.size !== 0) {
		fileToNameToCompoundListMap.set(uri,nameToDefinedMap)
	}
	return Promise
}


async function presentTextDocumentFromURIToReturnlessFunction(uri:vscode.Uri,fuc:Function){
	await vscode.workspace.openTextDocument(uri).then((document)=>{fuc(document)})
	return Promise
}

async function addToMapsIfEntriesExist(document:vscode.TextDocument) {
	const results:typeToRegExMatches[] = gatherDefinitions(document)
	if (results) {
		if (!(typeof(results[0])==='undefined')){
			const compoundDetails:typeToCompoundsMap = extractCompoundDetails(results[0])
			if (compoundDetails.size) {
				fileToCompoundsesMap.set(document.uri,compoundDetails)
				addToFileToNameToCompoundListMap(compoundDetails,document.uri)
			}
		}
		if (!(typeof(results[1])==='undefined')){
			const DefinedDetails:typeToDefinedsMap = extractDefinedNames(results[1])
			if (results[1].size) {
				fileToDefinedsesMap.set(document.uri,DefinedDetails)
				for (let entry of DefinedDetails)
				addToFileToDefineNameListMap(DefinedDetails,document.uri)
			}
		}
	}
}

function gatherDefinitions(document: vscode.TextDocument): typeToRegExMatches[] {
	let compoundRegExes:any = []
	let otherRegExes:any = []
	let text:string = document.getText()
	let comments = text.matchAll(/(?:(?<=[\s^])\/-(?=\s).*?\s-\/(?=[\s$])|(?:\b[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo]:\s[\s\S]*?\s[Ss][Ee][Nn][Dd]\b))/gs) // Find all the comments
	//todo actually handle |[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo]
	if (comments){
		for (let comment of comments) {
			text = text.replace(comment[0], ''.padEnd(comment[0].length)) // replace them with spaces to preserve character count
		}
	}
	/*all the known defenition flags (regex flags: gsd)
	(?:\b(?<TypeOfDefine>[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]|[Cc][Uu][Bb][Ee]|[Pp][Ee][Rr][Kk]|[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo]|[Tt][Ee][Xx][Tt][Tt][Oo][Oo][Ll][Tt][Ii][Pp]):\s
	captureing all of everything that isn't a compound(, scenario, doaction, or artoverride)
	(?:(?:(?<![Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s)\s*(?<NameOfDefine>[\S]*)\s(?<ContentsOfDefine>.*?(?:\b(?:(?:Ability)?Text|Description|TODO|FlavourText):\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?))
	capture compounds
	|(?:\s*(?<TypeOfCompound>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<NameOfCompound>[\S]*)\s(?<ContentsOfCompound>.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?)))\b[Ee][Nn][Dd]\b) */
	for (let match of text.matchAll(/(?:\b(?<TypeOfDefine>[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]|[Cc][Uu][Bb][Ee]|[Pp][Ee][Rr][Kk]|[Tt][Ee][Xx][Tt][Tt][Oo][Oo][Ll][Tt][Ii][Pp]):\s(?:(?:(?<![Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s)\s*(?<NameOfDefine>[\S]*)\s(?<ContentsOfDefine>.*?(?:\b(?:(?:Ability)?Text|Description|TODO|FlavourText):\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?))|(?:\s*(?<TypeOfCompound>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<NameOfCompound>[\S]*)\s(?<ContentsOfCompound>.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?)))\b[Ee][Nn][Dd]\b)/gsd)){
	// todo: handle |[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo]|[Dd][Oo][Aa][Cc][Tt][Ii][Oo][Nn]|[Aa][Rr][Tt][Oo][Vv][Ee][Rr][Rr][Ii][Dd][Ee]
		let index = defineTypeMap.get(match.groups['TypeOfDefine'].toUpperCase()) //compounds are maped to 0 and so fall though to the else if
		if (index){ 
			if (!otherRegExes[index]) otherRegExes[index] = []
			otherRegExes[index].push(match)
		} else if (typeof(compoundTypeMap.get(match.groups['TypeOfCompound'])) === "number"){
			let index = compoundTypeMap.get(match.groups['TypeOfCompound'])
			if (!compoundRegExes[index]) compoundRegExes[index] = []
			compoundRegExes[index].push(match)
		} else {console.log("Something has gone wrong in gatherCompounds on regex match: "+match[0]);}
	}
	compoundRegExes = compoundRegExes.filter((value:any)=>(value?.length))
	let results:typeToRegExMatches[] = []
	if (compoundRegExes.length) {
		let returnMap:typeToRegExMatches = new Map
		for (let matches of compoundRegExes){
			if (matches[0]?.groups['TypeOfCompound']) {
			returnMap.set(matches[0].groups['TypeOfCompound'],matches)
			} else {console.log("Something has gone wrong in compoundRegExes->results on matches: "+matches);		}
		results[0] = returnMap
		}
	}
	otherRegExes = otherRegExes.filter((value:any)=>(value?.length))
	if (otherRegExes.length) {
		let returnMap:typeToRegExMatches = new Map
		for (let matches of otherRegExes){
			if (matches[0]?.groups['TypeOfDefine']) {
			returnMap.set(matches[0].groups['TypeOfDefine'],matches)
			} else {console.log("Something has gone wrong in compoundRegExes->results on matches: "+matches);		}
		results[1] = returnMap
		}
	}
	if (results.length) return results
}

function extractDefinedNames(defines: typeToRegExMatches):typeToDefinedsMap{
let definedses:any = []
for (let captures of defines) {
	for (let capture of captures[1]){
		if (capture.groups['TypeOfDefine']){
			if (typeof(defineTypeMap.get(capture.groups['TypeOfDefine'])) === 'number'){
				let index = defineTypeMap.get(capture.groups['TypeOfDefine'])
				if (!definedses[index]) definedses[index] = []
				definedses[defineTypeMap.get(capture.groups['TypeOfDefine'])].push(packIntoIDefined(capture))}
			else {console.log("Something has gone wrong or a new compound type was added");};
			}
		}
	}
	definedses = definedses.filter((value:any)=>(value.length))
	if (definedses) {
		let returnMap:typeToDefinedsMap = new Map
		for (let matches of definedses){
			returnMap.set(matches[0].Type,matches)
		}
		return returnMap
	}
	return
	function packIntoIDefined (capture:RegExpMatchArray): IDefined {
		return {
		Type:capture.groups['TypeOfDefine'],
		Contents: {Content:capture.groups['ContentsOfDefine'], Index:capture.indices.groups['ContentsOfDefine'][0]},
		Name: {Name:capture.groups['NameOfDefine'], Index:capture.indices.groups['NameOfDefine'][0]}
		}
	}
}

function extractCompoundDetails(compounds: typeToRegExMatches): typeToCompoundsMap {
let compoundses:any = []
for (let captures of compounds) {
	for (let capture of captures[1]){
		if (capture.groups['TypeOfCompound']){
			if (typeof(compoundTypeMap.get(capture.groups['TypeOfCompound'])) === 'number'){
				let index = compoundTypeMap.get(capture.groups['TypeOfCompound'])
				if (!compoundses[index]) compoundses[index] = []
				compoundses[compoundTypeMap.get(capture.groups['TypeOfCompound'])].push(packIntoICompound(capture))}
				else if (capture.groups['CommentString']){break;} 
				else {console.log("Something has gone wrong or a new compound type was added");};
			}
		}
	}
	compoundses = compoundses.filter((value:any)=>(value.length))
	if (compoundses) {
		let returnMap:typeToCompoundsMap = new Map
		for (let matches of compoundses){
			returnMap.set(matches[0].Type,matches)
		}
		return returnMap
	}
	return
	function packIntoICompound (capture:RegExpMatchArray): ICompound {
		let args:IArguments[] = []
		///(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?:\bGeneric(?:Perk|Position|String|Word|Name|Action|Boolean|Direction|Double|Constant|Cube|Stacking|Time)\b)/gd
		///(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?:\b[Gg][eE][nN][eE][rR][iI][cC](?:[Pp][eE][rR][kK]|[Pp][oO][sS][iI][tT][iI][oO][nN]|[Ss][tT][rR][iI][nN][gG]|[Ww][oO][rR][dD]|[Nn][aA][mM][eE]|[Aa][cC][tT][iI][oO][nN]|[Bb][oO][oO][lL][eE][aA][nN]|[Dd][iI][rR][eE][cC][tT][iI][oO][nN]|[Dd][oO][uU][bB][lL][eE]|[Cc][oO][nN][sS][tT][aA][nN][tT]|[Cc][uU][bB][eE]|[Ss][tT][aA][cC][kK][iI][nN][gG]|[Tt][iI][mM][eE])\b)/gd
		for(let generic of capture.groups['ContentsOfCompound'].matchAll(/(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?<CompoundGenerics>\b[Gg][eE][nN][eE][rR][iI][cC](?:[Pp][eE][rR][kK]|[Pp][oO][sS][iI][tT][iI][oO][nN]|[Ss][tT][rR][iI][nN][gG]|[Ww][oO][rR][dD]|[Nn][aA][mM][eE]|[Aa][cC][tT][iI][oO][nN]|[Bb][oO][oO][lL][eE][aA][nN]|[Dd][iI][rR][eE][cC][tT][iI][oO][nN]|[Dd][oO][uU][bB][lL][eE]|[Cc][oO][nN][sS][tT][aA][nN][tT]|[Cc][uU][bB][eE]|[Ss][tT][aA][cC][kK][iI][nN][gG]|[Tt][iI][mM][eE])\b)/gd)){
			if (generic.groups['CompoundGenerics'])
			args.push({
		String: generic.groups['CompoundGenerics'],
		Type: generic.groups['CompoundGenerics'].slice(7),
		Index: generic.indices.groups['CompoundGenerics'][0]+capture.index
			})
		}
	return {
	Type:capture.groups['TypeOfCompound'],
	Contents: {Content:capture.groups['ContentsOfCompound'], Index:capture.indices.groups['ContentsOfCompound'][0]},
	Name: {Name:capture.groups['NameOfCompound'], Index:capture.indices.groups['NameOfCompound'][0]},
	Arguments: args
	}
	}
}

export async function activate(context: vscode.ExtensionContext) {
	await initializeCompounds(context)
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ language: 'cubechaos' }, new FoldingRangeProvider()));
	//context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'cubechaos' }, new DocumentSymbolProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'cubechaos' }, new DocumentSemanticTokensProvider(), legend))
}

interface IBuiltins{
	Type: string,
	Name: IName
	Arguments?: IArguments[]
}

interface IDefined extends IBuiltins{
	Contents: IContents,
}

interface ICompound extends IDefined{
}

interface IName {
	Name: string,
	Index?: number
}

interface IContents {
	Content: string,
	Index: number
}

interface IArguments {
	Type: string,
	String?: string,
	Index?: number
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
		(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<TypeOfCompound>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<NameOfCompound>[\S]*)\s.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?\b[Ee][Nn][Dd]\b)|
		Try to capture most of other definition flags
		//todo
		/gsd */
		for (let match of document.getText().matchAll(/(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<TypeOfCompound>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<NameOfCompound>[\S]*)\s(?<ContentsOfCompound>.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?)\b[Ee][Nn][Dd]\b)/gsd)){
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
		}

		return docs
	}
}


class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
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
				promises.push(this.builderTokens(builder,compound,document))
			}
		}
		if (fileToDefinedsesMap.get(document.uri)?.values())
		for (let array of fileToDefinedsesMap.get(document.uri)?.values()){
			for (let defined of array){
				promises.push(this.builderTokens(builder,defined,document))
			}
		}
		await Promise.allSettled(promises)
		let lamo = []
		return builder.build()

	}
private async builderTokens(builder:vscode.SemanticTokensBuilder,compound:ICompound,document:vscode.TextDocument) {
	const mainOffset = compound.Contents.Index
	for (let word of compound.Contents.Content.matchAll(/(?<=[\s^])(?:Text:\s.*?\b[Ee][Nn][Dd])|\S+?(?=[\s$])/gis)){
		let result 
		for (let file of fileToNameToCompoundListMap.keys()){
			result = fileToNameToCompoundListMap.get(file).get(word[0].toLowerCase())
			if (result) break
		}
		if (result) {
			let tokenStart = document.positionAt(word.index+mainOffset)
			if (!(typeof(typesLegend.get(result.Type))==="number")){
				console.log('Unhandled Type: '+result.Type+' defaulting to "TYPE"')
				result.Type = 'TYPE'
			}
			builder.push(tokenStart.line, tokenStart.character, word[0].length, typesLegend.get(result.Type))
		}
	}
	let nameStart = document.positionAt(compound.Name.Index)
	builder.push(nameStart.line, nameStart.character, compound.Name.Name.length, typesLegend.get(compound.Type))
	//return Promise
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
