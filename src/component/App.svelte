<script context="module" lang="ts">
	export interface GameContext {
		language: Writable<SupportedLanguage>;
	};
</script>

<script lang="ts">
	import {
		onMount,
		setContext,
	} from 'svelte';

	import {
		Writable,
		writable,
	} from 'svelte/store';

	import Fa from 'svelte-fa';

	import {
		faClock,
	} from '@fortawesome/free-solid-svg-icons';

	import {
		SupportedLanguage,
		H_LANGUAGES,
		H_COLORS,
		H_SHAPES,
		CanonicalColor,
		CanonicalShape,
	} from '#/intl/game';

	import {
		H_MESSAGES,
	} from '#/intl/messages';

	import {
		SI_CHAIN,
		S_CHAIN_NAME,
		P_LCD_REST,
		P_LCD_RPC,
		Wallet,
		WalletError,
	} from '#/network/wallet';
	
	import {
		KeplrWallet,
		EnableKeplrError,
		OfflineSignerError,
	} from '#/network/keplr';

	import {
dd,
		read_cookie,
		write_cookie,
	} from '#/util/dom';

	import {
		microtask,
		ode,
		oder, timeout,
	} from '#/util/belt';

	import MessagePanel, {MessagePanelHelper} from './MessagePanel.svelte';
	import Prompt, {PromptHelper} from './Prompt.svelte';
	import Assertion, {AssertionHelper} from './Assertion.svelte';
	import Scene, {SceneHelper} from './Scene.svelte';
	
	import {permitName, permitsStore, Permit, PermitParams, Permits } from '#/network/permits';
	import { CONTRACT } from '#/network/contract';
