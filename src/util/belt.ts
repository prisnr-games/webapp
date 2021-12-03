
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

export function microtask(): Promise<void> {
	return new Promise((fk_resolve) => {
		queueMicrotask(() => {
			fk_resolve();
		});
	});
}

export const proper = (s: string) => s[0].toUpperCase() + s.slice(1);
