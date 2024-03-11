import * as vscode from 'vscode';
let lazy:number
let counter:number =0
const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();
enum ChaosTranslation {//green, salmon, pink, pale yellow, purple, off-text-white, teal, blue, light sky blue, and text-white
	'comment' = 'comment',//green
	'string' = 'string',//salmon
	'compoundCube' ='keyword',//pink
	'compoundDouble' ='number',//pale yellow
	'compoundAbility' ='regexp',//purple
	'compoundPerk' ='operator',//offwhite
	'e' ='namespace',//teal
	'f' ='type',//teal
	'g' ='struct',//teal
	'h' ='class',//teal
	'i' ='interface',//teal
	'compoundBoolean' ='enum',//teal
	'k' ='typeParameter',//teal
	'l' ='function',//pale yellow
	'm' ='method',//pale yellow
	'compoundPosition' ='decorator',//pale yellow
	'compoundAction' ='macro',//blue
	'p' ='variable',//light sky blue
	'q' ='parameter',//light sky blue
	'compoundDirection' ='property',//light sky blue
	's' ='label'//text white
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
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'cubechaos' }, new DocumentSemanticTokensProvider(), legend));
}
interface IParsedToken {
	line: number;
	startCharacter: number;
	length: number;
	tokenType: string;
	tokenModifiers: string[];
}

interface RegexGroup{
	index:number;
	length: number;
	name: string;
	content: string;
}

/*interface ILineAndOffset{
	lineNum:number;
	offset:number;
	originalOffset:number; 
}*/

class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		const allTokens = this._parseText(document);
		const builder = new vscode.SemanticTokensBuilder();
		allTokens.forEach((token) => {
			builder.push(token.line, token.startCharacter, token.length, this._encodeTokenType(token.tokenType), this._encodeTokenModifiers(token.tokenModifiers));
		});
		return builder.build();
	}

	private _encodeTokenType(tokenType: string): number {
		if (tokenTypes.has(tokenType)) {
			return tokenTypes.get(tokenType)!;
		} else if (tokenType === 'notInLegend') {
			return tokenTypes.size + 2;
		}
		return 0;
	}

	private _encodeTokenModifiers(strTokenModifiers: string[]): number {
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
	}



	private _parseText(document: vscode.TextDocument): IParsedToken[] {
		const text = document.getText()
		let tokens:IParsedToken[] = []
		const lineLengths: number[] = text.split(/\r\n|\r|\n/).map(l => l.length+ 1 + Number(1 < text.split(/\r\n/).length));
		/* /
		First try to capture comments
		(?:\s|^((/-)\s.*?\s-/)\s|$)|
		Try to capture all of any compounds
		(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<compoundType>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<compoundName>[\S]*)\s.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?\b[Ee][Nn][Dd]\b)|
		Try to capture most of other definition flags
		//todo
		/gsd */
		for (let match of text.matchAll(/(?<howExistsAreWe>[^\s\S])|(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<compoundType>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<compoundName>[\S]*)\s.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?\b[Ee][Nn][Dd]\b)/gsd)){
			lazy = match.length
			for (let token of this._returnTokensFromDefinitionMatch(match, document)){
				tokens.push({
					line: token.line,
					startCharacter: token.startCharacter,
					length: token.length,
					tokenType: token.tokenType,//token.tokenType,//tokenData.tokenType,
					tokenModifiers: token.tokenModifiers//token.tokenModifiers//tokenData.tokenModifiers}})
				})
			}
		} 
		return tokens;//only used if regx fails
	}



/*	private _getLineAndOffset(textOffset: number, lineLengths: number[], defStart?: ILineAndOffset):{lineNum: number; offset: number; ILineAndOffset:ILineAndOffset} {
		let ILineAndOffset: ILineAndOffset
		ILineAndOffset.originalOffset = textOffset
		let currentOffset: number = textOffset
		let currentLine: number = 0
		if (typeof defStart !== undefined){
			ILineAndOffset.originalOffset = defStart.originalOffset
			currentOffset = textOffset - defStart.originalOffset + defStart.offset
			currentLine = defStart.lineNum
		}
		while(currentOffset >= (lineLengths[currentLine])){
			currentOffset = currentOffset - (lineLengths[currentLine]);
			currentLine ++;
		}
		ILineAndOffset.lineNum = currentLine
		ILineAndOffset.offset = currentOffset
		return{lineNum: currentLine, offset: currentOffset, ILineAndOffset}
	}*/

	private _returnTokensFromDefinitionMatch(match:RegExpMatchArray, document: vscode.TextDocument): IParsedToken[] {
		let tokens:IParsedToken[] = []
		let groupsNames = []
		for (let name of Object.keys(match.groups)){
			if(match.groups[name] != undefined){
				groupsNames.push(name)
			}
		}
		for (let key of groupsNames) {
			let groupName:RegexGroup = {
			name: key,
			length: match.groups[key].length,
			index: match.indices.groups[key][0],
			content: match.groups[key]
			}
			tokens.push(this._createTokenFromGroupName(groupName,document))
			
		}
	/*	//const tokenData = this._parseTextToken(line.substring(1, 2));
		for (let i = 0; i < match.length; i++) {
			tokens.push({
				line: token.line,
				startCharacter: token.startCharacter,
				length: token.length,
				tokenType: token.tokenType,//tokenData.tokenType,
				tokenModifiers: token.tokenModifiers//tokenData.tokenModifiers
			});*/
		return tokens
	}

	private _createTokenFromGroupName(groupName:RegexGroup,document: vscode.TextDocument): IParsedToken {
		const position = document.positionAt(groupName.index)
		let docSym = new vscode.DocumentSymbol('string','alsostring',11,new vscode.Range(position,position.translate(groupName.length)),new vscode.Range(position,position.translate(lazy))) 
		
		counter++
		if (counter>20) counter=0
		let highlight:string
		for (let entry in Object.entries(ChaosTranslation)[counter]){
			if (groupName.name===entry[0]) highlight = entry[1]
		}
		return {
			line: position.line,
			startCharacter: position.character,
			length: groupName.length,
			tokenType: highlight,//ChaosTranslation.comment,//tokenData.tokenType,
			tokenModifiers: ['']//token.tokenModifiers//tokenData.tokenModifiers}
		}
	}
	private _parseTextToken(text: string): { tokenType: string; tokenModifiers: string[]; } {
		const parts = text.split('.');
		return {
			tokenType: parts[0],
			tokenModifiers: parts.slice(1)
		};
	}

}
