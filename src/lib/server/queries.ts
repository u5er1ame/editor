import { BoundQuery, Table } from 'surrealdb';

export const getTables = new BoundQuery("info for db structure.tables");

export const generateId = new BoundQuery("rand::id()");

export function getInfoForTable(t: Table) {
	const table = t.toString();
	return new BoundQuery("info for table $table structure", { table });
}
