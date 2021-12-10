<script context="module" lang="ts">
	export interface SceneHelper {
		animate_chip_entry(si_color: CanonicalColor, si_shape: CanonicalShape): Promise<void>;
		animate_chip_exit(): Promise<void>;
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
		CanvasTexture,
		MeshPhongMaterial,
	} from 'three';

	import {
		Tween,
		Easing,
		update as updateTween,
	} from '@tweenjs/tween.js';

	import { timeout } from '#/util/belt';
	import { dd, qs } from '#/util/dom';

	import type {
		CanonicalColor,
		CanonicalShape,
	} from '#/intl/game';

	import { draw_shape } from '#/util/draw';


	const X_PI = Math.PI;
	const X_2PI = X_PI * 2;
	const X_SQRT_3 = Math.sqrt(3);

	export const k_scene: SceneHelper = {
		animate_chip_entry,
		animate_chip_exit,
	};;

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


	function canvas_from_tex(y_tex: Texture): [HTMLCanvasElement, CanvasRenderingContext2D, HTMLImageElement] {
		// ref texture's image
		const dm_img = y_tex.image as HTMLImageElement;

		// create canvas element
		const dm_canvas = dd('canvas', {
			width: dm_img.width,
			height: dm_img.height,
		}) as HTMLCanvasElement;

		// fetch 2d rendering context
		const d_ctx = dm_canvas.getContext('2d')!;

		// return tuple
		return [dm_canvas, d_ctx, dm_img];
	}

	let h_textures: Record<string, Texture>;


	// player chip
	let ym_chip: Mesh;

	let yt_chip: Texture;
	let yt_bump: Texture;
	
	// create scene
	const y_scene = new Scene();;


	function create_chip(si_color: CanonicalColor, si_shape: CanonicalShape) {
		// canvas, context and image from texture
		const [dm_canvas, d_ctx, dm_img] = canvas_from_tex(h_textures.chip);

		const xl_width = dm_img.width;
		const xl_height = dm_img.height;

		// draw image to canvas
		d_ctx.drawImage(dm_img, 0, 0);

		const x_center_x = (xl_width / 2)

		// radius of inner 
		const xr_draw = x_center_x * (2 / 9);

		// desired area
		const x_area = Math.pow(x_center_x * (2 / 9), 2) * X_PI;

		// draw shape
		draw_shape(d_ctx, x_center_x, x_area, si_color, si_shape);

		// use canvas texture
		yt_chip = new CanvasTexture(dm_canvas);

		// create chip mesh
		ym_chip = chip(yt_chip, yt_bump);

		// (ym_chip.material as MeshPhongMaterial).map = yt_chip;

		// add chip to scene
		y_scene.add(ym_chip);
	}

	async function animate_chip_entry(si_color: CanonicalColor, si_shape: CanonicalShape): Promise<void> {
		create_chip(si_color, si_shape);
		
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

	async function animate_chip_exit(): Promise<void> {
		const y_tween_pos = new Tween(new Vector3(0, 0, 0))
			.to(new Vector3(-780, -2450, -3000), 4000)
			.easing(Easing.Cubic.Out)
			.onUpdate((yv_pos) => {
				// ym_chip.position.copy(yv_pos);
				ym_chip.position.setX(yv_pos.x);
				ym_chip.position.setZ(yv_pos.z);
			});
		
		y_tween_pos.start();


		const y_tween_y = new Tween({y: 0})
			.to({y: 750}, 4000)
			.easing(Easing.Back.Out)
			.onUpdate(({y:x_y}) => {
				ym_chip.position.setY(x_y);
			});
		
		y_tween_y.start();

		const y_tween_rot = new Tween(new Euler(0, X_PI / 2, (X_PI / 2) - (X_PI / 6)))
			.to(new Euler(0, 0, 0), 4000)
			.easing(Easing.Cubic.Out)
			.onUpdate((yv_rot) => {
				ym_chip.rotation.set(yv_rot.x, yv_rot.y, yv_rot.z);
			});
		
		y_tween_rot.start();

		await timeout(4e3);

		// hide chip
		ym_chip.visible = true;
	}

	onMount(async() => {
		h_textures = await load_textures({
			chip: '/asset/chip.png',
			chip_displace: '/asset/chip-displacement.png',
			scuffs: '/asset/scuffs.png',
		});

		// chip texture
		yt_chip = h_textures.chip;
		// {
		// 	// canvas, context and image from texture
		// 	const [dm_canvas, d_ctx, dm_img] = canvas_from_tex(h_textures.chip);

		// 	const xl_width = dm_img.width;
		// 	const xl_height = dm_img.height;

		// 	// draw image to canvas
		// 	d_ctx.drawImage(dm_img, 0, 0);

		// 	const x_center_x = (xl_width / 2)

		// 	// radius of inner 
		// 	const xr_draw = x_center_x * (2 / 9);

		// 	// desired area
		// 	const x_area = Math.pow(x_center_x * (2 / 9), 2) * X_PI;

		// 	// draw shape
		// 	draw_shape(d_ctx, x_center_x, x_area, 'green', 'circle');

		// 	// use canvas texture
		// 	yt_chip = new CanvasTexture(dm_canvas);
		// }

		// chip bump
		yt_bump = h_textures.scuffs;
		{
			// canvas, context and image from texture
			const [dm_canvas, d_ctx, dm_img] = canvas_from_tex(h_textures.scuffs);

			const xl_w = dm_canvas.width;
			const xl_h = dm_canvas.height;

			const xr_rot = Math.random() * X_2PI;

			// // clear canvas
			// d_ctx.fillStyle = '#ff0000';
			// d_ctx.fillRect(0, 0, xl_w, xl_h);

			// save pre-transformation matrix
			d_ctx.save();

			// computer canvas center
			const xl_half_w = xl_w / 2;
			const xl_half_h = xl_h / 2;

			// rotate canvas by some random amount using center as origin
			d_ctx.translate(xl_half_w, xl_half_h);
			d_ctx.rotate(xr_rot);

			// inscribed square
			d_ctx.scale(Math.SQRT2, Math.SQRT2);

			// draw image
			d_ctx.drawImage(dm_img, -xl_half_w, -xl_half_h);

			// restore pre-transformation matrix
			d_ctx.restore();

			// take largest square

			
			// d_ctx.fillStyle = 'green';
			// const x_x = a_lft[0];
			// const x_y = a_top[0];
			// d_ctx.fillRect(x_x, x_y, a_rgt[0]-x_x, a_btm[0]-x_y);

			// document.body.append(dm_canvas);

			// use canvas texture
			yt_bump = new CanvasTexture(dm_canvas);
		}

		const y_renderer = new WebGLRenderer({
			antialias: true,
		});

		const g_rect = qs(document.body, '.msg-panel').getBoundingClientRect();
		const xl_width = window.innerWidth;
		const xl_height = Math.max(400, Math.min(800, window.innerHeight - g_rect.bottom));
		y_renderer.setSize(xl_width, xl_height);

		// wtf is this about?
		if(!dm_container) return;

		dm_container.appendChild(y_renderer.domElement);

		const xr_aspect = xl_width / xl_height;

		// camera
		const y_camera = new PerspectiveCamera(45, xr_aspect, 1, 5000);
		{
			y_camera.position.set(0, 0, 140);
			y_camera.lookAt(0, 0, 0);
		}

		// const ym_chip = chip(yt_chip, yt_bump);
		// {
		// 	// hide chip until ready to animate
		// 	ym_chip.visible = false;

		// 	// add chip to scene
		// 	y_scene.add(ym_chip);
		// }
		
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
	});
</script>

<style lang="less">
	
</style>

<div bind:this={dm_container}>
</div>
