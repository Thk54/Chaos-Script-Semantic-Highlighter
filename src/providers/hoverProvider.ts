import * as vscode from 'vscode';
import { regexes } from '../regexes';
import { getDefineFromWord } from './commonFunctions';

export class HoverProvider implements vscode.HoverProvider {
	async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover>{
		let define = getDefineFromWord((document.lineAt(position.line).text.match(regexes.captureWordInLineFromPosition(position))[0].toLowerCase()))
		return new vscode.Hover(define.Uri)
	}
}