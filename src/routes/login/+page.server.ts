import { z } from "zod/v4";
import { fail, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { db } from "$lib/db";
import { page } from "$app/state";

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const token = cookies.get("sr_token");
	const url = cookies.get("sr_endpoint");
	let isAuthenticated = false;
	if (token != undefined) {
		isAuthenticated = true;
	}
	// TODO: reauth if can
	return { token, isAuthenticated };
};

const formSchema = z.object({
	url: z.url(),
	// namespace: z.string().nonempty(),
	// database: z.string().nonempty(),
	username: z.string().nonempty(),
	password: z.string().nonempty(),
})

export const actions = {
	default: async ({ cookies, request }) => {
		try {
			const form = await request.formData();
			const res = formSchema.safeParse(Object.fromEntries(form.entries()));
			if (!res.success) {
				console.log("ERR", res);
				return fail(400, z.flattenError(res.error));
			}
			const connected = await db.connect(res.data.url);
			if (!connected) {
				return fail(400, { formErrors: ["DB connection error"] });
			}
			console.log(res.data)
			await db.ready;
			const token = await db.signin({
				username: res.data.username,
				password: res.data.password
			});
			if (!token) {
				return fail(400, { formErrors: ["DB signin error"] });
			}
			cookies.set("sr_token", JSON.stringify(token), {
				httpOnly: true,
				path: "/",
			});
			cookies.set("sr_endpoint", JSON.stringify(res.data.url), {
				path: "/",
			});
		}
		catch (e) {
			console.log("ERR", e);
			return fail(400, { formErrors: [e.message], fieldErrors: {
				url: undefined,
				// namespace: undefined,
				// database: undefined,
				username: undefined,
				password: undefined,
			} });
		}
		return redirect(303,"/");
	}
} satisfies Actions;
