import * as vscode from 'vscode';
import { regexes } from '../regexes';
import { doesIDefineHaveArguments, returnArgumentsAsString } from './commonFunctions';
import { CDefined, nameToDefines } from '../constants';

export class HoverProvider implements vscode.HoverProvider {
	async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover>{
		let define = nameToDefines.get((document.lineAt(position.line).text.match(regexes.generateCaptureWordInLineFromPositionRegEx(position))[0].toLowerCase()))[0]
		return new vscode.Hover(define.Type.typeString+'  \n'+(define.Name.AsFound ?? define.Name.Name)+(doesIDefineHaveArguments(define)?('  \n'+returnArgumentsAsString(<CDefined>define)):''))
	}
}