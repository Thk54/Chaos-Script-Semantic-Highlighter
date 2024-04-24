import * as vscode from "vscode";
import { CDefined, DocumentSymbolPlus } from "../classes";
import { nameToDefines, tokenTypes, compoundAbilityFlags, cubeFlags, perkFlags, argOptions } from "../constants";
import { IArg } from "../classes";
import { createDiagnostic } from "./commonFunctions";

export function buildTree(define: CDefined, diagnostics: vscode.Diagnostic[]) {
	let regex = define.contents.content.matchAll(/\S+/g);
	let root; {
		let defineRange = new vscode.Range(define.document.positionAt(define.contents.capture.index), define.document.positionAt(define.contents.capture.index + define.contents.capture.text.length));
		let symbolRange = new vscode.Range(define.name.index, define.document.positionAt(define.document.offsetAt(define.name.index) + define.name.name.length));
		let symbolName = define.name.asFound ?? define.name.name;
		let symbolDetail = define.type.typeString;
		let symbolKind = define.type.legendEntry;
		root = new DocumentSymbolPlus(symbolName, symbolDetail, tokenTypes.get(symbolKind), defineRange, symbolRange, define);
		root.children = [];
	}
	let temp = [];
	{
		let result = treeBuilder(regex, define, diagnostics, define.type.defaultArgs());
		if (result?.returnArray) { temp.push(result.returnArray); }
	}
	let args: IArg[] = [];
	let done: boolean;
	while (done !== true) {
		let result = treeBuilder(regex, define, diagnostics, args);
		if (result?.returnArray) { temp.push(result.returnArray); }
		if (result?.done) { done = result.done; }
	}
	root.children = [].concat(...temp);
	return root;
}
type treeReturn = { returnArray: DocumentSymbolPlus[]; deepestPos: vscode.Position; done?: boolean; };
function treeBuilder(words: IterableIterator<RegExpMatchArray>, context: CDefined, diagnostics: vscode.Diagnostic[], args?: IArg[]): treeReturn {
	if (!(args === undefined)) {
		let returnArray: DocumentSymbolPlus[] = [];
		let childSymbols: DocumentSymbolPlus[] = [];
		let deepestPos: vscode.Position;
		let offset = context.contents.index;
		let document = context.document;
		let iteratorResult: IteratorResult<RegExpMatchArray>;
		let word: RegExpMatchArray;
		let i = 0
		let endHelper
		do {
			let arg = args[i]
			endHelper = false
			let listMarker
			if (arg?.mapString === argOptions.LISTconst.mapString) {listMarker = true; arg = argOptions.DOUBLEcompound}
			//i += 1
			if (arg?.mapString === argOptions.ENDUSER.mapString) {
				handleEndUser(words)
				args.splice(args.findIndex((value)=>{value === arg}),1)
				if (i<=0) endHelper = true
				continue
			} else {i += 1; iteratorResult = words.next();}
			if (iteratorResult?.done) return { returnArray: [], deepestPos: deepestPos, done: iteratorResult.done };
			word = iteratorResult.value;
			let childSymbol: DocumentSymbolPlus
			let grandchildSymbols: DocumentSymbolPlus[];
			let startpos = document.positionAt(offset + word.index);
			let endpos = startpos.translate({ characterDelta: word[0].length });
			let define = nameToDefines.get(word[0].toLowerCase())?.find((value) => {
				for (let valid of arg?.satifiedBy()??[]) {if (value.type.define === valid.mapString) return true}; return false})
			let childArgs = (define?.args ?? determineFlagArgs(word[0], context)) // make this handled triggers/abilites
			if (word[0] === 'GainAbilityText') childArgs?.push(argOptions.ENDUSER)
			/* bad form but should work */ let diag = createDiagnostic(new vscode.Range(startpos,endpos), arg?.mapString, nameToDefines.get(word[0].toLowerCase()) ?? [], word[0])
			if (diag && arg) {diagnostics.push(diag);
			} else {
				if (listMarker){
					let n = Number(word[0])
					if (!Number.isNaN(n) && !(n===0)) {if (!childArgs?.length){childArgs = []}
						childArgs.length = childArgs.length + n
						childArgs.fill(argOptions.ACTIONcompound,-n)
					}
				}
			};
			if (!childArgs?.length) { childArgs = undefined; if (!args.length) return} //If we are neither looking for a child or something that wants children we are done
			let temp = treeBuilder(words, context, diagnostics, childArgs);
			if (temp?.done || temp?.returnArray === undefined) { deepestPos = endpos; 
			} else { 
				grandchildSymbols = temp.returnArray;
				deepestPos = temp.deepestPos;
			}
			childSymbol = new DocumentSymbolPlus(word[0], arg?.mapString, 4, new vscode.Range(startpos, deepestPos ?? temp.deepestPos), new vscode.Range(startpos, endpos), define);
			if (!childSymbol.define) {delete(childSymbol.define)}
			childSymbol.children = grandchildSymbols;
			childSymbols.push(childSymbol);
		} while ((i < args.length)||endHelper)
		returnArray = childSymbols;
		return { returnArray: returnArray, deepestPos: deepestPos, done: iteratorResult.done };
	} else { return; }
}
function determineFlagArgs(word: string, context: CDefined): IArg[] {
	if (context.type.isCompoundDefine) {
		if (context.type.define === argOptions.ABILITYcompound.mapString) {
			return compoundAbilityFlags.get(word);
		}
	} else if (context.type.define === argOptions.CUBEdefine.mapString) {
		return cubeFlags.get(word);
	} else if (context.type.define === argOptions.PERKdefine.mapString) {
		return perkFlags.get(word);
	}
	return;
}

function handleEndUser(words:IterableIterator<RegExpMatchArray>):IteratorResult<RegExpMatchArray>{//handle formating and TEXTTOOLTIPS inside such strings
	while (true) {
		let word = words.next()
		if (/^End$/i.test(word.value)||word?.done) { return word }
	}
}

function convertToUndefined(any:any):undefined{return undefined}
