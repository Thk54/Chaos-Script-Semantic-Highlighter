import * as vscode from "vscode";
import { GatherResults, IArguments, ICompound, IDefined, IType, fileToDefines } from "../constants";
import { gatherDefinitions } from "../parser";

export function typeStringifyer(type: IType): string {
	return type?.Compound ? (type.Define + ' ' + type.Compound) : type.Define;
}

/* export function getDefineFromWord(word:string):IDefined{
	let result:[string,IDefined]
	result = getATopMapKeyAndSubMapValueFromSubMapKey(fileToNameToCompoundDefine,word)

	if (!result) {
		result = getATopMapKeyAndSubMapValueFromSubMapKey(fileToNameToDefine,word)
	}
	if (result) {
		result[1].Uri = result[0]
		return	result[1]
	}
	return
} */
export function getATopMapKeyAndSubMapValueFromSubMapKey<topMap extends Map<topKey,subMap>, subMap extends Map<subMapKey,subMapValue>, topKey, subMapKey, subMapValue>(map:topMap,key:subMapKey):[topKey,subMapValue]{
	for (let topEntries of map.entries()) {
		let result = topEntries[1].get(key);
		if (result) return [topEntries[0],result]
	}
	return
}
export function doesIDefineHaveArguments(tested:ICompound|IDefined):boolean{
	let interum:any = tested
	return interum?.Arguments.length ? true : false
}
export function returnArgumentsAsString(defined:ICompound):string{
	let temp:IArguments
	return defined.Arguments.map((temp)=>(temp.Type)).join(' ')
}
export async function updateFilesMapsIfEntries(document: { doc?: vscode.TextDocument; uri?: vscode.Uri; }) {
	const gatherResults: GatherResults = (await gatherDefinitions(document?.doc ?? (await vscode.workspace.openTextDocument(document.uri))));
	const iDefineds: IDefined[] = gatherResults.Defines;
	if (iDefineds.length) {
		fileToDefines.set(document.uri.toString(), iDefineds);
		let nameToCompound = new Map<string, ICompound>();
		let nameToDefine = new Map<string, IDefined>();
		for (let defined of iDefineds) {
			if (defined.Type.Define === 'COMPOUND') {
				nameToCompound.set(defined.Name.Name, defined);
			} else if (!(defined.Type.Define === 'ARTOVERRIDE')) { //probably need better override handling
				nameToDefine.set(defined.Name.Name, defined);
			}
		}
	}
}

//store 'to be filled arguments' in array and unshift stuff into the front of the array