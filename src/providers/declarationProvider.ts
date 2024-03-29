import * as vscode from 'vscode';
import { regexes } from '../regexes'
import { nameToDefines } from '../constants';

export class DeclarationProvider implements vscode.DeclarationProvider{
	async provideDeclaration(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Declaration>{
		let define = nameToDefines.get((document.lineAt(position.line).text.match(regexes.generateCaptureWordInLineFromPositionRegEx(position))[0].toLowerCase()))[0]
		if (define) {
			let defineLoc = (define.Doc).positionAt(define.Name.Index)
			return new vscode.Location(define.Doc.uri,new vscode.Range(defineLoc,defineLoc.translate({characterDelta:define.Name.Name.length})))
		}
		return
	}
}