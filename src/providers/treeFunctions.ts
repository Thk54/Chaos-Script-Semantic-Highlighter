import * as vscode from "vscode";
import { CDefined } from "../classes";
import { nameToDefines, tokenTypes, IArg, compoundAbilityFlags, cubeFlags, perkFlags, argOptions } from "../constants";

export function buildTree(define: CDefined, diagnostics: vscode.Diagnostic[]) {
	let regex = define.contents.content.matchAll(/\S+/g);
	let root; {
		let defineRange = new vscode.Range(define.document.positionAt(define.contents.capture.index), define.document.positionAt(define.contents.capture.index + define.contents.capture.text.length));
		let symbolRange = new vscode.Range(define.document.positionAt(define.name.index), define.document.positionAt(define.name.index + define.name.name.length));
		let symbolName = define.name.asFound ?? define.name.name;
		let symbolDetail = define.type.typeString;
		let symbolKind = define.type.legendEntry;
		root = new vscode.DocumentSymbol(symbolName, symbolDetail, tokenTypes.get(symbolKind), defineRange, symbolRange);
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
type treeReturn = { returnArray: vscode.DocumentSymbol[]; deepestPos: vscode.Position; done?: boolean; };
function treeBuilder(words: IterableIterator<RegExpMatchArray>, context: CDefined, diagnostics: vscode.Diagnostic[], args?: IArg[]): treeReturn {
	if (!(args === undefined)) {
		let returnArray: vscode.DocumentSymbol[] = [];
		let childSymbols: vscode.DocumentSymbol[] = [];
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
			//i += 1
			if (arg?.type === argOptions.ENDUSER.type) {
				handleEndUser(words)
				args.splice(args.findIndex((value)=>{value === arg}),1)
				endHelper = true
				continue
			} else {i += 1; iteratorResult = words.next();}
			if (iteratorResult?.done) return { returnArray: [], deepestPos: deepestPos, done: iteratorResult.done };
			word = iteratorResult.value;
			let childSymbol: vscode.DocumentSymbol;
			let grandchildSymbols: vscode.DocumentSymbol[];
			let startpos = document.positionAt(offset + word.index);
			let endpos = startpos.translate({ characterDelta: word[0].length });
			let childArgs = (nameToDefines.get(word[0].toLowerCase())?.find((value) => 
				{ return value.type.define === arg?.type 
				?? determineFlagArgs(word[0], context)
				?? ([argOptions.INTconst.type,argOptions.DOUBLEconst.type,argOptions.DOUBLEcompound.type].includes(arg?.type)&&/^-?\d+$/.test(word[0]))
					? undefined
				: ([argOptions.STRINGconst.type||argOptions.STRINGcompound.type].includes(arg?.type))&&/^\S+$/.test(word[0])
					? undefined 
				: (arg?.type)
					? convertToUndefined(diagnostics.push(new vscode.Diagnostic(new vscode.Range(startpos,endpos),createDiagnosticText(arg.type, nameToDefines.get(word[0].toLowerCase()), word[0]),2)))
					: undefined})?.args /* make this handled triggers/abilites */);
			if (!childArgs?.length) { childArgs = undefined; if (!args.length) return} //If we are neither looking for a child or something that wants children we are done
			let temp = treeBuilder(words, context, diagnostics, childArgs);
			if (temp?.done || temp?.returnArray === undefined) { deepestPos = endpos; 
			} else { 
				grandchildSymbols = temp.returnArray;
				deepestPos = temp.deepestPos;
			}
			childSymbol = new vscode.DocumentSymbol(word[0], arg?.type, 4, new vscode.Range(startpos, deepestPos ?? temp.deepestPos), new vscode.Range(startpos, endpos));
			childSymbol.children = grandchildSymbols;
			childSymbols.push(childSymbol);
		} while ((i < args.length)||endHelper)
		returnArray = childSymbols;
		return { returnArray: returnArray, deepestPos: deepestPos, done: iteratorResult.done };
	} else { return; }
}
function determineFlagArgs(word: string, context: CDefined): IArg[] {
	if (context.type.isCompoundDefine) {
		if (context.type.define === argOptions.ABILITYcompound.type) {
			return compoundAbilityFlags.get(word);
		}
	} else if (context.type.define === argOptions.CUBEdefine.type) {
		return cubeFlags.get(word);
	} else if (context.type.define === argOptions.PERKdefine.type) {
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
function createDiagnosticText(arg:IArg['type'],defines:CDefined[],word:string):string{
	let thingsFound:Set<string> = new Set<string>
	for (let define of defines){
		thingsFound.add(define.type.define)
	}
	if (/^-?\d+$/.test(word)) thingsFound.add(argOptions.INTconst.type).add(argOptions.DOUBLEconst.type);
	if (/^\S+$/.test(word)) thingsFound.add(argOptions.STRINGconst.type)
	return 'Expected: '+arg+'\nFound: '+[...thingsFound.values()].join(', ')
}