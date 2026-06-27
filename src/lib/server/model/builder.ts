import type { ServerData, ServerSchemas } from "$lib/model/schemas";
import { BoundQuery } from "surrealdb";

class ConfigBuilder {
	schema: ServerSchemas
	config: any = {}
	constructor(schema: ServerSchemas) {
		this.schema = schema;
	}
	build() {
	}
	createFetchQuery() {
		const query = new BoundQuery<ServerData[]>("select * from ${table} fetch ${fetch}");
		console.log(this.schema.shape);
	}
}
