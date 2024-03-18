import * as vscode from 'vscode';
import { ICompound, IDefined, typeToRegExMatches, typeToCompoundsMap, fileToCompoundsesMap, typeToDefinedsMap,
	fileToDefinedsesMap, fileToNameToCompoundListMap, fileToNameToDefinedListMap } from './constants';
import { gatherDefinitions, extractDefinedNames, extractCompoundDetails } from './parser';


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
}export async function addToFileToNameToCompoundListMap(compoundsAndMap: typeToCompoundsMap, uri: vscode.Uri) {
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

