import * as vscode from "vscode";
import { IDefined, ICompound, IArguments, GatherResults } from './constants';
import { regexes } from "./regexes";

async function packIntoIDefined(capture: RegExpMatchArray): Promise<IDefined>{
	let defineType:string = capture?.groups['TypeOfDEFINE'].toUpperCase() ?? "ABORT"
	switch (defineType) {
	case 'COMPOUND':
		return (packIntoICompound(capture))
	case 'ARTOVERRIDE':
		//ArtOverrideFolder ArtOverrideSubstring ArtOverridePerk ArtOverrideCube ArtOverrideName
		let name = capture.groups['ARTOVERRIDEName'] ? 'ARTOVERRIDEName' : capture.groups['ARTOVERRIDECube'] ? 'ARTOVERRIDECube' : capture.groups['ARTOVERRIDEPerk'] ? 'ARTOVERRIDEPerk' : capture.groups['ARTOVERRIDEFolder']&&capture.groups['ARTOVERRIDESubstring'] ? ('Files in folder: "'+capture.groups['ARTOVERRIDEFolder']+'" containing "'+capture.groups['ARTOVERRIDESubstring']+'"') : '< Malformed >';
		if (name === '< Malformed >') console.log("This shouldn't be possible (Pack ArtOverride) returning: \"< Malformed >\"")
		/* if (capture.groups['ArtOverrideName']) {name = 'ArtOverrideName'}
		else if (capture.groups['ArtOverrideCube']){name = 'ArtOverrideCube'}
		else if (capture.groups['ArtOverridePerk']){name = 'ArtOverridePerk'}
		else if (capture.groups['ArtOverrideFolder']&&capture.groups['ArtOverrideSubstring']){name = ('Files in folder: "'+capture.groups['ArtOverrideFolder']+'" containing "'+capture.groups['ArtOverrideSubstring']+'"')} else {console.log("This shouldn't be possible (Pack ArtOverride) returning: \"< Malformed >\"");name = '< Malformed >'} */
		return ( {
			Type: {Define:defineType}, // "[Boolean] ? [thing] : [thing2]" is an if else statement
			Contents: {Capture:{Text:capture[0],Index:capture.index}, Content: capture[0].slice(12).trimStart(), Index: capture.index+(capture[0].length-capture[0].slice(12).trimStart().length)},
			Name: {Name: capture?.groups[name] ? name : capture.groups[name].toLowerCase(), Index: capture?.groups[name] ? capture[0].match(/\S*\s*\S*$/).index+capture.index : capture.indices.groups[name][0]}
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
	for (let generic of capture.groups['ContentsOfCOMPOUND'].matchAll(/(?:\b(?:Text:|GainAbilityText)\s.*?\b[Ee][Nn][Dd]\b)|(?<CompoundGenerics>[Gg][Ee][Nn][Ee][Rr][Ii][Cc](?:[Pp][Ee][Rr][Kk]|[Pp][Oo][Ss][Ii][Tt][Ii][Oo][Nn]|[Ss][Tt][Rr][Ii][Nn][Gg]|[Ww][Oo][Rr][Dd]|[Nn][Aa][Mm][Ee]|[Aa][Cc][Tt][Ii][Oo][Nn]|[Bb][Oo][Oo][Ll][Ee][Aa][Nn]|[Dd][Ii][Rr][Ee][Cc][Tt][Ii][Oo][Nn]|[Dd][Oo][Uu][Bb][Ll][Ee]|[Cc][Oo][Nn][Ss][Tt][Aa][Nn][Tt]|[Cc][Uu][Bb][Ee]|[Ss][Tt][Aa][Cc][Kk][Ii][Nn][Gg]|[Tt][Ii][Mm][Ee])\b)/dg)) {
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
	let commentsRegEx = text.matchAll(/(?<=\s|^)\/-(?=\s).*?\s-\/(?=\s|$)/gs); // Find all the comments // ./regexes.commentCapture()
	if (commentsRegEx) {
		for (let comment of commentsRegEx) {
			delete(comment.input)
			text = text.replace(comment[0], ''.padEnd(comment[0].length)); // replace them with spaces to preserve character count
			comments.push(comment)
		}
	}
	let scenarios = []
	let scenariosRegEx = text.matchAll(/\b[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo]:\s[\s\S]*?\b[Ss][Ee][Nn][Dd]\b/gs); // Match scenarios // ./regexes.scenarioCapture()
	if (scenariosRegEx) {
		for (let scenario of scenariosRegEx) {//todo actually handle |[Ss][Cc][Ee][Nn][Aa][Rr][Ii][Oo] and DOACTION
			delete(scenario.input)
			text = text.replace(scenario[0], ''.padEnd(scenario[0].length)); // replace them with spaces to preserve character count
			scenarios.push(scenario)
			for (let comment of scenario[0].matchAll(/(?<=\s|^)\/\/\s(?:.*?\s)?\/\/(?=\s|$)/gs)){ //./regexes.scenarioCommentsCapture()
				delete(comment.input)
				comment.index = scenario.index+comment.index
				comments.push(comment)
			}
		}
	}
	// ./regexes.primaryCapture()
	for (let match of text.matchAll(/\b(?<TypeOfDEFINE>[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]|[Cc][Uu][Bb][Ee]|[Pp][Ee][Rr][Kk]|[Aa][Rr][Tt][Oo][Vv][Ee][Rr][Rr][Ii][Dd][Ee]|[Tt][Ee][Xx][Tt][Tt][Oo][Oo][Ll][Tt][Ii][Pp]):\s(?:(?:(?:(?<=[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s)\s*(?<TypeOfCOMPOUND>TRIGGER|ABILITY|ACTION|BOOLEAN|CUBE|DIRECTION|POSITION|DOUBLE|PERK|STRING)\s*(?<NameOfCOMPOUND>\S*)\s(?<ContentsOfCOMPOUND>.*?(?:\b(?:(?:Text):|(?:GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?))|(?:(?<=[Cc][Uu][Bb][Ee]:\s)\s*(?<NameOfCUBE>\S+)\s+(?<ContentsOfCUBE>.*?(?:\b(?:(?:(?:Flavour)?Text):|(?:GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?))|(?:(?<=[Pp][Ee][Rr][Kk]:\s)\s*(?<NameOfPERK>\S+)\s+(?<ContentsOfPERK>.*?(?:\b(?:(?:AbilityText|Description|TODO):|(?:GainAbilityText))\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?))|(?:(?<=[Tt][Ee][Xx][Tt][Tt][Oo][Oo][Ll][Tt][Ii][Pp]:\s)\s*(?<NameOfTEXTTOOLTIP>\S+)\s+(?<ContentsOfTEXTTOOLTIP>.*?)))\b[Ee][Nn][Dd]\b)|(?:(?<=[Aa][Rr][Tt][Oo][Vv][Ee][Rr][Rr][Ii][Dd][Ee]:\s)\s*(?:(?:ALL\s+(?<ARTOVERRIDEFolder>\S+)\s+(?<ARTOVERRIDESubstring>\S+))|(?:PERK\s+(?<ARTOVERRIDEPerk>\S+))|(?:CUBE\s+(?<ARTOVERRIDECube>\S+))|(?<ARTOVERRIDEName>\S+))(?=\s|$))/dgs)) {
		iDefineds.push(await packIntoIDefined(match))
	} return {Defines:iDefineds, Document:document, Comments:comments.length ? comments : undefined, Scenarios:scenarios.length ? scenarios : undefined}
/* groups: 
	TypeOfDefine 
		TypeOfCompound NameOfCompound ContentsOfCompound 
		NameOfCube ContentsOfCube
		NameOfPerk ContentsOfPerk 
		NameOfTextTooltip ContentOfTextTooltip 
	ArtOverrideFolder ArtOverrideSubstring ArtOverridePerk ArtOverrideCube ArtOverrideName */
}