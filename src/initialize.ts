import * as vscode from 'vscode';
import { addToMapsIfEntriesExist, addToFileToNameToCompoundListMap } from './mapsManager';
import { presentTextDocumentFromURIToReturnlessFunction, FoldingRangeProvider, DocumentSemanticTokensProvider } from './extension';
import { IBuiltins, IArguments, typeToCompoundsMap, fileToCompoundsesMap, legend, generateMaps, compoundTypeMap } from './constants';
import {buildRegexes} from './regexes'

export async function activate(context: vscode.ExtensionContext) {
	generateMaps;
	console.log(buildRegexes())
	await initialize(context);
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ language: 'cubechaos' }, new FoldingRangeProvider()));
	//context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'cubechaos' }, new DocumentSymbolProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'cubechaos' }, new DocumentSemanticTokensProvider(), legend));
}

export async function initialize/*Compounds*/(context: vscode.ExtensionContext) {
	let files = vscode.workspace.findFiles('**/*.txt');
	let promises = [];
	promises.push(await presentTextDocumentFromURIToReturnlessFunction(context.extensionUri.with({ path: context.extensionUri.path + '/ModdingInfo.txt.built-ins' }), parseModdinginfo));
	for (let txt of await files) {
		promises.push(presentTextDocumentFromURIToReturnlessFunction(txt, addToMapsIfEntriesExist));
	}
	await Promise.allSettled(promises);
	console.log('initial map done');
}export async function parseModdinginfo(document: vscode.TextDocument) {
	const pack: Function = function (lines: string[]): IBuiltins[] {
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
			compounds.push({
				Type: type,
				Name: { Name: name[0] },
				Arguments: args
			});
		}
		return compounds;
	};
	let compoundsMap = [];
	for (let match of document.getText().matchAll(/^(Triggers|Actions|BOOLEAN|CUBE|DIRECTION|DOUBLE|PERK|POSITION|STRING): (?:$\s\s?^(?:.(?!\:))+$)+/gim)) {
		let sectionType = match[1].toUpperCase();
		switch (match[1].toUpperCase()) {
			case 'ACTIONS':
				compoundsMap[compoundTypeMap.get('ACTION')] = pack(match[0].split(/[\r\n]+/));
				break;
			case 'TRIGGERS':
				compoundsMap[compoundTypeMap.get('TRIGGER')] = pack(match[0].split(/[\r\n]+/));
				break;
			default:
				if (compoundTypeMap.get(sectionType)) {
					compoundsMap[compoundTypeMap.get(sectionType)] = pack(match[0].split(/[\r\n]+/));
				}
				else { console.log("Something has gone wrong or a new compound type was added (parseModdinginfo)"); }
				break;
		}
	}
	if (compoundsMap) {
		let returnMap: typeToCompoundsMap = new Map;
		for (let compounds of compoundsMap) {
			if (compounds?.length) {
				returnMap.set(compounds[0].Type, compounds);
			}
		}
		fileToCompoundsesMap.set(document.uri, returnMap);
		addToFileToNameToCompoundListMap(returnMap, document.uri);
	}
	//while (!(compounds.Actions&&compounds.Booleans&&compounds.Doubles&&compounds.Cubes&&compounds.Positions&&compounds.Triggers&&compounds.Strings&&compounds.Perks)) {let wait}
	//await Promise.allSettled(await compounds['Abilities'])
	return Promise;
}



