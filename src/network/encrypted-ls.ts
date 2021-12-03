import ls from 'localstorage-slim';
import encUTF8 from 'crypto-js/enc-utf8.js';
import AES from 'crypto-js/aes.js';

import type {
	lib as CryptoJS_lib,
} from 'crypto-js';

type CipherParams = CryptoJS_lib.CipherParams;
type WordArray = CryptoJS_lib.WordArray;

/**
 * permit name
 */
export const SI_PERMIT = import.meta.env.VITE_PERMIT_NAME;


export interface PubKey {
	type: string,
	value: string,
}

export interface Signature {
	pub_key: PubKey,
	signature: string,
}

export interface PermitParams {
	allowed_tokens: string[],
	permit_name: string,
	chain_id: string,
	permissions: string[],
}

export interface Permit {
	params: PermitParams,
	signature: Signature,
}

export interface Permits {
	[property: string]: Permit;
}

const is_word_array = (z_input: unknown): z_input is WordArray => !!(z_input && Array.isArray((z_input as any).words));

const is_cipher_params = (z_input: unknown): z_input is CipherParams => !!(z_input && is_word_array((z_input as any).ciphertext));

// update encrypter to use AES encryption
const encrypter = (w_data: unknown, z_secret: unknown) => {
	if ('string' === typeof z_secret || is_word_array(z_secret)) {
		return AES.encrypt(JSON.stringify(w_data), z_secret).toString();
	}
	else {
		throw new TypeError(`Invalid argument type for 'secret': ${z_secret}`);
	}
}

// update decrypter to decrypt AES-encrypted data
const decrypter = (z_data: unknown, z_secret: unknown): string => {
	if ('string' === typeof z_data || is_cipher_params(z_data)) {
		if ('string' === typeof z_secret || is_word_array(z_secret)) {
			try {
				return JSON.parse(AES.decrypt(z_data, z_secret).toString(encUTF8));
			} catch (e) {
				// incorrect/missing secret, return the encrypted data instead
				return z_data as string;
			}
		}
		else {
			throw new TypeError(`Invalid argument type for 'secret': ${z_secret}`);
		}
	}
	else {
		throw new TypeError(`Invalid argument type for 'data': ${z_data}`);
	}
};

export class EncryptedLS {
	#_gc_ls: any;

	constructor(s_secret: string) {
		this.#_gc_ls = {
			encrypt: !!import.meta.env.DEV,
			encrypter,
			decrypter,
			secret: s_secret,
		};
	}

	set(si_key: string, w_value: any) {
		return ls.set(si_key, w_value, this.#_gc_ls);
	}

	get<T>(si_key: string) {
		return ls.get<T>(si_key, this.#_gc_ls);
	}

	clear() {
		return ls.clear();
	}

	flush(b_force?: boolean | undefined) {
		return ls.flush(b_force);
	}

	remove(si_key: string) {
		return ls.remove(si_key);
	}
}
