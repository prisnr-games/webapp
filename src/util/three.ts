import {
	Scene,
	PerspectiveCamera,
	WebGLRenderer,
	Vector3,
	LineBasicMaterial,
	BufferGeometry,
	Line,
	Mesh,
	TextureLoader,
	MeshBasicMaterial,
	MeshLambertMaterial,
	CylinderGeometry,
	MeshPhongMaterial,
	Texture,
	MeshToonMaterial,
	Shape,
} from 'three';


export function chip(y_texture: Texture, y_displacement: Texture): Mesh {
	const y_geom = new CylinderGeometry(39, 39, 3.3, 128, 1);

	const a_materials = [
		new MeshToonMaterial({
			color: 'red',
		}),
		new MeshToonMaterial({
			map: y_texture,
			// bumpMap: y_displacement,
			// bumpScale: -1,
		}),
		new MeshToonMaterial({
			map: y_texture,
		}),
	];

	{
		const ys_cover = new Shape();
		for(var i = 0; i < 16; i++) {
		var pct = (i + 1) / 16;
		var theta = pct * Math.PI * 2.0;
		var x = 10 * Math.cos(theta);
		var y = 10 * Math.sin(theta);
		if (i == 0) {
			ys_cover.moveTo(x, y);
		} else {
			ys_cover.lineTo(x, y);
		}

		// // ys_cover.
		// ys_cover.makeGeometry();
	}

	return new Mesh(y_geom, a_materials);
}

