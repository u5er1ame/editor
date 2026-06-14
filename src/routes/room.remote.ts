import { RecordId } from "surrealdb";
import { query } from "$app/server";

import type { Board } from "$lib/server/schemas";
import { error } from "@sveltejs/kit";

// TODO: validate
export const getBoards = query<RecordId<"boards">[], Board[]>("unchecked", async (ids: RecordId<"boards">[]) => {
	// const dbReady = await isConnected();
	// if (!dbReady) error(500, "Not connected to surrealdb");
	// await surreal.ready;
	// console.log("rpc", ids);
	// const boards = ids.map(async (id) => { return await surreal.select<Prettify<Board>>(id) });
	// return (boards);
	return [];
});
