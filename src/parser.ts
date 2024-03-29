import * as vscode from "vscode";
import { CDefined, GatherResults, CType } from './constants';
import { regexes } from "./regexes";

async function packIntoCDefined(capture: RegExpMatchArray,document:vscode.TextDocument): Promise<CDefined>{
return new CDefined(capture,document)
}
export async function gatherDefinitions(toDocument:{ doc?: vscode.TextDocument; uri?: vscode.Uri; }): Promise<GatherResults> {
	let cDefineds:CDefined[] = [] 
	const document = <vscode.TextDocument>(toDocument?.doc ?? (await vscode.workspace.openTextDocument(toDocument.uri)));
	let text: string = (<vscode.TextDocument>document).getText()
	let comments = []
	let commentsRegEx = text.matchAll(regexes.commentCapture); // Find all the comments
	for (let comment of commentsRegEx) {
		delete(comment.input)
		text = text.replace(comment[0], ''.padEnd(comment[0].length)); // replace them with spaces to preserve character count
		comments.push(comment)
	}
	let scenarios = []
	let scenariosRegEx = text.matchAll(regexes.scenarioCapture); // Match scenarios
	for (let scenario of scenariosRegEx) {//todo actually handle |[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo] and DOACTION
		delete(scenario.input)
		text = text.replace(scenario[0], ''.padEnd(scenario[0].length)); // replace them with spaces to preserve character count
		scenarios.push(scenario)
		for (let comment of scenario[0].matchAll(regexes.scenarioCommentsCapture)){
			delete(comment.input)
			comment.index = scenario.index+comment.index
			comments.push(comment)
		}
	}
	let artoverrides = <any>[]
	let promises = []
	for (let match of text.matchAll(regexes.primaryCapture)) {
		if (match?.groups['TypeOfDEFINE']?.toUpperCase() !== 'ARTOVERRIDE') {
			promises.push(packIntoCDefined(match, document))
		} else {
			delete(match.input)
			artoverrides.push(match)}
		text = text.replace(match[0], ''.padEnd(match[0].length)); // replace them with spaces to preserve character count
	}
	let doactions = <any>[]
	for (let define of promises){
		cDefineds.push(await define)
	}
	return new GatherResults(
		/* Document: */ <vscode.TextDocument>document, 
		/* Defines: */ cDefineds, 
		/* Comments: */ comments.length ? comments : null, 
		/* Scenarios: */ scenarios.length ? scenarios : null,
		/* ArtOverrides: */ artoverrides.length ? artoverrides : null,
		/* DoActions: */ doactions.length ? doactions : null)
/* groups: 
	TypeOfDefine 
		TypeOfCompound NameOfCompound ContentsOfCompound 
		NameOfCube ContentsOfCube
		NameOfPerk ContentsOfPerk 
		NameOfTextTooltip ContentOfTextTooltip 
	ArtOverrideFolder ArtOverrideSubstring ArtOverridePerk ArtOverrideCube ArtOverrideName */
}