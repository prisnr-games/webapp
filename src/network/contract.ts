import { keplrStore } from "./keplr";
import { get } from 'svelte/store';
import type { Coin } from "secretjs/types/types";
import type { Permit } from "./permits";

export const CONTRACT = 'secret18vd8fpwxzck93qlwghaj6arh4p7c5n8978vsyg';
export const CONTRACT_CODE_HASH = '5b43fdced88a050872317d65ebe9b7831933dc4133607e069fe93a3bc1a8b381';
const DEFAULT_WAGER = "1000000";
const utf8decoder = new TextDecoder();

// types for contract responses

interface Response {
    status: String,
}

interface GameStateResponse {
    // 0: waiting for second player, 1: first round, 3: reward round
    round: number | null,
    // currently must be default wager "1000000" uscrt
    wager: string | null,

    // one of "red", "green", "blue", "black"
    chip_color: string | null,
    // one of "triangle", "square", "circle", "star"
    chip_shape: string | null,

    // one of "nobody_has|red", "nobody_has|green", "nobody_has|blue", "nobody_has|black", 
    //        "nobody_has|triangle", "nobody_has|square", "nobody_has|circle", "nobody_has|star"
    hint: string | null,

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

// Calls Join function of contract to join a new game
// Will return an error if already in a game that is not finished.
export const executeJoin = async (): Promise<JoinResponse> => {
    // TODO: need to update wallet
    const keplr = get(keplrStore);
    const {keplrEnabled, scrtAuthorized, scrtClient} = keplr;
    if (!keplrEnabled || !scrtAuthorized || !scrtClient) {
        return { error: "Keplr not enabled" };
    }

    const executeMsg = { 
        join: { } 
    };

    const funds = [{ denom: "uscrt", amount: DEFAULT_WAGER }];
    const fee = {
        amount: [{ amount: "8750", denom: "uscrt" }],
        gas: "35000",
    };

    try {
        const response = await scrtClient.execute(CONTRACT, executeMsg, "", funds, fee);
        let data: JoinResponse = JSON.parse(utf8decoder.decode(response.data));
        return data;
    } catch (error: any) {
        return { error: error.toString() };
    }
}

// Calls Submit function in contract to submit a hint to other player.
// Will return an error if the game is not in the correct round/state to receive a hint.
export const executeSubmit = async (target: string, shape: string | null, color: string | null): Promise<SubmitResponse> => {
    // TODO: need to update wallet
    const keplr = get(keplrStore);
    const {keplrEnabled, scrtAuthorized, scrtClient} = keplr;
    if (!keplrEnabled || !scrtAuthorized || !scrtClient) {
        return { error: "Keplr not enabled" };
    }

    if (shape === null && color === null) {
        return { error: "Hint must have a color or shape"};
    }

    if (shape !== null && color !== null) {
        return { error: "Hint must have a color or shape, but not both"};
    }

    if (target != "nobody_has" && target != "bag_not") {
        return { error: "Invalid target in hint"};
    }

    let executeMsg: SubmitMsg = {
        submit: {
            target
        }
    }

    if (color != null) {
        if (color != "red" && color != "blue" && color != "green" && color != "black") {
            return { error: "Invalid color in hint"};
        }
        executeMsg.submit.color = color;
    } else if (shape != null) {
        if (shape != "triangle" && shape != "square" && shape != "circle" && shape != "star") {
            return { error: "Invalid shape in hint"};
        }
        executeMsg.submit.shape = shape;
    }

    const funds = [];
    const fee = {
        amount: [{ amount: "10000", denom: "uscrt" }],
        gas: "40000",
    };

    try {
        const response = await scrtClient.execute(CONTRACT, executeMsg, "", funds, fee);
        let data: SubmitResponse = JSON.parse(utf8decoder.decode(response.data));
        return data;
    } catch (error: any) {
        return { error: error.toString() };
    }
}

// Calls Guess function in contract to make a guess at the end of round 1.
// Will return an error if the game is not in the correct round/state to receive a guess.
export const executeGuess = async (target: string, shape: string | null, color: string | null): Promise<GuessResponse> => {
    // TODO: need to update wallet
    const keplr = get(keplrStore);
    const {keplrEnabled, scrtAuthorized, scrtClient} = keplr;
    if (!keplrEnabled || !scrtAuthorized || !scrtClient) {
        return { error: "Keplr not enabled" };
    }

    if (target != "abstain" && target != "bag" && target != "opponent") {
        return { error: "Invalid target for guess"};
    }

    if (target != "abstain" && (shape === null || color === null)) {
        return { error: "Guess must have a color and shape, unless you are abstaining"};
    }

    let executeMsg: GuessMsg = {
        guess: {
            target
        }
    }

    if (color != null && shape != null) {
        if (color != "red" && color != "blue" && color != "green" && color != "black") {
            return { error: "Invalid color in guess"};
        }
        if (shape != "triangle" && shape != "square" && shape != "circle" && shape != "star") {
            return { error: "Invalid shape in guess"};
        }
        executeMsg.guess.color = color;
        executeMsg.guess.shape = shape;
    }

    const funds = [];
    const fee = {
        amount: [{ amount: "10000", denom: "uscrt" }],
        gas: "40000",
    };

    try {
        const response = await scrtClient.execute(CONTRACT, executeMsg, "", funds, fee);
        let data: GuessResponse = JSON.parse(utf8decoder.decode(response.data));
        return data;
    } catch (error: any) {
        return { error: error.toString() };
    }
}

// Calls PickReward function in contract to pick a reward in round 3.
// Will return an error if the game is not in the correct round/state to have player pick a reward.
export const executePickReward = async (reward: string): Promise<PickRewardResponse> => {
    // TODO: need to update wallet
    const keplr = get(keplrStore);
    const {keplrEnabled, scrtAuthorized, scrtClient} = keplr;
    if (!keplrEnabled || !scrtAuthorized || !scrtClient) {
        return { error: "Keplr not enabled" };
    }

    if (reward != "pool" && reward != "nft") {
        return { error: "Invalid value for picked reward"};
    }

    let executeMsg: PickRewardMsg = {
        pick_reward: {
            reward
        }
    }

    const funds = [];
    const fee = {
        amount: [{ amount: "10000", denom: "uscrt" }],
        gas: "40000",
    };

    try {
        const response = await scrtClient.execute(CONTRACT, executeMsg, "", funds, fee);
        let data: PickRewardResponse = JSON.parse(utf8decoder.decode(response.data));
        return data;
    } catch (error: any) {
        return { error: error.toString() };
    }
}

//
// Query functions of contract
//

// Query the current game state for the player (about 5 sec turnaround with query permits, so don't spam API with this)
export const queryGameState = async (
    permit: Permit,
) : Promise<QueryGameStateResponse> => {
    const keplr = get(keplrStore);
    const {keplrEnabled, scrtAuthorized, scrtClient} = keplr;
    if (!keplrEnabled || !scrtAuthorized) {
        return { error: "Keplr not enabled" };
    }
    let queryMsg: object;
    if (permit) {
        queryMsg = { 
            with_permit: { 
                permit,
                game_state: {}
            }
        };

        //console.log(queryMsg);
        try {
            const response: QueryGameStateResponse = await scrtClient.queryContractSmart(CONTRACT, queryMsg, null, CONTRACT_CODE_HASH);
            return response;
        } catch (error: any) {
            return {error: error.toString()};
        }
    }
}
