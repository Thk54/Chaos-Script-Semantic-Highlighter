import * as vscode from 'vscode';
import { GatherResults, ICompound, IDefined, fileToDefines, fileToNameToCompoundDefine, fileToNameToDefine } from './constants';
import { gatherDefinitions } from "./parser";

export async function updateFilesMapsIfEntries(document:{doc?:vscode.TextDocument,uri?:vscode.Uri}) {
	const gatherResults:GatherResults = (await gatherDefinitions(document?.doc ?? (await vscode.workspace.openTextDocument(document.uri))));
	const iDefineds: IDefined[] = gatherResults.Defines
	if (iDefineds.length) {
		fileToDefines.set(document.uri, iDefineds)
		let nameToCompound = new Map<string,ICompound>();
		let nameToDefine = new Map<string,IDefined>();
		for (let defined of iDefineds){
			if (defined.Type.Define === 'COMPOUND') {
				nameToCompound.set(defined.Name.Name, defined)
			} else {
				nameToDefine.set(defined.Name.Name, defined)
			}
		}
		if (nameToCompound.size) fileToNameToCompoundDefine.set(document.uri, nameToCompound)
		if (nameToDefine.size) fileToNameToDefine.set(document.uri, nameToDefine)
	}
}
