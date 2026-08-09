import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/root_db.svelte';
import { getTables } from '$lib/server/queries';

export const GET: RequestHandler = async () => {
    try {
        const res = await db.query(getTables).collect();
        return json({ tables: res[0] });
    } catch (e: any) {
        throw error(500, e);
    }
}
