import { error, json, type RequestHandler } from "@sveltejs/kit";

import { db } from "$lib/server/root_db.svelte";
import { decodeJWT, getTokenMaxAge } from "$lib/utils";
import { NotAllowedError } from "surrealdb";
import { env } from "$env/dynamic/private";

export const POST: RequestHandler = async ({ fetch, request, cookies, locals }) => {
    const data = await request.json()
    const tokens = await db.authenticate(data).then((tokens)=>{
        const decoded = decodeJWT(tokens.access);
		const maxAge = getTokenMaxAge(decoded);
        cookies.set("sr_token", tokens.access, {
            httpOnly: true,
            path: "/",
			maxAge
        });
        locals.db = {
            ...locals.db,
            isAuth: true,
            token: tokens.access,
            username: decoded.ID,
            namespace: decoded.NS,
            database: decoded.DB,
        };
    }).catch((e)=>{
            if (e instanceof NotAllowedError ) {
                if (e.isTokenExpired) {
                    console.warn("Token expired login as default user");
                    fetch("/api/v1/db/signin", { method: "POST", body: JSON.stringify({ username: env.SURREAL_DEFAULT_USERNAME, password: env.SURREAL_DEFAULT_PASSWORD, namespace: env.SURREAL_DEFAULT_NAMESPACE }) }).catch((e)=>error(400,e))
                }
            }
            return error(400, e);
        });
    return json(tokens);
}
