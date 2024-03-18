import * as vscode from "vscode";
import { IDefined, ICompound, IArguments, typeToDefinedsMap, typeToRegExMatches, typeToCompoundsMap, defineTypeMap, compoundTypeMap } from './constants';


export function extractCompoundDetails(compounds: typeToRegExMatches): typeToCompoundsMap {
	let compoundses: any = [];
	for (let captures of compounds) {
		for (let capture of captures[1]) {
			if (capture.groups['TypeOfCompound']) {
				if (typeof (compoundTypeMap.get(capture.groups['TypeOfCompound'])) === 'number') {
					let index = compoundTypeMap.get(capture.groups['TypeOfCompound']);
					if (!compoundses[index]) compoundses[index] = [];
					compoundses[compoundTypeMap.get(capture.groups['TypeOfCompound'])].push(packIntoICompound(capture));
				}
				else if (capture.groups['CommentString']) { break; }
				else { console.log("Something has gone wrong or a new compound type was added compounds"); };
			}
		}
	}
	compoundses = compoundses.filter((value: any) => (value.length));
	if (compoundses) {
		let returnMap: typeToCompoundsMap = new Map;
		for (let matches of compoundses) {
			returnMap.set(matches[0].Type, matches);
		}
		return returnMap;
	}
	return;
	function packIntoICompound(capture: RegExpMatchArray): ICompound {
		let args: IArguments[] = [];
		///(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?:\bGeneric(?:Perk|Position|String|Word|Name|Action|Boolean|Direction|Double|Constant|Cube|Stacking|Time)\b)/gd
		///(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?:\b[Gg][eE][nN][eE][rR][iI][cC](?:[Pp][eE][rR][kK]|[Pp][oO][sS][iI][tT][iI][oO][nN]|[Ss][tT][rR][iI][nN][gG]|[Ww][oO][rR][dD]|[Nn][aA][mM][eE]|[Aa][cC][tT][iI][oO][nN]|[Bb][oO][oO][lL][eE][aA][nN]|[Dd][iI][rR][eE][cC][tT][iI][oO][nN]|[Dd][oO][uU][bB][lL][eE]|[Cc][oO][nN][sS][tT][aA][nN][tT]|[Cc][uU][bB][eE]|[Ss][tT][aA][cC][kK][iI][nN][gG]|[Tt][iI][mM][eE])\b)/gd
		for (let generic of capture.groups['ContentsOfCompound'].matchAll(/(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?<CompoundGenerics>\b[Gg][eE][nN][eE][rR][iI][cC](?:[Pp][eE][rR][kK]|[Pp][oO][sS][iI][tT][iI][oO][nN]|[Ss][tT][rR][iI][nN][gG]|[Ww][oO][rR][dD]|[Nn][aA][mM][eE]|[Aa][cC][tT][iI][oO][nN]|[Bb][oO][oO][lL][eE][aA][nN]|[Dd][iI][rR][eE][cC][tT][iI][oO][nN]|[Dd][oO][uU][bB][lL][eE]|[Cc][oO][nN][sS][tT][aA][nN][tT]|[Cc][uU][bB][eE]|[Ss][tT][aA][cC][kK][iI][nN][gG]|[Tt][iI][mM][eE])\b)/gd)) {
			if (generic.groups['CompoundGenerics'])
				args.push({
					String: generic.groups['CompoundGenerics'],
					Type: generic.groups['CompoundGenerics'].slice(7),
					Index: generic.indices.groups['CompoundGenerics'][0] + capture.index
				});
		}
		return {
			Type: capture.groups['TypeOfCompound'],
			Contents: { Content: capture.groups['ContentsOfCompound'], Index: capture.indices.groups['ContentsOfCompound'][0] },
			Name: { Name: capture.groups['NameOfCompound'], Index: capture.indices.groups['NameOfCompound'][0] },
			Arguments: args
		};
	}
}export function extractDefinedNames(defines: typeToRegExMatches): typeToDefinedsMap {
	let definedses: any = [];
	for (let captures of defines) {
		for (let capture of captures[1]) {
			if (capture.groups['TypeOfDefine']) {
				if (typeof (defineTypeMap.get(capture.groups['TypeOfDefine'].toUpperCase())) === 'number') {
					let index = defineTypeMap.get(capture.groups['TypeOfDefine']);
					if (!definedses[index]) definedses[index] = [];
					definedses[defineTypeMap.get(capture.groups['TypeOfDefine'])].push(packIntoIDefined(capture));
				}
				else { console.log("Something has gone wrong or a new compound type was added defines"); };
			}
		}
	}
	definedses = definedses.filter((value: any) => (value.length));
	if (definedses) {
		let returnMap: typeToDefinedsMap = new Map;
		for (let matches of definedses) {
			returnMap.set(matches[0].Type, matches);
		}
		return returnMap;
	}
	return;
	function packIntoIDefined(capture: RegExpMatchArray): IDefined {
		return {
			Type: capture.groups['TypeOfDefine'],
			Contents: { Content: capture.groups['ContentsOfDefine'], Index: capture.indices.groups['ContentsOfDefine'][0] },
			Name: { Name: capture.groups['NameOfDefine'], Index: capture.indices.groups['NameOfDefine'][0] }
		};
	}
}
export function gatherDefinitions(document: vscode.TextDocument): typeToRegExMatches[] {
	let compoundRegExes: any = [];
	let otherRegExes: any = [];
	let text: string = document.getText();
	let comments = text.matchAll(/(?<=[\s^])\/-(?=\s).*?\s-\/(?=[\s$])/gs); // Find all the comments
	if (comments) {
		for (let comment of comments) {
			text = text.replace(comment[0], ''.padEnd(comment[0].length)); // replace them with spaces to preserve character count
		}
	}
	
	let scenarios = text.matchAll(/\b[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo]:\s[\s\S]*?\b[Ss][Ee][Nn][Dd]\b/gs);
	if (scenarios) {
		for (let scenario of scenarios) {//todo actually handle |[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo] and DOACTION
			text = text.replace(scenario[0], ''.padEnd(scenario[0].length)); // replace them with spaces to preserve character count
		}
	}
	// ./regexes.primaryCapture()
	for (let match of text.matchAll(/\b(?<TypeOfDefine>[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]|[Cc][Uu][Bb][Ee]|[Pp][Ee][Rr][Kk]|[Aa][Rr][Tt][Oo][Vv][Ee][Rr][Rr][Ii][Dd][Ee]|[Tt][Ee][Xx][Tt][Tt][Oo][Oo][Ll][Tt][Ii][Pp]):\s(?:(?:(?:(?<=[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s)\s*(?<TypeOfCompound>TRIGGER|ABILITY|ACTION|BOOLEAN|CUBE|DIRECTION|POSITION|DOUBLE|PERK|STRING)\s*(?<NameOfCompound>\S*)\s(?<ContentsOfCompound>.*?(?:\b(?:(?:Text):|(?:GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?))|(?:(?<=[Cc][Uu][Bb][Ee]:\s)\s*(?<NameOfCube>\S+)\s+(?<ContentsOfCube>.*?(?:\b(?:(?:(?:Flavour)?Text):|(?:GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?))|(?:(?<=[Pp][Ee][Rr][Kk]:\s)\s*(?<NameOfPerk>\S+)\s+(?<ContentsOfPerk>.*?(?:\b(?:(?:AbilityText|Description|TODO):|(?:GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?))|(?:(?<=[Tt][Ee][Xx][Tt][Tt][Oo][Oo][Ll][Tt][Ii][Pp]:\s)\s*(?<NameOfTextTooltip>\S+)\s+(?<ContentOfTextTooltip>.*?)))\b[Ee][Nn][Dd]\b)|(?:(?<=[Aa][Rr][Tt][Oo][Vv][Ee][Rr][Rr][Ii][Dd][Ee]:\s)\s*(?:(?:ALL\s+(?<ArtOverrideFolder>\S+)\s+(?<ArtOverrideSubstring>\S+))|(?:PERK\s+(?<ArtOverridePerk>\S+))|(?:CUBE\s+(?<ArtOverrideCube>\S+))|(?<ArtOverrideName>\S+))(?=[\s$]))/dgs)) {
		let index = defineTypeMap.get(match.groups['TypeOfDefine'].toUpperCase()); //compounds are maped to 0 and so fall though to the else if
		if (index) {
			if (!otherRegExes[index]) otherRegExes[index] = [];
			otherRegExes[index].push(match);
		} else if (typeof (compoundTypeMap.get(match.groups['TypeOfCompound'])) === "number") {
			let index = compoundTypeMap.get(match.groups['TypeOfCompound']);
			if (!compoundRegExes[index]) compoundRegExes[index] = [];
			compoundRegExes[index].push(match);
		} else { console.log("Something has gone wrong in gatherCompounds on regex match: " + match[0]); }
	}
	compoundRegExes = compoundRegExes.filter((value: any) => (value?.length));
	let results: typeToRegExMatches[] = [];
	if (compoundRegExes.length) {
		let returnMap: typeToRegExMatches = new Map;
		for (let matches of compoundRegExes) {
			if (matches[0]?.groups['TypeOfCompound']) {
				returnMap.set(matches[0].groups['TypeOfCompound'], matches);
			} else { console.log("Something has gone wrong in compoundRegExes->results on matches: " + matches); }
			results[0] = returnMap;
		}
	}
	otherRegExes = otherRegExes.filter((value: any) => (value?.length));
	if (otherRegExes.length) {
		let returnMap: typeToRegExMatches = new Map;
		for (let matches of otherRegExes) {
			if (matches[0]?.groups['TypeOfDefine']) {
				returnMap.set(matches[0].groups['TypeOfDefine'], matches);
			} else { console.log("Something has gone wrong in compoundRegExes->results on matches: " + matches); }
			results[1] = returnMap;
		}
	}
	if (results.length) return results;
}

