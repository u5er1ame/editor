import { fail, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ cookies, locals }) => {
    if (cookies.get("sr_token") == null) {
        return fail(400, { message: "no token" });
    }
    cookies.delete("sr_token", { path: "/", httpOnly: true });
    locals.db.token = null;

    return redirect(303, "/");
};
