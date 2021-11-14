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
		A_COLORS,
		A_SHAPES,
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
	import Scene from './Scene.svelte';

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

	async function reveal_prepared(si_which: string) {
		// loading messages
		for(const g_msg of H_MESSAGES[si_which]) {
			if(g_msg.delay) await timeout(g_msg.delay);
			await k_panel.reveal_text(g_msg.labels[s_lang], g_msg.interval);
		}
	}

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

				Will you and the other player cooperate to deduce what is in my bag? Or will you attempt to deceive one another? Guess wrong and lose your wager. Guess right and be rewarded.
			`.trim().split(/\n/).map(s => s.trim()),
		});

		// beat
		await timeout(1500);

		// loading messages
		await reveal_prepared('loading');
	});

</script>


<MessagePanel bind:k_panel>
	
</MessagePanel>

<Scene></Scene>
