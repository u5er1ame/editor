import type { PageServerData, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, request }): Promise<PageServerData> => {
	const table = new URL(request.url).searchParams.get('table');

	return { selected_tab: table };
};
