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
		qsa,
	} from '#/util/dom';

	import type {
		Deduction,
		GuessOption,
		SemanticColorQuality,
		SemanticQuality,
		SemanticShapeQuality,
	} from '#/util/logic';

	import {
		A_BASES,
		A_COLORS,
		A_SHAPES,
		CanonicalBasis,
		CanonicalColor,
		CanonicalShape,
		CanonicalTarget,
		H_BASES,
		H_COLORS,
		H_SHAPES,
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

	let yw_lang = g_game.language;

	let b_visible = false;

	let si_basis_force: CanonicalBasis | '' = '';

	async function show(): Promise<void> {
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
			return;
		}

		si_basis_active = si_basis_test;

		dispatch('basis', si_basis_active);
	}

	function select_quality(d_event: Event): void {
		si_quality = data(d_event.target!, 'quality') as SemanticQuality;
		dispatch('quality', si_quality);
	}

	function stage_decision(si_target: CanonicalTarget, g_opt: GuessOption) {

	}

	// create canvas element
	const dm_canvas = dd('canvas', {
		width: 100,
		height: 100,
	}) as HTMLCanvasElement;

	// fetch 2d rendering context
	const d_ctx = dm_canvas.getContext('2d')!;

	function render_icon(k_opt: GuessOption): string {
		d_ctx.clearRect(0, 0, 100, 100);

		d_ctx.arc(50, 50, 49, 0, Math.PI*2);
		d_ctx.fillStyle = 'white';
		d_ctx.fill();
		d_ctx.strokeStyle = 'black';
		d_ctx.lineWidth = 2;
		d_ctx.stroke();

		draw_shape(d_ctx, 50, Math.pow(35, 2), k_opt.color,  k_opt.shape);
		const p_data = dm_canvas.toDataURL();

		return dd('span', {

		}, [
			dd('img', {
				src: p_data,
			}),
		]).outerHTML;
	}
</script>

<style lang="less">
	.decision {
		background-color: fade(black, 20%);
		width: 800px;
		margin-left: auto;
		margin-right: auto;
		position: fixed;
		bottom: 80px;
	}
</style>

{#if b_visible}
	<div class="decision" transition:fade={{duration:3600, easing:quadInOut}}>
		<div class="debug" style="white-space:pre;">
			{k_deduced.explain()}
		</div>
		<div class="decision-row arbiter">
			<span class="decision-row-title">
				Arbiter's bag:
			</span>
			<span class="decision-row-opts">
				{#each a_opts_arb as k_opt}
					<span
						class="decision-opt"
						on:click={() => stage_decision('bag', k_opt)}
					>
						{@html render_icon(k_opt)}
					</span>
				{/each}
			</span>
		</div>
		<div class="decision-row opponent">
			<span class="decision-row-title">
				Opponent's chip:
			</span>
			<span class="decision-row-opts">
				{#each a_opts_opp as k_opt}
					<span
						class="decision-opt"
						on:click={() => stage_decision('opponent', k_opt)}
					>
						{@html render_icon(k_opt)}
					</span>
				{/each}
			</span>
		</div>
	</div>
{/if}
