import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	type DocumentDiagnosticReport
} from 'vscode-languageserver/node';
import * as vscode from 'vscode'
import {
	TextDocument
} from 'vscode-languageserver-textdocument';
/*
let compounds:ICompounds

interface ICompounds {
	Abilities: ICompound[];
	Actions: ICompound[];
	Booleans: ICompound[];
	Directions: ICompound[];
	Doubles: ICompound[];
	Cubes: ICompound[];
	Positions: ICompound[];
}

interface ICompound {
	Type: string,
	Name: IName,
	Contents: IContents,
	Arguments?: IArguments[]
}

interface IName {
	Name: string,
	Index: number
}

interface IContents {
	Content: string,
	Index: number
}

interface IArguments {
	Type: string,
	String: string,
	Index: number
}

interface RegExCompoundCaptures{
	RegExAbilities: RegExpMatchArray[];
	RegExActions: RegExpMatchArray[];
	RegExBooleans: RegExpMatchArray[];
	RegExDirections: RegExpMatchArray[];
	RegExDoubles: RegExpMatchArray[];
	RegExCubes: RegExpMatchArray[];
	RegExPositions: RegExpMatchArray[];
}

function gatherCompounds(document: TextDocuments<TextDocument>): RegExCompoundCaptures {
	let regExAbilities: RegExpMatchArray[] = []
	let regExActions: RegExpMatchArray[] = []
	let regExBooleans: RegExpMatchArray[] = []
	let regExDirections: RegExpMatchArray[] = []
	let regExDoubles: RegExpMatchArray[] = []
	let regExCubes: RegExpMatchArray[] = []
	let regExPositions: RegExpMatchArray[] = []
	for (let match of document.getText().matchAll(/(?:\b[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]:\s*(?<CompoundType>ABILITY|ACTION|BOOLEAN|DIRECTION|DOUBLE|CUBE|POSITION)\s*(?<CompoundName>[\S]*)\s(?<CompoundContents>.*?(?:\bText:\s(?:.(?!\b[Ee][Nn][Dd]\b))*?.\b[Ee][Nn][Dd]\b.*?)*(?:.(?!\b[Ee][Nn][Dd]\b))*?)\b[Ee][Nn][Dd]\b)/gsd)){
		switch (match.groups['CompoundType']) {
			case 'ABILITY':
				regExAbilities.push(match)
				break;
			case 'ACTION':
				regExActions.push(match)
				break;
			case 'BOOLEAN':
				regExBooleans.push(match)
				break;
			case 'DIRECTION':
				regExDirections.push(match)
				break;
			case 'DOUBLE':
				regExDoubles.push(match)
				break;
			case 'CUBE':
				regExCubes.push(match)
				break;
			case 'POSITION':
				regExPositions.push(match)
				break;
			default:
				console.log("Something has gone wrong or a new compound type was added");
				break;
		}
	}
	return{
		RegExAbilities:regExAbilities,
		RegExActions:regExActions,
		RegExBooleans:regExBooleans,
		RegExDirections:regExDirections,
		RegExDoubles:regExDoubles,
		RegExCubes:regExCubes,
		RegExPositions:regExPositions
	}
}
function extractDefinitionDetails(compounds: RegExCompoundCaptures): ICompounds {
	function packIntoCompound (capture:RegExpMatchArray): ICompound {
		let args:IArguments[] = []
///(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?:\bGeneric(?:Perk|Position|String|Word|Name|Action|Boolean|Direction|Double|Constant|Cube|Stacking|Time)\b)/gd
///(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?:\b[Gg][eE][nN][eE][rR][iI][cC](?:[Pp][eE][rR][kK]|[Pp][oO][sS][iI][tT][iI][oO][nN]|[Ss][tT][rR][iI][nN][gG]|[Ww][oO][rR][dD]|[Nn][aA][mM][eE]|[Aa][cC][tT][iI][oO][nN]|[Bb][oO][oO][lL][eE][aA][nN]|[Dd][iI][rR][eE][cC][tT][iI][oO][nN]|[Dd][oO][uU][bB][lL][eE]|[Cc][oO][nN][sS][tT][aA][nN][tT]|[Cc][uU][bB][eE]|[Ss][tT][aA][cC][kK][iI][nN][gG]|[Tt][iI][mM][eE])\b)/gd
		for(let generic of capture.groups['CompoundContents'].matchAll(/(?:\bText:\s.*?\b[Ee][Nn][Dd]\b)|(?<CompoundGenerics>\b[Gg][eE][nN][eE][rR][iI][cC](?:[Pp][eE][rR][kK]|[Pp][oO][sS][iI][tT][iI][oO][nN]|[Ss][tT][rR][iI][nN][gG]|[Ww][oO][rR][dD]|[Nn][aA][mM][eE]|[Aa][cC][tT][iI][oO][nN]|[Bb][oO][oO][lL][eE][aA][nN]|[Dd][iI][rR][eE][cC][tT][iI][oO][nN]|[Dd][oO][uU][bB][lL][eE]|[Cc][oO][nN][sS][tT][aA][nN][tT]|[Cc][uU][bB][eE]|[Ss][tT][aA][cC][kK][iI][nN][gG]|[Tt][iI][mM][eE])\b)/gd)){
			if (generic.groups['CompoundGenerics'])
				args.push({
					String: generic.groups['CompoundGenerics'],
					Type: generic.groups['CompoundGenerics'].slice(7),
					Index: generic.indices.groups['CompoundGenerics'][0]+capture.index
			})
		}
		return {
			Type:capture.groups['CompoundType'],
			Contents: {Content:capture.groups['CompoundContents'], Index:capture.indices.groups['CompoundContents'][0]},
			Name: {Name:capture.groups['CompoundName'], Index:capture.indices.groups['CompoundName'][0]},
			Arguments: args
		}
	}
	let abilities: ICompound[] = []
	let actions: ICompound[] = []
	let booleans: ICompound[] = []
	let directions: ICompound[] = []
	let doubles: ICompound[] = []
	let cubes: ICompound[] = []
	let positions: ICompound[] = []
	for (let captures of Object.entries(compounds)) {
		for (let capture of captures[1]){
			switch (capture[1]) {
				case 'ABILITY':
					abilities.push(packIntoCompound(capture))
					break;
				case 'ACTION':
					actions.push(packIntoCompound(capture))
					break;
				case 'BOOLEAN':
					booleans.push(packIntoCompound(capture))
					break;
				case 'DIRECTION':
					directions.push(packIntoCompound(capture))
					break;
				case 'DOUBLE':
					doubles.push(packIntoCompound(capture))
					break;
				case 'CUBE':
					cubes.push(packIntoCompound(capture))
					break;
				case 'POSITION':
					positions.push(packIntoCompound(capture))
					break;
				default:
					console.log("Something has gone wrong or a new compound type was added");
					break;
			}
		}
	}
	return{
		Abilities:abilities,
		Actions:actions,
		Booleans:booleans,
		Directions:directions,
		Doubles:doubles,
		Cubes:cubes,
		Positions:positions
	}
}
*/
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false
			}
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
	//compounds = gatherCompounds(documents)
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}
	// Refresh the diagnostics since the `maxNumberOfProblems` could have changed.
	// We could optimize things here and re-fetch the setting first can compare it
	// to the existing setting, but this is out of scope for this example.
	connection.languages.diagnostics.refresh();
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'cubeChaoslanguageServer'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});


connection.languages.diagnostics.on(async (params) => {
	const document = documents.get(params.textDocument.uri);
	if (document !== undefined) {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: await validateTextDocument(document)
		} satisfies DocumentDiagnosticReport;
	} else {
		// We don't know the document. We can either try to read it from disk
		// or we don't report problems for it.
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		} satisfies DocumentDiagnosticReport;
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
 console.log('wahfoiwefjsadf');
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<Diagnostic[]> {
	// In this simple example we get the settings for every validate run.
	const settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}
	return diagnostics;
} 

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);



// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
