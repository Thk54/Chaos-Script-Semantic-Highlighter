import * as vscode from 'vscode';
import { updateFilesMapsIfEntries, } from './mapsManager';
import { FoldingRangeProvider, DocumentSemanticTokensProvider, DocumentSymbolProvider, WorkspaceSymbolProvider } from './extension';
import { IBuiltins, IArguments, legend, generateMaps, builtins, fileToNameToCompoundDefine, IDefined } from './constants';
import {buildRegexes} from './regexes'

export async function activate(context: vscode.ExtensionContext) {
	generateMaps;
	//buildRegexes()
	await initialize(context);
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ language: 'cubechaos' }, new FoldingRangeProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'cubechaos' }, new DocumentSymbolProvider()));
	context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new WorkspaceSymbolProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'cubechaos' }, new DocumentSemanticTokensProvider(), legend));
}

export async function initialize/*Compounds*/(context: vscode.ExtensionContext) {
	let files = vscode.workspace.findFiles('**/*.txt');
	let promises = [];
	promises.push(await parseModdinginfo(context.extensionUri.with({ path: context.extensionUri.path + '/ModdingInfo.txt.built-ins' })));
	for (let txt of await files) {
		promises.push(updateFilesMapsIfEntries({uri:txt}))
		//promises.push(presentTextDocumentFromURIToReturnlessFunction(txt, updateFilesMapsIfEntries));
	}
	await Promise.allSettled(promises);
	console.log('initial map done');
}

export async function parseModdinginfo(uri: vscode.Uri) {
	const document = await vscode.workspace.openTextDocument(uri)
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
				Name: { Name: name[0].toLowerCase(), AsFound:name[0] },
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
	for (let set of await <any>Promise.allSettled(promises)){
		//await set.value //much fuckery I don't really understand here
		iBuiltins = [...iBuiltins,...await (set.value)]
	}
	builtins.set(document.uri.toString(), iBuiltins)
	fileToNameToCompoundDefine.set(document.uri.toString(),<Map<string,IDefined>>nameToBuiltins)
	return Promise;
}



