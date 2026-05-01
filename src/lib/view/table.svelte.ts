import type { Data, Schemas } from "$lib/client/schemas";

export interface View {
	name: string;
	href: string;
}

export class TableView implements View {
	name = "Tables";
	href = "/tables"
	options: any[] = [];
	constructor() {
	}
}

export class GraphView implements View {
	name = "Graph";
	href = "/graph"
	options: any[] = [];
	constructor(schema: Schemas) {
		console.log('schema', schema.shape);
	}
}

export class MapView implements View {
	name = "Map";
	href = "/map"
	options: any[] = [];
	constructor(schema: Schemas) {
		console.log('schema', schema.shape);
	}
}
