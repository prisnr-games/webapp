import type {
	Labeled,
} from './game';

export const H_MESSAGES = {
	attention: [
		// {
		// 	labels: {
		// 		en: 'hey there :)',
		// 	},
		// },
		// {
		// 	delay: 2000,
		// 	pause: 800,
		// 	labels: {
		// 		en: 'glad you made it!',
		// 	},
		// },
		// {
		// 	pause: 600,
		// 	delay: 1800,
		// 	labels: {
		// 		en: 'just remember that you should nev',
		// 	},
		// },
		{
			labels: {
				en: 'the Arbiter approaches...',
			},
		},
	],

	loading: [
		{
			delay: 2000,
			interval: 200,
			labels: {
				en: 'hmmm',
			},
		},
		{
			delay: 250,
			interval: 500,
			labels: {
				en: 'hmmm....',
			},
		},
	],
} as Record<string, Array<Labeled & {
	delay?: number;
	interval?: number;
	pause?: number;
}>>;
