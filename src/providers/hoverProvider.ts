import * as vscode from 'vscode';
import { regexes } from '../regexes';
import { doesCDefineHaveArguments, returnArgumentsAsString } from './commonFunctions';
import { CDefined, nameToDefines } from '../constants';

export class HoverProvider implements vscode.HoverProvider {
	async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover>{
		let defines = nameToDefines.get((document.lineAt(position.line).text.match(regexes.generateCaptureWordInLineFromPositionRegEx(position))[0].toLowerCase()))
		let string:string[] = []
		for (let define of defines){
			string.push(define.type.typeString+'  \n'+(define.name.AsFound ?? define.name.Name)+(doesCDefineHaveArguments(define)?('  \n'+returnArgumentsAsString(<CDefined>define)):''))
		}
		return new vscode.Hover(string.join('  \n***  \n'))
	}
}