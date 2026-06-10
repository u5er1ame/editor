import type { NamespaceDatabase } from "surrealdb";
import { json, type RequestHandler } from "@sveltejs/kit";
import { env } from "$env/dynamic/private"

import { root_access, db, type SystemInfo } from "$lib/server/root_db.svelte";
type InstanceInfo = {
	isConnected: boolean,
	loadInfo?: SystemInfo
	defaults?: NamespaceDatabase
}
export const GET: RequestHandler = async () => {
  const info: InstanceInfo = {
    isConnected: await root_access.connect(env.SURREAL_URL, {
			authentication: {
				username: env.SURREAL_VIEWER_USER,
				password: env.SURREAL_VIEWER_PASS,
			}
		}).catch(() => false),
    loadInfo: undefined,
    defaults: undefined
  }

  return json({ instance_info: "disconnected" });
  // return json({ status: db.status });
};
