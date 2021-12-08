import type { JsonValue } from '#/util/types';
import type { Key } from '@keplr-wallet/types';
import type { ExecuteResult } from 'secretjs';
import type { Coin, JsonObject, StdFee, StdSignature } from 'secretjs/types/types';
import type { AccountData } from 'secretjs/types/wallet';

/**
 * chain id
 */
export const SI_CHAIN = import.meta.env.VITE_NETWORK_CHAIN_ID;

/**
 * chain name
 */
export const S_CHAIN_NAME = import.meta.env.VITE_NETWORK_CHAIN_NAME;

/**
 * rest endpoint uri
 */
export const P_LCD_REST = import.meta.env.VITE_NETWORK_LCD_REST;

/**
 * rpc endpoint uri
 */
export const P_LCD_RPC = import.meta.env.VITE_NETWORK_LCD_RPC;


export const uscrt_to_scrt = (xg_usrt: bigint) => (Number(xg_usrt / 10000n) / 100).toFixed(2).replace(/\.0+$/, '')+' SCRT';

/**
 * wallet error
 */
export class WalletError extends Error {
	constructor(s_msg: string, e_original?: unknown) {
		// no original error
		if (!e_original) {
			super(s_msg);
		}
		// window[f_undef]()
		else if (e_original instanceof TypeError) {
			super(`${s_msg}: ${e_original.stack}`);
		}
		// other error
		else if (e_original instanceof Error) {
			super(`${s_msg}: ${e_original.stack}`);
		}
		// unknown
		else {
			super(`${s_msg}: Unknown error`);
		}
	}
}

export class NotEnabledError extends WalletError {
	constructor() {
		super(`Wallet was not enabled first`);
	}
}


/**
 * wallet interface
 */
export interface Wallet {
	enable(g_chain: SecretChainInfo, fk_change: AccountChangeCallback): Promise<boolean>;
	get chain(): string;
	get key(): Key;
	get accounts(): readonly AccountData[];
	get primaryAccount(): AccountData;
	get publicAddress(): string;
	signQueryPermit(): Promise< StdSignature>;
	execute(p_contract: string, g_msg: JsonObject, g_xfer?: readonly Coin[], g_fee?: StdFee, si_code_hash?: string): Promise<ExecuteResult>
	query(p_contract: string, g_msg: JsonObject, g_params?: JsonObject, si_code_hash?: string): Promise<JsonObject>;
}

export interface SecretChainInfo {
	chainId: string;
	chainName: string;
	rpc: string;
	rest: string;
}

export type AccountChangeCallback = VoidFunction;
