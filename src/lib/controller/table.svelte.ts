import { SvelteSet } from 'svelte/reactivity';
import { Table } from 'surrealdb';

import type { DatabaseInfo } from '$lib/client/db.context.svelte';
import type { View } from '$lib/view/table.svelte';
import { SchemaStore } from '$lib/model/schema_store';
import { DefaultView } from '$lib/view/default.svelte';
import { tables } from '$lib/model/schemas';
import { watch } from 'runed';

export class ViewController {
	availableViews: SvelteSet<View> = new SvelteSet([]);
	tablesInfo?: DatabaseInfo['tables'] = $state([]);
	store = new SchemaStore();

	constructor() {
		watch(
			() => this.tablesInfo,
			(cur, pre) => {
				$inspect('WATCHING INFO', cur);
				if (cur == undefined || pre == undefined) return;
				const real = new Set(cur.map((t) => t.name));
				const allSchemasId = new Set(tables.map((t) => t.name));
				const missing = real.difference(allSchemasId);
				$inspect('real', real, 'allSchemasId', allSchemasId, 'missing', missing);
				const names = missing
					.values()
					// .map((t) => t.name)
					.toArray();
				if (missing.size > 0) throw new Error(`missing schemas: ${names}`);
			}
		);
	}

	registerView(view: View) {
		console.log('registering view', view);
		this.availableViews.add(view);
	}
	registerViews(views: View[]) {
		console.log('registering views', views);
		this.availableViews = this.availableViews.union(new Set(views)) as SvelteSet<View>;
	}

	async setTablesInfo(info: DatabaseInfo) {
		this.tablesInfo = info.tables ?? [];
	}

	getTables() {
		if (this.tablesInfo == undefined) throw new Error('no tables info');
		return this.tablesInfo?.map((table) => new Table(table.name));
	}

	getViewsForTable(table: Table): Set<View> {
		if (this.availableViews.size == 0) throw new Error('no views registered');
		const views = this.store.getViews(table);
		const { id, title } = this.store.getTableMeta(table);
		if (views == undefined) return new Set([DefaultView]); // FIXME: should i do this?
		return this.availableViews.intersection(new Set(views));
	}
}
