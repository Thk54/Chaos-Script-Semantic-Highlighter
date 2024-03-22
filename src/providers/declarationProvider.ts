import * as vscode from 'vscode';
import { regexes } from '../regexes'
import { getDefineFromWord } from './commonFunctions';

export class DeclarationProvider implements vscode.DeclarationProvider{
	async provideDeclaration(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Declaration>{
		let define = getDefineFromWord((document.lineAt(position.line).text.match(regexes.captureWordInLineFromPosition(position))[0].toLowerCase()))
		if (define&&(define.Uri !== 'file:///c%3A/Users/Thk/.vscode/extensions/cube-chaos-semantic-highlighter/ModdingInfo.txt.built-ins')) {
			let defineLoc = (await vscode.workspace.openTextDocument(vscode.Uri.parse(define.Uri))).positionAt(define.Name.Index)
			return new vscode.Location(vscode.Uri.parse(define.Uri),new vscode.Range(defineLoc,defineLoc.translate({characterDelta:define.Name.Name.length})))
		}
		return
	}
}