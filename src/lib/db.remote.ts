import { jsonify, surql, Table } from "surrealdb";
import { error } from "@sveltejs/kit";
import { getRequestEvent, query } from "$app/server";
import { env } from "$env/dynamic/private";
import { db, root_access, type DatabaseInfo, type NamespaceInfo, type SystemInfo } from "$lib/server/root_db.svelte";
import { goto } from "$app/navigation";
import z from "zod/v4";
import { schemaStore, type ClientData, type ServerData } from "./model/schemas";
import type { Tables } from "./model/types";

export const connect_system = query(async () => {
	const isConnected = await root_access.connect(env.SURREAL_URL, {
		authentication: {
			username: env.SURREAL_ROOT_VIEWER_USER,
			password: env.SURREAL_ROOT_VIEWER_PASS,
		}
	}).catch(() => false);
	return { isConnected }
});

export const getSystemInfo = query(async () => {
	if (!root_access.isConnected) return
	await root_access.ready.catch(()=>{});
	const [res] = await root_access.query<[{ system: SystemInfo, defaults: { namespace: string, database: string } }]>("info for root structure").catch(()=>{return []});
	return jsonify(res);
});

export const connect = query(async () => {
	const isConnected = await db.connect(env.SURREAL_URL).catch(() => false);
	return isConnected
});

export const getStatus = query(async () => {
	return db.status;
});

export const getNamespaceInfo = query(async () => {
	if (!db.isConnected) error(500,"Cant get NS info DB not connected");
	await db.ready;
	const [res] = await db.query<[NamespaceInfo]>("info for ns structure").catch((e)=>{console.error(e); return []});
	return res ?? {}
});

export const getDatabaseInfo = query(async () => {
	await db.ready.catch(()=>{ return error(500,"DB not ready") });
	const { locals } = getRequestEvent();
	db.use({ database: locals.db.database }); // WARN: this could fail but should be set at this point!
	const [res] = await db.query<[DatabaseInfo]>("info for db structure")
	return res ?? {}
});

export const getDataClient = query<Tables, ClientData[]>(z.string().refine((v)=>schemaStore.store.has(v as Tables), { error: (iss)=>`Schema not found for table ${iss.input}` } ),
	async (table) => {
		if (!db.isConnected) return
		await db.ready.catch(()=>{ return error(500,"DB not ready") });
		const { locals } = getRequestEvent();
		db.use({ database: locals.db.database }); // WARN: this could fail but should be set at this point!
		const query = schemaStore.store.get(table)!.query;
		// const res = await db.select<Data>(new Table(table)).catch((e)=>{ return error(500,e) });
		const [res] = await db.query(query)
		return jsonify(res ?? [])
});

export const getData = query<Tables, ServerData[]>(z.string().refine((v)=>schemaStore.store.has(v as Tables), { error: (iss)=>`Schema not found for table ${iss.input}` } ),
	async (table) => {
		if (!db.isConnected) return
		await db.ready.catch(()=>{ return error(500,"DB not ready") });
		const { locals } = getRequestEvent();
		db.use({ database: locals.db.database }); // WARN: this could fail but should be set at this point!
		const res = await db.select<ServerData>(new Table(table)).catch((e)=>{ return error(500,e) });
		return jsonify(res ?? [])
});

export const getTableStructure = query(z.string().refine((v)=>schemaStore.store.has(v as Tables), { error: (iss)=>`Schema not found for table ${iss.input}` } ),
	async (table) => {
		if (!db.isConnected) return
		await db.ready.catch(()=>{ return error(500,"DB not ready") });
		const { locals } = getRequestEvent();
		db.use({ database: locals.db.database }); // WARN: this could fail but should be set at this point!
		const [res] = await db.query(surql`info for table ${table} structure`)
		return res ?? []
});

// export const getAllTables = query.batch(z.string().refine((v)=>schemaStore.store.has(v), { error: ({input})=>"Cant find schema for table: "+input }),
// 	async (tables) => {
// 		const { locals } = getRequestEvent();
// 		db.use({ database: locals.db.database }); // WARN: this could fail but should be set at this point!
//
// 		if (!db.isConnected) return
// 		await db.ready.catch(()=>{ return error(500,"DB not ready") });
// 		const queries = new Map<string, Data[]>(); // little happy cache
// 		for (const table of schemaStore.store.keys()) {
// 			if (queries.has(table)) continue;
// 			const data = await db.select<Data[]>(new Table(table)).catch(()=>{ return error(500,"cant get table") });
// 			queries.set(table, data ?? []);
// 		}
// 		return (table)=>{
// 			return queries.get(table) ?? []
// 		}
// });

export const expire = query(async () => {
	if (!db.isConnected) return
	await db.invalidate();
	goto("/",{ invalidateAll: true });
});
