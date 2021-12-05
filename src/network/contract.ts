import type { CanonicalBasis, CanonicalColor, CanonicalShape } from '#/intl/game';
import type { SemanticAssertion, SemanticQuality } from '#/util/logic';
import type { JsonValue } from '#/util/types';
import type {
	Coin, JsonObject, StdFee,
} from "secretjs/types/types";

import type {
	Permit,
} from "./permits";

import type {
	Wallet,
} from './wallet';

/**
 * contract address
 */
export const P_CONTRACT_ADDR = import.meta.env.VITE_CONTRACT_ADDR;

/**
 * contract code hash
 */
export const SI_CONTRACT_CODE_HASH = import.meta.env.VITE_CONTRACT_CODE_HASH;

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

const SN_DEFAULT_WAGER = '1000000';

const d_decoder = new TextDecoder();

// types for contract responses

interface Response {
	status: String,
}

export interface GameStateResponse {
	// 0: waiting for second player, 1: first round, 3: reward round
	round: 0 | 1 | 3 | null,

	// currently must be default wager "1000000" uscrt
	wager: string | null,

	// one of "red", "green", "blue", "black"
	chip_color: CanonicalColor | null,

	// one of "triangle", "square", "circle", "star"
	chip_shape: CanonicalShape | null,

	// one of "nobody_has|red", "nobody_has|green", "nobody_has|blue", "nobody_has|black", 
	//        "nobody_has|triangle", "nobody_has|square", "nobody_has|circle", "nobody_has|star"
	hint: `nobody|${SemanticQuality}` | null,

	// one of "nobody_has|red", "nobody_has|green", "nobody_has|blue", "nobody_has|black", 
	//        "nobody_has|triangle", "nobody_has|square", "nobody_has|circle", "nobody_has|star",
	//        "i_have|red", "i_have|green", "i_have|blue", "i_have|black",
	//        "i_have|triangle", "i_have|square", "i_have|circle", "i_have|star"
	first_submit: string | null,

	// same as above
	opponent_first_submit: string | null,
	
	// one of "red", "green", "blue", "black", "triangle", "square", "circle", "star"
	//   means that you have learned the secret that opponent has this feature.
	first_extra_secret: string | null,

	// next three same as first submit/secret
	second_submit: string | null,
	opponent_second_submit: string | null,
	second_extra_secret: string | null,

	// has format "{target}|{color}|{shape}", where
	//    {target} is one of "abstain", "bag", "opponent"
	//    {color} is one of "red", "green", "blue", "black", "" (in case of abstain)
	//    {shape} is one of "triange", "square", "circle", "star", "" (in case of abstain)
	guess: string | null,
	
	// same as guess
	opponent_guess: string | null,

	// one of "bag|correct", "bag|wrong", "opponent|correct", "opponent|wrong", "abstain"
	round_result: string | null,
	// same as round_result
	opponent_round_result: string | null,

	// indicates game is finished (null if second player has not joined, yet)
	finished: boolean | null,

	// one of "you won wager", "you lost wager", "you won jackpot", "you won nft", "you lost reward"
	result: string | null,
}

interface InnerResponse {
	status: Response,
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

export class GameContract {
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

	// Calls Join function of contract to join a new game
	// Will return an error if already in a game that is not finished.
	joinGame(): Promise<ContractExecInfo<JoinResponse>> {
		return this.execute<JoinResponse>({
			join: {},
		}, {
			amount: [
				{
					amount: '8750',
					denom: 'uscrt',
				},
			],
			gas: '35000',
		}, [
			{
				denom: 'uscrt',
				amount: SN_DEFAULT_WAGER,
			},
		]);
	}

	submitAssertion(si_basis: CanonicalBasis, si_quality: SemanticQuality): Promise<ContractExecInfo<SubmitResponse>> {
		return this.execute<SubmitResponse>({
			submit: {
				target: si_basis,
				quality: si_quality,
			},
		} as SubmitMsg, {
			amount: [
				{
					amount: '10000',
					denom: 'uscrt',
				},
			],
			gas: '40000',
		});
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

	async queryGameState(): Promise<GameStateResponse> {
		const g_response = await this.query<QueryGameStateResponse>({
			game_state: {},
		});

		if(g_response.error) {
			throw new ContractError(g_response.error);
		}

		return g_response.game_state!;
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
