import * as vscode from 'vscode';
import { regexes } from '../regexes';
import { doesIDefineHaveArguments, getDefineFromWord, returnArgumentsAsString } from './commonFunctions';
import { ICompound } from '../constants';

export class HoverProvider implements vscode.HoverProvider {
	async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover>{
		let define = getDefineFromWord((document.lineAt(position.line).text.match(regexes.captureWordInLineFromPosition(position))[0].toLowerCase()))
		return new vscode.Hover(((define.Type.Define === 'COMPOUND') ? (define.Type.Define+': '+define.Type.Compound) : define.Type.Define)+'  \n'+(define.Name.AsFound ?? define.Name.Name)+(doesIDefineHaveArguments(define)?('  \n'+returnArgumentsAsString(<ICompound>define)):''))
	}
}