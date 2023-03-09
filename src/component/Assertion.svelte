<script context="module" lang="ts">
	export interface AssertionHelper {
		show(si_basis?: CanonicalBasis): Promise<void>;
		hide(): void;
	}
</script>

<script lang="ts">
	import {
		getContext,
		createEventDispatcher,
	} from 'svelte';

	import {
		fade,
	} from 'svelte/transition';

	import {
		circOut, expoOut, quadInOut, sineOut,
	} from 'svelte/easing';

	import {
		proper,
	} from '#/util/belt';

	import {
		qsa,
	} from '#/util/dom';

	import type {
		SemanticQuality,
	} from '#/util/logic';

	import {
		A_BASES,
		A_COLORS,
		A_SHAPES,
		CanonicalBasis,
		H_BASES,
		H_COLORS,
		H_SHAPES,
	} from '#/intl/game';

	import type {
		GameContext,
	} from './App.svelte';

	export const k_tx = {
		show,
		hide,
	} as AssertionHelper;

	const dispatch = createEventDispatcher();

	const g_game = (getContext('game') as GameContext);

	let yw_lang = g_game.language;

	let b_visible = false;

	let si_basis_force: CanonicalBasis | '' = '';

	async function show(si_basis?: CanonicalBasis): Promise<void> {
		si_basis_force = si_basis || '';

		if(si_basis) {
			si_basis_active = si_basis;

			dispatch('basis', si_basis_active);
		}

		b_visible = true;
	}

	function hide(): void {
		b_visible = false;
	}

	let si_basis_active: CanonicalBasis = A_BASES[0];
	let si_quality: SemanticQuality | null = null;

	const data = (d_target: EventTarget, si_key: string) => (d_target as HTMLElement).closest(`[data-${si_key}]`)!.getAttribute(`data-${si_key}`)!;

	function select_basis(d_event: Event): void {
		const si_basis_test = data(d_event.target!, 'basis') as CanonicalBasis;

		if(si_basis_force && si_basis_test !== si_basis_force) {
			dispatch('force_reject', [si_basis_test, si_basis_force]);
			return;
		}

		si_basis_active = si_basis_test;

		dispatch('basis', si_basis_active);
	}

	function select_quality(d_event: Event): void {
		si_quality = data(d_event.target!, 'quality') as SemanticQuality;
		dispatch('quality', si_quality);
	}

	const A_DIAMOND_KEYS = [
		[
			{
				key: 0,
				pos: 'top',
			},
			{
				key: 2,
				pos: 'rgt',
			},
		],
		[
			{
				key: 1,
				pos: 'lft',
			},
			{
				key: 3,
				pos: 'btm',
			},
		],
	];
	
</script>

<style lang="less">
	@user-color: #bfbfff;

	.tx-basis {
		margin-top: 16px;
		position: absolute;
		top: 0;
		left: calc(50% - 223px);

		color: white;

		.tab-wrap {
			border: 2px solid rgba(255, 255, 255, 0.2);
			border-radius: 44px;
			background-color: #0a0a0a;
			
			display: flex;
			overflow: hidden;
			justify-content: center;

			.tab {
				background-color: transparent;
				padding: 12px 28px;
				border: 3px solid transparent;
				border-radius: 44px;
				cursor: pointer;
				width: 170px;
				text-align: center;

				color: rgba(255, 255, 255, 0.6);

				&:nth-child(n+2) {
					margin-left: -22px;
				}
				
				&.active {
					color: white;
					border-color: saturate(darken(spin(@user-color, 20), 20%), 100%);
					// border-color: rgb(120,0,190);
					// background: linear-gradient(45deg, rgba(0, 46, 208) 0%, rgb(159, 198, 251) 100%);;
					// background: linear-gradient(45deg, rgba(0, 46, 208, 1) 0%, rgba(255,255,255,0) 100%)
					background: @user-color;
					// background: rgb(210, 0, 255);
					background: linear-gradient(32deg, darken(saturate(@user-color, 100%), 10%) 0%, rgb(0, 0, 0) 80%);
					// background: linear-gradient(32deg, rgb(210, 0, 255) 0%, rgb(0, 0, 0) 80%);
				}
			}
		}
	}

	.tx-colors {
		position: absolute;
		left: max(35px, calc(50% - 380px));
		top: 80px;
	}

	.tx-shapes {
		position: absolute;
		// left: calc(50% + 380px - 100px);
		right: max(35px, calc(50% - 380px - 100px));
		top: 80px;
		font-size: 23px;
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
				transition: color 0.8s ease;

				.selected {
					color: gold !important;
					font-weight: 600;
				}

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

				@radial-start-color: #303030;
				@radial-end-color: #000000;
				@radial-end-pos: 135%;
				&.bg-rad-top {
					background: #222;
					background: radial-gradient(circle farthest-corner at right bottom, @radial-start-color 0%, @radial-end-color @radial-end-pos);
				}
				&.bg-rad-lft {
					background: #222;
					background: radial-gradient(circle farthest-corner at right top, @radial-start-color 0%, @radial-end-color @radial-end-pos);
				}
				&.bg-rad-rgt {
					background: #222;
					background: radial-gradient(circle farthest-corner at left bottom, @radial-start-color 0%, @radial-end-color @radial-end-pos);
				}
				&.bg-rad-btm {
					background: #222;
					background: radial-gradient(circle farthest-corner at left top, @radial-start-color 0%, @radial-end-color @radial-end-pos);
				}

				&>span {
					width: @cell-length;
					display: inline-block;
					// -9px for shapes
					transform: translate(-7px, 0) rotate(-45deg) scaleX((1 / @cell-scale-x));
				}
			}
		}
	}
</style>

{#if b_visible}
	<div class="tx-basis" transition:fade={{duration:3600, easing:quadInOut}}>
		<span class="tab-wrap">
			{#each A_BASES as si_basis}
				<span class="active tab" on:click={select_basis} data-basis="{si_basis}" class:active={si_basis === si_basis_active}>
					{proper(H_BASES[si_basis].describe[$yw_lang](''))}
				</span>
			{/each}
		</span>
	</div>

	<span class="diamond tx-colors" transition:fade={{delay:2400, duration:3200, easing:expoOut}}>
		{#each A_DIAMOND_KEYS as a_group}
			<span>
				{#each a_group as g_loc}
					{#await A_COLORS[g_loc.key] then si_color}
						<button
							class="diamond-{g_loc.pos} color-{si_color}"
							data-quality="color:{si_color}"
							on:click={select_quality}
							class:selected={`color:${si_color}` === si_quality}
						>
							<span>{proper(H_COLORS[si_color].labels[$yw_lang])}</span>
						</button>
					{/await}
				{/each}
			</span>
		{/each}
	</span>

	<span class="diamond tx-shapes" transition:fade={{delay:3200, duration:3200, easing:expoOut}}>
		{#each A_DIAMOND_KEYS as a_group}
			<span>
				{#each a_group as g_loc}
					{#await A_SHAPES[g_loc.key] then si_shape}
						<button
							class="diamond-{g_loc.pos} bg-rad-{g_loc.pos}"
							data-quality="shape:{si_shape}"
							on:click={select_quality}
							class:selected={`shape:${si_shape}` === si_quality}
						>
							<span>{H_SHAPES[si_shape].symbol}</span>
						</button>
					{/await}
				{/each}
			</span>
		{/each}
	</span>
{/if}
