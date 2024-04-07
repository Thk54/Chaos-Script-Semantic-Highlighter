import * as vscode from "vscode";
import { fileToGatherResults, nameToDefines, IArgument } from "../constants";
import { CGatherResults, CDefined } from "../classes";
import { gatherDefinitions } from "../parser";
import { regexes } from "../regexes";

export function getWordAtPosition(document:vscode.TextDocument,position:vscode.Position):string {
	return (document.lineAt(position.line).text.match(regexes.generateCaptureWordInLineFromPositionRegEx(position))[0])
}
export function getATopMapKeyAndSubMapValueFromSubMapKey<topMap extends Map<topKey,subMap>, subMap extends Map<subMapKey,subMapValue>, topKey, subMapKey, subMapValue>(map:topMap,key:subMapKey):[topKey,subMapValue]{
	for (let topEntries of map.entries()) {//Preserved because I am proud of wrangling the type stuff into working right
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
		const oldDefines = oldResults.defines.map((value)=>{return value})
		for (let oldDefine of oldDefines){
			let defines
			if (oldDefine?.nameMapEntryValue) {
				defines = oldDefine.nameMapEntryValue
			} else {
				defines = nameToDefines.get(oldDefine.name.name)
			}
			let index = defines.findIndex((value)=>{return value.document.uri.toString() === gatherResults.document.uri.toString()})
			while (index !== -1) {
				defines.splice(index,1)
				index = defines.findIndex((value)=>{return value.document.uri.toString() === gatherResults.document.uri.toString()})
			}
			if (!defines.length) {nameToDefines.delete(oldDefine.name.name)}
		}
	}
	for (let define of gatherResults.defines){
		addCDefinedToMapWithRefrenceToOwnEntryValue(nameToDefines,define)
	}
	fileToGatherResults.set(gatherResults.document.uri.toString(),gatherResults)
	//console.timeLog('map time')
	//console.timeEnd('map time')
}
export function addCDefinedToMapWithRefrenceToOwnEntryValue(map:Map<string,CDefined[]>, define:CDefined):void {
	let mapEntryValue = map.get(define.name.name)
	if (define.type.isBuiltIn){
		if (mapEntryValue?.length){
			map.set(define.name.name, [...mapEntryValue, define])
		} else {
			map.set(define.name.name, [define])
		}
	} else {
		if (mapEntryValue) {
				if (define?.nameMapEntryValue !== undefined) {
					mapEntryValue.push(define.setMapEntryValue(mapEntryValue))
				} else {
					mapEntryValue.push(define)
				}

		} else {
			map.set(define.name.name, [define])
			mapEntryValue = map.get(define.name.name)
			if (define?.nameMapEntryValue !== undefined) {
				mapEntryValue.pop()
				mapEntryValue.push(define.setMapEntryValue(mapEntryValue))
			}
			//mapEntryValue = [define?.nameMapEntryValue ? define?.setMapEntryValue(mapEntryValue) : define]
		}
	}
}
