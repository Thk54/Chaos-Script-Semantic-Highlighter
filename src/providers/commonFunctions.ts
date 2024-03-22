import { IType } from "../constants";

export function typeStringifyer(type: IType): string {
	return type.Define === 'COMPOUND' ? (type.Define + ' ' + type.Compound) : type.Define;
}

