import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTables } from '$lib/server/queries';

export const GET: RequestHandler = async ({locals}) => {
    try {
        const res = await locals.db.instance.query(getTables).collect();
        return json({ tables: res[0] });
    } catch (e: any) {
        throw error(500, e);
    }
}
