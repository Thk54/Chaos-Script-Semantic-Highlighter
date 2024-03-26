import * as vscode from 'vscode';
import { updateFilesMapsIfEntries } from './providers/commonFunctions';
import { DeclarationProvider } from './providers/declarationProvider';
import { FoldingRangeProvider } from './providers/foldingRangeProvider';
import { DocumentSemanticTokensProvider } from './providers/documentSemanticTokensProvider';
import { DocumentSymbolProvider } from './providers/documentSymbolProvider';
import { WorkspaceSymbolProvider } from './providers/workspaceSymbolProvider';
import { HoverProvider } from './providers/hoverProvider';
import { IBuiltins, IArguments, legend, generateMaps, builtins, fileToNameToCompoundDefine, IDefined } from './constants';
import { regexes } from './regexes'

export let initializeFinished = false

export async function activate(context: vscode.ExtensionContext) {
	generateMaps;
	//regexes.buildRegexes()
	await initialize(context);
	context.subscriptions.push(vscode.languages.registerDeclarationProvider({ language: 'chaos-script' }, new DeclarationProvider));
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ language: 'chaos-script' }, new FoldingRangeProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'chaos-script' }, new DocumentSemanticTokensProvider(), legend));
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'chaos-script' }, new DocumentSymbolProvider()));
	context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new WorkspaceSymbolProvider()));
	context.subscriptions.push(vscode.languages.registerHoverProvider({ language: 'chaos-script' }, new HoverProvider))
}

export async function initialize/*Compounds*/(context: vscode.ExtensionContext) {
	console.log('Initialize map start'); console.time('Initialize map done in')
	let files = vscode.workspace.findFiles('**/*.txt');
	let promises = [];
	promises.push(await parseModdinginfo(context.extensionUri.with({ path: context.extensionUri.path + '/ModdingInfo.txt.built-ins' })));
	for (let txt of await files) {
		promises.push(updateFilesMapsIfEntries({uri:txt}))
	}
	await Promise.allSettled(promises);
	console.timeEnd('Initialize map done in')
	initializeFinished = true
}

export async function parseModdinginfo(uri: vscode.Uri) {
	const document = await vscode.workspace.openTextDocument(uri)
	let nameToBuiltins = new Map<string,IBuiltins>();
	let promises:any = []
	let iBuiltins:IBuiltins[] = [];
	for (let match of document.getText().matchAll(/^(Triggers?|Actions?|BOOLEAN|CUBE|DIRECTION|DOUBLE|PERK|POSITION|STRING): (?:$\s\s?^(?:.(?!\:))+$)+/gim)) {
		promises.push(packBuiltins(match[0].split(/[\r\n]+/),nameToBuiltins,match))
	}
	for (let set of await <any>Promise.allSettled(promises)){//Much fuckery I don't
		iBuiltins = [...iBuiltins,...await (set.value)]//really understand here
	}
	builtins.set(document.uri.toString(), iBuiltins)
	fileToNameToCompoundDefine.set(document.uri.toString(),<Map<string,IDefined>>nameToBuiltins)
	return Promise;
}
async function packBuiltins(lines: string[],nameToBuiltinsMap:Map<string,IBuiltins>,match:RegExpMatchArray): Promise<IBuiltins[]> {
	let compounds: IBuiltins[] = [];
	let type = lines[0].toUpperCase().match(/(.*?)S?: /)[1]; //todo fix plural types
	lines.shift();
	for (let line of lines) {
		let args: IArguments[] = [];
		let name = line.match(/^\S+/);
		let index = match.index + match[0].indexOf(line)
		line.slice(name.length);
		let first: boolean = true;
		for (let generic of line.matchAll(/\S+/ig)) {
			if (first) { first = false; }
			else { args.push({ Type: generic[0].toUpperCase() }); }
		}
		let builtin = {
			Type: { Define: 'COMPOUND', Compound: type === 'TRIGGER' ? 'ABILITY' : type },
			Name: { Name: name[0].toLowerCase(), AsFound: name[0], Index:index },
			Arguments: args
		};
		nameToBuiltinsMap.set(builtin.Name.Name, builtin);
		compounds.push(builtin);
	}
	return compounds;
}

