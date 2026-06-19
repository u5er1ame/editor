import type { LayoutServerLoad } from "./$types";
import { NotAllowedError } from "surrealdb";
import { getDiagnostics } from "$lib/nodered.remote";
import { connect, connect_system, getSystemInfo } from "$lib/db.remote";
import { db, root_access } from "$lib/server/root_db.svelte";
import type { View } from "$lib/rewrite/views/base";
import { error } from "@sveltejs/kit";


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
		// const hp = await root_access.health();
		// console.log(hp);
		// await connect_system().catch((e)=>{ error(500,"cant connect to db as root level user") }); // INFO: need root level auth to get system info (viewer role from envs)
		const isConnected = await connect().catch((e)=>{ error(500,"cant connect to db") });
		const systeminfo = await getSystemInfo().catch((e)=>{ error(500,"cant get sysinfo") });
		if (isConnected) {
			if (systeminfo?.defaults != undefined) {
				await fetch("/api/v1/db/use", { method: "POST", body: JSON.stringify(systeminfo.defaults) }).catch((e)=>{ error(500,"problem with auth") });
			}
			if (locals.db.token != null) {
				const upd_token = await db.authenticate(locals.db.token).catch((e) => {
					if (e instanceof NotAllowedError ) {
						if (e.isTokenExpired) {
							console.warn("Token expired login as default user");
							fetch("/api/v1/db/signin", { method: "POST", body: JSON.stringify({ username: "user", password: "user", namespace: "main" }) }).catch((e)=>{ return error(503, "signin refresh error") });
						}
						console.error("auth error", e.kind);
					}
				})
			}
			else {
				await fetch("/api/v1/db/signin", { method: "POST", body: JSON.stringify({ username: "user", password: "user", namespace: "main" }) }).catch((e)=>{ return error(503, "signin error") });
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
