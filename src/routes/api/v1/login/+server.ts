import { getTokenMaxAge } from "$lib/utils";
import { json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
    const data = await request.json()
	const maxAge = getTokenMaxAge(data?.exp);

    const opts = {
        path: "/",
        httpOnly: true,
        maxAge
    };
    cookies.set("sr_token", data.value, opts);
    cookies.set("sr_user", data.user, opts);
    return json({})
};
