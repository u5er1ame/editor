import { error, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ cookies, locals, request }) => {
    if (cookies.get("sr_token") == null) {
        return error(400, { message: "no token", cause: "Cookie not found" });
    }

    cookies.delete("sr_token", { path: "/", httpOnly: true });
    cookies.delete("sr_user", { path: "/", httpOnly: true });
    locals.db.token = null;
    const referer = request.headers.get("referer");
    return redirect(303,referer ?? "/");
};
