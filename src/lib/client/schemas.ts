import { RecordId, StringRecordId } from "surrealdb";
import z, { ZodObject } from "zod/v4";

// TODO:
// 1. refactor into better builder for metadata
// 2. translations
const LevelSchema = z.object({
	id: z.custom<RecordId<"levels">>().transform((v) => new StringRecordId(v))
		.meta({ column: { hidden: true } }),
	name: z.string()
		.meta({ column: { editor: "text", flexgrow: 1 } }),
}).meta({ id: "level", title: "Level" });

const ElectricRoomSchema = z.object({
	id: z.custom<string>().transform((v) => new StringRecordId(v))
		.meta({ column: { hidden: true } }),
	name: z.string()
		.meta({ column: { sort: true, editor: "text", auto: "data" } }),
	level: z.custom<RecordId<"levels">>().transform((v) => new StringRecordId(v))
		.meta({ table: "levels", filter: "richselect", column: { sort: true, editor: "richselect" } }),
}).meta({
	id: "electric_rooms",
	title: "Electric Rooms",
	sort: [
		{ key: "level", order: "asc" },
		{ key: "name", order: "asc" },
	]
});

const BoardSchema = z.object({
	id: z.custom<string>().transform((v) => new StringRecordId(v))
		.meta({ column: { hidden: true } }),
	name: z.string()
		.meta({ column: { editor: "text", auto: "data" } }),
	room: z.custom<RecordId<"electric_rooms">>().transform((v) => new StringRecordId(v))
		.meta({ table: "electric_rooms", column: { editor: "combo", auto: "data" } }),
}).meta({
	id: "boards",
	title: "Boards",
	sort: { key: "room", order: "asc" }
});

const BreakerSchema = z.object({
	id: z.custom<RecordId<"breakers">>().transform((v) => new StringRecordId(v))
		.meta({ column: { hidden: true } }),
	name: z.string(),
	current: z.number().optional(),
	description: z.string().optional(), // FIXME: is this should be generated from graph?
	board: z.custom<RecordId<"boards">>().transform((v) => new StringRecordId(v))
		.meta({ table: "boards", column: { editor: "combo" } }),
}).meta({
	id: "breakers",
	title: "Breakers",
	sort: { key: "name", order: "asc" }
});

const BreakerConnectionSchema = z.object({
	id: z.custom<RecordId<"connects">>().transform((v) => new StringRecordId(v)).readonly()
		.meta({ column: { hidden: true } }),
	in: z.custom<RecordId<"breakers">>().transform((v) => new StringRecordId(v)),
	cable: z.string().optional(),
	out: z.custom<RecordId<"breakers"> | RecordId<"area_name">>().transform((v) => new StringRecordId(v)),
}).meta({
	id: "connects",
	title: "Breaker Connections",
	views: ["flow"]
});

const AreaNameSchema = z.object({
	id: z.custom<RecordId<"area_name">>().transform((v) => new StringRecordId(v))
		.meta({ column: { hidden: true } }),
	name: z.string()
		.meta({ filter: "text", column: { sort: true, editor: "text", auto: "data" } }),
	shop: z.custom<string>().transform((v) => new StringRecordId(v)).optional()
		.meta({
			table: "shops",
			filter: "text",
			column: {
				editor: "combo", auto: "data"
			}
		}),
}).meta({
	id: "area_name",
	title: "Areas",
	sort: { key: "name", order: "asc" }
});

const ShopSchema = z.object({
	id: z.custom<RecordId<"shops">>().transform((v) => new StringRecordId(v))
		.meta({ column: { hidden: true } }),
	name: z.string()
		.meta({ column: { editor: "text", flexgrow: 1, sort: (a: any, b: any) => a.name.localeCompare(b.name) } }),
}).meta({
	id: "shops",
	title: "Shops",
	sort: { key: "name", order: "asc" }
});

export const schemas = new Map<string, ZodObject>([
	["connects", BreakerConnectionSchema],
	["levels", LevelSchema],
	["electric_rooms", ElectricRoomSchema],
	["boards", BoardSchema],
	["breakers", BreakerSchema],
	["area_name", AreaNameSchema],
	["shops", ShopSchema],
]);


export type Schemas = typeof BreakerConnectionSchema | typeof LevelSchema | typeof ElectricRoomSchema | typeof BoardSchema | typeof BreakerSchema | typeof AreaNameSchema | typeof ShopSchema;
export type Data = z.infer<Schemas>;
// export const schemas = {
// 	connects: BreakerConnectionSchema,
// 	levels: LevelSchema,
// 	electric_rooms: ElectricRoomSchema,
// 	boards: BoardSchema,
// 	breakers: BreakerSchema,
// 	area_name: AreaNameSchema,
// 	shops: ShopSchema,
// }
