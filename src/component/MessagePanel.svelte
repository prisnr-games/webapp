<script context="module" lang="ts">
	import type { Writable } from 'svelte/store';

	export type Widgets = Record<string, Writable<string> | HTMLElement>;

	export interface AddrInfo {
		name: string;
		addr: string;
		ledger?: boolean;
	}

	export interface MessagePanelHelper {
		reveal_text(s_reveal: string, xt_interval?: number, xt_pause?: number): Promise<void>;
		commit(): Promise<void>;
		receive(g_msg: ReceivedMessage): Promise<void>;
		arbiter(z_text: string | string[], h_widgets?: Widgets): Promise<void>;
		opponent(a_text: string[], h_widgets?: Widgets): Promise<void>;
		error(s_text: string, b_fatal?: boolean): Promise<void>;
		wallet(g_addr: AddrInfo): void;
		submittable(fk_submit: VoidFunction | null): void;
		unsubmittable(): void;
	}

	export interface ReceivedMessage {
		from: string;
		classes?: string[];
		text: string[];
		widgets?: Widgets;
	}
</script>

<script lang="ts">
	import {
		getContext,
		onMount
	} from 'svelte';

	import {
		slide,
		blur,
	} from 'svelte/transition';

	import {
		quadOut,
	} from 'svelte/easing';

	import Fa from 'svelte-fa';

	import {
		faUser,
		faWallet,
	} from '@fortawesome/free-solid-svg-icons';
	
	import {
		faPaperPlane,
	} from '@fortawesome/free-regular-svg-icons';

	import type {
		SupportedLanguage,
	} from '#/intl/game';

	import {
		microtask,
		ode,
		oder, timeout,
	} from '#/util/belt';

	import type {
		GameContext,
	 } from './App.svelte';

	import { dd, qsa } from '#/util/dom';

	// game context
	const {
		language: ys_lang,
	} = getContext('game') as GameContext;

	// language
	let s_lang: SupportedLanguage;

	// subscribe to updates from store
	ys_lang.subscribe(s_lang_set => s_lang = s_lang_set);

	// export helper
	export const k_panel: MessagePanelHelper = {
		reveal_text,
		commit,
		receive,
		arbiter,
		opponent,
		error,
		wallet,
		submittable,
		unsubmittable,
	};

	/**
	 * msg-history
	 */
	let dm_history: HTMLDivElement;

	let dm_panel: HTMLDivElement;

	/**
	 * cursor character
	*/
	let s_cursor = '❚';

	/**
	 * msg text
	*/
	let s_text = '';

	/**
	 * nav name/addr
	 */
	let b_nav_display = false;
	let s_nav_name = '';
	let s_nav_addr = '';

	/**
	 * submit button
	 */
	let b_submit_display = false;
	let fk_submit: VoidFunction | null = null;

	let dm_cursor: HTMLElement;

	let i_iter = 0;

	let b_disabled = false;

	async function reveal_text(s_reveal: string, xt_interval=60, xt_pause=0) {
		// set latest
		let i_latest = ++i_iter;

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

			// no longer latest; bail
			if(i_iter !== i_latest) return;
		}

		if(xt_pause) await timeout(xt_pause);

		// no longer latest; bail
		if(i_iter !== i_latest) return;

		for(let i_char=i_shared; i_char<nl_reveal; i_char++) {
			dm_cursor.classList.remove('blinking');
			await timeout(10);

			// no longer latest; bail
			if(i_iter !== i_latest) return;

			dm_cursor.classList.add('blinking');

			s_text += s_reveal[i_char];

			await timeout(xt_interval);

			// no longer latest; bail
			if(i_iter !== i_latest) return;
		}
	}

	async function clear(): Promise<void> {
		await reveal_text('');
	}

	let c_msgs = 0;

	async function receive(g_msg: ReceivedMessage): Promise<void> {
		// disabled
		if(b_disabled) return;

		// dom not ready
		while(!dm_history) {
			await timeout(100);
		}

		// ref widgets
		const h_widgets = g_msg.widgets || {};

		// increment message counter
		const i_msg = c_msgs++;
	
		// create formatted lines
		const dm_line = dd('div', {
			class: [
				'line-commit',
				...(g_msg.classes || []),
			].join(' '),
		}, [
			`> ${g_msg.from}: `,
			...g_msg.text.flatMap((s_line) => {
				const a_parts = [];

				// each substitution
				let i_prev = 0;
				for(const {0:s_span, 1:si_widget, index:i_sub} of s_line.matchAll(/\{([a-z0-9-_]+)\}/ig)) {
					// lookup widget ref
					const z_widget = h_widgets[si_widget];

					// widget was not defined
					if(!z_widget) {
						console.error(`No such widget '${si_widget}' was passed in with the formatted line`);

						// bypass formatted chunk
						a_parts.push(s_line.slice(i_prev, i_sub!+s_span.length));
					}
					// widget is defined
					else {
						// add previous text chunk if it exists
						if(i_prev !== i_sub) a_parts.push(s_line.slice(i_prev, i_sub));

						// add plain html widget
						if(z_widget instanceof Element) {
							a_parts.push(z_widget);
						}
						// add writable widget
						else {
							a_parts.push(dd('span', {
								class: `msg-widget-${si_widget}-${i_msg}`,
							}));
						}
					}

					// move pointer
					i_prev = i_sub!+s_span.length;
				}

				// final piece
				if(i_prev !== s_line.length) a_parts.push(s_line.slice(i_prev));

				// break with newline
				a_parts.push(dd('div', {
					class: 'newline',
				}));

				// return array of elements/text-nodes
				return a_parts;
			}),
		]);

		// each widget
		for(const [si_widget, z_widget] of ode(h_widgets)) {
			// subscribable
			if('function' === typeof (z_widget as any).subscribe) {
				// subscribe to widget updates
				(z_widget as any).subscribe((s_display: string) => {
					// widget instances
					const a_instances = qsa(dm_line, `.msg-widget-${si_widget}-${i_msg}`);
		
					// each instance; replace inner html
					for(const dm_inst of a_instances) {
						dm_inst.innerHTML = s_display;
					}
				});
			}
		}

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

		dm_curtain.remove();
	}

	async function arbiter(z_text: string | string[], h_widgets?: Widgets): Promise<void> {
		return await receive({
			from: 'Arbiter',
			classes: ['from-arbiter'],
			text: Array.isArray(z_text)? z_text: z_text.trim().split(/\n/).map(s => s.trim()),
			widgets: h_widgets || {},
		});
	}

	async function opponent(a_text: string[], h_widgets?: Widgets): Promise<void> {
		return await receive({
			from: 'Opponent',
			classes: ['from-opponent'],
			text: a_text,
			widgets: h_widgets || {},
		});
	}

	async function commit(): Promise<void> {
		dm_history.append(dd('div', {
			class: 'line-commit',
		}, [
			`> Player: ${s_text}`,
		]));

		s_text = '';
	}

	async function error(s_text: string, b_fatal=false): Promise<void> {
		await receive({
			from: 'System',
			classes: ['from-system'],
			text: s_text.split(/\n/g),
		});

		if(b_fatal) {
			b_disabled = true;
		}
	}

	function wallet(g_addr: AddrInfo): void {
		if(g_addr.addr) {
			b_nav_display = true;
			s_nav_name = g_addr.name;
			s_nav_addr = g_addr.addr;
		}
		else {
			b_nav_display = false;
		}
	}

	let dt_attempt_last = 0;
	async function attempt_type() {
		debugger;

		const dt_now = Date.now();
		if(dt_now - dt_attempt_last > 30e3) {
			await reveal_text(`sorry, you don't get to type :P`);
			await timeout(1600);
			await clear();

			dt_attempt_last = dt_now;
		}
	}

	function submittable(_fk_submit: VoidFunction | null): void {
		b_submit_display = true;
		fk_submit = _fk_submit;
	}

	function unsubmittable(): void {
		b_submit_display = false;
		fk_submit = null;
	}

	onMount(() => {
		dm_panel.addEventListener('keydown', () => {
			attempt_type();
		});
	});

