<script context="module" lang="ts">
	export interface DecisionHelper {
		show(): Promise<void>;
		hide(): void;
	}

	export class Opt {
		protected _si_color: SemanticColorQuality;
		protected _si_shape: SemanticShapeQuality;

		constructor(si_color: SemanticColorQuality, si_shape: SemanticShapeQuality) {
			this._si_color = si_color;
			this._si_shape = si_shape;
		}

		get color() {
			return this._si_color;
		}

		get shape() {
			return this._si_shape;
		}
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
		dd,
	} from '#/util/dom';

	import type {
		CanonicalGuessOption,
		Deduction,
		GuessOption,
		SemanticColorQuality,
		SemanticQuality,
		SemanticShapeQuality,
	} from '#/util/logic';

	import type {
		CanonicalBasis,
		CanonicalTarget,
	} from '#/intl/game';

	import type {
		GameContext,
	} from './App.svelte';

	import { draw_shape } from '#/util/draw';

	export const k_decision = {
		show,
		hide,
	} as DecisionHelper;

	export let k_deduced: Deduction;

	const dispatch = createEventDispatcher();

	const g_game = (getContext('game') as GameContext);

	$: a_opts_arb = k_deduced.enumerate('bag');
	$: a_opts_opp = k_deduced.enumerate('opponent');

	// reset selection whenever a deduction is changed
	$: g_opt_selected = null, k_deduced;

	let yw_lang = g_game.language;

	let b_visible = false;

	async function show(): Promise<void> {
		b_visible = true;
	}

	function hide(): void {
		b_visible = false;
	}

	const g_opt_abstain: GuessOption = {
		target: 'abstain',
		color: null,
		shape: null,
	};

	let g_opt_selected: GuessOption | null = null;

	function stage_decision(si_target: CanonicalTarget, g_opt: GuessOption) {
		if(g_opt_selected !== g_opt) {
			g_opt_selected = g_opt;

			dispatch('change', g_opt);
		}
	}

	function stage_abstain() {
		g_opt_selected = g_opt_abstain;

		dispatch('abstain');
	}

	// create canvas element
	const dm_canvas = dd('canvas', {
		width: 100,
		height: 100,
	}) as HTMLCanvasElement;

	// fetch 2d rendering context
	const d_ctx = dm_canvas.getContext('2d')!;

	function render_icon(k_opt: CanonicalGuessOption): string {
		d_ctx.clearRect(0, 0, 100, 100);

		d_ctx.stroke();
		d_ctx.globalAlpha = 0.8;
		draw_shape(d_ctx, 50, Math.pow(35, 2), k_opt.color,  k_opt.shape);
		const p_data = dm_canvas.toDataURL();

		return dd('span', {

		}, [
			dd('span', {
				class: 'decision-opt-label',
			}, [
				`${proper(k_opt.color)} ${proper(k_opt.shape)}`,
			]),
			dd('img', {
				src: p_data,
			}),
		]).innerHTML;
	}
</script>

