import type { RecordId } from "surrealdb";
import z, { ZodObject } from "zod/v4";

// TODO: refactor into better builder for metadata
const LevelSchema = z.object({
	id: z.custom<RecordId<"levels">>().meta({ column: { hidden: true } }),
	name: z.string().meta({ column: { editor: "text" } }),
});
const ElectricRoomSchema = z.object({
	id: z.custom<RecordId<"electric_rooms">>().meta({ column: { hidden: true } }),
	name: z.string().meta({ column: { sort: true, editor: "text" } }),
	level: z.custom<RecordId<"levels">>().meta({ table: "levels", column: { sort: true, editor: "richselect" } }),
})
const BoardSchema = z.object({
	id: z.custom<RecordId<"boards">>().meta({ hidden: true }),
	name: z.string().meta({ column: { editor: "text" } }),
	room: z.custom<RecordId<"electric_rooms">>().meta({ table: "electric_rooms", column: { editor: "combo" } }),
})
const BreakerSchema = z.object({
	id: z.custom<RecordId<"breakers">>().meta({ column: { hidden: true } }),
	name: z.string(),
	current: z.number().optional(),
	description: z.string().optional(), // FIXME: is this should be generated from graph?
	board: z.custom<RecordId<"boards">>().meta({ table: "boards", column: { editor: "combo" } }),
});

const BreakerConnectionSchema = z.object({
	id: z.custom<RecordId<"connects">>().meta({ column: { hidden: true } }),
	in: z.custom<RecordId<"breakers">>(),
	cable: z.string().optional(),
	out: z.custom<RecordId<"breakers"> | RecordId<"area_name">>(),
});

const AreaNameSchema = z.object({
	id: z.custom<RecordId<"area_name">>().meta({ column: { hidden: true } }),
	name: z.string().meta({ column: { sort: true, editor: "text" } }),
	shop: z.custom<RecordId<"shops">>().optional().meta({ table: "shops", column: { editor: "combo" } }),
});

const ShopSchema = z.object({
	id: z.custom<RecordId<"shops">>(),
	name: z.string().meta({ column: { editor: "text", sort: (a: any, b: any) => a.name.localeCompare(b.name) } }),
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
