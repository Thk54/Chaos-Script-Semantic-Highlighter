import * as vscode from "vscode";
import { fileToGatherResults, nameToDefines, tokenTypes, IArguments, IArgs } from "../constants";
import { GatherResults, CDefined } from "../classes";
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

export function buildTree(define:CDefined,diagnostics:vscode.Diagnostic[]) {
	let words:RegExpMatchArray[] = []
	let regex = define.contents.content.matchAll(/\S+/g)
	for (let match of regex) {
		words.push(match)
	}
	let root; {
		let defineRange = new vscode.Range(define.document.positionAt(define.contents.capture.Index), define.document.positionAt(define.contents.capture.Index + define.contents.capture.Text.length));
		let symbolRange = new vscode.Range(define.document.positionAt(define.name.Index), define.document.positionAt(define.name.Index + define.name.Name.length));
		let symbolName = define.name.Name;
		let symbolDetail = define.type.typeString;
		let symbolKind = define.type.legendEntry;
		root = new vscode.DocumentSymbol(symbolName, symbolDetail, tokenTypes.get(symbolKind), defineRange, symbolRange)
		root.children = []}
	let args:IArgs
	if (define.type.isCompoundDefine) {
		args = {type:define.type.define}	
	}
	let temp = []
	while (words.length > 0) {
		temp.push(treeBuilder(words, define.contents.index, define.document, diagnostics, args))
	}
	root.children = temp
	return root

}
function treeBuilder(words:RegExpMatchArray[], defineOffset:number, document:vscode.TextDocument, diagnostics:vscode.Diagnostic[], args:IArgs):vscode.DocumentSymbol {
	let regWord = words.shift()
	if (regWord[0] === 'Text:'){while (words.length && !(regWord[0].toUpperCase()==='End'.toUpperCase())){regWord = words.shift()}}
	let define = nameToDefines.get(regWord[0].toLowerCase())?.find((defines)=>{return defines?.args?.length}) ?? regWord[0]
	let temp:vscode.DocumentSymbol[] = []
	let startpos = document.positionAt(defineOffset+regWord.index)
	let endpos = startpos.translate({characterDelta:regWord[0].length})
	let endendpos = document.positionAt(defineOffset+regWord.index+regWord.input.length-regWord.index)
	
	let docSymbol
	if (args?.type.toUpperCase() === 'string'.toUpperCase()) {define=regWord[0]}
	if (typeof(define)==='string') {
		docSymbol = new vscode.DocumentSymbol(regWord[0], define, 4,new vscode.Range(startpos,endendpos), new vscode.Range(startpos,endpos))
	} else {
		if (define.type.define.toUpperCase() === 'TRIGGER'){define.type.define='ABILITY'}
		if (define.type.define.toUpperCase() !== args?.type.toUpperCase()){diagnostics.push(new vscode.Diagnostic(new vscode.Range(startpos,endpos),"expected "+args?.type+" and found "+define.type.define))}
		docSymbol = new vscode.DocumentSymbol(regWord[0], define.type.typeString, 4,new vscode.Range(startpos,endendpos), new vscode.Range(startpos,endpos))
		for (let arg of define?.args??[]){
			if(!words.length) break
			temp.push(treeBuilder(words, defineOffset, document, diagnostics, arg))
		}
		docSymbol.children = temp
	}
	
	return docSymbol
}