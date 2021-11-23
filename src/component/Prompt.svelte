<script context="module" lang="ts">
	export interface PromptHelper {
		ok(s_label: string): Promise<void>;
		yes(): Promise<void>;
		yes_no(): Promise<boolean>;
	}
</script>

<script lang="ts">
import { microtask } from '#/util/belt';

	import { quadInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';


	export let k_prompt = {
		ok,
		yes,
		yes_no,
	} as PromptHelper;

	interface Answer {
		key: string;
		label: string;
		data?: any;
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

		// return new Promise((fk_yes_no) => {
		// 	fk_answer = (g_ans) => {
		// 		fk_yes_no('yes' === g_ans.key);
		// 	};

		// 	a_opts = A_OPTS_YES_NO;

		// 	b_display = true;
		// });
	}

	function yes(): Promise<void> {
		return prompt<void>([G_ANS_YES]);

		// return new Promise((fk_yes) => {
		// 	fk_answer = () => {
		// 		fk_yes();
		// 	};

		// 	a_opts = [G_ANS_YES];
			
		// 	b_display = true;
		// })
	}

	function ok(s_label='Ok'): Promise<void> {		
		return prompt<void>([{
			key: 'ok',
			label: s_label,
		}]);

		// return new Promise((fk_ok) => {
		// 	fk_answer = () => {
		// 		fk_ok();
		// 	};

		// 	a_opts = [{
		// 		key: 'ok',
		// 		label: s_label,
		// 	}];
	
		// 	b_display = true;
		// })
	}
</script>

<style lang="less">
	.prompt {
		display: flex;
		justify-content: center;
		margin-top: 1em;

		button {
			width: 200px;
			padding: 12px;
			border-radius: 44px;

			text-align: center;
			cursor: pointer;
			border: 3px solid transparent;
			background-color: transparent;


			color: white;
			// border-color: rgb(120,0,190);
			border-color: rgb(30,30,250);
			background: rgb(210, 0, 255);
			background: linear-gradient(45deg, rgba(0, 46, 208) 0%, rgba(159, 198, 251, 0.7) 100%);;
			// background: linear-gradient(45deg, rgba(0, 46, 208, 1) 0%, rgba(255,255,255,0) 100%)
			// background: linear-gradient(32deg, rgb(210, 0, 255) 0%, rgb(0, 0, 0) 80%);
		}

		.prompt-btn-ok {
			transition: filter 3s ease-in-out;
			filter: blur(6px);
		}

		&.showing button.prompt-btn-ok {
			filter: blur(0px) !important;
		}
	}

	// :global() {
	// 	filter: blur(0px) !important;
	// }
</style>

<div class="prompt" class:showing={b_showing}>
	{#if b_display}
		{#each a_opts as g_opt}
			<button class="prompt-btn-{g_opt.key}"
				on:click={() => answer(g_opt)}
				transition:fade={{duration:3200, easing:quadInOut}}
			>
				{g_opt.label}
			</button>
		{/each}
	{/if}
</div>
