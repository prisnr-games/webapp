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
		// await timeout(2000);

		// // grab user attention
		// await reveal_prepared('attention');

		// // beat
		// await timeout(1800);

		// // clear
		// await k_panel.reveal_text('');

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
		await timeout(1500);

		// // loading messages
		// await reveal_prepared('loading');

		si_player_color = Object.keys(H_COLORS)[Math.floor(Math.random() * 4)];
		si_player_shape = Object.keys(H_SHAPES)[Math.floor(Math.random() * 4)];

		// give chip
		await k_panel.receive({
			from: 'Arbiter',
			text: [
				`Here is your chip, player.`,
			],
		});

		// clear
		await k_panel.reveal_text('');

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

	});

</script>

<style lang="less">
	.container {
		position: relative;

		.tx-basis {
			position: absolute;
			top: 0;
			left: 50% - 200px;
			width: 400px;
			display: flex;

			li {
				// flex

				.active {
					border: 1px solid #777777;
					background: linear-gradient();
				}
			}
		}
	}

	.tx-colors {
		position: absolute;
		left: calc(50% - 420px);
		top: 80px;
	}

	.diamond {
		@diamond-radius: 9px;
		@cell-length: 50px;
		@cell-scale-x: 1.2;

		transform: scaleX(@cell-scale-x) rotate(45deg);
		display: table;

		&>span {
			display: table-row;
			width: @cell-length * 2;
			height: @cell-length;

			&:last-child {
				position: relative;
				top: -1px;
			}

			&>button {
				display: table-cell;
				width: @cell-length;
				height: @cell-length;
				border: 1px solid black;
				margin: 0;
				color: white;
				cursor: pointer;

				&:active {
					color: rgba(255, 255, 255, 0.6);
				}

				&:active>* {
					text-decoration-color: white !important;
				}

				&:hover>* {
					text-decoration: overline;
					text-decoration-thickness: 2px;
					text-decoration-color: rgba(255, 255, 255, 0.6);
				}

				&:last-child {
					margin-left: -1px;
				}

				&.diamond-top {
					border-top-left-radius: @diamond-radius;
				}
				&.diamond-lft {
					border-bottom-left-radius: @diamond-radius;
				}
				&.diamond-rgt {
					border-top-right-radius: @diamond-radius;
				}
				&.diamond-btm {
					border-bottom-right-radius: @diamond-radius;
				}

				&.color-red {
					background: #a00000;
					background: linear-gradient(0deg, #d00000 0%, #a00000 100%);
				}
				&.color-green {
					background: #008000;
					background: linear-gradient(0deg, #00b000 0%, #008000 100%);
				}
				&.color-blue {
					background-color: #0000a0;
					background: linear-gradient(0deg, #0000d0 0%, #0000a0 100%);
				}
				&.color-black {
					background-color: #000000;
					background: linear-gradient(0deg, #303030 0%, #000000 100%);
				}

				&>span {
					width: @cell-length;
					display: inline-block;
					transform: translate(-7px, 0) rotate(-45deg) scaleX((1 / @cell-scale-x));
				}
			}
		}
	}
</style>

<MessagePanel bind:k_panel>
	
</MessagePanel>

<div class="container">
	<ul class="tx-basis">
		<li>My chip is</li>
		<li>The bag is NOT</li>
	</ul>

	<span class="diamond tx-colors" style="display:none">
		<span>
			<button class="diamond-top color-red">
				<span>Red</span>
			</button>
			<button class="diamond-rgt color-blue">
				<span>Blue</span>
			</button>
		</span>
		<span>
			<button class="diamond-lft color-green">
				<span>Green</span>
			</button>
			<button class="diamond-btm color-black">
				<span>Black</span>
			</button>
		</span>
	</span>

	<Scene bind:k_scene>

	</Scene>
</div>
