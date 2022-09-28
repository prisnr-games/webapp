import type { CanonicalBasis, CanonicalColor, CanonicalShape, CanonicalTarget, PickOption } from '#/intl/game';
import { XTL_MINUTES, XTL_SECONDS } from '#/util/belt';
import { get_json } from '#/util/fetch';
import type { GuessOption, SemanticAssertion, SemanticAssertion_Nobody, SemanticColorQuality, SemanticQuality, SemanticShapeQuality } from '#/util/logic';
import type { JsonValue } from '#/util/types';
import type {
	Coin, JsonObject, StdFee,
} from "secretjs/types/types";

import type {
	Permit,
} from "./permits";

import {
	P_LCD_RPC, SI_CHAIN,
} from './wallet';

import type {
	Wallet,
} from './wallet';

/**
 * game contract address
 */
 export const P_CONTRACT_GAME_ADDR = import.meta.env.VITE_CONTRACT_GAME_ADDR;

/**
 * game contract code hash
 */
export const SI_CONTRACT_GAME_CODE_HASH = import.meta.env.VITE_CONTRACT_GAME_CODE_HASH;

/**
 * minter contract address
 */
export const P_CONTRACT_MINTER_ADDR = import.meta.env.VITE_CONTRACT_MINTER_ADDR;

/**
 * minter contract code hash
 */
export const SI_CONTRACT_MINTER_CODE_HASH = import.meta.env.VITE_CONTRACT_MINTER_CODE_HASH;

export class ContractError extends Error {
	constructor(s_error: string) {
		super(`The game contract returned the following error: ${s_error}`);
	}
}

/**
 * execution result info
 */
export interface ContractExecInfo<Wrapped extends JsonObject> {
	txnHash: string
	data: Wrapped;
};

const SN_DEFAULT_WAGER = '10000000';

const d_decoder = new TextDecoder();

// types for contract responses

interface Response {
	status: String,
}

export type SemanticGuess = `target:${CanonicalTarget}|${SemanticColorQuality}|${SemanticShapeQuality}`;
export type SemanticGuessResult = `${'bag' | 'opponent'}|${'correct' | 'wrong'}` | 'abstain';

export type SemanticOutcome = `you ${`${'won' | 'lost'} wager` | 'won jackpot' | 'won nft' | 'lost reward'}`;

export interface GameStateResponse {
	// 0: waiting for second player, 1: first round, 3: reward round
	round: 0 | 1 | 3 | null,

	// currently must be default wager "10000000" uscrt
	wager: string | null,

	// one of "red", "green", "blue", "black"
	chip_color: SemanticColorQuality | null,

	// one of "triangle", "square", "circle", "star"
	chip_shape: SemanticShapeQuality | null,

	// one of "nobody_has|red", "nobody_has|green", "nobody_has|blue", "nobody_has|black", 
	//        "nobody_has|triangle", "nobody_has|square", "nobody_has|circle", "nobody_has|star"
	hint: SemanticAssertion_Nobody | null,

	// one of "nobody_has|red", "nobody_has|green", "nobody_has|blue", "nobody_has|black", 
	//        "nobody_has|triangle", "nobody_has|square", "nobody_has|circle", "nobody_has|star",
	//        "i_have|red", "i_have|green", "i_have|blue", "i_have|black",
	//        "i_have|triangle", "i_have|square", "i_have|circle", "i_have|star"
	first_submit: SemanticAssertion | null,

	// same as above
	opponent_first_submit: SemanticAssertion | null,
	
	// one of "red", "green", "blue", "black", "triangle", "square", "circle", "star"
	//   means that you have learned the secret that opponent has this feature.
	first_extra_secret: SemanticAssertion | null,

	// next three same as first submit/secret
	second_submit: SemanticAssertion | null,
	opponent_second_submit: SemanticAssertion | null,
	second_extra_secret: SemanticAssertion | null,

	// has format "{target}|{color}|{shape}", where
	//    {target} is one of "abstain", "bag", "opponent"
	//    {color} is one of "red", "green", "blue", "black", "" (in case of abstain)
	//    {shape} is one of "triange", "square", "circle", "star", "" (in case of abstain)
	guess: SemanticGuess | null,
	
	// same as guess
	opponent_guess: string | null,

	// one of "bag|correct", "bag|wrong", "opponent|correct", "opponent|wrong", "abstain"
	round_result: SemanticGuessResult | null,

	// same as round_result
	opponent_round_result: SemanticGuessResult | null,

