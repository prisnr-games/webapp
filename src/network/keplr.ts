import { get, writable } from "svelte/store";
import type { ChainInfo, Window as KeplrWindow } from "@keplr-wallet/types";
import { SigningCosmWasmClient } from 'secretjs';
import type { StdSignature } from "secretjs/types/types";
import { permitName } from "./permits";
import { CONTRACT } from "./contract";

// Local testnet
export const CHAIN_ID = 'supernova-1';
export const SECRET_LCD = 'http://localhost:1317';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Window extends KeplrWindow {}
}

export interface KeplrStore {
    keplrEnabled: boolean;
    scrtAuthorized: boolean;
    scrtClient: SigningCosmWasmClient | null;
};

function createKeplrStore() {
    let keplrStoreNew: KeplrStore = {
        keplrEnabled: false,
        scrtAuthorized: false,
        scrtClient: null,
    };

	const { subscribe, set, update } = writable(keplrStoreNew);

	return {
		subscribe,
		connect: async () => {
            console.log("connect to keplr");
            const keplr = await connectKeplr(CHAIN_ID, SECRET_LCD);
            set(keplr);
        },
	};
}

async function checkKeplr(chainId: string) {
    let keplrEnabled = false;
    const keplrCheckPromise = new Promise<void> ( (resolve, reject) => {
        const keplrCheckInterval = setInterval(async () => {
            let isKeplrWallet = !!window.keplr && !!window.getOfflineSigner && !!window.getEnigmaUtils;
            if (isKeplrWallet) {
                keplrEnabled = true;
                clearInterval(keplrCheckInterval);

                if (chainId === 'supernova-2' || chainId === 'supernova-1') {
                    await suggestChain(chainId);
                }
                resolve();
            }
        }, 1000);
    });
    await keplrCheckPromise;
    return keplrEnabled;
}

async function connectKeplr(chainId: string, secretLcd: string) {
    let keplrEnabled = await checkKeplr(chainId);
    let scrtAuthorized = false;
    let scrtClient: SigningCosmWasmClient | null = null;
    try {
        // @ts-ignore
        await window.keplr.enable(chainId);
        // @ts-ignore
        const offlineSigner = window.getOfflineSigner(chainId);
        // @ts-ignore
        const enigmaUtils = window.getEnigmaUtils(chainId);
        const accounts = await offlineSigner.getAccounts();
        const cosmJS = new SigningCosmWasmClient(
            secretLcd,
            accounts[0].address,
            // @ts-ignore
            offlineSigner,
            enigmaUtils,
            {
                exec: {
                    amount: [{ amount: "62500", denom: "uscrt" }],
                    gas: "250000",
                },
            }
        );
        scrtAuthorized = true;
        scrtClient = cosmJS;
    } catch (error) {
        scrtAuthorized = false;
        scrtClient = null;
    }
    let keplr: KeplrStore = {
        keplrEnabled,
        scrtAuthorized,
        scrtClient,
    };
    return keplr;
}

async function suggestChain(chainId: string) : Promise<boolean> {
    let rpc, rest, chainName : string;

    if (chainId === 'supernova-1') {
        rpc = "http://localhost:26657/";
        rest = SECRET_LCD;
        chainName = "Localhost SCRT Testnet";
    } else if (chainId === 'supernova-2') {
        rpc = "https://chainofsecrets.secrettestnet.io:26667/";
        rest = SECRET_LCD;
        chainName = "Supernova-2 Secret Testnet";
    } else {
        return false;
    }

    let newChain: ChainInfo = {
        chainId: chainId,
        bip44: {
            coinType: 529,
        },
        coinType: 529,
        stakeCurrency: {
            coinDenom: 'SCRT',
            coinMinimalDenom: 'uscrt',
            coinDecimals: 6,
        },
        bech32Config: {
            bech32PrefixAccAddr: 'secret',
            bech32PrefixAccPub: 'secretpub',
            bech32PrefixValAddr: 'secretvaloper',
            bech32PrefixValPub: 'secretvaloperpub',
            bech32PrefixConsAddr: 'secretvalcons',
            bech32PrefixConsPub: 'secretvalconspub',
        },
        currencies: [
            {
                coinDenom: 'SCRT',
                coinMinimalDenom: 'uscrt',
                coinDecimals: 6,
            },
        ],
        feeCurrencies: [
            {
                coinDenom: 'SCRT',
                coinMinimalDenom: 'uscrt',
                coinDecimals: 6,
            },
        ],
        gasPriceStep: {
            low: 0.1,
            average: 0.25,
            high: 0.4,
        },
        features: ['secretwasm'],
        rpc,
        rest,
        chainName
    };
  
    if (newChain.rpc && newChain.rest && window.keplr) {
        await window.keplr.experimentalSuggestChain(newChain);
        return true;
    } else {
        return false;
    }
}

export async function getSignature(chainId: string): Promise<StdSignature> {
    // @ts-ignore
    const keplrOfflineSigner = window.getOfflineSigner(chainId);
    const accounts = await keplrOfflineSigner.getAccounts();
    const myAddress = accounts[0].address;

    // @ts-ignore
    const { signature } = await window.keplr.signAmino(
        chainId,
        myAddress,
        {
            chain_id: chainId,
            account_number: "0",
            sequence: "0",
            fee: {
                amount: [{ denom: "uscrt", amount: "0" }],
                gas: "1",
            },
            msgs: [
                {
                    type: "query_permit",
                    value: {
                        permit_name: permitName,
                        allowed_tokens: [CONTRACT],
                        permissions: ["owner"],
                    },
                },
            ],
            memo: "",
        },
        {
            preferNoSetFee: true,
            preferNoSetMemo: true,
        }
    );
    return signature;
}

export const keplrStore = createKeplrStore();

export async function holdForKeplr(keplr: KeplrStore) {
    if (keplr && keplr.scrtAuthorized) { return keplr; }
    while (true) {
        keplr = get(keplrStore);
        if (keplr.scrtAuthorized) {
            return keplr;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

