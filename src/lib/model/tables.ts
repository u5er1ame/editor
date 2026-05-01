import { Table } from "surrealdb";

import { s, table_registry } from "$lib/model/schemas";
import type { Schemas } from "$lib/client/schemas";


export const schemas = new Map<Table, Schemas>(s.map((schema) => { return [ new Table(table_registry.get(schema)!.id), schema] }));
export const tables = s.map((schema) => new Table(table_registry.get(schema)!.id));
