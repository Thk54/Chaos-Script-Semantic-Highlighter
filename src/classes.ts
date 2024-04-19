import * as vscode from "vscode";
import { IType, IName, IArgument, typesLegend, tokenTypes, ICapture, nameToDefines, IArg, argOptions, uriToGatherResultsDefines } from "./constants";
import { regexes } from "./regexes";
import { buildTree } from "./providers/treeFunctions";
import { protoDiagnostics } from "./initialize";

export class CBuiltIn {
	type: CType;
	constructor(type: IType, public name: IName, public document: vscode.TextDocument, public args?: IArgument[]) {
		this.type = new CType(type);
	}
	public get uri(): vscode.Uri {
		return this.document.uri;
	}
	public get uriString(): string {
		return this.uri.toString();
	}
}

export class CDefined extends CBuiltIn {
	static initializeFinished = false;
	nameMapEntryValue?: CDefined[] = null
	contents: CContents;
	define: CDefined[];
	constructor(regex: RegExpMatchArray, document: vscode.TextDocument) {
		let defineType = regex.groups['TypeOfDEFINE'].toUpperCase();
		super(<IType>{ defineType: defineType, compoundType: regex?.groups['TypeOfCOMPOUND']?.toUpperCase() },
			<IName>{ name: regex.groups['NameOf' + defineType].toLowerCase(), asFound: regex.groups['NameOf' + defineType], index: document.positionAt(regex.indices.groups['NameOf' + defineType][0]) },
			document);
		{
			if (defineType === 'COMPOUND') {
				let args = [];
				for (let generic of regex.groups['ContentsOfCOMPOUND'].matchAll(regexes.genericsCapture)) {
					if (generic.groups['CompoundGenerics']){
						let mapString = generic.groups['CompoundGenerics'].slice(7)
						if (mapString.toUpperCase() === mapString) {
							mapString = mapString.toUpperCase() + 'compound';
						} else { mapString = mapString.toUpperCase() + 'compound'}
						if (mapString === 'TIMEcompound') mapString = argOptions.DOUBLEcompound.mapString
						let startPos = document.positionAt(generic.indices.groups['CompoundGenerics'][0] + regex.index)
						args.push({
							string: generic.groups['CompoundGenerics'],
							mapString: mapString,
							index: generic.indices.groups['CompoundGenerics'][0] + regex.index,
							location: new vscode.Location(document.uri,new vscode.Range(startPos,startPos.translate({characterDelta:generic.groups['CompoundGenerics'].length})))
						});}
				}
				this.args = args;
			}
			this.contents = new CContents(regex, defineType, document, this);
			if (CDefined.initializeFinished) {this.contents.buildTheTree()}
		}
	}
	public setMapEntryValue(input:CDefined[]):CDefined {
		this.nameMapEntryValue = input
		return this
	}
}

export class CType {
	define: string;
	isCompoundDefine: boolean = false;
	isBuiltIn: boolean = false;
	typeString: string;
	legendEntry: string;
	constructor(Type: IType) {
		if (Type?.compoundType) { //if it has this argument it is a compound
			this.isCompoundDefine = true;
			if (Type.defineType === 'BUILT-IN') { //some compounds are "Built-in"
				this.isBuiltIn = true;
				this.typeString = 'BUILT-IN ' + Type.compoundType; //and should show up as such
			} else { this.typeString = 'COMPOUND ' + Type.compoundType; } //but otherwise be identical to normal compounds
			if (Type.compoundType.toUpperCase() === Type.compoundType) {
				this.define = Type.compoundType.toUpperCase() + 'compound';
			} else { this.define = Type.compoundType.toUpperCase() + 'const'}
			
		} else {
			this.define = Type.defineType.toUpperCase() + 'define'; //probably uppercaseing more than nessisary, but it has bit me too many times
			this.typeString = Type.defineType;
		}
		this.legendEntry = typesLegend.get(this.define) ?? 'unhandled.chaos'; //set to something specific or the fallback last entry

	}
	public isValidType() { return tokenTypes.get(this.legendEntry) !== tokenTypes.size; } //if it is the fallback we don't know what to do with it
	public satisfiesArgument(arg:string):boolean{
		
		return
	} 
	public defaultArgs():IArg[]{
		let args:IArg[] = []
		if (this.isCompoundDefine) {
			if (this.define === argOptions.ABILITYcompound.mapString) {
				args = [argOptions.TRIGGERconst];
			} else { args = [{ mapString: this.define }]; }
		}
		return args
	}
}

export class CContents {
	capture: ICapture;
	content: string;
	index: number;
	location: vscode.Location
	components: CToken[] = [];
	tree?: DocumentSymbolPlus
	diagnostics:vscode.Diagnostic[] = []
	constructor(regex: RegExpMatchArray, defineType: string, document: vscode.TextDocument, private parent:CDefined) {
		this.capture = { text: regex[0], index: regex.index, location: new vscode.Location(document.uri,new vscode.Range(document.positionAt(regex.index),document.positionAt(regex.index+regex[0].length)))};
		this.content = regex.groups['ContentsOf' + defineType];
		this.index = regex.indices.groups['ContentsOf' + defineType][0];
		this.location = new vscode.Location(document.uri,new vscode.Range(document.positionAt(this.index+regex.index),document.positionAt(this.index+this.content.length+regex.index)))
	}
	buildTheTree(){
		this.tree = buildTree(this.parent, this.diagnostics)
	}
}

export class CToken {
	range: vscode.Range;
	tokenType: string;
	tokenModifiers?: string[];
	mapValue: CDefined[];
	constructor(defines: CDefined[], tokenStart: vscode.Position) {
		this.tokenType = defines[0].type.legendEntry;
		this.range = new vscode.Range(tokenStart, tokenStart.translate({ characterDelta: defines[0].name.name.length }));
		this.mapValue = defines
	}
}
export class CGatherResults {
	constructor(public document: vscode.TextDocument, public defines: CDefined[], public comments?: RegExpMatchArray[],
		public scenarios?: RegExpMatchArray[], public ArtOverrides?: RegExpMatchArray[], public doActions?: RegExpMatchArray[]) { }
}

export class DocumentSymbolPlus extends vscode.DocumentSymbol {
	declare children: DocumentSymbolPlus[];
	constructor(name: string, detail: string, kind: vscode.SymbolKind, range: vscode.Range, selectionRange: vscode.Range, public define?:CDefined) {
		super(name,detail,kind,range,selectionRange)
	}
	get documentSymbolArray():DocumentSymbolPlus[]{
		let outputArray:DocumentSymbolPlus[] = []
		this.extractChildren(this,outputArray)
		return outputArray
	}
	private extractChildren(present:DocumentSymbolPlus,outputArray:DocumentSymbolPlus[]) {
		outputArray.push(present)
		if (present?.children){
			for (let child of present.children){
				this.extractChildren(child, outputArray)
			}
		}
	}
}