	// indicates game is finished (null if second player has not joined, yet)
	finished: boolean | null,

	// one of "you won wager", "you lost wager", "you won jackpot", "you won nft", "you lost reward"
	result: SemanticOutcome | null,

	first_round_start_block: number;

	first_submit_block: number;

	guess_block: number;

	guess_turn_start_block: number;

	pick: 'nft' | 'jackpot' | null;

	pick_reward_round_start_block: number;

	second_submit_block: number;

	second_submit_turn_start_block: number;

	jackpot_reward: string;
}

interface InnerResponse {
	status: string,
	game_state: GameStateResponse | null,
}

export interface JoinResponse {
	join?: InnerResponse,
	error?: string,
}

export interface SubmitResponse {
	submit?: InnerResponse,
	error?: string,
}

export interface GuessResponse {
	guess?: InnerResponse,
	error?: string,
}

export interface PickRewardResponse {
	pick_reward?: InnerResponse,
	error?: string,
}

export interface ForceEndgameResponse {
	force_endgame?: InnerResponse;
	error?: string;
}

export interface QueryGameStateResponse {
	game_state?: GameStateResponse,
	error?: string,
}

// Message formats sent to contract

interface InnerSubmitMsg {
	target: string,
	color?: string,
	shape?: string,
}

interface SubmitMsg {
	submit: InnerSubmitMsg,
}

interface GuessMsg {
	guess: InnerSubmitMsg,
}

interface InnerPickRewardMsg {
	reward: string,
}

interface PickRewardMsg {
	pick_reward: InnerPickRewardMsg,
}

const entropyGenerator = (length: number): string => {
	var base = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
	var array = new Uint8Array(length);
	window.crypto.getRandomValues(array);
	var str = '';
	for (var i = 0; i < array.length; i++) {
		str += base[array[i] % base.length];
	};
	return str;
}




export class Contract {
	protected _k_wallet: Wallet;
	protected _p_contract: string;
	protected _g_permit: Permit | null;
	protected _si_code_hash: string | undefined;

	constructor(k_wallet: Wallet, p_contract: string, g_permit?: Permit, si_code_hash?: string) {
		this._k_wallet = k_wallet;
		this._p_contract = p_contract;
		this._g_permit = g_permit || null;
		this._si_code_hash = si_code_hash;
	}

	async execute<Wrapped extends JsonObject>(g_msg: JsonObject, g_fee?: StdFee, g_xfer: readonly Coin[]=[]): Promise<ContractExecInfo<Wrapped>> {
		const g_result = await this._k_wallet.execute(this._p_contract, g_msg, g_xfer, g_fee, this._si_code_hash);

		return {
			txnHash: g_result.transactionHash,
			data: JSON.parse(d_decoder.decode(g_result.data)),
		};
	}

	query<Response extends JsonObject>(g_msg: JsonObject): Promise<Response> {
		if(this._g_permit) {
			g_msg = {
				with_permit: {
					query: g_msg,
					permit: this._g_permit,
				},
			};
		}

		return this._k_wallet.query(this._p_contract, g_msg);
	}

}

const XG_BASE_FEE = 180_000n;

export class GameContract extends Contract {
	async queryGameState(): Promise<GameStateResponse> {
		const g_response = await this.query<QueryGameStateResponse>({
			game_state: {},
		});

		if(g_response.error) {
			throw new ContractError(g_response.error);
		}

		return g_response.game_state!;
	}

	// Calls Join function of contract to join a new game
	// Will return an error if already in a game that is not finished.
	joinGame(): Promise<ContractExecInfo<JoinResponse>> {
		return this.execute<JoinResponse>({
			join: {},
		}, {
			amount: [
				{
					amount: '81000',
					denom: 'uscrt',
				},
			],
			gas: ''+XG_BASE_FEE,
		}, [
			{
				denom: 'uscrt',
				amount: SN_DEFAULT_WAGER,
			},
		]);
	}

	submitAssertion(si_basis: CanonicalBasis, si_quality: SemanticQuality): Promise<ContractExecInfo<SubmitResponse>> {
		const [si_attr, s_value] = si_quality.split(':');

		const g_quality = 'color' === si_attr? {color:s_value}: {shape:s_value};

		return this.execute<SubmitResponse>({
			submit: {
				target: si_basis,
				...g_quality,
			},
		} as SubmitMsg, {
			amount: [
				{
					amount: '65000',
					denom: 'uscrt',
				},
			],
			gas: ''+XG_BASE_FEE,
		});
	}

