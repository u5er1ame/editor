import { error, fail, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ cookies, locals, request }) => {
    if (cookies.get("sr_token") == null) {
        return error(400, { message: "no token" });
    }
    cookies.delete("sr_token", { path: "/", httpOnly: true });
    locals.db.token = null;

    return redirect(303, "/");
};
