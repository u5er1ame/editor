import type { LayoutServerLoad } from "./$types";
import { NotAllowedError } from "surrealdb";
import { getDiagnostics } from "$lib/nodered.remote";
import { connect, connect_system, getSystemInfo } from "$lib/db.remote";
import { db } from "$lib/server/root_db.svelte";
import type { View } from "$lib/rewrite/views/base";


const views: View[] = [
	{
		name: "Tables",
		href: "/",
	},
	{
		name: "Graph",
		href: "/graph",
	},
	{
		name: "Map",
		href: "/map",
	},
]

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
	const nodered = await getDiagnostics();
	await connect_system();
	const isConnected = await connect();
	const systeminfo = await getSystemInfo();
	if (isConnected) {
			if (systeminfo?.defaults != undefined) {
				await fetch("/api/v1/db/use", { method: "POST", body: JSON.stringify(systeminfo.defaults) });
			}
			if (locals.db.token != null) {
				const upd_token = await db.authenticate(locals.db.token).catch((e) => {
					if (e instanceof NotAllowedError ) {
						if (e.isTokenExpired) {
							console.warn("Token expired login as default user");
							fetch("/api/v1/db/signin", { method: "POST", body: JSON.stringify({ username: "user", password: "user", namespace: "main" }) });
						}
						console.error("auth error", e.kind);
					}
				})
			}
			else {
				await fetch("/api/v1/db/signin", { method: "POST", body: JSON.stringify({ username: "user", password: "user", namespace: "main" }) });
			}
	}
	return {
		nodered: {
			diagnostics: nodered,
		},
		db: {
			isConnected,
			systeminfo,
			// INFO: filled from cookies
			token: locals.db.token,
			username: locals.db.username,
		},
		views,
	}
};
