
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

}

export const H_COLORS: Record<string, Color> = {
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
};

export const A_COLORS = Object.keys(H_COLORS);

export type CanonicalColor = keyof typeof H_COLORS;

export const H_SHAPES: Record<string, Shape> = {
	triangle: {
		labels: {
			en: 'triangle',
		},
	},
	square: {
		labels: {
			en: 'square',
		},
	},
	circle: {
		labels: {
			en: 'circle',
		},
	},
	star: {
		labels: {
			en: 'star',
		},
	},
};

export const A_SHAPES = Object.keys(H_SHAPES);

export type CanonicalShape = keyof typeof H_SHAPES;