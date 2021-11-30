<script context="module" lang="ts">
	export type Belief = 'trust' | 'distrust' | 'ignore';

	export interface PremiseHelper {
		apply(k_deduction: Deduction): Deduction;
	}
</script>

<script type="ts">
	import {
		createEventDispatcher,
	} from 'svelte';

	import Fa from 'svelte-fa';

	import type {
		IconDefinition,
	} from '@fortawesome/fontawesome-common-types';

	import {
		faCheckCircle,
		faTimesCircle,
		faQuestionCircle,
	} from '@fortawesome/free-solid-svg-icons';

	import {
		ode,
	} from '#/util/belt';

	import type {
		Deduction,
		SemanticQuality,
	} from '#/util/logic';

	interface Opt {
		label: string;
		icon: IconDefinition;
	}

	const H_OPTS: Record<Belief, Opt> = {
		trust: {
			label: 'Trust',
			icon: faCheckCircle,
		},
		distrust: {
			label: 'Distrust',
			icon: faTimesCircle,
		},
		ignore: {
			label: 'Ignore',
			icon: faQuestionCircle,
		},
	};

	const NL_OPTS = ode(H_OPTS).length;

	export let b_mode_nobody: boolean;
	export let si_assertion: SemanticQuality;

	export const k_premise: PremiseHelper = {
		apply(k_deduction: Deduction): Deduction {
			return f_apply(k_deduction);
		},
	};

	let f_apply: (k_deduction: Deduction) => Deduction = k => k;

	let si_belief: Belief = 'ignore';

	let dm_truth!: HTMLElement;

	const dispatch = createEventDispatcher();

	function select_opt(si_opt: Belief) {
		// no change
		if(si_belief === si_opt) return;

		// update belief
		si_belief = si_opt;

		// set apply function
		if(b_mode_nobody) {
			f_apply = (k_deduction: Deduction): Deduction => {
				if('trust' === si_belief) {
					return k_deduction.nobody(si_assertion);
				}

				return k_deduction;
			};
		}
		else {
			f_apply = (k_deduction: Deduction): Deduction => {
				if('trust' === si_belief) {
					return k_deduction.opponent(si_assertion, true);
				}
				else if('distrust' === si_belief) {
					return k_deduction.opponent(si_assertion, false);
				}

				return k_deduction;
			};
		}

		// emit event
		dispatch('change', si_opt);
	}
</script>

<style lang="less">
	.truth {
		display: inline-flex;
		margin-left: 1.5em;
		width: 250px;
		position: absolute;
		top: -4px;

		.truth-opt {
			flex: 1;
			text-align: center;

			padding: 4px;
			border-style: solid;
			border-width: 1px 0;
			border-color: fade(white, 20%);

			cursor: pointer;

			:global(svg) {
				color: fade(white, 50%);
			}

			.truth-opt-icon {
				margin-right: -1.5em;
			}

			&:hover {
				background-color: fade(white, 5%);
			}

			&.selected {
				background-color: fade(black, 30%);

				.truth-opt-text {
					color: white;
				}

				:global(&[data-opt="trust"] svg) {
					color: limegreen;
				}
				:global(&[data-opt="distrust"] svg) {
					color: orangered;
				}
				:global(&[data-opt="ignore"] svg) {
					color: lightskyblue;
				}
			}

			.truth-opt-text {
				color: fade(white, 70%);
			}
		}

		.opt-lft {
			border-left-width: 1px;
			border-radius: 5px 0 0 5px;
		}

		.opt-rgt {
			border-right-width: 1px;
			border-radius: 0 5px 5px 0;
		}
	}
</style>

<span class="truth" bind:this={dm_truth}>
	{#each ode(H_OPTS) as [si_opt, g_opt], i_opt}
		<span class="truth-opt {0 === i_opt? 'opt-lft': NL_OPTS-1 === i_opt? 'opt-rgt': 'opt-mid'}" data-opt="{si_opt}" on:click={() => select_opt(si_opt)} class:selected={si_opt === si_belief}>
			<span class="truth-opt-icon">
				<Fa icon={g_opt.icon}/>
			</span>
			<span class="truth-opt-text">
				&nbsp;&nbsp;{g_opt.label}
			</span>
		</span>
	{/each}
</span>
