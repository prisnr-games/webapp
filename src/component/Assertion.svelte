<script context="module" lang="ts">
	export interface AssertionHelper {
		show(): Promise<void>;
		hide(): void;
	}
</script>

<script lang="ts">
	import {
		createEventDispatcher,
	} from 'svelte';

	import {
		fade,
	} from 'svelte/transition';

	import {
		circOut, expoOut, quadInOut, sineOut,
	} from 'svelte/easing';

	import { qsa } from '#/util/dom';
import { timeout } from '#/util/belt';

	export const k_tx = {
		show,
		hide,
	} as AssertionHelper;

	const dispatch = createEventDispatcher();

	let b_visible = false;

	async function show(): Promise<void> {
		b_visible = true;
	}

	function hide(): void {
		b_visible = false;
	}

	function select_basis(d_event: Event): void {
		qsa(document.body, '.tx-basis .active').forEach(d => d.classList.remove('active'));
		const dm_basis = (d_event.target as HTMLElement);
		dm_basis.classList.add('active');
		dispatch('basis', dm_basis.getAttribute('data-basis'));
	}

	function select_color(d_event: Event): void {
		qsa(document.body, '.diamond .active').forEach(d => d.classList.remove('active'));
		const dm_color = (d_event.target as HTMLElement).closest('button') as HTMLElement;
		dm_color.classList.add('active');
		dispatch('color', dm_color.getAttribute('data-color'));
	}

	function select_shape(d_event: Event): void {
		qsa(document.body, '.diamond .active').forEach(d => d.classList.remove('active'));
		const dm_shape = (d_event.target as HTMLElement).closest('button') as HTMLElement;
		dm_shape.classList.add('active');
		dispatch('shape', dm_shape.getAttribute('data-shape'));
	}
</script>

<style lang="less">

	.tx-basis {
		margin-top: 16px;
		position: absolute;
		top: 0;
		left: calc(50% - 223px);

		color: white;
		background-color: #0a0a0a;

		.tab-wrap {
			border: 2px solid rgba(255, 255, 255, 0.6);
			border-radius: 44px;
			
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
					border-color: rgb(120,0,190);
					// background: linear-gradient(45deg, rgba(0, 46, 208) 0%, rgb(159, 198, 251) 100%);;
					// background: linear-gradient(45deg, rgba(0, 46, 208, 1) 0%, rgba(255,255,255,0) 100%)
					background: rgb(210, 0, 255);
					background: linear-gradient(32deg, rgb(210, 0, 255) 0%, rgb(0, 0, 0) 80%);
				}
			}
		}
	}

	.tx-colors {
		position: absolute;
		left: calc(50% - 420px);
		top: 80px;
	}

	.tx-shapes {
		position: absolute;
		left: calc(50% + 420px - 100px);
		top: 80px;
		font-size: 23px;
	}

	:global(button.active) {
		color: gold !important;
		font-weight: 600;
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
			<span class="active tab" on:click={select_basis} data-basis="nobody">
				Nobody has...
			</span>
			<span class="tab" on:click={select_basis} data-basis="chip">
				My chip is...
			</span>
		</span>
	</div>

	<span class="diamond tx-colors" transition:fade={{delay:2400, duration:3200, easing:expoOut}}>
		<span>
			<button class="diamond-top color-red" data-color="red" on:click={select_color}>
				<span>Red</span>
			</button>
			<button class="diamond-rgt color-blue" data-color="blue" on:click={select_color}>
				<span>Blue</span>
			</button>
		</span>
		<span>
			<button class="diamond-lft color-green" data-color="green" on:click={select_color}>
				<span>Green</span>
			</button>
			<button class="diamond-btm color-black" data-color="black" on:click={select_color}>
				<span>Black</span>
			</button>
		</span>
	</span>

	<span class="diamond tx-shapes" transition:fade={{delay:3200, duration:3200, easing:expoOut}}>
		<span>
			<button class="diamond-top bg-rad-top" data-shape="triangle" on:click={select_shape}>
				<span>▲</span>
			</button>
			<button class="diamond-rgt bg-rad-rgt" data-shape="circle" on:click={select_shape}>
				<span>●</span>
			</button>
		</span>
		<span>
			<button class="diamond-lft bg-rad-lft" data-shape="square" on:click={select_shape}>
				<span>■</span>
			</button>
			<button class="diamond-btm bg-rad-btm" data-shape="star" on:click={select_shape}>
				<span>★</span>
			</button>
		</span>
	</span>
{/if}
