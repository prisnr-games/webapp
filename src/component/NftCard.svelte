<script context="module" lang="ts">
	export interface NftCardHelper {
		hide(): void;
	}

	export interface CardInfo {
		token_id: string;
		ext: NftMetadata;
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

	import Fa from 'svelte-fa';

	import {
		circOut, expoOut, quadInOut, sineOut,
	} from 'svelte/easing';

	import {
		faAward,
		faCarCrash,
	} from '@fortawesome/free-solid-svg-icons';

	import type {
		NftInfoResponse, NftMetadata,
	} from '#/network/contract';

	import type { IconDefinition } from '@fortawesome/fontawesome-common-types';

	const dispatch = createEventDispatcher();

	export let si_token: string;
	export let g_nft: NftInfoResponse | null;
	export let i_card: number;

	$: g_ext = g_nft?.private_metadata.extension;

	$: sx_bg = g_ext?.background_color
		? `#${g_ext?.background_color}`
		: `
			background: rgb(212,212,212);
			background: linear-gradient(326deg, rgba(212,212,212,1) 0%, rgba(240,240,240,1) 50%, rgba(175,175,175,1) 100%);
		`.trim().split(/\n+/g).map(s => s.trim()).join(' ');

	let s_class = 'Loading...';
	$: {
		switch(g_ext?.description) {
			case 'simple': {
				y_icon = faAward;
				s_class = 'Badge';
				break;
			}

			case 'insurance': {
				y_icon = faCarCrash;
				s_class = 'Insurance';
				break;
			}
		}
	}

	let y_icon: IconDefinition;

	function click_card() {
		dispatch('click_card', {
			token_id: si_token,
			ext: g_ext,
		} as CardInfo);
	}

</script>

<style lang="less">
	.card {
		margin-top: 30px;
		cursor: pointer;

		* {
			margin-left: auto;
			margin-right: auto;
			text-align: center;
		}
		
		.card-preview {
			width: 80px;
			height: 80px;
			border-radius: 1em;

			box-shadow: inset -2px -4px 12px 1px rgba(0,0,0,0.6);
			box-shadow: 0px 0px 12px white;

			.card-overlay {
				position: relative;
				top: 17px;
				background-color: fade(white, 40%);
			}

		}

		.card-icon {
			font-size: 30px;
			color: #F4B70C;
			filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.6));
		}

		.card-title {
			width: 100%;
			font-size: 10px;
			margin-top: 5px;
			color: #ccc;
		}

		.card-class {
			color: black;
			text-align: center;
			margin-left: auto;
			margin-right: auto;
			width: 80%;
		}

		.card-title {

		}
	}
</style>

<div class="card" on:click={() => click_card()} transition:fade={{delay:i_card*800}}>
	<div class="card-preview" style="background:{sx_bg}">
		<div class="card-overlay">
			{#if y_icon}
				<div class="card-icon">
					<Fa icon={y_icon} />
				</div>
			{/if}
			<div class="card-class">
				{s_class}
			</div>
		</div>
	</div>
	<div class="card-title">
		{si_token}
	</div>
</div>
