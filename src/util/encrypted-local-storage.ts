import {
	AES,
	enc,
} from 'crypto-js';

import type {
	lib as CryptoJS_lib,
} from 'crypto-js';

import type {
	JsonValue,
} from '#/util/types';

type CipherParams = CryptoJS_lib.CipherParams;
type WordArray = CryptoJS_lib.WordArray;

export class EncryptedLocalStorage {
	_si_namespace: string;
	#_s_secret: string;

	static includes(r_test: RegExp): boolean {
		for(let i_key=localStorage.length; i_key>=0; i_key--) {
			const si_key = localStorage.key(i_key);
			if(si_key && r_test.test(si_key)) {
				return true;
			}
		}

		return false;
	}

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
