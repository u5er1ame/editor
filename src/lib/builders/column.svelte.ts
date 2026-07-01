import type { IColumn, IColumnConfig, IHeaderCell, IHeaderFilter, IRow, TFilterType, TSortFunction } from "@svar-ui/svelte-grid";


/**
 * Создает функцию сортировки по переданному ключу.
 * Автоматически корректно обрабатывает строки, числа, даты и boolean.
* VIBEEE
 */
export function sortByProperty<T extends Record<string, any>>(
	id: string,
	key: keyof T,
	order: "asc" | "desc" = "asc"
) {
	const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
	const isAsc = order === "asc";

	return (a: T, b: T): -1 | 0 | 1 => {
		if (a[id] == undefined || b[id] == undefined) return 0;
		if (a[id][key] == undefined || b[id][key] == undefined) return 0;
		const valA: any = a[id][key];
		const valB: any = b[id][key];
		// 1. Быстрая проверка на равенство
		if (valA === valB) return 0;

		// conver to number
		if ((isNaN(+valA) || isNaN(+valB)) == false) {
			return Math.sign((+valA) - (+valB)) as -1 | 0 | 1;
		}

		// 2. Обработка null / undefined: уводим пустые значения в самый конец
		if ((valA ?? null) === null) return 1;
		if ((valB ?? null) === null) return -1;

		// 3. Сортировка чисел и дат (используем унарный плюс + для приведения Date к числу)
		const isNumA = typeof valA === "number" || valA instanceof Date;
		const isNumB = typeof valB === "number" || valB instanceof Date;

		if (isNumA && isNumB) {
			let sign = Math.sign(+valA - +valB);
			sign = isNaN(sign)?0:sign;
			if (sign == -0) sign = 0;
			return isAsc ? sign as -1 | 0 | 1: -sign as -1 | 0 | 1
		}

		// 4. Сортировка Boolean (инвертируем логику через ! чтобы false шел перед true)
		if (typeof valA === "boolean" && typeof valB === "boolean") {
			return (isAsc ? !valA : !valB) ? -1 : 1;
		}

		// 5. Естественная сортировка строк и смешанных типов через Collator
		const strA = valA?.toString() ?? "";
		const strB = valB?.toString() ?? "";
		const compareResult = collator.compare(strA, strB);
		let sign = Math.sign(compareResult);
		sign = isNaN(sign)?0:sign;
		if (sign == -0) sign = 0;
		return isAsc ? sign as -1 | 0 | 1: -sign as -1 | 0 | 1
	};
}
function defaultSort(key: string, order: "asc" | "desc" = "asc") {
	const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

	const isAsc = order === "asc";
	return (a: any, b: any): -1 | 0 | 1 => {
		const valA: any = a[key]
		const valB: any = b[key]
		if (valA === valB) return 0;

		if ((isNaN(+valA) || isNaN(+valB)) == false) {
			return Math.sign((+valA) - (+valB)) as -1 | 0 | 1;
		}

		if ((valA ?? null) === null) return 1;
		if ((valB ?? null) === null) return -1;

		const isNumA = typeof valA === "number" || valA instanceof Date;
		const isNumB = typeof valB === "number" || valB instanceof Date;

		if (isNumA && isNumB) {
			let sign = Math.sign(+valA - +valB);
			sign = isNaN(sign)?0:sign;
			if (sign == -0) sign = 0;
			return isAsc ? sign as -1 | 0 | 1: -sign as -1 | 0 | 1
		}

		if (typeof valA === "boolean" && typeof valB === "boolean") {
			return (isAsc ? !valA : !valB) ? -1 : 1;
		}

		// 5. Естественная сортировка строк и смешанных типов через Collator
		const strA = valA?.toString() ?? "";
		const strB = valB?.toString() ?? "";
		const compareResult = collator.compare(strA, strB);
		let sign = Math.sign(compareResult);
		sign = isNaN(sign)?0:sign;
		if (sign == -0) sign = 0;
		return isAsc ? sign as -1 | 0 | 1: -sign as -1 | 0 | 1
	};

}

export class ColumnBuilder {
	private _config: IColumn

	constructor(id: string) {
		this._config = { id };
	}

	get config() {
		return this._config;
	}

	hidden() {
		this._config.hidden = true;
		return this;
	}
	resize() {
		this._config.resize = true;
		return this;
	}

	defaultHeader() {
		const key = this._config.id;
		if (key == undefined) throw new Error("Column id not set");
		const text = key.toString().slice(0, 1).toUpperCase() + key.toString().slice(1);
		this._config.header = [{ text }] as IHeaderCell[];
		return this;
	}
	addHeader(header: IHeaderCell) {
		if (Array.isArray(this._config.header)) {
			this._config.header.push(header);
		}
		else {
			this._config.header = [header];
		}
		return this;
	}
	headerFilter(filter?: TFilterType | IHeaderFilter) {
		if (Array.isArray(this._config.header)) {
			this._config.header.push({filter});
		}
		else {
			this._config.header = [{filter}];
		}
		return this;
	}

	sort(fn?: TSortFunction) {
		this._config.sort = fn ?? true;
		return this;
	}

	grow() {
		this._config.flexgrow = 1;
		return this;
	}

	template(fn?: (value: any, row: IRow, col: IColumn) => string) {
		this._config.template = fn
		return this;
	}

	setter(fn?: (row: IRow,value: any) => void) {
		this._config.setter = fn
		return this;
	}

	getter(fn?: (row: IRow) => any) {
		this._config.getter = fn
		return this;
	}

	build() {
		return this.config;
	}
	static hidden(id: string) {
		return new ColumnBuilder(id).hidden()
	}
	static default(id: string) {
		return new ColumnBuilder(id).defaultHeader().grow().sort(defaultSort(id))
	}
	static defaultWithKey(id: string, key: string) {
		return new ColumnBuilder(id).defaultHeader().grow().sort(sortByProperty(id, key)).template((val)=>val[key]??"")
	}
}
