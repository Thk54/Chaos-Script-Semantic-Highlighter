import * as vscode from "vscode";
import { IDefined, ICompound, IArguments, GatherResults } from './constants';
import { regexes } from "./regexes";

async function packIntoIDefined(capture: RegExpMatchArray): Promise<IDefined>{
	let defineType:string = capture?.groups['TypeOfDEFINE']?.toUpperCase() ?? "ABORT"
	switch (defineType) {
	case 'COMPOUND':
		return (packIntoICompound(capture))
	case 'ARTOVERRIDE':
		//ArtOverrideFolder ArtOverrideSubstring ArtOverridePerk ArtOverrideCube ArtOverrideName
		let name = capture.groups['ARTOVERRIDEName'] ? 'ARTOVERRIDEName' : capture.groups['ARTOVERRIDECube'] ? 'ARTOVERRIDECube' : capture.groups['ARTOVERRIDEPerk'] ? 'ARTOVERRIDEPerk' : capture.groups['ARTOVERRIDEFolder']&&capture.groups['ARTOVERRIDESubstring'] ? ('Files in folder: "'+capture.groups['ARTOVERRIDEFolder']+'" containing "'+capture.groups['ARTOVERRIDESubstring']+'"') : '< Malformed >';
		if (name === '< Malformed >') console.log("This shouldn't be possible (Pack ArtOverride) returning: \"< Malformed >\"")
		return ( {
			Type: {Define:defineType}, // "[Boolean] ? [thing] : [thing2]" is an if else statement
			Contents: {Capture:{Text:capture[0],Index:capture.index}, Content: capture[0].slice(12).trimStart(), Index: capture.index+(capture[0].length-capture[0].slice(12).trimStart().length)},
			Name: {Name: 'ARTOVERRIDE'/* capture?.groups[name] ? name : capture.groups[name].toLowerCase() */, Index: capture.index/* capture.indices.groups[name][0] ?? capture[0].match(/\S*\s*\S*$/).index+capture.index */}
		})
	case 'ABORT':
		console.log('IDefined ABORT on capture: '+capture[0])
		break;
	default:
		return ({
			Type: {Define:defineType},
			Contents: {Capture:{Text:capture[0],Index:capture.index}, Content: capture.groups['ContentsOf'+defineType], Index: capture.indices.groups['ContentsOf'+defineType][0]},
			Name: {Name: capture.groups['NameOf'+defineType].toLowerCase(), AsFound:capture.groups['NameOf'+defineType], Index: capture.indices.groups['NameOf'+defineType][0]}
		})
	}
}
function packIntoICompound(capture: RegExpMatchArray): ICompound {
	let args: IArguments[] = [];
	// ./regexes.genericsCapture()
	for (let generic of capture.groups['ContentsOfCOMPOUND'].matchAll(regexes.genericsCapture)) {
		if (generic.groups['CompoundGenerics'])
			args.push({
				String: generic.groups['CompoundGenerics'],
				Type: generic.groups['CompoundGenerics'].slice(7),
				Index: generic.indices.groups['CompoundGenerics'][0] + capture.index
			});
	}
	return {
		Type: {Define:'COMPOUND', Compound:capture.groups['TypeOfCOMPOUND'].toUpperCase()},
		Contents: {Capture:{Text:capture[0],Index:capture.index}, Content: capture.groups['ContentsOfCOMPOUND'], Index: capture.indices.groups['ContentsOfCOMPOUND'][0] },
		Name: { Name: capture.groups['NameOfCOMPOUND'].toLowerCase(), AsFound:capture.groups['NameOfCOMPOUND'], Index: capture.indices.groups['NameOfCOMPOUND'][0] },
		Arguments: args
	};
}
export async function gatherDefinitions(document: vscode.TextDocument): Promise<GatherResults> {
	let iDefineds:IDefined[] = []
	let text: string = document.getText();
	let comments = []
	let commentsRegEx = text.matchAll(regexes.commentCapture); // Find all the comments // ./regexes.commentCapture()
	for (let comment of commentsRegEx) {
		delete(comment.input)
		text = text.replace(comment[0], ''.padEnd(comment[0].length)); // replace them with spaces to preserve character count
		comments.push(comment)
	}
	let scenarios = []
	let scenariosRegEx = text.matchAll(regexes.scenarioCapture); // Match scenarios // ./regexes.scenarioCapture()
	for (let scenario of scenariosRegEx) {//todo actually handle |[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo] and DOACTION
		delete(scenario.input)
		text = text.replace(scenario[0], ''.padEnd(scenario[0].length)); // replace them with spaces to preserve character count
		scenarios.push(scenario)
		for (let comment of scenario[0].matchAll(regexes.scenarioCommentsCapture/* /(?<=\s|^)\/\/\s(?:.*?\s)?\/\/(?=\s|$)/gs */)){ //./regexes.scenarioCommentsCapture()
			delete(comment.input)
			comment.index = scenario.index+comment.index
			comments.push(comment)
		}
	}
	// ./regexes.primaryCapture()
	for (let match of text.matchAll(regexes.primaryCapture)) {
		iDefineds.push(await packIntoIDefined(match))
	} return {Defines:iDefineds, Document:document, Comments:comments.length ? comments : null, Scenarios:scenarios.length ? scenarios : null}
/* groups: 
	TypeOfDefine 
		TypeOfCompound NameOfCompound ContentsOfCompound 
		NameOfCube ContentsOfCube
		NameOfPerk ContentsOfPerk 
		NameOfTextTooltip ContentOfTextTooltip 
	ArtOverrideFolder ArtOverrideSubstring ArtOverridePerk ArtOverrideCube ArtOverrideName */
}