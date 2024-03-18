import * as consts from "./constants"

function caseInsensify(input: string): string {
	let result: string = '';
	for (let character of Object.values(input).map((value: string) => { if (value.toUpperCase() !== value.toLowerCase()) { '[' + value.toUpperCase() + value.toLowerCase() + ']'; } else { value; } })) {
		result += character;
	}
	return result;
}
