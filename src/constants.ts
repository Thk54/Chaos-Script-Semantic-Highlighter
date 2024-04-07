import * as vscode from "vscode";
import { CDefined } from "./classes";
import { CGatherResults } from "./classes";
export const tokenTypes = new Map<string, number>();
export const tokenModifiers = new Map<string, number>();
export const typesLegend = new Map<string, string>();

export const fileToGatherResults = new Map<string,CGatherResults>();
export let nameToDefines = new Map<string,CDefined[]>();

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
		'c'/* 'COMPOUND PERK' */, //'enum',//teal
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
const argOptions = {
	CCUBE: {type:'CUBE'},
	CDOUBLE: {type:'DOUBLE'},
	CACTION: {type:'ACTION'},
	CBOOLEAN: {type:'BOOLEAN'},
	CABILITY: {type:'ABILITY'},
	CTRIGGER: {type:'TRIGGER'},
	CDIRECTION: {type:'DIRECTION'},
	CPOSITION: {type:'POSITION'},

	OtherSTRING: {type:''},
	CampaginValueSTRING: {type:''},
	TypeSTRING: {type:''},

	DTEXTTOOLTIP: {type:''},
	DARTOVERRIDE: {type:''},
	DDOACTION: {type:''},
	DSCENARIO: {type:''},
	DPERK: {type:''}, 
	DCUBE: {type:''},

	numConstant: {type:''},
	VISUAL: {type:''},
	ANIMATION: {type:''},
	ENDUSER: {type:'ENDUSER'},
	NONE: {type:''}
}
export const compoundAbilityFlags = new Map([['Visual:',[argOptions.VISUAL]],['Text:',[argOptions.ENDUSER]],['ExtraTrigger:',[argOptions.CTRIGGER]]/* ,['CubeColourShift:',],['NO_DUPLICATES',],['LOCAL',],['INVISIBLE',],['VISIBLE',],['OVERRIDE'] */])
export const perkFlags = new Map([['Ability:',[argOptions.CTRIGGER]],['WorldAbility:',[argOptions.CTRIGGER]],['CampaignAbility:',[argOptions.CTRIGGER]],['AbilityText:',[argOptions.ENDUSER]],
['ExtraTrigger:',[argOptions.CTRIGGER]],['Value:',[argOptions.numConstant]],['UpgradeFrom:',[argOptions.DPERK]],['IsUpgradeFrom:',[argOptions.DPERK]],['ObtainAction:',[argOptions.CACTION]],['ClickAction:',[argOptions.CACTION]],
['RemoveAction:',[argOptions.CACTION]],['PerkRequirement:',[argOptions.DPERK]],['PerkRequirementAmount:',[argOptions.numConstant]],['LevelRequirement:',[argOptions.numConstant]],
['ReferenceCube:',[argOptions.DCUBE]],['Description:',[argOptions.ENDUSER]],['TODO:',[argOptions.ENDUSER]],['DebugN',[argOptions.numConstant]],['BelongsTo:',[argOptions.TypeSTRING]],['Requirement:',[argOptions.CBOOLEAN]]/* ,['Unique'],['RemoveUponObtaining'],['UNUSED'],['Debug'],['Invisible:'],['Visible:'],['PerkBarSplit:'] */])
export const cubeFlags = new Map([['Ability:',[argOptions.CTRIGGER]],['AiPlacementRule:',[argOptions.CBOOLEAN]],['AiPlacementAdd:',[argOptions.CDOUBLE,argOptions.CBOOLEAN]],['AiPlacementAbility:',[argOptions.CABILITY]],['ADDEDAICOST',[argOptions.numConstant]],
['TYPE',[argOptions.TypeSTRING]],['Variable:',[argOptions.OtherSTRING]],['LevelReq:',[argOptions.numConstant]],['Visual:',[argOptions.VISUAL]],['Animation:',[argOptions.ANIMATION]],
['Text:',[argOptions.ENDUSER]],['ExtraTrigger:',[argOptions.CTRIGGER]],['FlavourText:',[argOptions.ENDUSER]]/* ,['IDENT'],['Invisible'],['Debug'],['DebugE'],['UNUSUED'],['RNGAbility:'] */])

