import * as vscode from "vscode";
import { CDefined } from "./classes";
import { CGatherResults } from "./classes";
import { IArg } from "./classes";
export const tokenTypes = new Map<string, number>();
export const tokenModifiers = new Map<string, number>();
export const typesLegend = new Map<string, string>();

export const uriToGatherResultsDefines = new Map<string,CGatherResults>();
export let nameToDefines = new Map<string,CDefined[]>();

export const argOptions = { //this will probably need to be redone *sigh*
	CUBEcompound: new IArg({mapString:'CUBEcompound'}),
	DOUBLEcompound: new IArg({mapString:'DOUBLEcompound'}),
	STACKINGcompound: new IArg({mapString:'STACKINGcompound'}),
	CONSTANTcompound: new IArg({mapString:'CONSTANTcompound'}),
	ACTIONcompound: new IArg({mapString:'ACTIONcompound'}),
	BOOLEANcompound: new IArg({mapString:'BOOLEANcompound'}),
	ABILITYcompound: new IArg({mapString:'ABILITYcompound'}),
	DIRECTIONcompound: new IArg({mapString:'DIRECTIONcompound'}),
	POSITIONcompound: new IArg({mapString:'POSITIONcompound'}),
	STRINGcompound: new IArg({mapString:'STRINGcompound'}),
	NAMEcompound: new IArg({mapString:'NAMEcompound'}),
	TRIGGERcompound: new IArg({mapString:'ABILITYcompound'}),
	PERKcompound: new IArg({mapString:'PERKcompound'}),
	TIMEcompound: new IArg({mapString:'TIMEcompound'}),
	
	LISTconst: new IArg({mapString:'LISTconst'}),
	STRINGconst: new IArg({mapString:'STRINGconst'}),//catchall string
	ACTIONconst: new IArg({mapString:'ACTIONconst'}),
	TRIGGERconst: new IArg({mapString:'ABILITYconst'}),
	DOUBLEconst: new IArg({mapString:'DOUBLEconst'}),
	ABILITYconst: new IArg({mapString:'ABILITYconst'}),
	INTconst: new IArg({mapString:'INTconst'}), //int

	STRINGvar: new IArg({mapString:'STRINGcompound'}),//catchall string
	STRINGcampaginValue: new IArg({mapString:'STRINGcompound'}),//todo figure out valid campgain values
	STRINGtype: new IArg({mapString:'STRINGcompound'}),//todo list types

	TEXTTOOLTIPdefine: new IArg({mapString:'TEXTTOOLTIPdefine'}),
	ARTOVERRIDEdefine: new IArg({mapString:'ARTOVERRIDEdefine'}),
	DOACTIONdefine: new IArg({mapString:'DOACTIONdefine'}),
	SCENARIOdefine: new IArg({mapString:'SCENARIOdefine'}),
	PERKdefine: new IArg({mapString:'PERKdefine'}), 
	CUBEdefine: new IArg({mapString:'CUBEdefine'}),

	VISUAL: new IArg({mapString:'VISUALS'}),
	ANIMATION: new IArg({mapString:'ANIMATIONS'}),
	ENDUSER: new IArg({mapString:'ENDUSER'}),

	TYPEcompound: new IArg({mapString:'TYPEcompound'}),
	NONE: new IArg({mapString:''})
}
{
	argOptions.CUBEcompound.satisfies = [argOptions.CUBEcompound]
	argOptions.DOUBLEcompound.satisfies = [argOptions.DOUBLEcompound]
	argOptions.ACTIONcompound.satisfies = [argOptions.ACTIONcompound, argOptions.ACTIONconst] //always asked for as a constant
	argOptions.BOOLEANcompound.satisfies = [argOptions.BOOLEANcompound]
	argOptions.ABILITYcompound.satisfies = [argOptions.ABILITYcompound, argOptions.ABILITYconst] //always asked for as a constant
	argOptions.DIRECTIONcompound.satisfies = [argOptions.DIRECTIONcompound]
	argOptions.POSITIONcompound.satisfies = [argOptions.POSITIONcompound]
	argOptions.STRINGcompound.satisfies = [argOptions.STRINGcompound]
	argOptions.NAMEcompound.satisfies = [argOptions.NAMEcompound]
	argOptions.TRIGGERcompound.satisfies = [argOptions.TRIGGERcompound]
	argOptions.PERKcompound.satisfies = [argOptions.PERKcompound]
	argOptions.TIMEcompound.satisfies = [argOptions.TIMEcompound]
	
	argOptions.LISTconst.satisfies = [argOptions.LISTconst]
	argOptions.STRINGconst.satisfies = [argOptions.STRINGconst, argOptions.STRINGcompound, argOptions.NAMEcompound]
	argOptions.ACTIONconst.satisfies = [argOptions.ACTIONconst, argOptions.ACTIONcompound]
	argOptions.TRIGGERconst.satisfies = [argOptions.TRIGGERconst, argOptions.TRIGGERcompound]
	argOptions.DOUBLEconst.satisfies = [argOptions.DOUBLEconst, argOptions.DOUBLEcompound, argOptions.INTconst, argOptions.TIMEcompound, argOptions.LISTconst, argOptions.STACKINGcompound, argOptions.CONSTANTcompound]
	argOptions.ABILITYconst.satisfies = [argOptions.ABILITYconst, argOptions.ABILITYcompound]
	argOptions.INTconst.satisfies = [argOptions.INTconst, argOptions.TIMEcompound]

	argOptions.STRINGvar.satisfies = [argOptions.STRINGvar]
	argOptions.STRINGcampaginValue.satisfies = [argOptions.STRINGcampaginValue]
	argOptions.STRINGtype.satisfies = [argOptions.STRINGtype]

	argOptions.TEXTTOOLTIPdefine.satisfies = [argOptions.TEXTTOOLTIPdefine]
	argOptions.ARTOVERRIDEdefine.satisfies = [argOptions.ARTOVERRIDEdefine]
	argOptions.DOACTIONdefine.satisfies = [argOptions.DOACTIONdefine]
	argOptions.SCENARIOdefine.satisfies = [argOptions.SCENARIOdefine]
	argOptions.PERKdefine.satisfies = [argOptions.PERKdefine]
	argOptions.CUBEdefine.satisfies = [argOptions.CUBEdefine]

	argOptions.VISUAL.satisfies = [argOptions.VISUAL]
	argOptions.ANIMATION.satisfies = [argOptions.ANIMATION]
	argOptions.ENDUSER.satisfies = [argOptions.ENDUSER]

	argOptions.TYPEcompound.satisfies = [argOptions.TYPEcompound]
	argOptions.NONE.satisfies = [argOptions.NONE]
}

