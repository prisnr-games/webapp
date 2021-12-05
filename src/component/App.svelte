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
	} from '#/util/belt';

	import {
		Deduction,
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
	

	import {
		Permit,
		PermitParams,
		SI_PERMIT,
	} from '#/network/permits';

	import {
		ContractError,
		ContractExecInfo,
		GameContract,
		GameStateResponse,
		JoinResponse,
		P_CONTRACT_ADDR,
		QueryGameStateResponse,
		SI_CONTRACT_CODE_HASH,
	} from '#/network/contract';

	import {
		EncryptedLocalStorage,
	} from '#/util/encrypted-local-storage';
import ActionWidget from './ActionWidget.svelte';


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
	 * wallet instance
	 */
	let k_wallet: Wallet;

	
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

	let si_player_color: CanonicalColor;
	let si_player_shape: CanonicalShape;
	let si_player_hint: SemanticQuality;

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
		await timeout(2500);
	}

	async function connect_wallet(n_retries=0): Promise<void> {
		// 
		await k_panel.warn(`
			This game stores encrypted query permit data in local storage.
			
			In order to protect this data, you must provide a passphrase each time the page is loaded.
		`);

		async function enter_passphrase(c_retries=0): Promise<string> {
			// whether it was clicked (before instruction)
			let b_clicked = false;

			// first attempt
			if(!c_retries) {
				// wait for button to fade in a little
				setTimeout(() => {
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
		const k_ls = new EncryptedLocalStorage(p_signer, [p_fingerprint, s_passphrase, 'salt'].join('|'));

		// try to fetch any existing permits
		let h_permits: Record<string, Permit> | null = null;
		try {
			h_permits = k_ls.get<Record<string, Permit>>('permits');
		}
		catch(e_decrypt: unknown) {
			k_panel.warn('Change in passphrase detected. Clearing old query perrmits.');
			k_ls.clear();
		}

		await timeout(1000);

		let b_restored_permit = false;

		// permit exists for this contract
		if(h_permits && h_permits[P_CONTRACT_ADDR]) {
			g_permit = h_permits[P_CONTRACT_ADDR];

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
						allowed_tokens: [P_CONTRACT_ADDR],
						permit_name: SI_PERMIT,
						permissions: ['owner'],
					} as PermitParams,
					signature: await k_wallet.signQueryPermit(),
				};

				// append
				k_ls.set('permits', {
					...(h_permits || {}),
					[P_CONTRACT_ADDR]: g_permit,
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
					const s_status = await Notification.requestPermission();

					if('denied' === s_status) {
						k_panel.warn(`User denied request for notification permission.`);
					}
				});

				// prompt for notifications
				k_panel.warn(`Would you like to receive a notification once another player has joined? {approve}`, {
					approve: dm_approve,
				});
			}
		}

		let xt_checked = Date.now();
		let i_checking = setInterval(() => {
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
		clearInterval(i_checking);

		// clear last checked widget text
		yw_checked.set('');

		// start alarm
		H_AUDIO.retro_game_alarm.play();

		return g_game_query;
	}

	const A_SPIN = ['◜ ◝', ' ˉ◞', ' ˍ◝', '◟ ◞', '◜ˍ ', '◟ˉ '];
	async function spinner(s_loading: string): Promise<number> {
		await k_panel.reveal_text(s_loading+' ');

		let i_spin = 0;
		return window.setInterval(() => {
			k_panel.reveal_text(s_loading+' '+A_SPIN[i_spin++]+' ', 5);
			i_spin %= A_SPIN.length;
		}, 200);
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

	let b_surprise = false;
	let dm_surprise: HTMLElement;

	onMount(async() => {
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
		k_game = new GameContract(k_wallet, P_CONTRACT_ADDR, g_permit);

		// a game was started
		if(h_cookie.game) {
			const i_spinning = await spinner('checking for active game...');

			// check for active game
			let g_game_contd!: GameStateResponse | undefined;
			try {
				g_game_contd = await k_game.queryGameState();
			}
			catch(e_query) {
				debugger;
			}
			finally {
				clearInterval(i_spinning);

				// clear
				k_panel.reveal_text('');
			}

			// continue game
			if(g_game_contd) {
				k_panel.warn(`Successfully resumed active game.`);

				let g_game: GameStateResponse = g_game_contd;

				if(0 === g_game_contd.round) {
					g_game = await wait_for_other_player(true);
				}

				if(1 === g_game.round) {
					return round_1(g_game, true);
				}
			}
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

		// ask if ready to join
		await k_panel.reveal_text('ready to play?');

		// join a game
		await k_prompt.ok('Join a game');

		// while transaction is verified
		let i_spinning = 0;
		
		// wait
		spinner('waiting for transaction to be verified... ').then(i => i_spinning = i);

		// attempt to join
		let g_join: ContractExecInfo<JoinResponse>;
		try {
			g_join = await k_game.joinGame();
		}
		// failed
		catch(e_join: unknown) {
			clearInterval(i_spinning);

			// error
			if(e_join instanceof Error) {
				const se_join = e_join.message;

				// no scrt
				if(/Account does not exist/.test(se_join)) {
					return fatal(`Looks like your wallet is empty. Make sure to acquire some SCRT tokens so that you can pay the gas fees for transactions.`);
				}
				// already in active game
				else if(/must finish current game/.test(se_join)) {
					write_cookie({
						game: 'started',
					}, 12*XTL_HOURS);

					return fatal(`Looks like you changed browsers since you last joined a game with this account. Please reload and the game will attempt to resume.`);
				}
				// contract not found
				else if(/contract not found/i.test(se_join)) {
					return fatal(`Contract not found! Are you on the right network?`);
				}
				// unhandled
				else {
					debugger;
					return fatal(`Unhandled error: ${e_join.stack}`);
				}
			}
			// unknown
			else {
				return fatal(`Unknown error: ${e_join}`);
			}
		}

		clearInterval(i_spinning);

		// clear prompt
		k_panel.reveal_text('');


		// destructure join results
		const {
			join: g_res_join,
			error: se_join,
		} = g_join.data;

		// error
		if(se_join) {
			return fatal(se_join);
		}

		// 
		const g_game_join = g_res_join?.game_state;
		let g_game = g_game_join!;

		// must wait for another player
		if(g_game_join?.round) {
			// record that a game was started
			write_cookie({
				game: 'started',
			}, 12*XTL_HOURS);

			// wait for other player
			g_game = await wait_for_other_player();
		}

		// ready to play round 1
		if(1 === g_game.round) {
			return round_1(g_game);
		}
	});


	async function round_1(g_game: GameStateResponse, b_resumed=false): Promise<void> {
		si_player_color = g_game.chip_color!.split(':')[1] as CanonicalColor;
		si_player_shape = g_game.chip_shape!.split(':')[1] as CanonicalShape;
		si_player_hint = g_game.hint?.split('|')[1] as SemanticQuality;

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

		if(!b_resumed) await timeout(4.1e3);

		const xt_eta = Date.now() + (10 * XTL_MINUTES);
		const yw_time = writable('10m 00s');

		setInterval(() => {
			const xtl_diff = xt_eta - Date.now();
			const n_secs = Math.max(0, Math.floor(xtl_diff / XTL_SECONDS));
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
				'Now you must choose what to tell the other player. I will reveal both of your messages simultaneously once they both have been submitted. You have {clock_icon}{time_remaining} remaining.',
			], {
				clock_icon: dm_clock,
				time_remaining: yw_time,
			});

			// show transmission controls
			await k_tx.show();

			if(!b_resumed) await timeout(4e3);

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
			k_priori.nobody(si_player_hint);

			// prepare opp1 deduction
			let k_opp1 = k_priori.clone();

			// premise dom
			const dm_premise = dd('span');

			// render premise widget
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

	async function select_quality(g_evt: CustomEvent<SemanticQuality>) {
		k_panel.submittable(null);

		si_assert_quality = g_evt.detail;

		const [si_attr, s_value] = si_assert_quality.split(':');

		let s_tag = 'Unknowable';
		if('nobody' === si_assert_basis) {
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

		await reveal_tx();

		k_panel.submittable(() => {
			// hide transmission controls
			k_tx.hide();

			// remove submission button
			k_panel.unsubmittable();

			// commit text to message history
			k_panel.commit();
		}, s_tag);
	}

	let b_clicked = false;
	function burn() {
		if(!b_clicked) {
			b_clicked = true;
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
	<span class="system-controls-burn" alt="destroy cookies and cache" on:click={() => burn()}>
		<Fa icon={faFire} />
	</span>
</div>

<MessagePanel bind:k_panel>
	
</MessagePanel>


<div class="surprise" bind:this={dm_surprise}>
	<img src="/asset/smile.png" alt="evil smile" />
</div>

<div class="container">
	<Prompt bind:k_prompt>

	</Prompt>

	<Assertion bind:k_tx on:basis={select_basis} on:quality={select_quality}>

	</Assertion>

	{#if si_player_hint}
		<div class="mine" transition:blur={{duration:2.4e3, easing:quadInOut, delay: 4.5e3}}>
			<div class="chip">
				The {proper(si_player_color)} {proper(si_player_shape)}
			</div>
			<div class="hint">
				<span class="hint-prefix">Hint:</span>
				<span class="hint-sentence">
					Nobody has {use_quality_in_sentence(si_player_hint)}
				</span>
			</div>
		</div>
	{/if}

	<Scene bind:k_scene>

	</Scene>

</div>
