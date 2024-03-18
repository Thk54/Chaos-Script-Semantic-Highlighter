import * as vscode from "vscode";

export const tokenTypes = new Map<string, number>();
export const tokenModifiers = new Map<string, number>();
export const typesLegend = new Map<string, number>();
export const compoundTypeMap = new Map<string, number>();
export const defineTypeMap = new Map<string, number>();
export type typeToRegExMatches = Map<string, RegExpMatchArray[]>;
export const fileToCompoundsesMap = new Map<vscode.Uri, typeToCompoundsMap>();
export type typeToCompoundsMap = Map<string, ICompound[]>;
export const fileToDefinedsesMap = new Map<vscode.Uri, typeToDefinedsMap>();
export type typeToDefinedsMap = Map<string, IDefined[]>;
export const fileToNameToCompoundListMap = new Map<vscode.Uri, Map<string, ICompound>>();
export const fileToNameToDefinedListMap = new Map<vscode.Uri, Map<string, IDefined>>();
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
	];
	chaosMappings.forEach((TypeOfCompound, index) => typesLegend.set(TypeOfCompound, index));
})();

export interface IBuiltins {
	Type: string;
	Name: IBuiltInName;
	Arguments?: IArguments[];
}
export interface IBuiltInName {
	Name: string;
}

export interface IDefined extends IBuiltins {
	//Capture: string;
	Contents: IContents;
	Name: IName;
}

export interface ICompound extends IDefined {
}
interface IName extends IBuiltInName{
	Name: string;
	Index?: number;
}
interface IContents {
	Content: string;
	Index: number;
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

