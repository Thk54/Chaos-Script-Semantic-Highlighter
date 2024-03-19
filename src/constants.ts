import * as vscode from "vscode";
export const tokenTypes = new Map<string, number>();
export const tokenModifiers = new Map<string, number>();
export const typesLegend = new Map<IType, number>();

export const fileToDefines = new Map<vscode.Uri,IBuiltins[]>();

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
	const chaosMappings:IType[] = [
		{Define:'COMMENT'}, //'comment',//green
		{Define:'COMPOUND', Compound:'ABILITY'}, //'string',//salmon
		{Define:'COMPOUND', Compound:'CUBE'}, //'keyword',//pink
		{Define:'COMPOUND', Compound:'DOUBLE'}, //'number',//pale yellow
		{Define:'COMPOUND', Compound:'STRING'}, //'regexp',//purple
		{Define:'COMPOUND', Compound:'PERK'}, //'operator',//offwhite
		{Define:'COMPOUND', Compound:'TRIGGER'}, //'namespace',//teal
		{Define:'TEXTTOOLTIP'}, //'type',//teal
		{Define:'g'}, //'struct',//teal
		{Define:'h'}, //'class',//teal
		{Define:'i'}, //'interface',//teal
		{Define:'COMPOUND', Compound:'BOOLEAN'}, //'enum',//teal
		{Define:'k'}, //'typeParameter',//teal
		{Define:'ARTOVERRIDE'}, //'function',//pale yellow
		{Define:'SCENARIO'}, //'method',//pale yellow
		{Define:'COMPOUND', Compound:'POSITION'}, //'decorator',//pale yellow
		{Define:'COMPOUND', Compound:'ACTION'}, //'macro',//blue
		{Define:'PERK'}, //'variable',//light sky blue
		{Define:'CUBE'}, //'parameter',//light sky blue
		{Define:'COMPOUND', Compound:'DIRECTION'}, //'property',//light sky blue
		{Define:'COMPOUND', Compound:'TYPE'} //'label'//text white 
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
interface IType {
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

