<script context="module" lang="ts">
	export interface PickHelper {
		show(): Promise<void>;
		hide(): void;
	}
</script>

<script type="ts">
	import {
		createEventDispatcher,
	} from 'svelte';

	import {
		fade,
		blur
	} from 'svelte/transition';
	
	import Fa from 'svelte-fa';
	
	import type {
		IconDefinition,
	} from '@fortawesome/fontawesome-common-types';
	
	import {
		faCoins,
		faTrophy,
	} from '@fortawesome/free-solid-svg-icons';
	
	import {
		ode,
	} from '#/util/belt';
	
	import type {
		Deduction,
		SemanticQuality,
	} from '#/util/logic';

	import type {
		PickOption,
	} from '#/intl/game';
	
	interface PickInfo {
		icon: IconDefinition;
		label: string;
		description: string;
	}

	const H_PICKS = {
		jackpot: {
			icon: faCoins,
			label: 'Jackpot',
			description: 'A pile of SCRT accrued from lost wagers. The exact amount you will receive is a secret.',
		},
		nft: {
			icon: faTrophy,
			label: 'Power-up NFT',
			description: 'A unique NFT that gives the owner some special power when used during gameplay. The type of power-up you will receive is a secret.',
		},
	} as {
		[K in PickOption]: PickInfo;
	};


	let b_visible = false;

	let si_pick_selected: PickOption | null = null;

	export const k_pick = {
		show,
		hide,
	};

	function show() {
		b_visible = true;
	}

	function hide() {
		b_visible = false;
	}

	const dispatch = createEventDispatcher();


	function pick(si_pick: string) {
		si_pick_selected = si_pick as PickOption;
		dispatch('pick', si_pick_selected);
	}
</script>

<style lang="less">
	.pick {
		position: absolute;
		width: 800px;
		left: calc(50% - 400px);
		display: flex;
		text-align: center;

		&.picked {
			.pick-opt:not(.selected) {
				opacity: 0.3;
			}
		}

		.pick-opt {
			flex: 1;
			padding: 0.8em;
			margin: 0.5em;
			border: 1px solid fade(white, 20%);
			cursor: pointer;
			transition: opacity 1s ease-in-out;
			border-radius: 6px;
		}
		
		.pick-label {
			background-color: fade(white, 10%);
			border-radius: 6px;
			padding: 12px;
			font-family: 'Roboto Mono';
			font-size: 20px;
		}

		.pick-icon {
			font-size: 200px;
			color: goldenrod;
		}

		.pick-description {
			color: fade(white, 80%);
			text-align: left;
			padding: 0 1em;
			margin-bottom: 1em;
		}
	}
</style>

{#if b_visible}
	<div class="pick" transition:blur={{duration:2500}} class:picked={!!si_pick_selected}>
		{#each ode(H_PICKS) as [si_pick, g_pick]}
			<span class="pick-opt" data-pick={si_pick} on:click={() => pick(si_pick)} class:selected={si_pick_selected === si_pick}>
				<div class="pick-label">
					{g_pick.label}
				</div>
				<div class="pick-icon">
					<Fa icon={g_pick.icon} />
				</div>
				<div class="pick-description">
					{g_pick.description}
				</div>
			</span>
		{/each}
	</div>
{/if}