import * as vscode from "vscode";
import { CFlags } from "./constants";
export module regexes {

	const blankBehind = /(?<=\s|^)/.source //need to say above the exported generated constants so the generators don't try to use these constants before they are initialized
	const blankAhead = /(?=\s|$)/.source
	
	export const commentCapture = generateCommentCapture()
	export const scenarioCapture = generateScenarioCapture()
	export const primaryCapture = generatePrimaryCapture()
	export const genericsCapture = generateGenericsCapture()
	export const scenarioCommentsCapture = generateScenarioCommentsCapture()
	export const stringExcluderCapture = generateStringExcluderCapture()
	
	export function generateCommentCapture():RegExp{
		return RegExp(blankBehind+/\/-(?=\s).*?\s-\//.source+blankAhead,'gs')
	}
	
	export function generateScenarioCapture():RegExp{
		return RegExp(/\b/.source+caseInsensify('Scenario')+/\:\s[\s\S]*?\b[Ss][Ee][Nn][Dd]\b/.source,'gs')
	}

	export function generatePrimaryCapture():RegExp{
		return RegExp(definesDeclarationCapture()+unnamedCapture(unnamedCapture(/*End termintated defines*/unnamedCapture(compoundSubCapture()+'|'+cubeSubCapture()+'|'+perkSubCapture()+'|'+textTooltipSubCapture())+'\\b'+caseInsensify('End')+'\\b')+'|'+artoverrideSubCapture()),"gsd")
	}
	function definesDeclarationCapture():string{
		let possibleDefines:string[] = ['compound', 'cube', 'perk', /* 'doaction', 'scenario',*/ 'artoverride', 'texttooltip']
		return (/\b/.source+namedCapture('TypeOfDEFINE',caseInsensify(possibleDefines).join('|'))+/:\s/.source)
	}
	function compoundSubCapture():string{
		let normalEndUser = ['Text']
		let gainAbilityText = ['GainAbilityText']
		let compoundNames = ['TRIGGER', 'ABILITY', 'ACTION', 'BOOLEAN', 'CUBE', 'DIRECTION', 'POSITION', 'DOUBLE', 'PERK', 'STRING']
		return unnamedCapture(lookBehindify(caseInsensify('Compound')+':\\s')+'\\s*'+namedCapture('TypeOfCOMPOUND', compoundNames.join('|'))+'\\s*'+namedCapture('NameOfCOMPOUND', '\\S*')+'\\s'+namedCapture('ContentsOfCOMPOUND', '.*?'+internalUsersOfEndHandler(normalEndUser,gainAbilityText)))//+'\\b[Ee][Nn][Dd]\\b'
	}
	function cubeSubCapture():string{
		let normalEndUser = ['(?:Flavour)?Text'] //FlavorText: and Text:
		let gainAbilityText = ['GainAbilityText']
		return unnamedCapture(lookBehindify(caseInsensify('cube')+':\\s')+'\\s*'+namedCapture('NameOfCUBE', '\\S+')+'\\s+'+namedCapture('ContentsOfCUBE','.*?'+internalUsersOfEndHandler(normalEndUser,gainAbilityText)))
	}
	function perkSubCapture():string{
		let normalEndUser = ['AbilityText','Description','TODO']
		let gainAbilityText = ['GainAbilityText']
		return unnamedCapture(lookBehindify(caseInsensify('perk')+':\\s')+'\\s*'+namedCapture('NameOfPERK', '\\S+')+'\\s+'+namedCapture('ContentsOfPERK','.*?'+internalUsersOfEndHandler(normalEndUser,gainAbilityText)))
	}
	function textTooltipSubCapture():string{
		return unnamedCapture(lookBehindify(caseInsensify('TextTooltip')+':\\s')+'\\s*'+namedCapture('NameOfTEXTTOOLTIP', '\\S+')+'\\s+'+namedCapture('ContentsOfTEXTTOOLTIP', '.*?'))
	}
	function artoverrideSubCapture():string{
		//Possible first args: [name], CUBE, PERK, ALL
	return (unnamedCapture(lookBehindify(caseInsensify('artoverride')+':\\s')+'\\s*'+unnamedCapture(
		[unnamedCapture('ALL\\s+'+namedCapture('ARTOVERRIDEFolder', '\\S+')+'\\s+'+namedCapture('ARTOVERRIDESubstring', '\\S+')), 
		unnamedCapture('PERK\\s+'+namedCapture('ARTOVERRIDEPerk', '\\S+')), 
		unnamedCapture('CUBE\\s+'+namedCapture('ARTOVERRIDECube', '\\S+')), 
		namedCapture('ARTOVERRIDEName','\\S+')].join('|'))+blankAhead))
	}
	export function generateGenericsCapture():RegExp{
		let genericTypes = ['Perk', 'Position', 'String', 'Word', 'Name', 'Action', 'Boolean', 'Direction', 'Double', 'Constant', 'Cube', 'Stacking', 'Time']
		return RegExp('(?:\\b(?:Text:|GainAbilityText)\\s.*?\\b[Ee][Nn][Dd]\\b)|'+namedCapture('CompoundGenerics', caseInsensify('Generic')+unnamedCapture(caseInsensify(genericTypes).join('|'))+'\\b'),'gd')
	}
	export function generateScenarioCommentsCapture():RegExp{
		return RegExp(blankBehind+'//\\s(?:.*?\\s)?//'+blankAhead,'gs')
	}
	export function generateStringExcluderCapture():RegExp{ // a little over verbose
		let normalEndUser = ['(?:Ability|Flavour)?Text','Description','TODO']
		let gainAbilityText = ['GainAbilityText']
		return RegExp(blankBehind+unnamedCapture(/\b(?:(?:(?:Ability|Flavour)?Text|Description|TODO):|(?<GainAbilityText>GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b|\S+?/.source)+blankAhead,'gis')
	}
	export function generateCaptureWordInLineFromPositionRegEx(pos:vscode.Position):RegExp {
		return new RegExp(blankBehind+'\\S*?'+lookBehindify('^.{'+pos.character+'}')+'\\S*?'+blankAhead)
	}
	export function generateWorkspaceSymbolsFilter(query:string):RegExp{
		return new RegExp('\\S*?'+Object.values(query).map((value:string)=>{return caseInsensify(value)+'\\S*?'}).join('').replaceAll(/(?:_|\\s)/g, '[_\\s]'))
	}
	function unnamedCapture(input:string):string{
		return ('(?:'+input+')')
	}
	function namedCapture(name:string,content:string):string{
		return ('(?<'+name+'>'+content+')')
	}
	function lookBehindify(input:string):string{
		return ('(?<='+input+')')
	}
	function internalUsersOfEndHandler(normal:string[],colenLess:string[] = ['']):string{
		return (unnamedCapture('\\b'+unnamedCapture(unnamedCapture(normal.join('|'))+':|'+unnamedCapture(colenLess.join('|')))+'\\s'+unnamedCapture('.(?!\\b'+caseInsensify('End')+'\\b)')+'*?.\\b'+caseInsensify('End')+'\\b.*?')+'*'+unnamedCapture('.(?!\\b'+caseInsensify('End')+'\\b)')+'*?')
	}
	function caseInsensify(input: string): string
	function caseInsensify(input:string[]):string[]
	function caseInsensify(input:string|string[]):string|string[] {
		if (typeof(input) === 'string') {
			return Object.values(input).map((value: string) => { if (value.toUpperCase() !== value.toLowerCase()) { return ('[' + value.toUpperCase() + value.toLowerCase() + ']'); } else { return value; } }).join('') }
		else {
			let result = []
			for (let string of input){
				result.push(Object.values(string).map((value: string) => { if (value.toUpperCase() !== value.toLowerCase()) { return ('[' + value.toUpperCase() + value.toLowerCase() + ']'); } else { return value; } }).join(''))
			}
			return result
		}
	}
}
