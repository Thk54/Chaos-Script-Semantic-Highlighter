import * as vscode from "vscode";
import { GatherResults, CDefined, fileToGatherResults, nameToDefines } from "../constants";
import { gatherDefinitions } from "../parser";

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
export function doesCDefineHaveArguments(tested:CDefined):boolean{
	return tested?.args ? true : false
}
export function returnArgumentsAsString(defined:CDefined):string{
	return defined.args.map((temp)=>(temp.Type)).join(' ')
}
export async function updateFilesMapsIfEntries(document: { doc?: vscode.TextDocument; uri?: vscode.Uri; }) {
	//console.time('map time')
	const gatherResults: GatherResults = (await gatherDefinitions(document?.doc ?? (await vscode.workspace.openTextDocument(document.uri))));
	const oldResults = fileToGatherResults.get(gatherResults.Document.uri.toString()) ?? undefined
	if (oldResults !== undefined){
		const oldNames = oldResults.Defines.map((value)=>{return value.name.Name})
		for (let name of oldNames){
			let defines = nameToDefines.get(name)
			let index = defines.findIndex((value)=>{return value.document.uri.toString() === gatherResults.Document.uri.toString()})
			while (index !== -1) {
				defines.splice(index,1)
				index = defines.findIndex((value)=>{value.document.uri.toString() === gatherResults.Document.uri.toString()})
			}
		}
	}
	for (let define of gatherResults.Defines){
		nameToDefines.has(define.name.Name) ? nameToDefines.set(define.name.Name, [...nameToDefines.get(define.name.Name), define]) : nameToDefines.set(define.name.Name, [define])
	}
	fileToGatherResults.set(gatherResults.Document.uri.toString(),gatherResults)
	//console.timeLog('map time')
	//console.timeEnd('map time')
}
/*	for (let defines of fileToGatherResults.values()){
		for (let define of defines.Defines){
			nameToDefines.has(define.Name.Name) ? nameToDefines.set(define.Name.Name, [...nameToDefines.get(define.Name.Name), define]) : nameToDefines.set(define.Name.Name, [define])
		}
	}*/
//store 'to be filled arguments' in array and unshift stuff into the front of the array