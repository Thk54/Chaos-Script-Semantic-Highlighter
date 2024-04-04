import * as vscode from "vscode";
import { fileToGatherResults, nameToDefines, tokenTypes, IArgument, IArg, compoundAbilityFlags, cubeFlags, perkFlags } from "../constants";
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
/*	for (let defines of fileToGatherResults.values()){
		for (let define of defines.Defines){
			nameToDefines.has(define.Name.Name) ? nameToDefines.set(define.Name.Name, [...nameToDefines.get(define.Name.Name), define]) : nameToDefines.set(define.Name.Name, [define])
		}
	}*/
//store 'to be filled arguments' in array and unshift stuff into the front of the array

export function buildTrees(define:CDefined,diagnostics:vscode.Diagnostic[]) {
	let words:RegExpMatchArray[] = []
	let regex = define.contents.content.matchAll(/\S+/g)
	let root; {
		let defineRange = new vscode.Range(define.document.positionAt(define.contents.capture.index), define.document.positionAt(define.contents.capture.index + define.contents.capture.text.length));
		let symbolRange = new vscode.Range(define.document.positionAt(define.name.index), define.document.positionAt(define.name.index + define.name.name.length));
		let symbolName = define.name.name;
		let symbolDetail = define.type.typeString;
		let symbolKind = define.type.legendEntry;
		root = new vscode.DocumentSymbol(symbolName, symbolDetail, tokenTypes.get(symbolKind), defineRange, symbolRange)
		root.children = []}
	let args:IArg[] = []
	if (define.type.isCompoundDefine) {
		if (define.type.define === 'ABILITY') {
			args = [{type:'TRIGGER'}]
		} else {args = [{type:define.type.define}]}
	}
	let temp = []
	{let result = treeBuilder(regex, define, diagnostics, args)
		if (result?.returnArray) {temp.push(result.returnArray)}}
	args = []
	let done:boolean
	while (done !== true){
		let result = treeBuilder(regex, define, diagnostics, args)
		if (result?.returnArray) {temp.push(result.returnArray)}
		if (result?.done) {done = result.done}
	}
	root.children = [].concat(...temp)
	return root
}

	type treeReturn = {returnArray:vscode.DocumentSymbol[],deepestPos:vscode.Position,done?:boolean}
function treeBuilder(words:IterableIterator<RegExpMatchArray>, context:CDefined, diagnostics:vscode.Diagnostic[], args?:IArg[]):treeReturn{
	if (!(args === undefined)){
		let returnArray:vscode.DocumentSymbol[] = []
		let childSymbols:vscode.DocumentSymbol[] = []
		let deepestPos:vscode.Position
		let offset = context.contents.index
		let document = context.document
		let iteratorResult:IteratorResult<RegExpMatchArray>
		let word:RegExpMatchArray
		if (args.length === 0) {
			iteratorResult = words.next()
			if (iteratorResult?.done) return {returnArray:[],deepestPos:deepestPos,done:iteratorResult.done}
			word = iteratorResult.value
			let isArgs = determineFlagArgs(word[0], context)
			if (isArgs) {
				let childSymbol:vscode.DocumentSymbol
				let grandchildSymbols:vscode.DocumentSymbol[]
				let startpos = document.positionAt(offset+word.index)
				let endpos = startpos.translate({characterDelta:word[0].length})
				let temp = treeBuilder(words, context, diagnostics, isArgs)
				if (temp?.returnArray !== undefined) {
					grandchildSymbols = temp.returnArray
				} else {deepestPos = endpos}
				childSymbol = new vscode.DocumentSymbol(word[0], '', 4,new vscode.Range(startpos,deepestPos ?? temp.deepestPos), new vscode.Range(startpos,endpos))
				childSymbol.children = grandchildSymbols
				returnArray = [childSymbol]
			} else {return}
		} else {for (let arg of args){
				iteratorResult = words.next()
				if (iteratorResult?.done) return {returnArray:[],deepestPos:deepestPos,done:iteratorResult.done}
				word = iteratorResult.value
				let childSymbol:vscode.DocumentSymbol
				let grandchildSymbols:vscode.DocumentSymbol[]
				let startpos = document.positionAt(offset+word.index)
				let endpos = startpos.translate({characterDelta:word[0].length})
				let localArgs = (nameToDefines.get(word[0].toLowerCase())?.find((value)=>{return value.type.define.toUpperCase() === arg.type.toUpperCase()/* make this handled triggers/abilites */})?.args ?? determineFlagArgs(word[0], context))
				if (localArgs?.length === 0) {localArgs = undefined}
				let temp = treeBuilder(words, context, diagnostics, localArgs)
				if (temp?.returnArray !== undefined) {
					grandchildSymbols = temp.returnArray
					deepestPos = temp.deepestPos
				} else {deepestPos = endpos}
				childSymbol = new vscode.DocumentSymbol(word[0], '', 4,new vscode.Range(startpos,deepestPos ?? temp.deepestPos), new vscode.Range(startpos,endpos))
				childSymbol.children = grandchildSymbols
				childSymbols.push(childSymbol)
			}
			returnArray = childSymbols
		}
		return {returnArray:returnArray,deepestPos:deepestPos,done:iteratorResult.done}
	} else {return}
}
function determineFlagArgs(word:string,context:CDefined):IArg[]{
	if (context.type.isCompoundDefine) {
		if (context.type.define === 'ABILITY') {
			return compoundAbilityFlags.get(word)
		}
	} else if (context.type.define === 'CUBE') {
		return cubeFlags.get(word)
	} else if (context.type.define === 'PERK') {
		return perkFlags.get(word)
	}
	return;
}


