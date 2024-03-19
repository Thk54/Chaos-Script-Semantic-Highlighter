import * as vscode from 'vscode';
import { updateFilesMapsIfEntries, } from './mapsManager';
import { presentTextDocumentFromURIToReturnlessFunction, FoldingRangeProvider, DocumentSemanticTokensProvider } from './extension';
import { IBuiltins, IArguments, legend, generateMaps, fileToDefines, builtins, fileToNameToCompoundDefine } from './constants';
import {buildRegexes} from './regexes'

export async function activate(context: vscode.ExtensionContext) {
	generateMaps;
	//buildRegexes()
	await initialize(context);
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ language: 'cubechaos' }, new FoldingRangeProvider()));
	//context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'cubechaos' }, new DocumentSymbolProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'cubechaos' }, new DocumentSemanticTokensProvider(), legend));
}

export async function initialize/*Compounds*/(context: vscode.ExtensionContext) {
	let files = vscode.workspace.findFiles('**/*.txt');
	let promises = [];
	promises.push(await /* todo test if this await is necessary */presentTextDocumentFromURIToReturnlessFunction(context.extensionUri.with({ path: context.extensionUri.path + '/ModdingInfo.txt.built-ins' }), parseModdinginfo));
	for (let txt of await files) {
		promises.push(presentTextDocumentFromURIToReturnlessFunction(txt, updateFilesMapsIfEntries));
	}
	await Promise.allSettled(promises);
	console.log('initial map done');
}

export async function parseModdinginfo(document: vscode.TextDocument) {
	const pack: Function = async function (lines: string[]): Promise<IBuiltins[]> {
		let compounds: IBuiltins[] = [];
		let type = lines[0].toUpperCase().match(/(.*?)S?: /)[1]; //todo fix plural types
		lines.shift();
		for (let line of lines) {
			let args: IArguments[] = [];
			let name = line.match(/^\S+/);
			line.slice(name.length);
			for (let generic of line.matchAll(/\S+/ig)) {
				args.push({ Type: generic[0].toUpperCase() });
			}
			let builtin = {Type: {Define:'COMPOUND', Compound:type},
				Name: { Name: name[0].toLowerCase() },
				Arguments: args
			}
			nameToBuiltins.set(name[0].toLowerCase(),builtin)
			compounds.push(builtin);
		}
		return compounds;
	};
	let nameToBuiltins = new Map<string,IBuiltins>();
	let promises:any = []
	let iBuiltins:IBuiltins[] = [];
	for (let match of document.getText().matchAll(/^(Triggers?|Actions?|BOOLEAN|CUBE|DIRECTION|DOUBLE|PERK|POSITION|STRING): (?:$\s\s?^(?:.(?!\:))+$)+/gim)) {
		promises.push(pack(match[0].split(/[\r\n]+/)))
	}
	for (let set of await Promise.allSettled(promises)){
		await set.value
		iBuiltins = [...iBuiltins,...set.value]
	}
	builtins.set(document.uri, iBuiltins)
	fileToNameToCompoundDefine.set(document.uri,nameToBuiltins)
	
	
	//while (!(compounds.Actions&&compounds.Booleans&&compounds.Doubles&&compounds.Cubes&&compounds.Positions&&compounds.Triggers&&compounds.Strings&&compounds.Perks)) {let wait}
	//await Promise.allSettled(await compounds['Abilities'])
	return Promise;
}



