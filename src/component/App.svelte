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
		microtask,
		oder, timeout,
	} from '#/util/belt';

	import type { MessagePanelHelper } from './MessagePanel.svelte';

	import MessagePanel from './MessagePanel.svelte';
	import Scene, { SceneHelper } from './Scene.svelte';
import TransmissionControls, { TransmissionControlsHelper } from './TransmissionControls.svelte';

	// Added by Ben -- connecting to keplr needs polyfills
	//
	import { keplrStore } from '#/network/keplr';
	import type { KeplrStore } from '#/network/keplr';
	let keplr: KeplrStore;
	onMount( async () => {
		await keplrStore.connect();
		console.log("Keplr connected");
		keplrStore.subscribe((value: KeplrStore) => {
			keplr = value;
		});
	});
	$: scrtAuthorized = keplr && keplr.scrtAuthorized
	//
	//

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
	 * helper instance for communicating with TransmissionControls
	 */
	let k_tx: TransmissionControlsHelper;


	async function reveal_prepared(si_which: string) {
		// loading messages
		for(const g_msg of H_MESSAGES[si_which]) {
			if(g_msg.delay) await timeout(g_msg.delay);
			await k_panel.reveal_text(g_msg.labels[s_lang], g_msg.interval, g_msg.pause);
		}
	}

	let si_player_color: CanonicalColor;
	let si_player_shape: CanonicalShape;

	onMount(async() => {
		await timeout(2000);

		// grab user attention
		await reveal_prepared('attention');

		// beat
		await timeout(1800);

		// clear
		await k_panel.reveal_text('');

		// beat
		await timeout(1200);

		// gameplay explanation
		await k_panel.receive({
			from: 'Arbiter',
			text: `
				Welcome, player, to my game of secrets.

				Four colors: Red, Green, Blue and Black. Four shapes: Triangle, Square, Circle and Star.

				Me, you and one other player. Each of us has a unique color and a unique shape.
			`.trim().split(/\n/).map(s => s.trim()),
		});

		// beat
		await timeout(4600)

		si_player_color = Object.keys(H_COLORS)[Math.floor(Math.random() * 4)];
		si_player_shape = Object.keys(H_SHAPES)[Math.floor(Math.random() * 4)];

		// clear
		await k_panel.reveal_text('');

		// give chip
		await k_panel.receive({
			from: 'Arbiter',
			text: [
				`Here is your chip, player.`,
			],
		});

		// animate chip
		await k_scene.animate_chip_entry(si_player_color, si_player_shape);

		await timeout(4500);

		await k_panel.receive({
			from: 'Arbiter',
			text: [
				`I've given you the ${si_player_color} ${si_player_shape} this round.`,
			],
		})

		await timeout(3600);

		await k_panel.receive({
			from: 'Arbiter',
			text: [
				'Will you and the other player cooperate to deduce what is in my bag? Or will you attempt to deceive one another? Guess wrong and lose your wager. Guess right and be rewarded.',
			],
		});

		await timeout(6800);

		await k_panel.receive({
			from: 'Arbiter',
			text: [
				'Now you must choose what to tell the other player.',
			],
		});

		await k_tx.show();

		await timeout(4000);

		reveal_tx();
	});

	let si_basis = 'the bag cannot be';
	let s_quality = '';

	function reveal_tx() {
		k_panel.reveal_text(`${si_basis} ${s_quality || '...'}`);
	}

	function select_basis(g_evt: CustomEvent<'bag' | 'chip'>) {
		if('bag' === g_evt.detail) {
			si_basis = 'the bag cannot be';
		}
		else {
			si_basis = 'my chip is';
		}

		s_quality = '';

		reveal_tx();
	}

	function select_color(g_evt: CustomEvent<CanonicalColor | CanonicalShape>) {
		s_quality = g_evt.detail;

		reveal_tx();
	}

	function select_shape(g_evt: CustomEvent<CanonicalColor | CanonicalShape>) {
		s_quality = `a ${g_evt.detail}`;

		reveal_tx();
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
	<TransmissionControls bind:k_tx on:basis={select_basis} on:color={select_color} on:shape={select_shape}>

	</TransmissionControls>

	<Scene bind:k_scene>

	</Scene>
</div>