export const defineTypeToArgOptionMap = new Map(
	[['String',argOptions.STRINGconst],['Action',argOptions.ACTIONconst],['Trigger',argOptions.TRIGGERconst],['double',argOptions.DOUBLEconst],['Ability',argOptions.ABILITYconst],['int',argOptions.INTconst]]
)
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
		argOptions.BOOLEANcompound.mapString, //'string',//salmon
		argOptions.CUBEcompound.mapString, //'keyword',//pink
		argOptions.DOUBLEcompound.mapString, //'number',//pale yellow
		argOptions.TEXTTOOLTIPdefine.mapString, //'regexp',//purple
		argOptions.STRINGcompound.mapString, //'operator',//offwhite
		argOptions.ABILITYcompound.mapString, //'namespace',//teal
		'h', //'type',//teal
		'g', //'struct',//teal
		argOptions.TRIGGERcompound.mapString, //'class',//teal
		argOptions.ARTOVERRIDEdefine.mapString, //'interface',//teal
		'c'/* 'COMPOUND PERK' */, //'enum',//teal
		argOptions.DOACTIONdefine.mapString, //'typeParameter',//teal
		'i', //'function',//pale yellow
		argOptions.SCENARIOdefine.mapString, //'method',//pale yellow
		argOptions.ACTIONcompound.mapString, //'macro',//blue
		argOptions.PERKdefine.mapString, //'variable',//light sky blue
		argOptions.CUBEdefine.mapString, //'parameter',//light sky blue
		argOptions.PERKcompound.mapString, //'property',//light sky blue
		argOptions.DIRECTIONcompound.mapString, //'enumMember',//bright light blue
		'v', //'event',//light sky blue
		'a', //'decorator',//pale yellow
		argOptions.TYPEcompound.mapString, //'label'//undefined
		argOptions.POSITIONcompound.mapString,//entity.other.attribute-name.position.chaos
		'UHANDLED'
	];
	chaosMappings.forEach((TypeOfCompound, index) => typesLegend.set(TypeOfCompound, tokenTypesLegend[index]));
	return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();