</script>

<style lang="less">
	@user-color: #bfbfff;
	@ease-in-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);

	@keyframes blink {
		from {
			opacity: 1.0;
		}
		to {
			opacity: 0.05;
		}
	}

	@keyframes pulse {
		0% {
			border-color: transparent;
		}
		12% {
			border-color: fade(@user-color, 50%);
		}
		24% {
			border-color: transparent;
		}
		50% {
			border-color: fade(@user-color, 75%);
		}
		75% {
			border-color: transparent;
		}
		100% {
			border-color: fade(@user-color, 80%);
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

		// color: rgb(60, 215, 60);
		color: #bfbfff;
		font-family: 'Roboto Mono';

		border: 2px dashed rgba(60, 215, 60, 0.4);
		border-radius: 11px;
		padding: 4px;

		overflow: hidden;
		position: relative;
	}

	.msg-nav {
		position: absolute;
		width: 100%;
		top: 0;
		left: 0;

		color: white;

		padding: 6px 14px;
		background-color: rgba(0, 0, 0, 0.86);
		text-shadow: 0px 0px 11px rgba(255, 255, 255, 0.9);
		box-shadow: 0 0 12px 6px black;

		.msg-nav-group {
			margin: 0 8px;
		}

		.msg-nav-name {
			font-size: 14px;
		}

		.long-name {
			max-width: 375px;
			overflow: hidden;
			display: inline-flex;
			white-space: no-wrap;
		}

		.msg-nav-addr {
			font-size: 12px;
		}

		.msg-nav-icon {
			opacity: 0.7;
			font-size: 16px;

			:global(&>svg) {
				filter: drop-shadow(0 0 7px rgba(255, 255, 255, 0.6))
			}
		}
	}

	.msg-history {
		.console-bg();
		border-radius: @console-border @console-border 0 0;

		height: 270px;
		position: relative;
		font-size: 12px;
		padding: 8px;
		padding-bottom: 0;

		display: flex;
		justify-content: flex-end;
		flex-direction: column;

		line-height: 14px;

		:global(.line-commit) {
			text-indent: -22px;
			padding-left: 22px;
			margin-top: 8px;
			line-height: 16px;
			position: relative;
		}

		:global(.line-commit svg) {
			font-size: 13px;
			padding-right: 2px;
			color: white;
			vertical-align: -2px important;
		}

		:global(.line-commit>[class^="msg-widget-"]) {
			color: white;
		}

		:global(.from-arbiter) {
			color: rgb(190, 255, 190);
		}

		:global(.from-opponent) {
			color: #fcc080;
		}

		:global(.from-user) {
			color: @user-color;
		}

		:global(.from-system) {
			color: #ff0000;
		}

		:global(.curtain) {
			position: absolute;
			.console-bg();
		}

		:global(.newline) {
			height: 4px;
		}
	}

	.msg-console {
		.console-bg();
		border-radius: 0 0 @console-border @console-border;

		font-size: 28px;
		padding: 6px;
		padding-top: 0;

		.text {
			font-size: 22px;
		}
	
		.cursor {
			position: absolute;
		}
	}

	.msg-buttons {
	}

	.msg-submit {
		position: absolute;
		bottom: 0;
		right: 0;
		padding: 6px 42px;
		background-color: rgba(0, 0, 0, 0.6);
		border-radius: 5px;
		margin-right: 7px;
		margin-bottom: 7px;
		color: rgba(255, 255, 255, 0.2);
		border: 2px solid transparent;
		cursor: pointer;

		transition: color 0.5s ease-in-out;

		&.active {
			animation: pulse 2s @ease-in-out-quad 0s infinite alternate;
			color: white;

			&:hover {
				text-decoration: underline;
			}
		}
	}
</style>

<div class="msg-panel" bind:this={dm_panel}>
	<div class="msg-history" bind:this={dm_history} />
	<div class="msg-console">
		<span class="text">&gt;&nbsp;{s_text}</span>
		<span class="cursor blinking" bind:this={dm_cursor}>{s_cursor}</span>
	</div>
	{#if b_nav_display}
		<div class="msg-nav" transition:slide={{duration:750, easing:quadOut}}>
			<span class="msg-nav-group">
				<span class="msg-nav-icon"><Fa icon={faUser}/></span>
				<span class="msg-nav-name" class:long-name={s_nav_name.length >= 40}>{s_nav_name}</span>
			</span>
			<span class="msg-nav-group">
				<span class="msg-nav-icon"><Fa icon={faWallet}/></span>
				<span class="msg-nav-addr">{s_nav_addr}</span>
			</span>
		</div>
	{/if}
	{#if b_submit_display}
		<div class="msg-submit" on:click={fk_submit || (() => {})} class:active={!!fk_submit} transition:blur={{}}>
			<span class="msg-submit-icon"><Fa icon={faPaperPlane} /></span>
			<span class="msg-submit-text">Submit</span>
		</div>
	{/if}
</div>
