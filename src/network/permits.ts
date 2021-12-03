import { writable } from 'svelte/store';
import ls from 'localstorage-slim';
import encUTF8 from 'crypto-js/enc-utf8.js';
import AES from 'crypto-js/aes.js';

import fingerprintjs from '@fingerprintjs/fingerprintjs';

import type {
	lib as CryptoJS_lib,
} from 'crypto-js';
import type { JsonObject } from 'secretjs/types/types';

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

export interface Permit extends JsonObject {
	params: PermitParams,
	signature: Signature,
}

export interface Permits {
	[property: string]: Permit;
}

// use encryption for localstorage-slim
ls.config.encrypt = !import.meta.env.DEV;

// // global encryption secret
// (async() => {
// 	const y_agent = await fingerprintjs.load();
// 	const g_result = y_agent.get();

// 	ls.config.secret = (await g_result).visitorId;
// })();


const is_word_array = (z_input: unknown): z_input is WordArray => !!(z_input && Array.isArray((z_input as any).words));

const is_cipher_params = (z_input: unknown): z_input is CipherParams => !!(z_input && is_word_array((z_input as any).ciphertext));

// update encrypter to use AES encryption
ls.config.encrypter = (w_data: unknown, z_secret: unknown) => {
	if('string' === typeof z_secret || is_word_array(z_secret)) {
		return AES.encrypt(JSON.stringify(w_data), z_secret).toString();
	}
	else {
		throw new TypeError(`Invalid argument type for 'secret': ${z_secret}`);
	}
}
 
// update decrypter to decrypt AES-encrypted data
ls.config.decrypter = (z_data: unknown, z_secret: unknown): string => {
	if('string' === typeof z_data || is_cipher_params(z_data)) {
		if('string' === typeof z_secret || is_word_array(z_secret)) {
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

export const permitsStore = writable<Permits>(ls.get('permits') || {});

permitsStore.subscribe((value: Permits) => {
	ls.set('permits', value);
});

