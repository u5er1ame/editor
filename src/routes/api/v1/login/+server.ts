import { json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
    const data = await request.json()
    const opts = {
        path: "/",
        httpOnly: true,
        expires: new Date(data.exp*1000)
    };
    cookies.set("sr_token", data.value, opts);
    cookies.set("sr_user", data.user, opts);
    return json({})
};
