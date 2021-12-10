import {
	A_COLORS,
	A_SHAPES,
	H_COLORS,
} from '#/intl/game';

import type {
	CanonicalColor,
	CanonicalShape,
	CanonicalBasis,
	CanonicalTarget,
} from '#/intl/game';

export type SemanticColorQuality = `color:${CanonicalColor}`;
export type SemanticShapeQuality = `shape:${CanonicalShape}`;

export type SemanticQuality = SemanticColorQuality | SemanticShapeQuality;

export type SemanticAssertion_Nobody = `nobody_has|${SemanticQuality}`;
export type SemanticAssertion_Mine = `i_have|${SemanticQuality}`;
export type SemanticAssertion = `${CanonicalBasis}|${SemanticQuality}`;

// export type QualityMask = number & {}

export const XM_DEDUCE_BLANK = 0xffff;  // 16 bits

const XM_HI_BIT = 0b10000000;

const S_TABLE = 'RGBK▲▆●★';  // ▆ █ ✶ ★

function render_known(xm_known: number): string {
	let a_out = [];
	for(let ii_each = 0; ii_each < 8; ii_each++) {
		if(xm_known & XM_HI_BIT) {
			a_out.push(S_TABLE[ii_each]);
		}
		else {
			a_out.push(' ');
		}

		xm_known = xm_known << 1;
	}

	return `[${a_out.join(',')}]`;
}

function mask_from_semantic(si_semantic: SemanticQuality, b_complement=false): number {
	const [si_quality, s_value] = si_semantic.split(':');

	if('color' === si_quality) {
		const i_color = A_COLORS.indexOf(s_value as CanonicalColor);
		return (1 << (7 - i_color)) | (b_complement? 0x0f: 0);
	}
	else {
		const i_shape = A_SHAPES.indexOf(s_value as CanonicalShape);
		return (1 << (3 - i_shape)) | (b_complement? 0xf0: 0);
	}
}

export function use_quality_in_sentence(si_semantic: SemanticQuality): string {
	const [si_attr, s_value] = si_semantic.split(':');

	return `${'shape' === si_attr? 'a ': ''}${s_value}`;
}

export function use_assertion_in_sentence(si_assertion: SemanticAssertion): string {
	const [si_basis, si_quality] = si_assertion.split('|') as [CanonicalBasis, SemanticQuality];

	return `${'nobody_has' === si_basis? 'nobody has ': 'my shape is'} ${use_quality_in_sentence(si_quality)}`;
}

export interface CanonicalGuessOption {
	target: CanonicalTarget;
	color: CanonicalColor;
	shape: CanonicalShape;
};

export type GuessOption = CanonicalGuessOption | {
	target: 'abstain';
	color: null;
	shape: null;
};

export class Deduction {
	protected _xm_deduce: number;

	constructor(xm_given=XM_DEDUCE_BLANK) {
		this._xm_deduce = xm_given;
	}

	clone(): Deduction {
		return new Deduction(this._xm_deduce);
	}

	/**
	 * rejecting a noobody assertion is more complicated than a bitmask operation can capture
	 */
	nobody(si_assertion: SemanticQuality): this {
		let xm_quality = mask_from_semantic(si_assertion);

		// duplicate for both arbiter and opponent
		xm_quality |= (xm_quality << 8);

		// apply assertion
		this._xm_deduce &= ~xm_quality;

		return this;
	}

	opponent(si_assertion: SemanticQuality, b_believe: boolean): this {
		// accept assertion
		if(b_believe) {
			const xm_opp = mask_from_semantic(si_assertion, true);

			// apply inverse to arbiter
			const xm_arb = ~mask_from_semantic(si_assertion);

			// apply mask
			this._xm_deduce &= (xm_arb << 8) | xm_opp;
		}
		// reject assertion
		else {
			this._xm_deduce &= ~mask_from_semantic(si_assertion);
		}

		return this;
	}

	explain(): string {
		const xm_arb = this._xm_deduce >> 8;
		const xm_opp = this._xm_deduce & 0xff;

		return [
			`A: ${render_known(xm_arb)}`,
			`O: ${render_known(xm_opp)}`,
		].join('\n');
	}

	enumerate(si_target: CanonicalTarget): CanonicalGuessOption[] {
		let xm_known = 'bag' === si_target? this._xm_deduce >> 8: this._xm_deduce & 0xff;

		const a_colors: CanonicalColor[] = [];
		const a_shapes: CanonicalShape[] = [];
		for(let ii_each = 0; ii_each<8; ii_each++) {
			if(xm_known & XM_HI_BIT) {
				if(ii_each < 4) {
					a_colors.push(A_COLORS[ii_each]);
				}
				else {
					a_shapes.push(A_SHAPES[ii_each-4]);
				}
			}

			xm_known = xm_known << 1;
		}

		// pairwise combinations
		const a_out: CanonicalGuessOption[] = [];
		for(const si_color of a_colors) {
			for(const si_shape of a_shapes) {
				a_out.push({
					target: si_target,
					color: si_color,
					shape: si_shape,
				});
			}
		}

		return a_out;
	}
}
