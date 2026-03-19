
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/surreal.svelte';
import { getTables } from '$lib/server/queries';
import { Table } from 'surrealdb';

export const GET: RequestHandler = async ({ url, params }) => {
    try {
        const table = url.searchParams.get('q');
        if (table==null) {
            // INFO: i am not await here
            const res = await db.query(getTables);
            return json({ tables: res });
        }
        else {
            const res = await db.select(new Table(table));
            return json({ data: res });
        }
    } catch (e: any) {
        return json({ error: e.body.message });
    }
}
