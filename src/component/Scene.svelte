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
	} from 'three';

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
		const h_textures = await load_textures({
			chip: '/asset/chip.png',
			chip_displace: '/asset/chip-displacement.png',
		});

		const y_renderer = new WebGLRenderer();
		y_renderer.setSize(window.innerWidth, window.innerHeight);
		dm_container.appendChild(y_renderer.domElement);

		const xr_aspect = window.innerWidth / window.innerHeight;

		// create scene
		const y_scene = new Scene();

		// camera
		const y_camera = new PerspectiveCamera(45, xr_aspect, 1, 5000);
		{
			y_camera.position.set(0, 120, -50);
			y_camera.lookAt(0, 0, 0);
		}

		// {
		// 	const ym_mat = new MeshBasicMaterial({
		// 		color: 'red',
		// 	});
		// 	const y_cube = new Mesh(new BoxGeometry(1, 1, 1), ym_mat);
		// 	y_scene.add(y_cube);
		// }

		// //create a blue LineBasicMaterial
		// const y_material = new LineBasicMaterial( { color: 0x0000ff } );
		

		// const a_points = [];
		// a_points.push(new Vector3( - 10, 0, 0));
		// a_points.push(new Vector3( 0, 10, 0 ));
		// a_points.push(new Vector3( 10, 0, 0 ));

		// const y_geometry = new BufferGeometry();
		// y_geometry.setAttribute('position', new BufferAttribute(new Float32Array([
		// 	-10, 0, 0,
		// 	0, 10, 0,
		// 	10, 0, 0,
		// ]), 3));


		// const line = new Line(y_geometry, y_material);

		// const y_light_point = new PointLight();
		// y_light_point.position.set(0, 100, 10);
		// y_scene.add(y_light_point);

		// const ym_helpr = new PointLightHelper(y_light_point, 10);
		// y_scene.add(y_light_point);

		const ym_chip = chip(h_textures.chip, h_textures.chip_displace
		);

		y_scene.add(ym_chip);
		
		// ambient light
		{
			const yl_ambient = new AmbientLight(0x303030);
			y_scene.add(yl_ambient);
		}

		// player's chip spot light
		{
			const yl_spot = new SpotLight();
			yl_spot.position.set(0, 100, -50);
			yl_spot.decay = 2.5;
			// yl_spot.castShadoow = true;
			yl_spot.angle = Math.PI / 9;
			yl_spot.penumbra = 0.9;

			y_scene.add(yl_spot);
		}

		// render
		y_renderer.render(y_scene, y_camera);
	});
</script>

<style lang="less">
	
</style>

<div bind:this={dm_container}>
</div>
