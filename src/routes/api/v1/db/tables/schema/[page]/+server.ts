import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { getInfoForTable } from '$lib/server/queries';
import { Table } from 'surrealdb';

export const GET: RequestHandler = async ({ params, fetch }) => {
	const { page } = params;

	const info = await fetch("/api/v1/db/tables").then(r => r.json()).then((r)=>r);
	const tables = info.tables.map(t => t.name)
	console.log(tables)
	if (!tables.includes(page)) throw error(404, 'Table not found');
	try {
		const res = await db.query(getInfoForTable(new Table(page))).collect();
		const data = res[0];

		if (!data) {
			throw error(404, 'Table not found');
		}

		return json([ ...data.fields ]);
	} catch (e: any) {
		throw error(500, e);
	}
};
