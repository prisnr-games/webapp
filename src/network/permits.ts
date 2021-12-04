import type { JsonObject } from 'secretjs/types/types';

export interface PubKey {
	type: string,
	value: string,
}

export interface Signature {
	pub_key: PubKey,
	signature: string,
}

export interface PermitParams {
	chain_id: string,
	permit_name: string,
	allowed_tokens: string[],
	permissions: string[],
}

export interface Permit extends JsonObject {
	params: PermitParams,
	signature: Signature,
}


/**
 * permit name
 */
export const SI_PERMIT = import.meta.env.VITE_PERMIT_NAME;
