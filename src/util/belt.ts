export const XTL_SECONDS = 1000;
export const XTL_MINUTES = 60 * XTL_SECONDS;
export const XTL_HOURS = 60 * XTL_MINUTES;
export const XTL_DAYS = 24 * XTL_HOURS;
export const XTL_WEEKS = 7 * XTL_DAYS;
export const XTL_MONTHS = 30 * XTL_DAYS;
export const XTL_YEARS = 365 * XTL_DAYS;

type ReduceParameters<T extends any=any> = Parameters<Array<T>['reduce']>;

export const ode = Object.entries;

export function oder<
	OutType extends any,
	ValueType extends any,
>(h_thing: Record<string, ValueType>, f_reduce: ReduceParameters[0], w_init: OutType): OutType {
	return ode(h_thing).reduce(f_reduce, w_init) as OutType;
}

export function oderac<
	OutType extends any,
	ValueType extends any,
>(h_thing: Record<string, ValueType>, f_concat: (si_key: string, w_value: ValueType) => OutType): OutType[] {
	return ode(h_thing).reduce((a_out, [si_key, w_value]) => [
		...a_out,
		f_concat(si_key, w_value),
	], [] as OutType[]);
}

export function oderaf<
	OutType extends any,
	ValueType extends any,
>(h_thing: Record<string, ValueType>, f_concat: (si_key: string, w_value: ValueType) => OutType[]): OutType[] {
	return ode(h_thing).reduce((a_out, [si_key, w_value]) => [
		...a_out,
		...f_concat(si_key, w_value),
	], [] as OutType[]);
}

export function oderom<
	OutType extends any,
	ValueType extends any,
>(h_thing: Record<string, ValueType>, f_concat: (si_key: string, w_value: ValueType) => Record<string, OutType>): Record<string, OutType> {
	return ode(h_thing).reduce((h_out, [si_key, w_value]) => ({
		...h_out,
		...f_concat(si_key, w_value),
	}), {} as Record<string, OutType>);
}

export function timeout(xt_wait: number): Promise<void> {
	return new Promise((fk_resolve) => {
		setTimeout(() => {
			fk_resolve();
		}, xt_wait);
	});
};

export function forever<T>(): Promise<T> {
	return new Promise(() => {});
}

export function microtask(): Promise<void> {
	return new Promise((fk_resolve) => {
		queueMicrotask(() => {
			fk_resolve();
		});
	});
}

export const proper = (s: string) => s[0].toUpperCase() + s.slice(1);


const A_INTERVALS = [
	{ ge: XTL_YEARS, divisor: XTL_YEARS, unit: 'year' },
	{ ge: XTL_MONTHS, divisor: XTL_MONTHS, unit: 'month' },
	{ ge: XTL_WEEKS, divisor: XTL_WEEKS, unit: 'week' },
	{ ge: XTL_DAYS, divisor: XTL_DAYS, unit: 'day' },
	{ ge: XTL_HOURS, divisor: XTL_HOURS, unit: 'hour' },
	{ ge: XTL_MINUTES, divisor: XTL_MINUTES, unit: 'minute' },
	{ ge: XTL_SECONDS, divisor: XTL_SECONDS, unit: 'seconds' },
	{ ge: 0, divisor: 1, text: 'just now' },
];

export function relative_time(z_when: number | Date, z_relative: number | Date=Date.now(), d_rtf=new Intl.RelativeTimeFormat(undefined, {numeric:'auto'})) {
	const xt_now = typeof z_relative === 'object' ? z_relative.getTime() : new Date(z_relative).getTime();
	const xtl_diff = xt_now - (typeof z_when === 'object' ? z_when : new Date(z_when)).getTime();
	const xtl_diff_abs = Math.abs(xtl_diff);
	for (const g_interval of A_INTERVALS) {
		if (xtl_diff_abs >= g_interval.ge) {
			const x_span = Math.round(Math.abs(xtl_diff) / g_interval.divisor);
			const b_future = xtl_diff < 0;
			return g_interval.unit ? d_rtf.format(b_future ? x_span : -x_span, g_interval.unit as Intl.RelativeTimeFormatUnit) : g_interval.text;
		}
	}
}

export class Killables {
	protected _as_intervals = new Set<number>();
	protected _as_timeouts = new Set<number>();

	constructor() {

	}

	addInterval(fk_action: VoidFunction, xtl_interval: number): number {
		const i_handle = window.setInterval(fk_action, xtl_interval);

		this._as_intervals.add(i_handle);

		return i_handle;
	}

	addTimeout(fk_action: VoidFunction, xtl_timeout: number): number {
		const i_handle = window.setTimeout(() => {
			// auto-delete
			this.delTimeout(i_handle);

			// call action
			fk_action();
		}, xtl_timeout);

		this._as_timeouts.add(i_handle);

		return i_handle;
	}

	delInterval(i_handle: number): void {
		window.clearInterval(i_handle);

		this._as_intervals.delete(i_handle);
	}

	delTimeout(i_handle: number): void {
		window.clearTimeout(i_handle);

		this._as_timeouts.delete(i_handle);
	}

	killAll(): void {
		for(const i_handle of this._as_intervals) {
			this.delInterval(i_handle);
		}

		for(const i_handle of this._as_timeouts) {
			this.delTimeout(i_handle);
		}
	}
}


