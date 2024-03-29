import * as vscode from "vscode";
export const tokenTypes = new Map<string, number>();
export const tokenModifiers = new Map<string, number>();
export const typesLegend = new Map<string, number>();

export const fileToGatherResults = new Map<string,GatherResults>();
export const nameToDefines = new Map<string,CDefined[]>();

export const compoundTypeMap = new Map<string, number>();
export const defineTypeMap = new Map<string, number>();

export const legend = (function () {
	const tokenTypesLegend = [
		'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 
		'namespace', 
		'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 
		'function', /*'member', deprecated redirects to method*/ 'method', 'macro', 
		'variable', 'parameter', 'property', 'enumMember', 'event',  'decorator', 
		'label'/*label actively maps to undefined*/
	];
	tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

	const tokenModifiersLegend = [
		'declaration', 'definition', 'documentation', 'readonly', 'static', 'abstract', 
		'deprecated', 'modification', 'async', 'defaultLibrary'
	];
	tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));

	return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();
export const generateMaps = (function () {
	const chaosMappings = [
		'COMMENT', //'comment',//green
		'COMPOUND ABILITY', //'string',//salmon
		'COMPOUND CUBE', //'keyword',//pink
		'COMPOUND DOUBLE', //'number',//pale yellow
		'COMPOUND STRING', //'regexp',//purple
		'COMPOUND PERK', //'operator',//offwhite
		'COMPOUND TRIGGER', //'namespace',//teal
		'TEXTTOOLTIP', //'type',//teal
		'g', //'struct',//teal
		'h', //'class',//teal
		'i', //'interface',//teal
		'COMPOUND BOOLEAN', //'enum',//teal
		'DOACTION', //'typeParameter',//teal
		'ARTOVERRIDE', //'function',//pale yellow
		'SCENARIO', //'method',//pale yellow
		'COMPOUND POSITION', //'decorator',//pale yellow
		'COMPOUND ACTION', //'macro',//blue
		'PERK', //'variable',//light sky blue
		'CUBE', //'parameter',//light sky blue
		'COMPOUND DIRECTION', //'property',//light sky blue
		'COMPOUND TYPE', //'label'//text white 
		'UHANDLED UHANDLED'
	];
	chaosMappings.forEach((TypeOfCompound, index) => typesLegend.set(TypeOfCompound, index));
})();
export class CBuiltIn {
	Type:CType
	constructor(Type:IType, public Name:IName, public Document:vscode.TextDocument, public Arguments?:IArguments[]) {
		this.Type = new CType(Type)
	}	
	public get Uri() : vscode.Uri {
		return this.Document.uri
	} 
	public get UriString() : string {
		return this.Uri.toString()
	}
}
export class CDefined extends CBuiltIn {
	Contents: IContents;
	constructor(type:{DefineType:string, CompoundType?:string}, name:IName, document:vscode.TextDocument, contents:IContents, args?:IArguments[]) {
		super(type,name,document,args)
		this.Contents = contents
	}
}
interface IType {
	DefineType:string
	CompoundType?:string
}
export class CType {
	Define:string
	isCompoundDefine:boolean = false
	isBuiltIn:boolean = false
	typeString:string
	legendEntry: number
	constructor(Type:IType) {
		if (Type?.CompoundType) {
			this.isCompoundDefine = true
			if (Type.CompoundType === 'BUILT-IN') {
				this.isBuiltIn = true
				this.typeString = 'BUILT-IN ' + Type.CompoundType
			} else {this.typeString = 'COMPOUND ' + Type.CompoundType}
			this.Define = Type.CompoundType.toUpperCase()
		} else {
			this.Define = Type.DefineType.toUpperCase()
			this.typeString = Type.DefineType
		}
		this.legendEntry = typesLegend.get(this.isCompoundDefine ? 'COMPOUND '+this.Define : this.Define) ?? typesLegend.size
	}
	public isValidType() {return this.legendEntry !== typesLegend.size}
}
interface IName{
	Name: string;
	AsFound?: string;
	Index: number;
}
interface IContents {
	Capture: ICapture;
	Content: string;
	Index: number;
}
interface ICapture {
	Text:string;
	Index:number
}
export interface IArguments {
	Type: string;
	String?: string;
	Index?: number;
}
export class GatherResults {
	constructor(public Document: vscode.TextDocument, public Defines: CDefined[], public Comments?: RegExpMatchArray[], 
		public Scenarios?: RegExpMatchArray[], public ArtOverrides?: CDefined[], public DoActions?: CDefined[]) {}
	
	public get value() : string {
		return 
	}
	
}
interface Token {
	line: number;
	character: number;
	length: number;
	type: number;
	modifiers?: number;
}

