import { keplrStore } from "./keplr";
import { get } from 'svelte/store';
import { Permit } from "./permits";

export const CONTRACT = 'secretxyz';

const entropyGenerator = (length: number): string => {
	var base = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
	var array = new Uint8Array(length);
	window.crypto.getRandomValues(array);
	var str = '';
	for (var i = 0; i < array.length; i++) {
		str += base[array[i]%base.length];
	};
	return str;
}

//
// Execute functions of contract
//

///
/// Execute
///

/*
export const executeJoin = async (): Promise<JoinResponse> => {
    const keplr = get(keplrStore);
    const {keplrEnabled, scrtAuthorized, scrtClient} = keplr;
    if (!keplrEnabled || !scrtAuthorized) {
        return { error: "Keplr not enabled" };
    }

    const goalUscrt = (Math.floor(parseFloat(goal) * 1000000)).toString();
    const entropy = entropyGenerator(32);
    const executeMsg = { 
        join: { } 
    };

    const funds = [{ denom: "uscrt", amount: DEFAULT_FEE }];
    const fee = {
        amount: [{ amount: "125000", denom: "uscrt" }],
        gas: "500000",
    };

    try {
        const response = await scrtClient.execute(CONTRACT, executeMsg, "", funds, fee);
        let data: CreateResponse = JSON.parse(utf8decoder.decode(response.data));
        return data;
    } catch (error) {
        return { error: error.toString() };
    }
}
*/

//
// Query functions of contract
//
