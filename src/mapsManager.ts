import * as vscode from 'vscode';
import { ICompound, IDefined, typeToRegExMatches, typeToCompoundsMap, fileToCompoundsesMap, typeToDefinedsMap,
	fileToDefinedsesMap, fileToNameToCompoundListMap, fileToNameToDefinedListMap, compoundTypeMap, defineTypeMap } from './constants';
import { gatherDefinitions, packIntoICompound } from "./parser";


export async function addToMapsIfEntriesExist(document: vscode.TextDocument) {
	const results: typeToRegExMatches[] = gatherDefinitions(document);
	if (results) {
		if (!(typeof (results[0]) === 'undefined')) {
			const compoundDetails: typeToCompoundsMap = extractCompoundDetails(results[0]);
			if (compoundDetails.size) {
				fileToCompoundsesMap.set(document.uri, compoundDetails);
				addToFileToNameToCompoundListMap(compoundDetails, document.uri);
			}
		}
		if (!(typeof (results[1]) === 'undefined')) {
			const DefinedDetails: typeToDefinedsMap = extractDefinedNames(results[1]);
			if (results[1].size) {
				fileToDefinedsesMap.set(document.uri, DefinedDetails);
				for (let entry of DefinedDetails)
					addToFileToDefineNameListMap(DefinedDetails, document.uri);
			}
		}
	}
}
export async function addToFileToNameToCompoundListMap(compoundsAndMap: typeToCompoundsMap, uri: vscode.Uri) {
	const nameToCompoundMap = new Map<string, ICompound>();
	for (let compoundArray of compoundsAndMap) {
		for (let compound of compoundArray[1]) {
			if (compound.Name.Name) {
				nameToCompoundMap.set(compound.Name.Name.toLowerCase(), compound);
			}
		}
	}
	if (nameToCompoundMap.size !== 0) {
		fileToNameToCompoundListMap.set(uri, nameToCompoundMap);
	}
	return Promise;
}
export async function addToFileToDefineNameListMap(definedsAndMap: typeToDefinedsMap, uri: vscode.Uri) {
	const nameToDefinedMap = new Map<string, IDefined>();
	for (let definedsArray of definedsAndMap) {
		for (let defined of definedsArray[1]) {
			if (defined.Name.Name) {
				nameToDefinedMap.set(defined.Name.Name.toLowerCase(), defined);
			}
		}
	}
	if (nameToDefinedMap.size !== 0) {
		fileToNameToDefinedListMap.set(uri, nameToDefinedMap);
	}
	return Promise;
}
export function extractDefinedNames(defines: typeToRegExMatches): typeToDefinedsMap {
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
			Type: { Define: capture.groups['TypeOfDefine'] },
			Contents: { Capture: capture[0], Content: capture.groups['ContentsOfDefine'], Index: capture.indices.groups['ContentsOfDefine'][0] },
			Name: { Name: capture.groups['NameOfDefine'], Index: capture.indices.groups['NameOfDefine'][0] }
		};
	}
}
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
}

