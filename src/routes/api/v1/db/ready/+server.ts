import { db } from "$lib/server/root_db.svelte";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = ({ locals }) => {
    db.ready.then(() =>{
        console.log("DB is ready");
        locals.db.isConnected = true;
        return json({})
    }).catch((e)=>{ console.error(e); return error(400,"DB not ready/connected"); });
    return json({});
}
