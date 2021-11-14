<script context="module" lang="ts">
	export interface MessagePanelHelper {
		reveal_text(s_reveal: string, xt_interval?: number): Promise<void>;
		commit(): Promise<void>;
		receive(g_msg: ReceivedMessage): Promise<void>;
	}

	export interface ReceivedMessage {
		from: string;
		text: string[];
	}
</script>

<script lang="ts">
	import {
		getContext
	} from 'svelte';

	import { A_COLORS, SupportedLanguage } from '#/intl/game';

	import {
		microtask,
		oder, timeout,
	} from '#/util/belt';

	import type {
		GameContext,
	 } from './App.svelte';
import { dd } from '#/util/dom';
import App from './App.svelte';

	// game context
	const {
		language: ys_lang,
	} = getContext('game') as GameContext;

	// language
	let s_lang: SupportedLanguage;

	// subscribe to updates from store
	ys_lang.subscribe(s_lang_set => s_lang = s_lang_set);

	// export helper
	export let k_panel: MessagePanelHelper = {
		reveal_text,
		commit,
		receive,
	};

	/**
	 * msg-history
	 */
	let dm_history: HTMLDivElement;

	/**
	 * cursor character
	*/
	let s_cursor = '❚';

	/**
	 * msg text
	*/
	let s_text = '';

	let dm_cursor: HTMLElement;

	async function reveal_text(s_reveal: string, xt_interval=60) {
		if(!xt_interval) xt_interval = 60;

		const nl_text = s_text.length;
		const nl_reveal = s_reveal.length;

		let i_shared = 0;
		for(; i_shared<Math.min(nl_text, nl_reveal); i_shared++) {
			if(s_text[i_shared] !== s_reveal[i_shared]) break;
		}

		const xr_delete = 3 / 5;
		for(let i_delete=nl_text; i_delete>i_shared; i_delete--) {
			s_text = s_text.slice(0, -1);
			await timeout(xt_interval * xr_delete);
		}

		for(let i_char=i_shared; i_char<nl_reveal; i_char++) {
			dm_cursor.classList.remove('blinking');
			await timeout(10);
			dm_cursor.classList.add('blinking');

			s_text += s_reveal[i_char];

			await timeout(xt_interval);
		}
	}

	async function receive(g_msg: ReceivedMessage): Promise<void> {
		const dm_line = dd('div', {
			class: [
				'line-commit',
				...('Arbiter' === g_msg.from? ['from-arbiter']: []),
			].join(' '),
		}, [
			`> ${g_msg.from}: `,
			...g_msg.text.flatMap(s => [s, dd('br')]),
		]);

		const dm_curtain = dd('div', {
			class: 'curtain',
		});

		dm_history.append(dm_line);
		dm_history.append(dm_curtain);

		const g_rect_parent = dm_history.getBoundingClientRect();
		const g_rect_line = dm_line.getBoundingClientRect();

		const x_top = g_rect_line.top - g_rect_parent.top;
		const x_height = g_rect_line.height + 5;

		Object.assign(dm_curtain.style, {
			top: `${x_top}px`,
			height: `${x_height}px`,
			left: '0px',
			width: '100%',
		});

		await timeout(100);

		for(let x_gap=0; x_gap<x_height; x_gap+=5) {
			Object.assign(dm_curtain.style, {
				top: `${x_top + x_gap}px`,
				height: `${x_height - x_gap}px`,
			});
			await timeout(120);
		}

		// dm_curtain.remove();
	}

	async function commit(): Promise<void> {
		dm_history.append(dd('div', {
			class: 'line-commit',
		}, [
			`> Arbiter: ${s_text}`,
		]));

		s_text = '';
	}


</script>

<style lang="less">

	@keyframes blink {
		from {
			opacity: 1.0;
		}
		to {
			opacity: 0.05;
		}
	}

	@console-border: 8px;
	.console-bg() {
		background-color: #141414;
	}

	.blinking {
		animation: blink 0.4s infinite 100ms;
	}

	.msg-panel {
		margin-top: 20px;
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;

		color: rgb(60, 215, 60);
		font-family: 'Roboto Mono';

		border: 2px dashed rgba(60, 215, 60, 0.4);
		border-radius: 11px;
		padding: 4px;
	}

	.msg-history {
		.console-bg();
		border-radius: @console-border @console-border 0 0;

		height: 250px;
		position: relative;
		font-size: 12px;
		padding: 8px;

		display: flex;
		justify-content: flex-end;
		flex-direction: column;

		line-height: 14px;

		:global(.line-commit) {
			text-indent: -14px;
			padding-left: 14px;
		}

		:global(.from-arbiter) {
			color: rgb(190, 280, 190);
		}

		:global(.curtain) {
			position: absolute;
			.console-bg();
		}
	}

	.msg-console {
		.console-bg();
		border-radius: 0 0 @console-border @console-border;

		font-size: 28px;
		padding: 6px;

		.text {
			font-size: 22px;
		}
	
		.cursor {
			position: absolute;
		}
	}

	.msg-buttons {
	}
</style>

<div class="msg-panel">
	<div class="msg-history" bind:this={dm_history}>
	</div>
	<div class="msg-console">
		<span class="text">&gt;&nbsp;{s_text}</span>
		<span class="cursor blinking" bind:this={dm_cursor}>{s_cursor}</span>
	</div>
</div>
