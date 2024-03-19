import * as vscode from 'vscode';
import { ICompound, IDefined, typeToRegExMatches, typeToCompoundsMap, fileToCompoundsesMap, typeToDefinedsMap,
	fileToDefinedsesMap, fileToNameToCompoundListMap, fileToNameToDefinedListMap, compoundTypeMap, defineTypeMap, fileToDefines } from './constants';
import { gatherDefinitions } from "./parser";


export async function addToFileToIDefineIfEntries(document: vscode.TextDocument) {
	const iDefineds: IDefined[] = await gatherDefinitions(document);
	if (iDefineds.length) {
		fileToDefines.set(document.uri, iDefineds)
	}
}
