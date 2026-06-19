// TODO:
// 1. refactor into better builder for metadata
// 2. translations?
// INFO: this is copy of old schemas to new mvc rewrite

import z from 'zod/v4';
import { RecordId } from 'surrealdb';
import type { BaseConfig } from './types';

export const LevelSchema = z
	.object({
		id: z.custom<RecordId<"levels">>().readonly().meta({ type: "record" }),
		name: z.string()
	})

export const ElectricRoomSchema = z
	.object({
		id: z.custom<RecordId<"electric_rooms">>().readonly().meta({ type: "record" }),
		name: z.string(),
		level: z.custom<RecordId<"levels">>().meta({ type: "record", fetch: true }),
	})

export const BoardSchema = z
	.object({
		id: z.custom<string>(),
		name: z.string(),
		room: z.custom<RecordId<'electric_rooms'>>()
	})

export const BreakerSchema = z
	.object({
		id: z.custom<RecordId<'breakers'>>(),
		name: z.string(),
		current: z.number().optional(),
		description: z.string().optional(), // FIXME: is this should be generated from graph?
		board: z.custom<RecordId<'boards'>>()
	})

export const BreakerConnectionSchema = z
	.object({
		id: z
			.custom<RecordId<'connects'>>()
			.readonly(),
		in: z.custom<RecordId<'breakers'>>(),
		cable: z.string().optional(),
		out: z
			.custom<RecordId<'breakers'> | RecordId<'area_name'>>()
	})

export const AreaNameSchema = z
	.object({
		id: z.custom<RecordId<'area_name'>>(),
		name: z.string(),
		shop: z
			.custom<string>()
			.optional()
	})

export const ShopSchema = z
	.object({
		id: z.custom<RecordId<'shops'>>(),
		name: z.string()
	})

export type Schemas =
	| typeof BreakerConnectionSchema
	| typeof LevelSchema
	| typeof ElectricRoomSchema
	| typeof BoardSchema
	| typeof BreakerSchema
	| typeof AreaNameSchema
	| typeof ShopSchema;
export type Data = z.infer<Schemas>;

export class SchemaStore {
	store = new Map<string, Schemas>();
	constructor() {
	}

	addSchema(table_name: string, schema: Schemas) {
		this.store.set(table_name, schema);
	}

	defaultConfig(name: string): BaseConfig {
		if(!this.store.has(name)) throw new Error('Schema not found in registry');
		return {
			id: name,
			label: name.charAt(0).toUpperCase() + name.slice(1),
		};
	}
}
// WARN: 1. db schemas (mark fetched fields later)
// 2. dont add additional info here use ConfigStore instead
export const schemaStore = new SchemaStore();
// INFO: ADD/REM SCHEMAS HERE
schemaStore.addSchema('breakers', BreakerSchema);
schemaStore.addSchema('boards', BoardSchema);
schemaStore.addSchema('electric_rooms', ElectricRoomSchema);
schemaStore.addSchema('levels', LevelSchema);
schemaStore.addSchema('shops', ShopSchema);
schemaStore.addSchema('area_name', AreaNameSchema);
schemaStore.addSchema('connects', BreakerConnectionSchema);
