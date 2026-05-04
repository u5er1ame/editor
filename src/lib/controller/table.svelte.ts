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
				if (cur == undefined || pre == undefined) return;
				const real = new Set(cur.map((t) => t.name));
				const allSchemasId = new Set(tables.map((t) => t.name));
				const missing = real.difference(allSchemasId);
				const names = missing
					.values()
					// .map((t) => t.name)
					.toArray();
				if (missing.size > 0) throw new Error(`missing schemas: ${names}`);
				this.store.registerSchemas();
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

	getTableInfo(table: string) {
		return this.tablesInfo?.findLast((t) => t.name === table);
	}

	getTables() {
		if (this.tablesInfo == undefined) throw new Error('no tables info');
		return this.tablesInfo?.map((table) => table.name);
	}

	getViewsForTable(table: string): Set<View> {
		if (this.availableViews.size == 0) throw new Error('no views registered');
		const meta = this.store.getTableMeta(table);
		if (meta?.views == undefined) return new Set([new DefaultView()]); // FIXME: should i do this?
		return this.availableViews.intersection(new Set(meta.views));
	}
}