export const compoundAbilityFlags = new Map([['Visual:',[argOptions.VISUAL]],['Text:',[argOptions.ENDUSER]],['ExtraTrigger:',[argOptions.TRIGGERcompound]]/* ,['CubeColourShift:',],['NO_DUPLICATES',],['LOCAL',],['INVISIBLE',],['VISIBLE',],['OVERRIDE'] */])
export const perkFlags = new Map([['Ability:',[argOptions.TRIGGERcompound]],['WorldAbility:',[argOptions.TRIGGERcompound]],['CampaignAbility:',[argOptions.TRIGGERcompound]],['AbilityText:',[argOptions.ENDUSER]],
['ExtraTrigger:',[argOptions.TRIGGERcompound]],['Value:',[argOptions.INTconst]],['UpgradeFrom:',[argOptions.PERKdefine]],['IsUpgradeFrom:',[argOptions.PERKdefine]],['ObtainAction:',[argOptions.ACTIONcompound]],['ClickAction:',[argOptions.ACTIONcompound]],
['RemoveAction:',[argOptions.ACTIONcompound]],['PerkRequirement:',[argOptions.PERKdefine]],['PerkRequirementAmount:',[argOptions.INTconst]],['LevelRequirement:',[argOptions.INTconst]],
['ReferenceCube:',[argOptions.CUBEdefine]],['Description:',[argOptions.ENDUSER]],['TODO:',[argOptions.ENDUSER]],['DebugN',[argOptions.INTconst]],['BelongsTo:',[argOptions.STRINGtype]],['Requirement:',[argOptions.BOOLEANcompound]]/* ,['Unique'],['RemoveUponObtaining'],['UNUSED'],['Debug'],['Invisible:'],['Visible:'],['PerkBarSplit:'] */])
export const cubeFlags = new Map([['Ability:',[argOptions.TRIGGERcompound]],['AiPlacementRule:',[argOptions.BOOLEANcompound]],['AiPlacementAdd:',[argOptions.DOUBLEcompound,argOptions.BOOLEANcompound]],['AiPlacementAbility:',[argOptions.ABILITYcompound]],['ADDEDAICOST',[argOptions.INTconst]],
['TYPE',[argOptions.STRINGtype]],['Variable:',[argOptions.STRINGvar]],['LevelReq:',[argOptions.INTconst]],['Visual:',[argOptions.VISUAL]],['Animation:',[argOptions.ANIMATION]],
['Text:',[argOptions.ENDUSER]],['ExtraTrigger:',[argOptions.TRIGGERcompound]],['FlavourText:',[argOptions.ENDUSER]]/* ,['IDENT'],['Invisible'],['Debug'],['DebugE'],['UNUSUED'],['RNGAbility:'] */])

export interface IType {
	defineType: string;
	compoundType?: string;
}
export interface IName {
	name: string;
	asFound?: string;
	index: vscode.Position;
}
export interface ICapture {
	text: string;
	index: number;
	location: vscode.Location;
}