type tFlag = [string,IArg?];
export class CFlags {
	static universal:tFlag[] = [['OVERRIDE']]
	static compound:tFlag[] = [['ABILITY',{type:'TRIGGER'}],['ACTION',{type:'ACTION'}],['BOOLEAN',{type:'BOOLEAN'}], //unused property, handled elsewhere
		['DIRECTION',{type:'DIRECTION'}],['DOUBLE',{type:'DOUBLE'}],['CUBE',{type:'CUBE'}],['POSITION',{type:'POSITION'}]]
	static compoundAbility:tFlag[] = [['Visual:'/* ,{type:'VISUALTYPE'} */],['Text:',{type:'ENDUSER'}],['ExtraTrigger:',{type:'TRIGGER'}],
		['CubeColorShift:'],['NO_DUPLICATES'],['LOCAL'],['INVISIBLE'],['VISIBLE']]
	static perk:tFlag[] = [['Ability:',{type:'ABILITY'}],['WorldAbility:',{type:'ABILITY'}],['CampaignAbility:',{type:'ABILITY'}],['AbilityText:',{type:'ENDUSER'}],
		['ExtraTrigger:',{type:'TRIGGER'}],['Invisible:'],['Visible:'],['PerkBarSplit:'],['ObtainAction:',{type:'ACTION'}],['ClickAction:',{type:'ACTION'}],
		['RemoveAction:',{type:'ACTION'}],['PerkRequirement:'],['PerkRequirementAmount:'],['LevelRequirement:',{type:'DOUBLECONSTANT'}],['Requirement:'],['Debug'],
		['DebugN'],['Unique'],['ReferenceCube:',{type:'CUBECONSTANT'}],['UpgradeFrom:',{type:'PERKCONSTANT'}],['IsUpgradeFrom:',{type:'PERKCONSTANT'}],['RemoveUponObtaining'],
		['Description:',{type:'ENDUSER'}],['TODO:',{type:'ENDUSER'}],['UNUSED'],['BelongsTo:'],['Value:',{type:'DOUBLECONSTANT'}]]
	static cube:tFlag[] = [['Ability:',{type:'ABILITY'}],['RNGAbility:'],['AiPlacementRule:'],['AiPlacementAdd:'],['AiPlacementAbility:'],['IDENT'],['ADDEDAICOST'],
		['TYPE'],['Variable:'],['LevelReq:',{type:'DOUBLECONSTANT'}],['Debug'],['DebugE'],['Visual:'/* ,{type:'VISUALTYPE'} */],['Animation:'/* ,{type:'ANIMATIONTYPE'} */],
		['Text:',{type:'ENDUSER'}],['ExtraTrigger:',{type:'TRIGGER'}],['FlavourText:',{type:'ENDUSER'}],['Invisible'],['UNUSUED']]
	static compoundAbilityVisual:tFlag[] = [['Area'],['Arrow'],['Sword'],['Square'],['Target'],['Mist'],['Plus']]
	static cubeVisual:tFlag[] = this.compoundAbilityVisual
	static cubeAnimation:tFlag[] = [['CLOCK'],['TRIGGER'],['HP'],['DOUBLE'],['BOOLEAN'],['TIME']]
	constructor() {}
	public static get compoundFlags(){
		return CFlags.universal
	}
	public static get compoundAbilityFlags(){
		return CFlags.universal.concat(CFlags.compoundAbility)
	}
	public static get compoundAbilityVisualFlags(){
		return CFlags.compoundAbilityVisual
	}
	public static get perkFlags(){
		return CFlags.universal.concat(CFlags.perk)
	}
	public static get cubeFlags(){
		return CFlags.universal.concat(CFlags.cube)
	}
	public static get cubeVisualFlags(){
		return CFlags.cubeVisual
	}
	public static get cubeAnimationFlags(){
		return CFlags.cubeAnimation
	}
}
export interface IType {
	defineType:string
	compoundType?:string
}
export interface IName{
	name: string;
	asFound?: string;
	index: number;
}
export interface ICapture {
	text:string;
	index:number
}
export interface IArg {
	type:string
}
export interface IArgument extends IArg {
	type: string;
	string?: string;
	index?: number;
}