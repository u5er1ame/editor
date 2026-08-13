import type { Actions, PageServerData, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { getDatabaseInfo } from '$lib/db.remote';

export const load: PageServerLoad = async ({
	depends,
	params,
	request,
	url,
	locals,
	fetch
}): Promise<PageServerData> => {
	depends(url.pathname);
	if (!locals.db.instance.isConnected) return error(500, 'DB not connected');
	const info = await getDatabaseInfo().catch((e) => {
		error(400, e.message);
	});
	if (!info) return error(500, 'Cant get database info. Are you connected to DB?');
	if (info.tables == undefined) {
		return error(500, 'Cant get tables. Something went wrong!');
	}

	if (!url.searchParams.has('table')) {
		if (info.tables && info.tables.length == 0) {
			return error(404, 'Cant find any table. Create one first!');
		}
		const selected_tab = info.tables[0].name;

		if (!selected_tab) {
			return error(500, 'Cant find any table. Something went wrong!');
		}
		// return redirect(302, `?table=${selected_tab}`);
		return { tables: { info, selected_tab } };
		// return { tables: { config } };
	}

	const selected_tab = url.searchParams.get('table');
	return { tables: { info, selected_tab } };
};

export const actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id');
		if (!id) return fail(400, 'Cant find id');

		console.log('FORM', form);
		return { success: true };
	}
} satisfies Actions;
