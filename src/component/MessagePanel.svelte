<script context="module" lang="ts">
	import type { Writable } from 'svelte/store';
	import type { PermitParams } from '#/util/encrypted-local-storage';

	export type Widgets = Record<string, Writable<string> | HTMLElement>;

	export interface AddrInfo {
		name: string;
		addr: string;
		ledger?: boolean;
	}

	type TextInput = string | string[];

	export interface MessagePanelHelper {
		reveal_text(s_reveal: string, xt_interval?: number, xt_pause?: number): Promise<void>;
		spinning(b_spin: boolean): void;
		commit(): Promise<void>;
		receive(g_msg: ReceivedMessage): Promise<void>;
		arbiter(z_text: TextInput, h_widgets?: Widgets): Promise<void>;
		opponent(a_text: string[], h_widgets?: Widgets): Promise<void>;
		user(z_text: string | string[], h_widgets?: Widgets): Promise<void>;
		error(z_text: TextInput, b_fatal?: boolean, h_widgets?: Widgets): Promise<void>;
		warn(z_text: TextInput, h_widgets?: Widgets): Promise<void>;
		wallet(g_addr: AddrInfo): void;
		permit(g_params: PermitParams, b_restored?: boolean): void;
		submittable(fk_submit: VoidFunction | null, s_tag?: string): void;
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
		fade,
	} from 'svelte/transition';

	import {
		quadOut,
	} from 'svelte/easing';

	import Fa from 'svelte-fa';

	import {
		faUser,
		faWallet,
		faFilePowerpoint,
		faTicketAlt,
	} from '@fortawesome/free-solid-svg-icons';
	
	import {
		faPaperPlane,
	} from '@fortawesome/free-regular-svg-icons';

	import type {
		SupportedLanguage,
	} from '#/intl/game';

	import {
		Killables,
		microtask,
		ode,
		oder,
		timeout,
	} from '#/util/belt';

	import type {
		GameContext,
	 } from './App.svelte';

	import { dd, qs, qsa } from '#/util/dom';

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
		spinning,
		commit,
		receive,
		arbiter,
		opponent,
		user,
		error,
		warn,
		wallet,
		permit,
		submittable,
		unsubmittable,
	};

	/**
	 * killable intervals and timeouts
	 */
	export let k_killables: Killables;

	/**
	 * msg-history
	 */
	let dm_history: HTMLDivElement;
	let dm_history_data: HTMLDivElement;

	let dm_panel: HTMLDivElement;

	/**
	 * cursor character
	*/
	let s_cursor = '❚';

	let s_evaluation = '';

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

	let s_account_alias = '';

	/**
	 * submit button
	 */
	let b_submit_display = false;
	let fk_submit: VoidFunction | null = null;

	let dm_cursor: HTMLElement;

	let i_iter = 0;

	let b_disabled = false;
	let s_revealing = '';

	async function reveal_text(s_reveal: string, xt_interval=40, xt_pause=0, b_bypass=false) {
		// clear spinner
		if(i_spinning) {
			s_spinner = '';
			k_killables.delInterval(i_spinning);
			i_spin = 0;
			i_spinning = 0;
		}

		// clear evaluation
		s_evaluation = '';

		if(!b_bypass) {
			s_revealing = s_reveal;
		}

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

		const dm_cursor_use = dm_cursor || qs(document.body, '.cursor');

		if(!dm_cursor_use) return;

		for(let i_char=i_shared; i_char<nl_reveal; i_char++) {
			dm_cursor_use.classList.remove('blinking');
			await timeout(10);

			// no longer latest; bail
			if(i_iter !== i_latest) return;

			dm_cursor_use.classList.add('blinking');

			s_text += s_reveal[i_char];

			await timeout(xt_interval);

			// no longer latest; bail
			if(i_iter !== i_latest) return;
		}
	}


	const A_SPIN = ['◜ ◝', ' ˉ◞', ' ˍ◝', '◟ ◞', '◜ˍ ', '◟ˉ '];
	let s_spinner = '';
	let i_spinning = 0;
	let i_spin = 0;
	async function spinning(b_spin: boolean) {
		if(b_spin) {
			if(0 === i_spinning) {
				i_spinning = -1;

				const s_restore = s_text;
				await reveal_text(s_restore+' '+A_SPIN[A_SPIN.length-1]+' ', 60, 0, true);
				s_text = s_restore;

				function spin() {
					s_spinner = ' '+A_SPIN[i_spin++]+' ';
					i_spin %= A_SPIN.length;
				}

				spin();
				i_spinning = k_killables.addInterval(spin, 100);
			}
		}
		else if(i_spinning > 0) {
			s_spinner = '';
			k_killables.delInterval(i_spinning);
			i_spin = 0;
			i_spinning = 0;
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

		dm_history_data.append(dm_line);
		dm_history_data.append(dm_curtain);

		dm_history.scrollTop = dm_history.scrollHeight;

		const g_rect_parent = dm_history_data.getBoundingClientRect();
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
			await timeout(100);
		}

		dm_curtain.remove();
	}

	const rerformat_lines = (z_text: TextInput) => Array.isArray(z_text)? z_text: z_text.trim().split(/\n/).map(s => s.trim());

	async function arbiter(z_text: TextInput, h_widgets?: Widgets): Promise<void> {
		return await receive({
			from: 'Arbiter',
			classes: ['from-arbiter'],
			text: rerformat_lines(z_text),
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

	async function user(z_text: string | string[], h_widgets?: Widgets): Promise<void> {
		return await receive({
			from: `You${s_account_alias}`,
			classes: ['from-user'],
			text: rerformat_lines(z_text),
			widgets: h_widgets || {},
		});
	}

	async function commit(): Promise<void> {
		// dm_history.append(dd('div', {
		// 	class: 'line-commit',
		// }, [
		// 	`> You${s_account_alias}: ${s_text}`,
		// ]));

		user(s_revealing || s_text);

		s_text = '';
	}

	async function error(z_text: TextInput, b_fatal=false, h_widgets?: Widgets): Promise<void> {
		await receive({
			from: 'System',
			classes: ['from-system-error'],
			text: rerformat_lines(z_text),
			widgets: h_widgets || {},
		});

		if(b_fatal) {
			b_disabled = true;
		}
	}

	async function warn(z_text: TextInput, h_widgets?: Widgets): Promise<void> {
		await receive({
			from: 'System',
			classes: ['from-system-warn'],
			text: rerformat_lines(z_text),
			widgets: h_widgets || {},
		});
	}

	function wallet(g_addr: AddrInfo): void {
		if(g_addr.addr) {
			b_nav_display = true;
			s_nav_name = g_addr.name;
			s_nav_addr = g_addr.addr;

			s_account_alias = s_nav_name? ` (${s_nav_name})`: '';
		}
		else {
			b_nav_display = false;
		}
	}

	let a_permit_displays: string[] = [];
	function permit(g_permit: PermitParams, b_restored?: boolean): void {
		const p_token = g_permit.allowed_tokens[0];

		a_permit_displays = [b_restored? 'restored': 'signed', p_token.slice(0, 'secret12345'.length), p_token.slice(-5)];
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

	let dm_eval: HTMLElement;
	function submittable(_fk_submit: VoidFunction | null, s_tag?: string): void {
		b_submit_display = true;

		// eval dom node is bound
		if(dm_eval) {
			// get client rect
			const g_rect = dm_eval.getBoundingClientRect();

			// set fixed position
			Object.assign(dm_eval.style, {
				position: 'fixed',
				top: `${g_rect.top}px`,
				left: `${g_rect.left}px`,
			});
		}
		
		s_evaluation = '';
	
		if(s_tag) {
			setTimeout(() => {
				// eval node is bound and positioning is enabled; clear it
				if(dm_eval && dm_eval.style.position) {
					Object.assign(dm_eval.style, {
						position: '',
						top: '',
						left: '',
					});
				}

				s_evaluation = s_tag;
			}, 500);

			// setTimeout(() => {
			// 	s_evaluation = s_tag;
			// }, 400);
		}

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


	/**
	 * in order to have an animation on the submit button while it is active and then play a transition
	 * on hover, the animation must first be disabled before chrome will animate the transition property.
	 * this is done using a combination of classes and event callbacks.
	 */
	let dm_submit: HTMLElement;

	async function mouseenter_submit() {
		await timeout(100);
		dm_submit.classList.add('hover');
	}

	async function mouseleave_submit() {
		dm_submit.style.animation = '0';
		await timeout(100);
		dm_submit.classList.remove('hover');
		await timeout(1e3);
		dm_submit.style.animation = '';
	}
</script>

<style lang="less">
	@import './common.less';

	@ease-in-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);

	@keyframes blink {
		from {
			opacity: 1.0;
		}
		to {
			opacity: 0.05;
		}
	}

	@keyframes pulse-border {
		0% {
			border-color: fade(@user-color, 10%);
		}
		90% {
			border-color: fade(@user-color, 20%);
		}
		100% {
			border-color: fade(@user-color, 10%);
		}
	}

	@keyframes pulse-color {
		0% {
			color: white;
		}
		12% {
			color: fade(@user-color, 50%);
		}
		24% {
			color: white;
		}
		50% {
			color: fade(@user-color, 75%);
		}
		75% {
			color: white;
		}
		100% {
			color: fade(@user-color, 80%);
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
		margin-top: 8px;
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
			margin: 0 6px;
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

		.addr {
			// condense it a bit
			letter-spacing: -0.03rem;
		}

		.prefix {
			letter-spacing: -0.02rem;
		}

		.msg-nav-permit {
			font-size: 12px;

			.ellipsis {
				margin-left: -4px;
				margin-right: -4px;
				display: inline-block;
				transform: scaleX(0.45);
			}
		}

		.msg-nav-icon {
			opacity: 0.7;
			font-size: 16px;

			:global(&>svg) {
				filter: drop-shadow(0 0 7px rgba(255, 255, 255, 0.6));
				vertical-align: middle !important;
			}

			:global(&.lifted>svg) {
				vertical-align: -0.125em !important;
			}
		}
	}

	.msg-history {
		.console-bg();
		border-radius: @console-border @console-border 0 0;
		
		position: relative;
		height: 270px;
		overflow-y: scroll;
	}
		
	.msg-history-scroll {
		// position: static;
		// bottom: 0;
		font-size: 12px;
		padding: 35px 8px 2px 8px;

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

		:global(.line-commit>*) {
			text-indent: initial;
			padding-left: initial;
			margin-top: initial;
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
			color: @arbiter-color;
		}

		:global(.from-opponent) {
			color: @opponent-color;
		}

		:global(.from-user) {
			color: @user-color;
		}

		:global(.from-system-error) {
			color: #ff0000;
		}

		:global(.from-system-warn) {
			color: #ffff00;
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
		position: relative;

		font-size: 28px;
		padding: 6px;
		padding-top: 0;
		margin-top: -1px;

		.text {
			font-size: 22px;
			white-space: pre-wrap;
		}
	
		.cursor {
			background-color: @user-color;
			margin-left: -1rem;
			font-size: 22px;
			display: inline-block;
			transform: scaleX(0.8);
		}

		.msg-console-eval {
			font-size: 12px;
			color: white;
			vertical-align: middle;
		}
	}

	.inline-flex {
		display: inline-flex;
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
			animation: pulse-border 4s linear 0s infinite;
			transition: border-color 1s linear;
			border-color: fade(@user-color, 15%);
			color: white;

			&>.msg-submit-icon {
				animation: pulse-color 2s @ease-in-out-quad 0s infinite alternate;
				margin-right: 0.25em;
			}

			&:hover {
				:global(.msg-submit-text) {
					text-decoration: underline;
				}
				animation: none;
			}

			:global(&.hover) {
				border-color: fade(@user-color, 80%) !important;
			}
		}
	}
</style>

<div class="msg-panel" bind:this={dm_panel}>
	<div class="msg-history" bind:this={dm_history}>
		<div class="msg-history-scroll" bind:this={dm_history_data} />
	</div>
	<div class="msg-console">
		<span class="text">&gt;&nbsp;{s_text}{s_spinner}</span>
		<span class="cursor blinking" bind:this={dm_cursor}>&nbsp;</span>
		{#if s_evaluation}
			<span class="msg-console-eval"
				bind:this={dm_eval}
				in:fade={{duration:1000}}
				out:fade={{duration:500}}
			>
				{s_evaluation}
			</span>
		{/if}
	</div>
	{#if b_nav_display}
		<div class="msg-nav" transition:slide={{duration:750, easing:quadOut}}>
			<span class="msg-nav-group">
				<span class="msg-nav-icon lifted"><Fa icon={faUser}/></span>
				<span class="msg-nav-name" class:long-name={s_nav_name.length >= 40}>{s_nav_name}</span>
			</span>
			<span class="msg-nav-group">
				<span class="msg-nav-icon"><Fa icon={faWallet}/></span>
				<span class="msg-nav-addr addr">{s_nav_addr}</span>
			</span>
			{#if a_permit_displays.length}
				<span class="msg-nav-group" transition:fade={{duration:1000}}>
					<span class="msg-nav-icon"><Fa icon={faTicketAlt}/></span>
					<span class="msg-nav-permit inline-flex">
						<span class="prefix">{a_permit_displays[0]}:</span>
						<span class="addr">{a_permit_displays[1]}</span>
						<span class="ellipsis">...</span>
						<span class="addr">{a_permit_displays[2]}</span>
					</span>
				</span>
			{/if}
		</div>
	{/if}
	{#if b_submit_display}
		<div class="msg-submit"
			on:click={fk_submit || (() => {})}
			class:active={!!fk_submit}
			transition:blur={{}}
			on:mouseenter={mouseenter_submit}
			on:mouseleave={mouseleave_submit}
			bind:this={dm_submit}
		>
			<span class="msg-submit-icon"><Fa icon={faPaperPlane} /></span>
			<span class="msg-submit-text">Submit</span>
		</div>
	{/if}
</div>
