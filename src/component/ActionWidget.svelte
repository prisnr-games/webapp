<script context="module" lang="ts">
	// export interface PremiseHelper {
	// 	apply(k_deduction: Deduction): Deduction;
	// }
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
		faDotCircle,
		faMinusCircle,
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

	const H_OPTS: Record<string, Opt> = {
		yes: {
			label: 'Yes',
			icon: faCheckCircle,
		},
	};

	const NL_OPTS = ode(H_OPTS).length;

	let f_apply: (k_deduction: Deduction) => Deduction = k => k;

	export let si_selected: string = 'none';

	let dm_action!: HTMLElement;

	const dispatch = createEventDispatcher();

	function select_opt(si_opt: string) {
		// no change
		if(si_selected === si_opt) return;

		// update selected
		si_selected = si_opt;

		// emit event
		dispatch('change', si_opt);
	}
</script>

<style lang="less">
	.action {
		display: inline-flex;
		margin-left: 1.5em;
		width: 350px;
		position: absolute;
		margin-top: -5px;

		.action-opt {
			flex: 1;
			text-align: center;

			padding: 4px;
			border-style: solid;
			border-width: 1px 0;
			border-color: fade(white, 20%);
			border-radius: 0;

			cursor: pointer;

			:global(svg) {
				color: fade(white, 50%);
			}

			&:hover {
				background-color: fade(white, 5%);
			}

			&.selected {
				background-color: fade(black, 30%);

				.action-opt-text {
					color: white;
				}

				:global(&[data-opt="yes"] svg) {
					color: limegreen;
				}
				:global(&[data-opt="no"] svg) {
					color: orangered;
				}
				:global(&[data-opt="ignore"] svg) {
					color: lightskyblue;
				}
			}

			.action-opt-text {
				color: fade(white, 70%);
			}
		}

		.opt-lft {
			border-left-width: 1px;
			border-top-left-radius: 5px;
			border-bottom-left-radius: 5px;
		}

		.opt-rgt {
			border-right-width: 1px;
			border-top-right-radius: 5px;
			border-bottom-right-radius: 5px;
		}
	}
</style>

<span class="action" style="width:{100 * NL_OPTS}px;" bind:this={dm_action}>
	{#each ode(H_OPTS) as [si_opt, g_opt], i_opt}
		<span class="action-opt {0 === i_opt? 'opt-lft': ''} {NL_OPTS-1 === i_opt? 'opt-rgt': 'opt-mid'}" data-opt="{si_opt}" on:click={() => select_opt(si_opt)} class:selected={si_opt === si_selected}>
			<span class="action-opt-icon">
				<Fa icon={g_opt.icon}/>
			</span>
			<span class="action-opt-text">
				{g_opt.label}
			</span>
		</span>
	{/each}
</span>
