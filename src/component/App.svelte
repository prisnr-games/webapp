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

	import {
		blur,
		fade,
	} from 'svelte/transition';

	import {
		quadInOut,
	} from 'svelte/easing';

	import Fa from 'svelte-fa';

	import {
		faClock,
		faVolumeUp,
		faVolumeMute,
		faFire,
	} from '@fortawesome/free-solid-svg-icons';

	import fingerprintjs from '@fingerprintjs/fingerprintjs';

	import {
		SupportedLanguage,
		H_LANGUAGES,
		H_COLORS,
		H_SHAPES,
		CanonicalColor,
		CanonicalShape,
		A_BASES,
		CanonicalBasis,
		H_BASES,
		CanonicalTarget,
		PickOption,
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
		uscrt_to_scrt,
	} from '#/network/wallet';
	
	import {
		KeplrWallet,
		EnableKeplrError,
		OfflineSignerError,
	} from '#/network/keplr';

	import {
		dd,
		delete_cookie,
		qs,
		read_cookie,
		write_cookie,
	} from '#/util/dom';

	import {
		XTL_SECONDS,
		XTL_MINUTES,
		XTL_HOURS,
		XTL_DAYS,
		microtask,
		ode,
		oder,
		proper,
		timeout,
		relative_time,
		Killables,
	} from '#/util/belt';

	import {
		CanonicalGuessOption,
		Deduction,
		GuessOption,
		SemanticAssertion,
		use_assertion_in_sentence,
		use_quality_in_sentence,
	} from '#/util/logic';
	
	import type {
		SemanticColorQuality,
		SemanticQuality,
		SemanticShapeQuality,
	} from '#/util/logic';

	import MessagePanel, {MessagePanelHelper} from './MessagePanel.svelte';
	import Prompt, {PromptHelper} from './Prompt.svelte';
	import Assertion, {AssertionHelper} from './Assertion.svelte';
	import Scene, {SceneHelper} from './Scene.svelte';
	import PremiseWidget, {PremiseHelper} from './PremiseWidget.svelte';
	import Decision, {DecisionHelper} from './Decision.svelte';
	import ActionWidget from './ActionWidget.svelte';
	import Pick, {PickHelper} from './Pick.svelte';
	

	import {
		Permit,
		PermitParams,
		SI_PERMIT,
	} from '#/network/permits';

	import {
		ContractError,
		ContractExecInfo,
		EtaEstimator,
		GameContract,
		GameStateResponse,
		GuessResponse,
		JoinResponse,
		PickRewardResponse,
		P_CONTRACT_GAME_ADDR,
		SI_CONTRACT_GAME_CODE_HASH,
		QueryGameStateResponse,
		SemanticGuess,
		SubmitResponse,
		P_CONTRACT_MINTER_ADDR,
		SI_CONTRACT_MINTER_CODE_HASH,
	} from '#/network/contract';

	import {
		EncryptedLocalStorage,
	} from '#/util/encrypted-local-storage';


	function F_IDENTITY<T extends unknown>(w: T): T {
		return w;
	};

	const G_NETWORK_SUMMARY = {
		chain_name: S_CHAIN_NAME,
		chain_id: SI_CHAIN,
		game_addr: P_CONTRACT_GAME_ADDR,
		game_hash: SI_CONTRACT_GAME_CODE_HASH,
		rest: P_LCD_REST,
		rpc: P_LCD_RPC,
		minter_addr: P_CONTRACT_MINTER_ADDR,
		minter_hash: SI_CONTRACT_MINTER_CODE_HASH,
	};

	/**
	 * query permit for game
	 */
	let g_permit: Permit;


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
	 * decision instance for communicating with Decision
	*/
	let k_decision: DecisionHelper;

	/**
	 * picker instance for communicatin with Pick
	 */
	let k_pick: PickHelper;

	/**
	 * wallet instance
	 */
	let k_wallet: Wallet;


	/**
	 * killables
	 */
	const k_killables = new Killables();


	// Game states


	/**
	 * player chip and hint
	 */
	let si_player_color: CanonicalColor;
	let si_player_shape: CanonicalShape;
	let si_player_hint: SemanticQuality;
	let si_submit_first: SemanticAssertion;

	/**
	 * deductions
	 */
	let k_priori = new Deduction();
	let f_assert_1: (k: Deduction) => Deduction = F_IDENTITY;
	let f_assert_2: (k: Deduction) => Deduction = F_IDENTITY;

	$: k_deduced = f_assert_2(f_assert_1(k_priori.clone()).clone()).clone();


	// preload images
	// {
		const d_img_monster = new Image();
		d_img_monster.src = '/asset/monster.png';

		const d_img_smile = new Image()
		d_img_smile.src = '/asset/smile.png';
	// }

	async function reveal_prepared(si_which: string) {
		// loading messages
		for(const g_msg of H_MESSAGES[si_which]) {
			if(g_msg.delay) await timeout(g_msg.delay);
			await k_panel.reveal_text(g_msg.labels[s_lang], g_msg.interval, g_msg.pause);
		}
	}

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
		await k_panel.reveal_text(`good luck! ;)`);

		// beat
		await timeout(800);

		// welcome back message
		await k_panel.reveal_text('');
	}

	async function reload(): Promise<never> {
		// button to reload the page
		await k_prompt.ok('Reload');

		// reload page
		window.location.reload();

		// wait forever
		return new Promise(() => {});
	}

	async function fatal(s_text: string): Promise<never> {
		// kill all pending intervals and timeouts
		k_killables.killAll();

		// clear console message
		k_panel.reveal_text('');

		// show error
		await k_panel.error(s_text);

		// show button to reload
		return reload();
	}

	async function surprise() {
		// play transition
		const s_suspense = '                                 ';
		await k_panel.reveal_text(s_suspense);

		H_AUDIO.epic_transition.play();
		
		void k_panel.reveal_text(s_suspense+'  ', 250);

		dm_surprise.classList.add('triggered')
		await timeout(160);
		dm_surprise.style.opacity = '0.0';

		// disable surprise display
		setTimeout(() => {
			dm_surprise.style.display = 'none';
		}, 6e3);

		// allow surprise to settle
		await timeout(2000);
	}

	async function connect_wallet(n_retries=0): Promise<void> {
		// 
		await k_panel.warn(`
			This game stores encrypted query permit data in local storage.
			
			In order to protect this data, you must provide a passphrase each time the page is loaded.

			${EncryptedLocalStorage.includes(/\.permits$/)
				? `Enter the same passphrase to restore a previous permit, or enter a different one to sign a new permit.`
				: ''}
		`);

		async function enter_passphrase(c_retries=0): Promise<string> {
			// whether it was clicked (before instruction)
			let b_clicked = false;

			// first attempt
			if(!c_retries) {
				// wait for button to fade in a little
				k_killables.addTimeout(() => {
					if(!b_clicked) {
						// show text
						void k_panel.reveal_text('↓↓ click below to enter passphrase ↓↓');  // ▼
					}
				}, 6500);
			}
			
			// show button
			await k_prompt.ok('Provide passphrase');

			// clicked
			b_clicked = true;

			// prompt for passphrase and save to local field
			const atu8_seed = new Uint8Array(32); // 33 - 126
			crypto.getRandomValues(atu8_seed);
			const s_prompt_default = [...atu8_seed].map(x => String.fromCharCode((x % 93)+33)).join('');
			const s_passphrase = window.prompt('Enter a passphrase to encrypt/decrypt query permits', s_prompt_default);

			// blank
			if(!s_passphrase) {
				const a_retries = [
					`null key encryption, eh? try again you silly goose`,
					`i can do this all day, can you?`,
					`there are only so many responses i have...`,
					`...and you're starting to piss me off`,
					`i'm serious dood -- don't make me`,
				];

				if(c_retries < a_retries.length) {
					k_panel.reveal_text(a_retries[c_retries], 40);
				}
				else {
					window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
				}

				// retry
				return enter_passphrase(c_retries+1);
			}
			// too weak
			else if(s_passphrase.length < 5) {
				k_panel.reveal_text('passphrase must be at least 5 characters');

				// retry
				return enter_passphrase(c_retries+1);
			}
			// valid
			else {
				return s_passphrase;
			}
		}

		// use fingerprint
		const y_agent = await fingerprintjs.load();
		const g_result = y_agent.get();
		const p_fingerprint = (await g_result).visitorId;

		// get passphrase
		const s_passphrase = await enter_passphrase();

		// clear text
		k_panel.reveal_text('');

		// wallet not yet connected
		if(!k_wallet) {
			// prepare for wallet connection
			await k_panel.warn(`
				This is a multiplayer, online game that uses smart contracts on the Secret Network to ensure fairness for all players.

				Interacting with the game requires submitting transactions to the blockchain via a web wallet such as Keplr (or a local wallet for testnet only).
			`);

			// pause for effect
			await timeout(600);

			// wait for response
			const si_opt = await k_prompt.opts({
				keplr: KeplrWallet.isAvailable()? {
					label: 'Connect Keplr',
					alt: `Connect a wallet using the Keplr extension for Chrome`,
				}: {
					label: 'Install Keplr',
					alt: `Keplr was not detected. Please install it first in order to use this option`,
				},
				// local: {
				// 	label: 'Use Local Storage',
				// 	alt: `Creates a wallet in your browser's local storage for a better user experience on testnet`,
				// },
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

					// save
					write_cookie({
						wallet: 'keplr',
					}, 30*XTL_DAYS);

					break;
				}

				// local storage
				case 'local': {
					return fatal(`Local storage wallet not yet implemented`);

					// // save
					// write_cookie({
					// 	wallet: 'local',
					// }, 30*XTL_DAYS);
				}

				// other
				default: {
					return fatal(`Unhandled response option: '${si_opt}'`);
				}
			}
	}

		// if the chain was added in response to the suggestion
		let b_added = false;

		// keep track of how long it takes to enable
		const xt_suggest = Date.now();

		// enable chain
		try {
			b_added = await k_wallet.enable({
				chainId: SI_CHAIN,
				chainName: S_CHAIN_NAME,
				rest: P_LCD_REST,
				rpc: P_LCD_RPC,
			}, () => {
				return fatal(`Account was changed in wallet. Session terminated.`);
			});
		}
		// something went wrong
		catch(e_enable: unknown) {
			debugger;
			// user did not enable
			if(e_enable instanceof EnableKeplrError) {
				if(n_retries >= 3) {
					return fatal(`Keplr connection request rejected too many times`);
				}

				// pause
				await timeout(2000);

				// retry
				return await connect_wallet(n_retries+1);
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

		// first time adding
		if(Date.now() - xt_suggest > XTL_SECONDS) {
			await k_panel.warn(`Please make sure your network is set to "${S_CHAIN_NAME}" in Keplr!`);
			await timeout(2100);
		}

		// get key store
		const g_key = k_wallet.key;

		// ref signer address
		const p_signer = g_key.bech32Address;

		// set wallet info
		k_panel.wallet({
			name: g_key.name,
			addr: p_signer,
			ledger: g_key.isNanoLedger,
		});

		// create encrypted local storage instance
		const k_ls = new EncryptedLocalStorage(p_signer, [p_fingerprint, s_passphrase, 'salt'].join('|'), G_NETWORK_SUMMARY);

		// try to fetch any existing permits
		let h_permits: Record<string, Permit> | null = null;
		try {
			h_permits = k_ls.get<Record<string, Permit>>('permits');
		}
		catch(e_decrypt: unknown) {
			await k_panel.warn('Change in passphrase detected. Clearing old query perrmits.');
			k_ls.clear();
		}

		await timeout(1000);

		let b_restored_permit = false;

		// permit exists for this contract
		if(h_permits && h_permits[P_CONTRACT_GAME_ADDR]) {
			g_permit = h_permits[P_CONTRACT_GAME_ADDR];

			// restored permit
			b_restored_permit = true;
		}
		// permit does not exist for this contract
		else {
			// 
			await k_panel.warn(`
				Query permits allow you to read encrypted data from the blockchain without needing to write anything extra to the chain.

				Signing a query permit happens offline and does not require any gas.
			`);

			await timeout(1800);

			// await k_panel.reveal_text('ready to sign?');

			await k_prompt.ok('Sign permit');
			
			try {
				// build permit
				g_permit = {
					params: {
						chain_id: k_wallet.chain,
						allowed_tokens: [
							P_CONTRACT_GAME_ADDR,
							P_CONTRACT_MINTER_ADDR,
						],
						permit_name: SI_PERMIT,
						permissions: ['owner'],
					} as PermitParams,
					signature: await k_wallet.signQueryPermit(),
				};

				// append
				k_ls.set('permits', {
					...(h_permits || {}),
					[P_CONTRACT_GAME_ADDR]: g_permit,
					[P_CONTRACT_MINTER_ADDR]: g_permit,
				});
			}
			catch(e_sign_set: any) {
				return fatal(e_sign_set.stack);
			}
		}

		k_panel.permit(g_permit.params, b_restored_permit);

		await timeout(1200);

		await k_panel.reveal_text(``);

		// wait for animation to complete
		await timeout(1100);
	}

	async function wait_for_other_player(b_resume=false): Promise<GameStateResponse> {
		let yw_checked = writable('');

		if(b_resume) {
			k_panel.warn(`Still waiting for another player... {last_check}`, {
				last_check: yw_checked,
			});
		}
		else {
			// TODO: notifications and bell sound
			k_panel.warn(`Created a new game. Now waiting for another player... {last_check}`, {
				last_check: yw_checked,
			});
		}

		let b_notifications_enabled = window.Notification && 'granted' === Notification.permission;
		let b_notifications_requested = false;
		let b_notification_notice = false;

		function enable_notifications() {
			if(b_notifications_enabled) {
				k_panel.warn(`You will receive a notification once another player has joined.`);
			}
			else {
				const dm_approve = dd('span');
				const yc_action = new ActionWidget({
					target: dm_approve,
				});

				yc_action.$on('change', async() => {
					const xt_prompted = Date.now();

					const s_status = await Notification.requestPermission();

					if('denied' === s_status) {
						yc_action.$set({
							si_selected: 'none',
						});

						if(Date.now() - xt_prompted < 0.5*XTL_SECONDS) {
							k_panel.warn(`User previously denied request for notifications. Need to reset in browser settings.`);
						}
						else {
							k_panel.warn(`User denied request for notification permission.`);
						}
					}
					else {
						k_panel.warn(`Confirmed. Notification will be sent when another player joins.`);
					}
				});

				// prompt for notifications
				k_panel.warn(`Would you like to receive a notification once another player has joined? {approve}`, {
					approve: dm_approve,
				});
			}
		}

		let xt_checked = Date.now();
		let i_checking = k_killables.addInterval(() => {
			if(xt_checked) {
				yw_checked.set(`Last checked ${relative_time(xt_checked)}`);
			}

			if(!b_notification_notice) {
				b_notification_notice = true;
				enable_notifications();
			}
		}, 1000);

		// start querying for game state
		let g_game_query: GameStateResponse;
		let xt_prev: number;
		for(;;) {
			xt_prev = Date.now();
			try {
				g_game_query = (await k_game.queryGameState());
			}
			catch(e_query: unknown) {
				if(e_query instanceof ContractError) {
					return fatal(e_query.message);
				}
				else {
					return fatal(e_query+'');
				}
			}

			if(0 !== g_game_query.round) {
				break;
			}

			xt_checked = Date.now();

			// query at most every 10 seconds
			const xtl_diff = Date.now() - xt_prev;
			if(xtl_diff < 10*XTL_SECONDS) {
				await timeout(xtl_diff);
			}
		}

		// stop checking
		k_killables.delInterval(i_checking);

		// clear last checked widget text
		yw_checked.set('');

		// start alarm
		H_AUDIO.retro_game_alarm.play();

		return g_game_query;
	}

	// audio
	const H_AUDIO_SRC = {
		epic_transition: 'epic-transition.wav',
		coin_win: 'coin-win.wav',
		retro_game_alarm: 'retro-game-alarm.wav',
		retro_game_notif: 'retro-game-notif.wav',
		trumpet_fanfare: 'trumpet-fanfare.wav',
	} as const;

	const H_AUDIO = Object.fromEntries(ode(H_AUDIO_SRC).map(([si_key, sr_asset]) => [si_key, new Audio(`/asset/${sr_asset}`)])) as Record<keyof typeof H_AUDIO_SRC, HTMLAudioElement>;

	// muted
	let b_muted = false;

	// read cookie
	let h_cookie = read_cookie();

	// game
	let k_game: GameContract;


	$: {
		if(h_cookie) {
			// set audio
			Object.values(H_AUDIO).forEach(d => d.muted = b_muted);

			// save setting
			write_cookie({
				muted: b_muted? '1': '0',
			}, 30*XTL_DAYS);
		}
	}

	async function force_endgame() {
		await k_panel.arbiter(`
			Your opponent is taking too long. Since you have already fulfilled your duty, I will allow you to end the game and get a refund.

			Would you like to end the game?
		`);

		await k_panel.reveal_text('yes, give me my money back');

		k_panel.submittable(async() => {
			k_panel.submittable(null);
			
			const g_game = await safe_exec({
				async exec(): Promise<GameStateResponse> {
					const g_endgame = (await k_game.forceEndgame()).data.force_endgame!.game_state!
					
					void k_panel.commit();

					return g_endgame;
				},
				check(g: GameStateResponse): boolean {
					return null !== g.finished;
				},
				query_fail() {
					void force_endgame();
					return null;
				},
			});

			if(!g_game) return;

			k_panel.unsubmittable();

			k_panel.arbiter(`I have refunded you ${uscrt_to_scrt(BigInt(g_game.wager!))}.`);

			return game_over();
		});
	}

	interface CountdownConfig {
		eta: EtaEstimator;
		kill_text?: string;
		terminate?: VoidFunction;
	}

	interface CountdownInfo {
		interval: number;
		clock: HTMLElement,
		store: Writable<string>,
	}

	class Countdown implements CountdownInfo {
		protected _yw_time: Writable<string>;
		protected _dm_clock: HTMLElement;
		protected _i_interval: number;
		protected _s_kill: string;
		protected _k_eta: EtaEstimator;
		protected _s_expired = 'run out of time';

		constructor(gc_countdown: CountdownConfig) {
			const f_terminate = gc_countdown.terminate;

			this._s_kill = gc_countdown.kill_text || '';

			this._k_eta = gc_countdown.eta;

			this._yw_time = writable('(estimating...)');

			// kickoff estimation
			void this._k_eta.eta;

			this._i_interval = k_killables.addInterval(() => {
				const k_eta = this._k_eta;

				// eta not ready; stop
				if(!k_eta.ready) return;

				// countdown expired
				if(k_eta.expired) {
					// update store
					this._yw_time.set(this._s_expired);

					// clear interval
					k_killables.delInterval(this._i_interval);
					this._i_interval = 0;

					// remove clock
					try {
						this._dm_clock.remove();
					}
					catch(e_remove: unknown) {}

					// termination
					if(f_terminate) f_terminate();

					// stop
					return;
				}

				const xtl_diff = k_eta.remaining;
				const n_secs = Math.max(0, Math.floor(xtl_diff / XTL_SECONDS));
				const n_mins = Math.floor(n_secs / 60);

				if(!n_mins) {
					if(n_secs <= 10) {
						this._yw_time.set('less than 10 seconds remaining');
					}
					else if(n_secs <= 31) {
						this._yw_time.set('less than 30 seconds remaining');
					}
					else {
						this._yw_time.set('less than 60 seconds remaining');
					}
				}
				else if(n_mins < 2) {
					this._yw_time.set('less than 2 minutes remaining');
				}
				else if(n_mins < 5) {
					this._yw_time.set('less than 5 minutes remaining');
				}
				else if(n_mins < 10) {
					this._yw_time.set('less than 10 minutes remaining');
				}
				else {
					this._yw_time.set('a little more than 10 minutes remaining');
				}

				// this._yw_time.set(`${n_mins}m ${(''+(n_secs % 60)).padStart(2, '0')}s remaining`)
			}, 100);

			// render clock icon
			const dm_clock = this._dm_clock = dd('span');
			Object.assign(dm_clock.style, {
				paddingRight: '2px',
			});

			// create icon
			new Fa({
				target: dm_clock,
				props: {
					icon: faClock,
				},
			});
		}

		get interval() {
			return this._i_interval;
		}

		get clock() {
			return this._dm_clock;
		}

		get store() {
			return this._yw_time;
		}

		kill(s_text=''): void {
			// not yet killed
			if(this._i_interval) {
				// del interval
				k_killables.delInterval(this._i_interval);

				// now it is killed
				this._i_interval = 0;

				// remove clock icon
				this._dm_clock.remove();

				// update store
				this._yw_time.set(s_text || this._s_kill);
			}
		}
	}

	async function game_over(): Promise<void> {
		// delete game cookie
		delete_cookie('game');

		// exit
		return fatal('Game over. Reload to play again.')
	}

	async function try_resume_game(): Promise<boolean> {
		let b_waiting = true;
		k_panel.reveal_text('checking for active game...').then(() => b_waiting && k_panel.spinning(true));

		// check for active game
		let g_game!: GameStateResponse | undefined;
		try {
			try {
				g_game = await k_game.queryGameState();
			}
			finally {
				// no longer waiting
				b_waiting = false;

				// clear text and stop spinning
				k_panel.reveal_text('');
			}
		}
		catch(e_query) {
			debugger;
		}

		// continue game
		if(g_game) {
			console.log('Resuming:', g_game);

			// round exists
			if(null !== g_game.round) {
				if(g_game.finished) {
					k_panel.warn(`Fast-forwarding through finished game so you can see the results.`);
				}
				else {
					k_panel.warn(`Successfully resumed active game.`);
				}

				if(0 === g_game.round) {
					g_game = await wait_for_other_player(true);
				}

				// start/resume round 1
				if(1 === g_game.round) {
					// start at round 1a, it will skip to appropriate sub-round
					void round_1a(g_game, true);
					return true;
				}

				// resume round 3
				if(3 === g_game.round) {
					void round_3a(g_game, true);
					return true;
				}

				await k_panel.error(`Unrecognized game state round: ${g_game.round}`);
			}
		}

		return false;
	}


	let b_surprise = false;
	let dm_surprise: HTMLElement;

	onMount(async() => {
		// debugging info
		console.log(G_NETWORK_SUMMARY);

		// ref last seen value
		const s_last_seen = h_cookie.last_seen;
		const xt_last_seen = +s_last_seen;

		// user has been seen before
		if(s_last_seen) {
			// update muted value
			b_muted = !!(+h_cookie.muted);
		}

		// wallet was previously connected
		if('keplr' === h_cookie.wallet) {
			// try to instantiate
			try {
				k_wallet = KeplrWallet.fromWindow();
			}
			// could keplr is not installed
			catch(e_keplr) {
				// clear setting
				delete_cookie('wallet');
			}
		}

		// set last seen value, expires in 30 days
		write_cookie({
			last_seen: ''+Date.now(),
		}, 30*XTL_DAYS);

		// re-read cookie
		h_cookie = read_cookie();

		// connect wallet
		await connect_wallet();

		// instantiate game contract
		k_game = new GameContract(k_wallet, P_CONTRACT_GAME_ADDR, g_permit);

		// a game was started
		if(h_cookie.game) {
			const b_exit = await try_resume_game();
			
			if(b_exit) return;

			// no active game
			delete_cookie('game');
		}

		// new user or late returning
		if(!s_last_seen) {
			// surprise >:)
			await surprise();

			// run introduction
			await introduction();
		}
		// returning; welcome back
		else {
			await welcome_back();
		}

		// gameplay explanation                                                                                    |
		await k_panel.arbiter(`
			Welcome${s_last_seen? ' back': ''} to my game of secrets. In a moment, you will be matched with another player.

			I will give each of you a chip with a colored shape on it. There are only four colors (red, green, blue, black), and four shapes (triangle, square, circle, star).

			Your opponent will not be able to see your chip and vice versa. I will also take a third chip and hide it in a bag. Each chip will have a unique color and a unique shape. For example, if the chip in my bag is a red triangle, then nobody else has red, and nobody else has a triangle.

			The rules are simple. You and your opponent must exchange a message with each other. Cooperate to deduce what is in my bag and you both will advance to the next round. Betray your opponent by correctly guessing which chip they have and win their wager. Guess wrong and lose.
		`);

		// beat
		await timeout(s_last_seen? 800: 4.6e3);

		return try_join();
	});

	interface ExecStruct {
		reveal?: string | null;
		exec: () => Promise<GameStateResponse>;
		query_fail?: (e_fail?: unknown) => Promise<GameStateResponse | null> | null;
		check: (g_game: GameStateResponse) => boolean;
		rejected?: (e_fail?: unknown) => Promise<GameStateResponse | null> | null;
		condition?: (e_fail?: unknown) => Promise<GameStateResponse | null> | null;
	}

	class GameStateError extends Error {}

	async function safe_exec(gc_exec: ExecStruct): Promise<GameStateResponse | null> {
		// wait for transaction is verified
		let b_waiting = true;
		const s_reveal = gc_exec.reveal;
		if('string' === typeof s_reveal) {
			k_panel.reveal_text(s_reveal).then(() => b_waiting && k_panel.spinning(true));
		}
		else {
			k_panel.spinning(true);
		}

		const f_check = gc_exec.check;
		const f_condition = gc_exec.condition || gc_exec.query_fail;
		const f_rejected = gc_exec.rejected || gc_exec.query_fail;
		
		let g_game: GameStateResponse;

		// attempt executioon
		try {
			try {
				g_game = await gc_exec.exec();
				
				if(!f_check(g_game)) {
					g_game = null;
					throw new GameStateError();
				}
			}
			finally {
				// no longer waiting
				b_waiting = false;

				// clear text and stop spinning
				k_panel.reveal_text('');
			}
		}
		// failed
		catch(e_exec: unknown) {
			console.error(e_exec);

			// error
			if(e_exec instanceof Error) {
				const se_exec = e_exec.message;

				// no scrt
				if(/Account does not exist/.test(se_exec)) {
					return fatal(`Looks like your wallet is empty. Make sure to acquire some SCRT tokens so that you can pay the gas fees for transactions.`);
				}
				// already in active game
				else if(/must finish current game/.test(se_exec)) {
					write_cookie({
						game: 'started',
					}, 12*XTL_HOURS);

					// retry
					if(await try_resume_game()) return null;

					// fail
					return fatal(`Looks like you changed browsers or cleared cache since you last joined a game with this account. Please reload and the game will attempt to resume.`);
				}
				// contract not found
				else if(/contract not found/i.test(se_exec)) {
					return fatal(`Contract not found! Are you on the right network?`);
				}
				// contract condition exception
				else if(/execute contract failed/.test(se_exec)) {
					k_panel.error(`Contract error: ${se_exec}`);
					void f_condition!(e_exec);
					return null;
				}
				// user rejected request
				else if(/Request rejected/.test(se_exec)) {
					k_panel.error(`Transaction rejected`);
					void f_rejected!(e_exec);
					return null;
				}
				// timeout
				else if(/timed out/.test(se_exec)) {
					const yw_retries = writable('');

					await k_panel.warn(`There was a timeout error while waiting for the transaction to be included. Waiting to see if it gets included... {retries}`, {
						retries: yw_retries,
					});

					const g_game_retry = await (async function retry(n_retries=1): Promise<GameStateResponse | null> {
						await timeout(5000);

						let g_query: GameStateResponse | null;
						try {
							g_query = await k_game.queryGameState();

							if(!f_check(g_query)) {
								console.warn(`query permit check failed on game state`, g_query);
								g_query = null;
							}
						}
						catch(e_query: unknown) {
							if(!(e_query instanceof GameStateError)) {
								await k_panel.error([`Timeout error. Please try again with higher gas fee.`, se_exec]);

								// tx failed; allow user to retry
								if(gc_exec.query_fail) {
									return await gc_exec.query_fail(e_query);
								}

								// fail
								return null;
							}
						}

						// retry
						if(!g_query!) {
							// give up
							if(n_retries >= 5) {
								await k_panel.error(`Reached maximum retries. Seems like your transaction failed. Try again with higher gas fee?`);

								// tx failed; allow user to retry
								if(gc_exec.query_fail) {
									return await gc_exec.query_fail(new GameStateError());
								}

								// fail
								return fatal('Unhandled query failure path.');
							}
							
							// info and retry
							yw_retries.set(`Retried ${1 === n_retries? 'once': `${n_retries} times`} so far...`);
							return await retry(n_retries+1);
						}

						// worked!
						return g_query;
					})();

					// fail
					if(!g_game_retry) {
						return null;
					}
					// success
					else {
						g_game = g_game_retry;
					}
				}
				// unhandled
				else {
					debugger;
					return fatal(`Unhandled error: ${e_exec.stack}`);
				}
			}
			// unknown
			else {
				return fatal(`Unknown error: ${e_exec}`);
			}
		}

		console.log(g_game);

		// clear prompt
		k_panel.reveal_text('');

		// // destructure join results
		// const {
		// 	join: g_res_join,
		// 	error: se_join,
		// } = g_exec.data;

		// // error
		// if(se_join) {
		// 	return fatal(se_join);
		// }

		// // 
		// const g_game_join = g_res_join?.game_state!;

		return g_game;
	}

	async function try_join(): Promise<void> {
		// ask if ready to join
		await k_panel.reveal_text('ready to play?');

		// join a game
		await k_prompt.ok('Join a game');

		const g_game_join = await safe_exec({
			reveal: 'waiting for transaction to be verified... ',
			async exec(): Promise<GameStateResponse> {
				return (await k_game.joinGame()).data.join!.game_state!;
			},
			check(g: GameStateResponse): boolean {
				return null !== g.round;
			},
			query_fail() {
				void try_join();
				return null;
			},
		});

		if(!g_game_join) return;

		let g_game = g_game_join;

		// must wait for another player
		if(0 === g_game_join.round) {
			// record that a game was started
			write_cookie({
				game: 'started',
			}, 12*XTL_HOURS);

			// wait for other player
			g_game = await wait_for_other_player();
		}

		// ready to play round 1
		if(1 === g_game.round) {
			return round_1a(g_game);
		}
		// resume round 3
		else if(3 === g_game.round) {
			return fatal('round_3()');
		}
		else {
			console.error(g_game);

			// record that a game was started
			write_cookie({
				game: 'started',
			}, 12*XTL_HOURS);

			return fatal('Failed to join game while waiting for transaction. You can try once more by reloading this page.');
		}
	}

	function update_player_state(g_game: GameStateResponse) {
		si_player_color = g_game.chip_color!.split(':')[1] as CanonicalColor;
		si_player_shape = g_game.chip_shape!.split(':')[1] as CanonicalShape;
		si_player_hint = g_game.hint?.split('|')[1] as SemanticQuality;
		si_submit_first = g_game.first_submit as SemanticAssertion;

		// create a priori deduction
		k_priori = new Deduction();
		k_priori.nobody(`color:${si_player_color}`);
		k_priori.nobody(`shape:${si_player_shape}`);
		k_priori.nobody(si_player_hint);
	}

	let si_assert_basis: CanonicalBasis = A_BASES[0];
	let si_assert_quality: SemanticQuality | '' = '';

	async function reveal_tx(): Promise<void> {
		const s_what = si_assert_quality? use_quality_in_sentence(si_assert_quality): '';

		const s_reveal = H_BASES[si_assert_basis].describe[s_lang](s_what);

		await k_panel.reveal_text(s_reveal);
	}

	function select_basis(g_evt: CustomEvent<CanonicalBasis>) {
		k_panel.submittable(null);

		si_assert_basis = g_evt.detail;

		si_assert_quality = '';

		reveal_tx();
	}

	// reset transmission controls after recovering from an error
	function reset_tx() {
		// reset quality
		si_assert_quality = '';

		// show submit button
		k_panel.submittable(null);

		// show transmission controls
		k_tx.show();

		// reveal basis
		reveal_tx();
	}

	async function select_quality(g_evt: CustomEvent<SemanticQuality>) {
		k_panel.submittable(null);

		si_assert_quality = g_evt.detail;

		// 2nd assertion
		if(si_submit_first) {
			const [, si_quality_first] = si_submit_first.split('|');
			if(si_quality_first === si_assert_quality) {
				si_assert_quality = '';

				await k_panel.arbiter(`You cannot submit a message that would contradict your previous assertion.`);
			}
		}

		const [si_attr, s_value] = si_assert_quality.split(':');

		// create evaluation tag
		let s_tag = 'Unknowable';
		if('nobody_has' === si_assert_basis) {
			if(si_player_hint === si_assert_quality) {
				s_tag = 'Truth';
			}
			else {
				if(('color' === si_attr && s_value === si_player_color)
					|| ('shape' === si_attr && s_value === si_player_shape)
				) {
					s_tag = 'Lie';
				}
			}
		}
		else {
			if(('color' === si_attr && s_value === si_player_color)
				|| ('shape' === si_attr && s_value === si_player_shape)
			) {
				s_tag = 'Truth';
			}
			else {
				s_tag = 'Lie';
			}
		}

		// display assertion
		await reveal_tx();

		// enable option to submit
		k_panel.submittable(async() => {
			// hide transmission controls
			k_tx.hide();

			// lock submit button
			k_panel.submittable(null);

			const g_game = await safe_exec({
				async exec(): Promise<GameStateResponse> {
					return (await k_game.submitAssertion(si_assert_basis, si_assert_quality as SemanticQuality)).data.submit!.game_state!;
				},
				check(g: GameStateResponse): boolean {
					return si_submit_first? null !== g.second_submit: null !== g.first_submit;
				},
				query_fail() {
					// reset tx
					reset_tx();

					void select_quality(g_evt);
					return null;
				},
			});

			if(!g_game) return;

			// commit text to message history
			await k_panel.commit();

			// success
			if(k_countdown_1a) k_countdown_1a.kill();
			if(k_countdown_1b) k_countdown_1b.kill();

			// remove submission button
			k_panel.unsubmittable();

			// player just submitted 2nd assertion
			if(g_game.second_submit) {
				round_1c(g_game);
			}
			// player just submitted 1st assertion
			else {
				round_1b(g_game);
			}
		}, s_tag);
	}



	let k_countdown_1a: Countdown;

	async function round_1a(g_game: GameStateResponse, b_resumed=false): Promise<void> {
		update_player_state(g_game);

		// clear
		await k_panel.reveal_text('');

		// give chip
		await k_panel.arbiter(`Here is your chip, player...`);

		// animate chip
		await k_scene.animate_chip_entry(si_player_color, si_player_shape);

		if(!b_resumed) await timeout(5e3);

		let b_hint_color = si_player_hint.startsWith('color:');

		await k_panel.arbiter(`
			Round 1: I've given you the ${si_player_color} ${si_player_shape} this round, and a hint that nobody has ${b_hint_color? '': 'a '}${si_player_hint.replace(/^[^:]+:/, '')}.

			I've also given your opponent a hint. Theirs is that nobody has a certain ${b_hint_color? 'shape': 'color'}.
		`);

		// resuming
		if(b_resumed) {
			// player already submitted 1st assertion
			if(g_game.first_submit) {
				await k_panel.user(use_assertion_in_sentence(g_game.first_submit));

				// already beyond round 1a; skip ahead
				return round_1b(g_game, b_resumed);
			}
		}
		// not resumed
		else {
			await timeout(4.1e3);
		}

		// countdown timer
		{
			k_countdown_1a = new Countdown({
				eta: new EtaEstimator(g_game.first_round_start_block+''),
				kill_text: 'successfully submitted',
			});

			// final instructions
			await k_panel.arbiter([
				'Now you must choose what to tell the other player. I will reveal both of your messages simultaneously once they both have been submitted. You have {clock_icon}{time_remaining}.',
			], {
				clock_icon: k_countdown_1a.clock,
				time_remaining: k_countdown_1a.store,
			});
		}

		// show transmission controls
		await k_tx.show();

		if(!b_resumed) await timeout(4e3);

		// reveal transmission buttons
		reveal_tx();
	}


	let b_notif_1b_waiting = false;
	let k_countdown_1a2: Countdown;
	let k_countdown_1b: Countdown;

	async function round_1b(g_game: GameStateResponse, b_resumed=false): Promise<void> {
		// update player's local state
		update_player_state(g_game);

		// 
		const {
			opponent_first_submit: si_opponent_assertion,
			first_extra_secret: si_opponent_secret,
		} = g_game;

		// still waiting on the player
		if(!si_opponent_assertion && !si_opponent_secret) {
			if(!b_notif_1b_waiting) {
				b_notif_1b_waiting = true;

				// clear 1a
				if(k_countdown_1a) k_countdown_1a.kill('already submittted');

				// opponent's time remaining
				k_countdown_1a2 = new Countdown({
					eta: new EtaEstimator(g_game.first_round_start_block+''),
					kill_text: 'also submitted theirs',
					terminate: force_endgame,
				});

				// inform
				await k_panel.arbiter([
					'Your submission has been received. Your opponent has {clock_icon}{time_remaining}.',
				], {
					clock_icon: k_countdown_1a2.clock,
					time_remaining: k_countdown_1a2.store,
				});
			}

			// pause
			await timeout(5000);

			// retry
			return round_1b(await k_game.queryGameState());
		}

		// clear 1b
		if(k_countdown_1a2) k_countdown_1a2.kill();
		

		// premise dom
		const dm_premise = dd('span');

		// opponent submitted provably false assertion (lie)
		if(si_opponent_secret) {
			const [si_basis, si_quality] = si_opponent_secret.split('|') as [CanonicalBasis, SemanticQuality];

			const yw_secret = writable('');

			// opponent's hint
			if('nobody_has' === si_basis) {
				// enhance deduction
				k_priori.nobody(si_quality);

				// set widget value
				yw_secret.set(`Your opponent has the hint that "nobody has ${use_quality_in_sentence(si_quality)}".`);
			}
			// opponent's chip
			else {
				// enhance deduction
				k_priori.opponent(si_quality, true);

				// set widget value
				yw_secret.set(`Your opponent has ${use_quality_in_sentence(si_quality)}.`);
			}

			// render premise widget
			new PremiseWidget({
				target: dm_premise,
				props: {
					b_mode_nobody: false,  // phony
					si_assertion: si_quality,  // phony
					si_known: 'true',  // all that matters is that this statement is true
				},
			});
		
			// inform user
			await k_panel.arbiter(`
				The other player tried to deceive you by submitting a false assertion. You would have known it's false given what you know about your chip and your hint.
				
				Instead, I will now reveal to you one of their secrets. They will not know that I have done any of this.

				{secret} {premise}
			`, {
				secret: yw_secret,
				premise: dm_premise,
			});
		}
		// opponent submitted reasonable assertion
		else if(si_opponent_assertion) {
			const [si_basis, si_quality] = si_opponent_assertion.split('|') as [CanonicalBasis, SemanticQuality];

			// prepare opp1 deduction
			let k_opp1 = k_priori.clone();

			// already known?
			const b_known = 'nobody_has' === si_basis && si_quality === si_player_hint;

			// render premise widget
			const yc_premise = new PremiseWidget({
				target: dm_premise,
				props: {
					b_mode_nobody: 'nobody_has' === si_basis,
					si_assertion: si_quality,
					si_known: b_known? 'undeniable': '',
				},
			});

			// premise helper
			const k_premise = yc_premise.k_premise;

			// listen for change to premise
			yc_premise.$on('change', () => {
				f_assert_1 = k_premise.apply;

				// k_opp1 = k_premise.apply(k_priori.clone());

				console.log(`Priori: ${k_priori.explain()}`);
				console.log(`Opp1: ${k_opp1.explain()}`);
				// debugger;
				console.log([k_priori, k_opp1]);
			});

			// make statement
			await k_panel.opponent([
				`${proper(use_assertion_in_sentence(si_opponent_assertion))} {premise}`,
			], {
				premise: dm_premise,
			});
		}
		// assert bad
		else {
			return fatal(`Fatal system error: unable to parse game state`);
		}

		// resuming
		if(b_resumed) {
			// user has already submitted 2nd assertioon
			if(g_game.second_submit) {
				await k_panel.user(use_assertion_in_sentence(g_game.second_submit));

				return round_1c(g_game, b_resumed);
			}
		}
		// not resumed
		else {
			await timeout(4.1e3);
		}

		k_countdown_1b = new Countdown({
			eta: new EtaEstimator(g_game.second_submit_turn_start_block+''),
			kill_text: 'already submitted',
		});

		// final instructions
		const si_basis_force = 'nobody_has' === g_game.first_submit?.split('|')[0]? 'i_have': 'nobody_has';
		await k_panel.arbiter([
			`Both of you must now exchange one more message with each other. This time, I'm requiring you to submit a message about ${'nobody_has' === si_basis_force? 'what "nobody has"': 'your chip'}. You have {clock_icon}{time_remaining}.`,
		], {
			clock_icon: k_countdown_1b.clock,
			time_remaining: k_countdown_1b.store,
		});

		// show transmission controls
		await k_tx.show(si_basis_force);

		// reveal transmission buttons
		reveal_tx();
	}

	
	let b_notif_1c_waiting = false;
	let k_countdown_1b2: Countdown;
	let k_countdown_1c: Countdown;

	let k_countdown_1c2: Countdown;

	async function round_1c(g_game: GameStateResponse, b_resumed=false): Promise<void> {
		// 
		const {
			opponent_second_submit: si_opponent_assertion,
			second_extra_secret: si_opponent_secret,
		} = g_game;

		// still waiting on the player
		if(!si_opponent_assertion && !si_opponent_secret) {
			if(!b_notif_1c_waiting) {
				b_notif_1c_waiting = true;

				// clear 1b2
				if(k_countdown_1b2) k_countdown_1b2.kill();
				
				// opponent's time remaining
				k_countdown_1c = new Countdown({
					eta: new EtaEstimator(g_game.second_submit_turn_start_block+''),
					kill_text: 'also submitted theirs',
					terminate: force_endgame,
				});

				// inform
				await k_panel.arbiter([
					'Your 2nd submission has been received. Your opponent has {clock_icon}{time_remaining}.',
				], {
					clock_icon: k_countdown_1c.clock,
					time_remaining: k_countdown_1c.store,
				});
			}

			// pause
			await timeout(5000);

			// retry
			return round_1c(await k_game.queryGameState());
		}

		// premise dom
		const dm_premise = dd('span');

		// opponent submitted provably false assertion (lie)
		if(si_opponent_secret) {
			const [si_basis, si_quality] = si_opponent_secret.split('|') as [CanonicalBasis, SemanticQuality];

			const yw_secret = writable('');

			// opponent's hint
			if('nobody_has' === si_basis) {
				// enhance deduction
				f_assert_2 = k => k.nobody(si_quality);

				// set widget value
				yw_secret.set(`Your opponent has the hint that "nobody has ${use_quality_in_sentence(si_quality)}".`);
			}
			// opponent's chip
			else {
				// enhance deduction
				f_assert_2 = k => k.opponent(si_quality, true);

				// set widget value
				yw_secret.set(`Your opponent has ${use_quality_in_sentence(si_quality)}.`);
			}

			// render premise widget
			new PremiseWidget({
				target: dm_premise,
				props: {
					b_mode_nobody: false,  // phony
					si_assertion: si_quality,  // phony
					si_known: 'true',  // all that matters is that this statement is true
				},
			});
		
			// inform user
			await k_panel.arbiter(`
				The other player tried to deceive you by submitting a false assertion. You would have known it's false given what you know about your chip and your hint.
				
				Instead, I will now reveal to you one of their secrets. They will not know that I have done any of this.

				{secret} {premise}
			`, {
				secret: yw_secret,
				premise: dm_premise,
			});
		}
		// opponent submitted reasonable assertion
		else if(si_opponent_assertion) {
			// clear 1c
			if(k_countdown_1c) k_countdown_1c.kill();

			const [si_basis, si_quality] = si_opponent_assertion.split('|') as [CanonicalBasis, SemanticQuality];

			// already known?
			const b_known = 'nobody_has' === si_basis && si_quality === si_player_hint;

			// render premise widget
			const yc_premise = new PremiseWidget({
				target: dm_premise,
				props: {
					b_mode_nobody: 'nobody_has' === si_basis,
					si_assertion: si_quality,
					si_known: b_known? 'undeniable': '',
				},
			});

			// premise helper
			const k_premise = yc_premise.k_premise;

			// listen for change to premise
			yc_premise.$on('change', () => {
				f_assert_2 = k_premise.apply;
			});

			// make statement
			await k_panel.opponent([
				`${proper(use_assertion_in_sentence(si_opponent_assertion))} {premise}`,
			], {
				premise: dm_premise,
			});
		}
		// assert bad
		else {
			return fatal(`Fatal system error: unable to parse game state`);
		}

		// resuming
		if(b_resumed) {
			// user has already submitted guess
			if(g_game.guess) {
				await k_panel.user(use_guess_in_sentence(g_game.guess));

				// proceed too next stage
				return round_1d(g_game, b_resumed);
			}
		}

		k_countdown_1c2 = new Countdown({
			eta: new EtaEstimator(g_game.guess_turn_start_block+''),
			kill_text: 'successfully submitted',
		});

		// instruction
		await k_panel.arbiter(`
			The time has come for you to surmise my secrets. You may either guess what is in my bag, what your opponent has, or abstain completely. You have {clock_icon}{time_remaining}.

			The precedence for winning is as follows:
			- [Guess wrong] < [Abstain] < [Correctly guess arbiter's bag] < [Corrrectly guess opponent's chip]

			Use the inline widgets next to each assertion above to logically reduce your option space.
		`, {
			clock_icon: k_countdown_1c2.clock,
			time_remaining: k_countdown_1c2.store,
		});

		// accept guess
		await k_decision.show();

		console.log(g_game);
	}

	async function prepare_guess(g_opt: GuessOption): Promise<void> {
		k_panel.submittable(null);

		await k_panel.reveal_text(use_guess_in_sentence(g_opt), 30);

		k_panel.submittable(async () => {
			// lock submit button
			k_panel.submittable(null);

			// hide decision ui
			k_decision.hide();

			const g_game = await safe_exec({
				async exec(): Promise<GameStateResponse> {
					const g_guess = (await k_game.submitGuess(g_opt)).data.guess!.game_state!
					
					void k_panel.commit();

					return g_guess;
				},
				check(g: GameStateResponse): boolean {
					return null !== g.guess;
				},
				query_fail() {
					k_decision.show();
					void prepare_guess(g_opt);
					return null;
				},
			});

			if(!g_game) return;

			// stop countdown for guess submissioin
			k_countdown_1c2.kill();

			// proceed to final stage
			void round_1d(g_game);
		});
	}

	let b_notif_1d_result = false;
	let b_notif_1d_waiting = false;
	let k_countdown_1d: Countdown;

	async function round_1d(g_game: GameStateResponse, b_resumed=false): Promise<void> {
		const {
			round_result: si_round,
			round: i_round,
			result: si_outcome,
		} = g_game;

		let b_wrong = false;
		

		// notify user about the correctness of their guess
		if(si_round && !b_notif_1d_result) {
			b_notif_1d_result = true;

			const [si_target, si_correctness] = si_round!.split('|') as [CanonicalTarget, 'correct' | 'wrong'];

			if('wrong' === si_correctness) {
				await k_panel.arbiter(`
					Sorry, your guess about ${'opponent' === si_target? `your opponent's chip`: `my bag`} was wrong.
					
					Guessing wrong is the worst because you automatically lose your wager. Consider abstaining next time if you're unsure.
				`);

				b_wrong = true;
			}
			else {
				await k_panel.arbiter(`Nicely done, your guess about ${'opponent' === si_target? `your opponent's chip`: `my bag`} was correct!`);
			}
		}

		// still waiting on other player
		if(!g_game.opponent_guess) {
			if(!b_notif_1d_waiting) {
				b_notif_1d_waiting = true;

				k_countdown_1d = new Countdown({
					eta: new EtaEstimator(g_game.guess_turn_start_block+''),
					kill_text: 'now submitted',
					terminate: force_endgame,
				});

				await k_panel.arbiter(`${b_wrong? 'Even though you lost': 'However'}, I am still waiting for a guess from your opponent. They have {clock_icon}{time_remaining}.`, {
					clock_icon: k_countdown_1d.clock,
					time_remaining: k_countdown_1d.store,
				});
			}

			// pause
			await timeout(5000);

			// retry
			return round_1d(await k_game.queryGameState());
		}

		// kill countdowns
		if(k_countdown_1d) k_countdown_1d.kill();

		// remove chip ui
		si_player_hint = '' as SemanticQuality;
		void k_scene.animate_chip_exit();

		// debug
		console.log('round_1d#over', g_game);

		// game is over
		if(g_game.finished) {
			// opponent guess
			if(g_game.opponent_round_result) {
				// summarize opponent's action
				const {
					opponent_round_result: si_opp_round,
					opponent_guess: si_opp_guess,
				} = g_game;

				const [si_opp_guess_target, si_opp_guess_color, si_opp_guess_shape] = si_opp_guess!.split(/\|/g);
				const [, si_opp_correctness] = si_opp_round!.split('|');

				let s_opp_summary = '';
				let b_opp_wrong = false;
				if('abstain' === si_opp_guess_target) {
					s_opp_summary = 'abstained from guessing';
				}
				else {
					const si_color = si_opp_guess_color.split(':')[1] as CanonicalColor;
					const si_shape = si_opp_guess_shape.split(':')[1] as CanonicalShape;

					const s_guess = H_COLORS[si_color].labels[s_lang]+' '+H_SHAPES[si_shape].labels[s_lang];
					
					b_opp_wrong = 'correct' !== si_opp_correctness;

					s_opp_summary = `${b_opp_wrong? 'wrongly': 'correctly'} guessed that ${'bag' === si_opp_guess_target? 'my bag': 'your chip'} is the ${s_guess}`;
				}

				if('you lost wager' === si_outcome) {
					const s_opponent_prelude = b_opp_wrong
						? `But you'll be happy to know that your opponent`
						: 'Your opponent';

					await k_panel.arbiter([
						`${b_wrong? 'As you already know': 'Bad news'}, you lost your wager. ${s_opponent_prelude} ${s_opp_summary}, so they ${b_opp_wrong? 'also lost their wager': 'won the game and gained your lost wager'}.`,
					]);

					await timeout(9e3);

					return game_over();
				}
				else if('you won wager' === si_outcome) {
					const xg_wager = BigInt(g_game.wager!);
					const s_wager = uscrt_to_scrt(xg_wager);
					const s_total = uscrt_to_scrt(xg_wager * 2n);

					await k_panel.arbiter(`
						Congratulations, you won! Your opponent ${s_opp_summary}, so they lost their wager.
						
						I have refunded you your original ${s_wager} plus an extra ${s_wager} from your opponent's wager for a total of ${s_total}.
					`);

					await timeout(9e3);

					return game_over();
				}
				else {
					await k_panel.arbiter([
						`Well done. You and your opponent have tied, so you both can claim a reward. They ${s_opp_summary}.`,
					]);

					if(!b_resumed) await timeout(4e3);
				}
			}
			// early exit
			else {
				return fatal(`Somebody terminated the game.`);
			}
		}
		else {
			if(3 === g_game.round) {
				void round_3a(g_game, b_resumed);
			}
			else {
				return fatal(`Game is not finished but round is ${g_game.round}.`);
			}
		}
	}


	let b_notif_3a_waiting = false;
	let k_countdown_3a: Countdown;

	async function round_3a(g_game: GameStateResponse, b_resumed=false): Promise<void> {
		k_countdown_3a = new Countdown({
			eta: new EtaEstimator(g_game.pick_reward_round_start_block!+''),
			kill_text: 'made your decision'
		});

		await k_panel.arbiter(`
			Congratulations on passing round 1 together! I have two rewards to choose from, a jackpot of SCRT, or an NFT that can be used to give you special powers next time you play.

			However, if you both attempt to claim the same prize, then neither of you will take it. You will only be able to take a reward if you and your opponent claim different things.

			You have {clock_icon}{time_remaining}.
		`, {
			clock_icon: k_countdown_3a.clock,
			time_remaining: k_countdown_3a.store,
		});

		// user already picked
		if(g_game.pick) {
			return round_3b(g_game, true);
		}

		// show pick options
		k_pick.show();
	}

	async function select_pick(g_evt: CustomEvent<PickOption>) {
		const {detail:si_pick} = g_evt;

		k_panel.submittable(null);

		await k_panel.reveal_text(`i pick the ${si_pick}`);

		k_panel.submittable(async() => {
			// hide pick ui
			k_pick.hide();

			const g_game = await safe_exec({
				async exec(): Promise<GameStateResponse> {
					const g_guess = (await k_game.pickReward(si_pick)).data.pick_reward!.game_state!
					
					void k_panel.commit();

					return g_guess;
				},
				check(g: GameStateResponse): boolean {
					return null !== g.pick;
				},
				query_fail() {
					k_pick.show();
					void select_pick(g_evt);
					return null;
				},
			});

			if(!g_game) return;

			round_3b(g_game);
		});
	}
	
	let k_countdown_3b: Countdown;
	let b_notif_3b_waiting = false;
	
	async function round_3b(g_game: GameStateResponse, b_resumed=false): Promise<void> {
		// clear 3a
		if(k_countdown_3a) k_countdown_3a.kill();

		// 
		const {
			result: si_outcome,
		} = g_game;

		// still waiting on the player
		if(!si_outcome) {
			if(!b_notif_3b_waiting) {
				b_notif_3b_waiting = true;
				
				// opponent's time remaining
				k_countdown_3b = new Countdown({
					eta: new EtaEstimator(g_game.pick_reward_round_start_block+''),
					kill_text: 'also picked theirs',
					terminate: force_endgame,
				});

				// inform
				await k_panel.arbiter([
					'Your pick has been noted. Your opponent has {clock_icon}{time_remaining}.',
				], {
					clock_icon: k_countdown_3b.clock,
					time_remaining: k_countdown_3b.store,
				});
			}

			// pause
			await timeout(5000);

			// retry
			return round_3b(await k_game.queryGameState());
		}
		// results
		else {
			switch(si_outcome) {
				case 'you won jackpot': {
					await k_panel.arbiter(`
						Fortune favors the bold! Your opponent picked the NFT, and you have successfully claimed the jackpot of ${uscrt_to_scrt(BigInt(g_game.jackpot_reward || '0'))}!
					`);
					break;
				}

				case 'you won nft': {
					await k_panel.arbiter(`
						Wise move. While your opponent chose the short-term gain, you see the long-term potential. You have successfully claimed an NFT.
					`);
					break;
				}

				case 'you lost reward': {
					// both players tried to pick jackpoot
					if('jackpot' === g_game.pick) {
						await k_panel.arbiter(`
							Greed has spoiled your riches. Both players attempted to claim the jackpot, so you both shall leave empty-handed.
						`);
					}
					// both tried to pick nft
					else {
						await k_panel.arbiter(`
							An unlucky pick. Both players attempted to claim the NFT, so you both shall leave empty-handed.
						`);
					}

					break;
				}
			}

			await timeout(9e3);

			return game_over();
		}

	}


	function use_guess_in_sentence(z_opt: GuessOption | SemanticGuess): string {
		let g_opt: GuessOption;

		if('string' === typeof z_opt) {
			g_opt = Object.fromEntries(z_opt.split(/\|/g).map(si => si.split(':')));
		}
		else {
			g_opt = z_opt;
		}

		if('abstain' === g_opt.target) {
			return `i abstain from guessing this round`;
		}
		else {
			let s_guess = '';
			if('bag' === g_opt.target) {
				s_guess += `the arbiter's bag is: a `;
			}
			else {
				s_guess += `my opponent's chip is: a `;
			}

			return s_guess+H_COLORS[g_opt.color].labels[s_lang]+' '+H_SHAPES[g_opt.shape].labels[s_lang];
		}
	}


	async function select_abstain() {
		prepare_guess({
			target: 'abstain',
			color: null,
			shape: null,
		});
	}

	async function select_decision({detail:g_opt}: CustomEvent<CanonicalGuessOption>) {
		prepare_guess(g_opt);
	}


	let b_burn_clicked = false;
	function burn() {
		if(!b_burn_clicked) {
			b_burn_clicked = true;
			k_panel.error(`The button you just clicked will remove all cookies and cache that the game previously created and then disable the current UI. If you agree to this, click the burn icon again.`);
		}
		else {
			Object.keys(read_cookie()).forEach(si => delete_cookie(si));
			localStorage.clear();
			k_panel.reveal_text('');
			return fatal(`Cache burned`);
		}
	}
</script>

<style lang="less">
	@import './common.less';

	.container {
		position: relative;
	}

	.mine {
		position: absolute;
		width: 400px;
		text-align: center;
		background-color: fade(white, 5%);
		padding: 7px 22px;
		font-family: 'Roboto Mono';
		border-radius: 5px;
		left: calc(50% - 200px);
		box-sizing: border-box;
		top: 105px;
		color: white;
		font-size: 15px;

		.chip {
			font-size: 1.6em;
			transform: scaleY(0.85);
			letter-spacing: -2.5px;
		}

		.hint {
			.hint-prefix {
				color: fade(white, 90%);
			}
		}
	}

	.system-controls {
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
		margin-top: 4px;
		color: fade(white, 70%);

		&>* {
			cursor: pointer;
		}

		&>*:nth-child(n+2) {
			margin-left: 0.5em;
		}
	}

	@keyframes surprise {
		0% {
			visibility: visible;
		}
		33% {
			visibility: hidden;
		}
		66% {
			visibility: hidden;
		}
		100% {
			visibility: visible;
		}
	}

	.surprise {
		width: 100%;
		margin-top: -300px;
		position: fixed;
		z-index: 2;
		visibility: visible;
		transition: opacity 3s @ease-out-expo;
		opacity: 1.0;
		pointer-events: none;

		img {
			width: 100%;
		}

		&:not(.triggered) {
			visibility: hidden;
		}
	}

	:global(.triggered) {
		animation: surprise 100ms steps(4, jump-none) 2;
	}

</style>

<div class="system-controls">
	<span class="system-controls-audio" alt="audio" on:click={() => b_muted = !b_muted}>
		<Fa icon={b_muted? faVolumeMute: faVolumeUp} />
	</span>
	{#if (h_cookie && Object.keys(h_cookie).length) || localStorage.length}
		<span class="system-controls-burn" alt="destroy cookies and cache" on:click={() => burn()} transition:fade={{duration:1e3}}>
			<Fa icon={faFire} />
		</span>
	{/if}
</div>

<MessagePanel bind:k_panel {k_killables} />


<div class="surprise" bind:this={dm_surprise}>
	<img src="/asset/smile.png" alt="evil smile" />
</div>

<div class="container">
	<Prompt bind:k_prompt />

	<Assertion bind:k_tx on:basis={select_basis} on:quality={select_quality} />

	<Decision bind:k_decision {k_deduced} on:abstain={select_abstain} on:change={select_decision} />

	{#if si_player_hint}
		<div class="mine" in:blur={{duration:2.4e3, easing:quadInOut, delay:4.5e3}} out:blur={{duration:2.4e3, easing:quadInOut}}>
			<div class="chip">
				The {proper(si_player_color)} {proper(si_player_shape)}
			</div>
			<div class="hint">
				<span class="hint-prefix">Hint:</span>
				<span class="hint-sentence">
					{proper(use_assertion_in_sentence(`nobody_has|${si_player_hint}`))}
				</span>
			</div>
		</div>
	{/if}

	<Pick bind:k_pick on:pick={select_pick} />

	<Scene bind:k_scene />

</div>
