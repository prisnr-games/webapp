import { writable } from 'svelte/store';
import ls from 'localstorage-slim';
//import encUTF8 from 'crypto-js/enc-utf8.js';
//import AES from 'crypto-js/aes.js';

export const permitName = "Scrt Prisoners";

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

/*
ls.config.encrypt = false;         // global encryption
ls.config.secret = 'font-size';   // global secret

// update encrypter to use AES encryption
// @ts-ignore
ls.config.encrypter = (data, secret: string | WordArray) => AES.encrypt(JSON.stringify(data), secret).toString();
 
// update decrypter to decrypt AES-encrypted data
ls.config.decrypter = (data, secret) => {
    try {
        // @ts-ignore
        return JSON.parse(AES.decrypt(data, secret).toString(encUTF8));
    } catch (e) {
        // incorrect/missing secret, return the encrypted data instead
        return data;
    }
};
*/

export const permitsStore = writable<object>(ls.get('permits') || {});

permitsStore.subscribe(value => {
    ls.set('permits', value);
});

