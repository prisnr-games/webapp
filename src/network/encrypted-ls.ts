import ls from 'localstorage-slim';

import {
	AES,
	enc,
} from 'crypto-js';

import type {
	lib as CryptoJS_lib,
} from 'crypto-js';
import type { JsonValue } from '#/util/types';

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
				return JSON.parse(AES.decrypt(z_data, z_secret).toString(enc.Utf8));
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

const ls_set = ls.set;
const ls_get = ls.get;
const ls_clear = ls.clear;
const ls_flush = ls.flush;
const ls_remove = ls.remove;

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
		return ls_set(si_key, w_value, this.#_gc_ls);
	}

	get<T>(si_key: string) {
		return ls_get<T>(si_key, this.#_gc_ls);
	}

	clear() {
		return ls_clear();
	}

	flush(b_force?: boolean | undefined) {
		return ls_flush(b_force);
	}

	remove(si_key: string) {
		return ls_remove(si_key);
	}
}

export class EncryptedLocalStorage {
	_si_namespace: string;
	#_s_secret: string;

	constructor(si_namespace: string, s_secret: string) {
		this._si_namespace = si_namespace;
		this.#_s_secret = s_secret;
	}

	set(si_key: string, w_value: JsonValue) {
		let sx_store: string;
		try {
			sx_store = JSON.stringify(w_value);
		}
		catch(e_stringify) {
			throw new Error('Unable to stringify value');
		}

		let s_encrypted: string;
		try {
			s_encrypted = AES.encrypt(sx_store, this.#_s_secret).toString();
		}
		catch(e_encryptt) {
			throw new Error('Unable to encrypt message');
		}

		return localStorage.setItem(`${this._si_namespace}.${si_key}`, s_encrypted);
	}

	get<T extends JsonValue>(si_key: string): T | null {
		const s_encrypted = localStorage.getItem(`${this._si_namespace}.${si_key}`);

		if(null === s_encrypted) return s_encrypted;

		let sx_store: string;
		try {
			sx_store = AES.decrypt(s_encrypted, this.#_s_secret).toString(enc.Utf8);
		}
		catch(e_decrypt) {
			throw new Error('Failed to decrypt value using provided secret');
		}

		let w_value: JsonValue;
		try {
			w_value = JSON.parse(sx_store);
		}
		catch(e_parse) {
			throw new Error('Failed to parse decrypted text');
		}

		return w_value as T;
	}

	clear() {
		const si_prefix = `${this._si_namespace}.`;
		for(let i_key=localStorage.length; i_key>=0; i_key--) {
			const si_key = localStorage.key(i_key);
			if(si_key?.startsWith(si_prefix)) {
				localStorage.removeItem(si_key);
			}
		}
	}

	remove(si_key: string) {
		return localStorage.removeItem(`${this._si_namespace}.${si_key}`);
	}
}
