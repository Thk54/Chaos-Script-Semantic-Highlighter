import * as vscode from 'vscode';
import { regexes } from '../regexes';
import { doesCDefineHaveArguments, getWordAtPosition, returnArgumentsAsString } from './commonFunctions';
import { nameToDefines } from '../constants';
import { CDefined } from "../classes";

export class HoverProvider implements vscode.HoverProvider {
	async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover>{
		let defines = nameToDefines.get(getWordAtPosition(document, position).toLowerCase())
		let string:string[] = []
		for (let define of defines){
			string.push(define.type.typeString+'  \n'+(define.name.asFound ?? define.name.name)+(doesCDefineHaveArguments(define)?('  \n'+returnArgumentsAsString(<CDefined>define)):''))
		}
		return new vscode.Hover(string.join('  \n***  \n'))
	}
}