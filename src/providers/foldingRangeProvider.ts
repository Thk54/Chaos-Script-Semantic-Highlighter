import * as vscode from 'vscode';
import { gatherDefinitions } from '../parser';
import { CGatherResults } from "../classes";


export class FoldingRangeProvider implements vscode.FoldingRangeProvider {
	async provideFoldingRanges(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.FoldingRange[]> {
		let gatherResults: CGatherResults = (await gatherDefinitions(document));
		let ranges: vscode.FoldingRange[] = [];
		for (let iDefine of gatherResults.defines ?? []) {
			if (iDefine) {
				let posStart = document.positionAt(iDefine.contents.capture.index);
				let posEnd = document.positionAt(iDefine.contents.capture.index + iDefine.contents.capture.text.length);
				ranges.push({ start: posStart.line, end: posEnd.line });
			}
		}
		for (let comment of gatherResults?.comments ?? []) {
			if (comment) {
				let posStart = document.positionAt(comment.index);
				let posEnd = document.positionAt(comment.index + comment[0].length);
				ranges.push({ start: posStart.line, end: posEnd.line, kind: 1 });
			}
		}
		for (let scenario of gatherResults?.scenarios ?? []) {
			if (scenario) {
				let posStart = document.positionAt(scenario.index);
				let posEnd = document.positionAt(scenario.index + scenario[0].length);
				ranges.push({ start: posStart.line, end: posEnd.line });
			}
		}
		if (ranges.length) return ranges;
		return;
	}
}
