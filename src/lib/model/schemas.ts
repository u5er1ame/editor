// TODO:
// 1. refactor into better builder for metadata
// 2. translations?
// INFO: this is copy of old schemas to new mvc rewrite

import z from 'zod/v4';
import { BoundQuery, RecordId } from 'surrealdb';
import type { BaseConfig } from './types';

export type AllKeys<T> = T extends any ? keyof T : never;

export type TableKeys<T extends ClientSchemas> = AllKeys<z.infer<T>>;

export const LevelSchema = z.object({
	id: z.custom<RecordId<"levels">>().readonly(),
	name: z.string()
})
const LevelQuery = new BoundQuery("select * from levels");

export const ShopSchema = z.object({
	id: z.custom<RecordId<'shops'>>(),
	name: z.string()
})
const ShopQuery = new BoundQuery("select * from shops");

export const ElectricRoomSchema = z.object({
	id: z.custom<RecordId<"electric_rooms">>().readonly(),
	name: z.string(),
	level: z.custom<RecordId<"levels">>(),
})
export const ClientElectricRoomSchema = ElectricRoomSchema.extend({
	level: LevelSchema,
})
const ElectricRoomQuery = new BoundQuery("select * from electric_rooms fetch level");

export const BoardSchema = z.object({
	id: z.custom<string>(),
	name: z.string(),
	room: z.custom<RecordId<'electric_rooms'>>()
})
export const ClientBoardSchema = BoardSchema.extend({
	room: ClientElectricRoomSchema,
})
const BoardQuery = new BoundQuery("select * from boards fetch room, room.level");

export const BreakerSchema = z.object({
	id: z.custom<RecordId<'breakers'>>().readonly(),
	name: z.string(),
	current: z.number().optional(),
	description: z.string().optional(), // FIXME: is this should be generated from graph?
	board: z.custom<RecordId<'boards'>>()
})
export const ClientBreakerSchema = BreakerSchema.extend({
	board: ClientBoardSchema,
})
const BreakerQuery = new BoundQuery("select * from breakers fetch board, board.room, board.room.level");


export const AreaNameSchema = z.object({
	id: z.custom<RecordId<'area_name'>>(),
	name: z.string().min(2),
	shop: z.custom<RecordId<'shops'>>().optional()
})
export const ClientAreaNameSchema = AreaNameSchema.extend({
	shop: ShopSchema,
})
const AreaNameQuery = new BoundQuery("select * from area_name fetch shop");

export const BreakerConnectionSchema = z.object({
	id: z.custom<RecordId<'connects'>>().readonly(),
	in: z.custom<RecordId<'breakers'>>(),
	cable: z.string().optional(),
	out: z.custom<RecordId<'breakers'> | RecordId<'area_name'>>()
})

export const ClientBreakerConnectionSchema = BreakerConnectionSchema.extend({
	out: z.union([ClientBreakerSchema, ClientAreaNameSchema]),
})
const BreakerConnectionQuery = new BoundQuery("select *, in.*, out.* from connects");



export type ServerSchemas =
	| typeof BreakerConnectionSchema
	| typeof LevelSchema
	| typeof ElectricRoomSchema
	| typeof BoardSchema
	| typeof BreakerSchema
	| typeof AreaNameSchema
	| typeof ShopSchema;
export type ServerData = z.infer<ServerSchemas>;
export type ClientSchemas =
	| typeof ClientBreakerConnectionSchema
	| typeof LevelSchema
	| typeof ClientElectricRoomSchema
	| typeof ClientBoardSchema
	| typeof ClientBreakerSchema
	| typeof ClientAreaNameSchema
	| typeof ShopSchema;
export type ClientData = z.infer<ClientSchemas>;


export type ModelRegistry = {
	server: ServerSchemas,
	client: ClientSchemas,
	query: BoundQuery,
}

export class SchemaRegistry {
	store = new Map<string, ModelRegistry>();
	constructor() {
	}

	addSchemas(table_name: string, data: ModelRegistry) {
		this.store.set(table_name, data);
	}

	defaultConfig(name: string): BaseConfig {
		if(!this.store.has(name)) throw new Error('Schema not found in registry');
		return {
			id: name,
			label: name.charAt(0).toUpperCase() + name.slice(1),
			views: new Set(["table"]),
		};
	}
}
// WARN: 1. db schemas (mark fetched fields later)
// 2. dont add additional info here use ConfigStore instead
export const schemaStore = new SchemaRegistry();
// INFO: ADD/REM SCHEMAS HERE
schemaStore.addSchemas('breakers', { server: BreakerSchema, client: ClientBreakerSchema, query: BreakerQuery });
schemaStore.addSchemas('boards', { server: BoardSchema, client: ClientBoardSchema, query: BoardQuery });
schemaStore.addSchemas('electric_rooms', { server: ElectricRoomSchema, client: ClientElectricRoomSchema, query: ElectricRoomQuery });
schemaStore.addSchemas('levels', { server: LevelSchema, client: LevelSchema, query: LevelQuery });
schemaStore.addSchemas('shops', { server: ShopSchema, client: ShopSchema, query: ShopQuery });
schemaStore.addSchemas('area_name', { server: AreaNameSchema, client: ClientAreaNameSchema, query: AreaNameQuery });
schemaStore.addSchemas('connects', { server: BreakerConnectionSchema, client: ClientBreakerConnectionSchema, query: BreakerConnectionQuery });
