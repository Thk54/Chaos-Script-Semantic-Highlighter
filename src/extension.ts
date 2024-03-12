import * as vscode from 'vscode';
let lazy:number
let counter:number =0
const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();
enum ChaosTranslation {//green, salmon, pink, pale yellow, purple, off-text-white, teal, blue, light sky blue, and text-white
	comment, //'comment',//green
	string, //'string',//salmon
	compoundCube, //'keyword',//pink
	compoundDouble, //'number',//pale yellow
	compoundAbility, //'regexp',//purple
	compoundPerk, //'operator',//offwhite
	e, //'namespace',//teal
	f, //'type',//teal
	g, //'struct',//teal
	h, //'class',//teal
	i, //'interface',//teal
	compoundBoolean, //'enum',//teal
	k, //'typeParameter',//teal
	l, //'function',//pale yellow
	m, //'method',//pale yellow
	compoundPosition, //'decorator',//pale yellow
	compoundAction, //'macro',//blue
	p, //'variable',//light sky blue
	q, //'parameter',//light sky blue
	compoundDirection, //'property',//light sky blue
	compoundType //'label'//text white
}


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

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'cubechaos' }, new DocumentSymbolProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'cubechaos' }, new DocumentSemanticTokensProvider(), legend))
}


interface Compounds {
	Abilities: Compound[];
	Actions: Compound[];
	Booleans: Compound[];
	Directions: Compound[];
	Doubles: Compound[];
	Cubes: Compound[];
	Positions: Compound[];
}

interface Compound {
	Type: string,
	Name: Name,
	Contents: Contents,
	Arguments?: Arguments[]
}

interface Name {
	Name: string,
	Index: number
}

interface Contents {
	Content: string,
	Index: number
}

interface Arguments {
	Type: string,
	String: string,
	Index: number
}

interface compoundCaptures{
	Abilities: RegExpMatchArray[];
	Actions: RegExpMatchArray[];
	Booleans: RegExpMatchArray[];
	Directions: RegExpMatchArray[];
	Doubles: RegExpMatchArray[];
	Cubes: RegExpMatchArray[];
	Positions: RegExpMatchArray[];
}

/*interface ILineAndOffset{
	lineNum:number;
	offset:number;
	originalOffset:number; 
}*/

function gatherCompounds(document: vscode.TextDocument): compoundCaptures {
	let abilities: RegExpMatchArray[] = []
	let actions: RegExpMatchArray[] = []
	let booleans: RegExpMatchArray[] = []
	let directions: RegExpMatchArray[] = []
	let doubles: RegExpMatchArray[] = []
	let cubes: RegExpMatchArray[] = []
	let positions: RegExpMatchArray[] = []
	for (let match of document.getText().matchAll(/(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<CompoundType>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<CompoundName>[\S]*)\s(?<CompoundContents>.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?)\b[Ee][Nn][Dd]\b)/gsd)){
		switch (match.groups['CompoundType']) {
			case 'ABILITY':
				abilities.push(match)
				break;
			case 'ACTION':
				actions.push(match)
				break;
			case 'BOOLEAN':
				booleans.push(match)
				break;
			case 'DIRECTION':
				directions.push(match)
				break;
			case 'DOUBLE':
				doubles.push(match)
				break;
			case 'CUBE':
				cubes.push(match)
				break;
			case 'POSITION':
				positions.push(match)
				break;
			default:
				console.log("Something has gone wrong or a new compound type was added");
				break;
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
		const compounds = gatherCompounds(document);
		let silly = this.extractDefinitionDetails(compounds)
		console.log(silly);		
		let stupid:vscode.SemanticTokens
		return stupid
		

		/*const builder = new vscode.SemanticTokensBuilder();
		allTokens.forEach((token) => {
			builder.push(token.line, token.startCharacter, token.length, token.tokenType, this._encodeTokenModifiers(token.tokenModifiers));
		});
		return builder.build();*/
	}


///(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?:\bGeneric(?:Perk|Position|String|Word|Name|Action|Boolean|Direction|Double|Constant|Cube|Stacking|Time)\b)/gd
///(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?:\b[Gg][eE][nN][eE][rR][iI][cC](?:[Pp][eE][rR][kK]|[Pp][oO][sS][iI][tT][iI][oO][nN]|[Ss][tT][rR][iI][nN][gG]|[Ww][oO][rR][dD]|[Nn][aA][mM][eE]|[Aa][cC][tT][iI][oO][nN]|[Bb][oO][oO][lL][eE][aA][nN]|[Dd][iI][rR][eE][cC][tT][iI][oO][nN]|[Dd][oO][uU][bB][lL][eE]|[Cc][oO][nN][sS][tT][aA][nN][tT]|[Cc][uU][bB][eE]|[Ss][tT][aA][cC][kK][iI][nN][gG]|[Tt][iI][mM][eE])\b)/gd
	private extractDefinitionDetails(compounds: compoundCaptures) {
		function packIntoCompound (capture:RegExpMatchArray): Compound {
			let args:Arguments[] = []
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
		let abilities: Compound[] = []
		let actions: Compound[] = []
		let booleans: Compound[] = []
		let directions: Compound[] = []
		let doubles: Compound[] = []
		let cubes: Compound[] = []
		let positions: Compound[] = []
		for (let captures of Object.entries(compounds)) {
			for (let capture of captures[1]){
				switch (capture[1]) {
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
						console.log("Something has gone wrong or a new compound type was added");
						break;
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
		}
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
