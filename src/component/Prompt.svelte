<script context="module" lang="ts">
	export interface PromptOption {
		label: string;
		alt?: string;
		data?: any;
	}

	export interface PromptHelper {
		ok(s_label: string): Promise<void>;
		opts(h_opts: Record<string, PromptOption>): Promise<string>;
		yes(): Promise<void>;
		yes_no(): Promise<boolean>;
	}
</script>

<script lang="ts">
import { microtask, oderac } from '#/util/belt';

	import { quadInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';


	export const k_prompt = {
		ok,
		opts,
		yes,
		yes_no,
	} as PromptHelper;

	interface Answer extends PromptOption {
		key: string;
	}

	const G_ANS_YES: Answer = {
		key: 'yes',
		label: 'Yes',
	};

	const G_ANS_NO: Answer = {
		key: 'no',
		label: 'No',
	};

	const A_OPTS_YES_NO = [
		G_ANS_YES,
		G_ANS_NO,
	];

	const F_NOOP = () => {};

	const F_CALL = (fk: CallableFunction) => {
		fk();
	};

	let a_opts: Answer[] = [];

	let b_display = false;
	
	// for triggering css animations
	let b_showing = false;

	let fk_answer: (g_ans: Answer) => void = F_NOOP;

	function answer(g_ans: Answer): void {
		fk_answer(g_ans);

		b_display = false;
	}

	function prompt<T>(_a_opts: Answer[], f_handle: (fk: (w_val: T) => void, g_ans: Answer) => void = F_CALL): Promise<T> {
		return new Promise((fk_respond) => {
			fk_answer = (g_ans: Answer) => {
				f_handle(fk_respond, g_ans);

				b_display = false;
			};

			a_opts = _a_opts;

			b_display = true;

			queueMicrotask(() => {
				b_showing = true;
			});
		});
	}


	function yes_no(): Promise<boolean> {
		return prompt<boolean>(A_OPTS_YES_NO, (fk_yes_no, g_ans) => {
			fk_yes_no('yes' === g_ans.key);
		});
	}

	function yes(): Promise<void> {
		return prompt<void>([G_ANS_YES]);
	}

	function ok(s_label='Ok'): Promise<void> {		
		return prompt<void>([{
			key: 'ok',
			label: s_label,
		}]);
	}

	function opts(h_opts: Record<string, PromptOption>): Promise<string> {
		return prompt<string>(oderac(h_opts, (si_key, g_opt) => ({
			key: si_key,
			...g_opt,
		})), (fk_opt, g_ans) => {
			fk_opt(g_ans.key);
		});
	}
</script>

<style lang="less">
	@user-color: #bfbfff;
	@ease-in-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);

	.prompt {
		display: flex;
		justify-content: center;
		margin-top: 1em;
		
		button {
			width: 200px;
			padding: 12px;
			border-radius: 44px;

			margin-left: 12px;
			margin-right: 12px;

			text-align: center;
			cursor: pointer;
			border: 3px solid transparent;
			background-color: transparent;


			color: white;
			// border-color: rgb(120,0,190);
			border-color: rgb(30,30,250);
			background: rgb(210, 0, 255);
			background: linear-gradient(45deg, rgba(0, 46, 208) 0%, rgba(159, 198, 251, 0.7) 100%);
			// background: linear-gradient(45deg, rgba(0, 46, 208, 1) 0%, rgba(255,255,255,0) 100%)
			// background: linear-gradient(32deg, rgb(210, 0, 255) 0%, rgb(0, 0, 0) 80%);
		}

		.prompt-btn-local {
			background: linear-gradient(45deg, rgba(46, 46, 46) 0%, rgba(189, 198, 251, 0.7) 100%);
			border-color: silver;
		}

		.fade-in() {
			transition: filter 3s ease-in-out;
			filter: blur(6px);
		}

		@fade-in-btns: ok, keplr, local;

		each(@fade-in-btns, {
			.prompt-btn-@{value} {
				.fade-in();
			}

			&.showing button.prompt-btn-@{value} {
				filter: blur(0px) !important;
			}
		});
	}
</style>

<div class="prompt" class:showing={b_showing}>
	{#if b_display}
		{#each a_opts as g_opt}
			<button class="prompt-btn-{g_opt.key}" alt="{g_opt.alt || ''}"
				on:click={() => answer(g_opt)}
				transition:fade={{duration:3200, easing:quadInOut}}
			>
				{g_opt.label}
			</button>
		{/each}
	{/if}
</div>
