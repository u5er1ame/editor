import type { PageServerData, PageServerLoad } from './$types';
import type { ViewConfig } from '$lib/rewrite/views/base';
import { getDatabaseInfo } from '$lib/db.remote';
import { error, redirect } from '@sveltejs/kit';


const config: ViewConfig<"/"> = {

}

export const load: PageServerLoad = async ({ params, request, url }): Promise<PageServerData> => {
	let config = undefined;
	const tables = await getDatabaseInfo();
	if (!tables) return error(500,"Cant get database info. Are you connected to DB?");
	if (!url.searchParams.has('table')) {
		if (tables?.tables.length == 0) {
			return error(404,"Cant find any table. Create one first!");
		}
		const selected_tab = tables?.tables[0]?.name;
		if (!selected_tab) {
			return error(500,"Cant find any table. Something went wrong!");
		}
		return redirect(307, `/?table=${selected_tab}`);
	}
	const selected_tab = url.searchParams.get('table');
	return { tables: { selected_tab, info: tables?.tables, config } };
};
