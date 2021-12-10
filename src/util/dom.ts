import { ode } from './belt';
import type { JsonValue } from './types';

type Hash = Record<string, string>;

type Split<S extends string, D extends string> = S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

type TakeLast<V> = V extends []
	? never
	: V extends [string]
		? V[0]
		: V extends [string, ...infer R]
			? TakeLast<R>
			: never;

type TrimLeft<V extends string> = V extends ` ${infer R}` ? TrimLeft<R> : V;

type TrimRight<V extends string> = V extends `${infer R} ` ? TrimRight<R> : V;

type Trim<V extends string> = TrimLeft<TrimRight<V>>;

type StripModifier<V extends string, M extends string> = V extends `${infer L}${M}${infer A}` ? L : V;

type StripModifiers<V extends string> = StripModifier<
	StripModifier<
		StripModifier<
			StripModifier<V, '.'>, '#'
		>,
	'['>,
':'>;

type TakeLastAfterToken<V extends string, T extends string> = StripModifiers<
	TakeLast<
		Split<
			Trim<V>, T
		>
	>
>;

type GetLastElementName<V extends string> = TakeLastAfterToken<
	TakeLastAfterToken<V, ' '>,
	'>'
>;

type GetEachElementName<V, L extends string[] = []> = V extends []
	? L
	: V extends [string]
		? [...L, GetLastElementName<V[0]>]
		: V extends [string, ...infer R]
			? GetEachElementName<R, [...L, GetLastElementName<V[0]>]>
			: [];

type GetElementNames<V extends string> = GetEachElementName<Split<V, ','>>;

type ElementByName<V extends string> = V extends keyof HTMLElementTagNameMap
	? HTMLElementTagNameMap[V]
	: V extends keyof SVGElementTagNameMap
		? SVGElementTagNameMap[V]
		: Element;

type MatchEachElement<V, L extends Element = Element> = V extends []
	? L
	: V extends [string]
		? L | ElementByName<V[0]>
		: V extends [string, ...infer R]
			? MatchEachElement<R, L | ElementByName<V[0]>>
			: L;

type QueryResult<T extends string> = MatchEachElement<GetElementNames<T>>;

export const qs = <T extends string>(dm_node: ParentNode | HTMLElement, sq_selector: T): QueryResult<T> => dm_node.querySelector(sq_selector) as QueryResult<T>;

export const qsa = <T extends string>(dm_node: ParentNode | HTMLElement, sq_selector: T): QueryResult<T>[] => Array.prototype.slice.call(dm_node.querySelectorAll(sq_selector), 0);

export function dd<T extends HTMLElement = HTMLElement>(
	s_tag: string,
	h_attrs: Record<string, string | number | boolean> = {},
	a_children: (Element | string)[] = [],
): T {
	const dm_node = document.createElement(s_tag);

	for(const si_attr in h_attrs) {
		dm_node.setAttribute(si_attr, h_attrs[si_attr]+'');
	}

	for(const w_child of a_children) {
		dm_node.append(w_child);
	}

	return dm_node as T;
}


const S_UUID_V4 = 'xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx';
const R_UUID_V4 = /[xy]/g;

export const uuid_v4 = (): string => {
	let dt_now = Date.now();
	if('undefined' !== typeof performance) dt_now += performance.now();
	return S_UUID_V4.replace(R_UUID_V4, (s) => {
		const x_r = (dt_now + (Math.random()*16)) % 16 | 0;
		dt_now = Math.floor(dt_now / 16);
		return ('x' === s? x_r: ((x_r & 0x3) | 0x8)).toString(16);
	});
};

export function read_cookie(): Record<string, string> {
	return document.cookie.split(';').reduce((h_out, s_cookie) => {
		const a_split = s_cookie.trim().split('=');
		return {
			...h_out,
			[a_split[0]]: a_split.slice(1).join('='),
		};
	}, {});
}

export function read_cookie_json<T extends JsonValue=JsonValue>(si_key: string): T {
	const h_cookie = read_cookie();

	if(!(si_key in h_cookie)) return null;

	let w_value: JsonValue;
	try {
		w_value = JSON.parse(h_cookie[si_key]);
	}
	catch(e_parse) {
		console.error(`failed to parse cookie JSON value associated with key '${si_key}'`);
		delete_cookie(si_key);
	}

	return w_value;
}

export function write_cookie(h_cookie: Record<string, JsonValue>, xt_expires: number) {
	const h_serialize: Record<string, string> = {};

	for(const [si_key, z_value] of ode(h_cookie)) {
		if('string' === typeof z_value) {
			h_serialize[si_key] = z_value;
		}
		else if(null === z_value || 'undefined' === typeof z_value) {
			delete_cookie(si_key);
		}
		else {
			h_serialize[si_key] = JSON.stringify(z_value);
		}
	}

	document.cookie = Object.entries({
		...h_serialize,
		'max-age': ''+xt_expires,
	})
		.map(([si_key, s_value]) => `${si_key}=${s_value}`)
		.join('; ');
}

export function delete_cookie(si_cookie: string) {
	return write_cookie({
		[si_cookie]: '',
	}, 0);
}
