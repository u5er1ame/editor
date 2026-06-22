import { type RequestHandler } from "@sveltejs/kit";

import { db } from "$lib/server/root_db.svelte";
import { decodeJWT } from "$lib/utils";

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
    const data = await request.json()
    let body = { message: "OK" };
    let code = 200;
    await db.signin(data).then((tokens)=>{
        cookies.set("sr_token", tokens.access, {
            httpOnly: true,
            path: "/",
        });
        const decoded = decodeJWT(tokens.access);
        locals.db = {
            ...locals.db,
            isAuth: true,
            token: tokens.access,
            username: decoded.ID,
            namespace: decoded.NS,
            database: decoded.DB,
        };
    }).catch((e)=>{ body.message = e.message; code = 400; });
    return new Response(JSON.stringify(body), { status: code });
}