	submitGuess(g_opt: GuessOption): Promise<ContractExecInfo<GuessResponse>> {
		return this.execute<GuessResponse>({
			guess: g_opt,
		} as GuessMsg, {
			amount: [
				{
					amount: '65000',
					denom: 'uscrt',
				},
			],
			gas: ''+XG_BASE_FEE,
		});
	}

	pickReward(si_pick: PickOption): Promise<ContractExecInfo<PickRewardResponse>> {
		return this.execute<PickRewardResponse>({
			pick_reward: {
				reward: si_pick,
			},
		} as PickRewardMsg, {
			amount: [
				{
					amount: '56250',
					denom: 'uscrt',
				},
			],
			gas: ''+(25n * XG_BASE_FEE),
		});
	}

	forceEndgame(): Promise<ContractExecInfo<ForceEndgameResponse>> {
		return this.execute<PickRewardResponse>({
			force_endgame: {},
		}, {
			amount: [
				{
					amount: '65000',
					denom: 'uscrt',
				},
			],
			gas: ''+XG_BASE_FEE,
		});
	}

}

export interface TokensResponse extends JsonObject {
	token_list: {
		tokens: string[];
	};
}

export interface NftMetadata extends JsonObject {
	animation_url: null;
	attributes: null;
	background_color: string;
	description: string;
	external_url: null;
	image: string;
	image_data: null;
	media: null;
	name: string;
	protected_attributes: null;
	youtube_url: null;
}

export interface NftInfoResponse extends JsonObject {
	private_metadata: {
		token_uri?: string;
		extension: NftMetadata;
	};
}

export class MinterContract extends Contract {
	async queryListNfts(): Promise<TokensResponse> {
		const g_response = await this.query<TokensResponse>({
			tokens: {
				owner: this._k_wallet.publicAddress,
			},
		});

		if(g_response.error) {
			throw new ContractError(g_response.error);
		}

		return g_response!;
	}

	async queryNftInfo(si_token: string): Promise<NftInfoResponse> {
		const g_response = await this.query<NftInfoResponse>({
			private_metadata: {
				token_id: si_token,
			},
		});

		if(g_response.error) {
			throw new ContractError(g_response.error);
		}

		return g_response!;
	}

	async *queryNfts(): AsyncGenerator<NftInfoResponse> {
		const g_list = await this.queryListNfts();

		for(const si_token of g_list.token_list.tokens) {
			yield await this.queryNftInfo(si_token);
		}
	}
}


// // Calls Submit function in contract to submit a hint to other player.
// // Will return an error if the game is not in the correct round/state to receive a hint.
// export const executeSubmit = async (target: string, shape: string | null, color: string | null): Promise<SubmitResponse> => {
// 	// TODO: need to update wallet
// 	const keplr = get(keplrStore);
// 	const { keplrEnabled, scrtAuthorized, scrtClient } = keplr;
// 	if (!keplrEnabled || !scrtAuthorized || !scrtClient) {
// 		return { error: "Keplr not enabled" };
// 	}

// 	if (shape === null && color === null) {
// 		return { error: "Hint must have a color or shape" };
// 	}

// 	if (shape !== null && color !== null) {
// 		return { error: "Hint must have a color or shape, but not both" };
// 	}

// 	if (target != "nobody_has" && target != "bag_not") {
// 		return { error: "Invalid target in hint" };
// 	}

// 	let executeMsg: SubmitMsg = {
// 		submit: {
// 			target
// 		}
// 	}

// 	if (color != null) {
// 		if (color != "red" && color != "blue" && color != "green" && color != "black") {
// 			return { error: "Invalid color in hint" };
// 		}
// 		executeMsg.submit.color = color;
// 	} else if (shape != null) {
// 		if (shape != "triangle" && shape != "square" && shape != "circle" && shape != "star") {
// 			return { error: "Invalid shape in hint" };
// 		}
// 		executeMsg.submit.shape = shape;
// 	}

// 	const funds = [];
// 	const fee = {
// 		amount: [{ amount: "10000", denom: "uscrt" }],
// 		gas: "40000",
// 	};

// 	try {
// 		const response = await scrtClient.execute(P_CONTRACT_ADDR, executeMsg, "", funds, fee);
// 		let data: SubmitResponse = JSON.parse(d_decoder.decode(response.data));
// 		return data;
// 	} catch (error: any) {
// 		return { error: error.toString() };
// 	}
// }

