import { db } from "$lib/db";
import { fail, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getSurrealContext } from "$lib/client/db.context.svelte";

export const GET: RequestHandler = async ({ cookies, locals }) => {
    if (cookies.get("sr_token") == null) {
        return fail(400, { message: "no token" });
    }
    cookies.delete("sr_token", { path: "/", httpOnly: true });
    locals.db.token = null;
    getSurrealContext()!.invalidate();

    return redirect(303, "/");
};
