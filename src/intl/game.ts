
export const H_LANGUAGES = {
	en: {},
} as const;

export type SupportedLanguage = keyof typeof H_LANGUAGES;

export interface Labeled {
	labels: {
		[K in SupportedLanguage]: string;
	};
}

interface Color extends Labeled {
	color: string;
}

interface Shape extends Labeled {
	symbol: string;
}

export const H_COLORS = {
	red: {
		color: '#a00000',
		labels: {
			en: 'red',
		},
	},
	green: {
		color: '#006000',
		labels: {
			en: 'green',
		},
	},
	blue: {
		color: '#0000a0',
		labels: {
			en: 'blue',
		},
	},
	black: {
		color: '#000000',
		labels: {
			en: 'black',
		},
	},
} as const;

export type CanonicalColor = keyof typeof H_COLORS;

export const A_COLORS = Object.keys(H_COLORS) as CanonicalColor[];


export const H_SHAPES = {
	triangle: {
		symbol: '▲',
		labels: {
			en: 'triangle',
		},
	},
	square: {
		symbol: '■',
		labels: {
			en: 'square',
		},
	},
	circle: {
		symbol: '●',
		labels: {
			en: 'circle',
		},
	},
	star: {
		symbol: '★',
		labels: {
			en: 'star',
		},
	},
} as const;

export type CanonicalShape = keyof typeof H_SHAPES;

export const A_SHAPES = Object.keys(H_SHAPES) as CanonicalShape[];

interface Basis {
	describe: {
		[K in SupportedLanguage]: (s: string) => string;
	}
}

export const H_BASES = {
	nobody_has: {
		describe: {
			en: (s: string) => `nobody has ${s || '...'}`,
		},
	},
	i_have: {
		describe: {
			en: (s: string) => `my chip is ${s || '...'}`,
		},
	},
} as const;

export type CanonicalBasis = keyof typeof H_BASES;

export const A_BASES = Object.keys(H_BASES) as CanonicalBasis[];


export const H_TARGETS = {
	bag: {
		label: 'Arbiter',
	},
	opponent: {
		label: 'Opponent',
	},
	abstain: {
		label: 'Abstain',
	},
};

export type CanonicalTarget = keyof typeof H_TARGETS;

export const A_TARGETS = Object.keys(H_TARGETS) as CanonicalTarget[];


export type PickOption = 'nft' | 'jackpot';