import { Deduction } from '#/util/logic';
import PremiseWidget from './PremiseWidget.svelte';

	const XT_SECONDS = 1000;
	const XTL_MINUTES = 60 * XT_SECONDS;


	let permits: Permits;
	permitsStore.subscribe((value: Permits) => {
		permits = value;
	});


	// keplrStore.subscribe((value: KeplrStore) => {
	// 	keplr = value;
	// });

	let permit: Permit;
	// onMount( async () => {
	// 	await holdForKeplr(keplr);
   //      const { scrtClient } = keplr;
	// 	if (!scrtClient) { return; }

	// 	if (permits[scrtClient.senderAddress]) {
	// 		permit = permits[scrtClient.senderAddress];
	// 	} else {
	// 		try {
	// 			let signature = await getSignature(CHAIN_ID);
	// 			let permit_params: PermitParams = {
	// 				allowed_tokens: [CONTRACT],
	// 				chain_id: CHAIN_ID,
	// 				permit_name: permitName,
	// 				permissions: ["owner"],
	// 			};
	// 			permit = {
	// 				params: permit_params,
	// 				signature
	// 			}
	// 			permitsStore.set({...permits, [scrtClient.senderAddress]: permit});
	// 		} catch (err: any) {
	// 			console.log(err.toString());
	// 		}
	// 	}
	// })


	/**
	 * default client locale
	*/
	let s_lang: SupportedLanguage;

	// try to adjust to client
	try {
		// use client's locale
		const s_lang_client = new Intl.Locale(navigator.language).language;

		// language is supported
		if(s_lang_client in H_LANGUAGES) {
			s_lang = s_lang_client;
		}
	}
	catch(e_intl) {}

	// game context
	{
		// language store
		const ys_lang = writable('en');

		// subscribe to updates
		ys_lang.subscribe(s_lang_set => s_lang = s_lang_set as SupportedLanguage);

		// set game context
		setContext('game', {
			language: ys_lang,
		} as GameContext);
	}

	/**
	 * helper instance for communicating with MessagePanel
	 */
	let k_panel: MessagePanelHelper;

	/**
	 * helper instance for communicating with Scene
	 */
	let k_scene: SceneHelper;

	/**
	 * helper instance for communicating with Assertion
	 */
	let k_tx: AssertionHelper;

	/**
	 * helper instance for communicating with Prompt
	 */
	let k_prompt: PromptHelper;

	/**
	 * wallet instance
	 */
	let k_wallet: Wallet;

	async function reveal_prepared(si_which: string) {
		// loading messages
		for(const g_msg of H_MESSAGES[si_which]) {
			if(g_msg.delay) await timeout(g_msg.delay);
			await k_panel.reveal_text(g_msg.labels[s_lang], g_msg.interval, g_msg.pause);
		}
	}

	let si_player_color: CanonicalColor;
	let si_player_shape: CanonicalShape;
	let si_hint: `color:${CanonicalColor}` | `shape:${CanonicalShape}`;

	async function introduction(): Promise<void> {
		// take a beat to apreciate the blank, dark page
		await timeout(2000);

		// grab user attention
		await reveal_prepared('attention');

		// beat
		await timeout(1800);

		// clear
		await k_panel.reveal_text('');

		// beat
		await timeout(1200);
	}

	async function welcome_back(): Promise<void> {
		// welcome back message
		await k_panel.reveal_text(`let's do this ;)`);

		// beat
		await timeout(800);

		// welcome back message
		await k_panel.reveal_text('');
	}

	async function reload(): Promise<void> {
		// button to reload the page
		await k_prompt.ok('Reload');

		// reload page
		window.location.reload();

		// wait forever
		return new Promise(() => {});
	}

	async function fatal(s_text: string): Promise<void> {
		// show error
		await k_panel.error(s_text);

		// show button to reload
		return reload();
	}

	async function connect_wallet(): Promise<void> {
		// wait for response
		const si_opt = await k_prompt.opts({
			keplr: KeplrWallet.isAvailable()? {
				label: 'Connect Keplr',
				alt: `Connect a wallet using the Keplr extension for Chrome`,
			}: {
				label: 'Install Keplr',
				alt: `Keplr was not detected. Please install it first in order to use this option`,
			},
			local: {
				label: 'Use Local Storage',
				alt: `Creates a wallet in your browser's local storage for a better user experience on testnet`,
			},
		});

		// connect to wallet
		switch(si_opt) {
			// use keplr
			case 'keplr': {
				// try to instantiate
				try {
					k_wallet = KeplrWallet.fromWindow();
				}
				// could keplr is not installed
				catch(e_keplr) {
					// open keplr in new tab
					window.open('https://www.keplr.app/', '_blank');

					// show button to reload
					return await reload();
				}

				break;
			}

			// local storage
			case 'local': {
				return fatal(`Local storage wallet not yet implemented`);
			}

			// other
			default: {
				return fatal(`Unhandled response option: '${si_opt}'`);
			}
		}

		// if the chain was added in response to the suggestion
		let b_added = false;

		// enable chain
		try {
			b_added = await k_wallet.enable({
				chainId: SI_CHAIN,
				chainName: S_CHAIN_NAME,
				rest: P_LCD_REST,
				rpc: P_LCD_RPC,
			});
		}
		// something went wrong
		catch(e_enable: unknown) {
			// user did not enable
			if(e_enable instanceof EnableKeplrError) {
				// retry
				return await connect_wallet();
			}
			// offline signer unavailable
			else if(e_enable instanceof OfflineSignerError) {
				return fatal(e_enable.stack!);
			}
			// other
			else if(e_enable instanceof Error) {
				return fatal(e_enable.stack!);
			}
			// unknown
			else {
				return fatal(`Fatal unknown error`);
			}
		}

		// user rejected chain
		if(!b_added) {
			return fatal(`Chain suggestion was denied. Unable to proceed.`);
		}

		// get key store
		const g_key = k_wallet.key;

		// // get accounts
		// const a_accounts = k_wallet.accounts;
		
		// // no accounts
		// if(!a_accounts.length) {
		// 	return fatal('No accounts were detected in your wallet.');
		// }

		// set wallet info
		k_panel.wallet({
			name: g_key.name,
			addr: g_key.bech32Address,
			ledger: g_key.isNanoLedger,
		});
		
		// wait for animation to complete
		await timeout(1100);
	}

	onMount(async() => {
		// read cookie
		let h_cookie = read_cookie();

		// ref last seen value
		let s_last_seen = h_cookie.last_seen;

		// hasn't seen introduction yet; run introduction
		if(!s_last_seen) {
			await introduction();
		}
		// returning; welcome back
		else {
			await welcome_back();
		}

		// set last seen value, expires in 30 days
		write_cookie({
			last_seen: ''+Date.now(),
		}, 60*60*24*30);

		// re-read cookie
		h_cookie = read_cookie();

		// gameplay explanation                                                                                    |
		await k_panel.arbiter(`
			Welcome${s_last_seen? ' back': ''} to my game of secrets. In a moment, you will be matched with another player.

			I will give each of you a chip with a colored shape on it. There are only four colors (red, green, blue, black), and four shapes (triangle, square, circle, star).

			Your opponent will not be able to see your chip and vice versa. I will also take a third chip and hide it in a bag. Each chip will have a unique color and a unique shape. For example, if the chip in my bag is a red triangle, then nobody else has red, and nobody else has a triangle.

			The rules are simple. You and your opponent must exchange a message with each other. Cooperate to deduce what is in my bag and you both will advance to the next round. Betray your opponent by correctly guessing which chip they have and win their wager. Guess wrong and lose.
		`);

		// beat
		await timeout(s_last_seen? 800: 4.6e3);

		// ask if ready to join
		await k_panel.reveal_text('ready to play?');

		// connect wallet
		await connect_wallet();

		si_player_color = Object.keys(H_COLORS)[Math.floor(Math.random() * 4)];
		si_player_shape = Object.keys(H_SHAPES)[Math.floor(Math.random() * 4)];

		si_hint = [
			...Object.keys(H_COLORS).map(s => `color:${s}` as `color:${CanonicalColor}`),
			...Object.keys(H_SHAPES).map(s => `shape:${s}` as `shape:${CanonicalShape}`),
		][Math.floor(Math.random() * 4)];

		// clear
		await k_panel.reveal_text('');

		// give chip
		await k_panel.arbiter(`Here is your chip, player...`);

		// animate chip
		await k_scene.animate_chip_entry(si_player_color, si_player_shape);

		await timeout(4.5e3);

		let b_hint_color = si_hint.startsWith('color:');

		await k_panel.arbiter(`
			Round 1: I've given you the ${si_player_color} ${si_player_shape} this round, and a hint that nobody has ${b_hint_color? '': 'a '}${si_hint.replace(/^[^:]+:/, '')}.

			I've also given your opponent a hint. Theirs is that nobody has a certain ${b_hint_color? 'shape': 'color'}.
		`);

		await timeout(4.1e3);

		const xt_eta = Date.now() + (10 * XTL_MINUTES);
		const yw_time = writable('10m 00s');

		setInterval(() => {
			const xtl_diff = xt_eta - Date.now();
			const n_secs = Math.floor(xtl_diff / XT_SECONDS);
			const n_mins = Math.floor(n_secs / 60);
			yw_time.set(`${n_mins}m ${(''+(n_secs % 60)).padStart(2, '0')}s`)
		}, 100);

		// round 1
		{
			// render clock icon
			const dm_clock = dd('span');

			Object.assign(dm_clock.style, {
				paddingRight: '2px',
			});

			new Fa({
				target: dm_clock,
				props: {
					icon: faClock,
				},
			});

			// final instructions
			await k_panel.arbiter([
				'Now you must choose what to tell the other player. I reveal both of your messages simultaneously once they both have been submitted. You have {clock_icon}{time_remaining} remaining.',
			], {
				clock_icon: dm_clock,
				time_remaining: yw_time,
			});

			// show transmission controls
			await k_tx.show();

			await timeout(4e3);

			// reveal transmission buttons
			reveal_tx();
		}

		// emulate opponent message
		{
			await timeout(3e3);

			// create a priori deduction
			const k_priori = new Deduction();
			k_priori.nobody(`color:${si_player_color}`);
			k_priori.nobody(`shape:${si_player_shape}`);
			k_priori.nobody(si_hint);

			// prepare opp1 deduction
			let k_opp1 = k_priori.clone();

			// premise dom
			const dm_premise = dd('span');

			// render premise wiidget
			const yc_premise = new PremiseWidget({
				target: dm_premise,
				props: {
					b_mode_nobody: false,
					si_assertion: 'shape:star',
				},
			});

			// premise helper
			const k_premise = yc_premise.k_premise;

			// listen for change to premise
			yc_premise.$on('change', () => {
				k_opp1 = k_premise.apply(k_priori.clone());

				console.log(`Priori: ${k_priori.explain()}`);
				console.log(`Opp1: ${k_opp1.explain()}`);
				// debugger;
				// console.log([k_priori, k_opp1]);
			});


			k_panel.opponent([
				'Nobody has a star {premise}'
			], {
				premise: dm_premise,
			});
		}
	});

	let si_basis = 'nobody has';
	let s_quality = '';

	async function reveal_tx(): Promise<void> {
		await k_panel.reveal_text(`${si_basis} ${s_quality || '...'}`);
	}

	function select_basis(g_evt: CustomEvent<'nobody' | 'chip'>) {
		k_panel.submittable(null);

		if('nobody' === g_evt.detail) {
			si_basis = 'nobody has';
		}
		else {
			si_basis = 'my chip is';
		}

		s_quality = '';

		reveal_tx();
	}

	async function select_quality(s_type: 'color' | 'shape', _s_quality: string) {
		s_quality = _s_quality;

		await reveal_tx();

		k_panel.submittable(() => {
			// hide transmission controls
			k_tx.hide();

			// remove submission button
			k_panel.unsubmittable();

			// commit text to message history
			k_panel.commit();
		});
	}

	async function select_color(g_evt: CustomEvent<CanonicalColor | CanonicalShape>) {
		select_quality('color', g_evt.detail);
	}

	async function select_shape(g_evt: CustomEvent<CanonicalColor | CanonicalShape>) {
		select_quality('shape', `a ${g_evt.detail}`);
	}

</script>

<style lang="less">
	.container {
		position: relative;
	}

</style>

<MessagePanel bind:k_panel>
	
</MessagePanel>

<div class="container">
	<Prompt bind:k_prompt>

	</Prompt>

	<Assertion bind:k_tx on:basis={select_basis} on:color={select_color} on:shape={select_shape}>

	</Assertion>

	<Scene bind:k_scene>

	</Scene>
</div>
