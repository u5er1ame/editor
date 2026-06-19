import type { Data, Schemas } from "$lib/model/schemas";
import { BoundQuery } from "surrealdb";

class ConfigBuilder {
	schema: Schemas
	config: any = {}
	constructor(schema: Schemas) {
		this.schema = schema;
	}
	build() {
	}
	createFetchQuery() {
		const query = new BoundQuery<Data[]>("select * from ${table} fetch ${fetch}");
		console.log(this.schema.shape);
	}
}
