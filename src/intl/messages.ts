import type {
	Labeled,
} from './game';

export const H_MESSAGES = {
	attention: [
		{
			labels: {
				en: 'hey there :)',
			},
		},
		{
			delay: 2500,
			labels: {
				en: 'one sec...',
			},
		},
		{
			delay: 1800,
			labels: {
				en: 'one sec... the Arbiter approaches...',
			},
		},
	],

	loading: [
		{
			delay: 2000,
			labels: {
				en: 'loading',
			},
		},
		{
			delay: 250,
			interval: 500,
			labels: {
				en: 'loading......',
			},
		},
	],
} as Record<string, Array<Labeled & {
	delay?: number;
	interval?: number;
}>>;
