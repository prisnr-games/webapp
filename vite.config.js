import {defineConfig} from 'vite';
import path from 'path';
import {svelte} from '@sveltejs/vite-plugin-svelte';

/*
const k_resolver = resolve({
	browser: true,
	dedupe: ['svelte'],
	extensions: [
		'.ts',
		'.mjs',
		'.js',
		'.svelte',
	],
});
*/

export default defineConfig({
    plugins: [
		svelte(),
	],
    resolve: {
        alias: {
            '#': path.resolve(__dirname, './src'),
        }
    },
})