<style lang="less">
	@import './common.less';

	.fade-edge(@side) {
		content: " ";
		position: absolute;
		background: linear-gradient(to @side, rgba(0,0,0,0), rgba(0,0,0,1) 100%);
		background: linear-gradient(
			to @side,
			rgba(0, 0, 0, 0%) 0%,
			rgba(0, 0, 0, 0.0182) 8.1%,
			rgba(0, 0, 0, 0.0646) 15.5%,
			rgba(0, 0, 0, 0.1108) 22.5%,
			rgba(0, 0, 0, 0.1687) 29%,
			rgba(0, 0, 0, 0.2407) 35.3%,
			rgba(0, 0, 0, 0.3245) 41.2%,
			rgba(0, 0, 0, 0.4175) 47.1%,
			rgba(0, 0, 0, 0.5161) 52.9%,
			rgba(0, 0, 0, 0.6163) 58.8%,
			rgba(0, 0, 0, 0.714) 64.7%,
			rgba(0, 0, 0, 0.8045) 71%,
			rgba(0, 0, 0, 0.8831) 77.5%,
			rgba(0, 0, 0, 0.945) 84.5%,
			rgba(0, 0, 0, 0.9855) 91.9%,
			rgba(0, 0, 0, 1) 100%
		);
		width: 70px;
		height: 100%;
		z-index: 1;
		top: 0;
		pointer-events: none;
		@{side}: if(@side = left, 149px, 0px);
	}

	.decision {
		background-color: fade(black, 70%);
		width: 800px;
		position: fixed;
		bottom: 50px;
		left: calc(50% - 400px);
		box-sizing: border-box;
		padding: 10px 0 0px 20px;
		border: 1px solid fade(white, 20%);

		&:after {
			.fade-edge(right);
		}

		&:before {
			.fade-edge(left);
		}

		&.staged {
			.decision-opt:not(.selected) {
				opacity: 0.5;
			}
		}

		.decision-opts {
			.decision-abstain {
				text-align: center;
				border-bottom: 1px solid fade(white, 20%);
				position: relative;
				z-index: 2;
				margin-bottom: 6px;

				&.selected {
					:global(button) {
						color: white;
					}
				}

				button {
					width: 200px;
					left: calc(50% - 100px);
					background-color: fade(black, 80%);
					color: fade(white, 80%);
					cursor: pointer;
				}
			}

			.decision-opts-row {
				&>* {
					display: inline-block;
				}

				white-space: nowrap;

				.decision-opts-row-title {
					width: 125px;
					vertical-align: top;
					padding-top: 5px;
					font-size: 14px;
					text-align: right;
				}

				.decision-opts-row-view {
					width: calc(100% - (125px + 5px));
					overflow: scroll;
					box-sizing: border-box;
					padding-left: 20px;
					padding-right: 20px;
				}
			}
		}

		.decision-opt {
			display: inline-block;
			padding: 0 10px;
			cursor: pointer;
			transition: opacity 0.5s ease-out;

			:global(&>*) {
				display: block;
			}
		}
	}


	:global(.decision-opt-label) {
		padding: 6px 10px;
		// background-color: rgba(255, 255, 255, 0.1);
		background-color: fade(black, 70%);
		max-width: 100px;
		text-align: center;
		font-size: 14px;
		color: #eee;
		border: 1px solid fade(white, 20%);
		margin-bottom: -24px;
		position: relative;
		border-radius: 0 0 10px 10px;
		position: relative;
		box-shadow: 0px 0px 6px black;

		transition: background-color 0.5s ease-in-out, border-color 1s ease-in-out;
	}

	:global(.decision-opt:hover .decision-opt-label,.decision-opt.selected .decision-opt-label) {
		background-color: fade(black, 90%);
		border-color: white;
	}

	:global(.decision-opt img) {
		background: #aaa;
		background: linear-gradient(45deg, #aaa 0%, #fff 100%);
		background: linear-gradient(
			225deg,
			hsl(0, 0%, 100%) 0%,
			hsl(0, 0%, 99.4%) 8.1%,
			hsl(0, 0%, 97.7%) 15.8%,
			hsl(0, 0%, 95.1%) 23%,
			hsl(0, 0%, 91.76%) 29.8%,
			hsl(0, 0%, 87.87%) 36.4%,
			hsl(0, 0%, 83.6%) 42.7%,
			hsl(0, 0%, 79.14%) 48.8%,
			hsl(0, 0%, 74.64%) 54.9%,
			hsl(0, 0%, 70.27%) 60.9%,
			hsl(0, 0%, 66.18%) 67%,
			hsl(0, 0%, 62.52%) 73.1%,
			hsl(0, 0%, 59.44%) 79.4%,
			hsl(0, 0%, 57.07%) 86%,
			hsl(0, 0%, 55.54%) 92.8%,
			hsl(0, 0%, 55%) 100%
		);

		border-radius: 100px;
		border: 4px solid mediumpurple;
		transition: border-color 2s ease-in-out, box-shadow 1s ease-in-out;
		box-shadow: 0 0 0px white;
		margin-bottom: 10px;
	}

	:global([data-target="bag"] img) {
		border-color: @arbiter-color;
	}

	:global([data-target="opponent"] img) {
		border-color: @opponent-color;
	}


	:global([data-target="bag"] .decision-opt:hover .decision-opt-label,[data-target="bag"] .decision-opt.selected .decision-opt-label) {
		border-color: @arbiter-color;
	}

	:global([data-target="opponent"] .decision-opt:hover .decision-opt-label,[data-target="opponent"] .decision-opt.selected .decision-opt-label) {
		border-color: @opponent-color;
	}

	:global(.decision-opt:hover img,.decision-opt.selected img) {
		border-color: white;
		box-shadow: 0 0 10px white;
	}
</style>

{#if b_visible}
	<div class="decision" transition:fade={{duration:3600, easing:quadInOut}} class:staged={!!g_opt_selected}>
		<!-- <div class="debug" style="white-space:pre;">
			{k_deduced.explain()}
		</div> -->
		<div class="decision-opts">
			<div class="decision-abstain" class:selected={g_opt_abstain === g_opt_selected}>
				<button on:click={() => stage_abstain()}>
					Abstain
				</button>
			</div>
			<div class="decision-opts-row" data-target="bag">
				<span class="decision-opts-row-title">
					Arbiter's bag:
				</span>
				<span class="decision-opts-row-view">
					<span class="decision-opts-row-view-data">
						{#each a_opts_arb as k_opt}
							<span
								class="decision-opt"
								class:selected={k_opt === g_opt_selected}
								on:click={() => stage_decision('bag', k_opt)}
							>
								{@html render_icon(k_opt)}
							</span>
						{/each}
					</span>
				</span>
			</div>
			<div class="decision-opts-row" data-target="opponent">
				<span class="decision-opts-row-title">
					Opponent's chip:
				</span>
				<span class="decision-opts-row-view">
					<span class="decision-opts-row-view-data">
						{#each a_opts_opp as k_opt}
							<span
								class="decision-opt"
								class:selected={k_opt === g_opt_selected}
								on:click={() => stage_decision('opponent', k_opt)}
							>
								{@html render_icon(k_opt)}
								<img style="display:none" alt="hidden" />
							</span>
						{/each}
					</span>
				</span>
			</div>
		</div>
	</div>
{/if}
