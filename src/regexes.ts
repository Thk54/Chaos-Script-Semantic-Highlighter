import * as consts from "./constants"
const blankBehind = /(?<=[\s^])/.source
const blankAhead = /(?=[\s$])/.source

/* const compoundTypeKeyArray = [
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
compoundTypeMap.set(TypeOfCompound, index)

const defineTypeKeyArray = [
	'COMPOUND', //important that this maps to zero for else fallthough
	'CUBE',
	'PERK',
	'SCENARIO',
	'ARTOVERRIDE',
	'TEXTTOOLTIP',
	'COMMENT'
];
defineTypeMap.set(TypeOfDefine, index) */

export function buildRegexes():RegExp[]{
	let outputRegexes:RegExp[] = []
	outputRegexes.push(commentCapture())
	outputRegexes.push(scenarioCapture())
	outputRegexes.push(primaryCapture())
	outputRegexes.push(genericsCapture())
	return outputRegexes
}


function commentCapture():RegExp{
	return RegExp(blankBehind+/\/-(?=\s).*?\s-\//.source+blankAhead,'gs')
}

function scenarioCapture():RegExp{
	return RegExp(/\b/.source+caseInsensify('Scenario')+/\:\s[\s\S]*?\b[Ss][Ee][Nn][Dd]\b/.source,'gs')
}

function primaryCapture():RegExp{
	return RegExp(definesDeclarationCapture()+unnamedCapture(/*End termintated defines*/unnamedCapture(compoundSubCapture()+'|'+cubeSubCapture()+'|'+perkSubCapture()+'|'+textTooltipSubCapture())+'\\b'+caseInsensify('End')+'\\b')+'|'+artoverrideSubCapture(),"gsd")
}
function definesDeclarationCapture():string{
	let possibleDefines:string[] = ['compound', 'cube', 'perk', /* 'scenario', */ 'artoverride', 'texttooltip']
	return (/\b/.source+namedCapture('TypeOfDefine',caseInsensify(possibleDefines).join('|'))+/:\s/.source)
}
///(?:\s*(?<TypeOfCompound>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<NameOfCompound>[\S]*)\s(?<ContentsOfCompound>.*?(?:\b(?:Text:|GainAbilityText)\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?)\b[Ee][Nn][Dd]\b)/
function compoundSubCapture():string{
	let normalEndUser = ['Text']
	let gainAbilityText = ['GainAbilityText']
	let compoundNames = ['TRIGGER', 'ABILITY', 'ACTION', 'BOOLEAN', 'CUBE', 'DIRECTION', 'POSITION', 'DOUBLE', 'PERK', 'STRING']
	return unnamedCapture(lookBehindify(caseInsensify('Compound')+':\\s')+'\\s*'+namedCapture('TypeOfCompound', compoundNames.join('|'))+'\\s*'+namedCapture('NameOfCompound', '\\S*')+'\\s'+namedCapture('ContentsOfCompound', '.*?'+internalUsersOfEndHandler(normalEndUser,gainAbilityText)))//+'\\b[Ee][Nn][Dd]\\b'
}
function cubeSubCapture():string{
	let normalEndUser = ['(?:Flavour)?Text'] //FlavorText: and Text:
	let gainAbilityText = ['GainAbilityText']
	return unnamedCapture(lookBehindify(caseInsensify('cube')+':\\s')+'\\s*'+namedCapture('NameOfCube', '\\S+')+'\\s+'+namedCapture('ContentsOfCube','.*?'+internalUsersOfEndHandler(normalEndUser,gainAbilityText)))
}
function perkSubCapture():string{
	let normalEndUser = ['AbilityText','Description','TODO']
	let gainAbilityText = ['GainAbilityText']
	return unnamedCapture(lookBehindify(caseInsensify('perk')+':\\s')+'\\s*'+namedCapture('NameOfPerk', '\\S+')+'\\s+'+namedCapture('ContentsOfPerk','.*?'+internalUsersOfEndHandler(normalEndUser,gainAbilityText)))
}
function textTooltipSubCapture():string{
	return unnamedCapture(lookBehindify(caseInsensify('TextTooltip')+':\\s')+'\\s*'+namedCapture('NameOfTextTooltip', '\\S+')+'\\s+'+namedCapture('ContentOfTextTooltip', '.*?'))
}
function artoverrideSubCapture():string{
	//Possible first args: [name], CUBE, PERK, ALL
return (unnamedCapture(lookBehindify(caseInsensify('artoverride')+':\\s')+'\\s*'+unnamedCapture(
	[unnamedCapture('ALL\\s+'+namedCapture('ArtOverrideFolder', '\\S+')+'\\s+'+namedCapture('ArtOverrideSubstring', '\\S+')), 
	unnamedCapture('PERK\\s+'+namedCapture('ArtOverridePerk', '\\S+')), 
	unnamedCapture('CUBE\\s+'+namedCapture('ArtOverrideCube', '\\S+')), 
	namedCapture('ArtOverrideName','\\S+')].join('|'))+blankAhead))
}
function genericsCapture():RegExp{
	let genericTypes = ['Perk', 'Position', 'String', 'Word', 'Name', 'Action', 'Boolean', 'Direction', 'Double', 'Constant', 'Cube', 'Stacking', 'Time']
	return RegExp('(?:\\b(?:Text:|GainAbilityText)\\s.*?\\b[Ee][Nn][Dd]\\b)|'+namedCapture('CompoundGenerics', caseInsensify('Generic')+unnamedCapture(caseInsensify(genericTypes).join('|'))+'\\b'),'gd')
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
function caseInsensify(input: string|string[]):string|string[] {
	if (typeof(input) === 'string') {
		let result: string = '';
		return Object.values(input).map((value: string) => { if (value.toUpperCase() !== value.toLowerCase()) { return ('[' + value.toUpperCase() + value.toLowerCase() + ']'); } else { return value; } }).join('') }
	else {
		let result = []
		for (let string of input){
			result.push(Object.values(string).map((value: string) => { if (value.toUpperCase() !== value.toLowerCase()) { return ('[' + value.toUpperCase() + value.toLowerCase() + ']'); } else { return value; } }).join(''))
		}
		return result
	}
}

/(?:\b(?<TypeOfDefine>[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]|[Cc][Uu][Bb][Ee]|[Pp][Ee][Rr][Kk]|[Tt][Ee][Xx][Tt][Tt][Oo][Oo][Ll][Tt][Ii][Pp]):\s(?:(?:(?<![Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s)\s*(?<NameOfDefine>[\S]*)\s(?<ContentsOfDefine>.*?(?:\b(?:(?:(?:Ability|Flavour)?Text|Description|TODO):|(?:GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?))|(?:\s*(?<TypeOfCompound>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<NameOfCompound>[\S]*)\s(?<ContentsOfCompound>.*?(?:\b(?:Text:|GainAbilityText)\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?)))\b[Ee][Nn][Dd]\b)/gsd



