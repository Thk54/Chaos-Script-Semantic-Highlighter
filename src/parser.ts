import * as vscode from "vscode";
import { CDefined, IArguments, GatherResults, CType } from './constants';
import { regexes } from "./regexes";

async function packIntoCDefined(capture: RegExpMatchArray,document:vscode.TextDocument): Promise<CDefined>{
	let defineType:string = capture?.groups['TypeOfDEFINE']?.toUpperCase() ?? "ABORT"
	switch (defineType) {
	case 'COMPOUND':
		return (packCompoundIntoCDefined(capture,document))
/* 	case 'ARTOVERRIDE':
		//ArtOverrideFolder ArtOverrideSubstring ArtOverridePerk ArtOverrideCube ArtOverrideName
		let name = capture.groups['ARTOVERRIDEName'] ? 'ARTOVERRIDEName' : capture.groups['ARTOVERRIDECube'] ? 'ARTOVERRIDECube' : capture.groups['ARTOVERRIDEPerk'] ? 'ARTOVERRIDEPerk' : capture.groups['ARTOVERRIDEFolder']&&capture.groups['ARTOVERRIDESubstring'] ? ('Files in folder: "'+capture.groups['ARTOVERRIDEFolder']+'" containing "'+capture.groups['ARTOVERRIDESubstring']+'"') : '< Malformed >';
		if (name === '< Malformed >') console.log("This shouldn't be possible (Pack ArtOverride) returning: \"< Malformed >\"") */
		return new CDefined( 
			/* Type: */ {DefineType:defineType}, // "[Boolean] ? [thing] : [thing2]" is an if else statement
			/* Name: */ {Name: 'ARTOVERRIDE'/* capture?.groups[name] ? name : capture.groups[name].toLowerCase() */, Index: capture.index/* capture.indices.groups[name][0] ?? capture[0].match(/\S*\s*\S*$/).index+capture.index */},
			/* Document: */ document,
			/* Contents :*/ {Capture:{Text:capture[0],Index:capture.index}, Content: capture[0].slice(12).trimStart(), Index: capture.index+(capture[0].length-capture[0].slice(12).trimStart().length)}
		)
	case 'ABORT':
		console.log('IDefined ABORT on capture: '+capture[0])
		break;
	default:
		return new CDefined(
			/* Type: */ {DefineType:defineType},
			/* Name: */ {Name: capture.groups['NameOf'+defineType].toLowerCase(), AsFound:capture.groups['NameOf'+defineType], Index: capture.indices.groups['NameOf'+defineType][0]},
			/* Document: */ document,
			/* Contents: */ {Capture:{Text:capture[0],Index:capture.index}, Content: capture.groups['ContentsOf'+defineType], Index: capture.indices.groups['ContentsOf'+defineType][0]}
		)
	}
}
function packCompoundIntoCDefined(capture: RegExpMatchArray,document:vscode.TextDocument): CDefined {
	let args: IArguments[] = [];
	for (let generic of capture.groups['ContentsOfCOMPOUND'].matchAll(regexes.genericsCapture)) {
		if (generic.groups['CompoundGenerics'])
			args.push({
				String: generic.groups['CompoundGenerics'],
				Type: generic.groups['CompoundGenerics'].slice(7),
				Index: generic.indices.groups['CompoundGenerics'][0] + capture.index
			});
	}
	return new CDefined(
		/* Type: */ {DefineType:'COMPOUND',CompoundType:capture.groups['TypeOfCOMPOUND'].toUpperCase()},
		/* Name: */ { Name: capture.groups['NameOfCOMPOUND'].toLowerCase(), AsFound:capture.groups['NameOfCOMPOUND'], Index: capture.indices.groups['NameOfCOMPOUND'][0] },
		/* Document: */document,
		/* Contents: */ {Capture:{Text:capture[0],Index:capture.index}, Content: capture.groups['ContentsOfCOMPOUND'], Index: capture.indices.groups['ContentsOfCOMPOUND'][0] },
		/* Arguments: */ args
	);
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
		} else {artoverrides.push(match)}
		text = text.replace(match[0], ''.padEnd(match[0].length)); // replace them with spaces to preserve character count
	}
	for (let define of promises){
		(await define).type.define !== 'ARTOVERRIDE' ? cDefineds.push(await define) : artoverrides.push(await define)
	}
	let doactions = <any>[]
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