import * as vscode from 'vscode';
import { regexes } from '../regexes';
import { doesCDefineHaveArguments, returnArgumentsAsString } from './commonFunctions';
import { CDefined, nameToDefines } from '../constants';

export class HoverProvider implements vscode.HoverProvider {
	async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover>{
		let define = nameToDefines.get((document.lineAt(position.line).text.match(regexes.generateCaptureWordInLineFromPositionRegEx(position))[0].toLowerCase()))[0]
		return new vscode.Hover(define.type.typeString+'  \n'+(define.name.AsFound ?? define.name.Name)+(doesCDefineHaveArguments(define)?('  \n'+returnArgumentsAsString(<CDefined>define)):''))
	}
}