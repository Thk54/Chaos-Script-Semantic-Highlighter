import * as vscode from "vscode";
import { CDefined } from "./classes";
import { GatherResults } from "./classes";
export const tokenTypes = new Map<string, number>();
export const tokenModifiers = new Map<string, number>();
export const typesLegend = new Map<string, string>();

export const fileToGatherResults = new Map<string,GatherResults>();
export const nameToDefines = new Map<string,CDefined[]>();

export const legend = (function () {
	const tokenTypesLegend = [
		'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 
		'namespace', 
		'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 
		'function', /*'member', deprecated redirects to method*/ 'method', 'macro', 
		'variable', 'parameter', 'property', 'enumMember', 'event',  'decorator', 
		'label',/*label actively maps to undefined*/
		'entity.other.attribute-name.position.chaos',
		'unhandled.chaos'
	];
	tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

	const tokenModifiersLegend = [
		'declaration', 'definition', 'documentation', 'readonly', 'static', 'abstract', 
		'deprecated', 'modification', 'async', 'defaultLibrary'
	];
	tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));
	const chaosMappings = [
		'COMMENT', //'comment',//green
		'h', //'string',//salmon
		'COMPOUND CUBE', //'keyword',//pink
		'COMPOUND DOUBLE', //'number',//pale yellow
		'COMPOUND STRING', //'regexp',//purple
		'COMPOUND BOOLEAN', //'operator',//offwhite
		'COMPOUND ABILITY', //'namespace',//teal
		'TEXTTOOLTIP', //'type',//teal
		'g', //'struct',//teal
		'COMPOUND TRIGGER', //'class',//teal
		'ARTOVERRIDE', //'interface',//teal
		'COMPOUND PERK', //'enum',//teal
		'DOACTION', //'typeParameter',//teal
		'COMPOUND ACTION', //'function',//pale yellow
		'SCENARIO', //'method',//pale yellow
		'i', //'macro',//blue
		'PERK', //'variable',//light sky blue
		'CUBE', //'parameter',//light sky blue
		'z', //'property',//light sky blue
		'a', //'enumMember',//bright light blue
		'v', //'event',//light sky blue
		'COMPOUND DIRECTION', //'decorator',//pale yellow
		'COMPOUND TYPE', //'label'//undefined
		'COMPOUND POSITION',//entity.other.attribute-name.position.chaos
		'UHANDLED'
	];
	chaosMappings.forEach((TypeOfCompound, index) => typesLegend.set(TypeOfCompound, tokenTypesLegend[index]));
	return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();

export const generateMaps = (function () {

})();
export interface IType {
	DefineType:string
	CompoundType?:string
}
export interface IName{
	Name: string;
	AsFound?: string;
	Index: number;
}
export interface ICapture {
	Text:string;
	Index:number
}
export interface IArgs {
	type:string
}
export interface IArguments extends IArgs {
	type: string;
	string?: string;
	index?: number;
}
interface Token {
	line: number;
	character: number;
	length: number;
	type: number;
	modifiers?: number;
}

