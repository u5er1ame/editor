import type { PageServerData, PageServerLoad } from './$types';
import { getDatabaseInfo } from '$lib/db.remote';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ depends, url, params, request }): Promise<PageServerData> => {
	depends(url.pathname);
	const info = await getDatabaseInfo().catch((e)=>{ error(400,e.message) });
	if (!info) return error(500,"Cant get database info. Are you connected to DB?");
	if (info.tables == undefined) { return error(500,"Cant get tables. Something went wrong!"); }
	return { tables: { info } };
};
