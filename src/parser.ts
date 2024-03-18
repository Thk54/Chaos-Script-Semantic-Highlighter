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
	let comments = text.matchAll(/(?:(?<=[\s^])\/-(?=\s).*?\s-\/(?=[\s$])|(?:\b[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo]:\s[\s\S]*?\s[Ss][Ee][Nn][Dd]\b))/gs); // Find all the comments

	//todo actually handle |[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo]
	if (comments) {
		for (let comment of comments) {
			text = text.replace(comment[0], ''.padEnd(comment[0].length)); // replace them with spaces to preserve character count
		}
	}
	/*all the known defenition flags (regex flags: gsd)
	(?:\b(?<TypeOfDefine>[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]|[Cc][Uu][Bb][Ee]|[Pp][Ee][Rr][Kk]|[Tt][Ee][Xx][Tt][Tt][Oo][Oo][Ll][Tt][Ii][Pp]):\s
	captureing all of everything that isn't a compound(, scenario, doaction, or artoverride)
	(?:(?:(?<![Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s)\s*(?<NameOfDefine>[\S]*)\s(?<ContentsOfDefine>.*?(?:\b(?:(?:Ability)?Text|Description|TODO|FlavourText):\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?))
	capture compounds
	|(?:\s*(?<TypeOfCompound>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<NameOfCompound>[\S]*)\s(?<ContentsOfCompound>.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?)))\b[Ee][Nn][Dd]\b) */
	for (let match of text.matchAll(/(?:\b(?<TypeOfDefine>[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]|[Cc][Uu][Bb][Ee]|[Pp][Ee][Rr][Kk]|[Tt][Ee][Xx][Tt][Tt][Oo][Oo][Ll][Tt][Ii][Pp]):\s(?:(?:(?<![Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s)\s*(?<NameOfDefine>[\S]*)\s(?<ContentsOfDefine>.*?(?:\b(?:(?:(?:Ability)?Text|Description|TODO|FlavourText):|(?:GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?))|(?:\s*(?<TypeOfCompound>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<NameOfCompound>[\S]*)\s(?<ContentsOfCompound>.*?(?:\b(?:Text:|GainAbilityText)\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?)))\b[Ee][Nn][Dd]\b)/gsd)) {
		// todo: handle |[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo]|[Dd][Oo][Aa][Cc][Tt][Ii][Oo][Nn]|[Aa][Rr][Tt][Oo][Vv][Ee][Rr][Rr][Ii][Dd][Ee]
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

