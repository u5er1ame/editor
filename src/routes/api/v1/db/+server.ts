import { redirect, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
    redirect(307, "/api/v1/db/status");
}
