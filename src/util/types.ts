
export interface JsonObject {
	[k: string]: JsonValue | undefined;
}

export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| JsonObject
	| undefined;
