import * as vscode from "vscode";
import { fileToGatherResults, nameToDefines, IArgument } from "../constants";
import { CGatherResults, CDefined } from "../classes";
import { gatherDefinitions } from "../parser";
import { regexes } from "../regexes";

export function getWordAtPosition(document:vscode.TextDocument,position:vscode.Position):string {
	return (document.lineAt(position.line).text.match(regexes.generateCaptureWordInLineFromPositionRegEx(position))[0])
}
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
	return defined.args.map((temp)=>(temp.type)).join(' ')
}
export async function updateFilesMapsIfEntries(document: { doc?: vscode.TextDocument; uri?: vscode.Uri; }) {
	//console.time('map time')
	const gatherResults: CGatherResults = (await gatherDefinitions(document?.doc ?? (await vscode.workspace.openTextDocument(document.uri))));
	const oldResults = fileToGatherResults.get(gatherResults.document.uri.toString()) ?? undefined
	if (oldResults !== undefined){
		const oldNames = oldResults.defines.map((value)=>{return value.name.name})
		for (let name of oldNames){
			let defines = nameToDefines.get(name)
			let index = defines.findIndex((value)=>{return value.document.uri.toString() === gatherResults.document.uri.toString()})
			while (index !== -1) {
				defines.splice(index,1)
				index = defines.findIndex((value)=>{value.document.uri.toString() === gatherResults.document.uri.toString()})
			}
			if (!defines.length) {nameToDefines.delete(name)}
		}
	}
	for (let define of gatherResults.defines){
		nameToDefines.has(define.name.name) ? nameToDefines.set(define.name.name, [...nameToDefines.get(define.name.name), define]) : nameToDefines.set(define.name.name, [define])
	}
	fileToGatherResults.set(gatherResults.document.uri.toString(),gatherResults)
	//console.timeLog('map time')
	//console.timeEnd('map time')
}

