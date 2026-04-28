import type { Data, Schemas } from "$lib/client/schemas";

export interface View {
	name: string;
}

export class TableView implements View {
	name = "svar";
	options: any[] = [];
	constructor() {
	}
}

export class GraphView implements View {
	name = "flow";
	options: any[] = [];
	constructor(schema: Schemas) {
		console.log('schema', schema.shape);
	}
}

export class MapView implements View {
	name = "openlayers";
	options: any[] = [];
	constructor(schema: Schemas) {
		console.log('schema', schema.shape);
	}
}
