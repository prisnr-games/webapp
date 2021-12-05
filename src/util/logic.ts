import {
	A_COLORS,
	A_SHAPES,
} from '#/intl/game';

import type {
	CanonicalColor,
	CanonicalShape,
	CanonicalBasis,
} from '#/intl/game';

export type SemanticColorQuality = `color:${CanonicalColor}`;
export type SemanticShapeQuality = `shape:${CanonicalShape}`;

export type SemanticQuality = SemanticColorQuality | SemanticShapeQuality;

export type SemanticAssertion_Nobody = `nobody_has|${SemanticQuality}`;
export type SemanticAssertion_Mine = `i_have|${SemanticQuality}`;
export type SemanticAssertion = `${CanonicalBasis}|${SemanticQuality}`;

// export type QualityMask = number & {}

export const XM_DEDUCE_BLANK = 0xffff;  // 16 bits

const S_TABLE = 'RGBK▲▆●★';  // ▆ █ ✶ ★

function render_known(xm_known: number): string {
	let a_out = [];
	for(let ii_each = 0; ii_each < 8; ii_each++) {
		if(xm_known & 0b10000000) {
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
		return (1 << (7 - i_color)) | (b_complement? 0xff: 0);
	}
	else {
		const i_shape = A_SHAPES.indexOf(s_value as CanonicalShape);
		return (1 << (3 - i_shape)) | (b_complement? 0xff00: 0);
	}
}

export function use_quality_in_sentence(si_semantic: SemanticQuality): string {
	const [si_quality, s_value] = si_semantic.split(':');

	return `${'shape' === si_quality? 'a ': ''}${s_value}`;
}

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
			this._xm_deduce &= mask_from_semantic(si_assertion, true);
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
}
