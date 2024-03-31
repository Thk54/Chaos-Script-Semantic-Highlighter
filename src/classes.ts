import * as vscode from "vscode";
import { IType, IName, IArguments, typesLegend, tokenTypes, ICapture, nameToDefines } from "./constants";
import { regexes } from "./regexes";

export class CBuiltIn {
	type: CType;
	constructor(type: IType, public name: IName, public document: vscode.TextDocument, public args?: IArguments[]) {
		this.type = new CType(type);
	}
	public get Uri(): vscode.Uri {
		return this.document.uri;
	}
	public get UriString(): string {
		return this.Uri.toString();
	}
}

export class CDefined extends CBuiltIn {
	static initializeFinished = false;
	contents: CContents;
	constructor(regex: RegExpMatchArray, document: vscode.TextDocument) {
		let defineType = regex.groups['TypeOfDEFINE'].toUpperCase();
		super({ DefineType: defineType, CompoundType: regex?.groups['TypeOfCOMPOUND']?.toUpperCase() },
			{ Name: regex.groups['NameOf' + defineType].toLowerCase(), AsFound: regex.groups['NameOf' + defineType], Index: regex.indices.groups['NameOf' + defineType][0] },
			document);
		if (defineType === 'COMPOUND') {
			let args = [];
			for (let generic of regex.groups['ContentsOfCOMPOUND'].matchAll(regexes.genericsCapture)) {
				if (generic.groups['CompoundGenerics'])
					args.push({
						String: generic.groups['CompoundGenerics'],
						Type: generic.groups['CompoundGenerics'].slice(7),
						Index: generic.indices.groups['CompoundGenerics'][0] + regex.index
					});
			}
			this.args = args;
		}
		this.contents = new CContents(regex, defineType, document);
	}
}

export class CType {
	define: string;
	isCompoundDefine: boolean = false;
	isBuiltIn: boolean = false;
	typeString: string;
	legendEntry: string;
	constructor(Type: IType) {
		if (Type?.CompoundType) { //if it has this argument it is a compound
			this.isCompoundDefine = true;
			if (Type.DefineType === 'BUILT-IN') { //some compounds are "Built-in"
				this.isBuiltIn = true;
				this.typeString = 'BUILT-IN ' + Type.CompoundType; //and should show up as such
			} else { this.typeString = 'COMPOUND ' + Type.CompoundType; } //but otherwise be identical to normal compounds
			this.define = Type.CompoundType.toUpperCase();
		} else {
			this.define = Type.DefineType.toUpperCase(); //probably uppercaseing more than nessisary, but it has bit me too many times
			this.typeString = Type.DefineType;
		}
		this.legendEntry = typesLegend.get(this.isCompoundDefine ? 'COMPOUND ' + this.define : this.define) ?? 'unhandled.chaos'; //set to something specific or the fallback last entry
	}
	public isValidType() { return tokenTypes.get(this.legendEntry) !== tokenTypes.size; } //if it is the fallback we don't know what to do with it
}

export class CContents {
	capture: ICapture;
	content: string;
	index: number;
	components: CToken[] = [];
	constructor(regex: RegExpMatchArray, defineType: string, document: vscode.TextDocument) {
		this.capture = { Text: regex[0], Index: regex.index };
		this.content = regex.groups['ContentsOf' + defineType];
		this.index = regex.indices.groups['ContentsOf' + defineType][0];
		if (CDefined.initializeFinished) {
			for (let word of this.content.matchAll(regexes.stringExcluderCapture)) { // Mostly verbose could be more function-ized
				if ((defineType === 'TEXTTOOLTIP')) break; //abort if tooltiptext but still highlight name
				let result = nameToDefines.get(word[0].toLowerCase())?.length ? nameToDefines.get(word[0].toLowerCase())[0] : null;
				if (result) {
					let tokenStart = document.positionAt(this.index + word.index);
					this.components.push(new CToken(result, tokenStart));
				}
			}
		}
	}
}

export class CToken {
	range: vscode.Range;
	tokenType: string;
	tokenModifiers?: string[];
	constructor(define: CDefined, tokenStart: vscode.Position) {
		this.tokenType = define.type.legendEntry;
		this.range = new vscode.Range(tokenStart, tokenStart.translate({ characterDelta: define.name.Name.length }));
	}
}
export class GatherResults {
	constructor(public Document: vscode.TextDocument, public Defines: CDefined[], public Comments?: RegExpMatchArray[],
		public Scenarios?: RegExpMatchArray[], public ArtOverrides?: RegExpMatchArray[], public DoActions?: RegExpMatchArray[]) { }
}
