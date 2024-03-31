import * as vscode from 'vscode';
import { fileToGatherResults, tokenTypes } from '../constants';


export class CallHierarchyProvider implements vscode.CallHierarchyProvider {
	async prepareCallHierarchy(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.CallHierarchyItem | vscode.CallHierarchyItem[]> {
		return
	}
	async provideCallHierarchyIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]> {
		return
	}
	async provideCallHierarchyOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[]> {
		return
	}
}
