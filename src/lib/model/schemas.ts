// TODO:
// 1. refactor into better builder for metadata
// 2. translations
// INFO: this is copy of old schemas to new mvc rewrite

import z from 'zod/v4';
import { RecordId, StringRecordId, Table } from 'surrealdb';

export type TablesMeta = {
	id: string;
	title: string;
	views?: string[];
};

export const table_registry = z.registry<TablesMeta>();

const LevelSchema = z
	.object({
		id: z.custom<RecordId<'levels'>>().transform((v) => new StringRecordId(v)),
		name: z.string()
	})
	.register(table_registry, { id: 'levels', title: 'Level' });

const ElectricRoomSchema = z
	.object({
		id: z.custom<string>().transform((v) => new StringRecordId(v)),
		name: z.string(),
		level: z.custom<RecordId<'levels'>>().transform((v) => new StringRecordId(v))
	})
	.register(table_registry, {
		id: 'electric_rooms',
		title: 'Electric Rooms'
	});

const BoardSchema = z
	.object({
		id: z.custom<string>().transform((v) => new StringRecordId(v)),
		name: z.string(),
		room: z.custom<RecordId<'electric_rooms'>>().transform((v) => new StringRecordId(v))
	})
	.register(table_registry, {
		id: 'boards',
		title: 'Boards'
	});

const BreakerSchema = z
	.object({
		id: z.custom<RecordId<'breakers'>>().transform((v) => new StringRecordId(v)),
		name: z.string(),
		current: z.number().optional(),
		description: z.string().optional(), // FIXME: is this should be generated from graph?
		board: z.custom<RecordId<'boards'>>().transform((v) => new StringRecordId(v))
	})
	.register(table_registry, {
		id: 'breakers',
		title: 'Breakers'
	});

const BreakerConnectionSchema = z
	.object({
		id: z
			.custom<RecordId<'connects'>>()
			.transform((v) => new StringRecordId(v))
			.readonly(),
		in: z.custom<RecordId<'breakers'>>().transform((v) => new StringRecordId(v)),
		cable: z.string().optional(),
		out: z
			.custom<RecordId<'breakers'> | RecordId<'area_name'>>()
			.transform((v) => new StringRecordId(v))
	})
	.register(table_registry, {
		id: 'connects',
		title: 'Breaker Connections',
		views: ['flow']
	});

const AreaNameSchema = z
	.object({
		id: z.custom<RecordId<'area_name'>>().transform((v) => new StringRecordId(v)),
		name: z.string(),
		shop: z
			.custom<string>()
			.transform((v) => new StringRecordId(v))
			.optional()
	})
	.register(table_registry, {
		id: 'area_name',
		title: 'Areas'
	});

const ShopSchema = z
	.object({
		id: z.custom<RecordId<'shops'>>().transform((v) => new StringRecordId(v)),
		name: z.string()
	})
	.register(table_registry, {
		id: 'shops',
		title: 'Shops'
	});

// s.map((schema) => {
// 	schema.register(table_registry);
// })

export type Schemas =
	| typeof BreakerConnectionSchema
	| typeof LevelSchema
	| typeof ElectricRoomSchema
	| typeof BoardSchema
	| typeof BreakerSchema
	| typeof AreaNameSchema
	| typeof ShopSchema;
export type Data = z.infer<Schemas>;

// INFO: ADD/REM SCHEMAS HERE
export const schemas: Schemas[] = [
	BreakerConnectionSchema,
	LevelSchema,
	ElectricRoomSchema,
	BoardSchema,
	BreakerSchema,
	AreaNameSchema,
	ShopSchema
];
export const tables: Table[] = schemas.map((schema: Schemas) => {
	return new Table(table_registry.get(schema)!.id);
});
