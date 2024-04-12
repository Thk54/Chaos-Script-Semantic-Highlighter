import * as vscode from 'vscode';
import { fileToGatherResults, tokenTypes } from '../constants';
import { getWordAtPosition } from './commonFunctions';


export class CallHierarchyProvider implements vscode.CallHierarchyProvider {
	async prepareCallHierarchy(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.CallHierarchyItem | vscode.CallHierarchyItem[]> {
		let gatherResults = fileToGatherResults.get(document.uri.toString())
		let containingDefine = gatherResults.defines.find((define)=>{return define.contents.location.range.contains(position)}) //kinda want to make this a bianary search, but it sounds like a lot of work
		let componentToken = containingDefine.contents.components.find((component)=>{return component.range.contains(position)})
		let componentName = getWordAtPosition(document, position)
		return new vscode.CallHierarchyItem(tokenTypes.get(componentToken.tokenType), componentName, 'this is supposedly optional', document.uri, componentToken.range, componentToken.range)
	}
	async provideCallHierarchyIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]> { //stuff that refrences the thing
		return
	}
	async provideCallHierarchyOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[]> { //stuff inside the thing
		return
	}
}
