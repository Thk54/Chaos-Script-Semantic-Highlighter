import * as vscode from "vscode";
export const tokenTypes = new Map<string, number>();
export const tokenModifiers = new Map<string, number>();
export const typesLegend = new Map<string, number>();

export const fileToDefines = new Map<vscode.Uri,IDefined[]>();
export const builtins = new Map<vscode.Uri,IBuiltins[]>();
export const fileToNameToCompoundDefine = new Map<vscode.Uri,Map<string,ICompound>>();
export const fileToNameToDefine = new Map<vscode.Uri,Map<string,IDefined>>();

export const compoundTypeMap = new Map<string, number>();
export const defineTypeMap = new Map<string, number>();

export const legend = (function () {
	const tokenTypesLegend = [
		'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
		'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
		'method', 'decorator', 'macro', 'variable', 'parameter', 'property', 'label',
		'modifier', 'event', 'enumMember'
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
		'STRING'
	];
	compoundTypeKeyArray.forEach((TypeOfCompound, index) => compoundTypeMap.set(TypeOfCompound, index));
	
	const defineTypeKeyArray = [
		'COMPOUND', //important that this maps to zero for else fallthough
		'CUBE',
		'PERK',
		'SCENARIO',
		'ARTOVERRIDE',
		'TEXTTOOLTIP',
		'COMMENT'
	];
	defineTypeKeyArray.forEach((TypeOfDefine, index) => defineTypeMap.set(TypeOfDefine, index));
	const chaosMappings = [
		'COMMENT', //'comment',//green
		'COMPOUNDABILITY', //'string',//salmon
		'COMPOUNDCUBE', //'keyword',//pink
		'COMPOUNDDOUBLE', //'number',//pale yellow
		'COMPOUNDSTRING', //'regexp',//purple
		'COMPOUNDPERK', //'operator',//offwhite
		'COMPOUNDTRIGGER', //'namespace',//teal
		'TEXTTOOLTIP', //'type',//teal
		'g', //'struct',//teal
		'h', //'class',//teal
		'i', //'interface',//teal
		'COMPOUNDBOOLEAN', //'enum',//teal
		'k', //'typeParameter',//teal
		'ARTOVERRIDE', //'function',//pale yellow
		'SCENARIO', //'method',//pale yellow
		'COMPOUNDPOSITION', //'decorator',//pale yellow
		'COMPOUNDACTION', //'macro',//blue
		'PERK', //'variable',//light sky blue
		'CUBE', //'parameter',//light sky blue
		'COMPOUNDDIRECTION', //'property',//light sky blue
		'COMPOUNDTYPE', //'label'//text white 
		'UHANDLEDUHANDLED'
	];
	chaosMappings.forEach((TypeOfCompound, index) => typesLegend.set(TypeOfCompound, index));
})();

export interface IBuiltins {
	Type: IType;
	Name: IBuiltInName;
	Arguments?: IArguments[];
}
export interface IBuiltInName {
	Name: string;
}
export interface IDefined {
	Type: IType;
	Contents: IContents;
	Name: IName;
}
export interface ICompound extends IDefined, IBuiltins {
	Name: IName;
}
export interface IType {
	Define:string
	Compound?:string
}
interface IName extends IBuiltInName{
	Name: string;
	Index?: number;
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
interface Token {
	line: number;
	character: number;
	length: number;
	type: number;
	modifiers?: number;
}

