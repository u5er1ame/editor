import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, params }) => {
    try {
        const table = url.searchParams.get('q');
        if (table == null) {
            // INFO: i am not await here
            // const res = await db.query(getTables);
            // return json({ tables: res });
            return json({ tables: [] });
        }
        else {
            // const res = await db.select(new Table(table));
            // return json({ data: res });
            return json({ data: [] });
        }
    } catch (e: any) {
        return json({ error: e.body.message });
    }
}
export const POST: RequestHandler = async ({ url, params, request }) => {
    try {
        const table = url.searchParams.get('q');
        if (table == null) {
            return error(400, { message: "no table specified" });
        }
        const data = await request.body?.getReader().read().then(r => JSON.parse(r.value?.toString() ?? ""));
        if (data == null) {
            return error(400, { message: "empty body" });
        }
        // const res = await db.update(table, data);
        // return json({ data: res });
        return json({ data: [] });
    } catch (e: any) {
        return error(400, { message: "invalid data" });
        return json({ error: e.body.message });
    }
}

export const PUT: RequestHandler = async ({ url, params, request }) => {
    try {
        const table = url.searchParams.get('q');
        if (table == null) {
            return error(400, { message: "no table specified" });
        }
        const data = await request.body?.getReader().read().then(r => JSON.parse(r.value?.toString() ?? ""));
        if (data == null) {
            return error(400, { message: "empty body" });
        }
        // const res = await db.insert(table, data);
        // return json({ data: res });
        return json({ data: [] });
    } catch (e: any) {
        return error(400, { message: "invalid data" });
        return json({ error: e.body.message });
    }
}
