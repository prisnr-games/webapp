import type {
	Keplr,
	Key,
} from "@keplr-wallet/types";

import type {
	Coin,
	JsonObject,
	StdFee,
	StdSignature,
} from "secretjs/types/types";

import type {
	AccountData,
	OfflineSigner,
} from 'secretjs/types/wallet';

import type {
	SecretUtils,
} from 'secretjs/types/enigmautils';


import {
	ExecuteResult,
	SigningCosmWasmClient,
} from 'secretjs';


import {
	P_CONTRACT_ADDR,
} from "./contract";

import {
	SI_PERMIT,
} from "./permits";

import {
	P_LCD_REST,
	WalletError,
} from './wallet';

import type {
	Wallet,
	SecretChainInfo,
} from './wallet';


export class EnableKeplrError extends WalletError {
	constructor(e_enable: unknown) {
		super('While attempting to enable Keplr', e_enable);
	}
}

export class OfflineSignerError extends WalletError {
	constructor(e_signer: unknown) {
		super('While attempting to acquire offline signer', e_signer);
	}
}

export class EnigmaUtilsError extends WalletError {
	constructor(e_enigma: unknown) {
		super('While attempting to acquire enigma utils', e_enigma);
	}
}

export class KeplrWallet implements Wallet {
	static isAvailable(): boolean {
		return !!window.keplr;
	}

	static fromWindow(): KeplrWallet {
		if(window.keplr) {
			return new KeplrWallet(window.keplr);
		}
		else {
			throw new Error(`Keplr extension is not installed`);
		}
	}

	protected _k_keplr: Keplr;
	protected _si_chain!: string;
	protected _k_signer!: OfflineSigner;
	protected _k_enigma!: SecretUtils;
	protected _k_client!: SigningCosmWasmClient;
	protected _g_key!: Key;
	protected _a_accounts!: readonly AccountData[];

	protected constructor(k_keplr: Keplr) {
		this._k_keplr = k_keplr;
	}

	async enable(g_chain: SecretChainInfo): Promise<boolean> {
		const si_chain = this._si_chain = g_chain.chainId;

		// suggest chain
		try {
			await this._k_keplr.experimentalSuggestChain({
				chainId: si_chain,
				chainName: g_chain.chainName,
				rpc: g_chain.rpc,
				rest: g_chain.rest,
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
			});
		}
		catch (e_suggest) {
			return false;
		}

		// enable
		try {
			await this._k_keplr.enable(si_chain);
		}
		catch(e_enable: unknown) {
			throw new EnableKeplrError(e_enable);
		}

		// offline signer
		try {
			this._k_signer = window.getOfflineSigner!(si_chain) as unknown as OfflineSigner;
		}
		catch(e_signer: unknown) {
			throw new OfflineSignerError(e_signer);
		}

		// enigma utils
		try {
			this._k_enigma = window.getEnigmaUtils!(si_chain);
		}
		catch(e_enigma: unknown) {
			throw new EnigmaUtilsError(e_enigma);
		}

		// save key
		this._g_key = await this._k_keplr.getKey(si_chain);

		// save accounts
		this._a_accounts = await this._k_signer.getAccounts();

		// cosm-wasm client
		this._k_client = new SigningCosmWasmClient(
			P_LCD_REST,
			this.publicAddress,
			this._k_signer,
			this._k_enigma,
			{
				exec: {
					amount: [
						{
							amount: '62500',
							denom: 'uscrt',
						},
					],
					gas: '250000',
				},
			}
		);

		// worked
		return true;
	}

	get chain(): string {
		return this._si_chain;
	}

	get key(): Key {
		return this._g_key;
	}

	get accounts(): readonly AccountData[] {
		return this._a_accounts;
	}

	get primaryAccount(): AccountData {
		return this.accounts[0];
	}

	get publicAddress(): string {
		return this.primaryAccount.address;
	}

	async signQueryPermit(): Promise<StdSignature> {
		return (await this._k_keplr.signAmino(
			this.chain,
			this.publicAddress,
			{
				chain_id: this.chain,
				account_number: '0',
				sequence: '0',
				fee: {
					amount: [
						{
							denom: 'uscrt',
							amount: '0',
						},
					],
					gas: '1',
				},
				msgs: [
					{
						type: 'query_permit',
						value: {
							permit_name: SI_PERMIT,
							allowed_tokens: [P_CONTRACT_ADDR],
							permissions: ['owner'],
						},
					},
				],
				memo: '',
			},
			{
				preferNoSetFee: true,
				preferNoSetMemo: true,
			},
		)).signature;
	}

	execute(p_contract: string, g_msg: JsonObject, a_xfer?: readonly Coin[], g_fee?: StdFee, si_code_hash?: string): Promise<ExecuteResult> {
		let s_opts = '';
		if(g_fee) {
			s_opts += ` --gas ${g_fee.gas}`;
		}
		if(a_xfer && a_xfer.length) {
			const g_xfer = a_xfer[0];
			s_opts += ` --amount ${g_xfer.amount}${g_xfer.denom}`;
		}
		console.log(`secretd tx compute execute ${p_contract} '${JSON.stringify(g_msg)}' --from ${this.publicAddress}${s_opts}`);
		return this._k_client.execute(p_contract, g_msg, '', a_xfer, g_fee);  // , si_code_hash || void 0
	}

	query(p_contract: string, g_msg: JsonObject, g_params?: JsonObject, si_code_hash?: string): Promise<JsonObject> {
		console.log(`secretd q compute ${p_contract} '${JSON.stringify(g_msg)}' --from ${this.publicAddress}`);
		return this._k_client.queryContractSmart(p_contract, g_msg, g_params || {});  // , si_code_hash || void 0
	}
}
