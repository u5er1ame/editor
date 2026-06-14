import { type RequestHandler } from "@sveltejs/kit";

import { db } from "$lib/server/root_db.svelte";

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
    const data = await request.json()
    let body = { message: "OK" };
    let code = 200;
    await db.signin(data).then((tokens)=>{
        cookies.set("sr_token", tokens.access, {
            httpOnly: true,
            path: "/",
        });
        cookies.set("sr_user", data.username, {
            httpOnly: true,
            path: "/",
        });
    }).catch((e)=>{ body.message = e.message; code = 400; });
    console.log("auth",body, code);
    return new Response(JSON.stringify(body), { status: code });
}
