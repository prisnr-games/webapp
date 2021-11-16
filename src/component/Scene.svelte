<script context="module" lang="ts">
	export interface SceneHelper {
		animate_chip_entry(si_color: CanonicalColor, si_shape: CanonicalShape): Promise<void>;
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
import { CanonicalColor, CanonicalShape, H_COLORS } from '#/intl/game';

	const X_PI = Math.PI;
	const X_2PI = X_PI * 2;
	const X_SQRT_3 = Math.sqrt(3);

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

	function draw_shape(d_ctx: CanvasRenderingContext2D, x_center: number, x_area: number, si_color: CanonicalColor, si_shape: CanonicalShape): void {
		// const x_draw_x = Math.round(x_center - xr_draw);
		// const xl_draw_w = Math.round(xr_draw * 2);

		const yp_shape = new Path2D();

		switch(si_shape) {
			case 'triangle': {
				// solve for side length given area
				const xl_side = Math.sqrt((x_area) * X_SQRT_3);

				// solve for altitude
				const xl_alt = X_SQRT_3 * 0.5 * xl_side;

				// solve for origin height
				const xl_od = (xl_side * X_SQRT_3) / 6;

				// center tip
				yp_shape.moveTo(x_center, x_center - (xl_alt - xl_od));

				// bottom right vertex
				yp_shape.lineTo(x_center + xl_side / 2, x_center + xl_od);

				// bottom left vertex
				yp_shape.lineTo(x_center - xl_side / 2, x_center + xl_od);
				break;
			}

			case 'square': {
				// solve for side length given area
				const xl_side = Math.sqrt(x_area);

				// x/y offset
				const x_draw_x = x_center - (xl_side * 0.5);

				// draw
				yp_shape.moveTo(x_draw_x, x_draw_x);
				yp_shape.lineTo(x_draw_x + xl_side, x_draw_x);
				yp_shape.lineTo(x_draw_x + xl_side, x_draw_x + xl_side);
				yp_shape.lineTo(x_draw_x, x_draw_x + xl_side);
				break;
			}

			case 'circle': {
				const xr_circle = Math.sqrt(x_area / X_PI);

				yp_shape.ellipse(x_center, x_center, xr_circle, xr_circle, 0, 0, X_2PI);
				break;
			}

			case 'star': {
				const x_pi_5 = X_PI / 5;

				const xr_star = Math.sqrt((2 * x_area) / (5 * Math.sin(x_pi_5)));

				let xa_spike = -1.5 * x_pi_5;

				yp_shape.moveTo(x_center, x_center - xr_star);
				for(let i_spike=0; i_spike<9; i_spike++) {
					const xr_spike = xr_star * (((i_spike % 2) + 1) / 2);

					yp_shape.lineTo(
						x_center + (xr_spike * Math.cos(xa_spike)),
						x_center + (xr_spike * Math.sin(xa_spike))
					);

					xa_spike += x_pi_5;
				}
				break;
			}
		}

		yp_shape.closePath();

		d_ctx.fillStyle = H_COLORS[si_color].color;
		d_ctx.fill(yp_shape);

		d_ctx.strokeStyle = 'black';
		d_ctx.lineWidth = Math.round(Math.sqrt(x_area) / 50);
		d_ctx.stroke(yp_shape);

		// d_ctx.restore()
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

	onMount(async() => {
		// set scene helper
		k_scene = {
			animate_chip_entry,
		};

		h_textures = await load_textures({
			chip: '/asset/chip.png',
			chip_displace: '/asset/chip-displacement.png',
			scuffs: '/asset/scuffs.png',
		});

		// chip texture
		let yt_chip = h_textures.chip;
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
		let yt_bump = h_textures.scuffs;
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
		let ym_chip: Mesh;

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

		async function animate_chip_entry(si_color: CanonicalColor, si_shape: CanonicalShape) {
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
	});
</script>

<style lang="less">
	
</style>

<div bind:this={dm_container}>
</div>
