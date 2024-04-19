import * as vscode from 'vscode';
import { CallHierarchyProvider } from './providers/callHierarchyProvider';
import { CodeLensProvider } from './providers/codeLensProvider';
import { CompletionItemProvider } from './providers/completionItemProvider';
import { DeclarationProvider } from './providers/declarationProvider';
import { FoldingRangeProvider } from './providers/foldingRangeProvider';
import { DocumentSemanticTokensProvider } from './providers/documentSemanticTokensProvider';
import { DocumentSymbolProvider } from './providers/documentSymbolProvider';
import { WorkspaceSymbolProvider } from './providers/workspaceSymbolProvider';
import { HoverProvider } from './providers/hoverProvider';
import { IArgument, legend, uriToGatherResultsDefines, nameToDefines, argOptions } from './constants';
import { CGatherResults, CDefined, CBuiltIn } from "./classes";
import { gatherDefinitions } from './parser';
import { addCDefinedToMapWithRefrenceToOwnEntryValue } from './providers/commonFunctions';
export const protoDiagnostics = vscode.languages.createDiagnosticCollection('proto')
//let docSymProvider = new DocumentSymbolProvider

//export let initializeFinished = false
export async function activate(context: vscode.ExtensionContext) {
	vscode.workspace.getConfiguration('', ).update('editor.wordSeparators', ''/* default: `~!@#$%^&*()-=+[{]}\|;:'",.<>/? */, false, true);
	await initialize(context);
	//context.subscriptions.push(vscode.languages.registerCallHierarchyProvider({ language: 'chaos-script' }, new CallHierarchyProvider()))
	//context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'chaos-script' }, new CodeLensProvider))
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: 'chaos-script' }, new CompletionItemProvider()))
	context.subscriptions.push(vscode.languages.registerDeclarationProvider({ language: 'chaos-script' }, new DeclarationProvider));
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ language: 'chaos-script' }, new FoldingRangeProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'chaos-script' }, new DocumentSemanticTokensProvider(), legend));
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'chaos-script' }, new DocumentSymbolProvider()));
	context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new WorkspaceSymbolProvider()));
	context.subscriptions.push(vscode.languages.registerHoverProvider({ language: 'chaos-script' }, new HoverProvider()))
	context.subscriptions.push(vscode.languages.setLanguageConfiguration('chaos-script', {wordPattern:/\S+/}))
	//context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e)=>{console.log(e.document.uri.toString())}))
}

export async function initialize(context: vscode.ExtensionContext) {
	console.log('Initialize map start'); console.time('Initialize map done in')
	let files = vscode.workspace.findFiles('**/*.txt');
	let promises = [];
	promises.push(parseModdinginfo(context.extensionUri.with({ path: context.extensionUri.path + '/ModdingInfo.txt.built-ins' })));
	for (let txt of await files) {
		promises.push(gatherDefinitions({uri:txt}))
	}
	for (let defines of promises){
		uriToGatherResultsDefines.set((await defines).document.uri.toString(), (await defines))
	}
	await Promise.allSettled(promises);
	for (let defines of uriToGatherResultsDefines.values()){
		for (let define of defines.defines){
			addCDefinedToMapWithRefrenceToOwnEntryValue(nameToDefines,define)
		}
	}
	for (let defines of uriToGatherResultsDefines.values()){
		for (let define of defines.defines){
			if (!define.type.isBuiltIn) define.contents.buildTheTree()
		}
	}

	console.timeEnd('Initialize map done in')
	CDefined.initializeFinished = true
}

async function parseModdinginfo(uri: vscode.Uri) {
	const document = await vscode.workspace.openTextDocument(uri)
	let promises:any = []
	let iBuiltins:CBuiltIn[] = [];
	for (let match of document.getText().matchAll(/^(Trigger|Action|BOOLEAN|CUBE|DIRECTION|DOUBLE|PERK|POSITION|STRING): (?:$\s\s?^(?:.(?!\:))+$)+/gim)) {
		promises.push(packBuiltins(match,document))
	}
	for (let set of await <any>Promise.allSettled(promises)){//Much fuckery I don't
		iBuiltins = [...iBuiltins,...await (set.value)]//really understand here
	}
	return <CGatherResults>{defines:<CDefined[]>iBuiltins, document:document};//built on a bed of confident lies
}
async function packBuiltins(match:RegExpMatchArray, document:vscode.TextDocument): Promise<CBuiltIn[]> {
	let compounds: CBuiltIn[] = [];
	let lines = match[0].split(/[\r\n]+/)
	let type = lines[0].toUpperCase().slice(0,lines[0].length-2) //.match(/(.*?)S?: /)[1];
	lines.shift();
	for (let line of lines) {
		let args: IArgument[] = [];
		let name = line.match(/^\S+/);
		let index = match.index + match[0].indexOf(line)
		line.slice(name.length);
		let first: boolean = true;
		for (let generic of line.matchAll(/\S+/ig)) {
			if (first) {
				first = false;
			} else {
				let temp
				if (/* generic[0].toUpperCase() === generic[0] */true) {
					temp = generic[0].toUpperCase() + 'compound';
				} else { temp = generic[0].toUpperCase() + 'const'}
				if (temp === 'TRIGGERcompound') temp = argOptions.ABILITYcompound.mapString
				args.push({ mapString: temp });
			}
		}
		if (type === 'TRIGGER') {type = 'ABILITY'}
		let builtin:CBuiltIn = new CBuiltIn(
			/* Type: */ { defineType: 'BUILT-IN', compoundType:type },
			/* Name: */ { name: name[0].toLowerCase(), asFound: name[0], index:document.positionAt(index) },
			/* Document: */ document,
			/* Arguments: */ args
		);
		compounds.push(builtin);
	}
	return compounds;
}

function fixExeptions(){
/* 	TakeXDamageEffect DOUBLE int String
	SetVariable String DOUBLE
	ChangeVariable String DOUBLE
	RemoveAbilityWithName String
	GainAbilityText Ability ENDUSER
	ChangeAbilityStacking String DOUBLE
	ReadAScenario String
	ChangeCampaignVariable String DOUBLE
	SetCampaignVariable String DOUBLE
	SetScoringScenario String
	PlaySound String
	TriggerCampaignSomething String
	SetMapNodeScenario DOUBLE String
	ReadAPartialScenario String
	TriggerWorldSomething String
	HasAbilityWithName CUBE String
	HasCategory CUBE String
	PerkIsType PERK String
	IsType String
	MapNodeIsType DOUBLE String
	CubeConstant String
	GetVariableOnCube String CUBE
	GetCampaignVariable String
	GetBestScore String
	GetStackingOfAbilityOnCube String CUBE
	PerkConstant String
	StringConstant String */
}