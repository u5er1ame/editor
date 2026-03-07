import { z, type ZodType } from "zod/v4";
import type { RecordId, Table } from "surrealdb";
import type { IColumn } from "@svar-ui/svelte-grid";

export class DataTable {
	schema: ZodType;
	columns: IColumn[];
	constructor(table: Table) {
		console.log(table.toString());
	}
}
type tst = ZodType<RecordId<"boards">>;

const LevelSchema = z.object({
	id: z.string(),
	name: z.string(),
});
const ElectricRoomSchema = z.object({
	id: z.string(),
	name: z.string(),
	level: z.string(),
});
const BoardSchema = z.object({
	id: z.string(),
	name: z.string(),
	room: z.string(),
});
const BreakerSchema = z.object({
	id: z.string(),
	name: z.string(),
	value: z.number(),
	board: z.string(),
});
