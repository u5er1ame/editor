import { SvelteSet } from "svelte/reactivity";
import { Table } from "surrealdb";

import type { DatabaseInfo } from "$lib/client/db.context.svelte";
import type { View } from "$lib/view/table.svelte";
import { SchemaStore } from "$lib/model/󰛦 schema_store"

export class ViewController {
	availableViews: SvelteSet<View> = new SvelteSet([]);
	tablesInfo?: DatabaseInfo["tables"] = $state([]);
	store = new SchemaStore();

	registerView(view: View) {
		console.log('register view', view)
		this.availableViews.add(view);
	}
	registerViews(views: View[]) {
		console.log('register views', views)
		this.availableViews = this.availableViews.union(new Set(views));
	}


	async setTablesInfo(info: DatabaseInfo) {
		this.tablesInfo = info.tables ?? []
	}

	getTables() {
		if (this.tablesInfo == undefined) throw new Error("no tables info")
		return this.tablesInfo?.map((table) => new Table(table.name))
	}

	getViewsForTable(table: Table): Set<View> {
		if (this.availableViews.size == 0) throw new Error("no views registered");
		const views = this.store.getView(table)
		const { id, title } = this.store.getTableMeta(table)
		if (views == undefined) return new Set([{ name: "default", id, title }]);
		return this.availableViews.intersection(new Set(views));
	}
}
