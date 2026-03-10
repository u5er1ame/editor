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

const LevelSchema = z.object({
	id: z.custom<RecordId<"levels">>(),
	name: z.string(),
});
const ElectricRoomSchema = z.object({
	id: z.custom<RecordId<"electric_rooms">>(),
	name: z.string(),
	level: z.custom<RecordId<"levels">>(),
});
const BoardSchema = z.object({
	id: z.custom<RecordId<"boards">>(),
	name: z.string(),
	room: z.custom<RecordId<"electric_rooms">>(),
});
const BreakerSchema = z.object({
	id: z.custom<RecordId<"breakers">>(),
	name: z.string(),
	value: z.number(),
	board: z.custom<RecordId<"boards">>(),
});
