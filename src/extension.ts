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
	//context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'cubechaos' }, new DocumentSemanticTokensProvider(), legend))
}


interface IParsedToken {
	line: number;
	startCharacter: number;
	length: number;
	tokenType: number;
	tokenModifiers: string[];
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
		for (let match of document.getText().matchAll(/(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<compoundType>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<compoundName>[\S]*)\s.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?\b[Ee][Nn][Dd]\b)/gsd)){
			let compoundStartPos = document.positionAt(match.index)
			let compoundEndPos = document.positionAt(match.index+match.length)
			let compoundRange = new vscode.Range(compoundStartPos,compoundEndPos)
			let symbolStartPos = document.positionAt(match.indices.groups['compoundName'][0])
			let symbolEndPos = document.positionAt(match.indices.groups['compoundName'][1])
			let symbolRange = new vscode.Range(symbolStartPos,symbolEndPos)
			let symbolName = match.groups['compoundName']
			let symbolDetail = match.groups['compoundType']
			let symbolKind = 11// todo make this number dynamic
			docs.push(new vscode.DocumentSymbol(symbolName,symbolDetail,symbolKind,compoundRange,symbolRange))
		}

		return docs
	}
}

class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		const allTokens = this._parseText(document);
		const builder = new vscode.SemanticTokensBuilder();
		allTokens.forEach((token) => {
			builder.push(token.line, token.startCharacter, token.length, token.tokenType, this._encodeTokenModifiers(token.tokenModifiers));
		});
		return builder.build();
	}


	private _gatherCompounds(document: vscode.TextDocument): compoundCaptures {
		let abilities: RegExpMatchArray[] = []
		let actions: RegExpMatchArray[] = []
		let booleans: RegExpMatchArray[] = []
		let directions: RegExpMatchArray[] = []
		let doubles: RegExpMatchArray[] = []
		let cubes: RegExpMatchArray[] = []
		let positions: RegExpMatchArray[] = []
		for (let match of document.getText().matchAll(/(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<compoundType>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<compoundName>[\S]*)\s.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?\b[Ee][Nn][Dd]\b)/gsd)){
			switch (match.groups['compoundType']) {
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
					console.log("Something has gone wrong or a new type was added");
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
