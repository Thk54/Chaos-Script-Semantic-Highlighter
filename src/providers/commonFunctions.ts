import { IArguments, ICompound, IDefined, IType, fileToNameToCompoundDefine, fileToNameToDefine } from "../constants";

export function typeStringifyer(type: IType): string {
	return type.Define === 'COMPOUND' ? (type.Define + ' ' + type.Compound) : type.Define;
}

export function getDefineFromWord(word:string):IDefined{
	let result:[string,IDefined]
	result = getATopMapKeyAndSubMapValueFromSubMapKey(fileToNameToCompoundDefine,word)

	if (!result) {
		result = getATopMapKeyAndSubMapValueFromSubMapKey(fileToNameToDefine,word)
	}
	if (result) {
		result[1].Uri = result[0]
		return	result[1]
	}
	return
}
export function getATopMapKeyAndSubMapValueFromSubMapKey<topMap extends Map<topKey,subMap>, subMap extends Map<subMapKey,subMapValue>, topKey, subMapKey, subMapValue>(map:topMap,key:subMapKey):[topKey,subMapValue]{
	for (let topEntries of map.entries()) {
		let result = topEntries[1].get(key);
		if (result) return [topEntries[0],result]
	}
	return
}
export function doesIDefineHaveArguments(tested:ICompound|IDefined):boolean{
	let interum:any = tested
	return interum?.Arguments.length ? true : false
}
export function returnArgumentsAsString(defined:ICompound):string{
	let temp:IArguments
	return defined.Arguments.map((temp)=>(temp.Type)).join(' ')
}