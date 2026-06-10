import { jsonify } from "surrealdb";
import { query } from "$app/server";
import { env } from "$env/dynamic/private";
import { db, root_access, type DatabaseInfo, type NamespaceInfo, type SystemInfo } from "$lib/server/root_db.svelte";
import { goto } from "$app/navigation";

export const connect_system = query(async () => {
	const isConnected = await root_access.connect(env.SURREAL_URL, {
		authentication: {
			username: env.SURREAL_VIEWER_USER,
			password: env.SURREAL_VIEWER_PASS,
		}
	}).catch(() => false);
	return { isConnected }
});

export const getSystemInfo = query(async () => {
	await root_access.ready.catch(()=>{});
	if (!root_access.isConnected) return
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
	await db.ready;
	if (!db.isConnected) return
	const [res] = await db.query<[NamespaceInfo]>("info for ns structure").catch((e)=>{console.error(e); return []});
	return jsonify(res ?? {});
});

export const getDatabaseInfo = query(async () => {
	await db.ready.catch(()=>{});
	if (!db.isConnected) return
	const [res] = await db.query<[DatabaseInfo]>("info for db structure").catch(()=>[]);
	return jsonify(res ?? {});
});

export const invalidate = query(async () => {
	if (!db.isConnected) return
	await db.invalidate();
	goto("/",{ invalidateAll: true });
});
