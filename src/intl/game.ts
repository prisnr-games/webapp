
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

}

interface Shape extends Labeled {

}

export const A_COLORS: Color[] = [
	{
		labels: {
			en: 'red',
		},
	},
	{
		labels: {
			en: 'green',
		},
	},
	{
		labels: {
			en: 'blue',
		},
	},
	{
		labels: {
			en: 'black',
		},
	},
];

export const A_SHAPES: Shape[] = [
	{
		labels: {
			en: 'triangle',
		},
	},
	{
		labels: {
			en: 'square',
		},
	},
	{
		labels: {
			en: 'circle',
		},
	},
	{
		labels: {
			en: 'star',
		},
	},
];
