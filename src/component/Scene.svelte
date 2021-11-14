<script context="module" lang="ts">
	export interface SceneHelper {
		animate_chip_entry(): Promise<void>;
	}
</script>

<script lang="ts">
	import {
		onMount,
	} from 'svelte';

	import {
		chip,
	} from '#/util/three';

	import {
		AmbientLight,
		Scene,
		PerspectiveCamera,
		WebGLRenderer,
		Vector3,
		LineBasicMaterial,
		BufferGeometry,
		MeshBasicMaterial,
		Mesh,
		BoxGeometry,
		PointLightHelper,
		Line,
		PointLight,
		Texture,
		TextureLoader,
		SpotLight,
		VectorKeyframeTrack,
		AnimationClip,
		AnimationMixer,
		LoopOnce,
		Clock,
		Euler,
	} from 'three';

	import {
		Tween,
		Easing,
		update as updateTween,
	} from '@tweenjs/tween.js';

	import { timeout } from '#/util/belt';
	import { qs } from '#/util/dom';

	const X_PI = Math.PI;

	export let k_scene: SceneHelper;

	let dm_container: HTMLDivElement;

	async function load_textures(h_assets: Record<string, string>): Promise<Record<string, Texture>> {
		const h_textures = {} as Record<string, Texture>;

		const y_loader = new TextureLoader();

		for(const si_asset in h_assets) {
			const p_asset = h_assets[si_asset];
			h_textures[si_asset] = await new Promise((fk_load) => {
				y_loader.load(p_asset, (y_texture: Texture) => {
					fk_load(y_texture);
				});
			})
		}

		return h_textures;
	}

	onMount(async() => {
		// set scene helper
		k_scene = {
			animate_chip_entry,
		};

		const h_textures = await load_textures({
			chip: '/asset/chip.png',
			chip_displace: '/asset/chip-displacement.png',
		});

		const y_renderer = new WebGLRenderer({
			antialias: true,
		});

		const g_rect = qs(document.body, '.msg-panel').getBoundingClientRect();
		const xl_width = window.innerWidth;
		const xl_height = Math.max(400, Math.min(800, window.innerHeight - g_rect.bottom));
		y_renderer.setSize(xl_width, xl_height);
		dm_container.appendChild(y_renderer.domElement);

		const xr_aspect = xl_width / xl_height;

		// create scene
		const y_scene = new Scene();

		// camera
		const y_camera = new PerspectiveCamera(45, xr_aspect, 1, 5000);
		{
			y_camera.position.set(0, 0, 140);
			y_camera.lookAt(0, 0, 0);
		}

		// player chip
		const ym_chip = chip(h_textures.chip, h_textures.chip_displace);
		{
			// hide chip until ready to animate
			ym_chip.visible = false;

			// add chip to scene
			y_scene.add(ym_chip);
		}
		
		// ambient light
		{
			const yl_ambient = new AmbientLight(0x303030);
			y_scene.add(yl_ambient);
		}

		// player's chip spot light
		{
			const yl_spot = new SpotLight();
			yl_spot.position.set(0, 100, 50);
			yl_spot.decay = 2.5;
			// yl_spot.castShadoow = true;
			yl_spot.angle = Math.PI / 9;
			yl_spot.penumbra = 0.9;

			y_scene.add(yl_spot);
		}

		let y_clock: Clock;

		// render
		function render() {
			y_renderer.render(y_scene, y_camera);
		}

		y_renderer.setAnimationLoop(() => {
			render();
			updateTween();
		});

		async function animate_chip_entry() {
			// put it way out there
			ym_chip.position.y = 800000;

			// show chip
			ym_chip.visible = true;

			const y_tween_pos = new Tween(new Vector3(-780, -2450, -3000))
				.to(new Vector3(0, 0, 0), 4000)
				.easing(Easing.Cubic.Out)
				.onUpdate((yv_pos) => {
					// ym_chip.position.copy(yv_pos);
					ym_chip.position.setX(yv_pos.x);
					ym_chip.position.setZ(yv_pos.z);
				});
			
			y_tween_pos.start();


			const y_tween_y = new Tween({y: 750})
				.to({y: 0}, 4000)
				.easing(Easing.Back.Out)
				.onUpdate(({y:x_y}) => {
					ym_chip.position.setY(x_y);
				});
			
			y_tween_y.start();

			const y_tween_rot = new Tween(new Euler(0, 0, 0))
				.to(new Euler(0, X_PI / 2, (X_PI / 2) - (X_PI / 6)), 4000)
				.easing(Easing.Cubic.Out)
				.onUpdate((yv_rot) => {
					ym_chip.rotation.set(yv_rot.x, yv_rot.y, yv_rot.z);
				});
			
			y_tween_rot.start();

		};
	});
</script>

<style lang="less">
	
</style>

<div bind:this={dm_container}>
</div>
