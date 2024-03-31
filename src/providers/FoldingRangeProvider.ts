import * as vscode from 'vscode';
import { gatherDefinitions } from '../parser';
import { GatherResults } from "../classes";


export class FoldingRangeProvider implements vscode.FoldingRangeProvider {
	async provideFoldingRanges(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.FoldingRange[]> {
		let gatherResults: GatherResults = (await gatherDefinitions(document));
		let ranges: vscode.FoldingRange[] = [];
		for (let iDefine of gatherResults.Defines ?? []) {
			if (iDefine) {
				let posStart = document.positionAt(iDefine.contents.capture.Index);
				let posEnd = document.positionAt(iDefine.contents.capture.Index + iDefine.contents.capture.Text.length);
				ranges.push({ start: posStart.line, end: posEnd.line });
			}
		}
		for (let comment of gatherResults?.Comments ?? []) {
			if (comment) {
				let posStart = document.positionAt(comment.index);
				let posEnd = document.positionAt(comment.index + comment[0].length);
				ranges.push({ start: posStart.line, end: posEnd.line, kind: 1 });
			}
		}
		for (let scenario of gatherResults?.Scenarios ?? []) {
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
