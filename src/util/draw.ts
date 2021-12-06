import {
	H_COLORS,
} from '#/intl/game';

import type {
	CanonicalColor,
	CanonicalShape,
} from '#/intl/game';

const X_PI = Math.PI;
const X_2PI = X_PI * 2;
const X_SQRT_3 = Math.sqrt(3);

export function draw_shape(d_ctx: CanvasRenderingContext2D, x_center: number, x_area: number, si_color: CanonicalColor, si_shape: CanonicalShape): void {
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

			const xl_offset_y = xl_od / 3;

			// center tip
			yp_shape.moveTo(x_center, x_center - (xl_alt - xl_od) + xl_offset_y);

			// bottom right vertex
			yp_shape.lineTo(x_center + xl_side / 2, x_center + xl_od + xl_offset_y);

			// bottom left vertex
			yp_shape.lineTo(x_center - xl_side / 2, x_center + xl_od + xl_offset_y);
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