// // Calls Guess function in contract to make a guess at the end of round 1.
// // Will return an error if the game is not in the correct round/state to receive a guess.
// export const executeGuess = async (target: string, shape: string | null, color: string | null): Promise<GuessResponse> => {
// 	// TODO: need to update wallet
// 	const keplr = get(keplrStore);
// 	const { keplrEnabled, scrtAuthorized, scrtClient } = keplr;
// 	if (!keplrEnabled || !scrtAuthorized || !scrtClient) {
// 		return { error: "Keplr not enabled" };
// 	}

// 	if (target != "abstain" && target != "bag" && target != "opponent") {
// 		return { error: "Invalid target for guess" };
// 	}

// 	if (target != "abstain" && (shape === null || color === null)) {
// 		return { error: "Guess must have a color and shape, unless you are abstaining" };
// 	}

// 	let executeMsg: GuessMsg = {
// 		guess: {
// 			target
// 		}
// 	}

// 	if (color != null && shape != null) {
// 		if (color != "red" && color != "blue" && color != "green" && color != "black") {
// 			return { error: "Invalid color in guess" };
// 		}
// 		if (shape != "triangle" && shape != "square" && shape != "circle" && shape != "star") {
// 			return { error: "Invalid shape in guess" };
// 		}
// 		executeMsg.guess.color = color;
// 		executeMsg.guess.shape = shape;
// 	}

// 	const funds = [];
// 	const fee = {
// 		amount: [{ amount: "10000", denom: "uscrt" }],
// 		gas: "40000",
// 	};

// 	try {
// 		const response = await scrtClient.execute(P_CONTRACT_ADDR, executeMsg, "", funds, fee);
// 		let data: GuessResponse = JSON.parse(d_decoder.decode(response.data));
// 		return data;
// 	} catch (error: any) {
// 		return { error: error.toString() };
// 	}
// }

// // Calls PickReward function in contract to pick a reward in round 3.
// // Will return an error if the game is not in the correct round/state to have player pick a reward.
// export const executePickReward = async (reward: string): Promise<PickRewardResponse> => {
// 	// TODO: need to update wallet
// 	const keplr = get(keplrStore);
// 	const { keplrEnabled, scrtAuthorized, scrtClient } = keplr;
// 	if (!keplrEnabled || !scrtAuthorized || !scrtClient) {
// 		return { error: "Keplr not enabled" };
// 	}

// 	if (reward != "pool" && reward != "nft") {
// 		return { error: "Invalid value for picked reward" };
// 	}

// 	let executeMsg: PickRewardMsg = {
// 		pick_reward: {
// 			reward
// 		}
// 	}

// 	const funds = [];
// 	const fee = {
// 		amount: [{ amount: "10000", denom: "uscrt" }],
// 		gas: "40000",
// 	};

// 	try {
// 		const response = await scrtClient.execute(P_CONTRACT_ADDR, executeMsg, "", funds, fee);
// 		let data: PickRewardResponse = JSON.parse(d_decoder.decode(response.data));
// 		return data;
// 	} catch (error: any) {
// 		return { error: error.toString() };
// 	}
// }

type FrequencyTuner = (k_eta: EtaEstimator, xtl_remain: number) => boolean;

const F_FREQ_DEFAULT: FrequencyTuner = (k_eta: EtaEstimator, xtl_remain: number) => {
	// once less than a minute remains
	if(xtl_remain < 60*XTL_SECONDS) {
		// update every 5 seconds
		return (Date.now() - k_eta.lastUpdated) > 5 * XTL_SECONDS;
	}
	// otherwise
	else {
		// update every 30 seconds
		return (Date.now() - k_eta.lastUpdated) > 30 * XTL_SECONDS;
	}
};

interface RpcResponse<Result extends JsonObject> extends JsonObject {
	jsnorpc: string;
	id: number;
	result: Result;
}

interface BlockId {
	hash: string;
	parts: {
		total: number;
		hash: string;
	};
}

interface BlockRpcResponse extends JsonObject {
	block_id: BlockId;
	block: {
		header: {
			version: {
				block: string;
			};
			chain_id: string;
			height: string;
			time: string;
			last_block_id: BlockId;
			last_commit_hash: string;
			data_hash: string;
			validators_hash: string;
			next_validators_hash: string;
			consensus_hash: string;
			app_hash: string;
			last_results_hash: string;
			evidence_hash: string;
			proposer_address: string;
		};
		data: {
			txns: string[];
		};
		last_commit: {
			height: string;
			round: number;
			block_id: BlockId;
			signatures: {
				block_id_flag: number;
				validator_address: string;
				timestamp: string;
				signature: string;
			}[];
		};
	};
}

interface StatusRpcResponse extends JsonObject {
	node_info: {
		protocol_version: {
			p2p: string;
			block: string;
			app: string;
		};
		id: string;
		listen_addr: string;
		network: string;
		version: string;
		channels: string;
		moniker: string;
		other: {
			tx_index: string;
			rpc_address: string;
		};
	};
	sync_info: {
		latest_block_hash: string;
		latest_app_hash: string;
		latest_block_height: string;
		latest_block_time: string;
		earliest_block_hash: string;
		earliest_app_hash: string;
		earliest_block_height: string;
		earliest_block_time: string;
		catching_up: boolean;
	};
	validator_info: {
		address: string;
		pub_key: {
			type: string;
			value: string;
		},
		voting_power: string;
	};
}

// const XTL_BLOCK_TIME_AVG = SI_CHAIN.startsWith('pulsar')? 1.98*XTL_SECONDS: 5.99*XTL_SECONDS
// const N_BLOCKS_PER_5_MIN = Math.floor((10*XTL_MINUTES) / XTL_BLOCK_TIME_AVG);
const N_BLOCKS_PER_5_MIN = 200;
console.log(`Imposing global ${N_BLOCKS_PER_5_MIN} blocks per 5 minutes estimate`);

let b_currently_updating = false;
let xg_latest: bigint = 0n;
let xt_latest = 0;
let xt_last_update = 0;

async function update_latest() {
	if(Date.now() - xt_last_update < 5*XTL_SECONDS) {
		return;
	}

	const du_endpoint = new URL(P_LCD_RPC);
	du_endpoint.pathname = '/status';

	try {
		const g_res = await get_json<RpcResponse<StatusRpcResponse>>(du_endpoint.href);

		const {
			latest_block_height: s_latest_height,
			latest_block_time: s_latest_time,
		} = g_res.data!.result.sync_info;

		xg_latest = BigInt(s_latest_height);
		xt_latest = (new Date(s_latest_time)).getTime();
		xt_last_update = Date.now();
	}
	catch(e_update) {}
}

export class EtaEstimator {
	protected _xg_block_start: bigint;
	protected _xt_start = 0;
	protected _xg_block_dest: bigint;
	protected _f_should_update: () => boolean;
	protected _xt_eta = 0;
	protected _xt_updated = 0;
	protected _b_currently_updating = false;

	constructor(w_block_start: string | bigint, n_blocks_elapse=N_BLOCKS_PER_5_MIN, f_frequency=F_FREQ_DEFAULT) {
		this._xg_block_start = BigInt(w_block_start);
		this._xg_block_dest = this._xg_block_start + BigInt(n_blocks_elapse);
		this._f_should_update = () => f_frequency(this, this._xt_eta - Date.now());
	}

	protected async fetch_start_time(): Promise<void> {
		const du_endpoint = new URL(P_LCD_RPC);
		du_endpoint.pathname = '/block';

		const g_res = await get_json<RpcResponse<BlockRpcResponse>>(du_endpoint.href, {
			search: {
				height: this._xg_block_start+'',
			},
		});

		this._xt_start = (new Date(g_res.data!.result.block.header.time)).getTime();
	}

	protected async estimate(): Promise<number> {
		b_currently_updating = true;

		if(!this._xt_start) {
			await this.fetch_start_time();
		}

		await update_latest();

		// not enough data to estimate yet
		const n_span = Number(xg_latest - this._xg_block_start);
		if(n_span < 5) return 0;

		const xtl_per_block = (xt_latest - this._xt_start) / n_span;

		const n_blocks_remaining = Number(this._xg_block_dest - xg_latest);

		const xt_now = this._xt_updated = Date.now();

		b_currently_updating = false;

		return this._xt_eta = xt_now + Math.round(n_blocks_remaining * xtl_per_block);
	}

	get lastUpdated(): number {
		return this._xt_updated;
	}


	get destinationBlock(): bigint {
		return this._xg_block_dest;
	}

	get expired(): boolean {
		return xg_latest >= this.destinationBlock;
	}

	get ready(): boolean {
		return 0 !== this._xt_eta;
	}

	get eta(): number {
		if(!this.expired && !b_currently_updating && this._f_should_update()) {
			void this.estimate();
		}

		return this._xt_eta;
	}

	get remaining(): number {
		return this.eta - Date.now();
	}
}
